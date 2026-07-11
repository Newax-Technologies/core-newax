import type { OrganizationRepository } from '../database/organization-repository';
import type { OrganizationEventPublisher } from '../events/organization-event';
import { OrganizationModuleError } from '../errors/organization-module-error';
import {
  ORGANIZATION_PERMISSIONS,
  type OrganizationPermission,
} from '../permissions/organization-permissions';
import type {
  CreateOrganizationInput,
  OrganizationListQuery,
  OrganizationPage,
  OrganizationRecord,
  OrganizationRequestContext,
  UpdateOrganizationInput,
  UpdateOrganizationRecordInput,
} from '../types/organization';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export class OrganizationsService {
  constructor(
    private readonly repository: OrganizationRepository,
    private readonly eventPublisher: OrganizationEventPublisher,
  ) {}

  async create(
    context: OrganizationRequestContext,
    input: CreateOrganizationInput,
  ): Promise<OrganizationRecord> {
    this.requirePermission(context, ORGANIZATION_PERMISSIONS.create);

    const parentOrganizationId = input.parentOrganizationId ?? null;
    await this.validateParent(parentOrganizationId);

    const organization = await this.repository.create({
      parentOrganizationId,
      legalName: this.requireText(input.legalName, 'legalName'),
      displayName: this.requireText(input.displayName, 'displayName'),
      organizationType: this.requireText(input.organizationType, 'organizationType'),
      registrationNumber: this.normalizeNullableText(input.registrationNumber),
      taxNumber: this.normalizeNullableText(input.taxNumber),
    });

    await this.eventPublisher.publish({
      name: 'organization.created',
      actorUserId: context.actorUserId,
      organizationId: organization.id,
      occurredAt: new Date(),
      organization,
    });

    return organization;
  }

  async getById(
    context: OrganizationRequestContext,
    organizationId: string,
  ): Promise<OrganizationRecord> {
    this.requirePermission(context, ORGANIZATION_PERMISSIONS.view);
    return this.requireOrganization(organizationId);
  }

  async list(
    context: OrganizationRequestContext,
    query: OrganizationListQuery = {},
  ): Promise<OrganizationPage> {
    this.requirePermission(context, ORGANIZATION_PERMISSIONS.view);

    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new OrganizationModuleError(
        'ORGANIZATION_INVALID_INPUT',
        `limit must be an integer between 1 and ${String(MAX_PAGE_SIZE)}.`,
        { field: 'limit' },
      );
    }

    const normalizedQuery: {
      parentOrganizationId?: string | null;
      status?: OrganizationListQuery['status'];
      search?: string;
      limit: number;
      afterId?: string;
    } = { limit };

    if ('parentOrganizationId' in query) {
      normalizedQuery.parentOrganizationId = query.parentOrganizationId ?? null;
    }

    if (query.status !== undefined) {
      normalizedQuery.status = query.status;
    }

    if (query.search !== undefined) {
      const search = query.search.trim();
      if (search.length > 0) {
        normalizedQuery.search = search;
      }
    }

    if (query.afterId !== undefined) {
      normalizedQuery.afterId = this.requireText(query.afterId, 'afterId');
    }

    return this.repository.list(normalizedQuery);
  }

  async update(
    context: OrganizationRequestContext,
    organizationId: string,
    input: UpdateOrganizationInput,
  ): Promise<OrganizationRecord> {
    this.requirePermission(context, ORGANIZATION_PERMISSIONS.update);
    const current = await this.requireOrganization(organizationId);

    if (current.status === 'archived') {
      throw new OrganizationModuleError(
        'ORGANIZATION_INVALID_INPUT',
        'Archived organizations cannot be updated.',
        { organizationId },
      );
    }

    const update: {
      parentOrganizationId?: string | null;
      legalName?: string;
      displayName?: string;
      organizationType?: string;
      registrationNumber?: string | null;
      taxNumber?: string | null;
    } = {};

    if ('parentOrganizationId' in input) {
      const parentOrganizationId = input.parentOrganizationId ?? null;

      if (parentOrganizationId === organizationId) {
        throw new OrganizationModuleError(
          'ORGANIZATION_HIERARCHY_CYCLE',
          'An organization cannot be its own parent.',
          { organizationId, parentOrganizationId },
        );
      }

      await this.validateParent(parentOrganizationId);

      if (
        parentOrganizationId !== null &&
        (await this.repository.wouldCreateCycle(organizationId, parentOrganizationId))
      ) {
        throw new OrganizationModuleError(
          'ORGANIZATION_HIERARCHY_CYCLE',
          'The selected parent would create an organization hierarchy cycle.',
          { organizationId, parentOrganizationId },
        );
      }

      update.parentOrganizationId = parentOrganizationId;
    }

    if (input.legalName !== undefined) {
      update.legalName = this.requireText(input.legalName, 'legalName');
    }

    if (input.displayName !== undefined) {
      update.displayName = this.requireText(input.displayName, 'displayName');
    }

    if (input.organizationType !== undefined) {
      update.organizationType = this.requireText(input.organizationType, 'organizationType');
    }

    if ('registrationNumber' in input) {
      update.registrationNumber = this.normalizeNullableText(input.registrationNumber);
    }

    if ('taxNumber' in input) {
      update.taxNumber = this.normalizeNullableText(input.taxNumber);
    }

    if (Object.keys(update).length === 0) {
      throw new OrganizationModuleError(
        'ORGANIZATION_INVALID_INPUT',
        'At least one organization field must be supplied for update.',
      );
    }

    const organization = await this.repository.update(
      organizationId,
      update as UpdateOrganizationRecordInput,
    );

    await this.eventPublisher.publish({
      name: 'organization.updated',
      actorUserId: context.actorUserId,
      organizationId: organization.id,
      occurredAt: new Date(),
      organization,
    });

    return organization;
  }

  async archive(
    context: OrganizationRequestContext,
    organizationId: string,
  ): Promise<OrganizationRecord> {
    this.requirePermission(context, ORGANIZATION_PERMISSIONS.archive);
    const current = await this.requireOrganization(organizationId);

    if (current.status === 'archived') {
      return current;
    }

    if (await this.repository.hasActiveChildren(organizationId)) {
      throw new OrganizationModuleError(
        'ORGANIZATION_HAS_ACTIVE_CHILDREN',
        'An organization with active child organizations cannot be archived.',
        { organizationId },
      );
    }

    const organization = await this.repository.archive(organizationId, new Date());

    await this.eventPublisher.publish({
      name: 'organization.archived',
      actorUserId: context.actorUserId,
      organizationId: organization.id,
      occurredAt: new Date(),
      organization,
    });

    return organization;
  }

  private requirePermission(
    context: OrganizationRequestContext,
    permission: OrganizationPermission,
  ): void {
    if (context.actorUserId.trim().length === 0) {
      throw new OrganizationModuleError(
        'ORGANIZATION_INVALID_INPUT',
        'actorUserId is required for organization operations.',
      );
    }

    if (!context.permissionCodes.has(permission)) {
      throw new OrganizationModuleError(
        'ORGANIZATION_FORBIDDEN',
        `The operation requires the ${permission} permission.`,
        { permission },
      );
    }
  }

  private async requireOrganization(organizationId: string): Promise<OrganizationRecord> {
    const id = this.requireText(organizationId, 'organizationId');
    const organization = await this.repository.findById(id);

    if (organization === null) {
      throw new OrganizationModuleError(
        'ORGANIZATION_NOT_FOUND',
        'The organization does not exist.',
        { organizationId: id },
      );
    }

    return organization;
  }

  private async validateParent(parentOrganizationId: string | null): Promise<void> {
    if (parentOrganizationId === null) {
      return;
    }

    const parent = await this.repository.findById(
      this.requireText(parentOrganizationId, 'parentOrganizationId'),
    );

    if (parent === null) {
      throw new OrganizationModuleError(
        'ORGANIZATION_PARENT_NOT_FOUND',
        'The parent organization does not exist.',
        { parentOrganizationId },
      );
    }

    if (parent.status === 'archived') {
      throw new OrganizationModuleError(
        'ORGANIZATION_PARENT_ARCHIVED',
        'An archived organization cannot be selected as a parent.',
        { parentOrganizationId },
      );
    }
  }

  private requireText(value: string, field: string): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new OrganizationModuleError(
        'ORGANIZATION_INVALID_INPUT',
        `${field} must not be empty.`,
        { field },
      );
    }

    return normalized;
  }

  private normalizeNullableText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }
}

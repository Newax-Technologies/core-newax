import type { MembershipsRepository } from '../database/memberships-repository';
import type { MembershipEventPublisher } from '../events/membership-event';
import { MembershipModuleError } from '../errors/membership-module-error';
import {
  MEMBERSHIP_PERMISSIONS,
  type MembershipPermission,
} from '../permissions/membership-permissions';
import type {
  CreateMembershipInput,
  MembershipListQuery,
  MembershipPage,
  MembershipRecord,
  MembershipRequestContext,
  MembershipStatus,
  MutableMembershipStatus,
  UpdateMembershipInput,
  UpdateMembershipRecordInput,
} from '../types/membership';
import type { MembershipReferenceDirectory } from './membership-reference-directory';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_MEMBERSHIP_TYPE_LENGTH = 64;
const MAX_REFERENCE_NUMBER_LENGTH = 128;
const MAX_JOB_TITLE_LENGTH = 128;

type Mutable<T> = {
  -readonly [Key in keyof T]: T[Key];
};

export class MembershipsService {
  constructor(
    private readonly repository: MembershipsRepository,
    private readonly referenceDirectory: MembershipReferenceDirectory,
    private readonly eventPublisher: MembershipEventPublisher,
  ) {}

  async create(
    context: MembershipRequestContext,
    input: CreateMembershipInput,
  ): Promise<MembershipRecord> {
    const organizationId = this.requireContext(context, MEMBERSHIP_PERMISSIONS.create);
    await this.requireActiveOrganization(organizationId);

    const personId = this.requireText(input.personId, 'personId', 128);
    await this.requireActivePerson(personId);

    const result = await this.repository.create({
      personId,
      organizationId,
      membershipType: this.normalizeMembershipType(input.membershipType),
      referenceNumber: this.normalizeNullableText(
        input.referenceNumber,
        'referenceNumber',
        MAX_REFERENCE_NUMBER_LENGTH,
      ),
      jobTitle: this.normalizeNullableText(input.jobTitle, 'jobTitle', MAX_JOB_TITLE_LENGTH),
      startDate: this.normalizeStartDate(input.startDate),
    });

    if (result.status === 'conflict') {
      throw new MembershipModuleError(
        'MEMBERSHIP_CONFLICT',
        'An active or suspended membership of this type already exists for the person in this organization.',
        {
          personId,
          organizationId,
          existingMembershipId: result.existingMembershipId,
        },
      );
    }

    await this.publish('membership.created', context.actorUserId, result.membership);
    return result.membership;
  }

  async getById(
    context: MembershipRequestContext,
    membershipId: string,
  ): Promise<MembershipRecord> {
    const organizationId = this.requireContext(context, MEMBERSHIP_PERMISSIONS.view);
    return this.requireScopedMembership(membershipId, organizationId);
  }

  async list(
    context: MembershipRequestContext,
    query: MembershipListQuery = {},
  ): Promise<MembershipPage> {
    const organizationId = this.requireContext(context, MEMBERSHIP_PERMISSIONS.view);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        `limit must be an integer between 1 and ${String(MAX_PAGE_SIZE)}.`,
        { field: 'limit' },
      );
    }

    const normalized: Mutable<MembershipListQuery> = { limit };

    if (query.personId !== undefined) {
      normalized.personId = this.requireText(query.personId, 'personId', 128);
    }

    if (query.membershipType !== undefined) {
      normalized.membershipType = this.normalizeMembershipType(query.membershipType);
    }

    if (query.status !== undefined) {
      normalized.status = this.normalizeStatus(query.status);
    }

    if (query.search !== undefined) {
      const search = query.search.trim();
      if (search.length > 0) {
        normalized.search = this.requireText(search, 'search', 255);
      }
    }

    if (query.afterId !== undefined) {
      normalized.afterId = this.requireText(query.afterId, 'afterId', 128);
    }

    return this.repository.list(organizationId, normalized);
  }

  async update(
    context: MembershipRequestContext,
    membershipId: string,
    input: UpdateMembershipInput,
  ): Promise<MembershipRecord> {
    const organizationId = this.requireContext(context, MEMBERSHIP_PERMISSIONS.update);
    await this.requireActiveOrganization(organizationId);
    const current = await this.requireScopedMembership(membershipId, organizationId);

    if (current.status === 'ended') {
      throw new MembershipModuleError(
        'MEMBERSHIP_ENDED',
        'Ended memberships cannot be updated.',
        { membershipId: current.id },
      );
    }

    const update: Mutable<UpdateMembershipRecordInput> = {};

    if ('referenceNumber' in input) {
      update.referenceNumber = this.normalizeNullableText(
        input.referenceNumber,
        'referenceNumber',
        MAX_REFERENCE_NUMBER_LENGTH,
      );
    }

    if ('jobTitle' in input) {
      update.jobTitle = this.normalizeNullableText(
        input.jobTitle,
        'jobTitle',
        MAX_JOB_TITLE_LENGTH,
      );
    }

    if ('startDate' in input) {
      update.startDate = this.normalizeStartDate(input.startDate);
    }

    if (input.status !== undefined) {
      update.status = this.normalizeMutableStatus(input.status);
    }

    if (Object.keys(update).length === 0) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        'At least one membership field must be supplied for update.',
      );
    }

    const membership = await this.repository.update(current.id, update);
    await this.publish('membership.updated', context.actorUserId, membership);
    return membership;
  }

  async remove(
    context: MembershipRequestContext,
    membershipId: string,
  ): Promise<MembershipRecord> {
    const organizationId = this.requireContext(context, MEMBERSHIP_PERMISSIONS.remove);
    await this.requireActiveOrganization(organizationId);
    const current = await this.requireScopedMembership(membershipId, organizationId);

    if (current.status === 'ended') {
      return current;
    }

    const membership = await this.repository.remove(current.id, this.todayDateOnly());
    await this.publish('membership.removed', context.actorUserId, membership);
    return membership;
  }

  private requireContext(
    context: MembershipRequestContext,
    permission: MembershipPermission,
  ): string {
    if (context.actorUserId.trim().length === 0) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        'actorUserId is required for membership operations.',
      );
    }

    const organizationId = this.requireText(context.organizationId, 'organizationId', 128);

    if (!context.permissionCodes.has(permission)) {
      throw new MembershipModuleError(
        'MEMBERSHIP_FORBIDDEN',
        `The operation requires the ${permission} permission.`,
        { permission, organizationId },
      );
    }

    return organizationId;
  }

  private async requireScopedMembership(
    membershipId: string,
    organizationId: string,
  ): Promise<MembershipRecord> {
    const id = this.requireText(membershipId, 'membershipId', 128);
    const membership = await this.repository.findById(id);

    if (membership === null || membership.organizationId !== organizationId) {
      throw new MembershipModuleError(
        'MEMBERSHIP_NOT_FOUND',
        'The membership does not exist in the selected organization.',
        { membershipId: id, organizationId },
      );
    }

    return membership;
  }

  private async requireActivePerson(personId: string): Promise<void> {
    const person = await this.referenceDirectory.findPersonById(personId);

    if (person === null) {
      throw new MembershipModuleError(
        'MEMBERSHIP_PERSON_NOT_FOUND',
        'The person does not exist.',
        { personId },
      );
    }

    if (person.status !== 'active') {
      throw new MembershipModuleError(
        'MEMBERSHIP_PERSON_UNAVAILABLE',
        'Only active people may receive new memberships.',
        { personId, status: person.status },
      );
    }
  }

  private async requireActiveOrganization(organizationId: string): Promise<void> {
    const organization = await this.referenceDirectory.findOrganizationById(organizationId);

    if (organization === null) {
      throw new MembershipModuleError(
        'MEMBERSHIP_ORGANIZATION_NOT_FOUND',
        'The selected organization does not exist.',
        { organizationId },
      );
    }

    if (organization.status !== 'active') {
      throw new MembershipModuleError(
        'MEMBERSHIP_ORGANIZATION_UNAVAILABLE',
        'Membership changes require an active organization.',
        { organizationId, status: organization.status },
      );
    }
  }

  private async publish(
    name: 'membership.created' | 'membership.updated' | 'membership.removed',
    actorUserId: string,
    membership: MembershipRecord,
  ): Promise<void> {
    await this.eventPublisher.publish({
      name,
      actorUserId,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      personId: membership.personId,
      occurredAt: new Date(),
      membership,
    });
  }

  private normalizeMembershipType(value: string): string {
    const normalized = this.requireText(
      value,
      'membershipType',
      MAX_MEMBERSHIP_TYPE_LENGTH,
    )
      .toLowerCase()
      .replace(/\s+/g, '_');

    if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        'membershipType may contain only lowercase letters, numbers, dots, underscores, and hyphens.',
        { field: 'membershipType' },
      );
    }

    return normalized;
  }

  private normalizeStatus(value: MembershipStatus): MembershipStatus {
    if (value === 'active' || value === 'suspended' || value === 'ended') {
      return value;
    }

    throw new MembershipModuleError(
      'MEMBERSHIP_INVALID_INPUT',
      'status must be active, suspended, or ended.',
      { field: 'status' },
    );
  }

  private normalizeMutableStatus(value: MutableMembershipStatus): MutableMembershipStatus {
    if (value === 'active' || value === 'suspended') {
      return value;
    }

    throw new MembershipModuleError(
      'MEMBERSHIP_INVALID_INPUT',
      'Membership updates may set status only to active or suspended. Use remove to end a membership.',
      { field: 'status' },
    );
  }

  private normalizeStartDate(value: Date | null | undefined): Date {
    const date = value === null || value === undefined ? this.todayDateOnly() : this.dateOnly(value);

    if (date.getTime() > this.todayDateOnly().getTime()) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        'startDate cannot be in the future.',
        { field: 'startDate' },
      );
    }

    return date;
  }

  private dateOnly(value: Date): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        'The supplied date must be valid.',
      );
    }

    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  private todayDateOnly(): Date {
    return this.dateOnly(new Date());
  }

  private requireText(value: string, field: string, maxLength: number): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        `${field} must not be empty.`,
        { field },
      );
    }

    if (normalized.length > maxLength) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        `${field} must not exceed ${String(maxLength)} characters.`,
        { field, maxLength },
      );
    }

    return normalized;
  }

  private normalizeNullableText(
    value: string | null | undefined,
    field: string,
    maxLength: number,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    if (normalized.length > maxLength) {
      throw new MembershipModuleError(
        'MEMBERSHIP_INVALID_INPUT',
        `${field} must not exceed ${String(maxLength)} characters.`,
        { field, maxLength },
      );
    }

    return normalized;
  }
}

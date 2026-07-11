import type { UsersRepository } from '../database/users-repository';
import type { UserEventPublisher } from '../events/user-event';
import { UserModuleError } from '../errors/user-module-error';
import {
  USER_PERMISSIONS,
  type UserPermission,
} from '../permissions/user-permissions';
import type {
  AddUserIdentityInput,
  CreateUserInput,
  UserIdentityRecord,
  UserListQuery,
  UserPage,
  UserRecord,
  UserRequestContext,
  UserStatus,
} from '../types/user';
import { UserIdentityNormalizer } from './user-identity-normalizer';
import type { UserReferenceDirectory } from './user-reference-directory';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly referenceDirectory: UserReferenceDirectory,
    private readonly identityNormalizer: UserIdentityNormalizer,
    private readonly eventPublisher: UserEventPublisher,
  ) {}

  async create(
    context: UserRequestContext,
    input: CreateUserInput,
  ): Promise<UserRecord> {
    this.requirePermission(context, USER_PERMISSIONS.create);
    const organizationId = await this.requireActiveOrganization(context);
    const personId = this.requireText(input.personId, 'personId', 128);
    await this.requireActivePerson(personId);
    await this.requireActiveMembership(personId, organizationId);

    const identity = this.identityNormalizer.normalize(
      input.primaryIdentity.identityType,
      input.primaryIdentity.identityValue,
    );
    const result = await this.repository.create({
      personId,
      identityType: identity.identityType,
      identityValue: identity.identityValue,
      normalizedValue: identity.normalizedValue,
    });

    if (result.status === 'person_conflict') {
      throw new UserModuleError(
        'USER_ACCOUNT_CONFLICT',
        'This person already has a user account.',
        { existingUserId: result.existingUserId },
      );
    }
    if (result.status === 'identity_conflict') {
      throw new UserModuleError(
        'USER_IDENTITY_CONFLICT',
        'This login identity is already assigned.',
      );
    }

    await this.eventPublisher.publish({
      name: 'user.created',
      actorUserId: context.actorUserId,
      organizationId,
      occurredAt: new Date(),
      user: result.user,
      identityId: result.identity.id,
      identityType: result.identity.identityType,
    });
    return result.user;
  }

  async getById(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    this.requirePermission(context, USER_PERMISSIONS.view);
    return this.requireVisibleUser(context, userId);
  }

  async list(
    context: UserRequestContext,
    query: UserListQuery = {},
  ): Promise<UserPage> {
    this.requirePermission(context, USER_PERMISSIONS.view);
    const organizationId = this.requireOrganizationId(context);
    const normalized: Mutable<UserListQuery> = {
      limit: this.normalizeLimit(query.limit),
    };

    if (query.status !== undefined) {
      normalized.status = query.status;
    }
    if (query.search !== undefined && query.search.trim().length > 0) {
      normalized.search = this.requireText(query.search, 'search', 255);
    }
    if (query.afterId !== undefined) {
      normalized.afterId = this.requireText(query.afterId, 'afterId', 128);
    }

    return this.repository.list(organizationId, normalized);
  }

  async suspend(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    return this.changePlatformStatus(
      context,
      userId,
      USER_PERMISSIONS.suspend,
      'suspended',
      'user.suspended',
    );
  }

  async disable(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    return this.changePlatformStatus(
      context,
      userId,
      USER_PERMISSIONS.disable,
      'disabled',
      'user.disabled',
    );
  }

  async enable(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.enable);
    const user = await this.requireUser(userId);

    if (user.status === 'archived') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Archived user accounts cannot be enabled.',
      );
    }
    if (user.status === 'invited' || user.status === 'active') {
      return user;
    }

    const updated = await this.repository.setStatus(user.id, 'active');
    await this.publishStatusEvent('user.enabled', context.actorUserId, updated);
    return updated;
  }

  async archive(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.archive);
    const user = await this.requireUser(userId);
    if (user.status === 'archived') {
      return user;
    }

    const updated = await this.repository.setStatus(user.id, 'archived');
    await this.publishStatusEvent('user.archived', context.actorUserId, updated);
    return updated;
  }

  async listIdentities(
    context: UserRequestContext,
    userId: string,
  ): Promise<readonly UserIdentityRecord[]> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.identitiesView);
    const user = await this.requireUser(userId);
    return this.repository.listIdentities(user.id);
  }

  async addIdentity(
    context: UserRequestContext,
    userId: string,
    input: AddUserIdentityInput,
  ): Promise<UserIdentityRecord> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.identitiesManage);
    const user = await this.requireMutableUser(userId);
    const identity = this.identityNormalizer.normalize(
      input.identityType,
      input.identityValue,
    );
    const result = await this.repository.addIdentity({
      userId: user.id,
      identityType: identity.identityType,
      identityValue: identity.identityValue,
      normalizedValue: identity.normalizedValue,
      makePrimary: input.makePrimary ?? false,
    });

    if (result.status === 'identity_conflict') {
      throw new UserModuleError(
        'USER_IDENTITY_CONFLICT',
        'This login identity is already assigned.',
      );
    }

    await this.eventPublisher.publish({
      name: 'user.identity_added',
      actorUserId: context.actorUserId,
      organizationId: null,
      occurredAt: new Date(),
      userId: user.id,
      identityId: result.identity.id,
      identityType: result.identity.identityType,
    });
    return result.identity;
  }

  async setPrimaryIdentity(
    context: UserRequestContext,
    userId: string,
    identityId: string,
  ): Promise<UserIdentityRecord> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.identitiesManage);
    const user = await this.requireMutableUser(userId);
    const identity = await this.repository.setPrimaryIdentity(
      user.id,
      this.requireText(identityId, 'identityId', 128),
    );
    if (identity === null) {
      throw new UserModuleError(
        'USER_IDENTITY_NOT_FOUND',
        'The login identity does not belong to this user.',
      );
    }

    await this.eventPublisher.publish({
      name: 'user.primary_identity_changed',
      actorUserId: context.actorUserId,
      organizationId: null,
      occurredAt: new Date(),
      userId: user.id,
      identityId: identity.id,
      identityType: identity.identityType,
    });
    return identity;
  }

  async removeIdentity(
    context: UserRequestContext,
    userId: string,
    identityId: string,
  ): Promise<void> {
    this.requirePlatformPermission(context, USER_PERMISSIONS.identitiesManage);
    const user = await this.requireMutableUser(userId);
    const normalizedIdentityId = this.requireText(
      identityId,
      'identityId',
      128,
    );
    const result = await this.repository.removeIdentity(
      user.id,
      normalizedIdentityId,
    );

    if (result.status === 'not_found') {
      throw new UserModuleError(
        'USER_IDENTITY_NOT_FOUND',
        'The login identity does not belong to this user.',
      );
    }
    if (result.status === 'last_identity') {
      throw new UserModuleError(
        'USER_IDENTITY_LAST_REMAINING',
        'The final login identity cannot be removed.',
      );
    }

    await this.eventPublisher.publish({
      name: 'user.identity_removed',
      actorUserId: context.actorUserId,
      organizationId: null,
      occurredAt: new Date(),
      userId: user.id,
      identityId: result.removedIdentityId,
    });

    if (result.newPrimaryIdentityId !== null) {
      await this.eventPublisher.publish({
        name: 'user.primary_identity_changed',
        actorUserId: context.actorUserId,
        organizationId: null,
        occurredAt: new Date(),
        userId: user.id,
        identityId: result.newPrimaryIdentityId,
      });
    }
  }

  private async changePlatformStatus(
    context: UserRequestContext,
    userId: string,
    permission: UserPermission,
    targetStatus: 'suspended' | 'disabled',
    eventName: 'user.suspended' | 'user.disabled',
  ): Promise<UserRecord> {
    this.requirePlatformPermission(context, permission);
    const user = await this.requireUser(userId);
    if (user.status === 'archived') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Archived user accounts cannot change status.',
      );
    }
    if (user.status === targetStatus) {
      return user;
    }

    const updated = await this.repository.setStatus(user.id, targetStatus);
    await this.publishStatusEvent(eventName, context.actorUserId, updated);
    return updated;
  }

  private async requireVisibleUser(
    context: UserRequestContext,
    userId: string,
  ): Promise<UserRecord> {
    const organizationId = this.requireOrganizationId(context);
    const user = await this.requireUser(userId);
    const membership = await this.referenceDirectory.findMembership(
      user.personId,
      organizationId,
    );
    if (
      membership === null ||
      (membership.status !== 'active' && membership.status !== 'suspended')
    ) {
      throw new UserModuleError(
        'USER_ACCOUNT_NOT_FOUND',
        'The user account does not exist in this organization context.',
      );
    }
    return user;
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.repository.findById(
      this.requireText(userId, 'userId', 128),
    );
    if (user === null) {
      throw new UserModuleError(
        'USER_ACCOUNT_NOT_FOUND',
        'The user account does not exist.',
      );
    }
    return user;
  }

  private async requireMutableUser(userId: string): Promise<UserRecord> {
    const user = await this.requireUser(userId);
    if (user.status === 'archived') {
      throw new UserModuleError(
        'USER_ACCOUNT_UNAVAILABLE',
        'Archived user accounts cannot be changed.',
      );
    }
    return user;
  }

  private async requireActiveOrganization(
    context: UserRequestContext,
  ): Promise<string> {
    const organizationId = this.requireOrganizationId(context);
    const organization = await this.referenceDirectory.findOrganizationById(
      organizationId,
    );
    if (organization === null) {
      throw new UserModuleError(
        'USER_ORGANIZATION_NOT_FOUND',
        'The organization does not exist.',
      );
    }
    if (organization.status !== 'active') {
      throw new UserModuleError(
        'USER_ORGANIZATION_UNAVAILABLE',
        'User creation requires an active organization.',
        { status: organization.status },
      );
    }
    return organizationId;
  }

  private async requireActivePerson(personId: string): Promise<void> {
    const person = await this.referenceDirectory.findPersonById(personId);
    if (person === null) {
      throw new UserModuleError(
        'USER_PERSON_NOT_FOUND',
        'The person does not exist.',
      );
    }
    if (person.status !== 'active') {
      throw new UserModuleError(
        'USER_PERSON_UNAVAILABLE',
        'Only active people may receive user accounts.',
        { status: person.status },
      );
    }
  }

  private async requireActiveMembership(
    personId: string,
    organizationId: string,
  ): Promise<void> {
    const membership = await this.referenceDirectory.findMembership(
      personId,
      organizationId,
    );
    if (membership === null) {
      throw new UserModuleError(
        'USER_MEMBERSHIP_NOT_FOUND',
        'An organization membership is required before user creation.',
      );
    }
    if (membership.status !== 'active') {
      throw new UserModuleError(
        'USER_MEMBERSHIP_UNAVAILABLE',
        'Only active memberships may receive user access.',
        { status: membership.status },
      );
    }
  }

  private requirePermission(
    context: UserRequestContext,
    permission: UserPermission,
  ): void {
    if (context.actorUserId.trim().length === 0) {
      throw new UserModuleError(
        'USER_INVALID_INPUT',
        'actorUserId is required.',
      );
    }
    if (!context.permissionCodes.has(permission)) {
      throw new UserModuleError(
        'USER_FORBIDDEN',
        `The operation requires ${permission}.`,
        { permission },
      );
    }
  }

  private requirePlatformPermission(
    context: UserRequestContext,
    permission: UserPermission,
  ): void {
    this.requirePermission(context, permission);
    if (context.organizationId !== null) {
      throw new UserModuleError(
        'USER_PLATFORM_CONTEXT_REQUIRED',
        'This account-wide operation requires platform context.',
      );
    }
  }

  private requireOrganizationId(context: UserRequestContext): string {
    if (context.organizationId === null) {
      throw new UserModuleError(
        'USER_INVALID_INPUT',
        'organizationId is required.',
      );
    }
    return this.requireText(context.organizationId, 'organizationId', 128);
  }

  private async publishStatusEvent(
    name: 'user.suspended' | 'user.disabled' | 'user.enabled' | 'user.archived',
    actorUserId: string,
    user: UserRecord,
  ): Promise<void> {
    await this.eventPublisher.publish({
      name,
      actorUserId,
      organizationId: null,
      occurredAt: new Date(),
      user,
    });
  }

  private normalizeLimit(value: number | undefined): number {
    const limit = value ?? DEFAULT_PAGE_SIZE;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new UserModuleError(
        'USER_INVALID_INPUT',
        `limit must be an integer between 1 and ${String(MAX_PAGE_SIZE)}.`,
      );
    }
    return limit;
  }

  private requireText(
    value: string,
    field: string,
    maxLength: number,
  ): string {
    const normalized = value.trim();
    if (normalized.length === 0 || normalized.length > maxLength) {
      throw new UserModuleError(
        'USER_INVALID_INPUT',
        `${field} must contain between 1 and ${String(maxLength)} characters.`,
        { field },
      );
    }
    return normalized;
  }
}

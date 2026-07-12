export type TrustedContextScope = 'account' | 'organization';
export type TrustedMembershipStatus = 'active' | 'suspended' | 'ended';
export type TrustedOrganizationStatus = 'active' | 'suspended' | 'archived';

export interface TrustedSessionRecord {
  readonly userId: string;
  readonly personId: string;
  readonly sessionId: string;
  readonly expiresAt: Date;
}

export interface TrustedMembershipRecord {
  readonly id: string;
  readonly personId: string;
  readonly organizationId: string;
  readonly membershipStatus: TrustedMembershipStatus;
  readonly organizationStatus: TrustedOrganizationStatus;
}

export interface TrustedPermissionEvaluation {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly evaluatedAt: Date;
  readonly effectivePermissionCodes: readonly string[];
}

export interface ResolveAccountContextInput {
  readonly sessionToken: string;
  readonly requestId?: string;
}

export interface ResolveOrganizationContextInput extends ResolveAccountContextInput {
  readonly membershipId: string;
}

export interface TrustedAccountRequestContext {
  readonly scope: 'account';
  readonly requestId: string;
  readonly userId: string;
  readonly personId: string;
  readonly sessionId: string;
  readonly sessionExpiresAt: Date;
}

export interface TrustedOrganizationRequestContext {
  readonly scope: 'organization';
  readonly requestId: string;
  readonly userId: string;
  readonly personId: string;
  readonly sessionId: string;
  readonly sessionExpiresAt: Date;
  readonly membershipId: string;
  readonly organizationId: string;
  readonly permissionCodes: ReadonlySet<string>;
  readonly evaluatedAt: Date;
}

export type TrustedRequestContext =
  TrustedAccountRequestContext | TrustedOrganizationRequestContext;

export interface ModuleRequestContext {
  readonly actorUserId: string;
  readonly organizationId: string;
  readonly permissionCodes: ReadonlySet<string>;
}

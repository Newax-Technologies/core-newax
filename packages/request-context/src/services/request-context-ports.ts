import type {
  AccountMembershipDirectoryPage,
  OrganizationContextConfirmationRecord,
  TrustedMembershipRecord,
  TrustedPermissionEvaluation,
  TrustedSessionRecord,
} from '../types/request-context';

export interface TrustedSessionValidator {
  validateSession(sessionToken: string): Promise<TrustedSessionRecord | null>;
}

export interface TrustedMembershipDirectory {
  findMembershipById(membershipId: string): Promise<TrustedMembershipRecord | null>;
}

export interface AccountMembershipDirectory {
  listAvailableMemberships(
    personId: string,
    offset: number,
    limit: number,
  ): Promise<AccountMembershipDirectoryPage>;
}

export interface OrganizationContextConfirmationDirectory {
  findConfirmationRecord(
    membershipId: string,
  ): Promise<OrganizationContextConfirmationRecord | null>;
}

export interface TrustedPermissionEvaluator {
  evaluate(membershipId: string, evaluatedAt: Date): Promise<TrustedPermissionEvaluation>;
}

export interface TrustedContextClock {
  now(): Date;
}

export interface RequestIdFactory {
  issue(): string;
}

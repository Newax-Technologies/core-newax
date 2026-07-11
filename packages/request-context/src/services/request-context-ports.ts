import type {
  TrustedMembershipRecord,
  TrustedPermissionEvaluation,
  TrustedSessionRecord,
} from '../types/request-context';

export interface TrustedSessionValidator {
  validateSession(sessionToken: string): Promise<TrustedSessionRecord | null>;
}

export interface TrustedMembershipDirectory {
  findMembershipById(
    membershipId: string,
  ): Promise<TrustedMembershipRecord | null>;
}

export interface TrustedPermissionEvaluator {
  evaluate(
    membershipId: string,
    evaluatedAt: Date,
  ): Promise<TrustedPermissionEvaluation>;
}

export interface TrustedContextClock {
  now(): Date;
}

export interface RequestIdFactory {
  issue(): string;
}

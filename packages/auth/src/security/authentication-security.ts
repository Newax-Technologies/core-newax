import type {
  AuthenticationIdentityType,
  IssuedSessionToken,
  PasswordVerificationResult,
} from '../types/authentication';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verifyOrBurn(password: string, secretHash: string | null): Promise<PasswordVerificationResult>;
}

export interface SessionTokenService {
  hash(token: string): string;
  issue(): IssuedSessionToken;
}

export interface LoginFingerprintService {
  fingerprint(identityType: AuthenticationIdentityType, identityValue: string): string;
}

export interface AuthenticationClock {
  now(): Date;
}

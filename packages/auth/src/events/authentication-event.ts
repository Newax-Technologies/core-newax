import type {
  AuthenticationAttemptOutcome,
  AuthenticationSessionRecord,
} from '../types/authentication';

export type AuthenticationEvent =
  | {
      readonly name: 'authentication.password_enrolled' | 'authentication.password_changed';
      readonly occurredAt: Date;
      readonly userId: string;
    }
  | {
      readonly name: 'authentication.login_succeeded';
      readonly occurredAt: Date;
      readonly userId: string;
      readonly sessionId: string;
      readonly ipAddress: string | null;
    }
  | {
      readonly name: 'authentication.login_failed';
      readonly occurredAt: Date;
      readonly userId: string | null;
      readonly identityFingerprint: string;
      readonly outcome: AuthenticationAttemptOutcome;
      readonly ipAddress: string | null;
    }
  | {
      readonly name: 'authentication.account_locked';
      readonly occurredAt: Date;
      readonly userId: string;
      readonly lockedUntil: Date;
    }
  | {
      readonly name: 'authentication.session_created';
      readonly occurredAt: Date;
      readonly session: AuthenticationSessionRecord;
    }
  | {
      readonly name: 'authentication.session_revoked';
      readonly occurredAt: Date;
      readonly userId: string;
      readonly sessionId: string;
      readonly actorUserId: string | null;
    };

export interface AuthenticationEventPublisher {
  publish(event: AuthenticationEvent): Promise<void>;
}

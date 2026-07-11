import { RequestContextError } from '../errors/request-context-error';
import { ImmutablePermissionSet } from '../security/immutable-permission-set';
import type {
  ResolveAccountContextInput,
  ResolveOrganizationContextInput,
  TrustedAccountRequestContext,
  TrustedOrganizationRequestContext,
  TrustedSessionRecord,
} from '../types/request-context';
import type {
  RequestIdFactory,
  TrustedContextClock,
  TrustedMembershipDirectory,
  TrustedPermissionEvaluator,
  TrustedSessionValidator,
} from './request-context-ports';

const MAX_SESSION_TOKEN_LENGTH = 512;
const MAX_IDENTIFIER_LENGTH = 128;

export class TrustedRequestContextService {
  constructor(
    private readonly sessionValidator: TrustedSessionValidator,
    private readonly membershipDirectory: TrustedMembershipDirectory,
    private readonly permissionEvaluator: TrustedPermissionEvaluator,
    private readonly clock: TrustedContextClock,
    private readonly requestIdFactory: RequestIdFactory,
  ) {}

  async resolveAccountContext(
    input: ResolveAccountContextInput,
  ): Promise<TrustedAccountRequestContext> {
    const requestId = this.resolveRequestId(input.requestId);
    const sessionToken = this.normalizeSessionToken(input.sessionToken);
    if (sessionToken === null) {
      throw this.authenticationRequired();
    }

    const session = await this.sessionValidator.validateSession(sessionToken);
    if (session === null) {
      throw this.authenticationRequired();
    }
    this.assertSessionIntegrity(session);

    return Object.freeze({
      scope: 'account',
      requestId,
      userId: session.userId,
      personId: session.personId,
      sessionId: session.sessionId,
      sessionExpiresAt: new Date(session.expiresAt.getTime()),
    });
  }

  async resolveOrganizationContext(
    input: ResolveOrganizationContextInput,
  ): Promise<TrustedOrganizationRequestContext> {
    const accountContext = await this.resolveAccountContext(input);
    const membershipId = this.requireIdentifier(
      input.membershipId,
      'membershipId',
    );
    const membership = await this.membershipDirectory.findMembershipById(
      membershipId,
    );

    if (
      membership === null ||
      membership.personId !== accountContext.personId ||
      membership.membershipStatus !== 'active' ||
      membership.organizationStatus !== 'active'
    ) {
      throw new RequestContextError(
        'REQUEST_CONTEXT_MEMBERSHIP_UNAVAILABLE',
        'The selected membership is unavailable for this authenticated account.',
      );
    }

    const evaluatedAt = this.requireDate(this.clock.now(), 'evaluatedAt');
    const evaluation = await this.permissionEvaluator.evaluate(
      membership.id,
      evaluatedAt,
    );

    if (
      evaluation.membershipId !== membership.id ||
      evaluation.organizationId !== membership.organizationId
    ) {
      throw new RequestContextError(
        'REQUEST_CONTEXT_INTEGRITY_FAILURE',
        'Permission evaluation did not match the trusted membership boundary.',
      );
    }
    this.requireDate(evaluation.evaluatedAt, 'permissionEvaluation.evaluatedAt');

    return Object.freeze({
      scope: 'organization',
      requestId: accountContext.requestId,
      userId: accountContext.userId,
      personId: accountContext.personId,
      sessionId: accountContext.sessionId,
      sessionExpiresAt: new Date(accountContext.sessionExpiresAt.getTime()),
      membershipId: membership.id,
      organizationId: membership.organizationId,
      permissionCodes: new ImmutablePermissionSet(
        evaluation.effectivePermissionCodes,
      ),
      evaluatedAt: new Date(evaluation.evaluatedAt.getTime()),
    });
  }

  private assertSessionIntegrity(session: TrustedSessionRecord): void {
    this.requireIdentifier(session.userId, 'session.userId');
    this.requireIdentifier(session.personId, 'session.personId');
    this.requireIdentifier(session.sessionId, 'session.sessionId');
    this.requireDate(session.expiresAt, 'session.expiresAt');
  }

  private normalizeSessionToken(token: string): string | null {
    if (
      token.length === 0 ||
      token.length > MAX_SESSION_TOKEN_LENGTH ||
      token.trim() !== token
    ) {
      return null;
    }
    return token;
  }

  private resolveRequestId(requestId: string | undefined): string {
    return this.requireIdentifier(
      requestId ?? this.requestIdFactory.issue(),
      'requestId',
    );
  }

  private requireIdentifier(value: string, field: string): string {
    const normalized = value.trim();
    if (
      normalized.length === 0 ||
      normalized.length > MAX_IDENTIFIER_LENGTH
    ) {
      throw new RequestContextError(
        'REQUEST_CONTEXT_INVALID_INPUT',
        `${field} must contain between 1 and ${String(
          MAX_IDENTIFIER_LENGTH,
        )} characters.`,
        { field },
      );
    }
    return normalized;
  }

  private requireDate(value: Date, field: string): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new RequestContextError(
        'REQUEST_CONTEXT_INTEGRITY_FAILURE',
        `${field} must be a valid date.`,
        { field },
      );
    }
    return value;
  }

  private authenticationRequired(): RequestContextError {
    return new RequestContextError(
      'REQUEST_CONTEXT_AUTHENTICATION_REQUIRED',
      'A valid authenticated session is required.',
    );
  }
}

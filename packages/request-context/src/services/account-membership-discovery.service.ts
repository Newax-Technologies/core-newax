import { RequestContextError } from '../errors/request-context-error';
import type {
  AccountMembershipCandidate,
  AccountMembershipDiscoveryPage,
  AccountMembershipDiscoveryQuery,
  AccountMembershipOption,
  TrustedAccountRequestContext,
} from '../types/request-context';
import type { AccountMembershipDirectory } from './request-context-ports';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE = 1_000_000;
const MAX_PAGE_SIZE = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export class AccountMembershipDiscoveryService {
  constructor(private readonly directory: AccountMembershipDirectory) {}

  async list(
    context: TrustedAccountRequestContext,
    query: AccountMembershipDiscoveryQuery = {},
  ): Promise<AccountMembershipDiscoveryPage> {
    this.assertAccountContext(context);
    const page = this.normalizeInteger(query.page, 'page', DEFAULT_PAGE, MAX_PAGE);
    const perPage = this.normalizeInteger(
      query.perPage,
      'perPage',
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const offset = (page - 1) * perPage;
    if (!Number.isSafeInteger(offset)) {
      throw this.invalidInput('The requested membership page is too large.', 'page');
    }

    const result = await this.directory.listAvailableMemberships(
      context.personId,
      offset,
      perPage,
    );
    if (!Number.isInteger(result.total) || result.total < 0) {
      throw this.integrityFailure('Membership discovery returned an invalid total.');
    }
    if (!Array.isArray(result.items) || result.items.length > perPage) {
      throw this.integrityFailure('Membership discovery returned an invalid result collection.');
    }
    if (result.items.length > 0 && offset + result.items.length > result.total) {
      throw this.integrityFailure('Membership discovery pagination metadata is inconsistent.');
    }

    const seenMembershipIds = new Set<string>();
    const items = result.items.map((candidate) => {
      const option = this.toOption(candidate, context.personId);
      if (seenMembershipIds.has(option.membershipId)) {
        throw this.integrityFailure('Membership discovery returned a duplicate membership.');
      }
      seenMembershipIds.add(option.membershipId);
      return Object.freeze(option);
    });

    return Object.freeze({
      items: Object.freeze(items),
      page,
      perPage,
      total: result.total,
    });
  }

  private toOption(
    candidate: AccountMembershipCandidate,
    trustedPersonId: string,
  ): AccountMembershipOption {
    const membershipId = this.requireUuid(candidate.membershipId, 'membership.membershipId');
    const personId = this.requireUuid(candidate.personId, 'membership.personId');
    const organizationId = this.requireUuid(
      candidate.organizationId,
      'membership.organizationId',
    );

    if (personId !== trustedPersonId) {
      throw this.integrityFailure(
        'Membership discovery returned a membership for a different person.',
      );
    }
    if (candidate.membershipStatus !== 'active' || candidate.organizationStatus !== 'active') {
      throw this.integrityFailure(
        'Membership discovery returned an inactive membership or organization.',
      );
    }

    return {
      membershipId,
      organizationId,
      organizationDisplayName: this.requireText(
        candidate.organizationDisplayName,
        'membership.organizationDisplayName',
        255,
      ),
      organizationType: this.requireText(
        candidate.organizationType,
        'membership.organizationType',
        64,
      ),
      membershipType: this.requireText(
        candidate.membershipType,
        'membership.membershipType',
        64,
      ),
      jobTitle: this.requireNullableText(candidate.jobTitle, 'membership.jobTitle', 128),
      startDate: this.requireNullableDate(candidate.startDate, 'membership.startDate'),
    };
  }

  private assertAccountContext(context: TrustedAccountRequestContext): void {
    if (context.scope !== 'account') {
      throw this.integrityFailure('Account membership discovery requires trusted account context.');
    }
    this.requireUuid(context.userId, 'context.userId');
    this.requireUuid(context.personId, 'context.personId');
    this.requireUuid(context.sessionId, 'context.sessionId');
    this.requireText(context.requestId, 'context.requestId', 128);
    this.requireDate(context.sessionExpiresAt, 'context.sessionExpiresAt');
  }

  private normalizeInteger(
    value: number | undefined,
    field: string,
    fallback: number,
    maximum: number,
  ): number {
    const normalized = value ?? fallback;
    if (!Number.isInteger(normalized) || normalized < 1 || normalized > maximum) {
      throw this.invalidInput(
        `${field} must be an integer between 1 and ${String(maximum)}.`,
        field,
      );
    }
    return normalized;
  }

  private requireUuid(value: string, field: string): string {
    if (!UUID_PATTERN.test(value)) {
      throw this.integrityFailure(`${field} must be a valid UUID.`);
    }
    return value.toLowerCase();
  }

  private requireText(value: string, field: string, maximumLength: number): string {
    if (
      typeof value !== 'string' ||
      value.length === 0 ||
      value.length > maximumLength ||
      value.trim() !== value
    ) {
      throw this.integrityFailure(`${field} is invalid.`);
    }
    return value;
  }

  private requireNullableText(
    value: string | null,
    field: string,
    maximumLength: number,
  ): string | null {
    if (value === null) {
      return null;
    }
    return this.requireText(value, field, maximumLength);
  }

  private requireDate(value: Date, field: string): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw this.integrityFailure(`${field} must be a valid date.`);
    }
    return value;
  }

  private requireNullableDate(value: Date | null, field: string): Date | null {
    return value === null ? null : new Date(this.requireDate(value, field).getTime());
  }

  private invalidInput(message: string, field: string): RequestContextError {
    return new RequestContextError('REQUEST_CONTEXT_INVALID_INPUT', message, { field });
  }

  private integrityFailure(message: string): RequestContextError {
    return new RequestContextError('REQUEST_CONTEXT_INTEGRITY_FAILURE', message);
  }
}

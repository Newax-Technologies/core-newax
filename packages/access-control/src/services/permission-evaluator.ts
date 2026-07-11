import type { AccessControlRepository } from '../database/access-control-repository';
import type { PermissionEvaluation } from '../types/access-control';
import type { AccessReferenceDirectory } from './access-reference-directory';

export class PermissionEvaluator {
  constructor(
    private readonly repository: AccessControlRepository,
    private readonly referenceDirectory: AccessReferenceDirectory,
  ) {}

  async evaluate(
    membershipId: string,
    evaluatedAt: Date = new Date(),
  ): Promise<PermissionEvaluation> {
    const normalizedMembershipId = membershipId.trim();
    const membership = await this.referenceDirectory.findMembershipById(
      normalizedMembershipId,
    );

    if (
      membership === null ||
      membership.organizationId === null ||
      membership.status !== 'active'
    ) {
      return this.emptyEvaluation(
        normalizedMembershipId,
        membership?.organizationId ?? '',
        evaluatedAt,
      );
    }

    const organization = await this.referenceDirectory.findOrganizationById(
      membership.organizationId,
    );
    if (
      organization === null ||
      organization.id !== membership.organizationId ||
      organization.status !== 'active'
    ) {
      return this.emptyEvaluation(
        membership.id,
        membership.organizationId,
        evaluatedAt,
      );
    }

    return this.repository.evaluateMembershipPermissions(
      membership.id,
      membership.organizationId,
      new Date(evaluatedAt.getTime()),
    );
  }

  private emptyEvaluation(
    membershipId: string,
    organizationId: string,
    evaluatedAt: Date,
  ): PermissionEvaluation {
    return {
      membershipId,
      organizationId,
      evaluatedAt: new Date(evaluatedAt.getTime()),
      allowedPermissionCodes: [],
      deniedPermissionCodes: [],
      effectivePermissionCodes: [],
    };
  }
}

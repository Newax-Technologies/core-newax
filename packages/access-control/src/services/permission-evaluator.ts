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
    const membership = await this.referenceDirectory.findMembershipById(membershipId.trim());

    if (
      membership === null ||
      membership.organizationId === null ||
      membership.status !== 'active'
    ) {
      return {
        membershipId: membershipId.trim(),
        organizationId: membership?.organizationId ?? '',
        evaluatedAt: new Date(evaluatedAt.getTime()),
        allowedPermissionCodes: [],
        deniedPermissionCodes: [],
        effectivePermissionCodes: [],
      };
    }

    return this.repository.evaluateMembershipPermissions(
      membership.id,
      membership.organizationId,
      new Date(evaluatedAt.getTime()),
    );
  }
}

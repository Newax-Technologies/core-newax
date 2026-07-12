import { Inject, Injectable } from '@nestjs/common';
import { PermissionEvaluator } from '@newax/access-control';
import type {
  TrustedPermissionEvaluation,
  TrustedPermissionEvaluator,
} from '@newax/request-context';

@Injectable()
export class AccessControlPermissionEvaluator implements TrustedPermissionEvaluator {
  constructor(
    @Inject(PermissionEvaluator)
    private readonly permissions: PermissionEvaluator,
  ) {}

  async evaluate(membershipId: string, evaluatedAt: Date): Promise<TrustedPermissionEvaluation> {
    const evaluation = await this.permissions.evaluate(membershipId, evaluatedAt);
    return {
      membershipId: evaluation.membershipId,
      organizationId: evaluation.organizationId,
      evaluatedAt: new Date(evaluation.evaluatedAt.getTime()),
      effectivePermissionCodes: [...evaluation.effectivePermissionCodes],
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import type {
  MembershipEvent,
  MembershipEventPublisher,
} from '@newax/memberships';

@Injectable()
export class LoggingMembershipEventPublisher
  implements MembershipEventPublisher
{
  private readonly logger = new Logger(LoggingMembershipEventPublisher.name);

  async publish(event: MembershipEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      actorUserId: event.actorUserId,
      organizationId: event.organizationId,
      membershipId: event.membershipId,
      personId: event.personId,
      occurredAt: event.occurredAt.toISOString(),
    });
  }
}

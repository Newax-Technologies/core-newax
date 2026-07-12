import { Injectable, Logger } from '@nestjs/common';
import type { UserEvent, UserEventPublisher } from '@newax/users';

@Injectable()
export class LoggingUserEventPublisher implements UserEventPublisher {
  private readonly logger = new Logger(LoggingUserEventPublisher.name);

  async publish(event: UserEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      actorUserId: event.actorUserId,
      organizationId: event.organizationId,
      occurredAt: event.occurredAt.toISOString(),
      userId: 'user' in event ? event.user.id : event.userId,
      identityId: 'identityId' in event ? event.identityId : undefined,
      identityType: 'identityType' in event ? event.identityType : undefined,
    });
  }
}

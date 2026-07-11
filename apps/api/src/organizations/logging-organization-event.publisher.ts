import { Injectable, Logger } from '@nestjs/common';
import type { OrganizationEvent, OrganizationEventPublisher } from '@newax/organizations';

@Injectable()
export class LoggingOrganizationEventPublisher implements OrganizationEventPublisher {
  private readonly logger = new Logger(LoggingOrganizationEventPublisher.name);

  async publish(event: OrganizationEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      actorUserId: event.actorUserId,
      organizationId: event.organizationId,
      occurredAt: event.occurredAt.toISOString(),
    });
  }
}

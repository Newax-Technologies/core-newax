import { Injectable, Logger } from '@nestjs/common';
import type { AccessControlEvent, AccessControlEventPublisher } from '@newax/access-control';

@Injectable()
export class LoggingAccessControlEventPublisher implements AccessControlEventPublisher {
  private readonly logger = new Logger(LoggingAccessControlEventPublisher.name);

  async publish(event: AccessControlEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      actorUserId: event.actorUserId,
      occurredAt: event.occurredAt.toISOString(),
      organizationId: 'organizationId' in event ? event.organizationId : undefined,
      roleId: 'roleId' in event ? event.roleId : undefined,
      permissionId: 'permissionId' in event ? event.permissionId : undefined,
    });
  }
}

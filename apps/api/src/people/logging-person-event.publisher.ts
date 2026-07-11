import { Injectable, Logger } from '@nestjs/common';
import type { PersonEvent, PersonEventPublisher } from '@newax/people';

@Injectable()
export class LoggingPersonEventPublisher implements PersonEventPublisher {
  private readonly logger = new Logger(LoggingPersonEventPublisher.name);

  async publish(event: PersonEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      actorUserId: event.actorUserId,
      personId: event.personId,
      occurredAt: event.occurredAt.toISOString(),
    });
  }
}

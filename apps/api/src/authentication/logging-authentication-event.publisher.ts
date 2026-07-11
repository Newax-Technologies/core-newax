import { Injectable, Logger } from '@nestjs/common';
import type {
  AuthenticationEvent,
  AuthenticationEventPublisher,
} from '@newax/auth';

@Injectable()
export class LoggingAuthenticationEventPublisher
  implements AuthenticationEventPublisher
{
  private readonly logger = new Logger(
    LoggingAuthenticationEventPublisher.name,
  );

  async publish(event: AuthenticationEvent): Promise<void> {
    this.logger.log({
      event: event.name,
      occurredAt: event.occurredAt.toISOString(),
      userId: 'userId' in event ? event.userId : event.session.userId,
      sessionId:
        'sessionId' in event
          ? event.sessionId
          : 'session' in event
            ? event.session.id
            : undefined,
      actorUserId: 'actorUserId' in event ? event.actorUserId : undefined,
      outcome: 'outcome' in event ? event.outcome : undefined,
      identityFingerprint:
        'identityFingerprint' in event
          ? event.identityFingerprint
          : undefined,
      ipAddress: 'ipAddress' in event ? event.ipAddress : undefined,
      lockedUntil:
        'lockedUntil' in event ? event.lockedUntil.toISOString() : undefined,
    });
  }
}

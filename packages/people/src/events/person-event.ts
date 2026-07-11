import type { PersonIdentifierRecord, PersonRecord } from '../types/person';

export type PersonLifecycleEventName = 'person.archived' | 'person.created' | 'person.updated';

export type PersonIdentifierEventName = 'person.identifier_added' | 'person.identifier_verified';

export interface PersonLifecycleEvent {
  readonly name: PersonLifecycleEventName;
  readonly actorUserId: string;
  readonly personId: string;
  readonly occurredAt: Date;
  readonly person: PersonRecord;
}

export interface PersonIdentifierEvent {
  readonly name: PersonIdentifierEventName;
  readonly actorUserId: string;
  readonly personId: string;
  readonly occurredAt: Date;
  readonly identifier: PersonIdentifierRecord;
}

export type PersonEvent = PersonLifecycleEvent | PersonIdentifierEvent;

export interface PersonEventPublisher {
  publish(event: PersonEvent): Promise<void>;
}

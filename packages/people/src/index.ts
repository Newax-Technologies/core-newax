export type { PeopleRepository } from './database/people-repository';
export type {
  PersonEvent,
  PersonEventPublisher,
  PersonIdentifierEvent,
  PersonIdentifierEventName,
  PersonLifecycleEvent,
  PersonLifecycleEventName,
} from './events/person-event';
export { PeopleModuleError, type PeopleErrorCode } from './errors/people-module-error';
export { PEOPLE_PERMISSIONS, type PeoplePermission } from './permissions/people-permissions';
export { PeopleService } from './services/people.service';
export type {
  AddPersonIdentifierInput,
  CreatePersonIdentifierRecordInput,
  CreatePersonIdentifierResult,
  CreatePersonInput,
  CreatePersonRecordInput,
  PersonIdentifierRecord,
  PersonListQuery,
  PersonPage,
  PersonRecord,
  PersonStatus,
  PeopleRequestContext,
  UpdatePersonInput,
  UpdatePersonRecordInput,
} from './types/person';

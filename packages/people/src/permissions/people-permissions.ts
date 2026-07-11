export const PEOPLE_PERMISSIONS = {
  archive: 'people.archive',
  create: 'people.create',
  identifiersManage: 'people.identifiers.manage',
  identifiersView: 'people.identifiers.view',
  update: 'people.update',
  view: 'people.view',
} as const;

export type PeoplePermission = (typeof PEOPLE_PERMISSIONS)[keyof typeof PEOPLE_PERMISSIONS];

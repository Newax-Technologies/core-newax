from pathlib import Path
import textwrap


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip())


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


environment_path = Path("apps/web/src/config/environment.ts")
environment = environment_path.read_text()
environment = replace_once(
    environment,
    "const DEFAULT_SEARCH_INDEXING_ENABLED = false;",
    "const DEFAULT_SEARCH_INDEXING_ENABLED = false;\nconst DEFAULT_API_INTERNAL_ORIGIN = 'http://127.0.0.1:3000';",
    "web API default",
)
environment = replace_once(
    environment,
    "  readonly SEARCH_INDEXING_ENABLED: boolean;",
    "  readonly SEARCH_INDEXING_ENABLED: boolean;\n  readonly API_INTERNAL_ORIGIN: string;",
    "web environment type",
)
environment = replace_once(
    environment,
    "  readonly SEARCH_INDEXING_ENABLED?: string;",
    "  readonly SEARCH_INDEXING_ENABLED?: string;\n  readonly API_INTERNAL_ORIGIN?: string;",
    "web environment source type",
)
environment = replace_once(
    environment,
    "function parseSearchIndexingEnabled(value: string | undefined): boolean {",
    "function parseApiInternalOrigin(value: string | undefined): string {\n  const source = value === undefined ? DEFAULT_API_INTERNAL_ORIGIN : value.trim();\n  if (source.length === 0) {\n    throw new Error('API_INTERNAL_ORIGIN must not be empty.');\n  }\n  let url: URL;\n  try {\n    url = new URL(source);\n  } catch {\n    throw new Error('API_INTERNAL_ORIGIN must be an absolute HTTP or HTTPS URL.');\n  }\n  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username.length > 0 || url.password.length > 0 || url.search.length > 0 || url.hash.length > 0) {\n    throw new Error('API_INTERNAL_ORIGIN must be an absolute HTTP or HTTPS origin without credentials, query, or fragment.');\n  }\n  url.pathname = url.pathname.replace(/\\/+$/u, '');\n  return url.toString().replace(/\\/$/u, '');\n}\n\nfunction parseSearchIndexingEnabled(value: string | undefined): boolean {",
    "web API parser",
)
environment = replace_once(
    environment,
    "    SEARCH_INDEXING_ENABLED: parseSearchIndexingEnabled(source.SEARCH_INDEXING_ENABLED),",
    "    SEARCH_INDEXING_ENABLED: parseSearchIndexingEnabled(source.SEARCH_INDEXING_ENABLED),\n    API_INTERNAL_ORIGIN: parseApiInternalOrigin(source.API_INTERNAL_ORIGIN),",
    "web API result",
)
environment_path.write_text(environment)

spec_path = Path("apps/web/src/config/environment.spec.ts")
spec = spec_path.read_text()
spec = replace_once(
    spec,
    "      SEARCH_INDEXING_ENABLED: false,",
    "      SEARCH_INDEXING_ENABLED: false,\n      API_INTERNAL_ORIGIN: 'http://127.0.0.1:3000',",
    "environment default test",
)
spec = replace_once(
    spec,
    "        SEARCH_INDEXING_ENABLED: ' true ',",
    "        SEARCH_INDEXING_ENABLED: ' true ',\n        API_INTERNAL_ORIGIN: ' https://api.internal.example/ ',",
    "environment configured input",
)
spec = replace_once(
    spec,
    "      SEARCH_INDEXING_ENABLED: true,",
    "      SEARCH_INDEXING_ENABLED: true,\n      API_INTERNAL_ORIGIN: 'https://api.internal.example',",
    "environment configured result",
)
spec = replace_once(
    spec,
    "  it('accepts an explicit false indexing value', () => {",
    "  it.each(['', 'relative/path', 'ftp://example.com', 'https://user:secret@example.com'])('rejects invalid API origin %j', (origin) => {\n    expect(() => readWebEnvironment({ API_INTERNAL_ORIGIN: origin })).toThrow(/API_INTERNAL_ORIGIN/u);\n  });\n\n  it('accepts an explicit false indexing value', () => {",
    "environment API invalid tests",
)
spec_path.write_text(spec)

next_config_path = Path("apps/web/next.config.ts")
next_config_path.write_text(textwrap.dedent('''
import type { NextConfig } from 'next';

import { readWebEnvironment } from './src/config/environment';

const { API_INTERNAL_ORIGIN } = readWebEnvironment();

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_INTERNAL_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
''').lstrip())

env_path = Path("apps/web/.env.example")
env = env_path.read_text()
env += "\n# Server-side API origin used by the same-origin /api reverse proxy.\nAPI_INTERNAL_ORIGIN=http://127.0.0.1:3000\n"
env_path.write_text(env)

write(
    "apps/web/src/app/internal/people-intake/people-intake-model.ts",
    '''
    export interface DraftIdentifier {
      readonly localId: string;
      readonly identifierType: string;
      readonly identifierValue: string;
      readonly issuingAuthority: string;
      readonly issuingCountryCode: string;
    }

    export interface DraftPerson {
      readonly localId: string;
      readonly clientKey: string;
      readonly firstName: string;
      readonly middleName: string;
      readonly lastName: string;
      readonly preferredName: string;
      readonly dateOfBirth: string;
      readonly gender: string;
      readonly identifiers: readonly DraftIdentifier[];
    }

    export interface DraftRelationship {
      readonly localId: string;
      readonly sourcePersonKey: string;
      readonly targetPersonKey: string;
      readonly relationshipType: string;
      readonly relationshipRole: string;
      readonly relationshipBasis: string;
    }

    export interface FamilyIntakeDraft {
      readonly intakeId: string | null;
      readonly version: number | null;
      readonly status: 'draft' | 'submitted' | 'approved' | 'rejected';
      readonly title: string;
      readonly sourceType: string;
      readonly sourceReference: string;
      readonly people: readonly DraftPerson[];
      readonly relationships: readonly DraftRelationship[];
    }

    export interface DraftIssue {
      readonly field: string;
      readonly message: string;
    }

    export function initialFamilyIntakeDraft(): FamilyIntakeDraft {
      return {
        intakeId: null,
        version: null,
        status: 'draft',
        title: '',
        sourceType: 'manual',
        sourceReference: '',
        people: [emptyPerson('person-1', 'person_1')],
        relationships: [],
      };
    }

    export function emptyPerson(localId: string, clientKey: string): DraftPerson {
      return {
        localId,
        clientKey,
        firstName: '',
        middleName: '',
        lastName: '',
        preferredName: '',
        dateOfBirth: '',
        gender: '',
        identifiers: [],
      };
    }

    export function emptyIdentifier(localId: string): DraftIdentifier {
      return {
        localId,
        identifierType: 'cnic',
        identifierValue: '',
        issuingAuthority: 'NADRA',
        issuingCountryCode: 'PK',
      };
    }

    export function emptyRelationship(
      localId: string,
      sourcePersonKey: string,
      targetPersonKey: string,
    ): DraftRelationship {
      return {
        localId,
        sourcePersonKey,
        targetPersonKey,
        relationshipType: 'parent_of',
        relationshipRole: 'parent',
        relationshipBasis: 'declared',
      };
    }

    export function validateFamilyIntakeDraft(draft: FamilyIntakeDraft): readonly DraftIssue[] {
      const issues: DraftIssue[] = [];
      if (draft.title.trim().length === 0) issues.push(issue('title', 'Add a clear intake title.'));
      if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u.test(draft.sourceType.trim().toLowerCase())) {
        issues.push(issue('sourceType', 'Use a stable source code such as manual or nadra_crc.'));
      }
      if (draft.people.length < 1) issues.push(issue('people', 'Add at least one person.'));
      if (draft.people.length > 50) issues.push(issue('people', 'An intake can contain at most 50 people.'));

      const keys = new Set<string>();
      const identifiers = new Set<string>();
      for (const [index, person] of draft.people.entries()) {
        const prefix = `people.${String(index + 1)}`;
        const key = person.clientKey.trim().toLowerCase();
        if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(key)) {
          issues.push(issue(`${prefix}.clientKey`, 'Use a unique lowercase key such as mother or child_1.'));
        } else if (keys.has(key)) {
          issues.push(issue(`${prefix}.clientKey`, 'Each person key must be unique.'));
        }
        keys.add(key);
        if (person.firstName.trim().length === 0) issues.push(issue(`${prefix}.firstName`, 'First name is required.'));
        if (person.lastName.trim().length === 0) issues.push(issue(`${prefix}.lastName`, 'Last name is required.'));
        if (person.dateOfBirth.length > 0) {
          const date = new Date(`${person.dateOfBirth}T00:00:00.000Z`);
          if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== person.dateOfBirth) {
            issues.push(issue(`${prefix}.dateOfBirth`, 'Date of birth must be a real date.'));
          } else if (person.dateOfBirth > new Date().toISOString().slice(0, 10)) {
            issues.push(issue(`${prefix}.dateOfBirth`, 'Date of birth cannot be in the future.'));
          }
        }
        for (const [identifierIndex, identifier] of person.identifiers.entries()) {
          const field = `${prefix}.identifiers.${String(identifierIndex + 1)}`;
          if (identifier.identifierValue.trim().length === 0) {
            issues.push(issue(field, 'Identifier value is required.'));
            continue;
          }
          const normalized = [
            identifier.identifierType.trim().toLowerCase(),
            identifier.issuingCountryCode.trim().toUpperCase(),
            identifier.issuingAuthority.trim().toUpperCase(),
            identifier.identifierValue.toUpperCase().replace(/[\s-]/gu, ''),
          ].join('|');
          if (identifiers.has(normalized)) issues.push(issue(field, 'This identifier is repeated in the intake.'));
          identifiers.add(normalized);
        }
      }

      const relationKeys = new Set<string>();
      const parentGraph = new Map<string, string[]>();
      for (const [index, relationship] of draft.relationships.entries()) {
        const field = `relationships.${String(index + 1)}`;
        const source = relationship.sourcePersonKey.trim().toLowerCase();
        const target = relationship.targetPersonKey.trim().toLowerCase();
        if (!keys.has(source) || !keys.has(target)) issues.push(issue(field, 'Both relationship people must exist in this draft.'));
        if (source === target) issues.push(issue(field, 'A person cannot be related to themselves.'));
        const relationKey = [source, target, relationship.relationshipType, relationship.relationshipRole, relationship.relationshipBasis]
          .map((value) => value.trim().toLowerCase())
          .join('|');
        if (relationKeys.has(relationKey)) issues.push(issue(field, 'This relationship is duplicated.'));
        relationKeys.add(relationKey);
        if (relationship.relationshipType.trim().toLowerCase() === 'parent_of') {
          const targets = parentGraph.get(source) ?? [];
          targets.push(target);
          parentGraph.set(source, targets);
        }
      }
      if (hasCycle(parentGraph)) issues.push(issue('relationships', 'Parent relationships cannot form an ancestry cycle.'));
      return issues;
    }

    export function maskIdentifier(value: string): string {
      const trimmed = value.trim();
      if (trimmed.length <= 4) return '•'.repeat(trimmed.length);
      return `${'•'.repeat(Math.min(8, trimmed.length - 4))}${trimmed.slice(-4)}`;
    }

    export function draftToApiBody(draft: FamilyIntakeDraft) {
      return {
        title: draft.title,
        source_type: draft.sourceType,
        source_reference: draft.sourceReference.trim().length === 0 ? null : draft.sourceReference,
        payload: {
          schema_version: 1,
          people: draft.people.map((person) => ({
            client_key: person.clientKey,
            first_name: person.firstName,
            middle_name: nullable(person.middleName),
            last_name: person.lastName,
            preferred_name: nullable(person.preferredName),
            date_of_birth: nullable(person.dateOfBirth),
            gender: nullable(person.gender),
            identifiers: person.identifiers.map((identifier) => ({
              identifier_type: identifier.identifierType,
              identifier_value: identifier.identifierValue,
              issuing_authority: nullable(identifier.issuingAuthority),
              issuing_country_code: nullable(identifier.issuingCountryCode),
            })),
          })),
          relationships: draft.relationships.map((relationship) => ({
            source_person_key: relationship.sourcePersonKey,
            target_person_key: relationship.targetPersonKey,
            relationship_type: relationship.relationshipType,
            relationship_role: relationship.relationshipRole,
            relationship_basis: relationship.relationshipBasis,
          })),
        },
      };
    }

    function nullable(value: string): string | null {
      const normalized = value.trim();
      return normalized.length === 0 ? null : normalized;
    }

    function issue(field: string, message: string): DraftIssue {
      return { field, message };
    }

    function hasCycle(graph: ReadonlyMap<string, readonly string[]>): boolean {
      const visiting = new Set<string>();
      const visited = new Set<string>();
      const visit = (node: string): boolean => {
        if (visiting.has(node)) return true;
        if (visited.has(node)) return false;
        visiting.add(node);
        for (const target of graph.get(node) ?? []) if (visit(target)) return true;
        visiting.delete(node);
        visited.add(node);
        return false;
      };
      for (const node of graph.keys()) if (visit(node)) return true;
      return false;
    }
    ''',
)
write(
    "apps/web/src/app/internal/people-intake/people-intake-model.spec.ts",
    '''
    import { describe, expect, it } from 'vitest';

    import {
      emptyIdentifier,
      emptyPerson,
      emptyRelationship,
      initialFamilyIntakeDraft,
      maskIdentifier,
      validateFamilyIntakeDraft,
    } from './people-intake-model';

    describe('People Intake dashboard model', () => {
      it('reports incomplete draft fields without storing anything', () => {
        const issues = validateFamilyIntakeDraft(initialFamilyIntakeDraft());
        expect(issues.map((item) => item.field)).toContain('title');
        expect(issues.map((item) => item.field)).toContain('people.1.firstName');
      });

      it('accepts a simple parent and child draft', () => {
        const parent = {
          ...emptyPerson('parent-id', 'parent'),
          firstName: 'Amina',
          lastName: 'Khan',
          identifiers: [{ ...emptyIdentifier('identifier-id'), identifierValue: '12345-1234567-1' }],
        };
        const child = {
          ...emptyPerson('child-id', 'child'),
          firstName: 'Sara',
          lastName: 'Khan',
          dateOfBirth: '2015-01-10',
        };
        const draft = {
          ...initialFamilyIntakeDraft(),
          title: 'Family verification',
          people: [parent, child],
          relationships: [emptyRelationship('relationship-id', 'parent', 'child')],
        };
        expect(validateFamilyIntakeDraft(draft)).toEqual([]);
      });

      it('detects a parentage cycle', () => {
        const first = { ...emptyPerson('first-id', 'first'), firstName: 'First', lastName: 'Person' };
        const second = { ...emptyPerson('second-id', 'second'), firstName: 'Second', lastName: 'Person' };
        const draft = {
          ...initialFamilyIntakeDraft(),
          title: 'Cycle',
          people: [first, second],
          relationships: [
            emptyRelationship('one', 'first', 'second'),
            emptyRelationship('two', 'second', 'first'),
          ],
        };
        expect(validateFamilyIntakeDraft(draft).some((item) => item.message.includes('cycle'))).toBe(true);
      });

      it('masks identifiers while preserving a short verification suffix', () => {
        expect(maskIdentifier('12345-1234567-1')).toBe('••••••••567-1');
      });
    });
    ''',
)
write(
    "apps/web/src/app/internal/people-intake/page.tsx",
    '''
    import type { Metadata } from 'next';

    import { PeopleIntakeDashboard } from './people-intake-dashboard';

    export const metadata: Metadata = {
      title: 'People Intake Verification',
      description: 'Internal NEWAX workspace for controlled people and family intake verification.',
      robots: { index: false, follow: false, noarchive: true, nocache: true },
    };

    export default function PeopleIntakePage() {
      return <PeopleIntakeDashboard />;
    }
    ''',
)
write(
    "apps/web/src/app/internal/people-intake/people-intake-dashboard.tsx",
    '''
    'use client';

    import { useCallback, useEffect, useMemo, useState } from 'react';

    import styles from './people-intake-dashboard.module.css';
    import {
      draftToApiBody,
      emptyIdentifier,
      emptyPerson,
      emptyRelationship,
      initialFamilyIntakeDraft,
      maskIdentifier,
      type DraftIdentifier,
      type DraftPerson,
      type DraftRelationship,
      type FamilyIntakeDraft,
      validateFamilyIntakeDraft,
    } from './people-intake-model';

    interface Membership {
      readonly membership_id: string;
      readonly organization_id: string;
      readonly organization_display_name: string;
      readonly membership_type: string;
    }

    interface IntakeSummary {
      readonly id: string;
      readonly title: string;
      readonly source_type: string;
      readonly source_reference: string | null;
      readonly status: 'draft' | 'submitted' | 'approved' | 'rejected';
      readonly person_count: number;
      readonly relationship_count: number;
      readonly version: number;
      readonly created_by_user_id: string;
      readonly submitted_at: string | null;
      readonly reviewed_at: string | null;
      readonly review_notes: string | null;
    }

    interface IntakeRecord extends IntakeSummary {
      readonly payload: {
        readonly schema_version: 1;
        readonly people: readonly {
          readonly client_key: string;
          readonly first_name: string;
          readonly middle_name: string | null;
          readonly last_name: string;
          readonly preferred_name: string | null;
          readonly date_of_birth: string | null;
          readonly gender: string | null;
          readonly identifiers: readonly {
            readonly identifier_type: string;
            readonly identifier_value: string;
            readonly issuing_authority: string | null;
            readonly issuing_country_code: string | null;
          }[];
        }[];
        readonly relationships: readonly {
          readonly source_person_key: string;
          readonly target_person_key: string;
          readonly relationship_type: string;
          readonly relationship_role: string;
          readonly relationship_basis: string;
        }[];
      };
    }

    interface ApiEnvelope<T> {
      readonly success: true;
      readonly data: T;
    }

    interface Message {
      readonly tone: 'neutral' | 'success' | 'error';
      readonly text: string;
    }

    function localId(prefix: string): string {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }

    export function PeopleIntakeDashboard() {
      const [memberships, setMemberships] = useState<readonly Membership[]>([]);
      const [membershipId, setMembershipId] = useState('');
      const [draft, setDraft] = useState<FamilyIntakeDraft>(() => initialFamilyIntakeDraft());
      const [intakes, setIntakes] = useState<readonly IntakeSummary[]>([]);
      const [reviewRecord, setReviewRecord] = useState<IntakeRecord | null>(null);
      const [reviewNotes, setReviewNotes] = useState('');
      const [message, setMessage] = useState<Message>({ tone: 'neutral', text: 'No data has been saved.' });
      const [busy, setBusy] = useState(false);
      const issues = useMemo(() => validateFamilyIntakeDraft(draft), [draft]);
      const selectedMembership = memberships.find((item) => item.membership_id === membershipId) ?? null;
      const reviewQueue = intakes.filter((item) => item.status === 'submitted');

      const request = useCallback(
        async <T,>(path: string, init: RequestInit = {}, requiresMembership = false): Promise<T> => {
          const headers = new Headers(init.headers);
          headers.set('Accept', 'application/json');
          if (init.body !== undefined) headers.set('Content-Type', 'application/json');
          if (requiresMembership) {
            if (membershipId.length === 0) throw new Error('Select an organization first.');
            headers.set('x-newax-membership-id', membershipId);
          }
          if (init.method !== undefined && init.method !== 'GET' && init.method !== 'HEAD') {
            const csrf = csrfCookie();
            if (csrf === null) throw new Error('Your secure session is missing its CSRF token. Sign in again.');
            headers.set('x-newax-csrf', csrf);
          }
          const response = await fetch(path, { ...init, headers, credentials: 'include', cache: 'no-store' });
          const payload: unknown = await response.json().catch(() => null);
          if (!response.ok) {
            const error = errorMessage(payload);
            throw new Error(error ?? `Request failed with status ${String(response.status)}.`);
          }
          return (payload as ApiEnvelope<T>).data;
        },
        [membershipId],
      );

      const loadMemberships = useCallback(async () => {
        try {
          const response = await request<readonly Membership[]>('/api/account/memberships');
          setMemberships(response);
          setMembershipId((current) => current || response[0]?.membership_id || '');
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        }
      }, [request]);

      const loadIntakes = useCallback(async () => {
        if (membershipId.length === 0) return;
        try {
          const response = await request<{ readonly items: readonly IntakeSummary[] }>(
            '/api/core/organizations/current/people-intakes?limit=100',
            {},
            true,
          );
          setIntakes(response.items);
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        }
      }, [membershipId, request]);

      useEffect(() => {
        void loadMemberships();
      }, [loadMemberships]);

      useEffect(() => {
        void loadIntakes();
      }, [loadIntakes]);

      function updatePerson(localIdValue: string, patch: Partial<DraftPerson>): void {
        setDraft((current) => ({
          ...current,
          people: current.people.map((person) =>
            person.localId === localIdValue ? { ...person, ...patch } : person,
          ),
        }));
      }

      function updateIdentifier(
        personLocalId: string,
        identifierLocalId: string,
        patch: Partial<DraftIdentifier>,
      ): void {
        setDraft((current) => ({
          ...current,
          people: current.people.map((person) =>
            person.localId === personLocalId
              ? {
                  ...person,
                  identifiers: person.identifiers.map((identifier) =>
                    identifier.localId === identifierLocalId ? { ...identifier, ...patch } : identifier,
                  ),
                }
              : person,
          ),
        }));
      }

      function updateRelationship(localIdValue: string, patch: Partial<DraftRelationship>): void {
        setDraft((current) => ({
          ...current,
          relationships: current.relationships.map((relationship) =>
            relationship.localId === localIdValue ? { ...relationship, ...patch } : relationship,
          ),
        }));
      }

      async function saveDraft(): Promise<void> {
        if (issues.length > 0) {
          setMessage({ tone: 'error', text: 'Resolve the validation issues before saving.' });
          return;
        }
        setBusy(true);
        try {
          const base = draftToApiBody(draft);
          const record =
            draft.intakeId === null
              ? await request<IntakeRecord>(
                  '/api/core/organizations/current/people-intakes',
                  { method: 'POST', body: JSON.stringify(base) },
                  true,
                )
              : await request<IntakeRecord>(
                  `/api/core/organizations/current/people-intakes/${draft.intakeId}`,
                  {
                    method: 'PUT',
                    body: JSON.stringify({ ...base, expected_version: draft.version }),
                  },
                  true,
                );
          setDraft(fromRecord(record));
          setMessage({ tone: 'success', text: `Draft saved at version ${String(record.version)}.` });
          await loadIntakes();
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        } finally {
          setBusy(false);
        }
      }

      async function submitDraft(): Promise<void> {
        if (draft.intakeId === null || draft.version === null) {
          setMessage({ tone: 'error', text: 'Save the draft before submission.' });
          return;
        }
        setBusy(true);
        try {
          const record = await request<IntakeRecord>(
            `/api/core/organizations/current/people-intakes/${draft.intakeId}/submit`,
            { method: 'POST', body: JSON.stringify({ expected_version: draft.version }) },
            true,
          );
          setDraft(fromRecord(record));
          setMessage({ tone: 'success', text: 'Submitted for independent verification. The content is now immutable.' });
          await loadIntakes();
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        } finally {
          setBusy(false);
        }
      }

      async function openReview(id: string): Promise<void> {
        setBusy(true);
        try {
          const record = await request<IntakeRecord>(
            `/api/core/organizations/current/people-intakes/${id}`,
            {},
            true,
          );
          setReviewRecord(record);
          setReviewNotes('');
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        } finally {
          setBusy(false);
        }
      }

      async function decide(decision: 'approved' | 'rejected'): Promise<void> {
        if (reviewRecord === null) return;
        if (decision === 'rejected' && reviewNotes.trim().length === 0) {
          setMessage({ tone: 'error', text: 'Add reviewer notes before rejecting.' });
          return;
        }
        setBusy(true);
        try {
          const record = await request<IntakeRecord>(
            `/api/core/organizations/current/people-intakes/${reviewRecord.id}/review`,
            {
              method: 'POST',
              body: JSON.stringify({
                expected_version: reviewRecord.version,
                decision,
                notes: reviewNotes.trim().length === 0 ? null : reviewNotes,
              }),
            },
            true,
          );
          setReviewRecord(record);
          setMessage({ tone: 'success', text: decision === 'approved' ? 'Intake approved. No canonical people were created.' : 'Intake rejected with reviewer notes.' });
          await loadIntakes();
        } catch (error) {
          setMessage({ tone: 'error', text: messageFrom(error) });
        } finally {
          setBusy(false);
        }
      }

      const editable = draft.status === 'draft';

      return (
        <main className={styles.shell}>
          <header className={styles.header}>
            <div>
              <a className={styles.brand} href="/">NEWAX</a>
              <p className={styles.kicker}>People Intake · Internal Operations</p>
              <h1>Family data entry and verification</h1>
              <p className={styles.lead}>
                Enter proposed people and relationships, verify the complete family picture, and keep unreviewed data outside the canonical registry.
              </p>
            </div>
            <div className={styles.securityCard}>
              <strong>Controlled staging</strong>
              <span>Drafts and approvals do not create canonical people.</span>
            </div>
          </header>

          <section className={styles.contextBar} aria-label="Organization context">
            <label>
              Organization
              <select value={membershipId} onChange={(event) => setMembershipId(event.target.value)}>
                <option value="">Select organization</option>
                {memberships.map((membership) => (
                  <option key={membership.membership_id} value={membership.membership_id}>
                    {membership.organization_display_name} · {membership.membership_type}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span>Current context</span>
              <strong>{selectedMembership?.organization_display_name ?? 'No organization selected'}</strong>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadIntakes()} disabled={busy || membershipId.length === 0}>
              Refresh queue
            </button>
          </section>

          <div className={`${styles.message} ${styles[message.tone]}`} role="status">
            {message.text}
          </div>

          <div className={styles.workspace}>
            <section className={styles.editor} aria-labelledby="draft-title">
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.eyebrow}>Draft workspace</p>
                  <h2 id="draft-title">Enter the family record</h2>
                </div>
                <span className={styles.statusBadge} data-status={draft.status}>{draft.status}</span>
              </div>

              <div className={styles.metadataGrid}>
                <label>Intake title<input value={draft.title} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Family certificate review" /></label>
                <label>Source type<input value={draft.sourceType} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, sourceType: event.target.value }))} placeholder="nadra_crc" /></label>
                <label>Source reference<input value={draft.sourceReference} disabled={!editable} onChange={(event) => setDraft((current) => ({ ...current, sourceReference: event.target.value }))} placeholder="Internal document reference" /></label>
              </div>

              <div className={styles.blockHeader}>
                <div><p className={styles.eyebrow}>People</p><h3>One card per real human</h3></div>
                <button type="button" className={styles.secondaryButton} disabled={!editable} onClick={() => setDraft((current) => ({ ...current, people: [...current.people, emptyPerson(localId('person'), `person_${String(current.people.length + 1)}`)] }))}>Add person</button>
              </div>

              <div className={styles.peopleList}>
                {draft.people.map((person, personIndex) => (
                  <article key={person.localId} className={styles.personCard}>
                    <div className={styles.cardTitle}><div><span>Person {personIndex + 1}</span><strong>{[person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unnamed person'}</strong></div><button type="button" className={styles.textButton} disabled={!editable || draft.people.length === 1} onClick={() => setDraft((current) => ({ ...current, people: current.people.filter((item) => item.localId !== person.localId), relationships: current.relationships.filter((item) => item.sourcePersonKey !== person.clientKey && item.targetPersonKey !== person.clientKey) }))}>Remove</button></div>
                    <div className={styles.personGrid}>
                      <label>Person key<input value={person.clientKey} disabled={!editable} onChange={(event) => updatePerson(person.localId, { clientKey: event.target.value })} /></label>
                      <label>First name<input value={person.firstName} disabled={!editable} onChange={(event) => updatePerson(person.localId, { firstName: event.target.value })} /></label>
                      <label>Middle name<input value={person.middleName} disabled={!editable} onChange={(event) => updatePerson(person.localId, { middleName: event.target.value })} /></label>
                      <label>Last name<input value={person.lastName} disabled={!editable} onChange={(event) => updatePerson(person.localId, { lastName: event.target.value })} /></label>
                      <label>Preferred name<input value={person.preferredName} disabled={!editable} onChange={(event) => updatePerson(person.localId, { preferredName: event.target.value })} /></label>
                      <label>Date of birth<input type="date" value={person.dateOfBirth} disabled={!editable} onChange={(event) => updatePerson(person.localId, { dateOfBirth: event.target.value })} /></label>
                      <label>Gender code<input value={person.gender} disabled={!editable} onChange={(event) => updatePerson(person.localId, { gender: event.target.value })} placeholder="female" /></label>
                    </div>
                    <div className={styles.identifierHeader}><strong>Official identifiers</strong><button type="button" className={styles.textButton} disabled={!editable} onClick={() => updatePerson(person.localId, { identifiers: [...person.identifiers, emptyIdentifier(localId('identifier'))] })}>Add identifier</button></div>
                    {person.identifiers.length === 0 ? <p className={styles.empty}>No identifier added. Names alone do not prove identity.</p> : null}
                    {person.identifiers.map((identifier) => (
                      <div key={identifier.localId} className={styles.identifierRow}>
                        <label>Type<input value={identifier.identifierType} disabled={!editable} onChange={(event) => updateIdentifier(person.localId, identifier.localId, { identifierType: event.target.value })} /></label>
                        <label>Value<input value={identifier.identifierValue} disabled={!editable} autoComplete="off" onChange={(event) => updateIdentifier(person.localId, identifier.localId, { identifierValue: event.target.value })} /></label>
                        <label>Country<input value={identifier.issuingCountryCode} disabled={!editable} onChange={(event) => updateIdentifier(person.localId, identifier.localId, { issuingCountryCode: event.target.value })} /></label>
                        <label>Authority<input value={identifier.issuingAuthority} disabled={!editable} onChange={(event) => updateIdentifier(person.localId, identifier.localId, { issuingAuthority: event.target.value })} /></label>
                        <button type="button" className={styles.textButton} disabled={!editable} onClick={() => updatePerson(person.localId, { identifiers: person.identifiers.filter((item) => item.localId !== identifier.localId) })}>Remove</button>
                      </div>
                    ))}
                  </article>
                ))}
              </div>

              <div className={styles.blockHeader}>
                <div><p className={styles.eyebrow}>Relationships</p><h3>Connect existing draft people</h3></div>
                <button type="button" className={styles.secondaryButton} disabled={!editable || draft.people.length < 2} onClick={() => setDraft((current) => ({ ...current, relationships: [...current.relationships, emptyRelationship(localId('relationship'), current.people[0]?.clientKey ?? '', current.people[1]?.clientKey ?? '')] }))}>Add relationship</button>
              </div>

              {draft.relationships.length === 0 ? <p className={styles.emptyPanel}>No relationships added yet.</p> : (
                <div className={styles.relationshipList}>
                  {draft.relationships.map((relationship) => (
                    <div key={relationship.localId} className={styles.relationshipRow}>
                      <label>From<select value={relationship.sourcePersonKey} disabled={!editable} onChange={(event) => updateRelationship(relationship.localId, { sourcePersonKey: event.target.value })}>{draft.people.map((person) => <option key={person.localId} value={person.clientKey}>{person.clientKey || 'unnamed'}</option>)}</select></label>
                      <label>Relationship<input value={relationship.relationshipType} disabled={!editable} onChange={(event) => updateRelationship(relationship.localId, { relationshipType: event.target.value })} /></label>
                      <label>Role<input value={relationship.relationshipRole} disabled={!editable} onChange={(event) => updateRelationship(relationship.localId, { relationshipRole: event.target.value })} /></label>
                      <label>Basis<input value={relationship.relationshipBasis} disabled={!editable} onChange={(event) => updateRelationship(relationship.localId, { relationshipBasis: event.target.value })} /></label>
                      <label>To<select value={relationship.targetPersonKey} disabled={!editable} onChange={(event) => updateRelationship(relationship.localId, { targetPersonKey: event.target.value })}>{draft.people.map((person) => <option key={person.localId} value={person.clientKey}>{person.clientKey || 'unnamed'}</option>)}</select></label>
                      <button type="button" className={styles.textButton} disabled={!editable} onClick={() => setDraft((current) => ({ ...current, relationships: current.relationships.filter((item) => item.localId !== relationship.localId) }))}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => { setDraft(initialFamilyIntakeDraft()); setMessage({ tone: 'neutral', text: 'New unsaved draft started.' }); }}>New draft</button>
                <button type="button" disabled={busy || !editable || membershipId.length === 0} onClick={() => void saveDraft()}>{busy ? 'Working…' : draft.intakeId === null ? 'Save draft' : 'Save changes'}</button>
                <button type="button" className={styles.submitButton} disabled={busy || !editable || draft.intakeId === null || issues.length > 0} onClick={() => void submitDraft()}>Submit for verification</button>
              </div>
            </section>

            <aside className={styles.sidebar}>
              <section className={styles.panel}>
                <p className={styles.eyebrow}>Validation</p>
                <h2>{issues.length === 0 ? 'Ready to save' : `${String(issues.length)} issue${issues.length === 1 ? '' : 's'}`}</h2>
                {issues.length === 0 ? <p className={styles.successText}>The draft has a valid local structure. Server validation still applies.</p> : <ul className={styles.issueList}>{issues.slice(0, 12).map((item) => <li key={`${item.field}-${item.message}`}><strong>{item.field}</strong><span>{item.message}</span></li>)}</ul>}
              </section>

              <section className={styles.panel}>
                <p className={styles.eyebrow}>Family preview</p>
                <h2>Understand the links</h2>
                {draft.relationships.length === 0 ? <p className={styles.empty}>Add relationships to see a readable preview.</p> : <div className={styles.previewList}>{draft.relationships.map((relationship) => <div key={relationship.localId} className={styles.previewLink}><strong>{personLabel(draft.people, relationship.sourcePersonKey)}</strong><span>{relationship.relationshipType} · {relationship.relationshipRole} · {relationship.relationshipBasis}</span><strong>{personLabel(draft.people, relationship.targetPersonKey)}</strong></div>)}</div>}
                <div className={styles.maskedList}>{draft.people.flatMap((person) => person.identifiers.map((identifier) => <div key={identifier.localId}><span>{personLabel(draft.people, person.clientKey)}</span><code>{identifier.identifierType}: {maskIdentifier(identifier.identifierValue)}</code></div>))}</div>
              </section>

              <section className={styles.panel}>
                <div className={styles.blockHeader}><div><p className={styles.eyebrow}>Verification queue</p><h2>{String(reviewQueue.length)} waiting</h2></div></div>
                {reviewQueue.length === 0 ? <p className={styles.empty}>No submitted intakes in this organization.</p> : <div className={styles.queueList}>{reviewQueue.map((item) => <button type="button" key={item.id} className={styles.queueItem} onClick={() => void openReview(item.id)}><strong>{item.title}</strong><span>{item.person_count} people · {item.relationship_count} relationships</span><small>{item.submitted_at === null ? 'Submission time unavailable' : new Date(item.submitted_at).toLocaleString()}</small></button>)}</div>}
              </section>
            </aside>
          </div>

          {reviewRecord !== null ? (
            <section className={styles.reviewPanel} aria-labelledby="review-title">
              <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Independent verification</p><h2 id="review-title">{reviewRecord.title}</h2></div><button type="button" className={styles.textButton} onClick={() => setReviewRecord(null)}>Close review</button></div>
              <div className={styles.reviewSummary}><div><span>Source</span><strong>{reviewRecord.source_type}</strong></div><div><span>People</span><strong>{reviewRecord.person_count}</strong></div><div><span>Relationships</span><strong>{reviewRecord.relationship_count}</strong></div><div><span>Version</span><strong>{reviewRecord.version}</strong></div></div>
              <div className={styles.reviewPeople}>{reviewRecord.payload.people.map((person) => <article key={person.client_key}><h3>{person.first_name} {person.middle_name ?? ''} {person.last_name}</h3><p>{person.date_of_birth ?? 'Date of birth not supplied'} · {person.gender ?? 'Gender not supplied'}</p>{person.identifiers.map((identifier) => <div key={`${person.client_key}-${identifier.identifier_type}-${identifier.identifier_value}`} className={styles.sensitiveValue}><span>{identifier.identifier_type}</span><code>{identifier.identifier_value}</code><small>{identifier.issuing_authority ?? 'Authority not supplied'} · {identifier.issuing_country_code ?? 'Country not supplied'}</small></div>)}</article>)}</div>
              <div className={styles.reviewRelationships}>{reviewRecord.payload.relationships.map((relationship, index) => <div key={`${relationship.source_person_key}-${relationship.target_person_key}-${String(index)}`}><strong>{relationship.source_person_key}</strong><span>{relationship.relationship_type} / {relationship.relationship_role} / {relationship.relationship_basis}</span><strong>{relationship.target_person_key}</strong></div>)}</div>
              {reviewRecord.status === 'submitted' ? <div className={styles.reviewDecision}><label>Reviewer notes<textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Required for rejection; optional for approval." /></label><div><button type="button" className={styles.rejectButton} disabled={busy} onClick={() => void decide('rejected')}>Reject with notes</button><button type="button" disabled={busy} onClick={() => void decide('approved')}>Approve intake</button></div></div> : <p className={styles.decisionNotice}>Decision: <strong>{reviewRecord.status}</strong>. Approval does not create canonical people.</p>}
            </section>
          ) : null}
        </main>
      );
    }

    function csrfCookie(): string | null {
      const prefix = '__Host-newax_csrf=';
      const item = document.cookie.split(';').map((value) => value.trim()).find((value) => value.startsWith(prefix));
      return item === undefined ? null : decodeURIComponent(item.slice(prefix.length));
    }

    function errorMessage(payload: unknown): string | null {
      if (typeof payload !== 'object' || payload === null || !('error' in payload)) return null;
      const error = (payload as { readonly error?: unknown }).error;
      if (typeof error !== 'object' || error === null || !('message' in error)) return null;
      const message = (error as { readonly message?: unknown }).message;
      return typeof message === 'string' ? message : null;
    }

    function messageFrom(error: unknown): string {
      return error instanceof Error ? error.message : 'The request could not be completed.';
    }

    function personLabel(people: readonly DraftPerson[], key: string): string {
      const person = people.find((item) => item.clientKey === key);
      if (person === undefined) return key || 'Unknown person';
      return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.clientKey;
    }

    function fromRecord(record: IntakeRecord): FamilyIntakeDraft {
      return {
        intakeId: record.id,
        version: record.version,
        status: record.status,
        title: record.title,
        sourceType: record.source_type,
        sourceReference: record.source_reference ?? '',
        people: record.payload.people.map((person, personIndex) => ({
          localId: `loaded-person-${String(personIndex)}-${person.client_key}`,
          clientKey: person.client_key,
          firstName: person.first_name,
          middleName: person.middle_name ?? '',
          lastName: person.last_name,
          preferredName: person.preferred_name ?? '',
          dateOfBirth: person.date_of_birth ?? '',
          gender: person.gender ?? '',
          identifiers: person.identifiers.map((identifier, identifierIndex) => ({
            localId: `loaded-identifier-${String(personIndex)}-${String(identifierIndex)}`,
            identifierType: identifier.identifier_type,
            identifierValue: identifier.identifier_value,
            issuingAuthority: identifier.issuing_authority ?? '',
            issuingCountryCode: identifier.issuing_country_code ?? '',
          })),
        })),
        relationships: record.payload.relationships.map((relationship, index) => ({
          localId: `loaded-relationship-${String(index)}`,
          sourcePersonKey: relationship.source_person_key,
          targetPersonKey: relationship.target_person_key,
          relationshipType: relationship.relationship_type,
          relationshipRole: relationship.relationship_role,
          relationshipBasis: relationship.relationship_basis,
        })),
      };
    }
    ''',
)
write(
    "apps/web/src/app/internal/people-intake/people-intake-dashboard.module.css",
    '''
    .shell {
      min-height: 100vh;
      padding: clamp(1rem, 3vw, 2.5rem);
      background: #eef2f5;
      color: #10202c;
    }

    .header,
    .contextBar,
    .workspace,
    .reviewPanel,
    .message {
      width: min(100%, 1540px);
      margin-inline: auto;
    }

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: clamp(1.5rem, 4vw, 3.5rem);
      border: 1px solid #cad5dd;
      border-radius: 28px;
      background: #0e2638;
      color: #fff;
      gap: 2rem;
    }

    .brand { font-weight: 850; letter-spacing: .22em; text-decoration: none; }
    .kicker,.eyebrow { margin: 1rem 0 .6rem; color: #4e8cac; font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .header .kicker { color: #9cc7db; }
    .header h1 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 5vw, 5rem); }
    .lead { max-width: 720px; margin: 1.4rem 0 0; color: #d7e4eb; font-size: 1.08rem; }
    .securityCard { display: grid; max-width: 280px; padding: 1.25rem; border: 1px solid #31536a; border-radius: 18px; background: #132f42; gap: .35rem; }
    .securityCard span { color: #b9ceda; font-size: .88rem; }

    .contextBar { display: grid; grid-template-columns: minmax(260px,1fr) minmax(220px,1fr) auto; align-items: end; margin-top: 1rem; padding: 1rem 1.25rem; border: 1px solid #cad5dd; border-radius: 18px; background: #fff; gap: 1rem; }
    .contextBar > div { display: grid; gap: .2rem; }
    .contextBar span { color: #61717d; font-size: .76rem; text-transform: uppercase; letter-spacing: .08em; }

    .message { margin-top: 1rem; padding: .9rem 1.1rem; border: 1px solid #cad5dd; border-radius: 14px; background: #fff; }
    .message.success { border-color: #80b49b; background: #edf8f1; color: #174d31; }
    .message.error { border-color: #d9a2a2; background: #fff2f2; color: #742222; }
    .message.neutral { color: #4e5f6b; }

    .workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, .38fr); align-items: start; margin-top: 1rem; gap: 1rem; }
    .editor,.panel,.reviewPanel { border: 1px solid #cad5dd; border-radius: 22px; background: #fff; box-shadow: 0 18px 50px rgb(16 32 44 / 6%); }
    .editor { padding: clamp(1rem, 2.5vw, 2rem); }
    .sidebar { display: grid; gap: 1rem; position: sticky; top: 1rem; }
    .panel { padding: 1.25rem; }
    .panel h2,.sectionHeader h2,.blockHeader h3 { margin: 0; }
    .sectionHeader,.blockHeader,.cardTitle,.identifierHeader { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .blockHeader { margin: 2rem 0 1rem; }
    .statusBadge { padding: .4rem .75rem; border-radius: 999px; background: #e7edf1; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .statusBadge[data-status='submitted'] { background: #fff1c6; color: #6b4d00; }
    .statusBadge[data-status='approved'] { background: #daf3e4; color: #175b35; }
    .statusBadge[data-status='rejected'] { background: #f8dede; color: #702323; }

    .metadataGrid,.personGrid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .85rem; }
    label { display: grid; color: #53646f; font-size: .78rem; font-weight: 750; gap: .35rem; }
    input,select,textarea { width: 100%; min-height: 44px; padding: .65rem .75rem; border: 1px solid #bcc9d1; border-radius: 10px; background: #fff; color: #10202c; font: inherit; }
    textarea { min-height: 110px; resize: vertical; }
    input:focus,select:focus,textarea:focus { outline: 3px solid rgb(41 115 151 / 18%); border-color: #297397; }
    input:disabled,select:disabled,textarea:disabled { background: #eef2f4; color: #657680; }

    .peopleList { display: grid; gap: 1rem; }
    .personCard { padding: 1.2rem; border: 1px solid #d2dbe1; border-radius: 16px; background: #f9fbfc; }
    .cardTitle span { display: block; color: #6b7a84; font-size: .72rem; text-transform: uppercase; }
    .cardTitle strong { font-size: 1.05rem; }
    .personGrid { margin-top: 1rem; }
    .identifierHeader { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #dbe2e7; }
    .identifierRow { display: grid; grid-template-columns: .6fr 1.35fr .45fr .9fr auto; align-items: end; margin-top: .75rem; gap: .6rem; }

    button { min-height: 42px; padding: .65rem 1rem; border: 1px solid #174e6b; border-radius: 10px; background: #174e6b; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
    button:hover:not(:disabled) { background: #103b52; }
    button:disabled { cursor: not-allowed; opacity: .5; }
    .secondaryButton { border-color: #9fb0bb; background: #fff; color: #1c4157; }
    .secondaryButton:hover:not(:disabled) { background: #edf3f6; }
    .textButton { min-height: auto; padding: .35rem; border: 0; background: transparent; color: #315b70; font-size: .78rem; }
    .textButton:hover:not(:disabled) { background: #e8f0f4; }
    .submitButton { background: #286d50; border-color: #286d50; }
    .rejectButton { background: #fff; color: #8a2d2d; border-color: #c98e8e; }
    .rejectButton:hover:not(:disabled) { background: #fff0f0; }

    .relationshipList { display: grid; gap: .7rem; }
    .relationshipRow { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; align-items: end; padding: .9rem; border: 1px solid #d3dde3; border-radius: 12px; background: #f8fafb; gap: .6rem; }
    .actions { display: flex; flex-wrap: wrap; justify-content: flex-end; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid #d5dee4; gap: .7rem; }
    .empty,.emptyPanel { color: #6b7982; font-size: .9rem; }
    .emptyPanel { padding: 1.5rem; border: 1px dashed #bbc8d0; border-radius: 12px; text-align: center; }

    .issueList,.queueList,.previewList,.maskedList { display: grid; margin: 1rem 0 0; padding: 0; list-style: none; gap: .65rem; }
    .issueList li { display: grid; padding: .7rem; border-radius: 10px; background: #fff4e8; gap: .2rem; }
    .issueList strong { font-size: .72rem; color: #845112; }
    .issueList span { font-size: .85rem; }
    .successText { color: #286d50; }
    .previewLink { display: grid; grid-template-columns: 1fr; padding: .75rem; border-left: 3px solid #377b9c; background: #f1f6f8; gap: .25rem; }
    .previewLink span { color: #647781; font-size: .78rem; }
    .maskedList > div { display: flex; justify-content: space-between; padding: .55rem 0; border-bottom: 1px solid #e0e6ea; gap: 1rem; }
    code { font-family: ui-monospace,SFMono-Regular,Consolas,monospace; }
    .queueItem { display: grid; width: 100%; padding: .8rem; border-color: #d0dbe1; background: #f8fafb; color: #172d3a; text-align: left; gap: .2rem; }
    .queueItem:hover:not(:disabled) { background: #edf4f7; }
    .queueItem span,.queueItem small { color: #62727c; }

    .reviewPanel { margin-top: 1rem; padding: clamp(1rem,3vw,2rem); }
    .reviewSummary { display: grid; grid-template-columns: repeat(4,1fr); margin: 1.25rem 0; gap: .75rem; }
    .reviewSummary > div { display: grid; padding: .9rem; border-radius: 12px; background: #edf3f6; gap: .2rem; }
    .reviewSummary span { color: #60717d; font-size: .72rem; text-transform: uppercase; }
    .reviewPeople { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: .8rem; }
    .reviewPeople article { padding: 1rem; border: 1px solid #d0dae0; border-radius: 14px; }
    .reviewPeople h3 { margin-bottom: .35rem; }
    .reviewPeople p { color: #62727d; font-size: .85rem; }
    .sensitiveValue { display: grid; margin-top: .65rem; padding: .75rem; border: 1px solid #e2c98a; border-radius: 10px; background: #fff9e9; gap: .2rem; }
    .sensitiveValue span { color: #73571b; font-size: .68rem; text-transform: uppercase; }
    .sensitiveValue small { color: #6c6553; }
    .reviewRelationships { display: grid; margin-top: 1rem; gap: .6rem; }
    .reviewRelationships > div { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: .8rem; border-radius: 10px; background: #f0f5f7; gap: 1rem; }
    .reviewRelationships strong:last-child { text-align: right; }
    .reviewDecision { display: grid; grid-template-columns: 1fr auto; align-items: end; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #d5dee4; gap: 1rem; }
    .reviewDecision > div { display: flex; gap: .7rem; }
    .decisionNotice { margin: 1rem 0 0; padding: 1rem; border-radius: 12px; background: #edf3f6; }

    @media (max-width: 1180px) {
      .workspace { grid-template-columns: 1fr; }
      .sidebar { position: static; grid-template-columns: repeat(3,minmax(0,1fr)); }
      .relationshipRow { grid-template-columns: repeat(3,1fr); }
      .reviewPeople { grid-template-columns: repeat(2,minmax(0,1fr)); }
    }

    @media (max-width: 820px) {
      .header { display: grid; }
      .securityCard { max-width: none; }
      .contextBar,.metadataGrid,.personGrid,.sidebar,.reviewSummary,.reviewPeople { grid-template-columns: 1fr; }
      .identifierRow,.relationshipRow { grid-template-columns: 1fr 1fr; }
      .reviewDecision { grid-template-columns: 1fr; }
      .reviewDecision > div { flex-wrap: wrap; }
    }

    @media (max-width: 560px) {
      .shell { padding: .6rem; }
      .header,.editor,.panel,.reviewPanel { border-radius: 16px; }
      .identifierRow,.relationshipRow { grid-template-columns: 1fr; }
      .reviewRelationships > div { grid-template-columns: 1fr; }
      .reviewRelationships strong:last-child { text-align: left; }
      .actions { justify-content: stretch; }
      .actions button { width: 100%; }
    }
    ''',
)

readme_path = Path("README.md")
readme = readme_path.read_text()
readme = replace_once(
    readme,
    "- A Next.js web application\n- PostgreSQL and Prisma database infrastructure",
    "- A Next.js web application\n- An internal People Intake data-entry and verification workspace\n- PostgreSQL and Prisma database infrastructure",
    "root README dashboard status",
)
readme_path.write_text(readme)

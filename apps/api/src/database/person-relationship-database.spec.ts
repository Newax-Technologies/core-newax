import { randomUUID } from 'node:crypto';

import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;

interface RelationshipFixture {
  readonly tenantId: string;
  readonly personIds: readonly string[];
}

async function createFixture(
  client: PoolClient,
  personCount: number,
): Promise<RelationshipFixture> {
  const tenantId = randomUUID();

  await client.query(
    `INSERT INTO "core_tenants" ("id", "name", "updated_at")
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [tenantId, `Relationship test ${tenantId}`],
  );

  const personIds = Array.from({ length: personCount }, () => randomUUID());
  for (const [index, personId] of personIds.entries()) {
    await client.query(
      `INSERT INTO "core_people" (
         "id",
         "first_name",
         "last_name",
         "updated_at"
       ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [personId, `Person${index + 1}`, 'RelationshipTest'],
    );
  }

  return { tenantId, personIds };
}

async function insertParentRelationship(
  client: PoolClient,
  fixture: RelationshipFixture,
  sourcePersonId: string,
  targetPersonId: string,
  overrides: {
    readonly id?: string;
    readonly validUntil?: string | null;
    readonly isVerified?: boolean;
    readonly verifiedAt?: string | null;
    readonly verificationSource?: string | null;
  } = {},
): Promise<void> {
  await client.query(
    `INSERT INTO "core_person_relationships" (
       "id",
       "tenant_id",
       "source_person_id",
       "target_person_id",
       "relationship_type",
       "relationship_role",
       "relationship_basis",
       "valid_until",
       "is_verified",
       "verified_at",
       "verification_source"
     ) VALUES ($1, $2, $3, $4, 'parent_of', 'parent', 'declared', $5, $6, $7, $8)`,
    [
      overrides.id ?? randomUUID(),
      fixture.tenantId,
      sourcePersonId,
      targetPersonId,
      overrides.validUntil ?? null,
      overrides.isVerified ?? false,
      overrides.verifiedAt ?? null,
      overrides.verificationSource ?? null,
    ],
  );
}

describe.skipIf(!databaseUrl)('person relationship PostgreSQL integrity', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    await pool.query('SELECT 1');
  });

  afterAll(async () => {
    await pool.end();
  });

  async function withTransaction(
    assertion: (client: PoolClient) => Promise<void>,
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await assertion(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  it('stores one verified parent relationship between two people', async () => {
    await withTransaction(async (client) => {
      const fixture = await createFixture(client, 2);
      const [parentId, childId] = fixture.personIds;

      await insertParentRelationship(client, fixture, parentId, childId, {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        verificationSource: 'nadra_crc',
      });

      const result = await client.query<{
        relationship_type: string;
        is_verified: boolean;
      }>(
        `SELECT "relationship_type", "is_verified"
         FROM "core_person_relationships"
         WHERE "tenant_id" = $1`,
        [fixture.tenantId],
      );

      expect(result.rows).toEqual([
        { relationship_type: 'parent_of', is_verified: true },
      ]);
    });
  });

  it('rejects a relationship from a person to the same person', async () => {
    await withTransaction(async (client) => {
      const fixture = await createFixture(client, 1);
      const [personId] = fixture.personIds;

      await expect(
        insertParentRelationship(client, fixture, personId, personId),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('rejects duplicate active relationships even when an end date is scheduled', async () => {
    await withTransaction(async (client) => {
      const fixture = await createFixture(client, 2);
      const [parentId, childId] = fixture.personIds;
      const validUntil = new Date(Date.now() + 86_400_000)
        .toISOString()
        .slice(0, 10);

      await insertParentRelationship(client, fixture, parentId, childId, {
        validUntil,
      });

      await expect(
        insertParentRelationship(client, fixture, parentId, childId, {
          validUntil,
        }),
      ).rejects.toMatchObject({ code: '23505' });
    });
  });

  it('rejects a verified relationship without verification evidence', async () => {
    await withTransaction(async (client) => {
      const fixture = await createFixture(client, 2);
      const [parentId, childId] = fixture.personIds;

      await expect(
        insertParentRelationship(client, fixture, parentId, childId, {
          isVerified: true,
        }),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  it('rejects an active parentage cycle', async () => {
    await withTransaction(async (client) => {
      const fixture = await createFixture(client, 3);
      const [firstPersonId, secondPersonId, thirdPersonId] = fixture.personIds;

      await insertParentRelationship(
        client,
        fixture,
        firstPersonId,
        secondPersonId,
      );
      await insertParentRelationship(
        client,
        fixture,
        secondPersonId,
        thirdPersonId,
      );

      await expect(
        insertParentRelationship(
          client,
          fixture,
          thirdPersonId,
          firstPersonId,
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
});

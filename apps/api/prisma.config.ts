import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { defineConfig } from 'prisma/config';

const environmentPaths = ['.env.local', '.env'].map((filename) =>
  resolve(import.meta.dirname, filename),
);

for (const environmentPath of environmentPaths) {
  if (existsSync(environmentPath)) {
    loadEnvFile(environmentPath);
  }
}

function readDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return '';
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (parsedUrl.protocol !== 'postgresql:' && parsedUrl.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use the postgresql:// or postgres:// protocol.');
  }

  return databaseUrl;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: readDatabaseUrl(),
  },
});

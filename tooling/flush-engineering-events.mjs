import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createOrUpdateLearningIssue } from './engineering-learning-core.mjs';

const queuePath = resolve(process.cwd(), '.newax/engineering-events.ndjson');

if (!existsSync(queuePath)) {
  console.log('No local engineering events are queued.');
  process.exit(0);
}

if (process.env.GITHUB_TOKEN === undefined || process.env.GITHUB_REPOSITORY === undefined) {
  throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required to flush local events.');
}

const events = readFileSync(queuePath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const results = [];
for (const event of events) {
  results.push(await createOrUpdateLearningIssue(event));
}

writeFileSync(queuePath, '', 'utf8');
console.log(JSON.stringify({ flushed: results.length, results }));

import { readFileSync } from 'node:fs';

const REQUIRED_HEADINGS = [
  '## Scope',
  '## Acceptance criteria',
  '## Verification',
  '## Engineering learning record',
  '## Repository freeze and evidence',
  '## Known issues',
  '## Merge policy',
];

const REQUIRED_FIELDS = [
  '- Learning outcome:',
  '- Ledger entry:',
  '- Successful method used:',
  '- Unsuccessful method avoided:',
  '- New prevention control:',
  '- Ledger consulted before implementation:',
  '- Head commit:',
  '- Exact-head CI:',
  '- Repository-content freeze:',
  '- Source file contains the workflow run that verifies itself:',
  '- Repository file action used for pull-request metadata:',
];

function fail(messages) {
  console.error('Pull-request governance validation failed:');
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

function extractField(body, label) {
  const line = body
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.startsWith(label));

  if (line === undefined) {
    return null;
  }

  return line.slice(label.length).trim().replaceAll('`', '');
}

const eventPath = process.env.GITHUB_EVENT_PATH;

if (eventPath === undefined || eventPath.length === 0) {
  fail(['GITHUB_EVENT_PATH is unavailable.']);
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const body = event.pull_request?.body ?? '';
const errors = [];

for (const heading of REQUIRED_HEADINGS) {
  if (!body.includes(heading)) {
    errors.push(`Missing required heading: ${heading}`);
  }
}

for (const field of REQUIRED_FIELDS) {
  if (!body.includes(field)) {
    errors.push(`Missing required field: ${field}`);
  }
}

const learningOutcome = extractField(body, '- Learning outcome:');
const ledgerEntry = extractField(body, '- Ledger entry:');
const ledgerConsulted = extractField(body, '- Ledger consulted before implementation:');
const sourceSelfReference = extractField(
  body,
  '- Source file contains the workflow run that verifies itself:',
);
const wrongMetadataAction = extractField(
  body,
  '- Repository file action used for pull-request metadata:',
);

if (!['new', 'none'].includes(learningOutcome ?? '')) {
  errors.push('Learning outcome must be `new` or `none`.');
}

if (learningOutcome === 'new') {
  if (ledgerEntry === null || !/^EL-\d{4}$/.test(ledgerEntry)) {
    errors.push('A new learning outcome requires a ledger entry such as EL-0018.');
  }
}

if (learningOutcome === 'none' && ledgerEntry !== 'not-required') {
  errors.push('A `none` learning outcome requires `not-required` as the ledger entry.');
}

if (ledgerConsulted !== 'yes') {
  errors.push('The engineering learning ledger must be consulted before implementation.');
}

if (sourceSelfReference !== 'no') {
  errors.push('Source files must not contain the workflow run that verifies themselves.');
}

if (wrongMetadataAction !== 'no') {
  errors.push('Repository file actions must not be used for pull-request metadata.');
}

if (errors.length > 0) {
  fail(errors);
}

console.log('Pull-request governance record is present and structurally valid.');

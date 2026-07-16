import { readFileSync } from 'node:fs';

import {
  parseIssueNumbers,
  parseLedgerEntries,
  parsePullRequestField,
} from './engineering-learning-core.mjs';

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
  '- Ledger entries:',
  '- Learning issues:',
  '- Root-cause status:',
  '- Root-cause evidence:',
  '- Resolution evidence:',
  '- Successful method used:',
  '- Unsuccessful method avoided:',
  '- New prevention control:',
  '- Ledger consulted before implementation:',
  '- Failure history reconciled:',
  '- External and tool events reconciled:',
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

const learningOutcome = parsePullRequestField(body, '- Learning outcome:');
const ledgerEntriesValue = parsePullRequestField(body, '- Ledger entries:');
const ledgerEntries = parseLedgerEntries(ledgerEntriesValue);
const learningIssuesValue = parsePullRequestField(body, '- Learning issues:');
const learningIssues = parseIssueNumbers(learningIssuesValue);
const rootCauseStatus = parsePullRequestField(body, '- Root-cause status:');
const ledgerConsulted = parsePullRequestField(body, '- Ledger consulted before implementation:');
const failureHistoryReconciled = parsePullRequestField(body, '- Failure history reconciled:');
const externalEventsReconciled = parsePullRequestField(
  body,
  '- External and tool events reconciled:',
);
const sourceSelfReference = parsePullRequestField(
  body,
  '- Source file contains the workflow run that verifies itself:',
);
const wrongMetadataAction = parsePullRequestField(
  body,
  '- Repository file action used for pull-request metadata:',
);

if (!['existing', 'new', 'none'].includes(learningOutcome ?? '')) {
  errors.push('Learning outcome must be `new`, `existing`, or `none`.');
}

if (learningOutcome === 'new' || learningOutcome === 'existing') {
  if (ledgerEntries.length === 0) {
    errors.push('A learning outcome requires at least one ledger entry such as EL-0019.');
  }
  if (learningIssues.length === 0) {
    errors.push('A learning outcome requires at least one linked learning issue such as #123.');
  }
  if (!['confirmed', 'machine-supported'].includes(rootCauseStatus ?? '')) {
    errors.push('A learning outcome requires a confirmed or machine-supported root cause.');
  }
}

if (learningOutcome === 'none') {
  if (ledgerEntriesValue !== 'not-required') {
    errors.push('A `none` outcome requires `not-required` as the ledger entries.');
  }
  if (learningIssuesValue !== 'not-required') {
    errors.push('A `none` outcome requires `not-required` as the learning issues.');
  }
  if (rootCauseStatus !== 'not-required') {
    errors.push('A `none` outcome requires `not-required` as the root-cause status.');
  }
}

if (ledgerConsulted !== 'yes') {
  errors.push('The engineering learning ledger must be consulted before implementation.');
}
if (failureHistoryReconciled !== 'yes') {
  errors.push('Failure history must be reconciled before review.');
}
if (externalEventsReconciled !== 'yes') {
  errors.push('External and tool events must be reconciled before review.');
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

console.log('Pull-request governance record is structurally valid.');

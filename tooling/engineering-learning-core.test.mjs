import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyFailure,
  createEngineeringEvent,
  normalizeText,
  parseIssueNumber,
  parseIssueNumbers,
  parseLedgerEntries,
  parseMetadata,
  parsePullRequestField,
  renderIssueBody,
} from './engineering-learning-core.mjs';

test('classifies an outdated pnpm lockfile with the known root cause', () => {
  const result = classifyFailure({
    workflowName: 'Continuous Integration',
    jobName: 'Verify monorepo',
    stepName: 'Install dependencies',
    logText: 'ERR_PNPM_OUTDATED_LOCKFILE Cannot install with frozen-lockfile',
  });

  assert.equal(result.rootCauseId, 'ROOT-DEPENDENCY-LOCKFILE-OUTDATED');
  assert.equal(result.ledgerEntry, 'EL-0001');
  assert.equal(result.deterministic, true);
});

test('falls back to the failed stage when no known signature exists', () => {
  const result = classifyFailure({
    workflowName: 'Continuous Integration',
    jobName: 'Verify monorepo',
    stepName: 'Type-check',
    logText: 'A novel compiler failure occurred.',
  });

  assert.equal(result.category, 'typecheck-compilation');
  assert.equal(result.confidence, 'medium');
  assert.equal(result.deterministic, false);
});

test('normalization removes volatile identifiers from fingerprints', () => {
  const first = normalizeText(
    '2026-07-16T14:00:00.000Z commit abcdef1234567890abcdef1234567890abcdef12 failed',
  );
  const second = normalizeText(
    '2026-07-17T15:00:00.000Z commit 1234567890abcdef1234567890abcdef12345678 failed',
  );

  assert.equal(first, second);
});

test('creates stable machine-readable issue metadata', () => {
  const event = createEngineeringEvent({
    sourceType: 'ci-workflow',
    sourceId: '100',
    repository: 'Newax-Technologies/core-newax',
    prNumber: 49,
    commitSha: 'abcdef1234567890abcdef1234567890abcdef12',
    workflowRunId: 100,
    workflowName: 'Continuous Integration',
    jobId: 200,
    jobName: 'Verify monorepo',
    stepName: 'Check formatting',
    logText: 'Code style issues found in the above file.',
    evidenceUrls: ['https://example.test/run/100'],
  });
  const body = renderIssueBody(event);
  const metadata = parseMetadata(body);

  assert.equal(metadata['pr-number'], '49');
  assert.equal(metadata['workflow-run-id'], '100');
  assert.equal(metadata['root-cause-id'], 'ROOT-FORMATTING-NOT-APPLIED');
  assert.equal(metadata['root-cause-status'], 'candidate');
});

test('parses pull-request fields and issue numbers', () => {
  const body = '- Learning outcome: `existing`\n- Learning issue: `#123`';

  assert.equal(parsePullRequestField(body, '- Learning outcome:'), 'existing');
  assert.equal(parseIssueNumber(parsePullRequestField(body, '- Learning issue:')), 123);
  assert.deepEqual(parseIssueNumbers('#123, #124, #123'), [123, 124]);
  assert.deepEqual(parseLedgerEntries('EL-0018, EL-0019, EL-0018'), ['EL-0018', 'EL-0019']);
});

test('governed command wrapper queues a local failure outside CI', async () => {
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { spawnSync } = await import('node:child_process');

  const directory = mkdtempSync(join(tmpdir(), 'newax-learning-'));
  const wrapper = resolve('tooling/run-engineering-command.mjs');
  const result = spawnSync(process.execPath, [wrapper, process.execPath, '-e', 'process.exit(7)'], {
    cwd: directory,
    env: { ...process.env, CI: 'false' },
    encoding: 'utf8',
  });

  assert.equal(result.status, 7);
  const queued = readFileSync(join(directory, '.newax/engineering-events.ndjson'), 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(queued.length, 1);
  assert.equal(queued[0].sourceType, 'local-command');
  rmSync(directory, { recursive: true, force: true });
});

test('operation intent blocks a pull-request target using an issue action', async () => {
  const { validateOperationIntent } = await import('./validate-operation-intent.mjs');

  const errors = validateOperationIntent({
    targetType: 'pull-request-metadata',
    targetIdentifier: 'PR #49',
    action: 'update_issue',
    expectedPostcondition: 'PR body changes.',
    prohibitedSideEffects: 'No issue or repository file changes.',
  });

  assert.deepEqual(errors, [
    'Action update_issue does not match target type pull-request-metadata.',
  ]);
});

test('operation intent accepts the matching pull-request metadata action', async () => {
  const { validateOperationIntent } = await import('./validate-operation-intent.mjs');

  const errors = validateOperationIntent({
    targetType: 'pull-request-metadata',
    targetIdentifier: 'PR #49',
    action: 'update_pull_request',
    expectedPostcondition: 'PR body changes.',
    prohibitedSideEffects: 'No repository file changes.',
  });

  assert.deepEqual(errors, []);
});

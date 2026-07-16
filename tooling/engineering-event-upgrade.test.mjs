import assert from 'node:assert/strict';
import test from 'node:test';

import { renderIssueBody } from './engineering-learning-core.mjs';
import { upgradeEngineeringEvent } from './submit-engineering-event.mjs';

test('upgrades queued schema-one events before root-cause rendering', () => {
  const legacyEvent = {
    schemaVersion: 1,
    sourceType: 'local-command',
    sourceId: 'legacy-command-1',
    occurredAt: '2026-07-16T12:00:00.000Z',
    repository: 'Newax-Technologies/core-newax',
    prNumber: 99,
    commitSha: null,
    workflowRunId: null,
    workflowName: 'External intake: local-command',
    jobId: null,
    jobName: 'local',
    stepName: 'pnpm verify',
    category: 'local-verification',
    symptom: 'Legacy verification failed.',
    rootCauseId: 'ROOT-UNCLASSIFIED-LOCAL_VERIFICATION',
    rootCauseCandidate: 'The legacy event requires evidence-backed confirmation.',
    rootCauseConfidence: 'low',
    rootCauseDeterministic: false,
    matchedSignatures: [],
    unsuccessfulMethod: 'Retry without evidence.',
    successfulMethod: 'Inspect the first failing stage.',
    preventionControl: 'Preserve the queue and review evidence.',
    ledgerEntry: null,
    fingerprint: 'legacy-fingerprint',
    evidenceUrls: [],
    status: 'candidate',
  };

  const upgraded = upgradeEngineeringEvent(legacyEvent);
  const body = renderIssueBody(upgraded);

  assert.equal(upgraded.schemaVersion, 2);
  assert.equal(upgraded.rootCauseAssessment.status, 'candidate');
  assert.equal(upgraded.rootCauseAssessment.selected.rootCauseId, legacyEvent.rootCauseId);
  assert.match(body, /Upgraded from engineering event schema version 1/);
  assert.match(body, /ROOT-UNCLASSIFIED-LOCAL_VERIFICATION/);
});

test('leaves current engineering events unchanged', () => {
  const current = {
    schemaVersion: 2,
    rootCauseAssessment: { status: 'candidate' },
  };

  assert.equal(upgradeEngineeringEvent(current), current);
});

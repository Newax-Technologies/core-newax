import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ensureExplanationSection,
  parseExplanationEvidenceRecord,
  renderExplanationSection,
} from './explanation-verification.mjs';

function event() {
  return {
    rootCauseId: 'ROOT-DEPENDENCY-LOCKFILE-OUTDATED',
    rootCauseCandidate: 'The dependency manifest changed without the generated lockfile.',
    rootCauseAssessment: {
      ambiguous: false,
      selected: {
        rootCauseId: 'ROOT-DEPENDENCY-LOCKFILE-OUTDATED',
        score: 100,
      },
      hypotheses: [
        { rootCauseId: 'ROOT-DEPENDENCY-LOCKFILE-OUTDATED', score: 100 },
        { rootCauseId: 'ROOT-DEPENDENCY-PEER-INCOMPATIBLE', score: 30 },
      ],
    },
    matchedSignatures: ['ERR_PNPM_OUTDATED_LOCKFILE'],
    workflowRunId: 10,
    jobId: 11,
    stepName: 'Install dependencies',
  };
}

test('adds a machine-readable challenged explanation section to a new learning issue', () => {
  const section = renderExplanationSection(event());
  const body = ensureExplanationSection('# Issue', section);
  const record = parseExplanationEvidenceRecord(body);

  assert.equal(record.explanation.rootCauseId, 'ROOT-DEPENDENCY-LOCKFILE-OUTDATED');
  assert.match(body, /Explanation decision: `challenged`/);
  assert.match(body, /Which log proves this\?: verified/);
  assert.match(body, /Which commit introduced it\?: missing/);
  assert.match(body, /Which test reproduces it\?: missing/);
});

test('does not overwrite a reviewed explanation section during later graph attachment', () => {
  const reviewed = `<!-- newax-explanation-verification -->
reviewed evidence
<!-- /newax-explanation-verification -->`;
  const result = ensureExplanationSection(
    `# Issue\n\n${reviewed}`,
    renderExplanationSection(event()),
  );

  assert.equal((result.match(/<!-- newax-explanation-verification -->/g) ?? []).length, 1);
  assert.match(result, /reviewed evidence/);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectConfidenceRecords,
  parseConfidenceInputRecords,
  renderConfidenceInputRecord,
  renderConfidenceScoreRecord,
  validateConfidenceRecordPair,
} from './confidence-record.mjs';

const input = {
  evidenceRecords: [
    {
      id: 'E-1',
      type: 'log',
      status: 'verified',
      primary: true,
      durable: true,
      provenanceComplete: true,
    },
  ],
};

test('renders and parses deterministic confidence records', () => {
  const issue = {
    body: renderConfidenceInputRecord({
      findingId: 'F-1',
      sourceType: 'planning',
      sourceRef: 'issue:1',
      input,
    }),
  };
  const comments = [{ body: renderConfidenceScoreRecord({ findingId: 'F-1', input }) }];
  const [pair] = collectConfidenceRecords(issue, comments);
  assert.equal(pair.inputRecord.findingId, 'F-1');
  assert.equal(validateConfidenceRecordPair(pair).length, 0);
});

test('parses issue-form heading output without accepting a manual score', () => {
  const body = `### Finding ID\nF-2\n\n### Source type\ncommunication\n\n### Source reference\nissue:2\n\n### Confidence input JSON\n\n\`\`\`json\n${JSON.stringify(input)}\n\`\`\``;
  const [record] = parseConfidenceInputRecords(body);
  assert.equal(record.findingId, 'F-2');
  assert.deepEqual(record.input, input);
});

test('detects a missing score record', () => {
  const [pair] = collectConfidenceRecords(
    { body: renderConfidenceInputRecord({ findingId: 'F-3', sourceType: 'ai', input }) },
    [],
  );
  assert.match(validateConfidenceRecordPair(pair).join('\n'), /score record is missing/i);
});

test('detects a tampered computed score', () => {
  const inputRecord = {
    findingId: 'F-4',
    input,
  };
  const scoreBody = renderConfidenceScoreRecord({ findingId: 'F-4', input });
  const parsed = JSON.parse(scoreBody.match(/<!-- newax-confidence-score\n([\s\S]*?)\n-->/)[1]);
  parsed.envelope.evidenceQuality.score = 100;
  const errors = validateConfidenceRecordPair({ inputRecord, scoreRecord: parsed });
  assert.match(errors.join('\n'), /evidenceQuality/);
});

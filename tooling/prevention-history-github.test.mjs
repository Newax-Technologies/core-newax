import assert from 'node:assert/strict';
import test from 'node:test';

import { collectPreventionHistory } from './prevention-history-github.mjs';

function request(path) {
  const responses = {
    '/pulls/20/commits': [
      {
        sha: 'c'.repeat(40),
        commit: { committer: { date: '2026-07-17T12:00:00Z' } },
      },
    ],
    [`/commits/${'c'.repeat(40)}`]: {
      commit: { committer: { date: '2026-07-17T12:00:00Z' } },
      files: [{ filename: '.newax/prevention/ci/root-x.json', status: 'added' }],
    },
    '/issues/10': {
      number: 10,
      body: `<!-- newax-prevention-event\nevent-id: E-10\nroot-cause-id: ROOT-X\nroot-cause-status: confirmed\nresolution-status: verified\nresolved-at: 2026-07-17T12:00:00Z\nfix-commit: ${'a'.repeat(40)}\nreviewer: reviewer\nreviewed-at: 2026-07-17T12:05:00Z\nverification-refs: workflow:1\nregression-refs: test:one\nprevention-control: Require regression evidence.\n-->`,
    },
    '/issues/10/comments': [],
  };
  return Promise.resolve(responses[path]);
}

test('collects linked resolved mistakes and changed files', async () => {
  const history = await collectPreventionHistory({
    pullRequest: {
      number: 20,
      draft: false,
      body: '- Prevention records: `#10`',
      head: { sha: 'h'.repeat(40) },
      base: { sha: 'b'.repeat(40) },
    },
    request,
  });
  assert.equal(history.phase, 'review');
  assert.equal(history.mistakes.length, 1);
  assert.deepEqual(history.changedFiles, ['.newax/prevention/ci/root-x.json']);
});

import { readFileSync } from 'node:fs';

import {
  FAILURE_CONCLUSIONS,
  createEngineeringEvent,
  githubRequest,
  listAll,
  loadCatalog,
  parseIssueNumbers,
  parseLedgerEntries,
  parseMetadata,
  parsePullRequestField,
} from './engineering-learning-core.mjs';

function fail(messages) {
  console.error('Engineering learning reconciliation failed:');
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

function hasRequiredResolution(body) {
  return (
    body.includes('- Root-cause status: `confirmed`') &&
    body.includes('- Resolution status: `verified`') &&
    !body.includes('- Confirmed root cause: Pending.') &&
    !body.includes('- Fix commit: Pending.') &&
    !body.includes('- Successful verification: Pending.')
  );
}

async function verifyMachineEvidence(issue, metadata, pullRequest, errors) {
  const workflowRunId = Number(metadata['workflow-run-id']);
  const jobId = Number(metadata['job-id']);

  if (!Number.isSafeInteger(workflowRunId) || !Number.isSafeInteger(jobId)) {
    errors.push(`Issue #${issue.number} lacks valid workflow-run and job identifiers.`);
    return;
  }

  try {
    const run = await githubRequest(`/actions/runs/${workflowRunId}`);
    if (!FAILURE_CONCLUSIONS.has(run.conclusion)) {
      errors.push(
        `Issue #${issue.number} references workflow run ${workflowRunId}, which is not failed.`,
      );
      return;
    }
    if (run.head_sha !== metadata['commit-sha']) {
      errors.push(
        `Issue #${issue.number} commit metadata does not match workflow run ${workflowRunId}.`,
      );
      return;
    }

    const jobs = await listAll(`/actions/runs/${workflowRunId}/jobs`, { collectionKey: 'jobs' });
    const job = jobs.find((candidate) => candidate.id === jobId);
    if (job === undefined || !FAILURE_CONCLUSIONS.has(job.conclusion)) {
      errors.push(`Issue #${issue.number} references job ${jobId}, which is not a failed job.`);
      return;
    }

    const logText = await githubRequest(`/actions/jobs/${jobId}/logs`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    const recomputed = createEngineeringEvent({
      sourceType: metadata['source-type'],
      sourceId: metadata['source-id'],
      repository: process.env.GITHUB_REPOSITORY,
      prNumber: pullRequest.number,
      commitSha: run.head_sha,
      workflowRunId,
      workflowName: run.name,
      jobId,
      jobName: job.name,
      stepName: metadata['step-name'],
      logText,
      evidenceUrls: [run.html_url, job.html_url].filter(Boolean),
    });

    if (recomputed.fingerprint !== metadata.fingerprint) {
      errors.push(
        `Issue #${issue.number} fingerprint does not match the referenced workflow evidence.`,
      );
    }
    if (recomputed.rootCauseId !== metadata['root-cause-id']) {
      errors.push(
        `Issue #${issue.number} root-cause classification does not match the referenced logs.`,
      );
    }
    if (!recomputed.rootCauseDeterministic) {
      errors.push(
        `Issue #${issue.number} is marked machine-supported, but its classifier is not deterministic.`,
      );
    }
  } catch (error) {
    errors.push(`Issue #${issue.number} machine evidence could not be verified: ${String(error)}`);
  }
}

async function listPullRequestRuns(pullRequestNumber) {
  const commits = await listAll(`/pulls/${pullRequestNumber}/commits`);
  const runs = [];

  for (const commit of commits) {
    const response = await githubRequest(
      `/actions/runs?event=pull_request&head_sha=${encodeURIComponent(commit.sha)}&per_page=100`,
    );
    runs.push(...(response.workflow_runs ?? []));
  }

  return runs;
}

async function listPullRequestLearningIssues(pullRequestNumber) {
  const issues = await listAll('/issues?state=all');
  return issues.filter((issue) => {
    if (issue.pull_request !== undefined) {
      return false;
    }
    const metadata = parseMetadata(issue.body);
    return Number(metadata['pr-number']) === pullRequestNumber;
  });
}

async function listChangedFiles(pullRequestNumber) {
  return listAll(`/pulls/${pullRequestNumber}/files`);
}

const eventPath = process.env.GITHUB_EVENT_PATH;
if (eventPath === undefined || eventPath.length === 0) {
  fail(['GITHUB_EVENT_PATH is unavailable.']);
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const pullRequest = event.pull_request;
if (pullRequest === undefined) {
  fail(['The pull_request payload is unavailable.']);
}

const body = pullRequest.body ?? '';
const errors = [];
const learningOutcome = parsePullRequestField(body, '- Learning outcome:');
const ledgerEntriesValue = parsePullRequestField(body, '- Ledger entries:');
const ledgerEntries = parseLedgerEntries(ledgerEntriesValue);
const learningIssuesValue = parsePullRequestField(body, '- Learning issues:');
const learningIssueNumbers = parseIssueNumbers(learningIssuesValue);
const rootCauseStatus = parsePullRequestField(body, '- Root-cause status:');
const rootCauseEvidence = parsePullRequestField(body, '- Root-cause evidence:');
const resolutionEvidence = parsePullRequestField(body, '- Resolution evidence:');
const failureHistoryReconciled = parsePullRequestField(body, '- Failure history reconciled:');
const externalEventsReconciled = parsePullRequestField(
  body,
  '- External and tool events reconciled:',
);

if (!['existing', 'new', 'none'].includes(learningOutcome ?? '')) {
  errors.push('Learning outcome must be `new`, `existing`, or `none`.');
}
if (failureHistoryReconciled !== 'yes') {
  errors.push('Failure history must be reconciled before review.');
}
if (externalEventsReconciled !== 'yes') {
  errors.push('External and tool events must be reconciled before review.');
}

const [runs, linkedIssues, changedFiles] = await Promise.all([
  listPullRequestRuns(pullRequest.number),
  listPullRequestLearningIssues(pullRequest.number),
  listChangedFiles(pullRequest.number),
]);

const failedRuns = runs.filter((run) => FAILURE_CONCLUSIONS.has(run.conclusion));
const hasFailureEvidence = failedRuns.length > 0 || linkedIssues.length > 0;

if (learningOutcome === 'none' && hasFailureEvidence) {
  errors.push(
    `Learning outcome cannot be none: found ${failedRuns.length} failed workflow run(s) and ${linkedIssues.length} linked learning issue(s).`,
  );
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

if (learningOutcome === 'new' || learningOutcome === 'existing') {
  if (ledgerEntries.length === 0) {
    errors.push('A learning outcome requires at least one ledger entry such as EL-0019.');
  }
  if (learningIssueNumbers.length === 0) {
    errors.push(
      'A learning outcome requires at least one linked engineering-learning issue number.',
    );
  }
  if (!['confirmed', 'machine-supported'].includes(rootCauseStatus ?? '')) {
    errors.push('Root-cause status must be `confirmed` or `machine-supported`.');
  }
  if (
    rootCauseEvidence === null ||
    rootCauseEvidence === 'pending' ||
    rootCauseEvidence.length < 8
  ) {
    errors.push('Root-cause evidence must identify concrete machine or review evidence.');
  }
  if (
    resolutionEvidence === null ||
    resolutionEvidence === 'pending' ||
    resolutionEvidence.length < 8
  ) {
    errors.push('Resolution evidence must identify a fix and successful verification.');
  }
}

if (learningOutcome === 'new') {
  for (const ledgerEntry of ledgerEntries) {
    const ledgerChanged = changedFiles.some((file) => {
      return (
        file.filename === 'docs/verification/engineering-learning-ledger.md' ||
        file.filename.includes(`docs/verification/engineering-learning-ledger/${ledgerEntry}`)
      );
    });
    if (!ledgerChanged) {
      errors.push(`New learning ${ledgerEntry} is not present in the pull-request diff.`);
    }
  }
}

if (learningOutcome === 'existing') {
  const catalog = loadCatalog();
  for (const ledgerEntry of ledgerEntries) {
    const known = catalog.rootCauses.some((rootCause) => rootCause.ledgerEntry === ledgerEntry);
    if (!known) {
      errors.push(
        `Existing ledger entry ${ledgerEntry} is not represented in the learning catalog.`,
      );
    }
  }
}

for (const learningIssueNumber of learningIssueNumbers) {
  let issue;
  try {
    issue = await githubRequest(`/issues/${learningIssueNumber}`);
  } catch (error) {
    errors.push(`Learning issue #${learningIssueNumber} could not be read: ${String(error)}`);
  }

  if (issue !== undefined) {
    const metadata = parseMetadata(issue.body);

    if (metadata.fingerprint === undefined || metadata['root-cause-id'] === undefined) {
      errors.push(`Issue #${learningIssueNumber} lacks machine-readable learning metadata.`);
    }
    if (Number(metadata['pr-number']) !== pullRequest.number) {
      errors.push(`Issue #${learningIssueNumber} is not linked to PR #${pullRequest.number}.`);
    }
    if (rootCauseStatus === 'machine-supported') {
      if (metadata['root-cause-status'] !== 'machine-supported') {
        errors.push(
          `Issue #${learningIssueNumber} does not contain machine-supported root-cause evidence.`,
        );
      } else {
        await verifyMachineEvidence(issue, metadata, pullRequest, errors);
      }
    }
    if (rootCauseStatus === 'confirmed' && !hasRequiredResolution(issue.body ?? '')) {
      errors.push(
        `Issue #${learningIssueNumber} does not contain a confirmed and verified resolution record.`,
      );
    }
  }
}

if (errors.length > 0) {
  fail(errors);
}

console.log(
  JSON.stringify({
    pullRequest: pullRequest.number,
    learningOutcome,
    failedRuns: failedRuns.map((run) => ({
      id: run.id,
      name: run.name,
      conclusion: run.conclusion,
    })),
    linkedLearningIssues: linkedIssues.map((issue) => issue.number),
    status: 'reconciled',
  }),
);

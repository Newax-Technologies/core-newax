import { readFileSync } from 'node:fs';

import {
  FAILURE_CONCLUSIONS,
  createEngineeringEvent,
  createOrUpdateLearningIssue,
  githubRequest,
  listAll,
} from './engineering-learning-core.mjs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (eventPath === undefined || eventPath.length === 0) {
  throw new Error('GITHUB_EVENT_PATH is required.');
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const workflowRun = event.workflow_run;

if (workflowRun === undefined) {
  throw new Error('The workflow_run payload is unavailable.');
}

if (!FAILURE_CONCLUSIONS.has(workflowRun.conclusion)) {
  console.log(`No learning intake required for conclusion: ${workflowRun.conclusion}.`);
  process.exit(0);
}

const jobs = await listAll(`/actions/runs/${workflowRun.id}/jobs`, { collectionKey: 'jobs' });
const failedJobs = jobs.filter((job) => FAILURE_CONCLUSIONS.has(job.conclusion));

if (failedJobs.length === 0) {
  throw new Error('The workflow failed but no failed job was returned by GitHub.');
}

const prNumber = workflowRun.pull_requests?.[0]?.number ?? null;
const evidenceUrls = [workflowRun.html_url].filter(Boolean);
const results = [];

for (const job of failedJobs) {
  const failedSteps = job.steps?.filter((step) => FAILURE_CONCLUSIONS.has(step.conclusion)) ?? [];
  const steps = failedSteps.length === 0 ? [{ name: 'Unknown failed step' }] : failedSteps;
  let logText = '';

  try {
    logText = await githubRequest(`/actions/jobs/${job.id}/logs`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch (error) {
    logText = `Job logs were unavailable: ${String(error)}`;
  }

  for (const step of steps) {
    const learningEvent = createEngineeringEvent({
      sourceType: 'ci-workflow',
      sourceId: String(workflowRun.id),
      occurredAt: workflowRun.updated_at ?? workflowRun.created_at,
      repository: process.env.GITHUB_REPOSITORY,
      prNumber,
      commitSha: workflowRun.head_sha,
      workflowRunId: workflowRun.id,
      workflowName: workflowRun.name,
      jobId: job.id,
      jobName: job.name,
      stepName: step.name,
      logText,
      evidenceUrls: [...evidenceUrls, job.html_url].filter(Boolean),
    });

    results.push(await createOrUpdateLearningIssue(learningEvent));
  }
}

console.log(JSON.stringify({ captured: results.length, results }));

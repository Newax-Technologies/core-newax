import { readFileSync } from 'node:fs';

import {
  appendLocalEvent,
  createEngineeringEvent,
  createFingerprint,
  createOrUpdateLearningIssue,
} from './engineering-learning-core.mjs';

const SOURCE_CLASSIFICATIONS = {
  communication: {
    category: 'process-communication-polling',
    rootCauseId: 'ROOT-UNCLASSIFIED-PROCESS_COMMUNICATION_POLLING',
  },
  'external-tool': {
    category: 'external-tool-operation',
    rootCauseId: 'ROOT-UNCLASSIFIED-EXTERNAL_TOOL_OPERATION',
  },
  manual: {
    category: 'unknown',
    rootCauseId: 'ROOT-UNCLASSIFIED-UNKNOWN',
  },
  planning: {
    category: 'planning-decision-quality',
    rootCauseId: 'ROOT-UNCLASSIFIED-PLANNING_DECISION_QUALITY',
  },
};

function parseArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      result[key] = next;
      index += 1;
    } else {
      result[key] = 'true';
    }
  }
  return result;
}

function readGithubPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath === undefined || eventPath.length === 0) {
    return null;
  }

  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  if (event.client_payload !== undefined) {
    return event.client_payload;
  }
  if (event.inputs !== undefined) {
    return event.inputs;
  }
  return null;
}

const argumentsMap = parseArguments(process.argv.slice(2));
const payload = readGithubPayload() ?? argumentsMap;
const summary = payload.summary ?? payload.symptom;
const sourceType = payload.source_type ?? payload.sourceType ?? 'manual';

if (summary === undefined || String(summary).trim().length === 0) {
  throw new Error('A non-empty --summary or dispatched summary is required.');
}
if (!['communication', 'external-tool', 'local-command', 'manual', 'planning'].includes(sourceType)) {
  throw new Error(`Unsupported engineering event source type: ${sourceType}.`);
}

const evidenceUrls = String(payload.evidence ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const baseEvent = createEngineeringEvent({
  sourceType,
  sourceId: payload.source_id ?? payload.sourceId ?? null,
  repository: process.env.GITHUB_REPOSITORY ?? payload.repository ?? null,
  prNumber: payload.pr_number ?? payload.prNumber ?? null,
  commitSha: payload.commit_sha ?? payload.commitSha ?? null,
  workflowName: payload.workflow_name ?? payload.workflowName ?? null,
  jobName: payload.job_name ?? payload.jobName ?? null,
  stepName:
    payload.step_name ?? payload.stepName ?? payload.category ?? 'External engineering event',
  logText: summary,
  summary,
  unsuccessfulMethod: payload.unsuccessful_method ?? payload.unsuccessfulMethod,
  successfulMethod: payload.successful_method ?? payload.successfulMethod,
  preventionControl: payload.prevention_control ?? payload.preventionControl,
  evidenceUrls,
});

const externalClassification = SOURCE_CLASSIFICATIONS[sourceType];
const learningEvent =
  externalClassification === undefined
    ? baseEvent
    : {
        ...baseEvent,
        ...externalClassification,
        fingerprint: createFingerprint({
          classification: externalClassification,
          workflowName: baseEvent.workflowName,
          jobName: baseEvent.jobName,
          stepName: baseEvent.stepName,
          logText: summary,
        }),
        rootCauseCandidate:
          'The source category is known, but the true root cause requires evidence-backed confirmation.',
        rootCauseConfidence: 'low',
        rootCauseDeterministic: false,
        status: 'candidate',
      };

if (process.env.GITHUB_TOKEN !== undefined && process.env.GITHUB_REPOSITORY !== undefined) {
  const result = await createOrUpdateLearningIssue(learningEvent);
  console.log(JSON.stringify({ delivery: 'github-issue', ...result }));
} else {
  const path = appendLocalEvent(learningEvent);
  console.log(JSON.stringify({ delivery: 'local-queue', path }));
}

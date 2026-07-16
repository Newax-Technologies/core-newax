import { createFingerprint } from './engineering-learning-core.mjs';

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

export const EXTERNAL_EVENT_SOURCE_TYPES = new Set([
  'communication',
  'external-tool',
  'local-command',
  'manual',
  'planning',
]);

export function applyExternalSourceClassification(baseEvent, sourceType, summary) {
  const classification = SOURCE_CLASSIFICATIONS[sourceType];
  if (classification === undefined) {
    return baseEvent;
  }

  return {
    ...baseEvent,
    ...classification,
    fingerprint: createFingerprint({
      classification,
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
}

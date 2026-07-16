import { createOrUpdateLearningIssue, findMatchingIssues } from './engineering-learning-core.mjs';

function legacyAssessment(event) {
  const category = event.category ?? 'unknown';
  const rootCauseId = event.rootCauseId ?? 'ROOT-UNCLASSIFIED-UNKNOWN';
  const matchedSignatures = Array.isArray(event.matchedSignatures) ? event.matchedSignatures : [];
  const deterministic =
    event.rootCauseDeterministic === true && event.status === 'machine-supported';
  const evidenceFor = matchedSignatures.map(
    (signature) => `Observed legacy catalog signature: ${signature}`,
  );
  const missingEvidence = deterministic
    ? []
    : ['Legacy event requires current evidence review before root-cause confirmation.'];
  const selected = {
    category,
    catalogConfidence: event.rootCauseConfidence ?? 'low',
    catalogDeterministic: event.rootCauseDeterministic === true,
    confidence: event.rootCauseConfidence ?? 'low',
    deterministic,
    evidenceAgainst: [],
    evidenceFor,
    ledgerEntry: event.ledgerEntry ?? null,
    matchedSignatures,
    missingEvidence,
    missingSignatures: [],
    preventionControl: event.preventionControl,
    rootCause: event.rootCauseCandidate,
    rootCauseId,
    score: deterministic ? 100 : matchedSignatures.length > 0 ? 50 : 10,
    successfulMethod: event.successfulMethod,
    unsuccessfulMethod: event.unsuccessfulMethod,
  };

  return {
    ambiguous: false,
    deterministic,
    evidenceAgainst: [],
    evidenceFor,
    hypotheses: [selected],
    inferredCategory: category,
    missingEvidence,
    observedFacts: [
      event.workflowName ? `Workflow: ${event.workflowName}` : null,
      event.jobName ? `Job: ${event.jobName}` : null,
      event.stepName ? `Step: ${event.stepName}` : null,
      event.sourceType ? `Source: ${event.sourceType}` : null,
      'Upgraded from engineering event schema version 1.',
    ].filter(Boolean),
    selected,
    status: deterministic ? 'machine-supported' : 'candidate',
  };
}

export function upgradeEngineeringEvent(event) {
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    throw new TypeError('Engineering event must be an object.');
  }
  if (event.rootCauseAssessment !== undefined) {
    return event;
  }

  return {
    ...event,
    schemaVersion: 2,
    rootCauseAssessment: legacyAssessment(event),
  };
}

export async function submitEngineeringEvent(event, options = {}) {
  const upgradedEvent = upgradeEngineeringEvent(event);
  const matches = await findMatchingIssues(upgradedEvent, options);
  if (matches.exactOccurrence !== undefined) {
    return {
      issueNumber: matches.exactOccurrence.number,
      created: false,
      idempotent: true,
    };
  }

  return createOrUpdateLearningIssue(upgradedEvent, options);
}

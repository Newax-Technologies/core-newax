import { createOrUpdateLearningIssue, findMatchingIssues } from './engineering-learning-core.mjs';

export async function submitEngineeringEvent(event, options = {}) {
  const matches = await findMatchingIssues(event, options);
  if (matches.exactOccurrence !== undefined) {
    return {
      issueNumber: matches.exactOccurrence.number,
      created: false,
      idempotent: true,
    };
  }

  return createOrUpdateLearningIssue(event, options);
}

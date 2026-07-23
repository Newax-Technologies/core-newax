export {
  DEFAULT_OPPORTUNITY_WEIGHTS,
  scoreOpportunity,
} from './services/opportunity-scoring';
export {
  compareRankedLeads,
  evaluateLeadEligibility,
  selectDailyLeadCohort,
} from './services/lead-ranking';
export { nextOutreachDecision } from './services/outreach-policy';
export {
  OPPORTUNITY_COMPONENT_KEYS,
  type ChannelEligibility,
  type ChannelPermission,
  type ConsentState,
  type EvidenceReference,
  type LeadDisqualifier,
  type LeadEligibility,
  type LeadEligibilityInput,
  type OpportunityComponentInput,
  type OpportunityComponentInputs,
  type OpportunityComponentKey,
  type OpportunityComponentResult,
  type OpportunityScore,
  type OpportunityWeights,
  type OutreachChannel,
  type OutreachDecision,
  type OutreachState,
  type OutreachStep,
  type OutreachStopReason,
  type RankedLeadCandidate,
} from './types/lead-intelligence';

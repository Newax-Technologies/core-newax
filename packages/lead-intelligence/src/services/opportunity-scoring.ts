import {
  OPPORTUNITY_COMPONENT_KEYS,
  type OpportunityComponentInputs,
  type OpportunityComponentResult,
  type OpportunityScore,
  type OpportunityWeights,
} from '../types/lead-intelligence';

export const DEFAULT_OPPORTUNITY_WEIGHTS: OpportunityWeights = {
  sectorFit: 20,
  operationalNeed: 20,
  abilityToPay: 15,
  buyingSignals: 15,
  newaxValue: 10,
  decisionMakerReachability: 10,
  dataFreshness: 5,
  deliverySuitability: 5,
};

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function uniqueEvidenceIds(evidenceIds: readonly string[]): readonly string[] {
  return [...new Set(evidenceIds.filter((evidenceId) => evidenceId.trim().length > 0))];
}

function validateWeights(weights: OpportunityWeights): number {
  let totalWeight = 0;

  for (const key of OPPORTUNITY_COMPONENT_KEYS) {
    const weight = weights[key];

    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error(`Opportunity weight ${key} must be a finite non-negative number.`);
    }

    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    throw new Error('Opportunity weights must contain at least one positive value.');
  }

  return totalWeight;
}

export function scoreOpportunity(
  inputs: OpportunityComponentInputs,
  weights: OpportunityWeights = DEFAULT_OPPORTUNITY_WEIGHTS,
): OpportunityScore {
  const totalWeight = validateWeights(weights);
  const components: OpportunityComponentResult[] = [];
  let unroundedTotal = 0;

  for (const key of OPPORTUNITY_COMPONENT_KEYS) {
    const input = inputs[key];
    const normalizedValue = clampUnit(input.value);
    const normalizedWeight = (weights[key] / totalWeight) * 100;
    const unroundedPoints = normalizedValue * normalizedWeight;

    unroundedTotal += unroundedPoints;
    components.push({
      key,
      normalizedValue,
      normalizedWeight: roundToTwoDecimals(normalizedWeight),
      points: roundToTwoDecimals(unroundedPoints),
      explanation: input.explanation.trim(),
      evidenceIds: uniqueEvidenceIds(input.evidenceIds),
    });
  }

  return {
    total: roundToTwoDecimals(Math.min(100, Math.max(0, unroundedTotal))),
    components,
  };
}

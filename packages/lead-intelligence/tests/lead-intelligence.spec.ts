import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OPPORTUNITY_WEIGHTS,
  evaluateLeadEligibility,
  nextOutreachDecision,
  scoreOpportunity,
  selectDailyLeadCohort,
  type ChannelPermission,
  type LeadDisqualifier,
  type OpportunityComponentInput,
  type OpportunityComponentInputs,
  type OpportunityWeights,
  type OutreachState,
  type RankedLeadCandidate,
} from '../src';

function component(value: number, explanation = 'Evidence-backed observation'): OpportunityComponentInput {
  return {
    value,
    explanation,
    evidenceIds: ['evidence-1', 'evidence-1', ''],
  };
}

function opportunityInputs(
  values: Partial<Record<keyof OpportunityComponentInputs, number>> = {},
): OpportunityComponentInputs {
  return {
    sectorFit: component(values.sectorFit ?? 0.5),
    operationalNeed: component(values.operationalNeed ?? 0.5),
    abilityToPay: component(values.abilityToPay ?? 0.5),
    buyingSignals: component(values.buyingSignals ?? 0.5),
    newaxValue: component(values.newaxValue ?? 0.5),
    decisionMakerReachability: component(values.decisionMakerReachability ?? 0.5),
    dataFreshness: component(values.dataFreshness ?? 0.5),
    deliverySuitability: component(values.deliverySuitability ?? 0.5),
  };
}

function channel(
  channelName: ChannelPermission['channel'],
  marketingConsent: ChannelPermission['marketingConsent'],
): ChannelPermission {
  return {
    channel: channelName,
    destinationVerified: true,
    providerReady: true,
    suppressed: false,
    marketingConsent,
  };
}

function eligibility(disqualifiers: readonly LeadDisqualifier[] = []) {
  return evaluateLeadEligibility({
    disqualifiers,
    channels: [
      channel('whatsapp', 'unknown'),
      channel('email', 'not_required'),
      channel('sms', 'granted'),
    ],
  });
}

function candidate(
  leadId: string,
  scoreValue: number,
  freshnessValue: number,
  profileUpdatedAt: string,
  disqualifiers: readonly LeadDisqualifier[] = [],
): RankedLeadCandidate {
  return {
    leadId,
    organizationId: `organization-${leadId}`,
    score: scoreOpportunity(
      opportunityInputs({
        sectorFit: scoreValue,
        operationalNeed: scoreValue,
        abilityToPay: scoreValue,
        buyingSignals: scoreValue,
        newaxValue: scoreValue,
        decisionMakerReachability: scoreValue,
        dataFreshness: freshnessValue,
        deliverySuitability: scoreValue,
      }),
    ),
    eligibility: eligibility(disqualifiers),
    profileUpdatedAt: new Date(profileUpdatedAt),
  };
}

function outreachState(overrides: Partial<OutreachState> = {}): OutreachState {
  return {
    completedStep: null,
    lastSentAt: null,
    hasInboundReply: false,
    stopReason: null,
    nurtureEligible: false,
    ...overrides,
  };
}

describe('opportunity scoring', () => {
  it('produces a complete evidence-explained score bounded at 100', () => {
    const result = scoreOpportunity(
      opportunityInputs({
        sectorFit: 1,
        operationalNeed: 1,
        abilityToPay: 1,
        buyingSignals: 1,
        newaxValue: 1,
        decisionMakerReachability: 1,
        dataFreshness: 1,
        deliverySuitability: 1,
      }),
    );

    expect(result.total).toBe(100);
    expect(result.components).toHaveLength(8);
    expect(result.components.every((item) => item.explanation.length > 0)).toBe(true);
    expect(result.components.every((item) => item.evidenceIds.length === 1)).toBe(true);
  });

  it('clamps invalid component values without allowing an out-of-range total', () => {
    const result = scoreOpportunity(
      opportunityInputs({
        sectorFit: 2,
        operationalNeed: -1,
        abilityToPay: Number.NaN,
      }),
    );

    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.components.find((item) => item.key === 'sectorFit')?.normalizedValue).toBe(1);
    expect(result.components.find((item) => item.key === 'operationalNeed')?.normalizedValue).toBe(0);
    expect(result.components.find((item) => item.key === 'abilityToPay')?.normalizedValue).toBe(0);
  });

  it('normalizes custom weights to a 100-point scale', () => {
    const weights: OpportunityWeights = {
      sectorFit: 1,
      operationalNeed: 0,
      abilityToPay: 0,
      buyingSignals: 0,
      newaxValue: 0,
      decisionMakerReachability: 0,
      dataFreshness: 0,
      deliverySuitability: 0,
    };

    const result = scoreOpportunity(opportunityInputs({ sectorFit: 0.5 }), weights);

    expect(result.total).toBe(50);
  });

  it('rejects negative or empty weight configurations', () => {
    expect(() =>
      scoreOpportunity(opportunityInputs(), {
        ...DEFAULT_OPPORTUNITY_WEIGHTS,
        sectorFit: -1,
      }),
    ).toThrow('finite non-negative');

    expect(() =>
      scoreOpportunity(opportunityInputs(), {
        sectorFit: 0,
        operationalNeed: 0,
        abilityToPay: 0,
        buyingSignals: 0,
        newaxValue: 0,
        decisionMakerReachability: 0,
        dataFreshness: 0,
        deliverySuitability: 0,
      }),
    ).toThrow('at least one positive');
  });
});

describe('lead eligibility and ranking', () => {
  it('requires explicit consent for WhatsApp and SMS and falls back to eligible email', () => {
    const result = eligibility();

    expect(result.eligible).toBe(true);
    expect(result.preferredChannel).toBe('email');
    expect(result.channels.find((item) => item.channel === 'whatsapp')?.eligible).toBe(false);
    expect(result.channels.find((item) => item.channel === 'sms')?.eligible).toBe(true);
  });

  it('makes a disqualifier block cohort entry even when a channel is eligible', () => {
    const result = eligibility(['opted_out']);

    expect(result.eligible).toBe(false);
    expect(result.preferredChannel).toBeNull();
  });

  it('orders by score, freshness, profile update time, and stable lead id', () => {
    const selected = selectDailyLeadCohort([
      candidate('lead-c', 0.8, 0.5, '2026-07-20T10:00:00.000Z'),
      candidate('lead-b', 0.8, 0.9, '2026-07-19T10:00:00.000Z'),
      candidate('lead-a', 0.8, 0.9, '2026-07-19T10:00:00.000Z'),
      candidate('lead-top', 1, 1, '2026-07-18T10:00:00.000Z'),
      candidate('lead-blocked', 1, 1, '2026-07-23T10:00:00.000Z', ['complaint']),
    ]);

    expect(selected.map((item) => item.leadId)).toEqual([
      'lead-top',
      'lead-a',
      'lead-b',
      'lead-c',
    ]);
  });

  it('deduplicates lead ids and enforces the daily limit', () => {
    const candidates = Array.from({ length: 12 }, (_, index) =>
      candidate(
        `lead-${String(index).padStart(2, '0')}`,
        1 - index / 100,
        1,
        '2026-07-23T10:00:00.000Z',
      ),
    );

    const selected = selectDailyLeadCohort([candidates[0]!, ...candidates], 10);

    expect(selected).toHaveLength(10);
    expect(new Set(selected.map((item) => item.leadId)).size).toBe(10);
  });
});

describe('outreach cadence', () => {
  it('makes the initial message immediately due', () => {
    const now = new Date('2026-07-23T10:00:00.000Z');
    const decision = nextOutreachDecision(outreachState(), now);

    expect(decision).toEqual({
      action: 'send',
      step: 'initial',
      dueAt: now,
      due: true,
    });
  });

  it('schedules the second message exactly 48 hours after the first', () => {
    const decision = nextOutreachDecision(
      outreachState({
        completedStep: 'initial',
        lastSentAt: new Date('2026-07-23T10:00:00.000Z'),
      }),
      new Date('2026-07-25T09:59:59.999Z'),
    );

    expect(decision.action).toBe('send');
    if (decision.action === 'send') {
      expect(decision.step).toBe('followup_2');
      expect(decision.dueAt.toISOString()).toBe('2026-07-25T10:00:00.000Z');
      expect(decision.due).toBe(false);
    }
  });

  it('implements the three-day and four-day follow-up intervals', () => {
    const afterSecond = nextOutreachDecision(
      outreachState({
        completedStep: 'followup_2',
        lastSentAt: new Date('2026-07-25T10:00:00.000Z'),
      }),
      new Date('2026-07-28T10:00:00.000Z'),
    );
    const afterThird = nextOutreachDecision(
      outreachState({
        completedStep: 'followup_3',
        lastSentAt: new Date('2026-07-28T10:00:00.000Z'),
      }),
      new Date('2026-08-01T10:00:00.000Z'),
    );

    expect(afterSecond.action === 'send' ? afterSecond.step : null).toBe('followup_3');
    expect(afterSecond.action === 'send' ? afterSecond.due : false).toBe(true);
    expect(afterThird.action === 'send' ? afterThird.step : null).toBe('followup_4');
    expect(afterThird.action === 'send' ? afterThird.due : false).toBe(true);
  });

  it('stops every future follow-up after an inbound reply', () => {
    const decision = nextOutreachDecision(
      outreachState({
        completedStep: 'initial',
        lastSentAt: new Date('2026-07-23T10:00:00.000Z'),
        hasInboundReply: true,
      }),
      new Date('2026-07-25T10:00:00.000Z'),
    );

    expect(decision).toEqual({ action: 'stop', reason: 'reply_received' });
  });

  it('does not begin monthly nurture without explicit eligibility', () => {
    const decision = nextOutreachDecision(
      outreachState({
        completedStep: 'followup_4',
        lastSentAt: new Date('2026-08-01T10:00:00.000Z'),
      }),
      new Date('2026-08-31T10:00:00.000Z'),
    );

    expect(decision).toEqual({
      action: 'none',
      reason: 'cold_sequence_complete_without_nurture_eligibility',
      nextReviewAt: null,
    });
  });

  it('schedules opted-in nurture at 30-day intervals', () => {
    const decision = nextOutreachDecision(
      outreachState({
        completedStep: 'followup_4',
        lastSentAt: new Date('2026-08-01T10:00:00.000Z'),
        nurtureEligible: true,
      }),
      new Date('2026-08-31T10:00:00.000Z'),
    );

    expect(decision.action === 'send' ? decision.step : null).toBe('monthly_nurture');
    expect(decision.action === 'send' ? decision.due : false).toBe(true);
  });
});

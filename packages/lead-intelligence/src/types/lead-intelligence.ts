export const OPPORTUNITY_COMPONENT_KEYS = [
  'sectorFit',
  'operationalNeed',
  'abilityToPay',
  'buyingSignals',
  'newaxValue',
  'decisionMakerReachability',
  'dataFreshness',
  'deliverySuitability',
] as const;

export type OpportunityComponentKey = (typeof OPPORTUNITY_COMPONENT_KEYS)[number];

export interface EvidenceReference {
  readonly id: string;
  readonly sourceType: string;
  readonly sourceReference: string;
  readonly claim: string;
  readonly capturedAt: Date;
  readonly confidence: number;
}

export interface OpportunityComponentInput {
  readonly value: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
}

export type OpportunityComponentInputs = Readonly<
  Record<OpportunityComponentKey, OpportunityComponentInput>
>;

export type OpportunityWeights = Readonly<Record<OpportunityComponentKey, number>>;

export interface OpportunityComponentResult {
  readonly key: OpportunityComponentKey;
  readonly normalizedValue: number;
  readonly normalizedWeight: number;
  readonly points: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
}

export interface OpportunityScore {
  readonly total: number;
  readonly components: readonly OpportunityComponentResult[];
}

export type LeadDisqualifier =
  | 'existing_client'
  | 'opted_out'
  | 'prohibited_industry'
  | 'invalid_contact'
  | 'complaint'
  | 'duplicate_active_campaign'
  | 'frequency_limit_reached'
  | 'insufficient_evidence'
  | 'human_pause';

export type OutreachChannel = 'email' | 'sms' | 'whatsapp';

export type ConsentState = 'granted' | 'not_required' | 'unknown' | 'denied';

export interface ChannelPermission {
  readonly channel: OutreachChannel;
  readonly destinationVerified: boolean;
  readonly providerReady: boolean;
  readonly suppressed: boolean;
  readonly marketingConsent: ConsentState;
}

export interface ChannelEligibility {
  readonly channel: OutreachChannel;
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

export interface LeadEligibilityInput {
  readonly disqualifiers: readonly LeadDisqualifier[];
  readonly channels: readonly ChannelPermission[];
}

export interface LeadEligibility {
  readonly eligible: boolean;
  readonly disqualifiers: readonly LeadDisqualifier[];
  readonly channels: readonly ChannelEligibility[];
  readonly preferredChannel: OutreachChannel | null;
}

export interface RankedLeadCandidate {
  readonly leadId: string;
  readonly organizationId: string;
  readonly score: OpportunityScore;
  readonly eligibility: LeadEligibility;
  readonly profileUpdatedAt: Date;
}

export type OutreachStep =
  | 'initial'
  | 'followup_2'
  | 'followup_3'
  | 'followup_4'
  | 'monthly_nurture';

export type OutreachStopReason =
  | 'reply_received'
  | 'opt_out'
  | 'complaint'
  | 'hard_bounce'
  | 'invalid_destination'
  | 'meeting_booked'
  | 'human_pause'
  | 'existing_client';

export interface OutreachState {
  readonly completedStep: OutreachStep | null;
  readonly lastSentAt: Date | null;
  readonly hasInboundReply: boolean;
  readonly stopReason: OutreachStopReason | null;
  readonly nurtureEligible: boolean;
}

export type OutreachDecision =
  | {
      readonly action: 'stop';
      readonly reason: OutreachStopReason;
    }
  | {
      readonly action: 'none';
      readonly reason: string;
      readonly nextReviewAt: Date | null;
    }
  | {
      readonly action: 'send';
      readonly step: OutreachStep;
      readonly dueAt: Date;
      readonly due: boolean;
    };

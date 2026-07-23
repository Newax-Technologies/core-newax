import type {
  ChannelEligibility,
  ChannelPermission,
  LeadEligibility,
  LeadEligibilityInput,
  OutreachChannel,
  RankedLeadCandidate,
} from '../types/lead-intelligence';

const CHANNEL_PRIORITY: readonly OutreachChannel[] = ['whatsapp', 'email', 'sms'];

function evaluateChannel(permission: ChannelPermission): ChannelEligibility {
  const reasons: string[] = [];

  if (!permission.destinationVerified) {
    reasons.push('destination_not_verified');
  }

  if (!permission.providerReady) {
    reasons.push('provider_not_ready');
  }

  if (permission.suppressed) {
    reasons.push('channel_suppressed');
  }

  if (permission.marketingConsent === 'denied') {
    reasons.push('marketing_consent_denied');
  }

  if (
    (permission.channel === 'sms' || permission.channel === 'whatsapp') &&
    permission.marketingConsent !== 'granted'
  ) {
    reasons.push('explicit_marketing_consent_required');
  }

  if (
    permission.channel === 'email' &&
    permission.marketingConsent !== 'granted' &&
    permission.marketingConsent !== 'not_required'
  ) {
    reasons.push('email_marketing_eligibility_unconfirmed');
  }

  return {
    channel: permission.channel,
    eligible: reasons.length === 0,
    reasons,
  };
}

export function evaluateLeadEligibility(input: LeadEligibilityInput): LeadEligibility {
  const disqualifiers = [...new Set(input.disqualifiers)];
  const channels = input.channels.map(evaluateChannel);
  const preferredEligibleChannel =
    CHANNEL_PRIORITY.find((channel) =>
      channels.some((eligibility) => eligibility.channel === channel && eligibility.eligible),
    ) ?? null;
  const eligible = disqualifiers.length === 0 && preferredEligibleChannel !== null;

  return {
    eligible,
    disqualifiers,
    channels,
    preferredChannel: eligible ? preferredEligibleChannel : null,
  };
}

function dataFreshnessPoints(candidate: RankedLeadCandidate): number {
  return (
    candidate.score.components.find((component) => component.key === 'dataFreshness')?.points ?? 0
  );
}

function timestamp(value: Date): number {
  const result = value.getTime();
  return Number.isFinite(result) ? result : 0;
}

function compareText(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

export function compareRankedLeads(
  left: RankedLeadCandidate,
  right: RankedLeadCandidate,
): number {
  const scoreDifference = right.score.total - left.score.total;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const freshnessDifference = dataFreshnessPoints(right) - dataFreshnessPoints(left);

  if (freshnessDifference !== 0) {
    return freshnessDifference;
  }

  const updateDifference = timestamp(right.profileUpdatedAt) - timestamp(left.profileUpdatedAt);

  if (updateDifference !== 0) {
    return updateDifference;
  }

  return compareText(left.leadId, right.leadId);
}

export function selectDailyLeadCohort(
  candidates: readonly RankedLeadCandidate[],
  limit = 10,
): readonly RankedLeadCandidate[] {
  const boundedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  const selectedLeadIds = new Set<string>();

  return candidates
    .filter((candidate) => candidate.eligibility.eligible)
    .sort(compareRankedLeads)
    .filter((candidate) => {
      if (selectedLeadIds.has(candidate.leadId)) {
        return false;
      }

      selectedLeadIds.add(candidate.leadId);
      return true;
    })
    .slice(0, boundedLimit);
}

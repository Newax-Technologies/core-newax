import type {
  OutreachDecision,
  OutreachState,
  OutreachStep,
} from '../types/lead-intelligence';

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS;

const NEXT_STEP: Readonly<Record<OutreachStep, OutreachStep>> = {
  initial: 'followup_2',
  followup_2: 'followup_3',
  followup_3: 'followup_4',
  followup_4: 'monthly_nurture',
  monthly_nurture: 'monthly_nurture',
};

const DELAY_AFTER_COMPLETED_STEP: Readonly<Record<OutreachStep, number>> = {
  initial: 48 * HOUR_IN_MILLISECONDS,
  followup_2: 3 * DAY_IN_MILLISECONDS,
  followup_3: 4 * DAY_IN_MILLISECONDS,
  followup_4: 30 * DAY_IN_MILLISECONDS,
  monthly_nurture: 30 * DAY_IN_MILLISECONDS,
};

function validTimestamp(value: Date): number | null {
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function nextOutreachDecision(state: OutreachState, now: Date): OutreachDecision {
  if (state.stopReason !== null) {
    return {
      action: 'stop',
      reason: state.stopReason,
    };
  }

  if (state.hasInboundReply) {
    return {
      action: 'stop',
      reason: 'reply_received',
    };
  }

  const nowTimestamp = validTimestamp(now);

  if (nowTimestamp === null) {
    return {
      action: 'none',
      reason: 'invalid_current_time',
      nextReviewAt: null,
    };
  }

  if (state.completedStep === null) {
    return {
      action: 'send',
      step: 'initial',
      dueAt: new Date(nowTimestamp),
      due: true,
    };
  }

  if (
    (state.completedStep === 'followup_4' || state.completedStep === 'monthly_nurture') &&
    !state.nurtureEligible
  ) {
    return {
      action: 'none',
      reason: 'cold_sequence_complete_without_nurture_eligibility',
      nextReviewAt: null,
    };
  }

  if (state.lastSentAt === null) {
    return {
      action: 'none',
      reason: 'completed_step_requires_last_sent_time',
      nextReviewAt: null,
    };
  }

  const lastSentTimestamp = validTimestamp(state.lastSentAt);

  if (lastSentTimestamp === null) {
    return {
      action: 'none',
      reason: 'invalid_last_sent_time',
      nextReviewAt: null,
    };
  }

  const dueTimestamp = lastSentTimestamp + DELAY_AFTER_COMPLETED_STEP[state.completedStep];
  const dueAt = new Date(dueTimestamp);

  return {
    action: 'send',
    step: NEXT_STEP[state.completedStep],
    dueAt,
    due: nowTimestamp >= dueTimestamp,
  };
}

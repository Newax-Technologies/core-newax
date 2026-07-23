# Changelog

All notable changes to the NEWAX Lead Intelligence module are recorded here.

## 0.1.0 - 2026-07-23

### Added

- Canonical lead evidence, score, eligibility, channel, ranking, and outreach-state contracts.
- Transparent eight-component opportunity scoring normalized to a 100-point scale.
- Component-level explanations and evidence identifier preservation.
- Lead disqualifiers and consent-aware email, WhatsApp, and SMS eligibility.
- Deterministic preferred-channel selection.
- Reproducible ranking by score, freshness, profile update time, and stable lead identifier.
- Duplicate-resistant bounded daily cohort selection with a default limit of ten.
- Initial, 48-hour, 3-day, 4-day, and consent-gated 30-day nurture cadence decisions.
- Immediate stop behavior for replies, opt-outs, complaints, hard bounces, invalid destinations, booked meetings, human pauses, and existing clients.
- Focused tests for scoring, ranking, eligibility, timing, stop behavior, and invalid boundaries.

### Security and compliance

- WhatsApp and SMS require explicit granted marketing consent.
- Email requires an established eligible consent state.
- Suppressed channels and disqualified leads cannot enter a daily cohort.
- Monthly nurture is unavailable without explicit nurture eligibility.

### Database

- No database schema or migration was introduced.

### Dependencies

- No runtime dependency was introduced.

### Deferred

- Source ingestion, provenance persistence, entity resolution, score history, campaign reservation, provider adapters, AI message generation, inbound reply handling, communication learning, API exposure, and dashboard behavior.

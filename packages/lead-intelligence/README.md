# NEWAX Lead Intelligence

## Status

`draft` foundation module, version `0.1.0`.

This module is not approved for production sending. It contains deterministic domain policy only and performs no database, network, provider, AI, scheduling, or message-delivery operations.

## Purpose

Lead Intelligence provides the reusable policy foundation for evidence-backed opportunity scoring, channel eligibility, deterministic ranking, bounded daily lead selection, and outreach cadence decisions.

It prevents research, CRM, campaign, AI, and provider integrations from inventing different definitions for score, eligibility, suppression, ranking, follow-up timing, or stop conditions.

## Owned concepts

- Opportunity score components, weights, explanations, and evidence references
- Lead disqualifiers
- Channel permission and consent eligibility
- Preferred eligible channel selection
- Deterministic lead ranking and daily cohort selection
- Outreach sequence steps, follow-up deadlines, nurture eligibility, and stop conditions

## Explicit non-ownership

This module does not own:

- Canonical organization or person identity
- Contacts, phone numbers, email addresses, or social accounts
- Source ingestion, scraping, or provider credentials
- Entity resolution or profile merging
- Campaign persistence or audit records
- Message content generation
- Email, WhatsApp, or SMS delivery
- Inbound webhook handling
- Meetings, opportunities, pricing, proposals, contracts, or customer records

Those capabilities must be introduced through separate modules or adapters with documented ownership boundaries.

## Public entry points

- `scoreOpportunity`
- `evaluateLeadEligibility`
- `compareRankedLeads`
- `selectDailyLeadCohort`
- `nextOutreachDecision`

All public types and default score weights are exported through `src/index.ts`.

## Opportunity score

The default transparent score totals 100 points:

| Component | Weight |
| --- | ---: |
| Sector fit | 20 |
| Visible operational need | 20 |
| Ability to pay | 15 |
| Buying or expansion signals | 15 |
| Value NEWAX can produce | 10 |
| Decision-maker reachability | 10 |
| Data freshness | 5 |
| Delivery suitability | 5 |

Input values are normalized from `0` through `1`. Values outside that range are clamped. Non-finite values contribute zero. Custom non-negative weights are normalized to a 100-point scale and must contain at least one positive value.

Every component result preserves an explanation and stable evidence identifiers. The module does not decide whether evidence is true; upstream research must provide source-backed observations and downstream persistence must retain provenance.

## Ranking order

Eligible candidates are ordered by:

1. Opportunity score, highest first
2. Data-freshness points, highest first
3. Profile update time, newest first
4. Stable lead identifier, ascending

Duplicate lead identifiers are removed after ranking. The daily cohort defaults to ten eligible leads.

## Channel policy

Channel eligibility requires a verified destination, a ready provider, no suppression, and an eligible consent state.

- WhatsApp and SMS require explicit granted marketing consent.
- Email requires granted consent or a separately established `not_required` eligibility state.
- Denied or unknown consent blocks the affected channel.
- A lead remains ineligible when any lead-level disqualifier exists, even when a channel is otherwise eligible.

Preferred channel order is WhatsApp, email, then SMS, but only among eligible channels. Provider adapters must not bypass this evaluation.

## Outreach cadence

The deterministic sequence is:

1. Initial message immediately
2. Follow-up 2 after 48 hours
3. Follow-up 3 after 3 days
4. Follow-up 4 after 4 days
5. Monthly nurture after 30 days only when explicit nurture eligibility exists

Any inbound reply or explicit stop reason halts future outreach. Stop reasons include opt-out, complaint, hard bounce, invalid destination, meeting booked, human pause, and conversion to an existing client.

## Dependencies

This foundation has no runtime dependencies.

Future orchestration may depend on approved contracts from Organizations, People, Contacts, Access Control, Trusted Request Context, Audit, Files, and External References. It must not directly mutate their owned data.

## Permissions

No protected application action is implemented in version `0.1.0`, so no executable permission is registered yet.

Future persistence, campaign, review, and delivery operations must define explicit permissions before exposure through an API or user interface.

## Configuration

The current configurable inputs are:

- Opportunity component weights
- Daily cohort limit
- Channel permission and consent facts
- Outreach state and nurture eligibility

Provider credentials, rate limits, business hours, campaign templates, and AI configuration are intentionally absent.

## Events

Version `0.1.0` emits and consumes no events.

Future event contracts must represent completed business facts and must not hide persistence ownership or provider failure behavior.

## Database ownership

Version `0.1.0` owns no database tables and includes no migration.

Persistence design is deferred until source provenance, reversible entity resolution, score history, campaign state, suppression, and audit ownership are reviewed together.

## Testing

Focused tests cover:

- Score bounds and custom-weight validation
- Complete component explanations and evidence identifiers
- WhatsApp, SMS, and email consent behavior
- Lead-level disqualification
- Deterministic tie-breaking and duplicate removal
- Ten-lead daily limit
- Initial, 48-hour, 3-day, 4-day, and 30-day timing
- Reply and stop-condition cancellation
- Nurture eligibility

## Folder use

The module currently uses `src/types`, `src/services`, and `tests`.

The standard `api`, `components`, `config`, `database`, `docs`, `events`, `pages`, `permissions`, and `stores` folders are intentionally absent because this increment introduces no API, UI, persistence, event, permission, or provider behavior. They must be added only when a reviewed capability requires them.

## Client customization

Clients may supply score weights and approved campaign policy through future configuration contracts. Client-specific industries, messages, providers, or compliance exceptions must not be hardcoded into this reusable module.

## Known limitations

- Research evidence is accepted as input but not independently verified here.
- Identity matching and merge confidence are not implemented.
- Score history is not persisted.
- No campaign reservation or concurrency control exists yet.
- No actual message can be generated or sent.
- No inbound reply can be received.
- No response-time learning is implemented.

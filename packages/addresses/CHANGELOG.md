# Changelog

## 0.1.0 - 2026-07-12

- Establish organization-scoped address creation and bounded listing.
- Reuse normalized canonical address records without exposing global address search.
- Enforce trusted Tenant and Organization boundaries.
- Serialize primary address assignment and add a PostgreSQL uniqueness backstop.
- Publish metadata-only `address.created` events.
- Keep Person-address operations disabled until privacy policy is approved.

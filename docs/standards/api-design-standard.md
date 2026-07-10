# NEWAX API Design Standard

## Purpose

Define consistent API design rules for NEWAX Core, reusable modules, LMS, and future business infrastructure systems.

This standard is for internal NEWAX engineering use. It aligns with ADR 0002: Use Permission-Based Access Control, ADR 0003: Design for Multi-Tenancy, ADR 0007: Define LMS Centralized Database and Data Ownership Rules, ADR 0008: Use Central Identity and Organization Registry, ADR 0010: Define Authentication and User Identity Strategy, and the NEWAX Security Baseline Standard.

This document is a standard only. It does not create actual API routes, controllers, production code, database migrations, or implementation logic.

## 1. What The API Design Standard Is

The API Design Standard defines how NEWAX APIs should be named, structured, protected, validated, versioned, documented, and maintained.

It applies to NEWAX Core APIs, reusable module APIs, LMS APIs, client-facing system APIs, and future domain APIs such as CRM, Legal, Healthcare, Finance, HR, Real Estate, Hospitality, and other business infrastructure platforms.

The standard creates a consistent API contract so that modules, client systems, integrations, reports, and future services can interact safely without every team inventing a different pattern.

## 2. Why NEWAX Needs API Consistency

NEWAX Core is intended to become reusable business infrastructure. Inconsistent API design would make modules harder to reuse, client systems harder to support, integrations harder to maintain, and security harder to review.

API consistency helps NEWAX:

- Keep reusable modules predictable.
- Protect tenant and organization boundaries.
- Apply permission-based access control consistently.
- Reduce frontend and integration confusion.
- Make error handling and validation easier to standardize.
- Support auditability for sensitive actions.
- Support future versioning and controlled updates.
- Avoid LMS-specific patterns becoming defaults for shared core resources.
- Improve long-term maintainability across business domains.

Consistent APIs make NEWAX systems easier to build, secure, test, document, and support.

## 3. API Naming Principles

API names must be clear, stable, and business-focused.

Rules:

- Use clear resource names.
- Use plural nouns for collections.
- Use lowercase kebab-case in URL paths.
- Use domain prefixes where useful for project-specific APIs.
- Use `core` for shared NEWAX foundation APIs.
- Avoid vague endpoints such as `/data`, `/info`, `/details`, `/process`, or `/do-action`.
- Do not design APIs only around LMS if the API belongs to NEWAX Core.
- Avoid exposing implementation details in endpoint names.
- Name APIs around business resources and actions, not database table names alone.

API names should help future NEWAX engineers understand the purpose without private explanation.

## 4. Endpoint Naming Rules

Endpoint paths must use predictable resource naming.

Core examples:

```text
GET /api/core/organizations
GET /api/core/people
GET /api/core/users
GET /api/core/roles
GET /api/core/permissions
```

LMS examples:

```text
GET /api/lms/students
GET /api/lms/teachers
GET /api/lms/courses
GET /api/lms/tests
GET /api/lms/payments
```

Rules:

- Use plural nouns for collections.
- Use a domain segment such as `/api/core`, `/api/lms`, `/api/crm`, or `/api/legal` where appropriate.
- Use lowercase kebab-case for multi-word path segments.
- Use resource IDs in path segments for individual records.
- Avoid vague action endpoints when CRUD would be clearer.
- Use action endpoints only when the action is not simple CRUD.
- Do not expose internal table names if a clearer business API name exists.

CRUD examples:

```text
GET /api/lms/students
POST /api/lms/students
GET /api/lms/students/{id}
PATCH /api/lms/students/{id}
DELETE /api/lms/students/{id}
```

Action endpoint examples:

```text
POST /api/lms/payments/{id}/approve
POST /api/lms/payments/{id}/reject
POST /api/lms/tests/{id}/publish
POST /api/core/users/{id}/suspend
```

Action endpoints must still enforce authentication, permissions, validation, tenant boundaries, and audit logging where appropriate.

## 5. HTTP Method Rules

Use HTTP methods consistently.

Rules:

- Use `GET` for reading data.
- Use `POST` for creating data.
- Use `PUT` for replacing a full resource where full replacement is supported.
- Use `PATCH` for partial updates.
- Use `DELETE` for deleting or archiving data.
- Use `POST` for domain actions that are not simple CRUD, such as approve, reject, publish, suspend, export, or submit.
- Do not use `GET` for state-changing actions.
- Do not use `POST` for reads unless there is a documented reason such as complex export preparation or sensitive search requirements.

Examples:

```text
GET /api/lms/students
POST /api/lms/students
GET /api/lms/students/{id}
PATCH /api/lms/students/{id}
DELETE /api/lms/students/{id}
POST /api/lms/payments/{id}/approve
```

Method choice should make API behavior predictable and safe.

## 6. Request Format Rules

Standard API requests should use JSON.

Example:

```json
{
  "person_id": "uuid",
  "organization_id": "uuid",
  "status": "active"
}
```

Rules:

- Use JSON for standard API request bodies.
- Use clear lowercase `snake_case` field names unless a specific integration requires a documented alternative.
- Validate all incoming request data.
- Do not trust client-provided `organization_id`, `user_id`, permissions, or role context without server-side verification.
- Do not accept fields that the caller is not allowed to set.
- Do not include secrets in request examples, documentation, or logs.
- File upload APIs may use multipart requests when appropriate.

Requests should be explicit, validated, and aligned with module rules.

## 7. Response Format Rules

APIs should use a consistent response envelope.

Successful response:

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully."
}
```

List response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100
  }
}
```

Rules:

- Use `success` to indicate request outcome.
- Use `data` for the response payload.
- Use `meta` for pagination, sorting, filtering, or supporting metadata.
- Use `message` for short human-readable success messages where helpful.
- Do not return inconsistent response shapes for similar endpoints.
- Do not include sensitive data unless required and permission-approved.
- Collection endpoints should return arrays in `data`.
- Single-record endpoints should return an object in `data`.

Consistent envelopes make frontend, reporting, integration, and support behavior easier to standardize.

## 8. Error Response Rules

Error responses must be consistent and safe.

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": {}
  }
}
```

Rules:

- Use `success: false` for failed requests.
- Use a stable `error.code` value for programmatic handling.
- Use a clear `error.message` that is safe to show or log.
- Use `error.details` for validation fields or structured context when appropriate.
- Do not expose stack traces, database errors, credentials, file paths, secrets, or internal implementation details.
- Do not reveal whether sensitive records exist unless the caller is authorized.
- Permission failures should not leak cross-tenant data.

Common error codes may include:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
PERMISSION_DENIED
RESOURCE_NOT_FOUND
TENANT_SCOPE_VIOLATION
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

Error responses must support debugging without creating security exposure.

## 9. Validation Rules

Validation protects business rules and system integrity.

Rules:

- Validate all incoming data.
- Reject invalid data before business logic runs where possible.
- Return clear validation messages.
- Do not expose internal system details in validation errors.
- Validation should align with module rules.
- Validate IDs, statuses, dates, files, filters, sorting fields, pagination values, and action inputs.
- Reject unknown or unauthorized fields where appropriate.
- Do not rely only on frontend validation.

Validation errors should be specific enough to fix the request and safe enough for production.

## 10. Pagination Rules

Collection endpoints should support pagination where data can grow.

Use:

```text
page
per_page
```

Example:

```text
GET /api/lms/students?page=1&per_page=25
```

Rules:

- Use `page` for the current page number.
- Use `per_page` for the requested page size.
- Define reasonable default and maximum page sizes.
- Include pagination metadata in `meta`.
- Do not return unbounded large collections from production APIs.
- Pagination must respect permissions and tenant boundaries.

Example metadata:

```json
{
  "page": 1,
  "per_page": 25,
  "total": 100
}
```

Pagination protects performance and keeps APIs predictable.

## 11. Filtering Rules

Filters should use clear query parameters.

Examples:

```text
GET /api/lms/students?status=active
GET /api/lms/payments?status=pending
GET /api/lms/courses?published=true
```

Rules:

- Use descriptive filter names.
- Validate filter values.
- Ignore or reject unsupported filters consistently.
- Do not allow filters to bypass tenant or permission rules.
- Do not expose sensitive internal fields as filters without approval.
- Document supported filters for each endpoint.

Filtering should make APIs useful without weakening security or performance.

## 12. Sorting Rules

Sorting should use a consistent `sort` query parameter.

Examples:

```text
GET /api/lms/students?sort=created_at
GET /api/lms/students?sort=-created_at
```

Rules:

- Use `sort` for sorting.
- Use the field name for ascending order.
- Use a leading `-` for descending order.
- Validate sort fields.
- Reject unsupported sort fields where appropriate.
- Do not allow sorting by sensitive or expensive fields unless approved.
- Sorting must not change permission or tenant behavior.

Sorting should be predictable and documented.

## 13. Search Rules

Search should use a consistent `search` query parameter for simple text search.

Example:

```text
GET /api/core/people?search=ali
```

Rules:

- Use `search` for simple search terms.
- Validate and sanitize search input.
- Search must respect permissions and tenant boundaries.
- Search results must not reveal cross-tenant or unauthorized records.
- Search should avoid exposing sensitive records by default.
- Advanced search may require documented endpoint-specific rules.

Search convenience must not become data discovery for unauthorized users.

## 14. Permission Checks

API permissions must be enforced on the server side.

Rules:

- Protected endpoints must require authentication.
- Sensitive endpoints must check explicit permissions.
- Business logic must check permissions, not hardcoded roles.
- APIs must not rely only on frontend hiding buttons.
- Permission checks must happen before sensitive data is returned or modified.
- Permission failures should be logged where security-sensitive.
- Each module must document the permissions required by its APIs.

Examples:

```text
GET /api/lms/payments requires payments.view
POST /api/lms/payments/{id}/approve requires payments.approve
GET /api/lms/reports requires reports.view
POST /api/lms/reports/export requires reports.export
```

Permissions define access. Roles may group permissions, but role names must not be hardcoded into API logic.

## 15. Tenant And Organization Boundary Rules

Tenant-scoped APIs must enforce organization boundaries.

Rules:

- Tenant-scoped APIs must enforce organization boundaries.
- A user must not retrieve records from another organization unless explicitly authorized.
- `organization_id` from the client request must not be blindly trusted.
- The server must derive or verify organization scope from authenticated user context, memberships, permissions, and approved access rules.
- Reports, exports, dashboards, and API responses must respect organization boundaries.
- Cross-organization access must be explicit, permission-controlled, and auditable.
- Tenant boundary failures must not leak sensitive data.

Tenant safety is a core API responsibility, not a frontend responsibility.

## 16. Authentication Requirements

Protected APIs must require authentication.

Rules:

- Protected APIs must require authentication.
- Public APIs must be explicitly documented.
- Admin APIs must never be public.
- Session or token strategy should be consistent across the system.
- Inactive, suspended, disabled, or archived users must not access protected APIs.
- Authentication must connect to the central user identity model where applicable.
- Authentication failures must not reveal sensitive account details.

Authentication answers who is calling the API. Permissions answer what the caller may do.

## 17. Audit Logging Requirements

Sensitive API actions should create audit events.

Examples:

```text
payment.approved
payment.rejected
student.suspended
result.updated
report.exported
permission.changed
admin.accessed_sensitive_data
```

Rules:

- Sensitive state-changing actions should be logged.
- Permission, role, admin, report export, payment, result, and sensitive file actions should be auditable where appropriate.
- Audit logs should include actor, organization scope, action, target, timestamp, and relevant context where possible.
- Audit logs must not expose passwords, tokens, API keys, or secret values.
- Super admin sensitive API actions must not bypass audit logs.

Audit logging makes API behavior accountable and supportable.

## 18. File Upload API Rules

File upload APIs require stronger controls.

Rules:

- Validate file type.
- Validate file size.
- Store files securely.
- Do not expose sensitive files publicly by default.
- Uploaded files should be associated with `organization_id` where appropriate.
- Uploads should be logged where appropriate.
- File access must be permission-controlled.
- Uploaded file metadata should not expose unnecessary sensitive data.
- File upload APIs may use multipart requests instead of JSON where appropriate.

File upload APIs must protect system integrity and client data.

## 19. Export API Rules

Export APIs can expose large amounts of data and require careful control.

Rules:

- Exports must require explicit permissions.
- Exports must respect organization boundaries.
- Sensitive exports should be logged.
- Export files should not remain publicly accessible forever.
- Export endpoints must not bypass report permissions.
- Export responses should not include data outside the requested and authorized scope.
- Export generation should be controlled for large datasets.
- Super admin export access must be explicit, permission-controlled, and auditable.

Export convenience must not weaken security, tenant isolation, or auditability.

## 20. Versioning Rules

API versioning may be introduced when breaking changes become necessary.

Rules:

- Avoid breaking client systems without migration planning.
- Breaking API changes must be documented.
- API versioning should be introduced when compatibility cannot be preserved safely.
- Versioning strategy must align with controlled updates and module versioning.
- Client deployment manifests should identify module versions that affect API behavior where applicable.
- API versions must not become a way to keep undocumented behavior alive forever.

Possible version path format when needed:

```text
/api/v1/lms/students
/api/v2/lms/students
```

Do not introduce API versions casually. Start simple and version when operational need justifies it.

## 21. Deprecation Rules

Deprecation must be documented and controlled.

Rules:

- Deprecated APIs must be documented.
- Deprecations must include replacement guidance where possible.
- Deprecation timelines should be clear for client systems.
- Deprecated APIs must continue enforcing authentication, permissions, tenant boundaries, and audit logging.
- Deprecated APIs must not be used for new development.
- Removing deprecated APIs requires compatibility review and migration planning.

Deprecation protects client systems from surprise breakage while allowing NEWAX APIs to evolve.

## 22. What Must Never Happen

The following practices are not allowed:

- Do not create vague endpoints.
- Do not expose admin APIs publicly.
- Do not trust `organization_id` blindly from client requests.
- Do not bypass permission checks because the frontend hides an action.
- Do not return sensitive data unnecessarily.
- Do not leak cross-tenant data.
- Do not expose stack traces or internal errors to users.
- Do not create inconsistent response formats.
- Do not create LMS-specific API patterns for shared core resources.
- Do not use `GET` for state-changing actions.
- Do not hardcode role names into API authorization logic.
- Do not allow exports or reports to bypass permissions and tenant boundaries.
- Do not create actual API routes, controllers, production code, or database migrations from this standard alone.

The API Design Standard protects consistency, security, tenant safety, access control, auditability, and long-term maintainability.

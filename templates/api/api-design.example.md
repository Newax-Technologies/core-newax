# API Design Example

## Purpose

This example shows practical API design patterns for NEWAX Core, LMS, and future business infrastructure systems.

This is an example document only. It does not create actual API routes, controllers, production code, database migrations, or implementation logic.

## Good Endpoints

Core endpoints:

```text
GET /api/core/organizations
POST /api/core/organizations
GET /api/core/organizations/{id}
PATCH /api/core/organizations/{id}
GET /api/core/people
GET /api/core/users
POST /api/core/users/{id}/suspend
GET /api/core/roles
GET /api/core/permissions
```

LMS endpoints:

```text
GET /api/lms/students
POST /api/lms/students
GET /api/lms/students/{id}
PATCH /api/lms/students/{id}
GET /api/lms/courses
POST /api/lms/tests/{id}/publish
POST /api/lms/payments/{id}/approve
POST /api/lms/payments/{id}/reject
POST /api/lms/reports/export
```

Why these are good:

- They use clear resource names.
- They use plural nouns for collections.
- They separate shared core APIs from LMS APIs.
- They reserve action endpoints for actions that are not simple CRUD.
- They are understandable without knowing internal database tables.

## Bad Endpoints

```text
GET /api/data
GET /api/info
POST /api/process
POST /api/do-action
GET /api/lms/core-users
POST /api/students/approve-payment
GET /api/admin-everything
GET /api/lms/students/delete/{id}
```

Why these are bad:

- They are vague.
- They mix domains incorrectly.
- They hide the resource being changed.
- They use unclear actions.
- They may encourage inconsistent permissions and audit logging.
- They may create LMS-specific patterns for shared core resources.

## Good Response Format

Single record response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "person_id": "uuid",
    "organization_id": "uuid",
    "status": "active"
  },
  "message": "Student profile retrieved successfully."
}
```

List response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "person_id": "uuid",
      "organization_id": "uuid",
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100
  }
}
```

Why this is good:

- It uses a consistent envelope.
- It separates payload data from metadata.
- It supports frontend and integration consistency.
- It avoids leaking unnecessary internal details.

## Bad Response Format

```json
{
  "students": [],
  "ok": "yes",
  "db_table": "lms_student_profiles",
  "sql": "internal query details",
  "debug": "stack trace here"
}
```

Why this is bad:

- It does not follow the standard response envelope.
- It exposes internal implementation details.
- It may leak sensitive debugging information.
- It is difficult for clients and integrations to handle consistently.

## Example Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted data is invalid.",
    "details": {
      "status": ["Status must be one of: active, inactive, suspended, archived."],
      "person_id": ["Person is required."]
    }
  }
}
```

Validation guidance:

- Validation errors should be clear.
- Validation errors should not expose database internals.
- Validation should happen before business logic where possible.
- Validation must not rely only on frontend checks.

## Example Pagination Response

Request:

```text
GET /api/lms/students?page=1&per_page=25&status=active&sort=-created_at
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "person_id": "uuid",
      "organization_id": "uuid",
      "status": "active",
      "created_at": "2026-07-10T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 100,
    "filters": {
      "status": "active"
    },
    "sort": "-created_at"
  }
}
```

Pagination guidance:

- Use `page` and `per_page`.
- Include pagination metadata.
- Validate filters and sort fields.
- Never return unbounded large collections from production APIs.

## Example Permission-Protected Endpoints

```text
GET /api/lms/payments requires payments.view
POST /api/lms/payments/{id}/approve requires payments.approve
POST /api/lms/payments/{id}/reject requires payments.reject
GET /api/lms/reports requires reports.view
POST /api/lms/reports/export requires reports.export
POST /api/core/users/{id}/suspend requires users.suspend
POST /api/core/permissions/assign requires permissions.manage
```

Permission guidance:

- Protected endpoints must require authentication.
- Sensitive endpoints must check explicit permissions.
- Business logic must check permissions, not hardcoded role names.
- APIs must not rely on frontend hiding buttons.

Bad authorization pattern:

```text
if user.role == "Admin"
```

Good authorization pattern:

```text
user.can("payments.approve")
```

## Example Tenant-Safe API Behavior

Request:

```text
GET /api/lms/students?organization_id=org_abc
```

Safe behavior:

- The API authenticates the user.
- The API checks the user's active organization memberships.
- The API checks required permissions such as `students.view`.
- The API verifies the user may access `org_abc`.
- The API filters records by approved organization scope server-side.
- The API does not blindly trust the requested `organization_id`.
- The API returns only records the user is allowed to access.
- Cross-organization access is explicit, permission-controlled, and auditable.

Unsafe behavior:

- The API accepts `organization_id` from the query string without verification.
- The API returns records for any requested organization.
- The API assumes frontend navigation is enough protection.
- The API lets reports or exports ignore tenant boundaries.

Tenant-safe APIs protect client trust and future multi-tenancy.

## Reminder

- Shared NEWAX APIs belong under clear core API conventions.
- Project-specific APIs should use domain-aware conventions.
- Permissions, tenant boundaries, validation, and audit logging belong on the server side.
- This example is documentation only and does not create API routes or controllers.

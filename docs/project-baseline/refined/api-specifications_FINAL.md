# API Specifications — AICTE Workflow Automation

**Project:** Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System  
**Document status:** Draft contract for Antigravity implementation planning; not yet an approved/fully frozen API contract  
**Revision:** 1.0  
**Prepared:** 24 October 2026  
**Audience:** Antigravity, frontend/backend developers, testers, technical reviewers  
**Primary purpose:** Define the API design rules, security boundaries, resource domains, proposed endpoint inventory, request/response conventions, error handling, workflow safeguards, testing obligations, and unresolved decisions required before implementation.

> **Accuracy and scope notice:** No document can truthfully guarantee “100% definite” details where the project record leaves decisions unresolved. This specification therefore distinguishes (1) constraints supported by the project documents, (2) a proposed REST endpoint inventory to be reviewed, and (3) decisions that must not be guessed. Proposed endpoint names and payload shapes below are planning contracts, not claims that routes already exist. Antigravity must not silently turn an unresolved policy, provider, statutory interpretation, or domain vocabulary into an assumed fact.

---

## 1. Source hierarchy and conflict handling

Read these files before implementing this specification:

1. Official Problem Statement (PS), if supplied in the project.
2. Applicable official AICTE Approval Process Handbook, amendments, corrigenda, circulars, directions, and legal orders, after applicability is verified.
3. `project-overview.md`
4. `project-requirements.md`
5. `project-architecture.md`
6. `DATABASE_SCHEMA_REVISION_2.md`
7. `Tech Stack Reasoning.txt`
8. This `api-specifications.md`

The PS and applicable official instruments govern project purpose and regulatory meaning. The project documents govern the planned technical design, except where they conflict or mark a decision unresolved. Do not use an API document to invent regulatory rules.

### 1.1 Known source limitations and inconsistencies

- The available regulatory reference is named `AICTE APH 2024–2027.pdf`. It must **not** be assumed to be the latest or applicable version for the live cycle. Verify later amendments/corrigenda/circulars/directions/legal orders before activating rules.
- The project record requires versioned REST APIs as the preferred approach, with `/api/v1` a proposed convention rather than an already implemented contract.
- Neon PostgreSQL and Neon Object Storage were set up earlier and the tech-stack/schema documents say not to replace them without approval. `project-overview.md` also records a later unresolved statement about whether they remain final choices. **Resolve this discrepancy with the project owner before irreversible provider-specific implementation.** This document does not silently resolve it.
- Better Auth is excluded. The final authentication/session approach is unresolved.
- Real-time updates are required by the project understanding, but Neon Realtime is excluded and no replacement transport has been selected.
- Email/SMTP provider, Redis/BullMQ hosting, application hosting, object-storage API semantics, and authorised AICTE integration are unresolved.
- The exact role names/permission matrix, application categories, official route rules, statutory timelines, retention periods, and some status vocabularies remain unresolved.
- Do not infer live AICTE connectivity. Until an authorised integration has been verified, label data as manual import/export or simulated/mock.

When source documents conflict, log the discrepancy as a decision item and request owner clarification. Do not silently choose whichever option is easiest to implement.

---

## 2. API status labels

Use these labels in implementation notes, endpoint inventories, and OpenAPI descriptions:

- **Required constraint:** Explicitly required by the project baseline (for example, authentication and authorisation on mutations, input validation, auditability, private file operations).
- **Proposed endpoint:** A recommended resource-oriented REST route for review; not frozen until confirmed against requirements and domain models.
- **Conditional:** Implement only if the corresponding feature is in the approved prototype scope and its policy/provider dependencies are resolved.
- **Blocked:** Must not be implemented as a real/live capability until the named decision is resolved.
- **Future:** Optional or deferred functionality; do not imply it exists in the initial prototype.

Do not publish an OpenAPI document that presents proposed or blocked functionality as implemented. Keep the specification synchronized with the actual routes and mark endpoint lifecycle/status in descriptions or an accompanying endpoint register.

---

## 3. API style and base path

### 3.1 Protocol and route structure

- Use HTTPS in deployed environments.
- Preferred style: versioned REST over JSON.
- Proposed base path: `/api/v1`. The version prefix is a planning convention and must be confirmed before the first public contract is frozen.
- Use resource-oriented nouns for collections and resources; use explicit action subroutes for domain transitions that cannot be safely represented as ordinary CRUD.
- Use UTF-8 JSON for normal request and response bodies.
- File uploads may use `multipart/form-data` or a provider-neutral upload protocol approved after storage capabilities are verified.
- Do not expose Prisma model shapes, internal table names, provider SDK objects, raw SQL errors, or storage provider response bodies as the public API contract.
- Do not place secrets, credentials, session tokens, signed URLs, or sensitive document content in URLs or query strings.
- Do not create a generic endpoint that lets a caller set any arbitrary application/workflow `status` field.

### 3.2 Resource naming

Use plural resource paths, lowercase kebab-case for multiword path segments, and stable opaque identifiers (UUIDs are the current schema convention for domain entities). Do not expose sequential database IDs unless an approved public identifier requires them.

Examples of proposed style:
- `/api/v1/applications`
- `/api/v1/applications/{applicationId}`
- `/api/v1/applications/{applicationId}/submit`
- `/api/v1/applications/{applicationId}/workflow-transitions`
- `/api/v1/documents/{documentId}/versions`

These examples illustrate style; they do not by themselves approve the final route list.

### 3.3 HTTP method semantics

- `GET`: Read a resource/list; must not mutate state.
- `POST`: Create a resource or execute a domain action.
- `PUT`: Full replacement only when explicitly defined and safe; avoid for most workflow resources.
- `PATCH`: Partial update of explicitly editable fields only. Never use it to bypass a workflow transition.
- `DELETE`: Only for resources where deletion is explicitly permitted. Regulatory records, submitted revisions, decisions, official communications, audit history, and workflow history must not be hard-deleted through ordinary APIs.
- A repeated POST that could create a duplicate business action must be idempotency-protected or guarded by a unique state constraint.

### 3.4 Content negotiation and encoding

- Default request/response media type: `application/json; charset=utf-8`.
- Return `Content-Type` accurately.
- Use ISO 8601 date/time strings. Instants should include timezone/UTC indication, e.g. `2026-10-24T10:30:00Z`. Date-only values must use `YYYY-MM-DD` and must not be converted into instants without a defined timezone/calendar rule.
- IDs are opaque strings to clients. Clients must not derive meaning from an ID's format beyond validation.
- API clients must not assume object property order.

---

## 4. Authentication, sessions, and authorization

### 4.1 Authentication status

Authentication is mandatory for protected business operations, but the provider/session approach has not been selected. **Do not use Better Auth.** Do not invent an authentication provider or token/session contract.

Before implementing protected endpoints, the project owner must approve:
- identity provider/authentication method;
- session or token strategy;
- session lifetime, renewal and revocation;
- cookie versus bearer-token transport;
- CSRF protections if cookies are used;
- CORS origins and credential policy;
- account recovery, MFA, and administrator recovery policy;
- authentication-related rate limits and lockout/abuse controls.

Until selected, API docs may describe a provider-neutral `AuthenticatedPrincipal` abstraction but must not pretend a working login flow exists.

### 4.2 Principal context

After authentication is selected, backend middleware should resolve a principal with at least:
- stable internal user ID;
- account active/suspended state;
- effective permissions;
- relevant institution memberships/scopes;
- assignment context where relevant;
- authentication/session context needed for security checks.

Do not trust user ID, role, institution ID, assignment status, or permission claims supplied in an ordinary request body. Resolve them from the authenticated server-side identity and authoritative database records.

### 4.3 Authorization checks

For every protected request, enforce all checks relevant to the action:
1. Is the caller authenticated?
2. Is the account active and allowed to act?
3. Does the caller have the required permission for this operation?
4. Does the caller have access to this institution/application/document?
5. Is the caller assigned to the case/stage where assignment is required?
6. Is the resource in a state that permits this action?
7. Is the applicable rule/workflow version verified, effective, and approved?
8. Is the action permitted for this application category and route?
9. Is the operation safe against duplicate or concurrent execution?

Return `401` for unauthenticated requests and `403` for authenticated callers who are not permitted, subject to a documented anti-enumeration policy. For protected resources, avoid revealing whether a record exists when doing so would leak sensitive information; the implementation may use a consistent `404` policy for out-of-scope records.

### 4.4 Role names are not frozen

The project discusses institution users, scrutiny officers, coordinators, administrators, committee/EVC participants, and other administrative actors. The final role catalogue and permission matrix are unresolved. Do not hard-code an unreviewed list of statutory roles or assume every project role can perform a decision.

Authorization should be permission-based and scoped. UI visibility is not authorization; every operation must be enforced on the server.

### 4.5 Sensitive actions

Require explicit authorization and audit events for, at minimum:
- submitting an application;
- assigning/reassigning a case;
- recording scrutiny observations;
- issuing a deficiency communication;
- accepting a resubmission;
- scheduling/completing an EVC event;
- recording a committee recommendation;
- recording, superseding, or correcting an official decision;
- creating an appeal record where applicable;
- issuing formal official communication;
- verifying documents/evidence;
- activating a rule/workflow version;
- changing a deadline or escalation;
- exporting sensitive data;
- changing user permissions;
- modifying integration configuration.

Any additional step-up authentication or multi-person approval is a blocked policy decision until confirmed.

---

## 5. Common request conventions

### 5.1 Request validation

Validate path parameters, query parameters, headers, and JSON/multipart bodies at the API boundary using Zod or an equivalent runtime validator.

- Reject malformed UUIDs and invalid identifiers.
- Reject unexpected enum/status values.
- Reject unknown fields for sensitive mutation endpoints unless a specific endpoint explicitly supports extension fields.
- Validate string lengths, numeric ranges, date/time formats, arrays, nested objects, file size/type limits, and cross-field conditions.
- Do not silently coerce ambiguous dates, IDs, boolean values, or statuses.
- Normalize only documented fields; preserve the original submitted value when legally/business relevant.
- Return field-level errors that do not expose secrets or internal implementation details.
- Apply database constraints in addition to request validation; application-level validation is not a substitute for foreign keys, uniqueness, and transaction safety.

### 5.2 Pagination

All potentially large list endpoints must support a documented pagination strategy. The final choice of offset/page versus cursor pagination must be consistent and recorded before the API is frozen.

Proposed cursor shape (not final):
- Query: `limit` and `cursor`.
- Response: `data`, `page.nextCursor`, and `page.hasMore`.

Requirements:
- Enforce a configured maximum page size; the numeric maximum is unresolved and must be chosen explicitly.
- Use stable ordering with a unique tie-breaker.
- Reject invalid cursors and invalid limits.
- Do not silently return an unbounded collection.
- Ensure page filtering and sorting are applied server-side.
- Do not promise snapshot-consistent pagination unless implemented.

### 5.3 Filtering and sorting

- Each list endpoint must document the exact allowed filters and sort keys.
- Reject unsupported filter/sort names; never interpolate client-supplied SQL identifiers.
- Enforce authorization before returning filtered data.
- Do not allow a caller to broaden access by changing an institution/application filter.
- Use stable ordering when paginating.
- Date range filters must define whether boundaries are inclusive and whether values are dates or instants.
- Do not implement arbitrary query-language passthrough to Prisma or SQL.

### 5.4 Concurrency and idempotency

For actions that can be retried or invoked concurrently:
- Accept an `Idempotency-Key` header or use a documented equivalent state/uniqueness guard.
- Define the idempotency scope (caller, route/action, and resource) and retention period before implementation; the exact period is unresolved.
- Reusing a key with a different request payload must produce a conflict rather than reusing the previous result silently.
- Use a database transaction for state transition plus history/audit/outbox writes.
- Check the expected prior state before mutation. Stale state must produce a conflict response.
- Use optimistic concurrency for mutable records where concurrent edits are possible. An `ETag`/`If-Match` contract may be used if selected; it is not currently frozen.
- Never rely solely on frontend disabled buttons to prevent duplicates.

### 5.5 Correlation IDs

- Accept a syntactically valid request/correlation ID only according to a documented format; otherwise generate one server-side.
- Return the ID in a response header such as `X-Request-Id` (header name to be confirmed consistently).
- Include it in structured server logs and error responses.
- Do not treat the correlation ID as an authentication secret.
- Do not log raw credentials, cookies, authorization headers, signed URLs, or private document contents.

---

## 6. Common response envelope

The exact envelope is a proposed convention and must be approved before OpenAPI is frozen. Use one consistent format across all implemented endpoints.

### 6.1 Successful response — proposed

```json
{
  "data": {},
  "meta": {
    "requestId": "opaque-correlation-id"
  }
}
```

For a list:
```json
{
  "data": [],
  "page": {
    "nextCursor": null,
    "hasMore": false
  },
  "meta": {
    "requestId": "opaque-correlation-id"
  }
}
```

Rules:
- `data` contains the public API representation, not a raw ORM object.
- `page` appears only for paginated collections.
- `meta.requestId` should be consistent with the response correlation header.
- Do not return secrets, raw object-store keys, internal provider details, or private implementation fields.
- A `204 No Content` response has no body.

### 6.2 Error response — proposed

Use a stable machine-readable code and safe human-readable message. Field errors may be included for validation.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "requestId": "opaque-correlation-id",
    "details": [
      {
        "field": "exampleField",
        "code": "INVALID_FORMAT",
        "message": "The field format is invalid."
      }
    ]
  }
}
```

The sample values are illustrative, not a frozen error-code catalogue. The final catalogue must be maintained centrally and documented in OpenAPI.

- Do not return stack traces, raw SQL/Prisma errors, connection strings, secret configuration, provider credentials, signed URLs, or internal storage paths.
- Avoid resource-existence leakage across authorization boundaries.
- Error details must not contain sensitive submitted values.
- Diagnostic details belong in protected server logs with redaction.

---

## 7. HTTP status code policy

Use status codes consistently:

| Status | Use |
|---|---|
| `200 OK` | Successful read or action returning a representation. |
| `201 Created` | Resource created; include a canonical resource identifier/location where appropriate. |
| `202 Accepted` | Work accepted for asynchronous processing, only where the API exposes a durable job/status resource. |
| `204 No Content` | Successful action with no response body. |
| `400 Bad Request` | Malformed request syntax or invalid query/path structure where not represented as `422`. |
| `401 Unauthorized` | No valid authentication context. |
| `403 Forbidden` | Authenticated caller lacks permission, subject to anti-enumeration policy. |
| `404 Not Found` | Resource does not exist or is intentionally concealed from this caller. |
| `409 Conflict` | Invalid current state, duplicate action, idempotency-key payload mismatch, stale/concurrent update, or uniqueness conflict. |
| `413 Content Too Large` | Upload exceeds configured size limit. |
| `415 Unsupported Media Type` | Unsupported content type/file media type. |
| `422 Unprocessable Content` | Structurally valid request fails semantic/business validation. |
| `429 Too Many Requests` | Rate limit exceeded; include `Retry-After` when meaningful. |
| `500 Internal Server Error` | Unexpected server failure; no internal details exposed. |
| `502/503/504` | Appropriate upstream/provider unavailable, service unavailable, or timeout where exposing the dependency failure is safe. |

The exact choice between `400` and `422` must be consistent and written into the OpenAPI error definitions. Never return `200` for a failed operation with an error hidden in the body.

---

## 8. Domain resource and endpoint inventory

**Important:** Routes below are proposed for review. They are not proof of implementation. Antigravity must map each route to a requirement ID, permission, state precondition, audit event, rule dependency, and test. Remove or mark blocked any endpoint not in approved scope. Do not create generic CRUD for append-only or legally sensitive records.

For every endpoint, the final OpenAPI definition must specify: method/path, status, authentication, permissions/scope, path/query/header/body schemas, response schema, errors, side effects, audit event, idempotency, transaction boundary, and applicable rule/version dependencies.

### 8.1 Health and service metadata

| Method | Proposed path | Status | Purpose and restrictions |
|---|---|---|---|
| `GET` | `/health/live` | Proposed | Process liveness only. Must not expose configuration/secrets. |
| `GET` | `/health/ready` | Proposed | Readiness based on required dependencies; return safe dependency state only. Do not expose credentials/connection strings. |
| `GET` | `/api/v1/meta` | Proposed | Optional public API version/build metadata. Must not expose internal deployment details or secrets. |

Health endpoint visibility and exact dependency checks must be selected during deployment design. Public health endpoints must remain minimal.

### 8.2 Authentication and current user — provider blocked

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Blocked | Do not implement until authentication provider/flow is approved. |
| `POST` | `/api/v1/auth/logout` | Blocked | Depends on session/token strategy. |
| `POST` | `/api/v1/auth/refresh` | Blocked | Only if the selected auth method uses refresh tokens/sessions requiring this route. |
| `GET` | `/api/v1/me` | Proposed | Return the authenticated user's safe profile and effective permission context. |
| `GET` | `/api/v1/me/permissions` | Conditional | Only if frontend requires a separate permission discovery route; it does not replace server enforcement. |

Do not expose password hashes, raw identity-provider tokens, session secrets, recovery secrets, or unnecessary personal data. Password-reset, MFA, invitation, and account recovery routes remain blocked until the identity approach is approved.

### 8.3 Users, roles, permissions, and memberships

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/users` | Proposed | List users visible to the caller, with approved filters/pagination. |
| `POST` | `/api/v1/users` | Conditional | Provision an account only under the approved identity lifecycle. |
| `GET` | `/api/v1/users/{userId}` | Proposed | Read permitted profile fields. |
| `PATCH` | `/api/v1/users/{userId}` | Conditional | Update only explicitly editable profile/account fields. |
| `POST` | `/api/v1/users/{userId}/deactivate` | Conditional | Deactivate, do not hard-delete audit actors. |
| `GET` | `/api/v1/roles` | Proposed | Read the approved role catalogue. |
| `GET` | `/api/v1/permissions` | Proposed | Read permission definitions if exposed to authorised administrators. |
| `GET` | `/api/v1/institutions/{institutionId}/memberships` | Proposed | List scoped memberships. |
| `POST` | `/api/v1/institutions/{institutionId}/memberships` | Conditional | Add membership after identity and role policy is approved. |
| `PATCH` | `/api/v1/memberships/{membershipId}` | Conditional | Change permitted membership attributes. |
| `POST` | `/api/v1/memberships/{membershipId}/deactivate` | Conditional | End access while preserving history. |
| `POST` | `/api/v1/users/{userId}/roles` | Conditional | Assign an approved role and scope. |
| `DELETE` | `/api/v1/users/{userId}/roles/{assignmentId}` | Conditional | Remove a role assignment only if history/audit semantics are defined; prefer deactivation/history over deletion. |

The final user-role catalogue and permission matrix are blocked. A user must not grant permissions to themselves or assign roles beyond their administrative scope. Changes to roles/memberships must be audited.

### 8.4 Institutions and application categories

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/institutions` | Proposed | List institutions within caller's permitted scope. |
| `POST` | `/api/v1/institutions` | Conditional | Create an institution only if institution onboarding is in prototype scope. |
| `GET` | `/api/v1/institutions/{institutionId}` | Proposed | Read permitted institution details. |
| `PATCH` | `/api/v1/institutions/{institutionId}` | Conditional | Update approved mutable fields; preserve historical snapshots where required. |
| `GET` | `/api/v1/application-categories` | Proposed | List only categories/configurations approved for this release. |
| `GET` | `/api/v1/application-categories/{categoryId}` | Proposed | Read category metadata and applicability status. |

Do not imply all AICTE categories are supported. The supported catalogue must be explicit and versioned. Do not activate an application category whose route/rules have not been reviewed.

### 8.5 Applications and revisions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications` | Proposed | Search/list applications within caller's institution/assignment/permission scope. |
| `POST` | `/api/v1/applications` | Proposed | Create an application draft with institution/category and required intake data. |
| `GET` | `/api/v1/applications/{applicationId}` | Proposed | Read permitted application summary and current workflow status. |
| `PATCH` | `/api/v1/applications/{applicationId}` | Proposed | Edit draft-only fields explicitly permitted by policy; do not mutate a submitted revision snapshot. |
| `POST` | `/api/v1/applications/{applicationId}/submit` | Proposed | Submit a draft after validating required fields, required document/evidence references, applicable category, and active verified workflow/rule version. |
| `GET` | `/api/v1/applications/{applicationId}/revisions` | Proposed | List immutable revision metadata. |
| `GET` | `/api/v1/applications/{applicationId}/revisions/{revisionId}` | Proposed | Read a permitted submitted snapshot. |
| `POST` | `/api/v1/applications/{applicationId}/revisions` | Conditional | Create a new revision/resubmission only when the application lifecycle permits it. |
| `GET` | `/api/v1/applications/{applicationId}/timeline` | Proposed | Return a permission-filtered timeline of workflow/business events. |
| `GET` | `/api/v1/applications/{applicationId}/assignments` | Proposed | Read assignment history visible to the caller. |
| `POST` | `/api/v1/applications/{applicationId}/assignments` | Conditional | Assign/reassign case with role and scope checks; append history, do not silently overwrite. |

Application submission must be atomic with its relevant revision/state/history/audit/outbox records. The API must return a conflict if the draft was concurrently submitted or changed. Required intake fields are category-specific and unresolved until the approved category catalogue is defined.

Do not accept arbitrary client-supplied values for `currentStage`, `decisionStatus`, `approvalStatus`, or equivalent authoritative fields.

### 8.6 Workflow definitions, rule catalogue, and transitions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/rules` | Proposed | List rule metadata with status/version/source filters; do not expose internal secrets. |
| `GET` | `/api/v1/rules/{ruleId}/versions` | Proposed | List versions and lifecycle state. |
| `GET` | `/api/v1/rule-versions/{ruleVersionId}` | Proposed | Read source citation, effective period, review status, and safe rule metadata. |
| `POST` | `/api/v1/rules` | Conditional | Create a draft rule record if rule administration is in scope. |
| `POST` | `/api/v1/rules/{ruleId}/versions` | Conditional | Create an immutable draft version. |
| `POST` | `/api/v1/rule-versions/{ruleVersionId}/review` | Conditional | Record human review outcome. |
| `POST` | `/api/v1/rule-versions/{ruleVersionId}/activate` | Conditional/guarded | Activate only after source/version/applicability, approver, effective dates, and tests are recorded and approved. |
| `GET` | `/api/v1/workflow-definitions` | Proposed | List definitions and versions available to authorised users. |
| `GET` | `/api/v1/workflow-definitions/{workflowDefinitionId}` | Proposed | Read stages, transitions, and linked rule versions. |
| `POST` | `/api/v1/workflow-definitions` | Conditional | Create a draft definition. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/versions` | Conditional | Create a new immutable version rather than modifying a published version. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/validate` | Conditional | Validate structural consistency and rule links; not legal correctness by itself. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/publish` | Conditional/guarded | Publish only after human review, source traceability, effective dates, and passing tests. |
| `GET` | `/api/v1/applications/{applicationId}/workflow` | Proposed | Read the current workflow instance and permitted stage/history. |
| `GET` | `/api/v1/applications/{applicationId}/workflow/transitions` | Proposed | Return transitions currently available to this caller for this case, subject to authorization. |
| `POST` | `/api/v1/applications/{applicationId}/workflow/transitions` | Proposed | Execute a named transition, not arbitrary status assignment. |

A transition request should identify the intended transition/action and any required evidence or reason. The final field names are to be set when the workflow model is approved. The server must re-evaluate authorization, current state, assignment, application category, workflow version, rule effective period, required prerequisites, and concurrency inside a transaction.

No route may automatically infer a route where required application data or verified rule configuration is missing. Return a conflict/validation result and flag the case for authorised review. Published definitions/rule versions are immutable; changes create new versions. A structurally valid rule is not automatically a legally valid rule.

### 8.7 Scrutiny observations, deficiencies, and responses

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/scrutiny-observations` | Proposed | List observations in the caller's permitted case scope. |
| `POST` | `/api/v1/applications/{applicationId}/scrutiny-observations` | Conditional | Record an authorised scrutiny observation tied to the relevant workflow/revision. |
| `GET` | `/api/v1/scrutiny-observations/{observationId}` | Proposed | Read an observation and its safe linked data. |
| `PATCH` | `/api/v1/scrutiny-observations/{observationId}` | Conditional | Correct editable draft-only fields before finalisation; preserve history where already acted upon. |
| `POST` | `/api/v1/applications/{applicationId}/deficiencies` | Conditional | Record a deficiency and, when authorised, initiate its formal communication workflow. |
| `GET` | `/api/v1/applications/{applicationId}/deficiencies` | Proposed | List deficiencies and status/history. |
| `GET` | `/api/v1/deficiencies/{deficiencyId}` | Proposed | Read deficiency details. |
| `POST` | `/api/v1/deficiencies/{deficiencyId}/responses` | Conditional | Submit a response/evidence package within the permitted response window/state. |
| `GET` | `/api/v1/deficiencies/{deficiencyId}/responses` | Proposed | List response submissions. |
| `GET` | `/api/v1/observation-responses/{responseId}` | Proposed | Read response metadata and permitted evidence references. |
| `POST` | `/api/v1/deficiencies/{deficiencyId}/close` | Conditional/guarded | Close only when the authorised workflow permits it; closure is not an official approval decision. |

Observation, deficiency, response, and formal communication are distinct records. Do not treat a deficiency as issued merely because a draft record exists. A response must retain its submission history and exact document-version evidence. Validate that linked observations/workflow instances/applications refer to the same application.

### 8.8 EVC scheduling and records

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/evc-events` | Proposed | List EVC events for an application if the approved route includes EVC. |
| `POST` | `/api/v1/applications/{applicationId}/evc-events` | Conditional | Schedule an EVC event only where the verified workflow route requires/allows it. |
| `GET` | `/api/v1/evc-events/{evcEventId}` | Proposed | Read event schedule/status and authorised details. |
| `PATCH` | `/api/v1/evc-events/{evcEventId}` | Conditional | Update only permitted scheduling fields; preserve change history. |
| `POST` | `/api/v1/evc-events/{evcEventId}/assignments` | Conditional | Assign an EVC member/role under approved rules. |
| `GET` | `/api/v1/evc-events/{evcEventId}/assignments` | Proposed | List member assignments within access scope. |
| `POST` | `/api/v1/evc-events/{evcEventId}/complete` | Conditional/guarded | Record completion and required evidence/record references; must not itself create an official approval decision. |
| `POST` | `/api/v1/evc-events/{evcEventId}/cancel` | Conditional/guarded | Cancel with authorised actor, reason, audit history, and rescheduling rules if approved. |

EVC must not be created as a universal stage. The route engine must rely on an applicable verified route configuration. Scheduling time, timezone, member roles, cancellation rules, evidence, and completion requirements must be defined in the approved workflow/rule configuration.

### 8.9 Committee proceedings and recommendations

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/committee-proceedings` | Proposed | List proceedings when the route includes the relevant committee. |
| `POST` | `/api/v1/applications/{applicationId}/committee-proceedings` | Conditional | Create a proceeding only when the approved route requires/allows it. |
| `GET` | `/api/v1/committee-proceedings/{proceedingId}` | Proposed | Read permitted proceeding details. |
| `PATCH` | `/api/v1/committee-proceedings/{proceedingId}` | Conditional | Edit draft details only; preserve finalised records. |
| `POST` | `/api/v1/committee-proceedings/{proceedingId}/recommendations` | Conditional | Record an authorised recommendation, separately from the official decision. |
| `GET` | `/api/v1/committee-proceedings/{proceedingId}/recommendations` | Proposed | List recommendations with audit metadata. |
| `GET` | `/api/v1/recommendations/{recommendationId}` | Proposed | Read a recommendation. |

Committee names, membership/attendance requirements, quorum, recommendation vocabularies, signatures, and the committee routes applicable to each category are not frozen. Do not invent them. A recommendation must never be represented as an official decision.

### 8.10 Official decisions, appeals, and communications

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/decisions` | Proposed | List decision records with supersession history. |
| `POST` | `/api/v1/applications/{applicationId}/decisions` | Conditional/guarded | Record a decision only by an authorised decision-maker and only within the approved process. |
| `GET` | `/api/v1/decisions/{decisionId}` | Proposed | Read a decision and its authority/source metadata. |
| `POST` | `/api/v1/decisions/{decisionId}/supersede` | Conditional/guarded | Supersede/correct a decision only under an approved procedure; retain the original record and reason. |
| `GET` | `/api/v1/applications/{applicationId}/appeals` | Conditional | List appeals only if the relevant route/rule permits them. |
| `POST` | `/api/v1/applications/{applicationId}/appeals` | Conditional/guarded | Create an appeal only after validating the applicable source, decision link, eligibility, window, and authorised actor. |
| `GET` | `/api/v1/appeals/{appealId}` | Conditional | Read an appeal. |
| `POST` | `/api/v1/appeals/{appealId}/record-outcome` | Conditional/guarded | Record an authorised outcome only if the appeal feature and outcome vocabulary are approved. |
| `GET` | `/api/v1/applications/{applicationId}/official-communications` | Proposed | List formal communications. |
| `POST` | `/api/v1/applications/{applicationId}/official-communications` | Conditional/guarded | Create a formal communication draft/record; issuance must be a separately authorised action if required. |
| `GET` | `/api/v1/official-communications/{communicationId}` | Proposed | Read permitted communication metadata and document references. |
| `POST` | `/api/v1/official-communications/{communicationId}/issue` | Conditional/guarded | Issue only after authorisation, required review, and approved signing/dispatch semantics. |

The API and data model must keep these concepts separate:
1. recommendation;
2. official decision;
3. formal communication/order;
4. notification/reminder;
5. escalation.

A notification does not constitute a formal communication. A generated draft is not an issued order. A recommendation is not an official decision. The application must not autonomously approve/reject applications or impose penalties. Exact decision powers, outcome values, appeal eligibility, timelines, formal issuance/signature requirements, and supersession procedures are blocked until verified.

### 8.11 Documents and document versions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/documents` | Proposed | List document metadata visible to the caller, with scope filters. |
| `POST` | `/api/v1/documents` | Proposed | Create document metadata/upload intent under an approved storage flow. |
| `GET` | `/api/v1/documents/{documentId}` | Proposed | Read permitted metadata only. |
| `POST` | `/api/v1/documents/{documentId}/versions` | Proposed | Add a new immutable version; do not overwrite the old version. |
| `GET` | `/api/v1/documents/{documentId}/versions` | Proposed | List version metadata. |
| `GET` | `/api/v1/documents/{documentId}/versions/{versionId}` | Proposed | Read metadata for an exact version. |
| `POST` | `/api/v1/document-versions/{versionId}/verification` | Conditional | Record a human verification result and verifier identity. |
| `GET` | `/api/v1/document-versions/{versionId}/verification-history` | Proposed | List verification history. |
| `POST` | `/api/v1/document-versions/{versionId}/download-access` | Conditional | If the storage provider requires it, request short-lived download access after server-side authorization. |
| `POST` | `/api/v1/document-versions/{versionId}/retire` | Conditional | Retire/hide a version only under approved retention rules; do not delete regulatory evidence silently. |

#### Document security requirements

- All document access must pass through server-side authorization. Never trust a document ID supplied by the client as proof of access.
- Keep storage private. Do not make uploaded evidence publicly accessible by default.
- Store metadata and object keys in the database; file bytes live in object storage. Do not expose raw object keys or provider credentials.
- Use exact immutable version references for scrutiny/compliance evidence.
- Verify file type from content where possible, not only the filename/declared MIME type.
- Apply configurable file-size limits; the numeric limit is unresolved.
- Generate server-controlled object keys. Do not use user-supplied paths directly.
- Scan files for malware if an approved scanning capability is selected; otherwise document the limitation and do not claim scanning.
- Avoid placing signed download URLs in audit logs or persistent business records.
- Storage provider API, upload mechanism, ACLs, signed URL lifetime, limits, and retention are blocked pending verification.
- Do not implement permanent deletion/purge until retention, legal hold, and recovery requirements are approved.

### 8.12 Compliance obligations, evidence, and validity

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/compliance-obligation-definitions` | Proposed | List approved obligation definitions and source/rule versions. |
| `POST` | `/api/v1/compliance-obligation-definitions` | Conditional | Create a draft definition if configuration administration is in scope. |
| `GET` | `/api/v1/compliance-obligations` | Proposed | List obligations visible to caller with institution/application/status/due-date filters. |
| `POST` | `/api/v1/compliance-obligations` | Conditional | Instantiate an obligation only under an approved rule and context. |
| `GET` | `/api/v1/compliance-obligations/{obligationId}` | Proposed | Read obligation, due/validity metadata, and evidence status. |
| `PATCH` | `/api/v1/compliance-obligations/{obligationId}` | Conditional | Change only fields permitted by the applicable workflow; do not silently alter a rule-derived deadline. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/evidence` | Conditional | Attach an exact document version as evidence. |
| `GET` | `/api/v1/compliance-obligations/{obligationId}/evidence` | Proposed | List linked evidence versions. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/verify` | Conditional/guarded | Record an authorised verification outcome. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/waive-or-extend` | Blocked until policy exists | Do not implement unless an applicable verified rule and authorised process explicitly allow this action. |

Compliance status vocabulary, whether an obligation is institution-wide or application-specific, validity rules, extensions/waivers, evidence sufficiency, and retention are not universal. Do not invent due dates or mark a document compliant solely because a file exists.

### 8.13 Deadlines, notifications, attempts, and escalation

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/deadlines` | Proposed | List deadlines within caller scope, with supported filters. |
| `GET` | `/api/v1/deadlines/{deadlineId}` | Proposed | Read deadline inputs, due value, status, and rule provenance. |
| `POST` | `/api/v1/deadlines/{deadlineId}/recalculate` | Conditional/guarded | Recalculate only from recorded trigger/input/rule version; record old/new values and reason. |
| `GET` | `/api/v1/notifications` | Proposed | List notifications for the authenticated recipient or authorised administrator scope. |
| `GET` | `/api/v1/notifications/{notificationId}` | Proposed | Read notification metadata and delivery state. |
| `POST` | `/api/v1/notifications/{notificationId}/mark-read` | Conditional | Only if read state is part of the approved model. |
| `GET` | `/api/v1/notifications/{notificationId}/attempts` | Conditional | Expose safe delivery-attempt metadata to authorised support/admin users. |
| `POST` | `/api/v1/notifications/test` | Conditional/admin-only | Test provider configuration without exposing secrets; disable in production unless explicitly approved. |
| `GET` | `/api/v1/escalations` | Proposed | List escalation records visible to the caller. |
| `GET` | `/api/v1/escalations/{escalationId}` | Proposed | Read escalation provenance and state. |
| `POST` | `/api/v1/escalations/{escalationId}/acknowledge` | Conditional | Acknowledge only if acknowledgement semantics and permission are defined. |
| `POST` | `/api/v1/escalations/{escalationId}/resolve` | Conditional | Resolve with authorised actor, reason, and audit trail. |

Rules:
- A deadline must record its trigger, source/rule version, calculation inputs, date-versus-instant semantics, timezone/calendar, and computed due value.
- Do not hard-code one deadline across categories unless a verified rule says it applies.
- A job must re-check the current database state and applicable rule before sending a reminder/escalation.
- Notifications, delivery attempts, and escalation records are distinct.
- A failed email send must not be reported as delivered.
- A notification or escalation must not itself make an official decision.
- The queue/worker provider is unresolved. Use a durable outbox pattern for business events; job delivery must be idempotent with retry/reconciliation.
- The SMTP provider, templates, retry schedule, quiet hours, recipient preferences, and escalation timings remain unresolved until approved.
- Do not expose SMTP credentials or raw provider responses.

### 8.14 Dashboards, reports, exports, and audit

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | Proposed | Return counts/metrics restricted to caller scope. |
| `GET` | `/api/v1/dashboard/pendency` | Proposed | Return pending-case aggregates and approved drill-down references. |
| `GET` | `/api/v1/reports` | Proposed | List available report definitions for the caller. |
| `POST` | `/api/v1/reports/exports` | Conditional | Request a report/export job if export functionality is in scope. |
| `GET` | `/api/v1/reports/exports/{exportId}` | Conditional | Read export job status. |
| `POST` | `/api/v1/reports/exports/{exportId}/download-access` | Conditional | Authorised short-lived access to a completed export if storage design permits. |
| `GET` | `/api/v1/audit-events` | Proposed/admin-restricted | Search audit events only for explicitly authorised users and permitted fields. |
| `GET` | `/api/v1/applications/{applicationId}/audit-events` | Conditional | Read application-scoped audit events if access policy permits. |

Dashboard aggregates must respect the same access scope as underlying records. Define each metric (numerator, denominator, date basis, status inclusion, and rule/category scope) before treating it as authoritative. Do not calculate an official compliance conclusion from a rough aggregate.

Audit records must be append-only through ordinary application APIs. Do not provide generic `PATCH`/`DELETE` endpoints for audit history. Audit entries should capture actor/system identity, action, target, timestamp, outcome, correlation ID, and safe before/after snapshots where appropriate. Never include secrets, full document contents, or unnecessary sensitive fields.

### 8.15 Integration and import/export

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/integrations` | Conditional/admin-only | List configured integration metadata without secrets. |
| `POST` | `/api/v1/integrations/imports` | Conditional | Start a validated manual/mock import job with source labeling and preview where appropriate. |
| `GET` | `/api/v1/integrations/imports/{importId}` | Conditional | Read import status and reconciliation summary. |
| `POST` | `/api/v1/integrations/exports` | Conditional | Produce a clearly labelled export for an authorised destination. |
| `GET` | `/api/v1/integrations/exports/{exportId}` | Conditional | Read export status. |
| `GET` | `/api/v1/integrations/sync-runs` | Conditional | List sync history if a real authorised integration is approved. |
| `GET` | `/api/v1/integrations/sync-runs/{syncRunId}` | Conditional | Read sync result and safe diagnostics. |

No real AICTE integration may be implemented or claimed until an authorised interface, credentials, permission to exchange data, supported schemas, rate limits, reconciliation behaviour, and failure policy have been confirmed. Do not scrape private systems or store external credentials in ordinary tables. A demo integration must be labelled `mock`/`simulated` in the UI, API metadata, logs, and documentation.

### 8.16 Operational incidents and administrative configuration

Operational incident management is optional/future in the current project record. If approved, design it as a separate operational module. Do not confuse operational incidents (for example, failed worker) with regulatory case events.

Provider settings, SMTP configuration, storage credentials, integration secrets, and deployment secrets must never be readable through ordinary API responses. Use the deployment platform's secret manager/environment configuration. Any admin configuration API requires an explicit security review, audit trail, least privilege, and secret-write/read semantics; no such endpoint is frozen here.

---

## 9. State transitions and domain action contracts

### 9.1 No arbitrary status mutation

The client must not submit a generic request such as:
```json
{ "status": "APPROVED" }
```
to an ordinary application update endpoint and cause a state change.

Instead, it requests a named action/transition. The server:
1. authenticates the actor;
2. authorizes role, scope, ownership, and assignment;
3. loads the current resource and expected version/state;
4. resolves the approved workflow and rule version applicable to the case;
5. checks route-specific preconditions and required evidence;
6. validates that the transition is allowed from the current state;
7. performs the business change in a transaction;
8. appends workflow history and audit records;
9. writes an outbox event in the same transaction;
10. returns the resulting safe representation.

If any precondition fails, make no partial business change. Return a stable validation/conflict error. External email, queue, or storage calls should not be made inside a database transaction unless a reviewed design explicitly requires it.

### 9.2 Human decision boundary

Automated logic may:
- validate completeness;
- evaluate configured, reviewed rules;
- calculate a deadline from approved inputs;
- identify missing information;
- recommend a next operational task;
- notify users and escalate overdue work;
- show status/pendency dashboards.

Automated logic must not autonomously:
- issue an official statutory approval/rejection;
- impose a penalty;
- make a legal determination;
- convert a committee recommendation into a decision;
- treat an email/notification as an official order.

Only an appropriately authorised human actor may record the official decision through the approved process. The API must preserve the distinction between a recommendation, decision, formal communication, notification, and escalation.

### 9.3 Rule provenance

For any operation whose validity depends on a regulatory or configured rule, retain enough information to reproduce why the system allowed the action or calculated a value:
- rule identifier and immutable version;
- official source title/version;
- exact clause/table/paragraph citation where applicable;
- source publication/effective date where available;
- applicability scope/category/cycle;
- review/approval actor and timestamp;
- effective-from/effective-until values;
- calculation inputs and output for deadline/rule computations;
- test/evidence reference for activation.

Do not activate a rule without verified applicability and human review. If rules conflict or are insufficient, flag the case for authorised review instead of guessing.

---

## 10. File upload/download API security

The final upload transport is provider-dependent. Whether direct-to-object-store upload is possible must be verified before implementing it. Regardless of transport:

1. Authorize the caller against institution/application/document scope before issuing an upload/download capability.
2. Generate object keys on the server.
3. Validate file size and permitted media types.
4. Inspect file content where practical; do not trust extension alone.
5. Store metadata, exact version, checksum where available, uploader, upload time, and scan/verification status where supported.
6. Do not overwrite prior versions.
7. Keep files private by default.
8. Return only safe metadata to the client.
9. Use short-lived access grants only if the provider supports them and the design is reviewed.
10. Avoid logging file contents, credentials, signed URLs, or sensitive document fields.
11. Enforce that a referenced document version belongs to its document and that the document context is consistent with the application/institution.
12. Define retention, legal hold, archive, and purge policy before permanent deletion is implemented.

The API must not assume Neon Object Storage supports any particular SDK, ACL model, signed-URL behaviour, multipart upload, maximum file size, checksum feature, or retention feature until verified against current provider documentation and the actual project configuration.

---

## 11. Real-time events — required capability, provider blocked

Real-time updates are required by the project understanding, but the transport/provider is not selected. Do not use Neon Realtime. Do not invent a WebSocket/SSE provider or publish an implemented transport before selection.

Before implementation, approve a separate event contract that specifies:
- transport and connection/authentication;
- event names and versioning;
- payload schema;
- event audience and subscription authorization;
- ordering guarantees (if any);
- event ID/sequence and duplicate handling;
- reconnect/backoff behaviour;
- replay/reconciliation strategy for missed events;
- heartbeat/connection limits;
- fallback to polling/manual refresh;
- provider failure behaviour.

Potential domain events (names are illustrative only) include:
- application submitted;
- application assignment changed;
- workflow stage changed;
- scrutiny observation recorded;
- deficiency issued;
- deficiency response submitted;
- EVC scheduled/rescheduled/completed;
- recommendation recorded;
- decision recorded/superseded;
- compliance obligation changed;
- deadline approaching/overdue;
- notification delivery state changed.

Do not broadcast an event merely because an internal database row changed. Publish only after the transaction commits, preferably through the transactional outbox. Events must contain minimal information; clients must refetch authorised resource details through the API. Subscription authorization must be enforced server-side. Support missed-event reconciliation; clients must tolerate duplicate/out-of-order delivery unless the selected transport guarantees otherwise.

---

## 12. Asynchronous jobs, outbox, and retries

For state changes that need notifications, realtime publication, or external synchronization:
- Write the business state, audit history, and outbox event atomically in one database transaction.
- A worker reads the outbox and attempts delivery.
- Record attempts and safe failure categories.
- Retry transient failures with a documented backoff policy.
- Make delivery idempotent using a stable event/delivery key.
- Re-check current state before executing time-sensitive reminders/escalations.
- Record terminal failure and expose operational visibility to authorised administrators.
- Provide reconciliation for stuck/pending outbox rows.
- Never mark an event delivered until the target service has confirmed delivery according to the provider's semantics.
- Avoid duplicate official communications when retrying a job.

Redis/BullMQ is proposed, not a confirmed hosting decision. The durable outbox and idempotent processing requirements apply regardless of the eventual queue provider.

---

## 13. Security and privacy requirements

- Apply least privilege to every endpoint and data query.
- Enforce tenant/institution/application scope on the backend; do not rely on frontend filtering.
- Validate all untrusted input.
- Use parameterized database access through Prisma/approved query mechanisms; do not concatenate user input into SQL.
- Protect cookies/session handling according to the selected authentication method.
- Configure CORS narrowly; do not use wildcard origins with credentialed requests.
- Apply rate limits to authentication, upload, export, search, and other abuse-sensitive operations. Numeric thresholds are deployment decisions and must be documented, not invented here.
- Apply CSRF protection if the chosen credential transport requires it.
- Redact secrets and sensitive personal/document data from logs.
- Do not return raw provider errors or internal stack traces.
- Keep object storage private and check authorization on every download/upload grant.
- Use approved secret management for database, SMTP, queue, storage, and integration credentials.
- Audit sensitive administrative and workflow actions.
- Avoid collecting personal data that is not needed for the approved workflow.
- Define retention, archival, legal hold, and deletion policies before implementing purge.
- Test direct-object-reference attacks, cross-institution access, wrong-assignee access, role escalation, replayed requests, and concurrent requests.
- Do not include a sensitive resource's existence in an error message where it would disclose information to an unauthorized caller.

Specific compliance certifications, cryptographic standards beyond platform defaults, numeric SLOs, and legal retention periods are not specified by the current project sources and must not be asserted without approval.

---

## 14. Audit requirements for mutating endpoints

Every successful sensitive mutation must emit an append-only audit record. Failed security-relevant attempts should be logged securely according to the security policy, without storing secrets.

Audit data should include, where applicable:
- event/audit ID;
- timestamp;
- actor user ID or system actor;
- action name;
- target resource type and ID;
- application/institution context where applicable;
- success/failure outcome;
- request/correlation ID;
- prior and resulting state/version where safe and useful;
- reason/comment supplied for a controlled action;
- rule/workflow version used;
- source of action (user/API/worker/import) without exposing credentials.

Audit data must not contain raw passwords/tokens, SMTP credentials, signed URLs, full uploaded document contents, or unneeded sensitive fields. Do not expose generic update/delete endpoints for audit events. Corrections to historical business records should be represented as new records or explicit supersession/correction events.

---

## 15. API endpoint implementation matrix

Before coding, Antigravity must produce a tracked matrix with at least these columns:

| Field | Required meaning |
|---|---|
| Requirement ID | One or more `FR-*`, `NFR-*`, or acceptance criterion IDs from `project-requirements.md`. |
| Module | Backend module responsible for the endpoint. |
| Method/path | Exact implemented route. |
| Status | Required, proposed, conditional, blocked, or future. |
| Auth | Anonymous, authenticated, or specific approved auth requirement. |
| Permission/scope | Exact approved permission and institution/application scope. |
| Request schema | Path/query/header/body schema and validation. |
| Response schema | Public representation and status code. |
| Error cases | Stable codes and HTTP statuses. |
| State precondition | Required current state and allowed transition. |
| Rule dependency | Exact rule/workflow version or “not applicable” with rationale. |
| Database effects | Rows changed/created and transaction boundary. |
| Audit event | Event type and fields. |
| Idempotency/concurrency | Key/state guard/version strategy. |
| Outbox/job/event | Asynchronous side effects and recovery. |
| Test reference | Unit, API/integration, and E2E tests. |
| Open decision | Owner and resolution status for unresolved dependencies. |

No endpoint is complete until the matrix and OpenAPI agree with the implementation.

---

## 16. OpenAPI requirements

Use OpenAPI to document the actual API contract. The specific OpenAPI version/tooling is not frozen, though Swagger/OpenAPI is the proposed documentation approach.

The OpenAPI document must include:
- server/base-path information per environment without secrets;
- authentication scheme only after the provider/transport is selected;
- all implemented paths and methods;
- operation IDs that are unique and stable;
- path/query/header parameters;
- request and response schemas;
- success and error status codes;
- pagination/filter/sort semantics;
- idempotency and concurrency headers where used;
- file upload/download content types and restrictions;
- permission and resource-scope requirements;
- descriptions of side effects and workflow preconditions;
- examples containing only fictional/demo data;
- deprecation/versioning policy;
- no routes labelled live if they are mock or unimplemented.

Do not fabricate an authentication scheme in OpenAPI while auth remains unresolved. Mark blocked operations in the endpoint register rather than documenting them as operational.

---

## 17. Testing requirements

### 17.1 API-level tests

Use the planned Vitest + Supertest stack if retained in the final toolchain. Every implemented endpoint needs tests for:
- valid request and expected response;
- malformed path/query/body;
- invalid ID and invalid enum/status;
- missing authentication;
- wrong role/permission;
- wrong institution/application scope;
- unassigned actor where assignment is required;
- resource not found or intentionally concealed;
- invalid current state;
- stale/concurrent mutation;
- duplicate submission/idempotency replay;
- missing/inactive/unverified rule version;
- rule effective-date mismatch;
- cross-record mismatch (for example, document version belongs to a different document);
- database constraint failure;
- audit record created for successful sensitive action;
- outbox event created atomically where applicable;
- provider/queue/storage/email failure and retry behaviour;
- no secrets in response/error/log;
- no autonomous statutory decision path.

### 17.2 Required workflow scenarios

At minimum, test:
1. Create draft → validate → submit → immutable revision and audit/history exist.
2. Concurrent double submission results in one successful transition and one conflict, not duplicate submissions.
3. Invalid/unverified/ambiguous route is blocked and surfaced for authorised review.
4. Scrutiny observation/deficiency/response histories remain distinct and traceable.
5. EVC can only be scheduled when the approved route permits it.
6. Committee recommendation does not create an official decision automatically.
7. Official decision requires authorised actor and is separately recorded from formal communication.
8. Applicable appeal rules are checked before creating an appeal.
9. Document versions remain immutable and evidence points to the exact reviewed version.
10. Cross-institution users cannot read or mutate another institution's resources without explicit authorization.
11. Deadline calculation retains rule version and calculation inputs.
12. Reminder job re-checks current state and does not send an obsolete reminder after the case changes.
13. Duplicate job/event delivery does not duplicate business actions or official communications.
14. Dashboard counts match the same authorized/filtering rules as underlying list endpoints.
15. Real-time reconnection/missed-event reconciliation works after provider selection.
16. Integration mock is clearly labelled and never represented as a live AICTE connection.

### 17.3 Contract and regression tests

- Validate the OpenAPI document in CI.
- Detect breaking API changes and require versioning/review.
- Test that generated frontend API types (if used) match the published contract.
- Maintain requirement → endpoint → database entity → UI workflow → source rule (where applicable) → test traceability.
- Seed only fictional records clearly labelled as demo data.
- Do not use live personal/institution data in tests unless explicitly authorized and protected.

---

## 18. Versioning, deprecation, and compatibility

- The proposed path prefix is `/api/v1`; confirm before public implementation.
- Avoid breaking changes within a released API version.
- For a breaking change, document the migration and use an approved versioning policy.
- Mark deprecated operations and specify a removal plan.
- Do not version every database table or expose database schema versions as API versions.
- Rule/workflow versioning is separate from API versioning.
- Do not alter the meaning of an existing rule/workflow version; create a new version.
- API contract changes that affect decisions, permissions, statuses, or deadlines require review and regression tests.

The project has not specified a public API support window or numeric deprecation period. Do not invent one; record the decision when external consumers exist.

---

## 19. Observability and operations

Track safe operational signals for:
- API request rate, latency, and error categories;
- database errors/timeouts;
- invalid/expired rule configuration;
- failed or retried outbox/job events;
- stuck pending outbox rows;
- email delivery failures;
- storage upload/download errors;
- unauthorized access attempts;
- integration sync conflicts/failures;
- real-time connection/publish failures after a provider is selected;
- migration status and backup/restore evidence where available.

Operational metrics must not expose sensitive records. Do not set numerical service-level objectives until the project owner approves them. Health endpoints must not disclose secrets or infrastructure details that create risk.

---

## 20. Decisions required before the API can be frozen

The following are explicit blockers. Antigravity must keep them in an open-decision register with owner, impact, and resolution evidence.

1. **Base path and contract approval:** confirm `/api/v1` and the common response/error envelopes.
2. **Authentication/session:** provider, session/token transport, login/logout/refresh, recovery, MFA, CSRF/CORS.
3. **Role/permission model:** role names, permission names, scope semantics, institution membership, assignment requirements, administrator boundaries.
4. **Application catalogue:** supported categories, intake fields, required evidence, identifiers, category versioning.
5. **Regulatory applicability:** current APH and all applicable amendments/circulars/directions/legal orders for each cycle/category.
6. **Workflow routes:** which category/cycle requires scrutiny, re-scrutiny, EVC, SAC/SHC/committee stages, appeal, or other steps.
7. **Business vocabularies:** final state/status values for applications, observations, deficiencies, EVC, recommendations, decisions, compliance, notifications, and escalations.
8. **Decision authority:** who can record an official decision and the correction/supersession procedure.
9. **Appeals:** eligibility, deadline, date calculation, permitted outcome, and required record/communication.
10. **Deadline semantics:** date versus instant, timezone/calendar, pause/restart, holidays, extensions, and escalation timing.
11. **Document storage:** whether Neon Object Storage remains final, current SDK/API, private access model, upload/download flow, file limits, signed URL behaviour, retention.
12. **Database decision discrepancy:** reconcile `Tech Stack Reasoning.txt`/schema's Neon direction with `project-overview.md`'s later unresolved wording before irreversible provider-specific work.
13. **Email provider:** SMTP host/provider, sender identity, templates, retries, preferences, delivery tracking.
14. **Queue/job hosting:** Redis/BullMQ provider or approved alternative, retry/backoff policy, worker deployment.
15. **Real-time transport:** approved provider/transport, event contract, auth, replay/reconciliation.
16. **AICTE integration:** authorized endpoint, credentials, permitted data scope, schema, rate limits, reconciliation and support owner.
17. **Retention/legal hold/deletion:** retention durations, archive rules, purge approval and data subject process if applicable.
18. **Pagination/filter limits:** maximum page size, default sort, allowed filters, cursor/offset choice.
19. **Idempotency/concurrency:** key format, retention, response replay, optimistic concurrency contract.
20. **Performance/accessibility/availability targets:** no numeric values are established in the source baseline.
21. **Optional/deferred scope:** OCR/AI extraction, payment/DSC validation, SMS/WhatsApp, operational incident module, advanced analytics, read receipts, committee attendance. AI/OCR is subject to the mandatory post-core activation gate in Section 23 and must not be implemented merely because it appears in this list.
22. **Deployment environments and secret management:** frontend/backend/worker hosts, allowed origins, migrations, rollback/recovery approach.

Do not block unrelated work unnecessarily, but do not mark a dependent feature complete or production-ready while its required decision remains unresolved.

---

## 21. Instructions for Antigravity

1. Read all source files listed in Section 1 before generating routes.
2. Reconcile this specification against `project-requirements.md` and `project-architecture.md`; do not silently replace or delete existing documents.
3. Produce an endpoint matrix and a list of source conflicts/open decisions before implementing provider-dependent or statutory functionality.
4. Build only approved endpoint groups. Mark the rest as blocked/future in both code and documentation.
5. Generate the Prisma schema/migrations from the reviewed logical schema; do not infer foreign keys or status semantics that are marked unresolved.
6. Implement authorization in backend services/middleware and database queries, not only in frontend components.
7. Implement transitions as explicit domain actions with state preconditions, transaction-safe history/audit/outbox, and idempotency/concurrency guards.
8. Implement private document access through the backend and verify storage provider behaviour before coding provider-specific logic.
9. Do not use Better Auth or Neon Realtime.
10. Do not claim live AICTE integration without an authorized interface and verified credentials. Mock data and simulated integrations must be labelled.
11. Do not activate a regulatory rule until it has an exact applicable source citation/version, effective dates, human review/approval, and passing tests.
12. Do not autonomously issue statutory approval/rejection decisions or penalties.
13. Keep recommendation, official decision, formal communication, notification, and escalation as separate concepts.
14. Keep audit/history append-only and preserve revisions and document versions.
15. Ensure OpenAPI matches actual routes and all endpoint tests pass before reporting the API as complete.
16. Report for every endpoint: implemented, deferred, blocked, or not applicable; include reason, related requirements, tests, and outstanding decisions.
17. Do not claim “100% correct” or “production-ready” merely because code compiles. Report what was tested, against which environment, and what remains unverified.
18. Follow Section 23 for the AI/OCR phase boundary. Do not implement AI/OCR unless the project owner gives Antigravity a specific, explicit prompt authorizing that implementation.

---

## 22. Definition of API completion

The API may be called **implementation-complete for an explicitly defined release** only when:
- the release scope and blockers are recorded;
- every implemented endpoint is in OpenAPI and the endpoint matrix;
- every endpoint has request/response/error schemas and documented permissions;
- all state-changing endpoints have state/authorization/rule checks;
- all sensitive mutations have audit/history and required outbox behaviour;
- database constraints and transaction boundaries are tested;
- document operations are private and provider semantics verified;
- workflow/route rules are traceable to reviewed sources;
- idempotency/concurrency tests pass for relevant actions;
- unit/API/E2E and security boundary tests pass;
- mock/live integrations are unambiguously labelled;
- no unresolved dependency is falsely reported as complete;
- known limitations and release decisions are documented.

This definition does not certify legal correctness of the underlying regulatory interpretation. That remains dependent on review of the currently applicable official instruments and approval by the responsible human authority.


---

## 23. AI/OCR Implementation Gate — Deferred Until Explicit Antigravity Prompt

**This section is the controlling instruction for all AI/OCR work. It is intentionally placed at the end of this document so that it acts as a later-phase gate, not as part of the mainline API build.**

### 23.1 Current status and activation condition

AI implementation is **deferred**. The current task is to complete the non-AI mainline project first.

AI/OCR work may begin **only when the project owner explicitly gives Antigravity a specific prompt instructing it to implement AI functionality**. Completion of the core project, architectural extensibility, an optional-scope mention, or a general request to continue development does not by itself authorize AI implementation.

Until that specific prompt is provided, Antigravity must treat AI/OCR as `DEFERRED — DO NOT IMPLEMENT`.

### 23.2 Prohibited during the mainline phase

Before receiving the explicit AI implementation prompt, do not:

- Implement AI/OCR API routes, OpenAPI operations, controllers, services, repositories, workers, prompts, model calls, or user-facing AI features.
- Install AI/ML/OCR-specific packages or SDKs, configure model providers, add model API keys/secrets, or provision AI-specific infrastructure.
- Add AI-specific database tables, fields, migrations, indexes, seed data, or mandatory schema dependencies.
- Add AI-dependent workflow branches or make any core operation require a model, OCR output, classification, extraction, or generated recommendation.
- Add UI buttons, pages, settings, or claims that imply AI/OCR is available or operational.
- Create speculative placeholder implementations or stubs that silently expand the current implementation scope.

Do not interpret references to future AI functionality elsewhere in this document as authorization to implement it.

### 23.3 Mainline must work independently of AI

The non-AI system must be usable end-to-end without AI services. Core workflows must rely on validated user input, configured and reviewed business/regulatory rules, and authorised human actions.

The mainline includes the approved core scope, such as authentication and authorization; institution and application management; configurable workflow processing; scrutiny and deficiency handling; EVC scheduling; committee proceedings; human-recorded recommendations and official decisions; compliance monitoring; document management; deadlines; notifications and escalations; dashboards; audit trails; and clearly labelled mock/manual integration boundaries where authorised live integrations are unavailable.

This list does not override the release scope or resolve any open decisions elsewhere in this specification.

### 23.4 What is allowed before activation

Only minimal, technology-neutral extensibility is permitted where it is genuinely needed by the core design. Do not introduce AI-specific abstractions, dependencies, schema, services, endpoints, or infrastructure just in case they may be useful later.

AI-related items may remain documented as deferred proposals or open decisions. They must not be represented as implemented API contract.

### 23.5 Requirements after explicit activation

After the project owner provides a specific prompt to Antigravity to implement AI, Antigravity must first propose a bounded AI phase plan before coding. That plan must specify:

1. The exact AI use cases and exclusions.
2. The intended users and human review/approval points.
3. The data to be processed, lawful/authorised access, retention, and privacy/security controls.
4. The provider/model/OCR approach and any costs, credentials, or infrastructure required.
5. Any new API routes, request/response schemas, database changes, dependencies, jobs, and UI changes.
6. Failure modes, retries, confidence/uncertainty handling where applicable, audit records, and manual fallback behaviour.
7. Tests, acceptance criteria, rollout/disable strategy, and documentation updates.
8. Any conflicts with this API specification, database schema, architecture, or requirements that must be resolved before implementation.

Antigravity must not infer approval of unspecified providers, costs, data access, or additional use cases from the activation prompt. It must identify material unresolved choices before making irreversible or externally consequential changes.

### 23.6 Human authority and regulatory safety

AI must not autonomously issue statutory approval/rejection decisions, penalties, or other official regulatory decisions. AI-generated extraction, classification, summaries, or recommendations must be distinguishable from verified facts and official decisions, with appropriate human review and traceable provenance. Regulatory rules must remain grounded in reviewed, applicable official sources; model output is not itself a legal authority.

### 23.7 Status reporting

Until explicitly activated, report AI/OCR as `DEFERRED — NOT IMPLEMENTED`, not as blocked core functionality and not as complete. Do not add AI endpoints to the active endpoint inventory or claim AI functionality exists.

When an explicit AI implementation prompt is later provided, update this specification and the affected architecture, requirements, database, security, and test documents as needed before or alongside implementation. Preserve the existing mainline contract unless a reviewed change requires otherwise.


---

## 1. Source hierarchy and conflict handling

Read these files before implementing this specification:

1. Official Problem Statement (PS), if supplied in the project.
2. Applicable official AICTE Approval Process Handbook, amendments, corrigenda, circulars, directions, and legal orders, after applicability is verified.
3. `project-overview.md`
4. `project-requirements.md`
5. `project-architecture.md`
6. `DATABASE_SCHEMA_REVISION_2.md`
7. `Tech Stack Reasoning.txt`
8. This `api-specifications.md`

The PS and applicable official instruments govern project purpose and regulatory meaning. The project documents govern the planned technical design, except where they conflict or mark a decision unresolved. Do not use an API document to invent regulatory rules.

### 1.1 Known source limitations and inconsistencies

- The available regulatory reference is named `AICTE APH 2024–2027.pdf`. It must **not** be assumed to be the latest or applicable version for the live cycle. Verify later amendments/corrigenda/circulars/directions/legal orders before activating rules.
- The project record requires versioned REST APIs as the preferred approach, with `/api/v1` a proposed convention rather than an already implemented contract.
- Neon PostgreSQL and Neon Object Storage were set up earlier and the tech-stack/schema documents say not to replace them without approval. `project-overview.md` also records a later unresolved statement about whether they remain final choices. **Resolve this discrepancy with the project owner before irreversible provider-specific implementation.** This document does not silently resolve it.
- Better Auth is excluded. The final authentication/session approach is unresolved.
- Real-time updates are required by the project understanding, but Neon Realtime is excluded and no replacement transport has been selected.
- Email/SMTP provider, Redis/BullMQ hosting, application hosting, object-storage API semantics, and authorised AICTE integration are unresolved.
- The exact role names/permission matrix, application categories, official route rules, statutory timelines, retention periods, and some status vocabularies remain unresolved.
- Do not infer live AICTE connectivity. Until an authorised integration has been verified, label data as manual import/export or simulated/mock.

When source documents conflict, log the discrepancy as a decision item and request owner clarification. Do not silently choose whichever option is easiest to implement.

---

## 2. API status labels

Use these labels in implementation notes, endpoint inventories, and OpenAPI descriptions:

- **Required constraint:** Explicitly required by the project baseline (for example, authentication and authorisation on mutations, input validation, auditability, private file operations).
- **Proposed endpoint:** A recommended resource-oriented REST route for review; not frozen until confirmed against requirements and domain models.
- **Conditional:** Implement only if the corresponding feature is in the approved prototype scope and its policy/provider dependencies are resolved.
- **Blocked:** Must not be implemented as a real/live capability until the named decision is resolved.
- **Future:** Optional or deferred functionality; do not imply it exists in the initial prototype.

Do not publish an OpenAPI document that presents proposed or blocked functionality as implemented. Keep the specification synchronized with the actual routes and mark endpoint lifecycle/status in descriptions or an accompanying endpoint register.

---

## 3. API style and base path

### 3.1 Protocol and route structure

- Use HTTPS in deployed environments.
- Preferred style: versioned REST over JSON.
- Proposed base path: `/api/v1`. The version prefix is a planning convention and must be confirmed before the first public contract is frozen.
- Use resource-oriented nouns for collections and resources; use explicit action subroutes for domain transitions that cannot be safely represented as ordinary CRUD.
- Use UTF-8 JSON for normal request and response bodies.
- File uploads may use `multipart/form-data` or a provider-neutral upload protocol approved after storage capabilities are verified.
- Do not expose Prisma model shapes, internal table names, provider SDK objects, raw SQL errors, or storage provider response bodies as the public API contract.
- Do not place secrets, credentials, session tokens, signed URLs, or sensitive document content in URLs or query strings.
- Do not create a generic endpoint that lets a caller set any arbitrary application/workflow `status` field.

### 3.2 Resource naming

Use plural resource paths, lowercase kebab-case for multiword path segments, and stable opaque identifiers (UUIDs are the current schema convention for domain entities). Do not expose sequential database IDs unless an approved public identifier requires them.

Examples of proposed style:
- `/api/v1/applications`
- `/api/v1/applications/{applicationId}`
- `/api/v1/applications/{applicationId}/submit`
- `/api/v1/applications/{applicationId}/workflow-transitions`
- `/api/v1/documents/{documentId}/versions`

These examples illustrate style; they do not by themselves approve the final route list.

### 3.3 HTTP method semantics

- `GET`: Read a resource/list; must not mutate state.
- `POST`: Create a resource or execute a domain action.
- `PUT`: Full replacement only when explicitly defined and safe; avoid for most workflow resources.
- `PATCH`: Partial update of explicitly editable fields only. Never use it to bypass a workflow transition.
- `DELETE`: Only for resources where deletion is explicitly permitted. Regulatory records, submitted revisions, decisions, official communications, audit history, and workflow history must not be hard-deleted through ordinary APIs.
- A repeated POST that could create a duplicate business action must be idempotency-protected or guarded by a unique state constraint.

### 3.4 Content negotiation and encoding

- Default request/response media type: `application/json; charset=utf-8`.
- Return `Content-Type` accurately.
- Use ISO 8601 date/time strings. Instants should include timezone/UTC indication, e.g. `2026-10-24T10:30:00Z`. Date-only values must use `YYYY-MM-DD` and must not be converted into instants without a defined timezone/calendar rule.
- IDs are opaque strings to clients. Clients must not derive meaning from an ID's format beyond validation.
- API clients must not assume object property order.

---

## 4. Authentication, sessions, and authorization

### 4.1 Authentication status

Authentication is mandatory for protected business operations, but the provider/session approach has not been selected. **Do not use Better Auth.** Do not invent an authentication provider or token/session contract.

Before implementing protected endpoints, the project owner must approve:
- identity provider/authentication method;
- session or token strategy;
- session lifetime, renewal and revocation;
- cookie versus bearer-token transport;
- CSRF protections if cookies are used;
- CORS origins and credential policy;
- account recovery, MFA, and administrator recovery policy;
- authentication-related rate limits and lockout/abuse controls.

Until selected, API docs may describe a provider-neutral `AuthenticatedPrincipal` abstraction but must not pretend a working login flow exists.

### 4.2 Principal context

After authentication is selected, backend middleware should resolve a principal with at least:
- stable internal user ID;
- account active/suspended state;
- effective permissions;
- relevant institution memberships/scopes;
- assignment context where relevant;
- authentication/session context needed for security checks.

Do not trust user ID, role, institution ID, assignment status, or permission claims supplied in an ordinary request body. Resolve them from the authenticated server-side identity and authoritative database records.

### 4.3 Authorization checks

For every protected request, enforce all checks relevant to the action:
1. Is the caller authenticated?
2. Is the account active and allowed to act?
3. Does the caller have the required permission for this operation?
4. Does the caller have access to this institution/application/document?
5. Is the caller assigned to the case/stage where assignment is required?
6. Is the resource in a state that permits this action?
7. Is the applicable rule/workflow version verified, effective, and approved?
8. Is the action permitted for this application category and route?
9. Is the operation safe against duplicate or concurrent execution?

Return `401` for unauthenticated requests and `403` for authenticated callers who are not permitted, subject to a documented anti-enumeration policy. For protected resources, avoid revealing whether a record exists when doing so would leak sensitive information; the implementation may use a consistent `404` policy for out-of-scope records.

### 4.4 Role names are not frozen

The project discusses institution users, scrutiny officers, coordinators, administrators, committee/EVC participants, and other administrative actors. The final role catalogue and permission matrix are unresolved. Do not hard-code an unreviewed list of statutory roles or assume every project role can perform a decision.

Authorization should be permission-based and scoped. UI visibility is not authorization; every operation must be enforced on the server.

### 4.5 Sensitive actions

Require explicit authorization and audit events for, at minimum:
- submitting an application;
- assigning/reassigning a case;
- recording scrutiny observations;
- issuing a deficiency communication;
- accepting a resubmission;
- scheduling/completing an EVC event;
- recording a committee recommendation;
- recording, superseding, or correcting an official decision;
- creating an appeal record where applicable;
- issuing formal official communication;
- verifying documents/evidence;
- activating a rule/workflow version;
- changing a deadline or escalation;
- exporting sensitive data;
- changing user permissions;
- modifying integration configuration.

Any additional step-up authentication or multi-person approval is a blocked policy decision until confirmed.

---

## 5. Common request conventions

### 5.1 Request validation

Validate path parameters, query parameters, headers, and JSON/multipart bodies at the API boundary using Zod or an equivalent runtime validator.

- Reject malformed UUIDs and invalid identifiers.
- Reject unexpected enum/status values.
- Reject unknown fields for sensitive mutation endpoints unless a specific endpoint explicitly supports extension fields.
- Validate string lengths, numeric ranges, date/time formats, arrays, nested objects, file size/type limits, and cross-field conditions.
- Do not silently coerce ambiguous dates, IDs, boolean values, or statuses.
- Normalize only documented fields; preserve the original submitted value when legally/business relevant.
- Return field-level errors that do not expose secrets or internal implementation details.
- Apply database constraints in addition to request validation; application-level validation is not a substitute for foreign keys, uniqueness, and transaction safety.

### 5.2 Pagination

All potentially large list endpoints must support a documented pagination strategy. The final choice of offset/page versus cursor pagination must be consistent and recorded before the API is frozen.

Proposed cursor shape (not final):
- Query: `limit` and `cursor`.
- Response: `data`, `page.nextCursor`, and `page.hasMore`.

Requirements:
- Enforce a configured maximum page size; the numeric maximum is unresolved and must be chosen explicitly.
- Use stable ordering with a unique tie-breaker.
- Reject invalid cursors and invalid limits.
- Do not silently return an unbounded collection.
- Ensure page filtering and sorting are applied server-side.
- Do not promise snapshot-consistent pagination unless implemented.

### 5.3 Filtering and sorting

- Each list endpoint must document the exact allowed filters and sort keys.
- Reject unsupported filter/sort names; never interpolate client-supplied SQL identifiers.
- Enforce authorization before returning filtered data.
- Do not allow a caller to broaden access by changing an institution/application filter.
- Use stable ordering when paginating.
- Date range filters must define whether boundaries are inclusive and whether values are dates or instants.
- Do not implement arbitrary query-language passthrough to Prisma or SQL.

### 5.4 Concurrency and idempotency

For actions that can be retried or invoked concurrently:
- Accept an `Idempotency-Key` header or use a documented equivalent state/uniqueness guard.
- Define the idempotency scope (caller, route/action, and resource) and retention period before implementation; the exact period is unresolved.
- Reusing a key with a different request payload must produce a conflict rather than reusing the previous result silently.
- Use a database transaction for state transition plus history/audit/outbox writes.
- Check the expected prior state before mutation. Stale state must produce a conflict response.
- Use optimistic concurrency for mutable records where concurrent edits are possible. An `ETag`/`If-Match` contract may be used if selected; it is not currently frozen.
- Never rely solely on frontend disabled buttons to prevent duplicates.

### 5.5 Correlation IDs

- Accept a syntactically valid request/correlation ID only according to a documented format; otherwise generate one server-side.
- Return the ID in a response header such as `X-Request-Id` (header name to be confirmed consistently).
- Include it in structured server logs and error responses.
- Do not treat the correlation ID as an authentication secret.
- Do not log raw credentials, cookies, authorization headers, signed URLs, or private document contents.

---

## 6. Common response envelope

The exact envelope is a proposed convention and must be approved before OpenAPI is frozen. Use one consistent format across all implemented endpoints.

### 6.1 Successful response — proposed

```json
{
  "data": {},
  "meta": {
    "requestId": "opaque-correlation-id"
  }
}
```

For a list:
```json
{
  "data": [],
  "page": {
    "nextCursor": null,
    "hasMore": false
  },
  "meta": {
    "requestId": "opaque-correlation-id"
  }
}
```

Rules:
- `data` contains the public API representation, not a raw ORM object.
- `page` appears only for paginated collections.
- `meta.requestId` should be consistent with the response correlation header.
- Do not return secrets, raw object-store keys, internal provider details, or private implementation fields.
- A `204 No Content` response has no body.

### 6.2 Error response — proposed

Use a stable machine-readable code and safe human-readable message. Field errors may be included for validation.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "requestId": "opaque-correlation-id",
    "details": [
      {
        "field": "exampleField",
        "code": "INVALID_FORMAT",
        "message": "The field format is invalid."
      }
    ]
  }
}
```

The sample values are illustrative, not a frozen error-code catalogue. The final catalogue must be maintained centrally and documented in OpenAPI.

- Do not return stack traces, raw SQL/Prisma errors, connection strings, secret configuration, provider credentials, signed URLs, or internal storage paths.
- Avoid resource-existence leakage across authorization boundaries.
- Error details must not contain sensitive submitted values.
- Diagnostic details belong in protected server logs with redaction.

---

## 7. HTTP status code policy

Use status codes consistently:

| Status | Use |
|---|---|
| `200 OK` | Successful read or action returning a representation. |
| `201 Created` | Resource created; include a canonical resource identifier/location where appropriate. |
| `202 Accepted` | Work accepted for asynchronous processing, only where the API exposes a durable job/status resource. |
| `204 No Content` | Successful action with no response body. |
| `400 Bad Request` | Malformed request syntax or invalid query/path structure where not represented as `422`. |
| `401 Unauthorized` | No valid authentication context. |
| `403 Forbidden` | Authenticated caller lacks permission, subject to anti-enumeration policy. |
| `404 Not Found` | Resource does not exist or is intentionally concealed from this caller. |
| `409 Conflict` | Invalid current state, duplicate action, idempotency-key payload mismatch, stale/concurrent update, or uniqueness conflict. |
| `413 Content Too Large` | Upload exceeds configured size limit. |
| `415 Unsupported Media Type` | Unsupported content type/file media type. |
| `422 Unprocessable Content` | Structurally valid request fails semantic/business validation. |
| `429 Too Many Requests` | Rate limit exceeded; include `Retry-After` when meaningful. |
| `500 Internal Server Error` | Unexpected server failure; no internal details exposed. |
| `502/503/504` | Appropriate upstream/provider unavailable, service unavailable, or timeout where exposing the dependency failure is safe. |

The exact choice between `400` and `422` must be consistent and written into the OpenAPI error definitions. Never return `200` for a failed operation with an error hidden in the body.

---

## 8. Domain resource and endpoint inventory

**Important:** Routes below are proposed for review. They are not proof of implementation. Antigravity must map each route to a requirement ID, permission, state precondition, audit event, rule dependency, and test. Remove or mark blocked any endpoint not in approved scope. Do not create generic CRUD for append-only or legally sensitive records.

For every endpoint, the final OpenAPI definition must specify: method/path, status, authentication, permissions/scope, path/query/header/body schemas, response schema, errors, side effects, audit event, idempotency, transaction boundary, and applicable rule/version dependencies.

### 8.1 Health and service metadata

| Method | Proposed path | Status | Purpose and restrictions |
|---|---|---|---|
| `GET` | `/health/live` | Proposed | Process liveness only. Must not expose configuration/secrets. |
| `GET` | `/health/ready` | Proposed | Readiness based on required dependencies; return safe dependency state only. Do not expose credentials/connection strings. |
| `GET` | `/api/v1/meta` | Proposed | Optional public API version/build metadata. Must not expose internal deployment details or secrets. |

Health endpoint visibility and exact dependency checks must be selected during deployment design. Public health endpoints must remain minimal.

### 8.2 Authentication and current user — provider blocked

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Blocked | Do not implement until authentication provider/flow is approved. |
| `POST` | `/api/v1/auth/logout` | Blocked | Depends on session/token strategy. |
| `POST` | `/api/v1/auth/refresh` | Blocked | Only if the selected auth method uses refresh tokens/sessions requiring this route. |
| `GET` | `/api/v1/me` | Proposed | Return the authenticated user's safe profile and effective permission context. |
| `GET` | `/api/v1/me/permissions` | Conditional | Only if frontend requires a separate permission discovery route; it does not replace server enforcement. |

Do not expose password hashes, raw identity-provider tokens, session secrets, recovery secrets, or unnecessary personal data. Password-reset, MFA, invitation, and account recovery routes remain blocked until the identity approach is approved.

### 8.3 Users, roles, permissions, and memberships

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/users` | Proposed | List users visible to the caller, with approved filters/pagination. |
| `POST` | `/api/v1/users` | Conditional | Provision an account only under the approved identity lifecycle. |
| `GET` | `/api/v1/users/{userId}` | Proposed | Read permitted profile fields. |
| `PATCH` | `/api/v1/users/{userId}` | Conditional | Update only explicitly editable profile/account fields. |
| `POST` | `/api/v1/users/{userId}/deactivate` | Conditional | Deactivate, do not hard-delete audit actors. |
| `GET` | `/api/v1/roles` | Proposed | Read the approved role catalogue. |
| `GET` | `/api/v1/permissions` | Proposed | Read permission definitions if exposed to authorised administrators. |
| `GET` | `/api/v1/institutions/{institutionId}/memberships` | Proposed | List scoped memberships. |
| `POST` | `/api/v1/institutions/{institutionId}/memberships` | Conditional | Add membership after identity and role policy is approved. |
| `PATCH` | `/api/v1/memberships/{membershipId}` | Conditional | Change permitted membership attributes. |
| `POST` | `/api/v1/memberships/{membershipId}/deactivate` | Conditional | End access while preserving history. |
| `POST` | `/api/v1/users/{userId}/roles` | Conditional | Assign an approved role and scope. |
| `DELETE` | `/api/v1/users/{userId}/roles/{assignmentId}` | Conditional | Remove a role assignment only if history/audit semantics are defined; prefer deactivation/history over deletion. |

The final user-role catalogue and permission matrix are blocked. A user must not grant permissions to themselves or assign roles beyond their administrative scope. Changes to roles/memberships must be audited.

### 8.4 Institutions and application categories

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/institutions` | Proposed | List institutions within caller's permitted scope. |
| `POST` | `/api/v1/institutions` | Conditional | Create an institution only if institution onboarding is in prototype scope. |
| `GET` | `/api/v1/institutions/{institutionId}` | Proposed | Read permitted institution details. |
| `PATCH` | `/api/v1/institutions/{institutionId}` | Conditional | Update approved mutable fields; preserve historical snapshots where required. |
| `GET` | `/api/v1/application-categories` | Proposed | List only categories/configurations approved for this release. |
| `GET` | `/api/v1/application-categories/{categoryId}` | Proposed | Read category metadata and applicability status. |

Do not imply all AICTE categories are supported. The supported catalogue must be explicit and versioned. Do not activate an application category whose route/rules have not been reviewed.

### 8.5 Applications and revisions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications` | Proposed | Search/list applications within caller's institution/assignment/permission scope. |
| `POST` | `/api/v1/applications` | Proposed | Create an application draft with institution/category and required intake data. |
| `GET` | `/api/v1/applications/{applicationId}` | Proposed | Read permitted application summary and current workflow status. |
| `PATCH` | `/api/v1/applications/{applicationId}` | Proposed | Edit draft-only fields explicitly permitted by policy; do not mutate a submitted revision snapshot. |
| `POST` | `/api/v1/applications/{applicationId}/submit` | Proposed | Submit a draft after validating required fields, required document/evidence references, applicable category, and active verified workflow/rule version. |
| `GET` | `/api/v1/applications/{applicationId}/revisions` | Proposed | List immutable revision metadata. |
| `GET` | `/api/v1/applications/{applicationId}/revisions/{revisionId}` | Proposed | Read a permitted submitted snapshot. |
| `POST` | `/api/v1/applications/{applicationId}/revisions` | Conditional | Create a new revision/resubmission only when the application lifecycle permits it. |
| `GET` | `/api/v1/applications/{applicationId}/timeline` | Proposed | Return a permission-filtered timeline of workflow/business events. |
| `GET` | `/api/v1/applications/{applicationId}/assignments` | Proposed | Read assignment history visible to the caller. |
| `POST` | `/api/v1/applications/{applicationId}/assignments` | Conditional | Assign/reassign case with role and scope checks; append history, do not silently overwrite. |

Application submission must be atomic with its relevant revision/state/history/audit/outbox records. The API must return a conflict if the draft was concurrently submitted or changed. Required intake fields are category-specific and unresolved until the approved category catalogue is defined.

Do not accept arbitrary client-supplied values for `currentStage`, `decisionStatus`, `approvalStatus`, or equivalent authoritative fields.

### 8.6 Workflow definitions, rule catalogue, and transitions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/rules` | Proposed | List rule metadata with status/version/source filters; do not expose internal secrets. |
| `GET` | `/api/v1/rules/{ruleId}/versions` | Proposed | List versions and lifecycle state. |
| `GET` | `/api/v1/rule-versions/{ruleVersionId}` | Proposed | Read source citation, effective period, review status, and safe rule metadata. |
| `POST` | `/api/v1/rules` | Conditional | Create a draft rule record if rule administration is in scope. |
| `POST` | `/api/v1/rules/{ruleId}/versions` | Conditional | Create an immutable draft version. |
| `POST` | `/api/v1/rule-versions/{ruleVersionId}/review` | Conditional | Record human review outcome. |
| `POST` | `/api/v1/rule-versions/{ruleVersionId}/activate` | Conditional/guarded | Activate only after source/version/applicability, approver, effective dates, and tests are recorded and approved. |
| `GET` | `/api/v1/workflow-definitions` | Proposed | List definitions and versions available to authorised users. |
| `GET` | `/api/v1/workflow-definitions/{workflowDefinitionId}` | Proposed | Read stages, transitions, and linked rule versions. |
| `POST` | `/api/v1/workflow-definitions` | Conditional | Create a draft definition. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/versions` | Conditional | Create a new immutable version rather than modifying a published version. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/validate` | Conditional | Validate structural consistency and rule links; not legal correctness by itself. |
| `POST` | `/api/v1/workflow-definitions/{workflowDefinitionId}/publish` | Conditional/guarded | Publish only after human review, source traceability, effective dates, and passing tests. |
| `GET` | `/api/v1/applications/{applicationId}/workflow` | Proposed | Read the current workflow instance and permitted stage/history. |
| `GET` | `/api/v1/applications/{applicationId}/workflow/transitions` | Proposed | Return transitions currently available to this caller for this case, subject to authorization. |
| `POST` | `/api/v1/applications/{applicationId}/workflow/transitions` | Proposed | Execute a named transition, not arbitrary status assignment. |

A transition request should identify the intended transition/action and any required evidence or reason. The final field names are to be set when the workflow model is approved. The server must re-evaluate authorization, current state, assignment, application category, workflow version, rule effective period, required prerequisites, and concurrency inside a transaction.

No route may automatically infer a route where required application data or verified rule configuration is missing. Return a conflict/validation result and flag the case for authorised review. Published definitions/rule versions are immutable; changes create new versions. A structurally valid rule is not automatically a legally valid rule.

### 8.7 Scrutiny observations, deficiencies, and responses

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/scrutiny-observations` | Proposed | List observations in the caller's permitted case scope. |
| `POST` | `/api/v1/applications/{applicationId}/scrutiny-observations` | Conditional | Record an authorised scrutiny observation tied to the relevant workflow/revision. |
| `GET` | `/api/v1/scrutiny-observations/{observationId}` | Proposed | Read an observation and its safe linked data. |
| `PATCH` | `/api/v1/scrutiny-observations/{observationId}` | Conditional | Correct editable draft-only fields before finalisation; preserve history where already acted upon. |
| `POST` | `/api/v1/applications/{applicationId}/deficiencies` | Conditional | Record a deficiency and, when authorised, initiate its formal communication workflow. |
| `GET` | `/api/v1/applications/{applicationId}/deficiencies` | Proposed | List deficiencies and status/history. |
| `GET` | `/api/v1/deficiencies/{deficiencyId}` | Proposed | Read deficiency details. |
| `POST` | `/api/v1/deficiencies/{deficiencyId}/responses` | Conditional | Submit a response/evidence package within the permitted response window/state. |
| `GET` | `/api/v1/deficiencies/{deficiencyId}/responses` | Proposed | List response submissions. |
| `GET` | `/api/v1/observation-responses/{responseId}` | Proposed | Read response metadata and permitted evidence references. |
| `POST` | `/api/v1/deficiencies/{deficiencyId}/close` | Conditional/guarded | Close only when the authorised workflow permits it; closure is not an official approval decision. |

Observation, deficiency, response, and formal communication are distinct records. Do not treat a deficiency as issued merely because a draft record exists. A response must retain its submission history and exact document-version evidence. Validate that linked observations/workflow instances/applications refer to the same application.

### 8.8 EVC scheduling and records

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/evc-events` | Proposed | List EVC events for an application if the approved route includes EVC. |
| `POST` | `/api/v1/applications/{applicationId}/evc-events` | Conditional | Schedule an EVC event only where the verified workflow route requires/allows it. |
| `GET` | `/api/v1/evc-events/{evcEventId}` | Proposed | Read event schedule/status and authorised details. |
| `PATCH` | `/api/v1/evc-events/{evcEventId}` | Conditional | Update only permitted scheduling fields; preserve change history. |
| `POST` | `/api/v1/evc-events/{evcEventId}/assignments` | Conditional | Assign an EVC member/role under approved rules. |
| `GET` | `/api/v1/evc-events/{evcEventId}/assignments` | Proposed | List member assignments within access scope. |
| `POST` | `/api/v1/evc-events/{evcEventId}/complete` | Conditional/guarded | Record completion and required evidence/record references; must not itself create an official approval decision. |
| `POST` | `/api/v1/evc-events/{evcEventId}/cancel` | Conditional/guarded | Cancel with authorised actor, reason, audit history, and rescheduling rules if approved. |

EVC must not be created as a universal stage. The route engine must rely on an applicable verified route configuration. Scheduling time, timezone, member roles, cancellation rules, evidence, and completion requirements must be defined in the approved workflow/rule configuration.

### 8.9 Committee proceedings and recommendations

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/committee-proceedings` | Proposed | List proceedings when the route includes the relevant committee. |
| `POST` | `/api/v1/applications/{applicationId}/committee-proceedings` | Conditional | Create a proceeding only when the approved route requires/allows it. |
| `GET` | `/api/v1/committee-proceedings/{proceedingId}` | Proposed | Read permitted proceeding details. |
| `PATCH` | `/api/v1/committee-proceedings/{proceedingId}` | Conditional | Edit draft details only; preserve finalised records. |
| `POST` | `/api/v1/committee-proceedings/{proceedingId}/recommendations` | Conditional | Record an authorised recommendation, separately from the official decision. |
| `GET` | `/api/v1/committee-proceedings/{proceedingId}/recommendations` | Proposed | List recommendations with audit metadata. |
| `GET` | `/api/v1/recommendations/{recommendationId}` | Proposed | Read a recommendation. |

Committee names, membership/attendance requirements, quorum, recommendation vocabularies, signatures, and the committee routes applicable to each category are not frozen. Do not invent them. A recommendation must never be represented as an official decision.

### 8.10 Official decisions, appeals, and communications

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/applications/{applicationId}/decisions` | Proposed | List decision records with supersession history. |
| `POST` | `/api/v1/applications/{applicationId}/decisions` | Conditional/guarded | Record a decision only by an authorised decision-maker and only within the approved process. |
| `GET` | `/api/v1/decisions/{decisionId}` | Proposed | Read a decision and its authority/source metadata. |
| `POST` | `/api/v1/decisions/{decisionId}/supersede` | Conditional/guarded | Supersede/correct a decision only under an approved procedure; retain the original record and reason. |
| `GET` | `/api/v1/applications/{applicationId}/appeals` | Conditional | List appeals only if the relevant route/rule permits them. |
| `POST` | `/api/v1/applications/{applicationId}/appeals` | Conditional/guarded | Create an appeal only after validating the applicable source, decision link, eligibility, window, and authorised actor. |
| `GET` | `/api/v1/appeals/{appealId}` | Conditional | Read an appeal. |
| `POST` | `/api/v1/appeals/{appealId}/record-outcome` | Conditional/guarded | Record an authorised outcome only if the appeal feature and outcome vocabulary are approved. |
| `GET` | `/api/v1/applications/{applicationId}/official-communications` | Proposed | List formal communications. |
| `POST` | `/api/v1/applications/{applicationId}/official-communications` | Conditional/guarded | Create a formal communication draft/record; issuance must be a separately authorised action if required. |
| `GET` | `/api/v1/official-communications/{communicationId}` | Proposed | Read permitted communication metadata and document references. |
| `POST` | `/api/v1/official-communications/{communicationId}/issue` | Conditional/guarded | Issue only after authorisation, required review, and approved signing/dispatch semantics. |

The API and data model must keep these concepts separate:
1. recommendation;
2. official decision;
3. formal communication/order;
4. notification/reminder;
5. escalation.

A notification does not constitute a formal communication. A generated draft is not an issued order. A recommendation is not an official decision. The application must not autonomously approve/reject applications or impose penalties. Exact decision powers, outcome values, appeal eligibility, timelines, formal issuance/signature requirements, and supersession procedures are blocked until verified.

### 8.11 Documents and document versions

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/documents` | Proposed | List document metadata visible to the caller, with scope filters. |
| `POST` | `/api/v1/documents` | Proposed | Create document metadata/upload intent under an approved storage flow. |
| `GET` | `/api/v1/documents/{documentId}` | Proposed | Read permitted metadata only. |
| `POST` | `/api/v1/documents/{documentId}/versions` | Proposed | Add a new immutable version; do not overwrite the old version. |
| `GET` | `/api/v1/documents/{documentId}/versions` | Proposed | List version metadata. |
| `GET` | `/api/v1/documents/{documentId}/versions/{versionId}` | Proposed | Read metadata for an exact version. |
| `POST` | `/api/v1/document-versions/{versionId}/verification` | Conditional | Record a human verification result and verifier identity. |
| `GET` | `/api/v1/document-versions/{versionId}/verification-history` | Proposed | List verification history. |
| `POST` | `/api/v1/document-versions/{versionId}/download-access` | Conditional | If the storage provider requires it, request short-lived download access after server-side authorization. |
| `POST` | `/api/v1/document-versions/{versionId}/retire` | Conditional | Retire/hide a version only under approved retention rules; do not delete regulatory evidence silently. |

#### Document security requirements

- All document access must pass through server-side authorization. Never trust a document ID supplied by the client as proof of access.
- Keep storage private. Do not make uploaded evidence publicly accessible by default.
- Store metadata and object keys in the database; file bytes live in object storage. Do not expose raw object keys or provider credentials.
- Use exact immutable version references for scrutiny/compliance evidence.
- Verify file type from content where possible, not only the filename/declared MIME type.
- Apply configurable file-size limits; the numeric limit is unresolved.
- Generate server-controlled object keys. Do not use user-supplied paths directly.
- Scan files for malware if an approved scanning capability is selected; otherwise document the limitation and do not claim scanning.
- Avoid placing signed download URLs in audit logs or persistent business records.
- Storage provider API, upload mechanism, ACLs, signed URL lifetime, limits, and retention are blocked pending verification.
- Do not implement permanent deletion/purge until retention, legal hold, and recovery requirements are approved.

### 8.12 Compliance obligations, evidence, and validity

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/compliance-obligation-definitions` | Proposed | List approved obligation definitions and source/rule versions. |
| `POST` | `/api/v1/compliance-obligation-definitions` | Conditional | Create a draft definition if configuration administration is in scope. |
| `GET` | `/api/v1/compliance-obligations` | Proposed | List obligations visible to caller with institution/application/status/due-date filters. |
| `POST` | `/api/v1/compliance-obligations` | Conditional | Instantiate an obligation only under an approved rule and context. |
| `GET` | `/api/v1/compliance-obligations/{obligationId}` | Proposed | Read obligation, due/validity metadata, and evidence status. |
| `PATCH` | `/api/v1/compliance-obligations/{obligationId}` | Conditional | Change only fields permitted by the applicable workflow; do not silently alter a rule-derived deadline. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/evidence` | Conditional | Attach an exact document version as evidence. |
| `GET` | `/api/v1/compliance-obligations/{obligationId}/evidence` | Proposed | List linked evidence versions. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/verify` | Conditional/guarded | Record an authorised verification outcome. |
| `POST` | `/api/v1/compliance-obligations/{obligationId}/waive-or-extend` | Blocked until policy exists | Do not implement unless an applicable verified rule and authorised process explicitly allow this action. |

Compliance status vocabulary, whether an obligation is institution-wide or application-specific, validity rules, extensions/waivers, evidence sufficiency, and retention are not universal. Do not invent due dates or mark a document compliant solely because a file exists.

### 8.13 Deadlines, notifications, attempts, and escalation

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/deadlines` | Proposed | List deadlines within caller scope, with supported filters. |
| `GET` | `/api/v1/deadlines/{deadlineId}` | Proposed | Read deadline inputs, due value, status, and rule provenance. |
| `POST` | `/api/v1/deadlines/{deadlineId}/recalculate` | Conditional/guarded | Recalculate only from recorded trigger/input/rule version; record old/new values and reason. |
| `GET` | `/api/v1/notifications` | Proposed | List notifications for the authenticated recipient or authorised administrator scope. |
| `GET` | `/api/v1/notifications/{notificationId}` | Proposed | Read notification metadata and delivery state. |
| `POST` | `/api/v1/notifications/{notificationId}/mark-read` | Conditional | Only if read state is part of the approved model. |
| `GET` | `/api/v1/notifications/{notificationId}/attempts` | Conditional | Expose safe delivery-attempt metadata to authorised support/admin users. |
| `POST` | `/api/v1/notifications/test` | Conditional/admin-only | Test provider configuration without exposing secrets; disable in production unless explicitly approved. |
| `GET` | `/api/v1/escalations` | Proposed | List escalation records visible to the caller. |
| `GET` | `/api/v1/escalations/{escalationId}` | Proposed | Read escalation provenance and state. |
| `POST` | `/api/v1/escalations/{escalationId}/acknowledge` | Conditional | Acknowledge only if acknowledgement semantics and permission are defined. |
| `POST` | `/api/v1/escalations/{escalationId}/resolve` | Conditional | Resolve with authorised actor, reason, and audit trail. |

Rules:
- A deadline must record its trigger, source/rule version, calculation inputs, date-versus-instant semantics, timezone/calendar, and computed due value.
- Do not hard-code one deadline across categories unless a verified rule says it applies.
- A job must re-check the current database state and applicable rule before sending a reminder/escalation.
- Notifications, delivery attempts, and escalation records are distinct.
- A failed email send must not be reported as delivered.
- A notification or escalation must not itself make an official decision.
- The queue/worker provider is unresolved. Use a durable outbox pattern for business events; job delivery must be idempotent with retry/reconciliation.
- The SMTP provider, templates, retry schedule, quiet hours, recipient preferences, and escalation timings remain unresolved until approved.
- Do not expose SMTP credentials or raw provider responses.

### 8.14 Dashboards, reports, exports, and audit

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | Proposed | Return counts/metrics restricted to caller scope. |
| `GET` | `/api/v1/dashboard/pendency` | Proposed | Return pending-case aggregates and approved drill-down references. |
| `GET` | `/api/v1/reports` | Proposed | List available report definitions for the caller. |
| `POST` | `/api/v1/reports/exports` | Conditional | Request a report/export job if export functionality is in scope. |
| `GET` | `/api/v1/reports/exports/{exportId}` | Conditional | Read export job status. |
| `POST` | `/api/v1/reports/exports/{exportId}/download-access` | Conditional | Authorised short-lived access to a completed export if storage design permits. |
| `GET` | `/api/v1/audit-events` | Proposed/admin-restricted | Search audit events only for explicitly authorised users and permitted fields. |
| `GET` | `/api/v1/applications/{applicationId}/audit-events` | Conditional | Read application-scoped audit events if access policy permits. |

Dashboard aggregates must respect the same access scope as underlying records. Define each metric (numerator, denominator, date basis, status inclusion, and rule/category scope) before treating it as authoritative. Do not calculate an official compliance conclusion from a rough aggregate.

Audit records must be append-only through ordinary application APIs. Do not provide generic `PATCH`/`DELETE` endpoints for audit history. Audit entries should capture actor/system identity, action, target, timestamp, outcome, correlation ID, and safe before/after snapshots where appropriate. Never include secrets, full document contents, or unnecessary sensitive fields.

### 8.15 Integration and import/export

| Method | Proposed path | Status | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/integrations` | Conditional/admin-only | List configured integration metadata without secrets. |
| `POST` | `/api/v1/integrations/imports` | Conditional | Start a validated manual/mock import job with source labeling and preview where appropriate. |
| `GET` | `/api/v1/integrations/imports/{importId}` | Conditional | Read import status and reconciliation summary. |
| `POST` | `/api/v1/integrations/exports` | Conditional | Produce a clearly labelled export for an authorised destination. |
| `GET` | `/api/v1/integrations/exports/{exportId}` | Conditional | Read export status. |
| `GET` | `/api/v1/integrations/sync-runs` | Conditional | List sync history if a real authorised integration is approved. |
| `GET` | `/api/v1/integrations/sync-runs/{syncRunId}` | Conditional | Read sync result and safe diagnostics. |

No real AICTE integration may be implemented or claimed until an authorised interface, credentials, permission to exchange data, supported schemas, rate limits, reconciliation behaviour, and failure policy have been confirmed. Do not scrape private systems or store external credentials in ordinary tables. A demo integration must be labelled `mock`/`simulated` in the UI, API metadata, logs, and documentation.

### 8.16 Operational incidents and administrative configuration

Operational incident management is optional/future in the current project record. If approved, design it as a separate operational module. Do not confuse operational incidents (for example, failed worker) with regulatory case events.

Provider settings, SMTP configuration, storage credentials, integration secrets, and deployment secrets must never be readable through ordinary API responses. Use the deployment platform's secret manager/environment configuration. Any admin configuration API requires an explicit security review, audit trail, least privilege, and secret-write/read semantics; no such endpoint is frozen here.

---

## 9. State transitions and domain action contracts

### 9.1 No arbitrary status mutation

The client must not submit a generic request such as:
```json
{ "status": "APPROVED" }
```
to an ordinary application update endpoint and cause a state change.

Instead, it requests a named action/transition. The server:
1. authenticates the actor;
2. authorizes role, scope, ownership, and assignment;
3. loads the current resource and expected version/state;
4. resolves the approved workflow and rule version applicable to the case;
5. checks route-specific preconditions and required evidence;
6. validates that the transition is allowed from the current state;
7. performs the business change in a transaction;
8. appends workflow history and audit records;
9. writes an outbox event in the same transaction;
10. returns the resulting safe representation.

If any precondition fails, make no partial business change. Return a stable validation/conflict error. External email, queue, or storage calls should not be made inside a database transaction unless a reviewed design explicitly requires it.

### 9.2 Human decision boundary

Automated logic may:
- validate completeness;
- evaluate configured, reviewed rules;
- calculate a deadline from approved inputs;
- identify missing information;
- recommend a next operational task;
- notify users and escalate overdue work;
- show status/pendency dashboards.

Automated logic must not autonomously:
- issue an official statutory approval/rejection;
- impose a penalty;
- make a legal determination;
- convert a committee recommendation into a decision;
- treat an email/notification as an official order.

Only an appropriately authorised human actor may record the official decision through the approved process. The API must preserve the distinction between a recommendation, decision, formal communication, notification, and escalation.

### 9.3 Rule provenance

For any operation whose validity depends on a regulatory or configured rule, retain enough information to reproduce why the system allowed the action or calculated a value:
- rule identifier and immutable version;
- official source title/version;
- exact clause/table/paragraph citation where applicable;
- source publication/effective date where available;
- applicability scope/category/cycle;
- review/approval actor and timestamp;
- effective-from/effective-until values;
- calculation inputs and output for deadline/rule computations;
- test/evidence reference for activation.

Do not activate a rule without verified applicability and human review. If rules conflict or are insufficient, flag the case for authorised review instead of guessing.

---

## 10. File upload/download API security

The final upload transport is provider-dependent. Whether direct-to-object-store upload is possible must be verified before implementing it. Regardless of transport:

1. Authorize the caller against institution/application/document scope before issuing an upload/download capability.
2. Generate object keys on the server.
3. Validate file size and permitted media types.
4. Inspect file content where practical; do not trust extension alone.
5. Store metadata, exact version, checksum where available, uploader, upload time, and scan/verification status where supported.
6. Do not overwrite prior versions.
7. Keep files private by default.
8. Return only safe metadata to the client.
9. Use short-lived access grants only if the provider supports them and the design is reviewed.
10. Avoid logging file contents, credentials, signed URLs, or sensitive document fields.
11. Enforce that a referenced document version belongs to its document and that the document context is consistent with the application/institution.
12. Define retention, legal hold, archive, and purge policy before permanent deletion is implemented.

The API must not assume Neon Object Storage supports any particular SDK, ACL model, signed-URL behaviour, multipart upload, maximum file size, checksum feature, or retention feature until verified against current provider documentation and the actual project configuration.

---

## 11. Real-time events — required capability, provider blocked

Real-time updates are required by the project understanding, but the transport/provider is not selected. Do not use Neon Realtime. Do not invent a WebSocket/SSE provider or publish an implemented transport before selection.

Before implementation, approve a separate event contract that specifies:
- transport and connection/authentication;
- event names and versioning;
- payload schema;
- event audience and subscription authorization;
- ordering guarantees (if any);
- event ID/sequence and duplicate handling;
- reconnect/backoff behaviour;
- replay/reconciliation strategy for missed events;
- heartbeat/connection limits;
- fallback to polling/manual refresh;
- provider failure behaviour.

Potential domain events (names are illustrative only) include:
- application submitted;
- application assignment changed;
- workflow stage changed;
- scrutiny observation recorded;
- deficiency issued;
- deficiency response submitted;
- EVC scheduled/rescheduled/completed;
- recommendation recorded;
- decision recorded/superseded;
- compliance obligation changed;
- deadline approaching/overdue;
- notification delivery state changed.

Do not broadcast an event merely because an internal database row changed. Publish only after the transaction commits, preferably through the transactional outbox. Events must contain minimal information; clients must refetch authorised resource details through the API. Subscription authorization must be enforced server-side. Support missed-event reconciliation; clients must tolerate duplicate/out-of-order delivery unless the selected transport guarantees otherwise.

---

## 12. Asynchronous jobs, outbox, and retries

For state changes that need notifications, realtime publication, or external synchronization:
- Write the business state, audit history, and outbox event atomically in one database transaction.
- A worker reads the outbox and attempts delivery.
- Record attempts and safe failure categories.
- Retry transient failures with a documented backoff policy.
- Make delivery idempotent using a stable event/delivery key.
- Re-check current state before executing time-sensitive reminders/escalations.
- Record terminal failure and expose operational visibility to authorised administrators.
- Provide reconciliation for stuck/pending outbox rows.
- Never mark an event delivered until the target service has confirmed delivery according to the provider's semantics.
- Avoid duplicate official communications when retrying a job.

Redis/BullMQ is proposed, not a confirmed hosting decision. The durable outbox and idempotent processing requirements apply regardless of the eventual queue provider.

---

## 13. Security and privacy requirements

- Apply least privilege to every endpoint and data query.
- Enforce tenant/institution/application scope on the backend; do not rely on frontend filtering.
- Validate all untrusted input.
- Use parameterized database access through Prisma/approved query mechanisms; do not concatenate user input into SQL.
- Protect cookies/session handling according to the selected authentication method.
- Configure CORS narrowly; do not use wildcard origins with credentialed requests.
- Apply rate limits to authentication, upload, export, search, and other abuse-sensitive operations. Numeric thresholds are deployment decisions and must be documented, not invented here.
- Apply CSRF protection if the chosen credential transport requires it.
- Redact secrets and sensitive personal/document data from logs.
- Do not return raw provider errors or internal stack traces.
- Keep object storage private and check authorization on every download/upload grant.
- Use approved secret management for database, SMTP, queue, storage, and integration credentials.
- Audit sensitive administrative and workflow actions.
- Avoid collecting personal data that is not needed for the approved workflow.
- Define retention, archival, legal hold, and deletion policies before implementing purge.
- Test direct-object-reference attacks, cross-institution access, wrong-assignee access, role escalation, replayed requests, and concurrent requests.
- Do not include a sensitive resource's existence in an error message where it would disclose information to an unauthorized caller.

Specific compliance certifications, cryptographic standards beyond platform defaults, numeric SLOs, and legal retention periods are not specified by the current project sources and must not be asserted without approval.

---

## 14. Audit requirements for mutating endpoints

Every successful sensitive mutation must emit an append-only audit record. Failed security-relevant attempts should be logged securely according to the security policy, without storing secrets.

Audit data should include, where applicable:
- event/audit ID;
- timestamp;
- actor user ID or system actor;
- action name;
- target resource type and ID;
- application/institution context where applicable;
- success/failure outcome;
- request/correlation ID;
- prior and resulting state/version where safe and useful;
- reason/comment supplied for a controlled action;
- rule/workflow version used;
- source of action (user/API/worker/import) without exposing credentials.

Audit data must not contain raw passwords/tokens, SMTP credentials, signed URLs, full uploaded document contents, or unneeded sensitive fields. Do not expose generic update/delete endpoints for audit events. Corrections to historical business records should be represented as new records or explicit supersession/correction events.

---

## 15. API endpoint implementation matrix

Before coding, Antigravity must produce a tracked matrix with at least these columns:

| Field | Required meaning |
|---|---|
| Requirement ID | One or more `FR-*`, `NFR-*`, or acceptance criterion IDs from `project-requirements.md`. |
| Module | Backend module responsible for the endpoint. |
| Method/path | Exact implemented route. |
| Status | Required, proposed, conditional, blocked, or future. |
| Auth | Anonymous, authenticated, or specific approved auth requirement. |
| Permission/scope | Exact approved permission and institution/application scope. |
| Request schema | Path/query/header/body schema and validation. |
| Response schema | Public representation and status code. |
| Error cases | Stable codes and HTTP statuses. |
| State precondition | Required current state and allowed transition. |
| Rule dependency | Exact rule/workflow version or “not applicable” with rationale. |
| Database effects | Rows changed/created and transaction boundary. |
| Audit event | Event type and fields. |
| Idempotency/concurrency | Key/state guard/version strategy. |
| Outbox/job/event | Asynchronous side effects and recovery. |
| Test reference | Unit, API/integration, and E2E tests. |
| Open decision | Owner and resolution status for unresolved dependencies. |

No endpoint is complete until the matrix and OpenAPI agree with the implementation.

---

## 16. OpenAPI requirements

Use OpenAPI to document the actual API contract. The specific OpenAPI version/tooling is not frozen, though Swagger/OpenAPI is the proposed documentation approach.

The OpenAPI document must include:
- server/base-path information per environment without secrets;
- authentication scheme only after the provider/transport is selected;
- all implemented paths and methods;
- operation IDs that are unique and stable;
- path/query/header parameters;
- request and response schemas;
- success and error status codes;
- pagination/filter/sort semantics;
- idempotency and concurrency headers where used;
- file upload/download content types and restrictions;
- permission and resource-scope requirements;
- descriptions of side effects and workflow preconditions;
- examples containing only fictional/demo data;
- deprecation/versioning policy;
- no routes labelled live if they are mock or unimplemented.

Do not fabricate an authentication scheme in OpenAPI while auth remains unresolved. Mark blocked operations in the endpoint register rather than documenting them as operational.

---

## 17. Testing requirements

### 17.1 API-level tests

Use the planned Vitest + Supertest stack if retained in the final toolchain. Every implemented endpoint needs tests for:
- valid request and expected response;
- malformed path/query/body;
- invalid ID and invalid enum/status;
- missing authentication;
- wrong role/permission;
- wrong institution/application scope;
- unassigned actor where assignment is required;
- resource not found or intentionally concealed;
- invalid current state;
- stale/concurrent mutation;
- duplicate submission/idempotency replay;
- missing/inactive/unverified rule version;
- rule effective-date mismatch;
- cross-record mismatch (for example, document version belongs to a different document);
- database constraint failure;
- audit record created for successful sensitive action;
- outbox event created atomically where applicable;
- provider/queue/storage/email failure and retry behaviour;
- no secrets in response/error/log;
- no autonomous statutory decision path.

### 17.2 Required workflow scenarios

At minimum, test:
1. Create draft → validate → submit → immutable revision and audit/history exist.
2. Concurrent double submission results in one successful transition and one conflict, not duplicate submissions.
3. Invalid/unverified/ambiguous route is blocked and surfaced for authorised review.
4. Scrutiny observation/deficiency/response histories remain distinct and traceable.
5. EVC can only be scheduled when the approved route permits it.
6. Committee recommendation does not create an official decision automatically.
7. Official decision requires authorised actor and is separately recorded from formal communication.
8. Applicable appeal rules are checked before creating an appeal.
9. Document versions remain immutable and evidence points to the exact reviewed version.
10. Cross-institution users cannot read or mutate another institution's resources without explicit authorization.
11. Deadline calculation retains rule version and calculation inputs.
12. Reminder job re-checks current state and does not send an obsolete reminder after the case changes.
13. Duplicate job/event delivery does not duplicate business actions or official communications.
14. Dashboard counts match the same authorized/filtering rules as underlying list endpoints.
15. Real-time reconnection/missed-event reconciliation works after provider selection.
16. Integration mock is clearly labelled and never represented as a live AICTE connection.

### 17.3 Contract and regression tests

- Validate the OpenAPI document in CI.
- Detect breaking API changes and require versioning/review.
- Test that generated frontend API types (if used) match the published contract.
- Maintain requirement → endpoint → database entity → UI workflow → source rule (where applicable) → test traceability.
- Seed only fictional records clearly labelled as demo data.
- Do not use live personal/institution data in tests unless explicitly authorized and protected.

---

## 18. Versioning, deprecation, and compatibility

- The proposed path prefix is `/api/v1`; confirm before public implementation.
- Avoid breaking changes within a released API version.
- For a breaking change, document the migration and use an approved versioning policy.
- Mark deprecated operations and specify a removal plan.
- Do not version every database table or expose database schema versions as API versions.
- Rule/workflow versioning is separate from API versioning.
- Do not alter the meaning of an existing rule/workflow version; create a new version.
- API contract changes that affect decisions, permissions, statuses, or deadlines require review and regression tests.

The project has not specified a public API support window or numeric deprecation period. Do not invent one; record the decision when external consumers exist.

---

## 19. Observability and operations

Track safe operational signals for:
- API request rate, latency, and error categories;
- database errors/timeouts;
- invalid/expired rule configuration;
- failed or retried outbox/job events;
- stuck pending outbox rows;
- email delivery failures;
- storage upload/download errors;
- unauthorized access attempts;
- integration sync conflicts/failures;
- real-time connection/publish failures after a provider is selected;
- migration status and backup/restore evidence where available.

Operational metrics must not expose sensitive records. Do not set numerical service-level objectives until the project owner approves them. Health endpoints must not disclose secrets or infrastructure details that create risk.

---

## 20. Decisions required before the API can be frozen

The following are explicit blockers. Antigravity must keep them in an open-decision register with owner, impact, and resolution evidence.

1. **Base path and contract approval:** confirm `/api/v1` and the common response/error envelopes.
2. **Authentication/session:** provider, session/token transport, login/logout/refresh, recovery, MFA, CSRF/CORS.
3. **Role/permission model:** role names, permission names, scope semantics, institution membership, assignment requirements, administrator boundaries.
4. **Application catalogue:** supported categories, intake fields, required evidence, identifiers, category versioning.
5. **Regulatory applicability:** current APH and all applicable amendments/circulars/directions/legal orders for each cycle/category.
6. **Workflow routes:** which category/cycle requires scrutiny, re-scrutiny, EVC, SAC/SHC/committee stages, appeal, or other steps.
7. **Business vocabularies:** final state/status values for applications, observations, deficiencies, EVC, recommendations, decisions, compliance, notifications, and escalations.
8. **Decision authority:** who can record an official decision and the correction/supersession procedure.
9. **Appeals:** eligibility, deadline, date calculation, permitted outcome, and required record/communication.
10. **Deadline semantics:** date versus instant, timezone/calendar, pause/restart, holidays, extensions, and escalation timing.
11. **Document storage:** whether Neon Object Storage remains final, current SDK/API, private access model, upload/download flow, file limits, signed URL behaviour, retention.
12. **Database decision discrepancy:** reconcile `Tech Stack Reasoning.txt`/schema's Neon direction with `project-overview.md`'s later unresolved wording before irreversible provider-specific work.
13. **Email provider:** SMTP host/provider, sender identity, templates, retries, preferences, delivery tracking.
14. **Queue/job hosting:** Redis/BullMQ provider or approved alternative, retry/backoff policy, worker deployment.
15. **Real-time transport:** approved provider/transport, event contract, auth, replay/reconciliation.
16. **AICTE integration:** authorized endpoint, credentials, permitted data scope, schema, rate limits, reconciliation and support owner.
17. **Retention/legal hold/deletion:** retention durations, archive rules, purge approval and data subject process if applicable.
18. **Pagination/filter limits:** maximum page size, default sort, allowed filters, cursor/offset choice.
19. **Idempotency/concurrency:** key format, retention, response replay, optimistic concurrency contract.
20. **Performance/accessibility/availability targets:** no numeric values are established in the source baseline.
21. **Optional/deferred scope:** OCR/AI extraction, payment/DSC validation, SMS/WhatsApp, operational incident module, advanced analytics, read receipts, committee attendance. AI/OCR is subject to the mandatory post-core activation gate in Section 23 and must not be implemented merely because it appears in this list.
22. **Deployment environments and secret management:** frontend/backend/worker hosts, allowed origins, migrations, rollback/recovery approach.

Do not block unrelated work unnecessarily, but do not mark a dependent feature complete or production-ready while its required decision remains unresolved.

---

## 21. Instructions for Antigravity

1. Read all source files listed in Section 1 before generating routes.
2. Reconcile this specification against `project-requirements.md` and `project-architecture.md`; do not silently replace or delete existing documents.
3. Produce an endpoint matrix and a list of source conflicts/open decisions before implementing provider-dependent or statutory functionality.
4. Build only approved endpoint groups. Mark the rest as blocked/future in both code and documentation.
5. Generate the Prisma schema/migrations from the reviewed logical schema; do not infer foreign keys or status semantics that are marked unresolved.
6. Implement authorization in backend services/middleware and database queries, not only in frontend components.
7. Implement transitions as explicit domain actions with state preconditions, transaction-safe history/audit/outbox, and idempotency/concurrency guards.
8. Implement private document access through the backend and verify storage provider behaviour before coding provider-specific logic.
9. Do not use Better Auth or Neon Realtime.
10. Do not claim live AICTE integration without an authorized interface and verified credentials. Mock data and simulated integrations must be labelled.
11. Do not activate a regulatory rule until it has an exact applicable source citation/version, effective dates, human review/approval, and passing tests.
12. Do not autonomously issue statutory approval/rejection decisions or penalties.
13. Keep recommendation, official decision, formal communication, notification, and escalation as separate concepts.
14. Keep audit/history append-only and preserve revisions and document versions.
15. Ensure OpenAPI matches actual routes and all endpoint tests pass before reporting the API as complete.
16. Report for every endpoint: implemented, deferred, blocked, or not applicable; include reason, related requirements, tests, and outstanding decisions.
17. Do not claim “100% correct” or “production-ready” merely because code compiles. Report what was tested, against which environment, and what remains unverified.
18. Follow Section 23 for the AI/OCR phase boundary. Do not implement AI/OCR unless the project owner gives Antigravity a specific, explicit prompt authorizing that implementation.

---

## 22. Definition of API completion

The API may be called **implementation-complete for an explicitly defined release** only when:
- the release scope and blockers are recorded;
- every implemented endpoint is in OpenAPI and the endpoint matrix;
- every endpoint has request/response/error schemas and documented permissions;
- all state-changing endpoints have state/authorization/rule checks;
- all sensitive mutations have audit/history and required outbox behaviour;
- database constraints and transaction boundaries are tested;
- document operations are private and provider semantics verified;
- workflow/route rules are traceable to reviewed sources;
- idempotency/concurrency tests pass for relevant actions;
- unit/API/E2E and security boundary tests pass;
- mock/live integrations are unambiguously labelled;
- no unresolved dependency is falsely reported as complete;
- known limitations and release decisions are documented.

This definition does not certify legal correctness of the underlying regulatory interpretation. That remains dependent on review of the currently applicable official instruments and approval by the responsible human authority.


---

## 23. AI/OCR Implementation Gate — Deferred Until Explicit Antigravity Prompt

**This section is the controlling instruction for all AI/OCR work. It is intentionally placed at the end of this document so that it acts as a later-phase gate, not as part of the mainline API build.**

### 23.1 Current status and activation condition

AI implementation is **deferred**. The current task is to complete the non-AI mainline project first.

AI/OCR work may begin **only when the project owner explicitly gives Antigravity a specific prompt instructing it to implement AI functionality**. Completion of the core project, architectural extensibility, an optional-scope mention, or a general request to continue development does not by itself authorize AI implementation.

Until that specific prompt is provided, Antigravity must treat AI/OCR as `DEFERRED — DO NOT IMPLEMENT`.

### 23.2 Prohibited during the mainline phase

Before receiving the explicit AI implementation prompt, do not:

- Implement AI/OCR API routes, OpenAPI operations, controllers, services, repositories, workers, prompts, model calls, or user-facing AI features.
- Install AI/ML/OCR-specific packages or SDKs, configure model providers, add model API keys/secrets, or provision AI-specific infrastructure.
- Add AI-specific database tables, fields, migrations, indexes, seed data, or mandatory schema dependencies.
- Add AI-dependent workflow branches or make any core operation require a model, OCR output, classification, extraction, or generated recommendation.
- Add UI buttons, pages, settings, or claims that imply AI/OCR is available or operational.
- Create speculative placeholder implementations or stubs that silently expand the current implementation scope.

Do not interpret references to future AI functionality elsewhere in this document as authorization to implement it.

### 23.3 Mainline must work independently of AI

The non-AI system must be usable end-to-end without AI services. Core workflows must rely on validated user input, configured and reviewed business/regulatory rules, and authorised human actions.

The mainline includes the approved core scope, such as authentication and authorization; institution and application management; configurable workflow processing; scrutiny and deficiency handling; EVC scheduling; committee proceedings; human-recorded recommendations and official decisions; compliance monitoring; document management; deadlines; notifications and escalations; dashboards; audit trails; and clearly labelled mock/manual integration boundaries where authorised live integrations are unavailable.

This list does not override the release scope or resolve any open decisions elsewhere in this specification.

### 23.4 What is allowed before activation

Only minimal, technology-neutral extensibility is permitted where it is genuinely needed by the core design. Do not introduce AI-specific abstractions, dependencies, schema, services, endpoints, or infrastructure just in case they may be useful later.

AI-related items may remain documented as deferred proposals or open decisions. They must not be represented as implemented API contract.

### 23.5 Requirements after explicit activation

After the project owner provides a specific prompt to Antigravity to implement AI, Antigravity must first propose a bounded AI phase plan before coding. That plan must specify:

1. The exact AI use cases and exclusions.
2. The intended users and human review/approval points.
3. The data to be processed, lawful/authorised access, retention, and privacy/security controls.
4. The provider/model/OCR approach and any costs, credentials, or infrastructure required.
5. Any new API routes, request/response schemas, database changes, dependencies, jobs, and UI changes.
6. Failure modes, retries, confidence/uncertainty handling where applicable, audit records, and manual fallback behaviour.
7. Tests, acceptance criteria, rollout/disable strategy, and documentation updates.
8. Any conflicts with this API specification, database schema, architecture, or requirements that must be resolved before implementation.

Antigravity must not infer approval of unspecified providers, costs, data access, or additional use cases from the activation prompt. It must identify material unresolved choices before making irreversible or externally consequential changes.

### 23.6 Human authority and regulatory safety

AI must not autonomously issue statutory approval/rejection decisions, penalties, or other official regulatory decisions. AI-generated extraction, classification, summaries, or recommendations must be distinguishable from verified facts and official decisions, with appropriate human review and traceable provenance. Regulatory rules must remain grounded in reviewed, applicable official sources; model output is not itself a legal authority.

### 23.7 Status reporting

Until explicitly activated, report AI/OCR as `DEFERRED — NOT IMPLEMENTED`, not as blocked core functionality and not as complete. Do not add AI endpoints to the active endpoint inventory or claim AI functionality exists.

When an explicit AI implementation prompt is later provided, update this specification and the affected architecture, requirements, database, security, and test documents as needed before or alongside implementation. Preserve the existing mainline contract unless a reviewed change requires otherwise.

---

## 24. Cross-document contract reconciliation — 24 October 2026

This addendum is part of the draft contract and does not imply that routes already exist. Existing endpoint proposals remain intact.

### 24.1 Dependencies and status
- Use Neon PostgreSQL + Prisma as the relational persistence baseline.
- Better Auth is excluded; the authentication/session approach remains unresolved. Do not finalize auth-dependent implementation until an alternative is selected.
- Neon Realtime is excluded. The required real-time transport remains unresolved; event contracts must be provider-neutral until selection. If polling is chosen for the first release, document that scope explicitly.
- Neon Object Storage is the provisioned candidate. File endpoints must authorize the caller and mediate access server-side; never return privileged storage credentials.
- BullMQ + Redis is proposed/optional pending deployment decision. Use a durable PostgreSQL outbox as the record of side-effect intent; queue delivery must be idempotent.
- Email/SMTP and deployment providers remain unresolved.
- AI/OCR remains deferred until explicit project-owner authorization.

### 24.2 Contract review requirements
Before implementation, review each proposed endpoint for: actor/role permission, object-level authorization, current-state precondition, validation schema, idempotency/concurrency behavior, audit event, response/error shape, pagination/filter limits, data minimization, and tests. Any endpoint that can alter a decision, application status, deficiency, resubmission, compliance result, or official record must enforce allowed transitions on the server and record attribution.

### 24.3 Database revision alignment
Validate all request/response DTOs against `DATABASE_SCHEMA_REVISION_2.md` and its constraints, while preserving `DATABASE_SCHEMA.md` as the base design. Do not create a second source of truth through denormalized client fields, queue payloads, or real-time messages. A migration must be reviewed and tested; the schema documents are not themselves migrations.

### 24.4 Regulatory and unresolved values
Do not hard-code deadlines, fees, eligibility rules, scrutiny criteria, or required-document lists unless traceable to an approved requirement and official source. If the contract lacks an authoritative rule, return an explicit unresolved/configuration state rather than a fabricated default.



---

## Source audit supplement — contract validation against PS/APH, 24 October 2026

Use `PS_APH_TRACEABILITY_AUDIT.md` to validate route, deficiency, EVC, compliance, document-renewal, notifications, reporting and audit endpoints. API contracts remain proposals until aligned with the agreed revision-2 schema and verified rule registry. Do not hard-code regulatory values without an applicable source/version.


---

## Cross-document consistency audit reference

Cross-document implementation gate: see `CROSS_DOCUMENT_CONSISTENCY_AUDIT.md` §4. Proposed routes and payloads are not verified against runtime handlers or generated OpenAPI until that gate is completed.


---

## Final decision correction — API authentication and real-time contract (24 October 2026)

This correction supersedes earlier API-specification statements that the authentication direction and real-time transport were unselected. The approved authentication direction is **Auth.js-compatible solution or JWT with secure HTTP-only cookies**; Better Auth is excluded. **Socket.IO is the selected real-time transport**; do not use Neon Realtime or any other Neon service. Neon is limited to PostgreSQL and document/object storage. API routes remain proposed contracts until implemented and tested. The API/Socket.IO design must define authenticated principal resolution, server-side role and resource-scope authorization, event names/payloads, authorised room membership, post-commit publication, reconnection/refetch, and failure handling. See `FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md`; retain all prior endpoint and security requirements.

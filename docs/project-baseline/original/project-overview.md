# Project Overview --- AICTE Approval Workflow Automation

**Project name:** Integrated AICTE Approval Workflow Automation,
Compliance Monitoring and Alert Management System\
**Short name:** AICTE Workflow Automation\
**Purpose:** Source-of-truth planning document for Antigravity and
project contributors.\
**Status:** Planning baseline. Confirmed decisions and unresolved
decisions are distinguished explicitly.

## 1. Instructions for Antigravity

1.  Treat this file as the project overview, not as a replacement for
    the official problem statement (PS), the supplied AICTE Approval
    Process Handbook (APH), or future detailed documents in `docs/`.
2.  Do not invent regulatory procedures, deadlines, application routes,
    approval criteria, powers, or retention periods. Each active rule
    must be traceable to a verified applicable official source and exact
    clause/version.
3.  The supplied reference is named `AICTE APH 2024–2027.pdf`. Do not
    assume it is the latest applicable handbook. Verify applicable
    amendments, corrigenda, current handbook provisions, circulars, and
    official directions before activating rules.
4.  The system assists administrative workflow, compliance monitoring,
    and alerts. It must not autonomously make statutory approval
    decisions or present an automated recommendation as an official
    decision.
5.  Keep human authority explicit. Only appropriately authorised users
    may record scrutiny outcomes, committee recommendations, and
    official decisions.
6.  Do not infer a route when application data or verified rules are
    insufficient. Flag ambiguous cases for authorised review.
7.  Preserve traceable histories. Do not silently overwrite prior
    decisions, official communications, rule versions, or workflow
    history.
8.  Keep the repository layout in Section 3.
9.  **Do not use Better Auth.** The user explicitly corrected this. The
    alternative authentication provider/approach is not established by
    the available project record; do not choose one silently.
10. Real-time behaviour is required, but its provider/transport has not
    been selected. **Do not use Neon as the real-time service and do not
    use Neon Realtime.**
11. Neon PostgreSQL and Neon Object Storage were previously enabled. The
    latest clarification does not conclusively establish whether either
    remains in the final architecture. Do not silently remove or retain
    them as a final decision; resolve the distinction explicitly.
12. Do not claim access to AICTE internal systems. Integrate only
    through authorised interfaces and credentials. Until then, use
    clearly labelled mock/simulated integrations if needed; do not
    scrape private systems or claim a mock is live.
13. Build for a practical hackathon prototype, shared team development,
    low cost, and future extensibility. Avoid unnecessary
    infrastructure.
14. When a required decision is unresolved, mark it unresolved and ask
    at the point it blocks implementation. Never present a guess as a
    confirmed fact.

## 2. Purpose and problem

The project is intended to improve the administration and visibility of
AICTE approval workflows, compliance monitoring, and alert management.
It should help relevant users track applications, scrutiny, deficiencies
and responses, EVC scheduling, compliance obligations, undertakings,
document/lease validity, pending and overdue cases, notifications,
escalations, reports, and audit history.

The expected benefits are better workflow accuracy, timely deadline
tracking, visibility of pendency, reduced manual follow-up, reliable
alerts, and traceable actions. The system does not replace statutory
authority, committee judgement, or official decision-making.

### 2.1 Conceptual user groups

The following are product-level user groups, not a claim that these
exactly match AICTE's official organisational chart. Exact role names
and permissions must be verified and documented in an RBAC matrix.

-   **Institution users:** maintain permitted application information,
    upload documents/evidence, respond to deficiencies, and view their
    own case status and obligations.
-   **Scrutiny officers/reviewers:** review assigned cases and record
    observations/deficiencies and permitted actions.
-   **EVC coordinators/authorised users:** coordinate EVC scheduling and
    related records according to permissions.
-   **Committee members/authorised committee roles:** access assigned
    material and record proceedings/recommendations only where
    authorised.
-   **Administrators:** manage user access and approved configuration.
    Technical administration does not automatically confer statutory
    decision authority.
-   **Senior/monitoring users:** view authorised pendency, compliance,
    overdue, workload, region, and performance reports.
-   **Rule approvers:** review/approve regulatory rule configurations
    through a controlled process; final role assignment remains to be
    decided.

## 3. Required repository structure

The repository must be one Git repository with separate `frontend/`,
`backend/`, and `docs/` directories.

``` text
aicte-workflow-automation/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
├── docs/
│   └── (Markdown files manually added and maintained by the user)
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

-   `frontend/`: React client, routes, pages, components, API client,
    client-side state, and frontend tests.
-   `backend/`: Express server, APIs, domain/business logic,
    authentication integration, RBAC, workflow engine, data access,
    integrations, audit, and backend tests. Worker code may be
    co-located if appropriate.
-   `docs/`: Markdown project documentation. The user will manually add
    and maintain these files. Do not assume a suggested file exists.
-   Root `README.md`: setup and usage instructions.
-   Root `package.json`: may provide convenience scripts/workspaces to
    run both applications; this does not merge their source directories.
-   Root `package-lock.json`: use only if a root npm workspace is
    actually configured. Otherwise use a consistent lockfile strategy
    for the separately installed applications; do not maintain
    conflicting lockfiles for the same installation scope.
-   `.gitignore`: exclude secrets, local environment files,
    dependencies, build outputs, logs, temporary files, and private
    uploads as appropriate.
-   Never commit database URLs, SMTP secrets, signing keys, access
    tokens, or real confidential documents.

## 4. Problem-statement capabilities

The project requirement has six main capability areas.

### 4.1 End-to-end approval workflow automation

Represent cases through explicit stages, states, assignments, permitted
transitions, deadlines, and history. The routes discussed include
**"Only Scrutiny", "Scrutiny + EVC", "EVC + SAC/SHC", "Only EVC"**, and
other prescribed combinations where applicable. These are route
examples, not a universal or complete decision table. Never infer which
route applies without verified rules.

The model should support, where applicable: application intake,
completeness checks, scrutiny/re-scrutiny, deficiency notice,
institution response, re-review, EVC activity, committee proceedings,
recommendations, authorised decisions, formal communications,
appeal/review, post-decision compliance, and closure. Not every case
follows every stage. Keep recommendations distinct from final decisions.

### 4.2 Dashboard and pendency monitoring

Provide role-authorised views of: - total applications and current
stage; - stage-wise pendency, pending and overdue cases; - approaching
deadlines and escalations; - EVC status and schedules; -
undertaking/compliance status; - documents approaching expiry or
expired; - workload/assignments and region-wise performance where
supported by data.

Define each metric and its filters/status inclusion rules. Counts must
come from consistent backend queries or defined read models, not
independently editable dashboard values.

### 4.3 EVC scheduling and alerts

Track EVC events linked to relevant cases, including schedule details,
responsible users, assignments, changes, outcomes, supporting records,
and follow-up actions as applicable. Send relevant scheduling/deadline
alerts. Do not assume every application requires an EVC.

### 4.4 Time-bound undertakings and compliance

Represent each obligation as a record linked to the relevant
institution, application, or approval. Track its source/rule, due date,
evidence requirements, responsible party, submission state, verification
state, and history. Do not invent deadlines or assume all institutions
have the same obligations.

### 4.5 Lease and document validity

Store files securely and track metadata such as type, owner/case
linkage, version, dates where applicable, expiry date where applicable,
and verification history. Send configured reminders before expiry and
alerts for expired documents. Do not infer missing dates. A file's
presence does not prove authenticity, validity, or approval;
verification is a separate recorded action.

### 4.6 Notifications, escalations, and reporting

Support configured in-app notifications and outbound email if an SMTP
provider is selected. Potential events include deficiencies, EVC
scheduling, compliance deadlines, document expiry, overdue cases, and
escalations. Avoid duplicates, record attempts/failures, and retry
safely. A reminder/notification is not an official order.

Reports should cover application pendency, EVC status, undertaking
compliance, document validity, overdue cases, escalations, and
region-wise performance where reliable data supports them. Respect RBAC
in every report.

### 4.7 Cross-cutting requirements

-   Configurable rules aligned with applicable APH provisions and
    official directions.
-   Secure private document storage.
-   RBAC, ownership/assignment checks, confidentiality, and least
    privilege.
-   Traceable actions and audit history.
-   Integration with existing authorised AICTE systems wherever feasible
    and authorised.
-   Human oversight.
-   Reliable deadline tracking and timely alerts.
-   Clear labelling of seeded/demo data and simulated integrations.

## 5. Technology baseline and decision status

The existing `Tech Stack Reasoning.txt` records a proposed stack. The
user's latest corrections override conflicting items in that file.

### 5.1 Frontend

  Concern            Recorded choice   Status
  ------------------ ----------------- -------------------
  UI framework       React             Proposed/recorded
  Language           TypeScript        Proposed/recorded
  Build tooling      Vite              Proposed/recorded
  Styling            Tailwind CSS      Proposed/recorded
  Components         shadcn/ui         Proposed/recorded
  Client routing     React Router      Proposed/recorded
  Charts             Recharts          Proposed/recorded
  Calendar UI        FullCalendar      Proposed/recorded
  End-to-end tests   Playwright        Proposed/recorded

### 5.2 Backend and developer tooling

  Concern              Recorded choice      Status
  -------------------- -------------------- -------------------
  Runtime              Node.js              Proposed/recorded
  HTTP/API framework   Express              Proposed/recorded
  Language             TypeScript           Proposed/recorded
  Request validation   Zod                  Proposed/recorded
  API documentation    Swagger/OpenAPI      Proposed/recorded
  Unit/API tests       Vitest + Supertest   Proposed/recorded
  Version control      Git + GitHub         Proposed/recorded

### 5.3 Database and ORM

-   Previously provisioned: Neon PostgreSQL enabled.
-   Previously recorded ORM: Prisma.
-   The user clarified that real-time functionality must not use Neon.
    This does **not**, by itself, conclusively decide whether Neon
    remains the primary database.
-   Before database implementation, explicitly confirm whether to retain
    Neon PostgreSQL + Prisma or replace Neon entirely.
-   Do not create a second authoritative database or dual-write business
    records without an explicit architecture decision.
-   The backend must remain the controlled path to persistence; the
    browser must not access privileged database credentials directly.

### 5.4 File/document storage

-   Previously provisioned: Neon Object Storage enabled; the earlier
    notes refer to a private `uploads` bucket.
-   Its final use is not confirmed after the latest clarification.
-   Keep documents private by default. Backend authentication, RBAC, and
    resource checks must precede file access.
-   Store metadata and storage references, including ownership/linkage,
    MIME type, size, upload time, version, checksum where implemented,
    and verification history.
-   Validate file extension, MIME type, size, and upload permission; do
    not trust browser-provided filenames/MIME values alone.
-   Verify provider API, permissions, quotas, and current availability
    before relying on it.

### 5.5 Authentication --- corrected

-   **Do not use Better Auth.**
-   The alternative provider/approach is not confirmed in the available
    record. Earlier discussion mentioned an Auth.js-compatible solution
    or custom JWT with secure HTTP-only cookies, but neither is
    established as the final selection.
-   Do not silently choose Auth.js, custom JWT, Firebase Auth, Supabase
    Auth, Keycloak, or another provider.
-   Resolve the choice before implementing login/session code.
-   Regardless of provider, backend authentication and RBAC/resource
    checks are required. Authentication establishes identity;
    authorisation decides whether that identity can perform an action on
    a resource.
-   Do not rely on frontend button visibility as security. Use secure
    session/token handling, expiry/revocation, HTTPS in production, and
    do not store long-lived secrets in browser `localStorage`.
-   Do not infer the application auth provider from a toggle in the Neon
    dashboard. The separate Neon Better Auth option was previously left
    disabled.

### 5.6 Real-time --- required, provider unresolved

-   Real-time user experience is required and must not rely on Neon or
    Neon Realtime.
-   The real-time provider/transport has not yet been selected. Do not
    silently choose one.
-   Expected live-update candidates include application status/stage
    changes, deficiencies/responses, EVC changes, compliance changes,
    document-expiry alerts, notifications, and relevant dashboard
    updates. Define the exact event list before implementation.
-   Real-time events must be authorised; users must never receive
    another institution's private data through an overly broad channel.
-   Publish minimal payloads. The client can retrieve full authorised
    details through the backend API.
-   The database/business record remains authoritative; a real-time
    message only signals a change.
-   Define event names/payloads, audience/channel access,
    authentication, authorisation, duplicate/out-of-order handling,
    reconnect behaviour, and recovery from missed events.
-   On reconnect, reconcile by fetching authorised current state or
    using a version/cursor; do not assume all events arrived.
-   Verify provider limits, pricing, server-side publishing, and
    security model before adopting it.

### 5.7 Background jobs and email

  Concern         Recorded choice     Status
  --------------- ------------------- ------------------------------------------
  Job queue       BullMQ              Proposed
  Queue backend   Redis               Proposed; optional in earliest prototype
  Email           Nodemailer + SMTP   Proposed; SMTP provider unselected

Scheduled reminders/escalations and live UI updates are separate
concerns. A real-time service does not replace durable scheduled jobs; a
queue does not replace live UI events.

For reliable work, use a transactional outbox or equivalent where
business updates must trigger notifications/events, retry safely, make
workers idempotent, re-check current state before acting, record
failures, and reconcile stuck work. BullMQ + Redis may be added when
reliable scheduling is implemented. Do not claim a notification was
delivered merely because it was queued.

### 5.8 Optional/unselected tools

-   OCR/AI extraction: optional, not confirmed as core scope.
-   NGINX/Camunda: not required for the initial version on current
    evidence.
-   Deployment/hosting provider: not selected.
-   SMTP provider: not selected.
-   Redis hosting provider: not selected.

## 6. Architecture principles

A modular backend with a separate frontend is the starting shape. A
modular monolith is a reasonable prototype design; do not split into
microservices without a concrete requirement.

``` text
Browser
  -> React + TypeScript frontend
  -> HTTPS REST API
  -> Node.js + Express backend
       -> selected authentication integration
       -> server-side RBAC and ownership checks
       -> Zod request validation
       -> workflow/compliance/domain services
       -> database access layer (provider to be confirmed)
       -> private document-storage adapter (provider to be confirmed)
       -> audit trail
       -> durable outbox/background jobs
       -> real-time publisher (provider to be selected; not Neon)
       -> notification/email adapter
```

For a protected state-changing request: 1. Authenticate. 2. Authorise
role, assignment, scope, and resource ownership. 3. Validate
parameters/body. 4. Load current state and applicable rule version. 5.
Verify the transition/action is permitted. 6. Persist the domain change
and history. 7. Record audit events. 8. Create durable
outbox/notification work where required. 9. Return a consistent API
response. 10. Publish real-time events only after the authoritative
change commits. 11. Process delivery asynchronously and reconcile
failures.

Use database transactions for critical related changes where supported.
Do not publish a success event before the business change commits.

### 6.1 Logical backend modules

-   Authentication integration and user identity.
-   User/role/permission administration.
-   Institution management.
-   Application intake and application records.
-   Application-category/route determination.
-   Workflow definitions and instances.
-   Scrutiny/re-scrutiny.
-   Deficiencies and institution responses.
-   EVC scheduling and records.
-   Committee proceedings and recommendations.
-   Official decisions and communications.
-   Appeals where applicable.
-   Compliance obligations and undertakings.
-   Document metadata, storage adapter, versioning, and validity.
-   Deadline/calendar/rule engine.
-   Notifications and escalations.
-   Audit trail.
-   Dashboard/reporting read models.
-   Integration adapters and reconciliation.
-   Operational monitoring.

These are logical modules, not separate deployed services.

## 7. Workflow and regulatory rules

### 7.1 Route determination

Route selection must use verified applicable rules plus the relevant
application category/purpose, institution context, and academic cycle.
Record which rule/version supports the selected route and whether
authorised manual review was needed. If data or rules are ambiguous,
stop automatic selection and flag the case for authorised review.

### 7.2 Lifecycle modelling

The system should be able to represent, where applicable and officially
supported: - draft/preparation; - submission and completeness checks; -
eligibility/cut-off checks where defined; - scrutiny and re-scrutiny; -
deficiency notice and response; - EVC
planning/scheduling/completion/report; - committee proceedings; -
recommendation; - authorised decision; - formal communication/order; -
appeal/review where applicable; - post-decision
obligations/compliance; - closure and historical access.

This is a list of capabilities to model, not a claim that every case
follows all stages or that this is a universal AICTE sequence.

### 7.3 Distinct concepts

-   **Stage/state:** the case's position in its configured process.
-   **Observation/deficiency:** an issue requiring action or response.
-   **Recommendation:** advice/recommendation by an authorised
    reviewer/body.
-   **Decision:** outcome recorded by the authorised decision-maker.
-   **Official communication/order:** formal issued communication.
-   **Notification:** alert about an event; not itself an order.
-   **Appeal:** separate process linked to the original case, where
    applicable.
-   **Compliance obligation:** requirement that may continue after a
    decision.
-   **Audit event:** historical record of an action/material change.

### 7.4 Transition integrity

Only configured transitions may be executed. Re-check current state on
the backend, prevent duplicate/stale requests, and record actor,
timestamp, prior/new state, reason, related record, and rule version
where relevant. Use concurrency/version safeguards where needed.
Corrections should be traceable new events; do not erase original
decision history.

## 8. Rule catalogue and deadlines

Every active rule should have, as applicable: - unique ID and name; -
official source and exact clause; - source/version and verification
date; - review/approval status and responsible owner; - effective
dates; - application category/conditions; - trigger and calculation
method; - calendar-day/business-day semantics; - timezone and
time-of-day convention; - due-date/reminder calculation; - permitted
extensions/exceptions only if the source allows them; - treatment of
existing cases when a rule changes; - version history; - tests proving
expected behaviour.

Use controlled states such as draft → review → approved → active →
superseded/retired. Only authorised approvers may activate rules.
Unverified rules must not become active.

Distinguish official submission cut-offs, internal targets, scrutiny
periods, response periods, EVC/report milestones, committee processing,
appeals where applicable, undertaking due dates, document expiry dates,
and reminder/escalation times. Do not generalise a deadline from one
category to all. A seven-day appeal provision appeared in reviewed
material for a particular scope; it must not be applied universally
without verifying the exact clause and route.

## 9. Documents and official communications

### 9.1 Document handling

Store file bytes in the chosen private file store and metadata/reference
in the database unless an explicit design says otherwise. Suggested
metadata: document ID/type, institution/application/obligation linkage,
storage key/provider, original filename, MIME type, size, checksum where
implemented, uploader/time, version/supersession link,
issue/effective/expiry dates where applicable, verification
status/verifier/time, rejection reason, access classification, retention
state.

Validate file type/size and permissions. Do not expose private storage
URLs or credentials. Missing or ambiguous dates require review rather
than inference.

### 9.2 Official communication management

Where applicable, store communication/order type, linked case/workflow
event, template ID/version, recipients, issuing authority, issue time,
generated file reference, status, and delivery evidence. Do not label an
email or generated PDF an official order unless the authorised process
establishes that status. Verify signature/attestation requirements from
the applicable source.

### 9.3 Retention and recovery

Provide backup/recovery, retention/archival, and controlled deletion
processes. Verify legal retention periods before configuring them.
Ordinary record deletion must not silently delete audit or official
decision history.

## 10. Real-time and event reliability

Candidate events include application submission/stage change,
deficiency/response, EVC schedule changes, compliance
submission/verification, document expiry alerts, deadline/escalation,
official decision/communication, notification creation, and relevant
dashboard changes.

Rules: - The persisted business record is authoritative. - Publish only
after commit. - Use a durable outbox or equivalent when a business
change must reliably trigger an event. - Make publishing/processing
idempotent. - Include event ID/type, entity ID, timestamp, and minimal
non-sensitive payload. - Authorise subscription/channel access. - Handle
disconnects, reconnections, duplicates, out-of-order events, and missed
messages. - Reconcile on reconnect by fetching current authorised state
or using a version/cursor. - Monitor publish failures and stuck outbox
events. - REST APIs remain the way to retrieve authoritative data;
real-time delivery supplements them.

Provider, protocol, channel model, and deployment remain unresolved.

## 11. Notifications and scheduled automation

A reminder/escalation flow should derive due dates from an approved
rule/version, schedule durable work, re-check current case state and
recipient permissions when executing, skip obsolete work, send via
configured delivery channel, record success/failure, retry safely,
prevent duplicates, and preserve audit history.

If BullMQ + Redis is used, configure retries/backoff, idempotency,
failed-job inspection, and monitoring. The queue cannot be the only
record that a deadline exists. Nodemailer requires a selected SMTP
provider and secrets in environment configuration.

## 12. Conceptual data model

These are proposed entity concepts, not a final schema:

-   `User` and provider/session records as required by the selected auth
    solution.
-   `Role`, `Permission`, role assignments if needed.
-   `Institution`, `Application`, `ApplicationAssignment`.
-   `WorkflowDefinition`, `WorkflowStageDefinition`,
    `WorkflowTransitionDefinition`, `WorkflowInstance`,
    `WorkflowStageHistory`.
-   `ScrutinyObservation`, `ObservationResponse`.
-   `EVCEvent`, `EVCMemberAssignment`.
-   `CommitteeProceeding`, `Recommendation`, `DecisionRecord`,
    `AppealCase` where applicable.
-   `OfficialCommunication`.
-   `ComplianceObligation`, `ComplianceEvidence`.
-   `DocumentMetadata`/`Document`.
-   `RuleSource`, `RuleVersion`.
-   `Notification`, `EscalationRecord`, `AuditEvent`, `OutboxEvent`.
-   Integration mappings/import/reconciliation records if integrations
    are implemented.

Schema requirements: stable IDs, explicit foreign keys, appropriate
indexes/uniqueness, documented enums, consistent timestamps/timezone
policy, historical rule versions, traceable decision history, and
explicit archival/deletion behaviour. Dashboard values should be
derived, not independently editable. Avoid duplicate sensitive data
without a defined need.

## 13. Audit, security, and confidentiality

Audit material actions, including application changes/submission,
assignments/transitions, deficiencies/responses, document
upload/version/verification/rejection, EVC changes, committee
proceedings/recommendations, decisions/communications, compliance
submissions/verification, rule activation, notification
attempts/escalations, imports, and administrative actions.

Audit records should include actor/system identity, action, entity,
timestamp, outcome, safe before/after summary, reason where required,
request/correlation ID, and rule version where relevant. Never log
passwords, access tokens, or unnecessary document contents.

Security requirements: - backend authentication and RBAC on every
protected operation; - resource ownership/assignment and
institution-boundary checks; - least privilege for
users/services/database/storage/integrations; - secrets kept out of
source control/client bundles; - HTTPS in deployed environments; -
backend validation and parameterised/ORM queries; - rate limiting/abuse
protection for sensitive endpoints; - narrow CORS configuration; - CSRF
protection where required by the selected cookie/session design; -
secure file uploads/downloads; - safe error responses without stack
traces or secrets; - structured/redacted operational logs; - backups,
restore procedures, and incident handling appropriate to the deployment.

## 14. AICTE system integrations

Integrate with existing authorised AICTE systems only where an
authorised interface, credentials, and permitted scope are available.
Use an adapter boundary; track external IDs, source, import time, and
reconciliation status; make imports idempotent; detect conflicts; define
the source of truth for each field; never silently overwrite newer
authoritative data. Log sync failures and send conflicts for review.

If no authorised interface is available, use seeded demo data or a
clearly labelled mock adapter. Do not scrape private systems or claim
production connectivity.

## 15. Frontend workspaces

Build role-appropriate views with server-enforced data boundaries.

-   **Institution portal:** own applications, submission, uploads,
    deficiency responses, status/deadline tracking, relevant EVC
    details, compliance, document validity, communications,
    notifications.
-   **Officer/reviewer workspace:** assigned/pending cases,
    application/document review, observations/deficiencies, response
    history, permitted transitions, deadlines, EVC/compliance context,
    audit history.
-   **EVC/committee workspace:** assigned cases/schedules, authorised
    supporting materials, proceedings/recommendations/follow-up where
    permitted. Do not treat EVC, SHC, SAC, or other bodies as
    interchangeable.
-   **Admin/monitoring workspace:** users/roles, approved rule/workflow
    configuration, pendency, overdue cases, EVC, compliance, document
    validity, escalations, region-wise reporting, and operational health
    according to permissions.

UI requirements:
loading/empty/success/validation/401/403/404/409/500/network states;
live updates only for defined events; refresh authoritative data after
events; clearly label demo data; never expose confidential data through
public views, browser logs, or unauthorised notifications.

## 16. API contracts

Use versioned REST APIs unless a documented decision justifies
otherwise. `/api/v1` is a proposed convention, not an implemented
contract. Validate path/query/body input, use consistent
responses/errors, paginate large lists, define filters/sorts, and
document the implemented API with OpenAPI. Do not expose ORM internals
as the public contract.

Every state-changing endpoint must check authentication, role,
ownership/assignment, current state, and applicable rule version.
Prevent duplicate actions. Keep private file operations behind the
backend. Define a separate real-time event contract including event
name, payload, audience, authorisation, ordering, and recovery.

## 17. Testing and acceptance

Use Vitest for unit/service tests, Supertest for API tests, and
Playwright for end-to-end flows as recorded in the proposed stack.
Test: - verified route selection and invalid transitions; - deadline
calculations and alerts; - dashboard count consistency; - EVC
scheduling/status; - undertaking/document expiry reminders; - duplicate
jobs/events and retry behaviour; - audit completeness and rule-version
traceability; - unauthenticated, wrong-role, wrong-owner/institution,
unassigned, invalid-ID/body/state, duplicate, stale/concurrent,
not-found, and provider-failure cases; - private document access and
upload validation; - real-time subscription authorisation, reconnect,
missed-event reconciliation, duplicate/out-of-order events; -
database/queue/storage/email/integration failures; - safeguards
preventing automated statutory decisions.

Evaluation criteria from the project understanding: workflow accuracy,
alert timeliness, deadline tracking reliability, visibility of pending
cases, reduced manual follow-up, and audit-trail completeness. Also
verify compliance/document validity monitoring, EVC visibility, RBAC,
and live updates without manual refresh for the explicitly defined
events.

Maintain a requirement-to-test matrix mapping PS requirement → module →
data/API/UI → verified rule source where relevant → responsible role →
test → expected result/evidence.

## 18. Operations and monitoring

Monitor API health/errors, database failures, failed/retried jobs, stuck
outbox events, email failures, real-time publish/subscription failures,
storage errors, integration conflicts, invalid/expired rule
configuration, and backup/restore status where available. Operational
monitoring is separate from the business dashboard. Health endpoints
must not expose secrets. Redact confidential data in logs.

## 19. Implementation order

### Phase 0 --- resolve blockers

-   Verify PS and applicable handbook/circular versions.
-   Confirm database and document-storage decisions after the Neon
    clarification.
-   Select authentication solution other than Better Auth.
-   Select real-time provider/transport independent of Neon.
-   Define initial RBAC matrix.
-   Decide package-manager/workspace/lockfile strategy.
-   Establish environment/secret conventions and requirement-to-test
    traceability.

### Phase 1 --- foundation

-   Create required root, `frontend/`, `backend/`, `docs/` structure.
-   Set up frontend/backend and tests.
-   Add API client, validation, error handling, formatting/linting,
    environment configuration.
-   Establish Git/GitHub collaboration without committing secrets.

### Phase 2 --- identity and persistence

-   Implement selected authentication and backend RBAC.
-   Define schema/migrations after database decision.
-   Add audit recording and permission tests early.
-   Configure private document storage after provider confirmation.

### Phase 3 --- workflow core

-   Create reviewed rule catalogue from verified sources.
-   Implement application records, route determination, workflow
    definitions/history/transitions.
-   Add completeness checks only for confirmed requirements.
-   Implement scrutiny, deficiencies, responses, and resubmission where
    applicable.
-   Test routes and prohibited transitions.

### Phase 4 --- EVC, committees, and official records

-   Implement EVC scheduling and related records.
-   Implement proceedings, recommendations, decisions, appeals, and
    official communications only where supported by verified routes and
    authority.
-   Keep formal orders distinct from notifications.

### Phase 5 --- documents and compliance

-   Implement private uploads/downloads, metadata/version history,
    validity monitoring, undertakings, evidence submission/verification,
    and dashboards.

### Phase 6 --- real-time and automation

-   Integrate selected non-Neon real-time provider.
-   Define and secure event subscriptions; implement
    reconnect/reconciliation.
-   Add durable outbox publishing.
-   Add BullMQ/Redis or selected job solution for scheduled
    reminders/escalations.
-   Configure email after SMTP selection.
-   Test retries, duplicates, failures, and state re-checks.

### Phase 7 --- dashboards and integrations

-   Build role-specific dashboards, defined metrics, filters, and
    reports.
-   Add authorised external adapters only if interfaces/access are
    available; otherwise label simulated data.

### Phase 8 --- verification/deployment

-   Run unit/API/integration/end-to-end tests.
-   Verify every PS requirement through the traceability matrix.
-   Check source-linked regulatory rules, access boundaries, upload
    security, audit, real-time recovery, and job reliability.
-   Select hosting, configure HTTPS/secrets/monitoring/backups, and
    document limitations.

## 20. Decision register

### Confirmed

-   Project name and overall purpose.
-   Hackathon prototype, shared team access, low cost, future
    extensibility.
-   Six main capabilities: workflow, dashboard/pendency, EVC,
    undertakings/compliance, document validity,
    notifications/escalations/reporting.
-   Human oversight and authorised decisions.
-   Required repository with separate `frontend/`, `backend/`, `docs/`;
    user manually maintains Markdown files in `docs/`.
-   Real-time functionality is required and must not use Neon as its
    real-time service.
-   Better Auth must not be used.
-   Neon PostgreSQL and Object Storage were previously enabled, but
    their final role is unresolved.

### Proposed stack from prior notes, subject to corrections

-   React + TypeScript + Vite; Tailwind CSS; shadcn/ui; React Router.
-   Node.js + Express + TypeScript; Zod.
-   Prisma if PostgreSQL remains selected.
-   Recharts; FullCalendar; Swagger/OpenAPI.
-   Git/GitHub; Vitest; Supertest; Playwright.
-   BullMQ + Redis for scheduled jobs when needed.
-   Nodemailer + SMTP if email is implemented.

### Unresolved --- do not guess

1.  Authentication provider/approach (Better Auth excluded).
2.  Real-time provider/transport (required; Neon excluded).
3.  Whether Neon PostgreSQL remains the database or Neon is replaced
    entirely.
4.  Whether Neon Object Storage remains the file store.
5.  SMTP/email provider.
6.  Redis/job hosting provider.
7.  Frontend/backend deployment/hosting.
8.  Exact roles and permission matrix.
9.  Applicable official handbook/circular versions and exact rules.
10. Authorised AICTE integration interfaces/credentials.
11. Whether OCR/AI extraction is in scope.
12. Final schema and API contract.

## 21. Source-of-truth and future docs

Project inputs include the official problem statement,
`AICTE APH 2024–2027.pdf`, `Tech Stack Reasoning.txt`, and explicit
decisions made in the project conversation.

When sources conflict: 1. Follow the user's latest explicit correction
for project decisions. 2. For regulatory facts, use the applicable
official source after verification. 3. Preserve unresolved conflicts
rather than silently reconciling them. 4. Keep source/clause/version
references beside every activated regulatory rule. 5. Update
documentation and tests whenever rules or providers change.

Suggested Markdown files in `docs/` (suggestions only; the user will add
them manually): - `architecture.md` - `tech-stack.md` -
`database-schema.md` - `api-specification.md` - `rbac-matrix.md` -
`workflow-rules.md` - `regulatory-rule-catalogue.md` -
`real-time-event-contract.md` - `notification-and-escalation-rules.md` -
`security-and-privacy.md` - `integration-plan.md` -
`testing-and-acceptance-criteria.md` - `deployment-runbook.md` -
`decision-log.md`

Do not assume any suggested file exists until it is present in the
repository.

## 22. Final guardrails

-   Implement only what is supported by the PS, verified regulatory
    sources, and confirmed technical decisions.
-   Preserve the repository structure.
-   Do not use Better Auth or Neon Realtime.
-   Do not silently remove or retain Neon PostgreSQL/Object Storage as a
    final decision.
-   Do not invent provider choices, credentials, official routes, or
    deadlines.
-   Do not conflate notification with official order, recommendation
    with decision, or stage with legal outcome.
-   Never substitute frontend-only checks for backend authorisation.
-   Never make real-time messages the authoritative record.
-   Never claim production AICTE integration without authorised,
    implemented, verified access.
-   Keep critical actions permission-checked, traceable, testable, and
    recoverable.
-   If a task depends on an unresolved decision, stop before
    provider-specific/irreversible implementation and ask rather than
    guess.

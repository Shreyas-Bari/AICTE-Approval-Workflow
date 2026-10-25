# Project Architecture --- AICTE Approval Workflow Automation

**Project:** Integrated AICTE Approval Workflow Automation, Compliance
Monitoring and Alert Management System\
**Short name:** AICTE Workflow Automation\
**Document type:** System architecture and technical design\
**Primary regulatory reference:** *AICTE Approval Process Handbook
2024--2027* supplied with the project\
**Companion specification:** `project-requirements.md`\
**Audience:** Antigravity, developers, reviewers, and project
maintainers\
**Architecture status:** Baseline architecture for a hackathon
prototype. Confirmed choices, proposed components, optional components,
and unresolved decisions are explicitly distinguished.

------------------------------------------------------------------------

## 1. Purpose and governing principles

This document defines the system boundaries, architecture, component
responsibilities, data flows, repository structure, security model, and
implementation constraints for the AICTE Approval Workflow Automation
project.

It is intended to be used alongside `project-requirements.md`. The
requirements document defines what the system must do; this document
defines how the software should be structured to implement those
requirements without inventing regulatory rules or silently committing
to unselected providers.

### 1.1 Architecture principles

1.  **Regulatory correctness before automation.** Workflow routes,
    deadlines, eligibility conditions, document checklists, fees, appeal
    windows, and authority rules must be derived from the applicable APH
    provisions and verified official directions. They must not be
    guessed.
2.  **No universal AICTE workflow assumption.** Application routes
    differ by institution type, application purpose/category, academic
    cycle, and applicable APH clause/table. Only verified categories may
    be enabled.
3.  **Human authority is preserved.** The application may organise
    evidence, enforce configured workflow transitions, calculate
    verified deadlines, and surface recommendations or pending work. It
    must not independently make statutory approval/rejection decisions
    or impose penalties.
4.  **One authoritative business state.** PostgreSQL is the
    authoritative store for application/workflow state if the current
    Neon PostgreSQL choice is retained. Real-time events, queues,
    browser state, emails, and files are not alternate authorities for
    that state.
5.  **Server-side security.** Authentication, authorisation, tenant
    boundaries, document permissions, and workflow-transition rules are
    enforced by the backend. Hiding a button in React is not access
    control.
6.  **Configuration for regulatory variability.** Category routes,
    checklist rules, deadlines, effective dates, and notification
    thresholds must be represented as reviewed data/configuration rather
    than scattered conditionals.
7.  **Traceability by design.** Material actions, source/rule versions,
    decisions, document versions, alerts, and integration events must be
    traceable.
8.  **Fail visibly, not silently.** Failed notifications, background
    jobs, imports, storage actions, and real-time publication must be
    observable and recoverable.
9.  **Keep the prototype manageable.** Use a modular monolith unless
    measured requirements justify distributed services. Microservices,
    Kubernetes, a dedicated BPM platform, and AI document processing are
    not prerequisites.
10. **Do not claim integrations that do not exist.** AICTE portal
    access, payment processing, DSC validation, email delivery, and
    other external connections must be labelled simulated/manual until
    verified against the actual authorised service.
11. **Provider choices stay explicit.** Do not implement an unresolved
    provider choice by silently selecting a vendor.
12. **Documentation and implementation stay aligned.** Antigravity must
    update the implementation and test traceability without changing the
    requirements or regulatory interpretation silently.

------------------------------------------------------------------------

## 2. Architecture status: confirmed, proposed, optional, unresolved

The terms below are important. "Proposed" does not mean the service is
already configured or available.

### 2.1 Confirmed project constraints

-   Project objective: automate and monitor approval-workflow
    administration, compliance, and alerts.
-   The supplied APH 2024--2027 PDF is the current project reference,
    but its current legal applicability must be checked before real
    deployment.
-   The user has created a Neon project with PostgreSQL and Neon Object
    Storage enabled.
-   A teammate needs access to the shared project/repository and
    development setup.
-   Repository should keep `frontend/`, `backend/`, and `docs/` as
    separate directories.
-   The user manually adds and maintains Markdown documentation in
    `docs/`.
-   **Better Auth is excluded** from the selected architecture.
-   **Neon Realtime is excluded** from the real-time UI architecture.
-   The real-time capability is required by the project plan, but its
    provider/transport has not been selected.
-   The system must distinguish a recommendation from an official
    decision and an email/notification from a formal order.
-   The system must not guess APH route/deadline/fee/document rules.
-   The first release is a hackathon prototype, not a certified
    replacement for AICTE's official approval systems.

### 2.2 Recorded stack proposal

  -----------------------------------------------------------------------
  Layer                   Recorded technology     Status and
                                                  responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                React + TypeScript +    Proposed baseline for
                          Vite                    the browser application

  Styling                 Tailwind CSS            Proposed utility-first
                                                  styling

  UI components           shadcn/ui               Proposed reusable
                                                  accessible UI
                                                  components

  Frontend routing        React Router            Proposed
                                                  route/navigation layer

  Backend runtime         Node.js                 Proposed server runtime

  API framework           Express + TypeScript    Proposed REST API and
                                                  middleware

  Input validation        Zod                     Proposed runtime
                                                  validation for API
                                                  inputs and environment
                                                  configuration

  Database                Neon PostgreSQL         Existing project
                                                  created; retain unless
                                                  the owner decides
                                                  otherwise

  ORM/migrations          Prisma                  Proposed schema access
                                                  and migrations

  Document storage        Neon Object Storage     Existing project
                                                  enabled; private access
                                                  design and current
                                                  capabilities must be
                                                  verified

  Authentication          Not selected; Better    Must be decided before
                          Auth excluded           auth implementation

  Authorization           Custom RBAC             Required
                          middleware/policies     application-level
                                                  access control

  Background jobs         BullMQ + Redis          Proposed for durable
                                                  reminders, retries, and
                                                  escalation jobs;
                                                  service/hosting
                                                  unresolved

  Email                   Nodemailer + SMTP       Proposed transport;
                                                  SMTP provider
                                                  unresolved

  Charts                  Recharts                Proposed dashboard
                                                  charting

  Calendar                FullCalendar            Proposed EVC/deadline
                                                  calendar UI

  API docs                Swagger/OpenAPI         Proposed API contract
                                                  documentation

  Version control         Git + GitHub            Proposed team
                                                  collaboration and code
                                                  review

  Unit/component tests    Vitest                  Proposed test runner

  API/integration tests   Supertest               Proposed Express API
                                                  tests

  End-to-end tests        Playwright              Proposed browser
                                                  workflow tests
  -----------------------------------------------------------------------

### 2.3 Optional or deferred technologies

  ------------------------------------------------------------------------------
  Technology/capability          Status                  Decision rule
  ------------------------------ ----------------------- -----------------------
  Redis + BullMQ                 Optional in the         Use for durable
                                 earliest visual demo;   scheduling and retries;
                                 required when reliable  do not rely on an
                                 scheduled jobs/retries  in-memory timer for
                                 are implemented         important reminders

  Real-time updates              Required capability;    Select a
                                 provider unresolved     provider/transport
                                                         other than Neon
                                                         Realtime before
                                                         implementing live
                                                         updates

  OCR/document extraction        Optional/future         Add only if explicitly
                                                         included; human
                                                         verification remains
                                                         required

  AI-assisted                    Optional/future         Must not make statutory
  classification/summarisation                           decisions; outputs must
                                                         be reviewable

  Camunda/BPM platform           Not required            Consider only if custom
                                                         workflow configuration
                                                         becomes demonstrably
                                                         inadequate

  NGINX                          Not required for        Consider only for a
                                 managed hosting         self-hosted deployment
                                                         where it serves a
                                                         defined need

  Python/FastAPI                 Not required            Add only if a concrete
  document-processing service                            OCR/processing
                                                         capability needs it

  SMS/WhatsApp/push              Optional/future         Requires provider,
                                                         consent/privacy review,
                                                         and delivery tracking

  Kubernetes/microservices       Not required            Avoid for the prototype
                                                         absent a measured
                                                         operational need
  ------------------------------------------------------------------------------

### 2.4 Decisions Antigravity must not make silently

1.  Authentication provider and session model.
2.  Real-time provider/transport, explicitly excluding Neon Realtime.
3.  Whether to retain Neon PostgreSQL.
4.  Whether to retain Neon Object Storage and the exact private-access
    mechanism.
5.  Redis hosting/provider and whether BullMQ is enabled in the first
    release.
6.  SMTP/email provider.
7.  Frontend/backend/worker hosting providers.
8.  Exact supported APH application categories and workflow definitions.
9.  Whether live authorised AICTE integration is available.
10. Numeric performance, uptime, retention, and accessibility targets.

If implementation depends on one of these decisions, mark the affected
work `BLOCKED_DECISION` and request clarification. Do not choose a
provider merely because it is convenient.

------------------------------------------------------------------------

## 3. System context and boundaries

### 3.1 System context

The product is a workflow and compliance management layer for authorised
users. It tracks application cases, review stages, observations,
deficiency responses, EVC events, committee proceedings, official
decisions/communications, obligations, document validity, alerts, and
audit history.

It does not automatically become the official AICTE application portal.
Any production integration is conditional on an authorised interface,
credentials, permitted data scope, and operational approval.

``` mermaid
flowchart TB
    Institution[Institution / Applicant User]
    Reviewer[Scrutiny Reviewer]
    Committee[EVC / Committee User]
    Authority[Authorised Decision Authority]
    Admin[System Administrator]
    Monitor[Monitoring / Reporting User]

    UI[React Web Application]
    API[Express REST API]
    Domain[Workflow, Rules, Compliance and Audit Modules]
    DB[(PostgreSQL)]
    Files[(Private Object Storage)]
    Jobs[Background Worker / Job Queue]
    Mail[SMTP Email Provider]
    Realtime[Selected Real-Time Provider / Transport]
    External[Authorised External System Adapter]
    Ops[Operational Logs and Health Monitoring]

    Institution --> UI
    Reviewer --> UI
    Committee --> UI
    Authority --> UI
    Admin --> UI
    Monitor --> UI
    UI <--> API
    API --> Domain
    Domain <--> DB
    Domain <--> Files
    Domain --> Jobs
    Jobs --> Mail
    API <--> Realtime
    Domain <--> External
    API --> Ops
    Jobs --> Ops
    External --> Ops
```

### 3.2 In-scope system boundary

Inside the system boundary: - Browser UI and route-level presentation. -
API, middleware, domain services, and rule evaluation. -
Application/workflow records and audit data. - Metadata and
access-control decisions for stored files. - Reminder/escalation
orchestration and notification history. - Dashboard/report query
logic. - Integration adapters and simulated adapters. - Operational
failure reporting and automated tests.

Outside the boundary unless explicitly added: - AICTE production portal
and internal systems. - Actual government identity/authentication
systems. - Actual payment gateway. - Actual cryptographic DSC
verification service. - Official AICTE email infrastructure. -
Third-party SMTP, Redis, real-time, and hosting infrastructure. - Human
committee deliberations and statutory decision-making. - Legal
determination of whether a particular rule applies.

### 3.3 Trust boundaries

1.  **Browser → API:** all input is untrusted. Validate request body,
    query, path parameters, identity, and resource permissions on the
    server.
2.  **API → database:** use a least-privilege connection/configuration
    and parameterised ORM queries. Never expose database credentials to
    the browser.
3.  **API → object storage:** file access must be mediated by
    application permissions. Never expose private bucket credentials to
    the browser.
4.  **Worker → queue/database/email:** job payloads are untrusted/stale
    until validated. Re-read current state before sending a notification
    or changing case state.
5.  **External system → adapter:** validate, deduplicate, record
    provenance, and reconcile conflicts. Do not blindly overwrite
    authoritative records.
6.  **Administrator → configuration:** technical admin access is not
    equivalent to regulatory rule approval or statutory decision
    authority.
7.  **Real-time provider → browser:** events are notifications of
    change, not the authoritative state; use authenticated subscriptions
    and reconcile through the API.

------------------------------------------------------------------------

## 4. Logical architecture

### 4.1 Architectural style

Use a **modular monolith**: - One frontend application. - One Express
backend/API application. - One relational database. - One object-storage
integration. - One background worker process when jobs are enabled. -
Provider adapters for email, real-time updates, and authorised external
systems.

The API and worker may be deployed as separate processes from the same
backend codebase. They should share domain services and configuration,
but only the API should serve HTTP requests. A worker must not expose
unnecessary public endpoints.

This style is appropriate for a small team/hackathon because it reduces
deployment and debugging complexity while preserving module boundaries.
It also makes workflow transitions, audit writes, and durable job
creation easier to keep transactionally consistent. It does not prevent
future extraction of a module into a separate service if scale or
ownership later justifies it.

### 4.2 Component layers

1.  **Presentation layer:** pages, layouts, forms, tables, dashboards,
    route guards for UX, accessible state indicators.
2.  **API/transport layer:** HTTP routing, authentication integration,
    request validation, response schemas, rate limiting, error mapping,
    API documentation.
3.  **Application/domain layer:** use cases, workflow transition
    service, rule selection, deadline calculations, compliance
    verification, document permission checks, notification
    orchestration, audit event creation.
4.  **Persistence layer:** Prisma models and repositories for
    PostgreSQL; transaction boundaries; migrations.
5.  **File adapter:** storage upload/download/delete/version operations
    behind a service interface.
6.  **Job/event layer:** outbox records, queue dispatch, scheduled jobs,
    retries, idempotency, dead-letter/failed-job handling.
7.  **Provider adapters:** SMTP, real-time transport, authorised
    external system APIs, and simulated implementations.
8.  **Observability layer:** structured redacted logs,
    request/correlation IDs, health checks, job/provider failure
    visibility.
9.  **Configuration/governance layer:** reviewed rule versions,
    supported category list, workflow definitions, notification
    thresholds, and effective dates.

### 4.3 Backend request path

``` mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as Express API
    participant Auth as Authentication Adapter
    participant Policy as RBAC / Resource Policy
    participant Zod as Request Validation
    participant Service as Domain Service
    participant DB as PostgreSQL / Prisma
    participant Outbox as Durable Outbox
    participant Worker as Job Worker

    User->>UI: Submit action
    UI->>API: HTTPS request
    API->>Auth: Resolve identity/session
    Auth-->>API: User identity or unauthenticated
    API->>Policy: Check role, assignment and institution scope
    Policy-->>API: Allow or deny
    API->>Zod: Validate request
    Zod-->>API: Validated input or validation error
    API->>Service: Execute use case
    Service->>DB: Read current state and applicable rule
    Service->>DB: Transaction: update state + history + audit + outbox
    DB-->>Service: Commit result
    Service-->>API: Domain result
    API-->>UI: Structured response
    Outbox-->>Worker: Dispatcher delivers durable event to queue
    Worker->>DB: Re-check current state before delayed action
```

**Implementation requirement:** the exact ordering of middleware can be
adjusted for framework conventions, but no protected domain action may
run before identity and authorisation are established. Public health
endpoints are a separate, minimal exception. Request validation should
happen before domain mutation. Errors must be mapped consistently.

------------------------------------------------------------------------

## 5. Frontend architecture

### 5.1 Technology and rationale

-   **React:** component-based application UI for institution, officer,
    committee, authority, and administrator workspaces.
-   **TypeScript:** makes domain types and API contracts explicit and
    reduces accidental mixing of statuses/identifiers.
-   **Vite:** frontend development/build tooling.
-   **Tailwind CSS:** responsive layout and styling.
-   **shadcn/ui:** reusable UI components for forms, dialogs, tables,
    tabs, alerts, and status indicators.
-   **React Router:** route-level navigation and layout separation.
-   **Recharts:** dashboard visualisations.
-   **FullCalendar:** calendar presentation for EVCs and deadlines. It
    is a UI component only; it does not calculate official deadlines or
    become the source of schedule truth.

### 5.2 Frontend responsibilities

The frontend: - Displays data returned by the API. - Collects user input
and provides client-side usability validation. - Uses API schemas/types
to present validation and permission errors. - Shows current status, due
dates, overdue indicators, source/rule provenance, document verification
status, and audit history where authorised. - Presents separate UI
states for `recommendation`, `official decision`,
`formal communication`, and `notification`. - Shows clear labels for
simulated data and mock integrations. - Provides live-update UX only
after the real-time transport is selected and secured. - Re-fetches
authoritative API state after reconnecting or detecting missed events. -
Does not contain database credentials, storage secrets, SMTP
credentials, regulatory secrets, or private API keys. - Does not
directly query PostgreSQL or access private object storage. - Does not
make final permission decisions; the server remains authoritative.

### 5.3 Suggested frontend page areas

Page names are implementation suggestions; exact route names can be
selected during implementation as long as the responsibilities and
permissions are preserved.

-   **Sign-in/session area:** authentication UI for the selected
    authentication solution.
-   **Institution workspace:** institution profile, draft/submitted
    applications, required documents, deficiency notices, response
    submissions, compliance obligations, document expiry, notifications,
    and permitted appeal information.
-   **Officer workspace:** assigned applications, scrutiny queue,
    observation entry, deficiency workflow, EVC records, pending
    verification, and assigned deadlines.
-   **EVC/committee workspace:** assigned cases, schedule/calendar,
    relevant supporting material, proceedings, reports, and
    recommendation records permitted by role.
-   **Decision authority workspace:** cases awaiting authorised
    decision, relevant recommendations/reports, decision entry, and
    formal communication references.
-   **Administrator workspace:** user/role management, approved
    workflow/rule configuration, provider/operational status, and audit
    access according to policy. Technical administration must not imply
    decision authority.
-   **Monitoring/reporting workspace:** pendency, stage ageing, overdue
    cases, EVC status, compliance, expiring/expired documents,
    escalations, and region-based metrics where region data exists.
-   **Case detail view:** current state, timeline, assignments,
    observations, documents, communications, obligations, deadlines, and
    audit history filtered by permissions.

### 5.4 Frontend state and data fetching

-   API responses are the source for authoritative case state.
-   Local component state may hold form drafts, filters, selected tabs,
    and transient UI state.
-   Any client-side cache must be invalidated/reconciled after a
    mutation or live event.
-   A stale-state conflict should produce a recoverable message and
    refresh the case, not silently retry a potentially destructive
    transition.
-   Do not keep private document contents in persistent browser storage.
-   Do not rely on route guards alone for security.

### 5.5 UI accessibility and usability

-   Label form fields and associate validation errors with the relevant
    controls.
-   Make primary actions keyboard-operable.
-   Use text labels as well as colour for status.
-   Distinguish disabled actions from actions that are not permitted.
-   Display source/rule and deadline semantics where relevant; avoid
    showing an unexplained date as if it were an official deadline.
-   Provide loading, empty, error, permission-denied, and stale-data
    states.

------------------------------------------------------------------------

## 6. Backend architecture

### 6.1 Technology and rationale

-   **Node.js:** server-side runtime for the API and worker.
-   **Express:** REST endpoint framework and middleware pipeline.
-   **TypeScript:** typed domain contracts and maintainable module
    boundaries.
-   **Zod:** runtime validation of untrusted HTTP inputs and
    configuration. TypeScript types alone do not validate runtime data.
-   **Prisma:** relational model access, type-aware queries, and
    database migration management.
-   **Swagger/OpenAPI:** documented API contracts for team
    implementation and testing.
-   **Vitest/Supertest:** unit/domain and API integration testing.

### 6.2 Backend module boundaries

Modules should communicate through exported service functions/interfaces
rather than reaching into one another's database tables ad hoc. A
modular monolith does not require every module to have its own database.

#### `auth`

-   Integrates with the selected authentication provider/library.
-   Resolves authenticated identity and session claims.
-   Does not define statutory workflow authority by itself.

#### `access-control`

-   Implements role and permission checks.
-   Applies institution/resource ownership boundaries and assignment
    checks.
-   Separates technical administrator permissions from official decision
    authority.
-   Provides policy functions used by API handlers and domain services.

#### `institutions`

-   Institution profile and approved scope of institution data.
-   Links institution users and application records.
-   Does not independently determine AICTE eligibility unless a verified
    rule module does so.

#### `applications`

-   Application records, category/purpose, academic cycle, internal ID,
    external ID where available, submission state, and history.
-   Enforces editable/final-submission rules through the selected route
    configuration.

#### `rules`

-   Rule catalogue and versions, source references, effective dates,
    applicability predicates, review/approval status, and supersession
    relationships.
-   Prevents unreviewed rules from being activated.
-   Keeps rule governance distinct from ordinary system administration.

#### `workflow`

-   Workflow definitions, stages, permitted transitions, active workflow
    instances, current stage, transition history, assignment references,
    and transition guards.
-   Calls relevant domain services rather than implementing document,
    email, or decision logic inside a generic state machine.
-   Does not hard-code one universal AICTE sequence.

#### `scrutiny`

-   Scrutiny/re-scrutiny assignments, observations, deficiency records,
    institution responses, evidence links, and report references.
-   Applies only to categories/routes that require these stages.

#### `evc`

-   EVC requirement/schedule, mode, event status, assignments/member
    references where in scope, report references, and history.
-   Does not infer that every case needs an EVC.

#### `committee-proceedings`

-   Committee type, schedule, relevant participants/authorisations,
    supporting materials, proceedings, report, and recommendation.
-   Keeps SHC, SAC, and other bodies distinct where the applicable APH
    route does so.

#### `decisions`

-   Official decision record, authority, decision time, outcome,
    reason/reference, ratification state where applicable, and linked
    official communication.
-   Requires the decision permission appropriate to the active route.
-   Does not derive a final decision automatically from a report or
    recommendation.

#### `appeals`

-   Appeal record linked to a decision and route.
-   Uses the exact applicable eligibility and deadline rule; no
    universal appeal duration is hard-coded.

#### `compliance`

-   Obligation catalogue/instances, source references, due dates,
    responsible party, evidence, verification outcome, and history.
-   Supports time-bound undertakings and recurring/ongoing obligations
    when configured.

#### `documents`

-   File metadata, storage object key, linked
    institution/case/obligation, document type, version, dates,
    signature/attestation state, verification history, and access
    policy.
-   Actual bytes are held in the selected private object-storage
    service; PostgreSQL stores metadata and references.
-   Does not equate upload with verification.

#### `deadlines`

-   Deadline calculation, rule-version association, official vs internal
    deadline classification, calendar semantics, timezone, reminders,
    and overdue status.
-   Does not infer an official deadline without a verified rule.

#### `notifications`

-   Notification intent, recipient, channel, template/version, related
    entity, delivery attempts, provider response, and failure state.
-   A notification is not a formal official order.

#### `escalations`

-   Escalation policy, trigger, target role/recipient, stage,
    deduplication key, timestamps, status, and history.
-   Re-checks the case before sending/escalating.

#### `audit`

-   Material business and administrative events, actor, entity, action,
    timestamp, outcome, safe change summary, request/correlation ID, and
    rule/source reference.
-   Ordinary APIs must not allow users to silently edit or delete audit
    events.

#### `reporting`

-   Defines consistent dashboard metrics and permission-scoped queries.
-   Reports should be derived from authoritative records or documented
    read models.
-   Does not invent missing region or category data.

#### `integrations`

-   Adapters for authorised external systems, imports, exports, external
    IDs, sync status, idempotency, and conflict records.
-   Provides a clearly labelled mock adapter when no authorised live
    connection is available.
-   No scraping or simulated claim of production connectivity.

#### `operations`

-   Health checks, job failure visibility,
    integration/storage/email/real-time diagnostics, and redacted
    operational logging.
-   Must not expose secrets through health endpoints or logs.

### 6.3 API design rules

-   Use versioned REST paths, such as `/api/v1/...`, unless the team
    documents another consistent scheme.
-   Use resource-oriented endpoints for applications, documents,
    observations, EVCs, obligations, decisions, and notifications.
-   Workflow transitions must use an explicit action endpoint/service;
    do not permit clients to PATCH an arbitrary `status` field.
-   Validate body, path, and query input with Zod or an equivalent
    runtime schema.
-   Use consistent response and error formats.
-   Use appropriate HTTP status codes for validation errors,
    unauthenticated requests, forbidden requests, missing resources,
    conflicts, rate limits, and unexpected server failures.
-   Do not return stack traces, secrets, raw database errors, private
    object keys, or internal provider credentials to clients.
-   Use pagination and filters for growing lists.
-   OpenAPI documentation must match implemented endpoints.
-   Mutations should accept an idempotency key where retrying could
    create duplicate business actions, or use equivalent database
    uniqueness/state guards.

------------------------------------------------------------------------

## 7. Workflow and regulatory rule engine

### 7.1 Why it is a separate component

The APH covers multiple application types and processing paths. A fixed
linear workflow would risk applying an EVC, committee stage, appeal
window, fee, or document requirement to a category where it does not
apply.

The workflow engine must therefore separate: 1. **Application
classification:** which supported category/purpose and academic cycle
apply? 2. **Rule applicability:** which reviewed rule version applies to
those inputs? 3. **Workflow selection:** which reviewed workflow
definition is linked to that rule? 4. **Transition validation:** is this
action allowed from the current stage, for this role, with these
prerequisites? 5. **Deadline calculation:** what verified trigger/rule
determines the deadline? 6. **Human action:** who may record
observations, recommendations, official decisions, or approvals? 7.
**Audit:** what source, rule version, actor, and transition were used?

### 7.2 Rule record model

Every active regulatory rule should have: - stable rule ID; - source
title and edition; - exact chapter/clause/table/annexure; -
category/purpose and applicability conditions; - source verification
date and reviewer; - approval status and approver; - effective-from and
effective-to dates; - rule version and supersession link; - input fields
and output behaviour; - tests and expected results; - explanation shown
to authorised users.

Suggested governance statuses are `DRAFT`, `IN_REVIEW`, `APPROVED`,
`ACTIVE`, `SUPERSEDED`, and `RETIRED`. These are implementation names,
not APH terminology. Only the designated rule approver may
approve/activate regulatory rules. If no authorised rule approver is
configured, the rule remains inactive.

### 7.3 Workflow definition model

A workflow definition should contain: - workflow ID and version; -
supported application category/purpose; - source/rule references; -
effective dates; - stages and stage metadata; - allowed transitions; -
required role/permission for each action; - prerequisites and validation
hooks; - deadline rules and notification policies; - final/terminal
states, if applicable; - test fixtures and expected paths.

A workflow instance stores the chosen definition/version so that an
active case has reproducible route semantics. A rule update should not
silently rewrite the historical path of an existing case. Whether a new
rule applies to an in-progress case must be an explicit, approved
migration/reassessment policy.

### 7.4 Transition execution

A transition must: 1. Authenticate the user. 2. Verify role, institution
scope, assignment, and specific action permission. 3. Load the current
workflow instance and active case state. 4. Load the workflow/rule
version associated with the case. 5. Validate the requested transition
and its prerequisites. 6. Validate required data/evidence and any
configured deadline conditions. 7. In one database transaction, update
the current state, append workflow history, append audit event, and
create any durable outbox event needed for asynchronous work. 8. Commit
the transaction. 9. Let the outbox dispatcher enqueue durable background
work. 10. Return the resulting state and relevant history metadata.

If the current state changed since the UI loaded it, reject the stale
transition with a conflict response. Do not silently apply the action to
a different state.

### 7.5 APH examples that must remain category-specific

-   Chapter I clauses 1.8--1.9 describe scrutiny/re-scrutiny and EVC for
    the scope covered by those clauses.
-   Chapter II clauses 2.23 and Table 2.3 provide processing routes for
    the categories covered in Chapter II.
-   Chapter II clause 2.24 contains an appeal-period provision for the
    relevant scope; it must not be treated as a universal appeal window.
-   Chapters III--V have distinct provisions for collaboration/twinning,
    universities, and ODL/online learning.
-   Chapter VI contains standards and requirements that may inform
    compliance tracking when specifically configured.
-   Chapter VII concerns penal action; the system may track authorised
    case records if included, but it must not autonomously impose a
    penalty.

These examples are not a complete extracted rule catalogue. Before
enabling a category, extract and verify all applicable clauses, tables,
notes, annexures, forms, and relevant official updates.

------------------------------------------------------------------------

## 8. Data architecture

### 8.1 Persistence decisions

**Proposed structured store:** Neon PostgreSQL, using Prisma. The
project already has a Neon project created. Retention of Neon as the
final provider is not to be changed without the project owner's
decision.

**Proposed file store:** Neon Object Storage, with a private `uploads`
bucket as recorded in the project notes. Before implementation, verify
current storage API, access-control model, signed URL behaviour, limits,
and team permissions against current provider documentation. Do not
assume a particular access-control feature exists without verifying it.

**No local PostgreSQL server is required** if the team continues to use
the hosted Neon database. Local tooling may still be used for
application development, migrations, and tests. Do not create a second
independent database as a hidden source of truth.

### 8.2 Data ownership boundaries

-   PostgreSQL: users/identity links as appropriate, institutions,
    applications, workflow configuration/instances, observations,
    responses, EVCs, committee proceedings, recommendations, decisions,
    appeals, obligations, document metadata, notifications, escalations,
    rule versions, audit events, outbox records, and integration sync
    metadata.
-   Object storage: document bytes and generated files where permitted.
-   Redis/BullMQ: transient queue/job state and scheduling metadata; it
    is not the source of truth for application/workflow status.
-   SMTP provider: message transport/delivery status as exposed by the
    provider; it is not the source of truth for case status.
-   Real-time provider: delivery of permitted event notifications; not
    the source of truth.
-   External AICTE system: authoritative external values only for data
    actually obtained through an authorised integration; provenance must
    be stored.

### 8.3 Suggested domain entities

The final schema must be refined against the supported feature scope and
reviewed before migration. These are domain concepts, not a mandate to
create every table in the first commit.

  --------------------------------------------------------------------------------------
  Entity/concept                   Responsibility                Important constraints
  -------------------------------- ----------------------------- -----------------------
  `User` / auth identity mapping   Link application identity to  Do not duplicate
                                   authentication identity       password/session
                                                                 handling unnecessarily
                                                                 if delegated to a
                                                                 selected auth solution

  `Role`, `Permission`, `UserRole` RBAC model                    Role assignments and
                                                                 permission changes
                                                                 audited

  `Institution`                    Institution identity and data Institution users
                                   boundary                      scoped to permitted
                                                                 institution(s)

  `InstitutionMembership`          User's permitted institution  Enforce on server
                                   relationship                  

  `Application`                    Internal application record   Unique internal ID;
                                                                 external ID optional
                                                                 and provenance-tracked

  `ApplicationCategory` /          Supported purpose/category    Only reviewed
  supported category config        metadata                      categories are enabled

  `RuleSource`                     Source document and exact     Must identify edition
                                   citation metadata             and official reference

  `RuleVersion`                    Versioned rule                Effective-dated;
                                   logic/configuration           reviewed/approved
                                                                 before activation

  `WorkflowDefinition`             Versioned workflow route      Linked to supported
                                                                 category and source

  `WorkflowStageDefinition`        Stage metadata                Stable stage identity
                                                                 within a definition
                                                                 version

  `WorkflowTransitionDefinition`   Permitted transitions and     Role/prerequisite
                                   guards                        checks

  `WorkflowInstance`               Workflow assigned to a case   Stores selected
                                                                 definition/version

  `WorkflowStageHistory`           Append-only transition        Actor, time,
                                   history                       previous/next stage,
                                                                 reason

  `ApplicationAssignment`          Case/reviewer/committee       Scope and assignment
                                   assignment                    history

  `ScrutinyObservation`            Reviewer observation          Linked case, stage,
                                                                 author, timestamp

  `Deficiency`                     Identified deficiency and     Source/stage and
                                   response window               configured due date

  `ObservationResponse` /          Institution response/evidence Preserve versions and
  `ComplianceResponse`                                           submitter

  `EVCEvent`                       EVC                           Only when route
                                   schedule/mode/status/report   requires/allows EVC
                                   reference                     

  `EVCMemberAssignment`            Member/role assignment where  Store only necessary
                                   needed                        information

  `CommitteeProceeding`            Committee meeting/proceeding  Distinct committee type
                                   record                        and route

  `Recommendation`                 Recommendation separate from  Cannot directly set
                                   decision                      official outcome

  `DecisionRecord`                 Official decision record      Authorised decision
                                                                 authority required

  `AppealCase`                     Appeal record where allowed   Linked to decision and
                                                                 applicable rule

  `OfficialCommunication`          Formal notice/order/LoA/LoR   Separate from
                                   reference                     reminder/notification

  `ComplianceObligation`           Obligation                    Source, applicability,
                                   definition/instance           owner, due date rule

  `ComplianceEvidence`             Evidence submission and       Upload and verification
                                   verification                  are distinct

  `DocumentMetadata`               File identity, version,       Private access and
                                   dates, classification,        history
                                   storage key                   

  `DocumentVerification`           Verification outcomes         Actor, time,
                                                                 method/status

  `Notification`                   Notification intent and       Channel/provider status
                                   lifecycle                     separate from official
                                                                 communication

  `NotificationAttempt`            Delivery attempts/results     Retry/idempotency data

  `EscalationRecord`               Escalation event and target   Deduplication key

  `AuditEvent`                     Material business/admin event Ordinary users cannot
                                                                 mutate history

  `OutboxEvent`                    Durable asynchronous event    Written in same
                                                                 transaction as business
                                                                 change

  `IntegrationSyncRun`             Import/export/sync provenance Provider, run status,
                                                                 counts, errors

  `ExternalRecordLink`             External identifiers/links    Source and conflict
                                                                 handling

  `OperationalIncident` (optional) Durable operational incident  Avoid duplicating
                                   summary                       provider logs
                                                                 unnecessarily
  --------------------------------------------------------------------------------------

### 8.4 Relational integrity and indexing

-   Use foreign keys for relationships between applications,
    institutions, workflow instances, observations, documents,
    decisions, and obligations.
-   Enforce uniqueness for internal application IDs, rule version
    identifiers, and idempotency keys where applicable.
-   Use database constraints for invariants that must hold even if an
    API code path is defective.
-   Add indexes based on actual query paths: application
    status/category/cycle, institution ID, assigned reviewer, stage, due
    date, document expiry, notification status, audit entity/time, and
    outbox dispatch status.
-   Use server-side pagination for large tables.
-   Avoid overusing JSON columns for core relational state. JSON may be
    useful for versioned rule payloads or provider metadata if schema
    and validation are defined, but core identity/status/foreign-key
    relationships should remain queryable and constrained.
-   Use UTC timestamps for stored instants and retain the relevant
    timezone/semantics for deadline calculation. A local date-only
    deadline should not be silently converted into an arbitrary instant.
-   Keep original submitted values/history where required; do not
    overwrite a submitted record without a traceable correction/revision
    event.
-   Use database transactions for state changes that require consistent
    workflow history, audit events, and outbox records.

### 8.5 File metadata and object storage

The database should store metadata and object references, not assume the
database contains the actual file bytes. Metadata should include as
applicable: - document ID; - linked
institution/application/obligation/deficiency; - document
category/type; - storage provider and object key; - original filename as
untrusted display metadata; - content type/size/checksum where
available; - version number and prior-version reference; - upload
actor/time; - extracted/declared issue and expiry dates, with
provenance; - signature/attestation status; - verification status and
verification history; - access classification; - retention/archive
status if policy is defined.

Security constraints: - Private by default. - Authorise every download
using the linked resource's access policy. - Do not expose permanent
public URLs for confidential records. - If temporary signed URLs are
supported and selected, issue them only after server-side authorisation,
with short appropriate lifetime and no leakage in logs. Verify provider
semantics before implementation. - Use file validation and safe download
headers. - Treat filenames and document contents as untrusted. - Keep
replaced file versions/history according to the approved retention
policy. - Do not claim cryptographic digital-signature verification
unless an actual suitable validation mechanism is implemented and
tested.

------------------------------------------------------------------------

## 9. Authentication and authorisation architecture

### 9.1 Authentication

Authentication provider is **unresolved**. Better Auth is explicitly
excluded. Antigravity must not start implementing a different provider
without confirmation.

The chosen solution must provide a documented way to: - sign in and sign
out; - establish and validate user identity; - create, expire, revoke,
and refresh sessions/tokens as appropriate; - protect credentials and
session secrets; - handle account/session invalidation; - integrate with
the backend without exposing secrets in the frontend; - test
unauthenticated and expired-session paths.

Provider/library selection should consider current maintenance, security
documentation, Express/TypeScript compatibility, session storage,
deployment requirements, and team familiarity. No specific alternative
is selected in this architecture.

### 9.2 Authorisation model

Use custom RBAC and resource/relationship checks on the server. RBAC
alone is insufficient because a user with the `institution_user` role
must still be restricted to their institution's records, and a reviewer
must be restricted to assigned cases.

Authorisation should evaluate: 1. authenticated identity; 2. active
user/account status; 3. role and permission for the requested action; 4.
institution boundary; 5. case assignment or committee membership where
required; 6. workflow state and transition permission; 7. relevant
rule/authority requirements; 8. document-level access scope.

A deny-by-default approach is required. If the backend cannot determine
whether an action is authorised, deny it and log the relevant security
event without leaking sensitive data.

### 9.3 Minimum roles

The following are proposed product roles, not claims about official
AICTE job-title names: - `institution_user` - `scrutiny_reviewer` -
`evc_committee_user` - `committee_proceedings_user` if separate from EVC
role - `decision_authority` - `rule_approver` - `system_administrator` -
`monitoring_report_user`

Roles may be split or combined only after reviewing the workflow and
separation-of-duties requirements. Do not grant official decision
authority to a user merely because they are an administrator.

### 9.4 Sensitive actions

Require specific permissions and audit events for: - final submission or
authorised reopening; - reviewer assignment changes; -
observation/deficiency issuance; - EVC schedule changes; - committee
proceeding/recommendation creation; - official decision
creation/correction; - appeal registration/outcome recording; -
compliance verification; - rule approval/activation/retirement; -
user/role/permission changes; - document download/export where
appropriate; - integration sync and conflict resolution.

### 9.5 Sessions, CSRF, CORS, and rate limiting

Exact implementation depends on the selected authentication solution: -
If cookie-based sessions are used, configure secure cookie attributes,
session expiry/revocation, appropriate CSRF protections, and narrow CORS
credentials policy. - If bearer tokens are used, document token storage,
expiry, refresh, revocation, and XSS implications before
implementation. - Apply rate limiting to sign-in, password reset,
high-cost endpoints, and sensitive write operations as appropriate. -
Allow only configured frontend origins in CORS; do not use unrestricted
production origins. - Do not store long-lived secrets in browser local
storage. - Ensure logout/session revocation is enforced by the backend.

------------------------------------------------------------------------

## 10. Background jobs, event durability, and notifications

### 10.1 Proposed job stack

BullMQ + Redis is the recorded proposal for background jobs. Redis
hosting/provider is not selected. The queue may be deferred for an early
static demo, but reliable scheduled reminders, retries, and escalations
must not rely on fragile in-memory timers.

### 10.2 Transactional outbox pattern

A business state update can commit to PostgreSQL while a separate
queue-enqueue call fails. To avoid losing required asynchronous work: 1.
The domain service starts a database transaction. 2. It updates the
business state. 3. It appends workflow history and audit event. 4. It
inserts an `OutboxEvent` record describing the asynchronous work. 5. The
transaction commits. 6. A dispatcher reads pending outbox rows and
enqueues them into BullMQ. 7. The dispatcher marks a row dispatched only
after the queue accepts it, following a recoverable protocol. 8. A
worker processes the job idempotently and records result/failure. 9. A
reconciler can identify stuck outbox rows and retry dispatch.

This ensures that business state and the intention to schedule follow-up
work are committed together. It does not guarantee that a third-party
email provider will deliver a message; delivery status must be tracked
separately.

``` mermaid
flowchart TD
    Change[Business action]
    Tx[DB transaction]
    State[Update case / workflow history]
    Audit[Append audit event]
    Outbox[Insert OutboxEvent]
    Commit[Commit transaction]
    Dispatch[Outbox dispatcher]
    Queue[(Redis / BullMQ)]
    Worker[Worker]
    Recheck[Re-check current case and rule]
    Send[Send notification / perform job]
    Result[Record attempt, result, and failure]
    Retry[Retry with backoff / failed-job handling]

    Change --> Tx
    Tx --> State
    Tx --> Audit
    Tx --> Outbox
    State --> Commit
    Audit --> Commit
    Outbox --> Commit
    Commit --> Dispatch
    Dispatch --> Queue
    Queue --> Worker
    Worker --> Recheck
    Recheck --> Send
    Send --> Result
    Result -->|Transient failure| Retry
    Retry --> Queue
```

### 10.3 Job types

When implemented, jobs may include: - deadline reminder generation; -
overdue detection; - escalation; - document-expiry reminder; - EVC
upcoming-event reminder; - notification delivery; - authorised
integration synchronisation; - operational reconciliation.

The exact reminder thresholds and escalation targets are configuration,
not hard-coded regulatory claims.

### 10.4 Job safety rules

-   Each job has a stable identifier/idempotency key.
-   A job re-reads the current case, deadline, status, assignment, and
    rule version before action.
-   Completed/cancelled/rescheduled cases are not sent obsolete
    reminders.
-   Retry policy distinguishes transient from permanent failures.
-   Failed jobs remain visible and can be inspected/retried by
    authorised maintainers.
-   A retry must not create duplicate notifications/escalations.
-   Do not include full private documents or unnecessary personal data
    in queue payloads; use IDs and retrieve the required data securely.
-   Worker logs must be redacted.
-   Queue state is not the source of truth for the application workflow.

### 10.5 Notification and official communication separation

Keep at least three concepts distinct: 1. **Official
communication/order:** formal record, issuing authority,
document/reference, recipient, version, issue date, and relationship to
an authorised decision or process. 2. **Notification:** delivery attempt
to inform a user that an event/action/deadline exists. 3.
**Escalation:** policy-driven follow-up to a designated role/recipient
due to an event or overdue condition.

An email that says a decision exists does not itself become the formal
decision/order. A generated draft is not an official communication until
the authorised process records its issuance.

### 10.6 Email delivery

Nodemailer + SMTP is proposed; the SMTP provider remains unresolved. The
adapter must: - validate recipient and template inputs; - use approved
templates and appropriate language; - avoid sending private case details
beyond what the recipient is authorised to receive; - record send
attempts and provider responses; - distinguish queued, attempted,
provider-accepted, and failed statuses; - retry only according to the
configured policy; - keep credentials in secret configuration; - avoid
claiming final delivery if SMTP only confirms acceptance by the next
mail server.

------------------------------------------------------------------------

## 11. Real-time update architecture

### 11.1 Provider decision

Real-time UI updates are part of the project capability plan. **Neon
Realtime is excluded.** No alternative provider/transport has been
selected. Antigravity must not assume WebSockets, Server-Sent Events
(SSE), a managed real-time service, or a particular vendor without
approval.

### 11.2 Required provider-neutral interface

Define an interface conceptually equivalent to: - publish an event after
a committed state change; - authenticate/authorise a subscriber; - scope
events by user, institution, role, or assigned case; - support
reconnect/recovery semantics; - provide event IDs or another way to
detect/reconcile missed updates; - expose operational errors and
delivery health.

Exact method names are implementation details. The adapter must not
become coupled to regulatory domain rules.

### 11.3 Event design

Events should carry only the minimum necessary metadata, for example: -
event ID; - event type; - entity type and internal ID; -
version/sequence or timestamp; - scope/recipient audience reference; -
correlation ID.

Do not broadcast private document contents, full institutional records,
session tokens, or confidential information to all connected clients.
Clients fetch the permitted updated record from the API.

### 11.4 Real-time flow

``` mermaid
sequenceDiagram
    participant API as Express API
    participant DB as PostgreSQL
    participant Outbox as Outbox / Event Dispatcher
    participant RT as Selected Real-Time Adapter
    participant UI as Authenticated Browser
    participant API2 as REST API

    API->>DB: Commit business state + audit + outbox
    DB-->>API: Commit success
    Outbox->>RT: Publish permitted event after commit
    RT-->>UI: Event metadata only
    UI->>API2: Fetch authoritative updated record
    API2-->>UI: Permission-scoped current state
    Note over UI,API2: Reconnect or missed event requires reconciliation
```

### 11.5 Fallback and consistency

-   PostgreSQL/API state remains authoritative.
-   If the real-time service is unavailable, core workflows must
    continue unless a specific operation truly requires live delivery.
-   Reconnection triggers a refresh/reconciliation.
-   Events may be duplicated or delivered out of order; clients must not
    apply them blindly as a complete source of truth.
-   Real-time subscriptions must enforce the same tenant/assignment
    scope as REST APIs.
-   Tests must cover missed, duplicated, delayed, and unauthorised
    events.

------------------------------------------------------------------------

## 12. Error handling

### 12.1 Error categories

Use a consistent error model with stable machine-readable codes and safe
human-readable messages. At minimum distinguish: - input validation
failure; - unauthenticated/expired session; - forbidden action; -
resource not found or intentionally concealed; - workflow state
conflict/stale transition; - duplicate/idempotency conflict; -
regulatory rule missing/ambiguous/inactive; - business prerequisite not
met; - external provider unavailable; - storage/file integrity error; -
background job failure; - unexpected internal error.

### 12.2 Error response policy

-   Return a stable error code and correlation/request ID.
-   Return field-level validation details when safe.
-   Do not reveal whether a protected record exists if that would leak
    sensitive information.
-   Do not return stack traces, raw SQL errors, connection strings,
    provider credentials, signed URLs, or secret configuration.
-   Use conflict responses for stale/invalid state transitions rather
    than silently overwriting.
-   Log diagnostic details securely on the server, with redaction.
-   Provide a user-facing recovery path when possible: retry, refresh,
    contact authorised administrator, or correct the input.

### 12.3 External provider failures

A failed email, object-storage request, real-time publish, queue
enqueue, or external sync must not silently roll back or corrupt already
committed business state unless the operation is designed as a single
transaction within the same system. Use durable records and
reconciliation for asynchronous effects.

------------------------------------------------------------------------

## 13. Logging, audit, and observability

### 13.1 Three distinct record types

**Business audit trail:** who changed which business entity/state, when,
and why/outcome. It is part of the application data model and supports
accountability.

**Operational logs:** request processing, errors, retries, provider
failures, latency, and diagnostics. They must be structured and
redacted.

**Notification/integration history:** durable domain records of delivery
attempts, import/export runs, external IDs, and reconciliation outcomes.

Do not treat ordinary application logs as a substitute for the business
audit trail.

### 13.2 Audit fields

Where applicable, record: - event ID; - actor user ID or system/job
identity; - action; - entity type and internal ID; - timestamp; - prior
and resulting state/reference; - safe change summary; - reason/comment
if required; - rule/workflow version; - request/correlation ID; -
outcome; - integration/provider reference where relevant.

Do not log passwords, session tokens, secret keys, or unnecessary file
contents. Do not allow ordinary API users to edit/delete audit history.
Any correction to a business record creates a new traceable event.

### 13.3 Operational monitoring

Expose to authorised maintainers: - failed/retried jobs; - stuck outbox
events; - SMTP errors; - object-storage errors; - real-time
publishing/subscription errors; - integration sync failures/conflicts; -
database connectivity/latency health; - invalid or inactive rule
references; - repeated authorisation failures at an
aggregate/appropriate level.

Health endpoints must not expose detailed configuration, credentials,
private records, or stack traces.

------------------------------------------------------------------------

## 14. External services and infrastructure

### 14.1 Neon PostgreSQL

**Role:** structured relational data store, if retained.\
**Why appropriate:** managed PostgreSQL reduces local server
administration and supports relational constraints/transactions for
workflow and audit records. The project already has a Neon database.\
**Boundary:** browser never connects directly; backend/worker use
server-side credentials.\
**Required verification:** connection settings, pooling/limits,
migration workflow, backup/restore, production connection security,
quotas/pricing, and team permissions.\
**Limitation:** managed hosting does not remove the need for schema
design, migrations, access control, backups, and operational checks.

### 14.2 Prisma

**Role:** ORM/schema models, typed queries, and migrations.\
**Why appropriate:** relational workflow records benefit from typed
relationships and controlled schema evolution.\
**Boundary:** domain services should own business decisions; Prisma
calls should not become scattered workflow logic.\
**Trade-off:** ORM convenience must not replace explicit database
constraints, transaction design, or query performance review.

### 14.3 Neon Object Storage

**Role:** document bytes and evidence files, if retained.\
**Why proposed:** it is already enabled in the project, reducing the
need to introduce another provider.\
**Required verification:** current API/client, private bucket behaviour,
access-control and signed URL semantics, upload/download limits, file
size limits, quotas, pricing, retention, and access sharing with
teammates.\
**Security requirement:** no public document access by default; backend
authorises file access.\
**Unresolved:** do not assume storage semantics or provider capabilities
until verified. If it cannot meet private access/security needs, ask the
owner to choose an alternative.

### 14.4 Redis + BullMQ

**Role:** durable background job queue, delayed jobs, retry handling.\
**Why proposed:** reminders and escalations must run independently of
browser requests and need retry/failure visibility.\
**Boundary:** job payloads contain IDs/minimum metadata; the worker
reloads current business state.\
**Unresolved:** Redis host/provider, persistence settings, deployment,
cost, and whether enabled in the earliest release.\
**Limitation:** queue reliability alone does not guarantee email
delivery; use the transactional outbox and notification history.

### 14.5 Nodemailer + SMTP

**Role:** email transport adapter.\
**Why proposed:** integrates a Node backend with a selected SMTP
provider.\
**Unresolved:** SMTP provider, sender identity, domain verification,
limits, bounce handling, and secrets.\
**Boundary:** templates and policy live in the application; SMTP handles
transport.\
**Limitation:** SMTP acceptance is not proof the recipient read or
received a message in their inbox.

### 14.6 Real-time provider

**Role:** publish authorised state-change events to active clients.\
**Status:** required capability; provider/transport unresolved; Neon
Realtime excluded.\
**Selection criteria:** authentication, tenant scoping, reconnect
support, message limits, operational visibility, pricing, and
compatibility with the selected hosting setup.\
**Boundary:** publish event metadata after commit; clients fetch current
state from REST API.

### 14.7 Authorised AICTE systems

**Role:** optional external source/sink for case/application data when
access is approved.\
**Status:** no live integration is assumed.\
**Required design:** adapter, authentication/credential management,
external identifiers, import provenance, idempotency, conflict handling,
sync run history, and failure reconciliation.\
**If unavailable:** use a clearly labelled mock adapter or manual
import/export approved for the prototype. Do not scrape private systems
or represent mock data as official live data.

### 14.8 Payment and DSC validation

These are not assumed integrations. - If payment status is represented
without a real payment gateway, label it simulated/manual. - If digital
signature status is recorded without a cryptographic validation
mechanism, label it as recorded/manual verification rather than verified
DSC validation. - Do not make a statutory claim based on a mock status.

### 14.9 Hosting/deployment

Hosting provider is unresolved. A deployment will normally need: -
frontend static hosting; - backend API hosting; - worker process hosting
if background jobs are enabled; - access to PostgreSQL, storage, Redis,
SMTP, and real-time provider as applicable; - secure
environment-variable/secret configuration; - HTTPS; - logs and health
checks.

Do not choose or configure a deployment provider without owner
confirmation. Managed hosting is a reasonable default category for a
hackathon, but no vendor is selected here. NGINX and Kubernetes are not
required for managed hosting.

------------------------------------------------------------------------

## 15. Data flows

### 15.1 Application draft and submission

1.  Institution user signs in through the selected authentication
    system.
2.  Browser requests permitted institution/application data through
    REST.
3.  API authenticates identity and checks institution scope.
4.  User creates/edits a draft.
5.  API validates fields against the configured category checklist.
6.  User requests final submission.
7.  Backend loads the active category/rule/workflow version and verifies
    required fields, documents, signature/attestation status,
    cut-off/payment prerequisite where applicable, and permitted editing
    state.
8.  If requirements fail, return a structured validation result and do
    not submit.
9.  If valid, transactionally update submission state, record
    history/audit, and insert any needed outbox event.
10. Return current state. The UI shows internal application reference
    and any external identifier only if genuinely available.

### 15.2 Scrutiny and deficiency response

1.  A reviewer accesses assigned cases only.
2.  Backend verifies reviewer permission, assignment, current workflow
    state, and active rule version.
3.  Reviewer records observations and, where applicable, deficiencies.
4.  Backend stores each observation/deficiency with
    author/time/source/stage and appropriate deadline rule.
5.  Formal deficiency communication is recorded separately from delivery
    notification.
6.  Institution user sees the permitted notice and submits
    evidence/response within the permitted stage/window.
7.  Backend stores response versions and evidence references; upload is
    not verification.
8.  Reviewer records outcome/re-scrutiny for the scope allowed by the
    route.
9.  Workflow transition, audit, and outbox events are committed
    consistently.

### 15.3 EVC scheduling and completion

1.  The active workflow definition establishes whether EVC is
    required/allowed.
2.  An authorised user creates or updates the EVC event.
3.  Backend validates schedule, mode, assignment, and prerequisites.
4.  The system stores event and history.
5.  Reminder jobs are scheduled through the durable outbox/worker path
    if enabled.
6.  On a schedule change, old jobs are invalidated or made harmless by
    current-state rechecks.
7.  EVC report/evidence is linked to the event.
8.  Only authorised users can record the next stage/outcome.

### 15.4 Decision and formal communication

1.  Committee/reviewer records report/recommendation.
2.  Backend stores recommendation separately from official decision.
3.  The decision authority sees the relevant case/material within
    permission scope.
4.  Authorised decision user records an official decision according to
    the applicable route.
5.  The system records authority, outcome, timestamp, source/rule
    version, and any required ratification state.
6.  Formal communication/order is separately recorded and linked to the
    decision.
7.  A notification may inform recipients of a change, but does not
    replace the formal communication.
8.  Appeal tracking is enabled only if the applicable route provides it
    and uses the relevant deadline rule.

### 15.5 Compliance/document expiry

1.  A configured obligation is associated with an institution/case and
    source rule.
2.  Evidence or document metadata is submitted.
3.  Backend stores the file in private storage and metadata/version in
    PostgreSQL.
4.  Verification is a separate authorised action.
5.  Deadline/expiry jobs identify approaching or expired items based on
    configured thresholds and verified dates.
6.  Reminder/escalation jobs re-check current document/obligation state
    before acting.
7.  Dashboard metrics query the authoritative records and expose only
    permitted information.

### 15.6 Dashboard/report query

1.  User requests a dashboard/report.
2.  Backend authenticates and scopes the query to roles, institution,
    assignments, and region permissions.
3.  Query uses documented metric definitions and server-side
    filters/pagination.
4.  Missing category/region data remains unclassified/unknown.
5.  Counts are derived from authoritative data; any cache/read model
    must have a documented freshness policy.
6.  Export routes enforce the same permissions as UI lists and detail
    views.

### 15.7 External synchronisation

1.  An authorised sync job or user starts an import/export.
2.  Adapter authenticates to the external service using server-side
    secrets.
3.  Payloads are validated and normalised.
4.  External IDs and sync provenance are recorded.
5.  Idempotency prevents duplicate imports.
6.  Conflicts are recorded for authorised reconciliation; data is not
    silently overwritten.
7.  The system records counts, errors, timestamps, and status.
8.  If no authorised interface exists, use a clearly labelled
    mock/manual process.

------------------------------------------------------------------------

## 16. Repository and folder structure

The repository must contain separate `frontend/`, `backend/`, and
`docs/` directories. The user manually maintains Markdown documents in
`docs/`. Antigravity may create supporting code/configuration files but
must not delete or silently overwrite user-maintained documentation.

The following is a **proposed** structure, not a claim that these files
already exist. Keep the initial structure small and add modules when
their requirements are implemented.

``` text
project-root/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router/
│   │   │   ├── providers/
│   │   │   └── layouts/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── forms/
│   │   │   ├── tables/
│   │   │   └── status/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── institutions/
│   │   │   ├── applications/
│   │   │   ├── workflow/
│   │   │   ├── scrutiny/
│   │   │   ├── evc/
│   │   │   ├── committees/
│   │   │   ├── decisions/
│   │   │   ├── compliance/
│   │   │   ├── documents/
│   │   │   ├── notifications/
│   │   │   ├── dashboards/
│   │   │   └── reports/
│   │   ├── lib/
│   │   │   ├── api-client/
│   │   │   ├── validation/
│   │   │   └── formatting/
│   │   ├── hooks/
│   │   ├── styles/
│   │   ├── types/
│   │   └── main.tsx
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   │   ├── authentication/
│   │   │   ├── authorization/
│   │   │   ├── validation/
│   │   │   ├── rate-limit/
│   │   │   └── error-handler/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── access-control/
│   │   │   ├── institutions/
│   │   │   ├── applications/
│   │   │   ├── rules/
│   │   │   ├── workflow/
│   │   │   ├── scrutiny/
│   │   │   ├── evc/
│   │   │   ├── committee-proceedings/
│   │   │   ├── decisions/
│   │   │   ├── appeals/
│   │   │   ├── compliance/
│   │   │   ├── documents/
│   │   │   ├── deadlines/
│   │   │   ├── notifications/
│   │   │   ├── escalations/
│   │   │   ├── audit/
│   │   │   ├── reporting/
│   │   │   ├── integrations/
│   │   │   └── operations/
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   ├── object-storage/
│   │   │   ├── queue/
│   │   │   ├── email/
│   │   │   ├── realtime/
│   │   │   └── external-systems/
│   │   ├── jobs/
│   │   ├── shared/
│   │   │   ├── errors/
│   │   │   ├── ids/
│   │   │   ├── time/
│   │   │   └── logging/
│   │   └── openapi/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── project-requirements.md
│   ├── project-architecture.md
│   ├── api-contract.md
│   ├── data-model.md
│   ├── regulatory-rule-catalogue.md
│   ├── role-permission-matrix.md
│   ├── test-traceability.md
│   ├── deployment-runbook.md
│   └── decisions/
│       └── ADR-xxxx-title.md
├── .github/
│   └── workflows/
├── .gitignore
├── .editorconfig
├── README.md
└── package.json                 # optional root scripts/workspaces
```

### 16.1 Repository rules

-   Keep frontend-only code under `frontend/`.
-   Keep API/domain/worker/provider integration code under `backend/`.
-   Keep user-maintained Markdown documentation under `docs/`; preserve
    it.
-   Keep secrets in ignored environment files or deployment secret
    stores.
-   Commit an `.env.example` with placeholders, never real secrets.
-   Do not commit uploaded real institution documents or production
    data.
-   Keep migrations under version control.
-   Use reviewed seed data only; mark demo records as synthetic.
-   A root workspace `package.json` is optional. Do not introduce
    monorepo tooling unless it simplifies the actual scripts.
-   Avoid circular imports between domain modules.
-   Do not make the frontend import backend implementation modules;
    share only deliberately designed API/domain types if a shared
    package is introduced.

------------------------------------------------------------------------

## 17. Environment configuration and secrets

Exact environment variable names are implementation choices, but the
configuration must cover the following groups where those components are
enabled:

  -----------------------------------------------------------------------
  Configuration group     Examples of required    Notes
                          values                  
  ----------------------- ----------------------- -----------------------
  Application             environment, public app Never trust
                          URL, API base URL       browser-supplied URLs
                                                  for server security
                                                  decisions

  Database                PostgreSQL connection   Server-side only; never
                          URL, pool settings if   bundle into frontend
                          required                

  Authentication          provider settings,      Provider not selected;
                          session secrets/keys,   define only after
                          callback URLs as        decision
                          required                

  Object storage          endpoint/client         Verify current Neon
                          configuration, bucket,  Object Storage
                          credentials if required interface before naming
                                                  exact variables

  Redis/queue             connection URL,         Only if queue is
                          TLS/auth settings as    enabled
                          required                

  SMTP                    host, port, user,       Only after provider is
                          password/credential,    selected
                          sender                  

  Real-time               endpoint/key/server     Neon Realtime excluded;
                          secret as required      provider unresolved

  External integration    API endpoint,           Only for authorised
                          credentials, scopes     interface; secrets
                                                  server-side

  Logging                 log level,              Must not reveal secrets
                          redaction/correlation   
                          settings                

  Rule configuration      approved seed/version   Regulatory rules should
                          identifiers             be managed as versioned
                                                  data, not secrets
  -----------------------------------------------------------------------

Startup should fail clearly if a required enabled component is
misconfigured. A disabled optional integration must not prevent local
development unless core functionality depends on it. Do not place real
secrets in source files, README, screenshots, test fixtures, or frontend
build variables.

------------------------------------------------------------------------

## 18. Testing architecture

### 18.1 Test layers

-   **Unit tests (Vitest):** rule selection, deadline calculations,
    transition guards, permission policy functions, idempotency key
    creation, notification eligibility, and domain status calculations.
-   **API integration tests (Vitest + Supertest):**
    authentication/authorisation integration, validation, resource
    scoping, transactions, conflict responses, and error mapping.
-   **Database tests:** migration correctness, constraints, foreign
    keys, transaction behaviour, uniqueness, and outbox consistency
    against a suitable test database.
-   **Provider adapter tests:** storage access, email, real-time, queue,
    and external integration contracts using controlled mocks/test
    accounts.
-   **End-to-end tests (Playwright):** institution submission, reviewer
    scrutiny/deficiency, institution response, EVC scheduling,
    compliance verification, dashboard/report permissions, and
    access-denial paths.
-   **Security/negative tests:** unauthenticated requests, wrong roles,
    wrong institution, unassigned case, direct private file access,
    stale transition, duplicate job, malicious upload metadata, and
    secrets/logging checks.
-   **Regulatory route tests:** one or more positive and negative route
    cases for every category enabled in the prototype, each tied to the
    exact reviewed rule version.

### 18.2 Required high-value scenarios

1.  A supported category selects its expected workflow version.
2.  An unsupported or ambiguous category is held for review rather than
    routed arbitrarily.
3.  A required document missing from a category-specific checklist
    blocks/flags submission according to configuration.
4.  A final-submitted application cannot be edited except through a
    permitted, audited reopening path.
5.  A reviewer cannot change an unassigned case.
6.  A scrutiny report or committee recommendation cannot create a final
    decision automatically.
7.  Only an authorised decision role can record the official decision.
8.  Appeal deadline uses the correct route-specific rule and does not
    globally apply a seven-day window.
9.  A reminder queued before completion does not send after the case
    becomes complete.
10. A duplicate outbox dispatch/job does not produce duplicate business
    actions.
11. A failed email/provider call is visible and retryable according to
    policy.
12. A private file cannot be accessed by another institution's user.
13. A missed real-time event is recovered by fetching authoritative
    state.
14. A rule version change does not silently rewrite a historical
    decision/deadline.
15. Dashboard counts match the underlying permission-scoped records.
16. Integration re-import does not duplicate records and conflicts are
    surfaced.
17. Audit history records critical actions and cannot be silently edited
    through normal APIs.

### 18.3 Definition of done

A feature is not done merely because a page or endpoint exists. It is
done when: - its requirement IDs are linked to implementation and
tests; - applicable regulatory rules are source-verified; - role and
resource access checks are enforced server-side; - positive and negative
tests pass; - failures and edge cases are handled; - audit and
operational records exist where required; - documentation is updated; -
mock behaviour is labelled; - no unresolved provider choice is silently
embedded.

------------------------------------------------------------------------

## 19. Deployment and environments

### 19.1 Environments

Use separate configurations for: - local development; - shared test/demo
environment; - production, if later approved.

Do not reuse production secrets/data in development. Prefer synthetic
seed data. Use separate database branches/databases where the selected
provider and plan support them; verify the actual provider capability
before relying on it.

### 19.2 Deployment units

Depending on enabled features, deploy: 1. Frontend static assets. 2.
Express API. 3. Background worker (when Redis/BullMQ jobs are enabled).
4. PostgreSQL database. 5. Private object storage. 6. Redis/BullMQ
service if jobs are enabled. 7. SMTP service/account if email is
enabled. 8. Real-time service/transport if live updates are enabled. 9.
External integration adapter configuration only when authorised.

Do not require a separate worker deployment if no background jobs are
enabled; when enabled, the worker must run reliably and be monitored.

### 19.3 Deployment security

-   HTTPS in deployed environments.
-   Restricted CORS origins.
-   Secure environment secrets.
-   Database/storage/queue credentials only in server-side
    configuration.
-   Least-privilege service credentials where supported.
-   Health checks without sensitive output.
-   Migration process reviewed before applying to shared/production
    data.
-   Logs and error reporting configured with redaction.
-   Private file access verified after deployment, not only locally.

### 19.4 Backups and recovery

Before production use, define: - database backup frequency/retention; -
object-storage backup/versioning/recovery responsibility; - acceptable
recovery point/time objectives; - restore procedure; - owner for
recovery; - test evidence that restoration works.

Do not invent retention periods or recovery objectives; the project
owner and applicable policy must decide them. For a hackathon demo,
document the limitations clearly.

------------------------------------------------------------------------

## 20. Architecture trade-offs and limitations

### 20.1 Modular monolith versus microservices

**Choice:** modular monolith.\
**Benefit:** fewer deployments, simpler debugging, shared transactions,
easier teamwork.\
**Trade-off:** modules share a codebase/runtime and need discipline to
avoid tight coupling.\
**Revisit when:** scale, independent release cadence, or operational
isolation demonstrably requires extraction.

### 20.2 PostgreSQL versus a document database

**Choice:** relational PostgreSQL is the recorded project choice.\
**Rationale:** applications, institutions, workflow transitions,
assignments, decisions, deadlines, obligations, and audit records have
relationships and integrity constraints.\
**Trade-off:** schema/migrations need care as categories evolve. Use
JSON only where justified, not as a substitute for core relational
modelling.

### 20.3 Custom workflow engine versus BPM platform

**Choice:** a configurable internal workflow engine for the prototype.\
**Rationale:** the team needs explicit, testable routes and role/state
guards without operating a separate BPM platform.\
**Trade-off:** the team owns workflow configuration, versioning, tests,
and governance.\
**Revisit when:** many complex workflows require visual modelling, human
task orchestration, or enterprise process governance beyond the custom
engine.

### 20.4 Managed storage/database versus self-hosting

**Choice:** retain the existing Neon setup unless the owner decides
otherwise.\
**Benefit:** less infrastructure to maintain during a hackathon.\
**Trade-off:** provider limits, pricing, availability, access semantics,
and portability must be checked. Managed services still require backups,
permissions, and failure handling.

### 20.5 Polling versus real-time updates

**Choice:** real-time capability is intended, but the provider is
unresolved and Neon Realtime is excluded.\
**Trade-off:** real-time can improve responsiveness but adds connection
management, authorisation, reconnect handling, and provider
cost/limits.\
**Fallback:** REST refresh/polling may be used temporarily if clearly
documented, but it does not satisfy a requirement for true live updates
unless the project owner accepts that limitation.

### 20.6 Durable jobs versus in-memory scheduling

**Choice:** BullMQ + Redis is proposed for reliable jobs.\
**Benefit:** retries, delayed jobs, and worker separation.\
**Trade-off:** adds Redis deployment and operations.\
**Important:** even with a queue, use a transactional outbox or
equivalent durable scheduling mechanism to prevent committed business
changes from losing their follow-up work.

### 20.7 AI/OCR versus human verification

**Choice:** not required for the initial version.\
**Rationale:** OCR/AI can help with extraction or classification but
introduces accuracy, privacy, and explainability concerns.\
**Constraint:** machine-derived values must be labelled and reviewed;
they cannot autonomously make statutory decisions.

### 20.8 Prototype versus production

The architecture is designed for a hackathon prototype and does not by
itself establish production readiness, legal compliance, security
certification, high availability, official AICTE integration, or
verified compliance with every APH category. Production use requires
current regulatory review, approved data access, security testing,
backup/recovery, operational ownership, retention decisions, and
explicit performance/service-level targets.

------------------------------------------------------------------------

## 21. Implementation sequence

Implement in dependency order. Do not build a complete regulatory
workflow before verifying which categories are in scope.

### Phase 0 --- Decisions and regulatory catalogue

-   Confirm the first supported application category/categories.
-   Verify current applicable handbook/official sources.
-   Extract exact route, checklist, deadlines, and roles for each
    supported category.
-   Decide authentication provider, real-time transport, and whether to
    retain Neon PostgreSQL/Object Storage.
-   Record unresolved decisions; do not guess.

### Phase 1 --- Repository and foundation

-   Create `frontend/`, `backend/`, `docs/`.
-   Configure TypeScript, Vite, Express, environment validation,
    lint/test scripts as agreed.
-   Set up Git/GitHub collaboration and protected secret handling.
-   Establish API error conventions, logging, and health endpoint.
-   Add initial architecture and requirement traceability documentation.

### Phase 2 --- Data model and access control

-   Design Prisma schema and migrations for
    users/institutions/applications/roles.
-   Implement selected authentication adapter after confirmation.
-   Implement RBAC and institution/assignment checks.
-   Test wrong-role and cross-institution denial before building
    sensitive features.

### Phase 3 --- Rules and workflow engine

-   Implement versioned source/rule catalogue.
-   Implement supported workflow definitions and valid transitions.
-   Implement transactionally consistent workflow history, audit, and
    outbox.
-   Add tests for every supported route and prohibited transition.

### Phase 4 --- Application and scrutiny flow

-   Implement draft/submission, checklist validation, documents
    metadata, scrutiny, observations, deficiencies, and responses as
    applicable.
-   Implement report references and permitted re-scrutiny.
-   Keep simulated integrations clearly labelled.

### Phase 5 --- EVC, committee, decisions, appeals

-   Implement EVC only for routes that require it.
-   Implement committee proceedings/recommendations separately from
    official decisions.
-   Add official communication records and appeal rules only where
    applicable.
-   Test role separation and no-autonomous-decision guarantees.

### Phase 6 --- Compliance, documents, and deadlines

-   Implement obligation/evidence/verification lifecycle.
-   Integrate private object storage after provider semantics are
    verified.
-   Implement date/expiry tracking with source-linked rules.
-   Add deadline calculation and rule-version tests.

### Phase 7 --- Notifications, worker, and real-time

-   Select SMTP and Redis/worker hosting if enabling jobs.
-   Implement transactional outbox, queue dispatcher, retries,
    idempotency, and failed-job visibility.
-   Select and implement a real-time provider/transport other than Neon
    Realtime.
-   Implement reconnect/reconciliation and permission-scoped events.

### Phase 8 --- Dashboards, reporting, and operational visibility

-   Implement pendency, EVC, compliance, expiry, overdue, escalation,
    and region reports where data exists.
-   Validate metric definitions and reconcile counts against source
    records.
-   Add operational error visibility for jobs/providers/integrations.

### Phase 9 --- Verification and demo/release

-   Run unit, API, integration, security, and end-to-end tests.
-   Complete the requirement-to-test matrix.
-   Verify supported route rules against exact APH clauses and current
    official updates.
-   Document unsupported categories and simulated capabilities.
-   Confirm deployment secrets, private file access, and recovery
    limitations.

------------------------------------------------------------------------

## 22. Architecture decision records

For material decisions, create an ADR in `docs/decisions/`. Each ADR
should include: - decision ID/title/date/status; - context and
problem; - options considered; - decision and rationale; -
consequences/trade-offs; - security/regulatory implications; -
migration/reversal plan if applicable; - approver/owner.

ADRs are especially required for: 1. authentication provider/session
model; 2. real-time provider/transport; 3. retain/replace Neon
PostgreSQL; 4. retain/replace Neon Object Storage; 5. Redis/BullMQ and
worker hosting; 6. SMTP/email provider; 7. first supported APH
categories and workflow source mapping; 8. live AICTE integration versus
simulated/manual adapter; 9. data retention and backup/recovery policy;
10. any decision to add OCR/AI or a separate workflow engine.

------------------------------------------------------------------------

## 23. Antigravity implementation instructions

1.  Read `project-requirements.md` before implementing features.
2.  Treat this architecture as the structural design baseline; do not
    override explicit project constraints.
3.  Do not invent APH clauses, routes, deadlines, fees, document
    requirements, or authority roles.
4.  Do not assume every APH chapter/category is in the prototype scope.
5.  Do not implement Better Auth.
6.  Do not implement Neon Realtime.
7.  Do not select replacement auth/real-time providers without explicit
    confirmation.
8.  Do not replace the existing Neon database/storage choice without
    explicit confirmation.
9.  Do not claim live AICTE integration, payment integration, or DSC
    cryptographic validation unless it has been implemented and tested
    against the real authorised service.
10. Do not make statutory approval/rejection decisions automatically.
11. Keep recommendations, official decisions, formal communications,
    notifications, and escalations as separate concepts/records.
12. Use server-side permission enforcement on every protected route and
    resource.
13. Preserve the user's Markdown documentation under `docs/`; do not
    silently overwrite it.
14. Implement only a small, verified set of APH categories first;
    clearly label unsupported categories.
15. Before using any regulatory rule, record exact
    source/version/effective date and add tests.
16. If a requirement depends on an unresolved decision, mark it blocked
    and ask instead of silently guessing.
17. After each phase, update test traceability and document what is
    implemented, mocked, deferred, or blocked.
18. Keep the code modular, type-safe, testable, and deployable without
    adding unnecessary infrastructure.

------------------------------------------------------------------------

## 24. Final architecture summary

The intended architecture is a React/TypeScript/Vite browser application
backed by a Node.js/Express/TypeScript modular monolith, using Zod for
runtime validation and Prisma for relational persistence in the existing
Neon PostgreSQL project unless the owner decides otherwise. Document
bytes are intended for private object storage, currently proposed as
Neon Object Storage subject to verification. RBAC and resource-level
permission checks are enforced server-side. The workflow/rule engine
uses versioned, source-linked APH configurations; it preserves human
authority over official decisions. Audit, workflow history, and durable
outbox records are committed consistently. BullMQ + Redis is proposed
for reminders and escalations; Nodemailer + SMTP is proposed for email.
Real-time updates are required by the project plan but must use a
separately selected provider/transport other than Neon Realtime.
Authentication is unresolved and Better Auth is excluded. Provider
choices, live external integrations, and supported APH categories must
not be guessed.

This architecture is a precise implementation baseline, not a claim that
every provider has been configured or every APH category has been fully
modelled. Regulatory activation and production use require verification
of the exact applicable rules and current official directions.


---

## 22. Cross-document architecture reconciliation — 24 October 2026

This addendum supplements the architecture; it does not remove earlier content.

### 22.1 Current architecture baseline
- Frontend: React + TypeScript + Vite; Tailwind CSS and shadcn/ui; React Router. Treat the UI/UX specification as visual direction, not as authority to override requirements or permissions.
- Backend: Node.js + Express + TypeScript; validate untrusted input at the API boundary (Zod is the recorded proposal).
- Relational data: Neon PostgreSQL with Prisma. PostgreSQL is the durable source of truth for business state and audit/history.
- Object storage: Neon Object Storage is provisioned as the current candidate. Keep storage access server-mediated and verify provider-specific private-access behavior before production use.
- Background jobs: BullMQ + Redis is proposed/optional pending hosting and first-release scope decisions.
- Email: SMTP/provider unresolved; isolate behind an adapter.
- Real-time: capability required, but Neon Realtime is excluded and provider/transport unresolved. Do not implement a fake live path or assume a provider.
- Authentication: Better Auth excluded; alternative unresolved. Keep auth/session integration behind an adapter until approved.
- AI/OCR: deferred pending explicit project-owner authorization.

### 22.2 Authority and versioning
`DATABASE_SCHEMA_REVISION_2.md` is the latest database design revision and adds normative constraints to `DATABASE_SCHEMA.md`; both must be retained and read together. Do not treat either schema document as an executable migration. The API specification is a draft contract. Endpoint inventories and architecture diagrams do not prove that functionality exists.

### 22.3 Non-negotiable implementation boundaries
1. Regulatory policy is sourced from the problem statement and verified official AICTE instruments, not invented from UI screens or seed data.
2. Server-side authorization is required for every protected resource and transition; hiding a button is not authorization.
3. Persisted database state wins over browser state, queue state, and real-time messages.
4. File bytes remain private by default; all upload/download access must be authorized server-side.
5. External side effects must be durable, idempotent, retryable, observable, and reconciled.
6. Every proposed/unresolved provider choice must remain configurable and must not be silently installed or hard-coded.
7. AI/OCR must not be implemented unless a specific explicit prompt authorizes that phase.

### 22.4 Required design decisions before production
- [ ] Authentication/session approach and session invalidation policy.
- [ ] Real-time provider/transport, or an explicit polling-only scope decision.
- [ ] Neon Object Storage access method, private ACL behavior, signed URL policy, upload constraints, and malware/content scanning approach.
- [ ] Redis hosting and decision whether BullMQ is needed for the first release.
- [ ] SMTP provider, sender/domain configuration, bounce/failure handling.
- [ ] Hosting/deployment, environment separation, secrets management, backups, restore test, and observability.
- [ ] Final API contract approval and generated OpenAPI validation.
- [ ] Database revision 2 reviewed against migrations and concurrency/uniqueness constraints.



---

## Source audit supplement — PS/APH validation, 24 October 2026

Architecture acceptance must include the scenarios and unresolved integration gates in `PS_APH_TRACEABILITY_AUDIT.md`. The supplied PS requires real-time dashboards, notifications and escalation; it does not mandate a specific real-time vendor. Neon Realtime remains excluded by the existing project decision; the alternative transport or polling scope must be explicitly selected.


---

## Cross-document consistency audit reference

Use `CROSS_DOCUMENT_CONSISTENCY_AUDIT.md` as the cross-document decision register. Do not treat provider provisioning or planned component diagrams as proof of secure/configured runtime services.


---

## Final decision correction — selected technology direction (24 October 2026)

This correction supersedes prior “authentication not selected” and “real-time provider unresolved” status statements in this document. Authentication direction: **Auth.js-compatible solution or JWT with secure HTTP-only cookies**; Better Auth is excluded. Real-time transport: **Socket.IO**; Neon Realtime and all other Neon services are excluded. Neon is restricted to PostgreSQL and document/object storage. Update implementation plans and diagrams to use Socket.IO as the selected transport; polling may support recovery/refetch but is not the primary selected transport. Exact authentication library/session semantics, Socket.IO event/room contracts, provider security configuration, and runtime testing remain implementation tasks. See `FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md`. All earlier sections remain preserved as historical context.

# DATABASE_SCHEMA.md --- AICTE Approval Workflow Automation

**Status:** Canonical database design specification for Antigravity; not
yet an executable migration\
**Database:** Neon PostgreSQL\
**ORM/migrations:** Prisma\
**System style:** Modular monolith; relational core with private
object-storage references\
**Purpose:** Define the domain model, relations, integrity rules,
history, and unresolved decisions without inventing regulatory policy or
provider capabilities.

------------------------------------------------------------------------

## 0. Binding instructions for Antigravity

1.  Read `project-overview.md`, `project-requirements.md`, and
    `project-architecture.md` before implementing this document. They
    are the companion specifications. If any conflict is found, stop and
    report the exact conflict; do not silently choose one.
2.  This document describes the intended logical schema and constraints.
    It is **not** permission to invent missing business rules, activate
    unverified APH rules, or assume an unresolved provider decision.
3.  Use Neon PostgreSQL with Prisma. Do not replace Neon, add a local
    PostgreSQL server requirement, or change the ORM without explicit
    owner approval.
4.  **Better Auth is excluded. Neon Realtime is excluded.**
    Authentication/session implementation and the real-time transport
    provider remain unresolved. Keep identity/session integration behind
    an adapter and do not create provider-specific tables until the
    selected provider and its data ownership are decided. Do not store
    passwords or duplicate provider-managed sessions.
5.  The current document-storage proposal is Neon Object Storage with a
    private `uploads` bucket. Verify the actual API, ACL model, quotas,
    object-key semantics, and temporary URL support before implementing
    storage operations. PostgreSQL stores metadata and object
    references, not file bytes. Never assume public URLs.
6.  Redis + BullMQ, SMTP provider, deployment platform, real-time
    provider, and live AICTE integrations are not yet selected. Persist
    durable business state in PostgreSQL independently of those
    services. Use an outbox for asynchronous work; do not treat Redis as
    the source of truth.
7.  Preserve user-maintained Markdown under `docs/`; do not overwrite or
    delete it. Place this file at `docs/DATABASE_SCHEMA.md` only if that
    is the agreed repository location; if the file already exists, show
    a diff before replacing it.
8.  The APH 2024--2027 PDF is a supplied regulatory reference, **not
    proof that every rule remains current in October 2026**. Rule
    records must retain source, clause, edition, review/approval, and
    effective dates. A rule that has not been verified and approved must
    not be active.
9.  The software records workflow facts, recommendations, decisions made
    by authorised humans, formal communications, reminders, and
    escalations as distinct concepts. It must not autonomously make
    statutory approval/rejection decisions or impose penalties.
10. Do not encode one universal application workflow. A route depends on
    the application purpose/category, institution type, academic cycle,
    and the exact reviewed applicable provision.
11. This design is deliberately explicit about unresolved choices. "Not
    specified" is a blocker to resolve, not an invitation to guess. If
    an implementation decision is needed for a prototype, document it in
    an ADR and label it as a prototype-only choice.
12. Do not claim this model is a legally complete interpretation of the
    AICTE handbook. It is a traceable software data model for the
    requirements in the companion project documents.

### Status labels used in this document

-   **Required concept:** A concept expressly required by the project
    scope or architecture.
-   **Proposed table:** A recommended relational representation of that
    concept; exact column names/types can be refined during
    implementation without changing meaning.
-   **Conditional:** Create/use only if the corresponding capability is
    enabled.
-   **Unresolved:** Must be decided and documented before implementing
    the affected provider-specific or policy-specific behaviour.
-   **Policy-configured:** Values come from an approved, versioned
    configuration; never hard-code an unverified regulatory
    interpretation.

------------------------------------------------------------------------

## 1. Data principles and invariants

### 1.1 Relational source of truth

-   PostgreSQL is the authoritative source for users' application-level
    profile/membership data, institutions, applications, workflow
    instances and history, rule metadata/versions, scrutiny, EVC,
    committee proceedings, recommendations, authorised decisions,
    appeals, compliance obligations/evidence, document
    metadata/verification, formal communications, notification
    intent/delivery attempts, escalations, audit events, outbox events,
    and integration provenance.
-   Object storage holds document bytes. Database rows reference objects
    using provider and object key. Do not persist raw file bytes in
    ordinary relational columns.
-   Redis/BullMQ, an email provider, a real-time transport, or an
    external AICTE system is not the source of truth for core business
    state.
-   Dashboard counts and KPIs are derived from source records or
    maintained through a documented, reconciled projection. They are not
    independently editable business facts.

### 1.2 Keys and naming

-   Every table has a stable primary key. UUIDs are the default proposed
    identifier type for new domain tables, unless an existing
    provider/legacy identifier must be retained as an external
    identifier.
-   Use explicit foreign keys for domain relationships. Avoid
    polymorphic foreign keys where a normal FK can be used.
-   For audit/event tables, references to deleted or archived entities
    must not make history disappear. Prefer restrictive deletion, soft
    archival, or nullable references with a durable
    entity-type/entity-id snapshot where justified.
-   Use `created_at` and `updated_at` on mutable business entities. Use
    append-only records for historical events. A history record must not
    be silently overwritten.
-   Store instants as `timestamptz` in UTC. For a deadline defined as a
    calendar date, store a `date` and the governing timezone/semantics;
    do not fabricate midnight UTC. Preserve the source rule's
    time-calculation semantics.
-   Enumerations below are **logical values**, not a claim that all
    enums are already final. Use Prisma enums only for closed, stable
    technical states. Use referenced configuration tables for
    policy-/route-dependent values that can evolve.

### 1.3 Transaction boundary

For any material business transition, one PostgreSQL transaction must
commit all applicable changes together: 1. domain state update; 2.
append-only workflow/history record; 3. audit event; 4. outbox event(s)
needed for asynchronous follow-up.

Do not send email, enqueue only in Redis, or call external services
inside a transaction and assume rollback can undo those side effects.
Outbox dispatch and external delivery are separate recoverable steps.

### 1.4 Deletion and retention

-   Do not hard-delete submitted applications, decisions, committee
    records, official communications, workflow histories, audit events,
    or regulatory rule versions as ordinary CRUD.
-   Use archival/retention states where appropriate. Exact retention
    duration, legal holds, deletion rights, and purge authorisation are
    **unresolved policy decisions**; do not invent them.
-   Drafts and unsubmitted temporary uploads may have different
    retention rules, but those rules must be explicitly configured.
-   Deleting a user identity must not erase attribution on historic
    records. Preserve an appropriate non-secret actor snapshot or
    anonymised tombstone as approved by policy.
-   Do not cascade-delete important evidence or history because a parent
    record is archived.

------------------------------------------------------------------------

## 2. Entity map

### 2.1 Identity and access

-   `User` --- application-level user/profile, independent of the
    selected authentication provider.
-   `AuthIdentity` --- optional mapping to a provider-managed subject;
    provider selection unresolved.
-   `Role`, `Permission`, `RolePermission`, `UserRole` --- role-based
    access control.
-   `InstitutionMembership` --- user-to-institution access boundary.
-   `ApplicationAssignment` --- case-specific assignment to
    reviewers/officers/committee members.

### 2.2 Regulatory configuration and workflow

-   `ApplicationCategory` --- reviewed, supported category/purpose
    configuration.
-   `RuleSource` --- source document/publication metadata.
-   `RuleVersion` --- versioned, reviewed rule with effective dates and
    structured payload.
-   `WorkflowDefinition` --- versioned workflow route for a specific
    applicability scope.
-   `WorkflowStageDefinition` --- stages within a definition version.
-   `WorkflowTransitionDefinition` --- permitted transitions and guard
    metadata.
-   `WorkflowInstance` --- instantiated route for an application.
-   `WorkflowStageHistory` --- append-only record of actual stage
    changes.

### 2.3 Application and review

-   `Institution` --- institutional identity and data boundary.
-   `Application` --- an application/case submitted by or on behalf of
    an institution.
-   `ApplicationRevision` --- immutable submitted snapshot/revision
    where required.
-   `ScrutinyObservation` --- reviewer observation.
-   `Deficiency` --- formalised deficiency with response window.
-   `ObservationResponse` --- institution response to an
    observation/deficiency, with versions.
-   `EVCEvent` --- event/schedule/outcome record when route requires or
    allows EVC.
-   `EVCMemberAssignment` --- assignment of an EVC member to an EVC
    event.
-   `CommitteeProceeding` --- committee meeting/proceeding record.
-   `Recommendation` --- committee/reviewer recommendation, separate
    from official decision.
-   `DecisionRecord` --- official decision entered by an authorised
    decision authority.
-   `AppealCase` --- appeal only where applicable under a verified rule.
-   `OfficialCommunication` --- formal notice/order/LoA/LoR or other
    official communication.

### 2.4 Compliance and documents

-   `ComplianceObligationDefinition` --- reusable definition of a
    compliance obligation.
-   `ComplianceObligation` --- obligation instance applicable to an
    institution/application.
-   `ComplianceEvidence` --- evidence submission for an obligation.
-   `Document` --- logical document identity and current metadata.
-   `DocumentVersion` --- each uploaded file/version and storage
    reference.
-   `DocumentVerification` --- verification decision/history for a
    document version.

### 2.5 Operations, delivery, and traceability

-   `Deadline` --- explicit deadline/clock instance where not
    sufficiently represented on the owning entity; linked to source
    rule.
-   `Notification` --- notification intent and lifecycle.
-   `NotificationAttempt` --- provider delivery attempt/result.
-   `EscalationRecord` --- escalation action/target/deduplication.
-   `AuditEvent` --- append-only material business/security event.
-   `OutboxEvent` --- durable request for asynchronous processing.
-   `IntegrationSyncRun` --- import/export/synchronisation run.
-   `ExternalRecordLink` --- mapping to an external system record.
-   `OperationalIncident` --- optional compact incident record; do not
    duplicate full provider logs.

These concepts are not all mandatory in the first implementation commit.
Build the minimum coherent core first, but preserve the relationship and
integrity principles when adding modules.

------------------------------------------------------------------------

## 3. Logical relationship diagram

The diagram is a high-level guide; the sections below define the
intended cardinalities and constraints.

``` mermaid
erDiagram
    INSTITUTION ||--o{ INSTITUTION_MEMBERSHIP : has
    USER ||--o{ INSTITUTION_MEMBERSHIP : belongs_through
    USER ||--o{ USER_ROLE : receives
    ROLE ||--o{ USER_ROLE : assigned
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included_in

    INSTITUTION ||--o{ APPLICATION : submits
    APPLICATION_CATEGORY ||--o{ APPLICATION : classifies
    APPLICATION ||--o{ APPLICATION_REVISION : revisions
    APPLICATION ||--o| WORKFLOW_INSTANCE : has
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_INSTANCE : instantiates
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_STAGE_DEFINITION : contains
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_TRANSITION_DEFINITION : allows
    WORKFLOW_STAGE_DEFINITION ||--o{ WORKFLOW_TRANSITION_DEFINITION : from_or_to
    WORKFLOW_INSTANCE ||--o{ WORKFLOW_STAGE_HISTORY : records
    APPLICATION ||--o{ APPLICATION_ASSIGNMENT : assigned
    USER ||--o{ APPLICATION_ASSIGNMENT : assigned_to

    APPLICATION ||--o{ SCRUTINY_OBSERVATION : reviewed
    SCRUTINY_OBSERVATION ||--o{ DEFICIENCY : may_formalise
    DEFICIENCY ||--o{ OBSERVATION_RESPONSE : receives
    APPLICATION ||--o{ EVC_EVENT : may_have
    EVC_EVENT ||--o{ EVC_MEMBER_ASSIGNMENT : assigns
    USER ||--o{ EVC_MEMBER_ASSIGNMENT : participates

    APPLICATION ||--o{ COMMITTEE_PROCEEDING : considered_in
    COMMITTEE_PROCEEDING ||--o{ RECOMMENDATION : records
    APPLICATION ||--o{ DECISION_RECORD : receives
    DECISION_RECORD ||--o{ APPEAL_CASE : may_be_appealed
    APPLICATION ||--o{ OFFICIAL_COMMUNICATION : has

    COMPLIANCE_OBLIGATION_DEFINITION ||--o{ COMPLIANCE_OBLIGATION : defines
    INSTITUTION ||--o{ COMPLIANCE_OBLIGATION : owes
    APPLICATION o|--o{ COMPLIANCE_OBLIGATION : context_for
    COMPLIANCE_OBLIGATION ||--o{ COMPLIANCE_EVIDENCE : supported_by

    DOCUMENT ||--o{ DOCUMENT_VERSION : versions
    DOCUMENT_VERSION ||--o{ DOCUMENT_VERIFICATION : verified_by
    DOCUMENT ||--o{ COMPLIANCE_EVIDENCE : may_support
    DOCUMENT ||--o{ OBSERVATION_RESPONSE : may_support
    APPLICATION ||--o{ DOCUMENT : context
    INSTITUTION ||--o{ DOCUMENT : owns_or_contextualises

    RULE_SOURCE ||--o{ RULE_VERSION : publishes
    RULE_VERSION o|--o{ WORKFLOW_DEFINITION : governs
    RULE_VERSION o|--o{ DEADLINE : calculates
    APPLICATION ||--o{ DEADLINE : has
    NOTIFICATION ||--o{ NOTIFICATION_ATTEMPT : attempts
    APPLICATION o|--o{ NOTIFICATION : context
    DEADLINE o|--o{ NOTIFICATION : triggers
    APPLICATION ||--o{ ESCALATION_RECORD : escalates
    AUDIT_EVENT }o--o| USER : actor
    OUTBOX_EVENT }o--o| USER : initiator
    INTEGRATION_SYNC_RUN ||--o{ EXTERNAL_RECORD_LINK : maps
```

**Important:** The ER diagram is conceptual. In particular,
`APPLICATION` and `INSTITUTION` are optional contexts for
documents/notifications/obligations only where the relevant document or
record is not intrinsically tied to both. Do not implement optional
polymorphic relationships as unconstrained text references. Use explicit
nullable foreign keys, join tables, or a separately reviewed
resource-link model.

------------------------------------------------------------------------

## 4. Table specifications

Column types below use PostgreSQL terminology. `UUID` is the default
proposed key type. All foreign keys must have explicit `ON DELETE`
behaviour. Unless stated otherwise, the default is
`RESTRICT`/`NO ACTION`, not cascade deletion. All mutable tables should
have `created_at timestamptz NOT NULL DEFAULT now()` and
`updated_at timestamptz NOT NULL DEFAULT now()`; append-only event
tables normally have `created_at` only. Prisma does not automatically
update a PostgreSQL timestamp unless configured to do so; implement and
test the chosen strategy.

### 4.1 `users`

Application-level profile and actor record. This is not necessarily the
authentication provider's user table.

  --------------------------------------------------------------------------------
  Column           Type                             Null? Constraints / meaning
  ---------------- ---------------- --------------------- ------------------------
  `id`             UUID                                No PK

  `display_name`   text                                No Non-empty after trimming

  `email`          citext or text                     Yes Optional until
                                                          authentication/contact
                                                          policy is decided;
                                                          normalisation and
                                                          uniqueness policy
                                                          unresolved

  `phone`          text                               Yes Optional; format/country
                                                          policy unresolved

  `status`         text/enum                           No Suggested technical
                                                          values: `ACTIVE`,
                                                          `SUSPENDED`, `INACTIVE`;
                                                          final lifecycle to be
                                                          agreed

  `created_at`,    timestamptz                         No UTC instants
  `updated_at`                                            
  --------------------------------------------------------------------------------

Do not store password hashes, provider session secrets, or
authentication tokens here unless the selected identity architecture
explicitly makes this application responsible for them.

### 4.2 `auth_identities` (conditional)

Mapping from application user to provider-managed identity. Do not
create until the authentication provider is selected.

  ----------------------------------------------------------------------------
  Column               Type                             Null? Constraints /
                                                              meaning
  -------------------- ---------------- --------------------- ----------------
  `id`                 UUID                                No PK

  `user_id`            UUID                                No FK → `users.id`,
                                                              RESTRICT

  `provider_key`       text                                No Stable provider
                                                              identifier, not
                                                              a secret

  `provider_subject`   text                                No Exact stable
                                                              subject/ID from
                                                              provider

  `created_at`         timestamptz                         No Link creation
                                                              time
  ----------------------------------------------------------------------------

Unique constraint: (`provider_key`, `provider_subject`). Decide whether
one user can link multiple identities and whether a provider identity
can be moved between users; do not allow accidental reassignment.

### 4.3 `roles`, `permissions`, `role_permissions`, `user_roles`

Role-based authorisation. Role names and permission keys are system
configuration, not APH rules.

**`roles`**: `id UUID PK`, `key text UNIQUE NOT NULL`,
`name text NOT NULL`, `description text NULL`,
`is_system_role boolean NOT NULL DEFAULT false`, timestamps.\
**`permissions`**: `id UUID PK`, `key text UNIQUE NOT NULL`,
`description text NULL`, timestamps.\
**`role_permissions`**: `role_id UUID FK roles`,
`permission_id UUID FK permissions`, `created_at`; composite PK
(`role_id`,`permission_id`).\
**`user_roles`**: `user_id UUID FK users`, `role_id UUID FK roles`,
`granted_by_user_id UUID NULL FK users`,
`granted_at timestamptz NOT NULL`, `revoked_at timestamptz NULL`,
`grant_reason text NULL`; use a surrogate UUID PK or a documented
assignment identity so grant/revoke history can be preserved. Do not
physically overwrite a prior grant. Prevent multiple simultaneously
active duplicate grants for the same pair using a partial unique index
where supported.

Role labels mentioned in project materials include institution users,
scrutiny officers, coordinators, administrators, committee/decision
actors, and other authorised staff. The exact role catalogue and
permission matrix must be derived from the requirements/approved
operating model, not guessed from job titles. Enforce permissions on the
backend for every protected operation.

### 4.4 `institutions`

  -------------------------------------------------------------------------------
  Column               Type                             Null? Constraints /
                                                              meaning
  -------------------- ---------------- --------------------- -------------------
  `id`                 UUID                                No PK

  `internal_code`      text                               Yes Unique when
                                                              present;
                                                              source/provenance
                                                              if imported

  `name`               text                                No Display/legal name
                                                              as
                                                              supplied/verified

  `institution_type`   text/FK to                          No Must reference
                       config                                 reviewed supported
                                                              configuration;
                                                              exact catalogue
                                                              unresolved

  `status`             text/enum                           No Technical
                                                              lifecycle, distinct
                                                              from approval
                                                              status

  `address`            jsonb or                           Yes Choose one
                       normalised                             representation in
                       address fields                         ADR; do not
                                                              duplicate unneeded
                                                              PII

  `contact_email`      text                               Yes Optional

  `contact_phone`      text                               Yes Optional

  `created_at`,        timestamptz                         No 
  `updated_at`                                                
  -------------------------------------------------------------------------------

Do not encode APH eligibility in `institution_type` alone. Institution
type and application-specific regulatory eligibility are separate
concepts.

### 4.5 `institution_memberships`

  ----------------------------------------------------------------------------------
  Column                 Type                             Null? Constraints /
                                                                meaning
  ---------------------- ---------------- --------------------- --------------------
  `id`                   UUID                                No PK

  `institution_id`       UUID                                No FK →
                                                                `institutions.id`

  `user_id`              UUID                                No FK → `users.id`

  `membership_role`      text/FK to                          No Institution-scoped
                         config                                 role; must not
                                                                override global
                                                                permissions

  `status`               text/enum                           No Suggested: `ACTIVE`,
                                                                `SUSPENDED`, `ENDED`

  `valid_from`           timestamptz                         No 

  `valid_until`          timestamptz                        Yes Must be after
                                                                `valid_from` if
                                                                present

  `granted_by_user_id`   UUID                               Yes FK → `users.id`

  `created_at`,          timestamptz                         No 
  `updated_at`                                                  
  ----------------------------------------------------------------------------------

Index by (`user_id`,`status`) and (`institution_id`,`status`). Enforce
no duplicate active membership for a user/institution/role using an
appropriate partial unique index if the chosen policy allows only one.

### 4.6 `application_categories`

Reviewed list of application purposes/categories supported by the
system.

  --------------------------------------------------------------------------------------
  Column                     Type                             Null? Constraints /
                                                                    meaning
  -------------------------- ---------------- --------------------- --------------------
  `id`                       UUID                                No PK

  `key`                      text                                No UNIQUE stable
                                                                    technical key

  `label`                    text                                No Human-readable label

  `description`              text                               Yes 

  `source_rule_version_id`   UUID                               Yes FK →
                                                                    `rule_versions.id`
                                                                    once that table
                                                                    exists; identifies
                                                                    basis for category
                                                                    where applicable

  `is_enabled`               boolean                             No Only reviewed
                                                                    categories enabled

  `review_status`            text/enum                           No Suggested: `DRAFT`,
                                                                    `IN_REVIEW`,
                                                                    `APPROVED`,
                                                                    `REJECTED`,
                                                                    `RETIRED`

  `created_at`, `updated_at` timestamptz                         No 
  --------------------------------------------------------------------------------------

The category catalogue is not a substitute for applicability conditions.
The application must retain its relevant academic cycle, institution
type, purpose, and other reviewed scope attributes.

### 4.7 `applications`

The case-level record. Application status, workflow stage, official
decision, and communication status are separate dimensions.

  ------------------------------------------------------------------------------------------------------
  Column                           Type                             Null? Constraints / meaning
  -------------------------------- ---------------- --------------------- ------------------------------
  `id`                             UUID                                No PK

  `internal_reference`             text                                No UNIQUE, generated internally

  `external_reference`             text                               Yes External identifier only with
                                                                          provenance in
                                                                          `external_record_links`

  `institution_id`                 UUID                                No FK → `institutions.id`,
                                                                          RESTRICT

  `category_id`                    UUID                                No FK →
                                                                          `application_categories.id`,
                                                                          RESTRICT

  `academic_cycle`                 text                                No Preserve source
                                                                          representation;
                                                                          format/normalisation
                                                                          unresolved

  `application_purpose`            text                                No Must map to reviewed
                                                                          category/scope; avoid
                                                                          free-text-only routing

  `institution_type_snapshot`      text                                No Snapshot of type used at
                                                                          submission/routing, or FK to
                                                                          versioned config; exact
                                                                          representation to choose

  `status`                         text/enum                           No Suggested technical lifecycle
                                                                          only: `DRAFT`, `SUBMITTED`,
                                                                          `IN_PROCESS`, `ON_HOLD`,
                                                                          `WITHDRAWN`, `CLOSED`,
                                                                          `ARCHIVED`; do not treat as
                                                                          approval outcome

  `submitted_at`                   timestamptz                        Yes Null before submission

  `submitted_by_user_id`           UUID                               Yes FK → `users.id`

  `created_by_user_id`             UUID                                No FK → `users.id`

  `current_revision_id`            UUID                               Yes FK →
                                                                          `application_revisions.id`;
                                                                          circular FK may require
                                                                          migration ordering/deferred
                                                                          constraint or omit and query
                                                                          latest revision

  `current_workflow_instance_id`   UUID                               Yes FK → `workflow_instances.id`;
                                                                          unique if only one current
                                                                          workflow instance per
                                                                          application

  `closed_at`                      timestamptz                        Yes 

  `created_at`, `updated_at`       timestamptz                         No 
  ------------------------------------------------------------------------------------------------------

Constraints: - `internal_reference` unique. - `submitted_at` required
for `SUBMITTED` or later states unless a documented exception applies. -
Keep status and decision outcome separate. A case can be closed without
implying approval. - If workflow restart/version replacement is
permitted, retain prior workflow instances; do not overwrite their
history. - Store the submitted application payload in normalised columns
for important/queryable facts, plus a versioned JSON snapshot only for
form payload portions whose schema changes. Do not use a single JSON
blob for the entire relational model.

### 4.8 `application_revisions`

Immutable snapshots of submitted/corrected application content.

  --------------------------------------------------------------------------------------------
  Column                   Type                             Null? Constraints / meaning
  ------------------------ ---------------- --------------------- ----------------------------
  `id`                     UUID                                No PK

  `application_id`         UUID                                No FK → `applications.id`

  `revision_number`        integer                             No Starts at 1; unique per
                                                                  application

  `revision_kind`          text/enum                           No Suggested:
                                                                  `INITIAL_SUBMISSION`,
                                                                  `RESUBMISSION`,
                                                                  `CORRECTION`,
                                                                  `ADMINISTRATIVE_SNAPSHOT`;
                                                                  final kinds reviewed

  `payload`                jsonb                               No Schema-versioned, validated
                                                                  snapshot of form fields;
                                                                  must not replace normalised
                                                                  key fields

  `schema_version`         text                                No Form schema version used to
                                                                  validate payload

  `submitted_by_user_id`   UUID                               Yes FK → `users.id`

  `submitted_at`           timestamptz                         No Snapshot time

  `change_summary`         text                               Yes Reason/summary for
                                                                  correction/resubmission

  `created_at`             timestamptz                         No 
  --------------------------------------------------------------------------------------------

Unique (`application_id`,`revision_number`). Revisions are immutable;
corrections create a new revision. Access to snapshots must be
restricted and audited.

### 4.9 `application_assignments`

Assignment history for a case, reviewer, officer, coordinator, or other
authorised actor.

  ----------------------------------------------------------------------------------
  Column                  Type                             Null? Constraints /
                                                                 meaning
  ----------------------- ---------------- --------------------- -------------------
  `id`                    UUID                                No PK

  `application_id`        UUID                                No FK →
                                                                 `applications.id`

  `assignee_user_id`      UUID                                No FK → `users.id`

  `assignment_type`       text                                No Configured values
                                                                 such as `SCRUTINY`,
                                                                 `COORDINATION`,
                                                                 `DECISION`,
                                                                 `CASE_OWNER`; final
                                                                 catalogue reviewed

  `assigned_by_user_id`   UUID                               Yes FK → `users.id`

  `assigned_at`           timestamptz                         No 

  `unassigned_at`         timestamptz                        Yes Null means current
                                                                 only if assignment
                                                                 policy says so

  `reason`                text                               Yes 

  `created_at`            timestamptz                         No 
  ----------------------------------------------------------------------------------

Index (`application_id`,`unassigned_at`) and
(`assignee_user_id`,`unassigned_at`). Do not overwrite previous assignee
when reassigned.

### 4.10 `rule_sources`

Represents the source publication, not the rule itself.

  ------------------------------------------------------------------------------------
  Column                    Type                             Null? Constraints /
                                                                   meaning
  ------------------------- ---------------- --------------------- -------------------
  `id`                      UUID                                No PK

  `source_type`             text                                No e.g. handbook,
                                                                   amendment,
                                                                   corrigendum,
                                                                   circular, public
                                                                   notice, direction,
                                                                   legal order;
                                                                   reviewed controlled
                                                                   vocabulary

  `title`                   text                                No 

  `issuing_authority`       text                               Yes 

  `edition_or_identifier`   text                                No e.g. edition/year
                                                                   or official
                                                                   identifier

  `published_at`            date                               Yes 

  `official_url`            text                               Yes Only verified
                                                                   official URL

  `document_checksum`       text                               Yes Checksum of
                                                                   retained source
                                                                   file if available

  `source_status`           text/enum                           No Suggested:
                                                                   `UNVERIFIED`,
                                                                   `VERIFIED`,
                                                                   `SUPERSEDED`,
                                                                   `WITHDRAWN`

  `verified_by_user_id`     UUID                               Yes FK → `users.id`

  `verified_at`             timestamptz                        Yes 

  `verification_notes`      text                               Yes 

  `created_at`,             timestamptz                         No 
  `updated_at`                                                     
  ------------------------------------------------------------------------------------

The supplied APH 2024--2027 PDF may be represented as one source record.
Its current applicability must be reviewed rather than assumed.

### 4.11 `rule_versions`

Versioned policy/rule definition with traceable source citation and
governance. The structured payload is validated by an explicitly
versioned schema; do not execute arbitrary code stored in the database.

  ------------------------------------------------------------------------------------------------
  Column                     Type                               Null? Constraints / meaning
  -------------------------- ------------------ --------------------- ----------------------------
  `id`                       UUID                                  No PK

  `rule_key`                 text                                  No Stable logical rule
                                                                      identifier

  `version_number`           integer                               No Positive; unique per
                                                                      `rule_key`

  `rule_source_id`           UUID                                  No FK → `rule_sources.id`

  `citation`                 text                                  No Exact
                                                                      clause/table/annexure/page
                                                                      reference as reviewed; not
                                                                      just "APH"

  `title`                    text                                  No 

  `description`              text                                 Yes 

  `applicability`            jsonb                                 No Validated structured
                                                                      predicates: category,
                                                                      institution type, cycle, and
                                                                      other approved scope;
                                                                      schema/version mandatory

  `rule_payload`             jsonb                                 No Validated declarative
                                                                      configuration, never
                                                                      arbitrary executable code

  `payload_schema_version`   text                                  No 

  `effective_from`           timestamptz/date                     Yes Choose exact semantics;
                                                                      date-based vs instant-based
                                                                      applicability must be
                                                                      explicit

  `effective_until`          timestamptz/date                     Yes Same type/semantics as
                                                                      `effective_from`; end must
                                                                      follow start

  `review_status`            text/enum                             No `DRAFT`, `IN_REVIEW`,
                                                                      `APPROVED`, `REJECTED`,
                                                                      `RETIRED`

  `activation_status`        text/enum                             No `INACTIVE`, `ACTIVE`,
                                                                      `SUSPENDED`, `EXPIRED`

  `reviewed_by_user_id`      UUID                                 Yes FK → `users.id`

  `reviewed_at`              timestamptz                          Yes 

  `approved_by_user_id`      UUID                                 Yes FK → `users.id`

  `approved_at`              timestamptz                          Yes 

  `change_summary`           text                                 Yes 

  `created_at`, `updated_at` timestamptz                           No 
  ------------------------------------------------------------------------------------------------

Unique (`rule_key`,`version_number`). Activation requires verified
source, exact citation, approved review, effective period, and
successful validation/tests. Prevent overlapping active versions for the
same rule/applicability scope where possible; complex overlap detection
may require a service-level validator and database exclusion constraint.
No rule is active merely because it exists.

### 4.12 `workflow_definitions`

A versioned route definition, scoped to reviewed applicability and
linked to rule versions.

  ----------------------------------------------------------------------------------------------------
  Column                        Type                               Null? Constraints / meaning
  ----------------------------- ------------------ --------------------- -----------------------------
  `id`                          UUID                                  No PK

  `workflow_key`                text                                  No Stable logical route key

  `version_number`              integer                               No Positive; unique per
                                                                         `workflow_key`

  `name`                        text                                  No 

  `description`                 text                                 Yes 

  `category_id`                 UUID                                  No FK →
                                                                         `application_categories.id`

  `applicability`               jsonb                                 No Validated scope
                                                                         incl. institution
                                                                         type/cycle/purpose as
                                                                         applicable

  `definition_status`           text/enum                             No `DRAFT`, `IN_REVIEW`,
                                                                         `APPROVED`, `RETIRED`

  `activation_status`           text/enum                             No `INACTIVE`, `ACTIVE`,
                                                                         `SUSPENDED`, `EXPIRED`

  `source_rule_version_id`      UUID                                 Yes FK → `rule_versions.id`;
                                                                         multiple rules may govern one
                                                                         workflow, see join below

  `definition_schema_version`   text                                  No 

  `approved_by_user_id`         UUID                                 Yes FK → `users.id`

  `approved_at`                 timestamptz                          Yes 

  `effective_from`,             timestamptz/date                     Yes Use consistent documented
  `effective_until`                                                      semantics

  `created_at`, `updated_at`    timestamptz                           No 
  ----------------------------------------------------------------------------------------------------

Unique (`workflow_key`,`version_number`). Because one route can be
governed by multiple sources/rules, add `workflow_rule_links`
(`workflow_definition_id`, `rule_version_id`, `relationship_type`,
`created_at`) with composite unique key. `source_rule_version_id` is a
convenience only and may be omitted in favour of the join table for a
fully normalised design. Choose one representation consistently; do not
maintain both without a documented reason.

### 4.13 `workflow_stage_definitions`

  ------------------------------------------------------------------------------------------------
  Column                     Type                                Null? Constraints / meaning
  -------------------------- ------------------- --------------------- ---------------------------
  `id`                       UUID                                   No PK

  `workflow_definition_id`   UUID                                   No FK →
                                                                       `workflow_definitions.id`

  `stage_key`                text                                   No Stable within workflow
                                                                       definition

  `name`                     text                                   No 

  `description`              text                                  Yes 

  `sequence_order`           integer                                No Ordering/display hint only;
                                                                       must not alone determine
                                                                       allowed transitions

  `stage_type`               text                                   No Configured technical stage
                                                                       type; not an APH decision

  `is_entry_stage`           boolean                                No Exactly one entry stage per
                                                                       active definition unless a
                                                                       reviewed branching design
                                                                       says otherwise

  `is_terminal_stage`        boolean                                No Terminal for this workflow
                                                                       definition, not necessarily
                                                                       an official approval
                                                                       outcome

  `required_role_keys`       text\[\]/relation                     Yes Prefer relation if
                                                                       permissions need querying;
                                                                       any JSON/array must be
                                                                       validated

  `stage_config`             jsonb                                  No Versioned, validated
                                                                       stage-specific declarative
                                                                       configuration

  `created_at`, `updated_at` timestamptz                            No 
  ------------------------------------------------------------------------------------------------

Unique (`workflow_definition_id`,`stage_key`) and
(`workflow_definition_id`,`sequence_order`) only if the business
requires unique sequence positions. Branching workflows may share
sequence/order values, so uniqueness of order is not assumed.

### 4.14 `workflow_transition_definitions`

  -----------------------------------------------------------------------------------------------------
  Column                       Type                             Null? Constraints / meaning
  ---------------------------- ---------------- --------------------- ---------------------------------
  `id`                         UUID                                No PK

  `workflow_definition_id`     UUID                                No FK → `workflow_definitions.id`

  `from_stage_definition_id`   UUID                                No FK →
                                                                      `workflow_stage_definitions.id`

  `to_stage_definition_id`     UUID                                No FK →
                                                                      `workflow_stage_definitions.id`

  `transition_key`             text                                No Stable within definition

  `label`                      text                                No 

  `required_permission_key`    text                               Yes Permission check; role name alone
                                                                      is not sufficient

  `guard_config`               jsonb                               No Validated declarative
                                                                      preconditions

  `requires_reason`            boolean                             No 

  `is_enabled`                 boolean                             No Must be approved with workflow
                                                                      definition

  `created_at`, `updated_at`   timestamptz                         No 
  -----------------------------------------------------------------------------------------------------

Both stage FKs must refer to stages belonging to the same workflow
definition. Enforce with composite keys/unique constraints or service
validation plus DB constraints where practical. Prevent duplicate
(`workflow_definition_id`,`transition_key`). Never infer transitions
from sequence order alone.

### 4.15 `workflow_rule_links`

Join table between a workflow definition and the rule versions governing
it.

Columns: `workflow_definition_id UUID FK`, `rule_version_id UUID FK`,
`relationship_type text NOT NULL` (e.g. `GOVERNS`, `DEADLINE_BASIS`,
`ELIGIBILITY_BASIS`, `DOCUMENT_REQUIREMENT_BASIS`; controlled
vocabulary), `created_at timestamptz`. PK/unique:
(`workflow_definition_id`,`rule_version_id`,`relationship_type`). Only
approved/eligible rule versions may govern an active workflow.

### 4.16 `workflow_instances`

An instantiated version of a workflow route for one application.

  -------------------------------------------------------------------------------------------------------------
  Column                              Type                             Null? Constraints / meaning
  ----------------------------------- ---------------- --------------------- ----------------------------------
  `id`                                UUID                                No PK

  `application_id`                    UUID                                No FK → `applications.id`

  `workflow_definition_id`            UUID                                No FK → `workflow_definitions.id`

  `workflow_definition_version`       integer                             No Snapshot for explicit
                                                                             auditability; must match
                                                                             definition row

  `current_stage_definition_id`       UUID                               Yes FK →
                                                                             `workflow_stage_definitions.id`;
                                                                             null only before route
                                                                             initialisation/after a documented
                                                                             terminal representation

  `status`                            text/enum                           No `NOT_STARTED`, `ACTIVE`, `PAUSED`,
                                                                             `COMPLETED`, `CANCELLED`,
                                                                             `SUPERSEDED`

  `started_at`                        timestamptz                        Yes 

  `completed_at`                      timestamptz                        Yes 

  `created_by_user_id`                UUID                               Yes FK → `users.id` or system actor
                                                                             model

  `supersedes_workflow_instance_id`   UUID                               Yes Self-FK → `workflow_instances.id`

  `created_at`, `updated_at`          timestamptz                         No 
  -------------------------------------------------------------------------------------------------------------

A route selection record must retain the scope inputs and rule/workflow
versions used. Consider `route_selection_snapshot jsonb NOT NULL` with a
schema version and a reference to the exact configuration. Ensure
current stage belongs to the selected definition. Keep superseded
history. Whether multiple workflow instances can be active concurrently
per application is unresolved; default recommendation is at most one
active current instance, enforced with a partial unique index if
confirmed.

### 4.17 `workflow_stage_history`

Append-only transition log.

  ---------------------------------------------------------------------------------------------------
  Column                       Type                             Null? Constraints / meaning
  ---------------------------- ---------------- --------------------- -------------------------------
  `id`                         UUID                                No PK

  `workflow_instance_id`       UUID                                No FK → `workflow_instances.id`

  `from_stage_definition_id`   UUID                               Yes FK → stage definition; null for
                                                                      initial entry

  `to_stage_definition_id`     UUID                                No FK → stage definition

  `transition_definition_id`   UUID                               Yes FK → transition definition;
                                                                      null only for explicitly
                                                                      documented system
                                                                      initialisation/migration

  `actor_user_id`              UUID                               Yes FK → `users.id`; null requires
                                                                      explicit system actor metadata

  `actor_type`                 text                                No `USER`, `SYSTEM`,
                                                                      `INTEGRATION`, `MIGRATION`

  `occurred_at`                timestamptz                         No 

  `reason`                     text                               Yes Required if transition says so

  `correlation_id`             text                               Yes Request/job correlation

  `rule_version_ids`           jsonb or join                      Yes Prefer
                               table                                  `workflow_history_rule_links`
                                                                      join table for referential
                                                                      integrity

  `metadata`                   jsonb                              Yes Redacted, schema-versioned safe
                                                                      context only
  ---------------------------------------------------------------------------------------------------

History is append-only. Index (`workflow_instance_id`,`occurred_at`). Do
not update prior rows to "fix" the sequence; append a correction event
with reason.

### 4.18 `scrutiny_observations`

  -----------------------------------------------------------------------------------------------------
  Column                       Type                             Null? Constraints / meaning
  ---------------------------- ---------------- --------------------- ---------------------------------
  `id`                         UUID                                No PK

  `application_id`             UUID                                No FK → `applications.id`

  `workflow_instance_id`       UUID                                No FK → `workflow_instances.id`

  `stage_definition_id`        UUID                               Yes FK →
                                                                      `workflow_stage_definitions.id`

  `created_by_user_id`         UUID                                No FK → `users.id`

  `observation_reference`      text                               Yes Optional human reference;
                                                                      uniqueness scope must be defined

  `title`                      text                                No 

  `body`                       text                                No Store only necessary review
                                                                      content

  `severity`                   text/enum                          Yes Controlled values to be agreed;
                                                                      not a regulatory result unless
                                                                      source defines it

  `status`                     text/enum                           No Suggested: `DRAFT`, `OPEN`,
                                                                      `RESPONDED`, `RESOLVED`,
                                                                      `WITHDRAWN`; confirm lifecycle

  `source_rule_version_id`     UUID                               Yes FK → `rule_versions.id`

  `source_citation_snapshot`   text                               Yes Citation as applied at time of
                                                                      observation

  `created_at`, `updated_at`   timestamptz                         No 
  -----------------------------------------------------------------------------------------------------

Observation author/time and case/stage are required. If edits must be
preserved, add an append-only `scrutiny_observation_revisions` table; do
not silently overwrite material findings after issue.

### 4.19 `deficiencies`

A formalised deficiency/requirement for a response. Not every
observation must necessarily become a formal deficiency; the applicable
process must determine that.

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`scrutiny_observation_id UUID NULL FK scrutiny_observations` -
`workflow_instance_id UUID NOT NULL FK workflow_instances` -
`source_rule_version_id UUID NULL FK rule_versions` -
`source_citation_snapshot text NULL` - `reference text NULL` -
`title text NOT NULL` - `description text NOT NULL` -
`status text/enum NOT NULL` (suggested technical values `DRAFT`,
`ISSUED`, `RESPONSE_RECEIVED`, `UNDER_REVIEW`, `SATISFIED`,
`UNSATISFIED`, `WITHDRAWN`; confirm before freezing) -
`issued_by_user_id UUID NULL FK users` - `issued_at timestamptz NULL` -
`response_due_date date NULL` - `deadline_id UUID NULL FK deadlines` -
`closed_at timestamptz NULL` - `closure_reason text NULL` - timestamps.

If the deficiency is formally issued, record the exact governing rule
version/citation and deadline semantics. Do not assume a single
universal response period.

### 4.20 `observation_responses`

Responses are versioned submissions, not overwrites.

Columns: - `id UUID PK` -
`deficiency_id UUID NOT NULL FK deficiencies` -
`revision_number integer NOT NULL` -
`submitted_by_user_id UUID NOT NULL FK users` -
`response_text text NOT NULL` - `status text/enum NOT NULL`
(e.g. `DRAFT`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`;
confirm lifecycle) - `submitted_at timestamptz NULL` -
`reviewed_by_user_id UUID NULL FK users` -
`reviewed_at timestamptz NULL` - `review_notes text NULL` - timestamps.

Unique (`deficiency_id`,`revision_number`). Use a join table
`observation_response_documents(response_id, document_id, document_version_id, created_at)`
to link evidence versions; do not store arbitrary object URLs in
response text.

### 4.21 `evc_events`

EVC is recorded only when the selected, reviewed route requires/allows
it. EVC is not implied for every application.

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`workflow_instance_id UUID NOT NULL FK workflow_instances` -
`event_reference text NULL` - `event_type text NOT NULL` (must be
configured; do not invent statutory types) - `status text/enum NOT NULL`
(suggested operational lifecycle `PLANNED`, `SCHEDULED`, `CONFIRMED`,
`IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `POSTPONED`; confirm) -
`scheduled_start_at timestamptz NULL` -
`scheduled_end_at timestamptz NULL` - `timezone_name text NULL`
(required if local schedule must be preserved; select timezone policy) -
`location_or_mode text NULL` (avoid implying a physical/virtual modality
unless recorded) - `created_by_user_id UUID NULL FK users` -
`confirmed_by_user_id UUID NULL FK users` -
`confirmed_at timestamptz NULL` -
`report_document_id UUID NULL FK documents` -
`outcome_summary text NULL` - `completed_at timestamptz NULL` -
timestamps.

Validate end \> start when both are present. Keep schedule changes in an
append-only event/history or audit record. A report file is a document
reference, not a blob in this row.

### 4.22 `evc_member_assignments`

Columns: `id UUID PK`, `evc_event_id UUID NOT NULL FK evc_events`,
`user_id UUID NULL FK users`, `member_name_snapshot text NULL`,
`member_role text NOT NULL`, `assignment_status text/enum NOT NULL`,
`assigned_by_user_id UUID NULL FK users`,
`assigned_at timestamptz NOT NULL`, `unassigned_at timestamptz NULL`,
`created_at timestamptz`. Either `user_id` or `member_name_snapshot`
must be supplied. Use the snapshot only when an external/non-system
member cannot be represented by a user account; avoid duplicate personal
data. Assignment history must be preserved.

### 4.23 `committee_proceedings`

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`workflow_instance_id UUID NOT NULL FK workflow_instances` -
`committee_type text NOT NULL` (configured from approved operating
model) - `proceeding_reference text NULL` -
`scheduled_at timestamptz NULL` - `held_at timestamptz NULL` -
`status text/enum NOT NULL` (suggested `PLANNED`, `SCHEDULED`, `HELD`,
`ADJOURNED`, `CANCELLED`; confirm) -
`minutes_document_id UUID NULL FK documents` - `summary text NULL` -
`created_by_user_id UUID NULL FK users` - timestamps.

A committee proceeding is a meeting/proceeding record. It is not itself
a recommendation, decision, or formal communication. If member
attendance is required, add `committee_member_assignments` as a separate
history-preserving table; do not assume it is required before confirming
scope.

### 4.24 `recommendations`

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`committee_proceeding_id UUID NULL FK committee_proceedings` -
`workflow_instance_id UUID NOT NULL FK workflow_instances` -
`recommendation_type text NOT NULL` (configured; not the official
decision outcome enum) - `recommendation_text text NOT NULL` -
`status text/enum NOT NULL` (suggested `DRAFT`, `SUBMITTED`,
`WITHDRAWN`, `SUPERSEDED`; confirm) -
`created_by_user_id UUID NOT NULL FK users` -
`submitted_at timestamptz NULL` -
`source_rule_version_id UUID NULL FK rule_versions` - timestamps.

Recommendation must not directly update or imply `DecisionRecord`.
Preserve revisions/withdrawals where material; add a revision table if
users can edit a submitted recommendation.

### 4.25 `decision_records`

Official decision record. Only an authorised human decision authority
may create/confirm a statutory decision.

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`workflow_instance_id UUID NOT NULL FK workflow_instances` -
`decision_reference text NULL` - `decision_type text NOT NULL`
(configured from verified process; do not assume a universal enum) -
`decision_outcome text NOT NULL` (controlled, source-reviewed values; do
not invent final outcome vocabulary) - `decision_text text NULL` -
`decided_by_user_id UUID NOT NULL FK users` -
`decision_authority_role_or_body text NOT NULL` -
`decided_at timestamptz NOT NULL` -
`source_rule_version_id UUID NULL FK rule_versions` -
`source_citation_snapshot text NULL` - `status text/enum NOT NULL`
(e.g. `DRAFT`, `CONFIRMED`, `CORRECTED`, `SUPERSEDED`; define correction
model before use) -
`supersedes_decision_id UUID NULL FK decision_records` -
`official_communication_id UUID NULL FK official_communications`
(circular relation: alternatively link from communication to decision
only) - `reason_or_basis text NULL` - timestamps.

A decision must be attributable to an authorised actor and must not be
auto-generated from a recommendation, score, deadline, committee
outcome, or rule evaluation. Keep corrected/superseded decision history.
The authoritative decision and the communication conveying it are
distinct records.

### 4.26 `appeal_cases`

Conditional: only use for an appeal route established by an applicable
verified rule. The project reference mentions a seven-day appeal
provision only for a relevant scope; this is not a universal deadline.

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`decision_record_id UUID NOT NULL FK decision_records` -
`appeal_reference text NULL` -
`filed_by_user_id UUID NOT NULL FK users` -
`filed_at timestamptz NOT NULL` - `grounds text NOT NULL` -
`status text/enum NOT NULL` (e.g. `FILED`, `UNDER_REVIEW`, `DECIDED`,
`WITHDRAWN`, `CLOSED`; final lifecycle verified) -
`applicable_rule_version_id UUID NOT NULL FK rule_versions` -
`due_date date NULL` -
`appeal_decision_record_id UUID NULL FK decision_records` only if the
decision model explicitly supports linked appeal decisions without
ambiguous circular semantics; otherwise use a dedicated appeal outcome
record. - timestamps.

Validate that the decision belongs to the same application. The filing
window is calculated from the applicable verified rule, relevant
triggering event, and its specified date/time semantics. Do not
hard-code "7 days" globally.

### 4.27 `official_communications`

Formal notices/orders/letters/LoA/LoR and other official communications.
Not a reminder email or in-app alert.

Columns: - `id UUID PK` -
`application_id UUID NOT NULL FK applications` -
`decision_record_id UUID NULL FK decision_records` -
`deficiency_id UUID NULL FK deficiencies` -
`appeal_case_id UUID NULL FK appeal_cases` -
`communication_type text NOT NULL` (configured;
e.g. notice/order/letter, not exhaustive) -
`reference_number text NULL` -
`issued_by_user_id UUID NOT NULL FK users` -
`issued_at timestamptz NOT NULL` -
`recipient_institution_id UUID NULL FK institutions` -
`document_id UUID NULL FK documents` - `delivery_status text/enum NULL`
(formal issuance and delivery tracking must be separate if required) -
`source_rule_version_id UUID NULL FK rule_versions` -
`status text/enum NOT NULL` (suggested `DRAFT`, `ISSUED`, `CANCELLED`,
`SUPERSEDED`; confirm) -
`supersedes_communication_id UUID NULL FK official_communications` -
timestamps.

A communication may refer to a decision, deficiency, appeal, or other
approved process object. Do not make all links mandatory because
communication types differ. Add a database/service validation that each
communication's target combination is valid for its type. Formal
communication content and document access are sensitive.

### 4.28 `compliance_obligation_definitions`

Reusable definition of a time-bound institutional compliance obligation.

Columns: - `id UUID PK` - `obligation_key text NOT NULL` -
`version_number integer NOT NULL` - `name text NOT NULL` -
`description text NULL` - `applicability jsonb NOT NULL`
(schema-versioned scope predicates) -
`source_rule_version_id UUID NOT NULL FK rule_versions` -
`source_citation text NOT NULL` - `due_date_calculation jsonb NOT NULL`
(declarative and validated; includes trigger, duration/calendar
semantics, timezone if relevant) -
`required_evidence_config jsonb NOT NULL` -
`definition_status text/enum NOT NULL` (`DRAFT`, `IN_REVIEW`,
`APPROVED`, `RETIRED`) - `created_at`, `updated_at`.

Unique (`obligation_key`,`version_number`). No due-date duration should
be inserted unless grounded in an approved source.

### 4.29 `compliance_obligations`

An obligation instance for a specific institution and, optionally,
application.

Columns: - `id UUID PK` -
`definition_id UUID NOT NULL FK compliance_obligation_definitions` -
`institution_id UUID NOT NULL FK institutions` -
`application_id UUID NULL FK applications` -
`title_snapshot text NOT NULL` -
`source_rule_version_id UUID NOT NULL FK rule_versions` -
`source_citation_snapshot text NOT NULL` - `status text/enum NOT NULL`
(suggested `NOT_YET_DUE`, `DUE`, `SUBMITTED`, `UNDER_REVIEW`,
`COMPLIANT`, `NON_COMPLIANT`, `WAIVED`, `CANCELLED`, `OVERDUE`; final
lifecycle reviewed) - `triggered_at timestamptz NULL` -
`due_date date NULL` - `due_at timestamptz NULL` -
`deadline_timezone text NULL` - `completed_at timestamptz NULL` -
`verified_by_user_id UUID NULL FK users` -
`verified_at timestamptz NULL` - `verification_notes text NULL` -
timestamps.

Do not store both `due_date` and `due_at` as if interchangeable. Exactly
one or neither may be populated according to the obligation's deadline
semantics. Institution is required; application context is optional. A
waived/cancelled obligation requires authorised actor, reason, and audit
record. Compliance status is not the same as application approval
status.

### 4.30 `compliance_evidence`

Columns: - `id UUID PK` -
`compliance_obligation_id UUID NOT NULL FK compliance_obligations` -
`document_id UUID NOT NULL FK documents` -
`document_version_id UUID NOT NULL FK document_versions` -
`submitted_by_user_id UUID NOT NULL FK users` -
`submitted_at timestamptz NOT NULL` - `status text/enum NOT NULL`
(suggested `SUBMITTED`, `UNDER_REVIEW`, `ACCEPTED`, `REJECTED`,
`SUPERSEDED`; confirm) - `reviewed_by_user_id UUID NULL FK users` -
`reviewed_at timestamptz NULL` - `review_notes text NULL` - timestamps.

A submission and its verification are distinct. Evidence rows must
reference the exact document version reviewed. Preserve previous
submissions. Add validation that the document/version pair belongs
together.

### 4.31 `documents`

Logical document identity, independent of bytes and individual upload
versions.

Columns: - `id UUID PK` - `institution_id UUID NULL FK institutions` -
`application_id UUID NULL FK applications` -
`document_type_key text NOT NULL` (configured, not hard-coded solely to
a handful of examples) - `title text NOT NULL` -
`classification text NOT NULL` (e.g. confidential/internal/public only
after approved classification policy) - `status text/enum NOT NULL`
(suggested `ACTIVE`, `ARCHIVED`, `RESTRICTED`, `DELETED_PENDING_PURGE`;
exact retention/purge semantics unresolved) -
`current_version_id UUID NULL FK document_versions` (circular reference;
can instead query the latest non-superseded version to avoid cyclic
migration) - `created_by_user_id UUID NOT NULL FK users` - `created_at`,
`updated_at`.

At least one context (`institution_id`, `application_id`, or a reviewed
explicit link model) must identify the access boundary. If a document
must link to multiple business objects, use explicit link tables such as
`document_obligation_links`, `document_deficiency_links`,
`document_communication_links`, rather than assuming both institution
and application are always present. Do not permit unrestricted document
IDs to bypass resource-level authorisation.

### 4.32 `document_versions`

Each upload is a distinct immutable version.

Columns: - `id UUID PK` - `document_id UUID NOT NULL FK documents` -
`version_number integer NOT NULL` - `storage_provider text NOT NULL`
(provider key; initially expected to represent Neon Object Storage only
after verified integration) - `bucket_name text NOT NULL` (proposed
private bucket name `uploads`; verify actual provider setup) -
`object_key text NOT NULL` (opaque key; unique within provider/bucket) -
`original_filename text NOT NULL` (untrusted display metadata; never use
directly as filesystem path) - `content_type text NULL` (untrusted
claimed type; validate server-side) - `byte_size bigint NULL`
(non-negative) - `checksum_algorithm text NULL` -
`checksum_value text NULL` -
`uploaded_by_user_id UUID NOT NULL FK users` -
`uploaded_at timestamptz NOT NULL` - `declared_issue_date date NULL` -
`declared_expiry_date date NULL` - `date_provenance text NULL`
(e.g. user-declared, manually verified, extracted; controlled) -
`signature_attestation_status text NULL` (do not imply cryptographic
validation) - `status text/enum NOT NULL` (suggested `UPLOADED`,
`QUARANTINED`, `AVAILABLE`, `REJECTED`, `SUPERSEDED`, `ARCHIVED`;
confirm lifecycle) -
`supersedes_version_id UUID NULL FK document_versions` -
`retention_until date NULL` only when an approved retention policy
supplies it - `created_at timestamptz NOT NULL`.

Unique (`document_id`,`version_number`) and
(`storage_provider`,`bucket_name`,`object_key`). Do not expose permanent
public URLs. If signed URLs are supported and selected, issue them only
after server-side authorisation with a short lifetime; do not store them
as durable object references. A file's checksum supports integrity
comparison, not proof of authenticity.

### 4.33 `document_verifications`

Append-only verification history for a specific document version.

Columns: - `id UUID PK` -
`document_version_id UUID NOT NULL FK document_versions` -
`verification_type text NOT NULL` (e.g. content/format, date,
authenticity review, completeness; configured) - `result text NOT NULL`
(configured result vocabulary) - `method text NOT NULL` (manual or
implemented technical method) -
`verified_by_user_id UUID NULL FK users` -
`verified_at timestamptz NOT NULL` - `notes text NULL` -
`source_rule_version_id UUID NULL FK rule_versions` -
`evidence_metadata jsonb NULL` (redacted, schema-versioned; no
secrets) - `created_at timestamptz NOT NULL`.

A manual review is not a cryptographic signature check. Store method and
outcome accurately. Do not overwrite a previous verification result.

### 4.34 `deadlines`

A deadline is a specific clock/target, not merely a reminder. Some
simple due dates may remain on their owning records; create a
`deadlines` row when common scheduling, notification, escalation, or
audit behaviour requires it. Avoid two competing authoritative due
dates.

Columns: - `id UUID PK` - `application_id UUID NULL FK applications` -
`deficiency_id UUID NULL FK deficiencies` -
`compliance_obligation_id UUID NULL FK compliance_obligations` -
`rule_version_id UUID NOT NULL FK rule_versions` -
`deadline_type text NOT NULL` (configured) -
`trigger_event_type text NOT NULL` - `triggered_at timestamptz NULL` -
`due_date date NULL` - `due_at timestamptz NULL` -
`timezone_name text NULL` - `calculation_snapshot jsonb NOT NULL`
(schema-versioned calculation inputs, source rule version,
calendar/business-day semantics) - `status text/enum NOT NULL`
(suggested `PENDING`, `SATISFIED`, `OVERDUE`, `CANCELLED`,
`SUPERSEDED`) - `satisfied_at timestamptz NULL` -
`cancelled_at timestamptz NULL` - `cancellation_reason text NULL` -
timestamps.

At least one supported target relationship is required; validate allowed
combinations. The authoritative due value is either date-only or
instant-based as dictated by the rule, not both. Deadlines must be
recomputed only through a versioned, audited process. A rule change must
not silently mutate historical deadlines; create a recalculation event
or replacement deadline and preserve the previous record. Deadline
worker jobs must re-check current state and due-date version before
acting.

### 4.35 `notifications`

Represents an intended notification, not proof of delivery and not a
formal official communication.

Columns: - `id UUID PK` - `recipient_user_id UUID NULL FK users` -
`recipient_email_snapshot text NULL` (only if email delivery is
configured; minimise personal data) -
`institution_id UUID NULL FK institutions` -
`application_id UUID NULL FK applications` -
`deadline_id UUID NULL FK deadlines` - `notification_type text NOT NULL`
(configured template/event key) - `channel text NOT NULL` (initially
email/in-app only if implemented; other channels are not selected) -
`template_key text NOT NULL` - `template_version text NOT NULL` -
`payload jsonb NOT NULL` (validated, minimal, non-secret; avoid storing
full confidential documents) - `status text/enum NOT NULL` (`PENDING`,
`QUEUED`, `SENT`, `FAILED`, `CANCELLED`, `SUPPRESSED`) -
`idempotency_key text NOT NULL` - `scheduled_for timestamptz NULL` -
`created_by_actor_type text NOT NULL` -
`created_by_user_id UUID NULL FK users` - `sent_at timestamptz NULL` -
`last_error_code text NULL` (safe code, not secret provider response) -
timestamps.

Unique (`idempotency_key`) within the chosen global or provider/channel
scope; define scope in implementation. Do not equate `SENT` with
recipient receipt. For in-app notifications, delivery/read semantics
need separate fields or a read-state table if required. Notification
preferences and recipient consent policies are unresolved and must be
addressed before production email.

### 4.36 `notification_attempts`

Columns: `id UUID PK`, `notification_id UUID NOT NULL FK notifications`,
`attempt_number integer NOT NULL`, `provider_key text NOT NULL`,
`provider_message_id text NULL`, `attempted_at timestamptz NOT NULL`,
`result text NOT NULL` (`ACCEPTED_BY_PROVIDER`, `TRANSIENT_FAILURE`,
`PERMANENT_FAILURE`, `UNKNOWN`; final values reviewed),
`error_code text NULL`, `safe_error_summary text NULL`,
`retry_after timestamptz NULL`, `created_at timestamptz NOT NULL`.
Unique (`notification_id`,`attempt_number`). Do not store credentials,
raw tokens, or unrestricted provider payloads. Provider acceptance is
not guaranteed end-recipient delivery.

### 4.37 `escalation_records`

Columns: - `id UUID PK` - `application_id UUID NULL FK applications` -
`deadline_id UUID NULL FK deadlines` -
`compliance_obligation_id UUID NULL FK compliance_obligations` -
`escalation_type text NOT NULL` - `level integer NOT NULL` (positive;
meaning configured, not universal) -
`target_user_id UUID NULL FK users` - `target_role_key text NULL` -
`triggered_at timestamptz NOT NULL` - `status text/enum NOT NULL`
(suggested `PENDING`, `PROCESSED`, `FAILED`, `CANCELLED`) -
`deduplication_key text NOT NULL` -
`notification_id UUID NULL FK notifications` - `reason text NULL` -
`processed_at timestamptz NULL` - timestamps.

Require a valid target/context combination. Unique deduplication key
within documented scope. Escalation is a recorded workflow action; it
must not change a statutory decision or impose a penalty automatically.

### 4.38 `audit_events`

Append-only trace of material business, security, and administrative
actions.

Columns: - `id UUID PK` - `occurred_at timestamptz NOT NULL` -
`actor_type text NOT NULL` (`USER`, `SYSTEM`, `INTEGRATION`,
`MIGRATION`) - `actor_user_id UUID NULL FK users` -
`actor_label_snapshot text NULL` (safe display label for system/external
actor attribution) - `action_key text NOT NULL` -
`entity_type text NOT NULL` (controlled internal entity key) -
`entity_id UUID NULL` (not a foreign key when a universal FK is
impossible; pair with immutable snapshot and enforce retention policy) -
`institution_id UUID NULL FK institutions` -
`application_id UUID NULL FK applications` - `outcome text NOT NULL`
(e.g. success/failure/denied; controlled) - `reason text NULL` -
`before_summary jsonb NULL` - `after_summary jsonb NULL` -
`rule_version_id UUID NULL FK rule_versions` - `request_id text NULL` -
`correlation_id text NULL` - `ip_address inet NULL` only if justified by
privacy/security policy - `user_agent text NULL` only if justified -
`created_at timestamptz NOT NULL`.

Audit material actions include submission/correction; assignment and
workflow transition; observation/deficiency issue and response; document
upload/version/verification/rejection; EVC schedule/change/completion;
committee proceedings/recommendations; decision/appeal/official
communication; compliance submission/verification/waiver; rule
review/activation; notification attempt/escalation; integration
import/export/reconciliation; and privileged administration. Never log
passwords, session tokens, access tokens, signed URLs, full document
contents, or unnecessary sensitive personal data. Ordinary users must
not update/delete audit history.

### 4.39 `outbox_events`

Durable asynchronous work intent committed in the same transaction as
the originating business change.

Columns: - `id UUID PK` - `event_key text NOT NULL` (stable event
type) - `aggregate_type text NOT NULL` - `aggregate_id UUID NOT NULL` -
`payload jsonb NOT NULL` (minimal, schema-versioned, no secrets) -
`schema_version text NOT NULL` - `created_at timestamptz NOT NULL` -
`available_at timestamptz NOT NULL DEFAULT now()` -
`status text/enum NOT NULL` (`PENDING`, `DISPATCHING`, `DISPATCHED`,
`FAILED`, `DEAD_LETTER`) - `attempt_count integer NOT NULL DEFAULT 0` -
`last_attempt_at timestamptz NULL` - `dispatched_at timestamptz NULL` -
`last_error_code text NULL` - `idempotency_key text NOT NULL` -
`correlation_id text NULL` - `initiated_by_user_id UUID NULL FK users`.

Unique (`idempotency_key`) in its defined scope. Index
(`status`,`available_at`) for dispatcher and
(`aggregate_type`,`aggregate_id`). Dispatcher must claim rows safely
under concurrent workers (e.g. transaction/locking strategy), only mark
dispatched after queue acceptance, and support retries/reconciliation. A
worker must re-check current business state and rule version before
acting.

### 4.40 `integration_sync_runs` (conditional)

For authorised imports/exports/synchronisation only. No integration is
assumed to exist.

Columns: - `id UUID PK` - `integration_key text NOT NULL` -
`direction text NOT NULL` (`IMPORT`, `EXPORT`, `BIDIRECTIONAL` only
where genuinely supported) - `mode text NOT NULL` (`MANUAL_UPLOAD`,
`MANUAL_EXPORT`, `API`, `SCHEDULED` as applicable) -
`status text NOT NULL` (`STARTED`, `SUCCEEDED`, `PARTIAL`, `FAILED`,
`CANCELLED`) - `started_by_user_id UUID NULL FK users` -
`started_at timestamptz NOT NULL` - `finished_at timestamptz NULL` -
`records_read integer NOT NULL DEFAULT 0` -
`records_created integer NOT NULL DEFAULT 0` -
`records_updated integer NOT NULL DEFAULT 0` -
`records_skipped integer NOT NULL DEFAULT 0` -
`records_failed integer NOT NULL DEFAULT 0` -
`source_reference text NULL` - `checksum text NULL` -
`safe_error_summary text NULL` - `correlation_id text NULL` -
timestamps.

Manual/mock integrations must be labelled as such in UI and records. Do
not scrape, claim live integration, or use an unofficial endpoint
without explicit authorisation.

### 4.41 `external_record_links` (conditional)

Maps a local entity to a record in an authorised external system.

Columns: `id UUID PK`, `integration_key text NOT NULL`,
`local_entity_type text NOT NULL`, `local_entity_id UUID NOT NULL`,
`external_record_id text NOT NULL`, `external_record_type text NULL`,
`external_url text NULL` only if verified/authorised,
`first_seen_at timestamptz NOT NULL`,
`last_seen_at timestamptz NOT NULL`,
`last_sync_run_id UUID NULL FK integration_sync_runs`,
`sync_status text NOT NULL`, `conflict_metadata jsonb NULL`, timestamps.

Unique (`integration_key`,`external_record_type`,`external_record_id`)
where provider semantics permit. A generic entity ID cannot have a
conventional FK to every possible table; validate through a domain
service and audit every mapping. Never treat a supplied external
identifier as proof of identity without reconciliation.

### 4.42 `operational_incidents` (optional)

Use only if the application needs durable, operator-visible incident
tracking. Do not duplicate detailed infrastructure/provider logs.

Columns: `id UUID PK`, `incident_key text UNIQUE NOT NULL`,
`severity text NOT NULL`, `status text NOT NULL`,
`component text NOT NULL`, `opened_at timestamptz NOT NULL`,
`resolved_at timestamptz NULL`, `summary text NOT NULL`,
`safe_details jsonb NULL`, `correlation_id text NULL`,
`assigned_to_user_id UUID NULL FK users`, timestamps. Never include
secrets or unrestricted payload dumps.

------------------------------------------------------------------------

## 5. Required join/history tables and conditional links

Use explicit join tables where the relationship is many-to-many or must
preserve the exact version reviewed:

-   `workflow_rule_links(workflow_definition_id, rule_version_id, relationship_type)`
-   `workflow_history_rule_links(workflow_stage_history_id, rule_version_id)`
-   `observation_response_documents(response_id, document_id, document_version_id)`
-   `document_obligation_links(document_id, document_version_id, compliance_obligation_id, link_purpose)`
-   `document_deficiency_links(document_id, document_version_id, deficiency_id, link_purpose)`
-   `document_communication_links(document_id, document_version_id, official_communication_id, link_purpose)`
    if communications may reference multiple documents.
-   `committee_member_assignments` if committee membership/attendance
    tracking is confirmed in scope.
-   `notification_recipients` if a single notification intent can target
    multiple users; otherwise use one notification per recipient.
-   `notification_read_states` if in-app read/unread status is required
    and notifications can be shared; otherwise use per-recipient
    notifications.
-   `document_expiry_tracking` is **not** required if declared expiry
    date, provenance, and status are fully represented in
    `document_versions` and deadlines can be linked to a version. Do not
    create duplicate expiry fields without a clear ownership decision.

For each join table, use FKs to both parents, an appropriate composite
unique/primary key, `created_at`, and any version-specific FK required.
Avoid storing comma-separated IDs or arbitrary unvalidated JSON arrays
instead of relational links.

------------------------------------------------------------------------

## 6. Relationship/cardinality rules

  ---------------------------------------------------------------------------------
  Parent / source   Child / target    Cardinality       Rule
  ----------------- ----------------- ----------------- ---------------------------
  Institution       Application       1:N               Every application belongs
                                                        to exactly one institution

  Application       Application       1:N               Every application has one
  category                                              supported category

  Application       Application       1:N               Revisions are immutable and
                    revision                            ordered per application

  Application       Workflow instance 1:N over time     Retain superseded/restarted
                                                        workflows; number of
                                                        concurrent active instances
                                                        unresolved, recommended max
                                                        one

  Workflow          Stage definitions 1:N               Stages belong to a single
  definition                                            immutable definition
                                                        version

  Workflow          Transition        1:N               Transitions only connect
  definition        definitions                         stages from the same
                                                        definition

  Workflow instance Stage history     1:N               Append-only

  Application       Assignment        1:N               Reassignment adds history;
                                                        does not overwrite prior
                                                        assignment

  Application       Scrutiny          1:N               Every observation belongs
                    observation                         to a case and workflow
                                                        context

  Observation       Deficiency        1:N/optional      A deficiency may originate
                                                        from an observation; not
                                                        all observations need
                                                        formal deficiency

  Deficiency        Response          1:N               Multiple response revisions
                                                        preserved

  Application       EVC event         0:N               Only when route
                                                        requires/allows EVC

  EVC event         Member assignment 1:N               Preserve assignment history

  Application       Committee         0:N               Route/category-specific
                    proceeding                          

  Committee         Recommendation    0:N               Recommendation is not a
  proceeding                                            decision

  Application       Decision record   0:N over time     Corrections/supersessions
                                                        retained; current
                                                        authoritative decision
                                                        policy must be defined

  Decision record   Appeal case       0:N               Only if verified rule
                                                        allows

  Application       Official          0:N               Formal records separate
                    communication                       from notifications

  Obligation        Obligation        1:N               Definition versions remain
  definition        instance                            immutable

  Institution       Obligation        1:N               Every obligation is
                    instance                            institution-scoped

  Obligation        Evidence          1:N               Each evidence item
                                                        references exact document
                                                        version

  Document          Document version  1:N               Immutable version records

  Document version  Verification      1:N               Verification history
                                                        append-only

  Notification      Attempt           1:N               Delivery attempts are
                                                        separate from notification
                                                        intent

  Rule source       Rule version      1:N               A source can ground
                                                        multiple rules

  Rule version      Workflow          M:N               Via `workflow_rule_links`

  Integration sync  External record   1:N/optional      Only for authorised
  run               link                                integration

  Business          Audit + outbox    1:N               Written transactionally
  transaction                                           with material state change
  ---------------------------------------------------------------------------------

------------------------------------------------------------------------

## 7. Constraints, validation, and database-level invariants

These are required invariants. Use DB constraints whenever feasible;
repeat validation in the service layer for clear errors. Cross-table
conditions may require triggers or transactional domain-service checks.

### 7.1 General

-   Primary keys, foreign keys, uniqueness, `NOT NULL`, `CHECK`, and
    indexes must be explicit.
-   Validate all user-supplied data at API boundaries with Zod and again
    with database constraints where practical.
-   Use `CHECK (valid_until IS NULL OR valid_until > valid_from)` for
    memberships and analogous date/time checks.
-   Use non-negative checks for byte size, counters, and version
    numbers; positive checks for levels and attempt numbers.
-   Use unique constraints for internal application reference,
    (`rule_key`,`version_number`), (`workflow_key`,`version_number`),
    (`application_id`,`revision_number`),
    (`document_id`,`version_number`),
    (`notification_id`,`attempt_number`), and all idempotency keys.
-   Use partial unique indexes for "one current/active row" only where
    the business invariant is confirmed. Document each partial-index
    predicate.
-   Do not use cascading deletes for regulated/history records.

### 7.2 Workflow

-   A workflow instance must use one exact approved workflow definition
    version and retain the version/scope snapshot.
-   Its current stage and every history stage must belong to that
    definition version.
-   A transition is allowed only if a matching transition definition
    exists, is enabled, its guard conditions pass, the actor is
    authorised, and required evidence/reason is present.
-   Validate route selection against institution type, category/purpose,
    academic cycle, and all other reviewed applicability predicates.
-   The stage order is not a substitute for transition rules.
-   Every transition writes history, audit, and required outbox records
    atomically.
-   A workflow route change creates a new workflow instance or explicit
    versioned migration event; it does not rewrite history.

### 7.3 Regulatory rules

-   No rule activation without source verification, exact citation,
    review approval, effective period, payload-schema validation, and
    tests.
-   Rule versions are immutable after approval/activation. Changes
    create a new version.
-   Record which exact rule version(s) were used for route selection,
    deadline calculation, deficiency issuance, compliance obligations,
    and relevant decisions.
-   A newer rule version must not silently rewrite historical records or
    due dates.
-   Date arithmetic must explicitly identify calendar days vs working
    days, holidays, triggering event, inclusion/exclusion of start date,
    timezone, and cutoff if the source specifies them. If the source
    does not specify a needed semantic, keep the rule inactive pending
    authorised interpretation.

### 7.4 Application, decision, and appeal

-   Application lifecycle state is not the same as official decision
    outcome.
-   A decision must have an authorised human actor and source/authority
    context as required by policy.
-   Recommendation records cannot write the decision outcome.
-   Appeal deadlines are rule-version-specific. Do not hard-code one
    duration globally.
-   Formal communication issuance is separate from notification
    delivery.
-   Decision/communication corrections are new linked records or
    append-only events, not silent updates.

### 7.5 Documents

-   Document bytes are private by default and are stored outside
    PostgreSQL.
-   A document version must have a provider, bucket, object key, upload
    actor, timestamp, and validation state.
-   Validate actual file type/size and safe content-disposition; do not
    trust filename or MIME type supplied by the client.
-   Every read/download checks the authenticated actor, resource
    ownership, institution boundary, classification, and role/assignment
    policy.
-   Link evidence to the exact document version reviewed.
-   Issue temporary URLs only after backend authorisation and only if
    the provider supports them with documented security semantics.
-   Expiry dates must retain provenance and must not be treated as
    verified merely because extracted or user-entered.
-   Cryptographic digital-signature validation must not be claimed
    unless implemented with a real validator and tests.

### 7.6 Deadlines, notifications, and escalations

-   Each deadline has an explicit calculation snapshot and exact rule
    version.
-   Date-only deadlines remain dates; instants remain `timestamptz`.
-   A scheduled worker must re-check current case/obligation status, due
    date, rule version, cancellation/supersession, and idempotency
    before acting.
-   A notification row represents intent; attempt rows represent
    provider interactions. `SENT` is not proof of receipt.
-   Retry handling must be idempotent and bounded/configured; preserve
    safe failure details.
-   Escalation records need a stable deduplication key and must not
    cause a statutory outcome/penalty.
-   A change in deadline or state must cancel/suppress stale pending
    jobs through state re-check and/or explicit cancellation.

### 7.7 Audit and outbox

-   Audit history is append-only for application-level users and normal
    services.
-   Do not log secrets, raw document content, signed URLs, or
    unnecessary personal data.
-   Outbox rows are written in the same transaction as the source state
    change.
-   Concurrent dispatchers must safely claim pending rows.
-   Duplicate delivery is possible in distributed systems; consumers
    must be idempotent.
-   A reconciliation path must find old pending/dispatching rows and
    failed jobs.
-   Store a correlation/request ID across API request → transaction →
    outbox → worker → notification attempt where possible.

------------------------------------------------------------------------

## 8. Indexing strategy

Create indexes based on actual query plans; the following are baseline
candidates, not permission to add every index blindly.

  -----------------------------------------------------------------------------------------------------
  Table                       Candidate index                                   Why
  --------------------------- ------------------------------------------------- -----------------------
  `applications`              (`institution_id`,`created_at` DESC)              Institution workspace

  `applications`              (`status`,`updated_at` DESC)                      Case list/operations
                                                                                dashboard

  `applications`              (`category_id`,`academic_cycle`,`status`)         Route/cycle reporting

  `applications`              unique (`internal_reference`)                     Direct lookup

  `application_revisions`     unique (`application_id`,`revision_number`)       Revision ordering

  `application_assignments`   (`assignee_user_id`,`unassigned_at`)              My assigned cases

  `application_assignments`   (`application_id`,`unassigned_at`)                Assignment history

  `workflow_instances`        (`application_id`,`created_at` DESC)              Current/history
                                                                                workflows

  `workflow_instances`        (`status`,`updated_at`)                           Workflow operations

  `workflow_stage_history`    (`workflow_instance_id`,`occurred_at`)            Timeline

  `scrutiny_observations`     (`application_id`,`created_at` DESC)              Case review

  `deficiencies`              (`status`,`response_due_date`)                    Deficiency pendency

  `evc_events`                (`status`,`scheduled_start_at`)                   EVC calendar

  `committee_proceedings`     (`status`,`scheduled_at`)                         Committee calendar

  `compliance_obligations`    (`institution_id`,`status`,`due_date`)            Compliance monitoring

  `compliance_obligations`    (`status`,`due_at`)                               Instant deadlines, if
                                                                                used

  `document_versions`         unique                                            Object lookup
                              (`storage_provider`,`bucket_name`,`object_key`)   

  `document_versions`         (`declared_expiry_date`) where not null           Expiry monitoring

  `deadlines`                 (`status`,`due_date`) and/or (`status`,`due_at`)  Deadline worker; only
                                                                                relevant semantics

  `notifications`             (`status`,`scheduled_for`)                        Dispatcher

  `notification_attempts`     unique (`notification_id`,`attempt_number`)       Attempt history

  `escalation_records`        unique (`deduplication_key`)                      Duplicate prevention

  `audit_events`              (`occurred_at` DESC)                              Audit timeline

  `audit_events`              (`entity_type`,`entity_id`,`occurred_at` DESC)    Entity history

  `audit_events`              (`application_id`,`occurred_at` DESC)             Case audit

  `outbox_events`             (`status`,`available_at`)                         Dispatcher

  `outbox_events`             (`aggregate_type`,`aggregate_id`)                 Event trace

  `integration_sync_runs`     (`integration_key`,`started_at` DESC)             Sync operations
  -----------------------------------------------------------------------------------------------------

Add indexes for foreign-key columns used in joins and deletes/updates.
Verify Prisma migration output and actual PostgreSQL query plans. Avoid
redundant indexes duplicating unique indexes.

------------------------------------------------------------------------

## 9. Status values and enum policy

The suggested statuses in the table definitions are **technical starting
proposals**, not official AICTE outcomes. Before creating Prisma enums,
freeze the values that are truly closed and stable. Regulatory
categories, application purposes, committee types, decision outcomes,
deficiency types, source types, and deadline semantics should usually be
configuration-backed and versioned rather than compiled into immutable
enums.

Keep these status dimensions separate: - application lifecycle; -
workflow-instance lifecycle/current stage; - scrutiny observation
lifecycle; - deficiency lifecycle; - response lifecycle; - EVC event
lifecycle; - committee proceeding lifecycle; - recommendation
lifecycle; - official decision status/outcome; - official communication
issuance/delivery status; - compliance obligation/evidence status; -
document/version/verification status; - deadline lifecycle; -
notification intent status and delivery-attempt result; - escalation
lifecycle; - rule review/activation status; - integration sync status; -
outbox dispatch status.

Do not create a single giant status enum shared across unrelated
modules.

------------------------------------------------------------------------

## 10. Data ownership and security boundaries

1.  **Institution-scoped access:** institution users can access only
    records belonging to their institution(s), and only within their
    membership permissions.
2.  **Case assignment:** staff access may be further restricted by
    assignment, organisational scope, or explicit permissions. Do not
    assume every staff user can see every case.
3.  **Role permissions are necessary but not sufficient:** every
    operation also checks the resource boundary and relevant workflow
    state.
4.  **Document security:** never authorise a download solely because the
    user knows a document UUID or object key.
5.  **Server-side only:** database credentials, storage credentials,
    SMTP credentials, queue credentials, signing secrets, and provider
    tokens must never reach the frontend.
6.  **Sensitive columns:** minimise personal data; restrict
    queries/exports; redact logs; do not include confidential details in
    notification payloads when a secure in-app link is more appropriate.
7.  **Audit access:** audit-log access is itself permission-controlled
    and should be audited.
8.  **Integration imports:** validate, deduplicate, and reconcile
    incoming identifiers. Preserve source, run, and row-level
    provenance. Do not trust imported records blindly.
9.  **No unapproved automation:** no automatic statutory decision,
    penalty, or inferred eligibility result. Rules may validate, route,
    flag, calculate configured deadlines, and recommend review only
    within approved scope.

------------------------------------------------------------------------

## 11. Data flows and transaction requirements

### 11.1 Draft and submit application

1.  Create `applications` row in `DRAFT`.
2.  Save editable form state under validated draft semantics.
3.  On submit, validate mandatory fields/documents against the exact
    active, approved applicability/rule/workflow versions.
4.  In one transaction: create immutable `application_revisions`
    snapshot; update submission fields/status; instantiate
    `workflow_instances`; initialise current stage and append initial
    `workflow_stage_history`; append `audit_events`; insert any required
    `outbox_events`.
5.  Commit. Only then send/queue acknowledgements or downstream jobs.
6.  Return the persisted case reference and status from PostgreSQL.

If no reviewed active workflow matches the case, do not guess. Reject
route activation with a clear operational/configuration error or place
the case in an explicitly configured manual-review holding state; the
choice must be approved and visible.

### 11.2 Scrutiny and deficiency

1.  Create an observation tied to application/workflow/stage and actor.
2.  If process rules require formal deficiency, create `deficiencies`
    with exact source version/citation and configured response due
    semantics.
3.  Create a deadline only when the common deadline engine needs it;
    keep a single authoritative due value.
4.  In one transaction, persist the state, audit, and outbox event.
5.  Institution response creates a new `observation_responses` revision
    and links exact evidence versions.
6.  Review response and record outcome/actor/time. Do not delete earlier
    responses or evidence.

### 11.3 EVC and committees

1.  Check that the application's selected route allows/requires the
    event.
2.  Record schedule and participants; preserve schedule changes.
3.  Store report/minutes as private `documents`/`document_versions`.
4.  Record proceeding and recommendation separately.
5.  A recommendation must not automatically create or confirm an
    official decision.

### 11.4 Decision and formal communication

1.  Check decision actor permission and any required prerequisites.
2.  Persist a human-entered decision with its authority and
    rule/citation context.
3.  In the same transaction append audit and outbox events.
4.  Create a separate `official_communications` record and document when
    formally issued.
5.  Create notification intent separately if a message should be sent.
    Delivery failure does not roll back the official decision or erase
    the issued communication.

### 11.5 Compliance and document validity

1.  Instantiate obligations from an approved definition/version and a
    validated applicability match.
2.  Compute due dates using the rule's exact trigger/calendar/timezone
    semantics and save the calculation snapshot.
3.  Evidence submission references a particular document version.
4.  Verification is a separate actor-attributed record.
5.  Expiry reminders reference the exact document version and
    declared/verified expiry provenance.
6.  Corrections create a new version or audited change; do not silently
    replace the original evidence.

### 11.6 Notification and outbox

1.  Source transaction writes `outbox_events`.
2.  Dispatcher claims eligible rows and sends queue work using
    idempotency.
3.  Worker reloads current source record and re-checks state, deadlines,
    rule versions, access, and cancellation.
4.  Persist `notifications` intent and `notification_attempts` results
    with safe error details.
5.  Retry transient failures under configured policy; mark permanent
    failures and expose them operationally.
6.  Reconcile stuck outbox rows and jobs. Do not claim delivery solely
    from queue acceptance.

------------------------------------------------------------------------

## 12. Prisma and migration guidance

-   Use Prisma models for relational entities and explicit relation
    names where multiple FKs target the same model.
-   Use `@map`/`@@map` consistently if code uses camelCase and
    PostgreSQL uses snake_case; do not mix conventions arbitrarily.
-   Prefer `@db.Uuid`, `@db.Timestamptz(6)`, `@db.Date`, `@db.JsonB`,
    and appropriate PostgreSQL native types where supported by the
    selected Prisma version.
-   `citext` requires PostgreSQL extension management and may not be
    necessary; if used, document and test the extension migration.
    Otherwise normalise email in the application and define the
    uniqueness rule explicitly.
-   Do not rely on Prisma schema alone for partial unique indexes,
    exclusion constraints, triggers, or advanced `CHECK` constraints if
    the selected Prisma version cannot express them. Add reviewed SQL
    migrations and test them against Neon.
-   Avoid circular FK creation problems
    (`applications.current_revision_id` ↔ `application_revisions`,
    `documents.current_version_id` ↔ `document_versions`,
    decision/communication links). Prefer deriving current child by
    query or using one-directional relations unless the pointer
    materially improves correctness.
-   Use database transactions for related writes; test concurrent
    submissions, transitions, dispatcher claims, and duplicate
    idempotency keys.
-   All migrations must be versioned, committed, reviewed, and run
    against a development branch/database before production. Never
    manually mutate production schema without a migration.
-   Seed only technical roles/permissions and clearly labelled demo
    records. Do not seed fake official decisions or imply that mock
    institutions/official records are real.
-   Keep secrets in environment variables/secret manager, never in
    `schema.prisma`, migrations, seeds, logs, or frontend environment
    variables.

------------------------------------------------------------------------

## 13. Implementation sequence

### Phase A --- foundation and access

1.  `users`, role/permission tables, institution, membership.
2.  Application category/configuration.
3.  Auth identity mapping only after provider decision.
4.  Audit event base model and access-control tests.

### Phase B --- application and workflow

1.  Applications, revisions, assignments.
2.  Rule sources and rule versions.
3.  Workflow definitions, stages, transitions, rule links.
4.  Workflow instances and stage history.
5.  Transactional transition service and audit/outbox integration.

### Phase C --- review and official process

1.  Scrutiny observations, deficiencies, response revisions.
2.  EVC events/member assignments only where route requires.
3.  Committee proceedings and recommendations.
4.  Decision records, appeals only for verified routes, official
    communications.

### Phase D --- compliance and documents

1.  Document metadata/version/verification.
2.  Object-storage adapter after provider verification.
3.  Compliance obligation definitions/instances/evidence.
4.  Deadline calculation and expiry monitoring.

### Phase E --- operations and automation

1.  Deadlines, notification intents/attempts, escalation records.
2.  Outbox dispatcher and worker idempotency.
3.  Integration sync/external links only if authorised integrations are
    available.
4.  Operational monitoring and reconciliation.

Do not implement the entire schema in one migration merely because all
entities are listed. Add tables with the corresponding feature and
tests; preserve the intended model and invariants.

------------------------------------------------------------------------

## 14. Decisions that remain unresolved (must not be silently guessed)

  ------------------------------------------------------------------------------
  Decision                       Why it matters          Safe rule until decided
  ------------------------------ ----------------------- -----------------------
  Authentication provider and    Determines identity     Keep `User`
  session ownership              schema and              provider-neutral; defer
                                 provider-owned tables   `AuthIdentity`
                                                         implementation

  Exact roles/permissions and    Determines RBAC and     Use explicit permission
  organisational hierarchy       case visibility         keys and reviewed role
                                                         matrix; no broad
                                                         implicit access

  Institution type/category      Determines intake and   Enable only reviewed
  catalogue and application      routing                 categories; no invented
  fields                                                 categories

  APH applicability and current  Determines workflow,    Keep unverified rules
  amendments as of               eligibility, deadlines, inactive
  implementation                 appeal scope            

  Workflow concurrency/restart   Determines uniqueness   Preserve every
  rules                          of active workflow      instance; do not impose
                                                         a conflicting unique
                                                         index without approval

  Decision outcomes, committee   Policy-dependent values Use controlled
  types, communication types                             configuration; do not
                                                         infer from UI labels

  Date                           Determines deadline     Store date vs instant
  arithmetic/calendar/timezone   correctness             explicitly; block rules
  semantics                                              with missing semantics

  Retention, archival, purge,    Determines deletion     Restrict deletion; do
  legal hold                     behaviour               not invent retention
                                                         periods

  Neon Object Storage API, ACLs, Determines object-key   Keep storage behind
  quotas, signed URLs            and access              adapter; verify before
                                 implementation          production use

  Redis/BullMQ deployment        Determines worker       PostgreSQL outbox
                                 operations only         remains durable source
                                                         of work intent

  SMTP provider, template        Determines notification Do not send production
  approval, consent/preferences  delivery                email until configured
                                                         and tested

  Real-time provider/transport   Determines transient UI Database remains
                                 updates                 authoritative; use
                                                         polling/manual refresh
                                                         fallback if approved

  AICTE integration endpoint,    Determines external     Manual/mock flow
  access and data mapping        links/import/export     clearly labelled until
                                                         authorised integration
                                                         exists

  Exact legal/regulatory         Determines compliance   Require human review
  interpretation of each rule    correctness             and source traceability
  ------------------------------------------------------------------------------

------------------------------------------------------------------------

## 15. Acceptance checklist for the database

Before calling the schema implementation complete, verify all of the
following:

-   [ ] Every implemented table has a documented purpose, primary key,
    timestamps policy, foreign keys, deletion policy, and indexes.
-   [ ] All relationships in the implemented modules have real FK
    constraints or a documented reason a generic reference cannot use an
    FK.
-   [ ] Institution access boundaries are tested at the service/API
    level, including document downloads and exports.
-   [ ] A case cannot use an unreviewed/inactive rule or workflow
    version.
-   [ ] Every active workflow definition has valid stages, an entry
    stage, and valid transitions; cross-definition stage links are
    rejected.
-   [ ] Every material transition atomically writes current state,
    workflow history, audit, and outbox records.
-   [ ] Concurrent duplicate submissions/transitions and duplicate
    idempotency keys are handled safely.
-   [ ] Application revisions, workflow histories,
    observations/responses, document versions/verification, decisions,
    communications, and audit history are not silently overwritten.
-   [ ] Recommendation, decision, official communication, notification
    intent, and delivery attempt are separate records.
-   [ ] Deadline date-vs-instant semantics, triggering event, timezone,
    calendar logic, and rule version are explicit and tested.
-   [ ] Worker retries re-check current source state and are idempotent;
    stale reminders/escalations are suppressed.
-   [ ] Object storage is private and all access passes server-side
    authorisation; no durable public URLs leak.
-   [ ] Document evidence references the exact version reviewed;
    checksums and date provenance are stored when available.
-   [ ] No claim of digital-signature verification exists without a real
    tested verifier.
-   [ ] No autonomous statutory decision/penalty behaviour is present.
-   [ ] Audit logs redact secrets and sensitive payloads and are
    append-only to ordinary users.
-   [ ] Outbox reconciliation and failed notification visibility are
    tested.
-   [ ] Mock/manual integrations are labelled; no unavailable API is
    simulated as live.
-   [ ] All unresolved decisions above are recorded in ADRs before the
    affected production feature is enabled.
-   [ ] Prisma migrations run cleanly on a development Neon database and
    have rollback/recovery guidance.
-   [ ] Seed data is explicitly fictional/demo and cannot be confused
    with official records.

------------------------------------------------------------------------

## 16. Source alignment and limits

This schema is aligned to the project's companion documents: -
`project-overview.md` --- conceptual data model, system boundaries,
technology decisions, workflows, compliance, communications, audit and
integration guardrails. - `project-requirements.md` ---
functional/non-functional requirements, role restrictions, validation,
acceptance criteria, source traceability and unresolved decisions. -
`project-architecture.md` --- module boundaries, domain entities,
relational integrity, object-storage metadata, transactional outbox,
notifications, real-time provider-neutral approach and operational
requirements. - `Tech Stack Reasoning.txt` --- React/TypeScript/Vite
frontend; Node.js/Express/TypeScript backend; Neon PostgreSQL with
Prisma; proposed private Neon Object Storage; optional BullMQ/Redis;
Nodemailer/SMTP; Recharts, FullCalendar, OpenAPI, GitHub and testing
tools.

The AICTE Approval Process Handbook 2024--2027 supplied to the project
is a regulatory source candidate. It does not by itself establish that
all rules are current or applicable to every case. Regulatory route,
deadlines, appeal windows, document requirements, committee routes, and
approval criteria must be individually cited, reviewed, versioned,
tested, and activated only by an authorised process.

**Do not treat this file as a guarantee that the database or system is
"100% legally correct."** The schema is explicit about known
requirements and unresolved choices; accuracy depends on resolving those
choices, validating the exact current official sources, and testing the
implementation.

---

# Normative implementation addendum — revision 2

**Purpose:** This addendum is authoritative wherever the earlier body presents alternatives,
conditional implementations, or a conceptual diagram that could be interpreted inconsistently.
It does not silently resolve policy, provider, or regulatory questions that require external
confirmation. Antigravity must read this addendum before generating Prisma models or migrations.

## A. Canonical decisions for the first implementation

These decisions are fixed for the initial implementation unless changed through a reviewed ADR:

1. **Database:** Neon PostgreSQL, accessed through Prisma. Do not introduce another database.
2. **Primary keys:** UUID primary keys for domain tables. Use `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()` on mutable domain records. Append-only history/event tables use `created_at` and do not expose ordinary update/delete operations.
3. **Time:** Store actual instants in `timestamptz` in UTC. Store policy-defined calendar dates as PostgreSQL `date`. Every deadline/rule must explicitly declare which semantic applies and the applicable timezone/calendar before activation.
4. **Amounts:** If a future module stores monetary amounts, use `numeric` with explicit currency; do not use floating point.
5. **Enums:** Use checked text/configuration values for policy-driven statuses during the prototype. Centralise constants in the domain layer and validate them in the database with `CHECK` constraints where the vocabulary is stable. Do not derive statutory values from UI labels.
6. **JSON:** `jsonb` is allowed only for versioned rule parameters, provider payloads that are not the relational source of truth, and audit snapshots with an explicit schema/version. Do not store relationship IDs, roles, workflow stages, document evidence, or status history as JSON arrays.
7. **Authentication:** Keep the domain `users` table provider-neutral. Do not create provider-specific identity/session tables until an authentication provider is selected. Never store raw passwords, session secrets, API keys, or bearer tokens in domain tables.
8. **Workflow concurrency:** Preserve multiple workflow instances per application. Until the restart/concurrency policy is approved, do not add a uniqueness constraint that allows only one active instance. The service must flag ambiguous active instances for human/admin resolution rather than silently choosing one.
9. **Application revisions:** Revisions are immutable and numbered from 1 per application. Enforce `UNIQUE(application_id, revision_number)`. A revision is a submitted snapshot; edits after submission create a new revision rather than mutating the prior snapshot.
10. **Rule/workflow versions:** Published rule versions and workflow definitions/stages/transitions are immutable. Changes create a new version. Activation requires recorded reviewer/approver, effective period, source citation, and tests. A draft or unverified version cannot govern a live case.
11. **Document storage:** Store metadata and object keys in PostgreSQL, file bytes in the configured private object store. Use a storage adapter; do not assume public URLs, signed-URL lifetime, ACL semantics, or a specific SDK until verified against the selected Neon Object Storage API.
12. **Integration:** No AICTE system is considered connected unless an authorised endpoint and credentials have been verified. Until then, label imports/exports/demo data as manual or mock.
13. **Statutory decisions:** The system may record recommendations and authorised decisions; it must not autonomously issue statutory approvals/rejections, penalties, or legal determinations.
14. **Excluded by current decision:** Better Auth and Neon Realtime are not selected. Do not install or enable them by inference. Authentication/session implementation and live-update transport remain blocked decisions; polling/manual refresh is the safe initial UI fallback.
15. **Background work:** A PostgreSQL outbox is the durable record of work to be delivered. Redis/BullMQ is optional until the deployment is chosen. A worker must be idempotent and re-check current state before sending a reminder or executing an escalation.

## B. Canonical relationship and foreign-key policy

Every relationship listed below must be represented by a real PostgreSQL foreign key, except where this addendum explicitly marks a generic external reference. Use `ON DELETE RESTRICT` for regulatory/business history and `ON DELETE CASCADE` only for pure join rows that have no independent audit meaning. Do not use cascading deletion for applications, revisions, decisions, workflow history, audit events, communications, compliance evidence, or document versions.

| Relationship | Canonical cardinality and constraint |
|---|---|
| `institution_memberships.user_id → users.id` | Many memberships per user; FK, unique `(institution_id, user_id)` unless membership history is explicitly modelled as dated episodes. |
| `institution_memberships.institution_id → institutions.id` | One institution to many memberships; FK. |
| `user_roles.user_id → users.id` and `user_roles.role_id → roles.id` | Many-to-many via join table; unique `(user_id, role_id)` plus scope columns if roles are scoped. |
| `role_permissions.role_id → roles.id` and `role_permissions.permission_id → permissions.id` | Many-to-many; unique pair. |
| `applications.institution_id → institutions.id` | Required FK; restrict deletion. |
| `applications.application_category_id → application_categories.id` | Required FK; category must be active and applicable at submission time. Preserve the category/version snapshot on the submitted revision if catalogue entries can change. |
| `application_revisions.application_id → applications.id` | Required FK; unique `(application_id, revision_number)`; restrict deletion. |
| `application_assignments.application_id → applications.id`, `user_id → users.id` | Required FKs; append assignment history rather than overwriting it. Add uniqueness only for a specifically defined active-assignment rule. |
| `workflow_instances.application_id → applications.id`, `workflow_definition_id → workflow_definitions.id` | Required FKs; multiple instances per application are permitted. |
| `workflow_stage_definitions.workflow_definition_id → workflow_definitions.id` | Required FK; unique `(workflow_definition_id, stage_key)` and `(workflow_definition_id, sequence_number)` where sequence is required. |
| `workflow_transition_definitions.workflow_definition_id`, `from_stage_id`, `to_stage_id` | Required FKs. Enforce that both stages belong to the same workflow definition through a composite FK or migration-safe trigger/service transaction. Reject self-transitions unless the workflow explicitly allows them. |
| `workflow_rule_links.workflow_definition_id → workflow_definitions.id`, `rule_version_id → rule_versions.id` | Required FKs; unique `(workflow_definition_id, rule_version_id, relationship_type)`. |
| `workflow_stage_history.workflow_instance_id → workflow_instances.id` | Required FK; append-only. Preserve the stage/rule version used for each transition. |
| `scrutiny_observations.application_id → applications.id`, `workflow_instance_id → workflow_instances.id`, `created_by_user_id → users.id` | Required FKs where these fields are present; enforce that the workflow instance belongs to the same application. |
| `deficiencies.application_id → applications.id`, optional `observation_id → scrutiny_observations.id` | Application FK required; observation FK optional. If both are present, ensure the observation belongs to the same application. |
| `observation_responses.deficiency_id → deficiencies.id`, `created_by_user_id → users.id` | Required FKs; preserve each response submission as history. |
| `evc_events.application_id → applications.id` | Required FK. Create only when an approved workflow route requires/allows EVC. |
| `evc_member_assignments.evc_event_id → evc_events.id`, `user_id → users.id` | Required FKs; unique `(evc_event_id, user_id, assignment_role)` if assignment roles are defined. |
| `committee_proceedings.application_id → applications.id` | Required FK; route-specific, not universal. |
| `recommendations.committee_proceeding_id → committee_proceedings.id`, `created_by_user_id → users.id` | Required FKs; recommendation remains distinct from decision. |
| `decision_records.application_id → applications.id`, optional `supersedes_decision_id → decision_records.id`, `recorded_by_user_id → users.id` | Application and actor FKs required; supersedes FK nullable. Prevent self-reference and cycles in service logic. Do not assume one decision per application. |
| `appeal_cases.decision_record_id → decision_records.id`, `application_id → applications.id` | Required FKs if appeal cases are implemented; validate that the decision belongs to the same application and that an applicable, verified rule permits the appeal. |
| `official_communications.application_id → applications.id`, optional `decision_record_id → decision_records.id`, `created_by_user_id → users.id` | Required application/actor FKs; decision FK nullable. If multiple documents are attached, use `document_communication_links`, not a single comma-separated field. |
| `compliance_obligations.definition_id → compliance_obligation_definitions.id`, `institution_id → institutions.id`, optional `application_id → applications.id` | Definition and institution FKs required; application context nullable. If both institution and application are set, enforce consistency with the application’s institution. |
| `compliance_evidence.compliance_obligation_id → compliance_obligations.id`, `document_version_id → document_versions.id` | Required FKs; evidence must point to the exact version reviewed. |
| `documents.institution_id → institutions.id` and optional `application_id → applications.id` | Institution FK required if the document is institution-owned; application FK nullable. If both exist, enforce that the application belongs to the same institution. Do not use a free-form polymorphic `owner_type/owner_id` as the only relationship. |
| `document_versions.document_id → documents.id` | Required FK; unique `(document_id, version_number)`. File bytes remain in object storage; object key is not a public URL. |
| `document_verifications.document_version_id → document_versions.id`, `verified_by_user_id → users.id` | Required FKs; append verification history. |
| `observation_response_documents.response_id → observation_responses.id`, `document_id → documents.id`, `document_version_id → document_versions.id` | Use when responses can reference evidence. FKs required; enforce that the version belongs to the document. Unique tuple includes response and exact version. |
| `document_obligation_links.document_id → documents.id`, `document_version_id → document_versions.id`, `compliance_obligation_id → compliance_obligations.id` | Use when one document version can evidence multiple obligations; FKs required and version/document consistency enforced. |
| `document_deficiency_links.document_id → documents.id`, `document_version_id → document_versions.id`, `deficiency_id → deficiencies.id` | Use when a deficiency can reference multiple exact document versions; FKs required and version/document consistency enforced. |
| `document_communication_links.document_id → documents.id`, `document_version_id → document_versions.id`, `official_communication_id → official_communications.id` | Use for communication attachments; FKs required and version/document consistency enforced. |
| `deadlines.application_id → applications.id`, optional `rule_version_id → rule_versions.id`, optional `document_version_id → document_versions.id` | Application FK required; rule/document FKs nullable. Record trigger event, date-vs-instant semantics, timezone/calendar, due value, calculation inputs, and rule version. |
| `notifications.application_id → applications.id` nullable, `deadline_id → deadlines.id` nullable, `recipient_user_id → users.id` when one-recipient-per-notification is chosen | Context FKs nullable as appropriate. For the first implementation, use one notification intent per recipient; do not add shared notification-recipient/read-state tables unless multi-recipient shared notifications are actually required. |
| `notification_attempts.notification_id → notifications.id` | Required FK; append attempts with provider response category, not secrets. |
| `escalation_records.application_id → applications.id`, optional `deadline_id → deadlines.id`, `triggered_by_user_id → users.id` nullable | Application FK required; retain history and triggering rule/state. |
| `audit_events.actor_user_id → users.id` nullable | Nullable for system/unknown actors; preserve actor snapshot/reference where user deletion is legally permitted. Audit is append-only and must not store secrets. |
| `outbox_events.initiated_by_user_id → users.id` nullable | Nullable for system jobs; unique idempotency/event key; delivery state and retries persisted. |
| `integration_sync_runs` and `external_record_links` | Implement only after authorised integration is confirmed. When implemented, use real FKs between sync runs and external links, unique external-system identity keys, and never store credentials in these tables. |
| `auth_identities` | Do not implement until provider selection; then enforce unique `(provider, provider_subject)` and FK to `users`. Provider-owned session/token tables are not specified here. |

### Generic references

A column pair such as `(entity_type, entity_id)` cannot have an ordinary FK to multiple target tables. Avoid it for core business relationships. If a generic reference is unavoidable for a non-core feature, use a reviewed resource-link abstraction with a controlled target registry and explicit service-level referential-integrity tests. It must not replace the concrete FKs above.

## C. Required constraint and deletion conventions

- Use `NOT NULL` for required FKs and required business fields; use nullable fields only where the relationship is explicitly optional above.
- Use `UNIQUE` for natural identifiers only when uniqueness scope is defined (for example institution registration number plus issuing authority, if that identifier is verified as unique).
- Use `CHECK` constraints for positive revision/version/sequence numbers, nonnegative retry counts, valid date ranges (`ends_at IS NULL OR ends_at > starts_at`), and consistent state fields where possible.
- Use partial unique indexes only after the business invariant is approved. Do not invent a “one active workflow” or “one current decision” index while policy is unresolved.
- Use `ON DELETE RESTRICT` for parents of retained business records. Use `ON DELETE CASCADE` for pure join tables such as role-permission and workflow-rule links only when the parent definition itself is deletable; published regulatory versions should instead be archived/retired.
- Prefer `ON UPDATE RESTRICT`; primary keys should not change.
- Avoid hard deletion of users who appear in audit/history. Deactivate accounts and retain the historical actor reference. Define formal retention and purge rules before any scheduled deletion is built.
- Ensure every FK that expresses cross-record consistency is paired with a composite FK where practical or a transaction-safe domain-service check plus tests. Examples: workflow stage belongs to the workflow definition; observation and workflow instance refer to the same application; document version belongs to the referenced document; application and institution contexts agree.
- Use optimistic concurrency (`version` integer or `updated_at` comparison) for mutable records exposed to concurrent staff edits. State transitions must run in a transaction and verify the expected prior state.
- Do not rely on Prisma validation alone for database integrity. Add PostgreSQL constraints/indexes through reviewed SQL migrations where Prisma schema syntax cannot express the invariant.

## D. Required complete relationship inventory

The table in section B is the authoritative FK inventory for the first implementation. The earlier ER diagram is intentionally a high-level illustration and is not a complete FK specification. The join tables listed in section 5 are not optional if the corresponding multi-document/multi-rule relationships are implemented. For each implemented relation, Antigravity must record: source table/column, target table/column, cardinality, nullability, unique constraint, delete/update action, consistency invariant, and automated test. Any omitted relation must be explicitly marked “not implemented in this release” in the implementation report, not silently dropped.

## E. Decisions still blocked — do not guess

The following cannot be safely decided by a database design alone and remain blocked until the project owner/provider/regulatory reviewer confirms them:

1. Authentication and session provider, including adapter/session ownership.
2. Exact role/permission matrix, organisation hierarchy, and whether users can hold multiple institution-scoped roles.
3. Exact institution/application category catalogue and required intake fields.
4. Current applicable AICTE handbook, amendments, circulars, corrigenda, directions, court/legal orders, and which provision applies to each application category and cycle.
5. Rule-specific deadlines, appeal eligibility/windows, document validity, calendars, timezone, pause/restart rules, and escalation policy.
6. Which application categories require scrutiny, EVC, SAC/SHC/committee proceedings, or any other route; no universal route is to be inferred.
7. Definition of a current authoritative decision, corrections/supersession, and permitted outcome vocabulary.
8. Workflow restart and concurrent-instance policy.
9. Retention, archival, deletion, legal hold, and purge periods.
10. Verified Neon Object Storage API, private access controls, object-key rules, signed URL behaviour, limits and billing.
11. Redis/BullMQ host, SMTP provider, email template approval, consent/preferences, deployment hosts and secrets management.
12. Real-time transport, if needed beyond polling.
13. Authorised AICTE integration endpoints, credentials, permitted data exchange and reconciliation process.
14. Whether committee member attendance, multiple notification recipients, read receipts, OCR, signatures, or operational incident management are in scope.

For each blocked decision, create an ADR containing owner, decision, rationale, date, consequences, and affected migrations/modules. Do not mark a dependent feature production-ready until the decision is resolved.

## F. Antigravity execution contract

Before writing migrations, Antigravity must:

1. Read `project-overview.md`, `project-requirements.md`, `project-architecture.md`, `Tech Stack Reasoning.txt`, and this complete schema.
2. Produce an entity/relationship inventory and compare it against section B before coding.
3. Produce the proposed Prisma schema and migration plan for review; do not claim that this Markdown file is executable SQL or a validated Prisma schema.
4. Split migrations by module and test them against a development Neon database.
5. Add DB-level constraints, indexes, and transaction/service tests for the invariants above.
6. Seed only fictional/demo records clearly labelled as such.
7. Report each table and relation implemented, deferred, or blocked; list all deviations from this specification.
8. Stop and ask for a decision rather than choosing a provider, statutory interpretation, legal deadline, role permission, or workflow route that this document marks unresolved.
9. Never overwrite or delete the project’s existing documentation without explicit approval.
10. Treat regulatory rules as inactive until they have exact source citations, version/effective dates, human review/approval, and passing tests.

**Validation status:** This revision makes the logical design more internally prescriptive, but it is not yet a migration-tested schema and does not certify legal/regulatory correctness. Those require the blocked decisions to be resolved and the generated Prisma migrations and tests to be reviewed.

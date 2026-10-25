# Source audit supplement — PS SIH26262 and supplied AICTE APH

**Audit date:** 24 October 2026  
**Sources reviewed:** `PS SIH26262.pdf` (Problem Statement ID 26262) and `AICTE APH 2024-2027.pdf` (Approval Process Handbook 2024–25 to 2026–27, supplied copy).  
**Preservation rule:** This is an additive supplement. Earlier original and refined content is retained; no existing requirement, screen, schema proposal, endpoint proposal, or architecture section has been deleted or rewritten by this supplement.

## 1. Authority and safe interpretation

- The **PS** is authoritative for the hackathon's required product capabilities and expected prototype outcomes.
- The supplied **APH** is a regulatory reference for configuring applicable workflow rules. It is not evidence that every clause applies to every application, and it is not proof that this is the latest version in force.
- A rule becomes executable only after its applicability to an application category is established and its source clause/version, effective dates, configuration, and approving owner are recorded.
- Where the PS says “such as”, “wherever applicable”, “as prescribed”, “other combinations”, or “where feasible”, implement configurable capability and explicit applicability—not one hard-coded universal route.
- Automated routing, reminders, recommendations, escalation, and summaries must not replace scrutiny, verification, committee functions, or decisions reserved for competent authorities.
- The supplied PS and APH do **not** settle the unresolved technical choices recorded elsewhere (authentication alternative, non-Neon real-time transport, SMTP provider, Redis/worker hosting, production host, or object-storage integration details). These remain open.

## 2. PS requirement-to-document traceability

| PS area / explicit requirement | Required behaviour to demonstrate | Primary documentation locations | Verification / acceptance evidence |
|---|---|---|---|
| A. End-to-end approval workflow automation | Configurable routing for Only Scrutiny, Scrutiny + EVC, EVC + SAC/SHC, Only EVC, and other approved combinations; next-stage movement only when prerequisites and authorised actions are satisfied | `project-requirements.md`; `project-architecture.md`; `DATABASE_SCHEMA_REVISION_2.md`; `api-specifications_FINAL.md`; UI/UX workflow screens | Tests for each configured route, blocked invalid transitions, and audit events; route rules cite applicable APH clause/version |
| A. Return/revert for deficiencies or clarification | Authorised return/revert, reason required, history retained, resubmission/re-review tracked | Requirements; API; schema; UI/UX deficiency and resubmission screens | Permission tests; reason validation; before/after state and actor visible in audit history |
| A. Routine administrative activities, standardised communications, electronic case summaries | Templates and case summaries support staff; official communications remain attributable to authorised actors and approved templates | Requirements; architecture; API; UI/UX | Rendered output and delivery record; no unapproved communication represented as an official order |
| B. Consolidated real-time dashboard | Status across Regions, stages, institutions, responsible officers/committees | Requirements; architecture; API; schema; UI/UX dashboards | Aggregates reconcile to source records; update latency test for the explicitly selected non-Neon transport or approved polling design |
| B. Ageing, timelines, workload, pendency, bottlenecks | Track case age, rule-based target/deadline, ownership and stage duration; metrics derived from authoritative records | Requirements; architecture; schema; API | Boundary tests for ageing/deadline calculations; dashboard totals match query fixtures |
| B. Alerts for approaching/exceeded timelines | Configurable thresholds and notification/escalation policies, never guessed regulatory deadlines | Requirements; architecture; API; schema | Test threshold boundary, duplicate prevention, delivery failure and escalation paths |
| B. Role-based dashboards | Views/actions limited by role, Region, institution, assignment and resource scope | Requirements; architecture; API; schema; UI/UX | Positive and negative authorization tests at API and UI layers |
| B. Complete audit trail | Record application movement, observations, actions, decisions, alerts, submissions, verification, escalation and closure | Requirements; architecture; schema; API; UI/UX audit trail | Append-only or otherwise tamper-evident history design; actor/time/action/target/reason/correlation identifiers present |
| C. EVC queue, scheduling and completion | Queue only applications whose configured route requires EVC; record schedule, changes, assignment, completion and outcome | Requirements; architecture; API; schema; UI/UX EVC screens | Test EVC-required and EVC-not-required paths; overdue and reschedule cases |
| C. EVC reminders and escalation | Timely alerts and escalations based on verified applicable timeline and designated authority | Requirements; architecture; API; schema | Due/overdue simulations and idempotent repeat-job tests |
| D. Time-bound undertakings | Store condition, source, due date, required evidence, linked approval/institution and status | Requirements; architecture; schema; API; UI/UX compliance screens | Create, submit, verify, reject/return and overdue scenarios; rule traceability present |
| D. Online evidence submission and verification | Institution submits evidence; authorised official verifies and records outcome/reason | Requirements; API; schema; UI/UX | Upload/access authorization tests and verification audit records |
| D. Unfulfilled undertaking escalation | Reminder/escalation after configured deadline and authorised workflow rule | Requirements; architecture; schema; API | Deadline simulations and escalations traceable to policy and recipient |
| E. Lease and prescribed document validity | Track document type, linked entity/case, issue/expiry dates, version, submission and verification | Requirements; architecture; schema; API; UI/UX document screens | Expiry boundary tests; renewed version supersedes current active version without erasing history |
| E. Renewal reminders, verification and overdue handling | Alert before expiry; capture renewal; verify; escalate expired/non-submitted renewal cases | Requirements; architecture; API; schema | Tests for no expiry, upcoming expiry, expiry date, expired and renewed document states |
| F. Configurable notifications | Cover pending applications, deadlines, EVC, compliance, expiry and other approved events | Requirements; architecture; API; schema | Notification policy matrix; channel/provider config; retry and suppression tests |
| F. Automatic escalation | Escalate to designated authorised officials according to configured timelines and rules | Requirements; architecture; API; schema | Recipient-resolution tests, no escalation to unauthorized users, duplicate-safe retries |
| F. Consolidated reports | Pendency, EVC, undertaking compliance, document validity, overdue cases and Region-wise performance | Requirements; architecture; API; schema; UI/UX dashboards/reports | Report definitions and filters documented; aggregates reconcile with fixtures and source queries |
| Key requirements: single integrated platform | Approval workflow and compliance monitoring share case/institution identifiers and consistent permissions | Overview; requirements; architecture; schema; API | End-to-end scenario crossing application, EVC, compliance, document, notification and report modules |
| Key requirements: configurable APH-aligned rules | Rules/timelines versioned and linked to official source; effective dates and applicability recorded | Requirements; overview; architecture; schema; API | Rule-source registry/configuration review; unverified values blocked from production activation |
| Key requirements: secure document storage | Private storage, server-side authorization, safe upload/download, metadata and lifecycle controls | Architecture; schema; API; UI/UX | Provider-specific tests for privacy, access, signed URLs or proxying, size/type validation, malware strategy and retention |
| Key requirements: integration with existing AICTE systems where feasible | Only authorized interfaces, credentials and approved data contracts; otherwise explicitly labelled simulation | Requirements; architecture; API; overview | Integration decision record; no false claim of production connection; mock mode visibly labelled |
| Key requirements: human oversight | Competent authority retains scrutiny/verification/decision functions | Overview; requirements; architecture; API; UI/UX | Permission/state-machine tests and clear distinction among observation, recommendation and official decision |
| Expected outcomes / prototype evaluation | Demonstrate routing, role dashboards, stage pendency, EVC alerts, undertaking tracking, lease/document expiry, compliance submission, overdue escalation and complete audit trail | Requirements acceptance criteria; UI/UX acceptance checklist; architecture test plan | One documented end-to-end demo script plus automated tests and screenshots/logs as evidence |

## 3. APH source map — use as a locator, not as a universal workflow

The following clause references were located in the supplied APH text and are intended to help reviewers navigate the source. The exact applicable clauses and tables must still be checked for each supported application category before a rule is activated.

| Supplied APH location | Subject indicated by the handbook | Product implication / guardrail |
|---|---|---|
| Chapter I, clauses 1.1–1.4 | New institution applications, submission and related requirements | Configure intake and category-specific validation; do not generalise requirements to all application types |
| Chapter I, clauses 1.8–1.9 | Scrutiny/re-scrutiny and EVC processes | Model distinct stages, reports and transitions; apply the actual prescribed process and exceptions |
| Chapter I, clause 1.10 | Grant of approval / decision process | Separate committee outputs/recommendations from authorised Council/competent-authority decisions |
| Chapter I, clause 1.11 | Appeal procedure in the clause's scope | Implement only for applicable categories and preserve original decision and appeal history |
| Chapter II, clauses 2.1–2.3 | Existing institution applications and submission/processing conditions | Distinguish existing-institution routes from new-institution routes |
| Chapter II, clauses 2.4–2.5 | Deficiency compliance and related extensions/self-disclosure topics | Use configured eligibility and timelines; do not presume every case may receive an extension or reopening |
| Chapter II, clauses 2.6–2.22 | Multiple application categories and category-specific conditions | Maintain application-type-specific route and rule configuration |
| Chapter II, clauses 2.23–2.25 | Processing steps, committee stages, appeal/approval topics | Validate stage applicability and decision authority per exact clause |
| Chapter III | Collaboration/twinning programmes | Treat as category-specific workflow only if included in the approved product scope |
| Applicable annexures, including Annexures 1, 3, 4 and 7 where referenced by the relevant clauses | Document/checklist, infrastructure/readiness and committee-process details | Link checklist/rule items to the exact annexure and version; do not reduce a checklist to an unsupported generic default |
| Relevant APH provisions on lease validity / land lease conditions (including the located Chapter II lease-related provision) | Lease validity can affect issuance/continuation of approval in specific circumstances | Store dates and alert, but do not automatically infer a legal consequence from expiry; route the case to authorised review under the applicable clause |

**Important:** The problem statement itself names the route combinations and asks for configurable alignment. It does not provide all rule values. The APH contains category-specific conditions and annexures; this source map is not a substitute for the actual tables, definitions, exceptions, amendments, or current applicability check.

## 4. Cross-document gaps and required closure actions

| Gap / risk | Status | Required closure before implementation or demo claim |
|---|---|---|
| Regulatory rule traceability at individual rule level | Partially addressed by source map and existing requirement IDs; not yet certified exhaustive | Create a rule registry row per active route, deadline, document requirement, escalation and decision condition with exact source clause/table/annexure, version, effective date, category, owner and test |
| Exact rule values and application-category matrix | Open until extracted and approved | Build an application type × stage × required actor × prerequisite × deadline × output matrix; leave uncertain values disabled and visibly flagged |
| Currentness of supplied APH | Open | Verify whether later APH editions, amendments, corrigenda, circulars or official directions supersede any relevant provision before production activation |
| Authentication alternative | Open / implementation blocker | Select and document a non-Better-Auth authentication/session approach; then define password recovery, session rotation, logout, CSRF strategy where applicable, rate limits and account lifecycle |
| Real-time transport | Open / implementation blocker for a claim of real-time | Explicitly select a provider/transport other than Neon Realtime, or approve polling for initial scope and describe it accurately; specify auth, event scope, reconnect and fallback |
| Email/SMTP provider | Open | Select provider and secrets/configuration strategy; verify delivery, retry, bounce/failure observability and notification templates |
| Queue and Redis hosting | Open | Decide whether BullMQ/Redis is needed in the first release; define durable source of truth, idempotency, retry/dead-letter handling and operational ownership |
| Neon Object Storage security | Provisioned but not proven production-ready | Verify private bucket/access policies, server-side authorization, signed URL lifetime or proxy model, content-type/size limits, malware scanning approach, versioning and retention |
| Existing AICTE integration | Conditional / likely mocked for prototype unless access is granted | Document approved interface and credentials or mark integration as simulated; do not imply live production connectivity |
| API/schema consistency | Needs implementation-level review | Resolve table/field/enum/relationship names and transaction boundaries against `DATABASE_SCHEMA_REVISION_2.md`; generate OpenAPI and migrations from the same agreed contract where feasible |
| End-to-end acceptance evidence | Not established by documents alone | Demonstrate one application route plus deficiency return, EVC where applicable, compliance evidence, document expiry, notifications/escalation, reports and audit history; attach test evidence |

## 5. Suggested acceptance scenarios

1. **Routing:** Create test applications for each supported route combination. Verify only configured stages appear, automatic advancement occurs only when prerequisites are met, and prohibited transitions fail server-side.
2. **Deficiency cycle:** An authorised reviewer returns an application with a mandatory reason; the institution responds; the reviewer re-evaluates; all versions and actions remain auditable.
3. **EVC:** A route requiring EVC enters the EVC queue; a route not requiring EVC does not. Schedule/reschedule/complete the event and test reminders and delayed escalation.
4. **Undertaking:** Record a source-backed obligation, submit evidence, return it with reason or verify it, and test due/overdue escalation.
5. **Document renewal:** Configure an applicable expiry date; test advance reminder, expiry, renewed version, verification and audit history. Expiry must not itself create an unauthorised statutory decision.
6. **Access control:** Test institution isolation, Region/assignment scope, official-only verification/decision actions, private file access and unauthorised API attempts.
7. **Notifications:** Repeated worker execution must not duplicate the same logical alert; failed delivery is observable and retryable; persisted alert and audit records survive queue/realtime failure.
8. **Reporting:** Region/stage/role filters and aggregate counts reconcile to known test records; report generation does not grant access to records outside the caller's scope.
9. **Auditability:** Each significant transition records actor, timestamp, target, action, outcome, reason where applicable, rule version, and correlation/request identifier where available.
10. **Source traceability:** Every active deadline, required document, stage rule and escalation policy displays or resolves to the applicable source/version and has an owner-approved test.

## 6. Explicit non-claims

This supplement does not certify legal compliance, exhaustively transcribe every APH table, prove that the APH copy is current, prove that the application code implements the specifications, prove that Neon storage is secured, or prove that any AICTE production integration exists. It makes the PS and supplied handbook available as explicit audit sources and identifies the remaining work needed to make the specifications testable and defensible.


---

## Final decision correction — technical choices (24 October 2026)

The technical-decision status in this audit is updated as follows: authentication direction is approved as **Auth.js-compatible solution or JWT with secure HTTP-only cookies** (Better Auth excluded); **Socket.IO is selected** for real-time transport (Neon Realtime and all other Neon services excluded); Neon is limited to PostgreSQL and document/object storage. The previous open-decision entries for choosing a non-Better-Auth direction and choosing a non-Neon real-time provider are superseded by `FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md`. The exact authentication implementation details, Socket.IO event/room contract, private-storage verification, and runtime tests remain to be completed. Regulatory-source and other non-technical gaps are unchanged.

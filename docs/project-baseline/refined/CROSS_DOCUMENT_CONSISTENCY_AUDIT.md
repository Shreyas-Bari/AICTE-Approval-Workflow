# Cross-document consistency audit — AICTE Workflow Automation

**Audit date:** 24 October 2026  
**Review scope:** Refined documentation ZIP; supplied `PS SIH26262.pdf`, supplied `AICTE APH 2024-2027.pdf`, `Tech Stack Reasoning.txt`, and `UX Spec Plan.txt`; cross-check of requirements, overview, architecture, both schema versions, API specification, and UI/UX specification.  
**Review type:** Static documentation audit. This is not a code audit, legal opinion, security certification, or proof of runtime behaviour.

## 1. Executive result

The package is structurally preserved and substantially cross-referenced, but it is **not yet implementation-ready without owner decisions and a contract freeze**. The highest-risk blockers are authentication choice, real-time transport/scope, the final status of Neon PostgreSQL and Object Storage, storage security semantics, and the exact applicable regulatory rule set. The API and schema are detailed planning documents, not a generated/verified implementation contract.

### Status legend

- **Pass:** directly verified by static checks or explicit source text.
- **Partial:** documentation exists, but exact field/route/rule/runtime evidence is incomplete.
- **Open/blocker:** must be decided or verified before the affected implementation is considered complete.
- **Not assessed:** requires running code, provider access, or an authorised regulatory review.

## 2. Preservation and package integrity

| Check | Result | Evidence / limitation |
|---|---|---|
| Original documents retained | **Pass** | All seven original Markdown files remain in `original/`. |
| Existing refined content retained | **Pass** | For each of the seven core specifications, the original file content is an exact prefix of its refined counterpart; refinements were appended. |
| Additive audit materials | **Pass** | `PS_APH_TRACEABILITY_AUDIT.md` and this report add traceability/consistency findings without modifying the originals. |
| API/schema runtime agreement | **Partial** | Static document comparison only; no code-generated OpenAPI, Prisma schema, migrations, or live database were available in this audit. |
| ZIP and manifest | **Re-run at packaging** | The ZIP integrity test and manifest verification must be performed on the final generated artifact; see final response for outcome. |

## 3. Confirmed cross-document decisions and contradictions

| ID | Finding | Severity | Evidence | Required closure |
|---|---|---|---|---|
| C-01 | **Authentication is contradictory between the standalone tech-stack note and the refined specifications.** `Tech Stack Reasoning.txt` lists Better Auth, while the refined overview, requirements, architecture, schema revision 2 and API specification explicitly prohibit Better Auth. | **Blocker** | Tech-stack note, Authentication rows/sections in overview/requirements/architecture/schema/API | Keep Better Auth prohibited unless the project owner explicitly reverses that decision. Select a non-Better-Auth identity/session design, document cookie/session/token lifecycle, recovery, account provisioning, MFA decision, CSRF protections, session invalidation and tests before implementing auth routes. Do not infer a provider from this audit. |
| C-02 | **Real-time is described as both optional and required.** The standalone tech-stack note says to keep real-time disabled until needed, while the problem statement and refined requirements treat consolidated real-time dashboards/updates as a required capability. Neon Realtime is explicitly prohibited in refined specifications. | **Blocker** | `Tech Stack Reasoning.txt`; PS area B; requirements AC-08; architecture/API real-time sections | Decide one: (a) approve a non-Neon event transport (and define authorization, event scope, reconnect/replay, failure/fallback and latency target), or (b) explicitly approve polling for the prototype and stop describing that release as push-based real-time. Do not enable/use Neon Realtime by assumption. |
| C-03 | **Neon PostgreSQL and Neon Object Storage are provisioned but their final architectural status is not consistently frozen.** The tech-stack note says to build around them; architecture says retain unless owner decides otherwise; overview/requirements/API record the final role as unresolved. | **Blocker for provider-specific implementation** | Tech-stack note; overview §§5.3–5.4; architecture §2; requirements technical decisions; API §1.1; schema revision 2 | Record an owner decision: retain Neon PostgreSQL and Neon Object Storage, or replace one/both. If retained, verify actual storage API, private-bucket enforcement, object access policy, size/type limits, version semantics, signed URL/proxy model, quotas, retention and failure behaviour against the provisioned project. Provisioning alone is not a security validation. |
| C-04 | **The APH source is identified but currentness/applicability is not established.** The supplied PDF covers 2024–25 to 2026–27; it is a locator/source, not proof that no later amendments, corrigenda, public notices or case-specific directions apply. | **Blocker for production rule activation** | Supplied APH; requirements §3; source traceability audit | Before enabling any rule, capture exact official source URL/file, publication/issue date, clause/table/annexure, effective period, category/institution applicability, supersession status, reviewer and test. Check later official directions for the relevant approval cycle. A web search located an AICTE-hosted APH 2024–2027 PDF but did not establish the absence of subsequent changes: https://aicte-qa.aicte-india.org/sites/default/files/APH%20Final.pdf |
| C-05 | **The API inventory and schema are planning artefacts, not a frozen executable contract.** The API correctly marks routes proposed/conditional/blocked, and schema revision 2 includes a normative addendum, but there is no evidence of generated OpenAPI, executable migrations, or one-to-one field/enum/relationship validation. | **High** | API status labels and schema revision 2 implementation addendum | Freeze the canonical schema source (Revision 2 is the newer implementation guide; read the original schema for history/context, but do not independently implement both as separate schemas). Produce Prisma schema/migrations and OpenAPI from the approved contract; validate every route, request/response DTO, enum, relation, transaction and permission against the same revision. |
| C-06 | **The UI/UX specification is intentionally visual/interaction guidance, not authority for regulatory workflow or permissions.** This is correctly stated in the documentation, but must be enforced during implementation. | **High** | UI/UX precedence and screen sections; requirements/architecture/API | Bind every screen action to an approved API capability and permission. Do not infer an official route, role, status, deadline, or decision from a screenshot or mock data. Add loading, empty, forbidden, validation, conflict, offline and delivery-failure states. |
| C-07 | **Background jobs and email are proposals with provider/operational choices unresolved.** A database deadline must remain authoritative even if Redis/BullMQ or SMTP is unavailable. | **High** | Tech-stack note; architecture; API; schema tables for deadlines, notifications, attempts, escalations and outbox | Select the first-release scheduler/queue and SMTP provider. Specify durable outbox, idempotency, retry/backoff, dead-letter/manual replay, duplicate suppression, observability, recipient scoping and operator ownership. Do not mark an email delivered just because a job was enqueued. |
| C-08 | **Live AICTE integration is not evidenced.** The documents correctly state that authorised integration is conditional and mock/manual modes must be labelled. | **High** | PS wording “where feasible”; API integration endpoints; architecture boundaries | Obtain an authorised API/data contract and credentials before connecting. Until then, use clearly labelled sample/manual import-export data, preserve source provenance, and do not claim live AICTE connectivity. |
| C-09 | **The product has to preserve human authority.** Workflow automation, alerts and summaries must not be mistaken for official approval, rejection, verification or legal consequence. | **High** | PS; requirements; architecture; schema/API decision and communication models | Keep recommendation, committee recommendation, verification outcome, official decision and formal communication as distinct records and permissions. Require authorised actor, reason/source, effective timestamp and audit trail for guarded actions. |

## 4. Static API/schema coverage review

### What is present

The Revision 2 schema contains 42 table headings covering identity/access, institutions, applications/revisions/assignments, rule sources/versions, workflow definitions/instances/history, scrutiny/deficiencies/responses, EVC, committees/recommendations/decisions/appeals/communications, compliance obligations/evidence, documents/versions/verifications, deadlines, notifications/attempts, escalations, audit, outbox, conditional integration records and optional operational incidents.

The API inventory includes proposed resources/actions for the same major domains, including application intake, workflow transitions, scrutiny/deficiencies, EVC, committees/decisions/appeals, documents, compliance, deadlines, notifications/escalations, dashboards/reports, audit and conditional integrations. Its status labels correctly distinguish proposed, conditional and blocked routes.

### What remains unverified

This static audit does **not** certify that every API payload field, enum value, foreign key, uniqueness rule, delete/retention policy, transaction boundary, permission predicate or error code matches the schema. No automated schema-to-OpenAPI comparison or generated client check was available. Treat the following as required engineering gates:

1. One canonical Prisma schema and migration set derived from the approved Revision 2 decisions.
2. OpenAPI generated or validated against the actual route handlers/DTO schemas, not hand-maintained independently.
3. For each mutation: current-state check, resource-scope authorization, allowed transition check, transactionally consistent business history/audit/outbox writes, idempotency/concurrency strategy and failure tests.
4. For every document operation: object ownership/scope check on the server, exact version reference, no public object exposure, safe upload validation, controlled download, audit trail and retention policy.
5. For each deadline/rule: source and rule version, effective date, trigger, timezone/calendar semantics, calculation inputs and historical-deadline preservation.
6. For dashboards/reports: query scope matches API authorization and totals reconcile to fixture records.
7. For all conditional/blocked endpoints: implementation remains absent or explicitly disabled until its prerequisite decision is recorded.

## 5. UI/UX and implementation traceability

The UI/UX specification includes the major screen areas needed for the prototype: login/recovery, institution dashboard, official scrutiny console, application detail/review, deficiencies/responses, resubmission review, EVC/committee proceedings, compliance monitoring, administration, notifications/tasks and audit trail. The later acceptance/implementation material repeats screen names as a checklist; that repetition is not evidence of separate duplicate routes.

Before frontend sign-off, produce a screen-to-API-to-permission matrix. At minimum it should identify for every visible action: screen/component, API method/path, role and resource scope, request schema, success/error states, audit event, source/rule dependency, and test ID. Confirm the approved authentication decision before implementing login/recovery screens beyond a visual prototype.

## 6. Regulatory source verification result

The supplied APH was reviewed as a reference and mapped by chapter/clause locator in `PS_APH_TRACEABILITY_AUDIT.md`. The public-source check found an AICTE-hosted copy titled *Approval Process Handbook 2024–2027* at the URL recorded in C-04. That finding confirms an official-hosted reference exists; it does **not** prove that it is the latest controlling instrument as of the audit date. The audit did not perform a legal review of every clause/table/annexure or establish applicability for every institution/application category.

Do not convert a lease/document expiry into an automatic rejection, penalty or legal status. The system may flag, remind, queue for authorised review and preserve evidence; the applicable rule and competent authority determine the consequence.

## 7. Ordered closure checklist

### P0 — decisions required before implementation claims

- [ ] Confirm the canonical database and file-storage providers; verify Neon Object Storage security and API semantics if retained.
- [ ] Approve a non-Better-Auth authentication/session design and identity lifecycle.
- [ ] Decide non-Neon push transport versus explicitly scoped polling-first prototype.
- [ ] Approve first-release scope for EVC/committee/appeal/official communications, integrations, email, queue/worker and exports.
- [ ] Identify and verify the applicable APH/amendment/direction set for each prototype application category; block unknown rules from activation.

### P1 — contract and security gates

- [ ] Freeze Revision 2 schema decisions and create Prisma migrations from one canonical source.
- [ ] Validate API endpoint inventory and DTOs against schema and actual handlers; publish accurate OpenAPI status.
- [ ] Finalise role/permission/resource-scope matrix and negative authorization tests.
- [ ] Define upload/download, object privacy, retention, malware/file validation, backup and incident procedures.
- [ ] Define durable outbox, scheduler/queue, email retries, duplicate prevention and operational monitoring.
- [ ] Build screen-to-API-to-permission traceability matrix.

### P2 — evidence before demo/release

- [ ] Run the acceptance scenarios in `PS_APH_TRACEABILITY_AUDIT.md` with saved test evidence.
- [ ] Run unit/integration/end-to-end tests including invalid transitions, cross-institution access, stale writes, duplicate jobs, provider failure and expired/renewed documents.
- [ ] Reconcile dashboard/report counts against known fixtures.
- [ ] Demonstrate the entire core workflow and label simulated integrations/data honestly.
- [ ] Verify ZIP manifest and archive integrity after any future documentation change.

## 8. Scope and confidence

This is a static consistency audit of the supplied documents and available public source results. It does not prove that software is implemented, the storage bucket is private, a service is configured, an email was delivered, a real-time transport works, a legal rule is current, or the system is legally compliant. Those claims require separate runtime/provider evidence or an authorised regulatory review.


---

## Addendum — owner-confirmed technology decisions (24 October 2026)

The following findings and P0 actions from the earlier static audit are superseded by the later explicit project decisions: (1) authentication direction is approved as an Auth.js-compatible solution or JWT with secure HTTP-only cookies; Better Auth remains excluded; (2) Socket.IO is selected for real-time updates; Neon Realtime and all other Neon services are excluded; and (3) Neon is restricted to PostgreSQL and document/object storage. Therefore, do not carry the prior “authentication alternative unselected” or “real-time transport unselected / polling-first decision needed” items forward as open provider-selection blockers. Keep implementation details and verification tasks open: exact authentication library/session lifecycle/security configuration, Socket.IO event/room authorization and recovery contract, and runtime evidence. The storage security checks, email/queue/deployment choices, role matrix, API/schema consistency, regulatory currentness, and release-test evidence remain open as applicable. The historical findings are intentionally retained and should be read as findings at the time of the earlier audit. Full current decisions: `FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md`.

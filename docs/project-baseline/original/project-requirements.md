# Project Requirements --- AICTE Approval Workflow Automation

**Project:** Integrated AICTE Approval Workflow Automation, Compliance
Monitoring and Alert Management System\
**Short name:** AICTE Workflow Automation\
**Document type:** Functional and non-functional requirements
specification (FRS/NFRS)\
**Primary regulatory reference supplied by the project:** *AICTE
Approval Process Handbook 2024--2027* (`AICTE APH 2024-2027.pdf`, 230
PDF pages including front matter and annexures)\
**Companion project document:** `project-overview.md`\
**Status:** Requirements baseline for a prototype. Every requirement has
an ID and verification method. Regulatory rules must be activated only
after exact source clauses and current applicability are verified.

------------------------------------------------------------------------

## 1. Purpose and interpretation

This document translates the project problem statement and the supplied
AICTE Approval Process Handbook (APH) into testable requirements for a
workflow automation, compliance-monitoring, and alert-management
prototype.

The APH is a detailed regulatory handbook covering different institution
types, application purposes, approval processes, standards, annexures,
and compliance obligations. It does **not** describe one universal
workflow that applies identically to every application. Requirements
below therefore distinguish: - **General system capabilities** required
to implement the project problem statement. - **APH-derived process
requirements** tied to cited clauses/chapters of the supplied 2024--2027
handbook. - **Configuration-dependent rules** whose exact values,
eligibility conditions, application route, or applicability must be
extracted and verified for the relevant application category. -
**Unresolved technical decisions** that must not be guessed.

### 1.1 Important regulatory limitation

The supplied PDF is the *Approval Process Handbook 2024--25 to
2026--27*. This document uses it as the requested project reference; it
does not certify that the 2024--2027 edition remains the latest
applicable authority at implementation time. Before activating a
regulatory rule, verify any later handbook, amendments, corrigenda,
official public notices, circulars, court directions, and applicable
rules. If a newer or more specific official source applies, record that
source and the precedence decision.

### 1.2 Source and clause notation

Clause references below use the numbering printed in the supplied APH.
Chapter/annexure references are included so a developer or reviewer can
locate the rule. Where a requirement states "where applicable", the
implementation must use the application-specific route/table and must
not assume universal applicability.

### 1.3 Requirement priority labels

-   **MUST --- Core:** necessary for the project scope or essential for
    a safe, testable prototype.
-   **MUST --- APH-dependent:** necessary when the corresponding APH
    process/category is implemented; behaviour must be driven by the
    applicable verified rule.
-   **SHOULD:** important quality/reliability requirement; implement
    unless a documented prototype constraint prevents it.
-   **OPTIONAL/FUTURE:** useful extension but not required for the
    initial working prototype.
-   **OUT OF SCOPE unless authorised:** must not be implemented as a
    live capability without access/authority or explicit scope approval.

Priority describes the system requirement, not the legal importance of
the underlying APH obligation.

------------------------------------------------------------------------

## 2. Scope

### 2.1 In-scope capabilities

1.  Application intake, identification, status tracking, and
    application-category routing.
2.  Configurable workflow stages and valid transitions.
3.  Scrutiny/re-scrutiny and deficiency/response handling.
4.  EVC scheduling, event records, and related case status.
5.  SHC/SAC/other committee or authority stages only where applicable to
    the selected application route.
6.  Separate records for observations, recommendations, official
    decisions, appeals, and official communications.
7.  Compliance obligations, time-bound undertakings, evidence, and
    verification.
8.  Document metadata, secure document access, and validity/expiry
    monitoring.
9.  Deadline calculation, reminders, overdue detection, escalation, and
    notification records.
10. Dashboards and reports for pendency, EVC, compliance, document
    validity, overdue cases, and other metrics supported by data.
11. RBAC, institution/resource boundaries, audit trail, and operational
    reliability.
12. Real-time UI updates through a service **other than Neon**; the
    provider remains unresolved until explicitly selected.
13. Integration with existing authorised AICTE systems where an approved
    interface and credentials are available; otherwise clearly labelled
    simulated integration.
14. Test evidence mapped to requirements and APH source clauses.

### 2.2 Not automatically in scope

The APH also includes substantive institutional standards and many
specific subject areas (for example, infrastructure, faculty, courses,
fees, admissions, student schemes, grievance mechanisms, institutional
committees, and penal actions). This project must represent the relevant
documents, obligations, checks, and workflow events needed for the
selected approval/compliance use cases. It must **not** attempt to
recreate every AICTE regulatory programme, calculate every institutional
norm, or automate every substantive regulatory judgement unless the
problem statement/team explicitly includes that module and its rules are
extracted and verified.

### 2.3 Excluded unless separately authorised

-   Making a statutory approval/rejection decision autonomously.
-   Claiming a live connection to AICTE production systems without
    authorised access.
-   Scraping authenticated/private AICTE systems.
-   Issuing a communication as an official AICTE order without the
    authorised process and authority.
-   Inventing or generalising APH routes, deadlines, fees, refund rules,
    eligibility rules, or document requirements.
-   Automatic OCR/AI decisions that substitute for human verification.
-   Storing real confidential institutional documents in a public
    bucket.
-   Using Better Auth.
-   Using Neon Realtime for the real-time layer.

------------------------------------------------------------------------

## 3. Regulatory source map

The following is a source map for requirements, not a replacement for
reading the applicable clauses and tables in full.

  ---------------------------------------------------------------------------
  APH source              Subject                     Requirements informed
  ----------------------- --------------------------- -----------------------
  Chapter I, clauses      New institution;            FR-001--FR-009;
  1.1--1.4                application submission,     BR-001--BR-009
                          timeline, identification,   
                          charges, signed documents   

  Chapter I, clauses      Scrutiny/re-scrutiny,       FR-010--FR-019
  1.8--1.9                deficiency handling, EVC    
                          process,                    
                          transparency/recording      

  Chapter I, clause 1.10  Grant of approval and       FR-020--FR-022
                          decision authority          

  Chapter I, clause 1.11  Appeal procedure for the    FR-023--FR-025
                          scope covered by that       
                          clause                      

  Chapter II, clauses     Existing institution        FR-001--FR-009,
  2.1--2.3                applications, timeline,     FR-026--FR-031
                          application submission,     
                          editing/deficiency          
                          reopening and documents     

  Chapter II, clauses     Opportunity to submit       FR-012--FR-014, FR-032
  2.4--2.5                deficiency compliance;      
                          extension of                
                          approval/self-disclosure    

  Chapter II, clauses     Multiple application        FR-004--FR-009,
  2.6--2.22               categories and              FR-033--FR-037
                          category-specific           
                          conditions/routes           

  Chapter II, clauses     Processing steps, SHC,      FR-010--FR-025,
  2.23--2.25              appeal, grant of approval   FR-038--FR-040

  Chapter III             Collaboration and twinning  FR-004--FR-009 and
                          programmes                  category-specific
                                                      workflow configuration
                                                      if included

  Chapter IV              Universities/institutions   FR-004--FR-009 and
                          deemed to be universities   category-specific
                                                      workflow configuration
                                                      if included

  Chapter V               ODL/Online Learning         FR-004--FR-009 and
                          approval processes and      category-specific
                          requirements                workflow configuration
                                                      if included

  Chapter VI              Standard norms and          FR-041--FR-047 for
                          requirements; continuing    configurable
                          institutional requirements  compliance/document
                                                      obligations only

  Chapter VII             Penal actions and           FR-048--FR-050 for case
                          restoration procedures      tracking/recording
                                                      only; no automated
                                                      penalty decision

  Chapter VIII            Common stakeholder          Validation/help content
                          questions / Do's and Don'ts where relevant after
                                                      clause verification

  Annexures, affidavits,  Application-specific        FR-006--FR-009,
  formats and             document checklists and     FR-041--FR-047
  certificates            prescribed forms            
  ---------------------------------------------------------------------------

**Critical:** Chapter II Table 2.3 and the relevant clause for each
application category must drive routing. Do not replace the table with a
generic "scrutiny → EVC → committee" sequence.

------------------------------------------------------------------------

## 4. Functional requirements

### A. Application intake, identity, and submission

**FR-001 --- Create and maintain application records**\
**Priority:** MUST --- Core\
The system shall create an application record linked to an
institution/applicant and record the application purpose/category,
academic cycle, creation/submission timestamps, current status, assigned
workflow, and a unique application reference.\
**APH basis:** Chapter I clauses 1.3--1.4; Chapter II clauses 2.3 and
2.22; category-specific chapters as applicable.\
**Acceptance criteria:** - A new application receives a unique,
non-reused internal identifier. - The application can be found by its
identifier by an authorised user. - Its current status and stage are
visible to authorised users. - The system preserves submission and
subsequent stage history. - The identifier is not represented as an
official AICTE-issued application ID unless it actually comes from an
authorised integration.

**FR-002 --- Link application to applicant/institution**\
**Priority:** MUST --- Core\
Every application shall be associated with an identified
applicant/institution and the authorised user(s) acting on its behalf.\
**Acceptance criteria:** Users cannot view or edit another institution's
private application unless explicitly authorised;
institution/application linkage is validated server-side.

**FR-003 --- Track submission, cut-off, and payment conditions where
applicable**\
**Priority:** MUST --- APH-dependent\
The system shall be capable of representing application submission
deadlines, relevant fee/payment status, and whether the applicable route
requires successful submission/payment by the official cut-off. It shall
use the configured category-specific rule and not assume all application
types have identical charges or payment conditions.\
**APH basis:** Chapter I clauses 1.2 and 1.4.2; Chapter II clauses 2.2,
2.3.2, 2.22 and other applicable clauses.\
**Acceptance criteria:** A case that fails an explicitly configured
submission/cut-off/payment prerequisite is flagged or blocked according
to that rule; the system records the rule and reason. Payment gateway
integration is not assumed; a simulated status must be labelled as
simulated.

**FR-004 --- Determine the applicable application category and workflow
route**\
**Priority:** MUST --- Core / APH-dependent\
The system shall select or recommend a workflow definition based on the
application category/purpose and verified APH rule mapping. It shall
store the rule/version and route-selection reason.\
**APH basis:** Chapter I; Chapter II clauses 2.3 and 2.6--2.23 and Table
2.3; Chapters III--V for their categories.\
**Acceptance criteria:** - Route mapping is data/configuration-driven
rather than scattered hard-coded conditionals. - Every active route has
a source clause/table and a reviewed effective version. - If category,
academic cycle, or other required inputs are missing/ambiguous, the
system does not silently choose a route; it flags the application for
authorised review. - The system does not assume all applications require
scrutiny, EVC, SHC, SAC, or the same order of steps.

**FR-005 --- Support draft and final-submission state**\
**Priority:** MUST --- APH-dependent\
Where the applicable APH process distinguishes editable preparation from
final submission, the system shall represent those states and enforce
the applicable editing restriction.\
**APH basis:** Chapter I clause 1.4.3; Chapter II clause 2.3.3 and
applicable category-specific provisions.\
**Acceptance criteria:** Before final submission, permitted edits are
possible; after final submission, edits are blocked unless a verified
process explicitly permits reopening/revision. Any authorised reopening
is recorded with actor, time, reason, and source/rule.

**FR-006 --- Validate required application data and documents**\
**Priority:** MUST --- APH-dependent\
The system shall check completeness against the approved checklist for
the selected application category and handbook version. The checklist
shall be based on relevant APH clauses and annexures, not a generic
list.\
**APH basis:** Chapter I clauses 1.4.4--1.4.6; Chapter II clause 2.3.4;
relevant annexures and category clauses.\
**Acceptance criteria:** Missing required fields/documents are listed
explicitly; optional documents are not incorrectly treated as mandatory;
checklist version and outcome are recorded.

**FR-007 --- Represent digital signatures and attestations**\
**Priority:** MUST --- APH-dependent\
Where the applicable APH provision requires a digitally signed
application/document, affidavit, or attested copy, the system shall
record the required signature/attestation status and shall not mark the
requirement as satisfied solely because a file was uploaded.\
**APH basis:** Chapter I clauses 1.4.3, 1.4.4, 1.4.6 and relevant
annexures; applicable provisions for other categories.\
**Acceptance criteria:** The record distinguishes uploaded,
signature/attestation checked, accepted, rejected, and pending
verification as supported by the configured process. Actual
cryptographic DSC validation is only claimed if implemented against a
suitable trusted validation mechanism.

**FR-008 --- Preserve official external identifiers and integration
provenance**\
**Priority:** MUST --- Core\
If an authorised integration provides an official portal/application
identifier, the system shall store it separately from the internal
identifier, along with source and synchronization metadata.\
**Acceptance criteria:** Mock identifiers are clearly labelled; external
identifiers cannot be fabricated or silently overwritten.

**FR-009 --- Maintain application change history**\
**Priority:** MUST --- Core\
The system shall record permitted changes to application data,
submission/reopening actions, and material status changes.\
**Acceptance criteria:** Authorised users can inspect an auditable
history; the original submitted state is not silently replaced.

### B. Scrutiny, re-scrutiny, deficiencies, and EVC

**FR-010 --- Record scrutiny/re-scrutiny stage and assignment**\
**Priority:** MUST --- APH-dependent\
For routes requiring scrutiny/re-scrutiny, the system shall record the
stage, assigned committee/reviewer or assignment reference, schedule
information where provided, progress, and report/document reference.\
**APH basis:** Chapter I clause 1.8; Chapter II clauses 2.23.1 and Table
2.3.\
**Acceptance criteria:** Only a route requiring scrutiny enters this
stage; all stage changes are traceable.

**FR-011 --- Record scrutiny observations and outcomes**\
**Priority:** MUST --- APH-dependent\
Authorised reviewers shall be able to record observations/findings and
the relevant report or accepted-document references.\
**APH basis:** Chapter I clause 1.8; Annexure-1 document provisions and
applicable Chapter II route.\
**Acceptance criteria:** Each observation is linked to the application,
author, timestamp, and stage; records cannot be edited by unauthorised
users.

**FR-012 --- Issue and track deficiency notices**\
**Priority:** MUST --- APH-dependent\
Where deficiencies are identified, the system shall record each
deficiency, its source/stage, notice/communication, issue time, response
requirements, applicable due date if prescribed, and current status.\
**APH basis:** Chapter I clause 1.8(f)--(h); Chapter II clauses 2.4 and
2.23.3; category-specific provisions.\
**Acceptance criteria:** Deficiencies are visible to authorised
institution users; notice issuance is traceable; the due date comes from
an approved rule rather than a guessed duration.

**FR-013 --- Accept institution responses/compliance evidence**\
**Priority:** MUST --- APH-dependent\
Where the APH route permits an institution to submit compliance/evidence
against a deficiency, the system shall allow the authorised institution
user to submit the response and supporting documents.\
**APH basis:** Chapter I clause 1.8(f)--(g); Chapter II clauses 2.4 and
2.23.3.\
**Acceptance criteria:** Response is linked to the relevant deficiency;
upload time, submitter, evidence references, and status are recorded;
the original deficiency and prior responses remain available.

**FR-014 --- Restrict re-scrutiny to the applicable scope**\
**Priority:** MUST --- APH-dependent\
Where the APH specifies re-scrutiny of identified deficiencies, the
system shall represent which deficiencies are in scope and record the
re-scrutiny outcome against them.\
**APH basis:** Chapter I clause 1.8(g).\
**Acceptance criteria:** Re-scrutiny does not silently erase the
original observations; scope and outcome are recorded. Do not generalise
this exact restriction to routes where another rule applies.

**FR-015 --- Progress only through valid workflow transitions**\
**Priority:** MUST --- Core\
The backend shall reject a transition that is not permitted by the
active workflow definition and applicable rule version.\
**Acceptance criteria:** Invalid transitions return a controlled
conflict/validation response; state does not change; attempted action
may be recorded as a security/operational event where appropriate.

**FR-016 --- Record EVC scheduling and status**\
**Priority:** MUST --- APH-dependent\
For routes requiring an Expert Visit Committee, the system shall record
EVC scheduling/status, linked application, relevant committee/member
assignment references, visit mode where applicable, and report/evidence
references.\
**APH basis:** Chapter I clause 1.9; Chapter II clauses 2.23.2 and Table
2.3.\
**Acceptance criteria:** An EVC can only be created/required when the
applicable route calls for it; schedule changes and status changes are
traceable.

**FR-017 --- Represent online/offline EVC requirements where
applicable**\
**Priority:** MUST --- APH-dependent\
The system shall be capable of recording whether the applicable EVC is
online or physical/offline, and the evidence/recording checklist
applicable to that mode.\
**APH basis:** Chapter I clause 1.9 and relevant notes; applicable
Chapter II provisions.\
**Acceptance criteria:** The mode-specific checklist is selected from a
reviewed configuration; the system does not assume one mode is
universally applicable.

**FR-018 --- Store scrutiny/EVC reports and make them available
according to permissions**\
**Priority:** MUST --- APH-dependent\
The system shall store or reference scrutiny/re-scrutiny and EVC reports
and record when they are made available to the relevant
institution/user, where the applicable process requires this.\
**APH basis:** Chapter I clauses 1.8--1.9; Chapter II clause 2.23.\
**Acceptance criteria:** The report is linked to the relevant
case/stage; access is authorised; availability time and version are
recorded.

**FR-019 --- Preserve transparency/accountability records for scrutiny
and EVC**\
**Priority:** MUST --- APH-dependent\
The system shall record material scrutiny/re-scrutiny/EVC processing
events so that a traceable history can be inspected.\
**APH basis:** Chapter I notes to clauses 1.8--1.9.\
**Acceptance criteria:** A case history shows stage, actor/assignment
where available, timestamps, actions, report references, and changes.
The system does not claim to record an actual meeting/video unless the
file/record exists.

### C. Committee proceedings, decisions, appeals, and communications

**FR-020 --- Distinguish recommendation from decision**\
**Priority:** MUST --- Core\
The system shall store recommendations separately from official
decisions and identify the actor/body/authority associated with each
record.\
**APH basis:** Chapter I clause 1.10; Chapter II clauses 2.23--2.25;
committee roles in Chapter XVI/section 16.8 as printed in the supplied
PDF.\
**Acceptance criteria:** A recommendation cannot automatically set an
approval outcome; a decision requires an authorised action and creates a
separate record.

**FR-021 --- Record authorised approval outcome and ratification state
where applicable**\
**Priority:** MUST --- APH-dependent\
The system shall record an approval/rejection/other official outcome
only when entered by an authorised role and shall represent any
ratification/next step where the applicable clause requires it.\
**APH basis:** Chapter I clause 1.10; relevant Chapter II/IV
provisions.\
**Acceptance criteria:** The system does not infer an outcome from an
EVC or scrutiny report; authority, timestamp, reason/reference, and
relevant decision record are stored.

**FR-022 --- Record formal approval/rejection communication**\
**Priority:** MUST --- APH-dependent\
Where the process issues a Letter of Approval (LoA), Letter of Rejection
(LoR), speaking order, or other formal communication, the system shall
store/reference the issued communication and its version, issuing
authority, issue time, recipient, and relationship to the decision.\
**APH basis:** Chapter I clauses 1.10--1.11; Chapter II clauses
2.23--2.25 where applicable.\
**Acceptance criteria:** A notification saying that a decision exists is
distinct from the decision/order document; a generated document is not
labelled official unless the authorised process confirms it.

**FR-023 --- Track appeals only where the applicable route provides
them**\
**Priority:** MUST --- APH-dependent\
The system shall support an appeal record linked to the original
application/decision when the applicable APH provision grants an
appeal.\
**APH basis:** Chapter I clause 1.11; Chapter II clause 2.24 and
category-specific provisions.\
**Acceptance criteria:** Appeal eligibility, authority, deadline, and
route come from the applicable rule; the system does not enable an
appeal for every decision by default.

**FR-024 --- Calculate appeal deadline from the applicable clause**\
**Priority:** MUST --- APH-dependent\
The system shall calculate an appeal deadline only from a verified rule
applicable to the specific decision/category and record the
source/version.\
**APH basis:** Chapter II clause 2.24(a) includes a seven-day provision
for the scope covered by that clause; Chapter I clause 1.11 has its own
scope/procedure.\
**Acceptance criteria:** The seven-day provision is not globally applied
to all application types; deadline calculation is testable and
source-linked.

**FR-025 --- Track committee schedule, attendance/supporting material,
and recommendation where applicable**\
**Priority:** MUST --- APH-dependent\
For applicable SHC/SAC or other committee processes, the system shall
record schedule, relevant participants/authorisations, supporting
documents, proceedings/report, recommendation, and next authority/step
as required by the route.\
**APH basis:** Chapter II clause 2.24; relevant Chapter I and
committee-role provisions.\
**Acceptance criteria:** SHC and SAC are represented as distinct
bodies/processes where the APH distinguishes them; the system does not
treat them as interchangeable.

### D. Existing-institution categories and other APH routes

**FR-026 --- Support category-specific existing-institution
applications**\
**Priority:** MUST --- APH-dependent\
The workflow configuration shall be capable of representing the
application categories listed in Chapter II, including only those
categories the product scope elects to support.\
**APH basis:** Chapter II clauses 2.6--2.22.\
**Acceptance criteria:** Each supported category has its own verified
route/checklist/rule mapping; unsupported categories are identified as
unsupported rather than processed under an incorrect default.

**FR-027 --- Support category-specific route table**\
**Priority:** MUST --- APH-dependent\
The workflow configuration shall encode the relevant processing steps
from Chapter II Table 2.3 for each supported application nature.\
**APH basis:** Chapter II clauses 2.23.4 and Table 2.3.\
**Acceptance criteria:** Test cases cover every category marked as
supported; route steps match the table and applicable clause. "AA" or
other table symbols must be interpreted from the handbook's
definitions/notes rather than guessed.

**FR-028 --- Represent reopening/editing of submitted applications only
when permitted**\
**Priority:** MUST --- APH-dependent\
The system shall support an application
reopening/deficiency-data-editing state only where the applicable APH
process permits it.\
**APH basis:** Chapter II clause 2.3.3 and applicable category-specific
clauses.\
**Acceptance criteria:** Reopening requires the applicable
condition/authority, and the action is audited; the system does not
generally unlock every submitted application.

**FR-029 --- Represent application prerequisites and fees as rule-driven
fields**\
**Priority:** MUST --- APH-dependent\
Where an application category has prescribed prerequisites, fees/TER
charges, payment/cut-off conditions, or refund handling, the system
shall store the applicable rule and status without hard-coding a
universal amount.\
**APH basis:** Chapter I clause 1.4.2; Chapter II clause 2.3.2 and
category-specific clauses.\
**Acceptance criteria:** Amounts, exceptions, and refunds are
effective-dated and source-linked; a prototype may simulate payment
status but must label it.

**FR-030 --- Support institution closure/new institution dependency
where applicable**\
**Priority:** MUST --- APH-dependent\
Where the applicable APH process makes one application dependent on
another (for example, closure being processed before a related new
institution application), the system shall represent the dependency and
block/hold the dependent step until the prerequisite outcome is
recorded.\
**APH basis:** Chapter I clause 1.8(i) for the specific simultaneous
closure/opening case.\
**Acceptance criteria:** The dependency is only enabled for the relevant
category; it is not applied universally.

**FR-031 --- Keep Chapters III--V as distinct route families if in
scope**\
**Priority:** MUST --- APH-dependent\
If the product includes collaboration/twinning, university, or
ODL/online-learning applications, the system shall implement their
applicable Chapter III, IV, or V requirements as distinct configurable
route families rather than assuming Chapter I/II rules apply unchanged.\
**APH basis:** Chapters III--V.\
**Acceptance criteria:** Each included route has an approved clause
checklist and test cases; any unsupported family is clearly marked out
of scope.

### E. Compliance obligations and document validity

**FR-032 --- Track opportunities to submit deficiency compliance**\
**Priority:** MUST --- APH-dependent\
Where the applicable process provides an opportunity to submit
compliance before a committee/hearing stage, the system shall record the
opportunity, submission, evidence, and resulting review state.\
**APH basis:** Chapter II clauses 2.4 and 2.23.3.\
**Acceptance criteria:** The system allows compliance evidence only in
the permitted stage/window and preserves all submitted versions.

**FR-033 --- Model ongoing institutional compliance obligations**\
**Priority:** MUST --- Core / APH-dependent\
The system shall support configurable obligations linked to
institution/application/approval, including source, responsible party,
due date if prescribed, evidence, verification, and status.\
**APH basis:** Chapter VI and other applicable APH clauses.\
**Acceptance criteria:** Each active obligation is source-linked or
explicitly marked as a non-regulatory internal task; no unverified
deadline is activated.

**FR-034 --- Track time-bound undertakings**\
**Priority:** MUST --- Core\
The system shall track undertaking text/type, source, linked
institution/case, submission/evidence, due date if applicable, verifier,
status, and history.\
**Acceptance criteria:** Submitted evidence is not automatically marked
verified; verification actor/time and result are recorded.

**FR-035 --- Track lease/document validity and expiry**\
**Priority:** MUST --- Core\
The system shall store document validity/expiry dates where they exist
in the source document or verified record, calculate approaching/expired
status using configurable thresholds, and link the document to the
relevant institution/application/obligation.\
**Acceptance criteria:** Missing or ambiguous expiry dates are flagged
for review; no date is invented; alerts can be traced to the document
and rule.

**FR-036 --- Maintain document versions and verification history**\
**Priority:** MUST --- Core\
The system shall preserve document version/upload history and record
verification outcome separately from upload.\
**Acceptance criteria:** A replacement file does not erase the previous
version/history; access is restricted; verification records identify
verifier and timestamp.

**FR-037 --- Configure checklists from APH annexures and category
clauses**\
**Priority:** MUST --- APH-dependent\
Document checklists shall be derived from the applicable annexures and
clauses for each supported category and process stage.\
**APH basis:** Chapter I/II submission clauses; Annexures and prescribed
formats/certificates.\
**Acceptance criteria:** Checklist entries identify their source;
requirements that vary by category are not shown as universally
mandatory.

### F. Deadline engine, notifications, and escalation

**FR-038 --- Maintain a regulatory deadline calendar**\
**Priority:** MUST --- Core\
The system shall distinguish official deadlines, internal targets,
response windows, committee dates, appeal periods where applicable,
undertakings, and document expiries.\
**Acceptance criteria:** Each deadline has a type, trigger, calculation
rule, source/version if regulatory, date/time basis, and status.

**FR-039 --- Calculate deadlines from versioned rules**\
**Priority:** MUST --- Core\
The deadline engine shall use approved, effective-dated rules and
documented calendar/business-day/timezone semantics.\
**Acceptance criteria:** A deadline can be recalculated/reproduced from
its stored inputs and rule version; a rule change does not silently
rewrite historical deadlines.

**FR-040 --- Send reminders and escalations according to
configuration**\
**Priority:** MUST --- Core\
The system shall generate configured reminders/escalations for
approaching deadlines, overdue cases, EVC changes, deficiency responses,
compliance, and document expiry.\
**Acceptance criteria:** Jobs re-check current state before sending;
completed/rescheduled cases do not receive obsolete reminders; duplicate
escalations are prevented; failed delivery is visible.

**FR-041 --- Maintain notification history**\
**Priority:** MUST --- Core\
The system shall record notification type, recipient, linked
case/entity, rule/event, creation time, send attempts, delivery/provider
result when available, and failure/retry status.\
**Acceptance criteria:** Queued, attempted, delivered/accepted by
provider, and failed states are not falsely conflated.

### G. Dashboard, reports, audit, and integration

**FR-042 --- Provide application pendency dashboard**\
**Priority:** MUST --- Core\
Provide authorised counts/lists of applications by current stage/status,
pending duration, overdue state, and relevant filters.\
**Acceptance criteria:** Counts match the underlying filtered records
and are permission-scoped.

**FR-043 --- Provide EVC status dashboard/calendar**\
**Priority:** MUST --- Core\
Show EVCs required by applicable route, scheduled/upcoming events,
changes, completion/report status, and overdue follow-up where data
exists.\
**Acceptance criteria:** The dashboard does not show an EVC as required
when the route does not require it.

**FR-044 --- Provide compliance and document-validity dashboard**\
**Priority:** MUST --- Core\
Show pending/overdue obligations, evidence awaiting verification,
documents approaching expiry, and expired documents.\
**Acceptance criteria:** Every displayed item links to the underlying
obligation/document and its status/source.

**FR-045 --- Provide overdue/escalation and region-wise reports**\
**Priority:** MUST --- Core\
Provide reports for overdue cases, escalation state, and region-wise
performance where region data is available and authorised.\
**Acceptance criteria:** Missing region data is handled explicitly;
region metrics are not fabricated.

**FR-046 --- Maintain an audit trail**\
**Priority:** MUST --- Core\
Record material actions and state changes, including submission,
assignment, workflow transitions, observations, responses, document
actions, EVC events, committee proceedings, recommendations, decisions,
official communications, compliance verification, rule changes,
notifications, escalations, and integrations.\
**Acceptance criteria:** Audit entries include actor/system identity,
timestamp, action/entity, outcome, safe change summary, and rule/source
reference where relevant; secrets are never logged.

**FR-047 --- Support authorised-system integration through adapters**\
**Priority:** MUST --- Core capability; live integration conditional\
Provide an integration boundary for authorised AICTE systems where a
supported interface and credentials are available.\
**Acceptance criteria:** External IDs and sync metadata are stored;
imports are idempotent; conflicts are surfaced; no integration is
claimed live until tested against an authorised system. A mock adapter
is visibly labelled simulated.

**FR-048 --- Record applicable penal/restoration cases without
automating legal judgement**\
**Priority:** OPTIONAL/FUTURE unless explicitly included in the selected
scope\
If the project includes Chapter VII cases, record notices, responses,
authorised actions, penalties/restoration status, evidence, and history
as case-management data.\
**APH basis:** Chapter VII.\
**Acceptance criteria:** The system does not autonomously impose a
penalty or infer a legal violation; only authorised users record
official actions.

**FR-049 --- Provide operational failure visibility**\
**Priority:** MUST --- Core\
Provide authorised operational visibility for failed jobs, stuck outbox
events, email/storage/database/integration errors, and real-time publish
failures where those components are deployed.\
**Acceptance criteria:** A failure can be diagnosed without exposing
credentials or private document contents.

**FR-050 --- Provide a requirement-to-test traceability matrix**\
**Priority:** MUST --- Core\
Map each requirement to its source, module, data/API/UI, role, test,
expected result, and evidence.\
**Acceptance criteria:** Each in-scope requirement has at least one
verification method and a status; regulatory rules point to exact APH
clauses/versions.

------------------------------------------------------------------------

## 5. Non-functional requirements

The supplied APH does not prescribe numeric latency, throughput, uptime,
or accessibility conformance targets for this prototype. The following
are engineering requirements for the system, not claims that the
handbook itself mandates those exact metrics. Numeric service-level
targets must be agreed and measured before production use.

### Security and privacy

**NFR-SEC-001 --- Server-side authorisation (MUST)**\
Every protected API operation shall authenticate the user and enforce
role, assignment, institution boundary, and resource ownership as
applicable. Frontend hiding is not a security control.

**NFR-SEC-002 --- Authentication solution (MUST)**\
The selected authentication solution must not be Better Auth. The
alternative must be explicitly decided before authentication
implementation; do not silently select one.

**NFR-SEC-003 --- Secret management (MUST)**\
Secrets must be stored in environment/secret management, not source
control, frontend bundles, logs, or documentation. Provide
`.env.example` placeholders only.

**NFR-SEC-004 --- Secure transport (MUST for deployment)**\
Production traffic and credentials must use HTTPS/TLS. Local development
exceptions must not leak into production configuration.

**NFR-SEC-005 --- Private documents (MUST)**\
Confidential documents must not be publicly readable by default. Every
file read/download must be checked against user permissions and resource
ownership.

**NFR-SEC-006 --- Input and upload validation (MUST)**\
Validate all API inputs and uploads server-side. Do not trust
client-side validation or MIME/filename values alone.

**NFR-SEC-007 --- Safe logging (MUST)**\
Never log passwords, session/access tokens, secrets, or unnecessary
document contents. Redact sensitive values from errors and operational
logs.

**NFR-SEC-008 --- Session and request protections (MUST)**\
The chosen authentication design must include appropriate session/token
expiry and revocation, rate limiting for sensitive authentication
operations, narrow CORS, and CSRF protection where relevant to
cookie/session use.

**NFR-SEC-009 --- Data isolation (MUST)**\
Institution users must not be able to access another institution's
records/files unless explicitly authorised. Test cross-tenant access
denial.

**NFR-SEC-010 --- Audit integrity (MUST)**\
Ordinary users must not edit or delete audit history. Corrections to
material records must themselves be traceable.

### Correctness and regulatory traceability

**NFR-COR-001 --- Source traceability (MUST)**\
Every active regulatory rule must cite the official source, exact
clause/table/annexure, version, effective dates, and review status.

**NFR-COR-002 --- No guessed rules (MUST)**\
Unknown or ambiguous regulatory conditions must be flagged for
authorised review. The system must not invent route, deadline, fee,
eligibility, or document requirements.

**NFR-COR-003 --- Rule versioning (MUST)**\
Historical cases must retain the rule version used for route/deadline
calculations. New rules must not silently rewrite completed decisions or
past audit records.

**NFR-COR-004 --- Human authority (MUST)**\
The system must not autonomously create a statutory approval/rejection
decision. Recommendations, review outcomes, and official decisions are
separate records.

**NFR-COR-005 --- Consistent state (MUST)**\
Database updates, workflow history, audit events, and required durable
outbox records must be transactionally consistent where the chosen
database supports it.

### Reliability and recovery

**NFR-REL-001 --- Idempotent actions (MUST)**\
Repeated requests, retries, or duplicate events must not create
duplicate workflow transitions, reminders, or escalations.

**NFR-REL-002 --- Durable scheduled work (MUST when reminders are
enabled)**\
Scheduled work must survive application restarts according to the
selected job system and must expose failures/retries.

**NFR-REL-003 --- Current-state recheck (MUST)**\
A delayed job must re-check the latest case state, due date, recipient
permissions, and rule before sending or escalating.

**NFR-REL-004 --- Real-time recovery (MUST when live updates are
enabled)**\
The frontend must recover from disconnections and reconcile missed
updates from authoritative state. Real-time messages cannot be the only
source of truth.

**NFR-REL-005 --- Backup/recovery (SHOULD; MUST before production)**\
Document backup/restore responsibilities and test recovery before
production use. Retention requirements must be verified, not guessed.

**NFR-REL-006 --- Failure visibility (MUST)**\
Failed integrations, notifications, storage operations, jobs, and
real-time publishing must be observable by authorised maintainers.

### Performance

**NFR-PERF-001 --- Responsive core workflows (SHOULD)**\
Common list/detail and workflow interactions should be designed to avoid
unnecessary full-page reloads and unbounded queries. Numeric latency
targets must be defined and measured before production.

**NFR-PERF-002 --- Pagination and filtering (MUST for growing lists)**\
Application, audit, notification, document, and report lists must
support server-side pagination/filtering when datasets can grow beyond a
small demo.

**NFR-PERF-003 --- Efficient dashboard metrics (SHOULD)**\
Dashboard queries/read models must have defined semantics and
appropriate indexes. Any caching must not produce misleading or
unauthorised counts.

**NFR-PERF-004 --- Asynchronous external work (SHOULD)**\
Slow email, integration, and scheduled processing should not block
interactive API requests unnecessarily.

### Accessibility and usability

**NFR-A11Y-001 --- Keyboard operation (SHOULD)**\
Primary navigation, forms, dialogs, tables, and actions should be usable
by keyboard.

**NFR-A11Y-002 --- Labels and errors (SHOULD)**\
Form controls need programmatic labels; errors must be associated with
fields and communicated clearly.

**NFR-A11Y-003 --- Status is not colour-only (SHOULD)**\
Status badges must include text/iconography or another non-colour cue;
colour alone must not convey a workflow state.

**NFR-A11Y-004 --- Responsive layouts (SHOULD)**\
Primary institution and officer workflows should remain usable at common
desktop and tablet sizes; smaller-screen support should be documented
and tested.

**NFR-UX-001 --- Clear state and provenance (MUST)**\
The UI must distinguish current status, overdue state, recommendation,
official decision, formal communication, and notification.
Demo/simulated records must be labelled.

**NFR-UX-002 --- Recoverable user actions (SHOULD)**\
Users should receive clear validation and conflict messages; destructive
or irreversible actions should require appropriate confirmation and
authority.

### Maintainability and extensibility

**NFR-MAINT-001 --- Required repository layout (MUST)**\
Maintain separate root-level `frontend/`, `backend/`, and `docs/`
directories. The user manually adds and maintains Markdown documentation
in `docs/`.

**NFR-MAINT-002 --- Type safety and validation (SHOULD)**\
Use TypeScript for the recorded frontend/backend baseline and Zod or
equivalent backend schemas for request validation.

**NFR-MAINT-003 --- Modular domain design (SHOULD)**\
Keep workflow, rules, compliance, documents, notifications, audit, and
integration logic in clear modules. A modular monolith is acceptable;
microservices are not required.

**NFR-MAINT-004 --- API contract (SHOULD)**\
Document implemented REST endpoints and error shapes using
OpenAPI/Swagger.

**NFR-MAINT-005 --- Configuration over hard-coding (MUST for regulatory
rules)**\
Regulatory routes, deadlines, category checklists, reminder thresholds,
and rule versions must be configured and source-linked rather than
scattered as literals in code.

### Scalability and portability

**NFR-SCALE-001 --- Growth-ready data access (SHOULD)**\
Use indexes, pagination, explicit relationships, and measured query
plans. Do not claim a numeric scale target until one is defined.

**NFR-SCALE-002 --- Provider adapters (SHOULD)**\
Keep document storage, real-time, email, and external AICTE integration
behind clear interfaces to avoid coupling core workflow rules to one
vendor.

**NFR-SCALE-003 --- Avoid duplicate sources of truth (MUST)**\
Define one authoritative store for each business record. A real-time
provider must not accidentally become a second conflicting authority for
application/workflow data.

**NFR-SCALE-004 --- Low-cost prototype (MUST as project constraint)**\
Prefer a small number of managed services and avoid unnecessary
infrastructure. Confirm current quotas/pricing rather than promising
that a provider is free.

### Testing and observability

**NFR-TEST-001 --- Automated tests (MUST)**\
Cover domain rules, workflow transitions, API validation/auth, access
boundaries, background jobs, document permissions, and critical
end-to-end flows.

**NFR-TEST-002 --- Negative-path tests (MUST)**\
Test unauthenticated, wrong-role, wrong-owner, invalid input, invalid
state, duplicate/stale action, not-found, concurrency conflict, and
provider-failure cases where applicable.

**NFR-OBS-001 --- Structured operational logging (SHOULD)**\
Provide structured, redacted logs with request/correlation IDs where
practical.

**NFR-OBS-002 --- Health and operational status (SHOULD)**\
Provide deployment health checks and authorised views of failed jobs,
integrations, storage, email, and real-time publishing. Do not expose
secrets through health endpoints.

------------------------------------------------------------------------

## 6. Role permissions and restrictions

This is the **minimum proposed permission model** for the prototype. The
APH defines official roles/bodies and their functions, but does not
provide a ready-made application software RBAC matrix. The final matrix
must be reviewed against the exact process and authority structure
before use. These roles must not be represented as official AICTE job
titles unless verified.

  ----------------------------------------------------------------------------------------------------------------------------------------------
  Capability                   Institution   Scrutiny reviewer     EVC/committee     Authorised    System administrator  Monitoring/report user
                               user                                user              decision                            
                                                                                     authority                           
  ---------------------------- ------------- --------------------- ----------------- ------------- --------------------- -----------------------
  View own institution/cases   Yes, own      Assigned cases        Assigned cases    Authorised    Technical access only Aggregated/authorised
                               scope                                                 scope         as necessary and      scope
                                                                                                   audited               

  Create/edit draft            Own scope,    No, except authorised No                No by default No by default         No
  application                  before        correction workflow                                                         
                               submission or                                                                             
                               as allowed                                                                                

  Submit application/evidence  Own scope     No                    No                No            No                    No

  View uploaded documents      Own scope     Assigned cases        Assigned          As authorised Only if operationally No by default
                                                                   cases/committee                 necessary, audited    
                                                                   purpose                                               

  Record scrutiny observations No            Yes, assigned scope   No unless         No by default No by default         No
                                                                   separately                                            
                                                                   authorised                                            

  Issue/record deficiency      No            Yes, if role/process  No by default     As authorised No by default         No
                                             permits                                 by route                            

  Respond to deficiency        Own           No on institution's   No                No            No                    No
                               application   behalf except                                                               
                                             explicit authorised                                                         
                                             action                                                                      

  Schedule/manage EVC          View relevant As                    Yes, if           As authorised Configuration only,   View only
                               schedule      assigned/authorised   designated                      not authority by      
                                                                   coordinator                     default               

  Record committee             No            Only if also          Yes, within       Yes where     No by default         No
  proceedings/recommendation                 authorised            assigned          role includes                       
                                                                   committee role    that function                       

  Record official decision     No            No unless explicitly  No unless         Yes, within   No by default         No
                                             vested with decision  explicitly vested verified                            
                                             authority             with decision     authority                           
                                                                   authority                                             

  Record appeal case           Submit/view   View assigned case if SAC/appeal role   As authorised No by default         No
                               own appeal    authorised            only as                                               
                               where                               applicable                                            
                               applicable                                                                                

  Submit compliance evidence   Own           No                    No                No            No                    No
                               institution                                                                               

  Verify compliance evidence   No            If assigned and       If assigned and   As authorised No by default         No
                                             authorised            authorised                                            

  Configure regulatory rules   No            No                    No                Only if       Technical             No
                                                                                     separately    configuration access  
                                                                                     designated as must not auto-approve 
                                                                                     rule approver rules                 

  Approve/activate regulatory  No            No by default         No by default     Only if       No automatic          No
  rules                                                                              designated    privilege             
                                                                                     rule approver                       
                                                                                     under                               
                                                                                     governance                          

  Manage users/roles           No            No                    No                No by default Yes, audited          No

  View full audit trail        Own relevant  Assigned cases        Assigned cases    Authorised    Security/operations   Report scope only
                               history where                                         scope         scope                 
                               appropriate                                                                               

  View operational failures    No            No                    No                No by default Yes                   Limited if explicitly
                                                                                                                         authorised

  Export reports               Own data      Assigned cases        Assigned cases    Authorised    Technical reports     Approved
                               where                                                 scope         only as needed        aggregate/authorised
                               permitted                                                                                 data

  Delete official              No            No                    No                No ordinary   No                    No
  decisions/audit records                                                            deletion;                           
                                                                                     corrections                         
                                                                                     are new                             
                                                                                     records                             
  ----------------------------------------------------------------------------------------------------------------------------------------------

### Role rules

**ROLE-001 --- Institution boundary:** Institution users can access only
records associated with their institution and permitted users/roles.

**ROLE-002 --- Assignment boundary:** Reviewers and committee users can
access assigned cases and only the functions granted to their role.

**ROLE-003 --- Separation of duties:** A user who can administer
accounts does not automatically gain authority to make official
decisions.

**ROLE-004 --- Decision authority:** Only a role mapped to the
applicable authorised decision-making body/person can record the
official decision.

**ROLE-005 --- Rule governance:** Technical ability to edit
configuration is not equivalent to authority to approve/activate
regulatory rules.

**ROLE-006 --- Audited administration:** User, role, permission, rule,
and workflow configuration changes must be recorded with
actor/time/reason.

**ROLE-007 --- Server enforcement:** Every permission is enforced by
backend checks; client-side routes and hidden buttons are not
sufficient.

**ROLE-008 --- Least privilege:** If role/authority is ambiguous, deny
the protected action and flag the case for authorised administration
rather than granting broad access.

------------------------------------------------------------------------

## 7. Business rules

The following rules are either explicit in the supplied APH or required
to implement the project safely. APH rules must be tied to the precise
application category and verified clause.

### 7.1 APH-derived business rules

**BR-001 --- No universal workflow.**\
Route steps are category-specific. Chapter I clause 1.8 governs
scrutiny/re-scrutiny for new-institution cases; clause 1.9 governs EVC;
Chapter II clauses 2.23 and Table 2.3 specify processing for Chapter II
categories. Other chapters have their own procedures.

**BR-002 --- Online submission and unique reference.**\
For new technical institution applications, Chapter I clauses 1.3.1 and
1.4.1 describe online application through the National Single Window
System/AICTE portal flow and an application-specific identifier. The
prototype must not claim to submit through those systems unless
integrated with authorised interfaces.

**BR-003 --- Cut-off and payment rules.**\
Chapter I clauses 1.2 and 1.4.2 state that submission/payment must meet
the notified deadline for the scope covered. Chapter II has its own time
schedule and charges. The system must use category-specific dates and
not assume a universal amount/date.

**BR-004 --- Application editing.**\
Chapter I clause 1.4.3 says data can be edited until final submission
and is not allowed further editing until processing is complete for the
scope covered. Chapter II clause 2.3.3 addresses data entry, deficiency
report, and reopening. Implement editing locks/reopening according to
the applicable route, not as a universal blanket rule.

**BR-005 --- Digitally signed documents.**\
Chapter I clauses 1.4.3--1.4.6 specify
digital-signature/affidavit/document requirements for the covered
process. The exact checklist must be category-specific. Uploading a file
alone is not proof that a required signature/attestation is valid.

**BR-006 --- Scrutiny deficiency flow.**\
Chapter I clause 1.8 describes scrutiny, communication of deficiencies,
re-scrutiny of identified deficiencies, and further processing when the
application is in order. Apply only to the routes governed by that
clause.

**BR-007 --- EVC process.**\
Chapter I clause 1.9 describes EVC verification of
infrastructure/facilities and relevant requirements, including
online/physical process-specific evidence. The EVC checklist must
reflect the applicable route and mode.

**BR-008 --- Human/authority decision.**\
Chapter I clause 1.10 describes Executive Committee consideration of
recommendations and Regulation Bureau views, with Council ratification.
The system must model the applicable decision authority and ratification
state where relevant; it must not infer an approval from a preceding
report.

**BR-009 --- Appeals are scope-specific.**\
Chapter I clause 1.11 and Chapter II clause 2.24 provide appeal
procedures for the categories covered by those clauses. Chapter II
clause 2.24(a) states a seven-day period for the relevant decision
scope. Do not apply seven days to every AICTE decision or application.

**BR-010 --- SHC and SAC are distinct.**\
Chapter II clause 2.23.3 describes SHC compliance review and Executive
Committee decision for the scope covered; clause 2.24 describes SAC
consideration of appeals. The software must not merge their roles.

**BR-011 --- Institution closure dependency.**\
Chapter I clause 1.8(i) describes a specific simultaneous closure/new
institution case where closure is processed first and the new
institution application proceeds only if closure is recommended.
Implement this dependency only for the specified case.

**BR-012 --- Reports and transparency.**\
The notes to Chapter I clauses 1.8--1.9 state that scrutiny/re-scrutiny
and EVC are generally online, with offline handling in extraordinary
circumstances, and that processing should be recorded for
transparency/accountability. Model mode and event history without
claiming an event/video was recorded if it was not.

**BR-013 --- Application categories in Chapter II.**\
Chapter II includes many distinct categories (clauses 2.6--2.22).
Support each category only when its route, conditions, documents, and
tests have been extracted and reviewed. Unsupported categories must not
silently fall back to a different route.

**BR-014 --- Chapters III--V remain distinct.**\
Collaboration/twinning (Chapter III), universities (Chapter IV), and
ODL/online learning (Chapter V) have separate provisions. If included,
configure their own requirements; do not blindly reuse Chapter I/II
route rules.

**BR-015 --- Institutional compliance is source-driven.**\
Chapter VI contains standard norms and requirements. The application may
track selected obligations as configurable compliance items, but each
active obligation and due date must be traceable to its applicable
clause/annexure and category.

**BR-016 --- Penal actions require authority.**\
Chapter VII covers penal actions and restoration. The prototype may
track notices/actions if in scope but must not autonomously decide that
a violation occurred or impose a penalty.

### 7.2 System business rules

**BR-017 --- One authoritative workflow state.**\
Each application has one authoritative current workflow state, with a
separate append-only stage history.

**BR-018 --- Rule-version provenance.**\
Every route and regulatory deadline stores the rule version used to
calculate/select it.

**BR-019 --- No silent mutation.**\
Submitted data, decisions, official communications, and audit records
cannot be silently overwritten. Permitted corrections create a new
history event with actor, time, reason, and authority.

**BR-020 --- Recommendation is not decision.**\
A recommendation/report cannot directly create an official
approval/rejection state.

**BR-021 --- Notification is not official communication.**\
A notification or email reminder does not become a formal order merely
because it was sent.

**BR-022 --- Upload is not verification.**\
A submitted file is not marked verified/valid until an authorised
verification step is recorded.

**BR-023 --- Re-check before delayed action.**\
A reminder/escalation job checks current case state and current
recipient/permission information before acting.

**BR-024 --- Real-time event is not durable truth.**\
A missed or duplicate live event must not corrupt the authoritative
application state; clients reconcile through the API.

**BR-025 --- No cross-institution disclosure.**\
All API, document, notification, real-time, search, export, and
reporting paths enforce access scope.

**BR-026 --- Simulated systems are labelled.**\
Mock payments, mock AICTE integrations, seeded data, or simulated
delivery must be visibly labelled as such.

------------------------------------------------------------------------

## 8. Validation rules and edge cases

The following validations are required. Exact field-level requirements
and allowed values must come from the relevant application form, clause,
annexure, or approved system schema.

### 8.1 Application validation

**VAL-001:** Reject malformed/missing required fields according to the
selected category's checklist.\
**VAL-002:** Reject or flag unsupported application categories; do not
silently map them to a similar category.\
**VAL-003:** Prevent final submission if configured mandatory
requirements are unmet.\
**VAL-004:** Enforce application cut-off and payment prerequisites only
from the applicable active rule.\
**VAL-005:** Lock edits after final submission where the applicable
process requires it; reopening must be authorised and audited.\
**VAL-006:** Enforce unique internal application identifiers; handle
duplicate submissions/idempotency safely.\
**VAL-007:** If an external AICTE identifier is missing because no
authorised integration exists, do not fabricate one; use a clearly
labelled internal reference.

### 8.2 Document validation

**VAL-008:** Validate file size, extension, MIME type/content where
feasible, and upload permissions.\
**VAL-009:** Treat required digital signature/attestation as a separate
validation/verification state.\
**VAL-010:** Do not mark a document valid solely because it uploaded
successfully.\
**VAL-011:** Do not infer missing issue/expiry dates; mark them
unknown/needs review.\
**VAL-012:** Replaced documents retain previous versions and audit
history.\
**VAL-013:** Block access when the user lacks access to the linked
institution/application, even if the storage key/URL is known.\
**VAL-014:** A missing or unavailable file reference must be surfaced as
a storage/data-integrity issue, not silently ignored.

### 8.3 Workflow and committee validation

**VAL-015:** Reject transitions not defined by the active workflow
definition.\
**VAL-016:** Re-check current state on the server to prevent stale or
concurrent actions from skipping a stage.\
**VAL-017:** Do not schedule an EVC unless the selected route/rule
requires or authorises it.\
**VAL-018:** Do not treat re-scrutiny as a full repeat of scrutiny where
the applicable clause limits it to specified deficiencies.\
**VAL-019:** Do not let a committee report/recommendation automatically
become a final decision.\
**VAL-020:** Do not let a technical administrator make an official
decision solely by virtue of technical admin permissions.\
**VAL-021:** Appeal availability and due date are determined by the
applicable decision type/route, not a global default.\
**VAL-022:** If an application depends on another application/outcome,
do not advance the dependent case before the prerequisite is satisfied.

### 8.4 Deadlines and notifications

**VAL-023:** Store the source, trigger, timezone, calculation semantics,
and rule version for regulatory deadlines.\
**VAL-024:** Distinguish calendar days from business days only as
specified by the applicable rule.\
**VAL-025:** A rule update must not silently alter a historical deadline
or decision record.\
**VAL-026:** Before sending a reminder, check whether the item was
completed, cancelled, rescheduled, or reassigned.\
**VAL-027:** Retry must not generate duplicate reminders/escalations.\
**VAL-028:** If the email provider is unavailable, retain the
notification attempt/failure and expose it to authorised operators.\
**VAL-029:** If real-time delivery fails, durable state remains correct
and the client can recover by re-fetching state.\
**VAL-030:** Do not report delivery as successful unless the configured
provider gives the corresponding acknowledgement; distinguish
queued/attempted/provider-accepted/failed states.

### 8.5 Reporting, permissions, and integration

**VAL-031:** Dashboard filters and counts must use a documented
definition and consistent status semantics.\
**VAL-032:** Reports/export endpoints enforce the same data-access rules
as the UI.\
**VAL-033:** Missing region or category data must be shown as
unknown/unclassified rather than invented.\
**VAL-034:** Imports are idempotent; repeated import does not duplicate
cases.\
**VAL-035:** Conflicting external/internal data is surfaced for
reconciliation and is not silently overwritten.\
**VAL-036:** If no authorised integration exists, display
simulated/manual-import provenance clearly.\
**VAL-037:** Audit logs must not contain passwords, access tokens,
secrets, or unnecessary document content.

### 8.6 Edge-case scenarios that must be tested

-   Submission occurs near or after a cut-off.
-   Required document is absent, corrupt, duplicated, expired, unsigned,
    or rejected.
-   A document has no reliable expiry date.
-   An institution submits a response after the configured deadline.
-   A reviewer tries to act on an unassigned case.
-   A user from Institution A requests Institution B's record/file.
-   Two reviewers attempt conflicting transitions simultaneously.
-   A reminder is queued and the case is completed/rescheduled before it
    executes.
-   Email/queue/database/storage/real-time provider is unavailable.
-   A real-time connection disconnects and reconnects after multiple
    changes.
-   A rule is superseded while applications are in progress.
-   A route/category cannot be confidently determined.
-   A mock external ID/payment status is mistaken for a real one.
-   A committee recommendation is present but no authorised decision has
    been entered.
-   An appeal is attempted for a decision/category where the configured
    route does not provide it.
-   An application depends on another application that is rejected,
    pending, or changed.
-   A report includes incomplete region/status data.
-   An administrator changes role permissions while a user has an active
    session.

------------------------------------------------------------------------

## 9. Acceptance criteria by major feature

A feature is accepted only when its applicable requirements and tests
pass. "UI exists" is not sufficient.

### AC-01 --- Application intake and tracking

-   Application can be created and linked to the correct
    institution/applicant.
-   Unique internal reference is assigned.
-   Category, academic cycle, and route inputs are validated.
-   Required checklist is category-specific and source-linked.
-   Submission/editing/cut-off behaviour follows the applicable
    configured rule.
-   Status history is visible to authorised users.

### AC-02 --- Workflow route engine

-   Every supported category has a reviewed route definition and source
    reference.
-   Route selection is deterministic for valid input.
-   Missing/ambiguous inputs trigger review rather than a guessed route.
-   Invalid transitions are rejected server-side.
-   Route version and transition history are recorded.
-   Automated tests cover all supported route branches and prohibited
    transitions.

### AC-03 --- Scrutiny and deficiency handling

-   Assigned reviewer can record observations and deficiency records.
-   Deficiency notice is linked to case and contains the configured
    deadline/source where applicable.
-   Institution can respond with supporting evidence when permitted.
-   Re-scrutiny is restricted to the correct scope where required.
-   Reports/history are retained and access controlled.

### AC-04 --- EVC scheduling and records

-   EVC is represented only where applicable.
-   Schedule, mode, status, assignment references, changes, and report
    references are recorded.
-   Mode-specific evidence checklist is used where applicable.
-   EVC status/dashboard values match the underlying records.
-   Relevant users receive configured updates, and all changes are
    auditable.

### AC-05 --- Committees, decisions, appeals, and official communications

-   Committee types/roles are distinct where APH distinguishes them.
-   Proceedings and recommendations are separate from decisions.
-   Only authorised roles can record official decisions.
-   Formal communication/order is linked to the decision and kept
    separate from reminders.
-   Appeal availability/deadline follows the applicable rule, including
    no global application of the seven-day provision.
-   Corrections preserve original history.

### AC-06 --- Compliance and document validity

-   Obligations are linked to institution/case and source/rule.
-   Due dates and statuses are source/configuration-driven.
-   Evidence submission and verification are separate.
-   Document versions and verification history persist.
-   Missing expiry date is flagged, not guessed.
-   Approaching/expired items appear correctly on dashboards and trigger
    configured alerts.

### AC-07 --- Notifications and escalation

-   Configured reminders/escalations are scheduled durably.
-   Jobs re-check current state before sending.
-   Duplicate jobs/actions do not create duplicate alerts.
-   Failed delivery/retries are observable.
-   Historical notification state distinguishes queued, attempted,
    provider-accepted, and failed.
-   A notification never substitutes for an official order.

### AC-08 --- Real-time UI updates

-   Provider selected explicitly and does not use Neon Realtime.
-   Authorised users receive only events within their scope.
-   Defined status/schedule/notification updates appear without manual
    page refresh during normal connection.
-   Reconnect causes a state reconciliation.
-   Duplicate/missed/out-of-order events do not corrupt state.
-   REST/database state remains authoritative.

### AC-09 --- Dashboard and reports

-   Pendency, EVC, compliance, expiry, overdue, escalation, and region
    metrics are defined.
-   Counts reconcile with underlying filtered data.
-   Permission checks apply to filters, lists, exports, and drill-downs.
-   Missing data is not fabricated.
-   Reports are reproducible from recorded source data and time filters.

### AC-10 --- Security and audit

-   Unauthenticated access is rejected.
-   Wrong-role, wrong-institution, unassigned-case, and private-file
    requests are denied.
-   Critical actions produce traceable audit events.
-   Secrets/private file contents do not appear in logs.
-   Admin access does not imply decision authority.
-   Audit history cannot be silently edited/deleted through ordinary
    APIs.

### AC-11 --- Integration and operational reliability

-   Integration uses an authorised interface or is visibly labelled
    simulated.
-   Imports are idempotent and conflicts are surfaced.
-   Database/queue/storage/email/realtime failures do not silently
    corrupt the authoritative case state.
-   Failed jobs and integrations are visible to authorised maintainers.
-   Recovery/reconciliation procedures are documented and tested for
    deployed services.

### AC-12 --- Traceability and release readiness

-   Every in-scope requirement has a source/owner/module/test/status.
-   Regulatory rules have exact APH clause/version references and review
    status.
-   All critical positive and negative tests pass.
-   Known unsupported categories, mock integrations, and limitations are
    documented.
-   No unresolved technical choice is silently hard-coded into
    provider-specific architecture.

------------------------------------------------------------------------

## 10. Optional and future requirements

These are not core requirements unless the project owner explicitly
promotes them to scope.

**OPT-001 --- OCR/document extraction:** Extract metadata or text from
uploaded documents to assist reviewers. Any extracted value must be
marked machine-extracted and verified by an authorised human; OCR/AI
must not make statutory decisions.

**OPT-002 --- AI-assisted deficiency classification:** Suggest
categories/summaries for observations only if evaluated, traceable, and
human-reviewed. Not required for initial version.

**OPT-003 --- Advanced analytics:** Trend analysis, workload
forecasting, bottleneck detection, and predictive insights. Not required
for initial version.

**OPT-004 --- Full Chapter VII penal/restoration case management:**
Track notices, responses, authorised actions, and restoration workflows
only if expressly included. No autonomous penalty decision.

**OPT-005 --- Full coverage of every Chapter III--V route:** Add only
after route-specific requirements, documents, roles, and test cases have
been extracted and verified.

**OPT-006 --- SMS/WhatsApp/push notifications:** Optional delivery
channels; require provider selection, authorisation, privacy review, and
delivery tracking.

**OPT-007 --- Digital-signature cryptographic validation:** Add only if
an approved validation mechanism and integration are available.
Otherwise record status and require authorised manual verification; do
not claim cryptographic validation.

**OPT-008 --- Advanced integration synchronisation:** Scheduled two-way
sync with authorised AICTE systems, conflict resolution, and
reconciliation dashboards, subject to access and API availability.

**OPT-009 --- Multi-language interface:** Not required unless specified
by project owner.

**OPT-010 --- Separate workflow/BPM engine:** Camunda or similar is not
required; use a configurable internal workflow engine unless
requirements justify a dedicated engine.

------------------------------------------------------------------------

## 11. Technical constraints that affect requirements

-   Repository must keep `frontend/`, `backend/`, and `docs/` separate.
    The user manually adds and maintains `.md` files in `docs/`.
-   Recorded frontend proposal: React, TypeScript, Vite, Tailwind CSS,
    shadcn/ui, React Router, Recharts, FullCalendar.
-   Recorded backend proposal: Node.js, Express, TypeScript, Zod,
    Swagger/OpenAPI.
-   Prisma is proposed if PostgreSQL remains the chosen database.
-   Vitest, Supertest, and Playwright are the recorded test-tool
    proposal.
-   BullMQ + Redis is proposed for scheduled reminders/escalations,
    optional in the earliest prototype.
-   Nodemailer + SMTP is proposed for email; SMTP provider is
    unselected.
-   Neon PostgreSQL and Neon Object Storage were previously provisioned,
    but their final role is unresolved after the user clarified that
    real-time must not use Neon.
-   **Better Auth is excluded.** Authentication alternative is
    unresolved.
-   **Neon Realtime is excluded.** Real-time provider/transport is
    unresolved.
-   Do not create provider-specific implementation before the relevant
    unresolved provider choice is confirmed.
-   Keep real-time publishing, storage, email, and external integrations
    behind adapters so they can be changed without rewriting regulatory
    domain logic.

------------------------------------------------------------------------

## 12. Requirement traceability and regulatory configuration workflow

Before a regulatory rule is enabled in a live workflow, maintain a rule
record with: - rule ID; - exact APH chapter/clause/table/annexure; -
source title and edition; - verification date and reviewer; -
application category and conditions; - effective dates; - input fields
used to determine applicability; - route/deadline/checklist result; -
approved status; - test cases and expected results; - version and
supersession relationship.

Suggested governance states: `DRAFT`, `IN_REVIEW`, `APPROVED`, `ACTIVE`,
`SUPERSEDED`, `RETIRED`. Only authorised approvers may move a rule to
`APPROVED`/`ACTIVE`. These enum names are implementation suggestions;
final names may differ, but the governance controls are required.

For each requirement, maintain a traceability record linking:
`Requirement ID → APH source/PS item → domain module → entity → API/UI → permission → test case → evidence → implementation status`.

Do not mark an APH-dependent requirement complete merely because a
generic UI exists. It is complete only when the applicable rule and
category are correctly configured and tested, or when the category is
explicitly marked out of scope.

------------------------------------------------------------------------

## 13. Unresolved decisions --- must not be guessed

1.  **Authentication provider/approach:** Better Auth is excluded;
    alternative is not confirmed.
2.  **Real-time provider/transport:** Required; Neon Realtime excluded;
    alternative not selected.
3.  **Database:** Whether to keep Neon PostgreSQL or replace Neon
    entirely.
4.  **Document storage:** Whether to keep Neon Object Storage or replace
    it.
5.  **SMTP/email provider.**
6.  **Redis/job hosting provider.**
7.  **Frontend/backend deployment provider.**
8.  **Final user-role names and permission matrix.**
9.  **Exact application categories to support in the prototype.** The
    APH includes many; do not imply full category coverage unless
    implemented.
10. **Current applicability of APH 2024--2027 and any later
    amendments/circulars.**
11. **Authorised AICTE API/interface credentials and permitted data
    scope.**
12. **Whether OCR/AI, penal/restoration workflow, or advanced analytics
    are in scope.**
13. **Final database schema, API contract, and real-time event
    contract.**
14. **Numerical performance targets, uptime target, and accessibility
    conformance target.** Do not invent numeric SLOs.

If a task depends on one of these decisions, Antigravity must stop
before provider-specific or irreversible implementation and request
clarification or mark the affected requirement blocked.

------------------------------------------------------------------------

## 14. Release gate checklist

A release/demo build must not be called complete until: - \[ \] All
in-scope functional requirements have unique IDs and implementation/test
status. - \[ \] Each supported APH route is traced to the exact
applicable clause/table/annexure. - \[ \] The relevant handbook version
and amendments have been checked for applicability. - \[ \] Unverified
rules are not active. - \[ \] Authentication is implemented with the
explicitly selected non-Better-Auth solution. - \[ \] RBAC and
institution/assignment boundaries are enforced server-side. - \[ \] The
real-time service is explicitly selected and is not Neon Realtime. - \[
\] The database/storage choices are documented and consistently
implemented. - \[ \] No official decision is made automatically. - \[ \]
Recommendation, decision, official order, and notification are
distinct. - \[ \] Document upload, access, versioning, and verification
are tested. - \[ \] Deadlines and reminders are reproducible from
versioned rules. - \[ \] Duplicate/stale jobs and transitions are
handled safely. - \[ \] Dashboard metrics reconcile with underlying
records. - \[ \] Audit trail covers all critical actions. - \[ \] Mock
data/integrations are clearly labelled. - \[ \]
Failure/reconnect/reconciliation paths are tested. - \[ \] The
requirement-to-test matrix is complete for the release scope. - \[ \]
Known limitations and unsupported categories are documented.

------------------------------------------------------------------------

## 15. Source fidelity note

This requirements document is grounded in the supplied *AICTE Approval
Process Handbook 2024--2027* and the project capability requirements
discussed for this system. The APH is the source for regulatory process
statements; the project problem statement and engineering constraints
supply product features such as dashboards, centralised pendency
monitoring, alerts, audit trail, RBAC, and real-time UI behaviour.

The APH does not itself define the chosen web stack, real-time provider,
authentication provider, deployment platform, numeric performance
targets, or a complete software RBAC matrix. Those items are identified
as engineering requirements or unresolved choices rather than falsely
attributed to the APH.

The APH's clauses and tables are category-specific. This document
deliberately avoids claiming that every listed process applies to every
application. Each implemented category must have a separately verified
route, checklist, deadline/fee configuration where relevant, roles, and
tests.

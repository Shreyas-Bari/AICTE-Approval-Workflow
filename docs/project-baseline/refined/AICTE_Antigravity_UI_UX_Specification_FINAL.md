# Antigravity UI/UX Specification — AICTE Integrated Approval Workflow Platform

**Document type:** Implementation specification  
**Status:** Final UI/UX direction for the current frontend implementation  
**Primary source:** Selected Google Stitch screens, their `code.html` files, and `regulatory_workflow_system/DESIGN.md` supplied in `stitch_aicte_workflow_platform_ui_ux_design.zip`  
**Technical baseline:** `Tech Stack Reasoning.txt`  
**Product context:** Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System

---

## 1. Purpose and precedence

This document is the implementation-facing UI/UX specification for Antigravity. It consolidates the selected Stitch visual references with the project’s technical direction and regulatory workflow context.

### 1.1 How to use the reference files

The selected screenshots and HTML are **visual and interaction references**, not a requirement to reproduce their literal content, sample records, labels, metrics, routes, or fabricated institution names. Build real screens around the backend models, implemented APIs, role permissions, and approved workflow requirements.

Use the reference package to guide:
- Overall visual tone and hierarchy.
- Light surfaces, navy/blue palette, restrained semantic color.
- Sidebar/top-header shell and active navigation treatment.
- Rounded surfaces, compact status chips, typography, whitespace and subtle elevation.
- Login and recovery composition.
- Institution dashboard composition.
- Official scrutiny console, split-pane document review and work queue.
- Administrator console and shared component patterns.

Do not blindly copy sample numbers, invented names, hard-coded statuses, demo actions, or HTML-specific implementation details from Stitch. The generated HTML is not production code and must be refactored into maintainable React components. It may include inline styles, utility classes, static data, or placeholder interactions.

### 1.2 Precedence when documents disagree

Apply this order:
1. Actual backend/API contracts, authorization rules and database models.
2. Approved product/problem-statement requirements and applicable AICTE Approval Process Handbook/workflow rules.
3. This UI/UX specification for visual design, information hierarchy, layout and interaction behavior.
4. Stitch screenshots and code as visual references only.
5. Antigravity implementation convenience.

Do not invent an API endpoint, database field, workflow state, permission, regulatory rule, or decision authority to make a screen look complete. If a required field or state is not supported by the backend or approved requirements, flag it for clarification or render a deliberate unavailable/empty state.

---

## 2. Product and user roles

The application is a regulated operational workflow product, not a marketing website.

### 2.1 Institution users
Typical needs:
- View institution-specific work and deadlines.
- Start, save, complete and submit applications.
- Maintain application details and supporting documents.
- Track scrutiny progress and application history.
- Review deficiency notices and submit responses/resubmissions.
- Monitor compliance obligations, evidence and due dates.
- Receive notifications and understand what action is required next.

### 2.2 AICTE officials
Typical needs, subject to actual permissions:
- Work assigned scrutiny queues and pending tasks.
- Open an application’s full record and supporting documents.
- Record scrutiny observations.
- Issue deficiency notices through the authorized workflow.
- Review institutional responses and resubmissions.
- Manage relevant EVC schedules and committee/proceeding records.
- Monitor compliance and overdue items.
- Inspect a traceable audit history.

Different official roles may have different permissions. The UI must derive available actions from the signed-in user’s permissions, not merely hide or show buttons based on a guessed role label.

### 2.3 System administrators
Typical needs:
- Manage users and access roles.
- Configure supported workflow parameters.
- Manage notification/escalation settings where implemented.
- Inspect operational or administrative records.
- Review administrative audit activity.

Administrative access must not automatically imply authority to make regulatory decisions.

### 2.4 Regulatory decision boundary
Approval, rejection, and other formal regulatory decisions must remain actions of authorized human officials through the defined workflow. Do not introduce an AI decision maker, AI chat assistant, OCR interface, automated document assessment, or AI-generated recommendation UI unless the user explicitly authorizes that work in a later, specific implementation prompt.

AI/OCR are **out of scope for the current implementation**. Do not add AI/OCR endpoints, dependencies, data fields, screens, services, environment variables, or workflow dependencies as part of this UI work.

---

## 3. Visual direction

### 3.1 Design intent

Create a contemporary, premium, precise, trustworthy institutional application. It should feel modern and approachable without sacrificing the seriousness of regulatory work.

The chosen direction is:
- Light mode only.
- Cool, near-white page canvas.
- White content surfaces.
- Deep navy text and structural elements.
- Blue as the main interaction/selection accent.
- Green, amber, red and neutral colors used semantically and sparingly.
- Inter typography.
- Generous but efficient whitespace.
- Rounded components and soft, low-contrast elevation.
- A consistent, calm app shell.
- Strong hierarchy in dense data and document-review workflows.

Avoid a dated government portal, generic “everything is a card” SaaS template, excessively green UI, overly sharp geometry, excessive decoration, and overly dense tables.

### 3.2 Design tokens

Use CSS variables/design tokens rather than hard-coding colors repeatedly. The values below follow the supplied `DESIGN.md`; centralize them so they can be tuned once.

#### Foundation palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#F6F8FC` (the source token file also uses `#F8F9FF`) | Main page canvas; settle on one canonical token in code |
| `--surface` | `#FFFFFF` | Cards, dialogs, tables and form surfaces |
| `--surface-subtle` | `#EEF4FF` | Selected rows, soft blue highlights, focused regions |
| `--surface-muted` | `#F1F5F9` | Neutral supporting surfaces |
| `--text-primary` | `#172033` | Primary body text and headings |
| `--text-strong` | `#17243A` | Strong headings and primary shell text |
| `--text-secondary` | `#64748B` | Secondary copy, metadata and helper text |
| `--border` | `#E3E8F0` | Main borders and separators |
| `--border-strong` | `#C5C6CD` | Focused or higher-contrast boundaries when needed |
| `--primary` | `#315EBD` | Interactive blue, links, active navigation, primary action |
| `--primary-hover` | `#264B99` | Primary-action hover |
| `--primary-active` | `#1E3C7B` | Pressed state |
| `--navy` | `#17243A` / `#020E24` | Login composition, strong header blocks and high-priority text |
| `--success` | `#19845A` | Success/compliant/complete states |
| `--success-bg` | `#E8F5EE` | Soft success status surface |
| `--warning` | `#B7791F` | Pending action, warning, deadline risk |
| `--warning-bg` | `#FEF7EA` | Soft warning status surface |
| `--danger` | `#C24141` | Errors, critical issues and destructive actions |
| `--danger-bg` | `#FDF1F1` | Soft error surface |
| `--info` | `#315EBD` | Informational or active workflow states |
| `--info-bg` | `#EEF4FF` | Soft information surface |

The supplied Stitch design token file also contains a Material-style palette (`#0B1C30`, `#44474D`, `#D3E4FE`, etc.). Do not keep multiple competing tokens for the same semantic purpose in the implementation. Map those aliases to the canonical tokens above.

**Color rule:** blue/navy defines the product. Green is not the brand background. Use semantic colors only when they communicate state or action. Never use color alone to communicate status.

### 3.3 Typography

Use **Inter** as the primary font family, with a robust system sans-serif fallback. Use one family consistently throughout the app.

Canonical scale:
- Page title: 28–30 px desktop, 22–24 px mobile; weight 600–700; line-height 36–38 px desktop.
- Section title: 20 px; weight 600; line-height 28 px.
- Card/panel title: 16 px; weight 600; line-height 24 px.
- Body/default: 14 px; line-height 20 px.
- Dense body/table cell: 13 px; line-height 18 px.
- Table header: 12 px; weight 600; tracking about `0.04em`.
- Form label: 13 px; weight 500.
- Metadata/helper text: 12 px; line-height 16 px.
- Status pill: 11–12 px; weight 600.
- Large metric: 28–32 px, used selectively rather than on every page.

Use tabular numerals (`font-variant-numeric: tabular-nums`) for numeric columns, counts and metrics. Do not use tiny text to squeeze excessive content into a panel. Maintain readable contrast and line lengths.

### 3.4 Spacing and grid

Use an 8 px base rhythm, with 4 px for compact micro-spacing:
- 4 px: icon-to-label micro gap.
- 8 px: tight related controls.
- 12 px: compact groups.
- 16 px: standard internal gap/padding.
- 24 px: panel spacing and page section gap.
- 32 px: desktop page margin or major section separation.
- 48 px: occasional major separation, not a default gap.

Desktop layout:
- Left sidebar target width: approximately 248–260 px.
- Global header target height: approximately 64 px.
- Main content: fluid, maximum inner width around 1680 px.
- Standard desktop page margin: 24–32 px depending on viewport.
- Tablet/mobile page margin: 16 px.
- Use a 12-column desktop grid where it helps; collapse naturally to 8 columns on tablet and 4 on mobile.

Avoid wasting vertical space with oversized headers or enormous empty cards. Equally, avoid cramped forms and dense workspaces. Layout should respond to the task.

### 3.5 Shape, borders and elevation

- Major panels/cards: 14–16 px radius.
- Inputs, selects and standard buttons: 8 px radius.
- Dialogs/drawers: 16–20 px radius where consistent with the component library.
- Status chips: fully rounded pill.
- Standard controls: target 40 px height; compact table controls may be 32–36 px if still accessible.
- Use 1 px low-contrast borders (`#E3E8F0`) and a subtle card shadow such as `0 1px 3px rgba(23,36,58,0.04)`.
- Floating menus/dialogs may use a soft shadow such as `0 8px 24px -4px rgba(23,36,58,0.08), 0 2px 6px -1px rgba(23,36,58,0.04)`.

Do not use strong shadows on every card, thick outlines, sharp corners, or a separate bordered card for every small content group. Prefer whitespace and subtle tonal changes for hierarchy.

### 3.6 Glassmorphism and gradients

Glassmorphism is optional and extremely limited (roughly 5–10% of the experience at most). A subtle frosted treatment may be used for a decorative/login visual or a carefully justified overlay. Do not use glassmorphism for ordinary forms, tables, navigation or dashboard panels.

Gradients may be used sparingly in the login composition if they improve depth. Do not add gradient fills to every card or use animated backgrounds.

---

## 4. Shared application shell

### 4.1 Desktop shell

Use the selected shared-shell screenshot as the primary reference.

Structure:
1. Persistent left sidebar.
2. Top header aligned with the main content region.
3. Main page content area.
4. Optional contextual toolbar, breadcrumbs or page-level actions beneath the top header.

Sidebar:
- White or near-white surface with subtle right border.
- Product mark/name in the top area, using approved branding if available; otherwise use a neutral text mark.
- Role-appropriate navigation groups.
- Clear text labels and consistent icons.
- Active navigation uses a soft blue background, blue icon/text and moderate radius.
- Inactive navigation is dark slate text with muted icons.
- Bottom account area may include user name, role and sign-out action if this fits the product’s authentication model.
- No marketing links such as About, pricing or testimonials.

Top header:
- Compact, quiet and consistent.
- Current portal/role context if useful.
- Breadcrumb or page context where useful.
- Notifications entry point if implemented.
- Profile menu with account actions.
- Do not add unsupported global actions.

Main content:
- Page title and concise context line.
- Page-level primary action aligned consistently.
- Filters/search placed close to the list they control.
- Primary content first; secondary context panels only when useful.
- Avoid oversized empty hero areas.

### 4.2 Role-specific navigation

The exact labels and routes must match the implemented frontend and API capabilities. Treat the following as suggested information architecture, not a mandate to create unsupported routes.

**Institution**
- Overview
- Applications
- Documents (if a separate route/module exists)
- Deficiencies / Resubmissions
- Compliance
- Notifications
- Institution profile/settings (only if supported)

**AICTE official**
- Overview / Work queue
- Applications / Scrutiny
- Deficiencies or Resubmissions
- EVC schedule
- Committee proceedings
- Compliance monitoring
- Audit trail
- Notifications

**Administrator**
- Overview
- Users and roles
- Workflow configuration
- Notifications/escalations
- Operational monitoring
- Audit activity

Never expose all role-specific menu items to all users. Navigation and page actions must respect authorization. If a user enters a forbidden route directly, show a clear access-denied state rather than leaking record data.

### 4.3 Responsive shell

- Desktop: persistent sidebar.
- Tablet: sidebar may collapse to a compact icon rail or drawer.
- Mobile: use an accessible drawer/sheet with a clear menu trigger.
- Preserve active state and navigation labels in the mobile drawer.
- Keep the top header usable without horizontal overflow.
- Do not add a desktop bottom navigation bar.
- Tables should scroll horizontally only when necessary, or switch to a structured row/card presentation where that improves mobile usability.

---

## 5. Screen specifications

The final screens must reflect backend data and actual permissions. The sections below specify intended content and hierarchy, not hard-coded demo values.

### 5.1 Secure login

Use `aicte_portal_secure_login/screen.png` and its `code.html` as the visual anchor.

Composition:
- Refined split layout: a strong navy institutional information panel balanced against a clean white/light login panel.
- Product identity and a concise explanation of the platform’s operational purpose.
- Login form with username/email and password fields, show/hide control, visible labels, clear focus styles and validation.
- Primary sign-in action.
- Password recovery link.
- Optional non-intrusive trust/security context only if factual and approved.
- No About content, marketing navigation, testimonials, pricing, product-sales language, or fabricated official seal.
- Do not claim security certifications or authentication methods that are not actually implemented.
- The panel may use restrained geometry/gradient and subtle visual depth; do not let decoration compete with the form.

States to design and implement:
- Default.
- Submitting/loading.
- Invalid credentials/server error.
- Required-field validation.
- Password visibility toggled.
- Disabled submission while processing.
- Keyboard focus.
- Accessible announcement for errors.

### 5.2 Password recovery

Use `aicte_portal_password_recovery/screen.png` and its `code.html` as the visual anchor.

- Maintain the same brand shell and typography as login.
- Clearly explain the next step in concise language.
- Show only the fields/actions supported by the real auth implementation.
- Include a confirmation state that does not disclose whether an arbitrary account exists if the security design requires generic responses.
- Include a clear return-to-login action.
- Never fabricate OTP, SMS, email verification, or reset-token flows; use only what is actually implemented.

### 5.3 Institution dashboard

Use `institution_dashboard_apex_institute/screen.png` as the composition reference, not as a source of literal data.

Recommended hierarchy:
1. Page heading with institution context and one meaningful next action.
2. A compact row/group of key metrics (only those backed by data).
3. A primary “requires attention” or “next actions” region.
4. Applications/status overview in a readable table/list.
5. Upcoming deadlines and compliance obligations.
6. Recent activity or notifications, when available.

Do not create four or more oversized colored KPI cards simply because the reference contains metrics. Use cards selectively and combine them with lists, compact stats and tables. Keep the most urgent action visually prominent without making the entire page red/green.

All metric values, statuses and deadlines must be derived from the backend. Show skeletons while loading, a meaningful empty state when no applications exist, and retry/error states when data fails.

### 5.4 AICTE official scrutiny console

Use `aicte_official_scrutiny_console/screen.png` and its HTML as the primary workflow reference.

The screen should feel like a professional casework console:
- Compact page/workspace header with role context.
- Queue filters/search and assignment controls only where supported.
- Clear counts for actionable queues, if available.
- Main scrutiny queue/table with application identifier, institution, application type, stage/status, assigned officer, received/updated date, deadline/age and priority only when those fields exist.
- A selected application should open a dedicated detail/workspace route or a carefully designed split-pane view.
- Side panels may show pending actions, recent activity or workload if genuinely useful.
- Avoid turning the entire console into an arrangement of tiny dashboard cards.

Queue behavior:
- Search, filters, sort and pagination must operate on real list data.
- Make the selected row visually clear.
- Provide empty/no-results, loading and error states.
- Respect the current user’s assignments and permissions.
- Do not invent urgency or SLA calculations unless defined in the business rules.

### 5.5 Application scrutiny/detail workspace

Use the official scrutiny console and shared-shell references.

For dense document review, prioritize work area over decorative dashboard content. Use a 50/50 or 60/40 split where suitable:
- Application summary and structured sections on one side.
- Document viewer/evidence area on the other.
- A collapsible metadata, observations or action panel if necessary.

Show, when available:
- Application identifier and current workflow status.
- Institution and application context.
- Section completion and submitted data.
- Document checklist with upload/version/status metadata.
- Preview/download controls authorized for the user.
- Scrutiny observations and prior deficiency history.
- Timeline/audit events relevant to the record.
- Authorized actions, grouped clearly.

Do not assume every PDF can be previewed in-browser. Provide a safe fallback for download/open when the backend and file type allow it. Private documents must be served through authorized access; never expose public object-storage URLs for private documents.

### 5.6 Deficiency creation and response

For an official creating a deficiency:
- Identify the relevant application/section/document.
- Provide structured observations and required corrections.
- Make the expected response clear.
- Show only fields and deadlines supported by the workflow.
- Clearly distinguish draft from issued notice if both states exist.
- Confirm consequential issue/send action.

For an institution responding:
- Show the deficiency notice and each requested correction.
- Provide a response field and evidence/document upload only where supported.
- Show accepted file types, size limits and upload progress from actual configuration.
- Clearly indicate save-draft, submit-response and any confirmation behavior that exists.
- Preserve the original notice and response history; do not visually overwrite previous submissions.

### 5.7 Resubmission review

Provide a review-oriented layout:
- Original deficiency/observation.
- Institution response.
- Related evidence/documents.
- Previous review history.
- Reviewer notes and authorized next actions.

Make comparison easy to scan. Do not label a response “accepted” or “rejected” until the backend/workflow says so. A resubmission is not automatically equivalent to approval.

### 5.8 EVC schedule and committee proceedings

When supported by the product requirements:
- Use a calendar/list hybrid with clear date, time, institution, location/mode and status fields that actually exist.
- Provide filters and event details.
- Show schedule conflicts only if conflict rules are implemented.
- Committee/proceeding views should separate agenda, members/participants, records, observations and outcomes according to actual data models.
- Preserve previous proceedings and auditability.
- Do not invent calendar integrations, meeting links, attendance capture or digital signature claims.

### 5.9 Compliance monitoring

- Use a filterable table/list of obligations, institutions, due dates, current status, last update and evidence link where available.
- Use restrained semantic status pills and explicit text.
- Make overdue and approaching deadlines distinguishable without relying only on color.
- A compact trend chart may be used when there is real time-series data and it helps users understand change.
- Avoid decorative charts with fabricated values.
- Make it possible to navigate from a compliance item to its underlying institution/application/evidence if the route and permissions support it.

### 5.10 Administrator console

Use `system_administrator_console/screen.png` as the visual anchor.

- Prioritize tables, search, filters, detail panels and clear administrative actions.
- User management should distinguish identity, role/permissions, status and relevant timestamps when those fields exist.
- Role and workflow configuration should use structured forms and explicit save/cancel behavior.
- Consequential changes should show a confirmation dialog and a concise summary of what will change.
- Operational monitoring should display only available health/activity information.
- Audit views should be readable and traceable.
- Do not give administrators implied approval/rejection authority simply because they can manage users or configuration.

### 5.11 Notifications and task center

- Show concise notification text, time, read/unread state and a contextual destination where available.
- Group notifications only if grouping improves scanning.
- Make unread state visible without oversized red counters.
- Notifications should deep-link to the relevant application, deficiency, compliance item or task only when a valid route and permission exist.
- Include loading, empty, failure and mark-read states as supported by the API.

### 5.12 Audit trail

- Use a chronological list or table with timestamp, actor, action/event, record context and outcome/details where available.
- Keep timestamps and identifiers legible.
- Provide filters if supported.
- Do not allow the interface to imply that audit entries can be edited or deleted if the underlying system treats them as immutable.
- Do not fabricate event history.

---

## 6. Shared component requirements

Build reusable components rather than copying generated HTML between pages.

### 6.1 Core shell and layout
- `AppShell`
- `SidebarNavigation`
- `TopHeader`
- `Breadcrumbs`
- `PageHeader`
- `PageSection`
- `ResponsiveDrawer`

### 6.2 Data and status
- `StatusBadge`
- `MetricSummary` (use selectively)
- `DataTable` / `ResponsiveDataList`
- `SearchInput`
- `FilterBar`
- `Pagination`
- `Timeline`
- `ActivityList`
- `DeadlineIndicator`
- `EmptyState`
- `Skeleton`
- `ErrorState`
- `AccessDeniedState`

### 6.3 Forms and actions
- Shared labeled input/select/textarea controls.
- `FormSection`
- `FormStepper`
- `FileUploadField`
- `DocumentChecklist`
- `ConfirmationDialog`
- `Toast` / inline alert.
- `PrimaryButton`, `SecondaryButton`, `GhostButton`, `DestructiveButton`.

### 6.4 Document and review
- `DocumentRow`
- `DocumentPreviewPane`
- `ReviewObservation`
- `DeficiencyResponsePanel`
- `ApplicationSummary`
- `WorkflowHistory`
- `ReviewActionBar`

Use consistent sizes, states and spacing. Keep the primary action clear. Avoid using different button colors or corner radii for the same component on different pages.

---

## 7. Interaction and state rules

### 7.1 General behavior
- Every visible control must have a defined action or be clearly non-interactive.
- Buttons must not be decorative placeholders.
- Use route navigation for major page changes; use dialogs/drawers for focused secondary tasks where appropriate.
- Preserve unsaved form state where feasible and supported.
- Provide feedback for successful saves, submissions and failures.
- Disable repeated submission while a request is in flight.
- Use optimistic UI only where safe; do not optimistically mark regulatory actions final before server confirmation.
- Prevent accidental loss of long forms with a confirmation or draft-save mechanism when supported.

### 7.2 Loading, empty, error and success states
Each data-driven screen must define:
- Initial loading/skeleton.
- Empty state (no records exist).
- No-results state (filters/search return no matches).
- Error state with retry where appropriate.
- Permission-denied state.
- Success feedback after a completed operation.
- Validation errors for forms.

Empty states should explain what the state means and, where authorized, offer one useful next action. Do not use huge dashed boxes as the default empty-state design.

### 7.3 Destructive and consequential actions
- Visually distinguish destructive actions from primary progression actions.
- Require confirmation for irreversible or consequential changes as defined by the product.
- State what will happen using plain language.
- Only show actions that the current user is authorized to perform.
- Do not infer a successful outcome from a click; wait for server confirmation.

### 7.4 Motion and smooth scrolling
Motion should be subtle, purposeful and accessible:
- Small hover/focus transitions.
- Short fades/slides for dialogs, drawers and toasts.
- Smooth page/section transitions only when they do not delay work.
- Respect `prefers-reduced-motion`.
- Avoid scroll hijacking, parallax on work screens, continuous decorative animation and motion that makes tables/forms harder to use.

Lenis may be used for optional smooth scrolling on non-critical, long-form presentation surfaces only if it remains compatible with keyboard navigation, focus movement, native scroll containers, reduced-motion preferences and screen readers. **Do not apply Lenis globally by default**, and do not use it to replace native scrolling in dense workflow tables, forms, dialogs, or document panes.

---

## 8. Frontend implementation baseline

The technical document defines the following baseline. Preserve it unless the project’s actual repository has already adopted an approved alternative.

| Concern | Baseline |
|---|---|
| Frontend framework | React |
| Language | TypeScript |
| Build/dev tooling | Vite |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui, used as a foundation rather than a restriction |
| Routing | React Router |
| Backend integration | Existing Node.js + Express + TypeScript REST API |
| Validation | Zod; share/reuse schemas where the architecture allows |
| Data | Neon PostgreSQL through the backend, using Prisma on the server |
| Authentication | Better Auth, as configured in the project |
| Authorization | Backend-enforced RBAC; frontend adapts UI to permissions but is not the security boundary |
| Documents | Private Neon Object Storage via authorized backend flows |
| Charts | Recharts is the documented default; other libraries may be used if they materially improve the visualization |
| Calendar | FullCalendar is the documented default for scheduling screens |
| API reference | Swagger/OpenAPI contract where available |
| Testing | Vitest, Supertest and Playwright per the technical baseline |

### 8.1 UI libraries: allowed, not restricted to shadcn/ui

shadcn/ui is a useful base, not a requirement to build every component from its defaults. Antigravity may select complementary libraries when they improve quality, accessibility, maintainability or implementation speed. Do not add a library merely because it is popular.

Recommended options:

**Component primitives and accessible interactions**
- `shadcn/ui` + Radix UI for composable primitives.
- Radix UI directly where a shadcn wrapper is not needed.
- React Aria Components when stronger built-in accessibility behavior is beneficial.
- Headless UI where it fits the existing architecture.

**Icons and SVG**
- **Lucide React** as the default icon library: consistent, clean outline icons.
- **Tabler Icons React** as an alternative if the project needs broader icon coverage; do not mix icon families casually.
- **Iconoir** as another coherent alternative.
- Use custom inline SVG only for product-specific diagrams/illustrations or icons not covered by the selected set.
- Use `svg`/SVG-based illustrations for crisp, scalable visuals. Keep SVGs accessible (`aria-hidden` for decorative icons, accessible labels for meaningful graphics) and avoid embedding large complex SVG strings repeatedly.
- Choose one primary icon set and use it consistently. Avoid emoji as UI icons and avoid mixing filled and outline styles without a deliberate rule.

**Motion and animation**
- **Motion for React** (the modern continuation of Framer Motion) for common UI transitions, presence animations and lightweight interaction polish.
- **GSAP** for complex, choreographed, timeline-based animation or specialized visual sequences; avoid using it for ordinary button hovers and simple fades.
- **ReactBits** as a source of optional visual components/patterns, not as a mandatory dependency or a wholesale design system. Review each component’s accessibility, responsiveness, dependency footprint, licensing and fit before adopting it.
- CSS transitions are preferred for simple hover, focus and state changes.

**Scrolling**
- **Lenis** only when a deliberate smooth-scrolling experience is justified and tested with accessibility requirements. Do not use global smooth-scroll overrides that interfere with workflow use.

**Data visualization**
- Recharts remains the documented default.
- Consider Visx, Nivo or Apache ECharts only when a specific charting need justifies the additional complexity.
- Every chart must represent real backend data, have labels/tooltips where needed, be responsive, and have a text/table alternative for important values.
- Do not use charts as decoration.

**Tables and large data sets**
- Use the existing component stack first.
- Consider TanStack Table for complex sorting, filtering, pagination, column visibility or row selection.
- Consider TanStack Virtual only when row counts and measured performance justify virtualization.
- Keep filtering, sorting and pagination semantics aligned with the backend API.

**Dates and calendars**
- FullCalendar is the baseline for EVC and scheduling views.
- Use a consistent date utility such as date-fns when needed; avoid mixing date libraries.
- Display timezone assumptions clearly when they matter and follow backend/API conventions.

**Forms**
- Use React Hook Form with Zod when it simplifies complex multi-step forms and validation; do not duplicate validation rules inconsistently.
- Server-side validation remains authoritative.
- Keep field errors and helper text accessible.

**Notifications and feedback**
- Use one toast/notification system that integrates cleanly with the chosen component primitives.
- Use inline alerts for errors that must remain visible and toasts for transient confirmations.
- Do not display raw stack traces or raw database/API error payloads to end users.

**Other useful utilities**
- Use a class-merging utility such as `clsx` and `tailwind-merge` if it fits the existing shadcn/Tailwind setup.
- Use a well-maintained date/number formatting utility when necessary.
- Avoid adding multiple overlapping libraries that solve the same problem.

### 8.2 Library selection rules
Before adding a dependency:
1. Check the repository for an existing equivalent.
2. Confirm it works with the installed React, TypeScript and Vite versions.
3. Check accessibility and reduced-motion support.
4. Consider bundle size, maintenance, licensing and mobile behavior.
5. Use it only for a concrete requirement.
6. Avoid importing an entire library when a small component or CSS transition suffices.
7. Do not replace the design system with a library’s default visual style.

The project is a regulatory workflow tool. Visual polish must never come at the cost of accessibility, reliable forms, predictable navigation, data correctness or user control.

---

## 9. Charts, metrics and data integrity

- All metrics, tables, statuses, counts, deadlines and histories must come from the actual backend/API.
- Do not hard-code Stitch sample values into production.
- Do not invent an endpoint, field, status, role, deadline rule, SLA or analytics calculation.
- If the API does not provide a metric, omit it or explicitly flag the missing contract instead of fabricating a value.
- Avoid charting data that does not form a meaningful comparison or trend.
- Use a compact metric display only when it supports a real user decision.
- Use tabular figures for aligned numeric data.
- Keep charts accessible with labels and an equivalent textual summary or table for essential information.

---

## 10. Security, privacy and authorization in the UI

- Backend authorization is the source of truth. Frontend role-based rendering is for usability, not security.
- Never expose secrets, database credentials, private storage credentials or privileged API keys in client code.
- Private document access must be authorized server-side.
- Do not expose private storage paths or long-lived public URLs when the storage is intended to be private.
- Do not place sensitive institution/application data in browser logs or unnecessary client-side analytics.
- Treat errors safely; show a useful human-readable message and an appropriate retry path.
- Do not claim an action succeeded until the backend confirms it.
- Confirm consequential workflow actions.
- Preserve auditability and version history where required by the workflow.
- Avoid unsupported “certified”, “verified”, “officially signed” or security-certification claims.

---

## 11. Accessibility and responsive quality

Target WCAG 2.2 AA principles where feasible:
- Sufficient text and control contrast.
- Visible keyboard focus.
- Logical tab order and semantic headings.
- Labels for all form controls.
- Errors connected to the relevant controls.
- Keyboard-operable dialogs, menus, tabs and dropdowns.
- Focus moved into an opened dialog and returned to its trigger when closed.
- No essential information communicated by color alone.
- Reduced-motion support.
- Screen-reader labels for icon-only buttons.
- Touch targets that are comfortably usable.
- Responsive layouts without clipped content or accidental horizontal overflow.

Test at minimum:
- Desktop at common laptop and wide-screen widths.
- Tablet widths.
- Mobile widths for login, forms, notification views and key record details.
- Keyboard-only navigation for primary workflows.
- Browser zoom and long labels/long institution names.
- Loading, empty, error and permission-denied states.

---

## 12. Antigravity implementation instructions

### 12.1 Before coding
1. Inspect the existing repository and identify its current architecture, routes, installed dependencies and design tokens.
2. Read the API/OpenAPI documentation, frontend/backend types and authorization rules available in the repository.
3. Map every requested screen to a real route, data source and permission.
4. Reuse existing working features; do not overwrite unrelated application logic.
5. Identify any gaps between the requested screen and the existing API, and report them rather than inventing contracts.
6. Extract the useful visual tokens from `regulatory_workflow_system/DESIGN.md` and the selected screens into a single shared token layer.

### 12.2 Implementation approach
1. Establish global tokens, typography, layout primitives and the responsive app shell.
2. Implement shared navigation and role-aware page shell.
3. Implement login and password recovery using the actual authentication flow.
4. Implement institution dashboard and application workflows.
5. Implement official scrutiny console and review workspaces.
6. Implement administrator screens.
7. Add common loading, empty, error, confirmation and permission states.
8. Integrate actual APIs and private document access.
9. Add restrained motion only after core flows work.
10. Run lint/type checks and tests; verify responsive and accessible behavior.

Implement incrementally and preserve working behavior. Do not generate all pages as one monolithic component. Keep routes, page components, shared components, API clients and domain types organized consistently with the existing repository.

### 12.3 Do not do the following
- Do not recreate the Stitch HTML literally as a production app.
- Do not use mock data as if it were live.
- Do not add marketing pages.
- Do not add dark mode; light mode only for now.
- Do not overuse green, gradients, glassmorphism, animations or metric cards.
- Do not add AI/OCR functionality or screens unless separately authorized.
- Do not invent backend endpoints, database fields, statuses or role permissions.
- Do not rely on frontend-only checks to secure actions or documents.
- Do not use GSAP, Lenis, ReactBits or any other library without a specific, justified use.
- Do not alter business workflow rules to accommodate a UI design.

---

## 13. Definition of done / acceptance checklist

A screen or implementation stage is complete when applicable items below pass:

### Visual consistency
- [ ] Light mode only.
- [ ] Inter typography and defined type scale used consistently.
- [ ] Navy/blue is the core visual identity; green is restrained and semantic.
- [ ] Rounded surfaces and soft borders/elevation are consistent.
- [ ] Spacing, button dimensions, input dimensions, icon size and status pills follow shared tokens.
- [ ] No unnecessary nested cards, heavy borders, oversized empty panels or decorative charts.
- [ ] Login and recovery feel polished and match the app shell.

### Functional correctness
- [ ] Each visible action has a real, defined behavior.
- [ ] Page data is loaded from the correct backend source.
- [ ] API loading, success, error and empty states are handled.
- [ ] Role/permission-sensitive actions follow backend authorization.
- [ ] No unsupported routes, fields, workflow states or claims have been invented.
- [ ] Form validation and error messages are usable and accessible.
- [ ] Long forms and document review preserve relevant history and versions.

### Regulatory correctness
- [ ] Official decisions remain with authorized human users.
- [ ] Workflow transitions match the backend and approved rules.
- [ ] Private documents require authorized access.
- [ ] Consequential actions are clear and appropriately confirmed.
- [ ] Audit/history information is not fabricated or silently overwritten.

### Engineering quality
- [ ] Shared components and tokens are reused.
- [ ] No unnecessary overlapping dependencies are introduced.
- [ ] Keyboard focus, contrast, responsive behavior and reduced motion are checked.
- [ ] Type checks, linting and relevant tests pass.
- [ ] No AI/OCR dependencies, screens, endpoints or workflow requirements have been added.

---

## 14. Source package inventory

The supplied ZIP contains these selected references:
- `aicte_portal_secure_login/screen.png` and `code.html`
- `aicte_portal_password_recovery/screen.png` and `code.html`
- `institution_dashboard_apex_institute/screen.png` and `code.html`
- `aicte_official_scrutiny_console/screen.png` and `code.html`
- `system_administrator_console/screen.png` and `code.html`
- `aicte_shared_shell_component_specification/screen.png` and `code.html`
- `regulatory_workflow_system/DESIGN.md`

The technical stack reference specifies React + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router, Node.js + Express + TypeScript, Zod, Neon PostgreSQL + Prisma, Better Auth, custom RBAC, private Neon Object Storage, BullMQ + Redis for background jobs when needed, Nodemailer + SMTP, Recharts, FullCalendar, Swagger/OpenAPI, Git/GitHub, Vitest, Supertest and Playwright.

**Final instruction:** treat this document as the source of truth for the current UI/UX direction. Treat the supplied screen/code package as a reference for visual intent, and actual backend/API contracts and approved workflow rules as the source of truth for content, data, permissions and behavior.


---

## 1. Purpose and precedence

This document is the implementation-facing UI/UX specification for Antigravity. It consolidates the selected Stitch visual references with the project’s technical direction and regulatory workflow context.

### 1.1 How to use the reference files

The selected screenshots and HTML are **visual and interaction references**, not a requirement to reproduce their literal content, sample records, labels, metrics, routes, or fabricated institution names. Build real screens around the backend models, implemented APIs, role permissions, and approved workflow requirements.

Use the reference package to guide:
- Overall visual tone and hierarchy.
- Light surfaces, navy/blue palette, restrained semantic color.
- Sidebar/top-header shell and active navigation treatment.
- Rounded surfaces, compact status chips, typography, whitespace and subtle elevation.
- Login and recovery composition.
- Institution dashboard composition.
- Official scrutiny console, split-pane document review and work queue.
- Administrator console and shared component patterns.

Do not blindly copy sample numbers, invented names, hard-coded statuses, demo actions, or HTML-specific implementation details from Stitch. The generated HTML is not production code and must be refactored into maintainable React components. It may include inline styles, utility classes, static data, or placeholder interactions.

### 1.2 Precedence when documents disagree

Apply this order:
1. Actual backend/API contracts, authorization rules and database models.
2. Approved product/problem-statement requirements and applicable AICTE Approval Process Handbook/workflow rules.
3. This UI/UX specification for visual design, information hierarchy, layout and interaction behavior.
4. Stitch screenshots and code as visual references only.
5. Antigravity implementation convenience.

Do not invent an API endpoint, database field, workflow state, permission, regulatory rule, or decision authority to make a screen look complete. If a required field or state is not supported by the backend or approved requirements, flag it for clarification or render a deliberate unavailable/empty state.

---

## 2. Product and user roles

The application is a regulated operational workflow product, not a marketing website.

### 2.1 Institution users
Typical needs:
- View institution-specific work and deadlines.
- Start, save, complete and submit applications.
- Maintain application details and supporting documents.
- Track scrutiny progress and application history.
- Review deficiency notices and submit responses/resubmissions.
- Monitor compliance obligations, evidence and due dates.
- Receive notifications and understand what action is required next.

### 2.2 AICTE officials
Typical needs, subject to actual permissions:
- Work assigned scrutiny queues and pending tasks.
- Open an application’s full record and supporting documents.
- Record scrutiny observations.
- Issue deficiency notices through the authorized workflow.
- Review institutional responses and resubmissions.
- Manage relevant EVC schedules and committee/proceeding records.
- Monitor compliance and overdue items.
- Inspect a traceable audit history.

Different official roles may have different permissions. The UI must derive available actions from the signed-in user’s permissions, not merely hide or show buttons based on a guessed role label.

### 2.3 System administrators
Typical needs:
- Manage users and access roles.
- Configure supported workflow parameters.
- Manage notification/escalation settings where implemented.
- Inspect operational or administrative records.
- Review administrative audit activity.

Administrative access must not automatically imply authority to make regulatory decisions.

### 2.4 Regulatory decision boundary
Approval, rejection, and other formal regulatory decisions must remain actions of authorized human officials through the defined workflow. Do not introduce an AI decision maker, AI chat assistant, OCR interface, automated document assessment, or AI-generated recommendation UI unless the user explicitly authorizes that work in a later, specific implementation prompt.

AI/OCR are **out of scope for the current implementation**. Do not add AI/OCR endpoints, dependencies, data fields, screens, services, environment variables, or workflow dependencies as part of this UI work.

---

## 3. Visual direction

### 3.1 Design intent

Create a contemporary, premium, precise, trustworthy institutional application. It should feel modern and approachable without sacrificing the seriousness of regulatory work.

The chosen direction is:
- Light mode only.
- Cool, near-white page canvas.
- White content surfaces.
- Deep navy text and structural elements.
- Blue as the main interaction/selection accent.
- Green, amber, red and neutral colors used semantically and sparingly.
- Inter typography.
- Generous but efficient whitespace.
- Rounded components and soft, low-contrast elevation.
- A consistent, calm app shell.
- Strong hierarchy in dense data and document-review workflows.

Avoid a dated government portal, generic “everything is a card” SaaS template, excessively green UI, overly sharp geometry, excessive decoration, and overly dense tables.

### 3.2 Design tokens

Use CSS variables/design tokens rather than hard-coding colors repeatedly. The values below follow the supplied `DESIGN.md`; centralize them so they can be tuned once.

#### Foundation palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#F6F8FC` (the source token file also uses `#F8F9FF`) | Main page canvas; settle on one canonical token in code |
| `--surface` | `#FFFFFF` | Cards, dialogs, tables and form surfaces |
| `--surface-subtle` | `#EEF4FF` | Selected rows, soft blue highlights, focused regions |
| `--surface-muted` | `#F1F5F9` | Neutral supporting surfaces |
| `--text-primary` | `#172033` | Primary body text and headings |
| `--text-strong` | `#17243A` | Strong headings and primary shell text |
| `--text-secondary` | `#64748B` | Secondary copy, metadata and helper text |
| `--border` | `#E3E8F0` | Main borders and separators |
| `--border-strong` | `#C5C6CD` | Focused or higher-contrast boundaries when needed |
| `--primary` | `#315EBD` | Interactive blue, links, active navigation, primary action |
| `--primary-hover` | `#264B99` | Primary-action hover |
| `--primary-active` | `#1E3C7B` | Pressed state |
| `--navy` | `#17243A` / `#020E24` | Login composition, strong header blocks and high-priority text |
| `--success` | `#19845A` | Success/compliant/complete states |
| `--success-bg` | `#E8F5EE` | Soft success status surface |
| `--warning` | `#B7791F` | Pending action, warning, deadline risk |
| `--warning-bg` | `#FEF7EA` | Soft warning status surface |
| `--danger` | `#C24141` | Errors, critical issues and destructive actions |
| `--danger-bg` | `#FDF1F1` | Soft error surface |
| `--info` | `#315EBD` | Informational or active workflow states |
| `--info-bg` | `#EEF4FF` | Soft information surface |

The supplied Stitch design token file also contains a Material-style palette (`#0B1C30`, `#44474D`, `#D3E4FE`, etc.). Do not keep multiple competing tokens for the same semantic purpose in the implementation. Map those aliases to the canonical tokens above.

**Color rule:** blue/navy defines the product. Green is not the brand background. Use semantic colors only when they communicate state or action. Never use color alone to communicate status.

### 3.3 Typography

Use **Inter** as the primary font family, with a robust system sans-serif fallback. Use one family consistently throughout the app.

Canonical scale:
- Page title: 28–30 px desktop, 22–24 px mobile; weight 600–700; line-height 36–38 px desktop.
- Section title: 20 px; weight 600; line-height 28 px.
- Card/panel title: 16 px; weight 600; line-height 24 px.
- Body/default: 14 px; line-height 20 px.
- Dense body/table cell: 13 px; line-height 18 px.
- Table header: 12 px; weight 600; tracking about `0.04em`.
- Form label: 13 px; weight 500.
- Metadata/helper text: 12 px; line-height 16 px.
- Status pill: 11–12 px; weight 600.
- Large metric: 28–32 px, used selectively rather than on every page.

Use tabular numerals (`font-variant-numeric: tabular-nums`) for numeric columns, counts and metrics. Do not use tiny text to squeeze excessive content into a panel. Maintain readable contrast and line lengths.

### 3.4 Spacing and grid

Use an 8 px base rhythm, with 4 px for compact micro-spacing:
- 4 px: icon-to-label micro gap.
- 8 px: tight related controls.
- 12 px: compact groups.
- 16 px: standard internal gap/padding.
- 24 px: panel spacing and page section gap.
- 32 px: desktop page margin or major section separation.
- 48 px: occasional major separation, not a default gap.

Desktop layout:
- Left sidebar target width: approximately 248–260 px.
- Global header target height: approximately 64 px.
- Main content: fluid, maximum inner width around 1680 px.
- Standard desktop page margin: 24–32 px depending on viewport.
- Tablet/mobile page margin: 16 px.
- Use a 12-column desktop grid where it helps; collapse naturally to 8 columns on tablet and 4 on mobile.

Avoid wasting vertical space with oversized headers or enormous empty cards. Equally, avoid cramped forms and dense workspaces. Layout should respond to the task.

### 3.5 Shape, borders and elevation

- Major panels/cards: 14–16 px radius.
- Inputs, selects and standard buttons: 8 px radius.
- Dialogs/drawers: 16–20 px radius where consistent with the component library.
- Status chips: fully rounded pill.
- Standard controls: target 40 px height; compact table controls may be 32–36 px if still accessible.
- Use 1 px low-contrast borders (`#E3E8F0`) and a subtle card shadow such as `0 1px 3px rgba(23,36,58,0.04)`.
- Floating menus/dialogs may use a soft shadow such as `0 8px 24px -4px rgba(23,36,58,0.08), 0 2px 6px -1px rgba(23,36,58,0.04)`.

Do not use strong shadows on every card, thick outlines, sharp corners, or a separate bordered card for every small content group. Prefer whitespace and subtle tonal changes for hierarchy.

### 3.6 Glassmorphism and gradients

Glassmorphism is optional and extremely limited (roughly 5–10% of the experience at most). A subtle frosted treatment may be used for a decorative/login visual or a carefully justified overlay. Do not use glassmorphism for ordinary forms, tables, navigation or dashboard panels.

Gradients may be used sparingly in the login composition if they improve depth. Do not add gradient fills to every card or use animated backgrounds.

---

## 4. Shared application shell

### 4.1 Desktop shell

Use the selected shared-shell screenshot as the primary reference.

Structure:
1. Persistent left sidebar.
2. Top header aligned with the main content region.
3. Main page content area.
4. Optional contextual toolbar, breadcrumbs or page-level actions beneath the top header.

Sidebar:
- White or near-white surface with subtle right border.
- Product mark/name in the top area, using approved branding if available; otherwise use a neutral text mark.
- Role-appropriate navigation groups.
- Clear text labels and consistent icons.
- Active navigation uses a soft blue background, blue icon/text and moderate radius.
- Inactive navigation is dark slate text with muted icons.
- Bottom account area may include user name, role and sign-out action if this fits the product’s authentication model.
- No marketing links such as About, pricing or testimonials.

Top header:
- Compact, quiet and consistent.
- Current portal/role context if useful.
- Breadcrumb or page context where useful.
- Notifications entry point if implemented.
- Profile menu with account actions.
- Do not add unsupported global actions.

Main content:
- Page title and concise context line.
- Page-level primary action aligned consistently.
- Filters/search placed close to the list they control.
- Primary content first; secondary context panels only when useful.
- Avoid oversized empty hero areas.

### 4.2 Role-specific navigation

The exact labels and routes must match the implemented frontend and API capabilities. Treat the following as suggested information architecture, not a mandate to create unsupported routes.

**Institution**
- Overview
- Applications
- Documents (if a separate route/module exists)
- Deficiencies / Resubmissions
- Compliance
- Notifications
- Institution profile/settings (only if supported)

**AICTE official**
- Overview / Work queue
- Applications / Scrutiny
- Deficiencies or Resubmissions
- EVC schedule
- Committee proceedings
- Compliance monitoring
- Audit trail
- Notifications

**Administrator**
- Overview
- Users and roles
- Workflow configuration
- Notifications/escalations
- Operational monitoring
- Audit activity

Never expose all role-specific menu items to all users. Navigation and page actions must respect authorization. If a user enters a forbidden route directly, show a clear access-denied state rather than leaking record data.

### 4.3 Responsive shell

- Desktop: persistent sidebar.
- Tablet: sidebar may collapse to a compact icon rail or drawer.
- Mobile: use an accessible drawer/sheet with a clear menu trigger.
- Preserve active state and navigation labels in the mobile drawer.
- Keep the top header usable without horizontal overflow.
- Do not add a desktop bottom navigation bar.
- Tables should scroll horizontally only when necessary, or switch to a structured row/card presentation where that improves mobile usability.

---

## 5. Screen specifications

The final screens must reflect backend data and actual permissions. The sections below specify intended content and hierarchy, not hard-coded demo values.

### 5.1 Secure login

Use `aicte_portal_secure_login/screen.png` and its `code.html` as the visual anchor.

Composition:
- Refined split layout: a strong navy institutional information panel balanced against a clean white/light login panel.
- Product identity and a concise explanation of the platform’s operational purpose.
- Login form with username/email and password fields, show/hide control, visible labels, clear focus styles and validation.
- Primary sign-in action.
- Password recovery link.
- Optional non-intrusive trust/security context only if factual and approved.
- No About content, marketing navigation, testimonials, pricing, product-sales language, or fabricated official seal.
- Do not claim security certifications or authentication methods that are not actually implemented.
- The panel may use restrained geometry/gradient and subtle visual depth; do not let decoration compete with the form.

States to design and implement:
- Default.
- Submitting/loading.
- Invalid credentials/server error.
- Required-field validation.
- Password visibility toggled.
- Disabled submission while processing.
- Keyboard focus.
- Accessible announcement for errors.

### 5.2 Password recovery

Use `aicte_portal_password_recovery/screen.png` and its `code.html` as the visual anchor.

- Maintain the same brand shell and typography as login.
- Clearly explain the next step in concise language.
- Show only the fields/actions supported by the real auth implementation.
- Include a confirmation state that does not disclose whether an arbitrary account exists if the security design requires generic responses.
- Include a clear return-to-login action.
- Never fabricate OTP, SMS, email verification, or reset-token flows; use only what is actually implemented.

### 5.3 Institution dashboard

Use `institution_dashboard_apex_institute/screen.png` as the composition reference, not as a source of literal data.

Recommended hierarchy:
1. Page heading with institution context and one meaningful next action.
2. A compact row/group of key metrics (only those backed by data).
3. A primary “requires attention” or “next actions” region.
4. Applications/status overview in a readable table/list.
5. Upcoming deadlines and compliance obligations.
6. Recent activity or notifications, when available.

Do not create four or more oversized colored KPI cards simply because the reference contains metrics. Use cards selectively and combine them with lists, compact stats and tables. Keep the most urgent action visually prominent without making the entire page red/green.

All metric values, statuses and deadlines must be derived from the backend. Show skeletons while loading, a meaningful empty state when no applications exist, and retry/error states when data fails.

### 5.4 AICTE official scrutiny console

Use `aicte_official_scrutiny_console/screen.png` and its HTML as the primary workflow reference.

The screen should feel like a professional casework console:
- Compact page/workspace header with role context.
- Queue filters/search and assignment controls only where supported.
- Clear counts for actionable queues, if available.
- Main scrutiny queue/table with application identifier, institution, application type, stage/status, assigned officer, received/updated date, deadline/age and priority only when those fields exist.
- A selected application should open a dedicated detail/workspace route or a carefully designed split-pane view.
- Side panels may show pending actions, recent activity or workload if genuinely useful.
- Avoid turning the entire console into an arrangement of tiny dashboard cards.

Queue behavior:
- Search, filters, sort and pagination must operate on real list data.
- Make the selected row visually clear.
- Provide empty/no-results, loading and error states.
- Respect the current user’s assignments and permissions.
- Do not invent urgency or SLA calculations unless defined in the business rules.

### 5.5 Application scrutiny/detail workspace

Use the official scrutiny console and shared-shell references.

For dense document review, prioritize work area over decorative dashboard content. Use a 50/50 or 60/40 split where suitable:
- Application summary and structured sections on one side.
- Document viewer/evidence area on the other.
- A collapsible metadata, observations or action panel if necessary.

Show, when available:
- Application identifier and current workflow status.
- Institution and application context.
- Section completion and submitted data.
- Document checklist with upload/version/status metadata.
- Preview/download controls authorized for the user.
- Scrutiny observations and prior deficiency history.
- Timeline/audit events relevant to the record.
- Authorized actions, grouped clearly.

Do not assume every PDF can be previewed in-browser. Provide a safe fallback for download/open when the backend and file type allow it. Private documents must be served through authorized access; never expose public object-storage URLs for private documents.

### 5.6 Deficiency creation and response

For an official creating a deficiency:
- Identify the relevant application/section/document.
- Provide structured observations and required corrections.
- Make the expected response clear.
- Show only fields and deadlines supported by the workflow.
- Clearly distinguish draft from issued notice if both states exist.
- Confirm consequential issue/send action.

For an institution responding:
- Show the deficiency notice and each requested correction.
- Provide a response field and evidence/document upload only where supported.
- Show accepted file types, size limits and upload progress from actual configuration.
- Clearly indicate save-draft, submit-response and any confirmation behavior that exists.
- Preserve the original notice and response history; do not visually overwrite previous submissions.

### 5.7 Resubmission review

Provide a review-oriented layout:
- Original deficiency/observation.
- Institution response.
- Related evidence/documents.
- Previous review history.
- Reviewer notes and authorized next actions.

Make comparison easy to scan. Do not label a response “accepted” or “rejected” until the backend/workflow says so. A resubmission is not automatically equivalent to approval.

### 5.8 EVC schedule and committee proceedings

When supported by the product requirements:
- Use a calendar/list hybrid with clear date, time, institution, location/mode and status fields that actually exist.
- Provide filters and event details.
- Show schedule conflicts only if conflict rules are implemented.
- Committee/proceeding views should separate agenda, members/participants, records, observations and outcomes according to actual data models.
- Preserve previous proceedings and auditability.
- Do not invent calendar integrations, meeting links, attendance capture or digital signature claims.

### 5.9 Compliance monitoring

- Use a filterable table/list of obligations, institutions, due dates, current status, last update and evidence link where available.
- Use restrained semantic status pills and explicit text.
- Make overdue and approaching deadlines distinguishable without relying only on color.
- A compact trend chart may be used when there is real time-series data and it helps users understand change.
- Avoid decorative charts with fabricated values.
- Make it possible to navigate from a compliance item to its underlying institution/application/evidence if the route and permissions support it.

### 5.10 Administrator console

Use `system_administrator_console/screen.png` as the visual anchor.

- Prioritize tables, search, filters, detail panels and clear administrative actions.
- User management should distinguish identity, role/permissions, status and relevant timestamps when those fields exist.
- Role and workflow configuration should use structured forms and explicit save/cancel behavior.
- Consequential changes should show a confirmation dialog and a concise summary of what will change.
- Operational monitoring should display only available health/activity information.
- Audit views should be readable and traceable.
- Do not give administrators implied approval/rejection authority simply because they can manage users or configuration.

### 5.11 Notifications and task center

- Show concise notification text, time, read/unread state and a contextual destination where available.
- Group notifications only if grouping improves scanning.
- Make unread state visible without oversized red counters.
- Notifications should deep-link to the relevant application, deficiency, compliance item or task only when a valid route and permission exist.
- Include loading, empty, failure and mark-read states as supported by the API.

### 5.12 Audit trail

- Use a chronological list or table with timestamp, actor, action/event, record context and outcome/details where available.
- Keep timestamps and identifiers legible.
- Provide filters if supported.
- Do not allow the interface to imply that audit entries can be edited or deleted if the underlying system treats them as immutable.
- Do not fabricate event history.

---

## 6. Shared component requirements

Build reusable components rather than copying generated HTML between pages.

### 6.1 Core shell and layout
- `AppShell`
- `SidebarNavigation`
- `TopHeader`
- `Breadcrumbs`
- `PageHeader`
- `PageSection`
- `ResponsiveDrawer`

### 6.2 Data and status
- `StatusBadge`
- `MetricSummary` (use selectively)
- `DataTable` / `ResponsiveDataList`
- `SearchInput`
- `FilterBar`
- `Pagination`
- `Timeline`
- `ActivityList`
- `DeadlineIndicator`
- `EmptyState`
- `Skeleton`
- `ErrorState`
- `AccessDeniedState`

### 6.3 Forms and actions
- Shared labeled input/select/textarea controls.
- `FormSection`
- `FormStepper`
- `FileUploadField`
- `DocumentChecklist`
- `ConfirmationDialog`
- `Toast` / inline alert.
- `PrimaryButton`, `SecondaryButton`, `GhostButton`, `DestructiveButton`.

### 6.4 Document and review
- `DocumentRow`
- `DocumentPreviewPane`
- `ReviewObservation`
- `DeficiencyResponsePanel`
- `ApplicationSummary`
- `WorkflowHistory`
- `ReviewActionBar`

Use consistent sizes, states and spacing. Keep the primary action clear. Avoid using different button colors or corner radii for the same component on different pages.

---

## 7. Interaction and state rules

### 7.1 General behavior
- Every visible control must have a defined action or be clearly non-interactive.
- Buttons must not be decorative placeholders.
- Use route navigation for major page changes; use dialogs/drawers for focused secondary tasks where appropriate.
- Preserve unsaved form state where feasible and supported.
- Provide feedback for successful saves, submissions and failures.
- Disable repeated submission while a request is in flight.
- Use optimistic UI only where safe; do not optimistically mark regulatory actions final before server confirmation.
- Prevent accidental loss of long forms with a confirmation or draft-save mechanism when supported.

### 7.2 Loading, empty, error and success states
Each data-driven screen must define:
- Initial loading/skeleton.
- Empty state (no records exist).
- No-results state (filters/search return no matches).
- Error state with retry where appropriate.
- Permission-denied state.
- Success feedback after a completed operation.
- Validation errors for forms.

Empty states should explain what the state means and, where authorized, offer one useful next action. Do not use huge dashed boxes as the default empty-state design.

### 7.3 Destructive and consequential actions
- Visually distinguish destructive actions from primary progression actions.
- Require confirmation for irreversible or consequential changes as defined by the product.
- State what will happen using plain language.
- Only show actions that the current user is authorized to perform.
- Do not infer a successful outcome from a click; wait for server confirmation.

### 7.4 Motion and smooth scrolling
Motion should be subtle, purposeful and accessible:
- Small hover/focus transitions.
- Short fades/slides for dialogs, drawers and toasts.
- Smooth page/section transitions only when they do not delay work.
- Respect `prefers-reduced-motion`.
- Avoid scroll hijacking, parallax on work screens, continuous decorative animation and motion that makes tables/forms harder to use.

Lenis may be used for optional smooth scrolling on non-critical, long-form presentation surfaces only if it remains compatible with keyboard navigation, focus movement, native scroll containers, reduced-motion preferences and screen readers. **Do not apply Lenis globally by default**, and do not use it to replace native scrolling in dense workflow tables, forms, dialogs, or document panes.

---

## 8. Frontend implementation baseline

The technical document defines the following baseline. Preserve it unless the project’s actual repository has already adopted an approved alternative.

| Concern | Baseline |
|---|---|
| Frontend framework | React |
| Language | TypeScript |
| Build/dev tooling | Vite |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui, used as a foundation rather than a restriction |
| Routing | React Router |
| Backend integration | Existing Node.js + Express + TypeScript REST API |
| Validation | Zod; share/reuse schemas where the architecture allows |
| Data | Neon PostgreSQL through the backend, using Prisma on the server |
| Authentication | Better Auth, as configured in the project |
| Authorization | Backend-enforced RBAC; frontend adapts UI to permissions but is not the security boundary |
| Documents | Private Neon Object Storage via authorized backend flows |
| Charts | Recharts is the documented default; other libraries may be used if they materially improve the visualization |
| Calendar | FullCalendar is the documented default for scheduling screens |
| API reference | Swagger/OpenAPI contract where available |
| Testing | Vitest, Supertest and Playwright per the technical baseline |

### 8.1 UI libraries: allowed, not restricted to shadcn/ui

shadcn/ui is a useful base, not a requirement to build every component from its defaults. Antigravity may select complementary libraries when they improve quality, accessibility, maintainability or implementation speed. Do not add a library merely because it is popular.

Recommended options:

**Component primitives and accessible interactions**
- `shadcn/ui` + Radix UI for composable primitives.
- Radix UI directly where a shadcn wrapper is not needed.
- React Aria Components when stronger built-in accessibility behavior is beneficial.
- Headless UI where it fits the existing architecture.

**Icons and SVG**
- **Lucide React** as the default icon library: consistent, clean outline icons.
- **Tabler Icons React** as an alternative if the project needs broader icon coverage; do not mix icon families casually.
- **Iconoir** as another coherent alternative.
- Use custom inline SVG only for product-specific diagrams/illustrations or icons not covered by the selected set.
- Use `svg`/SVG-based illustrations for crisp, scalable visuals. Keep SVGs accessible (`aria-hidden` for decorative icons, accessible labels for meaningful graphics) and avoid embedding large complex SVG strings repeatedly.
- Choose one primary icon set and use it consistently. Avoid emoji as UI icons and avoid mixing filled and outline styles without a deliberate rule.

**Motion and animation**
- **Motion for React** (the modern continuation of Framer Motion) for common UI transitions, presence animations and lightweight interaction polish.
- **GSAP** for complex, choreographed, timeline-based animation or specialized visual sequences; avoid using it for ordinary button hovers and simple fades.
- **ReactBits** as a source of optional visual components/patterns, not as a mandatory dependency or a wholesale design system. Review each component’s accessibility, responsiveness, dependency footprint, licensing and fit before adopting it.
- CSS transitions are preferred for simple hover, focus and state changes.

**Scrolling**
- **Lenis** only when a deliberate smooth-scrolling experience is justified and tested with accessibility requirements. Do not use global smooth-scroll overrides that interfere with workflow use.

**Data visualization**
- Recharts remains the documented default.
- Consider Visx, Nivo or Apache ECharts only when a specific charting need justifies the additional complexity.
- Every chart must represent real backend data, have labels/tooltips where needed, be responsive, and have a text/table alternative for important values.
- Do not use charts as decoration.

**Tables and large data sets**
- Use the existing component stack first.
- Consider TanStack Table for complex sorting, filtering, pagination, column visibility or row selection.
- Consider TanStack Virtual only when row counts and measured performance justify virtualization.
- Keep filtering, sorting and pagination semantics aligned with the backend API.

**Dates and calendars**
- FullCalendar is the baseline for EVC and scheduling views.
- Use a consistent date utility such as date-fns when needed; avoid mixing date libraries.
- Display timezone assumptions clearly when they matter and follow backend/API conventions.

**Forms**
- Use React Hook Form with Zod when it simplifies complex multi-step forms and validation; do not duplicate validation rules inconsistently.
- Server-side validation remains authoritative.
- Keep field errors and helper text accessible.

**Notifications and feedback**
- Use one toast/notification system that integrates cleanly with the chosen component primitives.
- Use inline alerts for errors that must remain visible and toasts for transient confirmations.
- Do not display raw stack traces or raw database/API error payloads to end users.

**Other useful utilities**
- Use a class-merging utility such as `clsx` and `tailwind-merge` if it fits the existing shadcn/Tailwind setup.
- Use a well-maintained date/number formatting utility when necessary.
- Avoid adding multiple overlapping libraries that solve the same problem.

### 8.2 Library selection rules
Before adding a dependency:
1. Check the repository for an existing equivalent.
2. Confirm it works with the installed React, TypeScript and Vite versions.
3. Check accessibility and reduced-motion support.
4. Consider bundle size, maintenance, licensing and mobile behavior.
5. Use it only for a concrete requirement.
6. Avoid importing an entire library when a small component or CSS transition suffices.
7. Do not replace the design system with a library’s default visual style.

The project is a regulatory workflow tool. Visual polish must never come at the cost of accessibility, reliable forms, predictable navigation, data correctness or user control.

---

## 9. Charts, metrics and data integrity

- All metrics, tables, statuses, counts, deadlines and histories must come from the actual backend/API.
- Do not hard-code Stitch sample values into production.
- Do not invent an endpoint, field, status, role, deadline rule, SLA or analytics calculation.
- If the API does not provide a metric, omit it or explicitly flag the missing contract instead of fabricating a value.
- Avoid charting data that does not form a meaningful comparison or trend.
- Use a compact metric display only when it supports a real user decision.
- Use tabular figures for aligned numeric data.
- Keep charts accessible with labels and an equivalent textual summary or table for essential information.

---

## 10. Security, privacy and authorization in the UI

- Backend authorization is the source of truth. Frontend role-based rendering is for usability, not security.
- Never expose secrets, database credentials, private storage credentials or privileged API keys in client code.
- Private document access must be authorized server-side.
- Do not expose private storage paths or long-lived public URLs when the storage is intended to be private.
- Do not place sensitive institution/application data in browser logs or unnecessary client-side analytics.
- Treat errors safely; show a useful human-readable message and an appropriate retry path.
- Do not claim an action succeeded until the backend confirms it.
- Confirm consequential workflow actions.
- Preserve auditability and version history where required by the workflow.
- Avoid unsupported “certified”, “verified”, “officially signed” or security-certification claims.

---

## 11. Accessibility and responsive quality

Target WCAG 2.2 AA principles where feasible:
- Sufficient text and control contrast.
- Visible keyboard focus.
- Logical tab order and semantic headings.
- Labels for all form controls.
- Errors connected to the relevant controls.
- Keyboard-operable dialogs, menus, tabs and dropdowns.
- Focus moved into an opened dialog and returned to its trigger when closed.
- No essential information communicated by color alone.
- Reduced-motion support.
- Screen-reader labels for icon-only buttons.
- Touch targets that are comfortably usable.
- Responsive layouts without clipped content or accidental horizontal overflow.

Test at minimum:
- Desktop at common laptop and wide-screen widths.
- Tablet widths.
- Mobile widths for login, forms, notification views and key record details.
- Keyboard-only navigation for primary workflows.
- Browser zoom and long labels/long institution names.
- Loading, empty, error and permission-denied states.

---

## 12. Antigravity implementation instructions

### 12.1 Before coding
1. Inspect the existing repository and identify its current architecture, routes, installed dependencies and design tokens.
2. Read the API/OpenAPI documentation, frontend/backend types and authorization rules available in the repository.
3. Map every requested screen to a real route, data source and permission.
4. Reuse existing working features; do not overwrite unrelated application logic.
5. Identify any gaps between the requested screen and the existing API, and report them rather than inventing contracts.
6. Extract the useful visual tokens from `regulatory_workflow_system/DESIGN.md` and the selected screens into a single shared token layer.

### 12.2 Implementation approach
1. Establish global tokens, typography, layout primitives and the responsive app shell.
2. Implement shared navigation and role-aware page shell.
3. Implement login and password recovery using the actual authentication flow.
4. Implement institution dashboard and application workflows.
5. Implement official scrutiny console and review workspaces.
6. Implement administrator screens.
7. Add common loading, empty, error, confirmation and permission states.
8. Integrate actual APIs and private document access.
9. Add restrained motion only after core flows work.
10. Run lint/type checks and tests; verify responsive and accessible behavior.

Implement incrementally and preserve working behavior. Do not generate all pages as one monolithic component. Keep routes, page components, shared components, API clients and domain types organized consistently with the existing repository.

### 12.3 Do not do the following
- Do not recreate the Stitch HTML literally as a production app.
- Do not use mock data as if it were live.
- Do not add marketing pages.
- Do not add dark mode; light mode only for now.
- Do not overuse green, gradients, glassmorphism, animations or metric cards.
- Do not add AI/OCR functionality or screens unless separately authorized.
- Do not invent backend endpoints, database fields, statuses or role permissions.
- Do not rely on frontend-only checks to secure actions or documents.
- Do not use GSAP, Lenis, ReactBits or any other library without a specific, justified use.
- Do not alter business workflow rules to accommodate a UI design.

---

## 13. Definition of done / acceptance checklist

A screen or implementation stage is complete when applicable items below pass:

### Visual consistency
- [ ] Light mode only.
- [ ] Inter typography and defined type scale used consistently.
- [ ] Navy/blue is the core visual identity; green is restrained and semantic.
- [ ] Rounded surfaces and soft borders/elevation are consistent.
- [ ] Spacing, button dimensions, input dimensions, icon size and status pills follow shared tokens.
- [ ] No unnecessary nested cards, heavy borders, oversized empty panels or decorative charts.
- [ ] Login and recovery feel polished and match the app shell.

### Functional correctness
- [ ] Each visible action has a real, defined behavior.
- [ ] Page data is loaded from the correct backend source.
- [ ] API loading, success, error and empty states are handled.
- [ ] Role/permission-sensitive actions follow backend authorization.
- [ ] No unsupported routes, fields, workflow states or claims have been invented.
- [ ] Form validation and error messages are usable and accessible.
- [ ] Long forms and document review preserve relevant history and versions.

### Regulatory correctness
- [ ] Official decisions remain with authorized human users.
- [ ] Workflow transitions match the backend and approved rules.
- [ ] Private documents require authorized access.
- [ ] Consequential actions are clear and appropriately confirmed.
- [ ] Audit/history information is not fabricated or silently overwritten.

### Engineering quality
- [ ] Shared components and tokens are reused.
- [ ] No unnecessary overlapping dependencies are introduced.
- [ ] Keyboard focus, contrast, responsive behavior and reduced motion are checked.
- [ ] Type checks, linting and relevant tests pass.
- [ ] No AI/OCR dependencies, screens, endpoints or workflow requirements have been added.

---

## 14. Source package inventory

The supplied ZIP contains these selected references:
- `aicte_portal_secure_login/screen.png` and `code.html`
- `aicte_portal_password_recovery/screen.png` and `code.html`
- `institution_dashboard_apex_institute/screen.png` and `code.html`
- `aicte_official_scrutiny_console/screen.png` and `code.html`
- `system_administrator_console/screen.png` and `code.html`
- `aicte_shared_shell_component_specification/screen.png` and `code.html`
- `regulatory_workflow_system/DESIGN.md`

The technical stack reference specifies React + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router, Node.js + Express + TypeScript, Zod, Neon PostgreSQL + Prisma, Better Auth, custom RBAC, private Neon Object Storage, BullMQ + Redis for background jobs when needed, Nodemailer + SMTP, Recharts, FullCalendar, Swagger/OpenAPI, Git/GitHub, Vitest, Supertest and Playwright.

**Final instruction:** treat this document as the source of truth for the current UI/UX direction. Treat the supplied screen/code package as a reference for visual intent, and actual backend/API contracts and approved workflow rules as the source of truth for content, data, permissions and behavior.

---

## 24. Cross-document implementation reconciliation — 24 October 2026

This UI/UX specification remains the visual and interaction direction. This addendum does not remove screens, components, or design intent.

### 24.1 Precedence for implementation
The visual reference is subordinate to approved requirements, role permissions, API contracts, database constraints, and verified regulatory workflow rules. A screen mockup or `code.html` file is not evidence that its data, permission, action, or status is valid. Preserve the defined visual direction, reusable components, layout, and responsive behavior while connecting only supported actions and states.

### 24.2 Current integration boundaries
- Frontend baseline: React + TypeScript + Vite, Tailwind CSS, shadcn/ui, React Router.
- Backend/API: Express + TypeScript; API document is still a draft contract.
- Data: Neon PostgreSQL + Prisma; align displayed values and state with persisted server responses.
- Files: Neon Object Storage is the current candidate, but file access must be mediated and authorized server-side.
- Authentication: Better Auth is excluded; do not implement an assumed replacement before it is selected.
- Real-time: Neon Realtime is excluded; provider/transport unresolved. Do not label an update “live” unless actual delivery is implemented and tested.
- AI/OCR: deferred; do not add upload analysis, automated extraction, scoring, or recommendations unless explicitly authorized.

### 24.3 UI integration acceptance checks
- [ ] Each screen/action maps to a requirement, route/API contract, data entity, and role permission.
- [ ] Loading, empty, error, unauthorized, stale-data, and retry states are designed for data-backed views.
- [ ] Approval, rejection, return-for-deficiency, resubmission, compliance, and official communication actions require server confirmation and show the resulting persisted state.
- [ ] Destructive/irreversible actions use explicit confirmation and explain the effect.
- [ ] Accessibility includes keyboard operation, visible focus, semantic labels, contrast, and non-color-only status cues.
- [ ] Tables, filters, pagination, forms, and charts use real API data and safe empty/error handling; no mock data is treated as authoritative.
- [ ] Responsive behavior does not hide required actions or security-relevant context.
- [ ] Visual libraries are added only where they serve a specified UI need; do not install optional animation/icon/table libraries indiscriminately.



---

## Source audit supplement — PS/APH UI binding, 24 October 2026

The screens should demonstrate all PS capabilities listed in `PS_APH_TRACEABILITY_AUDIT.md`, but UI mockups are not regulatory authority. Display only actions allowed by server-side permissions and the configured application route. Show source-backed deadlines/statuses, clear empty/error/loading states, and human-authorised verification/decision actions; do not imply that the UI itself makes statutory decisions.


---

## Cross-document consistency audit reference

Before implementation sign-off, complete the screen-to-API-to-permission matrix described in `CROSS_DOCUMENT_CONSISTENCY_AUDIT.md` §5. Screenshots remain visual guidance, not authority for workflow or permission rules.

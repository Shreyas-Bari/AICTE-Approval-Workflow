# Final Technology Decisions and Superseding Corrections

**Decision record date:** 24 October 2026  
**Status:** Owner-confirmed architecture decisions  
**Purpose:** This record corrects the status of earlier audit findings without deleting historical analysis or any prior specification content.

## 1. Canonical decisions

| Area | Final project decision | Boundary / implementation note |
|---|---|---|
| Authentication | Use an **Auth.js-compatible solution or JWT-based authentication with secure HTTP-only cookies**. | **Better Auth is excluded.** Treat the listed approaches as the approved authentication direction. Before implementation, record which of the two approved approaches is used and its exact library, cookie/session lifecycle, expiry/revocation, CSRF protections where applicable, recovery flow, rate limits, and RBAC integration. This implementation detail does not reopen the approved direction. |
| Real-time updates | **Socket.IO** is the selected real-time transport. | Do not use Neon Realtime or any other Neon real-time service. Specify authenticated connections, authorised rooms/events, event payloads, reconnection and resynchronisation, delivery/error observability, and tests. Socket.IO events are hints to refresh authoritative persisted state; they are not durable business truth. |
| Neon services | Use Neon **only for PostgreSQL and document/object storage**. | Do not use Neon Realtime, Neon authentication, or any other Neon service for this project. Provisioning does not itself prove private-storage configuration; storage access, ACLs, server-side authorization, upload constraints, and signed/download URL behaviour still require verification. |
| Database | Neon PostgreSQL + Prisma remain the relational persistence baseline. | `DATABASE_SCHEMA_REVISION_2.md` supplements `DATABASE_SCHEMA.md`; retain both and validate migrations against the approved schema. |
| Background jobs | BullMQ + Redis remain proposed/optional until the first-release and hosting decision is documented. | Persisted deadlines and PostgreSQL business records remain authoritative; use durable intent/outbox and idempotent processing where asynchronous side effects are used. |
| Email | SMTP/email provider remains to be selected. | Do not claim delivery without provider/runtime evidence. |
| AI/OCR | Deferred until explicit project-owner authorization. | Do not implement by inference. |
| Regulatory rules | Use the applicable, verified official AICTE instruments and problem statement. | Do not invent deadlines, eligibility, routes, fees, document requirements, or legal consequences. Confirm current amendments and applicability before activating a rule. |

## 2. How this record supersedes earlier statements

Earlier documents and audit sections correctly recorded that Better Auth and Neon Realtime were excluded, but described the authentication alternative and real-time transport as unresolved. Those status descriptions are **superseded by this decision record**:

- Authentication direction is now recorded as the approved Auth.js-compatible or JWT-with-secure-HTTP-only-cookies approach. Better Auth remains excluded.
- Socket.IO is selected for real-time updates. Neon Realtime remains excluded.
- Neon's role is limited to PostgreSQL and document/object storage.
- The prior audit's “choose a non-Neon real-time transport or approve polling” action is closed as a provider-selection item. Polling may still be used as a fallback/resynchronisation mechanism, but it is not the selected primary real-time transport.
- The prior audit's “select a non-Better-Auth authentication approach” action is closed at the architecture-direction level. The exact library/configuration and security details remain implementation specifications, not an unresolved choice to use a different technology family.
- No other unresolved decision is implicitly closed by this record. Email, queue/worker hosting, deployment, storage-security verification, role/permission matrix, API/schema alignment, regulatory currentness, and runtime test evidence remain open as applicable.

## 3. Required Socket.IO implementation controls

1. Authenticate the Socket.IO connection using the selected authentication/session design; do not trust client-supplied user IDs or role names.
2. Authorize each subscription, room join, and event against server-side roles, institution/resource scope, and current permissions.
3. Emit only the minimum information needed to signal a change; avoid sending confidential application/document content to broad rooms.
4. Publish after the authoritative database transaction commits, preferably through a durable outbox/event-publication path where needed to avoid lost updates.
5. Make clients refetch authoritative API state after events and on reconnect; tolerate duplicate, delayed, missing, or out-of-order events.
6. Include reconnection, permission revocation, multi-tenant isolation, server restart, publish failure, and unauthorized room-join tests.
7. Treat Socket.IO as transport, not a replacement for durable notifications, scheduled reminders, escalations, or audit records.

## 4. Required authentication controls

1. Do not use Better Auth.
2. For the selected approved approach, define secure cookie attributes (`HttpOnly`, `Secure` in HTTPS environments, appropriate `SameSite`), token/session expiry and revocation, logout, account recovery, login abuse controls, and secret management.
3. Assess and implement CSRF protection appropriate to the cookie-based design; validate origin/credentials policy for HTTP and Socket.IO.
4. Enforce RBAC and object/institution scope on the backend for every protected API, file operation, Socket.IO room/event, export, and workflow transition.
5. Do not store bearer/session tokens in `localStorage`; never expose signing secrets or privileged credentials to the browser.
6. Record the selected library and session/token semantics in the implementation configuration/ADR before coding the auth integration. This is a concrete implementation detail under the approved direction, not permission to silently substitute Better Auth.

## 5. Audit interpretation

The earlier audit findings remain in the archive as historical records of the state before these decisions were clarified. Read this document as the current authority for the listed technology decisions. Preserve earlier wording for auditability; do not treat it as the current status when it conflicts with this record.

This document records project decisions. It does not claim that authentication, Socket.IO, private storage, or any other capability has already been implemented or runtime-tested.

# Changelog

**Date:** 24 October 2026

## Preservation
- All seven original Markdown files are retained unchanged under `original/`.
- Each refined Markdown file starts with the full original document content; refinements are appended as clearly labeled addenda.
- No original requirements, UI screens, API proposals, schema sections, or architecture decisions were intentionally removed.

## Additions
- Added cross-document authority/precedence rules.
- Reconciled Neon PostgreSQL/Prisma, Neon Object Storage, Better Auth exclusion, Neon Realtime exclusion, unresolved authentication and realtime providers, optional BullMQ/Redis, unresolved SMTP/deployment, and deferred AI/OCR.
- Clarified that API endpoints are proposed contracts, schema Markdown is not an executable migration, and `DATABASE_SCHEMA_REVISION_2.md` supplements the base schema.
- Added acceptance checks and implementation gates for traceability, permissions, workflow transitions, storage privacy, durable async effects, UI integration, and migration readiness.
- Added a cross-document audit report and SHA-256 manifest.

## Limitations
- The ZIP contained only the seven Markdown files listed in the manifest. The problem statement, AICTE handbook PDF, tech-stack reasoning file, and original design ZIP were not included in this archive, so regulatory traceability and external-source verification remain open.


## Addendum — PS and APH supplied after the initial ZIP audit

- Added `PS_APH_TRACEABILITY_AUDIT.md` mapping every major PS functional area and key requirement to documentation locations and verification evidence.
- Added the supplied APH chapter/clause locator map and cautions against universalising category-specific rules.
- Added gap closure actions and ten end-to-end acceptance scenarios.
- Appended brief PS/APH audit cross-references to each of the seven refined core specifications.
- Preserved the prior audit text, all existing refined content, and all original source files. The initial report's statement that the PS/APH were absent is historical and is explicitly superseded by its new addendum; it was not silently deleted.
- No technical provider was silently selected, no regulation was invented, and no claim of legal certification or implementation readiness is made.


## Addendum — cross-document consistency review (24 October 2026)

- Added `CROSS_DOCUMENT_CONSISTENCY_AUDIT.md` with static preservation results, cross-document contradictions, API/schema coverage limitations, UI/API/permission traceability requirements, regulatory-source verification limits, and ordered P0/P1/P2 closure checklist.
- Appended Addendum 3 to `AUDIT_REPORT.md`.
- No original files or existing refined specification content were removed or rewritten.


---

## Addendum — final owner-confirmed technology decisions (24 October 2026)

- Added `FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md` as the current authority for authentication, Socket.IO, and Neon scope.
- Appended dated, additive corrections to the affected specifications and audits. Older statements were retained for history and explicitly superseded, not deleted.
- Authentication direction is Auth.js-compatible solution or JWT with secure HTTP-only cookies; Better Auth is excluded.
- Socket.IO is the selected real-time transport; Neon Realtime and all other Neon services are excluded.
- Neon is limited to PostgreSQL and document/object storage.
- Updated audit status: authentication and real-time provider selection are no longer open blockers. Exact implementation configuration, event security, private-storage verification, and runtime tests remain open.

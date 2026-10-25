# Prisma and Relational Database Boundary

This directory houses the Prisma client generation configuration and future migrations for the **AICTE Approval Workflow Automation** project.

## Current Architecture Boundary

1. **Relational Persistence Baseline:** Neon PostgreSQL is the designated relational database.
2. **Current Status:** Logical planning models exist in:
   - [`docs/project-baseline/refined/DATABASE_SCHEMA.md`](../../docs/project-baseline/refined/DATABASE_SCHEMA.md)
   - [`docs/project-baseline/refined/DATABASE_SCHEMA_REVISION_2.md`](../../docs/project-baseline/refined/DATABASE_SCHEMA_REVISION_2.md)
3. **Reconciliation Required:** Full Prisma schema models and migrations are deferred to Phase 2 (Database & Data Model Implementation) to ensure complete alignment between database columns, workflow states, and API contracts (`docs/project-baseline/refined/api-specifications_FINAL.md`).
4. **Execution Safeguards:**
   - No remote Neon databases are connected during this scaffold phase.
   - Do not execute `prisma migrate dev` or `prisma db push` without project owner authorization and verified schemas.

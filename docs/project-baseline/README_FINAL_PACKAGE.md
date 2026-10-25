# Final AICTE Workflow Automation Documentation Package

## Package structure
- `original/`: the seven original Markdown documents, preserved byte-for-byte from the uploaded audit package.
- `refined/`: the seven refined specifications and existing audit records, with additive corrections appended; no prior refined text was removed.
- `source_materials/`: byte-preserving copies of the problem statement, supplied AICTE APH PDF, Tech Stack Reasoning note, and UX Spec Plan note.

## Current authority for final technology decisions
Read `refined/FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md` as the current authority for:
- Authentication: Auth.js-compatible solution or JWT with secure HTTP-only cookies; Better Auth excluded.
- Real-time updates: Socket.IO selected; Neon Realtime and all other Neon services excluded.
- Neon scope: PostgreSQL and document/object storage only.

Earlier audit statements that these provider choices were unresolved are preserved for historical traceability but are superseded by the final decision record. Remaining implementation details and runtime verification are listed in the decision record and audit documents.

## Preservation policy
No original Markdown file or prior refined-document content was intentionally removed or rewritten. Corrections are additive and dated so that prior information remains available while the current decision is unambiguous. The manifest in `refined/MANIFEST.sha256` covers all refined Markdown files other than the manifest itself.

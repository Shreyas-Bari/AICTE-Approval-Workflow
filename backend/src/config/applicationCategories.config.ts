/**
 * Application Category Versioned Reference Catalogue.
 *
 * Source Regulatory Reference:
 * - Approval Process Handbook (APH 2024-2027), All India Council for Technical Education.
 * - Chapter I: Setting up a New Technical Institution (Clauses 1.1-1.12, PDF pp. 17-27).
 * - Chapter II: Extension of Approval (EoA) based on Self-Disclosure (Clauses 2.1-2.5, Table 2.3, PDF pp. 28-31, 46).
 *   Conditional scrutiny/EVC provisions: Clauses 2.14 (Scrutiny), 2.15 (EVC), 2.19 (Grievances/Deficiencies).
 *
 * Project Governance Note:
 * This catalogue reflects the project owner's proposed demonstration scope for Decision Q-04
 * (Setting up a New Technical Institution and Extension of Approval). All other Chapter II
 * categories (mergers, closures, site changes) and Chapters III-V categories remain inactive/unactivated.
 */

export interface ApplicationCategoryConfig {
  id: string;
  categoryCode: string;
  name: string;
  description: string;
  academicCycle: string;
  applicableChapter: string;
  regulatoryBasis: string;
  /**
   * Baseline default workflow route prescribed by APH for standard applications in this category.
   * Note: For EoA, SELF_DISCLOSURE_FAST_TRACK applies strictly to the default Nil-Deficiency
   * Self-Disclosure path (Clause 2.5, Table 2.3 Row 1). Downstream workflow logic in Substage 3+
   * must model conditional Scrutiny/EVC escalations explicitly.
   */
  defaultWorkflowRoute: 'SCRUTINY_AND_EVC' | 'SELF_DISCLOSURE_FAST_TRACK';
  /**
   * Indicates whether standard applications in this category require Scrutiny Committee evaluation.
   * Note: For EoA, this is false by default for Nil-Deficiency Self-Disclosure, but the AICTE APH
   * contains conditional Scrutiny cases (Clause 2.14, Table 2.3) for deficient or flagged applications
   * that downstream workflow logic must evaluate dynamically.
   */
  requiresScrutiny: boolean;
  /**
   * Indicates whether standard applications in this category require Expert Visit Committee (EVC) inspection.
   * Note: For EoA, this is false by default for Nil-Deficiency Self-Disclosure, but the AICTE APH
   * prescribes conditional EVC inspection (Clauses 2.15, 2.19, Table 2.3) in cases of serious deficiencies,
   * grievances, or random audits that downstream workflow logic must evaluate dynamically.
   */
  requiresEVC: boolean;
  isActive: boolean;
  /**
   * Governance review status of this catalogue configuration entry itself ('APPROVED' | 'DRAFT' | 'RETIRED').
   * This reflects administrative approval of the catalogue definition for this software release,
   * NOT a statutory approval decision or grant for an applicant's institutional application.
   */
  reviewStatus: 'APPROVED' | 'DRAFT' | 'RETIRED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Internal software configuration snapshot identifier for the application category catalogue.
 *
 * IMPORTANT:
 * This string identifies the software configuration release ('2024-2027.1') aligning with
 * the AICTE Approval Process Handbook (2024-2027 edition). It is an internal software configuration
 * snapshot identifier, NOT an official AICTE statutory notification number or gazette release,
 * nor does it guarantee that regulatory rules apply unchanged across all academic years in the
 * multi-year cycle. Applicable rules remain tied per-application to the relevant academic cycle (e.g. 2024-2025).
 */
export const APPLICATION_CATALOGUE_VERSION = '2024-2027.1';

/**
 * Authoritative, versioned reference catalogue of supported application categories.
 */
export const APPLICATION_CATEGORIES_CATALOGUE: readonly ApplicationCategoryConfig[] = Object.freeze([
  {
    id: 'c1a70001-0000-4000-8000-000000000001',
    categoryCode: 'NEW_TECHNICAL_INSTITUTION',
    name: 'Setting up a New Technical Institution',
    description:
      'Application for establishment of a new technical institution offering approved diploma, undergraduate, and/or postgraduate programmes in recognized technical education fields.',
    academicCycle: '2024-2025',
    applicableChapter: 'Chapter I',
    regulatoryBasis: 'Approval Process Handbook 2024-2027, Chapter I, Clauses 1.1-1.12',
    defaultWorkflowRoute: 'SCRUTINY_AND_EVC',
    requiresScrutiny: true,
    requiresEVC: true,
    isActive: true,
    reviewStatus: 'APPROVED',
    createdAt: '2026-10-31T00:00:00.000Z',
    updatedAt: '2026-10-31T00:00:00.000Z'
  },
  {
    id: 'c1a70002-0000-4000-8000-000000000002',
    categoryCode: 'EXTENSION_OF_APPROVAL_EOA',
    name: 'Extension of Approval (EoA)',
    description:
      'Annual extension of approval for existing AICTE-approved technical institutions based on self-disclosure compliance, student enrolment, and nil deficiency status.',
    academicCycle: '2024-2025',
    applicableChapter: 'Chapter II',
    regulatoryBasis: 'Approval Process Handbook 2024-2027, Chapter II, Clauses 2.1-2.5 and Table 2.3',
    // Default baseline route for Nil-Deficiency Self-Disclosure under Clause 2.5 and Table 2.3 Row 1.
    // Statutory conditional cases: The AICTE APH contains conditional Scrutiny Committee (Clause 2.14)
    // and Expert Visit Committee (Clauses 2.15, 2.19, Table 2.3) cases for institutions with deficiencies,
    // complaints, or audit discrepancies. Downstream workflow logic in Substage 3+ must model those
    // conditions explicitly rather than treating fast-track as an invariant for all EoA applications.
    defaultWorkflowRoute: 'SELF_DISCLOSURE_FAST_TRACK',
    requiresScrutiny: false, // Default for Nil Deficiency; conditional scrutiny applies on deficiencies (Clause 2.14)
    requiresEVC: false, // Default for Nil Deficiency; conditional EVC applies on complaints/deficiencies (Clause 2.15/2.19)
    isActive: true,
    reviewStatus: 'APPROVED', // Catalogue configuration entry status (approved for release); not an application approval decision
    createdAt: '2026-10-31T00:00:00.000Z',
    updatedAt: '2026-10-31T00:00:00.000Z'
  }
]);

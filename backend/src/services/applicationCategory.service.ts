import {
  APPLICATION_CATEGORIES_CATALOGUE,
  APPLICATION_CATALOGUE_VERSION,
  ApplicationCategoryConfig
} from '../config/applicationCategories.config.js';

export interface ApplicationCategoryListResult {
  categories: ApplicationCategoryConfig[];
  version: string;
}

/**
 * Service providing read-only access to the versioned application category catalogue.
 * Exposes only approved and active categories per canonical specification (§8.4).
 */
export class ApplicationCategoryService {
  /**
   * Lists all approved, active application categories in the current catalogue release.
   */
  public static listApprovedCategories(): ApplicationCategoryListResult {
    const categories = APPLICATION_CATEGORIES_CATALOGUE.filter(
      (cat) => cat.isActive && cat.reviewStatus === 'APPROVED'
    );

    return {
      categories,
      version: APPLICATION_CATALOGUE_VERSION
    };
  }

  /**
   * Retrieves a specific approved application category by its canonical UUID.
   * Returns null if the category does not exist or is not active.
   */
  public static getCategoryById(categoryId: string): ApplicationCategoryConfig | null {
    const category = APPLICATION_CATEGORIES_CATALOGUE.find(
      (cat) => cat.id.toLowerCase() === categoryId.toLowerCase() && cat.isActive && cat.reviewStatus === 'APPROVED'
    );

    return category ?? null;
  }
}

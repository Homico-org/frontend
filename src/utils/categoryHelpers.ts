// High-level categories that get chat functionality
export const HIGH_LEVEL_CATEGORIES = ['design', 'architecture'];

/**
 * Check if a user is a high-level pro (design or architecture)
 * These pros get access to messaging/chat features
 */
export function isHighLevelPro(selectedCategories?: string[]): boolean {
  if (!selectedCategories || selectedCategories.length === 0) {
    return false;
  }
  return selectedCategories.some(cat =>
    HIGH_LEVEL_CATEGORIES.includes(cat.toLowerCase())
  );
}

/**
 * Check if a job category is high-level
 */
export function isHighLevelCategory(category?: string): boolean {
  if (!category) return false;
  return HIGH_LEVEL_CATEGORIES.includes(category.toLowerCase());
}

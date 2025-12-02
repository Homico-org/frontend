// Local Storage Service
// Centralized service for managing localStorage operations

const STORAGE_KEYS = {
  BROWSE_VIEW_MODE: 'homi_browse_view_mode',
  PRO_VIEW_MODE: 'homi_pro_view_mode',
  LANGUAGE: 'homi_language',
  THEME: 'homi_theme',
  RECENT_SEARCHES: 'homi_recent_searches',
  SAVED_FILTERS: 'homi_saved_filters',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

class StorageService {
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  // Generic get method
  get<T>(key: StorageKey, defaultValue: T): T {
    if (!this.isClient) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  // Generic set method
  set<T>(key: StorageKey, value: T): void {
    if (!this.isClient) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Remove item
  remove(key: StorageKey): void {
    if (!this.isClient) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // Clear all app-related storage
  clearAll(): void {
    if (!this.isClient) return;

    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    });
  }

  // Browse view mode (grid/list)
  getBrowseViewMode(): 'grid' | 'list' {
    return this.get(STORAGE_KEYS.BROWSE_VIEW_MODE, 'grid');
  }

  setBrowseViewMode(mode: 'grid' | 'list'): void {
    this.set(STORAGE_KEYS.BROWSE_VIEW_MODE, mode);
  }

  // Pro view mode (grid/list) - for pro users on browse page
  getProViewMode(): 'grid' | 'list' {
    return this.get(STORAGE_KEYS.PRO_VIEW_MODE, 'list');
  }

  setProViewMode(mode: 'grid' | 'list'): void {
    this.set(STORAGE_KEYS.PRO_VIEW_MODE, mode);
  }

  // Language preference
  getLanguage(): string {
    return this.get(STORAGE_KEYS.LANGUAGE, 'en');
  }

  setLanguage(lang: string): void {
    this.set(STORAGE_KEYS.LANGUAGE, lang);
  }

  // Theme preference
  getTheme(): 'light' | 'dark' | 'system' {
    return this.get(STORAGE_KEYS.THEME, 'system');
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.set(STORAGE_KEYS.THEME, theme);
  }

  // Recent searches
  getRecentSearches(): string[] {
    return this.get(STORAGE_KEYS.RECENT_SEARCHES, []);
  }

  addRecentSearch(search: string): void {
    const searches = this.getRecentSearches();
    const filtered = searches.filter(s => s !== search);
    const updated = [search, ...filtered].slice(0, 10); // Keep max 10
    this.set(STORAGE_KEYS.RECENT_SEARCHES, updated);
  }

  clearRecentSearches(): void {
    this.remove(STORAGE_KEYS.RECENT_SEARCHES);
  }

  // Saved filters
  getSavedFilters(): Record<string, any> {
    return this.get(STORAGE_KEYS.SAVED_FILTERS, {});
  }

  setSavedFilters(filters: Record<string, any>): void {
    this.set(STORAGE_KEYS.SAVED_FILTERS, filters);
  }

  // Get file URL - handles both local uploads and external URLs
  getFileUrl(path: string | undefined): string {
    if (!path) return '';

    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If it starts with /uploads, prepend the API URL
    if (path.startsWith('/uploads')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${apiUrl}${path}`;
    }

    // Otherwise, assume it's just a filename and build the full path
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${apiUrl}/uploads/${path}`;
  }
}

// Export singleton instance
export const storage = new StorageService();

// Export keys for reference
export { STORAGE_KEYS };

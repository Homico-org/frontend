/**
 * BASE INTERFACES
 * Common interface patterns used across entities.
 */

// ============== TIMESTAMPS ==============

export interface Timestamps {
  createdAt: string;
  updatedAt?: string;
}

// ============== BASE ENTITY ==============

/**
 * All entities have an 'id' field (not '_id').
 * Backend returns MongoDB's _id, but frontend transforms to 'id'.
 */
export interface BaseEntity extends Timestamps {
  id: string;
}

// ============== MEDIA TYPES ==============

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface ReferenceItem {
  type: 'link' | 'image' | 'pinterest' | 'instagram';
  url: string;
  title?: string;
  thumbnail?: string;
}

export interface BeforeAfterPair {
  id?: string;
  beforeImage: string;
  afterImage: string;
}

// ============== PAGINATION ==============

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============== API RESPONSE WRAPPER ==============

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

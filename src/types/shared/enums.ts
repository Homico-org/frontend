/**
 * SHARED ENUMS
 * These enums are the source of truth and should match backend exactly.
 * Backend enums are defined in their respective schema files.
 */

// ============== USER ENUMS ==============

export enum UserRole {
  CLIENT = 'client',
  PRO = 'pro',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export enum AccountType {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
}

export enum ProStatus {
  ACTIVE = 'active',
  BUSY = 'busy',
  AWAY = 'away',
}

export enum PricingModel {
  FIXED = 'fixed',
  RANGE = 'range',
  BY_AGREEMENT = 'byAgreement',
}

export enum VerificationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// ============== JOB ENUMS ==============

export enum JobStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum JobBudgetType {
  FIXED = 'fixed',
  RANGE = 'range',
  PER_SQUARE_METER = 'per_sqm',
  NEGOTIABLE = 'negotiable',
}

export enum JobSizeUnit {
  SQUARE_METER = 'sqm',
  ROOM = 'room',
  UNIT = 'unit',
  FLOOR = 'floor',
  ITEM = 'item',
}

export enum JobPropertyType {
  APARTMENT = 'apartment',
  OFFICE = 'office',
  BUILDING = 'building',
  HOUSE = 'house',
  OTHER = 'other',
}

// ============== PROPOSAL ENUMS ==============

export enum ProposalStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  COMPLETED = 'completed',
}

export enum HiringChoice {
  HOMICO = 'homico',
  DIRECT = 'direct',
}

// ============== PROJECT ENUMS ==============

export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ============== ORDER ENUMS ==============

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  REVISION = 'revision',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

// ============== OFFER ENUMS ==============

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// ============== FEED ENUMS ==============

export enum FeedItemType {
  PORTFOLIO = 'portfolio',
  COMPLETION = 'completion',
  BEFORE_AFTER = 'before_after',
  PRO_HIGHLIGHT = 'pro_highlight',
}

export enum LikeTargetType {
  PRO_PROFILE = 'pro_profile',
  PORTFOLIO_ITEM = 'portfolio_item',
  FEED_ITEM = 'feed_item',
}

// ============== NOTIFICATION ENUMS ==============

export enum NotificationType {
  ORDER = 'order',
  MESSAGE = 'message',
  REVIEW = 'review',
  PROPOSAL = 'proposal',
  PAYMENT = 'payment',
  SYSTEM = 'system',
}

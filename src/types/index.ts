/**
 * TYPES INDEX
 *
 * This file re-exports all types from the new shared types system.
 * The shared types use 'id' instead of '_id' for consistency.
 *
 * MIGRATION NOTE:
 * Legacy types with '_id' have been replaced with types using 'id'.
 * Use the transform utilities when receiving backend data:
 *
 *   import { transformEntity, transformEntities } from '@/types/shared/transforms';
 *
 * IMPORTING:
 *   // Preferred - direct from shared
 *   import { User, Job, ProProfile, UserRole } from '@/types/shared';
 *
 *   // Also works - from index (for backward compatibility)
 *   import { User, Job, ProProfile, UserRole } from '@/types';
 */

// Re-export everything from shared types
export * from './shared';

// ============== LEGACY COMPATIBILITY ALIASES ==============
// These ensure existing code continues to work during migration

import type {
  CompanyRef,
  ProProfile as NewProProfile,
  PortfolioItem as NewPortfolioItem,
  FeedItem as NewFeedItem,
  ProjectRequest as NewProjectRequest,
  Conversation as NewConversation,
  Message as NewMessage,
  Offer as NewOffer,
  Review as NewReview,
  Service as NewService,
  Order as NewOrder,
  OrderMilestone as NewOrderMilestone,
  Proposal as NewProposal,
  Notification as NewNotification,
} from './shared';

// ============== LEGACY TYPES WITH _id ==============
// These are kept for backward compatibility but should be migrated

/**
 * @deprecated Use Company from shared types with 'id' instead of '_id'
 */
export interface LegacyCompany {
  _id: string;
  name: string;
  logo?: string;
}

/**
 * @deprecated Access pro.id instead of pro._id
 */
export interface LegacyProProfile extends Omit<NewProProfile, 'id' | 'companies' | 'createdAt' | 'lastLoginAt'> {
  _id: string;
  __v: number;
  companies: LegacyCompany[];
  createdAt: Date;
  lastLoginAt: Date;
}

/**
 * @deprecated Access item.id instead of item._id
 */
export interface LegacyPortfolioItem extends Omit<NewPortfolioItem, 'id' | 'createdAt' | 'projectDate'> {
  _id: string;
  projectDate?: Date;
}

/**
 * @deprecated Access item.id and item.pro.id instead of _id
 */
export interface LegacyFeedItem extends Omit<NewFeedItem, 'id' | 'pro'> {
  _id: string;
  pro: {
    _id: string;
    name: string;
    avatar?: string;
    rating: number;
    title?: string;
  };
}

/**
 * @deprecated Access request.id instead of request._id
 */
export interface LegacyProjectRequest extends Omit<NewProjectRequest, 'id' | 'createdAt'> {
  _id: string;
  createdAt: Date;
}

/**
 * @deprecated Access conversation.id instead of conversation._id
 */
export interface LegacyConversation extends Omit<NewConversation, 'id' | 'lastMessageAt' | 'createdAt'> {
  _id: string;
  lastMessageAt?: Date;
}

/**
 * @deprecated Access message.id instead of message._id
 */
export interface LegacyMessage extends Omit<NewMessage, 'id' | 'createdAt'> {
  _id: string;
  createdAt: Date;
}

/**
 * @deprecated Access offer.id instead of offer._id
 */
export interface LegacyOffer extends Omit<NewOffer, 'id' | 'createdAt' | 'estimatedStartDate'> {
  _id: string;
  estimatedStartDate?: Date;
  createdAt: Date;
}

/**
 * @deprecated Access review.id instead of review._id
 */
export interface LegacyReview extends Omit<NewReview, 'id' | 'createdAt'> {
  _id: string;
  createdAt: Date;
}

/**
 * @deprecated Access service.id instead of service._id
 */
export interface LegacyService extends Omit<NewService, 'id' | 'createdAt' | 'updatedAt'> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated Access milestone.id instead of milestone._id
 */
export interface LegacyOrderMilestone extends Omit<NewOrderMilestone, 'id' | 'dueDate' | 'completedAt' | 'createdAt'> {
  _id: string;
  dueDate?: Date;
  completedAt?: Date;
}

/**
 * @deprecated Access order.id instead of order._id
 */
export interface LegacyOrder extends Omit<NewOrder, 'id' | 'milestones' | 'deliveryDeadline' | 'deliveredAt' | 'completedAt' | 'createdAt' | 'updatedAt'> {
  _id: string;
  milestones: LegacyOrderMilestone[];
  deliveryDeadline: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @deprecated Access proposal.id instead of proposal._id
 */
export interface LegacyProposal extends Omit<NewProposal, 'id' | 'createdAt'> {
  _id: string;
  /** @deprecated Use proposedPrice */
  proposedAmount: number;
  /** @deprecated Use estimatedDuration */
  deliveryDays: number;
  /** @deprecated Use viewedByClient */
  isViewed: boolean;
  createdAt: Date;
}

/**
 * @deprecated Access notification.id instead of notification._id
 */
export interface LegacyNotification extends Omit<NewNotification, 'id' | 'createdAt'> {
  _id: string;
  createdAt: Date;
}

// ============== TYPE ALIASES FOR MIGRATION ==============
// Allow gradual migration by supporting both patterns

/** @see NewProProfile for the new type with 'id' */
export type Company = CompanyRef;

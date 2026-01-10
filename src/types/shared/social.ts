/**
 * SOCIAL & INTERACTION INTERFACES
 * Reviews, messages, conversations, feed items, etc.
 */

import { BaseEntity, BeforeAfterPair } from './base';
import { FeedItemType, LikeTargetType, NotificationType } from './enums';
import { ProProfile, PublicUserProfile } from './user';

// ============== REVIEW ==============

export interface Review extends BaseEntity {
  projectId?: string;
  jobId?: string;
  clientId: string | PublicUserProfile;
  proId: string | ProProfile;
  rating: number;
  text?: string;
  photos: string[];
  isVerified: boolean;
  proResponseId?: string;
  // Populated fields
  client?: PublicUserProfile;
  pro?: ProProfile;
}

// ============== CONVERSATION ==============

export interface Conversation extends BaseEntity {
  clientId: string | PublicUserProfile;
  proId: string | ProProfile;
  projectRequestId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  // Populated for list views
  client?: PublicUserProfile;
  pro?: ProProfile;
  otherUser?: PublicUserProfile;
  unreadCount?: number;
}

// ============== MESSAGE ==============

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string | PublicUserProfile;
  content: string;
  isRead: boolean;
  attachments: string[];
}

// ============== FEED ITEM ==============

export interface FeedItemPro {
  id: string;
  _id?: string; // Backend may return _id instead of id
  name: string;
  avatar?: string;
  rating: number;
  title?: string;
}

export interface FeedItemClient {
  name?: string;
  avatar?: string;
  city?: string;
}

export interface FeedItem extends BaseEntity {
  type: FeedItemType;
  title: string;
  description?: string;
  images: string[];
  videos?: string[];
  beforeImage?: string;
  afterImage?: string;
  beforeAfterPairs?: BeforeAfterPair[];
  category: string;
  tags?: string[];
  pro: FeedItemPro;
  client?: FeedItemClient;
  rating?: number;
  review?: string;
  likeCount: number;
  isLiked: boolean;
  isVerified?: boolean;
  jobId?: string;
  likeTargetType?: LikeTargetType;
  likeTargetId?: string;
}

// ============== PORTFOLIO ITEM (STANDALONE) ==============

export interface PortfolioItem extends BaseEntity {
  proId: string;
  title: string;
  description?: string;
  imageUrl: string;
  images?: string[];
  tags: string[];
  projectDate?: string;
  completedDate?: string;
  location?: string;
  source?: 'external' | 'homico';
  status?: string;
  projectType?: string;
  displayOrder?: number;
  category?: string;
  rating?: number;
  review?: string;
  beforeImage?: string;
  afterImage?: string;
}

// ============== NOTIFICATION ==============

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
}

// ============== LIKE ==============

export interface Like extends BaseEntity {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
}

/**
 * PROJECT & ORDER INTERFACES
 * All project, order, and service-related types.
 */

import { BaseEntity } from './base';
import { MilestoneStatus, OfferStatus, OrderStatus, ProjectStatus } from './enums';
import { ProProfile, PublicUserProfile, User } from './user';

// ============== PROJECT TRACKING ==============

export type ProjectStage = 'hired' | 'started' | 'in_progress' | 'review' | 'completed';

export interface ProjectComment {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'client' | 'pro';
  content: string;
  createdAt: string;
}

export interface ProjectAttachment {
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  uploadedAt: string;
}

export interface ProjectTracking extends BaseEntity {
  jobId: string;
  clientId: { id: string; name: string; avatar?: string };
  proId: { id: string; name: string; avatar?: string; phone?: string; title?: string };
  currentStage: ProjectStage;
  progress: number;
  hiredAt: string;
  startedAt?: string;
  expectedEndDate?: string;
  completedAt?: string;
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  agreedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
}

// ============== PROJECT REQUEST ==============

export interface ProjectRequest extends BaseEntity {
  clientId: string | PublicUserProfile;
  proId?: string | ProProfile;
  category: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;
  photos: string[];
  status: ProjectStatus;
}

// ============== OFFER ==============

export interface Offer extends BaseEntity {
  projectRequestId: string;
  proId: string | ProProfile;
  priceEstimate: number;
  currency: string;
  estimatedStartDate?: string;
  estimatedDurationDays?: number;
  description?: string;
  status: OfferStatus;
}

// ============== SERVICE (GIG) ==============

export interface ServicePackage {
  name: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface ServiceGalleryItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface Service extends BaseEntity {
  proId: string | ProProfile;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  packages: ServicePackage[];
  gallery: ServiceGalleryItem[];
  faqs: ServiceFAQ[];
  requirements: string[];
  avgRating: number;
  totalReviews: number;
  totalOrders: number;
  impressions: number;
  isActive: boolean;
}

// ============== ORDER ==============

export interface OrderMilestone extends BaseEntity {
  title: string;
  description: string;
  amount: number;
  dueDate?: string;
  status: MilestoneStatus;
  deliverables?: string[];
  completedAt?: string;
}

export interface CustomOffer {
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
}

export interface Order extends BaseEntity {
  serviceId?: string | Service;
  projectRequestId?: string | ProjectRequest;
  clientId: string | User;
  proId: string | ProProfile;
  packageType?: 'basic' | 'standard' | 'premium';
  customOffer?: CustomOffer;
  milestones: OrderMilestone[];
  totalAmount: number;
  platformFee: number;
  status: OrderStatus;
  requirements?: string;
  attachments: string[];
  deliveryDeadline: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelReason?: string;
  revision: {
    count: number;
    maxAllowed: number;
  };
}

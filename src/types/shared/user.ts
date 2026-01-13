/**
 * USER INTERFACES
 * All user-related types including Pro profiles.
 */

import { BaseEntity, BeforeAfterPair } from './base';
import {
    AccountType,
    PricingModel,
    ProStatus,
    UserRole,
    VerificationStatus,
} from './enums';

// ============== EMBEDDED TYPES ==============

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardholderName?: string;
  bankName?: string;
  maskedIban?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CompanyRef {
  id?: string;
  name: string;
  logo?: string;
  role?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string;
  location?: string;
  images: string[];
  videos?: string[];
  beforeAfterPairs?: BeforeAfterPair[];
  source?: 'external' | 'homico';
  jobId?: string;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
    marketing: boolean;
  };
  push: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
  };
  sms: {
    enabled: boolean;
    proposals: boolean;
    messages: boolean;
  };
}

// ============== USER (BASE) ==============

/**
 * Basic user information returned from /users/me
 * Used for authenticated user context
 */
export interface User extends BaseEntity {
  uid?: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  city?: string;
  accountType?: AccountType;
  companyName?: string;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  whatsapp?: string;
  telegram?: string;
  verificationStatus?: VerificationStatus;
}

// ============== USER (PUBLIC PROFILE) ==============

/**
 * Public profile visible to other users
 */
export interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  role: UserRole;
  accountType?: AccountType;
  companyName?: string;
  createdAt: string;
}

// ============== PRO PROFILE ==============

/**
 * Full professional profile
 * Used on pro detail pages and listings
 */
export interface ProProfile extends BaseEntity {
  uid?: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  accountType: AccountType;
  companyName?: string;
  
  // Pro-specific fields
  title?: string;
  bio?: string;
  description?: string;
  tagline?: string;
  
  // Categories & Services
  categories: string[];
  subcategories: string[];
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  customServices?: string[];
  
  // Experience & Stats
  yearsExperience: number;
  avgRating: number;
  totalReviews: number;
  completedJobs: number;
  completedProjects?: number;
  externalCompletedJobs?: number;
  
  // Pricing
  pricingModel?: PricingModel;
  basePrice?: number;
  maxPrice?: number;
  
  // Location & Availability
  serviceAreas: string[];
  isAvailable: boolean;
  status: ProStatus;
  statusAutoSuggested: boolean;
  availability?: string[];
  
  // Portfolio
  portfolioProjects: PortfolioProject[];
  portfolioImages: string[];
  pinterestLinks: string[];
  portfolioItemCount?: number; // Count from PortfolioItem collection
  
  // Verification
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  verificationStatus?: VerificationStatus;
  isPremium: boolean;
  premiumTier?: string;
  
  // Design-specific
  designStyles?: string[];
  
  // Architecture-specific
  cadastralId?: string;
  cadastralVerified: boolean;
  architectLicenseNumber?: string;
  
  // Certifications & Languages
  certifications: string[];
  languages: string[];
  
  // Social Links
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  whatsapp?: string;
  telegram?: string;
  
  // Company associations
  companies: CompanyRef[];
  companyId?: string;
  
  // Profile management
  profileType: string;
  isActive: boolean;
  lastLoginAt?: string;
  
  // Payment
  paymentMethods: PaymentMethod[];
}

// ============== PRO CARD (LIST VIEW) ==============

/**
 * Lightweight pro info for list/card views
 */
export interface ProCard {
  id: string;
  uid?: number;
  name: string;
  avatar?: string;
  title?: string;
  tagline?: string;
  categories: string[];
  subcategories?: string[];
  city?: string;
  avgRating: number;
  totalReviews: number;
  completedJobs: number;
  yearsExperience: number;
  isPremium: boolean;
  isAvailable: boolean;
  status: ProStatus;
  basePrice?: number;
  maxPrice?: number;
  pricingModel?: PricingModel;
  portfolioImages?: string[];
  verificationStatus?: VerificationStatus;
}

// ============== PRO EARNINGS ==============

export interface ProEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  availableForWithdrawal: number;
  thisMonth: number;
  lastMonth: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  responseRate: number;
  responseTime: number;
}

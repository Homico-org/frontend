export enum UserRole {
  CLIENT = 'client',
  PRO = 'pro',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export enum ProStatus {
  ACTIVE = 'active',
  BUSY = 'busy',
  AWAY = 'away',
}

export enum LikeTargetType {
  PRO_PROFILE = 'pro_profile',
  PORTFOLIO_ITEM = 'portfolio_item',
  FEED_ITEM = 'feed_item',
}

export enum FeedItemType {
  PORTFOLIO = 'portfolio',
  COMPLETION = 'completion',
  BEFORE_AFTER = 'before_after',
  PRO_HIGHLIGHT = 'pro_highlight',
}

export enum AccountType {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  city?: string;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
  accountType?: 'individual' | 'organization';
  companyName?: string;
  whatsapp?: string;
  telegram?: string;
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  location?: string;
  images: string[];
  videos?: string[];
  beforeAfterPairs?: { id?: string; beforeImage: string; afterImage: string }[];
}
export interface ProProfile {
  accountType: AccountType;
  availability: string[];
  avatar: string;
  avgRating: number;
  cadastralVerified: boolean;
  categories: string[];
  certifications: string[];
  city: string;
  companies: Company[];
  completedJobs: number;
  completedProjects: number;
  createdAt: Date;
  designStyles: string[];
  email: string;
  isActive: boolean;
  isAvailable: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPremium: boolean;
  languages: string[];
  lastLoginAt: Date;
  name: string;
  paymentMethods: PaymentMethod[];
  phone: string;
  pinterestLinks: string[];
  portfolioImages: string[];
  portfolioProjects: PortfolioProject[];
  premiumTier: string;
  profileType: string;
  role: UserRole;
  selectedCategories: string[];
  selectedSubcategories: string[];
  serviceAreas: string[];
  status: ProStatus;
  statusAutoSuggested: boolean;
  subcategories: string[];
  telegram: string;
  whatsapp: string;
  yearsExperience: number;
  __v: number;
  _id: string;
}

export interface PortfolioItem {
  _id: string;
  proId: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags: string[];
  projectDate?: Date;
  location?: string;
}

export interface FeedItem {
  _id: string;
  type: FeedItemType;
  title: string;
  description?: string;
  images: string[];
  beforeImage?: string;
  afterImage?: string;
  category: string;
  tags?: string[];
  pro: {
    _id: string;
    name: string;
    avatar?: string;
    rating: number;
    title?: string;
  };
  client?: {
    name?: string;
    avatar?: string;
    city?: string;
  };
  rating?: number;
  review?: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  isVerified?: boolean; // Work done through Homico platform
  jobId?: string; // Reference to original job if done on Homico
  // For embedded projects that don't have their own ObjectId
  likeTargetType?: 'portfolio_item' | 'pro_profile';
  likeTargetId?: string;
}

export enum ProjectStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ProjectRequest {
  _id: string;
  clientId: User;
  proId?: ProProfile;
  category: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  photos: string[];
  status: ProjectStatus;
  createdAt: Date;
}

export interface Conversation {
  _id: string;
  clientId: User;
  proId: ProProfile;
  projectRequestId?: string;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  isRead: boolean;
  createdAt: Date;
  attachments: string[];
}

export interface Offer {
  _id: string;
  projectRequestId: string;
  proId: ProProfile;
  priceEstimate: number;
  currency: string;
  estimatedStartDate?: Date;
  estimatedDurationDays?: number;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface Review {
  _id: string;
  projectId: string;
  clientId: User;
  proId: ProProfile;
  rating: number;
  text?: string;
  photos: string[];
  createdAt: Date;
}

// Gig/Service types (Fiverr-style)
export interface ServicePackage {
  name: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface Service {
  _id: string;
  proId: ProProfile;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  packages: ServicePackage[];
  gallery: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  requirements: string[];
  avgRating: number;
  totalReviews: number;
  totalOrders: number;
  impressions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
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

export interface OrderMilestone {
  _id: string;
  title: string;
  description: string;
  amount: number;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  deliverables?: string[];
  completedAt?: Date;
}

export interface Order {
  _id: string;
  serviceId?: Service;
  projectRequestId?: ProjectRequest;
  clientId: User;
  proId: ProProfile;
  packageType?: 'basic' | 'standard' | 'premium';
  customOffer?: {
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
  };
  milestones: OrderMilestone[];
  totalAmount: number;
  platformFee: number;
  status: OrderStatus;
  requirements?: string;
  attachments: string[];
  deliveryDeadline: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelReason?: string;
  revision: {
    count: number;
    maxAllowed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Proposal for jobs
export interface Proposal {
  _id: string;
  jobId: string;
  proId: ProProfile;
  coverLetter: string;
  proposedAmount: number;
  deliveryDays: number;
  milestones?: {
    title: string;
    amount: number;
    deliveryDays: number;
  }[];
  attachments: string[];
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  isViewed: boolean;
  createdAt: Date;
}

// Notification types
export interface Notification {
  _id: string;
  userId: string;
  type: 'order' | 'message' | 'review' | 'proposal' | 'payment' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

// Earnings/Analytics
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
  responseTime: number; // in hours
}

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
  accountType?: 'individual' | 'organization';
  companyName?: string;
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
}

export interface ProProfile {
  _id: string;
  userId: User;
  title: string;
  companyName?: string;
  description: string;
  categories: string[];
  yearsExperience: number;
  serviceAreas: string[];
  pricingModel: 'hourly' | 'project_based' | 'from';
  basePrice?: number;
  currency?: string;
  avgRating: number;
  totalReviews: number;
  isAvailable: boolean;
  status?: ProStatus;
  statusUpdatedAt?: string;
  coverImage?: string;
  tagline?: string;
  completedJobs?: number;
  externalCompletedJobs?: number;
  responseTime?: string;
  companies?: Company[];
  avatar?: string;
  bio?: string;
  portfolioProjects?: {
    title: string;
    description: string;
    location?: string;
    images: string[];
    videos?: string[];
  }[];
  likeCount?: number;
  isLiked?: boolean;
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

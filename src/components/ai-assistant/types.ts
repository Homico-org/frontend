// ─── Shared Types ────────────────────────────────────────────────────────────

export type PricingModel = "fixed" | "range" | "byAgreement" | "per_sqm";
export type ReviewSource = "homico" | "external";
export type ChatRole = "user" | "assistant";
export type ActionType = "link" | "action";
export type SessionStatus = "active" | "closed";

export interface ProPriceRange {
  min?: number;
  max?: number;
  model: PricingModel;
  currency: string;
}

export interface PriceRangeValues {
  min: number;
  max: number;
  currency: string;
}

// ─── Rich Content Types ─────────────────────────────────────────────────────

export enum RichContentType {
  PROFESSIONAL_CARD = "PROFESSIONAL_CARD",
  PROFESSIONAL_LIST = "PROFESSIONAL_LIST",
  CATEGORY_LIST = "CATEGORY_LIST",
  REVIEW_LIST = "REVIEW_LIST",
  PRICE_INFO = "PRICE_INFO",
  FEATURE_EXPLANATION = "FEATURE_EXPLANATION",
  FEATURE_LIST = "FEATURE_LIST",
  FAQ_LIST = "FAQ_LIST",
}

export interface ProfessionalCardData {
  id: string;
  uid: number;
  name: string;
  avatar?: string;
  title?: string;
  isVerified: boolean;
  isPremium: boolean;
  avgRating: number;
  totalReviews: number;
  primaryCategory: string;
  primaryCategoryKa?: string;
  priceRange?: ProPriceRange;
  portfolioCount: number;
  completedJobs: number;
  profileUrl: string;
}

export interface CategoryItem {
  key: string;
  name: string;
  nameKa?: string;
  icon?: string;
  subcategoryCount?: number;
  professionalCount?: number;
}

export interface ReviewItem {
  id: string;
  rating: number;
  text?: string;
  clientName: string;
  isAnonymous: boolean;
  isVerified: boolean;
  source: ReviewSource;
  projectTitle?: string;
  createdAt: string;
}

export interface PriceRange {
  label: string;
  labelKa?: string;
  min: number;
  max: number;
  currency: string;
}

export interface PriceInfo {
  category: string;
  categoryKa?: string;
  averagePrice?: PriceRangeValues;
  priceRanges: PriceRange[];
  professionalCount: number;
  note?: string;
  noteKa?: string;
}

export interface FeatureStep {
  step: number;
  title: string;
  titleKa?: string;
  titleRu?: string;
  description: string;
  descriptionKa?: string;
  descriptionRu?: string;
  icon?: string;
}

export interface FeatureExplanation {
  feature: string;
  title: string;
  titleKa?: string;
  titleRu?: string;
  description: string;
  descriptionKa?: string;
  descriptionRu?: string;
  steps?: FeatureStep[];
  actionUrl?: string;
  actionLabel?: string;
  actionLabelKa?: string;
  actionLabelRu?: string;
}

export interface FaqItem {
  question: string;
  questionKa?: string;
  questionRu?: string;
  answer: string;
  answerKa?: string;
  answerRu?: string;
  relatedFeature?: string;
}

export interface RichContent {
  type: RichContentType;
  data:
    | ProfessionalCardData
    | ProfessionalCardData[]
    | CategoryItem[]
    | ReviewItem[]
    | PriceInfo
    | FeatureExplanation
    | FeatureExplanation[]
    | FaqItem[];
}

// Chat Types
export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt?: string;
  suggestedActions?: SuggestedAction[];
  richContent?: RichContent[];
}

export interface SuggestedAction {
  type: ActionType;
  label: string;
  labelKa?: string;
  labelRu?: string;
  url?: string;
  action?: string;
  actionKa?: string;
  actionRu?: string;
}

export interface ChatSession {
  sessionId: string;
  status: SessionStatus;
  messageCount: number;
  messages: ChatMessage[];
  createdAt: string;
}

export interface SendMessageResponse {
  response: string;
  suggestedActions?: SuggestedAction[];
  richContent?: RichContent[];
}

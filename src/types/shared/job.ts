/**
 * JOB & PROPOSAL INTERFACES
 * 
 * These types represent what the API returns (always populated objects).
 * Use these directly in pages and components.
 */

import { BaseEntity, MediaItem, ReferenceItem } from './base';
import {
  JobBudgetType,
  JobPropertyType,
  JobSizeUnit,
  JobStatus
} from './enums';
import type { ProjectTracking } from './project';

// ============== EMBEDDED TYPES ==============

/**
 * Client info embedded in Job responses
 */
export interface JobClient {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  city?: string;
  phone?: string;
  accountType?: 'individual' | 'organization';
  companyName?: string;
}

/**
 * Pro info embedded in Proposal responses
 */
export interface ProposalPro {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  phone?: string;
  title?: string;
}

// ============== JOB ==============

/**
 * Job interface - matches what the API returns.
 * All optional fields are marked as such for flexibility.
 */
export interface Job extends BaseEntity {
  // Core fields
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  
  // Client info (always populated in API responses)
  clientId: JobClient;
  
  // Optional identifiers
  jobNumber?: number;
  
  // Location & Property
  location?: string;
  propertyType?: JobPropertyType | string;
  propertyTypeOther?: string;
  
  // Skills
  skills?: string[];
  
  // Size specifications
  areaSize?: number;
  sizeUnit?: JobSizeUnit | string;
  roomCount?: number;
  floorCount?: number;
  
  // Budget
  budgetType: JobBudgetType | string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  
  // Status & Dates
  status: JobStatus | string;
  deadline?: string;
  expiresAt?: string;
  
  // Media
  images: string[];
  media?: MediaItem[];
  
  // Stats
  proposalCount: number;
  viewCount: number;
  
  // Architecture-specific (optional)
  cadastralId?: string;
  landArea?: number;
  pointsCount?: number;
  projectPhase?: string;
  permitRequired?: boolean;
  currentCondition?: string;
  zoningType?: string;
  
  // Interior Design-specific (optional)
  designStyle?: string;
  roomsToDesign?: string[];
  furnitureIncluded?: boolean;
  visualizationNeeded?: boolean;
  references?: ReferenceItem[];
  preferredColors?: string[];
  existingFurniture?: string;
  
  // Renovation-specific (optional)
  workTypes?: string[];
  materialsProvided?: boolean;
  materialsNote?: string;
  occupiedDuringWork?: boolean;
  
  // Hired pro (when job is in progress)
  hiredPro?: {
    id: string;
    _id?: string;
    uid?: number;
    userId?: { id: string; _id?: string; uid?: number; name: string; avatar?: string; phone?: string };
    name?: string;
    avatar?: string;
    title?: string;
    phone?: string;
  };
  
  // Additional stats (returned in some views)
  shortlistedCount?: number;
  
  // Recent proposals preview (for my-jobs page)
  recentProposals?: Array<{
    id: string;
    proId: { avatar?: string; name: string };
  }>;
  
  // Project tracking (for in_progress jobs)
  projectTracking?: ProjectTracking;
}

// ============== PROPOSAL ==============

/**
 * Proposal - represents what API returns.
 * proId is always populated as ProposalPro object.
 * jobId can be string or populated Job (depends on endpoint).
 */
export interface Proposal extends BaseEntity {
  // Job reference (string ID or populated Job object)
  jobId: string | Job;
  
  // Pro info (always populated in list views)
  proId: ProposalPro;
  
  // Proposal content
  coverLetter: string;
  proposedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: 'days' | 'weeks' | 'months' | string;
  
  // Status
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'in_discussion' | 'completed' | string;
  hiringChoice?: 'homico' | 'direct' | string;
  
  // Contact & Communication
  contactRevealed?: boolean;
  revealedAt?: string;
  conversationId?: string;
  clientRespondedAt?: string;
  acceptedAt?: string;
  rejectionNote?: string;
  unreadMessageCount?: number;
  
  // View tracking
  viewedByClient?: boolean;
  viewedByPro?: boolean;
  
  // Project tracking (for active/completed proposals)
  projectTracking?: ProjectTracking;
}

// ============== SAVED JOB ==============

export interface SavedJob extends BaseEntity {
  userId: string;
  jobId: string;
  job?: Job;
  savedAt?: string;
}

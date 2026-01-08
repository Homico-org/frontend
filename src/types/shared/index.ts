/**
 * SHARED TYPES - MAIN EXPORT
 *
 * This is the centralized type system for the frontend.
 * All types use 'id' instead of '_id' for consistency.
 *
 * USAGE:
 *   import { User, Job, ProProfile, UserRole } from '@/types/shared';
 *
 * STRUCTURE:
 *   - enums.ts     : All enum definitions (mirrors backend)
 *   - base.ts      : Base interfaces (BaseEntity, Timestamps, etc.)
 *   - user.ts      : User, ProProfile, and related types
 *   - job.ts       : Job, Proposal, and related types
 *   - project.ts   : Project, Order, Service types
 *   - social.ts    : Review, Message, Notification, Feed types
 */

// ============== ENUMS ==============
export * from './enums';

// ============== BASE TYPES ==============
export * from './base';

// ============== USER TYPES ==============
export * from './user';

// ============== JOB TYPES ==============
export * from './job';

// ============== PROJECT TYPES ==============
export * from './project';

// ============== SOCIAL TYPES ==============
export * from './social';

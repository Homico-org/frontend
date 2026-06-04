'use client';

import { trackAmplitudeEvent } from '@/lib/amplitude';
import { trackEvent as trackMongo } from '@/hooks/useTracker';
import { UserRole } from '@/types';
import { useCallback } from 'react';

// Extend window for Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

// Event names enum for type safety
export enum AnalyticsEvent {
  // Auth events
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  REGISTER_PRO = 'register_pro',
  REGISTER_CLIENT = 'register_client',

  // Job events
  JOB_VIEW = 'job_view',
  JOB_POST = 'job_post',
  JOB_EDIT = 'job_edit',
  JOB_DELETE = 'job_delete',
  JOB_SEARCH = 'job_search',
  JOB_FILTER = 'job_filter',
  JOB_SAVE = 'job_save',
  JOB_UNSAVE = 'job_unsave',

  // Proposal events
  PROPOSAL_SUBMIT = 'proposal_submit',
  PROPOSAL_WITHDRAW = 'proposal_withdraw',
  PROPOSAL_ACCEPT = 'proposal_accept',
  PROPOSAL_REJECT = 'proposal_reject',

  // Profile events
  PROFILE_VIEW = 'profile_view',
  PROFILE_SETUP_START = 'profile_setup_start',
  PROFILE_SETUP_COMPLETE = 'profile_setup_complete',
  PROFILE_UPDATE = 'profile_update',

  // Portfolio events
  PORTFOLIO_VIEW = 'portfolio_view',
  PORTFOLIO_PROJECT_ADD = 'portfolio_project_add',
  PORTFOLIO_PROJECT_DELETE = 'portfolio_project_delete',

  // Messaging events
  MESSAGE_SEND = 'message_send',
  CONVERSATION_START = 'conversation_start',

  // Contact events
  CONTACT_REVEAL = 'contact_reveal',
  PHONE_CLICK = 'phone_click',
  EMAIL_CLICK = 'email_click',
  WHATSAPP_CLICK = 'whatsapp_click',

  // Premium events
  PREMIUM_VIEW = 'premium_view',
  PREMIUM_CHECKOUT_START = 'premium_checkout_start',
  PREMIUM_PURCHASE = 'premium_purchase',
  PREMIUM_SUCCESS = 'premium_success',

  // Navigation events
  PAGE_VIEW = 'page_view',
  CATEGORY_SELECT = 'category_select',
  SUBCATEGORY_SELECT = 'subcategory_select',

  // Search events
  SEARCH = 'search',
  SEARCH_RESULT_CLICK = 'search_result_click',

  // Review events
  REVIEW_SUBMIT = 'review_submit',
  REVIEW_VIEW = 'review_view',

  // Error events
  ERROR = 'error',
  API_ERROR = 'api_error',

  // Landing-specific
  LANDING_VIEW = 'landing_view',
  LANDING_HERO_SEARCH = 'landing_hero_search',
  LANDING_CATEGORY_CLICK = 'landing_category_click',
  LANDING_ASSISTANT_CLICK = 'landing_assistant_click',
  LANDING_BECOME_PRO_CLICK = 'landing_become_pro_click',
}

// Event parameters interface
export interface AnalyticsEventParams {
  // Common params
  category?: string;
  subcategory?: string;
  label?: string;
  value?: number;

  // Job params
  jobId?: string;
  jobTitle?: string;
  jobCategory?: string;
  jobBudget?: number;
  jobStatus?: string;

  // User params
  userId?: string;
  userRole?: UserRole;

  // Proposal params
  proposalId?: string;
  proposalAmount?: number;

  // Profile params
  proId?: string;
  proName?: string;

  // Search params
  searchQuery?: string;
  searchResultCount?: number;

  // Error params
  errorMessage?: string;
  errorCode?: string;

  // Premium params
  planType?: string;
  planPrice?: number;

  // Whether this event should also persist to homico Mongo via /analytics/track.
  // Defaults to `true` for events in PERSIST_BY_DEFAULT below, `false` otherwise.
  // Pass explicitly to override (e.g. persist:false for chatty events).
  persist?: boolean;

  // Custom params
  [key: string]: string | number | boolean | undefined;
}

// dataLayer type declared in src/types/google.d.ts

// Events that ALSO persist to homico Mongo (admin dashboard at /admin/analytics
// reads from this). Marketing-funnel events (page_view, landing_view) skip Mongo
// since GA4 + Amplitude already cover them and they're too chatty for a per-row
// count table.
const PERSIST_BY_DEFAULT = new Set<string>([
  AnalyticsEvent.PROFILE_VIEW,
  AnalyticsEvent.CONTACT_REVEAL,
  AnalyticsEvent.PHONE_CLICK,
  AnalyticsEvent.WHATSAPP_CLICK,
  AnalyticsEvent.EMAIL_CLICK,
  AnalyticsEvent.JOB_VIEW,
  AnalyticsEvent.JOB_POST,
  AnalyticsEvent.JOB_SEARCH,
  AnalyticsEvent.CATEGORY_SELECT,
  AnalyticsEvent.SUBCATEGORY_SELECT,
  AnalyticsEvent.REGISTER_PRO,
  AnalyticsEvent.REGISTER_CLIENT,
  AnalyticsEvent.PROPOSAL_SUBMIT,
  AnalyticsEvent.PROPOSAL_ACCEPT,
  AnalyticsEvent.REVIEW_SUBMIT,
  AnalyticsEvent.PREMIUM_VIEW,
  AnalyticsEvent.PREMIUM_PURCHASE,
  AnalyticsEvent.PREMIUM_SUCCESS,
]);

// Shared dual-sink: GA4 + Amplitude (always) + Mongo (for events in PERSIST_BY_DEFAULT
// or when params.persist === true). Picks a target/label from common params so the
// existing callsites don't need to be edited - their proId / jobId / proName already
// carry the right identifier.
function dispatchEvent(event: AnalyticsEvent, params?: AnalyticsEventParams) {
  if (typeof window === 'undefined') return;

  // 1. Google Tag Manager / GA4 - the existing pipeline. Used by marketing
  //    dashboards and Google Ads conversion tracking, so we keep it.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
    timestamp: new Date().toISOString(),
  });

  // 2. Amplitude - product analytics, deep cohorts/retention. No-ops if the
  //    NEXT_PUBLIC_AMPLITUDE_API_KEY env var isn't set.
  trackAmplitudeEvent(event, params);

  // 3. Homico Mongo - powers the admin analytics page directly from our DB,
  //    surviving ad-blockers and giving the founder traction visibility
  //    without a third-party login. Batched in useTracker (30s flush + on
  //    visibility-change beacon).
  const shouldPersist = params?.persist ?? PERSIST_BY_DEFAULT.has(event);
  if (shouldPersist) {
    const target =
      (params?.proId as string | undefined) ??
      (params?.jobId as string | undefined) ??
      (params?.userId as string | undefined) ??
      (params?.proposalId as string | undefined) ??
      (params?.label as string | undefined) ??
      event;
    const label =
      (params?.proName as string | undefined) ??
      (params?.jobTitle as string | undefined) ??
      (params?.label as string | undefined) ??
      '';
    trackMongo(event, String(target), label);
  }

  // Debug log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, params);
  }
}

/**
 * Hook for firing analytics events to Google Tag Manager
 *
 * Usage:
 * ```tsx
 * const { trackEvent } = useAnalytics();
 *
 * // Simple event
 * trackEvent(AnalyticsEvent.LOGIN);
 *
 * // Event with params
 * trackEvent(AnalyticsEvent.JOB_POST, {
 *   jobCategory: 'renovation',
 *   jobBudget: 5000
 * });
 * ```
 */
export function useAnalytics() {
  const trackEvent = useCallback((
    event: AnalyticsEvent,
    params?: AnalyticsEventParams
  ) => {
    dispatchEvent(event, params);
  }, []);

  // Convenience methods for common events
  const trackPageView = useCallback((pageName: string, params?: AnalyticsEventParams) => {
    trackEvent(AnalyticsEvent.PAGE_VIEW, { label: pageName, ...params });
  }, [trackEvent]);

  const trackLogin = useCallback((userRole: UserRole) => {
    trackEvent(AnalyticsEvent.LOGIN, { userRole });
  }, [trackEvent]);

  const trackRegister = useCallback((userRole: UserRole) => {
    trackEvent(userRole === 'pro' ? AnalyticsEvent.REGISTER_PRO : AnalyticsEvent.REGISTER_CLIENT, { userRole });
  }, [trackEvent]);

  const trackJobView = useCallback((jobId: string, jobTitle?: string, jobCategory?: string) => {
    trackEvent(AnalyticsEvent.JOB_VIEW, { jobId, jobTitle, jobCategory });
  }, [trackEvent]);

  const trackJobPost = useCallback((jobId: string, jobCategory: string, jobBudget?: number) => {
    trackEvent(AnalyticsEvent.JOB_POST, { jobId, jobCategory, jobBudget });
  }, [trackEvent]);

  const trackProposalSubmit = useCallback((jobId: string, proposalAmount: number) => {
    trackEvent(AnalyticsEvent.PROPOSAL_SUBMIT, { jobId, proposalAmount });
  }, [trackEvent]);

  const trackProfileView = useCallback((proId: string, proName?: string) => {
    trackEvent(AnalyticsEvent.PROFILE_VIEW, { proId, proName });
  }, [trackEvent]);

  const trackSearch = useCallback((searchQuery: string, searchResultCount?: number) => {
    trackEvent(AnalyticsEvent.SEARCH, { searchQuery, searchResultCount });
  }, [trackEvent]);

  const trackError = useCallback((errorMessage: string, errorCode?: string) => {
    trackEvent(AnalyticsEvent.ERROR, { errorMessage, errorCode });
  }, [trackEvent]);

  const trackPremiumPurchase = useCallback((planType: string, planPrice: number) => {
    trackEvent(AnalyticsEvent.PREMIUM_PURCHASE, { planType, planPrice });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackLogin,
    trackRegister,
    trackJobView,
    trackJobPost,
    trackProposalSubmit,
    trackProfileView,
    trackSearch,
    trackError,
    trackPremiumPurchase,
  };
}

// Standalone function for use outside of React components. Same dual-sink as
// the hook - GA4, Amplitude, and Mongo (for events in PERSIST_BY_DEFAULT).
export function trackAnalyticsEvent(
  event: AnalyticsEvent,
  params?: AnalyticsEventParams
) {
  dispatchEvent(event, params);
}

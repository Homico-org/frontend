/**
 * Utility functions for status colors, labels, and icons
 */

import { ADMIN_THEME } from '@/constants/theme';
import type { Locale } from '@/utils/dateUtils';

// Job status types
export type JobStatus = 'open' | 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'closed';

// User role types
export type UserRole = 'client' | 'pro' | 'admin';

// Proposal status types
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// Support ticket status types
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Report status types
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

/**
 * Get status color for admin dashboard (returns hex color)
 */
export function getAdminStatusColor(status: string): string {
  switch (status) {
    case 'open':
    case 'active':
      return ADMIN_THEME.success;
    case 'pending':
    case 'in_progress':
    case 'under_review':
      return ADMIN_THEME.warning;
    case 'completed':
    case 'resolved':
      return ADMIN_THEME.info;
    case 'cancelled':
    case 'rejected':
    case 'dismissed':
      return ADMIN_THEME.error;
    case 'closed':
      return ADMIN_THEME.textDim;
    default:
      return ADMIN_THEME.textDim;
  }
}

/**
 * Get status label with localization
 */
export function getJobStatusLabel(status: string, locale: Locale = 'en'): string {
  const labels: Record<string, { en: string; ka: string; ru: string }> = {
    open: { en: 'Open', ka: 'ღია', ru: 'Открыто' },
    pending: { en: 'Pending', ka: 'მოლოდინში', ru: 'Ожидает' },
    assigned: { en: 'Assigned', ka: 'დანიშნული', ru: 'Назначено' },
    in_progress: { en: 'In Progress', ka: 'მიმდინარე', ru: 'В процессе' },
    review: { en: 'Review', ka: 'შემოწმება', ru: 'Проверка' },
    completed: { en: 'Completed', ka: 'დასრულებული', ru: 'Завершено' },
    cancelled: { en: 'Cancelled', ka: 'გაუქმებული', ru: 'Отменено' },
    closed: { en: 'Closed', ka: 'დახურული', ru: 'Закрыто' },
  };
  return labels[status]?.[locale] || status;
}

/**
 * Get proposal status label with localization
 */
export function getProposalStatusLabel(status: string, locale: Locale = 'en'): string {
  const labels: Record<string, { en: string; ka: string; ru: string }> = {
    pending: { en: 'Pending', ka: 'მოლოდინში', ru: 'Ожидает' },
    accepted: { en: 'Accepted', ka: 'მიღებული', ru: 'Принято' },
    rejected: { en: 'Rejected', ka: 'უარყოფილი', ru: 'Отклонено' },
    withdrawn: { en: 'Withdrawn', ka: 'გატანილი', ru: 'Отозвано' },
  };
  return labels[status]?.[locale] || status;
}

/**
 * Get ticket status label with localization
 */
export function getTicketStatusLabel(status: string, locale: Locale = 'en'): string {
  const labels: Record<string, { en: string; ka: string; ru: string }> = {
    open: { en: 'Open', ka: 'ღია', ru: 'Открыто' },
    in_progress: { en: 'In Progress', ka: 'მიმდინარე', ru: 'В работе' },
    resolved: { en: 'Resolved', ka: 'მოგვარებული', ru: 'Решено' },
    closed: { en: 'Closed', ka: 'დახურული', ru: 'Закрыто' },
  };
  return labels[status]?.[locale] || status;
}

/**
 * Get Tailwind CSS classes for job status badges
 */
export function getJobStatusClasses(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800';
    case 'assigned':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800';
    case 'in_progress':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800';
    case 'review':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-800';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800';
    case 'closed':
      return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-700';
    default:
      return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-700';
  }
}

/**
 * Get Tailwind CSS classes for proposal status badges
 */
export function getProposalStatusClasses(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400';
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400';
    case 'withdrawn':
      return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400';
    default:
      return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400';
  }
}

/**
 * Get Tailwind CSS classes for ticket status badges
 */
export function getTicketStatusClasses(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
    case 'resolved':
      return 'bg-[#E07B4F]/5 text-[#E07B4F] dark:bg-[#E07B4F]/10 dark:text-[#E8956A]';
    case 'closed':
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

// ============================================================================
// Admin-specific color utilities (using ADMIN_THEME)
// ============================================================================

/**
 * Get admin role color (returns hex)
 */
export function getAdminRoleColor(role: string): string {
  switch (role) {
    case 'admin':
      return ADMIN_THEME.error;
    case 'pro':
      return ADMIN_THEME.info;
    case 'client':
    default:
      return ADMIN_THEME.primary;
  }
}

/**
 * Get admin role label with localization
 */
export function getAdminRoleLabel(role: string, locale: Locale = 'en'): string {
  const labels: Record<string, { en: string; ka: string; ru: string }> = {
    admin: { en: 'Admin', ka: 'ადმინი', ru: 'Админ' },
    pro: { en: 'Pro', ka: 'პროფესიონალი', ru: 'Специалист' },

    client: { en: 'Client', ka: 'კლიენტი', ru: 'Клиент' },
  };
  return labels[role]?.[locale] || role;
}

/**
 * Get admin activity color (returns hex)
 */
export function getAdminActivityColor(type: string): string {
  switch (type) {
    case 'user_signup':
    case 'user_created':
      return ADMIN_THEME.primary;
    case 'job_created':
    case 'job_updated':
      return ADMIN_THEME.info;
    case 'proposal_sent':
    case 'proposal_created':
      return ADMIN_THEME.warning;
    case 'ticket_created':
    case 'report_created':
      return ADMIN_THEME.error;
    case 'user_verified':
    case 'job_completed':
    case 'proposal_accepted':
      return ADMIN_THEME.success;
    default:
      return ADMIN_THEME.textMuted;
  }
}

/**
 * Get admin ticket status color object (with bg and color)
 */
export function getAdminTicketStatusColor(status: string): { bg: string; color: string } {
  switch (status) {
    case 'open':
      return { bg: `${ADMIN_THEME.warning}20`, color: ADMIN_THEME.warning };
    case 'in_progress':
      return { bg: `${ADMIN_THEME.info}20`, color: ADMIN_THEME.info };
    case 'resolved':
      return { bg: `${ADMIN_THEME.success}20`, color: ADMIN_THEME.success };
    case 'closed':
    default:
      return { bg: `${ADMIN_THEME.textDim}20`, color: ADMIN_THEME.textDim };
  }
}

/**
 * Get admin job status color (returns hex)
 */
export function getAdminJobStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return ADMIN_THEME.success;
    case 'in_progress':
      return ADMIN_THEME.warning;
    case 'completed':
      return ADMIN_THEME.info;
    case 'cancelled':
      return ADMIN_THEME.error;
    default:
      return ADMIN_THEME.textDim;
  }
}

/**
 * Get admin report status color (returns hex)
 */
export function getAdminReportStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return ADMIN_THEME.warning;
    case 'investigating':
      return ADMIN_THEME.info;
    case 'resolved':
      return ADMIN_THEME.success;
    case 'dismissed':
    default:
      return ADMIN_THEME.textDim;
  }
}

/**
 * Get admin report status label with localization
 */
export function getAdminReportStatusLabel(status: string, locale: Locale = 'en'): string {
  const labels: Record<string, { en: string; ka: string; ru: string }> = {
    pending: { en: 'Pending', ka: 'მოლოდინში', ru: 'Ожидает' },
    investigating: { en: 'Investigating', ka: 'გამოძიება', ru: 'Расследование' },
    resolved: { en: 'Resolved', ka: 'გადაჭრილი', ru: 'Решено' },
    dismissed: { en: 'Dismissed', ka: 'უარყოფილი', ru: 'Отклонено' },
  };
  return labels[status]?.[locale] || status;
}

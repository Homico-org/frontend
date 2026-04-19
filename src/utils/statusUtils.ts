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
      return 'bg-[var(--hm-success-50)] text-[var(--hm-success-500)] border-emerald-200';
    case 'pending':
      return 'bg-[var(--hm-warning-50)] text-[var(--hm-warning-500)] border-amber-200';
    case 'assigned':
      return 'bg-[var(--hm-info-50)] text-blue-700 border-blue-200';
    case 'in_progress':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'review':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'completed':
      return 'bg-[var(--hm-success-50)] text-[var(--hm-success-500)] border-emerald-200';
    case 'cancelled':
      return 'bg-[var(--hm-error-50)] text-[var(--hm-error-500)] border-red-200';
    case 'closed':
      return 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border-[var(--hm-border)]';
    default:
      return 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border-[var(--hm-border)]';
  }
}

/**
 * Get Tailwind CSS classes for proposal status badges
 */
export function getProposalStatusClasses(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-[var(--hm-warning-50)] text-[var(--hm-warning-500)] border-amber-200';
    case 'accepted':
      return 'bg-[var(--hm-success-50)] text-[var(--hm-success-500)] border-emerald-200';
    case 'rejected':
      return 'bg-[var(--hm-error-50)] text-[var(--hm-error-500)] border-red-200';
    case 'withdrawn':
      return 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border-[var(--hm-border)]';
    default:
      return 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] border-[var(--hm-border)]';
  }
}

/**
 * Get Tailwind CSS classes for ticket status badges
 */
export function getTicketStatusClasses(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-[var(--hm-warning-50)] text-[var(--hm-warning-500)]';
    case 'in_progress':
      return 'bg-[var(--hm-info-50)] text-blue-700';
    case 'resolved':
      return 'bg-[var(--hm-brand-500)]/5 text-[var(--hm-brand-500)]';
    case 'closed':
      return 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]';
    default:
      return 'bg-[var(--hm-bg-tertiary)] text-neutral-600';
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

/**
 * Utility functions for date formatting and manipulation
 */

export type Locale = 'en' | 'ka';

/**
 * Format a date as relative time (e.g., "3 days ago", "2 weeks ago")
 */
export function formatTimeAgo(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (locale === 'ka') {
    if (diffDays < 1) return 'დღეს';
    if (diffDays === 1) return 'გუშინ';
    if (diffDays < 7) return `${diffDays} დღის წინ`;
    if (diffWeeks < 4) return `${diffWeeks} კვირის წინ`;
    return `${diffMonths} თვის წინ`;
  }

  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

/**
 * Format a date for display (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);

  if (locale === 'ka') {
    const months = [
      'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
      'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as compact relative time for notifications (e.g., "5m", "2h", "3d")
 */
export function formatTimeAgoCompact(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return locale === 'ka' ? 'ახლახანს' : 'Just now';
  }
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return locale === 'ka' ? `${mins} წთ წინ` : `${mins}m`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return locale === 'ka' ? `${hours} სთ წინ` : `${hours}h`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return locale === 'ka' ? `${days} დღე` : `${days}d`;
}

/**
 * Format a date using toLocaleDateString (e.g., "Jan 15, 2024" or "15 იან. 2024")
 * This uses the native locale formatting for consistency
 */
export function formatDateShort(dateString: string, locale: Locale = 'en'): string {
  return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with time using toLocaleDateString (e.g., "Jan 15, 2024, 3:30 PM")
 */
export function formatDateTimeShort(dateString: string, locale: Locale = 'en'): string {
  return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date as relative if recent, otherwise as full date (Today/Yesterday/date)
 */
export function formatDateRelative(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return locale === 'ka' ? 'დღეს' : 'Today';
  if (days === 1) return locale === 'ka' ? 'გუშინ' : 'Yesterday';
  return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US');
}

/**
 * Format a date with time (e.g., "Jan 15, 2024 at 3:30 PM")
 */
export function formatDateTime(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);

  if (locale === 'ka') {
    const months = [
      'იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ',
      'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'
    ];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()} ${hours}:${minutes}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a date in UK style (e.g., "15 Jan 2024")
 */
export function formatDateUK(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format a date as month and day only (e.g., "Jan 15" or "15 იან")
 */
export function formatDateMonthDay(dateString: string, locale: Locale = 'en'): string {
  return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date with weekday for chat separators (e.g., "Monday, January 15")
 */
export function formatDateLong(dateString: string, locale: Locale = 'en'): string {
  return new Date(dateString).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a time for chat messages (e.g., "3:30 PM")
 */
export function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a date separator for chat (Today/Yesterday/weekday + date)
 */
export function formatChatDateSeparator(dateString: string, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return locale === 'ka' ? 'დღეს' : 'Today';
  }
  if (isYesterday) {
    return locale === 'ka' ? 'გუშინ' : 'Yesterday';
  }

  return date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

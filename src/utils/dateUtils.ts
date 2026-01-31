/**
 * Utility functions for date formatting and manipulation
 */

export type Locale = 'en' | 'ka' | 'ru';

// Some environments may not have full ICU data for Georgian (ka-GE) and will
// fall back to English month names. We detect that and provide a deterministic
// Georgian month mapping as a fallback.
const EN_MONTH_TOKENS = [
  // Long
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  // Short
  'jan',
  'feb',
  'mar',
  'apr',
  'jun',
  'jul',
  'aug',
  'sep',
  'sept',
  'oct',
  'nov',
  'dec',
];

const KA_MONTHS_SHORT = [
  'იან',
  'თებ',
  'მარ',
  'აპრ',
  'მაი',
  'ივნ',
  'ივლ',
  'აგვ',
  'სექ',
  'ოქტ',
  'ნოე',
  'დეკ',
] as const;

function containsEnglishMonth(formatted: string): boolean {
  const s = formatted.toLowerCase();
  return EN_MONTH_TOKENS.some((m) => s.includes(m));
}

function formatKaMonthDay(date: Date): string {
  const day = date.getDate();
  const month = KA_MONTHS_SHORT[date.getMonth()] ?? '';
  return `${day} ${month}`;
}

// Translation function type (matches useLanguage().t)
export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

/**
 * Format a date as relative time (e.g., "3 days ago", "2 weeks ago")
 * @param dateString - The date to format
 * @param t - Translation function from useLanguage()
 */
export function formatTimeAgo(dateString: string, t: TranslateFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffDays < 1) return t('dates.today');
  if (diffDays === 1) return t('dates.yesterday');
  if (diffDays < 7) return t('dates.daysAgo', { count: diffDays });
  if (diffWeeks < 4) {
    return diffWeeks === 1
      ? t('dates.weekAgo', { count: diffWeeks })
      : t('dates.weeksAgo', { count: diffWeeks });
  }
  return diffMonths === 1
    ? t('dates.monthAgo', { count: diffMonths })
    : t('dates.monthsAgo', { count: diffMonths });
}

/**
 * Format a date for display (e.g., "Jan 15, 2024")
 * Uses native Intl for proper locale formatting
 */
export function formatDate(dateString: string, locale: Locale = 'en'): string {
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return new Date(dateString).toLocaleDateString(localeMap[locale], {
    month: 'long',
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

  const localeMap: Record<Locale, string> = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], {
    numeric: 'auto',
    style: 'narrow',
  });

  if (diffInSeconds < 60) {
    // Prefer the runtime's localized "now" string.
    return rtf.format(0, 'second');
  }
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return rtf.format(-mins, 'minute');
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return rtf.format(-hours, 'hour');
  }
  const days = Math.floor(diffInSeconds / 86400);
  return rtf.format(-days, 'day');
}

/**
 * Format a date using toLocaleDateString (e.g., "Jan 15, 2024" or "15 იან. 2024")
 * This uses the native locale formatting for consistency
 */
export function formatDateShort(dateString: string, locale: Locale = 'en'): string {
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return new Date(dateString).toLocaleDateString(localeMap[locale], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with time using toLocaleDateString (e.g., "Jan 15, 2024, 3:30 PM")
 */
export function formatDateTimeShort(dateString: string, locale: Locale = 'en'): string {
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return new Date(dateString).toLocaleDateString(localeMap[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date as relative if recent, otherwise as full date (Today/Yesterday/date)
 * @param dateString - The date to format
 * @param t - Translation function from useLanguage()
 * @param locale - Locale for date formatting
 */
export function formatDateRelative(dateString: string, t: TranslateFunction, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t('dates.today');
  if (days === 1) return t('dates.yesterday');
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return date.toLocaleDateString(localeMap[locale]);
}

/**
 * Format a date with time (e.g., "Jan 15, 2024 at 3:30 PM")
 * Uses native Intl for proper locale formatting
 */
export function formatDateTime(dateString: string, locale: Locale = 'en'): string {
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return new Date(dateString).toLocaleDateString(localeMap[locale], {
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
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString(localeMap[locale], {
    month: 'short',
    day: 'numeric',
  });

  if (locale === 'ka' && containsEnglishMonth(formatted)) {
    return formatKaMonthDay(date);
  }

  return formatted;
}

/**
 * Format a date with weekday for chat separators (e.g., "Monday, January 15")
 */
export function formatDateLong(dateString: string, locale: Locale = 'en'): string {
  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return new Date(dateString).toLocaleDateString(localeMap[locale], {
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
 * @param dateString - The date to format
 * @param t - Translation function from useLanguage()
 * @param locale - Locale for date formatting
 */
export function formatChatDateSeparator(dateString: string, t: TranslateFunction, locale: Locale = 'en'): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return t('dates.today');
  }
  if (isYesterday) {
    return t('dates.yesterday');
  }

  const localeMap = { en: 'en-US', ka: 'ka-GE', ru: 'ru-RU' };
  return date.toLocaleDateString(localeMap[locale], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

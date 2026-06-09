/**
 * Validation utilities for forms and inputs
 */

export type Locale = 'en' | 'ka' | 'ru';

// ============================================================================
// Password Validation
// ============================================================================

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface PasswordStrength {
  /** Strength score (0-5) */
  strength: PasswordStrengthLevel;
  /** Human-readable label */
  label: string;
  /** Color for UI display */
  color: string;
  /** Tailwind color class */
  colorClass: string;
  /** Whether password meets minimum requirements */
  isValid: boolean;
}

/**
 * Calculate password strength and return detailed info
 *
 * @example
 * ```tsx
 * const strength = getPasswordStrength('MyP@ssw0rd', 'en');
 * // { strength: 5, label: 'Strong', color: '#22C55E', colorClass: 'text-[var(--hm-success-500)]', isValid: true }
 * ```
 */
export function getPasswordStrength(
  password: string,
  locale: Locale = 'en',
  minLength: number = 6
): PasswordStrength {
  if (!password) {
    return {
      strength: 0,
      label: '',
      color: '#9CA3AF',
      colorClass: 'text-neutral-400',
      isValid: false,
    };
  }

  let strength: PasswordStrengthLevel = 0;

  // Length checks
  if (password.length >= minLength) strength++;
  if (password.length >= 8) strength++;

  // Character variety checks
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = {
    en: ['', 'Weak', 'Weak', 'Medium', 'Good', 'Strong'],
    ka: ['', 'სუსტი', 'სუსტი', 'საშუალო', 'კარგი', 'ძლიერი'],
    ru: ['', 'Слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'],
  };

  const colors = [
    { color: '#9CA3AF', colorClass: 'text-neutral-400' }, // 0: empty
    { color: '#EF4444', colorClass: 'text-[var(--hm-error-500)]' },     // 1: weak
    { color: '#F59E0B', colorClass: 'text-[var(--hm-warning-500)]' },   // 2: weak
    { color: '#F59E0B', colorClass: 'text-[var(--hm-warning-500)]' },   // 3: medium
    { color: '#22C55E', colorClass: 'text-[var(--hm-success-500)]' },   // 4: good
    { color: '#22C55E', colorClass: 'text-[var(--hm-success-500)]' },   // 5: strong
  ];

  return {
    strength: strength as PasswordStrengthLevel,
    label: labels[locale][strength] || '',
    color: colors[strength].color,
    colorClass: colors[strength].colorClass,
    isValid: password.length >= minLength,
  };
}

/**
 * Validate password requirements
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(
  password: string,
  locale: Locale = 'en',
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
  } = {}
): PasswordValidation {
  const {
    minLength = 6,
    requireUppercase = false,
    requireNumber = false,
    requireSpecial = false,
  } = options;

  const errors: string[] = [];

  const msgs = {
    minLength: {
      en: `Password must be at least ${minLength} characters`,
      ka: `პაროლი უნდა იყოს მინიმუმ ${minLength} სიმბოლო`,
      ru: `Пароль должен содержать минимум ${minLength} символов`,
    },
    uppercase: {
      en: 'Password must contain an uppercase letter',
      ka: 'პაროლი უნდა შეიცავდეს დიდ ასოს',
      ru: 'Пароль должен содержать заглавную букву',
    },
    number: {
      en: 'Password must contain a number',
      ka: 'პაროლი უნდა შეიცავდეს ციფრს',
      ru: 'Пароль должен содержать цифру',
    },
    special: {
      en: 'Password must contain a special character',
      ka: 'პაროლი უნდა შეიცავდეს სპეციალურ სიმბოლოს',
      ru: 'Пароль должен содержать специальный символ',
    },
  };

  if (password.length < minLength) {
    errors.push(msgs.minLength[locale]);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(msgs.uppercase[locale]);
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push(msgs.number[locale]);
  }

  if (requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push(msgs.special[locale]);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if passwords match
 */
export function passwordsMatch(
  password: string,
  confirmPassword: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (password !== confirmPassword) {
    const msgs = {
      en: 'Passwords do not match',
      ka: 'პაროლები არ ემთხვევა',
      ru: 'Пароли не совпадают',
    };
    return {
      isValid: false,
      error: msgs[locale],
    };
  }
  return { isValid: true };
}

// ============================================================================
// Email Validation
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 */
export function validateEmail(
  email: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  const msgs = {
    required: { en: 'Email is required', ka: 'ელ-ფოსტა აუცილებელია', ru: 'Email обязателен' },
    invalid: { en: 'Invalid email format', ka: 'არასწორი ელ-ფოსტის ფორმატი', ru: 'Неверный формат email' },
  };

  if (!email.trim()) {
    return { isValid: false, error: msgs.required[locale] };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: msgs.invalid[locale] };
  }

  return { isValid: true };
}

// ============================================================================
// Phone Validation
// ============================================================================

// Note: the legacy `validateGeorgianPhone` helper used to live here.
// It was never called from the registration flow (which delegates phone
// validation to the backend SMS provider) and would have blocked
// international numbers on /il /us /fr etc. Removed 2026-05 in the
// multi-country migration. If a future surface needs client-side phone
// validation, write it country-aware against `data/countries.ts` rather
// than reviving the GE-only regex.

/**
 * Format a phone number for display in a readable, country-appropriate
 * way. Detects the calling code (GE/IL/FR/US/DE/UK) from the leading
 * digits and applies that country's local grouping. Falls back to the
 * original input when no rule matches so we never silently mangle a
 * number we don't recognise.
 *
 * Examples:
 * - "+995555555555"  -> "555 55 55 55"           (GE local form)
 * - "+15551234567"   -> "+1 555 123 4567"        (US)
 * - "+447911123456"  -> "+44 7911 123456"        (UK)
 * - "+33612345678"   -> "+33 6 12 34 56 78"      (FR mobile)
 * - "+49301234567"   -> "+49 30 1234567"         (DE)
 * - "+972501234567"  -> "+972 50 123 4567"       (IL)
 *
 * The legacy name `formatGeorgianPhoneDisplay` is preserved as an alias
 * for the ~3 existing call sites; new code should call
 * `formatPhoneDisplay` instead.
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');

  // GE: 9-digit local (5xxxxxxxx) or international (+995 prefix). The
  // historic local form drops the prefix entirely because Tbilisi UI
  // has always shown phones as "555 12 34 56" without a country code.
  if (/^5\d{8}$/.test(digits)) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  if (digits.startsWith('995') && digits.length === 12) {
    const d = digits.slice(3);
    if (/^5\d{8}$/.test(d)) {
      return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    }
  }
  // Legacy local form "0555555555" - drop the leading zero, render GE.
  if (digits.startsWith('0') && digits.length === 10) {
    const d = digits.slice(1);
    if (/^5\d{8}$/.test(d)) {
      return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
    }
  }

  // US/CA (+1): 11 digits with a 1 prefix -> "+1 NXX NXX NNNN".
  if (digits.startsWith('1') && digits.length === 11) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }
  // UK (+44): 12 digits, typically mobile "07xxx xxx xxx" or
  // "+44 7xxx xxxxxx". Group as "+44 NNNN NNNNNN".
  if (digits.startsWith('44') && digits.length === 12) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6, 12)}`;
  }
  // FR (+33): 11 digits, render as "+33 N NN NN NN NN".
  if (digits.startsWith('33') && digits.length === 11) {
    return `+33 ${digits.slice(2, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  // DE (+49): variable length (10-13). Best-effort: "+49 area rest".
  if (digits.startsWith('49') && digits.length >= 11 && digits.length <= 13) {
    return `+49 ${digits.slice(2, 4)} ${digits.slice(4)}`;
  }
  // IL (+972): 12 digits, render as "+972 NN NNN NNNN".
  if (digits.startsWith('972') && digits.length === 12) {
    return `+972 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
  }

  // Unknown country code or odd length - return the input unchanged
  // rather than printing a mangled best-effort.
  return phone;
}

/**
 * Legacy alias preserved for backward compatibility. Existing call
 * sites can switch to `formatPhoneDisplay` at their convenience.
 */
export const formatGeorgianPhoneDisplay = formatPhoneDisplay;

// ============================================================================
// Text Validation
// ============================================================================

/**
 * Validate required field
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (!value?.trim()) {
    const msgs = {
      en: `${fieldName} is required`,
      ka: `${fieldName} აუცილებელია`,
      ru: `${fieldName} обязательно`,
    };
    return { isValid: false, error: msgs[locale] };
  }
  return { isValid: true };
}

/**
 * Validate minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (value.length < minLength) {
    const msgs = {
      en: `${fieldName} must be at least ${minLength} characters`,
      ka: `${fieldName} უნდა იყოს მინიმუმ ${minLength} სიმბოლო`,
      ru: `${fieldName} должно быть минимум ${minLength} символов`,
    };
    return { isValid: false, error: msgs[locale] };
  }
  return { isValid: true };
}

/**
 * Validate maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (value.length > maxLength) {
    const msgs = {
      en: `${fieldName} must not exceed ${maxLength} characters`,
      ka: `${fieldName} არ უნდა აღემატებოდეს ${maxLength} სიმბოლოს`,
      ru: `${fieldName} не должно превышать ${maxLength} символов`,
    };
    return { isValid: false, error: msgs[locale] };
  }
  return { isValid: true };
}

// ============================================================================
// Number Validation
// ============================================================================

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (value < min || value > max) {
    const msgs = {
      en: `${fieldName} must be between ${min} and ${max}`,
      ka: `${fieldName} უნდა იყოს ${min}-${max} შორის`,
      ru: `${fieldName} должно быть между ${min} и ${max}`,
    };
    return { isValid: false, error: msgs[locale] };
  }
  return { isValid: true };
}

/**
 * Validate positive number
 */
export function validatePositive(
  value: number,
  fieldName: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  if (value <= 0) {
    const msgs = {
      en: `${fieldName} must be a positive number`,
      ka: `${fieldName} უნდა იყოს დადებითი რიცხვი`,
      ru: `${fieldName} должно быть положительным числом`,
    };
    return { isValid: false, error: msgs[locale] };
  }
  return { isValid: true };
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitize price input - remove non-numeric characters except decimal point
 */
export function sanitizePriceInput(value: string): string {
  return value.replace(/[^\d.]/g, '');
}

/**
 * Trim and clean text input
 */
export function sanitizeTextInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

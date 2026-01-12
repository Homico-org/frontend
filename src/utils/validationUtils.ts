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
 * // { strength: 5, label: 'Strong', color: '#22C55E', colorClass: 'text-green-500', isValid: true }
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
    { color: '#EF4444', colorClass: 'text-red-500' },     // 1: weak
    { color: '#F59E0B', colorClass: 'text-amber-500' },   // 2: weak
    { color: '#F59E0B', colorClass: 'text-amber-500' },   // 3: medium
    { color: '#22C55E', colorClass: 'text-green-500' },   // 4: good
    { color: '#22C55E', colorClass: 'text-green-500' },   // 5: strong
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

/**
 * Validate Georgian phone number
 */
export function validateGeorgianPhone(
  phone: string,
  locale: Locale = 'en'
): { isValid: boolean; error?: string } {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Georgian mobile numbers: 5XX XXX XXX (9 digits starting with 5)
  const isValid = /^5\d{8}$/.test(cleaned);

  if (!isValid) {
    const msgs = {
      en: 'Please enter a valid phone number',
      ka: 'შეიყვანეთ სწორი ტელეფონის ნომერი',
      ru: 'Введите корректный номер телефона',
    };
    return { isValid: false, error: msgs[locale] };
  }

  return { isValid: true };
}

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

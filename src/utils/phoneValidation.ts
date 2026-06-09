import type { CountryCode } from '@/contexts/LanguageContext';

/**
 * Expected digit count of a national phone number (without the country
 * prefix). PhoneInput strips non-digits before the value gets here, so
 * we only deal with bare digits.
 *
 * Source of truth for callsite validation - the Send button on the
 * registration phone step, the settings phone-change modal, and the
 * pro review invitation form all read these numbers so the guard rail
 * is identical everywhere.
 */
const PHONE_LENGTH: Record<CountryCode, { min: number; max: number }> = {
  GE: { min: 9, max: 9 },
  IL: { min: 9, max: 9 },
  FR: { min: 9, max: 10 },
  US: { min: 10, max: 10 },
  DE: { min: 10, max: 11 },
  UK: { min: 10, max: 10 },
};

export function getPhoneLength(country: CountryCode): { min: number; max: number } {
  return PHONE_LENGTH[country] ?? { min: 7, max: 15 };
}

export function isValidPhone(digits: string, country: CountryCode): boolean {
  const cleaned = (digits || '').replace(/\D/g, '');
  const { min, max } = getPhoneLength(country);
  return cleaned.length >= min && cleaned.length <= max;
}

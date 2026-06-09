import {
  BadgeCheck,
  Handshake,
  ListChecks,
  SlidersHorizontal,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

type Localized = { en: string; ka: string; ru: string };

export interface ReleaseNoteItem {
  icon: LucideIcon;
  title: Localized;
  description: Localized;
}

export interface ReleaseNotesContent {
  /**
   * Bump this string for every release you want to announce. The one-time
   * modal keys "already seen" off this exact value, so changing it re-shows
   * the modal to everyone (and only once per new version).
   */
  version: string;
  title: Localized;
  items: ReleaseNoteItem[];
}

/**
 * The current release notes. To announce a new release:
 *   1. bump `version` (e.g. "2026.06.1" -> "2026.07")
 *   2. replace `title` + `items` with what's new (keep each line short)
 * That's it - the modal handles "show once, never again" automatically.
 */
export const RELEASE_NOTES: ReleaseNotesContent = {
  version: '2026.06.1',
  title: { en: "What's new", ka: 'სიახლეები', ru: 'Что нового' },
  items: [
    {
      icon: Handshake,
      title: {
        en: 'Homico Partners',
        ka: 'Homico პარტნიორები',
        ru: 'Партнёры Homico',
      },
      description: {
        en: 'Book contract-vetted pros directly.',
        ka: 'დაჯავშნეთ კონტრაქტით გადამოწმებული ოსტატები პირდაპირ.',
        ru: 'Бронируйте проверенных по контракту мастеров напрямую.',
      },
    },
    {
      icon: ListChecks,
      title: {
        en: 'A clearer project view',
        ka: 'პროექტის მკაფიო ხედი',
        ru: 'Понятный вид проекта',
      },
      description: {
        en: 'Progress, decisions, and payments in one view.',
        ka: 'პროგრესი, გადაწყვეტილებები და გადახდები ერთ ხედში.',
        ru: 'Прогресс, решения и платежи в одном виде.',
      },
    },
    {
      icon: Wallet,
      title: {
        en: 'Pay milestones in the app',
        ka: 'გადაიხადეთ ეტაპები აპლიკაციაში',
        ru: 'Оплата этапов в приложении',
      },
      description: {
        en: 'Approve and fund each work step securely.',
        ka: 'დაამტკიცეთ და გადაიხადეთ თითო ეტაპი უსაფრთხოდ.',
        ru: 'Утверждайте и оплачивайте каждый этап безопасно.',
      },
    },
    {
      icon: SlidersHorizontal,
      title: {
        en: 'Find bookable pros fast',
        ka: 'იპოვეთ დასაჯავშნი ოსტატები სწრაფად',
        ru: 'Быстро находите мастеров для брони',
      },
      description: {
        en: 'A new "Homico Partners" filter - they rank first.',
        ka: 'ახალი "Homico პარტნიორების" ფილტრი - ისინი ზემოთ.',
        ru: 'Новый фильтр «Партнёры Homico» - они в начале.',
      },
    },
    {
      icon: BadgeCheck,
      title: {
        en: 'Clearer pro badges',
        ka: 'მკაფიო ნიშნები',
        ru: 'Понятные значки',
      },
      description: {
        en: 'Verified, top-rated and partner, on every card.',
        ka: 'გადამოწმებული, საუკეთესო და პარტნიორი - ყველა ბარათზე.',
        ru: 'Проверен, топ и партнёр - на каждой карточке.',
      },
    },
  ],
};

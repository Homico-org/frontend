import { BadgeCheck, Handshake, ListChecks, type LucideIcon } from 'lucide-react';

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
 *   1. bump `version` (e.g. "2026.06" -> "2026.07")
 *   2. replace `title` + `items` with what's new
 * That's it - the modal handles "show once, never again" automatically.
 */
export const RELEASE_NOTES: ReleaseNotesContent = {
  version: '2026.06',
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
        en: 'Book vetted pros under a Homico contract directly - look for the Homico Partner badge.',
        ka: 'დაჯავშნეთ Homico-ს კონტრაქტით გადამოწმებული ოსტატები პირდაპირ - მოძებნეთ Homico პარტნიორის ნიშანი.',
        ru: 'Бронируйте проверенных мастеров по контракту с Homico напрямую - ищите значок «Партнёр Homico».',
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
        en: 'Track your renovation at a glance: progress, what needs your decision, and payments in one place.',
        ka: 'თვალი ადევნეთ რემონტს ერთი შეხედვით: პროგრესი, თქვენი გადასაწყვეტი და გადახდები ერთ ადგილას.',
        ru: 'Следите за ремонтом с первого взгляда: прогресс, что требует вашего решения, и платежи в одном месте.',
      },
    },
    {
      icon: BadgeCheck,
      title: {
        en: 'Find the best pros faster',
        ka: 'იპოვეთ საუკეთესო ოსტატები სწრაფად',
        ru: 'Быстрее находите лучших мастеров',
      },
      description: {
        en: 'Clearer badges and a "Homico Partners" filter help you spot top, bookable pros right away.',
        ka: 'მკაფიო ნიშნები და "Homico პარტნიორების" ფილტრი დაგეხმარებათ მაშინვე იპოვოთ ტოპ, დასაჯავშნი ოსტატები.',
        ru: 'Понятные значки и фильтр «Партнёры Homico» помогут сразу найти лучших мастеров для брони.',
      },
    },
  ],
};

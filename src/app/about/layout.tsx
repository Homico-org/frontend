import { Metadata } from 'next';

// /about is a country-agnostic brand page reachable from every
// marketplace. Description copy stays geography-neutral - the Georgian
// version no longer claims "Georgia's first platform" so it makes
// sense for a Tel Aviv / Berlin / NYC visitor too.
export const metadata: Metadata = {
  title: 'ჩვენს შესახებ',
  description: 'Homico - პლატფორმა, რომელიც სანდო სარემონტო პროფესიონალებთან გაკავშირებთ. შეიტყვეთ მეტი ჩვენი მისიისა და ღირებულებების შესახებ.',
  openGraph: {
    title: 'ჩვენს შესახებ | Homico',
    description: 'Homico აკავშირებს კლიენტებს ვერიფიცირებულ სახლის მომსახურების პროფესიონალებთან.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

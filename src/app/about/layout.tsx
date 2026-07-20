import { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.homico.ge';

// /about is a country-agnostic brand page reachable from every
// marketplace. Description copy stays geography-neutral - the Georgian
// version no longer claims "Georgia's first platform" so it makes
// sense for a Tel Aviv / Berlin / NYC visitor too.
export const metadata: Metadata = {
  title: 'ჩვენს შესახებ',
  description: 'Homico - პლატფორმა, რომელიც სანდო სარემონტო პროფესიონალებთან გაკავშირებთ. შეიტყვეთ მეტი ჩვენი მისიის, ღირებულებებისა და დამფუძნებლის შესახებ.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'ჩვენს შესახებ | Homico',
    description: 'Homico აკავშირებს კლიენტებს ვერიფიცირებულ სახლის მომსახურების პროფესიონალებთან.',
    url: `${SITE}/about`,
  },
};

// TODO(founder): replace FOUNDER_NAME with the real name and add profile URLs
// (LinkedIn, etc.) to `sameAs` - this powers Google's founder/company panels.
const FOUNDER_NAME = 'Homico Founder';

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'ჩვენს შესახებ | Homico',
  url: `${SITE}/about`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Homico',
    url: SITE,
    logo: `${SITE}/icon.svg`,
    email: 'contact@homico.co',
    description:
      'Homico connects clients with verified home-service professionals in Tbilisi.',
    areaServed: { '@type': 'City', name: 'Tbilisi' },
    founder: {
      '@type': 'Person',
      name: FOUNDER_NAME,
      jobTitle: 'Founder',
      image: `${SITE}/about/founder.jpg`,
      worksFor: { '@type': 'Organization', name: 'Homico' },
      // sameAs: ['https://www.linkedin.com/in/...'],
    },
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {children}
    </>
  );
}

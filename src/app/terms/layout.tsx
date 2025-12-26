import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'მომსახურების პირობები',
  description: 'Homico-ს მომსახურების პირობები და წესები. გაეცანით პლატფორმის გამოყენების პირობებს.',
  openGraph: {
    title: 'მომსახურების პირობები | Homico',
    description: 'Homico.ge პლატფორმის გამოყენების პირობები და წესები.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'კონფიდენციალურობის პოლიტიკა',
  description: 'Homico-ს კონფიდენციალურობის პოლიტიკა. შეიტყვეთ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს პერსონალურ მონაცემებს.',
  openGraph: {
    title: 'კონფიდენციალურობის პოლიტიკა | Homico',
    description: 'Homico-ს მონაცემთა დაცვისა და კონფიდენციალურობის პოლიტიკა.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

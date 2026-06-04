import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'როგორ მუშაობს',
  description: 'შეიტყვეთ როგორ მუშაობს Homico - პროფესიონალის მოძებნა ან კლიენტების მოპოვება მარტივად. ნაბიჯ-ნაბიჯ სახელმძღვანელო კლიენტებისა და პროფესიონალებისთვის.',
  openGraph: {
    title: 'როგორ მუშაობს | Homico',
    description: 'მარტივი ნაბიჯები პროფესიონალის დასაქირავებლად ან ახალი კლიენტების მოსაპოვებლად Homico-ს პლატფორმაზე.',
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}

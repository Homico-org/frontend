import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ჩვენს შესახებ',
  description: 'Homico - საქართველოს პირველი პლატფორმა სახლის მომსახურების პროფესიონალების მოსაძებნად. შეიტყვეთ მეტი ჩვენი მისიისა და ღირებულებების შესახებ.',
  openGraph: {
    title: 'ჩვენს შესახებ | Homico',
    description: 'Homico აკავშირებს კლიენტებს ვერიფიცირებულ სახლის მომსახურების პროფესიონალებთან საქართველოში.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

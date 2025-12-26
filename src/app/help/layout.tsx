import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'დახმარება',
  description: 'იპოვეთ პასუხები ხშირად დასმულ კითხვებზე ან დაგვიკავშირდით მხარდაჭერისთვის. Homico-ს დახმარების ცენტრი.',
  openGraph: {
    title: 'დახმარების ცენტრი | Homico',
    description: 'ხშირად დასმული კითხვები და მხარდაჭერა Homico-ს პლატფორმაზე.',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}

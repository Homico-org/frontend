import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ბლოგი',
  description:
    'რემონტის რჩევები, ბიუჯეტი და რეალური ისტორიები თბილისიდან. Homico-ს ბლოგი - პრაქტიკული გზამკვლევი სახლის რემონტისთვის.',
  openGraph: {
    title: 'ბლოგი | Homico',
    description:
      'რემონტის რჩევები, ბიუჯეტი და რეალური ისტორიები. პრაქტიკული გზამკვლევი სახლის რემონტისთვის თბილისში.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://homico.co';

export const metadata: Metadata = {
  title: 'ბლოგი',
  description:
    'რემონტის რჩევები, ბიუჯეტი და რეალური ისტორიები თბილისიდან. Homico-ს ბლოგი - პრაქტიკული გზამკვლევი სახლის რემონტისთვის.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'ბლოგი | Homico',
    description:
      'რემონტის რჩევები, ბიუჯეტი და რეალური ისტორიები. პრაქტიკული გზამკვლევი სახლის რემონტისთვის თბილისში.',
    url: `${BASE_URL}/blog`,
    siteName: 'Homico',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/config/blogPosts';

// Canonical host for the blog (search engines canonicalise on homico.co,
// same base the sitemap + root metadata use). The blog lives at the
// country-agnostic `/blog` path (`/xx/blog` 307s here via middleware), so
// there is a single canonical URL per article - no duplicate content.
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://homico.co';

// Pre-render every article at build time (SSG) - fastest TTFB + best crawl.
export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

// Per-article SEO metadata. Georgia is the primary market, so the title +
// description use the Georgian copy (matches the default SSR locale a crawler
// sees with no `homico-locale` cookie). The title template (`%s | Homico`)
// lives in the root layout, so we pass the bare article title here.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  const url = `${BASE_URL}/blog/${params.slug}`;

  if (!post) {
    return {
      title: 'ბლოგი | Homico',
      description:
        'რემონტის რჩევები, ბიუჯეტი და რეალური ისტორიები Homico-სგან.',
      alternates: { canonical: url },
    };
  }

  const description = post.excerpt.ka;

  // The parent `blog/layout` sets a plain-string title, which consumes the
  // root `%s | Homico` template for this subtree - so we append the brand
  // explicitly here (no template applies, hence no double suffix).
  return {
    title: `${post.title.ka} | Homico`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title.ka,
      description,
      url,
      siteName: 'Homico',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
      images: [
        { url: post.image, width: 1200, height: 630, alt: post.title.ka },
      ],
      locale: 'ka_GE',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title.ka,
      description,
      images: [post.image],
    },
    robots: { index: true, follow: true },
  };
}

// Server layout wrapping the (client) article page. Its only job beyond the
// metadata above is to inject BlogPosting structured data (JSON-LD) so the
// article can earn rich results. The interactive UI stays in the client page.
export default function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  const url = `${BASE_URL}/blog/${params.slug}`;

  const jsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title.ka,
        description: post.excerpt.ka,
        image: post.image,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Person', name: post.author.name },
        publisher: {
          '@type': 'Organization',
          name: 'Homico',
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/icons/icon-512.png`,
          },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        inLanguage: 'ka',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // JSON.stringify output is safe to inject; no user-controlled HTML.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}

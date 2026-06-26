'use client';

import BlogArticle from '@/components/blog/BlogArticle';

export default function CountryBlogPostPage({
  params,
}: {
  params: { country: string; slug: string };
}) {
  return <BlogArticle slug={params.slug} />;
}

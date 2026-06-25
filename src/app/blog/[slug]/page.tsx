'use client';

import BlogArticle from '@/components/blog/BlogArticle';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogArticle slug={params.slug} />;
}

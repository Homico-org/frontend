'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';
import { BLOG_POSTS, type BlogPost } from '@/config/blogPosts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';
import { formatDate } from '@/utils/dateUtils';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useMemo } from 'react';

interface BlogArticleProps {
  slug: string;
}

export default function BlogArticle({ slug }: BlogArticleProps) {
  const { t, locale, pick } = useLanguage();
  const cl = useCountryLink();

  const post = useMemo<BlogPost | undefined>(
    () => BLOG_POSTS.find((p) => p.slug === slug),
    [slug],
  );

  const related = useMemo(() => {
    if (!post) return [];
    const sameCat = BLOG_POSTS.filter(
      (p) => p.slug !== post.slug && p.category === post.category,
    );
    const others = BLOG_POSTS.filter(
      (p) => p.slug !== post.slug && p.category !== post.category,
    );
    return [...sameCat, ...others].slice(0, 3);
  }, [post]);

  if (!post) {
    notFound();
  }

  const paragraphs = post.body[locale] ?? post.body.en;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        {/* Back */}
        <div className="py-7">
          <Link
            href={cl('/blog')}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--hm-fg-muted)] transition-colors hover:text-[var(--hm-fg-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('blog.back')}
          </Link>
        </div>

        {/* Header block */}
        <header>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--hm-fg-muted)]">
            <span className="text-[var(--hm-brand-500)]">{t(`blog.cat.${post.category}`)}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(post.date, locale)}</span>
            <span aria-hidden>·</span>
            <span>{t('blog.minRead', { min: post.readMin })}</span>
          </div>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[40px]">
            {pick(post.title)}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--hm-fg-secondary)] sm:text-[16px]">
            {pick(post.excerpt)}
          </p>

          {/* Author */}
          <div className="mt-5 flex items-center gap-3 border-t border-[var(--hm-border-subtle)] pt-5">
            {post.author.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.avatar}
                alt={post.author.name}
                loading="lazy"
                className="h-9 w-9 rounded-full object-cover ring-1 ring-[var(--hm-border-subtle)]"
              />
            ) : null}
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-[var(--hm-fg-primary)]">
                {post.author.name}
              </div>
              <div className="text-[12px] text-[var(--hm-fg-muted)]">
                {pick(post.author.role)}
              </div>
            </div>
          </div>
        </header>

        {/* Hero image */}
        <div className="mt-7 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt=""
            loading="lazy"
            className="aspect-[40/21] w-full object-cover"
          />
        </div>

        {/* Body */}
        <article className="mt-8">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="mb-5 text-[16px] leading-[1.75] text-[var(--hm-fg-secondary)]"
            >
              {para}
            </p>
          ))}
        </article>

        {/* CTA */}
        <section className="mt-12 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-6 sm:p-8">
          <h2 className="font-display text-[22px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--hm-fg-primary)] sm:text-[26px]">
            {t('blog.ctaTitle')}
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--hm-fg-secondary)]">
            {t('blog.ctaText')}
          </p>
          <Link href={cl('/professionals')} className="mt-4 inline-block">
            <Button variant="default">{t('blog.ctaButton')}</Button>
          </Link>
        </section>

        {/* Keep reading */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-[var(--hm-border-subtle)] pt-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[var(--hm-fg-primary)]" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hm-fg-muted)]">
                {t('blog.keepReading')}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
              {related.map((rp) => (
                <Link key={rp.slug} href={cl(`/blog/${rp.slug}`)} className="group">
                  <div className="overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rp.image}
                      alt=""
                      loading="lazy"
                      className="aspect-[40/21] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <span className="mt-3 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
                    {t(`blog.cat.${rp.category}`)}
                  </span>
                  <h3 className="mt-1.5 font-display text-[15px] font-bold leading-[1.25] tracking-[-0.01em] text-[var(--hm-fg-primary)] transition-colors group-hover:text-[var(--hm-brand-500)]">
                    {pick(rp.title)}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--hm-brand-500)]">
                    {t('blog.read')}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

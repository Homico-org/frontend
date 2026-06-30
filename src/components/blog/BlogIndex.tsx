'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import {
  BLOG_CATEGORY_KEYS,
  BLOG_POSTS,
  type BlogCategory,
  type BlogPost,
} from '@/config/blogPosts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountryLink } from '@/hooks/useCountry';
import { formatDate } from '@/utils/dateUtils';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

function MetaRow({ post }: { post: BlogPost }) {
  const { t, locale, pick } = useLanguage();
  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--hm-fg-muted)]">
      {post.author.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.author.avatar}
          alt={post.author.name}
          loading="lazy"
          className="h-5 w-5 rounded-full object-cover ring-1 ring-[var(--hm-border-subtle)]"
        />
      ) : null}
      <span className="font-medium text-[var(--hm-fg-secondary)]">{post.author.name}</span>
      <span aria-hidden>·</span>
      <span>{formatDate(post.date, locale)}</span>
      <span aria-hidden>·</span>
      <span>{t('blog.minRead', { min: post.readMin })}</span>
      <span className="sr-only">{pick(post.title)}</span>
    </div>
  );
}

export default function BlogIndex() {
  const { t, pick } = useLanguage();
  const cl = useCountryLink();
  const [active, setActive] = useState<BlogCategory | 'all'>('all');

  const featured = useMemo(
    () => BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0],
    [],
  );
  const rest = useMemo(
    () =>
      BLOG_POSTS.filter((p) => p.slug !== featured?.slug).filter(
        (p) => active === 'all' || p.category === active,
      ),
    [featured, active],
  );

  const catLabel = (c: BlogCategory) => t(`blog.cat.${c}`);

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {/* Editorial hero */}
        <header className="border-b border-[var(--hm-border-subtle)] pb-10 pt-6 sm:pb-14 sm:pt-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-[var(--hm-fg-primary)]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hm-fg-muted)]">
              {t('blog.eyebrow')}
            </span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--hm-fg-primary)] sm:text-[44px]">
            {t('blog.title')}
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--hm-fg-secondary)] sm:text-[15px]">
            {t('blog.subtitle')}
          </p>
        </header>

        {/* Featured post - image-led spread */}
        {featured && (
          <Link
            href={cl(`/blog/${featured.slug}`)}
            className="group mt-8 grid items-center gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-8"
          >
            <div className="relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.image}
                alt=""
                loading="lazy"
                className="aspect-[40/21] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-[var(--hm-bg-elevated)]/90 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--hm-brand-500)] backdrop-blur-sm">
                {t('blog.featured')}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
                {catLabel(featured.category)}
              </span>
              <h2 className="mt-2 font-display text-[24px] font-bold leading-[1.12] tracking-[-0.02em] text-[var(--hm-fg-primary)] transition-colors group-hover:text-[var(--hm-brand-500)] sm:text-[30px]">
                {pick(featured.title)}
              </h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hm-fg-secondary)]">
                {pick(featured.excerpt)}
              </p>
              <div className="mt-4">
                <MetaRow post={featured} />
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--hm-brand-500)]">
                {t('blog.read')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        {/* Category filter rail */}
        <div className="mt-12 flex flex-wrap gap-2 border-t border-[var(--hm-border-subtle)] pt-6">
          {(['all', ...BLOG_CATEGORY_KEYS] as const).map((c) => {
            const on = active === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  on
                    ? 'bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                    : 'border border-[var(--hm-border-subtle)] text-[var(--hm-fg-secondary)] hover:border-[var(--hm-border-strong)] hover:text-[var(--hm-fg-primary)]'
                }`}
              >
                {c === 'all' ? t('blog.all') : catLabel(c)}
              </button>
            );
          })}
        </div>

        {/* Post grid */}
        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link key={post.slug} href={cl(`/blog/${post.slug}`)} className="group">
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt=""
                  loading="lazy"
                  className="aspect-[40/21] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <span className="mt-3 block font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hm-fg-muted)]">
                {catLabel(post.category)}
              </span>
              <h3 className="mt-1.5 font-display text-[18px] font-bold leading-[1.2] tracking-[-0.01em] text-[var(--hm-fg-primary)] transition-colors group-hover:text-[var(--hm-brand-500)]">
                {pick(post.title)}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[var(--hm-fg-secondary)]">
                {pick(post.excerpt)}
              </p>
              <div className="mt-3">
                <MetaRow post={post} />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

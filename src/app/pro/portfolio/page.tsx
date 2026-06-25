'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import AuthGuard from '@/components/common/AuthGuard';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCountry } from '@/hooks/useCountry';
import api from '@/lib/api';
import type { PortfolioItem } from '@/types/shared/social';
import { Image as ImageIcon, Layers, Plus } from 'lucide-react';

function ProPortfolioPageContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const country = useMarketplaceCountry();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await api.get(`/portfolio/pro/${user.id}`, {
          signal: controller.signal,
        });
        const raw = Array.isArray(res.data) ? res.data : [];
        setItems(raw as PortfolioItem[]);
      } catch (err) {
        const e = err as { name?: string; code?: string };
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalImages = items.reduce((acc, item) => {
      const main = item.imageUrl ? 1 : 0;
      const extra = item.images?.length ?? 0;
      const beforeAfter = (item.beforeAfter?.length ?? 0) * 2;
      return acc + main + extra + beforeAfter;
    }, 0);
    const categories = new Set(
      items.map((i) => i.category).filter((c): c is string => Boolean(c)),
    );
    return {
      totalProjects: items.length,
      totalImages,
      categoriesCount: categories.size,
    };
  }, [items]);

  const manageHref = user?.id
    ? `/${country.toLowerCase()}/professionals/${user.id}`
    : '/pro/profile-setup';

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--hm-fg-primary)]">
              {t('common.portfolio')}
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--hm-fg-muted)]">
              {t('professional.portfolioSubtitle')}
            </p>
          </div>
          <Button
            variant="default"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => router.push(manageHref)}
          >
            {t('common.addProject')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card variant="elevated" size="md">
            <div className="flex items-center">
              <IconBadge icon={ImageIcon} variant="neutral" size="lg" />
              <div className="ml-2.5 sm:ml-4">
                <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">
                  {t('professional.totalProjects')}
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-[var(--hm-fg-primary)]">
                  {isLoading ? <Skeleton className="h-6 w-10" /> : stats.totalProjects}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" size="md">
            <div className="flex items-center">
              <IconBadge icon={ImageIcon} variant="info" size="lg" />
              <div className="ml-2.5 sm:ml-4">
                <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">
                  {t('professional.totalImages')}
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-[var(--hm-fg-primary)]">
                  {isLoading ? <Skeleton className="h-6 w-10" /> : stats.totalImages}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" size="md">
            <div className="flex items-center">
              <IconBadge icon={Layers} variant="accent" size="lg" />
              <div className="ml-2.5 sm:ml-4">
                <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)]">
                  {t('professional.categoriesCount')}
                </p>
                <p className="text-lg sm:text-2xl font-semibold text-[var(--hm-fg-primary)]">
                  {isLoading ? <Skeleton className="h-6 w-10" /> : stats.categoriesCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <Card variant="elevated" size="lg">
            <EmptyState
              icon={ImageIcon}
              title={t('professional.noPortfolioItemsYet')}
              description={t('professional.portfolioEmptyBody')}
              actionLabel={t('common.addYourFirstProject')}
              actionHref={manageHref}
              variant="illustrated"
              size="md"
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item) => {
              const cover =
                item.imageUrl ||
                item.images?.[0] ||
                item.beforeAfter?.[0]?.after ||
                item.afterImage ||
                item.beforeAfter?.[0]?.before ||
                item.beforeImage;
              return (
                <Card
                  key={item.id}
                  variant="elevated"
                  size="sm"
                  hover
                  className="overflow-hidden p-0 cursor-pointer"
                  onClick={() => router.push(manageHref)}
                >
                  <div className="relative aspect-[4/3] w-full bg-[var(--hm-bg-tertiary)]">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={item.title || ''}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-[var(--hm-fg-muted)]" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-base font-medium text-[var(--hm-fg-primary)] line-clamp-1">
                      {item.title || t('common.untitled')}
                    </h3>
                    {item.category && (
                      <p className="mt-1 text-xs text-[var(--hm-fg-muted)] line-clamp-1">
                        {item.category}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {items.length > 0 && !isLoading && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(manageHref)}
            >
              {t('professional.manageInProfile')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProPortfolioPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <ProPortfolioPageContent />
    </AuthGuard>
  );
}

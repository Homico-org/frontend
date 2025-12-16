'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  service: {
    _id: string;
    title: string;
    category: string;
    gallery: { type: string; url: string; thumbnail?: string }[];
    packages: { name: string; price: number; deliveryDays: number }[];
    avgRating: number;
    totalReviews: number;
    totalOrders: number;
    proId: {
      _id: string;
      userId: { name: string; avatar?: string };
      title: string;
      avgRating: number;
      isAvailable: boolean;
    };
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const images = service.gallery.filter(g => g.type === 'image');
  const startingPrice = Math.min(...service.packages.map(p => p.price));
  const pro = service.proId;
  const proUser = typeof pro.userId === 'object' ? pro.userId : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segmentWidth = rect.width / images.length;
    const newIndex = Math.min(Math.floor(x / segmentWidth), images.length - 1);
    setImageIndex(newIndex);
  };

  return (
    <Link href={`/services/${service._id}`} className="group block">
      <div
        className="bg-white dark:bg-dark-card rounded-xl overflow-hidden border border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-dark-border-subtle hover:shadow-lg dark:hover:shadow-none transition-all duration-200 ease-out"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setImageIndex(0); }}
      >
        {/* Image Gallery */}
        <div
          className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-dark-bg"
          onMouseMove={handleMouseMove}
        >
          {images.length > 0 ? (
            <>
              <img
                src={images[imageIndex]?.url || images[0]?.url}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Image indicators */}
              {images.length > 1 && isHovered && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.slice(0, 5).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i === imageIndex ? 'w-4 bg-white' : 'w-1 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-dark-card/90 hover:bg-white dark:hover:bg-dark-card rounded-full flex items-center justify-center shadow-sm dark:shadow-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out"
          >
            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md">
              {t(`categories.${service.category}`) || service.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Pro info */}
          <div className="flex items-center gap-2 mb-2">
            {proUser?.avatar ? (
              <img
                src={proUser.avatar}
                alt={proUser.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-dark-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {proUser?.name?.charAt(0) || 'P'}
              </div>
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                {proUser?.name || 'Pro'}
              </span>
              {pro.isAvailable && (
                <span className="w-2 h-2 bg-[#E07B4F] rounded-full flex-shrink-0" title="Available" />
              )}
            </div>
            {pro.avgRating >= 4.8 && (
              <span className="ml-auto px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                Top Rated
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-primary-400 transition-all duration-200 ease-out">
            {service.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{service.avgRating.toFixed(1)}</span>
            <span className="text-sm text-neutral-400 dark:text-neutral-500">({service.totalReviews})</span>
            {service.totalOrders > 0 && (
              <span className="text-xs text-neutral-400 ml-1">• {service.totalOrders} orders</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-dark-border">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('professional.from')}</span>
            <span className="text-lg font-bold text-neutral-900 dark:text-neutral-50">₾{startingPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

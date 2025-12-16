'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES } from '@/constants/categories';
import StatusBadge from '@/components/common/StatusBadge';
import { ProStatus } from '@/types';

interface SimilarPro {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    city?: string;
  };
  title: string;
  categories: string[];
  subcategories?: string[];
  avgRating: number;
  totalReviews: number;
  completedJobs?: number;
  externalCompletedJobs?: number;
  yearsExperience: number;
  isAvailable: boolean;
  status?: ProStatus;
  avatar?: string;
  portfolioProjects?: {
    images: string[];
  }[];
}

interface SimilarProfessionalsProps {
  currentProId: string;
  categories: string[];
  subcategories?: string[];
}

export default function SimilarProfessionals({ currentProId, categories, subcategories }: SimilarProfessionalsProps) {
  const { locale } = useLanguage();
  const [similarPros, setSimilarPros] = useState<SimilarPro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const fetchSimilarPros = async () => {
      try {
        // Build query params for similar professionals
        const params = new URLSearchParams();
        if (categories.length > 0) {
          params.append('category', categories[0]);
        }
        if (subcategories && subcategories.length > 0) {
          params.append('subcategory', subcategories[0]);
        }
        params.append('limit', '8');
        params.append('exclude', currentProId);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current pro and limit to 6
          const filtered = (data.profiles || data)
            .filter((p: SimilarPro) => p._id !== currentProId)
            .slice(0, 6);
          setSimilarPros(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch similar professionals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (categories.length > 0) {
      fetchSimilarPros();
    } else {
      setIsLoading(false);
    }
  }, [currentProId, categories, subcategories]);

  // Check scroll capabilities
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [similarPros]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getCategoryLabel = (categoryKey: string) => {
    const category = CATEGORIES.find(c => c.key === categoryKey);
    if (category) {
      return locale === 'ka' ? category.nameKa : category.name;
    }
    return categoryKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="mt-8 sm:mt-12">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-6 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] h-[320px] rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (similarPros.length === 0) {
    return (
      <section className="mt-6 sm:mt-8">
        {/* Section Header - matching შესახებ and ნამუშევრები style */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-[3px] flex-1 max-w-[40px] rounded-sm"
            style={{
              background: 'linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, #fff))'
            }}
          />
          <h2
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {locale === 'ka' ? 'მსგავსი სპეციალისტები' : 'Similar Professionals'}
          </h2>
        </div>

        {/* Empty State - Clean, no card background */}
        <div className="relative py-8 sm:py-12">
          {/* Floating avatar placeholders - decorative */}
          <div className="absolute top-4 right-0 sm:right-4 flex -space-x-2 opacity-60">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-bg-primary)',
                  animation: `bounce-subtle 2.5s ease-in-out ${i * 0.15}s infinite`,
                  opacity: 0.5 + (i * 0.15)
                }}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: 'var(--color-text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            ))}
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-accent-soft)',
                borderColor: 'var(--color-bg-primary)',
                animation: 'pulse-slow 2s ease-in-out infinite'
              }}
            >
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>?</span>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <circle
                    cx="13"
                    cy="13"
                    r="8"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <path
                    d="M19 19L26 26"
                    stroke="var(--color-accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <circle
                    cx="13"
                    cy="11"
                    r="2.5"
                    fill="var(--color-text-muted)"
                    opacity="0.5"
                  />
                  <path
                    d="M9 17c0-2.5 2-4 4-4s4 1.5 4 4"
                    stroke="var(--color-text-muted)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-base sm:text-lg font-semibold mb-1.5"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {locale === 'ka'
                  ? 'პირველი თავის კატეგორიაში'
                  : 'First in their category'}
              </h3>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {locale === 'ka'
                  ? 'ეს სპეციალისტი უნიკალურია! გამოიკვლიეთ სხვა კატეგორიები.'
                  : 'This professional is unique! Explore other categories.'}
              </p>

              {/* Action button */}
              <a
                href="/browse"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: 'var(--color-accent-soft)',
                  color: 'var(--color-accent)'
                }}
              >
                <span>{locale === 'ka' ? 'კატეგორიების დათვალიერება' : 'Browse Categories'}</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="mt-8 sm:mt-12 pb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{
              background: 'linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)'
            }}
          />
          <h2
            className="text-lg sm:text-xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            მსგავსი სპეციალისტები
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-muted)'
            }}
          >
            {similarPros.length}
          </span>
        </div>

        {/* Navigation Arrows - Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canScrollLeft ? 'var(--color-bg-tertiary)' : 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canScrollRight ? 'var(--color-bg-tertiary)' : 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {similarPros.map((pro, index) => {
            const proUser = pro.userId;
            const avatarUrl = pro.avatar || proUser?.avatar;
            const displayName = proUser?.name || 'Professional';
            const status = pro.status || (pro.isAvailable ? ProStatus.ACTIVE : ProStatus.AWAY);
            const portfolioImages = pro.portfolioProjects?.flatMap(p => p.images) || [];
            const totalJobs = (pro.completedJobs || 0) + (pro.externalCompletedJobs || 0);

            return (
              <Link
                key={pro._id}
                href={`/professionals/${pro._id}`}
                className="group flex-shrink-0 w-[280px] sm:w-[300px] block"
                style={{
                  scrollSnapAlign: 'start',
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div
                  className="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Hero Image / Avatar Section */}
                  <div className="relative h-36 overflow-hidden">
                    {portfolioImages.length > 0 ? (
                      <div className="absolute inset-0 flex">
                        <img
                          src={portfolioImages[0]}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg,
                            hsl(${(displayName.charCodeAt(0) * 11) % 360}, 55%, 35%) 0%,
                            hsl(${(displayName.charCodeAt(0) * 11 + 45) % 360}, 45%, 25%) 100%)`
                        }}
                      />
                    )}

                    {/* Avatar overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                      <div className="relative">
                        <div
                          className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg"
                          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg,
                                  hsl(${(displayName.charCodeAt(0) * 7) % 360}, 65%, 45%) 0%,
                                  hsl(${(displayName.charCodeAt(0) * 7 + 40) % 360}, 55%, 35%) 100%)`
                              }}
                            >
                              <span className="text-lg font-bold text-white">{displayName.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <StatusBadge status={status} variant="minimal" size="sm" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-0.5">
                        <h3 className="font-semibold text-white text-[15px] truncate drop-shadow-md">
                          {displayName}
                        </h3>
                        <p className="text-xs text-white/80 truncate">
                          {pro.title || getCategoryLabel(pro.categories[0])}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div
                    className="grid grid-cols-3 gap-0 py-3 px-1"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    {/* Rating */}
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {pro.avgRating > 0 ? pro.avgRating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <span className="text-[9px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {pro.totalReviews > 0 ? `${pro.totalReviews} შეფ.` : 'რეიტინგი'}
                      </span>
                    </div>

                    {/* Experience */}
                    <div className="flex flex-col items-center text-center border-x" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {pro.yearsExperience || 0}+
                        </span>
                      </div>
                      <span className="text-[9px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        წელი
                      </span>
                    </div>

                    {/* Jobs Done */}
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {totalJobs}
                        </span>
                      </div>
                      <span className="text-[9px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        პროექტი
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Preview */}
                  {portfolioImages.length > 1 ? (
                    <div className="p-2 pt-0">
                      <div className="flex gap-1.5 overflow-hidden rounded-lg">
                        {portfolioImages.slice(1, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className="flex-1 aspect-square overflow-hidden rounded-md"
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {portfolioImages.length > 4 && (
                          <div
                            className="flex-1 aspect-square rounded-md flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                          >
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                              +{portfolioImages.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 pt-0">
                      <div
                        className="flex items-center justify-center gap-2 py-3 rounded-lg"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          border: '1px dashed var(--color-border)'
                        }}
                      >
                        <svg className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          პორტფოლიო მალე
                        </span>
                      </div>
                    </div>
                  )}

                  {/* View Profile CTA - shows on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300 pointer-events-none"
                  >
                    <span
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    >
                      პროფილის ნახვა
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* View All Card */}
          <Link
            href={`/browse?category=${categories[0]}`}
            className="group flex-shrink-0 w-[280px] sm:w-[300px] block"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div
              className="relative h-full min-h-[320px] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col items-center justify-center gap-4 p-6"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px dashed var(--color-border)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: 'var(--color-accent-soft)',
                }}
              >
                <svg
                  className="w-7 h-7 transition-transform duration-300 group-hover:translate-x-1"
                  style={{ color: 'var(--color-accent)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="text-center">
                <p
                  className="font-semibold mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ყველას ნახვა
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {getCategoryLabel(categories[0])} სფეროში
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Gradient fade edges - Desktop */}
        <div
          className="hidden sm:block absolute left-0 top-0 bottom-2 w-16 pointer-events-none"
          style={{
            background: `linear-gradient(to right, var(--color-bg-primary), transparent)`
          }}
        />
        <div
          className="hidden sm:block absolute right-0 top-0 bottom-2 w-16 pointer-events-none"
          style={{
            background: `linear-gradient(to left, var(--color-bg-primary), transparent)`
          }}
        />
      </div>
    </section>
  );
}

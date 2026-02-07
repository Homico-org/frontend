'use client';

import {
  ArrowRight,
  CheckCircle2,
  Grid3X3,
  Star,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import MiniProCard from './MiniProCard';
import {
  CategoryItem,
  FeatureExplanation,
  FeatureStep,
  FaqItem,
  PriceInfo,
  ProfessionalCardData,
  ReviewItem,
  RichContent,
  RichContentType,
} from './types';

interface RichContentRendererProps {
  content: RichContent;
  locale: string;
}

export default function RichContentRenderer({
  content,
  locale,
}: RichContentRendererProps) {
  switch (content.type) {
    case RichContentType.PROFESSIONAL_LIST:
      return (
        <ProfessionalListRenderer
          professionals={content.data as ProfessionalCardData[]}
          locale={locale}
        />
      );

    case RichContentType.PROFESSIONAL_CARD:
      return (
        <div className="mt-3">
          <MiniProCard
            professional={content.data as ProfessionalCardData}
            locale={locale}
          />
        </div>
      );

    case RichContentType.CATEGORY_LIST:
      return (
        <CategoryListRenderer
          categories={content.data as CategoryItem[]}
          locale={locale}
        />
      );

    case RichContentType.REVIEW_LIST:
      return (
        <ReviewListRenderer
          reviews={content.data as ReviewItem[]}
          locale={locale}
        />
      );

    case RichContentType.PRICE_INFO:
      return (
        <PriceInfoRenderer
          priceInfo={content.data as PriceInfo}
          locale={locale}
        />
      );

    case RichContentType.FEATURE_EXPLANATION:
      return (
        <FeatureExplanationRenderer
          feature={content.data as FeatureExplanation}
          locale={locale}
        />
      );

    case RichContentType.FEATURE_LIST:
      return (
        <FeatureListRenderer
          features={content.data as FeatureExplanation[]}
          locale={locale}
        />
      );

    case RichContentType.FAQ_LIST:
      return (
        <FaqListRenderer
          faqs={content.data as FaqItem[]}
          locale={locale}
        />
      );

    default:
      return null;
  }
}

// Professional List Renderer
function ProfessionalListRenderer({
  professionals,
  locale,
}: {
  professionals: ProfessionalCardData[];
  locale: string;
}) {
  if (professionals.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {professionals.map((pro) => (
        <MiniProCard key={pro.id} professional={pro} locale={locale} />
      ))}
    </div>
  );
}

// Category List Renderer
function CategoryListRenderer({
  categories,
  locale,
}: {
  categories: CategoryItem[];
  locale: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.key}
            href={`/professionals?category=${category.key}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-full text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>
              {locale === 'ka' && category.nameKa
                ? category.nameKa
                : category.name}
            </span>
            {category.subcategoryCount !== undefined && category.subcategoryCount > 0 && (
              <span className="text-xs text-neutral-400">
                ({category.subcategoryCount})
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Review List Renderer
function ReviewListRenderer({
  reviews,
  locale,
}: {
  reviews: ReviewItem[];
  locale: string;
}) {
  if (reviews.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-3 bg-neutral-50 rounded-xl border border-neutral-100"
        >
          {/* Rating and client */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500">
              {review.clientName}
              {review.isVerified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
            </span>
          </div>

          {/* Review text */}
          {review.text && (
            <p className="text-sm text-neutral-600 line-clamp-3">
              {review.text}
            </p>
          )}

          {/* Project title */}
          {review.projectTitle && (
            <p className="mt-1.5 text-xs text-neutral-400">
              {review.projectTitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Price Info Renderer
function PriceInfoRenderer({
  priceInfo,
  locale,
}: {
  priceInfo: PriceInfo;
  locale: string;
}) {
  const categoryName =
    locale === 'ka' && priceInfo.categoryKa
      ? priceInfo.categoryKa
      : priceInfo.category;

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-[#C4735B]" />
        <span className="font-medium text-neutral-900">
          {locale === 'ka' ? 'ფასები:' : 'Pricing:'} {categoryName}
        </span>
      </div>

      {/* Average price */}
      {priceInfo.averagePrice && (
        <div className="mb-3 p-2.5 bg-[#C4735B]/10 rounded-lg">
          <p className="text-xs text-neutral-500 mb-0.5">
            {locale === 'ka' ? 'საშუალო ფასი' : 'Average Price'}
          </p>
          <p className="text-lg font-semibold text-[#C4735B]">
            ₾{priceInfo.averagePrice.min.toLocaleString()} -{' '}
            ₾{priceInfo.averagePrice.max.toLocaleString()}
          </p>
        </div>
      )}

      {/* Price ranges */}
      {priceInfo.priceRanges.length > 0 && (
        <div className="space-y-2">
          {priceInfo.priceRanges.map((range, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0"
            >
              <span className="text-sm text-neutral-600">
                {locale === 'ka' && range.labelKa ? range.labelKa : range.label}
              </span>
              <span className="text-sm font-medium text-neutral-900">
                ₾{range.min.toLocaleString()} - ₾{range.max.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      {priceInfo.note && (
        <p className="mt-3 text-xs text-neutral-500">
          {locale === 'ka' && priceInfo.noteKa ? priceInfo.noteKa : priceInfo.note}
        </p>
      )}

      {/* Pro count */}
      <p className="mt-2 text-xs text-neutral-400">
        {locale === 'ka'
          ? `${priceInfo.professionalCount} პროფესიონალი`
          : `Based on ${priceInfo.professionalCount} professionals`}
      </p>
    </div>
  );
}

// Feature Explanation Renderer
function FeatureExplanationRenderer({
  feature,
  locale,
}: {
  feature: FeatureExplanation;
  locale: string;
}) {
  const title =
    locale === 'ka'
      ? feature.titleKa
      : locale === 'ru'
        ? feature.titleRu
        : feature.title;

  const description =
    locale === 'ka'
      ? feature.descriptionKa
      : locale === 'ru'
        ? feature.descriptionRu
        : feature.description;

  const actionLabel =
    locale === 'ka'
      ? feature.actionLabelKa
      : locale === 'ru'
        ? feature.actionLabelRu
        : feature.actionLabel;

  const getStepTitle = (step: FeatureStep) =>
    locale === 'ka'
      ? step.titleKa
      : locale === 'ru'
        ? step.titleRu
        : step.title;

  const getStepDescription = (step: FeatureStep) =>
    locale === 'ka'
      ? step.descriptionKa
      : locale === 'ru'
        ? step.descriptionRu
        : step.description;

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
      {/* Header */}
      <h4 className="font-semibold text-neutral-900 mb-1">{title}</h4>
      <p className="text-sm text-neutral-600 mb-3">{description}</p>

      {/* Steps */}
      {feature.steps && feature.steps.length > 0 && (
        <div className="space-y-2.5">
          {feature.steps.map((step) => (
            <div key={step.step} className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C4735B] text-white flex items-center justify-center text-xs font-medium">
                {step.step}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium text-neutral-800">
                  {getStepTitle(step)}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {getStepDescription(step)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {feature.actionUrl && actionLabel && (
        <Link
          href={feature.actionUrl}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#C4735B] text-white text-sm font-medium rounded-lg hover:bg-[#A85D47] transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function FeatureListRenderer({
  features,
  locale,
}: {
  features: FeatureExplanation[];
  locale: string;
}) {
  if (!features?.length) return null;

  const getTitle = (f: FeatureExplanation) =>
    locale === 'ka' ? f.titleKa : locale === 'ru' ? f.titleRu : f.title;

  const getDescription = (f: FeatureExplanation) =>
    locale === 'ka'
      ? f.descriptionKa
      : locale === 'ru'
        ? f.descriptionRu
        : f.description;

  const getActionLabel = (f: FeatureExplanation) =>
    locale === 'ka'
      ? f.actionLabelKa
      : locale === 'ru'
        ? f.actionLabelRu
        : f.actionLabel;

  return (
    <div className="mt-3 space-y-2">
      {features.slice(0, 5).map((f) => (
        <div
          key={f.feature}
          className="p-3 bg-white rounded-xl border border-neutral-200"
        >
          <p className="text-sm font-semibold text-neutral-900">
            {getTitle(f) || f.feature}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {getDescription(f)}
          </p>
          {f.actionUrl && (
            <Link
              href={f.actionUrl}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#C4735B] hover:underline"
            >
              {getActionLabel(f) || (locale === 'ka' ? 'გახსნა' : locale === 'ru' ? 'Открыть' : 'Open')}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function FaqListRenderer({
  faqs,
  locale,
}: {
  faqs: FaqItem[];
  locale: string;
}) {
  if (!faqs?.length) return null;

  const getQ = (f: FaqItem) =>
    locale === 'ka' ? f.questionKa : locale === 'ru' ? f.questionRu : f.question;

  const getA = (f: FaqItem) =>
    locale === 'ka' ? f.answerKa : locale === 'ru' ? f.answerRu : f.answer;

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-[#C4735B]" />
        <span className="font-medium text-neutral-900">
          {locale === 'ka' ? 'ხშირი კითხვები' : locale === 'ru' ? 'Частые вопросы' : 'FAQs'}
        </span>
      </div>

      <div className="space-y-2">
        {faqs.slice(0, 4).map((f, idx) => (
          <details
            key={`${idx}-${f.relatedFeature || ''}`}
            className="group rounded-lg border border-neutral-200 bg-white px-3 py-2"
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-neutral-800 flex items-center justify-between gap-2">
              <span className="min-w-0">{getQ(f)}</span>
              <span className="text-neutral-400 group-open:rotate-90 transition-transform">›</span>
            </summary>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
              {getA(f)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

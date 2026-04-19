"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, CheckCircle2, Grid3X3, Star, Tag } from "lucide-react";
import Link from "next/link";
import React from "react";
import MiniProCard from "./MiniProCard";
import {
  CategoryItem,
  FaqItem,
  FeatureExplanation,
  FeatureStep,
  PriceInfo,
  ProfessionalCardData,
  ReviewItem,
  RichContent,
  RichContentType,
} from "./types";

interface RichContentRendererProps {
  content: RichContent;
  locale: string;
}

// Locale-aware field picker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickLocale(obj: any, field: string, locale: string): string {
  const localeSuffix: Record<string, string> = { ka: "Ka", ru: "Ru" };
  const suffix = localeSuffix[locale];
  if (suffix && obj[`${field}${suffix}`]) return obj[`${field}${suffix}`] as string;
  return (obj[field] as string) || "";
}

export default function RichContentRenderer({
  content,
  locale,
}: RichContentRendererProps): React.ReactElement | null {
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
        <FaqListRenderer faqs={content.data as FaqItem[]} locale={locale} />
      );

    default:
      return null;
  }
}

function ProfessionalListRenderer({
  professionals,
  locale,
}: {
  professionals: ProfessionalCardData[];
  locale: string;
}): React.ReactElement | null {
  if (professionals.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {professionals.map((pro) => (
        <MiniProCard key={pro.id} professional={pro} locale={locale} />
      ))}
    </div>
  );
}

function CategoryListRenderer({
  categories,
}: {
  categories: CategoryItem[];
  locale: string;
}): React.ReactElement | null {
  const { pick } = useLanguage();
  if (categories.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          key={category.key}
          href={`/professionals?category=${category.key}`}
        >
          <Badge
            variant="secondary"
            size="sm"
            className="gap-1.5 cursor-pointer hover:opacity-80"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            {pick({ en: category.name, ka: category.nameKa })}
            {category.subcategoryCount !== undefined &&
              category.subcategoryCount > 0 && (
                <span className="opacity-50">
                  ({category.subcategoryCount})
                </span>
              )}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function ReviewListRenderer({
  reviews,
}: {
  reviews: ReviewItem[];
  locale: string;
}): React.ReactElement | null {
  if (reviews.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-3 rounded-xl"
          style={{
            backgroundColor: "var(--hm-bg-tertiary)",
            border: "1px solid var(--hm-border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-neutral-200"
                  }`}
                />
              ))}
            </div>
            <span
              className="text-xs"
              style={{ color: "var(--hm-fg-muted)" }}
            >
              {review.clientName}
              {review.isVerified && (
                <CheckCircle2 className="w-3 h-3 text-[var(--hm-info-500)] inline ml-1" />
              )}
            </span>
          </div>

          {review.text && (
            <p
              className="text-sm line-clamp-3"
              style={{ color: "var(--hm-fg-secondary)" }}
            >
              {review.text}
            </p>
          )}

          {review.projectTitle && (
            <p
              className="mt-1.5 text-xs"
              style={{ color: "var(--hm-fg-muted)" }}
            >
              {review.projectTitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PriceInfoRenderer({
  priceInfo,
}: {
  priceInfo: PriceInfo;
  locale: string;
}): React.ReactElement {
  const { t, pick } = useLanguage();
  const categoryName = pick({ en: priceInfo.category, ka: priceInfo.categoryKa });

  return (
    <div
      className="mt-3 p-4 rounded-xl"
      style={{
        backgroundColor: "var(--hm-bg-tertiary)",
        border: "1px solid var(--hm-border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-4 h-4 text-[var(--hm-brand-500)]" />
        <span
          className="font-medium"
          style={{ color: "var(--hm-fg-primary)" }}
        >
          {t("ai.pricing")}: {categoryName}
        </span>
      </div>

      {priceInfo.averagePrice && (
        <div className="mb-3 p-2.5 bg-[var(--hm-brand-500)]/10 rounded-lg">
          <p
            className="text-xs mb-0.5"
            style={{ color: "var(--hm-fg-muted)" }}
          >
            {t("ai.averagePrice")}
          </p>
          <p className="text-lg font-semibold text-[var(--hm-brand-500)]">
            ₾{priceInfo.averagePrice.min.toLocaleString()} – ₾
            {priceInfo.averagePrice.max.toLocaleString()}
          </p>
        </div>
      )}

      {priceInfo.priceRanges.length > 0 && (
        <div className="space-y-2">
          {priceInfo.priceRanges.map((range, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5"
              style={{
                borderBottom:
                  idx < priceInfo.priceRanges.length - 1
                    ? "1px solid var(--hm-border-subtle)"
                    : undefined,
              }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--hm-fg-secondary)" }}
              >
                {pick({ en: range.label, ka: range.labelKa })}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--hm-fg-primary)" }}
              >
                ₾{range.min.toLocaleString()} – ₾{range.max.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {priceInfo.note && (
        <p
          className="mt-3 text-xs"
          style={{ color: "var(--hm-fg-muted)" }}
        >
          {pick({ en: priceInfo.note, ka: priceInfo.noteKa })}
        </p>
      )}

      <p className="mt-2 text-xs" style={{ color: "var(--hm-fg-muted)" }}>
        {t("ai.basedOnProfessionals", { count: priceInfo.professionalCount })}
      </p>
    </div>
  );
}

function FeatureExplanationRenderer({
  feature,
  locale,
}: {
  feature: FeatureExplanation;
  locale: string;
}): React.ReactElement {
  const title = pickLocale(feature, "title", locale);
  const description = pickLocale(feature, "description", locale);
  const actionLabel = pickLocale(feature, "actionLabel", locale);

  const getStepTitle = (step: FeatureStep): string =>
    pickLocale(step, "title", locale);
  const getStepDescription = (step: FeatureStep): string =>
    pickLocale(step, "description", locale);

  return (
    <div
      className="mt-3 p-4 rounded-xl"
      style={{
        backgroundColor: "var(--hm-bg-tertiary)",
        border: "1px solid var(--hm-border-subtle)",
      }}
    >
      <h4
        className="font-semibold mb-1"
        style={{ color: "var(--hm-fg-primary)" }}
      >
        {title}
      </h4>
      <p
        className="text-sm mb-3"
        style={{ color: "var(--hm-fg-secondary)" }}
      >
        {description}
      </p>

      {feature.steps && feature.steps.length > 0 && (
        <div className="space-y-2.5">
          {feature.steps.map((step) => (
            <div key={step.step} className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--hm-brand-500)] text-white flex items-center justify-center text-xs font-medium">
                {step.step}
              </div>
              <div className="flex-1 pt-0.5">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--hm-fg-primary)" }}
                >
                  {getStepTitle(step)}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--hm-fg-muted)" }}
                >
                  {getStepDescription(step)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {feature.actionUrl && actionLabel && (
        <Link href={feature.actionUrl} className="inline-block mt-4">
          <Button size="sm">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {actionLabel}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
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
}): React.ReactElement | null {
  const { t } = useLanguage();
  if (!features?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {features.slice(0, 5).map((f) => (
        <div
          key={f.feature}
          className="p-3 rounded-xl"
          style={{
            backgroundColor: "var(--hm-bg-elevated)",
            border: "1px solid var(--hm-border-subtle)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--hm-fg-primary)" }}
          >
            {pickLocale(f, "title", locale) || f.feature}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--hm-fg-secondary)" }}
          >
            {pickLocale(f, "description", locale)}
          </p>
          {f.actionUrl && (
            <Link
              href={f.actionUrl}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--hm-brand-500)] hover:underline"
            >
              {pickLocale(f, "actionLabel", locale) || t("common.open")}
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
}): React.ReactElement | null {
  const { t } = useLanguage();
  if (!faqs?.length) return null;

  return (
    <div
      className="mt-3 p-4 rounded-xl"
      style={{
        backgroundColor: "var(--hm-bg-tertiary)",
        border: "1px solid var(--hm-border-subtle)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-[var(--hm-brand-500)]" />
        <span
          className="font-medium"
          style={{ color: "var(--hm-fg-primary)" }}
        >
          {t("ai.faqs")}
        </span>
      </div>

      <div className="space-y-2">
        {faqs.slice(0, 4).map((f, idx) => (
          <details
            key={`${idx}-${f.relatedFeature || ""}`}
            className="group rounded-lg px-3 py-2"
            style={{
              backgroundColor: "var(--hm-bg-elevated)",
              border: "1px solid var(--hm-border-subtle)",
            }}
          >
            <summary
              className="cursor-pointer list-none text-sm font-medium flex items-center justify-between gap-2"
              style={{ color: "var(--hm-fg-primary)" }}
            >
              <span className="min-w-0">
                {pickLocale(f, "question", locale)}
              </span>
              <span
                className="group-open:rotate-90 transition-transform"
                style={{ color: "var(--hm-fg-muted)" }}
              >
                ›
              </span>
            </summary>
            <p
              className="mt-2 text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--hm-fg-secondary)" }}
            >
              {pickLocale(f, "answer", locale)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

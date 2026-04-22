"use client";

import { ExperienceLevel, SelectedService } from "@/components/register/steps/StepSelectServices";
import { SelectedSubcategoryWithPricing } from "./ServicesPricingStep";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Facebook,
  Globe,
  Images,
  Instagram,
  Linkedin,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import Image from "next/image";
import { PortfolioProject } from "./ProjectsStep";

const EXP_LABELS: Record<string, { en: string; ka: string }> = {
  "1-2": { en: "1-2 years", ka: "1-2 წელი" },
  "3-5": { en: "3-5 years", ka: "3-5 წელი" },
  "5-10": { en: "5-10 years", ka: "5-10 წელი" },
  "10+": { en: "10+ years", ka: "10+ წელი" },
};

interface ReviewStepProps {
  formData: {
    firstName: string;
    lastName: string;
    bio: string;
    yearsExperience: string;
    avatar: string;
    basePrice: string;
    maxPrice: string;
    pricingModel: string;
    serviceAreas: string[];
    nationwide: boolean;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  selectedCategories: string[];
  selectedSubcategories: string[];
  customServices?: string[];
  avatarPreview: string | null;
  locationData: { nationwide: string } | null;
  onEditStep: (step: number) => void;
  isEditMode?: boolean;
  portfolioProjects?: PortfolioProject[];
  selectedServices?: SelectedService[];
  selectedSubcategoriesWithPricing?: SelectedSubcategoryWithPricing[];
}

export default function ReviewStep({
  formData,
  customServices = [],
  avatarPreview,
  locationData,
  onEditStep,
  portfolioProjects = [],
  selectedSubcategoriesWithPricing = [],
}: ReviewStepProps) {
  const { t, pick } = useLanguage();
  const { getCategoryByKey } = useCategories();

  const hasName =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2;
  const hasBio = formData.bio.trim().length >= 50;
  const hasAvatar = !!avatarPreview;
  const hasExperience = !!formData.yearsExperience;
  const hasServices = selectedSubcategoriesWithPricing.length > 0;
  const hasAreas = formData.nationwide || formData.serviceAreas.length > 0;
  const hasPortfolio = portfolioProjects.length > 0;

  const aboutMissing: string[] = [];
  if (!hasName) aboutMissing.push(t("common.fullName"));
  if (!hasAvatar) aboutMissing.push(t("common.profilePhoto"));
  if (!hasBio) aboutMissing.push(t("common.aboutYou"));
  if (!hasExperience) aboutMissing.push(t("common.yearsOfExperience"));

  const SectionHeader = ({
    icon: Icon,
    title,
    stepIndex,
    complete,
    required = true,
  }: {
    icon: typeof User;
    title: string;
    stepIndex: number;
    complete: boolean;
    required?: boolean;
  }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--hm-brand-500)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--hm-fg-secondary)]">
          {title}
        </span>
        {complete ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--hm-success-500)]" />
        ) : required ? (
          <AlertCircle className="w-3.5 h-3.5 text-[var(--hm-error-500)]" />
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onEditStep(stepIndex)}
        className="flex items-center gap-1 text-xs text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-700)] font-medium transition-colors"
      >
        <Pencil className="w-3 h-3" />
        {t("common.edit")}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── About ── */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4">
        <SectionHeader
          icon={User}
          title={t("common.about")}
          stepIndex={0}
          complete={hasName && hasBio && hasAvatar && hasExperience}
        />

        {aboutMissing.length > 0 && (
          <div className="mb-3 px-3 py-2 rounded-lg text-xs flex flex-wrap items-center gap-1.5 border border-[var(--hm-error-500)]/30 bg-[var(--hm-error-500)]/5 text-[var(--hm-error-500)]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">{t("common.missingFields")}:</span>
            {aboutMissing.map((f, i) => (
              <span
                key={f}
                className="px-1.5 py-0.5 rounded bg-[var(--hm-error-500)]/10 font-medium"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3">
          {avatarPreview ? (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden">
              <Image src={avatarPreview} alt="" fill sizes="56px" className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--hm-bg-tertiary)] flex items-center justify-center">
              <User className="w-7 h-7 text-[var(--hm-fg-muted)]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {hasName && (
              <p className="text-sm font-semibold text-[var(--hm-fg-primary)] mb-1 truncate">
                {`${formData.firstName} ${formData.lastName}`.trim()}
              </p>
            )}
            <p className="text-sm text-[var(--hm-fg-primary)] line-clamp-3">
              {formData.bio || <span className="text-[var(--hm-fg-muted)] italic">{t("common.notAdded")}</span>}
            </p>
          </div>
        </div>

        {/* Social links */}
        {(formData.whatsapp || formData.telegram || formData.instagram || formData.facebook || formData.linkedin || formData.website) && (
          <div className="mt-3 pt-3 border-t border-[var(--hm-border-subtle)] flex flex-wrap gap-1.5">
            {formData.whatsapp && <Badge variant="success" size="sm" icon={<Phone className="w-3 h-3" />}>WhatsApp</Badge>}
            {formData.telegram && <Badge variant="info" size="sm" icon={<MessageCircle className="w-3 h-3" />}>Telegram</Badge>}
            {formData.instagram && <Badge variant="secondary" size="sm" icon={<Instagram className="w-3 h-3" />}>Instagram</Badge>}
            {formData.facebook && <Badge variant="info" size="sm" icon={<Facebook className="w-3 h-3" />}>Facebook</Badge>}
            {formData.linkedin && <Badge variant="info" size="sm" icon={<Linkedin className="w-3 h-3" />}>LinkedIn</Badge>}
            {formData.website && <Badge variant="default" size="sm" icon={<Globe className="w-3 h-3" />}>{t("common.website")}</Badge>}
          </div>
        )}

        {/* Custom skills */}
        {customServices.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--hm-border-subtle)]">
            <p className="text-[10px] text-[var(--hm-fg-muted)] mb-1.5">{t("common.customSkills")}</p>
            <div className="flex flex-wrap gap-1.5">
              {customServices.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-[var(--hm-success-50)]/20 text-[var(--hm-success-500)] text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Services & Pricing ── */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4">
        <SectionHeader icon={Briefcase} title={`${t("common.services")} & ${t("common.pricing")}`} stepIndex={1} complete={hasServices} />

        {selectedSubcategoriesWithPricing.length > 0 ? (
          <div className="space-y-3">
            {selectedSubcategoriesWithPricing.map((sub) => {
              const displayName = pick({ en: sub.name, ka: sub.nameKa });
              const cat = getCategoryByKey(sub.categoryKey);
              const catName = cat ? pick({ en: cat.name, ka: cat.nameKa }) : undefined;
              const expEntry = EXP_LABELS[sub.experience];
              const expLabel = expEntry ? pick({ en: expEntry.en, ka: expEntry.ka }) : sub.experience;
              const pricedServices = sub.services.filter((s) => s.isActive && s.price > 0);

              return (
                <div key={sub.key} className="border border-[var(--hm-border-subtle)] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-[var(--hm-fg-primary)]">{displayName}</span>
                      {catName && (
                        <span className="text-[10px] text-[var(--hm-fg-muted)] ml-2">{catName}</span>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium">
                      {expLabel}
                    </span>
                  </div>

                  {pricedServices.length > 0 ? (
                    <div className="space-y-1">
                      {pricedServices.map((svc) => (
                        <div key={svc.serviceKey} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--hm-fg-secondary)]">{svc.label}</span>
                          <span className="font-medium text-[var(--hm-fg-primary)]">
                            {svc.price}₾ <span className="text-[var(--hm-fg-muted)] font-normal">/ {svc.unitLabel}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--hm-fg-muted)] italic">{t("common.negotiable")}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--hm-fg-muted)]">{t("common.notAdded")}</p>
        )}
      </div>

      {/* ── Service Areas ── */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4">
        <SectionHeader icon={MapPin} title={t("common.serviceArea")} stepIndex={2} complete={hasAreas} />

        {formData.nationwide ? (
          <div className="flex items-center gap-2">
            <span className="text-base">🇬🇪</span>
            <span className="text-sm font-medium text-[var(--hm-fg-primary)]">
              {locationData?.nationwide || t("common.nationwide")}
            </span>
          </div>
        ) : formData.serviceAreas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {formData.serviceAreas.map((area) => (
              <span key={area} className="px-2.5 py-1 rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] text-xs">
                {area}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--hm-fg-muted)]">{t("common.noneSelected")}</p>
        )}
      </div>

      {/* ── Portfolio ── */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4">
        <SectionHeader icon={Images} title={t("common.portfolio")} stepIndex={3} complete={hasPortfolio} required={false} />

        {portfolioProjects.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {portfolioProjects.slice(0, 8).map((project, idx) => {
              const cover = project.images?.[0] || project.beforeAfterPairs?.[0]?.beforeImage;
              return (
                <div key={project.id || idx} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--hm-bg-tertiary)]">
                  {cover ? (
                    <Image src={cover} alt={project.title} fill sizes="(min-width: 640px) 200px, 33vw" className="object-cover" unoptimized />
                  ) : project.videos?.[0] ? (
                    <video src={project.videos[0]} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Images className="w-6 h-6 text-[var(--hm-fg-muted)]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[10px] text-white font-medium truncate">{project.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--hm-fg-muted)]">{t("common.noProjectsAdded")}</p>
        )}
      </div>
    </div>
  );
}

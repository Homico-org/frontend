'use client';

import NextImage from 'next/image';
import React from 'react';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Check, Phone, Mail, Image as ImageIcon, Briefcase, Edit2 } from 'lucide-react';
import type { FormData, PortfolioProject, RegistrationStep } from '../hooks/useRegistration';

interface Category {
  key: string;
  name: string;
  nameKa: string;
}

export interface ReviewStepProps {
  locale: string;
  formData: FormData;
  categories: Category[];
  avatarPreview: string | null;
  portfolioProjects: PortfolioProject[];
  customServices: string[];
  phoneCountry: CountryCode;
  goToStep: (step: RegistrationStep) => void;
}

export default function StepReview({
  locale,
  formData,
  categories,
  avatarPreview,
  portfolioProjects,
  customServices,
  phoneCountry,
  goToStep,
}: ReviewStepProps) {
  const { t } = useLanguage();
  const validProjects = portfolioProjects.filter(p => 
    p.images.length > 0 || p.videos.length > 0 || p.beforeAfterPairs.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Profile Card Preview */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#FDF8F6] to-[#FAF5F2] p-6 lg:p-8 border-[#C4735B]/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4735B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C4735B]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Header label */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="premium" size="xs" className="uppercase tracking-wider">
              {t('register.profilePreview')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('account')}
              leftIcon={<Edit2 className="w-3 h-3" />}
              className="text-[#C4735B]"
            >
              {t('register.editProfile')}
            </Button>
          </div>

          {/* Profile info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-[#C4735B]/20 shadow-lg">
                {avatarPreview ? (
                  <NextImage src={avatarPreview} alt="Avatar" fill className="object-cover" sizes="80px" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#C4735B] to-[#A85D47] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {formData.fullName?.charAt(0)?.toUpperCase() || 'P'}
                    </span>
                  </div>
                )}
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-[#FDF8F6] flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
                {formData.fullName || (t('register.yourName'))}
              </h2>
              {formData.city && (
                <p className="text-neutral-500 text-sm mb-3">
                  {formData.city}
                </p>
              )}

              {/* Categories as tags */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {formData.selectedCategories.slice(0, 3).map(catKey => {
                  const category = categories.find(c => c.key === catKey);
                  return (
                    <Badge
                      key={catKey}
                      variant="premium"
                      size="sm"
                    >
                      {locale === 'ka' ? category?.nameKa : category?.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#C4735B]/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{validProjects.length}</p>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                {t('common.projects')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{customServices.length}</p>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                {t('common.services')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Portfolio Gallery */}
      {validProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <IconBadge icon={ImageIcon} variant="accent" size="sm" />
              {t('register.portfolio')}
            </h3>
            <Button
              variant="link"
              size="sm"
              onClick={() => goToStep('services')}
              className="text-[#C4735B]"
            >
              {t('common.edit')}
            </Button>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {validProjects.map((project) => {
              const totalMedia = project.images.length + project.videos.length;
              return (
                <div key={project.id} className="group relative">
                  {project.images.length > 0 ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={project.images[0]}
                        alt={project.title || 'Project'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white text-sm font-medium truncate">
                            {project.title || (t('register.untitled'))}
                          </p>
                          {totalMedia > 1 && (
                            <p className="text-white/60 text-xs mt-0.5">
                              +{totalMedia - 1} {t('register.more')}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Media count badge */}
                      {totalMedia > 1 && (
                        <Badge
                          variant="default"
                          size="xs"
                          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white"
                        >
                          {totalMedia}
                        </Badge>
                      )}
                    </div>
                  ) : project.videos.length > 0 ? (
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-indigo-50 relative">
                      <video
                        src={project.videos[0]}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <IconBadge icon={ImageIcon} variant="info" size="lg" className="opacity-80" />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl bg-neutral-100 flex items-center justify-center">
                      <div className="text-center">
                        <IconBadge icon={ImageIcon} variant="neutral" size="lg" className="mx-auto mb-1" />
                        <p className="text-xs text-neutral-400">{t('register.noMedia')}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Contact Info */}
        <Card className="p-4 hover:border-[#C4735B]/30 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {t('register.contact')}
            </h3>
            <Button
              variant="link"
              size="sm"
              onClick={() => goToStep('account')}
              className="text-[#C4735B] text-[10px]"
            >
              {t('register.change')}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <IconBadge icon={Phone} variant="neutral" size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">{t('common.phone')}</p>
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {countries[phoneCountry].phonePrefix}{formData.phone || '-'}
                </p>
              </div>
            </div>
            {formData.email && (
              <div className="flex items-center gap-3">
                <IconBadge icon={Mail} variant="neutral" size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400">{t('common.email')}</p>
                  <p className="text-sm font-medium text-neutral-900 truncate">{formData.email}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Services List */}
        {customServices.length > 0 && (
          <Card className="p-4 hover:border-[#C4735B]/30 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('common.services')}
              </h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => goToStep('category')}
                className="text-[#C4735B] text-[10px]"
              >
                {locale === 'ka' ? 'შეცვლა' : 'Change'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customServices.map((service, idx) => (
                <Badge key={idx} variant="premium" size="sm">
                  {service}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

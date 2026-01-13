'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

export interface UserTypeSelectorProps {
  /** Called when user chooses a type - triggers navigation/flow change */
  onSelect: (type: 'client' | 'pro') => void;
  /** Locale for translations */
  locale?: 'en' | 'ka' | 'ru';
  /** Custom className */
  className?: string;
}

// Cloudinary illustration URLs
const ILLUSTRATIONS = {
  client: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_400,h_300,c_pad,q_auto,f_auto/homico/avatars/client.png',
  pro: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_400,h_300,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
};

const translations = {
  en: {
    client: {
      label: 'I need help with a project',
      title: 'Find a Pro',
      description: 'Post your project and get quotes from verified professionals',
      cta: 'Get Started',
    },
    pro: {
      label: 'I want to offer my services',
      title: 'Become a Pro',
      description: 'Join our network and connect with clients looking for your skills',
      cta: 'Join Now',
      badge: 'Popular',
    },
  },
  ka: {
    client: {
      label: 'მჭირდება დახმარება პროექტში',
      title: 'იპოვე სპეციალისტი',
      description: 'განათავსე პროექტი და მიიღე შეთავაზებები ვერიფიცირებული სპეციალისტებისგან',
      cta: 'დაწყება',
    },
    pro: {
      label: 'მინდა შევთავაზო სერვისი',
      title: 'გახდი სპეციალისტი',
      description: 'შემოგვიერთდი და დაუკავშირდი კლიენტებს შენს რეგიონში',
      cta: 'შემოგვიერთდი',
      badge: 'პოპულარული',
    },
  },
  ru: {
    client: {
      label: 'Мне нужна помощь с проектом',
      title: 'Найти специалиста',
      description: 'Разместите проект и получите предложения от проверенных специалистов',
      cta: 'Начать',
    },
    pro: {
      label: 'Хочу предложить свои услуги',
      title: 'Стать специалистом',
      description: 'Присоединяйтесь и находите клиентов в вашем регионе',
      cta: 'Присоединиться',
      badge: 'Популярное',
    },
  },
};

/**
 * UserTypeSelector - Split screen design with illustrations
 */
export default function UserTypeSelector({
  onSelect,
  locale = 'en',
  className = '',
}: UserTypeSelectorProps) {
  const t = translations[locale];

  return (
    <div className={`${className}`}>
      {/* Mobile Layout - Stacked */}
      <div className="md:hidden space-y-4">
        {/* Client Card */}
        <button
          onClick={() => onSelect('client')}
          className="group w-full bg-white rounded-3xl border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
        >
          {/* Illustration */}
          <div className="relative h-40 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent_60%)]" />
            <Image
              src={ILLUSTRATIONS.client}
              alt=""
              fill
              className="object-contain object-center p-4 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Content */}
          <div className="p-5">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
              {t.client.label}
            </p>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {t.client.title}
            </h3>
            <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
              {t.client.description}
            </p>
            <div className="flex items-center gap-2 text-neutral-900 font-semibold group-hover:gap-3 transition-all">
              <span>{t.client.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Pro Card */}
        <button
          onClick={() => onSelect('pro')}
          className="group relative w-full bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#1a1a1a] rounded-3xl overflow-hidden text-left hover:shadow-xl hover:shadow-neutral-900/20 transition-all duration-300"
        >
          {/* Badge */}
          {t.pro.badge && (
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C4735B] text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
                <Sparkles className="w-3 h-3" />
                {t.pro.badge}
              </span>
            </div>
          )}

          {/* Illustration */}
          <div className="relative h-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(196,115,91,0.2),transparent_60%)]" />
            <Image
              src={ILLUSTRATIONS.pro}
              alt=""
              fill
              className="object-contain object-center p-4 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          
          {/* Content */}
          <div className="p-5 pt-0 relative z-10">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              {t.pro.label}
            </p>
            <h3 className="text-xl font-bold text-white mb-2">
              {t.pro.title}
            </h3>
            <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
              {t.pro.description}
            </p>
            <div className="flex items-center gap-2 text-[#C4735B] font-semibold group-hover:gap-3 transition-all">
              <span>{t.pro.cta}</span>
              <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        </button>
      </div>

      {/* Desktop Layout - Split Screen */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Client Side */}
        <button
          onClick={() => onSelect('client')}
          className="group relative bg-white rounded-3xl border-2 border-neutral-200 hover:border-neutral-300 overflow-hidden text-left transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
        >
          {/* Illustration */}
          <div className="relative h-56 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.08),transparent_50%)]" />
            <Image
              src={ILLUSTRATIONS.client}
              alt=""
              fill
              className="object-contain object-center p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              {t.client.label}
            </p>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              {t.client.title}
            </h3>
            <p className="text-neutral-500 mb-6 leading-relaxed">
              {t.client.description}
            </p>
            
            {/* CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-900 font-semibold group-hover:gap-3 transition-all">
                <span>{t.client.cta}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </button>

        {/* Pro Side */}
        <button
          onClick={() => onSelect('pro')}
          className="group relative bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#1a1a1a] rounded-3xl overflow-hidden text-left transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-900/40 hover:-translate-y-1"
        >
          {/* Background effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(196,115,91,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(196,115,91,0.1),transparent_50%)]" />

          {/* Badge */}
          {t.pro.badge && (
            <div className="absolute top-5 right-5 z-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C4735B] text-white text-xs font-bold shadow-lg shadow-[#C4735B]/30">
                <Sparkles className="w-3.5 h-3.5" />
                {t.pro.badge}
              </span>
            </div>
          )}

          {/* Illustration */}
          <div className="relative h-56 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent z-10" />
            <Image
              src={ILLUSTRATIONS.pro}
              alt=""
              fill
              className="object-contain object-center p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10 p-6 pt-0">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {t.pro.label}
            </p>
            <h3 className="text-2xl font-bold text-white mb-3">
              {t.pro.title}
            </h3>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              {t.pro.description}
            </p>
            
            {/* CTA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C4735B] font-semibold group-hover:gap-3 transition-all">
                <span>{t.pro.cta}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#C4735B] transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Hover glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#C4735B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useState } from 'react';
import {
  FileSearch,
  Database,
  Calculator,
  Scale,
  ArrowRight,
} from 'lucide-react';

const tools = [
  {
    id: 'analyzer',
    href: '/tools/analyzer',
    icon: FileSearch,
    accentColor: 'terracotta',
  },
  {
    id: 'prices',
    href: '/tools/prices',
    icon: Database,
    accentColor: 'forest',
  },
  {
    id: 'calculator',
    href: '/tools/calculator',
    icon: Calculator,
    accentColor: 'terracotta',
  },
  {
    id: 'compare',
    href: '/tools/compare',
    icon: Scale,
    accentColor: 'forest',
  },
];

const translations = {
  ka: {
    analyzer: {
      title: 'ანგარიშის ანალიზი',
      description: 'ატვირთე კონტრაქტორის ანგარიში და მიიღე AI-ით დეტალური ანალიზი',
      cta: 'ატვირთე ანგარიში',
      tag: 'AI ანალიზი',
    },
    prices: {
      title: 'ფასების ბაზა',
      description: 'მოძებნე 100+ სარემონტო სამუშაოს საბაზრო ფასები თბილისში',
      cta: 'ნახე ფასები',
      tag: '100+ პოზიცია',
    },
    calculator: {
      title: 'რემონტის კალკულატორი',
      description: 'გამოთვალე სავარაუდო ბიუჯეტი ბინის პარამეტრების მიხედვით',
      cta: 'გამოთვალე',
      tag: 'მყისიერი',
    },
    compare: {
      title: 'შეთავაზებების შედარება',
      description: 'შეადარე 5-მდე კონტრაქტორის შეთავაზება და იპოვე საუკეთესო',
      cta: 'შეადარე',
      tag: '5-მდე',
    },
  },
  en: {
    analyzer: {
      title: 'Estimate Analyzer',
      description: 'Upload a contractor estimate and get AI-powered detailed analysis',
      cta: 'Upload Estimate',
      tag: 'AI Analysis',
    },
    prices: {
      title: 'Price Database',
      description: 'Search 100+ renovation work market prices in Tbilisi',
      cta: 'View Prices',
      tag: '100+ Items',
    },
    calculator: {
      title: 'Renovation Calculator',
      description: 'Calculate estimated budget based on your apartment parameters',
      cta: 'Calculate',
      tag: 'Instant',
    },
    compare: {
      title: 'Compare Estimates',
      description: 'Compare up to 5 contractor quotes and find the best deal',
      cta: 'Compare',
      tag: 'Up to 5',
    },
  },
  ru: {
    analyzer: {
      title: 'Анализ сметы',
      description: 'Загрузите смету подрядчика и получите детальный AI-анализ',
      cta: 'Загрузить смету',
      tag: 'AI анализ',
    },
    prices: {
      title: 'База цен',
      description: 'Поиск 100+ рыночных цен на ремонтные работы в Тбилиси',
      cta: 'Смотреть цены',
      tag: '100+ позиций',
    },
    calculator: {
      title: 'Калькулятор ремонта',
      description: 'Рассчитайте примерный бюджет по параметрам квартиры',
      cta: 'Рассчитать',
      tag: 'Мгновенно',
    },
    compare: {
      title: 'Сравнение предложений',
      description: 'Сравните до 5 предложений подрядчиков и найдите лучшее',
      cta: 'Сравнить',
      tag: 'До 5',
    },
  },
};

export default function ToolsPage() {
  const { locale } = useLanguage();
  const t = translations[locale as keyof typeof translations] || translations.ka;
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#0a0a0a]">
      {/* Tools Grid */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((tool) => {
              const toolT = t[tool.id as keyof typeof t] as {
                title: string;
                description: string;
                cta: string;
                tag: string;
              };
              const isHovered = hoveredTool === tool.id;
              const Icon = tool.icon;
              const isTerracotta = tool.accentColor === 'terracotta';

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative block"
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <div
                    className={`
                      relative overflow-hidden rounded-2xl p-5 sm:p-6
                      bg-white dark:bg-neutral-900
                      border border-neutral-200 dark:border-neutral-800
                      transition-all duration-300 ease-out
                      hover:border-neutral-300 dark:hover:border-neutral-700
                      hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-none
                      ${isHovered ? '-translate-y-1' : ''}
                    `}
                  >
                    {/* Top accent line on hover */}
                    <div
                      className={`
                        absolute top-0 left-0 right-0 h-0.5
                        ${isTerracotta ? 'bg-terracotta-500' : 'bg-forest-500'}
                        transform origin-left transition-transform duration-300
                        ${isHovered ? 'scale-x-100' : 'scale-x-0'}
                      `}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon & Tag Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`
                            w-12 h-12 rounded-xl flex items-center justify-center
                            transition-all duration-300
                            ${isTerracotta
                              ? 'bg-terracotta-100 dark:bg-terracotta-900/30'
                              : 'bg-forest-100 dark:bg-forest-900/30'
                            }
                            ${isHovered ? 'scale-110' : ''}
                          `}
                        >
                          <Icon
                            className={`w-6 h-6 ${isTerracotta ? 'text-terracotta-600 dark:text-terracotta-400' : 'text-forest-600 dark:text-forest-400'}`}
                            strokeWidth={1.5}
                          />
                        </div>

                        <span
                          className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${isTerracotta
                              ? 'bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-400'
                              : 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400'
                            }
                          `}
                        >
                          {toolT.tag}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        {toolT.title}
                      </h2>

                      {/* Description */}
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed line-clamp-2">
                        {toolT.description}
                      </p>

                      {/* CTA */}
                      <div
                        className={`
                          inline-flex items-center gap-2 text-sm font-medium
                          transition-all duration-300
                          ${isTerracotta
                            ? 'text-terracotta-600 dark:text-terracotta-400'
                            : 'text-forest-600 dark:text-forest-400'
                          }
                        `}
                      >
                        <span>{toolT.cta}</span>
                        <ArrowRight
                          className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
                          strokeWidth={2}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

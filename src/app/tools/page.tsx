"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Calculator,
  Database,
  FileSearch,
  Scale,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const tools = [
  {
    id: "analyzer",
    href: "/tools/analyzer",
    icon: FileSearch,
    accentColor: "terracotta",
    featured: true,
  },
  {
    id: "prices",
    href: "/tools/prices",
    icon: Database,
    accentColor: "forest",
    featured: false,
  },
  {
    id: "calculator",
    href: "/tools/calculator",
    icon: Calculator,
    accentColor: "terracotta",
    featured: false,
  },
  {
    id: "compare",
    href: "/tools/compare",
    icon: Scale,
    accentColor: "forest",
    featured: false,
  },
];

const translations = {
  ka: {
    pageTitle: "სარემონტო ინსტრუმენტები",
    pageSubtitle:
      "უფასო ინსტრუმენტები რემონტის დაგეგმვისა და ბიუჯეტის შეფასებისთვის",
    featuredBadge: "პოპულარული",
    analyzer: {
      title: "ანგარიშის ანალიზი",
      description:
        "ატვირთე კონტრაქტორის ანგარიში და მიიღე AI-ით დეტალური ანალიზი. გაიგე რა არის სამართლიანი ფასი და რა - არა.",
      cta: "ატვირთე ანგარიში",
      tag: "AI ანალიზი",
    },
    prices: {
      title: "ფასების ბაზა",
      description:
        "მოძებნე 100+ სარემონტო სამუშაოს საბაზრო ფასები თბილისში. განახლებული ფასები 2024 წლისთვის.",
      cta: "ნახე ფასები",
      tag: "100+ პოზიცია",
    },
    calculator: {
      title: "რემონტის კალკულატორი",
      description:
        "გამოთვალე სავარაუდო ბიუჯეტი ბინის პარამეტრების მიხედვით. მიიღე დეტალური შეფასება წუთებში.",
      cta: "გამოთვალე",
      tag: "მყისიერი",
    },
    compare: {
      title: "შეთავაზებების შედარება",
      description:
        "შეადარე 5-მდე კონტრაქტორის შეთავაზება და იპოვე საუკეთესო. ნახე დეტალური შედარება.",
      cta: "შეადარე",
      tag: "5-მდე",
    },
  },
  en: {
    pageTitle: "Renovation Tools",
    pageSubtitle:
      "Free tools to help you plan your renovation and estimate your budget",
    featuredBadge: "Popular",
    analyzer: {
      title: "Estimate Analyzer",
      description:
        "Upload a contractor estimate and get AI-powered detailed analysis. Find out what's a fair price and what's not.",
      cta: "Upload Estimate",
      tag: "AI Analysis",
    },
    prices: {
      title: "Price Database",
      description:
        "Search 100+ renovation work market prices in Tbilisi. Updated prices for 2024.",
      cta: "View Prices",
      tag: "100+ Items",
    },
    calculator: {
      title: "Renovation Calculator",
      description:
        "Calculate estimated budget based on your apartment parameters. Get detailed estimates in minutes.",
      cta: "Calculate",
      tag: "Instant",
    },
    compare: {
      title: "Compare Estimates",
      description:
        "Compare up to 5 contractor quotes and find the best deal. See detailed side-by-side comparison.",
      cta: "Compare",
      tag: "Up to 5",
    },
  },
  ru: {
    pageTitle: "Инструменты для ремонта",
    pageSubtitle:
      "Бесплатные инструменты для планирования ремонта и оценки бюджета",
    featuredBadge: "Популярный",
    analyzer: {
      title: "Анализ сметы",
      description:
        "Загрузите смету подрядчика и получите детальный AI-анализ. Узнайте, что справедливая цена, а что нет.",
      cta: "Загрузить смету",
      tag: "AI анализ",
    },
    prices: {
      title: "База цен",
      description:
        "Поиск 100+ рыночных цен на ремонтные работы в Тбилиси. Актуальные цены на 2024 год.",
      cta: "Смотреть цены",
      tag: "100+ позиций",
    },
    calculator: {
      title: "Калькулятор ремонта",
      description:
        "Рассчитайте примерный бюджет по параметрам квартиры. Получите детальную оценку за минуты.",
      cta: "Рассчитать",
      tag: "Мгновенно",
    },
    compare: {
      title: "Сравнение предложений",
      description:
        "Сравните до 5 предложений подрядчиков и найдите лучшее. Смотрите детальное сравнение.",
      cta: "Сравнить",
      tag: "До 5",
    },
  },
};

export default function ToolsPage() {
  const { locale } = useLanguage();
  const t =
    translations[locale as keyof typeof translations] || translations.ka;
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-terracotta-500/5 dark:bg-terracotta-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-forest-500/5 dark:bg-forest-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative px-4 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-5xl text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 shadow-lg shadow-terracotta-500/25">
              <Wrench className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
              {t.pageTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t.pageSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Featured Tool - Full Width */}
          {tools
            .filter((tool) => tool.featured)
            .map((tool) => {
              const toolT = t[tool.id as keyof typeof t] as {
                title: string;
                description: string;
                cta: string;
                tag: string;
              };
              const isHovered = hoveredTool === tool.id;
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative block mb-6"
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  <div
                    className={`
                    relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10
                    bg-gradient-to-br from-terracotta-500 to-terracotta-600
                    transition-all duration-500 ease-out
                    hover:shadow-2xl hover:shadow-terracotta-500/25
                    ${isHovered ? "-translate-y-1 scale-[1.01]" : ""}
                  `}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                      {/* Icon */}
                      <div
                        className={`
                        w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
                        bg-white/20 backdrop-blur-sm
                        transition-transform duration-300
                        ${isHovered ? "scale-110 rotate-3" : ""}
                      `}
                      >
                        <Icon
                          className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                          strokeWidth={1.5}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            {toolT.title}
                          </h2>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                            <Sparkles className="w-3 h-3" />
                            {t.featuredBadge}
                          </span>
                        </div>
                        <p className="text-base sm:text-lg text-white/90 mb-4 max-w-2xl">
                          {toolT.description}
                        </p>
                        <div className="inline-flex items-center gap-2 text-white font-semibold">
                          <span>{toolT.cta}</span>
                          <ArrowRight
                            className={`w-5 h-5 transition-transform duration-300 ${isHovered ? "translate-x-2" : ""}`}
                            strokeWidth={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

          {/* Other Tools - Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools
              .filter((tool) => !tool.featured)
              .map((tool) => {
                const toolT = t[tool.id as keyof typeof t] as {
                  title: string;
                  description: string;
                  cta: string;
                  tag: string;
                };
                const isHovered = hoveredTool === tool.id;
                const Icon = tool.icon;
                const isTerracotta = tool.accentColor === "terracotta";

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
                      relative overflow-hidden rounded-2xl p-5 sm:p-6 h-full
                      bg-white dark:bg-dark-card
                      border border-neutral-200/80 dark:border-dark-border
                      transition-all duration-300 ease-out
                      hover:border-neutral-300 dark:hover:border-dark-border-subtle
                      hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-black/20
                      ${isHovered ? "-translate-y-1" : ""}
                    `}
                    >
                      {/* Top accent line */}
                      <div
                        className={`
                        absolute top-0 left-0 right-0 h-1
                        ${isTerracotta ? "bg-gradient-to-r from-terracotta-400 to-terracotta-500" : "bg-gradient-to-r from-forest-400 to-forest-500"}
                        transform origin-left transition-transform duration-300
                        ${isHovered ? "scale-x-100" : "scale-x-0"}
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
                            ${
                              isTerracotta
                                ? "bg-terracotta-100 dark:bg-terracotta-900/30"
                                : "bg-forest-100 dark:bg-forest-900/30"
                            }
                            ${isHovered ? "scale-110 rotate-3" : ""}
                          `}
                          >
                            <Icon
                              className={`w-6 h-6 ${isTerracotta ? "text-terracotta-600 dark:text-terracotta-400" : "text-forest-600 dark:text-forest-400"}`}
                              strokeWidth={1.5}
                            />
                          </div>

                          <span
                            className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                            ${
                              isTerracotta
                                ? "bg-terracotta-100 text-terracotta-700 dark:bg-terracotta-900/30 dark:text-terracotta-400"
                                : "bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400"
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
                          inline-flex items-center gap-2 text-sm font-semibold
                          transition-all duration-300
                          ${
                            isTerracotta
                              ? "text-terracotta-600 dark:text-terracotta-400"
                              : "text-forest-600 dark:text-forest-400"
                          }
                        `}
                        >
                          <span>{toolT.cta}</span>
                          <ArrowRight
                            className={`w-4 h-4 transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
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

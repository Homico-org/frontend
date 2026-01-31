"use client";

import Header from "@/components/common/Header";
import MobileBottomNav from "@/components/common/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ACCENT_COLOR } from "@/constants/theme";
import {
  ArrowRight,
  Briefcase,
  Calculator,
  Database,
  FileSearch,
  Images,
  Plus,
  Scale,
  Sparkles,
  Users,
  Wrench
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const tools = [
  {
    id: "analyzer",
    href: "/tools/analyzer",
    icon: FileSearch,
    accentColor: "terracotta",
    featured: true,
    gradient: "from-[#C4735B] via-[#D4836B] to-[#B4634B]",
  },
  {
    id: "prices",
    href: "/tools/prices",
    icon: Database,
    accentColor: "forest",
    featured: false,
    gradient: "from-[#2D5A47] via-[#3D6A57] to-[#1D4A37]",
  },
  {
    id: "calculator",
    href: "/tools/calculator",
    icon: Calculator,
    accentColor: "terracotta",
    featured: false,
    gradient: "from-[#C4735B] via-[#D4836B] to-[#B4634B]",
  },
  {
    id: "compare",
    href: "/tools/compare",
    icon: Scale,
    accentColor: "forest",
    featured: false,
    gradient: "from-[#2D5A47] via-[#3D6A57] to-[#1D4A37]",
  },
];

// Sidebar navigation tabs
const TABS = [
  {
    key: "jobs",
    route: "/browse/jobs",
    label: "Jobs",
    labelKa: "სამუშაო",
    labelRu: "Работы",
    icon: Briefcase,
    showFor: "pro" as const,
  },
  {
    key: "portfolio",
    route: "/browse/portfolio",
    label: "Portfolio",
    labelKa: "ნამუშევრები",
    labelRu: "Портфолио",
    icon: Images,
    showFor: "all" as const,
  },
  {
    key: "professionals",
    route: "/browse/professionals",
    label: "Professionals",
    labelKa: "სპეციალისტები",
    labelRu: "Специалисты",
    icon: Users,
    showFor: "all" as const,
  },
];

export default function ToolsPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isPro = user?.role === "pro" || user?.role === "admin";
  const visibleTabs = TABS.filter(
    (tab) => tab.showFor === "all" || (tab.showFor === "pro" && isPro)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a] max-w-full">
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a]">
          {/* Post a Job Button */}
          <div className="px-3 pt-4 pb-2">
            <Link
              href="/post-job"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: ACCENT_COLOR }}
            >
              <Plus className="w-4 h-4" />
              <span>{t("browse.postAJob")}</span>
            </Link>
          </div>

          {/* BROWSE Label */}
          <div className="px-5 pt-3 pb-2">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              {t("browse.browse")}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 pb-4">
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Icon className="w-5 h-5" />
                    <span>
                      {locale === "ka"
                        ? tab.labelKa
                        : locale === "ru"
                          ? tab.labelRu
                          : tab.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Tools Section - Active */}
          <div className="px-3 pb-4">
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3 mb-2">
              <span className="px-3 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                {t("browse.tools")}
              </span>
            </div>
            <Link
              href="/tools"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: `${ACCENT_COLOR}15`,
                color: ACCENT_COLOR,
              }}
            >
              <Wrench className="w-5 h-5" />
              <span>
                {locale === "ka"
                  ? "კალკულატორები"
                  : locale === "ru"
                    ? "Инструменты"
                    : "Tools"}
              </span>
            </Link>
          </div>
        </aside>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white dark:bg-neutral-950">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2 overflow-x-auto scrollbar-hide">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.route}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800"
                  >
                    <Icon className="w-4 h-4" />
                    <span>
                      {locale === "ka"
                        ? tab.labelKa
                        : locale === "ru"
                          ? tab.labelRu
                          : tab.label}
                    </span>
                  </Link>
                );
              })}
              {/* Tools tab - active */}
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 text-white shadow-sm"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                <Wrench className="w-4 h-4" />
                <span>
                  {locale === "ka"
                    ? "კალკულატორები"
                    : locale === "ru"
                      ? "Инструменты"
                      : "Tools"}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Featured Tool - Full Width Card */}
          {tools
            .filter((tool) => tool.featured)
            .map((tool) => {
              const toolT = {
                title: t(`tools.home.${tool.id}.title`),
                description: t(`tools.home.${tool.id}.description`),
                cta: t(`tools.home.${tool.id}.cta`),
                tag: t(`tools.home.${tool.id}.tag`),
              };
              const isHovered = hoveredTool === tool.id;
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={`group relative block mb-4 sm:mb-8 transition-all duration-700 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                >
                  {/* Outer glow on hover - desktop only */}
                  <div
                    className={`hidden sm:block absolute -inset-1 rounded-[28px] bg-gradient-to-r ${tool.gradient} opacity-0 blur-xl transition-opacity duration-500 ${isHovered ? 'opacity-30' : ''}`}
                  />

                  <div
                    className={`
                      relative overflow-hidden rounded-2xl sm:rounded-3xl
                      bg-gradient-to-br ${tool.gradient}
                      transition-all duration-500 ease-out
                      shadow-lg shadow-[#C4735B]/20
                      ${isHovered ? 'sm:-translate-y-1 sm:shadow-2xl sm:shadow-[#C4735B]/30' : ''}
                    `}
                  >
                    {/* Glass overlay pattern - desktop only */}
                    <div className="hidden sm:block absolute inset-0 opacity-30">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `
                            radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)
                          `,
                        }}
                      />
                    </div>

                    {/* Animated shine effect - desktop only */}
                    <div
                      className={`hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 ${isHovered ? 'translate-x-full' : ''}`}
                    />

                    {/* Floating particles - desktop only */}
                    <div className="hidden sm:block absolute top-8 right-12 w-2 h-2 rounded-full bg-white/20 animate-float" />
                    <div className="hidden sm:block absolute bottom-12 right-24 w-1.5 h-1.5 rounded-full bg-white/15 animate-float-delayed" />
                    <div className="hidden sm:block absolute top-1/2 right-8 w-1 h-1 rounded-full bg-white/25 animate-float-slow" />

                    <div className="relative z-10 p-4 sm:p-9 lg:p-11">
                      <div className="flex items-center gap-3 sm:gap-6 lg:gap-8">
                        {/* Icon with glassmorphism */}
                        <div
                          className={`
                            w-14 h-14 sm:w-[88px] sm:h-[88px] rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0
                            bg-white/15 backdrop-blur-md border border-white/20
                            shadow-inner shadow-white/10
                            transition-all duration-500
                            ${isHovered ? 'sm:scale-110 sm:rotate-3 sm:bg-white/20' : ''}
                          `}
                        >
                          <Icon
                            className="w-7 h-7 sm:w-11 sm:h-11 text-white drop-shadow-lg"
                            strokeWidth={1.5}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-3">
                            <h2 className="text-lg sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
                              {toolT.title}
                            </h2>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/10 shadow-lg">
                              <Sparkles className="w-3.5 h-3.5" />
                              {t("tools.home.featuredBadge")}
                            </span>
                          </div>
                          <p className="text-xs sm:text-lg text-white/90 mb-2.5 sm:mb-5 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {toolT.description}
                          </p>

                          {/* CTA Button */}
                          <div
                            className={`
                              inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl
                              bg-white/20 backdrop-blur-sm border border-white/20
                              text-white text-sm sm:text-base font-semibold
                              transition-all duration-300
                              ${isHovered ? 'bg-white/30 sm:gap-4' : ''}
                            `}
                          >
                            <span>{toolT.cta}</span>
                            <ArrowRight
                              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}
                              strokeWidth={2}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

          {/* Other Tools - Grid with glassmorphism cards */}
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
            {tools
              .filter((tool) => !tool.featured)
              .map((tool, index) => {
                const toolT = {
                  title: t(`tools.home.${tool.id}.title`),
                  description: t(`tools.home.${tool.id}.description`),
                  cta: t(`tools.home.${tool.id}.cta`),
                  tag: t(`tools.home.${tool.id}.tag`),
                };
                const isHovered = hoveredTool === tool.id;
                const Icon = tool.icon;
                const isTerracotta = tool.accentColor === "terracotta";
                const accentColor = isTerracotta ? '#C4735B' : '#2D5A47';

                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className={`group relative block transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    {/* Outer glow on hover - desktop only */}
                    <div
                      className={`hidden sm:block absolute -inset-0.5 rounded-[22px] bg-gradient-to-br ${tool.gradient} opacity-0 blur-lg transition-all duration-500 ${isHovered ? 'opacity-40' : ''}`}
                    />

                    <div
                      className={`
                        relative overflow-hidden rounded-xl sm:rounded-2xl h-full
                        bg-white dark:bg-neutral-900
                        border border-neutral-200/60 dark:border-neutral-800/60
                        transition-all duration-500 ease-out
                        shadow-sm sm:shadow-md
                        ${isHovered ? 'sm:-translate-y-1.5 sm:shadow-xl sm:border-neutral-300/80 dark:sm:border-neutral-700/80' : ''}
                      `}
                    >
                      {/* Top gradient accent bar */}
                      <div
                        className={`
                          absolute top-0 left-0 right-0 h-0.5 sm:h-1
                          bg-gradient-to-r ${tool.gradient}
                        `}
                      />

                      {/* Corner accent glow - desktop only */}
                      <div
                        className={`hidden sm:block absolute -top-12 -right-12 w-32 h-32 rounded-full transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)` }}
                      />

                      {/* Content */}
                      <div className="relative z-10 p-2.5 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        {/* Icon */}
                        <div
                          className={`
                            w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4
                            transition-all duration-500
                            border
                            ${isTerracotta
                              ? 'bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 border-[#C4735B]/20 dark:from-[#C4735B]/20 dark:to-[#C4735B]/10 dark:border-[#C4735B]/30'
                              : 'bg-gradient-to-br from-[#2D5A47]/10 to-[#2D5A47]/5 border-[#2D5A47]/20 dark:from-[#2D5A47]/20 dark:to-[#2D5A47]/10 dark:border-[#2D5A47]/30'
                            }
                            ${isHovered ? 'sm:scale-110 sm:rotate-6' : ''}
                          `}
                        >
                          <Icon
                            className={`w-5 h-5 sm:w-7 sm:h-7 ${isTerracotta ? 'text-[#C4735B]' : 'text-[#2D5A47]'}`}
                            strokeWidth={1.5}
                          />
                        </div>

                        {/* Title */}
                        <h2 className={`text-[11px] sm:text-xl font-bold text-neutral-900 dark:text-white mb-0 sm:mb-2.5 transition-colors duration-300 leading-tight ${isHovered ? isTerracotta ? 'sm:text-[#C4735B]' : 'sm:text-[#2D5A47]' : ''}`}>
                          {toolT.title}
                        </h2>

                        {/* Description - desktop only */}
                        <p className="hidden sm:block text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed line-clamp-2">
                          {toolT.description}
                        </p>

                        {/* Tag - desktop only */}
                        <span
                          className={`
                            hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold
                            transition-all duration-300
                            ${isTerracotta
                              ? 'bg-[#C4735B]/10 text-[#C4735B] dark:bg-[#C4735B]/20 dark:text-[#D4836B]'
                              : 'bg-[#2D5A47]/10 text-[#2D5A47] dark:bg-[#2D5A47]/20 dark:text-[#4D7A67]'
                            }
                          `}
                        >
                          {toolT.tag}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-15px);
            opacity: 0.3;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-25px) scale(1.2);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          animation-delay: 2s;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

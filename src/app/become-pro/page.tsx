"use client";

import Header, { HeaderSpacer } from "@/components/common/Header";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  DollarSign,
  Shield,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BecomeProPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, pick: pickLang } = useLanguage();
  const toast = useToast();

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Already a pro - redirect
  useEffect(() => {
    if (!authLoading && user?.role === "pro") {
      router.replace("/pro/profile-setup");
    }
  }, [authLoading, user?.role, router]);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await api.post("/users/upgrade-to-pro", {});

      if (response.data?.access_token && response.data?.user) {
        login(response.data.access_token, {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          avatar: response.data.user.avatar,
          city: response.data.user.city,
          phone: response.data.user.phone,
          selectedCategories: response.data.user.selectedCategories,
          accountType: response.data.user.accountType,
        });
      }

      toast.success(t("becomePro.upgradeSuccess"));
      router.push("/pro/profile-setup");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || t("common.error"));
    } finally {
      setIsUpgrading(false);
    }
  };

  const pick = (en: string, ka: string, ru: string) => pickLang({ en, ka, ru });

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  // 4 most compelling benefits, condensed into single-line pills for the
  // one-viewport layout. Drop "Get Reviews" and "Choose Your Area" - both
  // implied by the platform basics and dilute the focal four.
  const benefits = [
    {
      icon: <Users className="w-4 h-4" strokeWidth={2} />,
      label: pick("Find clients", "იპოვე კლიენტები", "Найдите клиентов"),
    },
    {
      icon: <DollarSign className="w-4 h-4" strokeWidth={2} />,
      label: pick("Set your prices", "დააწესე ფასები", "Свои цены"),
    },
    {
      icon: <Camera className="w-4 h-4" strokeWidth={2} />,
      label: pick("Show portfolio", "აჩვენე პორტფოლიო", "Покажите работу"),
    },
    {
      icon: <Shield className="w-4 h-4" strokeWidth={2} />,
      label: pick("Get verified", "გადამოწმდი", "Пройдите проверку"),
    },
  ];

  return (
    <>
      <Header />
      <HeaderSpacer />
      {/* Single-viewport hero with photo bg + dark overlay + white text.
          Matches the landing hero treatment. Photo path is the literal
          filename on disk ("became-pro" not "become-pro" - keeping as-is to
          match the asset). */}
      <section
        className="relative isolate overflow-hidden flex items-center"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Warm-tinted gradient base - visible if photo missing */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--hm-brand-50) 0%, var(--hm-bg-elevated) 45%, var(--hm-brand-50) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--hm-brand-500) 28%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--hm-brand-300) 35%, transparent) 0%, transparent 70%)",
            }}
          />
          {/* Pro recruitment photo - drop a sharper / different shot at this
              path to swap. The misspelled filename matches the asset on disk. */}
          <Image
            src="/landing/became-pro.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover"
            aria-hidden="true"
          />
          {/* Dark overlay for white-text legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,18,14,0.65) 0%, rgba(20,18,14,0.5) 50%, rgba(20,18,14,0.7) 100%)",
            }}
          />
        </div>

        {/* Centered content - sized to fit one viewport without scroll */}
        <div
          className={`relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Brand-colored icon medallion */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[#F06B43] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--hm-brand-500)]/30">
            <Briefcase className="w-6 h-6 text-white" strokeWidth={2} />
          </div>

          <h1 className="text-[28px] sm:text-[40px] lg:text-[48px] font-serif font-medium tracking-[-0.01em] text-white leading-[1.1]">
            {pick(
              "Grow your renovation business",
              "გაზარდეთ თქვენი სარემონტო ბიზნესი",
              "Развивайте свой ремонтный бизнес",
            )}
          </h1>

          <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] text-white/85 leading-relaxed max-w-xl mx-auto">
            {pick(
              "Get matched with Tbilisi homeowners who need your skills. Free to join - pay only when you take a job.",
              "დაუკავშირდით სახლის მფლობელებს თბილისში, რომლებსაც თქვენი უნარები სჭირდებათ. უფასო რეგისტრაცია - იხდით მხოლოდ მაშინ, როცა სამუშაოს იღებთ.",
              "Получайте заказы от владельцев жилья в Тбилиси, которым нужны ваши навыки. Регистрация бесплатна - платите только когда берёте заказ.",
            )}
          </p>

          {/* Pricing transparency strip - addresses the #1 pro question */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] sm:text-[13px] text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
                strokeWidth={2.5}
              />
              {pick(
                "Free to join",
                "უფასო რეგისტრაცია",
                "Бесплатная регистрация",
              )}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
                strokeWidth={2.5}
              />
              {pick(
                "No monthly fees",
                "ყოველთვიური საფასურის გარეშე",
                "Без ежемесячной платы",
              )}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Check
                className="w-3.5 h-3.5 text-[var(--hm-brand-300)]"
                strokeWidth={2.5}
              />
              {pick(
                "You keep your prices",
                "თქვენ ადგენთ ფასებს",
                "Вы устанавливаете цены",
              )}
            </span>
          </div>

          {/* 4 inline benefit pills - TaskRabbit-style icon row */}
          <div className="mt-7 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-xl mx-auto">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/95 text-[var(--hm-brand-500)]">
                  {b.icon}
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-white text-center leading-tight">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA - register link primary, sign-in secondary */}
          <div className="mt-7 sm:mt-9">
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="px-8 inline-flex items-center gap-2"
              >
                {isUpgrading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    {pick("Start setup", "დაწყება", "Начать")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  asChild
                  className="px-8 inline-flex items-center gap-2"
                >
                  <Link href="/register/professional">
                    {pick(
                      "Create pro account",
                      "შექმენით ოსტატის ანგარიში",
                      "Создать аккаунт мастера",
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => openLoginModal()}
                  className="text-[13px] text-white/85 hover:text-white transition-colors"
                >
                  {pick(
                    "Already have an account? Sign in",
                    "უკვე გაქვთ ანგარიში? შესვლა",
                    "Уже есть аккаунт? Войти",
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

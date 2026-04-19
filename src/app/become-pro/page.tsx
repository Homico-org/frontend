"use client";

import AuthGuard from "@/components/common/AuthGuard";
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
  CheckCircle2,
  DollarSign,
  MapPin,
  Shield,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
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

  // Already a pro — redirect
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t("common.error"));
    } finally {
      setIsUpgrading(false);
    }
  };

  const pick = (en: string, ka: string, ru: string) => pickLang({ en, ka, ru });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--hm-bg-page)" }}>
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  const features = [
    {
      icon: <Users className="w-5 h-5" />,
      title: pick("Find Clients", "მოიძიე კლიენტები", "Найдите клиентов"),
      desc: pick(
        "Get matched with clients looking for your services",
        "დაკავშირდი კლიენტებთან, რომლებსაც შენი სერვისები სჭირდებათ",
        "Найдите клиентов, которым нужны ваши услуги"
      ),
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: pick("Set Your Prices", "დააწესე შენი ფასები", "Установите свои цены"),
      desc: pick(
        "Set per-service pricing with market insights",
        "დააყენე ფასი თითოეულ სერვისზე საბაზრო ფასების მიხედვით",
        "Установите цены с учетом рыночных данных"
      ),
    },
    {
      icon: <Camera className="w-5 h-5" />,
      title: pick("Show Your Work", "აჩვენე ნამუშევრები", "Покажите свою работу"),
      desc: pick(
        "Build a portfolio with before/after photos",
        "შექმენი პორტფოლიო სანამდე/შემდეგ ფოტოებით",
        "Создайте портфолио с фото до/после"
      ),
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: pick("Get Reviews", "მიიღე შეფასებები", "Получайте отзывы"),
      desc: pick(
        "Clients review your work after each booking",
        "კლიენტები აფასებენ შენს მუშაობას ყოველი ჯავშნის შემდეग",
        "Клиенты оценивают вашу работу после каждого бронирования"
      ),
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: pick("Choose Your Area", "აირჩიე მომსახურების ზონა", "Выберите зону"),
      desc: pick(
        "Set service areas and get local job matches",
        "მიუთითე მომსახურების ზონები და მიიღე ლოკალური სამუშაოები",
        "Укажите зоны обслуживания и получайте местные заказы"
      ),
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: pick("Get Verified", "გახდი ვერიფიცირებული", "Пройдите верификацию"),
      desc: pick(
        "Verified badge builds trust with clients",
        "ვერიფიცირებული ბეჯი ზრდის კლიენტების ნდობას",
        "Значок верификации повышает доверие клиентов"
      ),
    },
  ];

  return (
    <>
      <Header />
      <HeaderSpacer />
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-16">
          {/* Hero */}
          <div
            className={`text-center mb-10 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[#F06B43] flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{ color: "var(--hm-fg-primary)" }}
            >
              {pick(
                "Become a Professional",
                "გახდი სპეციალისტი",
                "Станьте специалистом"
              )}
            </h1>
            <p
              className="text-base sm:text-lg max-w-md mx-auto"
              style={{ color: "var(--hm-fg-secondary)" }}
            >
              {pick(
                "Join Homico and start finding clients for your services",
                "შემოგვიერთდი და იპოვე კლიენტები შენი სერვისებისთვის",
                "Присоединяйтесь и находите клиентов для ваших услуг"
              )}
            </p>
          </div>

          {/* Features grid */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: "var(--hm-bg-elevated)",
                  border: "1px solid var(--hm-border-subtle)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(239,78,36,0.1)", color: 'var(--hm-brand-500)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--hm-fg-primary)" }}>
                    {f.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--hm-fg-secondary)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div
            className={`mb-10 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h2
              className="text-lg font-bold text-center mb-5"
              style={{ color: "var(--hm-fg-primary)" }}
            >
              {pick("How it works", "როგორ მუშაობს", "Как это работает")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { num: "1", text: pick("Upgrade your account", "გააქტიურე ანგარიში", "Активируйте аккаунт") },
                { num: "2", text: pick("Set up services & prices", "დაამატე სერვისები და ფასები", "Настройте услуги и цены") },
                { num: "3", text: pick("Start getting bookings", "დაიწყე ჯავშნების მიღება", "Начните получать заказы") },
              ].map((step) => (
                <div
                  key={step.num}
                  className="flex-1 flex items-center sm:flex-col sm:items-center gap-3 sm:gap-2 p-4 rounded-xl text-center"
                  style={{
                    backgroundColor: "var(--hm-bg-elevated)",
                    border: "1px solid var(--hm-border-subtle)",
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--hm-brand-500)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {step.num}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--hm-fg-primary)" }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            className={`text-center transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'var(--hm-brand-500)' }}
            >
              {isUpgrading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  {isAuthenticated
                    ? pick("Start Setup →", "დაწყება →", "Начать →")
                    : pick("Sign In to Start", "შედი დასაწყებად", "Войдите чтобы начать")}
                </>
              )}
            </button>
            <p className="text-xs mt-3" style={{ color: "var(--hm-fg-muted)" }}>
              {pick("Free to join. No monthly fees.", "უფასოა. ყოველთვიური გადასახადი არ არის.", "Бесплатно. Без ежемесячных платежей.")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

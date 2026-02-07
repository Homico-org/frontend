"use client";

import AvatarCropper from "@/components/common/AvatarCropper";
import BackButton from "@/components/common/BackButton";
import Header, { HeaderSpacer } from "@/components/common/Header";
import AboutStep from "@/components/pro/steps/AboutStep";
import CategoriesStep from "@/components/pro/steps/CategoriesStep";
import ProjectsStep, {
  PortfolioProject,
} from "@/components/pro/steps/ProjectsStep";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Facebook,
  FileText,
  Globe,
  Images,
  Instagram,
  Linkedin,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Homico Terracotta Color Palette
const TERRACOTTA = {
  primary: "#C4735B",
  light: "#E8A593",
  warm: "#F5DCD4",
  bg: "#FDF8F6",
  accent: "#D98B74",
};

type Step = "intro" | "category" | "about" | "contact" | "projects" | "review";

const STEPS: {
  id: Step;
  title: { en: string; ka: string; ru: string };
  icon: React.ReactNode;
}[] = [
  {
    id: "category",
    title: {
      en: "Specialty",
      ka: "აირჩიე შენი სპეციალობა",
      ru: "Специальность",
    },
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    id: "about",
    title: {
      en: "About You",
      ka: "შეავსე შენს შესახებ ინფორმაცია",
      ru: "О вас",
    },
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "contact",
    title: {
      en: "Contact",
      ka: "შეავსე შენს საკონტაქტო ინფორმაცია",
      ru: "Контакты",
    },
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    id: "projects",
    title: { en: "Portfolio", ka: "დაამატე შენი ნამუშევრები", ru: "Портфолио" },
    icon: <Images className="w-4 h-4" />,
  },
  {
    id: "review",
    title: { en: "Review", ka: "გადახედე და გახდი სპეციალისტი", ru: "Обзор" },
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  renovation: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
      />
    </svg>
  ),
  design: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  ),
  architecture: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  services: (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
};

export default function BecomeProPage() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isAuthenticated,
    login,
    updateUser,
  } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const { categories } = useCategories();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Category state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [customServices, setCustomServices] = useState<string[]>([]);

  // About state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  // Contact state
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");

  // Projects state
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProject[]
  >([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect if not logged in or already a pro
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        openLoginModal("/become-pro");
      } else if (user?.role === "pro") {
        router.push("/jobs");
      }
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  // Get current step index
  const getCurrentStepIndex = () =>
    STEPS.findIndex((s) => s.id === currentStep);

  // Validation
  const validation = {
    category: selectedCategories.length > 0,
    subcategory: selectedSubcategories.length > 0 || customServices.length > 0,
    avatar: !!avatarPreview,
    bio: bio.trim().length >= 20,
    experience: !!yearsExperience && parseInt(yearsExperience) >= 0,
  };

  const canProceed = () => {
    switch (currentStep) {
      case "intro":
        return true;
      case "category":
        return validation.category && validation.subcategory;
      case "about":
        return validation.avatar && validation.bio && validation.experience;
      case "contact":
        return true; // Contact is optional
      case "projects":
        return true; // Projects are optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentStep === "intro") {
      setCurrentStep("category");
    } else if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentStep === "category") {
      setCurrentStep("intro");
    } else if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const croppedDataUrl = reader.result as string;
      setAvatarPreview(croppedDataUrl);
      setShowCropper(false);
      setImageToCrop(null);
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");

      // Save registration data to session for profile setup
      sessionStorage.setItem(
        "proRegistrationData",
        JSON.stringify({
          categories: selectedCategories,
          subcategories: selectedSubcategories,
          customServices,
          yearsExperience,
          bio,
          avatar: avatarPreview,
          whatsapp,
          telegram,
          instagram,
          facebook,
          linkedin,
          website,
          portfolioProjects,
        })
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/upgrade-to-pro`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            selectedCategories,
            selectedSubcategories,
            bio,
            yearsExperience: parseInt(yearsExperience),
            avatar: avatarPreview,
            whatsapp,
            telegram,
            instagram,
            facebook,
            linkedin,
            website,
            portfolioProjects,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to upgrade account");
      }

      const data = await response.json();

      // Save new token and update auth context
      if (data.access_token && data.user) {
        login(data.access_token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatar: data.user.avatar || avatarPreview,
          city: data.user.city,
          phone: data.user.phone,
          selectedCategories: data.user.selectedCategories,
          accountType: data.user.accountType,
          companyName: data.user.companyName,
        });

        // Update avatar in context
        if (avatarPreview) {
          updateUser({ avatar: avatarPreview });
        }
      }

      setShowConfetti(true);
      setIsComplete(true);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-hidden">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-20px",
                  backgroundColor: [
                    "#C4735B",
                    "#E8A593",
                    "#D98B74",
                    "#F5DCD4",
                    "#A85D47",
                  ][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.8}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="become-pro-orb become-pro-orb-1" />
          <div className="become-pro-orb become-pro-orb-2" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div
            className="max-w-md w-full text-center"
            style={{ animation: "scale-in 0.5s ease-out" }}
          >
            <div className="relative mb-8">
              <div className="become-pro-success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
              {t("becomePro.congratulations")}
            </h2>

            <p className="text-lg text-[var(--color-text-secondary)] mb-2">
              {t("becomePro.youAreNowAProfessional")}
            </p>

            <p className="text-sm text-[var(--color-text-tertiary)] mb-10 max-w-xs mx-auto">
              {t("becomePro.startReceivingJobsAndGrow")}
            </p>

            <div className="space-y-3">
              <Link href="/jobs">
                <Button
                  variant="default"
                  size="xl"
                  className="w-full group"
                  style={{ backgroundColor: TERRACOTTA.primary }}
                >
                  <span>{t("becomePro.browseJobs")}</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/pro/profile-setup">
                <Button variant="secondary" size="xl" className="w-full">
                  {t("becomePro.completeProfile")}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // Intro screen
  if (currentStep === "intro") {
    return (
      <div className="become-pro-container overflow-x-hidden">
        <Header />
        <HeaderSpacer />

        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="become-pro-orb become-pro-orb-1" />
          <div className="become-pro-orb become-pro-orb-2" />
        </div>

        <main
          className={`relative z-10 pt-8 pb-32 transition-all duration-700 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="container-custom">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <BackButton />
              </div>

              {/* Hero Section */}
              <section className="text-center mb-12">
                <div className="become-pro-hero-badge">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: TERRACOTTA.primary }}
                  >
                    {t("becomePro.freeToJoin")}
                  </span>
                </div>

                <h1 className="become-pro-hero-title mt-6 mb-5">
                  {locale === "ka" ? (
                    <>
                      გახდი <span>სპეციალისტი</span>
                    </>
                  ) : locale === "ru" ? (
                    <>
                      Стать <span>Специалистом</span>
                    </>
                  ) : (
                    <>
                      Become a <span>Professional</span>
                    </>
                  )}
                </h1>

                <p className="become-pro-hero-subtitle">
                  {t("becomePro.joinGeorgiasLeadingPlatformAnd")}
                </p>
              </section>

              {/* Steps Preview */}
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl p-6 border border-[var(--color-border-subtle)] mb-8">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  {t("becomePro.whatToExpect")}
                </h3>
                <div className="space-y-3">
                  {STEPS.map((step, i) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)]"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: TERRACOTTA.primary }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? step.title.ka
                            : locale === "ru"
                              ? step.title.ru
                              : step.title.en}
                        </p>
                      </div>
                      {step.icon}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Fixed Footer */}
        <div className="become-pro-footer">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Button
              onClick={handleNext}
              variant="default"
              size="xl"
              className="w-full group"
              style={{ backgroundColor: TERRACOTTA.primary }}
            >
              <span>{t("becomePro.getStarted")}</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Multi-step form
  return (
    <div className="become-pro-container overflow-x-hidden">
      <Header />
      <HeaderSpacer />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="become-pro-orb become-pro-orb-1" />
        <div className="become-pro-orb become-pro-orb-2" />
      </div>

      <main className="relative z-10 pt-4 pb-32">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="sticky top-16 z-20 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm -mx-4 px-4 py-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
                <div className="flex-1">
                  <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {t("becomePro.step")} {getCurrentStepIndex() + 1} /{" "}
                    {STEPS.length}
                  </p>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {locale === "ka"
                      ? STEPS[getCurrentStepIndex()].title.ka
                      : locale === "ru"
                        ? STEPS[getCurrentStepIndex()].title.ru
                        : STEPS[getCurrentStepIndex()].title.en}
                  </h2>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1.5">
                {STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className="flex-1 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        i <= getCurrentStepIndex()
                          ? TERRACOTTA.primary
                          : "var(--color-border-subtle)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Category Step */}
              {currentStep === "category" && (
                <CategoriesStep
                  selectedCategories={selectedCategories}
                  selectedSubcategories={selectedSubcategories}
                  onCategoriesChange={setSelectedCategories}
                  onSubcategoriesChange={setSelectedSubcategories}
                  customServices={customServices}
                  onCustomServicesChange={setCustomServices}
                />
              )}

              {/* About Step */}
              {currentStep === "about" && (
                <AboutStep
                  formData={{
                    bio,
                    yearsExperience,
                    avatar: avatarPreview || "",
                    whatsapp,
                    telegram,
                    instagram,
                    facebook,
                    linkedin,
                    website,
                  }}
                  avatarPreview={avatarPreview}
                  onFormChange={(updates) => {
                    if (updates.bio !== undefined) setBio(updates.bio);
                    if (updates.yearsExperience !== undefined)
                      setYearsExperience(updates.yearsExperience);
                  }}
                  onAvatarChange={() => {}}
                  onAvatarCropped={(croppedDataUrl) =>
                    setAvatarPreview(croppedDataUrl)
                  }
                  validation={{
                    bio: validation.bio,
                    experience: validation.experience,
                    avatar: validation.avatar,
                  }}
                />
              )}

              {/* Contact Step */}
              {currentStep === "contact" && (
                <div className="space-y-6">
                  <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          className="w-5 h-5"
                          style={{ color: TERRACOTTA.primary }}
                        />
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {t("becomePro.contactInformation")}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                      {t("becomePro.addSocialLinksForClient")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* WhatsApp */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          WhatsApp
                        </label>
                        <Input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="+995 5XX XXX XXX"
                          success={!!whatsapp}
                          leftIcon={
                            <svg
                              className="w-4 h-4 text-[#25D366]"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          }
                        />
                      </div>

                      {/* Telegram */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          Telegram
                        </label>
                        <Input
                          type="text"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="@username"
                          success={!!telegram}
                          leftIcon={<Send className="w-4 h-4 text-[#0088cc]" />}
                        />
                      </div>

                      {/* Instagram */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          Instagram
                        </label>
                        <Input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="@username"
                          leftIcon={
                            <Instagram className="w-4 h-4 text-[#E4405F]" />
                          }
                        />
                      </div>

                      {/* Facebook */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          Facebook
                        </label>
                        <Input
                          type="text"
                          value={facebook}
                          onChange={(e) => setFacebook(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="facebook.com/username"
                          leftIcon={
                            <Facebook className="w-4 h-4 text-[#1877F2]" />
                          }
                        />
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          LinkedIn
                        </label>
                        <Input
                          type="text"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="linkedin.com/in/username"
                          leftIcon={
                            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                          }
                        />
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          {t("common.website")}
                        </label>
                        <Input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          variant="filled"
                          inputSize="default"
                          placeholder="https://example.com"
                          leftIcon={
                            <Globe className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects Step */}
              {currentStep === "projects" && (
                <div className="space-y-6">
                  <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                    <ProjectsStep
                      projects={portfolioProjects}
                      onChange={setPortfolioProjects}
                      maxProjects={10}
                      maxVisibleInBrowse={6}
                    />
                  </div>

                  {portfolioProjects.length === 0 && (
                    <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4 text-center">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {t("becomePro.addingProjectsIsOptionalYou")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Step */}
              {currentStep === "review" && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-6">
                      {t("becomePro.profileSummary")}
                    </h3>

                    {/* Profile Preview */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                      {avatarPreview && (
                        <Image
                          src={avatarPreview}
                          alt="Avatar"
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover"
                          unoptimized
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)]">
                          {user?.name}
                        </h4>
                        {yearsExperience && (
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {yearsExperience} {t("becomePro.yearsExperience")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {t("common.categories")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map((catKey) => {
                          const category = categories.find(
                            (c) => c.key === catKey
                          );
                          return (
                            <span
                              key={catKey}
                              className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                              style={{ backgroundColor: TERRACOTTA.primary }}
                            >
                              {locale === "ka"
                                ? category?.nameKa
                                : category?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skills */}
                    {selectedSubcategories.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                          {t("common.skills")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSubcategories.map((subKey) => {
                            // Search through all categories' subcategories
                            let subcategory = null;
                            for (const cat of categories) {
                              const found = cat.subcategories.find(
                                (s) => s.key === subKey
                              );
                              if (found) {
                                subcategory = found;
                                break;
                              }
                            }
                            return (
                              <Badge key={subKey} variant="secondary" size="sm">
                                {locale === "ka"
                                  ? subcategory?.nameKa || subKey
                                  : subcategory?.name || subKey}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {t("becomePro.about")}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {bio}
                      </p>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {t("becomePro.contact")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {whatsapp && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <svg
                              className="w-4 h-4 text-[#25D366]"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {whatsapp}
                          </span>
                        )}
                        {telegram && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Send className="w-4 h-4 text-[#0088cc]" />
                            {telegram}
                          </span>
                        )}
                        {instagram && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Instagram className="w-4 h-4 text-[#E4405F]" />
                            {instagram}
                          </span>
                        )}
                        {facebook && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Facebook className="w-4 h-4 text-[#1877F2]" />
                            {facebook}
                          </span>
                        )}
                        {linkedin && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                            {linkedin}
                          </span>
                        )}
                        {website && (
                          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                            <Globe className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                            {website}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Portfolio Projects */}
                    {portfolioProjects.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                        <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-3">
                          {t("becomePro.portfolio")}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {portfolioProjects.slice(0, 6).map((project) => {
                            const coverImage =
                              project.beforeAfterPairs.length > 0
                                ? project.beforeAfterPairs[0].afterImage
                                : project.images[0] || "";
                            return (
                              <div
                                key={project.id}
                                className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)]"
                              >
                                {coverImage && (
                                  <Image
                                    src={coverImage}
                                    alt={project.title}
                                    fill
                                    className="object-cover"
                                    sizes="100px"
                                    unoptimized
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-1 left-1 right-1">
                                  <p className="text-[10px] text-white font-medium truncate">
                                    {project.title}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {portfolioProjects.length > 6 && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                            +{portfolioProjects.length - 6}{" "}
                            {t("becomePro.moreProjects")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <Alert variant="error" size="md">
                      {error}
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="become-pro-footer">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {currentStep !== "category" && (
              <Button
                onClick={handleBack}
                variant="secondary"
                size="lg"
                className="flex-shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}

            {currentStep === "review" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                variant="default"
                size="lg"
                className="flex-1 group"
                style={{ backgroundColor: TERRACOTTA.primary }}
              >
                <span>{t("becomePro.becomeAPro")}</span>
                {!isSubmitting && <Sparkles className="w-5 h-5" />}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                variant="default"
                size="lg"
                className="flex-1 group"
                style={{
                  backgroundColor: canProceed()
                    ? TERRACOTTA.primary
                    : undefined,
                }}
              >
                <span>{t("common.continue")}</span>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && imageToCrop && (
        <AvatarCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          locale={locale}
        />
      )}
    </div>
  );
}

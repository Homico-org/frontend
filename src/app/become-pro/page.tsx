"use client";

import AvatarCropper from "@/components/common/AvatarCropper";
import BackButton from "@/components/common/BackButton";
import Header, { HeaderSpacer } from "@/components/common/Header";
import ProjectsStep, {
  PortfolioProject,
} from "@/components/pro/steps/ProjectsStep";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  title: { en: string; ka: string };
  icon: React.ReactNode;
}[] = [
  {
    id: "category",
    title: { en: "Specialty", ka: "აირჩიე შენი სპეციალობა" },
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    id: "about",
    title: { en: "About You", ka: "შეავსე შენს შესახებ ინფორმაცია" },
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "contact",
    title: { en: "Contact", ka: "შეავსე შენს საკონტაქტო ინფორმაცია" },
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    id: "projects",
    title: { en: "Portfolio", ka: "დაამატე შენი ნამუშევრები" },
    icon: <Images className="w-4 h-4" />,
  },
  {
    id: "review",
    title: { en: "Review", ka: "გადახედე და გახდი სპეციალისტი" },
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
  const { locale } = useLanguage();
  const { categories } = useCategories();
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
  const [newCustomService, setNewCustomService] = useState("");

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
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect if not logged in or already a pro
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        openLoginModal("/become-pro");
      } else if (user?.role === "pro") {
        router.push("/browse");
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

  // Category handlers
  const handleCategoryToggle = (categoryKey: string) => {
    if (selectedCategories.includes(categoryKey)) {
      setSelectedCategories(
        selectedCategories.filter((c) => c !== categoryKey)
      );
      const category = categories.find((c) => c.key === categoryKey);
      if (category) {
        const categorySubKeys = category.subcategories.map((s) => s.key);
        setSelectedSubcategories(
          selectedSubcategories.filter((s) => !categorySubKeys.includes(s))
        );
      }
    } else if (selectedCategories.length < 4) {
      setSelectedCategories([...selectedCategories, categoryKey]);
    }
  };

  const handleSubcategoryToggle = (subcategoryKey: string) => {
    if (selectedSubcategories.includes(subcategoryKey)) {
      setSelectedSubcategories(
        selectedSubcategories.filter((s) => s !== subcategoryKey)
      );
    } else if (selectedSubcategories.length < 10) {
      setSelectedSubcategories([...selectedSubcategories, subcategoryKey]);
    }
  };

  const handleAddCustomService = () => {
    if (newCustomService.trim() && customServices.length < 5) {
      setCustomServices([...customServices, newCustomService.trim()]);
      setNewCustomService("");
    }
  };

  const handleRemoveCustomService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  // Avatar handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(
          locale === "ka"
            ? "სურათი უნდა იყოს 5MB-ზე ნაკლები"
            : "Image must be less than 5MB"
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
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

  // Get available subcategories
  const availableSubcategories = selectedCategories.flatMap((catKey) => {
    const category = categories.find((c) => c.key === catKey);
    return category?.subcategories || [];
  });

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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[#C4735B] animate-spin" />
        </div>
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
              {locale === "ka" ? "გილოცავთ!" : "Congratulations!"}
            </h2>

            <p className="text-lg text-[var(--color-text-secondary)] mb-2">
              {locale === "ka"
                ? "შენ ახლა პროფესიონალი ხარ"
                : "You are now a professional"}
            </p>

            <p className="text-sm text-[var(--color-text-tertiary)] mb-10 max-w-xs mx-auto">
              {locale === "ka"
                ? "დაიწყე სამუშაოების მიღება და გაზარდე შენი კლიენტების ბაზა"
                : "Start receiving jobs and grow your client base"}
            </p>

            <div className="space-y-3">
              <Link href="/browse/jobs">
                <Button
                  variant="default"
                  size="xl"
                  className="w-full group"
                  style={{ backgroundColor: TERRACOTTA.primary }}
                >
                  <span>
                    {locale === "ka" ? "სამუშაოების ნახვა" : "Browse Jobs"}
                  </span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/pro/profile-setup">
                <Button variant="secondary" size="xl" className="w-full">
                  {locale === "ka" ? "პროფილის დასრულება" : "Complete Profile"}
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
                    {locale === "ka" ? "უფასო რეგისტრაცია" : "Free to join"}
                  </span>
                </div>

                <h1 className="become-pro-hero-title mt-6 mb-5">
                  {locale === "ka" ? (
                    <>
                      გახდი <span>სპეციალისტი</span>
                    </>
                  ) : (
                    <>
                      Become a <span>Professional</span>
                    </>
                  )}
                </h1>

                <p className="become-pro-hero-subtitle">
                  {locale === "ka"
                    ? "შემოუერთდი საქართველოს წამყვან პლატფორმას და მიიღე მეტი სამუშაო"
                    : "Join Georgia's leading platform and get more work opportunities"}
                </p>
              </section>

              {/* Steps Preview */}
              <section className="bg-[var(--color-bg-elevated)] rounded-2xl p-6 border border-[var(--color-border-subtle)] mb-8">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  {locale === "ka" ? "რა გელოდება?" : "What to expect?"}
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
                          {locale === "ka" ? step.title.ka : step.title.en}
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
              <span>{locale === "ka" ? "დაწყება" : "Get Started"}</span>
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
                    {locale === "ka" ? "ნაბიჯი" : "Step"}{" "}
                    {getCurrentStepIndex() + 1} / {STEPS.length}
                  </p>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {locale === "ka"
                      ? STEPS[getCurrentStepIndex()].title.ka
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
                <div className="space-y-6">
                  {/* Main Categories */}
                  <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Briefcase
                          className="w-5 h-5"
                          style={{ color: TERRACOTTA.primary }}
                        />
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? "აირჩიე კატეგორია"
                            : "Select Category"}
                          <span
                            style={{ color: TERRACOTTA.primary }}
                            className="ml-1"
                          >
                            *
                          </span>
                        </h3>
                      </div>
                      {validation.category && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedCategories.length}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      {locale === "ka"
                        ? "მაქსიმუმ 4 კატეგორია"
                        : "Maximum 4 categories"}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => {
                        const isSelected = selectedCategories.includes(
                          category.key
                        );
                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => handleCategoryToggle(category.key)}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-[#C4735B] bg-[#C4735B]/5"
                                : "border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border)]"
                            }`}
                          >
                            {isSelected && (
                              <div
                                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: TERRACOTTA.primary }}
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                                isSelected
                                  ? "text-white"
                                  : "text-[var(--color-text-secondary)]"
                              }`}
                              style={{
                                backgroundColor: isSelected
                                  ? TERRACOTTA.primary
                                  : "var(--color-bg-elevated)",
                              }}
                            >
                              {categoryIcons[category.key] || (
                                <Briefcase className="w-5 h-5" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                              {locale === "ka"
                                ? category.nameKa
                                : category.name}
                            </h4>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {selectedCategories.length > 0 &&
                    availableSubcategories.length > 0 && (
                      <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">
                            {locale === "ka"
                              ? "აირჩიე უნარები"
                              : "Select Skills"}
                            <span
                              style={{ color: TERRACOTTA.primary }}
                              className="ml-1"
                            >
                              *
                            </span>
                          </h3>
                          {selectedSubcategories.length > 0 && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: TERRACOTTA.primary }}
                            >
                              {selectedSubcategories.length}/10
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {availableSubcategories.map((subcategory) => {
                            const isSelected = selectedSubcategories.includes(
                              subcategory.key
                            );
                            return (
                              <button
                                key={subcategory.key}
                                type="button"
                                onClick={() =>
                                  handleSubcategoryToggle(subcategory.key)
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                  isSelected
                                    ? "text-white"
                                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]"
                                }`}
                                style={
                                  isSelected
                                    ? { backgroundColor: TERRACOTTA.primary }
                                    : {}
                                }
                              >
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {locale === "ka"
                                  ? subcategory.nameKa
                                  : subcategory.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Custom Services */}
                  {selectedCategories.length > 0 && (
                    <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? "დამატებითი სერვისები"
                            : "Custom Services"}
                          <span className="text-[var(--color-text-muted)] font-normal text-xs ml-2">
                            ({locale === "ka" ? "არასავალდებულო" : "optional"})
                          </span>
                        </h3>
                        {customServices.length > 0 && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: TERRACOTTA.primary }}
                          >
                            {customServices.length}/5
                          </span>
                        )}
                      </div>

                      {customServices.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {customServices.map((service, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 rounded-xl"
                              style={{
                                backgroundColor: `${TERRACOTTA.primary}10`,
                                border: `1px solid ${TERRACOTTA.primary}20`,
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: TERRACOTTA.primary }}
                              />
                              <span className="flex-1 text-sm text-[var(--color-text-primary)]">
                                {service}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomService(index)}
                                className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {customServices.length < 5 && (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={newCustomService}
                            onChange={(e) =>
                              setNewCustomService(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                newCustomService.trim()
                              ) {
                                e.preventDefault();
                                handleAddCustomService();
                              }
                            }}
                            placeholder={
                              locale === "ka"
                                ? "მაგ: ინტერიერის დიზაინი"
                                : "e.g: Interior design"
                            }
                            variant="filled"
                            inputSize="default"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomService}
                            disabled={!newCustomService.trim()}
                            className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            style={{ backgroundColor: TERRACOTTA.primary }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* About Step */}
              {currentStep === "about" && (
                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div
                    className={`bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all ${
                      validation.avatar
                        ? "border-2 border-emerald-500/30"
                        : "border-2 border-[#C4735B]/50 ring-4 ring-[#C4735B]/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Camera
                          className="w-5 h-5"
                          style={{ color: TERRACOTTA.primary }}
                        />
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka" ? "პროფილის ფოტო" : "Profile Photo"}
                          <span
                            style={{ color: TERRACOTTA.primary }}
                            className="ml-1"
                          >
                            *
                          </span>
                        </h3>
                      </div>
                      {validation.avatar ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {locale === "ka" ? "ატვირთულია" : "Uploaded"}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 text-xs font-medium bg-[#C4735B]/10 px-2.5 py-1 rounded-full"
                          style={{ color: TERRACOTTA.primary }}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {locale === "ka" ? "სავალდებულო" : "Required"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                      {!avatarPreview ? (
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="relative w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center group transition-all hover:scale-105 overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${TERRACOTTA.primary}10 0%, ${TERRACOTTA.primary}05 100%)`,
                            borderColor: `${TERRACOTTA.primary}40`,
                          }}
                        >
                          <div className="text-center">
                            <Camera
                              className="w-8 h-8 mx-auto mb-1 transition-colors"
                              style={{ color: `${TERRACOTTA.primary}60` }}
                            />
                            <span
                              className="text-xs font-medium"
                              style={{ color: `${TERRACOTTA.primary}60` }}
                            >
                              {locale === "ka" ? "ატვირთე" : "Upload"}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="relative">
                          <img
                            src={avatarPreview}
                            alt=""
                            className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-2 ring-emerald-500/30"
                          />
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors text-white"
                            style={{ backgroundColor: TERRACOTTA.primary }}
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                          {locale === "ka"
                            ? "კლიენტები უფრო ენდობიან პროფესიონალებს ფოტოთი."
                            : "Clients trust professionals with photos more."}
                        </p>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                          style={{ backgroundColor: TERRACOTTA.primary }}
                        >
                          <Camera className="w-4 h-4" />
                          {avatarPreview
                            ? locale === "ka"
                              ? "შეცვალე"
                              : "Change"
                            : locale === "ka"
                              ? "ატვირთე"
                              : "Upload"}
                        </button>
                      </div>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Years of Experience */}
                  <div
                    className={`bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all ${
                      validation.experience
                        ? "border-2 border-emerald-500/30"
                        : "border-2 border-[var(--color-border-subtle)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock
                          className="w-5 h-5"
                          style={{ color: TERRACOTTA.primary }}
                        />
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka"
                            ? "გამოცდილება (წელი)"
                            : "Years of Experience"}
                          <span
                            style={{ color: TERRACOTTA.primary }}
                            className="ml-1"
                          >
                            *
                          </span>
                        </span>
                      </div>
                      {validation.experience && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsExperience}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseInt(value);
                        if (value === "" || (parsed >= 0 && parsed <= 50)) {
                          setYearsExperience(value);
                        }
                      }}
                      variant="filled"
                      inputSize="lg"
                      success={validation.experience}
                      placeholder="0"
                      rightIcon={
                        <span className="text-sm">
                          {locale === "ka" ? "წელი" : "years"}
                        </span>
                      }
                      className="text-lg font-medium"
                    />
                  </div>

                  {/* Bio */}
                  <div
                    className={`bg-[var(--color-bg-elevated)] rounded-2xl p-4 sm:p-6 shadow-sm transition-all ${
                      validation.bio
                        ? "border-2 border-emerald-500/30"
                        : "border-2 border-[var(--color-border-subtle)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText
                          className="w-5 h-5"
                          style={{ color: TERRACOTTA.primary }}
                        />
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {locale === "ka" ? "შენს შესახებ" : "About You"}
                          <span
                            style={{ color: TERRACOTTA.primary }}
                            className="ml-1"
                          >
                            *
                          </span>
                        </span>
                      </div>
                      {validation.bio && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <Textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      variant="filled"
                      textareaSize="lg"
                      success={validation.bio}
                      placeholder={
                        locale === "ka"
                          ? "მოგვიყევი შენი გამოცდილების შესახებ..."
                          : "Tell us about your experience..."
                      }
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {locale === "ka"
                          ? "მინიმუმ 20 სიმბოლო"
                          : "Minimum 20 characters"}
                      </p>
                      <span
                        className={`text-xs font-medium ${bio.length >= 20 ? "text-emerald-600" : bio.length > 0 ? "text-amber-600" : "text-[var(--color-text-muted)]"}`}
                      >
                        {bio.length}/500
                      </span>
                    </div>
                  </div>
                </div>
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
                          {locale === "ka"
                            ? "საკონტაქტო ინფორმაცია"
                            : "Contact Information"}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                      {locale === "ka"
                        ? "დაამატე სოციალური ქსელები კლიენტებთან კომუნიკაციისთვის"
                        : "Add social links for client communication"}
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
                          {locale === "ka" ? "ვებსაიტი" : "Website"}
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
                        {locale === "ka"
                          ? "პროექტების დამატება არ არის სავალდებულო. შეგიძლია მოგვიანებით დაამატო."
                          : "Adding projects is optional. You can add them later."}
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
                      {locale === "ka"
                        ? "პროფილის მიმოხილვა"
                        : "Profile Summary"}
                    </h3>

                    {/* Profile Preview */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border-subtle)]">
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)]">
                          {user?.name}
                        </h4>
                        {yearsExperience && (
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {yearsExperience}{" "}
                            {locale === "ka"
                              ? "წლის გამოცდილება"
                              : "years experience"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {locale === "ka" ? "კატეგორიები" : "Categories"}
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
                          {locale === "ka" ? "უნარები" : "Skills"}
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
                              <span
                                key={subKey}
                                className="px-3 py-1.5 rounded-full text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                              >
                                {locale === "ka"
                                  ? subcategory?.nameKa || subKey
                                  : subcategory?.name || subKey}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {locale === "ka" ? "შენს შესახებ" : "About"}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {bio}
                      </p>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                        {locale === "ka" ? "კონტაქტი" : "Contact"}
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
                          {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
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
                                  <img
                                    src={coverImage}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
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
                            {locale === "ka" ? "სხვა პროექტი" : "more projects"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    </div>
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
                <span>
                  {locale === "ka" ? "გახდი სპეციალისტი" : "Become a Pro"}
                </span>
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
                <span>{locale === "ka" ? "გაგრძელება" : "Continue"}</span>
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

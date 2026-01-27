"use client";

import { CategoryIcon, CategorySelector } from "@/components/categories";
import AddressPicker from "@/components/common/AddressPicker";
import AuthGuard from "@/components/common/AuthGuard";
import BudgetSelector, { BudgetType } from "@/components/post-job/BudgetSelector";
import ConditionSelector, { PropertyCondition, categoriesNeedingCondition } from "@/components/post-job/ConditionSelector";
import PropertyTypeSelector, { PropertyType } from "@/components/post-job/PropertyTypeSelector";
import TimingSelector, { Timing } from "@/components/post-job/TimingSelector";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import { ACCENT_COLOR } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    Check,
    Clock,
    Image as ImageIcon,
    MapPin,
    Palette,
    Pencil,
    Plus,
    Ruler,
    X
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { backOrNavigate } from "@/utils/navigationUtils";

type Step = "category" | "location" | "details" | "review";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const STEPS: { id: Step; label: string; labelKa: string; labelRu: string }[] = [
  { id: "category", label: "Category", labelKa: "კატეგორია", labelRu: "Категория" },
  { id: "location", label: "Location & Budget", labelKa: "ლოკაცია და ბიუჯეტი", labelRu: "Местоположение и бюджет" },
  { id: "details", label: "Details", labelKa: "დეტალები", labelRu: "Детали" },
  { id: "review", label: "Review", labelKa: "გადახედვა", labelRu: "Обзор" },
];

// Category icons - Custom illustrated style
function PostJobPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const { categories } = useCategories();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editJobId = searchParams.get("edit");
  const isEditMode = !!editJobId;

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("category");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [subcategorySearch, setSubcategorySearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "apartment" as PropertyType,
    propertyCondition: "" as PropertyCondition | "",
    budgetType: "fixed" as BudgetType,
    budgetMin: "",
    budgetMax: "",
    timing: "flexible" as Timing,
    // Category-specific fields
    cadastralId: "",
    areaSize: "",
    pointsCount: "",
    roomCount: "",
    landArea: "",
  });

  // Category field mapping - extensible configuration
  const categoryFieldsConfig: Record<string, {
    fields: Array<{
      key: string;
      type: "text" | "number";
      labelEn: string;
      labelKa: string;
      placeholderEn: string;
      placeholderKa: string;
      required?: boolean;
      suffix?: string;
    }>;
    hintEn: string;
    hintKa: string;
  }> = {
    // Architecture - needs cadastral and area
    architecture: {
      fields: [
        { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "100", placeholderKa: "100", suffix: "m²" },
      ],
      hintEn: "For architectural projects, the cadastral ID helps professionals understand the land registration and zoning requirements.",
      hintKa: "არქიტექტურული პროექტებისთვის საკადასტრო კოდი ეხმარება პროფესიონალებს მიწის რეგისტრაციისა და ზონირების მოთხოვნების გაგებაში.",
    },
    // Interior Design - needs area and room count
    design: {
      fields: [
        { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "80", placeholderKa: "80", suffix: "m²" },
        { key: "roomCount", type: "number", labelEn: "Rooms", labelKa: "ოთახები", placeholderEn: "3", placeholderKa: "3", required: true },
      ],
      hintEn: "Specify the total area and number of rooms to help designers provide accurate estimates for your interior project.",
      hintKa: "მიუთითე საერთო ფართი და ოთახების რაოდენობა, რომ დიზაინერებმა შეძლონ ზუსტი შეფასების მოწოდება.",
    },
    // Craftsmen/Construction - mixed based on subcategory
    craftsmen: {
      fields: [
        { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "50", placeholderKa: "50", suffix: "m²" },
      ],
      hintEn: "Provide the work area size for accurate pricing. For electrical or plumbing work, you can also specify points count.",
      hintKa: "მიუთითე სამუშაო ფართი ზუსტი ფასისთვის. ელექტრო ან სანტექნიკის სამუშაოებისთვის შეგიძლია მიუთითო წერტილების რაოდენობა.",
    },
    // Home care - area based
    homecare: {
      fields: [
        { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "100", placeholderKa: "100", suffix: "m²" },
      ],
      hintEn: "Specify the area to be serviced for accurate cleaning or maintenance quotes.",
      hintKa: "მიუთითე მოსასუფთავებელი ან მოსავლელი ფართი ზუსტი შეფასებისთვის.",
    },
  };

  // Subcategory-specific field overrides (for electrical, plumbing, etc.)
  const subcategoryFieldsOverride: Record<string, Array<{
    key: string;
    type: "text" | "number";
    labelEn: string;
    labelKa: string;
    placeholderEn: string;
    placeholderKa: string;
    required?: boolean;
    suffix?: string;
  }>> = {
    // Electrical work - points based
    "electrical": [
      { key: "pointsCount", type: "number", labelEn: "Electrical points", labelKa: "ელექტრო წერტილები", placeholderEn: "20", placeholderKa: "20", suffix: "წრტ" },
      { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "80", placeholderKa: "80", suffix: "m²" },
    ],
    // Plumbing - points based
    "plumbing": [
      { key: "pointsCount", type: "number", labelEn: "Plumbing points", labelKa: "სანტექნიკის წერტილები", placeholderEn: "10", placeholderKa: "10", suffix: "წრტ" },
      { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "80", placeholderKa: "80", suffix: "m²" },
    ],
    // HVAC - points and area
    "hvac": [
      { key: "pointsCount", type: "number", labelEn: "Units/Points", labelKa: "ერთეულები/წერტილები", placeholderEn: "5", placeholderKa: "5", suffix: "წრტ" },
      { key: "areaSize", type: "number", labelEn: "Area", labelKa: "ფართი", placeholderEn: "100", placeholderKa: "100", suffix: "m²" },
    ],
    // Lighting
    "lighting": [
      { key: "pointsCount", type: "number", labelEn: "Light points", labelKa: "სანათი წერტილები", placeholderEn: "15", placeholderKa: "15", suffix: "წრტ" },
      { key: "roomCount", type: "number", labelEn: "Rooms", labelKa: "ოთახები", placeholderEn: "4", placeholderKa: "4", required: true },
    ],
  };

  // Get active fields based on category and subcategory
  const getActiveFields = () => {
    // First check subcategory override
    if (selectedSubcategory && subcategoryFieldsOverride[selectedSubcategory]) {
      return subcategoryFieldsOverride[selectedSubcategory];
    }
    // Fall back to category config
    if (selectedCategory && categoryFieldsConfig[selectedCategory]) {
      return categoryFieldsConfig[selectedCategory].fields;
    }
    return [];
  };

  // Get hint for current selection
  const getActiveHint = () => {
    if (selectedCategory && categoryFieldsConfig[selectedCategory]) {
      return locale === "ka"
        ? categoryFieldsConfig[selectedCategory].hintKa
        : categoryFieldsConfig[selectedCategory].hintEn;
    }
    return t('job.describeInDetailWhatYou');
  };

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ type: "image" | "video"; url: string }[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auth check
  useEffect(() => {
    const canPostJob = user?.role === "client" || user?.role === "pro" || user?.role === "company" || user?.role === "admin";
    if (!authLoading && (!isAuthenticated || !canPostJob)) {
      openLoginModal("/post-job");
    }
  }, [authLoading, isAuthenticated, user, openLoginModal]);

  // Fetch job data for edit mode
  useEffect(() => {
    if (!editJobId || !isAuthenticated) return;

    const fetchJobData = async () => {
      setIsLoadingJob(true);
      try {
        const response = await api.get(`/jobs/${editJobId}`);
        const job = response.data;

        setSelectedCategory(job.category || "");
        setSelectedSubcategory(job.subcategory || job.skills?.[0] || "");

        setFormData({
          title: job.title || "",
          description: job.description || "",
          location: job.location || "",
          propertyType: job.propertyType || "apartment",
          propertyCondition: job.currentCondition || "",
          budgetType: job.budgetType || "fixed",
          budgetMin: job.budgetMin?.toString() || job.budgetAmount?.toString() || "",
          budgetMax: job.budgetMax?.toString() || "",
          timing: job.timing || "flexible",
          cadastralId: job.cadastralId || "",
          areaSize: job.areaSize?.toString() || "",
          pointsCount: job.pointsCount?.toString() || "",
          roomCount: job.roomCount?.toString() || "",
          landArea: job.landArea?.toString() || "",
        });

        if (job.media?.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images?.length > 0) {
          setExistingMedia(job.images.map((url: string) => ({ type: "image" as const, url })));
        }
      } catch (err) {
        console.error("Failed to fetch job:", err);
        setError("Failed to load job data");
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobData();
  }, [editJobId, isAuthenticated]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Step navigation
  const getCurrentStepIndex = () => STEPS.findIndex((s) => s.id === currentStep);
  const progressPercent = ((getCurrentStepIndex() + 1) / STEPS.length) * 100;

  const canProceedFromCategory = () => {
    if (!selectedCategory || !selectedSubcategory || !formData.propertyType) return false;
    return true;
  };
  const canProceedFromLocation = () => {
    if (!formData.location) return false;
    if (formData.budgetType === "negotiable") return true;
    // Budget must be greater than 0
    const minBudget = parseFloat(formData.budgetMin);
    if (isNaN(minBudget) || minBudget <= 0) return false;
    // For range, max must also be > 0 and >= min
    if (formData.budgetType === "range") {
      const maxBudget = parseFloat(formData.budgetMax);
      if (isNaN(maxBudget) || maxBudget <= 0 || maxBudget < minBudget) return false;
    }
    return true;
  };
  const canProceedFromDetails = () => {
    // Check basic required fields
    if (!formData.title.trim() || !formData.description.trim() || (existingMedia.length + mediaFiles.length) === 0) {
      return false;
    }
    // Check required category-specific fields
    const activeFields = getActiveFields();
    for (const field of activeFields) {
      if (field.required && !formData[field.key as keyof typeof formData]) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "review") {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      backOrNavigate(router, "/browse");
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: MediaFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async () => {
    if (!canProceedFromCategory() || !canProceedFromLocation() || !canProceedFromDetails()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedMedia: { type: "image" | "video"; url: string }[] = [];

      for (const mediaFile of mediaFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", mediaFile.file);
        const uploadRes = await api.post("/upload", formDataUpload);
        uploadedMedia.push({
          type: mediaFile.type,
          url: uploadRes.data.url || uploadRes.data.filename,
        });
      }

      // Calculate deadline based on timing selection
      const getDeadlineFromTiming = (timing: string): string | null => {
        const now = new Date();
        switch (timing) {
          case 'asap':
            // 3 days from now for urgent/ASAP
            return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          case 'this_week':
            // 7 days from now
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          case 'this_month':
            // 30 days from now
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          case 'flexible':
          default:
            // No deadline for flexible
            return null;
        }
      };

      const deadline = getDeadlineFromTiming(formData.timing);

      const jobData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        skills: [selectedSubcategory],
        location: formData.location,
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetType === "negotiable" ? 0 : Number(formData.budgetMin),
        budgetMax: formData.budgetType === "negotiable" ? 0 : (formData.budgetMax ? Number(formData.budgetMax) : Number(formData.budgetMin)),
      };

      // Add deadline if not flexible
      if (deadline) {
        jobData.deadline = deadline;
      }

      // Add category-specific fields if they have values
      if (formData.cadastralId) jobData.cadastralId = formData.cadastralId;
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.pointsCount) jobData.pointsCount = Number(formData.pointsCount);
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);
      if (formData.landArea) jobData.landArea = Number(formData.landArea);
      if (formData.propertyCondition) jobData.currentCondition = formData.propertyCondition;

      const allMedia = [...existingMedia, ...uploadedMedia];
      if (allMedia.length > 0) {
        jobData.images = allMedia.filter((m) => m.type === "image").map((m) => m.url);
      }

      let jobId = editJobId;

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        const response = await api.post("/jobs", jobData);
        jobId = response.data?.id || response.data?._id;
      }

      toast.success(
        isEditMode
          ? t('job.projectUpdated')
          : t('job.projectCreated'),
        isEditMode
          ? t('job.yourProjectHasBeenSuccessfully')
          : t('job.yourProjectHasBeenSuccessfully')
      );

      trackEvent(isEditMode ? AnalyticsEvent.JOB_EDIT : AnalyticsEvent.JOB_POST, {
        jobCategory: selectedCategory,
        jobBudget: Number(formData.budgetMax) || Number(formData.budgetMin),
      });

      router.push(jobId ? `/jobs/${jobId}` : "/my-jobs");
    } catch (err: unknown) {
      console.error("Failed to save job:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save project";
      setError(errorMessage);
      toast.error(
        t('common.error'),
        t('job.failedToSaveProject')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get subcategories for selected category
  const selectedCategoryData = categories.find((c) => c.key === selectedCategory);
  const filteredSubcategories = selectedCategoryData?.subcategories.filter((sub) => {
    if (!subcategorySearch) return true;
    const search = subcategorySearch.toLowerCase();
    return sub.name.toLowerCase().includes(search) || sub.nameKa.toLowerCase().includes(search);
  }) || [];

  // Loading State
  if (authLoading || isLoadingJob) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 lg:pb-14">
      {/* Progress Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="font-semibold text-[#C4735B]">{getCurrentStepIndex() + 1}/{STEPS.length}</span>
              <span className="hidden sm:inline text-neutral-300">•</span>
              <span className="hidden sm:inline font-medium">{locale === "ka" ? STEPS[getCurrentStepIndex()].labelKa : locale === "ru" ? STEPS[getCurrentStepIndex()].labelRu : STEPS[getCurrentStepIndex()].label}</span>
            </div>
            <Progress value={progressPercent} size="default" className="flex-1" />
            <span className="text-sm font-semibold text-[#C4735B]">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>
      </div>

      <main className={`flex-1 py-6 lg:py-8 transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <Alert variant="error" size="sm" className="mb-4">
              {error}
            </Alert>
          )}

          {/* STEP 1: Category Selection */}
          {currentStep === "category" && (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left: Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                    {t('job.projectDetails')}
                  </h1>
                  <p className="text-base text-neutral-500">
                    {t('job.selectPropertyTypeCategoryAnd')}
                  </p>
                </div>

                {/* Property Type Selection with Icons */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    {t('job.propertyType')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <PropertyTypeSelector
                    value={formData.propertyType}
                    onChange={(value) => updateFormData("propertyType", value)}
                    locale={locale as "en" | "ka" | "ru"}
                  />
                </div>

                {/* Category & Subcategory Selection */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    {t('job.categoryService')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <CategorySelector
                    mode="single"
                    selectedCategory={selectedCategory}
                    selectedSubcategory={selectedSubcategory}
                    onCategoryChange={(key) => {
                      setSelectedCategory(key);
                      setSelectedSubcategory("");
                      setSubcategorySearch("");
                    }}
                    onSubcategoryChange={setSelectedSubcategory}
                  />
                </div>

                {/* Category-specific fields */}
                {selectedSubcategory && getActiveFields().length > 0 && (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h3 className="text-base font-semibold text-neutral-900 mb-4">
                      {t('job.additionalDetails')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {getActiveFields().map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-neutral-600 mb-2">
                            {locale === "ka" ? field.labelKa : field.labelEn}
                            {field.required && " *"}
                          </label>
                          <div className="relative">
                            <input
                              type={field.type}
                              min={field.type === "number" ? 0 : undefined}
                              value={formData[field.key as keyof typeof formData] || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                // For number fields, prevent negative values
                                if (field.type === "number" && value !== '') {
                                  const num = parseFloat(value);
                                  if (!isNaN(num) && num < 0) return;
                                }
                                updateFormData(field.key, value);
                              }}
                              placeholder={locale === "ka" ? field.placeholderKa : field.placeholderEn}
                              className={`w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-base placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 transition-all ${
                                field.suffix ? "pr-12" : ""
                              }`}
                            />
                            {field.suffix && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">
                                {field.suffix}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cadastral Code Input - Only for architecture/design */}
                {(selectedCategory === "architecture" || selectedCategory === "design") && (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-base font-semibold text-neutral-900 mb-3">
                      {t('job.cadastralCode')} <span className="text-neutral-400 font-normal text-sm">({t('common.optional')})</span>
                    </label>
                    <Input
                      value={formData.cadastralId}
                      onChange={(e) => updateFormData("cadastralId", e.target.value)}
                      placeholder="XX.XX.XX.XXX.XXX"
                      className="text-base py-3"
                    />
                    <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                      {t('job.cadastralCodeHelpsIdentifyThe')}
                    </p>
                  </div>
                )}

                {/* Land Area Input - Only for house/building with architecture/design */}
                {(formData.propertyType === "house" || formData.propertyType === "building") && (selectedCategory === "architecture" || selectedCategory === "design") && (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-base font-semibold text-neutral-900 mb-3">
                      {t('job.landArea')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.landArea}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseFloat(value) >= 0) {
                            updateFormData("landArea", value);
                          }
                        }}
                        placeholder={"5007"}
                        className="w-full px-4 py-3 pr-14 rounded-xl border border-neutral-200 bg-white text-base placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">
                        m²
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                      {t('job.specifyTheLandPlotArea')}
                    </p>
                  </div>
                )}

                {/* Property Condition Selector - For relevant categories */}
                {selectedCategory && categoriesNeedingCondition.includes(selectedCategory) && (
                  <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-base font-semibold text-neutral-900 mb-4">
                      {t('job.propertyCondition')}
                    </label>
                    <ConditionSelector
                      value={formData.propertyCondition}
                      onChange={(value) => updateFormData("propertyCondition", value)}
                      locale={locale as "en" | "ka" | "ru"}
                      category={selectedCategory}
                    />
                    <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
                      {t('job.propertyConditionHelpsProfessionalsProvide')}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Hints Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-[140px] space-y-4">
                  {/* Hint Card */}
                  <div className="bg-gradient-to-br from-[#C4735B]/5 to-[#C4735B]/10 rounded-2xl border border-[#C4735B]/20 p-5 lg:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#C4735B] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-base text-[#C4735B]">
                        {t('job.tip')}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {getActiveHint()}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Budget */}
          {currentStep === "location" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 lg:p-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                  {t('job.locationBudget')}
                </h2>
                <p className="text-base text-neutral-500 mb-6">
                  {locale === "ka" ? "მიუთითეთ პროექტის მისამართი და ბიუჯეტი" : "Specify the project address and budget"}
                </p>

                <div className="space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {t('job.jobAddress')} <span className="text-[#C4735B]">*</span>
                    </label>
                    <AddressPicker
                      value={formData.location}
                      onChange={(value) => updateFormData("location", value)}
                      locale={locale}
                      required
                    />
                  </div>

                  {/* Budget Type Selection and Inputs */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      {t('common.budget')} <span className="text-[#C4735B]">*</span>
                    </label>
                    <BudgetSelector
                      budgetType={formData.budgetType}
                      onBudgetTypeChange={(value) => {
                        updateFormData("budgetType", value);
                        if (value === "fixed") updateFormData("budgetMax", "");
                        if (value === "negotiable") {
                          updateFormData("budgetMin", "0");
                          updateFormData("budgetMax", "");
                        }
                      }}
                      budgetMin={formData.budgetMin}
                      onBudgetMinChange={(value) => updateFormData("budgetMin", value)}
                      budgetMax={formData.budgetMax}
                      onBudgetMaxChange={(value) => updateFormData("budgetMax", value)}
                      locale={locale as "en" | "ka" | "ru"}
                    />
                  </div>

                  {/* Timing Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      {t('job.whenDoYouNeedIt')} <span className="text-[#C4735B]">*</span>
                    </label>
                    <TimingSelector
                      value={formData.timing}
                      onChange={(value) => updateFormData("timing", value)}
                      locale={locale as "en" | "ka" | "ru"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === "details" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                  {locale === "ka" ? "პროექტის დეტალები" : "Project Details"}
                </h1>
                <p className="text-base text-neutral-500">
                  {t('job.describeWhatNeedsToBe')}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-6 lg:p-8 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {t('common.title')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder={t('job.egKitchenPipeRepair')}
                    className="text-base py-3"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    {t('common.description')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={4}
                    placeholder={t('job.describeTheProblemOrWhat')}
                    className="text-base"
                  />
                </div>


                {/* Photos - Enhanced with explanation */}
                <div className={`p-5 lg:p-6 rounded-2xl border-2 transition-all ${
                  (existingMedia.length + mediaFiles.length) > 0
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/60'
                }`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (existingMedia.length + mediaFiles.length) > 0
                        ? 'bg-emerald-100'
                        : 'bg-amber-100'
                    }`}>
                      <ImageIcon className={`w-6 h-6 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-base font-semibold text-neutral-800 mb-1">
                        {t('job.addPhotos')} <span className="text-[#C4735B]">*</span>
                      </label>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {locale === "ka"
                          ? "მინიმუმ 1 ფოტო საჭიროა. ფოტოები ეხმარება პროფესიონალებს უკეთ გაიგონ თქვენი პროექტი."
                          : "At least 1 photo is required. Photos help professionals better understand your project."}
                      </p>
                    </div>
                  </div>

                  {/* Tips when no photos */}
                  {(existingMedia.length + mediaFiles.length) === 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {[
                        { icon: <Camera className="w-4 h-4" />, text: t('job.problemArea') },
                        { icon: <Ruler className="w-4 h-4" />, text: t('job.dimensions') },
                        { icon: <Palette className="w-4 h-4" />, text: t('job.desiredStyle') },
                      ].map((tip, i) => (
                        <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-neutral-200 text-sm text-neutral-600">
                          <span className="text-[#C4735B]">{tip.icon}</span>
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upload area and previews */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all flex-shrink-0 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/50 bg-white'
                          : 'border-amber-300 hover:border-amber-400 hover:bg-amber-100/50 bg-white'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Plus className={`w-6 h-6 ${
                        (existingMedia.length + mediaFiles.length) > 0 ? 'text-emerald-500' : 'text-amber-500'
                      }`} />
                      <span className={`text-xs font-medium mt-1 ${
                        (existingMedia.length + mediaFiles.length) > 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {t('common.add')}
                      </span>
                    </button>

                    {/* Preview - Existing */}
                    {existingMedia.map((media, idx) => (
                      <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
                        <Image src={storage.getFileUrl(media.url)} alt="Uploaded media" fill className="object-cover" sizes="96px" />
                        <button
                          onClick={() => removeExistingMedia(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}

                    {/* Preview - New */}
                    {mediaFiles.map((media, idx) => (
                      <div key={`new-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
                        <Image src={media.preview} alt="Preview" fill className="object-cover" sizes="96px" unoptimized />
                        <button
                          onClick={() => removeMediaFile(idx)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Success state */}
                  {(existingMedia.length + mediaFiles.length) > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                      <Check className="w-4 h-4" />
                      <span>
                        {locale === "ka"
                          ? `${existingMedia.length + mediaFiles.length} ფოტო დამატებულია - პროფესიონალები უკეთ გაიგებენ შენს პროექტს!`
                          : `${existingMedia.length + mediaFiles.length} photo${(existingMedia.length + mediaFiles.length) > 1 ? 's' : ''} added - pros will better understand your project!`}
                      </span>
                    </div>
                  )}

                  {/* Required validation message */}
                  {(existingMedia.length + mediaFiles.length) === 0 && formData.title.trim() && formData.description.trim() && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        {locale === "ka"
                          ? "გთხოვთ დაამატოთ მინიმუმ 1 ფოტო გასაგრძელებლად"
                          : "Please add at least 1 photo to continue"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === "review" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
                  {t('job.reviewYourJobPost')}
                </h1>
                <p className="text-base text-neutral-500">
                  {t('job.pleaseEnsureAllDetailsAre')}
                </p>
              </div>

              {/* Service Details */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                      <CategoryIcon type={selectedCategoryData?.icon || ""} className="w-4 h-4 text-[#C4735B]" />
                    </div>
                    {t('job.service')}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => goToStep("category")} className="text-[#C4735B]">
                    <Pencil className="w-4 h-4 mr-1" />
                    {locale === "ka" ? "შეცვლა" : "Edit"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-400 mb-1">{t('job.category')}</p>
                    <p className="font-semibold text-neutral-900 text-base">
                      {locale === "ka" ? selectedCategoryData?.nameKa : selectedCategoryData?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 mb-1">{t('common.type')}</p>
                    <p className="font-semibold text-neutral-900 text-base">
                      {(() => {
                        const sub = selectedCategoryData?.subcategories.find((s) => s.key === selectedSubcategory);
                        return locale === "ka" ? sub?.nameKa : sub?.name;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Budget - Combined */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-[#C4735B]" />
                      </div>
                      {t('common.location')}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep("location")} className="text-[#C4735B] h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 line-clamp-2 mb-2">{formData.location}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" size="sm">
                      {formData.propertyType === "apartment" && (t('job.apartment'))}
                      {formData.propertyType === "house" && (t('job.house'))}
                      {formData.propertyType === "office" && (t('job.office'))}
                      {formData.propertyType === "building" && (t('job.building'))}
                      {formData.propertyType === "other" && (t('common.other'))}
                    </Badge>
                    {formData.propertyCondition && (
                      <Badge variant="premium" size="sm">
                        {formData.propertyCondition === "shell" && (t('job.shell'))}
                        {formData.propertyCondition === "black-frame" && (t('job.blackFrame'))}
                        {formData.propertyCondition === "needs-renovation" && (t('job.fullRenovation'))}
                        {formData.propertyCondition === "partial-renovation" && (t('job.partial'))}
                        {formData.propertyCondition === "good" && (t('job.good'))}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Budget */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      {locale === "ka" ? "ბიუჯეტი" : "Budget"}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep("location")} className="text-[#C4735B] h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-bold text-neutral-900">
                    {formData.budgetType === "negotiable"
                      ? (t('common.negotiable'))
                      : formData.budgetType === "range"
                      ? `${formData.budgetMin} - ${formData.budgetMax} GEL`
                      : `${formData.budgetMin} GEL`}
                  </p>
                </div>

                {/* Timing */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-[#C4735B]" />
                      </div>
                      {t('job.whenNeeded')}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep("location")} className="text-[#C4735B] h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge
                    variant={formData.timing === "asap" ? "danger" : formData.timing === "this_week" ? "warning" : "default"}
                    size="default"
                  >
                    {formData.timing === "flexible" && (t('job.flexible'))}
                    {formData.timing === "asap" && (t('job.asap'))}
                    {formData.timing === "this_week" && (t('common.thisWeek'))}
                    {formData.timing === "this_month" && (t('common.thisMonth'))}
                  </Badge>
                </div>
              </div>

              {/* Category-specific fields - Show if any are filled */}
              {(formData.areaSize || formData.roomCount || formData.pointsCount || formData.cadastralId || formData.landArea) && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <Ruler className="w-4 h-4 text-[#C4735B]" />
                      </div>
                      {t('common.details')}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep("details")} className="text-[#C4735B] h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.areaSize && (
                      <Badge variant="secondary" size="default">
                        {t('job.area')}: {formData.areaSize} m²
                      </Badge>
                    )}
                    {formData.roomCount && (
                      <Badge variant="secondary" size="default">
                        {t('job.rooms')}: {formData.roomCount}
                      </Badge>
                    )}
                    {formData.pointsCount && (
                      <Badge variant="secondary" size="default">
                        {t('job.points')}: {formData.pointsCount}
                      </Badge>
                    )}
                    {formData.cadastralId && (
                      <Badge variant="secondary" size="default">
                        {t('job.cadastral')}: {formData.cadastralId}
                      </Badge>
                    )}
                    {formData.landArea && (
                      <Badge variant="secondary" size="default">
                        {t('job.land')}: {formData.landArea} m²
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    {locale === "ka" ? "აღწერა" : "Description"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => goToStep("details")} className="text-[#C4735B] h-8 w-8 p-0">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                <h4 className="text-base font-semibold text-neutral-900 mb-2">{formData.title}</h4>
                <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">{formData.description}</p>
              </div>

              {/* Photos */}
              {(existingMedia.length > 0 || mediaFiles.length > 0) && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-[#C4735B]" />
                      </div>
                      {t('common.photos')} ({existingMedia.length + mediaFiles.length})
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep("details")} className="text-[#C4735B] h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {existingMedia.map((media, idx) => (
                      <div key={`review-existing-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        <Image src={storage.getFileUrl(media.url)} alt="Uploaded media" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => (
                      <div key={`review-new-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        <Image src={media.preview} alt="Preview" fill className="object-cover" sizes="80px" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-400 py-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t('job.willBeReviewedByAdmins')}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-14 lg:bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-40 shadow-lg shadow-neutral-900/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="default"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-base"
            >
              {t('common.back')}
            </Button>

            <Button
              size="lg"
              onClick={handleNext}
              loading={isSubmitting}
              disabled={
                (currentStep === "category" && !canProceedFromCategory()) ||
                (currentStep === "location" && !canProceedFromLocation()) ||
                (currentStep === "details" && !canProceedFromDetails())
              }
              rightIcon={currentStep === "review" ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              className="text-base px-8"
            >
              {currentStep === "review"
                ? (t('job.postJob'))
                : (t('common.continue'))}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <AuthGuard allowedRoles={["client", "pro", "company", "admin"]}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
            <LoadingSpinner size="xl" variant="border" color={ACCENT_COLOR} />
          </div>
        }
      >
        <PostJobPageContent />
      </Suspense>
    </AuthGuard>
  );
}

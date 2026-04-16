"use client";

import { CategoryIcon } from "@/components/categories";
import JobServicePicker, { JobServiceSelection } from "@/components/post-job/JobServicePicker";
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

const STEP_IDS: Step[] = ["category", "location", "details", "review"];

// Category icons - Custom illustrated style
function ReviewRow({ label, onEdit, editLabel, children }: { label: string; onEdit: () => void; editLabel: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-[11px] font-medium text-[#C4735B] hover:underline mt-0.5"
      >
        {editLabel}
      </button>
    </div>
  );
}

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
  const submittingRef = useRef(false); // Ref to prevent double submission
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [selectedJobServices, setSelectedJobServices] = useState<JobServiceSelection[]>([]);

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
      labelKey: string;
      placeholder: string;
      required?: boolean;
      suffix?: string;
      suffixKey?: string;
    }>;
    hintKey: string;
  }> = {
    // Architecture - needs cadastral and area
    architecture: {
      fields: [
        { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "100", suffix: "m²" },
      ],
      hintKey: "postJob.hints.architecture",
    },
    // Interior Design - needs area and room count
    design: {
      fields: [
        { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "80", suffix: "m²" },
        { key: "roomCount", type: "number", labelKey: "job.rooms", placeholder: "3", required: true },
      ],
      hintKey: "postJob.hints.design",
    },
    // Craftsmen/Construction - mixed based on subcategory
    craftsmen: {
      fields: [
        { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "50", suffix: "m²" },
      ],
      hintKey: "postJob.hints.craftsmen",
    },
    // Home care - area based
    homecare: {
      fields: [
        { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "100", suffix: "m²" },
      ],
      hintKey: "postJob.hints.homecare",
    },
  };

  // Subcategory-specific field overrides (for electrical, plumbing, etc.)
  const subcategoryFieldsOverride: Record<string, Array<{
    key: string;
    type: "text" | "number";
    labelKey: string;
    placeholder: string;
    required?: boolean;
    suffix?: string;
    suffixKey?: string;
  }>> = {
    // Electrical work - points based
    "electrical": [
      { key: "pointsCount", type: "number", labelKey: "postJob.fields.electricalPoints", placeholder: "20", suffixKey: "postJob.units.pointsShort" },
      { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "80", suffix: "m²" },
    ],
    // Plumbing - points based
    "plumbing": [
      { key: "pointsCount", type: "number", labelKey: "postJob.fields.plumbingPoints", placeholder: "10", suffixKey: "postJob.units.pointsShort" },
      { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "80", suffix: "m²" },
    ],
    // HVAC - points and area
    "hvac": [
      { key: "pointsCount", type: "number", labelKey: "postJob.fields.unitsOrPoints", placeholder: "5", suffixKey: "postJob.units.pointsShort" },
      { key: "areaSize", type: "number", labelKey: "job.area", placeholder: "100", suffix: "m²" },
    ],
    // Lighting
    "lighting": [
      { key: "pointsCount", type: "number", labelKey: "postJob.fields.lightPoints", placeholder: "15", suffixKey: "postJob.units.pointsShort" },
      { key: "roomCount", type: "number", labelKey: "job.rooms", placeholder: "4", required: true },
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
      return t(categoryFieldsConfig[selectedCategory].hintKey);
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
    const canPostJob = user?.role === "client" || user?.role === "pro" || user?.role === "admin";
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
  const getCurrentStepIndex = () => STEP_IDS.indexOf(currentStep);
  const progressPercent = ((getCurrentStepIndex() + 1) / STEP_IDS.length) * 100;
  const getStepLabel = (step: Step) => t(`postJob.steps.${step}`);

  const canProceedFromCategory = () => {
    if (!formData.title.trim() || !formData.description.trim()) return false;
    if (!selectedCategory || !formData.propertyType) return false;
    if (selectedJobServices.length === 0) return false;
    // Also validate required category-specific fields shown on this step
    const activeFields = getActiveFields();
    for (const field of activeFields) {
      if (field.required && !formData[field.key as keyof typeof formData]) return false;
    }
    return true;
  };
  const serviceBudgetTotal = selectedJobServices.reduce((sum, s) => sum + s.budget * (s.quantity || 1), 0);
  const hasServiceBudgets = selectedJobServices.length > 0;

  const canProceedFromLocation = () => {
    if (!formData.location) return false;
    // If per-service budgets are set, skip the BudgetSelector validation
    if (hasServiceBudgets) return true;
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
    // At least 1 photo required
    return (existingMedia.length + mediaFiles.length) > 0;
  };

  const handleNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex < STEP_IDS.length - 1) {
      setCurrentStep(STEP_IDS[stepIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "review") {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(STEP_IDS[stepIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      backOrNavigate(router, "/portfolio");
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
    // Prevent double submission using ref (synchronous check)
    if (submittingRef.current) return;
    if (!canProceedFromCategory() || !canProceedFromLocation() || !canProceedFromDetails()) return;

    submittingRef.current = true;
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

      // All jobs expire in 30 days from posting
      const now = new Date();
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

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

      if (selectedJobServices.length > 0) {
        jobData.services = selectedJobServices.map(svc => ({
          key: svc.serviceKey,
          unitKey: svc.unitKey,
          quantity: svc.quantity || 1,
          unitPrice: svc.budget,
          unit: svc.unit,
        }));
        jobData.skills = selectedJobServices.map(s => s.serviceKey);
        const totalBudget = selectedJobServices.reduce((sum, s) => sum + s.budget, 0);
        if (totalBudget > 0) {
          jobData.budgetType = 'fixed';
          jobData.budgetMin = totalBudget;
          jobData.budgetMax = totalBudget;
        }
      }

      // All jobs have a 30-day deadline
      jobData.deadline = deadline;

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
      submittingRef.current = false;
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
      {/* Page Title + Progress */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 sticky top-14 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C4735B]" />
              {isEditMode ? t('job.editJob') : t('browse.postAJob')}
            </h1>
            <span className="text-[11px] text-neutral-400">
              {getCurrentStepIndex() + 1}/{STEP_IDS.length}
            </span>
          </div>
          {/* Step labels */}
          <div className="flex mb-1.5">
            {STEP_IDS.map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => isCompleted ? goToStep(step) : undefined}
                  disabled={!isCompleted}
                  className={`flex-1 text-center text-[10px] sm:text-[11px] font-medium transition-colors ${
                    isCurrent
                      ? 'text-[#C4735B]'
                      : isCompleted
                        ? 'text-neutral-600 dark:text-neutral-400 cursor-pointer hover:text-[#C4735B]'
                        : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                >
                  <span className="hidden sm:inline">{getStepLabel(step)}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              );
            })}
          </div>
          {/* Progress segments */}
          <div className="flex gap-1">
            {STEP_IDS.map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              return (
                <div
                  key={step}
                  className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                    index < currentIndex
                      ? 'bg-[#C4735B]'
                      : index === currentIndex
                        ? 'bg-[#C4735B]/40'
                        : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <main className={`flex-1 py-4 sm:py-6 transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          {error && (
            <Alert variant="error" size="sm" className="mb-4">
              {error}
            </Alert>
          )}

          {/* STEP 1: Category Selection */}
          {currentStep === "category" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white mb-0.5">
                  {t('job.projectDetails')}
                </h1>
                <p className="text-xs text-neutral-500">
                  {t('job.selectPropertyTypeCategoryAnd')}
                </p>
              </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
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
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    {t('common.description')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={3}
                    placeholder={t('job.describeTheProblemOrWhat')}
                    className="text-base"
                  />
                </div>

                {/* Timing Selection */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    {t('job.whenDoYouNeedIt')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <TimingSelector
                    value={formData.timing}
                    onChange={(value) => updateFormData("timing", value)}
                    locale={locale as "en" | "ka" | "ru"}
                  />
                </div>

                {/* Property Type Selection with Icons */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
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
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                    {t('job.categoryService')} <span className="text-[#C4735B]">*</span>
                  </label>
                  <JobServicePicker
                    selectedCategory={selectedCategory}
                    onCategoryChange={(key) => {
                      setSelectedCategory(key);
                      setSelectedSubcategory("");
                    }}
                    selectedServices={selectedJobServices}
                    onServicesChange={setSelectedJobServices}
                  />
                </div>

                {/* Category-specific fields */}
                {selectedSubcategory && getActiveFields().length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-3 sm:mb-4">
                      {t('job.additionalDetails')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {getActiveFields().map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-neutral-600 mb-2">
                            {t(field.labelKey)}
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
                              placeholder={field.placeholder}
                              className={`w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-base placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 transition-all ${
                                field.suffix || field.suffixKey ? "pr-12" : ""
                              }`}
                            />
                            {(field.suffix || field.suffixKey) && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">
                                {field.suffixKey ? t(field.suffixKey) : field.suffix}
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
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-neutral-900 mb-2 sm:mb-3">
                      {t('job.cadastralCode')} <span className="text-neutral-400 font-normal text-xs sm:text-sm">({t('common.optional')})</span>
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
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-neutral-900 mb-2 sm:mb-3">
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
                  <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-neutral-900 mb-3 sm:mb-4">
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
          )}

          {/* STEP 2: Location */}
          {currentStep === "location" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-0.5">
                  {t('job.locationBudget')}
                </h2>
                <p className="text-sm sm:text-base text-neutral-500 mb-4 sm:mb-6">
                  {t("postJob.locationBudgetSubtitle")}
                </p>

                <div className="space-y-5 sm:space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      {t('job.jobAddress')} <span className="text-[#C4735B]">*</span>
                    </label>
                    <AddressPicker
                      value={formData.location}
                      onChange={(value) => updateFormData("location", value)}
                      locale={locale}
                      required
                    />
                  </div>

                  {/* Budget Type Selection — hidden when per-service budgets are set */}
                  {hasServiceBudgets ? (
                    serviceBudgetTotal > 0 ? (
                      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(196,115,91,0.06)', border: '1px solid rgba(196,115,91,0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('common.budget')}
                        </p>
                        <p className="text-lg font-bold mt-1" style={{ color: '#C4735B' }}>
                          {serviceBudgetTotal}₾
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {locale === 'ka' ? 'სერვისების ბიუჯეტიდან' : 'From per-service budgets'}
                        </p>
                      </div>
                    ) : null
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
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
                  )}

                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === "details" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white mb-0.5">
                  {t('job.addPhotos')}
                </h1>
                <p className="text-xs text-neutral-500">
                  {t("postJob.photosRequirementHelp")}
                </p>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
                {/* Photos - Enhanced with explanation */}
                <div className={`p-4 sm:p-5 lg:p-6 rounded-2xl border-2 transition-all ${
                  (existingMedia.length + mediaFiles.length) > 0
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/60'
                }`}>
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (existingMedia.length + mediaFiles.length) > 0
                        ? 'bg-emerald-100'
                        : 'bg-amber-100'
                    }`}>
                      <ImageIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm sm:text-base font-semibold text-neutral-800 mb-1">
                        {t('job.addPhotos')} <span className="text-[#C4735B]">*</span>
                      </label>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {t("postJob.photosRequirementHelp")}
                      </p>
                    </div>
                  </div>

                  {/* Tips when no photos */}
                  {(existingMedia.length + mediaFiles.length) === 0 && (
                    <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
                      {[
                        { icon: <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, text: t('job.problemArea') },
                        { icon: <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, text: t('job.dimensions') },
                        { icon: <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />, text: t('job.desiredStyle') },
                      ].map((tip, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/80 border border-neutral-200 text-xs sm:text-sm text-neutral-600">
                          <span className="text-[#C4735B]">{tip.icon}</span>
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upload area and previews */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all flex-shrink-0 ${
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
                      <div key={`existing-${idx}`} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
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
                      <div key={`new-${idx}`} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
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
                        {t("postJob.photosAddedSuccess", {
                          count: existingMedia.length + mediaFiles.length,
                          plural: (existingMedia.length + mediaFiles.length) > 1 ? "s" : "",
                        })}
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
                        {t("postJob.addAtLeastOnePhotoToContinue")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === "review" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="mb-1">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white mb-0.5">
                  {t('job.reviewYourJobPost')}
                </h1>
                <p className="text-xs text-neutral-500">
                  {t('job.pleaseEnsureAllDetailsAre')}
                </p>
              </div>

              {/* Hero card — Title + Category + Timing + Budget */}
              <div
                className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                style={{ backgroundColor: 'rgba(196,115,91,0.06)', border: '1px solid rgba(196,115,91,0.15)' }}
              >
                <button
                  onClick={() => goToStep("category")}
                  className="absolute top-3 right-3 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[rgba(196,115,91,0.1)]"
                  style={{ color: '#C4735B' }}
                >
                  <Pencil className="w-3 h-3 inline mr-1" />{t('common.edit')}
                </button>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-bold pr-16" style={{ color: 'var(--color-text-primary)' }}>
                  {formData.title}
                </h2>
                <p className="text-[13px] mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                  {formData.description}
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedCategoryData && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(196,115,91,0.12)', color: '#C4735B' }}>
                      <CategoryIcon type={selectedCategory} className="w-3.5 h-3.5" />
                      {locale === "ka" ? selectedCategoryData.nameKa : selectedCategoryData.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                    <Clock className="w-3 h-3" />
                    {formData.timing === "flexible" && t('job.flexible')}
                    {formData.timing === "asap" && t('job.asap')}
                    {formData.timing === "this_week" && t('common.thisWeek')}
                    {formData.timing === "this_month" && t('common.thisMonth')}
                  </span>
                  {(() => {
                    const budgetText = hasServiceBudgets
                      ? (serviceBudgetTotal > 0 ? `${serviceBudgetTotal}₾` : null)
                      : formData.budgetType === "range"
                        ? `${formData.budgetMin}–${formData.budgetMax}₾`
                        : formData.budgetType === "negotiable" ? null
                          : formData.budgetMin ? `${formData.budgetMin}₾` : null;
                    return budgetText ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(196,115,91,0.12)', color: '#C4735B' }}>
                        {budgetText}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Services card */}
              {selectedJobServices.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('job.service')} ({selectedJobServices.length})
                    </span>
                    <button onClick={() => goToStep("category")} className="text-[11px] font-medium" style={{ color: '#C4735B' }}>
                      {t('common.edit')}
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {selectedJobServices.map(svc => {
                      const qty = svc.quantity || 1;
                      const lineTotal = svc.budget * qty;
                      return (
                        <div key={svc.serviceKey} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium block truncate" style={{ color: 'var(--color-text-primary)' }}>
                              {locale === 'ka' ? svc.nameKa : svc.name}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                              {qty > 1 ? `${qty} × ` : ''}{locale === 'ka' ? svc.unitNameKa : svc.unitName}
                              {svc.budget > 0 && qty > 1 && (
                                <span className="ml-1">· {svc.budget}₾/{locale === 'ka' ? svc.unitNameKa : svc.unitName}</span>
                              )}
                            </span>
                          </div>
                          {svc.budget > 0 && (
                            <span className="text-[13px] font-bold shrink-0 ml-3" style={{ color: '#C4735B' }}>
                              {lineTotal}₾
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* Total row when multiple services have budgets */}
                    {serviceBudgetTotal > 0 && selectedJobServices.filter(s => s.budget > 0).length > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'rgba(196,115,91,0.04)' }}>
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                          {locale === 'ka' ? 'ჯამი' : 'Total'}
                        </span>
                        <span className="text-[14px] font-bold" style={{ color: '#C4735B' }}>
                          {serviceBudgetTotal}₾
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location + Property card */}
              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <MapPin className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {formData.location}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
                      {formData.propertyType === "apartment" && t('job.apartment')}
                      {formData.propertyType === "house" && t('job.house')}
                      {formData.propertyType === "office" && t('job.office')}
                      {formData.propertyType === "building" && t('job.building')}
                      {formData.propertyType === "other" && t('common.other')}
                    </span>
                    {formData.propertyCondition && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B]">
                        {formData.propertyCondition === "shell" && t('job.shell')}
                        {formData.propertyCondition === "black-frame" && t('job.blackFrame')}
                        {formData.propertyCondition === "needs-renovation" && t('job.fullRenovation')}
                        {formData.propertyCondition === "partial-renovation" && t('job.partial')}
                        {formData.propertyCondition === "good" && t('job.good')}
                      </span>
                    )}
                    {formData.areaSize && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{formData.areaSize} m²</span>}
                    {formData.roomCount && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>{formData.roomCount} {t('job.rooms')}</span>}
                  </div>
                </div>
                <button onClick={() => goToStep("location")} className="text-[11px] font-medium shrink-0" style={{ color: '#C4735B' }}>
                  {t('common.edit')}
                </button>
              </div>

              {/* Photos */}
              {(existingMedia.length > 0 || mediaFiles.length > 0) && (
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('common.photos')} ({existingMedia.length + mediaFiles.length})
                    </span>
                    <button onClick={() => goToStep("details")} className="text-[11px] font-medium" style={{ color: '#C4735B' }}>
                      {t('common.edit')}
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {existingMedia.map((media, idx) => (
                      <div key={`re-${idx}`} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                        <Image src={storage.getFileUrl(media.url)} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => (
                      <div key={`rn-${idx}`} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                        <Image src={media.preview} alt="" fill className="object-cover" sizes="80px" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-[11px] text-neutral-400 pt-1">
                {t('job.willBeReviewedByAdmins')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-40">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-800/50">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              {getCurrentStepIndex() > 0 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </button>
              ) : (
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentStep === "category" && !canProceedFromCategory()) ||
                  (currentStep === "location" && !canProceedFromLocation()) ||
                  (currentStep === "details" && !canProceedFromDetails())
                }
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#C4735B] hover:bg-[#B5624A] disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C4735B]/20 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="xs" color="white" />
                ) : null}
                {currentStep === "review" ? t('job.postJob') : t('common.continue')}
                {currentStep === "review" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <AuthGuard allowedRoles={["client", "pro", "admin"]}>
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

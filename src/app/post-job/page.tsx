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
import { Stepper } from "@/components/ui/Stepper";
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
    AlertTriangle,
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
        <p className="text-[10px] font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-1">{label}</p>
        {children}
      </div>
      <Button
        variant="link"
        size="sm"
        onClick={onEdit}
        className="flex-shrink-0 text-[11px] mt-0.5"
      >
        {editLabel}
      </Button>
    </div>
  );
}

function PostJobPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale, pick } = useLanguage();
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
        <LoadingSpinner size="xl" variant="border" color="var(--hm-brand-500)" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 lg:pb-14 bg-[var(--hm-bg-page)]">
      {/* Page Title + Progress */}
      <div className="bg-[var(--hm-bg-elevated)] border-b border-[var(--hm-border-subtle)] sticky top-14 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-3">
          <Stepper
            steps={STEP_IDS.map((step) => ({
              key: step,
              label: getStepLabel(step),
            }))}
            currentIndex={getCurrentStepIndex()}
            onStepClick={(index) => goToStep(STEP_IDS[index])}
          />
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
                <h1 className="text-lg font-bold text-[var(--hm-fg-primary)] mb-0.5">
                  {t('job.projectDetails')}
                </h1>
                <p className="text-xs text-[var(--hm-fg-muted)]">
                  {t('job.selectPropertyTypeCategoryAnd')}
                </p>
              </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-2">
                    {t('common.title')} <span className="text-[var(--hm-brand-500)]">*</span>
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
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-2">
                    {t('common.description')} <span className="text-[var(--hm-brand-500)]">*</span>
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
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-3">
                    {t('job.whenDoYouNeedIt')} <span className="text-[var(--hm-brand-500)]">*</span>
                  </label>
                  <TimingSelector
                    value={formData.timing}
                    onChange={(value) => updateFormData("timing", value)}
                    locale={locale as "en" | "ka" | "ru"}
                  />
                </div>

                {/* Property Type Selection with Icons */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-3">
                    {t('job.propertyType')} <span className="text-[var(--hm-brand-500)]">*</span>
                  </label>
                  <PropertyTypeSelector
                    value={formData.propertyType}
                    onChange={(value) => updateFormData("propertyType", value)}
                    locale={locale as "en" | "ka" | "ru"}
                  />
                </div>

                {/* Category & Subcategory Selection */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-3">
                    {t('job.categoryService')} <span className="text-[var(--hm-brand-500)]">*</span>
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
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-3 sm:mb-4">
                      {t('job.additionalDetails')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {getActiveFields().map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                            {t(field.labelKey)}
                            {field.required && " *"}
                          </label>
                          <Input
                            type={field.type}
                            inputSize="lg"
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
                            rightIcon={(field.suffix || field.suffixKey) ? (
                              <span className="text-sm text-[var(--hm-fg-muted)] font-medium">
                                {field.suffixKey ? t(field.suffixKey) : field.suffix}
                              </span>
                            ) : undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cadastral Code Input - Only for architecture/design */}
                {(selectedCategory === "architecture" || selectedCategory === "design") && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-2 sm:mb-3">
                      {t('job.cadastralCode')} <span className="text-[var(--hm-fg-muted)] font-normal text-xs sm:text-sm">({t('common.optional')})</span>
                    </label>
                    <Input
                      value={formData.cadastralId}
                      onChange={(e) => updateFormData("cadastralId", e.target.value)}
                      placeholder="XX.XX.XX.XXX.XXX"
                      className="text-base py-3"
                    />
                    <p className="mt-3 text-sm text-[var(--hm-fg-muted)] leading-relaxed">
                      {t('job.cadastralCodeHelpsIdentifyThe')}
                    </p>
                  </div>
                )}

                {/* Land Area Input - Only for house/building with architecture/design */}
                {(formData.propertyType === "house" || formData.propertyType === "building") && (selectedCategory === "architecture" || selectedCategory === "design") && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-2 sm:mb-3">
                      {t('job.landArea')}
                    </label>
                    <Input
                      type="number"
                      inputSize="lg"
                      min="0"
                      value={formData.landArea}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || parseFloat(value) >= 0) {
                          updateFormData("landArea", value);
                        }
                      }}
                      placeholder="5007"
                      rightIcon={
                        <span className="text-sm text-[var(--hm-fg-muted)] font-medium">m²</span>
                      }
                    />
                    <p className="mt-3 text-sm text-[var(--hm-fg-muted)] leading-relaxed">
                      {t('job.specifyTheLandPlotArea')}
                    </p>
                  </div>
                )}

                {/* Property Condition Selector - For relevant categories */}
                {selectedCategory && categoriesNeedingCondition.includes(selectedCategory) && (
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-3 sm:mb-4">
                      {t('job.propertyCondition')}
                    </label>
                    <ConditionSelector
                      value={formData.propertyCondition}
                      onChange={(value) => updateFormData("propertyCondition", value)}
                      locale={locale as "en" | "ka" | "ru"}
                      category={selectedCategory}
                    />
                    <p className="mt-4 text-sm text-[var(--hm-fg-muted)] leading-relaxed">
                      {t('job.propertyConditionHelpsProfessionalsProvide')}
                    </p>
                  </div>
                )}

            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === "location" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 sm:p-5">
                <h2 className="text-lg font-bold text-[var(--hm-fg-primary)] mb-0.5">
                  {t('job.locationBudget')}
                </h2>
                <p className="text-sm sm:text-base text-[var(--hm-fg-muted)] mb-4 sm:mb-6">
                  {t("postJob.locationBudgetSubtitle")}
                </p>

                <div className="space-y-5 sm:space-y-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-2">
                      {t('job.jobAddress')} <span className="text-[var(--hm-brand-500)]">*</span>
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
                      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,78,36,0.06)', border: '1px solid rgba(239,78,36,0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                          {t('common.budget')}
                        </p>
                        <p className="text-lg font-bold mt-1" style={{ color: 'var(--hm-brand-500)' }}>
                          {serviceBudgetTotal}₾
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--hm-fg-muted)' }}>
                          {t('postJob.fromServiceBudgets')}
                        </p>
                      </div>
                    ) : null
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-3">
                        {t('common.budget')} <span className="text-[var(--hm-brand-500)]">*</span>
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
                <h1 className="text-lg font-bold text-[var(--hm-fg-primary)] mb-0.5">
                  {t('job.addPhotos')}
                </h1>
                <p className="text-xs text-[var(--hm-fg-muted)]">
                  {t("postJob.photosRequirementHelp")}
                </p>
              </div>

              <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] p-4 space-y-4">
                {/* Photos - Enhanced with explanation */}
                <div className={`p-4 sm:p-5 lg:p-6 rounded-2xl border-2 transition-all ${
                  (existingMedia.length + mediaFiles.length) > 0
                    ? 'bg-[var(--hm-success-50)]/50 border-[var(--hm-success-100)]'
                    : 'bg-[var(--hm-warning-50)]/50 border-[var(--hm-warning-100)]'
                }`}>
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (existingMedia.length + mediaFiles.length) > 0
                        ? 'bg-[var(--hm-success-100)]'
                        : 'bg-[var(--hm-warning-100)]'
                    }`}>
                      <ImageIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'text-[var(--hm-success-500)]'
                          : 'text-[var(--hm-warning-500)]'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-1">
                        {t('job.addPhotos')} <span className="text-[var(--hm-brand-500)]">*</span>
                      </label>
                      <p className="text-sm text-[var(--hm-fg-muted)] leading-relaxed">
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
                        <span key={i} className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--hm-bg-elevated)]/80 border border-[var(--hm-border)] text-xs sm:text-sm text-[var(--hm-fg-secondary)]">
                          <span className="text-[var(--hm-brand-500)]">{tip.icon}</span>
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upload area and previews */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center flex-shrink-0 p-0 shadow-none [&_svg]:size-6 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'border-[var(--hm-success-500)]/20 hover:border-emerald-400 hover:bg-[var(--hm-success-100)]/50 text-[var(--hm-success-500)] hover:text-[var(--hm-success-500)]'
                          : 'border-[var(--hm-warning-500)]/20 hover:border-amber-400 hover:bg-[var(--hm-warning-100)]/50 text-[var(--hm-warning-500)] hover:text-[var(--hm-warning-500)]'
                      }`}
                    >
                      <span className="flex flex-col items-center gap-1">
                        <Plus />
                        <span className="text-xs font-medium">
                          {t('common.add')}
                        </span>
                      </span>
                    </Button>

                    {/* Preview - Existing */}
                    {existingMedia.map((media, idx) => (
                      <div key={`existing-${idx}`} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
                        <Image src={storage.getFileUrl(media.url)} alt="Uploaded media" fill className="object-cover" sizes="96px" />
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeExistingMedia(idx)}
                          aria-label={t('common.remove')}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-[var(--hm-error-500)] shadow-none [&_svg]:size-3.5"
                        >
                          <X />
                        </Button>
                      </div>
                    ))}

                    {/* Preview - New */}
                    {mediaFiles.map((media, idx) => (
                      <div key={`new-${idx}`} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] flex-shrink-0 ring-2 ring-emerald-200 ring-offset-2">
                        <Image src={media.preview} alt="Preview" fill className="object-cover" sizes="96px" unoptimized />
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => removeMediaFile(idx)}
                          aria-label={t('common.remove')}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 hover:bg-[var(--hm-error-500)] shadow-none [&_svg]:size-3.5"
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Success state */}
                  {(existingMedia.length + mediaFiles.length) > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--hm-success-500)]">
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
                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--hm-warning-500)]">
                      <AlertTriangle className="w-4 h-4" />
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
                <h1 className="text-lg font-bold text-[var(--hm-fg-primary)] mb-0.5">
                  {t('job.reviewYourJobPost')}
                </h1>
                <p className="text-xs text-[var(--hm-fg-muted)]">
                  {t('job.pleaseEnsureAllDetailsAre')}
                </p>
              </div>

              {/* Hero card — Title + Category + Timing + Budget */}
              <div
                className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                style={{ backgroundColor: 'rgba(239,78,36,0.06)', border: '1px solid rgba(239,78,36,0.15)' }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToStep("category")}
                  leftIcon={<Pencil className="w-3 h-3" />}
                  className="absolute top-2 right-2 h-7 text-[11px] text-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-brand-500)]/10"
                >
                  {t('common.edit')}
                </Button>

                {/* Title */}
                <h2 className="text-base sm:text-lg font-bold pr-16" style={{ color: 'var(--hm-fg-primary)' }}>
                  {formData.title}
                </h2>
                <p className="text-[13px] mt-1 line-clamp-2" style={{ color: 'var(--hm-fg-secondary)' }}>
                  {formData.description}
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedCategoryData && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,78,36,0.12)', color: 'var(--hm-brand-500)' }}>
                      <CategoryIcon type={selectedCategory} className="w-3.5 h-3.5" />
                      {pick({ en: selectedCategoryData.name, ka: selectedCategoryData.nameKa })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--hm-bg-elevated)', color: 'var(--hm-fg-secondary)', border: '1px solid var(--hm-border-subtle)' }}>
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,78,36,0.12)', color: 'var(--hm-brand-500)' }}>
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
                  style={{ backgroundColor: 'var(--hm-bg-elevated)', border: '1px solid var(--hm-border-subtle)' }}
                >
                  <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--hm-border-subtle)' }}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                      {t('job.service')} ({selectedJobServices.length})
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => goToStep("category")}
                      className="text-[11px]"
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--hm-border-subtle)' }}>
                    {selectedJobServices.map(svc => {
                      const qty = svc.quantity || 1;
                      const lineTotal = svc.budget * qty;
                      return (
                        <div key={svc.serviceKey} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-medium block truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                              {pick({ en: svc.name, ka: svc.nameKa })}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
                              {qty > 1 ? `${qty} × ` : ''}{pick({ en: svc.unitName, ka: svc.unitNameKa })}
                              {svc.budget > 0 && qty > 1 && (
                                <span className="ml-1">· {svc.budget}₾/{pick({ en: svc.unitName, ka: svc.unitNameKa })}</span>
                              )}
                            </span>
                          </div>
                          {svc.budget > 0 && (
                            <span className="text-[13px] font-bold shrink-0 ml-3" style={{ color: 'var(--hm-brand-500)' }}>
                              {lineTotal}₾
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {/* Total row when multiple services have budgets */}
                    {serviceBudgetTotal > 0 && selectedJobServices.filter(s => s.budget > 0).length > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'rgba(239,78,36,0.04)' }}>
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--hm-fg-secondary)' }}>
                          {t('common.total')}
                        </span>
                        <span className="text-[14px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
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
                style={{ backgroundColor: 'var(--hm-bg-elevated)', border: '1px solid var(--hm-border-subtle)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                  <MapPin className="w-4 h-4" style={{ color: 'var(--hm-fg-secondary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                    {formData.location}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--hm-bg-tertiary)', color: 'var(--hm-fg-secondary)' }}>
                      {formData.propertyType === "apartment" && t('job.apartment')}
                      {formData.propertyType === "house" && t('job.house')}
                      {formData.propertyType === "office" && t('job.office')}
                      {formData.propertyType === "building" && t('job.building')}
                      {formData.propertyType === "other" && t('common.other')}
                    </span>
                    {formData.propertyCondition && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]">
                        {formData.propertyCondition === "shell" && t('job.shell')}
                        {formData.propertyCondition === "black-frame" && t('job.blackFrame')}
                        {formData.propertyCondition === "needs-renovation" && t('job.fullRenovation')}
                        {formData.propertyCondition === "partial-renovation" && t('job.partial')}
                        {formData.propertyCondition === "good" && t('job.good')}
                      </span>
                    )}
                    {formData.areaSize && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--hm-bg-tertiary)', color: 'var(--hm-fg-secondary)' }}>{formData.areaSize} m²</span>}
                    {formData.roomCount && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--hm-bg-tertiary)', color: 'var(--hm-fg-secondary)' }}>{formData.roomCount} {t('job.rooms')}</span>}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => goToStep("location")}
                  className="text-[11px] shrink-0"
                >
                  {t('common.edit')}
                </Button>
              </div>

              {/* Photos */}
              {(existingMedia.length > 0 || mediaFiles.length > 0) && (
                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: 'var(--hm-bg-elevated)', border: '1px solid var(--hm-border-subtle)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                      {t('common.photos')} ({existingMedia.length + mediaFiles.length})
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => goToStep("details")}
                      className="text-[11px]"
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {existingMedia.map((media, idx) => (
                      <div key={`re-${idx}`} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                        <Image src={storage.getFileUrl(media.url)} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => (
                      <div key={`rn-${idx}`} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                        <Image src={media.preview} alt="" fill className="object-cover" sizes="80px" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-[11px] text-[var(--hm-fg-muted)] pt-1">
                {t('job.willBeReviewedByAdmins')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation — sit above the mobile bottom nav (58px + iOS safe area) */}
      <footer className="fixed left-0 right-0 z-40 lg:bottom-0 bottom-[calc(58px+env(safe-area-inset-bottom))]">
        <div className="bg-[var(--hm-bg-elevated)] border-t border-[var(--hm-border-subtle)] shadow-[0_-4px_12px_rgba(20,18,14,0.06)]">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              {getCurrentStepIndex() > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  {t('common.back')}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  leftIcon={<X className="w-4 h-4" />}
                  className="text-[var(--hm-fg-muted)]"
                >
                  {t('common.cancel')}
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentStep === "category" && !canProceedFromCategory()) ||
                  (currentStep === "location" && !canProceedFromLocation()) ||
                  (currentStep === "details" && !canProceedFromDetails())
                }
                leftIcon={isSubmitting ? <LoadingSpinner size="xs" color="white" /> : undefined}
                rightIcon={currentStep === "review" ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {currentStep === "review" ? t('job.postJob') : t('common.continue')}
              </Button>
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
          <div className="min-h-screen flex items-center justify-center bg-[var(--hm-bg-page)]">
            <LoadingSpinner size="xl" variant="border" color={ACCENT_COLOR} />
          </div>
        }
      >
        <PostJobPageContent />
      </Suspense>
    </AuthGuard>
  );
}

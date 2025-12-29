"use client";

import AddressPicker from "@/components/common/AddressPicker";
import AuthGuard from "@/components/common/AuthGuard";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Step = "category" | "location" | "details" | "review";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const STEPS: { id: Step; label: string; labelKa: string }[] = [
  { id: "category", label: "Category", labelKa: "კატეგორია" },
  { id: "location", label: "Location & Budget", labelKa: "ლოკაცია და ბიუჯეტი" },
  { id: "details", label: "Details", labelKa: "დეტალები" },
  { id: "review", label: "Review", labelKa: "გადახედვა" },
];

// Category icons - Custom illustrated style
const CategoryIcon = ({ type, className = "" }: { type: string; className?: string }) => {
  switch (type) {
    case "designer":
      // Sofa/Interior design icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M4 22V20C4 18.3431 5.34315 17 7 17H25C26.6569 17 28 18.3431 28 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 17V14C6 12.8954 6.89543 12 8 12H24C25.1046 12 26 12.8954 26 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="4" y="22" width="24" height="4" rx="1.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 26V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M24 26V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="16" cy="8" r="2" fill="currentColor"/>
        </svg>
      );
    case "architect":
      // Blueprint/Building icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M6 28V10L16 4L26 10V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 28H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <rect x="10" y="14" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="18" y="14" width="4" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 28V23C13 22.4477 13.4477 22 14 22H18C18.5523 22 19 22.4477 19 23V28" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
        </svg>
      );
    case "craftsmen":
      // Hammer & wrench icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M7 25L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 27L7 25L9 27L7 29L5 27Z" fill="currentColor"/>
          <path d="M19 7C16.7909 7 15 8.79086 15 11C15 11.7403 15.1928 12.4373 15.5305 13.0427L9.5 19.5L12.5 22.5L18.9573 16.4695C19.5627 16.8072 20.2597 17 21 17C23.2091 17 25 15.2091 25 13C25 12.6712 24.9585 12.3522 24.88 12.047L22 15L19 12L21.953 9.12C21.6478 9.04154 21.3288 9 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M24 20L20 24L22 26L28 20L26 18L24 20Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case "homecare":
      // Home with sparkle icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <path d="M5 14L16 5L27 14V26C27 26.5523 26.5523 27 26 27H6C5.44772 27 5 26.5523 5 26V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 27V19C12 18.4477 12.4477 18 13 18H19C19.5523 18 20 18.4477 20 19V27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 8L24 10L26 11L24 12L23 14L22 12L20 11L22 10L23 8Z" fill="currentColor"/>
          <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      );
    default:
      // Grid/Services icon
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="18" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="5" y="18" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <rect x="18" y="18" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>
          <circle cx="22.5" cy="9.5" r="1.5" fill="currentColor"/>
          <circle cx="9.5" cy="22.5" r="1.5" fill="currentColor"/>
          <circle cx="22.5" cy="22.5" r="1.5" fill="currentColor"/>
        </svg>
      );
  }
};

function PostJobPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
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
    propertyType: "apartment" as "apartment" | "office" | "building" | "house" | "other",
    budgetType: "fixed" as "fixed" | "range" | "negotiable",
    budgetMin: "",
    budgetMax: "",
    timing: "flexible" as "asap" | "this_week" | "this_month" | "flexible",
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
        { key: "roomCount", type: "number", labelEn: "Rooms", labelKa: "ოთახები", placeholderEn: "3", placeholderKa: "3" },
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
      { key: "roomCount", type: "number", labelEn: "Rooms", labelKa: "ოთახები", placeholderEn: "4", placeholderKa: "4" },
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
    return locale === "ka"
      ? "დეტალურად აღწერე რა გინდა გაკეთდეს - რაც მეტი ინფორმაცია მიაწვდი, მით უფრო ზუსტ შეთავაზებებს მიიღებ."
      : "Describe in detail what you need - the more information you provide, the more accurate quotes you'll receive.";
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
        setSelectedSubcategory(job.skills?.[0] || "");

        setFormData({
          title: job.title || "",
          description: job.description || "",
          location: job.location || "",
          propertyType: job.propertyType || "apartment",
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
  const canProceedFromLocation = () => formData.location && (formData.budgetType === "negotiable" || formData.budgetMin);
  const canProceedFromDetails = () => formData.title.trim() && formData.description.trim();

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
      router.back();
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

      const jobData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: selectedCategory,
        skills: [selectedSubcategory],
        location: formData.location,
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetType === "negotiable" ? 0 : Number(formData.budgetMin),
        budgetMax: formData.budgetType === "negotiable" ? 0 : (formData.budgetMax ? Number(formData.budgetMax) : Number(formData.budgetMin)),
      };

      // Add category-specific fields if they have values
      if (formData.cadastralId) jobData.cadastralId = formData.cadastralId;
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.pointsCount) jobData.pointsCount = Number(formData.pointsCount);
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);
      if (formData.landArea) jobData.landArea = Number(formData.landArea);

      const allMedia = [...existingMedia, ...uploadedMedia];
      if (allMedia.length > 0) {
        jobData.images = allMedia.filter((m) => m.type === "image").map((m) => m.url);
      }

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        await api.post("/jobs", jobData);
      }

      toast.success(
        isEditMode
          ? locale === "ka" ? "პროექტი განახლდა" : "Project updated"
          : locale === "ka" ? "პროექტი შეიქმნა" : "Project created",
        isEditMode
          ? locale === "ka" ? "თქვენი პროექტი წარმატებით განახლდა" : "Your project has been successfully updated"
          : locale === "ka" ? "თქვენი პროექტი წარმატებით გამოქვეყნდა" : "Your project has been successfully posted"
      );

      trackEvent(isEditMode ? AnalyticsEvent.JOB_EDIT : AnalyticsEvent.JOB_POST, {
        jobCategory: selectedCategory,
        jobBudget: Number(formData.budgetMax) || Number(formData.budgetMin),
      });

      router.push("/my-jobs");
    } catch (err: unknown) {
      console.error("Failed to save job:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save project";
      setError(errorMessage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "პროექტის შენახვა ვერ მოხერხდა" : "Failed to save project"
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
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <Header />
      <HeaderSpacer />

      {/* Progress Header - Compact */}
      <div className="bg-white border-b border-neutral-100 sticky top-[60px] z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="font-medium">{getCurrentStepIndex() + 1}/{STEPS.length}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{locale === "ka" ? STEPS[getCurrentStepIndex()].labelKa : STEPS[getCurrentStepIndex()].label}</span>
            </div>
            <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C4735B] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#C4735B]">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>
      </div>

      <main className={`flex-1 py-4 lg:py-5 transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* STEP 1: Category Selection */}
          {currentStep === "category" && (
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Left: Main Content */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                    {locale === "ka" ? "პროექტის დეტალები" : "Project Details"}
                  </h1>
                  <p className="text-sm text-neutral-500">
                    {locale === "ka"
                      ? "აირჩიე ობიექტის ტიპი, კატეგორია და სერვისი"
                      : "Select property type, category and service"}
                  </p>
                </div>

                {/* Property Type Selection with Icons */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    {locale === "ka" ? "ობიექტის ტიპი" : "Property Type"} <span className="text-[#C4735B]">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: "apartment", labelEn: "Apartment", labelKa: "ბინა", icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
                        </svg>
                      )},
                      { value: "house", labelEn: "House", labelKa: "სახლი", icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
                          <path d="M9 21V14h6v7" />
                        </svg>
                      )},
                      { value: "office", labelEn: "Office", labelKa: "ოფისი", icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="7" width="18" height="14" rx="1" />
                          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <path d="M12 12v4M8 12h8" />
                        </svg>
                      )},
                      { value: "building", labelEn: "Building", labelKa: "შენობა", icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="5" y="3" width="14" height="18" rx="1" />
                          <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
                          <path d="M10 21v-3h4v3" />
                        </svg>
                      )},
                      { value: "other", labelEn: "Other", labelKa: "სხვა", icon: (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 8v4M12 16h.01" />
                        </svg>
                      )},
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => updateFormData("propertyType", type.value)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                          formData.propertyType === type.value
                            ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                            : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                        }`}
                      >
                        {type.icon}
                        <span className="text-[10px] font-medium">
                          {locale === "ka" ? type.labelKa : type.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Cards - Horizontal compact layout */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    {locale === "ka" ? "კატეგორია" : "Category"} <span className="text-[#C4735B]">*</span>
                  </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {categories.map((category) => {
                    const isSelected = selectedCategory === category.key;
                    return (
                      <button
                        key={category.key}
                        onClick={() => {
                          setSelectedCategory(category.key);
                          setSelectedSubcategory("");
                          setSubcategorySearch("");
                        }}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                          isSelected
                            ? "border-[#C4735B] bg-[#C4735B]/5 shadow-sm"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 transition-colors ${
                          isSelected ? "bg-[#C4735B] text-white" : "bg-neutral-100 text-neutral-500"
                        }`}>
                          <CategoryIcon type={category.icon || ""} className="w-5 h-5" />
                        </div>
                        <h3 className={`text-xs font-medium transition-colors ${
                          isSelected ? "text-[#C4735B]" : "text-neutral-700"
                        }`}>
                          {locale === "ka" ? category.nameKa : category.name}
                        </h3>
                      </button>
                    );
                  })}
                </div>
                </div>

                {/* Subcategories Panel - Compact */}
                {selectedCategory && selectedCategoryData && (
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                          <CategoryIcon type={selectedCategoryData.icon || ""} className="w-3.5 h-3.5 text-[#C4735B]" />
                        </div>
                        <span className="font-medium text-sm text-neutral-900">
                          {locale === "ka" ? "სერვისი" : "Service"} <span className="text-[#C4735B]">*</span>
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={subcategorySearch}
                          onChange={(e) => setSubcategorySearch(e.target.value)}
                          placeholder={locale === "ka" ? "ძებნა..." : "Search..."}
                          className="pl-8 pr-3 py-1.5 w-36 rounded-lg border border-neutral-200 bg-neutral-50 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                        />
                        <svg className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {filteredSubcategories.map((sub) => {
                        const isSubSelected = selectedSubcategory === sub.key;
                        return (
                          <button
                            key={sub.key}
                            onClick={() => {
                              setSelectedSubcategory(isSubSelected ? "" : sub.key);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSubSelected
                                ? "bg-[#C4735B] text-white"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            }`}
                          >
                            {locale === "ka" ? sub.nameKa : sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category-specific fields */}
                {selectedSubcategory && getActiveFields().length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <h3 className="text-sm font-medium text-neutral-900 mb-3">
                      {locale === "ka" ? "დამატებითი დეტალები" : "Additional Details"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getActiveFields().map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                            {locale === "ka" ? field.labelKa : field.labelEn}
                            {field.required && " *"}
                          </label>
                          <div className="relative">
                            <input
                              type={field.type}
                              value={formData[field.key as keyof typeof formData] || ""}
                              onChange={(e) => updateFormData(field.key, e.target.value)}
                              placeholder={locale === "ka" ? field.placeholderKa : field.placeholderEn}
                              className={`w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] ${
                                field.suffix ? "pr-10" : ""
                              }`}
                            />
                            {field.suffix && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
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
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      {locale === "ka" ? "საკადასტრო კოდი" : "Cadastral Code"} <span className="text-neutral-400 font-normal">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cadastralId}
                      onChange={(e) => updateFormData("cadastralId", e.target.value)}
                      placeholder="XX.XX.XX.XXX.XXX"
                      className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                    />
                    <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
                      {locale === "ka"
                        ? "საკადასტრო კოდი გვეხმარება ობიექტის იდენტიფიცირებაში."
                        : "Cadastral code helps identify the property."}
                    </p>
                  </div>
                )}

                {/* Land Area Input - Only for house/building with architecture/design */}
                {(formData.propertyType === "house" || formData.propertyType === "building") && (selectedCategory === "architecture" || selectedCategory === "design") && (
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      {locale === "ka" ? "მიწის ფართობი" : "Land Area"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.landArea}
                        onChange={(e) => updateFormData("landArea", e.target.value)}
                        placeholder={locale === "ka" ? "500" : "500"}
                        className="w-full px-3 py-2.5 pr-12 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                        m²
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-500 leading-relaxed">
                      {locale === "ka"
                        ? "მიუთითე მიწის ნაკვეთის ფართობი კვადრატულ მეტრებში."
                        : "Specify the land plot area in square meters."}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Hints Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-[120px] space-y-4">
                  {/* Hint Card */}
                  <div className="bg-gradient-to-br from-[#C4735B]/5 to-[#C4735B]/10 rounded-xl border border-[#C4735B]/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C4735B] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-sm text-[#C4735B]">
                        {locale === "ka" ? "რჩევა" : "Tip"}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {getActiveHint()}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Budget */}
          {currentStep === "location" && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <h2 className="text-lg font-bold text-neutral-900 mb-3">
                  {locale === "ka" ? "ლოკაცია და ბიუჯეტი" : "Location & Budget"}
                </h2>

                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      {locale === "ka" ? "სამუშაო მისამართი" : "Job Address"} <span className="text-[#C4735B]">*</span>
                    </label>
                    <AddressPicker
                      value={formData.location}
                      onChange={(value) => updateFormData("location", value)}
                      locale={locale}
                      required
                    />
                  </div>

                  {/* Budget Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">
                      {locale === "ka" ? "ბიუჯეტის ტიპი" : "Budget Type"} <span className="text-[#C4735B]">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateFormData("budgetType", "fixed");
                          updateFormData("budgetMax", "");
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                          formData.budgetType === "fixed"
                            ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {locale === "ka" ? "ფიქსირებული" : "Fixed"}
                      </button>
                      <button
                        onClick={() => updateFormData("budgetType", "range")}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                          formData.budgetType === "range"
                            ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {locale === "ka" ? "დიაპაზონი" : "Range"}
                      </button>
                      <button
                        onClick={() => {
                          updateFormData("budgetType", "negotiable");
                          updateFormData("budgetMin", "0");
                          updateFormData("budgetMax", "");
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                          formData.budgetType === "negotiable"
                            ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {locale === "ka" ? "შეთანხმებით" : "Negotiable"}
                      </button>
                    </div>
                  </div>

                  {/* Budget Inputs - Only show for fixed and range */}
                  {formData.budgetType !== "negotiable" && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        {formData.budgetType === "fixed"
                          ? (locale === "ka" ? "თანხა (GEL)" : "Amount (GEL)")
                          : (locale === "ka" ? "დიაპაზონი (GEL)" : "Range (GEL)")} <span className="text-[#C4735B]">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                          <input
                            type="number"
                            value={formData.budgetMin}
                            onChange={(e) => updateFormData("budgetMin", e.target.value)}
                            placeholder={formData.budgetType === "fixed" ? "100" : "50"}
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                          />
                        </div>
                        {formData.budgetType === "range" && (
                          <>
                            <span className="text-neutral-300">—</span>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₾</span>
                              <input
                                type="number"
                                value={formData.budgetMax}
                                onChange={(e) => updateFormData("budgetMax", e.target.value)}
                                placeholder="150"
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timing Selection */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">
                      {locale === "ka" ? "როდის გჭირდება?" : "When do you need it?"} <span className="text-[#C4735B]">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: "flexible", labelEn: "Flexible", labelKa: "მოქნილი" },
                        { value: "asap", labelEn: "ASAP", labelKa: "სასწრაფოდ" },
                        { value: "this_week", labelEn: "This week", labelKa: "ამ კვირაში" },
                        { value: "this_month", labelEn: "This month", labelKa: "ამ თვეში" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateFormData("timing", option.value)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                            formData.timing === option.value
                              ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                              : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                          }`}
                        >
                          {locale === "ka" ? option.labelKa : option.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === "details" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "პროექტის დეტალები" : "Project Details"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "აღწერე რა გინდა გაკეთდეს" : "Describe what needs to be done"}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    {locale === "ka" ? "სათაური" : "Title"} <span className="text-[#C4735B]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder={locale === "ka" ? "მაგ: მილების შეკეთება" : "e.g. Kitchen pipe repair"}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                    {locale === "ka" ? "აღწერა" : "Description"} <span className="text-[#C4735B]">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    rows={3}
                    placeholder={locale === "ka"
                      ? "აღწერე პრობლემა ან რა გინდა გაკეთდეს..."
                      : "Describe the problem or what needs to be done..."}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#C4735B] resize-none"
                  />
                </div>


                {/* Photos - Enhanced with explanation */}
                <div className={`p-4 rounded-xl border-2 transition-all ${
                  (existingMedia.length + mediaFiles.length) > 0
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/60'
                }`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      (existingMedia.length + mediaFiles.length) > 0
                        ? 'bg-emerald-100'
                        : 'bg-amber-100'
                    }`}>
                      <ImageIcon className={`w-5 h-5 ${
                        (existingMedia.length + mediaFiles.length) > 0
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-semibold text-neutral-800 mb-0.5">
                        {locale === "ka" ? "დაამატე ფოტოები" : "Add Photos"}
                        <span className="ml-1.5 text-xs font-normal text-neutral-400">
                          ({locale === "ka" ? "რეკომენდირებული" : "recommended"})
                        </span>
                      </label>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {locale === "ka"
                          ? "ფოტოები ეხმარება პროფესიონალებს უკეთ გაიგონ რა გჭირდება და მოგცენ ზუსტი შეფასება"
                          : "Photos help professionals better understand what you need and give you accurate quotes"}
                      </p>
                    </div>
                  </div>

                  {/* Tips when no photos */}
                  {(existingMedia.length + mediaFiles.length) === 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {[
                        { icon: "📸", text: locale === "ka" ? "პრობლემის ადგილი" : "Problem area" },
                        { icon: "📐", text: locale === "ka" ? "ზომები" : "Dimensions" },
                        { icon: "🎨", text: locale === "ka" ? "სასურველი სტილი" : "Desired style" },
                      ].map((tip, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 border border-amber-200/50 text-xs text-neutral-600">
                          <span>{tip.icon}</span>
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Upload area and previews */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all flex-shrink-0 ${
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
                      <Plus className={`w-5 h-5 ${
                        (existingMedia.length + mediaFiles.length) > 0 ? 'text-emerald-500' : 'text-amber-500'
                      }`} />
                      <span className={`text-[10px] font-medium mt-0.5 ${
                        (existingMedia.length + mediaFiles.length) > 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {locale === "ka" ? "დამატება" : "Add"}
                      </span>
                    </button>

                    {/* Preview - Existing */}
                    {existingMedia.map((media, idx) => (
                      <div key={`existing-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-1">
                        <img src={storage.getFileUrl(media.url)} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeExistingMedia(idx)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}

                    {/* Preview - New */}
                    {mediaFiles.map((media, idx) => (
                      <div key={`new-${idx}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 ring-2 ring-emerald-200 ring-offset-1">
                        <img src={media.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeMediaFile(idx)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Success state */}
                  {(existingMedia.length + mediaFiles.length) > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {locale === "ka"
                          ? `${existingMedia.length + mediaFiles.length} ფოტო დამატებულია - პროფესიონალები უკეთ გაიგებენ შენს პროექტს!`
                          : `${existingMedia.length + mediaFiles.length} photo${(existingMedia.length + mediaFiles.length) > 1 ? 's' : ''} added - pros will better understand your project!`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review - Compact */}
          {currentStep === "review" && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="mb-2">
                <h1 className="text-lg font-bold text-neutral-900">
                  {locale === "ka" ? "გადახედე შენს პროექტს" : "Review your Job Post"}
                </h1>
                <p className="text-xs text-neutral-500">
                  {locale === "ka"
                    ? "გთხოვთ დარწმუნდეთ რომ ყველა დეტალი სწორია."
                    : "Please ensure all details are correct before publishing."}
                </p>
              </div>

              {/* Service Details - Compact */}
              <div className="bg-white rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                      <CategoryIcon type={selectedCategoryData?.icon || ""} className="w-3 h-3 text-[#C4735B]" />
                    </div>
                    {locale === "ka" ? "სერვისი" : "Service"}
                  </h3>
                  <button onClick={() => goToStep("category")} className="text-[#C4735B] hover:underline p-1">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-neutral-400 mb-0.5">{locale === "ka" ? "კატეგორია" : "Category"}</p>
                    <p className="font-medium text-neutral-900">
                      {locale === "ka" ? selectedCategoryData?.nameKa : selectedCategoryData?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 mb-0.5">{locale === "ka" ? "ტიპი" : "Type"}</p>
                    <p className="font-medium text-neutral-900">
                      {(() => {
                        const sub = selectedCategoryData?.subcategories.find((s) => s.key === selectedSubcategory);
                        return locale === "ka" ? sub?.nameKa : sub?.name;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Budget - Combined Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-[#C4735B]" />
                      </div>
                      {locale === "ka" ? "ლოკაცია" : "Location"}
                    </h3>
                    <button onClick={() => goToStep("location")} className="text-[#C4735B] hover:underline p-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-medium text-neutral-900 line-clamp-1">{formData.location}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
                    {formData.propertyType === "apartment" && (locale === "ka" ? "ბინა" : "Apartment")}
                    {formData.propertyType === "house" && (locale === "ka" ? "სახლი" : "House")}
                    {formData.propertyType === "office" && (locale === "ka" ? "ოფისი" : "Office")}
                    {formData.propertyType === "building" && (locale === "ka" ? "შენობა" : "Building")}
                    {formData.propertyType === "other" && (locale === "ka" ? "სხვა" : "Other")}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-[#C4735B]" />
                      </div>
                      {locale === "ka" ? "ბიუჯეტი" : "Budget"}
                    </h3>
                    <button onClick={() => goToStep("location")} className="text-[#C4735B] hover:underline p-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-medium text-neutral-900">
                    {formData.budgetType === "negotiable"
                      ? (locale === "ka" ? "შეთანხმებით" : "Negotiable")
                      : formData.budgetType === "range"
                      ? `${formData.budgetMin} - ${formData.budgetMax} GEL`
                      : `${formData.budgetMin} GEL`}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      formData.timing === "asap"
                        ? "bg-red-100 text-red-700"
                        : formData.timing === "this_week"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-neutral-100 text-neutral-700"
                    }`}>
                      {formData.timing === "flexible" && (locale === "ka" ? "მოქნილი" : "Flexible")}
                      {formData.timing === "asap" && (locale === "ka" ? "სასწრაფოდ" : "ASAP")}
                      {formData.timing === "this_week" && (locale === "ka" ? "ამ კვირაში" : "This week")}
                      {formData.timing === "this_month" && (locale === "ka" ? "ამ თვეში" : "This month")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description - Compact */}
              <div className="bg-white rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    {locale === "ka" ? "აღწერა" : "Description"}
                  </h3>
                  <button onClick={() => goToStep("details")} className="text-[#C4735B] hover:underline p-1">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <h4 className="text-xs font-medium text-neutral-900 mb-1">{formData.title}</h4>
                <p className="text-neutral-600 text-xs leading-relaxed line-clamp-2">{formData.description}</p>
              </div>

              {/* Photos - Compact */}
              {(existingMedia.length > 0 || mediaFiles.length > 0) && (
                <div className="bg-white rounded-xl border border-neutral-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-900 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                        <ImageIcon className="w-3 h-3 text-[#C4735B]" />
                      </div>
                      {locale === "ka" ? "ფოტოები" : "Photos"} ({existingMedia.length + mediaFiles.length})
                    </h3>
                    <button onClick={() => goToStep("details")} className="text-[#C4735B] hover:underline p-1">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {existingMedia.map((media, idx) => (
                      <div key={`review-existing-${idx}`} className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100">
                        <img src={storage.getFileUrl(media.url)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => (
                      <div key={`review-new-${idx}`} className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100">
                        <img src={media.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Note - Compact */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 py-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {locale === "ka"
                  ? "გადაიხილება ადმინისტრატორის მიერ 24 საათში."
                  : "Will be reviewed by admins within 24 hours."}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation - Compact */}
      <footer className="sticky bottom-0 bg-white border-t border-neutral-100 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {locale === "ka" ? "უკან" : "Back"}
            </button>

            <button
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (currentStep === "category" && !canProceedFromCategory()) ||
                (currentStep === "location" && !canProceedFromLocation()) ||
                (currentStep === "details" && !canProceedFromDetails())
              }
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{locale === "ka" ? "..." : "..."}</span>
                </>
              ) : currentStep === "review" ? (
                <>
                  <span>{locale === "ka" ? "გამოქვეყნება" : "Post Job"}</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>{locale === "ka" ? "გაგრძელება" : "Continue"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
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
            <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
          </div>
        }
      >
        <PostJobPageContent />
      </Suspense>
    </AuthGuard>
  );
}

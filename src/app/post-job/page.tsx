"use client";

import AddressPicker from "@/components/common/AddressPicker";
import AuthGuard from "@/components/common/AuthGuard";
import CategorySubcategorySelector from "@/components/common/CategorySubcategorySelector";
import DatePicker from "@/components/common/DatePicker";
import Header, { HeaderSpacer } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  DollarSign,
  FileText,
  Home,
  Image,
  Link2,
  MessageSquare,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

interface Reference {
  type: "link" | "image" | "pinterest" | "instagram";
  url: string;
  title?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const PROPERTY_TYPES = [
  {
    value: "apartment",
    label: "Apartment",
    labelKa: "ბინა",
    icon: "apartment",
  },
  { value: "house", label: "House", labelKa: "სახლი", icon: "house" },
  { value: "office", label: "Office", labelKa: "ოფისი", icon: "office" },
  { value: "building", label: "Building", labelKa: "შენობა", icon: "building" },
  { value: "other", label: "Other", labelKa: "სხვა", icon: "other" },
];

const BUDGET_TYPES = [
  {
    value: "fixed",
    label: "Fixed Budget",
    labelKa: "ფიქსირებული",
    icon: "fixed",
  },
  {
    value: "range",
    label: "Budget Range",
    labelKa: "დიაპაზონი",
    icon: "range",
  },
  { value: "per_sqm", label: "Per m²", labelKa: "კვ.მ-ზე", icon: "sqm" },
  {
    value: "negotiable",
    label: "Negotiable",
    labelKa: "შეთანხმებით",
    icon: "negotiable",
  },
];

// Property Type Icons Component
const PropertyIcon = ({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) => {
  switch (type) {
    case "apartment":
      return <Building2 className={className} />;
    case "house":
      return <Home className={className} />;
    case "office":
      return <Briefcase className={className} />;
    case "building":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
          <path
            d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return <Sparkles className={className} />;
  }
};

// Budget Type Icons Component
const BudgetIcon = ({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) => {
  switch (type) {
    case "fixed":
      return <DollarSign className={className} />;
    case "range":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sqm":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      );
    default:
      return <MessageSquare className={className} />;
  }
};

function PostJobPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editJobId = searchParams.get("edit");
  const isEditMode = !!editJobId;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Category selection state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    propertyType: "",
    propertyTypeOther: "",
    areaSize: "",
    roomCount: "",
    deadline: "",
    budgetType: "negotiable",
    budgetAmount: "",
    budgetMin: "",
    budgetMax: "",
    pricePerUnit: "",
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<
    { type: "image" | "video"; url: string }[]
  >([]);
  const [newReferenceUrl, setNewReferenceUrl] = useState("");
  const [references, setReferences] = useState<Reference[]>([]);
  const [notifyAllPros, setNotifyAllPros] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auth check
  useEffect(() => {
    const canPostJob = user?.role === "client" || user?.role === "pro";
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
        setSelectedSubcategories(job.skills || []);

        setFormData({
          title: job.title || "",
          description: job.description || "",
          location: job.location || "",
          propertyType: job.propertyType || "",
          propertyTypeOther: job.propertyTypeOther || "",
          areaSize: job.areaSize?.toString() || "",
          roomCount: job.roomCount?.toString() || "",
          deadline: job.deadline ? job.deadline.split("T")[0] : "",
          budgetType: job.budgetType || "negotiable",
          budgetAmount: job.budgetAmount?.toString() || "",
          budgetMin: job.budgetMin?.toString() || "",
          budgetMax: job.budgetMax?.toString() || "",
          pricePerUnit: job.pricePerUnit?.toString() || "",
        });

        if (job.references) setReferences(job.references);
        if (job.media?.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images?.length > 0) {
          setExistingMedia(
            job.images.map((url: string) => ({ type: "image" as const, url }))
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch job:", err);
        setError("Failed to load job data");
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobData();
  }, [editJobId, isAuthenticated]);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const addReference = () => {
    if (!newReferenceUrl.trim()) return;
    let type: Reference["type"] = "link";
    if (newReferenceUrl.includes("pinterest")) type = "pinterest";
    else if (newReferenceUrl.includes("instagram")) type = "instagram";
    setReferences((prev) => [...prev, { type, url: newReferenceUrl.trim() }]);
    setNewReferenceUrl("");
  };

  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation state
  const getValidationState = () => {
    const hasCategory = !!selectedCategory;
    const hasSpecialty =
      selectedSubcategories.length > 0 || customSpecialties.length > 0;
    const hasTitle = !!formData.title.trim();
    const hasDescription = !!formData.description.trim();
    const hasPropertyType =
      !!formData.propertyType &&
      (formData.propertyType !== "other" ||
        !!formData.propertyTypeOther.trim());

    let budgetValid = true;
    if (formData.budgetType === "fixed") budgetValid = !!formData.budgetAmount;
    if (formData.budgetType === "range")
      budgetValid = !!formData.budgetMin && !!formData.budgetMax;
    if (formData.budgetType === "per_sqm")
      budgetValid = !!formData.pricePerUnit;

    return {
      category: hasCategory,
      specialty: hasSpecialty,
      title: hasTitle,
      description: hasDescription,
      propertyType: hasPropertyType,
      budget: budgetValid,
    };
  };

  const validation = getValidationState();
  const completedFields = Object.values(validation).filter(Boolean).length;
  const totalFields = Object.keys(validation).length;
  const progressPercent = (completedFields / totalFields) * 100;

  const canSubmit = (): boolean => {
    return Object.values(validation).every(Boolean);
  };

  const getFirstMissingField = () => {
    if (!validation.category)
      return {
        key: "category",
        label: locale === "ka" ? "კატეგორია" : "Category",
      };
    if (!validation.specialty)
      return {
        key: "specialty",
        label: locale === "ka" ? "სპეციალობა" : "Specialty",
      };
    if (!validation.title)
      return { key: "title", label: locale === "ka" ? "სათაური" : "Title" };
    if (!validation.description)
      return {
        key: "description",
        label: locale === "ka" ? "აღწერა" : "Description",
      };
    if (!validation.propertyType)
      return {
        key: "propertyType",
        label: locale === "ka" ? "ობიექტის ტიპი" : "Property type",
      };
    if (!validation.budget)
      return { key: "budget", label: locale === "ka" ? "ბიუჯეტი" : "Budget" };
    return null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedMedia: { type: "image" | "video"; url: string }[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        setUploadProgress(Math.round((i / mediaFiles.length) * 50));
        const formDataUpload = new FormData();
        formDataUpload.append("file", mediaFile.file);
        const uploadRes = await api.post("/upload", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedMedia.push({
          type: mediaFile.type,
          url: uploadRes.data.url || uploadRes.data.filename,
        });
      }

      setUploadProgress(75);

      const jobData: any = {
        title: formData.title,
        description: formData.description,
        category: selectedCategory,
        skills: [...selectedSubcategories, ...customSpecialties],
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
      };

      if (formData.propertyType === "other" && formData.propertyTypeOther) {
        jobData.propertyTypeOther = formData.propertyTypeOther;
      }
      if (formData.location) jobData.location = formData.location;
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);
      if (formData.deadline) jobData.deadline = formData.deadline;

      if (formData.budgetType === "fixed" && formData.budgetAmount) {
        jobData.budgetAmount = Number(formData.budgetAmount);
      }
      if (formData.budgetType === "range") {
        if (formData.budgetMin) jobData.budgetMin = Number(formData.budgetMin);
        if (formData.budgetMax) jobData.budgetMax = Number(formData.budgetMax);
      }
      if (formData.budgetType === "per_sqm" && formData.pricePerUnit) {
        jobData.pricePerUnit = Number(formData.pricePerUnit);
      }

      if (references.length > 0) jobData.references = references;

      if (uploadedMedia.length) {
        jobData.images = uploadedMedia
          .filter((m) => m.type === "image")
          .map((m) => m.url);
      } else if (isEditMode && existingMedia.length > 0) {
        jobData.images = existingMedia
          .filter((m) => m.type === "image")
          .map((m) => m.url);
      }

      setUploadProgress(90);

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        await api.post("/jobs", jobData);
      }

      setUploadProgress(100);

      toast.success(
        isEditMode
          ? locale === "ka"
            ? "პროექტი განახლდა"
            : "Project updated"
          : locale === "ka"
            ? "პროექტი შეიქმნა"
            : "Project created",
        isEditMode
          ? locale === "ka"
            ? "თქვენი პროექტი წარმატებით განახლდა"
            : "Your project has been successfully updated"
          : locale === "ka"
            ? "თქვენი პროექტი წარმატებით გამოქვეყნდა"
            : "Your project has been successfully posted"
      );

      router.push("/my-jobs");
    } catch (err: any) {
      console.error("Failed to save job:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} project`
      );
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka"
          ? `პროექტის ${isEditMode ? "განახლება" : "შექმნა"} ვერ მოხერხდა`
          : `Failed to ${isEditMode ? "update" : "create"} project`
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Loading State
  if (authLoading || isLoadingJob) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
        <Header />
        <HeaderSpacer />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E07B4F]/10 to-[#E8956A]/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#E07B4F] animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-[#E07B4F]/20 border-t-[#E07B4F] animate-spin" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {locale === "ka" ? "იტვირთება..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalSpecialties =
    selectedSubcategories.length + customSpecialties.length;

  // Progress steps configuration
  const progressSteps = [
    {
      key: "category",
      label: locale === "ka" ? "კატეგორია" : "Category",
      completed: validation.category && validation.specialty,
    },
    {
      key: "details",
      label: locale === "ka" ? "დეტალები" : "Details",
      completed:
        validation.title && validation.description && validation.propertyType,
    },
    {
      key: "budget",
      label: locale === "ka" ? "ბიუჯეტი" : "Budget",
      completed: validation.budget,
    },
    {
      key: "media",
      label: locale === "ka" ? "მედია" : "Media",
      completed: true,
    }, // Optional
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <Header />
      <HeaderSpacer />

      <main
        className={`flex-1 pt-6 sm:pt-8 pb-28 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Header Section */}
          <div
            className="postjob-header animate-postjob-fade-in"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="postjob-back group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>{locale === "ka" ? "უკან" : "Back"}</span>
              </button>

              {/* Title */}
              <h1 className="postjob-title">
                {isEditMode ? (
                  locale === "ka" ? (
                    <>
                      პროექტის <span>რედაქტირება</span>
                    </>
                  ) : (
                    <>
                      Edit Your <span>Project</span>
                    </>
                  )
                ) : locale === "ka" ? (
                  <>
                    აღწერე შენი <span>პროექტი</span>
                  </>
                ) : (
                  <>
                    Describe Your <span>Project</span>
                  </>
                )}
              </h1>
            </div>

            <p className="postjob-subtitle">
              {locale === "ka"
                ? "შეავსე დეტალები და მიიღე შეთავაზებები საუკეთესო პროფესიონალებისგან."
                : "Fill in the details and receive proposals from top professionals."}
            </p>
          </div>

          {/* Progress Bar */}
          <div
            className="animate-postjob-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="postjob-progress-bar mb-6">
              <div
                className="postjob-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="postjob-progress-steps">
              {progressSteps.map((step, index) => {
                const isActive =
                  index === progressSteps.findIndex((s) => !s.completed);
                return (
                  <div key={step.key} className="postjob-progress-step">
                    <div
                      className={`postjob-progress-dot ${step.completed ? "completed" : isActive ? "active" : ""}`}
                    >
                      {step.completed ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="postjob-progress-label">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="mt-8"
          >
            {/* Section 1: Category & Specializations */}
            <section
              className="postjob-section animate-postjob-slide-up"
              style={{ animationDelay: "150ms" }}
            >
              <div className="postjob-section-header">
                <div
                  className={`postjob-section-number ${validation.category && validation.specialty ? "completed" : totalSpecialties > 0 || selectedCategory ? "active" : ""}`}
                >
                  {validation.category && validation.specialty ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    "1"
                  )}
                </div>
                <div className="postjob-section-info">
                  <div className="postjob-section-title">
                    <h2>
                      {locale === "ka" ? "რა გჭირდება?" : "What do you need?"}
                    </h2>
                    {!validation.category && (
                      <span className="postjob-section-required">
                        {locale === "ka" ? "სავალდებულო" : "Required"}
                      </span>
                    )}
                  </div>
                  <p className="postjob-section-desc">
                    {locale === "ka"
                      ? "აირჩიე კატეგორია და სპეციალობა"
                      : "Select category and specialty"}
                  </p>
                </div>
              </div>

              <div className="postjob-card">
                <CategorySubcategorySelector
                  selectedCategory={selectedCategory}
                  selectedSubcategories={selectedSubcategories}
                  onCategoryChange={setSelectedCategory}
                  onSubcategoriesChange={setSelectedSubcategories}
                  customSpecialties={customSpecialties}
                  onCustomSpecialtiesChange={setCustomSpecialties}
                  showCustomSpecialties={false}
                  singleCategoryMode={true}
                />
              </div>
            </section>

            {/* Section 2: Project Details */}
            <section
              className="postjob-section animate-postjob-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="postjob-section-header">
                <div
                  className={`postjob-section-number ${validation.title && validation.description && validation.propertyType ? "completed" : totalSpecialties > 0 ? "active" : ""}`}
                >
                  {validation.title &&
                  validation.description &&
                  validation.propertyType ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    "2"
                  )}
                </div>
                <div className="postjob-section-info">
                  <div className="postjob-section-title">
                    <h2>
                      {locale === "ka"
                        ? "პროექტის დეტალები"
                        : "Project Details"}
                    </h2>
                    {totalSpecialties > 0 &&
                      (!validation.title ||
                        !validation.description ||
                        !validation.propertyType) && (
                        <span className="postjob-section-required">
                          {locale === "ka" ? "შეავსე" : "Fill in"}
                        </span>
                      )}
                  </div>
                  <p className="postjob-section-desc">
                    {locale === "ka"
                      ? "აღწერე რა გინდა გაკეთდეს"
                      : "Describe what needs to be done"}
                  </p>
                </div>
              </div>

              <div className="postjob-card space-y-5">
                {/* Title */}
                <div>
                  <label className="postjob-label">
                    <span>
                      {locale === "ka" ? "პროექტის სათაური" : "Project Title"}
                    </span>
                    <span
                      className={`postjob-label-check ${validation.title ? "filled" : "empty"}`}
                    >
                      {validation.title && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder={
                      locale === "ka"
                        ? "მაგ: 2 ოთახიანი ბინის რემონტი"
                        : "e.g. 2-bedroom apartment renovation"
                    }
                    className={`postjob-input ${validation.title ? "filled" : ""}`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="postjob-label">
                    <span>{locale === "ka" ? "აღწერა" : "Description"}</span>
                    <span
                      className={`postjob-label-check ${validation.description ? "filled" : "empty"}`}
                    >
                      {validation.description && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    rows={4}
                    placeholder={
                      locale === "ka"
                        ? "დეტალურად აღწერე რა გინდა გაკეთდეს..."
                        : "Describe what you need in detail..."
                    }
                    className="postjob-textarea"
                  />
                </div>

                {/* Property Type */}
                <div>
                  <label className="postjob-label">
                    <span>
                      {locale === "ka" ? "ობიექტის ტიპი" : "Property Type"}
                    </span>
                    <span
                      className={`postjob-label-check ${validation.propertyType ? "filled" : "empty"}`}
                    >
                      {validation.propertyType && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </span>
                  </label>
                  <div className="postjob-option-grid cols-5">
                    {PROPERTY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          updateFormData("propertyType", type.value);
                          if (type.value !== "other")
                            updateFormData("propertyTypeOther", "");
                        }}
                        className={`postjob-option ${formData.propertyType === type.value ? "selected" : ""}`}
                      >
                        <PropertyIcon
                          type={type.icon}
                          className="postjob-option-icon"
                        />
                        <span className="postjob-option-label">
                          {locale === "ka" ? type.labelKa : type.label}
                        </span>
                        <span className="postjob-option-check">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      </button>
                    ))}
                  </div>
                  {formData.propertyType === "other" && (
                    <input
                      type="text"
                      value={formData.propertyTypeOther}
                      onChange={(e) =>
                        updateFormData("propertyTypeOther", e.target.value)
                      }
                      placeholder={
                        locale === "ka"
                          ? "მიუთითე ობიექტის ტიპი..."
                          : "Specify property type..."
                      }
                      className="postjob-input mt-3"
                    />
                  )}
                </div>

                {/* Size & Rooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="postjob-label">
                      <span>
                        {locale === "ka" ? "ფართობი (მ²)" : "Area (m²)"}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.areaSize}
                      onChange={(e) =>
                        updateFormData("areaSize", e.target.value)
                      }
                      placeholder="100"
                      className="postjob-input"
                    />
                  </div>
                  <div>
                    <label className="postjob-label">
                      <span>
                        {locale === "ka"
                          ? "ოთახების რაოდენობა"
                          : "Number of Rooms"}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.roomCount}
                      onChange={(e) =>
                        updateFormData("roomCount", e.target.value)
                      }
                      placeholder="3"
                      className="postjob-input"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="postjob-label">
                    <Calendar className="w-4 h-4 text-[#E07B4F]" />
                    <span>
                      {locale === "ka"
                        ? "სასურველი დასრულების თარიღი"
                        : "Preferred Deadline"}
                    </span>
                  </label>
                  <DatePicker
                    value={formData.deadline}
                    onChange={(value) => updateFormData("deadline", value)}
                    min={new Date().toISOString().split("T")[0]}
                    locale={locale}
                    placeholder={
                      locale === "ka" ? "აირჩიე თარიღი" : "Select date"
                    }
                  />
                </div>

                {/* Location */}
                <div>
                  <AddressPicker
                    value={formData.location}
                    onChange={(value) => updateFormData("location", value)}
                    locale={locale}
                    label={locale === "ka" ? "მდებარეობა" : "Location"}
                    required={false}
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Budget */}
            <section
              className="postjob-section animate-postjob-slide-up"
              style={{ animationDelay: "250ms" }}
            >
              <div className="postjob-section-header">
                <div
                  className={`postjob-section-number ${validation.budget ? "completed" : validation.title && validation.description && validation.propertyType ? "active" : ""}`}
                >
                  {validation.budget ? <Check className="w-6 h-6" /> : "3"}
                </div>
                <div className="postjob-section-info">
                  <div className="postjob-section-title">
                    <h2>{locale === "ka" ? "ბიუჯეტი" : "Budget"}</h2>
                    {validation.title &&
                      validation.description &&
                      validation.propertyType &&
                      !validation.budget && (
                        <span className="postjob-section-required">
                          {locale === "ka" ? "მიუთითე" : "Specify"}
                        </span>
                      )}
                  </div>
                  <p className="postjob-section-desc">
                    {locale === "ka"
                      ? "რამდენის დახარჯვა გეგმავ?"
                      : "How much are you planning to spend?"}
                  </p>
                </div>
              </div>

              <div className="postjob-card">
                {/* Budget Type Selection */}
                <div className="postjob-option-grid cols-4 mb-5">
                  {BUDGET_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFormData("budgetType", type.value)}
                      className={`postjob-option ${formData.budgetType === type.value ? "selected" : ""}`}
                    >
                      <BudgetIcon
                        type={type.icon}
                        className="postjob-option-icon"
                      />
                      <span className="postjob-option-label">
                        {locale === "ka" ? type.labelKa : type.label}
                      </span>
                      <span className="postjob-option-check">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    </button>
                  ))}
                </div>

                {/* Budget Input Fields */}
                {formData.budgetType === "fixed" && (
                  <div>
                    <label className="postjob-label">
                      <DollarSign className="w-4 h-4 text-[#E07B4F]" />
                      <span>
                        {locale === "ka"
                          ? "ბიუჯეტის თანხა (₾)"
                          : "Budget Amount (₾)"}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.budgetAmount}
                      onChange={(e) =>
                        updateFormData("budgetAmount", e.target.value)
                      }
                      placeholder="5000"
                      className="postjob-input text-lg font-semibold"
                    />
                  </div>
                )}

                {formData.budgetType === "range" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="postjob-label">
                        <span>
                          {locale === "ka" ? "მინიმუმ (₾)" : "Minimum (₾)"}
                        </span>
                      </label>
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) =>
                          updateFormData("budgetMin", e.target.value)
                        }
                        placeholder="3000"
                        className="postjob-input text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="postjob-label">
                        <span>
                          {locale === "ka" ? "მაქსიმუმ (₾)" : "Maximum (₾)"}
                        </span>
                      </label>
                      <input
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) =>
                          updateFormData("budgetMax", e.target.value)
                        }
                        placeholder="8000"
                        className="postjob-input text-lg font-semibold"
                      />
                    </div>
                  </div>
                )}

                {formData.budgetType === "per_sqm" && (
                  <div>
                    <label className="postjob-label">
                      <span>
                        {locale === "ka"
                          ? "ფასი კვ.მ-ზე (₾)"
                          : "Price per m² (₾)"}
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) =>
                        updateFormData("pricePerUnit", e.target.value)
                      }
                      placeholder="50"
                      className="postjob-input text-lg font-semibold"
                    />
                    {formData.areaSize && formData.pricePerUnit && (
                      <p className="mt-3 text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                        <span>
                          {locale === "ka"
                            ? "სავარაუდო ჯამი:"
                            : "Estimated total:"}
                        </span>
                        <span className="font-bold text-[#E07B4F] text-lg">
                          ₾
                          {(
                            Number(formData.areaSize) *
                            Number(formData.pricePerUnit)
                          ).toLocaleString()}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {formData.budgetType === "negotiable" && (
                  <div className="postjob-negotiable">
                    <div className="postjob-negotiable-icon">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <p className="postjob-negotiable-text">
                      {locale === "ka"
                        ? "პროფესიონალები შემოგთავაზებენ საკუთარ ფასებს"
                        : "Professionals will propose their own prices"}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 4: Media & References */}
            <section
              className="postjob-section animate-postjob-slide-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="postjob-section-header">
                <div className="postjob-section-number">4</div>
                <div className="postjob-section-info">
                  <div className="postjob-section-title">
                    <h2>
                      {locale === "ka"
                        ? "ფოტოები და ინსპირაცია"
                        : "Photos & Inspiration"}
                    </h2>
                  </div>
                  <p className="postjob-section-desc">
                    {locale === "ka"
                      ? "არასავალდებულო - დაეხმარე პროფესიონალს"
                      : "Optional - help pros understand"}
                  </p>
                </div>
              </div>

              <div className="postjob-card space-y-5">
                {/* Existing Media (Edit Mode) */}
                {isEditMode && existingMedia.length > 0 && (
                  <div>
                    <label className="postjob-label">
                      <Image className="w-4 h-4 text-[#E07B4F]" />
                      <span>
                        {locale === "ka"
                          ? "არსებული ფოტოები"
                          : "Current Photos"}{" "}
                        ({existingMedia.length})
                      </span>
                    </label>
                    <div className="postjob-media-grid">
                      {existingMedia.map((media, idx) => (
                        <div key={idx} className="postjob-media-item">
                          <img src={storage.getFileUrl(media.url)} alt="" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div>
                  <label className="postjob-label">
                    <Upload className="w-4 h-4 text-[#E07B4F]" />
                    <span>
                      {locale === "ka" ? "ატვირთე ფოტოები" : "Upload Photos"}
                    </span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="postjob-upload"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="postjob-upload-icon">
                      <Image />
                    </div>
                    <p className="postjob-upload-title">
                      {locale === "ka" ? "ატვირთე ფოტოები" : "Upload photos"}
                    </p>
                    <p className="postjob-upload-subtitle">PNG, JPG, MP4</p>
                  </div>
                </div>

                {/* New Files Preview */}
                {mediaFiles.length > 0 && (
                  <div className="postjob-media-grid">
                    {mediaFiles.map((media, idx) => (
                      <div key={idx} className="postjob-media-item">
                        {media.type === "image" ? (
                          <img src={media.preview} alt="" />
                        ) : (
                          <video src={media.preview} />
                        )}
                        <div className="postjob-media-overlay">
                          <button
                            type="button"
                            onClick={() => removeMediaFile(idx)}
                            className="postjob-media-remove"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* References/Inspiration Links */}
                <div>
                  <label className="postjob-label">
                    <Link2 className="w-4 h-4 text-[#E07B4F]" />
                    <span>
                      {locale === "ka"
                        ? "ინსპირაციის ბმულები"
                        : "Inspiration Links"}
                    </span>
                  </label>
                  <div className="postjob-ref-input">
                    <input
                      type="url"
                      value={newReferenceUrl}
                      onChange={(e) => setNewReferenceUrl(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addReference())
                      }
                      placeholder={
                        locale === "ka"
                          ? "Pinterest, Instagram..."
                          : "Pinterest, Instagram..."
                      }
                      className="postjob-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={addReference}
                      disabled={!newReferenceUrl.trim()}
                      className="postjob-ref-add"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {references.length > 0 && (
                    <div className="postjob-ref-list">
                      {references.map((ref, idx) => (
                        <div key={idx} className="postjob-ref-item">
                          <Link2 className="postjob-ref-icon" />
                          <span className="postjob-ref-url">{ref.url}</span>
                          <button
                            type="button"
                            onClick={() => removeReference(idx)}
                            className="postjob-ref-remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Notify All Professionals */}
            <section
              className="postjob-section animate-postjob-slide-up"
              style={{ animationDelay: "350ms" }}
            >
              <div
                onClick={() => setNotifyAllPros(!notifyAllPros)}
                className={`postjob-notify ${notifyAllPros ? "active" : ""}`}
              >
                <div className="postjob-notify-checkbox">
                  {notifyAllPros && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="postjob-notify-content">
                  <div className="postjob-notify-header">
                    <Bell className="postjob-notify-icon" />
                    <span className="postjob-notify-title">
                      {locale === "ka"
                        ? "მიიღეთ მეტი შეთავაზება"
                        : "Get More Proposals"}
                    </span>
                    <span className="postjob-notify-badge">
                      {locale === "ka" ? "რეკომენდებული" : "Recommended"}
                    </span>
                  </div>
                  <p className="postjob-notify-desc">
                    {locale === "ka"
                      ? "ჩართვით ადასტურებთ რომ მიუვიდეს შეტყობინება ყველა შესაბამის პროფესიონალს თქვენი პროექტის შესახებ."
                      : "Notify all matching professionals about your project and receive more proposals faster."}
                  </p>
                </div>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="postjob-error animate-postjob-fade-in">
                <AlertCircle className="postjob-error-icon" />
                <p className="postjob-error-text">{error}</p>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Submit Footer */}
      <div className="postjob-footer">
        <div className="postjob-footer-inner">
          {/* Progress indicator */}
          {!canSubmit() && (
            <div className="postjob-footer-progress">
              <div className="postjob-footer-ring">
                <svg viewBox="0 0 36 36">
                  <circle
                    className="postjob-footer-ring-bg"
                    cx="18"
                    cy="18"
                    r="14"
                  />
                  <circle
                    className="postjob-footer-ring-fill"
                    cx="18"
                    cy="18"
                    r="14"
                    strokeDasharray={`${progressPercent * 0.88} 88`}
                  />
                </svg>
                <span className="postjob-footer-ring-text">
                  {completedFields}/{totalFields}
                </span>
              </div>
              <span className="postjob-footer-hint">
                {getFirstMissingField()?.label}
              </span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector("form");
              if (form) form.requestSubmit();
            }}
            disabled={isSubmitting || !canSubmit()}
            className={`postjob-submit ${canSubmit() ? "ready" : "disabled"}`}
          >
            {isSubmitting ? (
              <>
                <div className="postjob-submit-spinner" />
                <span>
                  {uploadProgress > 0
                    ? `${uploadProgress}%`
                    : locale === "ka"
                      ? "მიმდინარეობს..."
                      : "Processing..."}
                </span>
              </>
            ) : canSubmit() ? (
              <>
                <span>
                  {isEditMode
                    ? locale === "ka"
                      ? "შენახვა"
                      : "Save Changes"
                    : locale === "ka"
                      ? "გამოქვეყნება"
                      : "Publish Project"}
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <span>
                {locale === "ka" ? "შეავსე ველები" : "Fill required fields"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <AuthGuard allowedRoles={["client", "pro", "company", "admin"]}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E07B4F]"></div>
          </div>
        }
      >
        <PostJobPageContent />
      </Suspense>
    </AuthGuard>
  );
}

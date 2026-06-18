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
import { useCountry } from "@/hooks/useCountry";
import { currencySymbol } from "@/utils/currency";
import { api } from "@/lib/api";
import { aiService, type PriceCheckResult } from "@/services/ai";
import { storage } from "@/services/storage";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Calculator,
    Camera,
    Check,
    Clock,
    Image as ImageIcon,
    MapPin,
    Palette,
    MessageCircle,
    Pencil,
    Plus,
    Ruler,
    X
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { backOrNavigate, defaultBackFallback } from "@/utils/navigationUtils";
import { clearFormDraft, getFormDraft, useFormDraft, useHasFormDraft } from "@/hooks/useFormDraft";

type Step = "category" | "location" | "review";

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
}

const STEP_IDS: Step[] = ["category", "location", "review"];

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
  // Marketplace from the URL segment - stamped onto the job so it
  // shows up under the right /{country}/jobs listing.
  const country = useCountry();
  const sym = currencySymbol({ country });
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editJobId = searchParams.get("edit");
  const isEditMode = !!editJobId;

  // Draft persistence (sessionStorage). Skip in edit mode - the user
  // is updating an existing job, mixing in a saved-elsewhere draft
  // would corrupt the form. Key is user-scoped so two accounts on
  // one machine don't see each other's drafts.
  const draftEnabled = !isEditMode && !!user?.id;
  const draftKey = `homi:postJob:draft:${user?.id ?? "anon"}`;
  interface PostJobDraft {
    currentStep: Step;
    selectedCategory: string;
    selectedSubcategory: string;
    selectedJobServices: JobServiceSelection[];
    formData: {
      title: string;
      description: string;
      location: string;
      propertyType: PropertyType;
      propertyCondition: PropertyCondition | "";
      budgetType: BudgetType;
      budgetMin: string;
      budgetMax: string;
      timing: Timing;
      cadastralId: string;
      areaSize: string;
      pointsCount: string;
      roomCount: string;
      landArea: string;
    };
  }
  const savedDraft = getFormDraft<PostJobDraft>(draftKey, draftEnabled);
  const hasDraft = useHasFormDraft(draftKey, draftEnabled);
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(hasDraft);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(savedDraft?.currentStep ?? "category");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false); // Ref to prevent double submission
  const [error, setError] = useState<string | null>(null);
  // Opt-in AI price estimate for the budget step (doesn't auto-fire).
  const [estimate, setEstimate] = useState<PriceCheckResult | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>(savedDraft?.selectedCategory ?? "");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(savedDraft?.selectedSubcategory ?? "");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [selectedJobServices, setSelectedJobServices] = useState<JobServiceSelection[]>(savedDraft?.selectedJobServices ?? []);

  const [formData, setFormData] = useState(savedDraft?.formData ?? {
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

  // Persist on every change (debounced inside the hook). Disabled in
  // edit mode and for unauthenticated users.
  useFormDraft<PostJobDraft>(
    draftKey,
    {
      currentStep,
      selectedCategory,
      selectedSubcategory,
      selectedJobServices,
      formData,
    },
    draftEnabled,
  );

  const handleDiscardDraft = () => {
    clearFormDraft(draftKey);
    setShowDraftBanner(false);
    setCurrentStep("category");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedJobServices([]);
    setFormData({
      title: "",
      description: "",
      location: "",
      propertyType: "apartment",
      propertyCondition: "",
      budgetType: "fixed",
      budgetMin: "",
      budgetMax: "",
      timing: "flexible",
      cadastralId: "",
      areaSize: "",
      pointsCount: "",
      roomCount: "",
      landArea: "",
    });
    toast.info(t("postJob.draft.discarded"));
  };

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
  // Per-file upload progress (0-100), keyed by index in mediaFiles.
  // Tracked separately from isSubmitting so the UI can show a per
  // thumbnail bar instead of one generic spinner - on a slow phone
  // connection the difference between "this looks frozen" and
  // "57% done on photo 3" is huge.
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});

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

  // Raw `services` array as stored on the job. Stashed separately so
  // we can hydrate it into `selectedJobServices` once the catalog
  // (which carries display names + market ranges) is available - the
  // service picker can't render selections without those derived
  // fields, so prefilling on raw fetch wouldn't be enough.
  const [pendingServicesToHydrate, setPendingServicesToHydrate] = useState<
    Array<{
      key: string;
      categoryKey?: string;
      unitKey?: string;
      quantity?: number;
      unitPrice?: number;
      unit?: string;
      budgetMin?: number;
      budgetMax?: number;
      notes?: string;
    }>
  >([]);

  // Fetch job data for edit mode. AbortController cancels the first
  // Strict Mode mount's request so the Network tab doesn't show a
  // duplicate `GET /jobs/:id` on every page load in dev.
  useEffect(() => {
    if (!editJobId || !isAuthenticated) return;

    const controller = new AbortController();
    const fetchJobData = async () => {
      setIsLoadingJob(true);
      try {
        const response = await api.get(`/jobs/${editJobId}`, {
          signal: controller.signal,
        });
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

        // Stash raw services for the hydrate effect below. Previously
        // edit mode silently dropped the user's service picks - the
        // form opened with an empty service picker and a re-save
        // would overwrite their selections to nothing.
        if (Array.isArray(job.services) && job.services.length > 0) {
          setPendingServicesToHydrate(job.services);
        }

        if (job.media?.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images?.length > 0) {
          setExistingMedia(job.images.map((url: string) => ({ type: "image" as const, url })));
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "CanceledError") return;
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        console.error("Failed to fetch job:", err);
        setError(t("job.failedToLoadJob"));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingJob(false);
        }
      }
    };

    fetchJobData();

    return () => controller.abort();
  }, [editJobId, isAuthenticated]);

  // Hydrate `selectedJobServices` once both the edit job's raw services
  // AND the service catalog are available. We need to walk the
  // catalog to resolve display names, unit labels, and market price
  // bounds for each saved service - those fields aren't persisted on
  // the job document, just on the catalog. Fires once per
  // `pendingServicesToHydrate` change and self-clears so it doesn't
  // re-fire on every category update.
  useEffect(() => {
    if (pendingServicesToHydrate.length === 0) return;
    if (!categories || categories.length === 0) return;

    const hydrated: JobServiceSelection[] = [];
    for (const saved of pendingServicesToHydrate) {
      // Find the catalog service by key, walking categories →
      // subcategories → services. O(small * small * small) on a
      // typical catalog so this is fine to do inline.
      let foundCat: typeof categories[number] | undefined;
      let foundSvc: NonNullable<typeof categories[number]["subcategories"][number]["services"]>[number] | undefined;
      for (const cat of categories) {
        for (const sub of cat.subcategories || []) {
          const svc = (sub.services || []).find((s) => s.key === saved.key);
          if (svc) {
            foundCat = cat;
            foundSvc = svc;
            break;
          }
        }
        if (foundSvc) break;
      }
      if (!foundSvc || !foundCat) {
        // Catalog evolved since the job was posted and the service
        // no longer exists. Skip silently - the user can re-pick.
        continue;
      }
      // Match the unit option the user picked at post time (by
      // unitKey), fall back to primary unit if missing or stale.
      const unitOpts = foundSvc.unitOptions || [];
      const matchedUnit =
        unitOpts.find((u) => u.key === saved.unitKey) ?? unitOpts[0];
      hydrated.push({
        serviceKey: foundSvc.key,
        categoryKey: saved.categoryKey || foundCat.key,
        name: foundSvc.name,
        nameKa: foundSvc.nameKa,
        unit: matchedUnit?.unit ?? saved.unit ?? foundSvc.unit,
        unitKey: matchedUnit?.key ?? saved.unitKey,
        unitName: matchedUnit
          ? pick({ en: matchedUnit.label.en, ka: matchedUnit.label.ka })
          : foundSvc.unitName,
        unitNameKa: matchedUnit?.label.ka ?? foundSvc.unitNameKa,
        quantity: saved.quantity || 1,
        budget: saved.unitPrice ?? 0,
        marketMin: matchedUnit?.defaultPrice ?? foundSvc.basePrice,
        marketMax:
          matchedUnit?.maxPrice ??
          foundSvc.maxPrice ??
          matchedUnit?.defaultPrice ??
          foundSvc.basePrice,
        useRange:
          saved.budgetMin != null && saved.budgetMax != null ? true : undefined,
        budgetMin: saved.budgetMin,
        budgetMax: saved.budgetMax,
        notes: saved.notes,
      });
    }
    if (hydrated.length > 0) {
      setSelectedJobServices(hydrated);
    }
    // Clear the pending queue so re-renders of `categories` don't
    // keep re-hydrating (which would clobber any user edits made
    // after the initial restore).
    setPendingServicesToHydrate([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingServicesToHydrate, categories]);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-derive a job title since the title input was removed. Falls back
  // through service → category → generic so backend always gets a non-empty
  // title (CreateJobDto still requires it).
  const deriveJobTitle = (): string => {
    if (selectedJobServices.length > 0) {
      const first = selectedJobServices[0];
      const firstName = pick({ en: first.name, ka: first.nameKa });
      return selectedJobServices.length === 1
        ? firstName
        : `${firstName} +${selectedJobServices.length - 1}`;
    }
    if (selectedCategory) {
      const cat = categories.find((c) => c.key === selectedCategory);
      if (cat) return pick({ en: cat.name, ka: cat.nameKa });
    }
    return formData.title.trim() || 'New job';
  };

  const handleGetEstimate = async () => {
    const item = deriveJobTitle();
    if (!item) return;
    setEstimateLoading(true);
    setEstimateError(null);
    try {
      const result = await aiService.getPriceInfo(item, locale, country);
      setEstimate(result);
    } catch {
      setEstimateError(t("postJob.aiEstimate.error"));
    } finally {
      setEstimateLoading(false);
    }
  };

  // Step navigation
  const getCurrentStepIndex = () => STEP_IDS.indexOf(currentStep);
  const progressPercent = ((getCurrentStepIndex() + 1) / STEP_IDS.length) * 100;
  const getStepLabel = (step: Step) => t(`postJob.steps.${step}`);

  const canProceedFromCategory = () => {
    // Title is auto-derived from selected services at submit time, and the
    // description is now optional - neither blocks the step transition.
    //
    // Multi-category mode (added 2026-05): `selectedCategory` is now just
    // the "currently being browsed" category, not the job's category.
    // The real gate is whether the user has picked at least one service;
    // its categoryKey provides the job's primary category at submit time.
    if (!formData.propertyType) return false;
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
  // Photos are optional and live on the location step now - no separate
  // canProceedFromDetails. Kept here as a no-op for any stale call sites.
  const canProceedFromDetails = () => true;

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
      // Role-aware fallback so a client doesn't get sent to the
      // pro-only `/portfolio` route (auth-guard bounces them to `/`).
      backOrNavigate(router, defaultBackFallback(user));
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // File handling
  // Per-photo size cap (10MB) and total photo count cap (20) -
  // previously the picker accepted any number of any-size files and
  // the slow timeout was the first feedback the user got. With these
  // gates we reject oversize images up front with a toast naming
  // both the actual size and the limit, and we cap total count so
  // mobile users don't bulk-import their whole library by accident.
  const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
  const MAX_PHOTO_COUNT = 20;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingMedia.length + mediaFiles.length;
    const slotsRemaining = Math.max(0, MAX_PHOTO_COUNT - totalCount);

    if (slotsRemaining === 0) {
      toast.error(
        t("postJob.maxPhotosReached", { max: MAX_PHOTO_COUNT }),
        t("postJob.maxPhotosReachedBody"),
      );
      // Clear the input so re-selecting the same file fires onChange.
      if (e.target) e.target.value = "";
      return;
    }

    const accepted: File[] = [];
    let rejectedSizeFile: File | null = null;
    for (const file of files) {
      if (file.size > MAX_PHOTO_BYTES) {
        rejectedSizeFile = file;
        continue;
      }
      accepted.push(file);
      if (accepted.length >= slotsRemaining) break;
    }

    if (rejectedSizeFile) {
      const sizeMb = (rejectedSizeFile.size / (1024 * 1024)).toFixed(1);
      toast.error(
        t("postJob.photoTooLarge", { size: `${sizeMb}MB` }),
        t("postJob.photoTooLargeBody", {
          max: Math.round(MAX_PHOTO_BYTES / (1024 * 1024)),
        }),
      );
    }

    if (files.length > slotsRemaining && !rejectedSizeFile) {
      // User selected more files than there's room for; warn so the
      // silent truncation isn't confusing ("I added 30, only 20 are
      // showing").
      toast.error(
        t("postJob.maxPhotosReached", { max: MAX_PHOTO_COUNT }),
        t("postJob.maxPhotosReachedBody"),
      );
    }

    const newFiles: MediaFile[] = accepted.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaFiles((prev) => [...prev, ...newFiles]);

    // Resets the input so picking the SAME file again still fires
    // onChange (browsers debounce the change event when the file list
    // hasn't changed).
    if (e.target) e.target.value = "";
  };

  // Revoke object URLs when the component unmounts so the in-memory
  // preview blobs aren't leaked. The `mediaFiles` dep is intentionally
  // omitted - the cleanup runs once on unmount with the latest closure
  // via the ref pattern below would be over-engineered for a 1KB leak.
  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => {
        try {
          URL.revokeObjectURL(m.preview);
        } catch {
          // ignore - already revoked
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!canProceedFromCategory() || !canProceedFromLocation()) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      // Parallel upload (Promise.all) instead of sequential for-loop.
      // 5 photos x 800ms each was 4s blocking the user; in parallel
      // it drops to ~800-1200ms because the browser uses multiple
      // connections to the same origin. Order of uploads doesn't
      // matter for the final job - the result is collected once they
      // all resolve.
      setUploadProgress({});
      // Resilient upload: allSettled instead of all, so one failed photo
      // doesn't throw away the entire job post. We collect the successes,
      // post the job with those, and warn if any were skipped. Losing the
      // whole submission over a single flaky upload was the worst-case here.
      const uploadResults = await Promise.allSettled(
        mediaFiles.map(async (mediaFile, idx) => {
          const formDataUpload = new FormData();
          formDataUpload.append("file", mediaFile.file);
          const uploadRes = await api.post("/upload", formDataUpload, {
            // Per-photo progress fires throughout the upload. The
            // thumbnail in step 3 overlays a thin bar driven by this
            // value so users on slow networks see motion instead of
            // a frozen submit button.
            onUploadProgress: (event: { loaded: number; total?: number }) => {
              if (!event.total) return;
              const pct = Math.round((event.loaded / event.total) * 100);
              setUploadProgress((prev) => ({ ...prev, [idx]: pct }));
            },
          });
          // Force the bar to 100 even if the last progress event
          // missed - some browsers stop emitting before the response
          // arrives.
          setUploadProgress((prev) => ({ ...prev, [idx]: 100 }));
          return {
            type: mediaFile.type,
            url: (uploadRes.data.url || uploadRes.data.filename) as string,
          };
        }),
      );
      const uploadedMedia = uploadResults
        .filter(
          (r): r is PromiseFulfilledResult<{ type: MediaFile["type"]; url: string }> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
      const failedUploads = uploadResults.length - uploadedMedia.length;
      if (failedUploads > 0) {
        toast.error(t("job.someUploadsFailed"));
      }

      // All jobs expire in 30 days from posting
      const now = new Date();
      const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Primary category: with multi-category support (2026-05), the job
      // schema still wants ONE `category` field. Derive it from the most
      // common category across the selected services so the canonical
      // tag reflects where the bulk of the work sits. Fall back to the
      // legacy `selectedCategory` when no services are picked (shouldn't
      // happen because canProceedFromCategory blocks that).
      const primaryCategory = (() => {
        if (selectedJobServices.length === 0) return selectedCategory;
        const counts = new Map<string, number>();
        for (const s of selectedJobServices) {
          counts.set(s.categoryKey, (counts.get(s.categoryKey) ?? 0) + 1);
        }
        let best = selectedJobServices[0].categoryKey;
        let bestCount = 0;
        for (const [k, n] of counts) {
          if (n > bestCount) { best = k; bestCount = n; }
        }
        return best;
      })();
      // All distinct category keys represented across the picks. Sent as
      // an extra `categories` array - backend currently stores only the
      // primary one but we forward the full set so future filtering work
      // doesn't need a follow-up migration of historical jobs.
      const allCategories = Array.from(
        new Set(selectedJobServices.map(s => s.categoryKey).filter(Boolean)),
      );

      const jobData: Record<string, unknown> = {
        title: deriveJobTitle(),
        description: formData.description,
        category: primaryCategory,
        subcategory: selectedSubcategory,
        skills: [selectedSubcategory],
        location: formData.location,
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
        budgetMin: formData.budgetType === "negotiable" ? 0 : Number(formData.budgetMin),
        budgetMax: formData.budgetType === "negotiable" ? 0 : (formData.budgetMax ? Number(formData.budgetMax) : Number(formData.budgetMin)),
        // Marketplace where the work happens (added 2026-05). Comes
        // from the URL segment - posting under /il/post-job creates
        // an Israeli job, /ge/post-job creates a Georgian one.
        country,
      };

      if (selectedJobServices.length > 0) {
        jobData.services = selectedJobServices.map(svc => ({
          key: svc.serviceKey,
          // Send the per-service category so the backend can route /
          // notify pros from each represented trade, not just the
          // primary one.
          categoryKey: svc.categoryKey,
          unitKey: svc.unitKey,
          quantity: svc.quantity || 1,
          unitPrice: svc.budget,
          unit: svc.unit,
          // Optional flexibility: pass through customer's range and notes when set
          ...(svc.useRange && svc.budgetMin !== undefined && svc.budgetMax !== undefined
            ? { budgetMin: svc.budgetMin, budgetMax: svc.budgetMax }
            : {}),
          ...(svc.notes && svc.notes.trim().length > 0
            ? { notes: svc.notes.trim() }
            : {}),
        }));
        // Skills span every selected service key so the existing
        // pro-matching query (which $in's against skills) surfaces this
        // job to every relevant trade, not just the primary category.
        jobData.skills = selectedJobServices.map(s => s.serviceKey);
        if (allCategories.length > 1) {
          jobData.categories = allCategories;
        }
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

      // Job was saved - the draft has done its job. Wipe it so the
      // user doesn't see a "resume?" banner next time they open the
      // post-job flow.
      clearFormDraft(draftKey);

      // Country-prefixed path skips the middleware redirect that bare
      // `/jobs/:id` would trigger (`/jobs` is country-scoped).
      const countryPrefix = `/${country.toLowerCase()}`;
      if (isEditMode && jobId) {
        // Edit flow: jump straight to the updated detail page so the
        // user can verify their changes landed.
        router.push(`${countryPrefix}/jobs/${jobId}`);
      } else {
        // New job: route through the success page so the user gets a
        // celebration moment + obvious next-steps (view / share /
        // browse pros) instead of being dropped on `/my-jobs` with no
        // guidance. Carries the new job id along for the View CTA.
        const successPath = jobId
          ? `${countryPrefix}/post-job/success?id=${encodeURIComponent(jobId)}`
          : `${countryPrefix}/post-job/success`;
        router.push(successPath);
      }
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

  // `pb-20` (80px) on mobile reserves room for the fixed
  // Cancel/Continue footer (~64px tall + safe-area inset). Was
  // `pb-28` (112px) because the footer used to float 58px above
  // the viewport bottom; with the footer now pinned to bottom-0
  // the larger padding left an empty gap.
  return (
    <div className="flex flex-col min-h-screen pb-36 lg:pb-32 bg-[var(--hm-bg-page)]">
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

          {/* Resume-draft banner. Shown once on mount when a saved
              draft was hydrated. User can either keep working (the
              form is already pre-filled, so the banner is just an
              acknowledgement) or wipe the draft and start over. */}
          {showDraftBanner && !isEditMode && (
            <Alert variant="info" size="sm" className="mb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span>{t("postJob.draft.resumePrompt")}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDraftBanner(false)}
                  >
                    {t("postJob.draft.resume")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardDraft}
                  >
                    {t("postJob.draft.discard")}
                  </Button>
                </div>
              </div>
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

                {/* Description - optional. Title is auto-derived from the
                    selected service(s) at submit time, so no name field here. */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--hm-fg-secondary)] mb-2">
                    {t('common.description')}{" "}
                    <span className="text-[11px] font-normal text-[var(--hm-fg-muted)]">
                      ({t('common.optional')})
                    </span>
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
                  <div
                    className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{
                      boxShadow:
                        '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
                    }}
                  >
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
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.04)]">
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
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.04)]">
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
                  <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.04)]">
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
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 sm:p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.04)]">
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

                  {/* Budget Type Selection - hidden when per-service budgets are set */}
                  {hasServiceBudgets ? (
                    serviceBudgetTotal > 0 ? (
                      <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(239,78,36,0.06)', border: '1px solid rgba(239,78,36,0.2)' }}>
                        <p className="text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                          {t('common.budget')}
                        </p>
                        <p className="text-lg font-bold mt-1" style={{ color: 'var(--hm-brand-500)' }}>
                          {serviceBudgetTotal}{sym}
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
                        currency={sym}
                        locale={locale as "en" | "ka" | "ru"}
                      />
                    </div>
                  )}

                  {/* AI price estimate - opt-in, never auto-fires. */}
                  <div className="mt-4 pt-4 border-t border-[var(--hm-border-subtle)]">
                    {!estimate && (
                      <button
                        type="button"
                        onClick={handleGetEstimate}
                        disabled={estimateLoading || selectedJobServices.length === 0}
                        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--hm-brand-500)] disabled:opacity-50"
                      >
                        {estimateLoading ? (
                          <LoadingSpinner size="xs" color="var(--hm-brand-500)" />
                        ) : (
                          <Calculator className="w-4 h-4" />
                        )}
                        {estimateLoading
                          ? t("postJob.aiEstimate.loading")
                          : t("postJob.aiEstimate.cta")}
                      </button>
                    )}
                    {estimateError && (
                      <p className="text-[12px] mt-1.5" style={{ color: "var(--hm-error-500)" }}>
                        {estimateError}
                      </p>
                    )}
                    {estimate && (
                      <div
                        className="rounded-xl p-3.5"
                        style={{
                          backgroundColor: "var(--hm-bg-tertiary)",
                          border: "1px solid var(--hm-border-subtle)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--hm-fg-muted)" }}
                          >
                            {t("postJob.aiEstimate.title")}
                          </p>
                          <button
                            type="button"
                            onClick={() => setEstimate(null)}
                            aria-label={t("common.close")}
                            style={{ color: "var(--hm-fg-muted)" }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-base font-bold" style={{ color: "var(--hm-brand-500)" }}>
                          {estimate.minPrice}{sym} - {estimate.maxPrice}{sym}
                          {estimate.unit && (
                            <span
                              className="text-[12px] font-normal ml-1.5"
                              style={{ color: "var(--hm-fg-muted)" }}
                            >
                              / {estimate.unit}
                            </span>
                          )}
                        </p>
                        {estimate.tips?.[0] && (
                          <p
                            className="text-[12px] mt-1.5"
                            style={{ color: "var(--hm-fg-secondary)" }}
                          >
                            {estimate.tips[0]}
                          </p>
                        )}
                        <p className="text-[10px] mt-2" style={{ color: "var(--hm-fg-muted)" }}>
                          {t("postJob.aiEstimate.disclaimer")}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Photos card - optional. Folded into the location step so the
                  whole flow is 3 steps instead of 4. */}
              <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border-subtle)] p-4 sm:p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.04)]">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(239,78,36,0.18) 0%, rgba(239,78,36,0.06) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(239,78,36,0.18)',
                    }}
                  >
                    <ImageIcon className="w-5 h-5 text-[var(--hm-brand-500)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--hm-fg-primary)] mb-0.5">
                      {t('job.addPhotos')}{" "}
                      <span className="text-[11px] font-normal text-[var(--hm-fg-muted)]">
                        ({t('common.optional')})
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--hm-fg-muted)] leading-relaxed">
                      {t("postJob.photosRequirementHelp")}
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  // `capture="environment"` hints mobile browsers to
                  // offer "Take photo" alongside "Photo library" -
                  // critical for clients photographing the problem
                  // area on the spot. Desktop browsers ignore it.
                  capture="environment"
                />

                {/* Zero-state: a big inviting drop zone with the
                    suggestion pills tucked inside. Beats a lonely 80px
                    dashed square that the user has to peer at to figure
                    out what's expected. */}
                {(existingMedia.length + mediaFiles.length) === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("job.addPhotos")}
                    className="group w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 px-4 py-7 sm:py-8 transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.99]"
                    style={{
                      borderColor: 'var(--hm-border)',
                      background:
                        'linear-gradient(180deg, rgba(239,78,36,0.04) 0%, transparent 100%)',
                    }}
                  >
                    {/* Halo + camera icon */}
                    <div className="relative">
                      <div
                        className="absolute inset-0 m-auto w-16 h-16 rounded-full blur-xl opacity-60"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(239,78,36,0.25) 0%, transparent 70%)',
                        }}
                        aria-hidden="true"
                      />
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(239,78,36,0.20) 0%, rgba(239,78,36,0.06) 100%)',
                          boxShadow: 'inset 0 0 0 1px rgba(239,78,36,0.20)',
                        }}
                      >
                        <Camera className="w-6 h-6 text-[var(--hm-brand-500)]" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[var(--hm-fg-primary)]">
                        {t('job.addPhotos')}
                      </p>
                      <p className="text-xs text-[var(--hm-fg-muted)] mt-0.5">
                        {t('postJob.photosTapToUploadHint')}
                      </p>
                    </div>
                    {/* Suggestion pills as inline hints, not orphan
                        elements above the upload button. */}
                    <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                      {[
                        { icon: <Camera className="w-3 h-3" />, text: t('job.problemArea') },
                        { icon: <Ruler className="w-3 h-3" />, text: t('job.dimensions') },
                        { icon: <Palette className="w-3 h-3" />, text: t('job.desiredStyle') },
                      ].map((tip, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium"
                          style={{
                            backgroundColor: 'var(--hm-bg-elevated)',
                            color: 'var(--hm-fg-secondary)',
                            border: '1px solid var(--hm-border-subtle)',
                          }}
                        >
                          <span className="text-[var(--hm-brand-500)]">{tip.icon}</span>
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  /* Populated state: thumbnail grid with a compact
                     "+ Add more" tile inline. */
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {existingMedia.map((media, idx) => (
                      <div
                        key={`existing-${idx}`}
                        className="relative aspect-square rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] ring-1 ring-[var(--hm-border-subtle)] transition-all hover:-translate-y-[1px] hover:shadow-md"
                      >
                        <Image src={storage.getFileUrl(media.url)} alt="Uploaded media" fill className="object-cover" sizes="(min-width: 640px) 25vw, 33vw" />
                        <button
                          type="button"
                          onClick={() => removeExistingMedia(idx)}
                          aria-label={t('common.remove')}
                          className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 hover:bg-[var(--hm-error-500)] flex items-center justify-center transition-all active:scale-95"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => {
                      const pct = uploadProgress[idx];
                      const uploading = isSubmitting && pct !== undefined && pct < 100;
                      const uploaded = isSubmitting && pct === 100;
                      return (
                        <div
                          key={`new-${idx}`}
                          className="relative aspect-square rounded-xl overflow-hidden bg-[var(--hm-bg-tertiary)] ring-1 ring-[var(--hm-border-subtle)] transition-all hover:-translate-y-[1px] hover:shadow-md"
                        >
                          <Image src={media.preview} alt="Preview" fill className="object-cover" sizes="(min-width: 640px) 25vw, 33vw" unoptimized />
                          {/* Dim the thumbnail during upload so the
                              progress bar and check mark read
                              against a calmer surface. */}
                          {isSubmitting && pct !== undefined && (
                            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                          )}
                          {/* Per-file progress bar - thin strip at
                              the bottom of the thumbnail. */}
                          {uploading && (
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                              <div
                                className="h-full bg-[var(--hm-brand-500)] transition-[width] duration-150"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                          {/* Checkmark replaces the bar when this
                              file is done. Stays visible until the
                              submit flow navigates away. */}
                          {uploaded && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="w-9 h-9 rounded-full bg-[var(--hm-success-500)] text-white flex items-center justify-center shadow-md">
                                <Check className="w-5 h-5" strokeWidth={3} />
                              </span>
                            </div>
                          )}
                          {/* Remove button hidden during upload so the
                              user can't yank a file mid-flight. */}
                          {!isSubmitting && (
                            <button
                              type="button"
                              onClick={() => removeMediaFile(idx)}
                              aria-label={t('common.remove')}
                              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 hover:bg-[var(--hm-error-500)] flex items-center justify-center transition-all active:scale-95"
                            >
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {existingMedia.length + mediaFiles.length < MAX_PHOTO_COUNT && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={t("job.addPhotos")}
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-[1px] active:scale-[0.97]"
                        style={{
                          borderColor: 'var(--hm-border)',
                          backgroundColor: 'transparent',
                          color: 'var(--hm-fg-muted)',
                        }}
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10.5px] font-medium">
                          {t('common.add')}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Success state - soft confirmation, no required-warning */}
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

              {/* Hero card - Title + Category + Timing + Budget. Uses
                  the brand-accent gradient surface that signals "this
                  is the headline summary" same way the bookings total
                  row does. Layered inset highlight + shadow makes the
                  card lift off the page rather than blending in. */}
              <div
                className="rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(239,78,36,0.10) 0%, rgba(239,78,36,0.03) 100%)',
                  border: '1px solid rgba(239,78,36,0.20)',
                  boxShadow:
                    '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 6px 16px -3px rgba(239,78,36,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
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

                {/* Title (auto-derived from selected service / category) */}
                <h2 className="text-base sm:text-lg font-bold pr-16" style={{ color: 'var(--hm-fg-primary)' }}>
                  {deriveJobTitle()}
                </h2>
                {formData.description.trim() && (
                  <p className="text-[13px] mt-2 whitespace-pre-wrap" style={{ color: 'var(--hm-fg-secondary)' }}>
                    {formData.description}
                  </p>
                )}

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
                      ? (serviceBudgetTotal > 0 ? `${serviceBudgetTotal}${sym}` : null)
                      : formData.budgetType === "range"
                        ? `${formData.budgetMin}-${formData.budgetMax}${sym}`
                        : formData.budgetType === "negotiable" ? null
                          : formData.budgetMin ? `${formData.budgetMin}${sym}` : null;
                    if (budgetText) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(239,78,36,0.12)', color: 'var(--hm-brand-500)' }}>
                          {budgetText}
                        </span>
                      );
                    }
                    // No price set anywhere - either explicit "negotiable"
                    // budget type or every service was left open to
                    // offers. Either way, show a clear pill so the
                    // header doesn't read as if budget info is missing.
                    const showOpenToOffers =
                      formData.budgetType === "negotiable" ||
                      (hasServiceBudgets && serviceBudgetTotal === 0);
                    if (showOpenToOffers) {
                      return (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: 'var(--hm-bg-tertiary)',
                            color: 'var(--hm-fg-secondary)',
                            border: '1px dashed var(--hm-border-subtle)',
                          }}
                          title={t('job.openToOffersHint')}
                        >
                          <MessageCircle className="w-3 h-3" />
                          {t('job.openToOffers')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Services card */}
              {selectedJobServices.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--hm-bg-elevated)',
                    border: '1px solid var(--hm-border-subtle)',
                    boxShadow:
                      '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
                  }}
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
                    {/* Group services by category so the preview mirrors
                        the picker - "Plumbing & Heating: X, Y", "AC &
                        Ventilation: Z" - instead of one flat list where
                        the pro can't tell which trade each line belongs
                        to. Order is first-appearance to stay stable. */}
                    {(() => {
                      const groups = new Map<string, JobServiceSelection[]>();
                      for (const s of selectedJobServices) {
                        const key = s.categoryKey || '';
                        const arr = groups.get(key) ?? [];
                        arr.push(s);
                        groups.set(key, arr);
                      }
                      return Array.from(groups.entries()).map(([catKey, services]) => {
                        const catData = categories.find(c => c.key === catKey);
                        const accent = catData?.color || 'var(--hm-brand-500)';
                        return (
                          <div key={catKey || 'uncategorized'}>
                            {/* Category subheader - only when we know the
                                category (defensive: legacy selections may
                                lack categoryKey). */}
                            {catData && (
                              <div
                                className="flex items-center gap-2 px-4 py-2"
                                style={{ background: 'var(--hm-bg-tertiary)' }}
                              >
                                <span
                                  className="flex items-center justify-center rounded-md w-5 h-5"
                                  style={{ background: `${accent}1f`, color: accent }}
                                >
                                  <CategoryIcon type={catData.key} className="w-3 h-3" />
                                </span>
                                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-secondary)' }}>
                                  {pick({ en: catData.name, ka: catData.nameKa })}
                                </span>
                                <span className="text-[10px] ml-auto" style={{ color: 'var(--hm-fg-muted)' }}>
                                  {services.length}
                                </span>
                              </div>
                            )}
                            {services.map(svc => {
                              const qty = svc.quantity || 1;
                              const lineTotal = svc.budget * qty;
                              // Mode-aware: range mode is "open to
                              // offers" only when both min and max are
                              // empty. Fixed mode is empty budget.
                              const isOpenToOffers = svc.useRange
                                ? (!svc.budgetMin || svc.budgetMin === 0) && (!svc.budgetMax || svc.budgetMax === 0)
                                : (svc.budget || 0) === 0;
                              return (
                                // Service row: on mobile, stack the
                                // name and the price/offer-pill so the
                                // long Georgian service names
                                // ("სტანდარტული დალაგება") don't get
                                // truncated when the "ფასი
                                // მოლაპარაკებით" pill is occupying half
                                // the row. sm+ reverts to side-by-side.
                                <div key={svc.serviceKey} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 px-4 py-2.5">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[13px] font-medium block sm:truncate" style={{ color: 'var(--hm-fg-primary)' }}>
                                      {pick({ en: svc.name, ka: svc.nameKa })}
                                    </span>
                                    <span className="text-[11px]" style={{ color: 'var(--hm-fg-muted)' }}>
                                      {qty > 1 ? `${qty} × ` : ''}{pick({ en: svc.unitName, ka: svc.unitNameKa })}
                                      {svc.budget > 0 && qty > 1 && (
                                        <span className="ml-1">· {svc.budget}{sym}/{pick({ en: svc.unitName, ka: svc.unitNameKa })}</span>
                                      )}
                                    </span>
                                  </div>
                                  {isOpenToOffers ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold self-start sm:self-auto shrink-0 px-2 py-0.5 rounded-full"
                                      style={{
                                        background: 'var(--hm-bg-tertiary)',
                                        color: 'var(--hm-fg-secondary)',
                                        border: '1px dashed var(--hm-border-subtle)',
                                      }}
                                      title={t('job.openToOffersHint')}
                                    >
                                      <MessageCircle className="w-2.5 h-2.5" />
                                      {t('job.openToOffers')}
                                    </span>
                                  ) : (
                                    <span className="text-[13px] font-bold self-start sm:self-auto shrink-0" style={{ color: 'var(--hm-brand-500)' }}>
                                      {lineTotal}{sym}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      });
                    })()}
                    {/* Total row - always shown when any budget is set,
                        even with a single service. When some services
                        are open-to-offers, surface that explicitly so
                        the total doesn't read as if it covers everything. */}
                    {(() => {
                      const quoteCount = selectedJobServices.filter(s => {
                        if (s.useRange) {
                          return (!s.budgetMin || s.budgetMin === 0) && (!s.budgetMax || s.budgetMax === 0);
                        }
                        return (s.budget || 0) === 0;
                      }).length;
                      if (serviceBudgetTotal > 0) {
                        return (
                          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'rgba(239,78,36,0.06)' }}>
                            <div className="flex flex-col">
                              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-secondary)' }}>
                                {t('common.total')}
                              </span>
                              {quoteCount > 0 && (
                                <span className="text-[10px]" style={{ color: 'var(--hm-fg-muted)' }}>
                                  {t('job.openToOffersCount', { count: quoteCount })}
                                </span>
                              )}
                            </div>
                            <span className="text-[15px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                              {serviceBudgetTotal}{sym}
                            </span>
                          </div>
                        );
                      }
                      // All services are open to offers - no total row but
                      // a single banner explaining what pros will see.
                      if (quoteCount > 0) {
                        return (
                          <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                            <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--hm-brand-500)' }} />
                            <span className="text-[12px]" style={{ color: 'var(--hm-fg-secondary)' }}>
                              {t('job.openToOffersHint')}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Property & Location - full breakdown, label/value rows */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--hm-bg-elevated)', border: '1px solid var(--hm-border-subtle)' }}
              >
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--hm-border-subtle)' }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                    {t('job.locationBudget')}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => goToStep("location")}
                    className="text-[11px]"
                  >
                    {t('common.edit')}
                  </Button>
                </div>

                <div className="px-4 py-3 flex items-start gap-3" style={{ borderBottom: '1px solid var(--hm-border-subtle)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                    <MapPin className="w-4 h-4" style={{ color: 'var(--hm-fg-secondary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--hm-fg-muted)' }}>
                      {t('job.jobAddress')}
                    </p>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                      {formData.location}
                    </p>
                  </div>
                </div>

                {/* Property facts grid - only render rows that have values */}
                <div className="divide-y" style={{ borderColor: 'var(--hm-border-subtle)' }}>
                  {formData.propertyType && (
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t('job.propertyType')}
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                        {formData.propertyType === "apartment" && t('job.apartment')}
                        {formData.propertyType === "house" && t('job.house')}
                        {formData.propertyType === "office" && t('job.office')}
                        {formData.propertyType === "building" && t('job.building')}
                        {formData.propertyType === "other" && t('common.other')}
                      </span>
                    </div>
                  )}
                  {formData.propertyCondition && (
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t('job.condition')}
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                        {formData.propertyCondition === "shell" && t('job.shell')}
                        {formData.propertyCondition === "black-frame" && t('job.blackFrame')}
                        {formData.propertyCondition === "needs-renovation" && t('job.fullRenovation')}
                        {formData.propertyCondition === "partial-renovation" && t('job.partial')}
                        {formData.propertyCondition === "good" && t('job.good')}
                      </span>
                    </div>
                  )}
                  {formData.timing && (
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t('job.whenDoYouNeedIt')}
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                        {formData.timing === "flexible" && t('job.flexible')}
                        {formData.timing === "asap" && t('job.asap')}
                        {formData.timing === "this_week" && t('common.thisWeek')}
                        {formData.timing === "this_month" && t('common.thisMonth')}
                      </span>
                    </div>
                  )}
                  {/* Budget row - only when not already covered by per-service breakdown */}
                  {!hasServiceBudgets && formData.budgetType && (
                    <div className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t('common.budget')}
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: 'var(--hm-brand-500)' }}>
                        {formData.budgetType === "negotiable" && t('job.negotiable')}
                        {formData.budgetType === "fixed" && formData.budgetMin && `${formData.budgetMin}${sym}`}
                        {formData.budgetType === "range" && formData.budgetMin && formData.budgetMax && `${formData.budgetMin}-${formData.budgetMax}${sym}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job details - category-specific fields the user filled in */}
              {(() => {
                const filledFields = getActiveFields().filter((f) => {
                  const v = formData[f.key as keyof typeof formData];
                  return v !== undefined && v !== null && String(v).trim() !== "";
                });
                if (filledFields.length === 0) return null;
                return (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: 'var(--hm-bg-elevated)', border: '1px solid var(--hm-border-subtle)' }}
                  >
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--hm-border-subtle)' }}>
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                        {t('job.additionalDetails')}
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
                      {filledFields.map((f) => {
                        const value = String(formData[f.key as keyof typeof formData]);
                        const suffix = (f as { suffix?: string; suffixKey?: string }).suffix
                          ?? ((f as { suffixKey?: string }).suffixKey ? t((f as { suffixKey: string }).suffixKey) : '');
                        return (
                          <div key={f.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
                            <span className="text-[12px]" style={{ color: 'var(--hm-fg-muted)' }}>
                              {t(f.labelKey)}
                            </span>
                            <span className="text-[13px] font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                              {value}{suffix ? ` ${suffix}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Photos - bigger previews when present */}
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
                      onClick={() => goToStep("location")}
                      className="text-[11px]"
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {existingMedia.map((media, idx) => (
                      <div key={`re-${idx}`} className="relative aspect-square rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                        <Image src={storage.getFileUrl(media.url)} alt="" fill className="object-cover" sizes="(max-width: 640px) 33vw, 25vw" />
                      </div>
                    ))}
                    {mediaFiles.map((media, idx) => (
                      <div key={`rn-${idx}`} className="relative aspect-square rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}>
                        <Image src={media.preview} alt="" fill className="object-cover" sizes="(max-width: 640px) 33vw, 25vw" unoptimized />
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

      {/* Footer Navigation. Was previously offset by 58px+safe-area to
          clear the global MobileBottomNav, but post-job lives OUTSIDE
          the `(shell)` route group so MobileBottomNav never renders
          here. The 58px offset left the footer floating mid-screen
          and the draggable AI chat FAB (z-40) collided with the
          footer's Cancel/Continue buttons. Pinned to the actual
          viewport bottom now with safe-area-bottom for the iOS home
          indicator, and bumped to z-50 so it wins over the FAB on
          stacking. */}
      <footer className="fixed left-0 right-0 bottom-0 z-50 safe-area-bottom">
        <div className="bg-[var(--hm-bg-elevated)] border-t border-[var(--hm-border-subtle)] shadow-[0_-4px_12px_rgba(20,18,14,0.06)]">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
            {/* Footer actions: Back stays compact on every size; the
                Continue / Post Job button stretches `flex-1` on mobile
                so the primary CTA is full-width-tap and impossible to
                miss with a thumb. At sm+ both buttons size to content
                so the desktop layout doesn't look stretched. */}
            {!isSubmitting &&
              ((currentStep === "category" && !canProceedFromCategory()) ||
                (currentStep === "location" && !canProceedFromLocation())) && (
                <p className="text-[12px] text-[var(--hm-fg-muted)] mb-2 text-center sm:text-right">
                  {currentStep === "category"
                    ? t("postJob.continueHintCategory")
                    : t("postJob.continueHintLocation")}
                </p>
              )}
            <div className="flex items-center justify-between gap-3">
              {getCurrentStepIndex() > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="shrink-0"
                >
                  {t('common.back')}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => backOrNavigate(router, defaultBackFallback(user))}
                  leftIcon={<X className="w-4 h-4" />}
                  className="shrink-0 text-[var(--hm-fg-muted)]"
                >
                  {t('common.cancel')}
                </Button>
              )}

              {/* Running total — always visible next to the CTA so the price
                  stays in view while scrolling the service list. */}
              {serviceBudgetTotal > 0 && (
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--hm-fg-muted)] hidden sm:inline">
                    {t('common.total')}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[var(--hm-brand-500)] whitespace-nowrap">
                    {serviceBudgetTotal.toLocaleString()}{sym}
                  </span>
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentStep === "category" && !canProceedFromCategory()) ||
                  (currentStep === "location" && !canProceedFromLocation())
                }
                // Premium variant on the final commit step gives the
                // "Post Job" button a distinct visual weight - this is
                // the moment of conversion and deserves the full accent
                // treatment, not the same flat orange every step has.
                // Size: default (h-10) on mobile so the long Georgian
                // "სამუშაოს გამოქვეყნება" label fits the available
                // footer width without truncating; lg (h-12) on sm+
                // where the visual hierarchy matters and the width is
                // generous.
                variant={currentStep === "review" ? "premium" : "default"}
                size="default"
                className={
                  currentStep === "review"
                    ? "flex-1 sm:flex-initial sm:h-12 sm:px-6 sm:text-[15px]"
                    : "flex-1 sm:flex-initial"
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

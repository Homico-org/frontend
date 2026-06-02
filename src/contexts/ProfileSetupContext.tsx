"use client";

import { PortfolioProject } from "@/components/pro/steps/ProjectsStep";
import {
  SelectedSubcategoryWithPricing,
  UnitPriceEntry,
} from "@/components/pro/steps/ServicesPricingStep";
import {
  ExperienceLevel,
  SelectedService,
} from "@/components/register/steps/StepSelectServices";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, type Subcategory } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProfileSetupStepSlug =
  | "about"
  | "services"
  | "areas"
  | "portfolio"
  | "review";

export const STEP_SLUGS: ProfileSetupStepSlug[] = [
  "about",
  "services",
  "areas",
  "portfolio",
  "review",
];

export const STEP_META: {
  slug: ProfileSetupStepSlug;
  title: { en: string; ka: string };
}[] = [
  { slug: "about", title: { en: "About You", ka: "შენს შესახებ" } },
  {
    slug: "services",
    title: { en: "Services & Prices", ka: "სერვისები და ფასები" },
  },
  { slug: "areas", title: { en: "Service Areas", ka: "სერვისის ზონები" } },
  { slug: "portfolio", title: { en: "Portfolio", ka: "პორტფოლიო" } },
  { slug: "review", title: { en: "Review", ka: "გადახედვა" } },
];

interface FormData {
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  yearsExperience: string;
  avatar: string;
  portfolioUrl: string;
  licenseNumber: string;
  cadastralId: string;
  availability: string[];
  basePrice: string;
  maxPrice: string;
  pricingModel: "fixed" | "range" | "per_sqm" | "byAgreement" | "";
  serviceAreas: string[];
  nationwide: boolean;
  whatsapp: string;
  telegram: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  tiktok: string;
  website: string;
}

interface ApiBeforeAfterPair {
  before?: string;
  after?: string;
  beforeImage?: string;
  afterImage?: string;
}

interface ApiSelectedService {
  key: string;
  categoryKey: string;
  name: string;
  nameKa: string;
  experience: string;
}

interface RawPortfolioProject extends Partial<PortfolioProject> {
  _id?: string;
  imageUrl?: string;
  beforeAfter?: ApiBeforeAfterPair[];
}

export interface LocationData {
  country: string;
  nationwide: string;
  nationwideKa?: string;
  nationwideEn?: string;
  regions: Record<string, string[]>;
  cityMapping?: Record<string, string>;
  emoji: string;
}

export interface ProfileSetupValidation {
  avatar: boolean;
  bio: boolean;
  experience: boolean;
  categories: boolean;
  subcategories: boolean;
  pricing: boolean;
  serviceAreas: boolean;
  portfolio: boolean;
}

export interface ProfileSetupContextValue {
  // Form state
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleFormChange: (updates: Partial<FormData>) => void;

  selectedServices: SelectedService[];
  setSelectedServices: React.Dispatch<React.SetStateAction<SelectedService[]>>;

  customServices: string[];
  setCustomServices: React.Dispatch<React.SetStateAction<string[]>>;

  selectedSubcategoriesWithPricing: SelectedSubcategoryWithPricing[];
  setSelectedSubcategoriesWithPricing: React.Dispatch<
    React.SetStateAction<SelectedSubcategoryWithPricing[]>
  >;

  portfolioProjects: PortfolioProject[];
  setPortfolioProjects: React.Dispatch<
    React.SetStateAction<PortfolioProject[]>
  >;

  avatarPreview: string | null;
  setAvatarPreview: React.Dispatch<React.SetStateAction<string | null>>;
  handleAvatarCropped: (croppedDataUrl: string) => void;

  locationData: LocationData | null;

  // Derived
  selectedCategories: string[];
  selectedSubcategories: string[];
  servicePricing: {
    // Stable catalog ids - source of truth
    serviceId?: string;
    categoryId?: string;
    subcategoryId?: string;
    unitId?: string;
    // Human-readable keys kept for backward compat / display lookup
    serviceKey: string;
    categoryKey: string;
    subcategoryKey: string;
    unitKey?: string;
    price: number;
    isActive: boolean;
    // Optional range support (added 2026-05). When `priceMin`/`priceMax` are
    // present, treat `price` as the typical/midpoint and surface the range.
    priceMin?: number;
    priceMax?: number;
    notes?: string;
  }[];
  maxExperienceYears: number;

  // Status
  isLoading: boolean;
  profileLoading: boolean;
  error: string;
  isEditMode: boolean;
  isAdminEditing: boolean;
  adminTargetProId: string | null;

  // Validation
  validation: ProfileSetupValidation;
  isFormValid: boolean;
  canProceedFromStep: (slug: ProfileSetupStepSlug) => boolean;

  // Navigation helpers
  currentStepIndex: (slug: ProfileSetupStepSlug) => number;
  goToStep: (slug: ProfileSetupStepSlug) => void;
  goNext: (currentSlug: ProfileSetupStepSlug) => Promise<void>;
  goBack: (currentSlug: ProfileSetupStepSlug) => void;
  isSaving: boolean;

  // Submit
  handleSubmit: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ProfileSetupContext = createContext<ProfileSetupContextValue | null>(
  null,
);

export function useProfileSetup() {
  const ctx = useContext(ProfileSetupContext);
  if (!ctx)
    throw new Error("useProfileSetup must be used inside ProfileSetupProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ProfileSetupProvider({
  children,
  adminTargetProId,
}: {
  children: React.ReactNode;
  adminTargetProId: string | null;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { locale, pick } = useLanguage();

  // Debug: detect remounts
  useEffect(() => {
    console.log("[ProfileSetupProvider] MOUNTED");
    return () => console.log("[ProfileSetupProvider] UNMOUNTED");
  }, []);
  const { categories: allCategories, getCategoryByKey } = useCategories();

  const isAdminEditing = user?.role === "admin" && !!adminTargetProId;

  // ── Form state ──────────────────────────────────────────────────────────────

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    [],
  );
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [
    selectedSubcategoriesWithPricing,
    setSelectedSubcategoriesWithPricing,
  ] = useState<SelectedSubcategoryWithPricing[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProject[]
  >([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    title: "",
    bio: "",
    yearsExperience: "",
    avatar: "",
    portfolioUrl: "",
    licenseNumber: "",
    cadastralId: "",
    availability: [],
    basePrice: "",
    maxPrice: "",
    pricingModel: "range",
    serviceAreas: [],
    nationwide: false,
    whatsapp: "",
    telegram: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    tiktok: "",
    website: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const hasFetchedProfile = useRef(false);
  const initialAvatarRef = useRef<string | null>(null);
  const hasSetAvatarFromUser = useRef(false);
  const isFirstRender = useRef(true);
  const hasTranslatedServiceAreas = useRef(false);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedCategories = useMemo(
    () =>
      selectedSubcategoriesWithPricing.length > 0
        ? [
            ...new Set(
              selectedSubcategoriesWithPricing.map((s) => s.categoryKey),
            ),
          ]
        : [...new Set(selectedServices.map((s) => s.categoryKey))],
    [selectedServices, selectedSubcategoriesWithPricing],
  );

  const selectedSubcategories = useMemo(
    () =>
      selectedSubcategoriesWithPricing.length > 0
        ? selectedSubcategoriesWithPricing.map((s) => s.key)
        : selectedServices.map((s) => s.key),
    [selectedServices, selectedSubcategoriesWithPricing],
  );

  const servicePricing = useMemo(
    () =>
      selectedSubcategoriesWithPricing.flatMap((sub) =>
        sub.services
          .filter((s) => s.isActive)
          .flatMap((s) => {
            // Multi-unit: emit one entry per active unit with a usable value
            // (single-mode price > 0 OR range mode with min < max).
            const activeUnits =
              s.unitPrices?.filter((u) => {
                if (!u.isActive) return false;
                if (u.useRange) {
                  const min = u.priceMin ?? 0;
                  const max = u.priceMax ?? 0;
                  // Reject inverted ranges - the validator (`isServicePriced`)
                  // also rejects them so Save & Continue stays disabled, but
                  // belt-and-suspenders here keeps a partially-invalid state
                  // from sneaking into the payload.
                  return min > 0 && max > 0 && min <= max;
                }
                return u.price > 0;
              }) || [];
            if (activeUnits.length > 0) {
              return activeUnits.map((u) => ({
                serviceId: s.serviceId,
                categoryId: s.categoryId,
                subcategoryId: s.subcategoryId,
                unitId: u.unitId,
                serviceKey: s.serviceKey,
                categoryKey: s.categoryKey,
                subcategoryKey: s.subcategoryKey,
                unitKey: u.unitKey,
                price: u.price,
                isActive: true,
                ...(u.useRange && u.priceMin && u.priceMax
                  ? { priceMin: u.priceMin, priceMax: u.priceMax }
                  : {}),
                ...(u.discountTiers && u.discountTiers.length > 0
                  ? { discountTiers: u.discountTiers }
                  : {}),
                ...(s.notes && s.notes.trim().length > 0
                  ? { notes: s.notes.trim() }
                  : {}),
              }));
            }
            // Fallback: single-unit legacy
            if (s.price > 0) {
              return [
                {
                  serviceId: s.serviceId,
                  categoryId: s.categoryId,
                  subcategoryId: s.subcategoryId,
                  serviceKey: s.serviceKey,
                  categoryKey: s.categoryKey,
                  subcategoryKey: s.subcategoryKey,
                  price: s.price,
                  isActive: true,
                  ...(s.discountTiers && s.discountTiers.length > 0
                    ? { discountTiers: s.discountTiers }
                    : {}),
                  ...(s.notes && s.notes.trim().length > 0
                    ? { notes: s.notes.trim() }
                    : {}),
                },
              ];
            }
            return [];
          }),
      ),
    [selectedSubcategoriesWithPricing],
  );

  const maxExperienceYears = useMemo(() => {
    const expMap: Record<string, number> = {
      "1-2": 2,
      "3-5": 5,
      "5-10": 10,
      "10+": 15,
    };
    // Use new pricing flow if available
    if (selectedSubcategoriesWithPricing.length > 0) {
      return Math.max(
        0,
        ...selectedSubcategoriesWithPricing.map(
          (s) => expMap[s.experience] || 0,
        ),
      );
    }
    if (selectedServices.length === 0) return 0;
    return Math.max(...selectedServices.map((s) => expMap[s.experience] || 0));
  }, [selectedServices, selectedSubcategoriesWithPricing]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const yearsToExperienceLevel = (years: number): ExperienceLevel => {
    if (years >= 10) return "10+";
    if (years >= 5) return "5-10";
    if (years >= 3) return "3-5";
    return "1-2";
  };

  const convertToSelectedServices = useCallback(
    (
      subcategoryKeys: string[],
      defaultExperience: ExperienceLevel = "3-5",
    ): SelectedService[] => {
      const services: SelectedService[] = [];
      subcategoryKeys.forEach((subKey) => {
        for (const category of allCategories) {
          for (const sub of category.subcategories) {
            if (sub.key === subKey) {
              services.push({
                key: sub.key,
                name: sub.name,
                nameKa: sub.nameKa,
                categoryKey: category.key,
                experience: defaultExperience,
              });
              return;
            }
            if (sub.children) {
              for (const child of sub.children) {
                if (child.key === subKey) {
                  services.push({
                    key: child.key,
                    name: child.name,
                    nameKa: child.nameKa,
                    categoryKey: category.key,
                    experience: defaultExperience,
                  });
                  return;
                }
              }
            }
          }
        }
      });
      return services;
    },
    [allCategories],
  );

  // ── sessionStorage restore ───────────────────────────────────────────────────

  // Stores draft data from sessionStorage to merge with server data later
  const draftDataRef = useRef<{
    formData?: Partial<FormData>;
    selectedServices?: SelectedService[];
    customServices?: string[];
    portfolioProjects?: PortfolioProject[];
    selectedSubcategoriesWithPricing?: SelectedSubcategoryWithPricing[];
  } | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("proRegistrationData")) return;
      const raw = sessionStorage.getItem("profileSetupDraft");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        formData?: Partial<FormData>;
        selectedServices?: SelectedService[];
        customServices?: string[];
        portfolioProjects?: PortfolioProject[];
        selectedSubcategoriesWithPricing?: SelectedSubcategoryWithPricing[];
      };
      // Store draft for merging after profile fetch
      draftDataRef.current = draft;

      if (draft.formData)
        setFormData((prev) => ({ ...prev, ...draft.formData }));
      if (Array.isArray(draft.selectedServices))
        setSelectedServices(draft.selectedServices);
      if (Array.isArray(draft.customServices))
        setCustomServices(draft.customServices);
      if (Array.isArray(draft.portfolioProjects))
        setPortfolioProjects(draft.portfolioProjects);
      if (Array.isArray(draft.selectedSubcategoriesWithPricing))
        setSelectedSubcategoriesWithPricing(
          draft.selectedSubcategoriesWithPricing,
        );
    } catch {
      // corrupt draft - ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── sessionStorage save ──────────────────────────────────────────────────────

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      sessionStorage.setItem(
        "profileSetupDraft",
        JSON.stringify({
          formData,
          selectedServices,
          customServices,
          portfolioProjects,
          selectedSubcategoriesWithPricing,
        }),
      );
    } catch {
      // quota exceeded - ignore
    }
  }, [
    formData,
    selectedServices,
    customServices,
    portfolioProjects,
    selectedSubcategoriesWithPricing,
  ]);

  // ── Avatar init from localStorage ───────────────────────────────────────────

  useEffect(() => {
    if (initialAvatarRef.current === null) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as { avatar?: string };
          if (parsed.avatar) {
            const avatarUrl =
              parsed.avatar.startsWith("http") ||
              parsed.avatar.startsWith("data:")
                ? parsed.avatar
                : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
            initialAvatarRef.current = avatarUrl;
            setAvatarPreview(avatarUrl);
            setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
          }
        }
      } catch {
        // ignore
      }
      if (initialAvatarRef.current === null) {
        initialAvatarRef.current = "";
      }
    }
  }, []);

  // ── Fetch existing profile ───────────────────────────────────────────────────

  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (hasFetchedProfile.current) return;
      if (!user || (user.role !== "pro" && !isAdminEditing)) {
        setProfileLoading(false);
        return;
      }

      hasFetchedProfile.current = true;

      // Check sessionStorage for invite registration data first
      const storedData = sessionStorage.getItem("proRegistrationData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData) as {
            subcategories?: string[];
            yearsExperience?: number;
            customServices?: string[];
            pinterestLinks?: string[];
            cadastralId?: string;
            portfolioProjects?: RawPortfolioProject[];
            avatar?: string;
          };
          const subcategories = parsed.subcategories || [];
          const yearsExp = parsed.yearsExperience || 3;
          const expLevel = yearsToExperienceLevel(yearsExp);

          if (allCategories.length > 0 && subcategories.length > 0) {
            const services = convertToSelectedServices(subcategories, expLevel);
            setSelectedServices(services);
          }

          if (parsed.customServices && Array.isArray(parsed.customServices)) {
            setCustomServices(parsed.customServices);
          }
          if (parsed.pinterestLinks?.[0]) {
            setFormData((prev) => ({
              ...prev,
              portfolioUrl: parsed.pinterestLinks![0],
            }));
          }
          if (parsed.cadastralId) {
            setFormData((prev) => ({
              ...prev,
              cadastralId: parsed.cadastralId!,
            }));
          }
          if (
            parsed.portfolioProjects &&
            Array.isArray(parsed.portfolioProjects)
          ) {
            // Spread-first preserves rich fields (source/clientName/rating/
            // review/jobId/services/isVisible/displayOrder/completedDate) so
            // they survive the load → state → save round-trip and don't get
            // dropped by the backend's full-array replace on next submit.
            const cleanedProjects = parsed.portfolioProjects.map(
              (p: RawPortfolioProject, idx: number) => {
                const { _id, imageUrl, beforeAfter, ...preserved } = p;
                return {
                  ...preserved,
                  id: p.id || _id || `project-${Date.now()}-${idx}`,
                  title: p.title || "",
                  description: p.description || "",
                  images: p.images || (imageUrl ? [imageUrl] : []),
                  videos: p.videos || [],
                  location: p.location,
                  beforeAfterPairs: (
                    beforeAfter ||
                    p.beforeAfterPairs ||
                    []
                  ).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                    id: `pair-${Date.now()}-${pairIdx}`,
                    beforeImage: pair.before || pair.beforeImage || "",
                    afterImage: pair.after || pair.afterImage || "",
                  })),
                };
              },
            );
            setPortfolioProjects(cleanedProjects);
          }
          if (parsed.avatar) {
            const avatarFullUrl =
              parsed.avatar.startsWith("http") ||
              parsed.avatar.startsWith("data:")
                ? parsed.avatar
                : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
            setFormData((prev) => ({ ...prev, avatar: avatarFullUrl }));
            setAvatarPreview(avatarFullUrl);
          }
          sessionStorage.removeItem("proRegistrationData");
          setProfileLoading(false);

          // Note: when subcategories are pre-selected (invite flow), the
          // invite page navigates the user directly to the services step.
          // No router.replace here - that used to bounce the route mid-mount
          // and crashed Next's <Router> with React #310.
          return;
        } catch (err) {
          console.error("Failed to parse registration data:", err);
        }
      }

      // Fetch existing profile
      try {
        const token = localStorage.getItem("access_token");
        const profileUrl = isAdminEditing
          ? `${process.env.NEXT_PUBLIC_API_URL}/users/pros/${adminTargetProId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`;
        const response = await fetch(profileUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const profile = (await response.json()) as {
            _id: string;
            selectedServices?: ApiSelectedService[];
            subcategories?: string[];
            customServices?: string[];
            yearsExperience?: number;
            firstName?: string;
            lastName?: string;
            title?: string;
            bio?: string;
            avatar?: string;
            pinterestLinks?: string[];
            architectLicenseNumber?: string;
            cadastralId?: string;
            availability?: string[];
            basePrice?: number;
            maxPrice?: number;
            pricingModel?: string;
            serviceAreas?: string[];
            servicePricing?: {
              serviceKey: string;
              categoryKey: string;
              subcategoryKey: string;
              unitKey?: string;
              price: number;
              isActive: boolean;
              discountTiers?: { minQuantity: number; percent: number }[];
              // Optional range support (added 2026-05)
              priceMin?: number;
              priceMax?: number;
              notes?: string;
            }[];
            portfolioProjects?: RawPortfolioProject[];
            whatsapp?: string;
            telegram?: string;
            instagramUrl?: string;
            facebookUrl?: string;
            linkedinUrl?: string;
            tiktokUrl?: string;
            websiteUrl?: string;
          };
          setExistingProfileId(profile._id);
          setIsEditMode(true);

          const draftHasServices =
            (draftDataRef.current?.selectedSubcategoriesWithPricing?.length ??
              0) > 0 ||
            (draftDataRef.current?.selectedServices?.length ?? 0) > 0;
          if (
            !draftHasServices &&
            profile.selectedServices &&
            profile.selectedServices.length > 0
          ) {
            const loadedServices: SelectedService[] =
              profile.selectedServices.map((s) => ({
                key: s.key,
                categoryKey: s.categoryKey,
                name: s.name,
                nameKa: s.nameKa,
                experience: (s.experience || "3-5") as ExperienceLevel,
              }));
            setSelectedServices(loadedServices);
          } else {
            let subcategories = profile.subcategories || [];
            if (
              subcategories.length === 0 &&
              user?.selectedSubcategories &&
              user.selectedSubcategories.length > 0
            ) {
              subcategories = user.selectedSubcategories;
            }
            const yearsExp = profile.yearsExperience || 3;
            const expLevel = yearsToExperienceLevel(yearsExp);
            if (allCategories.length > 0 && subcategories.length > 0) {
              const services = convertToSelectedServices(
                subcategories,
                expLevel,
              );
              setSelectedServices(services);
            }
          }

          // Populate servicePricing → selectedSubcategoriesWithPricing
          if (
            !draftHasServices &&
            profile.servicePricing &&
            profile.servicePricing.length > 0
          ) {
            const grouped: Record<string, typeof profile.servicePricing> = {};
            for (const sp of profile.servicePricing) {
              const key = sp.subcategoryKey || sp.categoryKey;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(sp);
            }
            const subsWithPricing: SelectedSubcategoryWithPricing[] = [];
            for (const [subKey, spEntries] of Object.entries(grouped)) {
              // Find the subcategory in the catalog
              let foundSub: Subcategory | null = null;
              let foundCatKey = "";
              for (const cat of allCategories) {
                for (const sub of cat.subcategories) {
                  if (sub.key === subKey) {
                    foundSub = sub;
                    foundCatKey = cat.key;
                    break;
                  }
                }
                if (foundSub) break;
              }
              if (!foundSub) continue;
              // Find experience from selectedServices
              const selSvc = profile.selectedServices?.find(
                (s) => s.key === subKey,
              );
              const exp = (selSvc?.experience || "3-5") as ExperienceLevel;
              subsWithPricing.push({
                key: subKey,
                categoryKey: foundCatKey,
                name: foundSub.name,
                nameKa: foundSub.nameKa,
                experience: exp,
                services: (foundSub.services || []).map((catSvc) => {
                  // Find all stored entries for this service (may have multiple unitKeys)
                  const matchingEntries = spEntries.filter(
                    (sp) => sp.serviceKey === catSvc.key,
                  );
                  const hasAnyEntry = matchingEntries.length > 0;

                  // Detect "is this stored entry a range?" - pro had range mode on
                  // when both priceMin and priceMax are present and meaningfully differ.
                  const hasRange = (sp: typeof matchingEntries[number]): boolean =>
                    sp.priceMin !== undefined &&
                    sp.priceMax !== undefined &&
                    sp.priceMin > 0 &&
                    sp.priceMax > 0 &&
                    sp.priceMin !== sp.priceMax;

                  // Build unitPrices from catalog unitOptions + stored prices
                  const unitPrices: UnitPriceEntry[] =
                    catSvc.unitOptions && catSvc.unitOptions.length > 0
                      ? catSvc.unitOptions.map((uo) => {
                          const stored = matchingEntries.find(
                            (sp) => sp.unitKey === uo.key,
                          );
                          const useRange = stored ? hasRange(stored) : false;
                          return {
                            unitKey: uo.key,
                            unit: uo.unit,
                            unitLabel: pick({
                              en: uo.label.en,
                              ka: uo.label.ka,
                            }),
                            defaultPrice: uo.defaultPrice,
                            maxPrice: uo.maxPrice,
                            price: stored?.price || 0,
                            isActive: stored
                              ? (stored.isActive ?? true)
                              : false,
                            discountTiers: stored?.discountTiers || [],
                            // Round-trip pro's range and notes (added 2026-05)
                            ...(useRange
                              ? {
                                  useRange: true,
                                  priceMin: stored?.priceMin,
                                  priceMax: stored?.priceMax,
                                }
                              : {}),
                          };
                        })
                      : [
                          (() => {
                            const stored = matchingEntries[0];
                            const useRange = stored ? hasRange(stored) : false;
                            return {
                              unitKey: catSvc.unit,
                              unit: catSvc.unit,
                              unitLabel: pick({
                                en: catSvc.unitName,
                                ka: catSvc.unitNameKa,
                              }),
                              defaultPrice: catSvc.basePrice,
                              maxPrice: catSvc.maxPrice,
                              price: stored?.price || 0,
                              isActive: hasAnyEntry,
                              discountTiers: stored?.discountTiers || [],
                              ...(useRange
                                ? {
                                    useRange: true,
                                    priceMin: stored?.priceMin,
                                    priceMax: stored?.priceMax,
                                  }
                                : {}),
                            };
                          })(),
                        ];

                  // Legacy price = first active unit's price
                  const firstActive = unitPrices.find(
                    (u) => u.isActive && u.price > 0,
                  );

                  // Pro's note is per-servicePricing entry but semantically per
                  // service - pick the first non-empty note across this service's
                  // matching entries.
                  const storedNote = matchingEntries.find(
                    (sp) => sp.notes && sp.notes.trim().length > 0,
                  )?.notes;

                  return {
                    serviceKey: catSvc.key,
                    subcategoryKey: subKey,
                    categoryKey: foundCatKey,
                    label: pick({ en: catSvc.name, ka: catSvc.nameKa }),
                    unit: catSvc.unit,
                    unitLabel: pick({
                      en: catSvc.unitName,
                      ka: catSvc.unitNameKa,
                    }),
                    basePrice: catSvc.basePrice,
                    price: firstActive?.price || matchingEntries[0]?.price || 0,
                    isActive: hasAnyEntry,
                    discountTiers:
                      firstActive?.discountTiers ||
                      matchingEntries[0]?.discountTiers ||
                      [],
                    unitPrices,
                    ...(storedNote ? { notes: storedNote } : {}),
                  };
                }),
              });
            }
            if (subsWithPricing.length > 0) {
              setSelectedSubcategoriesWithPricing(subsWithPricing);
            }
          }

          if (profile.customServices && Array.isArray(profile.customServices)) {
            setCustomServices(profile.customServices);
          }

          // Merge server data with draft - draft values win when non-empty
          const draft = draftDataRef.current?.formData;
          setFormData((prev) => ({
            ...prev,
            firstName:
              draft?.firstName ||
              profile.firstName ||
              prev.firstName ||
              "",
            lastName:
              draft?.lastName || profile.lastName || prev.lastName || "",
            title: draft?.title || profile.title || prev.title || "",
            bio: draft?.bio || profile.bio || prev.bio || "",
            avatar:
              draft?.avatar ||
              profile.avatar ||
              user?.avatar ||
              prev.avatar ||
              "",
            portfolioUrl:
              draft?.portfolioUrl ||
              profile.pinterestLinks?.[0] ||
              prev.portfolioUrl ||
              "",
            licenseNumber:
              draft?.licenseNumber ||
              profile.architectLicenseNumber ||
              prev.licenseNumber ||
              "",
            cadastralId:
              draft?.cadastralId ||
              profile.cadastralId ||
              prev.cadastralId ||
              "",
            availability: draft?.availability?.length
              ? draft.availability
              : profile.availability || prev.availability || [],
            basePrice:
              draft?.basePrice ||
              profile.basePrice?.toString() ||
              prev.basePrice ||
              "",
            maxPrice:
              draft?.maxPrice ||
              profile.maxPrice?.toString() ||
              prev.maxPrice ||
              "",
            pricingModel:
              draft?.pricingModel ||
              (profile.pricingModel as FormData["pricingModel"]) ||
              prev.pricingModel ||
              "",
            serviceAreas: draft?.serviceAreas?.length
              ? draft.serviceAreas
              : profile.serviceAreas?.includes("Countrywide") ||
                  profile.serviceAreas?.includes("საქართველოს მასშტაბით")
                ? []
                : profile.serviceAreas || prev.serviceAreas || [],
            nationwide:
              draft?.nationwide ??
              (profile.serviceAreas?.includes("Countrywide") ||
                profile.serviceAreas?.includes("საქართველოს მასშტაბით") ||
                false),
            whatsapp:
              draft?.whatsapp || profile.whatsapp || prev.whatsapp || "",
            telegram:
              draft?.telegram || profile.telegram || prev.telegram || "",
            instagram:
              draft?.instagram || profile.instagramUrl || prev.instagram || "",
            facebook:
              draft?.facebook || profile.facebookUrl || prev.facebook || "",
            linkedin:
              draft?.linkedin || profile.linkedinUrl || prev.linkedin || "",
            tiktok:
              draft?.tiktok || profile.tiktokUrl || prev.tiktok || "",
            website: draft?.website || profile.websiteUrl || prev.website || "",
          }));

          // Avatar
          let avatarUrl: string | null = null;
          if (
            initialAvatarRef.current &&
            initialAvatarRef.current.startsWith("data:")
          ) {
            avatarUrl = initialAvatarRef.current;
          } else if (user?.avatar && user.avatar.startsWith("data:")) {
            avatarUrl = user.avatar;
          } else {
            try {
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser) as {
                  avatar?: string;
                };
                if (
                  parsedUser.avatar &&
                  parsedUser.avatar.startsWith("data:")
                ) {
                  avatarUrl = parsedUser.avatar;
                }
              }
            } catch {
              // ignore
            }
          }
          if (!avatarUrl) {
            avatarUrl =
              profile.avatar ||
              user?.avatar ||
              initialAvatarRef.current ||
              null;
          }
          if (avatarUrl) {
            const fullUrl =
              avatarUrl.startsWith("http") || avatarUrl.startsWith("data:")
                ? avatarUrl
                : `${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`;
            setAvatarPreview(fullUrl);
            setFormData((prev) => ({ ...prev, avatar: fullUrl }));
          }

          // Portfolio projects
          let loadedProjects: PortfolioProject[] = [];
          if (
            profile.portfolioProjects &&
            profile.portfolioProjects.length > 0
          ) {
            // Spread-first preserves rich fields from MongoDB (source,
            // clientName, clientAvatar, rating, review, jobId, services,
            // isVisible, displayOrder, completedDate). Without this they were
            // silently lost on every save - the backend does a full-array
            // replace and the prior 6-field whitelist dropped everything else.
            loadedProjects = profile.portfolioProjects.map(
              (p: RawPortfolioProject, idx: number) => {
                const { _id, imageUrl, beforeAfter, ...preserved } = p;
                return {
                  ...preserved,
                  id: p.id || _id || `project-${Date.now()}-${idx}`,
                  title: p.title || "",
                  description: p.description || "",
                  images: p.images || (imageUrl ? [imageUrl] : []),
                  videos: p.videos || [],
                  location: p.location || "",
                  beforeAfterPairs: (
                    beforeAfter ||
                    p.beforeAfterPairs ||
                    []
                  ).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                    id: `pair-${Date.now()}-${pairIdx}`,
                    beforeImage: pair.before || pair.beforeImage || "",
                    afterImage: pair.after || pair.afterImage || "",
                  })),
                };
              },
            );
          }

          try {
            const portfolioRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`,
            );
            if (portfolioRes.ok) {
              const portfolioData =
                (await portfolioRes.json()) as RawPortfolioProject[];
              if (portfolioData && portfolioData.length > 0) {
                // Spread-first preserves rich fields from the dedicated
                // /portfolio/pro/:id endpoint (rating, review, clientName,
                // jobId, etc.) so the merge into `loadedProjects` doesn't
                // lose them either.
                const fetchedProjects = portfolioData.map(
                  (p: RawPortfolioProject, idx: number) => {
                    const { _id, imageUrl, beforeAfter, ...preserved } = p;
                    return {
                      ...preserved,
                      id: p.id || _id || `portfolio-${Date.now()}-${idx}`,
                      title: p.title || "",
                      description: p.description || "",
                      images:
                        p.images || ([imageUrl].filter(Boolean) as string[]),
                      videos: p.videos || [],
                      location: p.location || "",
                      beforeAfterPairs: (
                        beforeAfter ||
                        p.beforeAfterPairs ||
                        []
                      ).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                        id: `pair-${Date.now()}-${pairIdx}`,
                        beforeImage: pair.before || pair.beforeImage || "",
                        afterImage: pair.after || pair.afterImage || "",
                      })),
                    };
                  },
                );
                const existingTitles = new Set(
                  loadedProjects.map((p) => p.title),
                );
                fetchedProjects.forEach((p) => {
                  if (!existingTitles.has(p.title)) {
                    loadedProjects.push(p);
                  }
                });
              }
            }
          } catch {
            // ignore portfolio fetch errors
          }

          if (loadedProjects.length > 0) {
            setPortfolioProjects(loadedProjects);
          }
        } else {
          if (
            user?.selectedSubcategories &&
            user.selectedSubcategories.length > 0 &&
            allCategories.length > 0
          ) {
            const services = convertToSelectedServices(
              user.selectedSubcategories,
              "3-5",
            );
            setSelectedServices(services);
          }
        }
      } catch {
        // ignore fetch errors
      } finally {
        setProfileLoading(false);
      }
    };

    if (allCategories.length > 0) {
      fetchExistingProfile();
    }
    // `pick` is a stable selector from useLanguage tied to `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    allCategories,
    isAdminEditing,
    adminTargetProId,
    convertToSelectedServices,
    router,
  ]);

  // ── Avatar from user context ─────────────────────────────────────────────────

  useEffect(() => {
    if (
      !hasSetAvatarFromUser.current &&
      user?.avatar &&
      !avatarPreview &&
      !profileLoading
    ) {
      hasSetAvatarFromUser.current = true;
      const avatarFullUrl =
        user.avatar.startsWith("http") || user.avatar.startsWith("data:")
          ? user.avatar
          : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`;
      setFormData((prev) => ({ ...prev, avatar: avatarFullUrl }));
      setAvatarPreview(avatarFullUrl);
    }
  }, [user?.avatar, avatarPreview, profileLoading]);

  // ── Location data ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const detectedCountry = "Georgia";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros/locations?country=${encodeURIComponent(detectedCountry)}&locale=${locale}`,
        );
        const data = (await response.json()) as LocationData;
        setLocationData(data);
      } catch {
        // ignore
      }
    };
    fetchLocationData();
  }, [locale]);

  // ── Translate service areas ──────────────────────────────────────────────────

  useEffect(() => {
    if (
      locationData?.cityMapping &&
      formData.serviceAreas.length > 0 &&
      !hasTranslatedServiceAreas.current
    ) {
      hasTranslatedServiceAreas.current = true;
      const translatedAreas = formData.serviceAreas
        .map((area) => locationData.cityMapping?.[area] || area)
        .filter((area, index, self) => self.indexOf(area) === index);

      if (translatedAreas.join(",") !== formData.serviceAreas.join(",")) {
        setFormData((prev) => ({ ...prev, serviceAreas: translatedAreas }));
      }
    }
  }, [locationData, formData.serviceAreas]);

  // ── Validation ───────────────────────────────────────────────────────────────

  // Strict rule: ≥1 active service, AND every active service has a price.
  // Safe because the services UI auto-seeds the catalog default price when a
  // service is toggled on - users can't leave an active service with price=0
  // unless they explicitly zero it out.
  const isServicePriced = (svc: {
    price: number;
    unitPrices?: UnitPriceEntry[];
  }) => {
    // A unit counts as priced when:
    //  - Single-mode: `price > 0`
    //  - Range-mode: both `priceMin > 0` and `priceMax > 0` AND `priceMin <= priceMax`
    // Range-mode entries with `min > max` are an explicit invalid state - the
    // UI surfaces a red border on the max input and Save & Continue stays
    // disabled until the pro fixes it. Both paths are accepted so toggling
    // range mode doesn't accidentally disable the Save & Continue button.
    const activeUnits =
      svc.unitPrices?.filter((u) => {
        if (!u.isActive) return false;
        if (u.useRange) {
          const min = u.priceMin ?? 0;
          const max = u.priceMax ?? 0;
          return min > 0 && max > 0 && min <= max;
        }
        return u.price > 0;
      }) || [];
    return activeUnits.length > 0 || svc.price > 0;
  };
  const allActiveServices = selectedSubcategoriesWithPricing.flatMap((s) =>
    s.services.filter((svc) => svc.isActive),
  );
  // Hard-block save when ANY active range-mode unit has `min > max` (with both
  // sides entered). Unlike unpriced services (which the permissive "some"
  // rule below tolerates), an inverted range is an explicit user error that
  // would persist garbage to the backend - so we override the permissive gate.
  const hasInvalidRange = allActiveServices.some((svc) =>
    (svc.unitPrices ?? []).some((u) => {
      if (!u.isActive || !u.useRange) return false;
      const min = u.priceMin ?? 0;
      const max = u.priceMax ?? 0;
      return min > 0 && max > 0 && min > max;
    }),
  );
  // Permissive rule (2026-05): the Save & Continue button unlocks as soon as
  // the pro has at least ONE priced active service. Unpriced services are
  // surfaced via the inline "N price missing" badge per-subcategory so the
  // pro can come back and fix them - they no longer silently disable the
  // global Save button (which made debugging "why is it disabled?" painful).
  // Inverted ranges still hard-block via `hasInvalidRange`.
  const allActiveServicesPriced =
    allActiveServices.length > 0 &&
    allActiveServices.some(isServicePriced) &&
    !hasInvalidRange;

  const validation: ProfileSetupValidation = useMemo(
    () => ({
      avatar: !!avatarPreview && avatarPreview.length > 0,
      bio: formData.bio.trim().length >= 50,
      experience: selectedSubcategoriesWithPricing.length > 0,
      categories: selectedSubcategoriesWithPricing.length > 0,
      subcategories: selectedSubcategoriesWithPricing.length > 0,
      // Same strict rule as canProceedFromStep('services') - every active
      // service must be priced. Auto-seed on toggle keeps this always true
      // unless the user explicitly zeroes a price.
      pricing: allActiveServicesPriced,
      serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
      portfolio: true,
    }),
    // `allActiveServicesPriced` is derived from the listed deps; its
    // identity changes every render but the value tracks the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      avatarPreview,
      formData.bio,
      formData.nationwide,
      formData.serviceAreas,
      selectedSubcategoriesWithPricing,
      servicePricing,
    ],
  );

  const isFormValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    validation.avatar &&
    validation.bio &&
    validation.categories &&
    validation.subcategories &&
    validation.pricing &&
    validation.serviceAreas;

  const canProceedFromStep = useCallback(
    (slug: ProfileSetupStepSlug): boolean => {
      switch (slug) {
        case "about":
          return (
            formData.firstName.trim().length >= 2 &&
            formData.lastName.trim().length >= 2 &&
            validation.avatar &&
            validation.bio
          );
        case "services":
          return allActiveServicesPriced;
        case "areas":
          return validation.serviceAreas;
        case "portfolio":
          return true;
        case "review":
          return isFormValid;
      }
    },
    [
      formData.firstName,
      formData.lastName,
      validation,
      allActiveServicesPriced,
      isFormValid,
    ],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleFormChange = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAvatarCropped = useCallback(
    (croppedDataUrl: string) => {
      setAvatarPreview(croppedDataUrl);
      setFormData((prev) => ({ ...prev, avatar: croppedDataUrl }));
      updateUser({ avatar: croppedDataUrl });
    },
    [updateUser],
  );

  // ── Navigation ───────────────────────────────────────────────────────────────

  const currentStepIndex = useCallback(
    (slug: ProfileSetupStepSlug) => STEP_SLUGS.indexOf(slug),
    [],
  );

  // Step navigation must preserve `?proId=` when an admin is editing another
  // pro's profile - otherwise the next step's mount loses adminTargetProId
  // and silently falls back to /me/pro-profile (admin's own account).
  const buildStepHref = useCallback(
    (slug: ProfileSetupStepSlug) => {
      const base = `/pro/profile-setup/${slug}`;
      return adminTargetProId
        ? `${base}?proId=${encodeURIComponent(adminTargetProId)}`
        : base;
    },
    [adminTargetProId],
  );

  const goToStep = useCallback(
    (slug: ProfileSetupStepSlug) => {
      router.push(buildStepHref(slug));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, buildStepHref],
  );

  const [isSaving, setIsSaving] = useState(false);
  const handleSubmitRef = useRef<() => Promise<void>>();

  // Build partial payload for the current step
  const getStepPayload = useCallback(
    (slug: ProfileSetupStepSlug): Record<string, unknown> => {
      switch (slug) {
        case "about":
          return {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            bio: formData.bio,
            avatar: formData.avatar || user?.avatar,
            whatsapp: formData.whatsapp || undefined,
            telegram: formData.telegram || undefined,
            instagramUrl: formData.instagram || undefined,
            facebookUrl: formData.facebook || undefined,
            linkedinUrl: formData.linkedin || undefined,
            tiktokUrl: formData.tiktok || undefined,
            websiteUrl: formData.website || undefined,
          };
        case "services": {
          const cats =
            selectedSubcategoriesWithPricing.length > 0
              ? [
                  ...new Set(
                    selectedSubcategoriesWithPricing.map((s) => s.categoryKey),
                  ),
                ]
              : selectedCategories;
          const subs =
            selectedSubcategoriesWithPricing.length > 0
              ? selectedSubcategoriesWithPricing.map((s) => s.key)
              : selectedSubcategories;
          const svcs =
            selectedSubcategoriesWithPricing.length > 0
              ? selectedSubcategoriesWithPricing.map((s) => ({
                  key: s.key,
                  categoryKey: s.categoryKey,
                  name: s.name,
                  nameKa: s.nameKa,
                  experience: s.experience,
                }))
              : selectedServices.map((s) => ({
                  key: s.key,
                  categoryKey: s.categoryKey,
                  name: s.name,
                  nameKa: s.nameKa,
                  experience: s.experience,
                }));
          // Single source of truth: reuse the `servicePricing` useMemo above so
          // range fields (`priceMin`/`priceMax`/`notes`) round-trip on every
          // save path. Previously this inline serializer silently stripped them
          // and range pricing never reached the backend.
          const pricing = servicePricing;
          return {
            categories: cats.length > 0 ? cats : undefined,
            subcategories: subs.length > 0 ? subs : undefined,
            selectedServices: svcs.length > 0 ? svcs : undefined,
            servicePricing: pricing.length > 0 ? pricing : undefined,
            yearsExperience:
              maxExperienceYears > 0 ? maxExperienceYears : undefined,
            customServices:
              customServices.length > 0 ? customServices : undefined,
          };
        }
        case "areas":
          return {
            serviceAreas:
              formData.nationwide && locationData
                ? [locationData.nationwide]
                : formData.serviceAreas,
          };
        case "portfolio":
          // Explicit whitelist matching `PortfolioProjectDto`. Same rationale
          // as the final-submit path: extra fields would 400 against
          // `forbidNonWhitelisted: true`, and the User schema doesn't have
          // `clientName`/`clientAvatar`/`rating`/`review` (those live in the
          // separate `/portfolios` collection).
          return {
            portfolioProjects: portfolioProjects.map((p) => ({
              ...(p.id ? { id: p.id } : {}),
              title: p.title,
              description: p.description,
              images: p.images,
              videos: p.videos || [],
              location: p.location,
              beforeAfterPairs: (p.beforeAfterPairs || []).map((pair) => ({
                beforeImage: pair.beforeImage,
                afterImage: pair.afterImage,
              })),
              ...(p.source ? { source: p.source } : {}),
              ...(p.jobId ? { jobId: p.jobId } : {}),
              ...(p.isVisible !== undefined ? { isVisible: p.isVisible } : {}),
              ...(p.displayOrder !== undefined ? { displayOrder: p.displayOrder } : {}),
              ...(p.completedDate ? { completedDate: p.completedDate } : {}),
              ...(p.services && p.services.length > 0 ? { services: p.services } : {}),
            })),
          };
        default:
          return {};
      }
    },
    // `servicePricing` is read indirectly via memos already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      formData,
      selectedSubcategoriesWithPricing,
      selectedCategories,
      selectedSubcategories,
      selectedServices,
      customServices,
      maxExperienceYears,
      portfolioProjects,
      locationData,
      user,
    ],
  );

  const goNext = useCallback(
    async (currentSlug: ProfileSetupStepSlug) => {
      if (isSaving) return; // Prevent double-click

      const idx = STEP_SLUGS.indexOf(currentSlug);

      // Last step - full submit
      if (idx >= STEP_SLUGS.length - 1) {
        handleSubmitRef.current?.();
        return;
      }

      // Set saving immediately and keep it until navigation completes
      setIsSaving(true);

      // Save current step data to backend.
      //
      // Previously we swallowed any error silently and navigated regardless,
      // so a 400 (validation), 401 (expired token), or 5xx (server down) at
      // an intermediate step would let the user move on thinking they saved.
      // The same payload would then fail at final-submit, surfacing the error
      // at the wrong place. Now we surface the failure inline and BLOCK
      // navigation - the user can fix the issue or hit back.
      const payload = getStepPayload(currentSlug);
      if (Object.keys(payload).length > 0) {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            },
          );
          if (!response.ok) {
            const data = (await response.json().catch(() => ({}))) as {
              message?: string | string[];
            };
            const msg = Array.isArray(data.message)
              ? data.message.join("; ")
              : data.message;
            setError(msg || `Save failed (${response.status})`);
            setIsSaving(false);
            return;
          }
        } catch {
          // Network error - surface and block navigation
          setError("Network error - please check your connection");
          setIsSaving(false);
          return;
        }
      }

      // Navigate - keep isSaving true so button stays disabled during transition
      router.push(buildStepHref(STEP_SLUGS[idx + 1]));
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Reset after a short delay to cover the route transition
      setTimeout(() => setIsSaving(false), 500);
    },
    [router, getStepPayload, isSaving, buildStepHref],
  );

  const goBack = useCallback(
    (currentSlug: ProfileSetupStepSlug) => {
      const idx = STEP_SLUGS.indexOf(currentSlug);
      if (idx > 0) {
        router.push(buildStepHref(STEP_SLUGS[idx - 1]));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.back();
      }
    },
    [router, buildStepHref],
  );

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const categoryInfo =
        getCategoryByKey(selectedCategories[0]) || allCategories[0];

      let pricingModel = formData.pricingModel || "range";

      const baseRaw = formData.basePrice.trim();
      const maxRaw = formData.maxPrice.trim();
      const baseNum = baseRaw ? Number(baseRaw) : NaN;
      const maxNum = maxRaw ? Number(maxRaw) : NaN;

      const hasServicePricingData = servicePricing.length > 0;

      // If user selected services via the new pricing step, skip legacy price validation
      // Even if no prices are set yet, allow submission - pros can set prices later
      if (
        !hasServicePricingData &&
        selectedSubcategoriesWithPricing.length === 0 &&
        pricingModel !== "byAgreement"
      ) {
        if (!baseRaw || !Number.isFinite(baseNum) || baseNum <= 0) {
          pricingModel = "byAgreement"; // fallback - don't block submission
        }
      }

      // Explicit whitelist matching `PortfolioProjectDto` on the backend. The
      // backend uses `forbidNonWhitelisted: true`, so sending extra fields
      // would 400 the entire save. Specifically `clientName`/`clientAvatar`/
      // `rating`/`review` live in the separate `/portfolios` collection and
      // get merged into local state for display only - they must NOT round
      // back to `user.portfolioProjects` (different schema). Everything else
      // (`source`/`jobId`/`isVisible`/`displayOrder`/`completedDate`/`services`)
      // is in both the DTO and the User schema, so we round-trip it here to
      // stop wiping Homico-job markers on every profile-setup save.
      const cleanedPortfolioProjects = portfolioProjects.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        title: p.title,
        description: p.description,
        images: p.images,
        videos: p.videos || [],
        location: p.location,
        beforeAfterPairs: (p.beforeAfterPairs || []).map((pair) => ({
          beforeImage: pair.beforeImage,
          afterImage: pair.afterImage,
        })),
        ...(p.source ? { source: p.source } : {}),
        ...(p.jobId ? { jobId: p.jobId } : {}),
        ...(p.isVisible !== undefined ? { isVisible: p.isVisible } : {}),
        ...(p.displayOrder !== undefined ? { displayOrder: p.displayOrder } : {}),
        ...(p.completedDate ? { completedDate: p.completedDate } : {}),
        ...(p.services && p.services.length > 0 ? { services: p.services } : {}),
      }));

      const requestBody: Record<string, unknown> = {
        profileType: "personal",
        title:
          formData.title ||
          pick({ en: categoryInfo?.name, ka: categoryInfo?.nameKa }) ||
          "",
        bio: formData.bio,
        categories:
          selectedSubcategoriesWithPricing.length > 0
            ? [
                ...new Set(
                  selectedSubcategoriesWithPricing.map((s) => s.categoryKey),
                ),
              ]
            : selectedCategories.length > 0
              ? selectedCategories
              : ["interior-design"],
        subcategories:
          selectedSubcategoriesWithPricing.length > 0
            ? selectedSubcategoriesWithPricing.map((s) => s.key)
            : selectedSubcategories.length > 0
              ? selectedSubcategories
              : user?.selectedSubcategories || [],
        selectedServices:
          selectedSubcategoriesWithPricing.length > 0
            ? selectedSubcategoriesWithPricing.map((s) => ({
                key: s.key,
                categoryKey: s.categoryKey,
                name: s.name,
                nameKa: s.nameKa,
                experience: s.experience,
              }))
            : selectedServices.map((s) => ({
                key: s.key,
                categoryKey: s.categoryKey,
                name: s.name,
                nameKa: s.nameKa,
                experience: s.experience,
              })),
        customServices: customServices.length > 0 ? customServices : undefined,
        yearsExperience: maxExperienceYears,
        avatar: formData.avatar || user?.avatar,
        ...(servicePricing.length === 0
          ? {
              pricingModel,
              basePrice: baseNum,
              maxPrice:
                pricingModel === "fixed" || pricingModel === "per_sqm"
                  ? null
                  : maxNum,
            }
          : {}),
        serviceAreas:
          formData.nationwide && locationData
            ? [locationData.nationwide]
            : formData.serviceAreas,
        portfolioProjects: cleanedPortfolioProjects,
        pinterestLinks: formData.portfolioUrl
          ? [formData.portfolioUrl]
          : undefined,
        architectLicenseNumber: selectedCategories.includes("architecture")
          ? formData.licenseNumber
          : undefined,
        cadastralId: selectedCategories.includes("architecture")
          ? formData.cadastralId
          : undefined,
        availability: selectedCategories.includes("home-care")
          ? formData.availability
          : undefined,
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
        instagramUrl: formData.instagram || undefined,
        facebookUrl: formData.facebook || undefined,
        linkedinUrl: formData.linkedin || undefined,
        tiktokUrl: formData.tiktok || undefined,
        websiteUrl: formData.website || undefined,
        // Use the `servicePricing` useMemo above as the single source of truth -
        // it correctly carries range fields (`priceMin`/`priceMax`) and per-service
        // `notes`. A previous inline serializer here silently dropped them.
        servicePricing: servicePricing.length > 0 ? servicePricing : undefined,
      };

      // Debug: log what we're about to send
      console.log("[ProfileSetup] Submit state:", {
        "formData.bio": formData.bio?.substring(0, 50),
        "formData.serviceAreas": formData.serviceAreas,
        "selectedSubcategoriesWithPricing.length":
          selectedSubcategoriesWithPricing.length,
        "selectedServices.length": selectedServices.length,
        "servicePricing.length": servicePricing.length,
        "requestBody.bio": (requestBody.bio as string)?.substring(0, 50),
        "requestBody.serviceAreas": requestBody.serviceAreas,
        "requestBody.categories": requestBody.categories,
        "requestBody.servicePricing count": (
          requestBody.servicePricing as unknown[]
        )?.length,
      });

      const url = isAdminEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/pros/${adminTargetProId}/profile`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`;
      const method = isEditMode && existingProfileId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // NestJS class-validator returns `message: string | string[]`. An array
      // appears when multiple fields fail at once - if we cast it as `string`
      // and slap it into an error banner, the user sees a comma-jammed mess
      // like "priceMin must be a number,services.0.label must be a string".
      const data = (await response.json()) as {
        id?: string;
        _id?: string;
        message?: string | string[];
      };

      if (!response.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join("; ")
          : data.message;
        throw new Error(
          msg ||
            (isEditMode
              ? "Failed to update profile"
              : "Failed to create profile"),
        );
      }

      // Meta Pixel: a pro finishing their profile for the first time is a
      // completed registration. Gate on `isProfileCompleted` (the real
      // first-completion signal) - NOT `isEditMode`. `isEditMode` is set true
      // whenever GET /users/me/pro-profile returns 200, which it always does
      // for a logged-in pro (the user doc always exists), so `!isEditMode`
      // suppressed this event in virtually every real session. A genuine
      // first-timer still has isProfileCompleted falsy at this point; this
      // submit flips it true just below.
      const fbq =
        typeof window !== "undefined"
          ? (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
          : undefined;
      if (
        !isAdminEditing &&
        !user?.isProfileCompleted &&
        typeof fbq === "function"
      ) {
        fbq("track", "CompleteRegistration");
      }

      if (!isAdminEditing) {
        updateUser({
          isProfileCompleted: true,
          selectedCategories:
            selectedCategories.length > 0
              ? selectedCategories
              : ["interior-design"],
          selectedSubcategories:
            selectedSubcategories.length > 0
              ? selectedSubcategories
              : user?.selectedSubcategories || [],
          selectedServices: selectedServices.map((s) => ({
            key: s.key,
            categoryKey: s.categoryKey,
            name: s.name,
            nameKa: s.nameKa,
            experience: s.experience,
          })),
          avatar: formData.avatar || user?.avatar,
        });
      }

      try {
        sessionStorage.removeItem("profileSetupDraft");
      } catch {
        // ignore
      }

      const userId = isAdminEditing
        ? adminTargetProId
        : data.id || data._id || user?.id;
      if (userId) {
        router.push(`/professionals/${userId}`);
      } else {
        router.push("/professionals");
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(
        e.message ||
          (isEditMode
            ? "Failed to update profile"
            : "Failed to create profile"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    formData,
    selectedCategories,
    selectedSubcategories,
    selectedServices,
    selectedSubcategoriesWithPricing,
    customServices,
    portfolioProjects,
    servicePricing,
    maxExperienceYears,
    locationData,
    isEditMode,
    existingProfileId,
    isAdminEditing,
    adminTargetProId,
    user,
    pick,
    allCategories,
    getCategoryByKey,
    updateUser,
    router,
  ]);

  // Keep ref in sync so goNext can call it
  handleSubmitRef.current = handleSubmit;

  const value: ProfileSetupContextValue = {
    formData,
    setFormData,
    handleFormChange,
    selectedServices,
    setSelectedServices,
    customServices,
    setCustomServices,
    selectedSubcategoriesWithPricing,
    setSelectedSubcategoriesWithPricing,
    portfolioProjects,
    setPortfolioProjects,
    avatarPreview,
    setAvatarPreview,
    handleAvatarCropped,
    locationData,
    selectedCategories,
    selectedSubcategories,
    servicePricing,
    maxExperienceYears,
    isLoading,
    profileLoading,
    error,
    isEditMode,
    isAdminEditing,
    adminTargetProId,
    validation,
    isFormValid,
    canProceedFromStep,
    currentStepIndex,
    goToStep,
    goNext,
    goBack,
    isSaving,
    handleSubmit,
  };

  return (
    <ProfileSetupContext.Provider value={value}>
      {children}
    </ProfileSetupContext.Provider>
  );
}

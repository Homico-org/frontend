'use client';

import { PortfolioProject } from '@/components/pro/steps/ProjectsStep';
import { SelectedSubcategoryWithPricing } from '@/components/pro/steps/ServicesPricingStep';
import { ExperienceLevel, SelectedService } from '@/components/register/steps/StepSelectServices';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProfileSetupStepSlug = 'about' | 'services' | 'areas' | 'portfolio' | 'review';

export const STEP_SLUGS: ProfileSetupStepSlug[] = [
  'about',
  'services',
  'areas',
  'portfolio',
  'review',
];

export const STEP_META: {
  slug: ProfileSetupStepSlug;
  title: { en: string; ka: string };
}[] = [
  { slug: 'about', title: { en: 'About You', ka: 'შენს შესახებ' } },
  { slug: 'services', title: { en: 'Services & Prices', ka: 'სერვისები და ფასები' } },
  { slug: 'areas', title: { en: 'Service Areas', ka: 'სერვისის ზონები' } },
  { slug: 'portfolio', title: { en: 'Portfolio', ka: 'პორტფოლიო' } },
  { slug: 'review', title: { en: 'Review', ka: 'გადახედვა' } },
];

interface FormData {
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
  pricingModel: 'fixed' | 'range' | 'per_sqm' | 'byAgreement' | '';
  serviceAreas: string[];
  nationwide: boolean;
  whatsapp: string;
  telegram: string;
  instagram: string;
  facebook: string;
  linkedin: string;
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
  setSelectedSubcategoriesWithPricing: React.Dispatch<React.SetStateAction<SelectedSubcategoryWithPricing[]>>;

  portfolioProjects: PortfolioProject[];
  setPortfolioProjects: React.Dispatch<React.SetStateAction<PortfolioProject[]>>;

  avatarPreview: string | null;
  setAvatarPreview: React.Dispatch<React.SetStateAction<string | null>>;
  handleAvatarCropped: (croppedDataUrl: string) => void;

  locationData: LocationData | null;

  // Derived
  selectedCategories: string[];
  selectedSubcategories: string[];
  servicePricing: {
    serviceKey: string;
    categoryKey: string;
    subcategoryKey: string;
    price: number;
    isActive: boolean;
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

  // Welcome banner
  showWelcomeBanner: boolean;
  dismissWelcomeBanner: () => void;

  // Navigation helpers
  currentStepIndex: (slug: ProfileSetupStepSlug) => number;
  goToStep: (slug: ProfileSetupStepSlug) => void;
  goNext: (currentSlug: ProfileSetupStepSlug) => void;
  goBack: (currentSlug: ProfileSetupStepSlug) => void;

  // Submit
  handleSubmit: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ProfileSetupContext = createContext<ProfileSetupContextValue | null>(null);

export function useProfileSetup() {
  const ctx = useContext(ProfileSetupContext);
  if (!ctx) throw new Error('useProfileSetup must be used inside ProfileSetupProvider');
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
  const { locale } = useLanguage();
  const { categories: allCategories, getCategoryByKey } = useCategories();

  const isAdminEditing = user?.role === 'admin' && !!adminTargetProId;

  // ── Form state ──────────────────────────────────────────────────────────────

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [selectedSubcategoriesWithPricing, setSelectedSubcategoriesWithPricing] =
    useState<SelectedSubcategoryWithPricing[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    bio: '',
    yearsExperience: '',
    avatar: '',
    portfolioUrl: '',
    licenseNumber: '',
    cadastralId: '',
    availability: [],
    basePrice: '',
    maxPrice: '',
    pricingModel: 'range',
    serviceAreas: [],
    nationwide: false,
    whatsapp: '',
    telegram: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    website: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const hasFetchedProfile = useRef(false);
  const initialAvatarRef = useRef<string | null>(null);
  const hasSetAvatarFromUser = useRef(false);
  const isFirstRender = useRef(true);
  const hasTranslatedServiceAreas = useRef(false);

  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    try {
      return localStorage.getItem('profileSetupWelcomeDismissed') !== 'true';
    } catch {
      return true;
    }
  });

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedCategories = useMemo(
    () => [...new Set(selectedServices.map((s) => s.categoryKey))],
    [selectedServices],
  );

  const selectedSubcategories = useMemo(
    () => selectedServices.map((s) => s.key),
    [selectedServices],
  );

  const servicePricing = useMemo(
    () =>
      selectedSubcategoriesWithPricing.flatMap((sub) =>
        sub.services
          .filter((s) => s.isActive && s.price > 0)
          .map((s) => ({
            serviceKey: s.serviceKey,
            categoryKey: s.categoryKey,
            subcategoryKey: s.subcategoryKey,
            price: s.price,
            isActive: s.isActive,
          })),
      ),
    [selectedSubcategoriesWithPricing],
  );

  const maxExperienceYears = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    const expMap: Record<ExperienceLevel, number> = {
      '1-2': 2,
      '3-5': 5,
      '5-10': 10,
      '10+': 15,
    };
    return Math.max(...selectedServices.map((s) => expMap[s.experience] || 0));
  }, [selectedServices]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const yearsToExperienceLevel = (years: number): ExperienceLevel => {
    if (years >= 10) return '10+';
    if (years >= 5) return '5-10';
    if (years >= 3) return '3-5';
    return '1-2';
  };

  const convertToSelectedServices = useCallback(
    (subcategoryKeys: string[], defaultExperience: ExperienceLevel = '3-5'): SelectedService[] => {
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

  useEffect(() => {
    try {
      if (sessionStorage.getItem('proRegistrationData')) return;
      const raw = sessionStorage.getItem('profileSetupDraft');
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        formData?: Partial<FormData>;
        selectedServices?: SelectedService[];
        customServices?: string[];
        portfolioProjects?: PortfolioProject[];
      };
      if (draft.formData) setFormData((prev) => ({ ...prev, ...draft.formData }));
      if (Array.isArray(draft.selectedServices)) setSelectedServices(draft.selectedServices);
      if (Array.isArray(draft.customServices)) setCustomServices(draft.customServices);
      if (Array.isArray(draft.portfolioProjects)) setPortfolioProjects(draft.portfolioProjects);
    } catch {
      // corrupt draft — ignore
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
        'profileSetupDraft',
        JSON.stringify({ formData, selectedServices, customServices, portfolioProjects }),
      );
    } catch {
      // quota exceeded — ignore
    }
  }, [formData, selectedServices, customServices, portfolioProjects]);

  // ── Avatar init from localStorage ───────────────────────────────────────────

  useEffect(() => {
    if (initialAvatarRef.current === null) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as { avatar?: string };
          if (parsed.avatar) {
            const avatarUrl =
              parsed.avatar.startsWith('http') || parsed.avatar.startsWith('data:')
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
        initialAvatarRef.current = '';
      }
    }
  }, []);

  // ── Fetch existing profile ───────────────────────────────────────────────────

  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (hasFetchedProfile.current) return;
      if (!user || (user.role !== 'pro' && !isAdminEditing)) {
        setProfileLoading(false);
        return;
      }

      hasFetchedProfile.current = true;

      // Check sessionStorage for invite registration data first
      const storedData = sessionStorage.getItem('proRegistrationData');
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
            setFormData((prev) => ({ ...prev, portfolioUrl: parsed.pinterestLinks![0] }));
          }
          if (parsed.cadastralId) {
            setFormData((prev) => ({ ...prev, cadastralId: parsed.cadastralId! }));
          }
          if (parsed.portfolioProjects && Array.isArray(parsed.portfolioProjects)) {
            const cleanedProjects = parsed.portfolioProjects.map(
              (p: RawPortfolioProject, idx: number) => ({
                id: p.id || `project-${Date.now()}-${idx}`,
                title: p.title || '',
                description: p.description || '',
                images: p.images || [],
                videos: p.videos || [],
                location: p.location,
                beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map(
                  (pair: ApiBeforeAfterPair, pairIdx: number) => ({
                    id: `pair-${Date.now()}-${pairIdx}`,
                    beforeImage: pair.before || pair.beforeImage || '',
                    afterImage: pair.after || pair.afterImage || '',
                  }),
                ),
              }),
            );
            setPortfolioProjects(cleanedProjects);
          }
          if (parsed.avatar) {
            const avatarFullUrl =
              parsed.avatar.startsWith('http') || parsed.avatar.startsWith('data:')
                ? parsed.avatar
                : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
            setFormData((prev) => ({ ...prev, avatar: avatarFullUrl }));
            setAvatarPreview(avatarFullUrl);
          }
          sessionStorage.removeItem('proRegistrationData');
          setProfileLoading(false);

          // Invited users with pre-selected subcategories skip to services step
          if (subcategories.length > 0) {
            router.replace('/pro/profile-setup/services');
          }
          return;
        } catch (err) {
          console.error('Failed to parse registration data:', err);
        }
      }

      // Fetch existing profile
      try {
        const token = localStorage.getItem('access_token');
        const profileUrl = isAdminEditing
          ? `${process.env.NEXT_PUBLIC_API_URL}/users/pros/${adminTargetProId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`;
        const response = await fetch(profileUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const profile = await response.json() as {
            _id: string;
            selectedServices?: ApiSelectedService[];
            subcategories?: string[];
            customServices?: string[];
            yearsExperience?: number;
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
              price: number;
              isActive: boolean;
              discountTiers?: { minQuantity: number; percent: number }[];
            }[];
            portfolioProjects?: RawPortfolioProject[];
            whatsapp?: string;
            telegram?: string;
            instagramUrl?: string;
            facebookUrl?: string;
            linkedinUrl?: string;
            websiteUrl?: string;
          };
          setExistingProfileId(profile._id);
          setIsEditMode(true);

          if (profile.selectedServices && profile.selectedServices.length > 0) {
            const loadedServices: SelectedService[] = profile.selectedServices.map((s) => ({
              key: s.key,
              categoryKey: s.categoryKey,
              name: s.name,
              nameKa: s.nameKa,
              experience: (s.experience || '3-5') as ExperienceLevel,
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
              const services = convertToSelectedServices(subcategories, expLevel);
              setSelectedServices(services);
            }
          }

          // Populate servicePricing → selectedSubcategoriesWithPricing
          if (profile.servicePricing && profile.servicePricing.length > 0) {
            const grouped: Record<string, typeof profile.servicePricing> = {};
            for (const sp of profile.servicePricing) {
              const key = sp.subcategoryKey || sp.categoryKey;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(sp);
            }
            const subsWithPricing: SelectedSubcategoryWithPricing[] = [];
            for (const [subKey, spEntries] of Object.entries(grouped)) {
              // Find the subcategory in the catalog
              let foundSub: { key: string; name: string; nameKa: string; services?: { key: string; name: string; nameKa: string; basePrice: number; unit: string; unitName: string; unitNameKa: string }[] } | null = null;
              let foundCatKey = '';
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
              const selSvc = profile.selectedServices?.find(s => s.key === subKey);
              const exp = (selSvc?.experience || '3-5') as ExperienceLevel;
              subsWithPricing.push({
                key: subKey,
                categoryKey: foundCatKey,
                name: foundSub.name,
                nameKa: foundSub.nameKa,
                experience: exp,
                services: (foundSub.services || []).map(catSvc => {
                  const existing = spEntries.find(sp => sp.serviceKey === catSvc.key);
                  return {
                    serviceKey: catSvc.key,
                    subcategoryKey: subKey,
                    categoryKey: foundCatKey,
                    label: locale === 'ka' ? catSvc.nameKa : catSvc.name,
                    unit: catSvc.unit,
                    unitLabel: locale === 'ka' ? catSvc.unitNameKa : catSvc.unitName,
                    basePrice: catSvc.basePrice,
                    price: existing?.price || 0,
                    isActive: existing?.isActive ?? true,
                    discountTiers: existing?.discountTiers || [],
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

          setFormData((prev) => ({
            ...prev,
            title: profile.title || '',
            bio: profile.bio || '',
            avatar: profile.avatar || user?.avatar || '',
            portfolioUrl: profile.pinterestLinks?.[0] || '',
            licenseNumber: profile.architectLicenseNumber || '',
            cadastralId: profile.cadastralId || '',
            availability: profile.availability || [],
            basePrice: profile.basePrice?.toString() || '',
            maxPrice: profile.maxPrice?.toString() || '',
            pricingModel: (profile.pricingModel as FormData['pricingModel']) || '',
            serviceAreas:
              profile.serviceAreas?.includes('Countrywide') ||
              profile.serviceAreas?.includes('საქართველოს მასშტაბით')
                ? []
                : profile.serviceAreas || [],
            nationwide:
              profile.serviceAreas?.includes('Countrywide') ||
              profile.serviceAreas?.includes('საქართველოს მასშტაბით') ||
              false,
            whatsapp: profile.whatsapp || '',
            telegram: profile.telegram || '',
            instagram: profile.instagramUrl || '',
            facebook: profile.facebookUrl || '',
            linkedin: profile.linkedinUrl || '',
            website: profile.websiteUrl || '',
          }));

          // Avatar
          let avatarUrl: string | null = null;
          if (initialAvatarRef.current && initialAvatarRef.current.startsWith('data:')) {
            avatarUrl = initialAvatarRef.current;
          } else if (user?.avatar && user.avatar.startsWith('data:')) {
            avatarUrl = user.avatar;
          } else {
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser) as { avatar?: string };
                if (parsedUser.avatar && parsedUser.avatar.startsWith('data:')) {
                  avatarUrl = parsedUser.avatar;
                }
              }
            } catch {
              // ignore
            }
          }
          if (!avatarUrl) {
            avatarUrl =
              profile.avatar || user?.avatar || initialAvatarRef.current || null;
          }
          if (avatarUrl) {
            const fullUrl =
              avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')
                ? avatarUrl
                : `${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`;
            setAvatarPreview(fullUrl);
            setFormData((prev) => ({ ...prev, avatar: fullUrl }));
          }

          // Portfolio projects
          let loadedProjects: PortfolioProject[] = [];
          if (profile.portfolioProjects && profile.portfolioProjects.length > 0) {
            loadedProjects = profile.portfolioProjects.map(
              (p: RawPortfolioProject, idx: number) => ({
                id: p.id || `project-${Date.now()}-${idx}`,
                title: p.title || '',
                description: p.description || '',
                images: p.images || [],
                videos: p.videos || [],
                location: p.location || '',
                beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map(
                  (pair: ApiBeforeAfterPair, pairIdx: number) => ({
                    id: `pair-${Date.now()}-${pairIdx}`,
                    beforeImage: pair.before || pair.beforeImage || '',
                    afterImage: pair.after || pair.afterImage || '',
                  }),
                ),
              }),
            );
          }

          try {
            const portfolioRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`,
            );
            if (portfolioRes.ok) {
              const portfolioData = await portfolioRes.json() as RawPortfolioProject[];
              if (portfolioData && portfolioData.length > 0) {
                const fetchedProjects = portfolioData.map(
                  (p: RawPortfolioProject, idx: number) => ({
                    id: p.id || p._id || `portfolio-${Date.now()}-${idx}`,
                    title: p.title || '',
                    description: p.description || '',
                    images: p.images || [p.imageUrl].filter(Boolean) as string[],
                    videos: p.videos || [],
                    location: p.location || '',
                    beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map(
                      (pair: ApiBeforeAfterPair, pairIdx: number) => ({
                        id: `pair-${Date.now()}-${pairIdx}`,
                        beforeImage: pair.before || pair.beforeImage || '',
                        afterImage: pair.after || pair.afterImage || '',
                      }),
                    ),
                  }),
                );
                const existingTitles = new Set(loadedProjects.map((p) => p.title));
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
            const services = convertToSelectedServices(user.selectedSubcategories, '3-5');
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
  }, [user, allCategories, isAdminEditing, adminTargetProId, convertToSelectedServices, router]);

  // ── Avatar from user context ─────────────────────────────────────────────────

  useEffect(() => {
    if (!hasSetAvatarFromUser.current && user?.avatar && !avatarPreview && !profileLoading) {
      hasSetAvatarFromUser.current = true;
      const avatarFullUrl =
        user.avatar.startsWith('http') || user.avatar.startsWith('data:')
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
        const detectedCountry = 'Georgia';
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros/locations?country=${encodeURIComponent(detectedCountry)}&locale=${locale}`,
        );
        const data = await response.json() as LocationData;
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

      if (translatedAreas.join(',') !== formData.serviceAreas.join(',')) {
        setFormData((prev) => ({ ...prev, serviceAreas: translatedAreas }));
      }
    }
  }, [locationData, formData.serviceAreas]);

  // ── Validation ───────────────────────────────────────────────────────────────

  // Require: at least 1 active service with price > 0 across all subcategories
  const allActiveServices = selectedSubcategoriesWithPricing.flatMap(s => s.services.filter(svc => svc.isActive));
  const allActiveServicesPriced =
    allActiveServices.length > 0 &&
    allActiveServices.every((svc) => svc.price > 0);

  const validation: ProfileSetupValidation = useMemo(
    () => ({
      avatar: !!avatarPreview && avatarPreview.length > 0,
      bio: formData.bio.trim().length >= 50,
      experience: selectedSubcategoriesWithPricing.length > 0,
      categories: selectedSubcategoriesWithPricing.length > 0,
      subcategories: selectedSubcategoriesWithPricing.length > 0,
      pricing:
        selectedSubcategoriesWithPricing.length > 0
          ? selectedSubcategoriesWithPricing.every((s) =>
              s.services.length === 0 ||
              s.services.filter((svc) => svc.isActive).every((svc) => svc.price > 0),
            )
          : servicePricing.length > 0,
      serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
      portfolio: true,
    }),
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
    validation.avatar &&
    validation.bio &&
    validation.categories &&
    validation.subcategories &&
    validation.pricing &&
    validation.serviceAreas;

  const canProceedFromStep = useCallback(
    (slug: ProfileSetupStepSlug): boolean => {
      switch (slug) {
        case 'about': return validation.avatar && validation.bio;
        case 'services': return allActiveServicesPriced;
        case 'areas': return validation.serviceAreas;
        case 'portfolio': return true;
        case 'review': return isFormValid;
      }
    },
    [validation, allActiveServicesPriced, isFormValid],
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

  const dismissWelcomeBanner = useCallback(() => {
    try {
      localStorage.setItem('profileSetupWelcomeDismissed', 'true');
    } catch {
      // ignore
    }
    setShowWelcomeBanner(false);
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const currentStepIndex = useCallback(
    (slug: ProfileSetupStepSlug) => STEP_SLUGS.indexOf(slug),
    [],
  );

  const goToStep = useCallback(
    (slug: ProfileSetupStepSlug) => {
      router.push(`/pro/profile-setup/${slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router],
  );

  const goNext = useCallback(
    (currentSlug: ProfileSetupStepSlug) => {
      const idx = STEP_SLUGS.indexOf(currentSlug);
      if (idx < STEP_SLUGS.length - 1) {
        router.push(`/pro/profile-setup/${STEP_SLUGS[idx + 1]}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const goBack = useCallback(
    (currentSlug: ProfileSetupStepSlug) => {
      const idx = STEP_SLUGS.indexOf(currentSlug);
      if (idx > 0) {
        router.push(`/pro/profile-setup/${STEP_SLUGS[idx - 1]}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.back();
      }
    },
    [router],
  );

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const categoryInfo =
        getCategoryByKey(selectedCategories[0]) || allCategories[0];

      let pricingModel = formData.pricingModel || 'range';

      const baseRaw = formData.basePrice.trim();
      const maxRaw = formData.maxPrice.trim();
      const baseNum = baseRaw ? Number(baseRaw) : NaN;
      const maxNum = maxRaw ? Number(maxRaw) : NaN;

      const hasServicePricingData =
        servicePricing.length > 0;

      // If user selected services via the new pricing step, skip legacy price validation
      // Even if no prices are set yet, allow submission — pros can set prices later
      if (!hasServicePricingData && selectedSubcategoriesWithPricing.length === 0 && pricingModel !== 'byAgreement') {
        if (!baseRaw || !Number.isFinite(baseNum) || baseNum <= 0) {
          pricingModel = 'byAgreement'; // fallback — don't block submission
        }
      }

      const cleanedPortfolioProjects = portfolioProjects.map((p) => ({
        title: p.title,
        description: p.description,
        images: p.images,
        videos: p.videos || [],
        location: p.location,
        beforeAfterPairs: (p.beforeAfterPairs || []).map((pair) => ({
          beforeImage: pair.beforeImage,
          afterImage: pair.afterImage,
        })),
      }));

      const requestBody: Record<string, unknown> = {
        profileType: 'personal',
        title:
          formData.title ||
          (locale === 'ka' ? categoryInfo?.nameKa : categoryInfo?.name) ||
          '',
        bio: formData.bio,
        categories:
          selectedSubcategoriesWithPricing.length > 0
            ? [...new Set(selectedSubcategoriesWithPricing.map((s) => s.categoryKey))]
            : selectedCategories.length > 0
            ? selectedCategories
            : ['interior-design'],
        subcategories:
          selectedSubcategoriesWithPricing.length > 0
            ? selectedSubcategoriesWithPricing.map((s) => s.key)
            : selectedSubcategories.length > 0
            ? selectedSubcategories
            : user?.selectedSubcategories || [],
        selectedServices: selectedServices.map((s) => ({
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
                pricingModel === 'fixed' || pricingModel === 'per_sqm' ? null : maxNum,
            }
          : {}),
        serviceAreas:
          formData.nationwide && locationData
            ? [locationData.nationwide]
            : formData.serviceAreas,
        portfolioProjects: cleanedPortfolioProjects,
        pinterestLinks: formData.portfolioUrl ? [formData.portfolioUrl] : undefined,
        architectLicenseNumber: selectedCategories.includes('architecture')
          ? formData.licenseNumber
          : undefined,
        cadastralId: selectedCategories.includes('architecture')
          ? formData.cadastralId
          : undefined,
        availability: selectedCategories.includes('home-care')
          ? formData.availability
          : undefined,
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
        instagramUrl: formData.instagram || undefined,
        facebookUrl: formData.facebook || undefined,
        linkedinUrl: formData.linkedin || undefined,
        websiteUrl: formData.website || undefined,
        servicePricing:
          selectedSubcategoriesWithPricing.length > 0
            ? selectedSubcategoriesWithPricing.flatMap((sub) =>
                sub.services
                  .filter((s) => s.price > 0)
                  .map((s) => ({
                    serviceKey: s.serviceKey,
                    categoryKey: sub.categoryKey,
                    subcategoryKey: sub.key,
                    price: s.price,
                    isActive: s.isActive,
                    ...(s.discountTiers.length > 0 ? { discountTiers: s.discountTiers } : {}),
                  })),
              )
            : undefined,
      };

      const url = isAdminEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/pros/${adminTargetProId}/profile`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`;
      const method = isEditMode && existingProfileId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as { id?: string; _id?: string; message?: string };

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditMode ? 'Failed to update profile' : 'Failed to create profile'),
        );
      }

      if (!isAdminEditing) {
        updateUser({
          isProfileCompleted: true,
          selectedCategories:
            selectedCategories.length > 0 ? selectedCategories : ['interior-design'],
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
        sessionStorage.removeItem('profileSetupDraft');
      } catch {
        // ignore
      }

      const userId = isAdminEditing
        ? adminTargetProId
        : data.id || data._id || user?.id;
      if (userId) {
        router.push(`/professionals/${userId}`);
      } else {
        router.push('/professionals');
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(
        e.message || (isEditMode ? 'Failed to update profile' : 'Failed to create profile'),
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
    locale,
    allCategories,
    getCategoryByKey,
    updateUser,
    router,
  ]);

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
    showWelcomeBanner,
    dismissWelcomeBanner,
    currentStepIndex,
    goToStep,
    goNext,
    goBack,
    handleSubmit,
  };

  return (
    <ProfileSetupContext.Provider value={value}>
      {children}
    </ProfileSetupContext.Provider>
  );
}

'use client';

import AuthGuard from '@/components/common/AuthGuard';
import AboutStep from '@/components/pro/steps/AboutStep';
import Image from 'next/image';
import CategoriesStep from '@/components/pro/steps/CategoriesStep';
import PricingStep from '@/components/pro/steps/PricingStep';
import ServiceAreasStep from '@/components/pro/steps/ServiceAreasStep';
import ReviewStep from '@/components/pro/steps/ReviewStep';
import { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';

type ProfileSetupStep = 'about' | 'categories' | 'pricing' | 'areas' | 'review';

const STEPS: { id: ProfileSetupStep; title: { en: string; ka: string } }[] = [
  { id: 'about', title: { en: 'About You', ka: 'შენს შესახებ' } },
  { id: 'categories', title: { en: 'Services', ka: 'სერვისები' } },
  { id: 'pricing', title: { en: 'Pricing', ka: 'ფასები' } },
  { id: 'areas', title: { en: 'Service Areas', ka: 'ზონები' } },
  { id: 'review', title: { en: 'Review', ka: 'გადახედვა' } },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image src="/icon.svg" alt="Homico" width={120} height={30} className="h-7 w-auto" />
    </Link>
  );
}

function ProProfileSetupPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { locale } = useLanguage();
  const { categories: allCategories, getCategoryByKey } = useCategories();

  // Step state
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>('about');

  // Form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    yearsExperience: '',
    avatar: '',
    portfolioUrl: '',
    licenseNumber: '',
    cadastralId: '',
    availability: [] as string[],
    basePrice: '',
    maxPrice: '',
    pricingModel: '' as 'hourly' | 'daily' | 'sqm' | 'project_based' | '',
    serviceAreas: [] as string[],
    nationwide: false,
  });

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Store initial avatar from localStorage in a ref so it persists
  const initialAvatarRef = useRef<string | null>(null);

  // Initialize avatar from localStorage on mount
  useEffect(() => {
    if (initialAvatarRef.current === null) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.avatar) {
            const avatarUrl = parsed.avatar.startsWith('http') || parsed.avatar.startsWith('data:')
              ? parsed.avatar
              : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
            initialAvatarRef.current = avatarUrl;
            setAvatarPreview(avatarUrl);
            setFormData(prev => ({ ...prev, avatar: avatarUrl }));
          }
        }
      } catch (e) {
        console.error('Failed to get avatar from localStorage:', e);
      }
      if (initialAvatarRef.current === null) {
        initialAvatarRef.current = '';
      }
    }
  }, []);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const hasFetchedProfile = useRef(false);
  const [locationData, setLocationData] = useState<{
    country: string;
    nationwide: string;
    regions: Record<string, string[]>;
    emoji: string;
  } | null>(null);

  // Get current step index
  const getCurrentStepIndex = () => STEPS.findIndex(s => s.id === currentStep);

  // Get progress percentage
  const getProgressPercentage = () => {
    const index = getCurrentStepIndex();
    return ((index + 1) / STEPS.length) * 100;
  };

  // Fetch existing profile data if user is a pro (only once)
  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (hasFetchedProfile.current) return;
      if (!user || user.role !== 'pro') {
        setProfileLoading(false);
        return;
      }

      hasFetchedProfile.current = true;

      // First check sessionStorage for new registration data
      const storedData = sessionStorage.getItem('proRegistrationData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          const categories = parsed.categories || (parsed.category ? [parsed.category] : ['interior-design']);
          setSelectedCategories(categories);
          setSelectedSubcategories(parsed.subcategories || []);
          if (parsed.pinterestLinks?.[0]) {
            setFormData(prev => ({ ...prev, portfolioUrl: parsed.pinterestLinks[0] }));
          }
          if (parsed.cadastralId) {
            setFormData(prev => ({ ...prev, cadastralId: parsed.cadastralId }));
          }
          if (parsed.portfolioProjects && Array.isArray(parsed.portfolioProjects)) {
            const cleanedProjects = parsed.portfolioProjects.map((p: any, idx: number) => ({
              id: p.id || `project-${Date.now()}-${idx}`,
              title: p.title || '',
              description: p.description || '',
              images: p.images || [],
              location: p.location,
              beforeAfterPairs: p.beforeAfterPairs || [],
            }));
            setPortfolioProjects(cleanedProjects);
          }
          if (parsed.avatar) {
            const avatarFullUrl = parsed.avatar.startsWith('http') || parsed.avatar.startsWith('data:')
              ? parsed.avatar
              : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
            setFormData(prev => ({ ...prev, avatar: avatarFullUrl }));
            setAvatarPreview(avatarFullUrl);
          }
          sessionStorage.removeItem('proRegistrationData');
          setProfileLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse registration data:', err);
        }
      }

      // Try to fetch existing profile
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setExistingProfileId(profile._id);
          setIsEditMode(true);

          setSelectedCategories(profile.categories || ['interior-design']);
          setSelectedSubcategories(profile.subcategories || []);

          setFormData(prev => ({
            ...prev,
            title: profile.title || '',
            bio: profile.description || profile.bio || '',
            yearsExperience: profile.yearsExperience?.toString() || '',
            avatar: profile.avatar || user?.avatar || '',
            portfolioUrl: profile.pinterestLinks?.[0] || '',
            licenseNumber: profile.architectLicenseNumber || '',
            cadastralId: profile.cadastralId || '',
            availability: profile.availability || [],
            basePrice: profile.basePrice?.toString() || '',
            maxPrice: profile.maxPrice?.toString() || '',
            pricingModel: profile.pricingModel || '',
            serviceAreas: profile.serviceAreas?.includes('Countrywide') ? [] : (profile.serviceAreas || []),
            nationwide: profile.serviceAreas?.includes('Countrywide') || false,
          }));

          // Set avatar preview
          let avatarUrl: string | null = null;
          if (initialAvatarRef.current && initialAvatarRef.current.startsWith('data:')) {
            avatarUrl = initialAvatarRef.current;
          } else if (user?.avatar && user.avatar.startsWith('data:')) {
            avatarUrl = user.avatar;
          } else {
            try {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.avatar && parsedUser.avatar.startsWith('data:')) {
                  avatarUrl = parsedUser.avatar;
                }
              }
            } catch (e) {
              console.error('Failed to parse stored user:', e);
            }
          }

          if (!avatarUrl) {
            avatarUrl = profile.avatar || user?.avatar || initialAvatarRef.current || null;
          }

          if (avatarUrl) {
            const fullUrl = avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')
              ? avatarUrl
              : `${process.env.NEXT_PUBLIC_API_URL}${avatarUrl}`;
            setAvatarPreview(fullUrl);
            setFormData(prev => ({ ...prev, avatar: fullUrl }));
          }

          // Load portfolio projects
          let loadedProjects: PortfolioProject[] = [];
          if (profile.portfolioProjects && profile.portfolioProjects.length > 0) {
            loadedProjects = profile.portfolioProjects.map((p: any, idx: number) => ({
              id: p.id || `project-${Date.now()}-${idx}`,
              title: p.title || '',
              description: p.description || '',
              images: p.images || [],
              location: p.location || '',
              beforeAfterPairs: p.beforeAfterPairs || [],
            }));
          }

          try {
            const portfolioRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`);
            if (portfolioRes.ok) {
              const portfolioData = await portfolioRes.json();
              if (portfolioData && portfolioData.length > 0) {
                const fetchedProjects = portfolioData.map((p: any, idx: number) => ({
                  id: p.id || p._id || `portfolio-${Date.now()}-${idx}`,
                  title: p.title || '',
                  description: p.description || '',
                  images: p.images || [p.imageUrl].filter(Boolean),
                  location: p.location || '',
                  beforeAfterPairs: p.beforeAfterPairs || [],
                }));
                const existingTitles = new Set(loadedProjects.map(p => p.title));
                fetchedProjects.forEach((p: PortfolioProject) => {
                  if (!existingTitles.has(p.title)) {
                    loadedProjects.push(p);
                  }
                });
              }
            }
          } catch (portfolioErr) {
            console.error('Failed to fetch portfolio:', portfolioErr);
          }

          if (loadedProjects.length > 0) {
            setPortfolioProjects(loadedProjects);
          }
        } else {
          if (user?.selectedCategories && user.selectedCategories.length > 0) {
            setSelectedCategories(user.selectedCategories);
          } else {
            setSelectedCategories(['interior-design']);
          }
        }
      } catch (err) {
        console.error('Failed to fetch existing profile:', err);
        setSelectedCategories(['interior-design']);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchExistingProfile();
  }, [user]);

  // Load user avatar
  const hasSetAvatarFromUser = useRef(false);
  useEffect(() => {
    if (!hasSetAvatarFromUser.current && user?.avatar && !avatarPreview && !profileLoading) {
      hasSetAvatarFromUser.current = true;
      const avatarFullUrl = user.avatar.startsWith('http') || user.avatar.startsWith('data:')
        ? user.avatar
        : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`;
      setFormData(prev => ({ ...prev, avatar: avatarFullUrl }));
      setAvatarPreview(avatarFullUrl);
    }
  }, [user?.avatar, avatarPreview, profileLoading]);

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        let detectedCountry = 'Georgia';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Tbilisi') || timezone.includes('Georgia')) {
          detectedCountry = 'Georgia';
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros/locations?country=${encodeURIComponent(detectedCountry)}`
        );
        const data = await response.json();
        setLocationData(data);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      }
    };
    fetchLocationData();
  }, []);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'pro')) {
      router.push('/browse');
    }
  }, [user, authLoading, router]);

  // Validation
  const validation = useMemo(() => ({
    avatar: !!avatarPreview && avatarPreview.length > 0,
    bio: !!formData.bio.trim(),
    experience: !!formData.yearsExperience,
    categories: selectedCategories.length > 0,
    subcategories: selectedSubcategories.length > 0,
    pricing: !!formData.basePrice,
    serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
  }), [avatarPreview, formData.bio, formData.yearsExperience, formData.basePrice, formData.nationwide, formData.serviceAreas, selectedCategories.length, selectedSubcategories.length]);

  const isFormValid = validation.avatar && validation.bio && validation.experience && validation.categories && validation.subcategories && validation.pricing && validation.serviceAreas;

  // Handlers
  const handleAvatarChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // This is now handled internally by AboutStep with cropper
  };

  const handleAvatarCropped = (croppedDataUrl: string) => {
    setAvatarPreview(croppedDataUrl);
    setFormData(prev => ({ ...prev, avatar: croppedDataUrl }));
  };

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: ProfileSetupStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const categoryInfo = getCategoryByKey(selectedCategories[0]) || allCategories[0];

      let pricingModel = formData.pricingModel || 'project_based';
      if (!formData.pricingModel) {
        if (selectedCategories.includes('interior-design') || selectedCategories.length === 0) {
          pricingModel = 'sqm';
        } else if (selectedCategories.includes('craftsmen') || selectedCategories.includes('home-care')) {
          pricingModel = 'hourly';
        }
      }

      const cleanedPortfolioProjects = portfolioProjects.map(p => ({
        title: p.title,
        description: p.description,
        images: p.images,
        location: p.location,
        beforeAfterPairs: p.beforeAfterPairs || [],
      }));

      const requestBody: Record<string, any> = {
        profileType: 'personal',
        title: formData.title || (locale === 'ka' ? categoryInfo.nameKa : categoryInfo.name),
        bio: formData.bio,
        description: formData.bio,
        categories: selectedCategories.length > 0 ? selectedCategories : ['interior-design'],
        subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : (user?.selectedSubcategories || []),
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        avatar: formData.avatar || user?.avatar,
        pricingModel,
        basePrice: parseFloat(formData.basePrice) || undefined,
        maxPrice: parseFloat(formData.maxPrice) || undefined,
        serviceAreas: formData.nationwide && locationData ? [locationData.nationwide] : formData.serviceAreas,
        portfolioProjects: cleanedPortfolioProjects,
        pinterestLinks: formData.portfolioUrl ? [formData.portfolioUrl] : undefined,
        architectLicenseNumber: selectedCategories.includes('architecture') ? formData.licenseNumber : undefined,
        cadastralId: selectedCategories.includes('architecture') ? formData.cadastralId : undefined,
        availability: selectedCategories.includes('home-care') ? formData.availability : undefined,
      };

      const url = `${process.env.NEXT_PUBLIC_API_URL}/users/me/pro-profile`;
      const method = isEditMode && existingProfileId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isEditMode ? 'Failed to update profile' : 'Failed to create profile'));
      }

      // Update the user context to mark profile as completed
      updateUser({ isProfileCompleted: true });

      router.push('/browse');
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'Failed to update profile' : 'Failed to create profile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Can proceed to next step validation
  const canProceedToNextStep = useMemo(() => {
    switch (currentStep) {
      case 'about': return validation.avatar && validation.bio && validation.experience;
      case 'categories': return validation.categories && validation.subcategories;
      case 'pricing': return validation.pricing;
      case 'areas': return validation.serviceAreas;
      case 'review': return isFormValid;
      default: return false;
    }
  }, [currentStep, validation, isFormValid]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header with progress - matches register page */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-between">
            <Logo />
            <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
              {locale === "ka" ? "დახმარება" : "Help"}
            </Link>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                {locale === "ka" ? `${getCurrentStepIndex() + 1}/${STEPS.length}` : `STEP ${getCurrentStepIndex() + 1}/${STEPS.length}`}
              </span>
              <span className="text-[10px] font-medium text-[#C4735B]">
                {STEPS[getCurrentStepIndex()].title[locale === "ka" ? "ka" : "en"]}
              </span>
            </div>
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C4735B] to-[#D4896B] rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 p-2 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* STEP 1: About */}
          {currentStep === 'about' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "შენს შესახებ" : "About You"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "შეავსე ძირითადი ინფორმაცია" : "Fill in your basic information"}
                </p>
              </div>

              <AboutStep
                formData={{
                  bio: formData.bio,
                  yearsExperience: formData.yearsExperience,
                  avatar: formData.avatar,
                }}
                avatarPreview={avatarPreview}
                onFormChange={handleFormChange}
                onAvatarChange={handleAvatarChange}
                onAvatarCropped={handleAvatarCropped}
                validation={{
                  avatar: validation.avatar,
                  bio: validation.bio,
                  experience: validation.experience,
                }}
              />
            </div>
          )}

          {/* STEP 2: Categories */}
          {currentStep === 'categories' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "რა სერვისებს გთავაზობთ?" : "What services do you provide?"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "აირჩიეთ კატეგორია და უნარები" : "Select your profession and skills"}
                </p>
              </div>

              <CategoriesStep
                selectedCategories={selectedCategories}
                selectedSubcategories={selectedSubcategories}
                onCategoriesChange={setSelectedCategories}
                onSubcategoriesChange={setSelectedSubcategories}
              />
            </div>
          )}

          {/* STEP 3: Pricing */}
          {currentStep === 'pricing' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "ფასები" : "Pricing"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "განსაზღვრე შენი ტარიფები" : "Set your rates"}
                </p>
              </div>

              <PricingStep
                formData={{
                  basePrice: formData.basePrice,
                  maxPrice: formData.maxPrice,
                  pricingModel: formData.pricingModel,
                }}
                onFormChange={handleFormChange}
                validation={{
                  pricing: validation.pricing,
                }}
              />
            </div>
          )}

          {/* STEP 4: Service Areas */}
          {currentStep === 'areas' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "მომსახურების ზონები" : "Service Areas"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "სად მუშაობ?" : "Where do you work?"}
                </p>
              </div>

              <ServiceAreasStep
                formData={{
                  serviceAreas: formData.serviceAreas,
                  nationwide: formData.nationwide,
                }}
                locationData={locationData}
                onFormChange={handleFormChange}
                validation={{
                  serviceAreas: validation.serviceAreas,
                }}
              />
            </div>
          )}

          {/* STEP 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "გადახედვა" : "Review"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "გადახედე შენს პროფილს" : "Review your profile"}
                </p>
              </div>

              <ReviewStep
                formData={formData}
                selectedCategories={selectedCategories}
                selectedSubcategories={selectedSubcategories}
                avatarPreview={avatarPreview}
                locationData={locationData}
                onEditStep={(stepIndex) => goToStep(STEPS[stepIndex].id)}
                isEditMode={isEditMode}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer with navigation - matches register page */}
      <footer className="sticky bottom-0 bg-white border-t border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {getCurrentStepIndex() > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {locale === "ka" ? "უკან" : "Back"}
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={isLoading || !canProceedToNextStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{locale === "ka" ? "..." : "..."}</span>
                </>
              ) : currentStep === 'review' ? (
                <>
                  <span>
                    {isEditMode
                      ? (locale === "ka" ? "შენახვა" : "Save")
                      : (locale === "ka" ? "დასრულება" : "Complete")
                    }
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>{locale === "ka" ? "გაგრძელება" : "Continue"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ProProfileSetupPage() {
  return (
    <AuthGuard>
      <ProProfileSetupPageContent />
    </AuthGuard>
  );
}

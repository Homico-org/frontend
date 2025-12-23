'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import ProfileSetupStepper, { StepConfig } from '@/components/pro/ProfileSetupStepper';
import AboutStep from '@/components/pro/steps/AboutStep';
import CategoriesStep from '@/components/pro/steps/CategoriesStep';
import PricingStep from '@/components/pro/steps/PricingStep';
import ServiceAreasStep from '@/components/pro/steps/ServiceAreasStep';
import ReviewStep from '@/components/pro/steps/ReviewStep';
import { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useMemo } from 'react';

function ProProfileSetupPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { locale } = useLanguage();
  const { categories: allCategories, getCategoryByKey } = useCategories();

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

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
    bio: !!formData.bio.trim(),
    experience: !!formData.yearsExperience,
    categories: selectedCategories.length > 0,
    subcategories: selectedSubcategories.length > 0,
    pricing: !!formData.basePrice,
    serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
  }), [formData.bio, formData.yearsExperience, formData.basePrice, formData.nationwide, formData.serviceAreas, selectedCategories.length, selectedSubcategories.length]);

  const isFormValid = validation.bio && validation.experience && validation.categories && validation.subcategories && validation.pricing && validation.serviceAreas;

  // Step configuration
  const steps: StepConfig[] = useMemo(() => [
    {
      id: 'about',
      title: 'About You',
      titleKa: 'შენს შესახებ',
      description: 'Basic profile information',
      descriptionKa: 'ძირითადი ინფორმაცია',
      isComplete: validation.bio && validation.experience,
    },
    {
      id: 'categories',
      title: 'Services',
      titleKa: 'სერვისები',
      description: 'What services you offer',
      descriptionKa: 'რა სერვისებს სთავაზობ',
      isComplete: validation.categories && validation.subcategories,
    },
    {
      id: 'pricing',
      title: 'Pricing',
      titleKa: 'ფასები',
      description: 'Set your rates',
      descriptionKa: 'განსაზღვრე ფასები',
      isComplete: validation.pricing,
    },
    {
      id: 'areas',
      title: 'Service Areas',
      titleKa: 'ზონები',
      description: 'Where you work',
      descriptionKa: 'სად მუშაობ',
      isComplete: validation.serviceAreas,
    },
    {
      id: 'review',
      title: 'Review',
      titleKa: 'გადახედვა',
      description: 'Review and submit',
      descriptionKa: 'გადახედე და გამოაქვეყნე',
      isComplete: false,
    },
  ], [validation]);

  // Handlers
  // Legacy handler (kept for compatibility)
  const handleAvatarChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // This is now handled internally by AboutStep with cropper
  };

  // Handler for cropped avatar from AboutStep
  const handleAvatarCropped = (croppedDataUrl: string) => {
    setAvatarPreview(croppedDataUrl);
    setFormData(prev => ({ ...prev, avatar: croppedDataUrl }));
  };

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepChange = (step: number) => {
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
      case 0: return validation.bio && validation.experience;
      case 1: return validation.categories && validation.subcategories;
      case 2: return validation.pricing;
      case 3: return validation.serviceAreas;
      case 4: return isFormValid;
      default: return false;
    }
  }, [currentStep, validation, isFormValid]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[rgba(210,105,30,0.2)] border-t-[#E07B4F] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-primary)]">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      {/* Stepper Header */}
      <ProfileSetupStepper
        steps={steps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        canProceed={canProceedToNextStep}
        isLastStep={currentStep === steps.length - 1}
        isEditMode={isEditMode}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-8 pb-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 0 && (
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
                bio: validation.bio,
                experience: validation.experience,
              }}
            />
          )}

          {currentStep === 1 && (
            <CategoriesStep
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
              onCategoriesChange={setSelectedCategories}
              onSubcategoriesChange={setSelectedSubcategories}
            />
          )}

          {currentStep === 2 && (
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
          )}

          {currentStep === 3 && (
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
          )}

          {currentStep === 4 && (
            <ReviewStep
              formData={formData}
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
              avatarPreview={avatarPreview}
              locationData={locationData}
              onEditStep={handleStepChange}
              isEditMode={isEditMode}
            />
          )}
        </div>
      </main>
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

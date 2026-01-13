'use client';

import AuthGuard from '@/components/common/AuthGuard';
import AboutStep from '@/components/pro/steps/AboutStep';
import PricingAreasStep from '@/components/pro/steps/PricingAreasStep';
import ProjectsStep, { PortfolioProject } from '@/components/pro/steps/ProjectsStep';
import ReviewStep from '@/components/pro/steps/ReviewStep';
import StepSelectServices, { ExperienceLevel, SelectedService } from '@/components/register/steps/StepSelectServices';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

// Raw portfolio project from API (may have _id and imageUrl)
// API response types for before/after pairs
interface ApiBeforeAfterPair {
  before?: string;
  after?: string;
  beforeImage?: string;
  afterImage?: string;
}

// API response type for selected service
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

type ProfileSetupStep = 'about' | 'categories' | 'pricing-areas' | 'projects' | 'review';

const STEPS: { id: ProfileSetupStep; title: { en: string; ka: string } }[] = [
  { id: 'about', title: { en: 'About You', ka: 'შენს შესახებ' } },
  { id: 'categories', title: { en: 'Services', ka: 'სერვისები' } },
  { id: 'pricing-areas', title: { en: 'Pricing & Areas', ka: 'ფასები და ზონები' } },
  { id: 'projects', title: { en: 'Portfolio', ka: 'პორტფოლიო' } },
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
  const { t, locale } = useLanguage();
  const { categories: allCategories, getCategoryByKey } = useCategories();

  // Step state
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>('about');

  // Form state - use SelectedService[] to match new registration flow
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [customServices, setCustomServices] = useState<string[]>([]);
  
  // Derived categories and subcategories from selectedServices
  const selectedCategories = useMemo(() => 
    [...new Set(selectedServices.map(s => s.categoryKey))],
    [selectedServices]
  );
  const selectedSubcategories = useMemo(() => 
    selectedServices.map(s => s.key),
    [selectedServices]
  );

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
    pricingModel: '' as 'hourly' | 'daily' | 'sqm' | 'project_based' | 'from' | '',
    serviceAreas: [] as string[],
    nationwide: false,
    // Social media
    whatsapp: '',
    telegram: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    website: '',
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
    nationwideKa?: string;
    nationwideEn?: string;
    regions: Record<string, string[]>;
    cityMapping?: Record<string, string>;
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

      // Helper to convert subcategories to SelectedService format
      const convertToSelectedServices = (subcategoryKeys: string[], defaultExperience: ExperienceLevel = '3-5'): SelectedService[] => {
        const services: SelectedService[] = [];
        
        subcategoryKeys.forEach(subKey => {
          // Find the subcategory in categories
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
              // Check children
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
      };
      
      // Helper to map yearsExperience number to ExperienceLevel
      const yearsToExperienceLevel = (years: number): ExperienceLevel => {
        if (years >= 10) return '10+';
        if (years >= 5) return '5-10';
        if (years >= 3) return '3-5';
        return '1-2';
      };

      // First check sessionStorage for new registration data
      const storedData = sessionStorage.getItem('proRegistrationData');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          const subcategories = parsed.subcategories || [];
          const yearsExp = parsed.yearsExperience || 3;
          const expLevel = yearsToExperienceLevel(yearsExp);
          
          // Convert to new SelectedService format
          if (allCategories.length > 0 && subcategories.length > 0) {
            const services = convertToSelectedServices(subcategories, expLevel);
            setSelectedServices(services);
          }
          
          if (parsed.customServices && Array.isArray(parsed.customServices)) {
            setCustomServices(parsed.customServices);
          }
          if (parsed.pinterestLinks?.[0]) {
            setFormData(prev => ({ ...prev, portfolioUrl: parsed.pinterestLinks[0] }));
          }
          if (parsed.cadastralId) {
            setFormData(prev => ({ ...prev, cadastralId: parsed.cadastralId }));
          }
          if (parsed.portfolioProjects && Array.isArray(parsed.portfolioProjects)) {
            const cleanedProjects = parsed.portfolioProjects.map((p: RawPortfolioProject, idx: number) => ({
              id: p.id || `project-${Date.now()}-${idx}`,
              title: p.title || '',
              description: p.description || '',
              images: p.images || [],
              videos: p.videos || [],
              location: p.location,
              // Convert from API format { before, after } to frontend format { beforeImage, afterImage }
              beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                id: `pair-${Date.now()}-${pairIdx}`,
                beforeImage: pair.before || pair.beforeImage || '',
                afterImage: pair.after || pair.afterImage || '',
              })),
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

          // Load selectedServices - prefer profile.selectedServices if available
          if (profile.selectedServices && profile.selectedServices.length > 0) {
            // Use the stored selectedServices with per-service experience
            const loadedServices: SelectedService[] = profile.selectedServices.map((s: ApiSelectedService) => ({
              key: s.key,
              categoryKey: s.categoryKey,
              name: s.name,
              nameKa: s.nameKa,
              experience: (s.experience || '3-5') as ExperienceLevel,
            }));
            setSelectedServices(loadedServices);
          } else {
            // Fall back to converting subcategories to SelectedService format
            let subcategories = profile.subcategories || [];
            
            // If profile has no subcategories, use user's selectedSubcategories from registration
            if (subcategories.length === 0 && user?.selectedSubcategories && user.selectedSubcategories.length > 0) {
              subcategories = user.selectedSubcategories;
            }
            
            const yearsExp = profile.yearsExperience || 3;
            const expLevel = yearsToExperienceLevel(yearsExp);
            
            if (allCategories.length > 0 && subcategories.length > 0) {
              const services = convertToSelectedServices(subcategories, expLevel);
              setSelectedServices(services);
            }
          }
          
          if (profile.customServices && Array.isArray(profile.customServices)) {
            setCustomServices(profile.customServices);
          }

          setFormData(prev => ({
            ...prev,
            title: profile.title || '',
            bio: profile.description || profile.bio || '',
            avatar: profile.avatar || user?.avatar || '',
            portfolioUrl: profile.pinterestLinks?.[0] || '',
            licenseNumber: profile.architectLicenseNumber || '',
            cadastralId: profile.cadastralId || '',
            availability: profile.availability || [],
            basePrice: profile.basePrice?.toString() || '',
            maxPrice: profile.maxPrice?.toString() || '',
            pricingModel: profile.pricingModel || '',
            serviceAreas: (profile.serviceAreas?.includes('Countrywide') || profile.serviceAreas?.includes('საქართველოს მასშტაბით')) ? [] : (profile.serviceAreas || []),
            nationwide: profile.serviceAreas?.includes('Countrywide') || profile.serviceAreas?.includes('საქართველოს მასშტაბით') || false,
            // Social links
            whatsapp: profile.whatsapp || '',
            telegram: profile.telegram || '',
            instagram: profile.instagramUrl || '',
            facebook: profile.facebookUrl || '',
            linkedin: profile.linkedinUrl || '',
            website: profile.websiteUrl || '',
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
            loadedProjects = profile.portfolioProjects.map((p: RawPortfolioProject, idx: number) => ({
              id: p.id || `project-${Date.now()}-${idx}`,
              title: p.title || '',
              description: p.description || '',
              images: p.images || [],
              videos: p.videos || [],
              location: p.location || '',
              // Convert from API format { before, after } to frontend format { beforeImage, afterImage }
              beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                id: `pair-${Date.now()}-${pairIdx}`,
                beforeImage: pair.before || pair.beforeImage || '',
                afterImage: pair.after || pair.afterImage || '',
              })),
            }));
          }

          try {
            const portfolioRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/portfolio/pro/${profile._id}`);
            if (portfolioRes.ok) {
              const portfolioData = await portfolioRes.json();
              if (portfolioData && portfolioData.length > 0) {
                const fetchedProjects = portfolioData.map((p: RawPortfolioProject, idx: number) => ({
                  id: p.id || p._id || `portfolio-${Date.now()}-${idx}`,
                  title: p.title || '',
                  description: p.description || '',
                  images: p.images || [p.imageUrl].filter(Boolean),
                  videos: p.videos || [],
                  location: p.location || '',
                  // Convert from API format { before, after } to frontend format { beforeImage, afterImage }
                  beforeAfterPairs: (p.beforeAfter || p.beforeAfterPairs || []).map((pair: ApiBeforeAfterPair, pairIdx: number) => ({
                    id: `pair-${Date.now()}-${pairIdx}`,
                    beforeImage: pair.before || pair.beforeImage || '',
                    afterImage: pair.after || pair.afterImage || '',
                  })),
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
          // No existing profile - check if user has subcategories from registration
          if (user?.selectedSubcategories && user.selectedSubcategories.length > 0 && allCategories.length > 0) {
            const services = convertToSelectedServices(user.selectedSubcategories, '3-5');
            setSelectedServices(services);
          }
        }
      } catch (err) {
        console.error('Failed to fetch existing profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    // Only fetch when categories are loaded
    if (allCategories.length > 0) {
      fetchExistingProfile();
    }
  }, [user, allCategories]);

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
          `${process.env.NEXT_PUBLIC_API_URL}/users/pros/locations?country=${encodeURIComponent(detectedCountry)}&locale=${locale}`
        );
        const data = await response.json();
        setLocationData(data);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      }
    };
    fetchLocationData();
  }, [locale]);

  // Translate saved serviceAreas to current locale when locationData is available
  const hasTranslatedServiceAreas = useRef(false);
  useEffect(() => {
    if (locationData?.cityMapping && formData.serviceAreas.length > 0 && !hasTranslatedServiceAreas.current) {
      hasTranslatedServiceAreas.current = true;
      const translatedAreas = formData.serviceAreas.map(area => {
        // Try to translate using cityMapping
        return locationData.cityMapping?.[area] || area;
      }).filter((area, index, self) => self.indexOf(area) === index); // Remove duplicates

      if (translatedAreas.join(',') !== formData.serviceAreas.join(',')) {
        setFormData(prev => ({ ...prev, serviceAreas: translatedAreas }));
      }
    }
    // Also check for nationwide values in different locales
    if (locationData && formData.serviceAreas.length === 0 && !formData.nationwide) {
      // Check if saved areas contain countrywide in any locale
      const savedAreas = formData.serviceAreas;
      if (savedAreas.includes('Countrywide') || savedAreas.includes('საქართველოს მასშტაბით') ||
          savedAreas.includes(locationData.nationwideKa || '') || savedAreas.includes(locationData.nationwideEn || '')) {
        setFormData(prev => ({ ...prev, nationwide: true, serviceAreas: [] }));
      }
    }
  }, [locationData, formData.serviceAreas, formData.nationwide]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'pro')) {
      router.push('/browse');
    }
  }, [user, authLoading, router]);

  // Calculate max experience from selectedServices for API compatibility
  const maxExperienceYears = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    const experienceMap: Record<ExperienceLevel, number> = {
      '1-2': 2,
      '3-5': 5,
      '5-10': 10,
      '10+': 15,
    };
    return Math.max(...selectedServices.map(s => experienceMap[s.experience] || 0));
  }, [selectedServices]);

  // Validation
  const validation = useMemo(() => ({
    avatar: !!avatarPreview && avatarPreview.length > 0,
    bio: formData.bio.trim().length >= 50, // Minimum 50 characters required
    experience: selectedServices.length > 0, // Experience is now tied to services
    categories: selectedCategories.length > 0,
    subcategories: selectedSubcategories.length > 0,
    pricing: !!formData.basePrice,
    serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
  }), [avatarPreview, formData.bio, formData.basePrice, formData.nationwide, formData.serviceAreas, selectedCategories.length, selectedSubcategories.length, selectedServices.length]);

  const isFormValid = validation.avatar && validation.bio && validation.categories && validation.subcategories && validation.pricing && validation.serviceAreas;

  // Handlers
  const handleAvatarChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // This is now handled internally by AboutStep with cropper
  };

  const handleAvatarCropped = (croppedDataUrl: string) => {
    setAvatarPreview(croppedDataUrl);
    setFormData(prev => ({ ...prev, avatar: croppedDataUrl }));
    // Update AuthContext immediately so avatar reflects everywhere (header, etc.)
    updateUser({ avatar: croppedDataUrl });
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

      // Transform beforeAfterPairs to the API format
      const cleanedPortfolioProjects = portfolioProjects.map(p => ({
        title: p.title,
        description: p.description,
        images: p.images,
        videos: p.videos || [],
        location: p.location,
        // Keep { beforeImage, afterImage } format as expected by the backend DTO
        beforeAfterPairs: (p.beforeAfterPairs || []).map(pair => ({
          beforeImage: pair.beforeImage,
          afterImage: pair.afterImage,
        })),
      }));

      const requestBody: Record<string, any> = {
        profileType: 'personal',
        title: formData.title || (locale === 'ka' ? categoryInfo.nameKa : categoryInfo.name),
        bio: formData.bio,
        description: formData.bio,
        categories: selectedCategories.length > 0 ? selectedCategories : ['interior-design'],
        subcategories: selectedSubcategories.length > 0 ? selectedSubcategories : (user?.selectedSubcategories || []),
        // Send selectedServices with per-service experience levels
        selectedServices: selectedServices.map(s => ({
          key: s.key,
          categoryKey: s.categoryKey,
          name: s.name,
          nameKa: s.nameKa,
          experience: s.experience,
        })),
        customServices: customServices.length > 0 ? customServices : undefined,
        yearsExperience: maxExperienceYears,
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
        // Social links
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
        instagramUrl: formData.instagram || undefined,
        facebookUrl: formData.facebook || undefined,
        linkedinUrl: formData.linkedin || undefined,
        websiteUrl: formData.website || undefined,
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

      // Navigate to the professional's profile page
      const userId = data.id || data._id || user?.id;
      if (userId) {
        router.push(`/professionals/${userId}`);
      } else {
        router.push('/browse/professionals');
      }
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || (isEditMode ? 'Failed to update profile' : 'Failed to create profile'));
    } finally {
      setIsLoading(false);
    }
  };

  // Can proceed to next step validation
  const canProceedToNextStep = useMemo(() => {
    switch (currentStep) {
      case 'about': return validation.avatar && validation.bio;
      case 'categories': return selectedServices.length > 0;
      case 'pricing-areas': return validation.pricing && validation.serviceAreas;
      case 'projects': return true; // Projects are optional, can always proceed
      case 'review': return isFormValid;
      default: return false;
    }
  }, [currentStep, validation, isFormValid, selectedServices.length]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-neutral-950">
        <LoadingSpinner size="xl" variant="border" color="#C4735B" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-neutral-950 flex flex-col pb-24 sm:pb-20">
      {/* Header with progress - matches register page */}
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-12 flex items-center justify-between">
            <Logo />
            <Link href="/help" className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              {t('common.help')}
            </Link>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {locale === "ka" ? `${getCurrentStepIndex() + 1}/${STEPS.length}` : `STEP ${getCurrentStepIndex() + 1}/${STEPS.length}`}
              </span>
              <span className="text-[10px] sm:text-[10px] font-medium text-[#C4735B]">
                {STEPS[getCurrentStepIndex()].title[locale === 'ka' ? 'ka' : 'en']}
              </span>
            </div>
            <Progress value={getProgressPercentage()} size="sm" indicatorVariant="gradient" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-3 sm:py-4 lg:py-6">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">
          {error && (
            <Alert variant="error" size="sm" className="mb-4">
              {error}
            </Alert>
          )}

          {/* STEP 1: About */}
          {currentStep === 'about' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                  {t('becomePro.aboutYou')}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('becomePro.fillInYourBasicInformation')}
                </p>
              </div>

              <AboutStep
                formData={{
                  bio: formData.bio,
                  yearsExperience: '', // Experience is now per-service in the Services step
                  avatar: formData.avatar,
                  whatsapp: formData.whatsapp,
                  telegram: formData.telegram,
                  instagram: formData.instagram,
                  facebook: formData.facebook,
                  linkedin: formData.linkedin,
                  website: formData.website,
                }}
                avatarPreview={avatarPreview}
                onFormChange={handleFormChange}
                onAvatarChange={handleAvatarChange}
                onAvatarCropped={handleAvatarCropped}
                validation={{
                  avatar: validation.avatar,
                  bio: validation.bio,
                  experience: true, // Always valid - experience is set per service
                }}
                hideExperience // Hide the experience field
              />
            </div>
          )}

          {/* STEP 2: Services with per-service experience */}
          {currentStep === 'categories' && (
            <div className="space-y-4">
              <StepSelectServices
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
              />
            </div>
          )}

          {/* STEP 3: Pricing & Service Areas (Combined) */}
          {currentStep === 'pricing-areas' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                  {t('becomePro.pricingAreas')}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('becomePro.setYourRatesAndWork')}
                </p>
              </div>

              <PricingAreasStep
                formData={{
                  priceRange: {
                    min: parseInt(formData.basePrice) || 0,
                    max: parseInt(formData.maxPrice) || 0,
                  },
                  priceType: (
                    formData.pricingModel === 'hourly' ? 'hourly' :
                    formData.pricingModel === 'project_based' ? 'project' :
                    'fixed' // Default to fixed (covers 'from', 'sqm', 'daily', etc.)
                  ) as 'hourly' | 'fixed' | 'project',
                  serviceAreas: formData.serviceAreas,
                  nationwide: formData.nationwide,
                }}
                locationData={locationData}
                onFormChange={(updates) => {
                  if ('priceRange' in updates && updates.priceRange) {
                    handleFormChange({
                      basePrice: updates.priceRange.min.toString(),
                      maxPrice: updates.priceRange.max.toString(),
                    });
                  }
                  if ('priceType' in updates && updates.priceType) {
                    const typeMap: Record<string, typeof formData.pricingModel> = {
                      'hourly': 'hourly',  // By agreement
                      'fixed': 'from',     // Fixed price (from X amount)
                      'project': 'project_based',  // Per project (range)
                    };
                    handleFormChange({ pricingModel: typeMap[updates.priceType] || 'from' });
                  }
                  if ('serviceAreas' in updates) {
                    handleFormChange({ serviceAreas: updates.serviceAreas });
                  }
                  if ('nationwide' in updates) {
                    handleFormChange({ nationwide: updates.nationwide });
                  }
                }}
              />
            </div>
          )}

          {/* STEP 4: Projects */}
          {currentStep === 'projects' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                  {t('becomePro.portfolio')}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('becomePro.showcaseYourWork')}
                </p>
              </div>

              <ProjectsStep
                projects={portfolioProjects}
                onChange={setPortfolioProjects}
                maxProjects={20}
                maxVisibleInBrowse={6}
              />
            </div>
          )}

          {/* STEP 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                  {t('becomePro.review')}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('becomePro.reviewYourProfile')}
                </p>
              </div>

              <ReviewStep
                formData={{
                  ...formData,
                  yearsExperience: maxExperienceYears.toString(), // Derived from services
                }}
                selectedCategories={selectedCategories}
                selectedSubcategories={selectedSubcategories}
                customServices={customServices}
                avatarPreview={avatarPreview}
                locationData={locationData}
                onEditStep={(stepIndex) => {
                  // Map old step indices to new step ids
                  const stepMap: ProfileSetupStep[] = ['about', 'categories', 'pricing-areas', 'projects', 'review'];
                  goToStep(stepMap[stepIndex] || 'about');
                }}
                isEditMode={isEditMode}
                portfolioProjects={portfolioProjects}
                selectedServices={selectedServices}
              />
            </div>
          )}
        </div>
      </main>

      {/* Fixed Footer with navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 shadow-lg shadow-black/5 z-50 safe-area-bottom">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            {getCurrentStepIndex() > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{t('common.back')}</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={isLoading || !canProceedToNextStep}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-xl bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-[#C4735B]/25 disabled:shadow-none active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>{t('becomePro.text')}</span>
                </>
              ) : currentStep === 'review' ? (
                <>
                  <span>
                    {isEditMode
                      ? (t('common.save'))
                      : (t('becomePro.complete'))
                    }
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>{t('common.continue')}</span>
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

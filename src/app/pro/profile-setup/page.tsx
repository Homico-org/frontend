'use client';

import { CATEGORIES, getCategoryByKey } from '@/constants/categories';
import Header from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import PortfolioProjectsInput, { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Availability options
const availabilityOptions = [
  { key: 'weekdays', name: 'Weekdays', nameKa: 'სამუშაო დღეები' },
  { key: 'weekends', name: 'Weekends', nameKa: 'შაბათ-კვირა' },
  { key: 'evenings', name: 'Evenings', nameKa: 'საღამოობით' },
  { key: 'emergency', name: 'Emergency Calls', nameKa: 'გადაუდებელი გამოძახება' },
];

export default function ProProfileSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
      // Mark as initialized even if no avatar found
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch existing profile data if user is a pro (only once)
  useEffect(() => {
    const fetchExistingProfile = async () => {
      // Skip if already fetched or not a pro user
      if (hasFetchedProfile.current) {
        return;
      }

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
          // Support both old single category and new multiple categories format
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/my-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setExistingProfileId(profile._id);
          setIsEditMode(true);

          // Prefill form data
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

          // Set avatar preview - prefer data URLs (locally uploaded) over http URLs
          // Priority: initialRef (data URL) > user context (data URL) > profile avatar > user avatar
          let avatarUrl: string | null = null;

          // First check if we have a data URL from initial load - these are most reliable
          if (initialAvatarRef.current && initialAvatarRef.current.startsWith('data:')) {
            avatarUrl = initialAvatarRef.current;
          }
          // Check user context for data URL
          else if (user?.avatar && user.avatar.startsWith('data:')) {
            avatarUrl = user.avatar;
          }
          // Check localStorage for data URL
          else {
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

          // If no data URL found, fall back to profile/user avatar URLs
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

          // Load portfolio projects from profile or fetch from portfolio endpoint
          let loadedProjects: PortfolioProject[] = [];

          // First check if profile has embedded portfolioProjects
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

          // Also fetch from portfolio endpoint
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
                // Merge with embedded projects, avoiding duplicates by title
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
          // No existing profile - check user categories
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

  // Load user avatar only if not already initialized from localStorage
  // This runs only once when profileLoading becomes false and there's no avatar yet
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
  }, [user?.avatar, avatarPreview, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
          `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/locations?country=${encodeURIComponent(detectedCountry)}`
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

  // Get the primary category (first selected) for display purposes
  const primaryCategory = selectedCategories[0] || 'interior-design';

  const getCategoryInfo = () => {
    return getCategoryByKey(primaryCategory) || CATEGORIES[0];
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(locale === 'ka' ? 'სურათი უნდა იყოს 2MB-ზე ნაკლები' : 'Image must be less than 2MB');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setFormData(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAvailability = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const toggleServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area]
    }));
  };

  // Validation state
  const validation = {
    bio: !!formData.bio.trim(),
    experience: !!formData.yearsExperience,
    pricing: !!formData.basePrice,
    serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
  };

  const isFormValid = validation.bio && validation.experience && validation.pricing && validation.serviceAreas;

  // Progress calculation
  const completedFields = Object.values(validation).filter(Boolean).length;
  const totalFields = Object.keys(validation).length;
  const progressPercentage = (completedFields / totalFields) * 100;

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const categoryInfo = getCategoryInfo();

      // Use user-selected pricing model, or fallback to category default
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

      // Use PATCH for update, POST for create
      const url = isEditMode && existingProfileId
        ? `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/${existingProfileId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles`;

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

      router.push('/browse');
    } catch (err: any) {
      setError(err.message || (isEditMode ? 'Failed to update profile' : 'Failed to create profile'));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="pro-setup-page-premium flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[rgba(210,105,30,0.2)] border-t-[#E07B4F] animate-spin" />
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();

  // Helper to get step number based on category
  // Section order: 1. About, 2. Categories, 3. Availability/Credentials (conditional), 4. Pricing, 5. Portfolio, 6. Areas
  const getStepNumber = (section: 'about' | 'categories' | 'styles' | 'pricing' | 'portfolio' | 'areas') => {
    const hasAvailabilitySection = selectedCategories.includes('home-care');
    const hasCredentialsSection = selectedCategories.includes('architecture');

    switch (section) {
      case 'about': return 1;
      case 'categories': return 2;
      case 'styles': return 3; // Only shows for home-care or architecture
      case 'pricing':
        if (hasAvailabilitySection || hasCredentialsSection) return 4;
        return 3;
      case 'portfolio':
        if (hasAvailabilitySection || hasCredentialsSection) return 5;
        return 4;
      case 'areas':
        if (hasAvailabilitySection || hasCredentialsSection) return 6;
        return 5;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-base)]">
      {/* Background - same as browse page */}
      <AppBackground />

      {/* Header - same as browse page */}
      <Header />

      <main className={`relative z-10 pt-20 pb-28 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="container-custom pt-4 md:pt-8">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <section className="mb-10">
              <div className="pro-setup-badge">
                <span className="pro-setup-badge-dot" />
                <span className="pro-setup-badge-text">
                  {isEditMode
                    ? (locale === 'ka' ? 'პროფილის რედაქტირება' : 'Edit Profile')
                    : (locale === 'ka' ? 'პროფილის შექმნა' : 'Profile Setup')
                  }
                </span>
              </div>

              <h1 className="pro-setup-title">
                {isEditMode ? (
                  locale === 'ka' ? (
                    <>განაახლე შენი <span className="pro-setup-title-accent">პროფილი</span></>
                  ) : (
                    <>Update Your <span className="pro-setup-title-accent">Profile</span></>
                  )
                ) : (
                  locale === 'ka' ? (
                    <>დაასრულე შენი <span className="pro-setup-title-accent">პროფილი</span></>
                  ) : (
                    <>Create Your <span className="pro-setup-title-accent">Profile</span></>
                  )
                )}
              </h1>

              <p className="text-base md:text-lg text-[#8B7355] dark:text-[#A89080] max-w-xl leading-relaxed">
                {isEditMode
                  ? (locale === 'ka'
                      ? 'განაახლე შენი ინფორმაცია რომ კლიენტებმა ნახონ უახლესი მონაცემები.'
                      : 'Update your information so clients see the latest details.')
                  : (locale === 'ka'
                      ? 'შეავსე პროფილი რომ კლიენტებმა გიპოვონ და დაგიკავშირდნენ.'
                      : 'Complete your profile so clients can find and contact you.')
                }
              </p>
            </section>

            {/* Main Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section 1: Basic Profile */}
              <section className={`pro-setup-section ${validation.bio && validation.experience ? 'completed' : ''}`}>
                <div className="pro-setup-section-header">
                  <div className={`pro-setup-step-number ${validation.bio && validation.experience ? 'completed' : 'active'}`}>
                    {validation.bio && validation.experience ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <span>1</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
                      </h2>
                      {(!validation.bio || !validation.experience) && (
                        <span className="pro-setup-required-badge">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="pro-setup-section-subtitle">
                      {locale === 'ka' ? 'პროფილის ძირითადი ინფორმაცია' : 'Basic profile information'}
                    </p>
                  </div>
                </div>

                {/* Avatar */}
                {!avatarPreview ? (
                  <div
                    className="pro-setup-avatar-upload mb-6"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <div className="pro-setup-avatar-preview">
                      <svg className="w-8 h-8 pro-setup-avatar-preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <button type="button" className="pro-setup-avatar-add-btn">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="pro-setup-avatar-info">
                      <h4>{locale === 'ka' ? 'პროფილის სურათი' : 'Profile Photo'}</h4>
                      <p>{locale === 'ka' ? 'PNG, JPG მაქს. 2MB' : 'PNG, JPG up to 2MB'}</p>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="pro-setup-avatar-existing mb-6">
                    <img src={avatarPreview} alt="" className="pro-setup-avatar-existing-img" />
                    <div className="pro-setup-avatar-existing-info">
                      <h4>{locale === 'ka' ? 'პროფილის სურათი' : 'Profile Photo'}</h4>
                      <span className="pro-setup-avatar-existing-badge">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {locale === 'ka' ? 'ატვირთულია რეგისტრაციისას' : 'Uploaded during registration'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Years Experience */}
                <div className="pro-setup-input-group">
                  <label className="pro-setup-label">
                    <span>{locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}</span>
                    <span className={`pro-setup-label-check ${validation.experience ? 'completed' : 'pending'}`}>
                      {validation.experience && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    className={`pro-setup-input-premium ${validation.experience ? 'valid' : ''}`}
                    placeholder="0"
                  />
                </div>

                {/* Bio */}
                <div className="pro-setup-input-group">
                  <label className="pro-setup-label">
                    <span>{locale === 'ka' ? 'შენს შესახებ' : 'About You'}</span>
                    <span className={`pro-setup-label-check ${validation.bio ? 'completed' : 'pending'}`}>
                      {validation.bio && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className={`pro-setup-textarea-premium ${validation.bio ? 'valid' : ''}`}
                    placeholder={locale === 'ka' ? 'მოკლედ აღწერე შენი გამოცდილება და უნარები...' : 'Briefly describe your experience and skills...'}
                  />
                </div>
              </section>

              {/* Section: Categories & Services */}
              <section className={`pro-setup-section ${selectedCategories.length > 0 && selectedSubcategories.length > 0 ? 'completed' : ''}`}>
                <div className="pro-setup-section-header">
                  <div className={`pro-setup-step-number ${selectedCategories.length > 0 && selectedSubcategories.length > 0 ? 'completed' : validation.bio && validation.experience ? 'active' : ''}`}>
                    {selectedCategories.length > 0 && selectedSubcategories.length > 0 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <span>2</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'კატეგორიები და სერვისები' : 'Categories & Services'}
                      </h2>
                      {(selectedCategories.length === 0 || selectedSubcategories.length === 0) && (
                        <span className="pro-setup-required-badge">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="pro-setup-section-subtitle">
                      {locale === 'ka' ? 'აირჩიე რა ტიპის სერვისებს სთავაზობ კლიენტებს (მაქს. 4 კატეგორია)' : 'Select what type of services you offer to clients (max 4 categories)'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <CategorySubcategorySelector
                    selectedCategories={selectedCategories}
                    selectedSubcategories={selectedSubcategories}
                    onCategoriesChange={setSelectedCategories}
                    onSubcategoriesChange={setSelectedSubcategories}
                    singleCategoryMode={false}
                    maxCategories={4}
                    maxSubcategories={10}
                  />
                </div>
              </section>

              {/* Section: Availability (for home-care) */}
              {selectedCategories.includes('home-care') && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number active">
                      <span>{getStepNumber('styles')}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'ხელმისაწვდომობა' : 'Availability'}
                      </h2>
                      <p className="pro-setup-section-subtitle">
                        {locale === 'ka' ? 'როდის ხარ ხელმისაწვდომი' : 'When are you available'}
                      </p>
                    </div>
                  </div>

                  <div className="pro-setup-pill-container">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => toggleAvailability(option.key)}
                        className={`pro-setup-pill ${formData.availability.includes(option.key) ? 'selected' : ''}`}
                      >
                        <span>
                          {formData.availability.includes(option.key) && (
                            <svg className="pro-setup-pill-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === 'ka' ? option.nameKa : option.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Credentials (for architecture) */}
              {selectedCategories.includes('architecture') && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number">
                      <span>{getStepNumber('styles')}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'კვალიფიკაცია' : 'Credentials'}
                      </h2>
                      <p className="pro-setup-section-subtitle">
                        {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="pro-setup-input-group">
                      <label className="pro-setup-label">
                        {locale === 'ka' ? 'ლიცენზიის ნომერი' : 'License Number'}
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        className="pro-setup-input-premium"
                        placeholder={locale === 'ka' ? 'არქიტექტორის ლიცენზია' : 'Architect License'}
                      />
                    </div>

                    <div className="pro-setup-input-group">
                      <label className="pro-setup-label">
                        {locale === 'ka' ? 'საკადასტრო ID' : 'Cadastral ID'}
                      </label>
                      <input
                        type="text"
                        value={formData.cadastralId}
                        onChange={(e) => setFormData(prev => ({ ...prev, cadastralId: e.target.value }))}
                        className="pro-setup-input-premium"
                        placeholder={locale === 'ka' ? 'საკადასტრო იდენტიფიკატორი' : 'Cadastral Identifier'}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Section: Pricing */}
              <section className={`pro-setup-section ${validation.pricing ? 'completed' : ''}`}>
                <div className="pro-setup-section-header">
                  <div className={`pro-setup-step-number ${validation.pricing ? 'completed' : validation.bio && validation.experience ? 'active' : ''}`}>
                    {validation.pricing ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <span>{getStepNumber('pricing')}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'ფასები' : 'Pricing'}
                      </h2>
                      {validation.bio && validation.experience && !validation.pricing && (
                        <span className="pro-setup-required-badge">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="pro-setup-section-subtitle">
                      {locale === 'ka' ? 'განსაზღვრე შენი ფასების დიაპაზონი' : 'Set your price range'}
                    </p>
                  </div>
                </div>

                {/* Pricing Model Selector */}
                <div className="pro-setup-input-group">
                  <label className="pro-setup-label">
                    <span>{locale === 'ka' ? 'ფასის ტიპი' : 'Pricing Type'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'hourly', label: locale === 'ka' ? 'საათობრივი' : 'Hourly', suffix: '₾/სთ' },
                      { key: 'daily', label: locale === 'ka' ? 'დღიური' : 'Daily', suffix: '₾/დღე' },
                      { key: 'sqm', label: locale === 'ka' ? 'კვ.მ' : 'Per m²', suffix: '₾/m²' },
                      { key: 'project_based', label: locale === 'ka' ? 'პროექტზე' : 'Per Project', suffix: '₾' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, pricingModel: option.key as any }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.pricingModel === option.key
                            ? 'bg-[#E07B4F] text-white'
                            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="pro-setup-input-group mt-4">
                  <label className="pro-setup-label">
                    <span>{locale === 'ka' ? 'ფასის დიაპაზონი' : 'Price Range'}</span>
                    <span className={`pro-setup-label-check ${validation.pricing ? 'completed' : 'pending'}`}>
                      {validation.pricing && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="pro-setup-price-input">
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                          className={`pro-setup-input-premium ${validation.pricing ? 'valid' : ''}`}
                          placeholder={locale === 'ka' ? 'დან' : 'From'}
                        />
                        <span className="pro-setup-price-currency">₾</span>
                      </div>
                    </div>
                    <span className="text-[var(--color-text-tertiary)]">—</span>
                    <div className="flex-1">
                      <div className="pro-setup-price-input">
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          value={formData.maxPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxPrice: e.target.value }))}
                          className="pro-setup-input-premium"
                          placeholder={locale === 'ka' ? 'მდე' : 'To'}
                        />
                        <span className="pro-setup-price-currency">₾</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#8B7355] dark:text-[#A89080] mt-2">
                    {locale === 'ka'
                      ? `კლიენტები დაინახავენ "${formData.basePrice || '...'} - ${formData.maxPrice || '...'} ₾${formData.pricingModel === 'hourly' ? '/სთ' : formData.pricingModel === 'daily' ? '/დღე' : formData.pricingModel === 'sqm' ? '/m²' : ''}"`
                      : `Clients will see "${formData.basePrice || '...'} - ${formData.maxPrice || '...'} ₾${formData.pricingModel === 'hourly' ? '/hr' : formData.pricingModel === 'daily' ? '/day' : formData.pricingModel === 'sqm' ? '/m²' : ''}"`
                    }
                  </p>
                </div>
              </section>

              {/* Section: Portfolio - For architects only */}
              {selectedCategories.includes('architecture') && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number">
                      <span>{getStepNumber('portfolio')}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'}
                      </h2>
                      <p className="pro-setup-section-subtitle">
                        {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                      </p>
                    </div>
                  </div>

                  {/* Show existing portfolio projects */}
                  {portfolioProjects.length > 0 && (
                    <div className="mb-6">
                      <label className="pro-setup-label mb-3">
                        {locale === 'ka' ? 'შენი პროექტები' : 'Your Projects'}
                        <span className="ml-2 text-xs font-normal text-[#8B7355]">
                          ({portfolioProjects.length} {locale === 'ka' ? 'პროექტი' : 'project(s)'})
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {portfolioProjects.flatMap((project, pIdx) =>
                          project.images.slice(0, 1).map((img, iIdx) => (
                            <div key={`${pIdx}-${iIdx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                              <img
                                src={img.startsWith('http') || img.startsWith('data:') ? img : `${process.env.NEXT_PUBLIC_API_URL}${img}`}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-xs font-medium truncate">{project.title}</p>
                                {project.location && (
                                  <p className="text-white/70 text-[10px] truncate">{project.location}</p>
                                )}
                              </div>
                              {project.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/50 px-1.5 py-0.5 rounded text-white text-[10px]">
                                  +{project.images.length - 1}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pro-setup-input-group">
                    <label className="pro-setup-label">
                      {locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="pro-setup-input-premium"
                      placeholder="https://behance.net/yourprofile"
                    />
                    <p className="text-xs text-[#8B7355] dark:text-[#A89080] mt-2">
                      {locale === 'ka' ? 'Behance, Dribbble, Pinterest ან სხვა პლატფორმა' : 'Behance, Dribbble, Pinterest or other platform'}
                    </p>
                  </div>
                </section>
              )}

              {/* Section: Portfolio Projects - For craftsmen and home-care */}
              {(selectedCategories.includes('craftsmen') || selectedCategories.includes('home-care')) && (
                <section className="pro-setup-section">
                  <PortfolioProjectsInput
                    projects={portfolioProjects}
                    onChange={setPortfolioProjects}
                    maxProjects={5}
                  />
                </section>
              )}

              {/* Section: Service Areas */}
              <section className={`pro-setup-section ${validation.serviceAreas ? 'completed' : ''}`}>
                <div className="pro-setup-section-header">
                  <div className={`pro-setup-step-number ${validation.serviceAreas ? 'completed' : validation.pricing ? 'active' : ''}`}>
                    {validation.serviceAreas ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <span>{getStepNumber('areas')}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'მომსახურების ზონები' : 'Service Areas'}
                      </h2>
                      {validation.pricing && !validation.serviceAreas && (
                        <span className="pro-setup-required-badge">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="pro-setup-section-subtitle">
                      {locale === 'ka' ? 'სად მუშაობ' : 'Where you work'}
                    </p>
                  </div>
                </div>

                {/* Nationwide option */}
                {locationData && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        nationwide: !prev.nationwide,
                        serviceAreas: !prev.nationwide ? [] : prev.serviceAreas
                      }));
                    }}
                    className={`pro-setup-nationwide-card w-full mb-4 ${formData.nationwide ? 'selected' : ''}`}
                  >
                    <div className="pro-setup-nationwide-content">
                      <h4 className="pro-setup-nationwide-title">
                        {locationData.nationwide}
                      </h4>
                      <p className="pro-setup-nationwide-subtitle">
                        {locale === 'ka' ? 'მომსახურება მთელი ქვეყნის მასშტაბით' : 'Serve clients across the entire country'}
                      </p>
                    </div>
                    <div className={`pro-setup-radio ${formData.nationwide ? 'selected' : ''}`}>
                      {formData.nationwide && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )}

                {/* Regions */}
                {locationData && !formData.nationwide && (
                  <>
                    <div className="pro-setup-divider-text">
                      {locale === 'ka' ? 'ან აირჩიე ქალაქები' : 'Or select cities'}
                    </div>
                    <div className="pro-setup-regions-scroll">
                      {Object.entries(locationData.regions).map(([regionName, cities]) => (
                        <div key={regionName}>
                          <p className="pro-setup-region-header">
                            {regionName}
                          </p>
                          <div className="pro-setup-city-chips">
                            {cities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => toggleServiceArea(city)}
                                className={`pro-setup-city-chip ${formData.serviceAreas.includes(city) ? 'selected' : ''}`}
                              >
                                {formData.serviceAreas.includes(city) && (
                                  <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {city}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>

              {/* Error */}
              {error && (
                <div className="pro-setup-error">
                  <svg className="w-5 h-5 pro-setup-error-icon flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="pro-setup-error-text">{error}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="pro-setup-footer-premium">
        <div className="pro-setup-footer-content">
          {/* Progress ring */}
          {!isFormValid && (
            <div className="pro-setup-progress-ring">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <defs>
                  <linearGradient id="pro-setup-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E07B4F" />
                    <stop offset="100%" stopColor="#E8956A" />
                  </linearGradient>
                </defs>
                <circle
                  className="pro-setup-progress-bg"
                  cx="22"
                  cy="22"
                  r="18"
                />
                <circle
                  className="pro-setup-progress-fill"
                  cx="22"
                  cy="22"
                  r="18"
                  strokeDasharray={`${(progressPercentage / 100) * 113.1} 113.1`}
                />
              </svg>
              <span className="pro-setup-progress-text">
                {completedFields}/{totalFields}
              </span>
            </div>
          )}

          {/* Later button */}
          <button
            type="button"
            onClick={() => router.push('/browse')}
            className="pro-setup-btn-secondary"
          >
            {locale === 'ka' ? 'მოგვიანებით' : 'Later'}
          </button>

          {/* Submit button */}
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={isLoading || !isFormValid}
            className="pro-setup-btn-primary"
          >
            {isLoading ? (
              <>
                <span className="pro-setup-btn-spinner" />
                <span>{isEditMode
                  ? (locale === 'ka' ? 'ინახება...' : 'Saving...')
                  : (locale === 'ka' ? 'იქმნება...' : 'Creating...')
                }</span>
              </>
            ) : isFormValid ? (
              <>
                <span>{isEditMode
                  ? (locale === 'ka' ? 'ცვლილებების შენახვა' : 'Save Changes')
                  : (locale === 'ka' ? 'პროფილის შექმნა' : 'Create Profile')
                }</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            ) : (
              <span>{locale === 'ka' ? 'შეავსე ველები' : 'Fill required fields'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { CATEGORIES, getCategoryByKey } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface PortfolioProject {
  title: string;
  description: string;
  images: string[];
  location?: string;
  year?: string;
  budget?: string;
}

// Design styles for designers - no icons
const designStyles = [
  { key: 'modern', name: 'Modern', nameKa: 'თანამედროვე' },
  { key: 'minimalist', name: 'Minimalist', nameKa: 'მინიმალისტური' },
  { key: 'classic', name: 'Classic', nameKa: 'კლასიკური' },
  { key: 'scandinavian', name: 'Scandinavian', nameKa: 'სკანდინავიური' },
  { key: 'industrial', name: 'Industrial', nameKa: 'ინდუსტრიული' },
  { key: 'bohemian', name: 'Bohemian', nameKa: 'ბოჰემური' },
  { key: 'contemporary', name: 'Contemporary', nameKa: 'კონტემპორარული' },
  { key: 'mediterranean', name: 'Mediterranean', nameKa: 'ხმელთაშუაზღვური' },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    yearsExperience: '',
    avatar: '',
    designStyles: [] as string[],
    portfolioUrl: '',
    licenseNumber: '',
    cadastralId: '',
    availability: [] as string[],
    basePrice: '',
    serviceAreas: [] as string[],
    nationwide: false,
  });

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<{
    country: string;
    nationwide: string;
    regions: Record<string, string[]>;
    emoji: string;
  } | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Load registration data from sessionStorage or user profile
  useEffect(() => {
    const storedData = sessionStorage.getItem('proRegistrationData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setSelectedCategory(parsed.category || 'interior-design');
        setSelectedSubcategories(parsed.subcategories || []);
        if (parsed.pinterestLinks?.[0]) {
          setFormData(prev => ({ ...prev, portfolioUrl: parsed.pinterestLinks[0] }));
        }
        if (parsed.cadastralId) {
          setFormData(prev => ({ ...prev, cadastralId: parsed.cadastralId }));
        }
        if (parsed.portfolioProjects && Array.isArray(parsed.portfolioProjects)) {
          const cleanedProjects = parsed.portfolioProjects.map((p: any) => ({
            title: p.title || '',
            description: p.description || '',
            images: p.images || [],
            location: p.location,
            year: p.year,
            budget: p.budget,
          }));
          setPortfolioProjects(cleanedProjects);
        }
        // Load avatar from registration
        if (parsed.avatar) {
          const avatarFullUrl = parsed.avatar.startsWith('http')
            ? parsed.avatar
            : `${process.env.NEXT_PUBLIC_API_URL}${parsed.avatar}`;
          setFormData(prev => ({ ...prev, avatar: avatarFullUrl }));
          setAvatarPreview(avatarFullUrl);
        }
        sessionStorage.removeItem('proRegistrationData');
      } catch (err) {
        console.error('Failed to parse registration data:', err);
        setSelectedCategory('interior-design');
      }
    } else if (user?.selectedCategories && user.selectedCategories.length > 0) {
      setSelectedCategory(user.selectedCategories[0]);
    } else {
      setSelectedCategory('interior-design');
    }

    // Only load user avatar if we didn't already get one from sessionStorage
    if (user?.avatar && !avatarPreview) {
      const avatarFullUrl = user.avatar.startsWith('http')
        ? user.avatar
        : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`;
      setFormData(prev => ({ ...prev, avatar: avatarFullUrl }));
      setAvatarPreview(avatarFullUrl);
    }
  }, [user]);

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

  const getCategoryInfo = () => {
    return getCategoryByKey(selectedCategory) || CATEGORIES[0];
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

  const toggleDesignStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      designStyles: prev.designStyles.includes(style)
        ? prev.designStyles.filter(s => s !== style)
        : [...prev.designStyles, style]
    }));
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
    designStyles: selectedCategory !== 'interior-design' || formData.designStyles.length > 0,
    pricing: !!formData.basePrice,
    serviceAreas: formData.nationwide || formData.serviceAreas.length > 0,
  };

  const isFormValid = validation.bio && validation.experience && validation.designStyles && validation.pricing && validation.serviceAreas;

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

      let pricingModel = 'project_based';
      if (selectedCategory === 'interior-design' || selectedCategory === '') {
        pricingModel = 'from';
      } else if (selectedCategory === 'craftsmen' || selectedCategory === 'home-care') {
        pricingModel = 'hourly';
      }

      const cleanedPortfolioProjects = portfolioProjects.map(p => ({
        title: p.title,
        description: p.description,
        images: p.images,
        location: p.location,
        year: p.year,
        budget: p.budget,
      }));

      const requestBody: Record<string, any> = {
        profileType: 'personal',
        title: formData.title || (locale === 'ka' ? categoryInfo.nameKa : categoryInfo.name),
        bio: formData.bio,
        description: formData.bio,
        categories: [selectedCategory || 'interior-design'],
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        avatar: formData.avatar || user?.avatar,
        pricingModel,
        basePrice: parseFloat(formData.basePrice) || undefined,
        serviceAreas: formData.nationwide && locationData ? [locationData.nationwide] : formData.serviceAreas,
        portfolioProjects: cleanedPortfolioProjects,
        pinterestLinks: formData.portfolioUrl ? [formData.portfolioUrl] : undefined,
        architectLicenseNumber: selectedCategory === 'architecture' ? formData.licenseNumber : undefined,
        cadastralId: selectedCategory === 'architecture' ? formData.cadastralId : undefined,
        availability: selectedCategory === 'home-care' ? formData.availability : undefined,
      };

      if (selectedCategory === 'interior-design' && formData.designStyles.length > 0) {
        requestBody.designStyles = formData.designStyles;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create profile');
      }

      router.push('/browse');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="pro-setup-page-premium flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[rgba(210,105,30,0.2)] border-t-[#D2691E] animate-spin" />
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();

  // Helper to get step number based on category
  const getStepNumber = (section: 'about' | 'styles' | 'pricing' | 'portfolio' | 'areas') => {
    const hasStylesSection = selectedCategory === 'interior-design';
    const hasAvailabilitySection = selectedCategory === 'home-care';
    const hasCredentialsSection = selectedCategory === 'architecture';

    switch (section) {
      case 'about': return 1;
      case 'styles': return 2;
      case 'pricing':
        if (hasStylesSection || hasAvailabilitySection || hasCredentialsSection) return 3;
        return 2;
      case 'portfolio':
        if (hasStylesSection || hasAvailabilitySection || hasCredentialsSection) return 4;
        return 3;
      case 'areas':
        if (hasStylesSection || hasAvailabilitySection || hasCredentialsSection) return 5;
        return 4;
      default: return 1;
    }
  };

  return (
    <div className="pro-setup-page-premium overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="pro-setup-orb pro-setup-orb-1" />
        <div className="pro-setup-orb pro-setup-orb-2" />
        <div className="pro-setup-orb pro-setup-orb-3" />
      </div>

      {/* Premium Header */}
      <header className="pro-setup-header-premium">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link href="/browse" className="pro-setup-logo group">
              <span className="pro-setup-logo-text">
                {locale === 'ka' ? 'ჰომიკო' : 'Homico'}
              </span>
              <span className="pro-setup-logo-dot group-hover:scale-125 transition-transform" />
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#8B7355] dark:text-[#A89080] hidden sm:block">
                  {user.name || user.email}
                </span>
                <div className="pro-setup-user-avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-[#D2691E] to-[#B8560E]">
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`relative z-10 pb-28 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="container-custom pt-8 md:pt-12">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <section className="mb-10">
              <div className="pro-setup-badge">
                <span className="pro-setup-badge-dot" />
                <span className="pro-setup-badge-text">
                  {locale === 'ka' ? 'პროფილის შექმნა' : 'Profile Setup'}
                </span>
              </div>

              <h1 className="pro-setup-title">
                {locale === 'ka' ? (
                  <>დაასრულე შენი <span className="pro-setup-title-accent">პროფილი</span></>
                ) : (
                  <>Create Your <span className="pro-setup-title-accent">Profile</span></>
                )}
              </h1>

              <p className="text-base md:text-lg text-[#8B7355] dark:text-[#A89080] max-w-xl leading-relaxed">
                {locale === 'ka'
                  ? 'შეავსე პროფილი რომ კლიენტებმა გიპოვონ და დაგიკავშირდნენ.'
                  : 'Complete your profile so clients can find and contact you.'
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

              {/* Section 2: Design Styles (for interior-design) */}
              {selectedCategory === 'interior-design' && (
                <section className={`pro-setup-section ${validation.designStyles ? 'completed' : ''}`}>
                  <div className="pro-setup-section-header">
                    <div className={`pro-setup-step-number ${validation.designStyles ? 'completed' : validation.bio && validation.experience ? 'active' : ''}`}>
                      {validation.designStyles ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : <span>2</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="pro-setup-section-title">
                          {locale === 'ka' ? 'დიზაინის სტილები' : 'Design Styles'}
                        </h2>
                        {!validation.designStyles && (
                          <span className="pro-setup-required-badge">
                            {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                          </span>
                        )}
                      </div>
                      <p className="pro-setup-section-subtitle">
                        {locale === 'ka' ? 'აირჩიე სტილები რომლებშიც მუშაობ' : 'Select styles you work with'}
                      </p>
                    </div>
                  </div>

                  <div className="pro-setup-pill-container">
                    {designStyles.map((style) => (
                      <button
                        key={style.key}
                        type="button"
                        onClick={() => toggleDesignStyle(style.key)}
                        className={`pro-setup-pill ${formData.designStyles.includes(style.key) ? 'selected' : ''}`}
                      >
                        <span>
                          {formData.designStyles.includes(style.key) && (
                            <svg className="pro-setup-pill-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === 'ka' ? style.nameKa : style.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Availability (for home-care) */}
              {selectedCategory === 'home-care' && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number active">
                      <span>2</span>
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
              {selectedCategory === 'architecture' && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number">
                      <span>2</span>
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
                  <div className={`pro-setup-step-number ${validation.pricing ? 'completed' : validation.designStyles && validation.bio && validation.experience ? 'active' : ''}`}>
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
                      {validation.bio && validation.experience && validation.designStyles && !validation.pricing && (
                        <span className="pro-setup-required-badge">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="pro-setup-section-subtitle">
                      {locale === 'ka' ? 'საწყისი ფასი' : 'Starting price'}
                    </p>
                  </div>
                </div>

                <div className="pro-setup-input-group">
                  <label className="pro-setup-label">
                    <span>
                      {selectedCategory === 'interior-design'
                        ? (locale === 'ka' ? 'ფასი კვ.მ-ზე' : 'Price per m²')
                        : selectedCategory === 'craftsmen' || selectedCategory === 'home-care'
                        ? (locale === 'ka' ? 'საათობრივი ტარიფი' : 'Hourly Rate')
                        : (locale === 'ka' ? 'საბაზისო ფასი' : 'Base Price')
                      }
                    </span>
                    <span className={`pro-setup-label-check ${validation.pricing ? 'completed' : 'pending'}`}>
                      {validation.pricing && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </label>
                  <div className="pro-setup-price-input">
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                      className={`pro-setup-input-premium ${validation.pricing ? 'valid' : ''}`}
                      placeholder={selectedCategory === 'interior-design' ? '50' : '500'}
                    />
                    <span className="pro-setup-price-currency">
                      {selectedCategory === 'interior-design' ? '₾/m²' : selectedCategory === 'craftsmen' || selectedCategory === 'home-care' ? '₾/სთ' : '₾'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8B7355] dark:text-[#A89080] mt-2">
                    {selectedCategory === 'interior-design'
                      ? (locale === 'ka' ? 'კლიენტები დაინახავენ "დან XX ₾/m²"' : 'Clients will see "from XX ₾/m²"')
                      : (locale === 'ka' ? 'საწყისი ფასი' : 'Starting price')
                    }
                  </p>
                </div>
              </section>

              {/* Section: Portfolio - Role-appropriate */}
              {(selectedCategory === 'interior-design' || selectedCategory === 'architecture') && (
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

              {/* Section: Work Photos - For craftsmen and home-care */}
              {(selectedCategory === 'craftsmen' || selectedCategory === 'home-care') && (
                <section className="pro-setup-section">
                  <div className="pro-setup-section-header">
                    <div className="pro-setup-step-number">
                      <span>{getStepNumber('portfolio')}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="pro-setup-section-title">
                        {locale === 'ka' ? 'სამუშაოს ფოტოები' : 'Work Photos'}
                      </h2>
                      <p className="pro-setup-section-subtitle">
                        {locale === 'ka' ? 'არასავალდებულო - აჩვენე შენი ნამუშევრები' : 'Optional - showcase your work'}
                      </p>
                    </div>
                  </div>

                  <div className="pro-setup-input-group">
                    <p className="text-sm text-[#8B7355] dark:text-[#A89080] mb-4">
                      {locale === 'ka'
                        ? 'დაამატე ფოტოები შენი შესრულებული სამუშაოებიდან. კლიენტები დაინახავენ მას შენს პროფილზე.'
                        : 'Add photos from your completed work. Clients will see them on your profile.'}
                    </p>

                    {/* Work photos display */}
                    {portfolioProjects.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {portfolioProjects.flatMap((project, pIdx) =>
                          project.images.map((img, iIdx) => (
                            <div key={`${pIdx}-${iIdx}`} className="relative aspect-square rounded-xl overflow-hidden group">
                              <img
                                src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL}${img}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newProjects = [...portfolioProjects];
                                    newProjects[pIdx].images = newProjects[pIdx].images.filter((_, i) => i !== iIdx);
                                    if (newProjects[pIdx].images.length === 0) {
                                      newProjects.splice(pIdx, 1);
                                    }
                                    setPortfolioProjects(newProjects);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500/90 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[#F5F0EB] dark:bg-[#2A2520] rounded-xl border-2 border-dashed border-[#D2691E]/30">
                        <svg className="w-12 h-12 mx-auto text-[#D2691E]/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-[#8B7355] dark:text-[#A89080]">
                          {locale === 'ka' ? 'ჯერ არ გაქვს ფოტოები დამატებული' : 'No photos added yet'}
                        </p>
                        <p className="text-xs text-[#8B7355]/60 dark:text-[#A89080]/60 mt-1">
                          {locale === 'ka' ? 'შეგიძლია დაამატო პროფილის შექმნის შემდეგ' : 'You can add them after creating your profile'}
                        </p>
                      </div>
                    )}
                  </div>
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
                    <stop offset="0%" stopColor="#D2691E" />
                    <stop offset="100%" stopColor="#CD853F" />
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
                <span>{locale === 'ka' ? 'იქმნება...' : 'Creating...'}</span>
              </>
            ) : isFormValid ? (
              <>
                <span>{locale === 'ka' ? 'პროფილის შექმნა' : 'Create Profile'}</span>
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

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

    if (user?.avatar) {
      setFormData(prev => ({ ...prev, avatar: user.avatar || '' }));
      setAvatarPreview(user.avatar);
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
        avatar: formData.avatar,
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-accent-soft)] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--color-highlight-soft)] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 opacity-40" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 sticky top-0 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border-subtle)]">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link href="/browse" className="group flex items-center gap-2">
              <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                {locale === 'ka' ? 'ჰომიკო' : 'Homico'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] group-hover:scale-125 transition-transform" />
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-secondary)] hidden sm:block">
                  {user.name || user.email}
                </span>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-medium text-sm">
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`relative z-10 pb-24 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="container-custom pt-8 md:pt-12">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <section className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
                  {locale === 'ka' ? 'პროფილის შექმნა' : 'Profile Setup'}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-4">
                {locale === 'ka' ? (
                  <>დაასრულე შენი <span className="text-[var(--color-accent)]">პროფილი</span></>
                ) : (
                  <>Create Your <span className="text-[var(--color-accent)]">Profile</span></>
                )}
              </h1>

              <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl mb-8 leading-relaxed">
                {locale === 'ka'
                  ? 'შეავსე პროფილი რომ კლიენტებმა გიპოვონ და დაგიკავშირდნენ.'
                  : 'Complete your profile so clients can find and contact you.'
                }
              </p>
            </section>

            {/* Main Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section 1: Basic Profile */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.bio && validation.experience
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--color-accent)] text-white'
                  }`}>
                    {validation.bio && validation.experience ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '1'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'შენს შესახებ' : 'About You'}
                      </h2>
                      {(!validation.bio || !validation.experience) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'პროფილის ძირითადი ინფორმაცია' : 'Basic profile information'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--color-border)]" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-tertiary)] border-2 border-dashed border-[var(--color-border)] flex items-center justify-center">
                          <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'პროფილის სურათი' : 'Profile Photo'}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'PNG, JPG მაქს. 2MB' : 'PNG, JPG up to 2MB'}
                      </p>
                    </div>
                  </div>

                  {/* Years Experience */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>{locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}</span>
                      {validation.experience ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                      className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 transition-all ${
                        validation.experience
                          ? 'border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]'
                      }`}
                      placeholder="0"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>{locale === 'ka' ? 'შენს შესახებ' : 'About You'}</span>
                      {validation.bio ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all resize-none ${
                        validation.bio
                          ? 'border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]'
                      }`}
                      placeholder={locale === 'ka' ? 'მოკლედ აღწერე შენი გამოცდილება და უნარები...' : 'Briefly describe your experience and skills...'}
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Design Styles (for interior-design) - Pill/tag style */}
              {selectedCategory === 'interior-design' && (
                <section className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                      validation.designStyles
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[var(--color-accent)] text-white'
                    }`}>
                      {validation.designStyles ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : '2'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                          {locale === 'ka' ? 'დიზაინის სტილები' : 'Design Styles'}
                        </h2>
                        {!validation.designStyles && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'აირჩიე სტილები რომლებშიც მუშაობ' : 'Select styles you work with'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex flex-wrap gap-2">
                      {designStyles.map((style) => (
                        <button
                          key={style.key}
                          type="button"
                          onClick={() => toggleDesignStyle(style.key)}
                          className={`px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                            formData.designStyles.includes(style.key)
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)]'
                          }`}
                        >
                          {formData.designStyles.includes(style.key) && (
                            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === 'ka' ? style.nameKa : style.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Section: Availability (for home-care) - Pill/tag style */}
              {selectedCategory === 'home-care' && (
                <section className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[var(--color-accent)] text-white">
                      2
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'ხელმისაწვდომობა' : 'Availability'}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'როდის ხარ ხელმისაწვდომი' : 'When are you available'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                    <div className="flex flex-wrap gap-2">
                      {availabilityOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => toggleAvailability(option.key)}
                          className={`px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                            formData.availability.includes(option.key)
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)]'
                          }`}
                        >
                          {formData.availability.includes(option.key) && (
                            <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === 'ka' ? option.nameKa : option.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Section: Credentials (for architecture) */}
              {selectedCategory === 'architecture' && (
                <section className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      2
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'კვალიფიკაცია' : 'Credentials'}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'ლიცენზიის ნომერი' : 'License Number'}
                      </label>
                      <input
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-all"
                        placeholder={locale === 'ka' ? 'არქიტექტორის ლიცენზია' : 'Architect License'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'საკადასტრო ID' : 'Cadastral ID'}
                      </label>
                      <input
                        type="text"
                        value={formData.cadastralId}
                        onChange={(e) => setFormData(prev => ({ ...prev, cadastralId: e.target.value }))}
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-all"
                        placeholder={locale === 'ka' ? 'საკადასტრო იდენტიფიკატორი' : 'Cadastral Identifier'}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Section: Pricing */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.pricing
                      ? 'bg-emerald-500 text-white'
                      : validation.bio && validation.experience && validation.designStyles
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
                  }`}>
                    {validation.pricing ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : selectedCategory === 'interior-design' ? '3' : selectedCategory === 'architecture' || selectedCategory === 'home-care' ? '3' : '2'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'ფასები' : 'Pricing'}
                      </h2>
                      {validation.bio && validation.experience && validation.designStyles && !validation.pricing && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'საწყისი ფასი' : 'Starting price'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>
                        {selectedCategory === 'interior-design'
                          ? (locale === 'ka' ? 'ფასი კვ.მ-ზე' : 'Price per m²')
                          : selectedCategory === 'craftsmen' || selectedCategory === 'home-care'
                          ? (locale === 'ka' ? 'საათობრივი ტარიფი' : 'Hourly Rate')
                          : (locale === 'ka' ? 'საბაზისო ფასი' : 'Base Price')
                        }
                      </span>
                      {validation.pricing ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                        className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-xl text-[var(--color-text-primary)] text-lg font-medium pr-16 focus:outline-none focus:ring-2 transition-all ${
                          validation.pricing
                            ? 'border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]'
                        }`}
                        placeholder={selectedCategory === 'interior-design' ? '50' : '500'}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] font-medium">
                        {selectedCategory === 'interior-design' ? '₾/m²' : selectedCategory === 'craftsmen' || selectedCategory === 'home-care' ? '₾/სთ' : '₾'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                      {selectedCategory === 'interior-design'
                        ? (locale === 'ka' ? 'კლიენტები დაინახავენ "დან XX ₾/m²"' : 'Clients will see "from XX ₾/m²"')
                        : (locale === 'ka' ? 'საწყისი ფასი' : 'Starting price')
                      }
                    </p>
                  </div>
                </div>
              </section>

              {/* Section: Portfolio URL */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                    {selectedCategory === 'interior-design' ? '4' : selectedCategory === 'architecture' || selectedCategory === 'home-care' ? '4' : '3'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'}
                    </h2>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] transition-all"
                      placeholder="https://behance.net/yourprofile"
                    />
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                      {locale === 'ka' ? 'Behance, Dribbble, Pinterest ან სხვა პლატფორმა' : 'Behance, Dribbble, Pinterest or other platform'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section: Service Areas */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.serviceAreas
                      ? 'bg-emerald-500 text-white'
                      : validation.pricing
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
                  }`}>
                    {validation.serviceAreas ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : selectedCategory === 'interior-design' ? '5' : selectedCategory === 'architecture' || selectedCategory === 'home-care' ? '5' : '4'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'მომსახურების ზონები' : 'Service Areas'}
                      </h2>
                      {validation.pricing && !validation.serviceAreas && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'სად მუშაობ' : 'Where you work'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] space-y-4">
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
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        formData.nationwide
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/50'
                          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 bg-[var(--color-bg-primary)]'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-[var(--color-text-primary)]">
                          {locationData.nationwide}
                        </h4>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka' ? 'მომსახურება მთელი ქვეყნის მასშტაბით' : 'Serve clients across the entire country'}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.nationwide
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                          : 'border-[var(--color-border)]'
                      }`}>
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
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      <p className="text-sm text-[var(--color-text-secondary)] font-medium">
                        {locale === 'ka' ? 'ან აირჩიე ქალაქები:' : 'Or select cities:'}
                      </p>
                      {Object.entries(locationData.regions).map(([regionName, cities]) => (
                        <div key={regionName} className="space-y-2">
                          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                            {regionName}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cities.map((city) => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => toggleServiceArea(city)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  formData.serviceAreas.includes(city)
                                    ? 'bg-[var(--color-accent)] text-white'
                                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)]'
                                }`}
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
                  )}
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Fixed Footer - matching post-job exactly */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Progress indicator - compact */}
            {!isFormValid && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center relative">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedFields / totalFields) * 75.4} 75.4`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {completedFields}/{totalFields}
                  </span>
                </div>
              </div>
            )}

            {/* Later button */}
            <button
              type="button"
              onClick={() => router.push('/browse')}
              className="px-4 py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium text-sm rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-dark)] transition-all flex-shrink-0"
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
              className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isFormValid
                  ? 'bg-[var(--color-accent)] text-white hover:shadow-[0_4px_20px_rgba(13,150,104,0.3)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
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
    </div>
  );
}

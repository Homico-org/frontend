'use client';

import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Custom SVG icons for each category
const CategoryIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'designer':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 32V28C6 26.8954 6.89543 26 8 26H40C41.1046 26 42 26.8954 42 28V32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M10 26V22C10 20.8954 10.8954 20 12 20H36C37.1046 20 38 20.8954 38 22V26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="6" y="32" width="36" height="6" rx="2" stroke="currentColor" strokeWidth="2.5"/>
          <path d="M10 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M38 38V42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 12L28 16L24 20L20 16L24 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="24" cy="8" r="2" fill="currentColor"/>
        </svg>
      );
    case 'architect':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 40V16L24 6L40 16V40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 40H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="14" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="28" y="22" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M20 40V34C20 32.8954 20.8954 32 22 32H26C27.1046 32 28 32.8954 28 34V40" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="24" cy="14" r="2" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      );
    case 'craftsmen':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 36L20 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M8 40L12 36L16 40L12 44L8 40Z" fill="currentColor"/>
          <path d="M32 8C28.6863 8 26 10.6863 26 14C26 15.1256 26.3086 16.1832 26.8438 17.0938L18 26L22 30L30.9062 21.1562C31.8168 21.6914 32.8744 22 34 22C37.3137 22 40 19.3137 40 16C40 15.5 39.9 15 39.8 14.5L36 18L32 14L35.5 10.2C35 10.1 34.5 10 34 10C33.3 10 32.6 10.1 32 10.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 32L10 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M38 30L34 36H38L34 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'homecare':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 22L24 8L42 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 20V38C10 39.1046 10.8954 40 12 40H36C37.1046 40 38 39.1046 38 38V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M24 24C26.5 24 28.5 26 28.5 28.5C28.5 32 24 35 24 35C24 35 19.5 32 19.5 28.5C19.5 26 21.5 24 24 24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M16 16L17 18L16 20L15 18L16 16Z" fill="currentColor"/>
          <path d="M32 16L33 18L32 20L31 18L32 16Z" fill="currentColor"/>
          <circle cx="24" cy="14" r="1.5" fill="currentColor"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
  }
};

export default function BecomeProPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { locale } = useLanguage();

  // Steps: intro -> category -> subcategory -> details -> complete
  const [step, setStep] = useState<'intro' | 'category' | 'subcategory' | 'details' | 'complete'>('intro');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Category-specific fields
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [bio, setBio] = useState('');
  const [pinterestLinks, setPinterestLinks] = useState<string[]>(['']);
  const [cadastralId, setCadastralId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Animation on step change
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [step]);

  // Redirect if not logged in or already a pro
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/become-pro');
      } else if (user?.role === 'pro') {
        router.push('/browse');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const selectedCategoryData = CATEGORIES.find(c => c.key === selectedCategory);

  const handleSubcategoryToggle = (subKey: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(subKey)
        ? prev.filter(k => k !== subKey)
        : [...prev, subKey]
    );
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialtyInput.trim();
    if (trimmed && !customSpecialties.includes(trimmed) && customSpecialties.length < 5) {
      setCustomSpecialties(prev => [...prev, trimmed]);
      setCustomSpecialtyInput('');
    }
  };

  const removeCustomSpecialty = (specialty: string) => {
    setCustomSpecialties(prev => prev.filter(s => s !== specialty));
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSpecialty();
    }
  };

  const addPinterestLink = () => {
    if (pinterestLinks.length < 5) {
      setPinterestLinks([...pinterestLinks, '']);
    }
  };

  const updatePinterestLink = (index: number, value: string) => {
    const newLinks = [...pinterestLinks];
    newLinks[index] = value;
    setPinterestLinks(newLinks);
  };

  const removePinterestLink = (index: number) => {
    if (pinterestLinks.length > 1) {
      setPinterestLinks(pinterestLinks.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');

      // Prepare categories array (main category + selected subcategories)
      const allCategories = [selectedCategory, ...selectedSubcategories];

      // Save registration data to session for profile setup
      sessionStorage.setItem('proRegistrationData', JSON.stringify({
        category: selectedCategory,
        subcategories: selectedSubcategories,
        customSpecialties,
        yearsExperience,
        bio,
        pinterestLinks: pinterestLinks.filter(l => l.trim()),
        cadastralId,
        licenseNumber,
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/upgrade-to-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedCategories: allCategories,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to upgrade account');
      }

      const data = await response.json();

      // Save new token and update auth context
      if (data.access_token && data.user) {
        login(data.access_token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatar: data.user.avatar,
          city: data.user.city,
          phone: data.user.phone,
          selectedCategories: data.user.selectedCategories,
          accountType: data.user.accountType,
          companyName: data.user.companyName,
        });
      }

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  const canProceedToDetails = () => {
    return selectedSubcategories.length > 0 || customSpecialties.length > 0;
  };

  const canSubmit = () => {
    // All fields are optional now - users can complete profile later
    return true;
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

  const stats = [
    { value: '2,400+', label: locale === 'ka' ? 'აქტიური პროფესიონალი' : 'Active professionals' },
    { value: '98%', label: locale === 'ka' ? 'კმაყოფილი მაძიებელი' : 'Client satisfaction' },
    { value: '24h', label: locale === 'ka' ? 'საშუალო პასუხის დრო' : 'Avg response time' },
  ];

  const getStepIndex = () => ['intro', 'category', 'subcategory', 'details', 'complete'].indexOf(step);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-accent-soft)] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--color-highlight-soft)] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 opacity-40" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="container-custom">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                Homico
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] group-hover:scale-125 transition-transform" />
            </Link>

            {/* Step indicator */}
            {step !== 'complete' && (
              <div className="flex items-center gap-2">
                {['intro', 'category', 'subcategory', 'details'].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      getStepIndex() === i
                        ? 'w-8 bg-[var(--color-accent)]'
                        : getStepIndex() > i
                          ? 'w-4 bg-[var(--color-accent)]/50'
                          : 'w-4 bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-20">
        {/* Intro Step */}
        {step === 'intro' && (
          <div className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <section className="container-custom pt-8 md:pt-16 pb-16">
              <div className="max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
                    {locale === 'ka' ? 'უფასო რეგისტრაცია' : 'Free to join'}
                  </span>
                </div>

                {/* Main headline */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-6">
                  {locale === 'ka' ? (
                    <>გახდი<br /><span className="text-[var(--color-accent)]">სპეციალისტი</span></>
                  ) : (
                    <>Become a<br /><span className="text-[var(--color-accent)]">Professional</span></>
                  )}
                </h1>

                <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-xl mb-12 leading-relaxed">
                  {locale === 'ka'
                    ? 'შემოუერთდი საქართველოს წამყვან პლატფორმას სახლის პროფესიონალებისთვის.'
                    : 'Join Georgia\'s leading platform for home professionals.'
                  }
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 md:gap-16 mb-12">
                  {stats.map((stat, i) => (
                    <div key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'forwards' }}>
                      <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{stat.value}</div>
                      <div className="text-sm text-[var(--color-text-tertiary)] mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => setStep('category')}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--color-accent)] text-white rounded-2xl font-medium text-lg overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(13,150,104,0.3)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10">{locale === 'ka' ? 'დაწყება' : 'Get started'}</span>
                  <svg className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Category Selection Step */}
        {step === 'category' && (
          <div className={`container-custom pt-8 md:pt-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-xl mx-auto">
              {/* Back button */}
              <button
                onClick={() => setStep('intro')}
                className="group flex items-center gap-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">{locale === 'ka' ? 'უკან' : 'Back'}</span>
              </button>

              {/* Header */}
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
                  {locale === 'ka' ? 'რას აკეთებ?' : 'What do you do?'}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'აირჩიე შენი სფერო' : 'Choose your field'}
                </p>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                {CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setSelectedSubcategories([]);
                      setCustomSpecialties([]);
                      setShowCustomInput(false);
                    }}
                    className={`group relative w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-300 opacity-0 animate-fade-in ${
                      selectedCategory === cat.key
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                    style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === cat.key
                        ? 'bg-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20 text-white'
                        : 'bg-[var(--color-bg-muted)] group-hover:bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}>
                      <CategoryIcon type={cat.icon} className="w-8 h-8" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-0.5 transition-colors ${
                        selectedCategory === cat.key ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {locale === 'ka' ? cat.nameKa : cat.name}
                      </h3>
                      <p className="text-sm text-[var(--color-text-tertiary)] line-clamp-1">
                        {locale === 'ka' ? cat.descriptionKa : cat.description}
                      </p>
                    </div>

                    {/* Check indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === cat.key
                        ? 'bg-[var(--color-accent)] scale-100'
                        : 'bg-[var(--color-border)] scale-75 opacity-0 group-hover:opacity-50'
                    }`}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Continue button */}
              <button
                onClick={() => setStep('subcategory')}
                disabled={!selectedCategory}
                className="w-full mt-8 py-4 px-6 bg-[var(--color-accent)] text-white rounded-2xl font-medium text-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_8px_30px_rgba(13,150,104,0.3)] hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0"
              >
                {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Subcategory Selection Step */}
        {step === 'subcategory' && selectedCategoryData && (
          <div className={`container-custom pt-8 md:pt-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-xl mx-auto">
              {/* Back button */}
              <button
                onClick={() => setStep('category')}
                className="group flex items-center gap-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">{locale === 'ka' ? 'უკან' : 'Back'}</span>
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
                    <CategoryIcon type={selectedCategoryData.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-accent)]">
                    {locale === 'ka' ? selectedCategoryData.nameKa : selectedCategoryData.name}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
                  {locale === 'ka' ? 'რას აკეთებ კონკრეტულად?' : 'What exactly do you do?'}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'აირჩიე ერთი ან მეტი სპეციალობა' : 'Select one or more specialties'}
                </p>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedCategoryData.subcategories.map((sub, i) => {
                  const isSelected = selectedSubcategories.includes(sub.key);
                  return (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => handleSubcategoryToggle(sub.key)}
                      className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-300 opacity-0 animate-fade-in ${
                        isSelected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)]'
                      }`}
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium transition-colors ${
                          isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'
                        }`}>
                          {locale === 'ka' ? sub.nameKa : sub.name}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'bg-[var(--color-accent)] scale-100'
                            : 'bg-[var(--color-border)] scale-75 opacity-50'
                        }`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Specialty Section */}
              <div className="mt-6">
                {/* Custom specialties tags */}
                {customSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {customSpecialties.map((specialty, i) => (
                      <div
                        key={specialty}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 animate-fade-in"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{specialty}</span>
                        <button
                          onClick={() => removeCustomSpecialty(specialty)}
                          className="ml-0.5 p-0.5 rounded-full hover:bg-amber-500/20 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add custom button / Input */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="group w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[var(--color-text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {locale === 'ka' ? 'დაამატე საკუთარი სპეციალობა' : 'Add your own specialty'}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {locale === 'ka' ? 'ვერ იპოვე სიაში? დაწერე შენი' : "Can't find yours? Add it here"}
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)] text-sm">
                          {locale === 'ka' ? 'უნიკალური სპეციალობა' : 'Unique specialty'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCustomInput(false)}
                        className="ml-auto p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={customSpecialtyInput}
                        onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                        onKeyDown={handleCustomInputKeyDown}
                        placeholder={locale === 'ka' ? 'მაგ: 3D ვიზუალიზაცია, ავეჯის რესტავრაცია...' : 'e.g. 3D Visualization, Furniture restoration...'}
                        className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
                        maxLength={50}
                        autoFocus
                      />
                      <button
                        onClick={addCustomSpecialty}
                        disabled={!customSpecialtyInput.trim() || customSpecialties.length >= 5}
                        className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Info note with marketing copy */}
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        {locale === 'ka' ? (
                          <>
                            <span className="font-semibold">გამოირჩიე კონკურენციიდან!</span>
                            {' '}შენი უნიკალური სპეციალობა გამოჩნდება პროფილზე და კლიენტები შეძლებენ გიპოვონ ძიებით.
                            <span className="block mt-1 text-amber-600/80 dark:text-amber-400/80">
                              კატეგორიების ფილტრში არ გამოჩნდება, მაგრამ ძიებაში კი.
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">Stand out from the crowd!</span>
                            {' '}Your unique specialty will appear on your profile and clients can find you by searching.
                            <span className="block mt-1 text-amber-600/80 dark:text-amber-400/80">
                              Won't show in category filters, but will be searchable.
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {customSpecialties.length >= 5 && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        {locale === 'ka' ? 'მაქსიმუმ 5 სპეციალობა' : 'Maximum 5 specialties'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Selected count */}
              {(selectedSubcategories.length > 0 || customSpecialties.length > 0) && (
                <div className="mt-4 text-sm text-[var(--color-text-secondary)]">
                  {locale === 'ka'
                    ? `არჩეულია ${selectedSubcategories.length + customSpecialties.length} სპეციალობა`
                    : `${selectedSubcategories.length + customSpecialties.length} specialt${(selectedSubcategories.length + customSpecialties.length) > 1 ? 'ies' : 'y'} selected`
                  }
                  {customSpecialties.length > 0 && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      ({customSpecialties.length} {locale === 'ka' ? 'უნიკალური' : 'custom'})
                    </span>
                  )}
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={() => setStep('details')}
                disabled={!canProceedToDetails()}
                className="w-full mt-8 py-4 px-6 bg-[var(--color-accent)] text-white rounded-2xl font-medium text-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_8px_30px_rgba(13,150,104,0.3)] hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0"
              >
                {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Details Step */}
        {step === 'details' && selectedCategoryData && (
          <div className={`container-custom pt-8 md:pt-12 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-xl mx-auto">
              {/* Back button */}
              <button
                onClick={() => setStep('subcategory')}
                className="group flex items-center gap-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors mb-8"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">{locale === 'ka' ? 'უკან' : 'Back'}</span>
              </button>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
                  {locale === 'ka' ? 'დეტალები' : 'Details'}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'მოგვიყევი შენს გამოცდილებაზე' : 'Tell us about your experience'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Years of Experience - For all categories */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                  />
                </div>

                {/* Bio - For all categories */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {locale === 'ka' ? 'მოკლე აღწერა' : 'Short Bio'}
                    <span className="text-[var(--color-text-muted)] text-xs ml-2">
                      ({locale === 'ka' ? 'არასავალდებულო' : 'optional'})
                    </span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder={locale === 'ka' ? 'მოგვიყევი შენს გამოცდილებაზე...' : 'Tell us about your experience...'}
                    className="w-full px-4 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all resize-none"
                  />
                </div>

                {/* Portfolio URL - Optional for all categories */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                    <span className="text-[var(--color-text-muted)] text-xs ml-2">
                      ({locale === 'ka' ? 'არასავალდებულო' : 'optional'})
                    </span>
                  </label>
                  <input
                    type="url"
                    value={pinterestLinks[0] || ''}
                    onChange={(e) => updatePinterestLink(0, e.target.value)}
                    placeholder={locale === 'ka' ? 'https://თქვენი-საიტი.com ან Instagram/Behance' : 'https://your-website.com or Instagram/Behance'}
                    className="w-full px-4 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                  />
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                    {locale === 'ka'
                      ? 'ვებსაიტი, Instagram, Behance, Pinterest ან სხვა პორტფოლიო'
                      : 'Website, Instagram, Behance, Pinterest or any portfolio link'
                    }
                  </p>
                </div>

                {/* Architecture specific - Cadastral ID (optional) */}
                {selectedCategory === 'architecture' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'საკადასტრო კოდი' : 'Cadastral ID'}
                      <span className="text-[var(--color-text-muted)] text-xs ml-2">
                        ({locale === 'ka' ? 'არასავალდებულო' : 'optional'})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={cadastralId}
                      onChange={(e) => setCadastralId(e.target.value)}
                      placeholder="01.18.01.004.001"
                      className="w-full px-4 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                    />
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {locale === 'ka'
                        ? 'ვერიფიკაციისთვის (შეგიძლიათ მოგვიანებით დაამატოთ)'
                        : 'For verification (you can add later)'
                      }
                    </p>
                  </div>
                )}

                {/* Info about profile completion */}
                <div className="p-4 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--color-text-primary)] mb-1">
                        {locale === 'ka' ? 'რეგისტრაციის შემდეგ' : 'After registration'}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {locale === 'ka'
                          ? 'შეძლებთ დაამატოთ პორტფოლიო, გამოცდილება, ფასები და სხვა დეტალები თქვენს პროფილში'
                          : 'You can add portfolio, experience, pricing and other details to your profile'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Specialties Display */}
                {customSpecialties.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-1">
                          {locale === 'ka' ? 'უნიკალური სპეციალობები' : 'Unique Specialties'}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {customSpecialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-300"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {specialty}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-400/80">
                          {locale === 'ka'
                            ? 'ეს სპეციალობები გამოჩნდება შენს პროფილზე და ძიებაში'
                            : 'These will appear on your profile and in search results'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit()}
                className="w-full mt-8 py-4 px-6 bg-[var(--color-accent)] text-white rounded-2xl font-medium text-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_8px_30px_rgba(13,150,104,0.3)] hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{locale === 'ka' ? 'მიმდინარეობს...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>{locale === 'ka' ? 'პროფილის შექმნა' : 'Create profile'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className={`container-custom pt-8 md:pt-16 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-md mx-auto text-center">
              {/* Success icon */}
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/30 animate-bounce-in">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-4">
                {locale === 'ka' ? 'გილოცავთ!' : 'Congratulations!'}
              </h2>

              <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                {locale === 'ka'
                  ? 'შენ ახლა სპეციალისტი ხარ. დაიწყე სამუშაოების მიღება!'
                  : 'You are now a professional. Start receiving jobs!'
                }
              </p>

              <div className="space-y-3">
                <Link
                  href="/browse"
                  className="block w-full py-4 px-6 bg-[var(--color-accent)] text-white rounded-2xl font-medium text-lg transition-all duration-300 hover:shadow-[0_8px_30px_rgba(13,150,104,0.3)] hover:-translate-y-0.5"
                >
                  {locale === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
                </Link>
                <Link
                  href="/pro/profile-setup"
                  className="block w-full py-4 px-6 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-2xl font-medium text-lg transition-all duration-300 hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]"
                >
                  {locale === 'ka' ? 'პროფილის შევსება' : 'Complete Profile'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

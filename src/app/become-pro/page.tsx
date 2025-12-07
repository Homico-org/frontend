'use client';

import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';
import PortfolioProjectsInput, { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BecomeProPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Category-specific fields
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect if not logged in or already a pro
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        openLoginModal('/become-pro');
      } else if (user?.role === 'pro') {
        router.push('/browse');
      }
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  // Validation state for progress tracking
  const getValidationState = () => {
    const hasCategory = !!selectedCategory;
    const hasSpecialty = selectedSubcategories.length > 0 || customSpecialties.length > 0;

    return {
      category: hasCategory,
      specialty: hasSpecialty,
    };
  };

  const validation = getValidationState();
  const completedFields = Object.values(validation).filter(Boolean).length;
  const totalFields = Object.keys(validation).length;

  const canSubmit = () => {
    return validation.specialty;
  };

  const getFirstMissingField = () => {
    if (!validation.category) return { key: 'category', label: locale === 'ka' ? 'კატეგორია' : 'Category' };
    if (!validation.specialty) return { key: 'specialty', label: locale === 'ka' ? 'სპეციალობა' : 'Specialty' };
    return null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

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
        portfolioUrl,
        portfolioProjects: portfolioProjects.map(p => ({
          title: p.title,
          description: p.description,
          location: p.location,
          images: p.images,
        })),
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

      setIsComplete(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
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

  const stats = [
    { value: '2,400+', label: locale === 'ka' ? 'აქტიური პროფესიონალი' : 'Active professionals' },
    { value: '98%', label: locale === 'ka' ? 'კმაყოფილი მაძიებელი' : 'Client satisfaction' },
    { value: '24h', label: locale === 'ka' ? 'საშუალო პასუხის დრო' : 'Avg response time' },
  ];

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-hidden">
        {/* Ambient background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-accent-soft)] rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3 opacity-60" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[var(--color-highlight-soft)] rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 opacity-40" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className={`max-w-md w-full text-center transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
      </div>
    );
  }

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
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                Homico
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] group-hover:scale-125 transition-transform" />
            </Link>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {user.name || user.email}
                </span>
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-medium text-sm">
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </div>
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
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
                  {locale === 'ka' ? 'უფასო რეგისტრაცია' : 'Free to join'}
                </span>
              </div>

              {/* Main headline */}
              <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-4">
                {locale === 'ka' ? (
                  <>გახდი <span className="text-[var(--color-accent)]">სპეციალისტი</span></>
                ) : (
                  <>Become a <span className="text-[var(--color-accent)]">Professional</span></>
                )}
              </h1>

              <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl mb-8 leading-relaxed">
                {locale === 'ka'
                  ? 'შემოუერთდი საქართველოს წამყვან პლატფორმას სახლის პროფესიონალებისთვის.'
                  : 'Join Georgia\'s leading platform for home professionals.'
                }
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 md:gap-12">
                {stats.map((stat, i) => (
                  <div key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${200 + i * 100}ms`, animationFillMode: 'forwards' }}>
                    <div className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{stat.value}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Main Form - Single Scrollable */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section: Category & Specializations */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Choose Your Specialty'}
                    </h2>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'რას აკეთებ კონკრეტულად?' : 'What do you do exactly?'}
                    </p>
                  </div>
                </div>

                <CategorySubcategorySelector
                  selectedCategory={selectedCategory}
                  selectedSubcategories={selectedSubcategories}
                  onCategoryChange={setSelectedCategory}
                  onSubcategoriesChange={setSelectedSubcategories}
                  customSpecialties={customSpecialties}
                  onCustomSpecialtiesChange={setCustomSpecialties}
                  showCustomSpecialties={true}
                  singleCategoryMode={true}
                />
              </section>

              {/* Section: Additional Info (Optional) */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)] font-bold border border-[var(--color-border-subtle)]">
                    2
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'დამატებითი ინფორმაცია' : 'Additional Info'}
                    </h2>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'არასავალდებულო - შეგიძლია მოგვიანებით შეავსო' : 'Optional - you can complete later'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  {/* Years of Experience */}
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
                      className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'მოკლე აღწერა' : 'Short Bio'}
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder={locale === 'ka' ? 'მოგვიყევი შენს გამოცდილებაზე...' : 'Tell us about your experience...'}
                      className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all resize-none"
                    />
                  </div>

                  {/* Portfolio URL */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder={locale === 'ka' ? 'https://თქვენი-საიტი.com ან Instagram/Behance' : 'https://your-website.com or Instagram/Behance'}
                      className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                    />
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {locale === 'ka'
                        ? 'ვებსაიტი, Instagram, Behance, Pinterest ან სხვა პორტფოლიო'
                        : 'Website, Instagram, Behance, Pinterest or any portfolio link'
                      }
                    </p>
                  </div>

                  {/* Portfolio Projects */}
                  <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                    <PortfolioProjectsInput
                      projects={portfolioProjects}
                      onChange={setPortfolioProjects}
                      maxProjects={5}
                    />
                  </div>
                </div>

                {/* Info about profile completion */}
                <div className="mt-4 p-4 rounded-xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20">
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
              </section>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
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

      {/* Fixed Actions Footer - compact design matching post-job */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Progress indicator - compact */}
            {!canSubmit() && (
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
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium hidden sm:block">
                  {getFirstMissingField()?.label}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting || !canSubmit()}
              className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                canSubmit()
                  ? 'bg-[var(--color-accent)] text-white hover:shadow-[0_4px_20px_rgba(13,150,104,0.3)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{locale === 'ka' ? 'მიმდინარეობს...' : 'Processing...'}</span>
                </>
              ) : canSubmit() ? (
                <>
                  <span>{locale === 'ka' ? 'პროფილის შექმნა' : 'Create Profile'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              ) : (
                <span>{locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Select specialty'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import BackButton from '@/components/common/BackButton';
import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';
import Header from '@/components/common/Header';
import PortfolioProjectsInput, { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/Card';
import { Input, Textarea, FormGroup } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CircleProgress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Benefit icons with premium styling
const BenefitIcon = ({ type }: { type: 'money' | 'users' | 'verified' }) => {
  switch (type) {
    case 'money':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v12M9 9h6M9 15h6" strokeLinecap="round" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'verified':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

export default function BecomeProPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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
  const progressPercentage = (completedFields / totalFields) * 100;

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

      setShowConfetti(true);
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
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[#D2691E] animate-spin" />
        </div>
      </div>
    );
  }

  const benefits = [
    {
      icon: 'money' as const,
      value: locale === 'ka' ? 'უფასო' : 'Free',
      label: locale === 'ka' ? 'რეგისტრაცია' : 'Registration'
    },
    {
      icon: 'users' as const,
      value: '2,400+',
      label: locale === 'ka' ? 'კლიენტი' : 'Clients'
    },
    {
      icon: 'verified' as const,
      value: '98%',
      label: locale === 'ka' ? 'კმაყოფილება' : 'Satisfaction'
    },
  ];

  // Success screen with celebration
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-hidden">
        {/* Confetti animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  backgroundColor: ['#D2691E', '#CD853F', '#B8560E', '#E89454', '#C45D3E'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.8}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Ambient background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="become-pro-orb become-pro-orb-1" />
          <div className="become-pro-orb become-pro-orb-2" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div
            className="max-w-md w-full text-center"
            style={{ animation: 'scale-in 0.5s ease-out' }}
          >
            {/* Success icon */}
            <div className="relative mb-8">
              <div className="become-pro-success-icon">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
              {locale === 'ka' ? 'გილოცავთ!' : 'Congratulations!'}
            </h2>

            <p className="text-lg text-[var(--color-text-secondary)] mb-2">
              {locale === 'ka' ? 'შენ ახლა პროფესიონალი ხარ' : 'You are now a professional'}
            </p>

            <p className="text-sm text-[var(--color-text-tertiary)] mb-10 max-w-xs mx-auto">
              {locale === 'ka'
                ? 'დაიწყე სამუშაოების მიღება და გაზარდე შენი კლიენტების ბაზა'
                : 'Start receiving jobs and grow your client base'
              }
            </p>

            <div className="space-y-3">
              <Link href="/browse">
                <Button variant="default" size="xl" className="w-full group">
                  <span>{locale === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/pro/profile-setup">
                <Button variant="secondary" size="xl" className="w-full">
                  {locale === 'ka' ? 'პროფილის შევსება' : 'Complete Profile'}
                </Button>
              </Link>
            </div>

            {/* Pro tip callout */}
            <Card variant="feature" className="mt-10 text-left">
              <div className="flex items-start gap-3">
                <div className="become-pro-callout-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-text-primary)] text-sm mb-0.5">
                    {locale === 'ka' ? 'პროფესიონალის რჩევა' : 'Pro Tip'}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {locale === 'ka'
                      ? 'პროფილის სრულად შევსება 3x-ით ზრდის კლიენტების ნდობას'
                      : 'Completing your profile increases client trust by 3x'
                    }
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Custom keyframes for confetti */}
        <style jsx>{`
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="become-pro-container overflow-x-hidden">
      <Header />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="become-pro-orb become-pro-orb-1" />
        <div className="become-pro-orb become-pro-orb-2" />
      </div>

      <main className={`relative z-10 pt-16 pb-28 transition-all duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="container-custom pt-8 md:pt-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <BackButton />
            </div>

            {/* Hero Section */}
            <section className="mb-12 text-center">
              {/* Badge */}
              <div className="become-pro-hero-badge">
                <span className="text-xs font-semibold text-[#D2691E] uppercase tracking-wider">
                  {locale === 'ka' ? 'უფასო რეგისტრაცია' : 'Free to join'}
                </span>
              </div>

              {/* Main headline */}
              <h1 className="become-pro-hero-title mt-6 mb-5">
                {locale === 'ka' ? (
                  <>გახდი <span>სპეციალისტი</span></>
                ) : (
                  <>Become a <span>Professional</span></>
                )}
              </h1>

              <p className="become-pro-hero-subtitle">
                {locale === 'ka'
                  ? 'შემოუერთდი საქართველოს წამყვან პლატფორმას და მიიღე მეტი სამუშაო'
                  : 'Join Georgia\'s leading platform and get more work opportunities'
                }
              </p>

              {/* Benefits cards */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mt-10">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="become-pro-benefit-card"
                    style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                  >
                    <div className="become-pro-benefit-icon">
                      <BenefitIcon type={benefit.icon} />
                    </div>
                    <div className="become-pro-benefit-value">{benefit.value}</div>
                    <div className="become-pro-benefit-label">{benefit.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Main Form */}
            <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section: Category & Specializations */}
              <section className="become-pro-section mb-10" style={{ animationDelay: '0.5s' }}>
                <div className="become-pro-section-header">
                  <div className={`become-pro-section-number ${validation.specialty ? 'completed' : 'active'}`}>
                    {validation.specialty ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '1'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Choose Your Specialty'}
                      </h2>
                      {!validation.specialty && (
                        <Badge variant="warning" size="xs">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'რა სფეროში მუშაობ?' : 'What field do you work in?'}
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
                  showCustomSpecialties={false}
                  singleCategoryMode={true}
                />
              </section>

              {/* Section: Additional Info (Optional) */}
              <section className="become-pro-section mb-10" style={{ animationDelay: '0.6s' }}>
                <div className="become-pro-section-header">
                  <div className={`become-pro-section-number ${validation.specialty ? 'active' : 'inactive'}`}>
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'დამატებითი ინფორმაცია' : 'Additional Info'}
                      </h2>
                      <Badge variant="secondary" size="xs">
                        {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'შეგიძლია მოგვიანებით შეავსო' : 'You can complete later'}
                    </p>
                  </div>
                </div>

                <Card variant="premium" className="space-y-5">
                  {/* Years of Experience */}
                  <FormGroup
                    label={locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                      variant="default"
                    />
                  </FormGroup>

                  {/* Bio */}
                  <FormGroup
                    label={locale === 'ka' ? 'მოკლე აღწერა' : 'Short Bio'}
                    hint={locale === 'ka' ? 'რეკომენდირებული' : 'Recommended'}
                    helperText={locale === 'ka' ? 'ეს ტექსტი გამოჩნდება თქვენს პროფილზე' : 'This text will appear on your profile'}
                  >
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={locale === 'ka' ? 'მოგვიყევი შენს გამოცდილებაზე...' : 'Tell us about your experience...'}
                      variant="default"
                      textareaSize="default"
                    />
                  </FormGroup>

                  {/* Portfolio URL */}
                  <FormGroup
                    label={locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                  >
                    <Input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://..."
                      variant="default"
                    />
                  </FormGroup>

                  {/* Portfolio Projects */}
                  <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                    <PortfolioProjectsInput
                      projects={portfolioProjects}
                      onChange={setPortfolioProjects}
                      maxProjects={5}
                    />
                  </div>
                </Card>

                {/* Info callout */}
                <Card variant="feature" className="mt-4">
                  <div className="flex items-start gap-3">
                    <div className="become-pro-callout-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                        {locale === 'ka' ? 'რეგისტრაციის შემდეგ' : 'After registration'}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {locale === 'ka'
                          ? 'შეძლებთ დაამატოთ პორტფოლიო, გამოცდილება, ფასები და სხვა დეტალები'
                          : 'You can add portfolio, experience, pricing and other details'
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Error */}
              {error && (
                <Card variant="outlined" className="mb-6 !border-red-500/30 !bg-red-500/5">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </Card>
              )}

            </form>
          </div>
        </div>
      </main>

      {/* Fixed Actions Footer */}
      <div className="become-pro-footer">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            {!canSubmit() && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <CircleProgress
                  value={progressPercentage}
                  size="default"
                  showValue={true}
                />
                <span className="text-sm text-[var(--color-text-tertiary)] hidden sm:block">
                  {getFirstMissingField()?.label}
                </span>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="button"
              onClick={() => {
                if (formRef.current) formRef.current.requestSubmit();
              }}
              disabled={isSubmitting || !canSubmit()}
              loading={isSubmitting}
              variant={canSubmit() ? 'premium' : 'secondary'}
              size="lg"
              className="flex-1"
              rightIcon={canSubmit() && !isSubmitting ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              ) : undefined}
            >
              {isSubmitting
                ? (locale === 'ka' ? 'მიმდინარეობს...' : 'Processing...')
                : canSubmit()
                  ? (locale === 'ka' ? 'გახდი სპეციალისტი' : 'Become a Pro')
                  : (locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Select specialty')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

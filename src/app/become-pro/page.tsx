'use client';

import BackButton from '@/components/common/BackButton';
import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';
import Header from '@/components/common/Header';
import PortfolioProjectsInput, { PortfolioProject } from '@/components/common/PortfolioProjectsInput';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Benefit icons
const BenefitIcon = ({ type }: { type: 'money' | 'users' | 'verified' }) => {
  switch (type) {
    case 'money':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v12M9 9h6M9 15h6" strokeLinecap="round" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'verified':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
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
                  backgroundColor: ['#3d9970', '#c45d3e', '#c9a66b', '#5cc98e', '#e87a5c'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.8}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Ambient background with gradient orbs */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(61,153,112,0.4) 0%, transparent 70%)',
              top: '-10%',
              right: '-10%',
              animation: 'float 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(196,93,62,0.3) 0%, transparent 70%)',
              bottom: '-10%',
              left: '-10%',
              animation: 'float 10s ease-in-out infinite reverse',
            }}
          />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div
            className="max-w-md w-full text-center"
            style={{ animation: 'scale-in 0.5s ease-out' }}
          >
            {/* Success icon with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 w-28 h-28 mx-auto rounded-3xl bg-[var(--color-accent)] blur-[30px] opacity-40" />
              <div
                className="relative w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[#2d7a58] flex items-center justify-center shadow-xl"
                style={{ animation: 'success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <svg
                  className="w-14 h-14 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: 'draw-check 0.4s ease-out 0.3s forwards'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Decorative rings */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-[var(--color-accent)]/30 rounded-3xl"
                style={{ animation: 'ring-expand 1s ease-out forwards' }}
              />
            </div>

            <h2
              className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3"
              style={{ animation: 'fade-up 0.5s ease-out 0.2s backwards' }}
            >
              {locale === 'ka' ? 'გილოცავთ!' : 'Congratulations!'}
            </h2>

            <p
              className="text-lg text-[var(--color-text-secondary)] mb-2"
              style={{ animation: 'fade-up 0.5s ease-out 0.3s backwards' }}
            >
              {locale === 'ka' ? 'შენ ახლა პროფესიონალი ხარ' : 'You are now a professional'}
            </p>

            <p
              className="text-sm text-[var(--color-text-tertiary)] mb-10 max-w-xs mx-auto"
              style={{ animation: 'fade-up 0.5s ease-out 0.4s backwards' }}
            >
              {locale === 'ka'
                ? 'დაიწყე სამუშაოების მიღება და გაზარდე შენი კლიენტების ბაზა'
                : 'Start receiving jobs and grow your client base'
              }
            </p>

            <div
              className="space-y-3"
              style={{ animation: 'fade-up 0.5s ease-out 0.5s backwards' }}
            >
              <Link
                href="/browse"
                className="group relative block w-full py-4 px-6 bg-[var(--color-accent)] text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_8px_30px_rgba(61,153,112,0.35)] hover:-translate-y-0.5 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {locale === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </Link>
              <Link
                href="/pro/profile-setup"
                className="block w-full py-4 px-6 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]"
              >
                {locale === 'ka' ? 'პროფილის შევსება' : 'Complete Profile'}
              </Link>
            </div>

            {/* Pro tip */}
            <div
              className="mt-10 p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 text-left"
              style={{ animation: 'fade-up 0.5s ease-out 0.6s backwards' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          </div>
        </div>

        {/* Custom keyframes for success animations */}
        <style jsx>{`
          @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes success-pop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes draw-check {
            to { stroke-dashoffset: 0; }
          }
          @keyframes ring-expand {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(61,153,112,0.3) 0%, transparent 70%)',
            top: '5%',
            right: '-5%',
            animation: 'float 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(196,93,62,0.25) 0%, transparent 70%)',
            bottom: '10%',
            left: '-5%',
            animation: 'float 15s ease-in-out infinite reverse',
          }}
        />
      </div>

      <main className={`relative z-10 pt-16 pb-28 transition-all duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="container-custom pt-8 md:pt-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <BackButton />
            </div>
            {/* Hero Section */}
            <section className="mb-12 text-center">
              {/* Badge with pulse */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 mb-6"
                style={{ animation: 'fade-in 0.6s ease-out 0.1s backwards' }}
              >
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping opacity-75" />
                </div>
                <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider">
                  {locale === 'ka' ? 'უფასო რეგისტრაცია' : 'Free to join'}
                </span>
              </div>

              {/* Main headline with accent */}
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-5"
                style={{ animation: 'fade-in 0.6s ease-out 0.2s backwards' }}
              >
                {locale === 'ka' ? (
                  <>გახდი <span className="text-[var(--color-accent)]">სპეციალისტი</span></>
                ) : (
                  <>Become a <span className="text-[var(--color-accent)]">Professional</span></>
                )}
              </h1>

              <p
                className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto mb-10 leading-relaxed"
                style={{ animation: 'fade-in 0.6s ease-out 0.3s backwards' }}
              >
                {locale === 'ka'
                  ? 'შემოუერთდი საქართველოს წამყვან პლატფორმას და მიიღე მეტი სამუშაო'
                  : 'Join Georgia\'s leading platform and get more work opportunities'
                }
              </p>

              {/* Benefits cards */}
              <div
                className="grid grid-cols-3 gap-3 md:gap-4 mb-10"
                style={{ animation: 'fade-in 0.6s ease-out 0.4s backwards' }}
              >
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="group p-4 md:p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] transition-all duration-300 hover:border-[var(--color-accent)]/30 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <div className="text-[var(--color-accent)]">
                        <BenefitIcon type={benefit.icon} />
                      </div>
                    </div>
                    <div className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{benefit.value}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{benefit.label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Main Form */}
            <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section: Category & Specializations */}
              <section
                className="mb-10"
                style={{ animation: 'fade-in 0.6s ease-out 0.5s backwards' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    validation.specialty
                      ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/25'
                      : 'bg-[var(--color-accent)] text-white'
                  }`}>
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
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
              <section
                className="mb-10"
                style={{ animation: 'fade-in 0.6s ease-out 0.6s backwards' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    validation.specialty
                      ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                      : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]'
                  }`}>
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'დამატებითი ინფორმაცია' : 'Additional Info'}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                        {locale === 'ka' ? 'არასავალდებულო' : 'Optional'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'შეგიძლია მოგვიანებით შეავსო' : 'You can complete later'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 md:p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
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
                      className="w-full px-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>{locale === 'ka' ? 'მოკლე აღწერა' : 'Short Bio'}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                        {locale === 'ka' ? 'რეკომენდირებული' : 'Recommended'}
                      </span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder={locale === 'ka' ? 'მოგვიყევი შენს გამოცდილებაზე...' : 'Tell us about your experience...'}
                      className="w-full px-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all resize-none"
                    />
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1.5">
                      {locale === 'ka'
                        ? 'ეს ტექსტი გამოჩნდება თქვენს პროფილზე'
                        : 'This text will appear on your profile'
                      }
                    </p>
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
                      placeholder="https://..."
                      className="w-full px-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                    />
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

                {/* Info callout */}
                <div className="mt-4 p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/15">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-white flex-shrink-0">
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

      {/* Fixed Actions Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            {!canSubmit() && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedFields / totalFields) * 100.5} 100.5`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                      {completedFields}/{totalFields}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-[var(--color-text-tertiary)] hidden sm:block">
                  {getFirstMissingField()?.label}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={() => {
                if (formRef.current) formRef.current.requestSubmit();
              }}
              disabled={isSubmitting || !canSubmit()}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
                canSubmit()
                  ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/25 hover:shadow-xl hover:shadow-[var(--color-accent)]/30 hover:-translate-y-0.5'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{locale === 'ka' ? 'მიმდინარეობს...' : 'Processing...'}</span>
                </>
              ) : canSubmit() ? (
                <>
                  <span>{locale === 'ka' ? 'გახდი სპეციალისტი' : 'Become a Pro'}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              ) : (
                <span>{locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Select specialty'}</span>
              )}
              {/* Shine effect on hover */}
              {canSubmit() && (
                <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

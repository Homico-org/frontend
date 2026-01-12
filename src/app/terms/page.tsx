'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Table of contents sections
const sections = [
  { id: 'acceptance', titleEn: 'Acceptance of Terms', titleKa: 'პირობების მიღება' },
  { id: 'eligibility', titleEn: 'Eligibility', titleKa: 'უფლებამოსილება' },
  { id: 'account', titleEn: 'Account Registration', titleKa: 'ანგარიშის რეგისტრაცია' },
  { id: 'services', titleEn: 'Platform Services', titleKa: 'პლატფორმის სერვისები' },
  { id: 'professionals', titleEn: 'Professional Users', titleKa: 'პროფესიონალი მომხმარებლები' },
  { id: 'clients', titleEn: 'Client Users', titleKa: 'კლიენტი მომხმარებლები' },
  { id: 'payments', titleEn: 'Payments & Fees', titleKa: 'გადახდები და საკომისიო' },
  { id: 'content', titleEn: 'User Content', titleKa: 'მომხმარებლის კონტენტი' },
  { id: 'prohibited', titleEn: 'Prohibited Conduct', titleKa: 'აკრძალული ქმედებები' },
  { id: 'liability', titleEn: 'Limitation of Liability', titleKa: 'პასუხისმგებლობის შეზღუდვა' },
  { id: 'termination', titleEn: 'Termination', titleKa: 'შეწყვეტა' },
  { id: 'changes', titleEn: 'Changes to Terms', titleKa: 'პირობების ცვლილება' },
  { id: 'contact', titleEn: 'Contact Information', titleKa: 'საკონტაქტო ინფორმაცია' },
];

export default function TermsPage() {
  const { t, locale } = useLanguage();
  const [activeSection, setActiveSection] = useState('acceptance');
  const [showMobileToc, setShowMobileToc] = useState(false);

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setShowMobileToc(false);
  };

  const lastUpdated = t('terms.december');

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A85A45]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        {/* Decorative geometric elements */}
        <div className="absolute top-1/4 left-8 w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/3 right-12 w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-8 left-1/4 w-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            {/* Document icon badge */}
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              {t('terms.legalDocument')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {t('terms.termsOfService')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6">
              {t('terms.pleaseReadTheseTermsCarefully')}
            </p>

            {/* Last updated badge */}
            <div className="inline-flex items-center gap-2 text-sm text-white/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('terms.lastUpdated')} {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-10">

          {/* Table of Contents - Sticky Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden">
              <div className="bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-dark-border p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                  {t('terms.tableOfContents')}
                </h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 group ${
                        activeSection === section.id
                          ? 'bg-[#C4735B]/10 dark:bg-[#C4735B]/20 text-[#C4735B] dark:text-[#E8956A] font-medium'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-dark-elevated hover:text-neutral-900 dark:hover:text-neutral-200'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#C4735B] text-white'
                          : 'bg-neutral-100 dark:bg-dark-elevated text-neutral-400 dark:text-neutral-500 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="truncate">
                        {locale === 'ka' ? section.titleKa : section.titleEn}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick links */}
              <div className="mt-4 p-5 bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 dark:from-[#C4735B]/20 dark:to-[#C4735B]/10 rounded-2xl border border-[#C4735B]/20 dark:border-[#C4735B]/30">
                <p className="text-sm text-[#A85A45] dark:text-[#E8956A] mb-3">
                  {t('terms.haveQuestions')}
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {t('terms.contactUs')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </aside>

          {/* Mobile TOC Toggle */}
          <button
            onClick={() => setShowMobileToc(!showMobileToc)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#C4735B] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Mobile TOC Drawer */}
          {showMobileToc && (
            <>
              <div
                className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileToc(false)}
              />
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-card rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {locale === 'ka' ? 'სარჩევი' : 'Table of Contents'}
                  </h3>
                  <button
                    onClick={() => setShowMobileToc(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-[#C4735B]/10 dark:bg-[#C4735B]/20 text-[#C4735B] dark:text-[#E8956A] font-medium'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center flex-shrink-0 ${
                        activeSection === section.id
                          ? 'bg-[#C4735B] text-white'
                          : 'bg-neutral-100 dark:bg-dark-elevated text-neutral-400'
                      }`}>
                        {index + 1}
                      </span>
                      {locale === 'ka' ? section.titleKa : section.titleEn}
                    </button>
                  ))}
                </nav>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-dark-border shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 lg:p-10 prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-6 prose-h2:text-neutral-900 dark:prose-h2:text-white
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-neutral-800 dark:prose-h3:text-neutral-100
                prose-p:text-neutral-600 dark:prose-p:text-neutral-400 prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-neutral-600 dark:prose-li:text-neutral-400 prose-li:leading-relaxed
                prose-strong:text-neutral-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-a:text-[#C4735B] dark:prose-a:text-[#E8956A] prose-a:no-underline hover:prose-a:underline
              ">

                {/* Section 1: Acceptance */}
                <section id="acceptance" className="scroll-mt-28 pb-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">1</span>
                    <h2 className="!mb-0">{t('terms.acceptanceOfTerms')}</h2>
                  </div>
                  <p>
                    {t('terms.byAccessingOrUsingThe')}
                  </p>
                  <p>
                    {t('terms.theseTermsConstituteALegally')}
                  </p>
                </section>

                {/* Section 2: Eligibility */}
                <section id="eligibility" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">2</span>
                    <h2 className="!mb-0">{t('terms.eligibility')}</h2>
                  </div>
                  <p>
                    {t('terms.toUseHomicoYouMust')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.beAtLeast18Years')}</li>
                    <li>{t('terms.haveTheLegalCapacityTo')}</li>
                    <li>{t('terms.provideAccurateAndCompleteInformation')}</li>
                    <li>{t('terms.complyWithGeorgianLawAnd')}</li>
                  </ul>
                </section>

                {/* Section 3: Account */}
                <section id="account" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">3</span>
                    <h2 className="!mb-0">{t('terms.accountRegistration')}</h2>
                  </div>
                  <p>
                    {t('terms.whenCreatingAnAccountYou')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.maintainingTheSecurityOfYour')}</li>
                    <li>{t('terms.keepingYourPasswordConfidential')}</li>
                    <li>{t('terms.allActivitiesThatOccurUnder')}</li>
                    <li>{t('terms.updatingYourAccountInformationAs')}</li>
                  </ul>
                  <p className="mt-4">
                    {t('terms.youMustImmediatelyNotifyUs')}
                  </p>
                </section>

                {/* Section 4: Services */}
                <section id="services" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">4</span>
                    <h2 className="!mb-0">{t('terms.platformServices')}</h2>
                  </div>
                  <p>
                    {t('terms.homicoIsAPlatformThat')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.searchAndBrowseProfessionalProfiles')}</li>
                    <li>{t('terms.postProjectsAndReceiveProposals')}</li>
                    <li>{t('terms.directCommunicationBetweenUsers')}</li>
                    <li>{t('terms.ratingsAndReviewsSystem')}</li>
                  </ul>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <p className="text-sm text-amber-800 dark:text-amber-300 !mb-0">
                      <strong>{t('terms.important')}</strong> {t('terms.homicoIsNotADirect')}
                    </p>
                  </div>
                </section>

                {/* Section 5: Professionals */}
                <section id="professionals" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">5</span>
                    <h2 className="!mb-0">{t('terms.professionalUsers')}</h2>
                  </div>
                  <p>
                    {t('terms.byRegisteringAsAProfessional')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.youHaveAppropriateQualificationsAnd')}</li>
                    <li>{t('terms.youHoldAllNecessaryLicenses')}</li>
                    <li>{t('terms.youWillProvideQualityServices')}</li>
                    <li>{t('terms.youWillRespondToClient')}</li>
                  </ul>

                  <div className="mt-8 p-5 bg-neutral-50 dark:bg-dark-elevated rounded-xl border border-neutral-100 dark:border-dark-border">
                    <h3 className="!mt-0 flex items-center gap-2 text-base font-semibold text-neutral-800 dark:text-neutral-200">
                      <svg className="w-5 h-5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                      {t('terms.professionalObligations')}
                    </h3>
                    <ul className="!mb-0 list-none pl-0 space-y-2 mt-4">
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4735B] mt-1.5 flex-shrink-0"></span>
                        {t('terms.provideAccuratePortfolioAndExperience')}
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4735B] mt-1.5 flex-shrink-0"></span>
                        {t('terms.honorAgreeduponTermsAndConditions')}
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C4735B] mt-1.5 flex-shrink-0"></span>
                        {t('terms.maintainProfessionalConductStandards')}
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 6: Clients */}
                <section id="clients" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">6</span>
                    <h2 className="!mb-0">{t('terms.clientUsers')}</h2>
                  </div>
                  <p>
                    {t('terms.byRegisteringAsAClient')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.provideAccurateProjectInformation')}</li>
                    <li>{t('terms.treatProfessionalsWithRespect')}</li>
                    <li>{t('terms.makeAgreedPaymentsOnTime')}</li>
                    <li>{t('terms.provideFairAndHonestReviews')}</li>
                  </ul>
                </section>

                {/* Section 7: Payments */}
                <section id="payments" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">7</span>
                    <h2 className="!mb-0">{t('terms.paymentsFees')}</h2>
                  </div>
                  <p>
                    {t('terms.homicoapossPaymentPoliciesInclude')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.paymentsAreMadeDirectlyBetween')}</li>
                    <li>{t('terms.premiumSubscriptionFeesAreNonrefundable')}</li>
                    <li>{t('terms.pricesAreListedInGeorgian')}</li>
                  </ul>
                  <p className="mt-4">
                    {t('terms.homicoIsNotResponsibleFor')}
                  </p>
                </section>

                {/* Section 8: Content */}
                <section id="content" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">8</span>
                    <h2 className="!mb-0">{t('terms.userContent')}</h2>
                  </div>
                  <p>
                    {t('terms.byPostingContentOnThe')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.retainOwnershipOfYourContent')}</li>
                    <li>{t('terms.grantUsALicenseTo')}</li>
                    <li>{t('terms.warrantThatTheContentDoes')}</li>
                  </ul>
                  <p className="mt-4">
                    {t('terms.homicoReservesTheRightTo')}
                  </p>
                </section>

                {/* Section 9: Prohibited */}
                <section id="prohibited" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">9</span>
                    <h2 className="!mb-0">{t('terms.prohibitedConduct')}</h2>
                  </div>
                  <p>
                    {t('terms.whenUsingThePlatformYou')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.spreadFalseOrMisleadingInformation')}</li>
                    <li>{t('terms.harassOrDiscriminateAgainstOther')}</li>
                    <li>{t('terms.sendSpamOrUnsolicitedMessages')}</li>
                    <li>{t('terms.attemptToBreachPlatformSecurity')}</li>
                    <li>{t('terms.createFakeAccounts')}</li>
                    <li>{t('terms.engageInIllegalActivities')}</li>
                    <li>{t('terms.manipulateRatingsOrReviews')}</li>
                  </ul>
                </section>

                {/* Section 10: Liability */}
                <section id="liability" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">10</span>
                    <h2 className="!mb-0">{t('terms.limitationOfLiability')}</h2>
                  </div>
                  <p>
                    {t('terms.homicoOperatesAsAnIntermediary')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.qualityOfServicesProvidedBy')}</li>
                    <li>{t('terms.disputesArisingBetweenUsers')}</li>
                    <li>{t('terms.thirdpartyWebsitesOrServices')}</li>
                    <li>{t('terms.platformAvailabilityInterruptions')}</li>
                  </ul>
                  <div className="mt-6 p-4 bg-neutral-100 dark:bg-dark-elevated rounded-xl">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 !mb-0">
                      {t('terms.toTheExtentPermittedBy')}
                    </p>
                  </div>
                </section>

                {/* Section 11: Termination */}
                <section id="termination" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">11</span>
                    <h2 className="!mb-0">{t('terms.termination')}</h2>
                  </div>
                  <p>
                    {t('terms.homicoReservesTheRightTo')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.youViolateTheseTermsOf')}</li>
                    <li>{t('terms.yourActionsHarmThePlatform')}</li>
                    <li>{t('terms.weSuspectFraudulentActivity')}</li>
                  </ul>
                  <p className="mt-4">
                    {t('terms.youMayCancelYourAccount')}
                  </p>
                </section>

                {/* Section 12: Changes */}
                <section id="changes" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">12</span>
                    <h2 className="!mb-0">{t('terms.changesToTerms')}</h2>
                  </div>
                  <p>
                    {t('terms.homicoReservesTheRightTo')}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('terms.weWillPostUpdatedTerms')}</li>
                    <li>{t('terms.weWillNotifyYouVia')}</li>
                    <li>{t('terms.weWillGiveYouReasonable')}</li>
                  </ul>
                  <p className="mt-4">
                    {t('terms.continuedUseOfThePlatform')}
                  </p>
                </section>

                {/* Section 13: Contact */}
                <section id="contact" className="scroll-mt-28 pt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">13</span>
                    <h2 className="!mb-0">{t('terms.contactInformation')}</h2>
                  </div>
                  <p>
                    {t('terms.forQuestionsRegardingTheseTerms')}
                  </p>
                  <div className="mt-4 p-6 bg-gradient-to-br from-[#C4735B]/10 to-[#C4735B]/5 dark:from-[#C4735B]/20 dark:to-[#C4735B]/10 rounded-xl border border-[#C4735B]/20 dark:border-[#C4735B]/30">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C4735B] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 !mb-0">{t('common.email')}</p>
                          <a href="mailto:info@homico.ge" className="font-medium">info@homico.ge</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#C4735B] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 !mb-0">{t('common.address')}</p>
                          <p className="font-medium !mb-0">{t('terms.tbilisiGeorgia')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>

            {/* Footer navigation */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white/60 dark:bg-dark-card/60 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-dark-border">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('terms.alsoSee')}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {t('terms.privacyPolicy')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {t('terms.helpCenter')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

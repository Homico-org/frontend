'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Clock, FileText, Mail, MapPin, Menu, Shield, X } from 'lucide-react';
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
  const { t, pick } = useLanguage();
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
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08]" />
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
              <FileText className="w-4 h-4" strokeWidth={1.5} />
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
              <Clock className="w-4 h-4" strokeWidth={1.5} />
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
              <div className="bg-[var(--hm-bg-elevated)]/70 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)] p-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--hm-fg-muted)] mb-4">
                  {t('terms.tableOfContents')}
                </h3>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full justify-start text-left px-3 py-2 h-auto rounded-lg text-sm flex items-center gap-3 group ${
                        activeSection === section.id
                          ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium hover:bg-[var(--hm-brand-500)]/15'
                          : 'text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-page)] hover:text-[var(--hm-fg-primary)]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                        activeSection === section.id
                          ? 'bg-[var(--hm-brand-500)] text-white'
                          : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] group-hover:bg-[var(--hm-n-200)]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="truncate">
                        {pick({ en: section.titleEn, ka: section.titleKa })}
                      </span>
                    </Button>
                  ))}
                </nav>
              </div>

              {/* Quick links */}
              <div className="mt-4 p-5 bg-gradient-to-br from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 rounded-2xl border border-[var(--hm-brand-500)]/20">
                <p className="text-sm text-[#A92B08] mb-3">
                  {t('terms.haveQuestions')}
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--hm-brand-500)] hover:text-[#A92B08] transition-colors"
                >
                  {t('terms.contactUs')}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Mobile TOC Toggle */}
          <Button
            size="icon"
            onClick={() => setShowMobileToc(!showMobileToc)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label={t('terms.tableOfContents')}
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </Button>

          {/* Mobile TOC Drawer */}
          {showMobileToc && (
            <>
              <div
                className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileToc(false)}
              />
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--hm-bg-elevated)] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)]">
                    {t('terms.tableOfContents')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowMobileToc(false)}
                    className="w-8 h-8 rounded-full bg-[var(--hm-bg-tertiary)]"
                    aria-label={t('common.close')}
                  >
                    <X className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                  </Button>
                </div>
                <nav className="space-y-1">
                  {sections.map((section, index) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full justify-start text-left px-4 py-3 h-auto rounded-xl text-sm flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium hover:bg-[var(--hm-brand-500)]/15'
                          : 'text-[var(--hm-fg-secondary)]'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center flex-shrink-0 ${
                        activeSection === section.id
                          ? 'bg-[var(--hm-brand-500)] text-white'
                          : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                      }`}>
                        {index + 1}
                      </span>
                      {pick({ en: section.titleEn, ka: section.titleKa })}
                    </Button>
                  ))}
                </nav>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-[var(--hm-bg-elevated)]/80 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)] shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 lg:p-10 prose prose-neutral max-w-none
                prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-0 prose-h2:mb-6 prose-h2:text-[var(--hm-fg-primary)]
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-[var(--hm-fg-primary)]
                prose-p:text-[var(--hm-fg-secondary)] prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-[var(--hm-fg-secondary)] prose-li:leading-relaxed
                prose-strong:text-[var(--hm-fg-primary)] prose-strong:font-semibold
                prose-a:text-[var(--hm-brand-500)] prose-a:no-underline hover:prose-a:underline
              ">

                {/* Section 1: Acceptance */}
                <section id="acceptance" className="scroll-mt-28 pb-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">1</span>
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
                <section id="eligibility" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">2</span>
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
                <section id="account" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">3</span>
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
                <section id="services" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">4</span>
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
                  <div className="mt-6 p-4 bg-[var(--hm-warning-50)]/20 rounded-xl border border-amber-200">
                    <p className="text-sm text-[var(--hm-warning-500)] !mb-0">
                      <strong>{t('terms.important')}</strong> {t('terms.homicoIsNotADirect')}
                    </p>
                  </div>
                </section>

                {/* Section 5: Professionals */}
                <section id="professionals" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">5</span>
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

                  <div className="mt-8 p-5 bg-[var(--hm-bg-page)] rounded-xl border border-[var(--hm-border-subtle)]">
                    <h3 className="!mt-0 flex items-center gap-2 text-base font-semibold text-[var(--hm-fg-primary)]">
                      <Shield className="w-5 h-5 text-[var(--hm-brand-500)]" strokeWidth={1.5} />
                      {t('terms.professionalObligations')}
                    </h3>
                    <ul className="!mb-0 list-none pl-0 space-y-2 mt-4">
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-brand-500)] mt-1.5 flex-shrink-0"></span>
                        {t('terms.provideAccuratePortfolioAndExperience')}
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-brand-500)] mt-1.5 flex-shrink-0"></span>
                        {t('terms.honorAgreeduponTermsAndConditions')}
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--hm-brand-500)] mt-1.5 flex-shrink-0"></span>
                        {t('terms.maintainProfessionalConductStandards')}
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 6: Clients */}
                <section id="clients" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">6</span>
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
                <section id="payments" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">7</span>
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
                <section id="content" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">8</span>
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
                <section id="prohibited" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">9</span>
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
                <section id="liability" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">10</span>
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
                  <div className="mt-6 p-4 bg-[var(--hm-bg-tertiary)] rounded-xl">
                    <p className="text-sm text-[var(--hm-fg-secondary)] !mb-0">
                      {t('terms.toTheExtentPermittedBy')}
                    </p>
                  </div>
                </section>

                {/* Section 11: Termination */}
                <section id="termination" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">11</span>
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
                <section id="changes" className="scroll-mt-28 py-10 border-b border-[var(--hm-border-subtle)]">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">12</span>
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
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">13</span>
                    <h2 className="!mb-0">{t('terms.contactInformation')}</h2>
                  </div>
                  <p>
                    {t('terms.forQuestionsRegardingTheseTerms')}
                  </p>
                  <div className="mt-4 p-6 bg-gradient-to-br from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 rounded-xl border border-[var(--hm-brand-500)]/20">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{t('common.email')}</p>
                          <a href="mailto:info@homico.ge" className="font-medium">info@homico.ge</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{t('common.address')}</p>
                          <p className="font-medium !mb-0">{t('terms.tbilisiGeorgia')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>

            {/* Footer navigation */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[var(--hm-bg-elevated)]/60 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)]">
              <p className="text-sm text-[var(--hm-fg-muted)]">
                {t('terms.alsoSee')}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--hm-brand-500)] hover:text-[#A92B08] transition-colors"
                >
                  {t('terms.privacyPolicy')}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--hm-brand-500)] hover:text-[#A92B08] transition-colors"
                >
                  {t('terms.helpCenter')}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

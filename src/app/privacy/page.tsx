'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Table of contents sections
const sections = [
  { id: 'introduction', titleEn: 'Introduction', titleKa: 'შესავალი' },
  { id: 'collection', titleEn: 'Information We Collect', titleKa: 'შეგროვებული ინფორმაცია' },
  { id: 'usage', titleEn: 'How We Use Information', titleKa: 'ინფორმაციის გამოყენება' },
  { id: 'sharing', titleEn: 'Information Sharing', titleKa: 'ინფორმაციის გაზიარება' },
  { id: 'cookies', titleEn: 'Cookies & Tracking', titleKa: 'Cookies და თვალყურის დევნება' },
  { id: 'security', titleEn: 'Data Security', titleKa: 'მონაცემების უსაფრთხოება' },
  { id: 'retention', titleEn: 'Data Retention', titleKa: 'მონაცემების შენახვა' },
  { id: 'rights', titleEn: 'Your Rights', titleKa: 'თქვენი უფლებები' },
  { id: 'children', titleEn: 'Children\'s Privacy', titleKa: 'ბავშვთა კონფიდენციალურობა' },
  { id: 'international', titleEn: 'International Transfers', titleKa: 'საერთაშორისო გადაცემები' },
  { id: 'changes', titleEn: 'Policy Changes', titleKa: 'პოლიტიკის ცვლილებები' },
  { id: 'contact', titleEn: 'Contact Us', titleKa: 'დაგვიკავშირდით' },
];

export default function PrivacyPage() {
  const { locale } = useLanguage();
  const [activeSection, setActiveSection] = useState('introduction');
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

  const lastUpdated = locale === 'ka' ? '21 დეკემბერი, 2024' : 'December 21, 2024';

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
            {/* Shield icon badge */}
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              {locale === 'ka' ? 'კონფიდენციალურობა' : 'Your Privacy Matters'}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {locale === 'ka' ? 'კონფიდენციალურობის პოლიტიკა' : 'Privacy Policy'}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6">
              {locale === 'ka'
                ? 'გაიგეთ, როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს პერსონალურ მონაცემებს.'
                : 'Learn how we collect, use, and protect your personal information.'}
            </p>

            {/* Last updated badge */}
            <div className="inline-flex items-center gap-2 text-sm text-white/50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {locale === 'ka' ? 'ბოლო განახლება:' : 'Last updated:'} {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-10">

          {/* Table of Contents - Fixed Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="fixed top-28 w-64">
              <div className="bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm rounded-2xl border border-neutral-100 dark:border-dark-border p-5 max-h-[calc(100vh-180px)] overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                  {locale === 'ka' ? 'სარჩევი' : 'Table of Contents'}
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
                  {locale === 'ka' ? 'კითხვები გაქვთ?' : 'Have questions?'}
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {locale === 'ka' ? 'დაგვიკავშირდით' : 'Contact us'}
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

                {/* Section 1: Introduction */}
                <section id="introduction" className="scroll-mt-28 pb-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">1</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'შესავალი' : 'Introduction'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'Homico.ge-ში ჩვენ ვაფასებთ თქვენს კონფიდენციალურობას. ეს პოლიტიკა აღწერს, თუ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს პერსონალურ ინფორმაციას.'
                      : 'At Homico.ge, we value your privacy. This policy describes how we collect, use, and protect your personal information.'}
                  </p>
                  <p>
                    {locale === 'ka'
                      ? 'ჩვენი პლატფორმის გამოყენებით, თქვენ ეთანხმებით ამ კონფიდენციალურობის პოლიტიკაში აღწერილ პრაქტიკას.'
                      : 'By using our platform, you agree to the practices described in this Privacy Policy.'}
                  </p>
                </section>

                {/* Section 2: Collection */}
                <section id="collection" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">2</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'შეგროვებული ინფორმაცია' : 'Information We Collect'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'ჩვენ ვაგროვებთ შემდეგი ტიპის ინფორმაციას:'
                      : 'We collect the following types of information:'}
                  </p>

                  <h3>{locale === 'ka' ? 'პირადი ინფორმაცია' : 'Personal Information'}</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'სახელი და გვარი' : 'Name and surname'}</li>
                    <li>{locale === 'ka' ? 'ელექტრონული ფოსტის მისამართი' : 'Email address'}</li>
                    <li>{locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone number'}</li>
                    <li>{locale === 'ka' ? 'მისამართი და ადგილმდებარეობა' : 'Address and location'}</li>
                    <li>{locale === 'ka' ? 'პროფილის ფოტო' : 'Profile photo'}</li>
                  </ul>

                  <h3>{locale === 'ka' ? 'პროფესიონალური ინფორმაცია' : 'Professional Information'}</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'სამუშაო გამოცდილება და პორტფოლიო' : 'Work experience and portfolio'}</li>
                    <li>{locale === 'ka' ? 'კვალიფიკაცია და სერთიფიკატები' : 'Qualifications and certifications'}</li>
                    <li>{locale === 'ka' ? 'შეფასებები და მიმოხილვები' : 'Ratings and reviews'}</li>
                  </ul>

                  <h3>{locale === 'ka' ? 'ტექნიკური ინფორმაცია' : 'Technical Information'}</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'IP მისამართი' : 'IP address'}</li>
                    <li>{locale === 'ka' ? 'ბრაუზერის ტიპი და ვერსია' : 'Browser type and version'}</li>
                    <li>{locale === 'ka' ? 'მოწყობილობის ინფორმაცია' : 'Device information'}</li>
                    <li>{locale === 'ka' ? 'გამოყენების მონაცემები' : 'Usage data'}</li>
                  </ul>
                </section>

                {/* Section 3: Usage */}
                <section id="usage" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">3</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'ინფორმაციის გამოყენება' : 'How We Use Information'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენს ინფორმაციას ვიყენებთ შემდეგი მიზნებისთვის:'
                      : 'We use your information for the following purposes:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'ანგარიშის შექმნა და მართვა' : 'Account creation and management'}</li>
                    <li>{locale === 'ka' ? 'კლიენტებისა და პროფესიონალების დაკავშირება' : 'Connecting clients with professionals'}</li>
                    <li>{locale === 'ka' ? 'კომუნიკაციის უზრუნველყოფა' : 'Facilitating communication'}</li>
                    <li>{locale === 'ka' ? 'პლატფორმის გაუმჯობესება' : 'Improving the platform'}</li>
                    <li>{locale === 'ka' ? 'მხარდაჭერის სერვისების მიწოდება' : 'Providing support services'}</li>
                    <li>{locale === 'ka' ? 'თაღლითობის პრევენცია' : 'Fraud prevention'}</li>
                    <li>{locale === 'ka' ? 'იურიდიული ვალდებულებების შესრულება' : 'Legal compliance'}</li>
                  </ul>
                </section>

                {/* Section 4: Sharing */}
                <section id="sharing" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">4</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'ინფორმაციის გაზიარება' : 'Information Sharing'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენს ინფორმაციას შეიძლება გავუზიაროთ:'
                      : 'We may share your information with:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'სხვა მომხმარებლებს (თქვენი თანხმობით)' : 'Other users (with your consent)'}</li>
                    <li>{locale === 'ka' ? 'სერვის პროვაიდერებს (ტექნიკური მხარდაჭერისთვის)' : 'Service providers (for technical support)'}</li>
                    <li>{locale === 'ka' ? 'სამართალდამცავ ორგანოებს (კანონის მოთხოვნით)' : 'Law enforcement (when required by law)'}</li>
                  </ul>
                  <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 !mb-0">
                      <strong>{locale === 'ka' ? 'დაცვა:' : 'Protection:'}</strong> {locale === 'ka'
                        ? 'ჩვენ არასოდეს ვყიდით თქვენს პერსონალურ ინფორმაციას მესამე პირებს.'
                        : 'We never sell your personal information to third parties.'}
                    </p>
                  </div>
                </section>

                {/* Section 5: Cookies */}
                <section id="cookies" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">5</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'Cookies და თვალყურის დევნება' : 'Cookies & Tracking'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'ჩვენ ვიყენებთ cookies და მსგავს ტექნოლოგიებს:'
                      : 'We use cookies and similar technologies for:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'სესიის მართვა და ავტორიზაცია' : 'Session management and authentication'}</li>
                    <li>{locale === 'ka' ? 'თქვენი პრეფერენციების შენახვა' : 'Storing your preferences'}</li>
                    <li>{locale === 'ka' ? 'ანალიტიკა და გაუმჯობესება' : 'Analytics and improvements'}</li>
                    <li>{locale === 'ka' ? 'უსაფრთხოების უზრუნველყოფა' : 'Security purposes'}</li>
                  </ul>
                  <p className="mt-4">
                    {locale === 'ka'
                      ? 'თქვენ შეგიძლიათ მართოთ cookie პარამეტრები თქვენი ბრაუზერის მეშვეობით.'
                      : 'You can manage cookie settings through your browser.'}
                  </p>
                </section>

                {/* Section 6: Security */}
                <section id="security" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">6</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'მონაცემების უსაფრთხოება' : 'Data Security'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენი მონაცემების დაცვისთვის ვიყენებთ:'
                      : 'We protect your data using:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'SSL/TLS დაშიფვრა' : 'SSL/TLS encryption'}</li>
                    <li>{locale === 'ka' ? 'უსაფრთხო სერვერები' : 'Secure servers'}</li>
                    <li>{locale === 'ka' ? 'რეგულარული უსაფრთხოების აუდიტი' : 'Regular security audits'}</li>
                    <li>{locale === 'ka' ? 'წვდომის კონტროლი' : 'Access controls'}</li>
                  </ul>
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <p className="text-sm text-amber-800 dark:text-amber-300 !mb-0">
                      <strong>{locale === 'ka' ? 'შენიშვნა:' : 'Note:'}</strong> {locale === 'ka'
                        ? 'მიუხედავად ჩვენი მცდელობებისა, ინტერნეტით გადაცემა 100% უსაფრთხო არ არის.'
                        : 'Despite our efforts, no internet transmission is 100% secure.'}
                    </p>
                  </div>
                </section>

                {/* Section 7: Retention */}
                <section id="retention" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">7</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'მონაცემების შენახვა' : 'Data Retention'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენს მონაცემებს ვინახავთ:'
                      : 'We retain your data:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'ანგარიშის მონაცემები - ანგარიშის აქტიურობის განმავლობაში' : 'Account data - while account is active'}</li>
                    <li>{locale === 'ka' ? 'ტრანზაქციის ისტორია - 5 წელი' : 'Transaction history - 5 years'}</li>
                    <li>{locale === 'ka' ? 'კომუნიკაციის ჩანაწერები - 2 წელი' : 'Communication records - 2 years'}</li>
                  </ul>
                  <p className="mt-4">
                    {locale === 'ka'
                      ? 'ანგარიშის წაშლის შემდეგ, თქვენი მონაცემები წაიშლება 30 დღის განმავლობაში.'
                      : 'After account deletion, your data will be removed within 30 days.'}
                  </p>
                </section>

                {/* Section 8: Rights */}
                <section id="rights" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">8</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'თქვენი უფლებები' : 'Your Rights'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენ გაქვთ შემდეგი უფლებები:'
                      : 'You have the following rights:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'წვდომა თქვენს მონაცემებზე' : 'Access your data'}</li>
                    <li>{locale === 'ka' ? 'მონაცემების შესწორება' : 'Correct your data'}</li>
                    <li>{locale === 'ka' ? 'მონაცემების წაშლა' : 'Delete your data'}</li>
                    <li>{locale === 'ka' ? 'მონაცემების გადატანა' : 'Data portability'}</li>
                    <li>{locale === 'ka' ? 'დამუშავების შეზღუდვა' : 'Restrict processing'}</li>
                    <li>{locale === 'ka' ? 'წინააღმდეგობის გამოთქმა' : 'Object to processing'}</li>
                  </ul>
                  <p className="mt-4">
                    {locale === 'ka'
                      ? 'ამ უფლებების გამოსაყენებლად დაგვიკავშირდით ელ-ფოსტით.'
                      : 'To exercise these rights, contact us by email.'}
                  </p>
                </section>

                {/* Section 9: Children */}
                <section id="children" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">9</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'ბავშვთა კონფიდენციალურობა' : 'Children\'s Privacy'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'Homico არ არის განკუთვნილი 18 წელზე ნაკლები ასაკის პირებისთვის. ჩვენ შეგნებულად არ ვაგროვებთ არასრულწლოვანთა მონაცემებს.'
                      : 'Homico is not intended for individuals under 18 years of age. We do not knowingly collect data from minors.'}
                  </p>
                  <p>
                    {locale === 'ka'
                      ? 'თუ აღმოვაჩენთ, რომ შემთხვევით შევაგროვეთ არასრულწლოვანის მონაცემები, ისინი დაუყოვნებლივ წაიშლება.'
                      : 'If we discover that we have inadvertently collected data from a minor, it will be deleted immediately.'}
                  </p>
                </section>

                {/* Section 10: International */}
                <section id="international" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">10</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'საერთაშორისო გადაცემები' : 'International Transfers'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'თქვენი მონაცემები შეიძლება დამუშავდეს საქართველოს ფარგლებს გარეთ. ასეთ შემთხვევებში:'
                      : 'Your data may be processed outside of Georgia. In such cases:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'ვუზრუნველყოფთ ადეკვატურ დაცვას' : 'We ensure adequate protection'}</li>
                    <li>{locale === 'ka' ? 'ვიყენებთ სტანდარტულ ხელშეკრულების პირობებს' : 'We use standard contractual clauses'}</li>
                    <li>{locale === 'ka' ? 'ვმუშაობთ მხოლოდ სანდო პარტნიორებთან' : 'We work only with trusted partners'}</li>
                  </ul>
                </section>

                {/* Section 11: Changes */}
                <section id="changes" className="scroll-mt-28 py-10 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">11</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'პოლიტიკის ცვლილებები' : 'Policy Changes'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'ჩვენ შეიძლება პერიოდულად განვაახლოთ ეს პოლიტიკა. ცვლილებების შემთხვევაში:'
                      : 'We may update this policy periodically. When changes are made:'}
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{locale === 'ka' ? 'გამოვაქვეყნებთ განახლებულ ვერსიას' : 'We will post the updated version'}</li>
                    <li>{locale === 'ka' ? 'განვაახლებთ "ბოლო განახლების" თარიღს' : 'We will update the "last updated" date'}</li>
                    <li>{locale === 'ka' ? 'მნიშვნელოვანი ცვლილებებისას შეგატყობინებთ' : 'We will notify you of significant changes'}</li>
                  </ul>
                </section>

                {/* Section 12: Contact */}
                <section id="contact" className="scroll-mt-28 pt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[#C4735B] text-white text-sm font-semibold flex items-center justify-center">12</span>
                    <h2 className="!mb-0">{locale === 'ka' ? 'დაგვიკავშირდით' : 'Contact Us'}</h2>
                  </div>
                  <p>
                    {locale === 'ka'
                      ? 'კონფიდენციალურობასთან დაკავშირებული კითხვებისთვის დაგვიკავშირდით:'
                      : 'For privacy-related questions, contact us:'}
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
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 !mb-0">{locale === 'ka' ? 'ელ-ფოსტა' : 'Email'}</p>
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
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 !mb-0">{locale === 'ka' ? 'მისამართი' : 'Address'}</p>
                          <p className="font-medium !mb-0">{locale === 'ka' ? 'თბილისი, საქართველო' : 'Tbilisi, Georgia'}</p>
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
                {locale === 'ka' ? 'ასევე იხილეთ:' : 'Also see:'}
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {locale === 'ka' ? 'მომსახურების პირობები' : 'Terms of Service'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C4735B] dark:text-[#E8956A] hover:text-[#A85A45] dark:hover:text-[#F0A070] transition-colors"
                >
                  {locale === 'ka' ? 'დახმარების ცენტრი' : 'Help Center'}
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

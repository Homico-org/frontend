'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useState } from 'react';

type UserType = 'client' | 'pro';

export default function HowItWorksPage() {
  const { t, locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<UserType>('client');

  const clientSteps = [
    {
      number: 1,
      titleEn: 'Post Your Project',
      titleKa: 'განათავსეთ პროექტი',
      descriptionEn: 'Describe what you need done, set your budget, and add photos if helpful. It takes just a few minutes.',
      descriptionKa: 'აღწერეთ რა გჭირდებათ, დააყენეთ ბიუჯეტი და დაამატეთ ფოტოები. ამას მხოლოდ რამდენიმე წუთი სჭირდება.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      number: 2,
      titleEn: 'Receive Proposals',
      titleKa: 'მიიღეთ შეთავაზებები',
      descriptionEn: 'Qualified professionals will send you proposals with their price, timeline, and approach to your project.',
      descriptionKa: 'კვალიფიციური პროფესიონალები გამოგიგზავნიან შეთავაზებებს ფასით, ვადებით და მიდგომით თქვენი პროექტისადმი.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      number: 3,
      titleEn: 'Review & Compare',
      titleKa: 'შეადარეთ და აირჩიეთ',
      descriptionEn: 'Browse professional profiles, check reviews, view portfolios, and chat to find the perfect match.',
      descriptionKa: 'დაათვალიერეთ პროფილები, შეამოწმეთ შეფასებები, ნახეთ პორტფოლიო და დაუკავშირდით საუკეთესოს მოსაძებნად.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: 4,
      titleEn: 'Hire Your Pro',
      titleKa: 'დაიქირავეთ პროფესიონალი',
      descriptionEn: 'Choose the professional you like best and start working together. Contact them directly to discuss details.',
      descriptionKa: 'აირჩიეთ საუკეთესო პროფესიონალი და დაიწყეთ თანამშრომლობა. დაუკავშირდით პირდაპირ დეტალების განსახილველად.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      number: 5,
      titleEn: 'Get It Done',
      titleKa: 'დაასრულეთ პროექტი',
      descriptionEn: 'Your pro completes the work. Once satisfied, leave a review to help others find great professionals.',
      descriptionKa: 'პროფესიონალი ასრულებს სამუშაოს. კმაყოფილების შემდეგ დატოვეთ შეფასება, რათა სხვებმაც იპოვონ კარგი ხელოსნები.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  const proSteps = [
    {
      number: 1,
      titleEn: 'Create Your Profile',
      titleKa: 'შექმენით პროფილი',
      descriptionEn: 'Sign up, add your skills, experience, and portfolio. A complete profile helps clients trust you.',
      descriptionKa: 'დარეგისტრირდით, დაამატეთ უნარები, გამოცდილება და პორტფოლიო. სრული პროფილი ზრდის კლიენტების ნდობას.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      number: 2,
      titleEn: 'Get Verified',
      titleKa: 'გაიარეთ ვერიფიკაცია',
      descriptionEn: 'Upload your ID and add social links for verification. Verified pros get more trust and visibility.',
      descriptionKa: 'ატვირთეთ პირადობა და დაამატეთ სოციალური ბმულები. ვერიფიცირებული პროფესიონალები იღებენ მეტ ნდობას.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      number: 3,
      titleEn: 'Browse Jobs',
      titleKa: 'დაათვალიერეთ პროექტები',
      descriptionEn: 'Find projects matching your skills and location. Filter by category, budget, and timeline.',
      descriptionKa: 'იპოვეთ პროექტები თქვენი უნარებისა და ადგილმდებარეობის მიხედვით. გაფილტრეთ კატეგორიით, ბიუჯეტით.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: 4,
      titleEn: 'Submit Proposals',
      titleKa: 'გაგზავნეთ შეთავაზებები',
      descriptionEn: 'Send personalized proposals with your price and approach. Stand out with a compelling pitch.',
      descriptionKa: 'გაგზავნეთ პერსონალიზებული შეთავაზებები თქვენი ფასით და მიდგომით. გამოირჩიეთ დამაჯერებელი წინადადებით.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      number: 5,
      titleEn: 'Win & Deliver',
      titleKa: 'მოიგეთ და შეასრულეთ',
      descriptionEn: 'When hired, deliver quality work. Great reviews lead to more clients and a growing reputation.',
      descriptionKa: 'დაქირავების შემდეგ მიაწოდეთ ხარისხიანი სამუშაო. კარგი შეფასებები მოიტანს მეტ კლიენტს.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  const benefits = {
    client: [
      {
        titleEn: 'Free to Use',
        titleKa: 'უფასოა',
        descriptionEn: 'Posting jobs and hiring professionals is completely free for clients.',
        descriptionKa: 'პროექტების განთავსება და პროფესიონალების დაქირავება კლიენტებისთვის სრულიად უფასოა.',
      },
      {
        titleEn: 'Verified Professionals',
        titleKa: 'ვერიფიცირებული ხელოსნები',
        descriptionEn: 'Browse verified pros with real reviews and portfolio work.',
        descriptionKa: 'დაათვალიერეთ ვერიფიცირებული პროფესიონალები რეალური შეფასებებით და პორტფოლიოთი.',
      },
      {
        titleEn: 'Direct Communication',
        titleKa: 'პირდაპირი კომუნიკაცია',
        descriptionEn: 'Chat directly with pros to discuss your project and negotiate terms.',
        descriptionKa: 'დაუკავშირდით პროფესიონალებს პირდაპირ პროექტის განსახილველად და პირობების შესათანხმებლად.',
      },
    ],
    pro: [
      {
        titleEn: 'Find Local Clients',
        titleKa: 'იპოვეთ ადგილობრივი კლიენტები',
        descriptionEn: 'Get matched with clients in your area looking for your services.',
        descriptionKa: 'დაუკავშირდით კლიენტებს თქვენს რეგიონში, რომლებსაც სჭირდებათ თქვენი მომსახურება.',
      },
      {
        titleEn: 'Build Your Reputation',
        titleKa: 'ააშენეთ რეპუტაცია',
        descriptionEn: 'Collect reviews and showcase your work to attract more clients.',
        descriptionKa: 'შეაგროვეთ შეფასებები და წარმოაჩინეთ თქვენი სამუშაო მეტი კლიენტის მოსაზიდად.',
      },
      {
        titleEn: 'Grow Your Business',
        titleKa: 'გაზარდეთ ბიზნესი',
        descriptionEn: 'Expand your client base and increase your income with Homico.',
        descriptionKa: 'გააფართოეთ კლიენტთა ბაზა და გაზარდეთ შემოსავალი Homico-თ.',
      },
    ],
  };

  const steps = activeTab === 'client' ? clientSteps : proSteps;
  const currentBenefits = activeTab === 'client' ? benefits.client : benefits.pro;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A85A45]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('howItWorks.simpleFast')}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {t('howItWorks.howDoesHomicoWork')}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
              {t('howItWorks.findTrustedProfessionalsOrGet')}
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <button
                onClick={() => setActiveTab('client')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'client'
                    ? 'bg-white text-[#C4735B] shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('howItWorks.forClients')}
              </button>
              <button
                onClick={() => setActiveTab('pro')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'pro'
                    ? 'bg-white text-[#C4735B] shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('howItWorks.forProfessionals')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 sm:space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col sm:flex-row items-start gap-6 ${
                  index % 2 === 1 ? 'sm:flex-row-reverse' : ''
                }`}
              >
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C4735B] to-[#A85A45] flex items-center justify-center text-white shadow-lg shadow-[#C4735B]/20">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-dark-card shadow-md flex items-center justify-center">
                      <span className="text-sm font-bold text-[#C4735B]">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'sm:text-right' : ''}`}>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    {locale === 'ka' ? step.titleKa : step.titleEn}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {locale === 'ka' ? step.descriptionKa : step.descriptionEn}
                  </p>
                </div>

                {/* Connector Line (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 h-8 w-px bg-gradient-to-b from-[#C4735B]/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-center text-neutral-900 dark:text-white mb-12">
            {activeTab === 'client'
              ? (t('howItWorks.whyChooseHomico'))
              : (t('howItWorks.whyJoinHomico'))}
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {currentBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-neutral-100 dark:border-dark-border"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C4735B]/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {locale === 'ka' ? benefit.titleKa : benefit.titleEn}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'ka' ? benefit.descriptionKa : benefit.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white mb-4">
            {activeTab === 'client'
              ? (t('howItWorks.readyToGetStarted'))
              : (t('howItWorks.joinUsToday'))}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            {activeTab === 'client'
              ? (t('howItWorks.postYourProjectAndReceive'))
              : (t('howItWorks.createYourProfileAndStart'))}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={activeTab === 'client' ? '/post-job' : '/auth/register?type=pro'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#C4735B] to-[#A85A45] text-white font-medium shadow-lg shadow-[#C4735B]/20 hover:shadow-xl hover:shadow-[#C4735B]/30 transition-all hover:scale-105"
            >
              {activeTab === 'client'
                ? (t('howItWorks.postAProject'))
                : (t('howItWorks.registerAsPro'))}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-neutral-100 dark:bg-dark-card text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-dark-elevated transition-all"
            >
              {t('howItWorks.browseProfessionals')}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-8 border-t border-neutral-100 dark:border-dark-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            {t('howItWorks.haveQuestions')}{' '}
            <Link href="/help" className="text-[#C4735B] hover:underline font-medium">
              {t('howItWorks.checkOurFaq')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

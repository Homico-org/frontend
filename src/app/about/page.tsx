'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

// Note: For SEO, metadata is defined in layout.tsx for this route

export default function AboutPage() {
  const { locale } = useLanguage();

  const stats = [
    {
      valueEn: '1000+',
      valueKa: '1000+',
      labelEn: 'Professionals',
      labelKa: 'პროფესიონალი',
    },
    {
      valueEn: '50+',
      valueKa: '50+',
      labelEn: 'Categories',
      labelKa: 'კატეგორია',
    },
    {
      valueEn: 'Tbilisi',
      valueKa: 'თბილისი',
      labelEn: 'Service Area',
      labelKa: 'მომსახურების ზონა',
    },
    {
      valueEn: '24/7',
      valueKa: '24/7',
      labelEn: 'Support',
      labelKa: 'მხარდაჭერა',
    },
  ];

  const values = [
    {
      titleEn: 'Trust & Transparency',
      titleKa: 'ნდობა და გამჭვირვალობა',
      descriptionEn: 'We verify professionals and enable honest reviews so you can make informed decisions.',
      descriptionKa: 'ჩვენ ვამოწმებთ პროფესიონალებს და ვუზრუნველყოფთ გულწრფელ შეფასებებს ინფორმირებული გადაწყვეტილებებისთვის.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      titleEn: 'Quality First',
      titleKa: 'ხარისხი პირველ რიგში',
      descriptionEn: 'We partner with skilled professionals who take pride in their craft and deliver excellence.',
      descriptionKa: 'ჩვენ ვთანამშრომლობთ გამოცდილ პროფესიონალებთან, რომლებიც ამაყობენ თავიანთი ხელობით.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      titleEn: 'Community Focus',
      titleKa: 'საზოგადოებაზე ორიენტირება',
      descriptionEn: 'We support local professionals and help communities thrive by connecting people who need work done.',
      descriptionKa: 'ჩვენ ვუჭერთ მხარს ადგილობრივ პროფესიონალებს და ვეხმარებით საზოგადოების განვითარებას.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
    {
      titleEn: 'Innovation',
      titleKa: 'ინოვაცია',
      descriptionEn: 'We continuously improve our platform to make finding and hiring professionals easier than ever.',
      descriptionKa: 'ჩვენ მუდმივად ვაუმჯობესებთ პლატფორმას პროფესიონალების პოვნისა და დაქირავების გასამარტივებლად.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4735B] via-[#B8654D] to-[#A85A45]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_60%)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {locale === 'ka' ? 'ჩვენს შესახებ' : 'About Us'}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-6 tracking-tight">
              {locale === 'ka'
                ? 'ვაკავშირებთ ადამიანებს საუკეთესო ხელოსნებთან'
                : 'Connecting People with the Best Professionals'}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ka'
                ? 'Homico არის საქართველოს პირველი პლატფორმა, რომელიც აკავშირებს კლიენტებს ვერიფიცირებულ სახლის მომსახურების პროფესიონალებთან.'
                : 'Homico is Georgia\'s premier platform connecting clients with verified home service professionals.'}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 text-center shadow-lg border border-neutral-100 dark:border-dark-border"
              >
                <p className="text-2xl sm:text-3xl font-bold text-[#C4735B] mb-1">
                  {locale === 'ka' ? stat.valueKa : stat.valueEn}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'ka' ? stat.labelKa : stat.labelEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white mb-4">
              {locale === 'ka' ? 'ჩვენი მისია' : 'Our Mission'}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {locale === 'ka'
                ? 'ჩვენი მიზანია გავამარტივოთ სანდო პროფესიონალების პოვნა და დაქირავება საქართველოში. ვქმნით პლატფორმას, სადაც ხარისხი, ნდობა და პროფესიონალიზმი პირველ ადგილზეა.'
                : 'Our goal is to make finding and hiring trusted professionals in Georgia simple and reliable. We\'re building a platform where quality, trust, and professionalism come first.'}
            </p>
          </div>

          {/* Story */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 border border-neutral-100 dark:border-dark-border">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              {locale === 'ka' ? 'ჩვენი ისტორია' : 'Our Story'}
            </h3>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {locale === 'ka'
                  ? 'Homico დაიბადა მარტივი იდეიდან: რატომ არის ასე რთული კარგი ხელოსნის პოვნა? ჩვენ შევამჩნიეთ, რომ ადამიანებს უწევთ ხანგრძლივი ძებნა, რეკომენდაციების კითხვა ნაცნობებისგან, და მაინც ხშირად რჩებოდნენ უკმაყოფილონი შედეგით.'
                  : 'Homico was born from a simple question: why is it so hard to find a good professional? We noticed people spending hours searching, asking friends for recommendations, and still often ending up disappointed with the results.'}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                {locale === 'ka'
                  ? 'ჩვენ გადავწყვიტეთ შეგვექმნა პლატფორმა, სადაც კლიენტებს შეეძლებათ მარტივად იპოვონ ვერიფიცირებული პროფესიონალები, ნახონ მათი რეალური სამუშაოები და წაიკითხონ სხვა კლიენტების შეფასებები.'
                  : 'We decided to create a platform where clients can easily find verified professionals, see their real work, and read reviews from other customers.'}
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {locale === 'ka'
                  ? 'დღეს Homico აერთიანებს ათასობით პროფესიონალს და კლიენტს თბილისში. ჩვენ ვაგრძელებთ გაუმჯობესებას, რათა ყოველი გამოცდილება იყოს უკეთესი წინაზე.'
                  : 'Today, Homico connects thousands of professionals and clients in Tbilisi. We continue improving to make every experience better than the last.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-elevated">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-center text-neutral-900 dark:text-white mb-12">
            {locale === 'ka' ? 'ჩვენი ღირებულებები' : 'Our Values'}
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-neutral-100 dark:border-dark-border"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {locale === 'ka' ? value.titleKa : value.titleEn}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {locale === 'ka' ? value.descriptionKa : value.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-medium text-neutral-900 dark:text-white mb-4">
            {locale === 'ka' ? 'დაგვიკავშირდით' : 'Get in Touch'}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            {locale === 'ka'
              ? 'გაქვთ კითხვები ან წინადადებები? სიამოვნებით მოგისმენთ.'
              : 'Have questions or suggestions? We\'d love to hear from you.'}
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a
              href="mailto:info@homico.ge"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C4735B]/10 text-[#C4735B] font-medium hover:bg-[#C4735B]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              info@homico.ge
            </a>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-dark-card text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-dark-elevated transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              {locale === 'ka' ? 'დახმარების ცენტრი' : 'Help Center'}
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-dark-border">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {locale === 'ka' ? 'თბილისი, საქართველო' : 'Tbilisi, Georgia'}
            </p>
          </div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="py-8 border-t border-neutral-100 dark:border-dark-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
            <Link href="/terms" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {locale === 'ka' ? 'მომსახურების პირობები' : 'Terms of Service'}
            </Link>
            <Link href="/privacy" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {locale === 'ka' ? 'კონფიდენციალურობა' : 'Privacy Policy'}
            </Link>
            <Link href="/how-it-works" className="text-neutral-600 dark:text-neutral-400 hover:text-[#C4735B] transition-colors">
              {locale === 'ka' ? 'როგორ მუშაობს' : 'How it Works'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

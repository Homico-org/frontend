'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { StatCard, FeatureCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Mail, HelpCircle, Shield, Star, Users, Lightbulb } from 'lucide-react';

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
      icon: <Shield className="w-5 h-5" />,
    },
    {
      titleEn: 'Quality First',
      titleKa: 'ხარისხი პირველ რიგში',
      descriptionEn: 'We partner with skilled professionals who take pride in their craft and deliver excellence.',
      descriptionKa: 'ჩვენ ვთანამშრომლობთ გამოცდილ პროფესიონალებთან, რომლებიც ამაყობენ თავიანთი ხელობით.',
      icon: <Star className="w-5 h-5" />,
    },
    {
      titleEn: 'Community Focus',
      titleKa: 'საზოგადოებაზე ორიენტირება',
      descriptionEn: 'We support local professionals and help communities thrive by connecting people who need work done.',
      descriptionKa: 'ჩვენ ვუჭერთ მხარს ადგილობრივ პროფესიონალებს და ვეხმარებით საზოგადოების განვითარებას.',
      icon: <Users className="w-5 h-5" />,
    },
    {
      titleEn: 'Innovation',
      titleKa: 'ინოვაცია',
      descriptionEn: 'We continuously improve our platform to make finding and hiring professionals easier than ever.',
      descriptionKa: 'ჩვენ მუდმივად ვაუმჯობესებთ პლატფორმას პროფესიონალების პოვნისა და დაქირავების გასამარტივებლად.',
      icon: <Lightbulb className="w-5 h-5" />,
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
              <StatCard
                key={index}
                value={locale === 'ka' ? stat.valueKa : stat.valueEn}
                label={locale === 'ka' ? stat.labelKa : stat.labelEn}
              />
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
              <FeatureCard
                key={index}
                title={locale === 'ka' ? value.titleKa : value.titleEn}
                description={locale === 'ka' ? value.descriptionKa : value.descriptionEn}
                icon={value.icon}
              />
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
            <Button
              variant="premium"
              size="lg"
              asChild
            >
              <a href="mailto:info@homico.ge" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                info@homico.ge
              </a>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              asChild
            >
              <Link href="/help" className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {locale === 'ka' ? 'დახმარების ცენტრი' : 'Help Center'}
              </Link>
            </Button>
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

'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ReceiptText } from 'lucide-react';
import Link from 'next/link';

/**
 * Public refund policy. Covers the ONLY thing Homico charges for: the Premium
 * subscription (Pro / Super Pro). Homico does not process payments for
 * renovation work - those are arranged directly between client and pro - so
 * there is no booking/escrow refund flow here. Keep in sync with the premium
 * cancel flow (POST /payments/premium/cancel + isPremiumRefundable).
 */
export default function RefundPolicyPage() {
  const { pick } = useLanguage();
  const lastUpdated = pick({ en: 'June 2026', ka: '2026 წლის ივნისი', ru: 'Июнь 2026 г.' });

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
            <ReceiptText className="w-4 h-4" strokeWidth={1.5} />
            {pick({ en: 'Refund Policy', ka: 'დაბრუნების პოლიტიკა', ru: 'Политика возврата' })}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
            {pick({ en: 'Refund Policy', ka: 'თანხის დაბრუნების პოლიტიკა', ru: 'Политика возврата средств' })}
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6">
            {pick({
              en: 'How refunds work for the Homico Premium subscription.',
              ka: 'როგორ ხდება თანხის დაბრუნება Homico Premium გამოწერაზე.',
              ru: 'Как работает возврат средств за подписку Homico Premium.',
            })}
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-white/50">
            <Clock className="w-4 h-4" strokeWidth={1.5} />
            {pick({ en: 'Last updated:', ka: 'ბოლო განახლება:', ru: 'Обновлено:' })} {lastUpdated}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <article
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)] shadow-sm
            p-6 sm:p-8 lg:p-10 prose prose-neutral max-w-none
            prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-[var(--hm-fg-primary)]
            prose-h2:first:mt-0
            prose-p:text-[var(--hm-fg-secondary)] prose-p:leading-relaxed
            prose-li:text-[var(--hm-fg-secondary)] prose-li:leading-relaxed
            prose-strong:text-[var(--hm-fg-primary)] prose-strong:font-semibold
            prose-a:text-[var(--hm-brand-500)] prose-a:no-underline hover:prose-a:underline"
        >
          <h2>{pick({ en: 'What this covers', ka: 'რას მოიცავს ეს პოლიტიკა', ru: 'Что охватывает эта политика' })}</h2>
          <p>
            {pick({
              en: 'This policy covers refunds for the Homico Premium subscription (Pro and Super Pro). Homico does not process payments for renovation work - those are arranged and paid directly between the client and the professional - so this policy applies only to the Premium subscription you buy from Homico.',
              ka: 'ეს პოლიტიკა მოიცავს Homico Premium გამოწერის (Pro და Super Pro) თანხის დაბრუნებას. Homico არ ამუშავებს გადახდებს სარემონტო სამუშაოზე - ისინი თანხმდება და იხდება უშუალოდ კლიენტსა და ოსტატს შორის - ამიტომ ეს პოლიტიკა ეხება მხოლოდ Homico-სგან შეძენილ Premium გამოწერას.',
              ru: 'Эта политика охватывает возврат средств за подписку Homico Premium (Pro и Super Pro). Homico не обрабатывает платежи за ремонтные работы - они согласовываются и оплачиваются напрямую между клиентом и мастером, - поэтому политика касается только подписки Premium, которую вы покупаете у Homico.',
            })}
          </p>

          <h2>{pick({ en: '3-day money-back guarantee', ka: '3 დღიანი თანხის დაბრუნების გარანტია', ru: '3-дневная гарантия возврата' })}</h2>
          <p>
            {pick({
              en: 'Every Premium subscription includes a 3-day money-back guarantee. If you are not satisfied, cancel within 3 days of your payment and we will refund you in full to the card you paid with.',
              ka: 'ყველა Premium გამოწერა მოიცავს 3 დღიან თანხის დაბრუნების გარანტიას. თუ კმაყოფილი არ ხართ, გააუქმეთ გადახდიდან 3 დღეში და თანხას სრულად დაგიბრუნებთ იმავე ბარათზე.',
              ru: 'Каждая подписка Premium включает 3-дневную гарантию возврата средств. Если вы недовольны, отмените в течение 3 дней после оплаты, и мы вернём полную сумму на карту, которой вы платили.',
            })}
          </p>

          <h2>{pick({ en: 'Cancelling after 3 days', ka: 'გაუქმება 3 დღის შემდეგ', ru: 'Отмена после 3 дней' })}</h2>
          <p>
            {pick({
              en: 'You can cancel your subscription at any time. After the first 3 days, cancelling stops the next renewal - your Premium stays active until the end of the period you already paid for, and that remaining period is not refunded.',
              ka: 'გამოწერის გაუქმება ნებისმიერ დროს შეგიძლიათ. პირველი 3 დღის შემდეგ გაუქმება აჩერებს შემდეგ განახლებას - Premium აქტიური რჩება უკვე გადახდილი პერიოდის ბოლომდე და ეს დარჩენილი პერიოდი არ ბრუნდება.',
              ru: 'Вы можете отменить подписку в любое время. После первых 3 дней отмена останавливает следующее продление - Premium остаётся активным до конца уже оплаченного периода, и этот остаток не возвращается.',
            })}
          </p>

          <h2>{pick({ en: 'How refunds are issued', ka: 'როგორ ბრუნდება თანხა', ru: 'Как возвращаются средства' })}</h2>
          <p>
            {pick({
              en: 'Refunds are returned to the original card through our licensed payment provider. The amount usually appears within a few business days, depending on your bank.',
              ka: 'თანხა ბრუნდება იმავე ბარათზე ლიცენზირებული გადახდის პროვაიდერის მეშვეობით. თანხა, როგორც წესი, რამდენიმე სამუშაო დღეში აისახება, თქვენი ბანკის მიხედვით.',
              ru: 'Возврат осуществляется на исходную карту через нашего лицензированного платёжного провайдера. Сумма обычно поступает в течение нескольких рабочих дней, в зависимости от банка.',
            })}
          </p>

          <h2>{pick({ en: 'How to cancel or request a refund', ka: 'როგორ გააუქმოთ ან მოითხოვოთ დაბრუნება', ru: 'Как отменить или запросить возврат' })}</h2>
          <p>
            {pick({
              en: 'You can cancel from the Premium page in your account, or email us at contact@homico.co. For a guarantee refund, please contact us within 3 days of your payment.',
              ka: 'გაუქმება შეგიძლიათ ანგარიშის Premium გვერდიდან, ან მოგვწერეთ contact@homico.co-ზე. გარანტიით დაბრუნებისთვის დაგვიკავშირდით გადახდიდან 3 დღეში.',
              ru: 'Вы можете отменить на странице Premium в вашем аккаунте или написать нам на contact@homico.co. Для гарантийного возврата свяжитесь с нами в течение 3 дней после оплаты.',
            })}
          </p>

          <h2>{pick({ en: 'Changes to this policy', ka: 'პოლიტიკის ცვლილება', ru: 'Изменения политики' })}</h2>
          <p>
            {pick({
              en: 'We may update this policy from time to time. The current version is always available on this page.',
              ka: 'ჩვენ პერიოდულად შეიძლება განვაახლოთ ეს პოლიტიკა. მიმდინარე ვერსია ყოველთვის ხელმისაწვდომია ამ გვერდზე.',
              ru: 'Мы можем периодически обновлять эту политику. Актуальная версия всегда доступна на этой странице.',
            })}
          </p>

          <h2>{pick({ en: 'Contact', ka: 'კონტაქტი', ru: 'Контакт' })}</h2>
          <p>
            {pick({
              en: 'Questions about a refund? Email',
              ka: 'გაქვთ კითხვა დაბრუნებაზე? მოგვწერეთ',
              ru: 'Вопросы о возврате? Напишите на',
            })}{' '}
            <a href="mailto:contact@homico.co">contact@homico.co</a>{' '}
            {pick({ en: 'or visit our', ka: 'ან ეწვიეთ', ru: 'или посетите наш' })}{' '}
            <Link href="/help">{pick({ en: 'Help Center', ka: 'დახმარების ცენტრს', ru: 'Центр помощи' })}</Link>.
          </p>
        </article>
      </div>
    </div>
  );
}

'use client';

import Header, { HeaderSpacer } from '@/components/common/Header';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Building2, Clock, FileText, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Table of contents sections
const sections = [
  { id: 'acceptance', titleEn: 'Acceptance of Terms', titleKa: 'პირობების მიღება' },
  { id: 'eligibility', titleEn: 'Eligibility', titleKa: 'უფლებამოსილება' },
  { id: 'account', titleEn: 'Account Registration', titleKa: 'ანგარიშის რეგისტრაცია' },
  { id: 'services', titleEn: 'Platform Services', titleKa: 'პლატფორმის სერვისები' },
  { id: 'professionals', titleEn: 'Professional Users', titleKa: 'პროფესიონალები' },
  { id: 'clients', titleEn: 'Client Users', titleKa: 'კლიენტები' },
  { id: 'payments', titleEn: 'Payments & Subscriptions', titleKa: 'გადახდები და გამოწერა' },
  { id: 'content', titleEn: 'User Content', titleKa: 'მომხმარებლის კონტენტი' },
  { id: 'prohibited', titleEn: 'Prohibited Conduct', titleKa: 'აკრძალული ქმედებები' },
  { id: 'liability', titleEn: 'Limitation of Liability', titleKa: 'პასუხისმგებლობის შეზღუდვა' },
  { id: 'termination', titleEn: 'Termination', titleKa: 'შეწყვეტა' },
  { id: 'changes', titleEn: 'Changes to Terms', titleKa: 'პირობების ცვლილება' },
  { id: 'contact', titleEn: 'Contact Information', titleKa: 'საკონტაქტო ინფორმაცია' },
];

type Loc = { en: string; ka: string; ru: string };
type Block = { p?: Loc; ul?: Loc[]; h3?: Loc };

// Real, plain-language Terms of Service. Reflects Homico's actual model:
// a platform that connects clients with renovation professionals. Homico does
// NOT process payments for the work itself (those are arranged directly between
// the client and the professional, off the platform). The only payment Homico
// processes is the optional Premium subscription that professionals buy from us.
const LEGAL_SECTIONS: { id: string; title: Loc; blocks: Block[] }[] = [
  {
    id: 'acceptance',
    title: { en: 'Acceptance of Terms', ka: 'პირობების მიღება', ru: 'Принятие условий' },
    blocks: [
      {
        p: {
          en: 'These Terms govern your use of Homico (homico.ge and homico.co), operated by Homico LLC (ID 400458606). By creating an account or using the platform, you agree to these Terms and to our Privacy Policy.',
          ka: 'წინამდებარე პირობები არეგულირებს Homico-ს (homico.ge და homico.co) გამოყენებას. პლატფორმას მართავს შპს ჰომიკო (ს/ნ 400458606). ანგარიშის შექმნით ან პლატფორმის გამოყენებით თქვენ ეთანხმებით ამ პირობებსა და კონფიდენციალურობის პოლიტიკას.',
          ru: 'Настоящие Условия регулируют использование Homico (homico.ge и homico.co), которым управляет ООО «Хомико» (ИН 400458606). Создавая аккаунт или используя платформу, вы соглашаетесь с этими Условиями и Политикой конфиденциальности.',
        },
      },
      {
        p: {
          en: 'If you do not agree with these Terms, please do not use Homico.',
          ka: 'თუ ამ პირობებს არ ეთანხმებით, ნუ ისარგებლებთ Homico-თი.',
          ru: 'Если вы не согласны с Условиями, не используйте Homico.',
        },
      },
    ],
  },
  {
    id: 'eligibility',
    title: { en: 'Eligibility', ka: 'უფლებამოსილება', ru: 'Право на использование' },
    blocks: [
      { p: { en: 'To use Homico, you must:', ka: 'Homico-ით სარგებლობისთვის საჭიროა:', ru: 'Чтобы пользоваться Homico, вы должны:' } },
      {
        ul: [
          { en: 'be at least 18 years old', ka: 'იყოთ სულ მცირე 18 წლის', ru: 'быть не моложе 18 лет' },
          { en: 'have the legal capacity to enter into a binding agreement', ka: 'გქონდეთ ხელშეკრულების დადების უფლებამოსილება', ru: 'обладать дееспособностью для заключения договора' },
          { en: 'provide accurate and complete information', ka: 'მიუთითოთ ზუსტი და სრული ინფორმაცია', ru: 'предоставлять точную и полную информацию' },
          { en: 'comply with the laws of Georgia', ka: 'დაიცვათ საქართველოს კანონმდებლობა', ru: 'соблюдать законодательство Грузии' },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: { en: 'Account Registration', ka: 'ანგარიშის რეგისტრაცია', ru: 'Регистрация аккаунта' },
    blocks: [
      { p: { en: 'You are responsible for your account, including:', ka: 'პასუხს აგებთ თქვენს ანგარიშზე, მათ შორის:', ru: 'Вы несёте ответственность за свой аккаунт, в том числе за:' } },
      {
        ul: [
          { en: 'keeping your password confidential', ka: 'პაროლის კონფიდენციალურად შენახვაზე', ru: 'сохранение пароля в тайне' },
          { en: 'all activity that happens under your account', ka: 'ანგარიშზე განხორციელებულ ნებისმიერ ქმედებაზე', ru: 'все действия, совершённые под вашим аккаунтом' },
          { en: 'keeping your information up to date', ka: 'ინფორმაციის განახლებაზე', ru: 'актуальность ваших данных' },
        ],
      },
      {
        p: {
          en: 'If you suspect any unauthorized use of your account, notify us at contact@homico.co.',
          ka: 'თუ ეჭვობთ ანგარიშის უნებართვო გამოყენებას, მოგვწერეთ contact@homico.co-ზე.',
          ru: 'Если вы подозреваете несанкционированный доступ к аккаунту, сообщите нам на contact@homico.co.',
        },
      },
    ],
  },
  {
    id: 'services',
    title: { en: 'Platform Services', ka: 'პლატფორმის სერვისები', ru: 'Услуги платформы' },
    blocks: [
      {
        p: {
          en: 'Homico is an online platform that helps clients find and contact verified renovation and home-service professionals in Georgia. We provide tools to browse profiles, search by service, view portfolios and reviews, and get in touch.',
          ka: 'Homico არის ონლაინ პლატფორმა, რომელიც კლიენტებს ეხმარება საქართველოში გადამოწმებული სარემონტო და სახლის სერვისების ოსტატების მოძიებასა და დაკავშირებაში. გთავაზობთ პროფილების დათვალიერების, სერვისით ძიების, პორტფოლიოსა და შეფასებების ნახვის და დაკავშირების ხელსაწყოებს.',
          ru: 'Homico — это онлайн-платформа, которая помогает клиентам находить и связываться с проверенными мастерами по ремонту и бытовым услугам в Грузии. Мы предоставляем инструменты для просмотра профилей, поиска по услугам, просмотра портфолио и отзывов и связи с мастером.',
        },
      },
      {
        p: {
          en: 'Homico is a platform and intermediary only. We are not a party to any agreement between a client and a professional, we do not perform the work ourselves, and the professionals are independent and not employed by Homico.',
          ka: 'Homico მხოლოდ პლატფორმა და შუამავალია. ჩვენ არ ვართ კლიენტსა და ოსტატს შორის დადებული შეთანხმების მხარე, არ ვასრულებთ სამუშაოს და ოსტატები დამოუკიდებელნი არიან, არ არიან Homico-ს თანამშრომლები.',
          ru: 'Homico является только платформой и посредником. Мы не являемся стороной соглашения между клиентом и мастером, не выполняем работы сами, а мастера независимы и не являются сотрудниками Homico.',
        },
      },
    ],
  },
  {
    id: 'professionals',
    title: { en: 'Professional Users', ka: 'პროფესიონალები', ru: 'Мастера' },
    blocks: [
      { p: { en: 'If you register as a professional, you confirm and agree that:', ka: 'ოსტატად რეგისტრაციით ადასტურებთ და ეთანხმებით, რომ:', ru: 'Регистрируясь как мастер, вы подтверждаете и соглашаетесь, что:' } },
      {
        ul: [
          { en: 'you hold the qualifications, skills and any licenses required for the services you offer', ka: 'გაქვთ შესაბამისი კვალიფიკაცია, უნარები და საჭირო ლიცენზიები', ru: 'обладаете квалификацией, навыками и необходимыми лицензиями' },
          { en: 'you are solely responsible for the quality, safety and legality of your work', ka: 'მთლიანად პასუხს აგებთ თქვენი სამუშაოს ხარისხზე, უსაფრთხოებასა და კანონიერებაზე', ru: 'несёте полную ответственность за качество, безопасность и законность своей работы' },
          { en: 'you agree the price, scope and schedule directly with each client', ka: 'ფასს, მოცულობასა და ვადებს თითოეულ კლიენტთან პირდაპირ თანხმდებით', ru: 'согласовываете цену, объём и сроки напрямую с каждым клиентом' },
          { en: 'the information on your profile is accurate and kept up to date', ka: 'პროფილზე მითითებული ინფორმაცია ზუსტი და განახლებულია', ru: 'информация в вашем профиле точна и актуальна' },
        ],
      },
      {
        p: {
          en: 'Professionals may optionally buy a Premium subscription from Homico to promote their profile (see Payments & Subscriptions).',
          ka: 'ოსტატებს შეუძლიათ არასავალდებულოდ შეიძინონ Premium გამოწერა Homico-სგან პროფილის წინ წამოსაწევად (იხ. გადახდები და გამოწერა).',
          ru: 'Мастера могут по желанию приобрести подписку Premium у Homico для продвижения профиля (см. «Платежи и подписки»).',
        },
      },
    ],
  },
  {
    id: 'clients',
    title: { en: 'Client Users', ka: 'კლიენტები', ru: 'Клиенты' },
    blocks: [
      {
        p: {
          en: 'As a client, you choose and engage professionals at your own discretion. We recommend reviewing a professional’s profile, reviews and credentials before hiring.',
          ka: 'როგორც კლიენტი, ოსტატს ირჩევთ და ქირაობთ საკუთარი შეხედულებისამებრ. დაქირავებამდე გირჩევთ გადახედოთ ოსტატის პროფილს, შეფასებებსა და დოკუმენტებს.',
          ru: 'Как клиент, вы выбираете и нанимаете мастеров по своему усмотрению. Перед наймом рекомендуем изучить профиль, отзывы и документы мастера.',
        },
      },
      {
        p: {
          en: 'Any agreement and payment for renovation work is made directly between you and the professional. Homico does not arrange, process, hold or guarantee these payments and is not responsible for the work performed.',
          ka: 'სარემონტო სამუშაოს შესახებ ნებისმიერი შეთანხმება და გადახდა ხდება უშუალოდ თქვენსა და ოსტატს შორის. Homico არ აწყობს, არ ამუშავებს, არ ინახავს და არ იძლევა გარანტიას ამ გადახდებზე და არ აგებს პასუხს შესრულებულ სამუშაოზე.',
          ru: 'Любое соглашение и оплата ремонтных работ происходят напрямую между вами и мастером. Homico не организует, не обрабатывает, не хранит и не гарантирует эти платежи и не отвечает за выполненную работу.',
        },
      },
    ],
  },
  {
    id: 'payments',
    title: { en: 'Payments & Subscriptions', ka: 'გადახდები და გამოწერა', ru: 'Платежи и подписки' },
    blocks: [
      { h3: { en: 'Payment for renovation work', ka: 'სარემონტო სამუშაოს გადახდა', ru: 'Оплата ремонтных работ' } },
      {
        p: {
          en: 'Homico does not process payments for renovation services. The price for any work is agreed and paid directly between the client and the professional, outside the platform. Homico does not receive, hold or guarantee these amounts.',
          ka: 'Homico არ ამუშავებს გადახდებს სარემონტო სერვისებზე. ნებისმიერი სამუშაოს ფასი თანხმდება და იხდება უშუალოდ კლიენტსა და ოსტატს შორის, პლატფორმის გარეთ. Homico ამ თანხებს არ იღებს, არ ინახავს და არ იძლევა გარანტიას.',
          ru: 'Homico не обрабатывает платежи за ремонтные услуги. Цена любой работы согласовывается и оплачивается напрямую между клиентом и мастером, вне платформы. Homico не получает, не хранит и не гарантирует эти суммы.',
        },
      },
      { h3: { en: 'Premium subscriptions', ka: 'Premium გამოწერა', ru: 'Подписки Premium' } },
      {
        p: {
          en: 'The only payment Homico processes is the optional Premium subscription (Pro and Super Pro) that professionals buy from Homico to promote their profile. Prices are shown in Georgian Lari (₾) before purchase, and card payments are processed securely by a licensed payment provider.',
          ka: 'ერთადერთი გადახდა, რომელსაც Homico ამუშავებს, არის არასავალდებულო Premium გამოწერა (Pro და Super Pro), რომელსაც ოსტატები ყიდულობენ Homico-სგან პროფილის წინ წამოსაწევად. ფასები ნაჩვენებია ლარში (₾) შეძენამდე, ბარათით გადახდას კი ამუშავებს ლიცენზირებული გადახდის პროვაიდერი უსაფრთხოდ.',
          ru: 'Единственный платёж, который обрабатывает Homico, — это необязательная подписка Premium (Pro и Super Pro), которую мастера покупают у Homico для продвижения профиля. Цены указаны в грузинских лари (₾) до покупки, а платежи картой безопасно обрабатывает лицензированный платёжный провайдер.',
        },
      },
      { h3: { en: 'Delivery', ka: 'მიწოდება', ru: 'Предоставление' } },
      {
        p: {
          en: 'Premium is a digital service with no physical delivery. Once your card payment is confirmed, Premium activates on your account immediately and runs for the billing period you chose.',
          ka: 'Premium ციფრული სერვისია, ფიზიკური მიწოდების გარეშე. ბარათით გადახდის დადასტურებისთანავე Premium მაშინვე აქტიურდება თქვენს ანგარიშზე და მოქმედებს არჩეული პერიოდის განმავლობაში.',
          ru: 'Premium — это цифровая услуга без физической доставки. После подтверждения оплаты картой Premium активируется на вашем аккаунте сразу и действует выбранный период.',
        },
      },
      { h3: { en: 'Refunds & cancellation', ka: 'თანხის დაბრუნება და გაუქმება', ru: 'Возврат и отмена' } },
      {
        p: {
          en: 'Premium includes a 3-day money-back guarantee. If you cancel within 3 days of payment, we refund you in full to the original card. After that, you can cancel anytime and Premium stays active until the end of the paid period. See our Refund Policy for details.',
          ka: 'Premium მოიცავს 3 დღიან თანხის დაბრუნების გარანტიას. თუ გადახდიდან 3 დღეში გააუქმებთ, თანხას სრულად დაგიბრუნებთ იმავე ბარათზე. შემდეგ გაუქმება ნებისმიერ დროს შეგიძლიათ და Premium აქტიური რჩება გადახდილი პერიოდის ბოლომდე. დეტალები იხილეთ დაბრუნების პოლიტიკაში.',
          ru: 'Premium включает 3-дневную гарантию возврата средств. Если вы отмените в течение 3 дней после оплаты, мы вернём полную сумму на ту же карту. После этого вы можете отменить в любое время, и Premium останется активным до конца оплаченного периода. Подробности — в Политике возврата.',
        },
      },
    ],
  },
  {
    id: 'content',
    title: { en: 'User Content', ka: 'მომხმარებლის კონტენტი', ru: 'Контент пользователей' },
    blocks: [
      {
        p: {
          en: 'You keep ownership of the content you upload (photos, descriptions, reviews). By posting it on Homico, you grant us a non-exclusive license to display and promote it on the platform and in our marketing.',
          ka: 'ატვირთულ კონტენტზე (ფოტოები, აღწერები, შეფასებები) უფლება თქვენ გრჩებათ. Homico-ზე გამოქვეყნებით გვანიჭებთ არაექსკლუზიურ უფლებას, ის გამოვაჩინოთ პლატფორმაზე და ჩვენს მარკეტინგში.',
          ru: 'Вы сохраняете права на загруженный контент (фото, описания, отзывы). Размещая его на Homico, вы предоставляете нам неисключительную лицензию на его показ и продвижение на платформе и в маркетинге.',
        },
      },
      {
        p: {
          en: 'You are responsible for ensuring your content is accurate, lawful and does not infringe anyone’s rights.',
          ka: 'პასუხს აგებთ იმაზე, რომ თქვენი კონტენტი ზუსტი და კანონიერია და არ არღვევს სხვის უფლებებს.',
          ru: 'Вы отвечаете за то, чтобы ваш контент был точным, законным и не нарушал чьи-либо права.',
        },
      },
    ],
  },
  {
    id: 'prohibited',
    title: { en: 'Prohibited Conduct', ka: 'აკრძალული ქმედებები', ru: 'Запрещённые действия' },
    blocks: [
      { p: { en: 'When using Homico, you must not:', ka: 'Homico-ით სარგებლობისას აკრძალულია:', ru: 'При использовании Homico запрещается:' } },
      {
        ul: [
          { en: 'provide false information or impersonate someone else', ka: 'ცრუ ინფორმაციის მითითება ან სხვის სახელით წარდგენა', ru: 'предоставлять ложную информацию или выдавать себя за другого' },
          { en: 'post fake reviews or manipulate ratings', ka: 'ყალბი შეფასებების დატოვება ან რეიტინგით მანიპულირება', ru: 'оставлять фальшивые отзывы или манипулировать рейтингом' },
          { en: 'use the platform for unlawful, fraudulent or harmful activity', ka: 'პლატფორმის გამოყენება უკანონო, თაღლითური ან მავნე მიზნით', ru: 'использовать платформу для незаконных, мошеннических или вредных действий' },
          { en: 'harass, threaten or abuse other users', ka: 'სხვა მომხმარებლების შევიწროება, მუქარა ან შეურაცხყოფა', ru: 'преследовать, угрожать или оскорблять других пользователей' },
          { en: 'copy, scrape or misuse platform data or content', ka: 'პლატფორმის მონაცემების ან კონტენტის კოპირება, მოპარვა ან არამიზნობრივი გამოყენება', ru: 'копировать, собирать или неправомерно использовать данные или контент платформы' },
          { en: 'attempt to bypass security or disrupt the platform', ka: 'უსაფრთხოების გვერდის ავლის ან პლატფორმის მუშაობის ხელის შეშლის მცდელობა', ru: 'пытаться обойти защиту или нарушить работу платформы' },
        ],
      },
    ],
  },
  {
    id: 'liability',
    title: { en: 'Limitation of Liability', ka: 'პასუხისმგებლობის შეზღუდვა', ru: 'Ограничение ответственности' },
    blocks: [
      {
        p: {
          en: 'Homico is provided on an “as is” basis. As a platform that connects clients and professionals, we are not responsible for the conduct, work, qualifications or payments of any user.',
          ka: 'Homico მოწოდებულია „როგორც არის" პრინციპით. როგორც კლიენტებსა და ოსტატებს დამაკავშირებელი პლატფორმა, ჩვენ არ ვაგებთ პასუხს მომხმარებლების ქცევაზე, სამუშაოზე, კვალიფიკაციასა თუ გადახდებზე.',
          ru: 'Homico предоставляется «как есть». Будучи платформой, связывающей клиентов и мастеров, мы не отвечаем за поведение, работу, квалификацию или платежи пользователей.',
        },
      },
      {
        p: {
          en: 'To the extent permitted by Georgian law, Homico is not liable for any indirect or consequential damages arising from your use of the platform or from any agreement between a client and a professional. Our total liability for the Premium service is limited to the amount you paid for it.',
          ka: 'საქართველოს კანონმდებლობით დაშვებულ ფარგლებში, Homico არ აგებს პასუხს არაპირდაპირ ზიანზე, რომელიც წარმოიქმნება პლატფორმის გამოყენებიდან ან კლიენტსა და ოსტატს შორის შეთანხმებიდან. Premium სერვისზე ჩვენი პასუხისმგებლობა შემოიფარგლება მისთვის გადახდილი თანხით.',
          ru: 'В пределах, допустимых законодательством Грузии, Homico не несёт ответственности за косвенный ущерб, возникший из использования платформы или из соглашения между клиентом и мастером. Наша общая ответственность за услугу Premium ограничена уплаченной за неё суммой.',
        },
      },
    ],
  },
  {
    id: 'termination',
    title: { en: 'Termination', ka: 'შეწყვეტა', ru: 'Прекращение' },
    blocks: [
      {
        p: {
          en: 'You can stop using Homico and close your account at any time. You can cancel a Premium subscription as described in Payments & Subscriptions.',
          ka: 'Homico-ით სარგებლობის შეწყვეტა და ანგარიშის დახურვა ნებისმიერ დროს შეგიძლიათ. Premium გამოწერის გაუქმება შესაძლებელია „გადახდები და გამოწერის" განყოფილების მიხედვით.',
          ru: 'Вы можете прекратить использование Homico и закрыть аккаунт в любое время. Подписку Premium можно отменить, как описано в разделе «Платежи и подписки».',
        },
      },
      {
        p: {
          en: 'We may suspend or terminate an account that breaches these Terms or the law, or that harms other users or the platform.',
          ka: 'ჩვენ შეგვიძლია შევაჩეროთ ან გავაუქმოთ ანგარიში, რომელიც არღვევს ამ პირობებს ან კანონს, ან ზიანს აყენებს სხვა მომხმარებლებს თუ პლატფორმას.',
          ru: 'Мы можем приостановить или закрыть аккаунт, который нарушает эти Условия или закон либо вредит другим пользователям или платформе.',
        },
      },
    ],
  },
  {
    id: 'changes',
    title: { en: 'Changes to Terms', ka: 'პირობების ცვლილება', ru: 'Изменения условий' },
    blocks: [
      {
        p: {
          en: 'We may update these Terms from time to time. We will post the updated version here and, for significant changes, notify you. Continued use of Homico after an update means you accept the revised Terms.',
          ka: 'ჩვენ პერიოდულად შეიძლება განვაახლოთ ეს პირობები. განახლებულ ვერსიას აქ გამოვაქვეყნებთ და მნიშვნელოვანი ცვლილებების შესახებ შეგატყობინებთ. განახლების შემდეგ Homico-ით სარგებლობის გაგრძელება ნიშნავს განახლებული პირობების მიღებას.',
          ru: 'Мы можем периодически обновлять эти Условия. Обновлённую версию мы публикуем здесь, а о существенных изменениях уведомляем вас. Продолжение использования Homico после обновления означает принятие изменённых Условий.',
        },
      },
    ],
  },
];

export default function TermsPage() {
  const { t, pick } = useLanguage();
  const [activeSection, setActiveSection] = useState('acceptance');
  const [showMobileToc, setShowMobileToc] = useState(false);

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((s) => ({
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
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setShowMobileToc(false);
  };

  const lastUpdated = pick({ en: 'June 2026', ka: '2026 წლის ივნისი', ru: 'Июнь 2026 г.' });

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--hm-brand-500)] via-[#D13C14] to-[#A92B08]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <FileText className="w-4 h-4" strokeWidth={1.5} />
              {pick({ en: 'Legal document', ka: 'სამართლებრივი დოკუმენტი', ru: 'Юридический документ' })}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-white mb-4 tracking-tight">
              {pick({ en: 'Terms of Service', ka: 'წესები და პირობები', ru: 'Условия использования' })}
            </h1>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-6">
              {pick({
                en: 'Please read these terms carefully before using Homico.',
                ka: 'Homico-ით სარგებლობამდე გთხოვთ ყურადღებით წაიკითხოთ ეს პირობები.',
                ru: 'Пожалуйста, внимательно прочитайте эти условия перед использованием Homico.',
              })}
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-white/50">
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              {pick({ en: 'Last updated:', ka: 'ბოლო განახლება:', ru: 'Обновлено:' })} {lastUpdated}
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
                  {pick({ en: 'Table of contents', ka: 'სარჩევი', ru: 'Содержание' })}
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
                        activeSection === section.id ? 'bg-[var(--hm-brand-500)] text-white' : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] group-hover:bg-[var(--hm-border)]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="truncate">{pick({ en: section.titleEn, ka: section.titleKa })}</span>
                    </Button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Mobile TOC Toggle */}
          <Button
            size="icon"
            onClick={() => setShowMobileToc(!showMobileToc)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform"
            aria-label={pick({ en: 'Table of contents', ka: 'სარჩევი', ru: 'Содержание' })}
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </Button>

          {/* Mobile TOC Drawer */}
          {showMobileToc && (
            <>
              <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileToc(false)} />
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--hm-bg-elevated)] rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)]">{pick({ en: 'Table of contents', ka: 'სარჩევი', ru: 'Содержание' })}</h3>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowMobileToc(false)} className="w-8 h-8 rounded-full bg-[var(--hm-bg-tertiary)]" aria-label={t('common.close')}>
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
                        activeSection === section.id ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)] font-medium hover:bg-[var(--hm-brand-500)]/15' : 'text-[var(--hm-fg-secondary)]'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center flex-shrink-0 ${activeSection === section.id ? 'bg-[var(--hm-brand-500)] text-white' : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'}`}>
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
                {LEGAL_SECTIONS.map((s, i) => (
                  <section
                    key={s.id}
                    id={s.id}
                    className={`scroll-mt-28 ${i === 0 ? 'pb-10' : 'py-10'} border-b border-[var(--hm-border-subtle)]`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h2 className="!mb-0">{pick(s.title)}</h2>
                    </div>
                    {s.blocks.map((b, j) =>
                      b.h3 ? (
                        <h3 key={j} className="!mt-6 !mb-2 text-lg font-semibold text-[var(--hm-fg-primary)]">{pick(b.h3)}</h3>
                      ) : b.ul ? (
                        <ul key={j} className="list-disc pl-6 space-y-2">
                          {b.ul.map((li, k) => <li key={k}>{pick(li)}</li>)}
                        </ul>
                      ) : b.p ? (
                        <p key={j}>{pick(b.p)}</p>
                      ) : null,
                    )}
                  </section>
                ))}

                {/* Contact */}
                <section id="contact" className="scroll-mt-28 pt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-lg bg-[var(--hm-brand-500)] text-white text-sm font-semibold flex items-center justify-center">13</span>
                    <h2 className="!mb-0">{pick({ en: 'Contact Information', ka: 'საკონტაქტო ინფორმაცია', ru: 'Контактная информация' })}</h2>
                  </div>
                  <p>
                    {pick({
                      en: 'For any questions about these Terms, contact us:',
                      ka: 'ამ პირობებთან დაკავშირებული ნებისმიერი კითხვისთვის დაგვიკავშირდით:',
                      ru: 'По любым вопросам об этих Условиях свяжитесь с нами:',
                    })}
                  </p>
                  <div className="mt-4 p-6 bg-gradient-to-br from-[var(--hm-brand-500)]/10 to-[var(--hm-brand-500)]/5 rounded-xl border border-[var(--hm-brand-500)]/20">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{pick({ en: 'Legal entity', ka: 'იურიდიული პირი', ru: 'Юридическое лицо' })}</p>
                          <p className="font-medium !mb-0">{pick({ en: 'Homico LLC', ka: 'შპს ჰომიკო', ru: 'ООО «Хомико»' })} · {pick({ en: 'ID', ka: 'ს/ნ', ru: 'ИН' })} 400458606</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{t('common.email')}</p>
                          <a href="mailto:contact@homico.co" className="font-medium">contact@homico.co</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{t('common.phone')}</p>
                          <a href="tel:+995571072007" className="font-medium">+995 571 07 20 07</a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm text-[var(--hm-fg-muted)] !mb-0">{t('common.address')}</p>
                          <p className="font-medium !mb-0">{pick({ en: 'Tbilisi, 42 Mukhrani St.', ka: 'თბილისი, მუხრანის 42', ru: 'Тбилиси, ул. Мухрани 42' })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer navigation */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[var(--hm-bg-elevated)]/60 backdrop-blur-sm rounded-2xl border border-[var(--hm-border-subtle)]">
              <p className="text-sm text-[var(--hm-fg-muted)]">{pick({ en: 'Also see:', ka: 'იხილეთ აგრეთვე:', ru: 'См. также:' })}</p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--hm-brand-500)] hover:text-[#A92B08] transition-colors">
                  {pick({ en: 'Privacy Policy', ka: 'კონფიდენციალურობის პოლიტიკა', ru: 'Политика конфиденциальности' })}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
                <Link href="/refund-policy" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--hm-brand-500)] hover:text-[#A92B08] transition-colors">
                  {pick({ en: 'Refund Policy', ka: 'დაბრუნების პოლიტიკა', ru: 'Политика возврата' })}
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

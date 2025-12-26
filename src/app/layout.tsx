import ClientLayout from '@/components/common/ClientLayout';
import EnvBadge from '@/components/common/EnvBadge';
import Providers from '@/components/common/Providers';
import ToastContainer from '@/components/common/Toast';
import '@/styles/globals.css';
import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: {
      default: 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი',
      template: '%s | Homico',
    },
    description: 'საქართველოს პირველი პლატფორმა სახლის მომსახურების პროფესიონალების მოსაძებნად. ხელოსნები, ინტერიერის დიზაინერები, არქიტექტორები და სარემონტო პროფესიონალები თბილისში.',
    keywords: ['ხელოსანი', 'სანტექნიკა', 'ელექტრიკოსი', 'რემონტი', 'ინტერიერი', 'დიზაინერი', 'თბილისი', 'საქართველო', 'homico', 'სახლის მომსახურება'],
    authors: [{ name: 'Homico' }],
    creator: 'Homico',
    publisher: 'Homico',
    metadataBase: new URL('https://homico.ge'),
    alternates: {
      canonical: '/',
      languages: {
        'ka-GE': '/ka',
        'en-US': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: 'ka_GE',
      alternateLocale: 'en_US',
      url: 'https://homico.ge',
      siteName: 'Homico',
      title: 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი',
      description: 'საქართველოს პირველი პლატფორმა სახლის მომსახურების პროფესიონალების მოსაძებნად. ხელოსნები, ინტერიერის დიზაინერები, არქიტექტორები.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Homico - სახლის პროფესიონალების პლატფორმა',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი',
      description: 'საქართველოს პირველი პლატფორმა სახლის მომსახურების პროფესიონალების მოსაძებნად.',
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.png',
      shortcut: '/favicon.png',
      apple: '/favicon.png',
    },
    verification: {
      google: 'j0mOXsOhfeaKO7Z94EVIl7Rmek8eNsWj8a4fLbFcfgo',
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-V4JH4QTFF3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V4JH4QTFF3');
            `,
          }}
        />
        {/* End Google Analytics */}

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MM4HKK4R');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* Prevent flash of wrong theme by setting class before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{ backgroundColor: 'var(--color-bg-app)' }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MM4HKK4R"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <ClientLayout>{children}</ClientLayout>
          <ToastContainer />
          <EnvBadge />
        </Providers>
      </body>
    </html>
  );
}

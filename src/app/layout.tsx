import ClientLayout from '@/components/common/ClientLayout';
import EnvBadge from '@/components/common/EnvBadge';
import ToastContainer from '@/components/common/Toast';
import Providers from '@/components/common/Providers';
import '@/styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Homico - იპოვე შენი იდეალური სახლის პროფესიონალი',
  description: 'ხელოსნების, ინტერიერის დიზაინერების, არქიტექტორებისა და სარემონტო პროფესიონალების მარკეტპლეისი',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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

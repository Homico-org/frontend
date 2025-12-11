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
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
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
        {/* Helvetica Neue - system font stack */}
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
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
          <ToastContainer />
          <EnvBadge />
        </Providers>
      </body>
    </html>
  );
}

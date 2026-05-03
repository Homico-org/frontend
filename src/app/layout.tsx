import ClientLayout from "@/components/common/ClientLayout";
import EnvBadge from "@/components/common/EnvBadge";
import Providers from "@/components/common/Providers";
import ToastContainer from "@/components/common/Toast";
import { AiChatWidget } from "@/components/ai-assistant";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: '#EF4E24',
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export function generateMetadata(): Metadata {
  // Title is intentionally short + Georgian-first since most traffic is from
  // Tbilisi. Description mirrors the on-site `landing.positionStatement`.
  const TITLE = "Homico — სანდო სარემონტო ოსტატები თბილისში";
  const DESCRIPTION =
    "Homico ეხმარება თბილისელ მფლობელებს იპოვონ გადამოწმებული სარემონტო ოსტატები — გასაგები ფასები, რეალური შეფასებები, ყოველგვარი დევნის გარეშე.";

  return {
    title: {
      default: TITLE,
      template: "%s | Homico",
    },
    description: DESCRIPTION,
    keywords: [
      // Georgian (primary market)
      "ხელოსანი",
      "სანტექნიკა",
      "ელექტრიკოსი",
      "რემონტი",
      "ინტერიერი",
      "დიზაინერი",
      "სამშენებლო",
      "მშენებელი",
      "ფერმწერელი",
      "სახლის მომსახურება",
      "თბილისი",
      "საქართველო",
      // English / Latin (international + diaspora search)
      "Tbilisi renovation",
      "Tbilisi handyman",
      "Tbilisi plumber",
      "Tbilisi electrician",
      "Tbilisi interior designer",
      "Georgia home services",
      "homico",
    ],
    authors: [{ name: "Homico", url: "https://homico.ge" }],
    creator: "Homico",
    publisher: "Homico",
    metadataBase: new URL("https://homico.ge"),
    alternates: {
      canonical: "/",
      // Note: Homico uses cookie-based locale (no /ka /en URL paths). The
      // alternates entry below is intentionally a single canonical so we don't
      // advertise paths that 404 (e.g. /ka, /en used to be listed but those
      // routes don't exist).
    },
    openGraph: {
      type: "website",
      locale: "ka_GE",
      alternateLocale: ["en_US", "ru_RU"],
      url: "https://homico.ge",
      siteName: "Homico",
      title: TITLE,
      description: DESCRIPTION,
      images: [
        {
          url: "https://homico.ge/og-image.png",
          width: 1200,
          height: 630,
          alt: "Homico — სანდო სარემონტო ოსტატები თბილისში",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: ["https://homico.ge/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.png" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.png",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Homico",
    },
    verification: {
      google: "j0mOXsOhfeaKO7Z94EVIl7Rmek8eNsWj8a4fLbFcfgo",
    },
  };
}

// Schema.org Organization — site-wide brand context for Google. Tells search
// engines who Homico is, where to find the logo, and which official URLs to
// prefer (helps the knowledge panel + sitelinks).
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Homico",
  legalName: "Homico",
  alternateName: "Homico.ge",
  url: "https://homico.ge",
  logo: "https://homico.ge/og-image.png",
  image: "https://homico.ge/og-image.png",
  description:
    "Homico helps Tbilisi homeowners find vetted renovation pros — clear quotes, real reviews, no chasing.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tbilisi",
    addressCountry: "GE",
  },
  areaServed: { "@type": "City", name: "Tbilisi" },
  sameAs: [
    // Add real social URLs here when public profiles exist:
    // "https://www.facebook.com/homico.ge",
    // "https://www.instagram.com/homico.ge",
  ],
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        {/* Site-wide Organization schema — improves brand SERP */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSONLD),
          }}
        />

        {/* Homico Design System fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700&family=Noto+Serif+Georgian:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

        {/* Chrome/Android PWA meta (pairs with appleWebApp capable) */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Safari/WKWebView safety: some 3P scripts assume messageHandlers exists */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var w = window;
                  if (!w.webkit) w.webkit = {};
                  if (!w.webkit.messageHandlers) {
                    var stub = { postMessage: function () {} };
                    if (typeof Proxy === 'function') {
                      w.webkit.messageHandlers = new Proxy({}, {
                        get: function () { return stub; }
                      });
                    } else {
                      w.webkit.messageHandlers = {};
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* Google Analytics (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-V4JH4QTFF3"
        />
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

        {/* Contentsquare */}
        <script async src="https://t.contentsquare.net/uxa/e85c48d50001d.js" />
        {/* End Contentsquare */}

        {/* Mixpanel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,c){if(!c.__SV){var l,h;window.mixpanel=c;c._i=[];c.init=function(q,r,f){function t(d,a){var g=a.split(".");2==g.length&&(d=d[g[0]],a=g[1]);d[a]=function(){d.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var b=c;"undefined"!==typeof f?b=c[f]=[]:f="mixpanel";b.people=b.people||[];b.toString=function(d){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);d||(a+=" (stub)");return a};b.people.toString=function(){return b.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
              for(h=0;h<l.length;h++)t(b,l[h]);var n="set set_once union unset remove delete".split(" ");b.get_group=function(){function d(p){a[p]=function(){b.push([g,[p].concat(Array.prototype.slice.call(arguments,0))])}}for(var a={},g=["get_group"].concat(Array.prototype.slice.call(arguments,0)),m=0;m<n.length;m++)d(n[m]);return a};c._i.push([q,r,f])};c.__SV=1.2;var k=e.createElement("script");k.type="text/javascript";k.async=!0;k.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===
              e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\\/\\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=e.getElementsByTagName("script")[0];e.parentNode.insertBefore(k,e)}})(document,window.mixpanel||[]);
              mixpanel.init('9fe9091e0cc6e7cbb53a16fa90c3b6d3', {
                autocapture: true,
                record_sessions_percent: 100,
                api_host: 'https://api-eu.mixpanel.com',
              });
            `,
          }}
        />
        {/* End Mixpanel */}

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
      <body style={{ backgroundColor: "var(--hm-bg-page)" }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MM4HKK4R"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <ClientLayout>{children}</ClientLayout>
          <ToastContainer />
          <AiChatWidget />
          <FeedbackWidget />
          <EnvBadge />
        </Providers>
      </body>
    </html>
  );
}

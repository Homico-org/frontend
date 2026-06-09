/* eslint-disable @next/next/no-page-custom-font, @next/next/next-script-for-ga -- Google Fonts via <link> avoids next/font runtime overhead; GA / GTM / Contentsquare scripts use inline init for early data-layer setup. */
import "@/styles/globals.css";
import { AiChatWidgetMount } from "@/components/ai-assistant/AiChatWidgetMount";
import ClientLayout from "@/components/common/ClientLayout";
import CommandPalette from "@/components/common/CommandPalette";
import CommandPaletteHint from "@/components/common/CommandPaletteHint";
import DevServiceWorkerKiller from "@/components/common/DevServiceWorkerKiller";
import MetaPixelPageView from "@/components/common/MetaPixelPageView";
import OfflineBanner from "@/components/common/OfflineBanner";
import Providers from "@/components/common/Providers";
import PushNotificationPrompt from "@/components/common/PushNotificationPrompt";
import RouteProgressBar from "@/components/common/RouteProgressBar";
import SessionExpiredToast from "@/components/common/SessionExpiredToast";
import ShortcutsHelp from "@/components/common/ShortcutsHelp";
import SkipToMainLink from "@/components/common/SkipToMainLink";
import SwipeBackHandler from "@/components/common/SwipeBackHandler";
import ToastContainer from "@/components/common/Toast";
import UnreadTabTitle from "@/components/common/UnreadTabTitle";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import type { CountryCode, Locale } from "@/contexts/LanguageContext";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

// Reading cookies opts the layout into dynamic rendering. That's fine
// for the root layout - everything beneath it is already dynamic
// (auth state, search params, etc).
const SUPPORTED_LOCALES: Locale[] = ["en", "ka", "ru"];
const SUPPORTED_PHONE_COUNTRIES: CountryCode[] = [
  "GE",
  "IL",
  "FR",
  "US",
  "DE",
  "UK",
];

function readInitialLocale(): Locale {
  const value = cookies().get("homico-locale")?.value;
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : "ka";
}

function readInitialCountry(): CountryCode {
  // Two cookies feed this:
  //   1. `homico-country` - the user's *phone* country, set by the phone
  //      picker. Wins when present.
  //   2. `homico-marketplace` - the active marketplace, set by the edge
  //      middleware from geo-IP / URL on the visitor's first hit. We use
  //      it as a sensible default so a US visitor with no prior phone
  //      country sees +1 by default instead of +995.
  // Falls back to "GE" only when neither cookie is present (a totally
  // new visitor whose geo lookup also failed).
  const c = cookies();
  const phone = c.get("homico-country")?.value;
  if (SUPPORTED_PHONE_COUNTRIES.includes(phone as CountryCode)) {
    return phone as CountryCode;
  }
  const marketplace = c.get("homico-marketplace")?.value?.toUpperCase();
  if (SUPPORTED_PHONE_COUNTRIES.includes(marketplace as CountryCode)) {
    return marketplace as CountryCode;
  }
  return "GE";
}

export const viewport: Viewport = {
  themeColor: "#EF4E24",
  width: "device-width",
  initialScale: 1,
  // Required so `env(safe-area-inset-*)` returns non-zero values on
  // iOS notched devices - without it the existing safe-area paddings
  // around bottom nav, modals, and sheets all collapse to 0.
  viewportFit: "cover",
};

export function generateMetadata(): Metadata {
  // Title is intentionally short + Georgian-first since most traffic is from
  // Tbilisi. Description mirrors the on-site `landing.positionStatement` -
  // keep these two in sync if you edit either.
  const TITLE = "Homico - სანდო სარემონტო ოსტატები თბილისში";
  const DESCRIPTION =
    "Homico - სანდო სარემონტო ოსტატები თბილისში. მკაფიო ფასი, რეალური შეფასებები, უპრობლემოდ.";

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
      // English / Latin - international markets. Per-marketplace
      // metadata in `[country]/layout.tsx` adds city-specific keywords
      // (e.g. "Berlin renovation") for /de visitors; the keywords
      // listed here are the brand-level set used on /[country]-free
      // canonical pages.
      "home renovation",
      "renovation marketplace",
      "vetted contractors",
      "handyman",
      "plumber",
      "electrician",
      "interior designer",
      "homico",
    ],
    authors: [{ name: "Homico", url: "https://homico.co" }],
    creator: "Homico",
    publisher: "Homico",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL || "https://homico.co",
    ),
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
      alternateLocale: ["en_US", "ru_RU", "he_IL", "fr_FR", "de_DE", "en_GB"],
      url: process.env.NEXT_PUBLIC_APP_URL || "https://homico.co",
      siteName: "Homico",
      title: TITLE,
      description: DESCRIPTION,
      // images intentionally omitted - Next.js auto-wires the dynamic
      // /opengraph-image.png generated by app/opengraph-image.tsx so the
      // OG image always renders from current brand tokens.
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      // images auto-wired from app/twitter-image.tsx (re-exports OG generator)
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

// Schema.org Organization - site-wide brand context for Google. Tells
// search engines who Homico is, where to find the logo, and which
// official URLs to prefer (helps the knowledge panel + sitelinks).
// Logo points at the dynamic /opengraph-image generator so it stays
// in sync with the design system.
//
// The geographic specifics (city, area served) live on the per-country
// LocalBusiness schema emitted by `[country]/page.tsx`. Keeping the
// Organization entry city-neutral here means a /us SERP snippet
// doesn't carry a Tbilisi address.
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://homico.co";
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Homico",
  legalName: "Homico",
  url: APP_BASE_URL,
  logo: `${APP_BASE_URL}/opengraph-image`,
  image: `${APP_BASE_URL}/opengraph-image`,
  description:
    "Homico connects homeowners with vetted renovation professionals across multiple marketplaces - clear quotes, real reviews, no chasing.",
  sameAs: [
    // Add real social URLs here when public profiles exist:
    // "https://www.facebook.com/homico",
    // "https://www.instagram.com/homico",
  ],
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve user preferences from cookies on the server so the very
  // first paint already renders in the user's language. Without this,
  // /en visitors saw a Georgian flash before client-side localStorage
  // could swap them over.
  const initialLocale = readInitialLocale();
  const initialCountry = readInitialCountry();

  return (
    <html lang={initialLocale} suppressHydrationWarning>
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700&family=Noto+Serif+Georgian:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

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

        {/* Meta Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2910772282603955');
fbq('track', 'PageView');`,
          }}
        />
        {/* End Meta Pixel */}

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
        {/* Locale-cookie migration: returning visitors from before the
            cookie fix only have localStorage. Mirror it into a cookie
            BEFORE React reads anything so the very next request renders
            in the right language. Runs once - subsequent visits the
            cookie is already there and this is a no-op. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (document.cookie.indexOf('homico-locale=') === -1) {
                    var l = localStorage.getItem('locale');
                    if (l === 'en' || l === 'ka' || l === 'ru') {
                      document.cookie = 'homico-locale=' + l + '; path=/; max-age=' + (60*60*24*365) + '; samesite=lax';
                    }
                  }
                  if (document.cookie.indexOf('homico-country=') === -1) {
                    var c = localStorage.getItem('country');
                    if (c) {
                      document.cookie = 'homico-country=' + c + '; path=/; max-age=' + (60*60*24*365) + '; samesite=lax';
                    }
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
        {/* Meta Pixel (noscript) */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2910772282603955&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel (noscript) */}
        <Providers
          initialLocale={initialLocale}
          initialCountry={initialCountry}
        >
          <DevServiceWorkerKiller />
          <SkipToMainLink />
          <ClientLayout>{children}</ClientLayout>
          <RouteProgressBar />
          <OfflineBanner />
          <UnreadTabTitle />
          <ToastContainer />
          <SessionExpiredToast />
          <AiChatWidgetMount />
          <FeedbackWidget />
          <MetaPixelPageView />
          <CommandPalette />
          <CommandPaletteHint />
          <PushNotificationPrompt />
          <ShortcutsHelp />
          <SwipeBackHandler />
        </Providers>
      </body>
    </html>
  );
}

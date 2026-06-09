import type { Metadata } from "next";
import { SUPPORTED_COUNTRIES, type CountryCode } from "@/data/countries";

interface Props {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}

// Per-marketplace metadata. Each /[country] route gets its own title,
// description, canonical URL, and OG locale so search snippets and
// social previews carry the right city. The root layout (app/layout.tsx)
// only describes the brand at the org level.
const MARKETPLACE_META: Record<
  CountryCode,
  {
    title: string;
    description: string;
    ogLocale: string;
    keywords: string[];
  }
> = {
  GE: {
    title: "Homico - Tbilisi renovation pros",
    description: "Find vetted home renovation pros in Tbilisi. Clear quotes, real reviews, no chasing.",
    ogLocale: "ka_GE",
    keywords: ["Tbilisi renovation", "Tbilisi handyman", "Tbilisi plumber", "Georgia home services"],
  },
  IL: {
    title: "Homico - Tel Aviv renovation pros",
    description: "Find vetted home renovation pros in Tel Aviv. Clear quotes, real reviews, no chasing.",
    ogLocale: "he_IL",
    keywords: ["Tel Aviv renovation", "Israel handyman", "Tel Aviv plumber", "Israel home services"],
  },
  FR: {
    title: "Homico - Paris renovation pros",
    description: "Find vetted home renovation pros in Paris. Clear quotes, real reviews, no chasing.",
    ogLocale: "fr_FR",
    keywords: ["Paris renovation", "Paris artisan", "Paris plombier", "France home services"],
  },
  US: {
    title: "Homico - New York renovation pros",
    description: "Find vetted home renovation pros in New York. Clear quotes, real reviews, no chasing.",
    ogLocale: "en_US",
    keywords: ["New York renovation", "NYC handyman", "NYC plumber", "USA home services"],
  },
  DE: {
    title: "Homico - Berlin renovation pros",
    description: "Find vetted home renovation pros in Berlin. Clear quotes, real reviews, no chasing.",
    ogLocale: "de_DE",
    keywords: ["Berlin renovation", "Berlin Handwerker", "Berlin Klempner", "Germany home services"],
  },
  UK: {
    title: "Homico - London renovation pros",
    description: "Find vetted home renovation pros in London. Clear quotes, real reviews, no chasing.",
    ogLocale: "en_GB",
    keywords: ["London renovation", "London handyman", "London plumber", "UK home services"],
  },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://homico.co";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country: raw } = await params;
  const code = raw.toUpperCase() as CountryCode;
  if (!(SUPPORTED_COUNTRIES as readonly string[]).includes(code)) {
    return {};
  }
  const meta = MARKETPLACE_META[code];
  const url = `${APP_URL}/${raw.toLowerCase()}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      locale: meta.ogLocale,
      siteName: "Homico",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function CountryLayout({ children }: Props) {
  return children;
}

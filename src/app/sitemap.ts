import { MetadataRoute } from 'next';
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, type CountryCode } from '@/data/countries';

// Marketplaces live under homico.co (the international root); the
// legacy homico.ge alias still resolves but search engines should
// canonicalise on .co.
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://homico.co';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Country-scoped page slugs that get a sitemap entry per marketplace.
// Keep in sync with COUNTRY_SCOPED_FIRST_SEGMENTS in middleware.ts -
// any segment listed there is also listed here so search engines
// crawl every marketplace's copy of the page.
const COUNTRY_SCOPED_PAGES: { slug: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { slug: '',                  priority: 1.0, freq: 'daily' },
  { slug: 'professionals',     priority: 0.9, freq: 'daily' },
  { slug: 'jobs',              priority: 0.9, freq: 'daily' },
  { slug: 'become-pro',        priority: 0.7, freq: 'monthly' },
  { slug: 'post-job',          priority: 0.7, freq: 'monthly' },
  { slug: 'how-it-works',      priority: 0.6, freq: 'monthly' },
  { slug: 'for-business',      priority: 0.6, freq: 'monthly' },
  { slug: 'tools',             priority: 0.6, freq: 'monthly' },
];

// Pages that are country-agnostic (auth, help, settings live behind
// auth so they're disallowed in robots.txt already). Help is public
// and worth crawling once globally.
const AGNOSTIC_PAGES: { slug: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { slug: 'help',  priority: 0.5, freq: 'monthly' },
  { slug: 'about', priority: 0.5, freq: 'monthly' },
];

function urlFor(country: CountryCode, slug: string): string {
  const seg = country.toLowerCase();
  return slug ? `${BASE_URL}/${seg}/${slug}` : `${BASE_URL}/${seg}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Per-country static pages. Each marketplace gets its own URL set
  // so a US visitor's organic landing is /us/professionals, not the
  // legacy /professionals which 307s to /ge/.
  for (const country of SUPPORTED_COUNTRIES) {
    for (const page of COUNTRY_SCOPED_PAGES) {
      entries.push({
        url: urlFor(country, page.slug),
        lastModified: now,
        changeFrequency: page.freq,
        priority: page.priority,
      });
    }
  }

  // Country-agnostic pages
  for (const page of AGNOSTIC_PAGES) {
    entries.push({
      url: `${BASE_URL}/${page.slug}`,
      lastModified: now,
      changeFrequency: page.freq,
      priority: page.priority,
    });
  }

  // Dynamic professional profiles - emit per marketplace they belong to
  // so /us pros are crawled under /us/professionals/[id] and /ge pros
  // under /ge/professionals/[id]. The backend filters by `?country=`
  // (added 2026-05); we ask for each market's top 500 by rating.
  for (const country of SUPPORTED_COUNTRIES) {
    try {
      const prosRes = await fetch(
        `${API_URL}/users/pros?limit=500&sort=rating&country=${country}`,
        { next: { revalidate: 3600 } },
      );
      if (!prosRes.ok) continue;
      const prosData = await prosRes.json();
      const pros = prosData.data || [];
      for (const pro of pros as { _id?: string; id?: string; uid?: number; updatedAt?: string }[]) {
        const id = pro.uid ?? pro._id ?? pro.id;
        if (!id) continue;
        entries.push({
          url: urlFor(country, `professionals/${id}`),
          lastModified: pro.updatedAt ? new Date(pro.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    } catch {
      // Silently fail - sitemap generation shouldn't break the build
    }
  }

  // Dynamic open jobs - same per-marketplace pattern
  for (const country of SUPPORTED_COUNTRIES) {
    try {
      const jobsRes = await fetch(
        `${API_URL}/jobs?limit=200&status=open&sort=newest&country=${country}`,
        { next: { revalidate: 3600 } },
      );
      if (!jobsRes.ok) continue;
      const jobsData = await jobsRes.json();
      const jobs = jobsData.data || jobsData.jobs || [];
      for (const job of jobs as { _id?: string; id?: string; updatedAt?: string }[]) {
        const id = job._id ?? job.id;
        if (!id) continue;
        entries.push({
          url: urlFor(country, `jobs/${id}`),
          lastModified: job.updatedAt ? new Date(job.updatedAt) : now,
          changeFrequency: 'daily',
          priority: 0.6,
        });
      }
    } catch {
      // Silently fail
    }
  }

  // Reference DEFAULT_COUNTRY for IDE jump-to-source while keeping
  // the variable used; the actual default-country routing happens
  // via middleware.ts redirects, not sitemap entries.
  void DEFAULT_COUNTRY;

  return entries;
}

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Marketplaces live under homico.co; the legacy homico.ge alias
  // still resolves but search engines should canonicalise on .co.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://homico.co';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Auth-only surfaces and admin tools stay out of the index.
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/my-jobs/',
          '/my-proposals/',
          '/my-work/',
          '/my-space/',
          '/bookings/',
          '/messages/',
          '/auth/',
          '/register',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://homico.ge';

  // Static pages
  const staticPages = [
    '',
    '/portfolio',
    '/professionals',
    '/jobs',
    '/tools',
    '/how-it-works',
    '/about',
    '/help',
    '/terms',
    '/privacy',
    '/auth/login',
    '/auth/register',
  ];

  const staticRoutes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === '/portfolio' ? 0.9 : 0.7,
  }));

  // TODO: Add dynamic routes for professionals and jobs
  // This would require fetching from the API:
  // const professionals = await fetch(`${API_URL}/professionals`).then(r => r.json());
  // const jobs = await fetch(`${API_URL}/jobs`).then(r => r.json());

  return staticRoutes;
}

import { MetadataRoute } from 'next';

const BASE_URL = 'https://homico.ge';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/professionals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/become-pro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/post-job`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Dynamic professional profiles
  try {
    const prosRes = await fetch(`${API_URL}/users/pros?limit=500&sort=rating`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (prosRes.ok) {
      const prosData = await prosRes.json();
      const pros = prosData.data || [];
      const proRoutes: MetadataRoute.Sitemap = pros.map((pro: { _id?: string; id?: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/professionals/${pro._id || pro.id}`,
        lastModified: pro.updatedAt ? new Date(pro.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
      staticRoutes.push(...proRoutes);
    }
  } catch {
    // Silently fail — sitemap generation shouldn't break
  }

  // Dynamic job listings (open jobs only)
  try {
    const jobsRes = await fetch(`${API_URL}/jobs?limit=200&status=open&sort=newest`, {
      next: { revalidate: 3600 },
    });
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      const jobs = jobsData.data || jobsData.jobs || [];
      const jobRoutes: MetadataRoute.Sitemap = jobs.map((job: { _id?: string; id?: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/jobs/${job._id || job.id}`,
        lastModified: job.updatedAt ? new Date(job.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
      staticRoutes.push(...jobRoutes);
    }
  } catch {
    // Silently fail
  }

  return staticRoutes;
}

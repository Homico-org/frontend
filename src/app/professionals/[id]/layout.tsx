import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

// Category translations for OG description
const categoryTranslations: Record<string, { en: string; ka: string }> = {
  'design': { en: 'Design', ka: 'დიზაინი' },
  'architecture': { en: 'Architecture', ka: 'არქიტექტურა' },
  'construction': { en: 'Construction', ka: 'მშენებლობა' },
  'renovation': { en: 'Renovation', ka: 'რემონტი' },
  'plumbing': { en: 'Plumbing', ka: 'სანტექნიკა' },
  'electrical': { en: 'Electrical', ka: 'ელექტრობა' },
  'hvac': { en: 'HVAC', ka: 'კონდიცირება' },
  'flooring': { en: 'Flooring', ka: 'იატაკი' },
  'painting': { en: 'Painting', ka: 'მხატვრობა' },
  'roofing': { en: 'Roofing', ka: 'სახურავი' },
  'landscaping': { en: 'Landscaping', ka: 'ლანდშაფტი' },
  'cleaning': { en: 'Cleaning', ka: 'დასუფთავება' },
  'moving': { en: 'Moving', ka: 'გადაზიდვა' },
  'furniture': { en: 'Furniture', ka: 'ავეჯი' },
  'appliances': { en: 'Appliances', ka: 'ტექნიკა' },
  'windows-doors': { en: 'Windows & Doors', ka: 'ფანჯარა-კარები' },
  'security': { en: 'Security', ka: 'უსაფრთხოება' },
  'smart-home': { en: 'Smart Home', ka: 'ჭკვიანი სახლი' },
};

async function getProProfile(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/users/pros/${id}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function getImageUrl(path: string | undefined, forOG = false): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // For OG images, ensure we use the public API URL
  const baseUrl = forOG ? 'https://api.homico.ge' : apiUrl;
  if (path.startsWith('/')) return `${baseUrl}${path}`;
  return `${baseUrl}/uploads/${path}`;
}

function getCategoryLabels(categories: string[] | undefined): string {
  if (!categories || categories.length === 0) return '';
  return categories
    .map(cat => categoryTranslations[cat]?.ka || cat)
    .join(', ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProProfile(id);

  const siteUrl = 'https://homico.ge';
  const pageUrl = `${siteUrl}/professionals/${id}`;
  const defaultImage = `${siteUrl}/og-image.png`;

  if (!profile) {
    return {
      title: 'პროფესიონალი | Homico',
      description: 'იპოვე საუკეთესო პროფესიონალები საქართველოში',
      openGraph: {
        title: 'პროფესიონალი | Homico',
        description: 'იპოვე საუკეთესო პროფესიონალები საქართველოში',
        url: pageUrl,
        siteName: 'Homico',
        type: 'website',
        images: [{ url: defaultImage, width: 1200, height: 630, alt: 'Homico' }],
        locale: 'ka_GE',
      },
    };
  }

  const categoryLabels = getCategoryLabels(profile.categories);
  const title = `${profile.name} - ${profile.title || 'პროფესიონალი'} | Homico`;

  // Build a rich description with categories and stats
  let descriptionParts: string[] = [];
  if (profile.title) descriptionParts.push(profile.title);
  if (categoryLabels) descriptionParts.push(categoryLabels);
  if (profile.avgRating > 0) descriptionParts.push(`${profile.avgRating.toFixed(1)}★ (${profile.totalReviews || 0} შეფასება)`);
  if (profile.yearsExperience) descriptionParts.push(`${profile.yearsExperience}+ წლის გამოცდილება`);
  if (profile.serviceAreas?.[0]) descriptionParts.push(profile.serviceAreas[0]);

  const description = descriptionParts.length > 0
    ? descriptionParts.join(' | ')
    : (profile.description ? profile.description.slice(0, 160) : `${profile.name} - პროფესიონალი Homico-ზე`);

  // Use avatar for OG image, with absolute URL
  const avatarUrl = getImageUrl(profile.avatar, true);
  const ogImage = avatarUrl || defaultImage;

  return {
    title,
    description,
    openGraph: {
      title: `${profile.name} | ${profile.title || 'პროფესიონალი'}`,
      description,
      url: pageUrl,
      siteName: 'Homico',
      type: 'profile',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: profile.name,
        },
      ],
      locale: 'ka_GE',
    },
    twitter: {
      card: 'summary',
      title: `${profile.name} | Homico`,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      'fb:app_id': process.env.NEXT_PUBLIC_FB_APP_ID || '',
    },
  };
}

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

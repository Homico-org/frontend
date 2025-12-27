import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

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

function getImageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  if (path.startsWith('/')) return `${apiUrl}${path}`;
  return `${apiUrl}/uploads/${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProProfile(id);

  if (!profile) {
    return {
      title: 'პროფესიონალი | Homico',
      description: 'იპოვე საუკეთესო პროფესიონალები საქართველოში',
    };
  }

  const title = `${profile.name} - ${profile.title || 'პროფესიონალი'} | Homico`;
  const description = profile.description
    ? profile.description.slice(0, 160)
    : `${profile.name} - ${profile.title || 'პროფესიონალი'}. ${profile.avgRating > 0 ? `შეფასება: ${profile.avgRating.toFixed(1)}★` : ''} ${profile.yearsExperience ? `გამოცდილება: ${profile.yearsExperience}+ წელი` : ''}`.trim();

  const avatarUrl = getImageUrl(profile.avatar);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homico.ge';
  const pageUrl = `${siteUrl}/professionals/${id}`;

  return {
    title,
    description,
    openGraph: {
      title: `${profile.name} | Homico`,
      description,
      url: pageUrl,
      siteName: 'Homico',
      type: 'profile',
      images: avatarUrl
        ? [
            {
              url: avatarUrl,
              width: 400,
              height: 400,
              alt: profile.name,
            },
          ]
        : [],
      locale: 'ka_GE',
    },
    twitter: {
      card: 'summary',
      title: `${profile.name} | Homico`,
      description,
      images: avatarUrl ? [avatarUrl] : [],
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
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

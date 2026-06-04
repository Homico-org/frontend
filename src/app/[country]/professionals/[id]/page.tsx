import { Metadata } from "next";
import ProfessionalDetailClient from "./ProfessionalDetailClient";

// Fetch profile data for metadata and initial hydration
async function getProfile(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/users/pros/${id}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// Helper to get absolute image URL for OG
function getAbsoluteImageUrl(avatar: string | undefined): string {
  if (!avatar) {
    // Default Homico OG image
    return "https://homico.ge/og-image.png";
  }

  // If already absolute URL (including Cloudinary)
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    // For Cloudinary URLs, add transformation for OG size
    if (avatar.includes("cloudinary.com") && avatar.includes("/upload/")) {
      // Insert transformation before the version/public_id part
      return avatar.replace("/upload/", "/upload/w_1200,h_630,c_fill,g_face/");
    }
    return avatar;
  }

  // Construct Cloudinary URL from path
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "homico";
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,g_face/${avatar}`;
}

export async function generateMetadata({
  params
}: {
  params: { country: string; id: string }
}): Promise<Metadata> {
  const profile = await getProfile(params.id);

  if (!profile) {
    return {
      title: "Professional Not Found | Homico",
      description: "The professional profile you're looking for could not be found.",
    };
  }

  const title = `${profile.name} - ${profile.title} | Homico`;
  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `${profile.name} is a ${profile.title} on Homico. ${profile.avgRating ? `Rating: ${profile.avgRating.toFixed(1)}/5` : ""} ${profile.totalReviews ? `(${profile.totalReviews} reviews)` : ""}`.trim();

  const imageUrl = getAbsoluteImageUrl(profile.avatar);
  // Canonical URL includes the marketplace country segment (added
  // 2026-05). Country comes from the route param so cross-marketplace
  // share links resolve back to the right /{country}/professionals/{id}.
  const profileUrl = `https://homico.co/${params.country}/professionals/${profile.id}`;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      url: profileUrl,
      siteName: "Homico",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.name} - ${profile.title}`,
        },
      ],
      locale: "ka_GE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: profileUrl,
    },
    other: {
      "linkedin:owner": profileUrl,
    },
  };
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: { country: string; id: string };
}) {
  // Fetch profile server-side for faster initial load. The `country`
  // param is now part of the URL but the API still fetches by pro id
  // alone - the marketplace scope is enforced by the client's
  // country-aware listing query, not at the detail endpoint (a pro is
  // a pro regardless of which marketplace landed you on their page).
  const initialProfile = await getProfile(params.id);
  // Cast to any to avoid type mismatch between server-fetched data and client ProProfile type
  // The API returns the same structure, but TypeScript can't verify this at compile time
  return <ProfessionalDetailClient initialProfile={initialProfile as any} />;
}

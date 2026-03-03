import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://homico.ge";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "homico";
const DEFAULT_OG_IMAGE = `${APP_URL}/og-image.png`;

// Helper: build an absolute OG-friendly image URL from whatever the backend returns
function getAbsoluteImageUrl(path: string | undefined): string {
  if (!path) return DEFAULT_OG_IMAGE;

  // Already absolute (Cloudinary, S3, etc.)
  if (path.startsWith("http://") || path.startsWith("https://")) {
    // Cloudinary: inject OG-optimised transformation
    if (path.includes("cloudinary.com") && path.includes("/upload/")) {
      return path.replace("/upload/", "/upload/w_1200,h_630,c_fill,q_auto,f_auto/");
    }
    return path;
  }

  // Relative path starting with /uploads → prepend API URL
  if (path.startsWith("/uploads")) {
    return `${API_URL}${path}`;
  }

  // Bare filename → assume Cloudinary public_id
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${path}`;
}

// Format budget into a display string
function formatPrice(job: Record<string, unknown>): string {
  const budgetType = job.budgetType as string;
  const budgetAmount = job.budgetAmount as number | undefined;
  const budgetMin = job.budgetMin as number | undefined;
  const budgetMax = job.budgetMax as number | undefined;
  const pricePerUnit = job.pricePerUnit as number | undefined;

  if (budgetType === "fixed" && (budgetAmount || budgetMin)) {
    return `${(budgetAmount ?? budgetMin)!.toLocaleString()} ₾`;
  }
  if (budgetType === "range" && budgetMin && budgetMax) {
    return `${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()} ₾`;
  }
  if (budgetType === "per_sqm" && pricePerUnit) {
    return `${pricePerUnit.toLocaleString()} ₾/მ²`;
  }
  return "შეთანხმებით";
}

// Pick the first usable image from the job
function pickImage(job: Record<string, unknown>): string | undefined {
  const media = job.media as Array<{ type: string; url: string }> | undefined;
  const images = job.images as string[] | undefined;

  const fromMedia = media?.find((m) => m.type === "image")?.url;
  if (fromMedia) return fromMedia;

  if (images && images.length > 0) return images[0];
  return undefined;
}

// Generate dynamic metadata for social sharing (Facebook, Twitter, etc.)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(`${API_URL}/jobs/${id}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        title: "სამუშაო | Homico",
        description: "იპოვე სპეციალისტი შენი პროექტისთვის",
      };
    }

    const job = await response.json();

    const priceText = formatPrice(job);
    const title = `${job.title} • ${priceText}`;
    const rawDesc = (job.description as string) || "";
    const shortDescription = rawDesc.length > 200 ? rawDesc.slice(0, 200) + "..." : rawDesc;
    const ogDescription = `💰 ${priceText} • ${rawDesc.length > 150 ? rawDesc.slice(0, 150) + "..." : rawDesc}`;
    const imageUrl = getAbsoluteImageUrl(pickImage(job));
    const jobUrl = `${APP_URL}/jobs/${id}`;

    // Client info for richer preview
    const clientName = (job.clientId as Record<string, unknown>)?.name as string | undefined;
    const location = job.location as string | undefined;
    const locationText = location ? ` • 📍 ${location}` : "";
    const clientText = clientName ? ` • 👤 ${clientName}` : "";
    const richDescription = `${ogDescription}${locationText}${clientText}`;

    return {
      title: `${job.title} | ${priceText} | Homico`,
      description: shortDescription,
      openGraph: {
        title,
        description: richDescription,
        url: jobUrl,
        siteName: "Homico",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: job.title as string,
          },
        ],
        locale: "ka_GE",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: richDescription,
        images: [imageUrl],
      },
      other: {
        "og:updated_time": (job.updatedAt as string) || "",
        "article:published_time": (job.createdAt as string) || "",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "სამუშაო | Homico",
      description: "იპოვე სპეციალისტი შენი პროექტისთვის",
    };
  }
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}

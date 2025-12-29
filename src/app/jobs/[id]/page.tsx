import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for social sharing (Facebook, Twitter, etc.)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (!response.ok) {
      return {
        title: "სამუშაო | Homi",
        description: "იპოვე სპეციალისტი შენი პროექტისთვის",
      };
    }

    const job = await response.json();

    const description = job.description?.slice(0, 200) + (job.description?.length > 200 ? "..." : "") || "";
    const imageUrl = job.images?.[0] || job.media?.[0]?.url
      ? `${process.env.NEXT_PUBLIC_STORAGE_URL || ""}/${job.images?.[0] || job.media?.[0]?.url}`
      : `${process.env.NEXT_PUBLIC_APP_URL || "https://homi.ge"}/og-image.png`;

    return {
      title: `${job.title} | Homi`,
      description: description,
      openGraph: {
        title: job.title,
        description: description,
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://homi.ge"}/jobs/${id}`,
        siteName: "Homi",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: job.title,
          },
        ],
        locale: "ka_GE",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: job.title,
        description: description,
        images: [imageUrl],
      },
      other: {
        "fb:app_id": process.env.NEXT_PUBLIC_FB_APP_ID || "1234567890",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "სამუშაო | Homi",
      description: "იპოვე სპეციალისტი შენი პროექტისთვის",
    };
  }
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}

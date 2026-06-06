import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";
import { currencySymbol } from "@/utils/currency";

interface Props {
  params: Promise<{ country: string; id: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://homico.co";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Format budget into a display string. Uses the job's stored currency
// (set when posted), falling back to the job's marketplace country so
// older docs created before the currency field still render correctly.
function formatPrice(job: Record<string, unknown>): string {
  const budgetType = job.budgetType as string;
  const budgetAmount = job.budgetAmount as number | undefined;
  const budgetMin = job.budgetMin as number | undefined;
  const budgetMax = job.budgetMax as number | undefined;
  const pricePerUnit = job.pricePerUnit as number | undefined;
  const currency = job.currency as string | undefined;
  const country = (job.country as string | undefined) || "GE";
  const sym = currency
    ? currencySymbol({ currency })
    : currencySymbol({ country });

  if (budgetType === "fixed" && (budgetAmount || budgetMin)) {
    return `${(budgetAmount ?? budgetMin)!.toLocaleString()} ${sym}`;
  }
  if (budgetType === "range" && budgetMin && budgetMax) {
    return `${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()} ${sym}`;
  }
  if (budgetType === "per_sqm" && pricePerUnit) {
    return `${pricePerUnit.toLocaleString()} ${sym}/მ²`;
  }
  return "შეთანხმებით";
}

// Generate dynamic metadata for social sharing (Facebook, Twitter, etc.)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, id } = await params;

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
    const title = `${job.title} · ${priceText}`;
    const rawDesc = (job.description as string) || "";

    // Rich, native description: price + location lead, then a snippet of the
    // brief. Plain separators only (no emoji clutter, no em-dash).
    const snippet =
      rawDesc.length > 150 ? rawDesc.slice(0, 150).trimEnd() + "…" : rawDesc;
    const location = job.location as string | undefined;
    const lead = [priceText, location].filter(Boolean).join(" · ");
    const richDescription = snippet ? `${lead} · ${snippet}` : `${lead} · სამუშაო Homico-ზე. ნახეთ დეტალები და გააგზავნეთ შეთავაზება.`;
    const shortDescription = snippet || "სამუშაო Homico-ზე. ნახეთ დეტალები და გააგზავნეთ შეთავაზება.";

    // Branded share card - always shows the current Homico logo + job
    // details, whether or not the job has a photo. Never falls back to the
    // old static /og-image.png.
    const imageUrl = `${APP_URL}/api/og/job?id=${id}`;
    // Canonical URL includes the marketplace country segment (added
    // 2026-05). Share links carry the marketplace context so the
    // recipient lands on the same /[country]/jobs/[id] page.
    const jobUrl = `${APP_URL}/${country}/jobs/${id}`;

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

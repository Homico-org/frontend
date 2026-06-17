import { ImageResponse } from "next/og";
import { currencySymbol } from "@/utils/currency";
import { jobServicesTotal } from "@/utils/jobPrice";

// Per-job social share card (Facebook / Twitter / WhatsApp preview).
// Always renders the CURRENT Homico logo + job details, so a share never
// falls back to the old static /og-image.png and never shows a bare photo
// without branding. Referenced explicitly from the job page's
// generateMetadata as `${APP_URL}/api/og/job?id=...`.

export const runtime = "edge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "homico";

const VERMILLION = "#EF4E24";
const INK = "#14120E";
const PAPER = "#FAFAF7";

function absoluteImage(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (path.includes("cloudinary.com") && path.includes("/upload/")) {
      return path.replace(
        "/upload/",
        "/upload/w_1200,h_630,c_fill,q_auto,f_auto/",
      );
    }
    return path;
  }
  if (path.startsWith("/uploads")) return `${API_URL}${path}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${path}`;
}

function pickImage(job: Record<string, unknown>): string | undefined {
  const media = job.media as Array<{ type: string; url: string }> | undefined;
  const images = job.images as string[] | undefined;
  const fromMedia = media?.find((m) => m.type === "image")?.url;
  if (fromMedia) return fromMedia;
  if (images && images.length > 0) return images[0];
  return undefined;
}

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
  const n = (v: number) => v.toLocaleString("en-US").replace(/,/g, " ");

  // Service-based jobs: show the total of all selected services, not the
  // legacy single budgetAmount. Mirrors the metadata in the job page.
  const servicesTotal = jobServicesTotal(job);
  if (servicesTotal) {
    return `${n(servicesTotal)} ${sym}`;
  }

  if (budgetType === "fixed" && (budgetAmount || budgetMin)) {
    return `${n((budgetAmount ?? budgetMin)!)} ${sym}`;
  }
  if (budgetType === "range" && budgetMin && budgetMax) {
    return `${n(budgetMin)} - ${n(budgetMax)} ${sym}`;
  }
  if (budgetType === "per_sqm" && pricePerUnit) {
    return `${n(pricePerUnit)} ${sym}/მ²`;
  }
  return "შეთანხმებით";
}

// Load a Georgian-capable font subset so the (usually Georgian) job title
// renders as real glyphs instead of tofu boxes. The old User-Agent forces
// Google to return a ttf (ImageResponse cannot parse woff2).
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@700&text=${encodeURIComponent(
      text,
    )}`;
    const css = await (
      await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:1.9)" },
      })
    ).text();
    const match = css.match(/src:\s*url\((https:[^)]+)\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let job: Record<string, unknown> | null = null;
  if (id) {
    try {
      const r = await fetch(`${API_URL}/jobs/${id}`, {
        next: { revalidate: 60 },
      });
      if (r.ok) job = await r.json();
    } catch {
      /* fall through to a brand-only card */
    }
  }

  const titleRaw = (job?.title as string) || "Homico";
  const title =
    titleRaw.length > 88 ? titleRaw.slice(0, 86).trimEnd() + "…" : titleRaw;
  const price = job ? formatPrice(job) : "";
  const location = (job?.location as string) || "";
  const eyebrow = "სამუშაო · Homico";
  const photo = job ? absoluteImage(pickImage(job)) : undefined;
  const hasPhoto = !!photo;

  const fontText = `${title}${price}${location}${eyebrow}Homico 0123456789 ·-…/მ²₾`;
  const font = await loadFont(fontText);

  const fg = hasPhoto ? "#FFFFFF" : INK;
  const subFg = hasPhoto ? "rgba(255,255,255,0.82)" : "#5E594C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: PAPER,
          fontFamily: font ? "NotoGeo" : "sans-serif",
        }}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background: `linear-gradient(135deg, #FEEDE6 0%, ${PAPER} 55%, #FBD3C5 100%)`,
            }}
          />
        )}

        {hasPhoto && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "linear-gradient(180deg, rgba(20,18,14,0) 28%, rgba(20,18,14,0.55) 62%, rgba(20,18,14,0.92) 100%)",
            }}
          />
        )}

        {/* Brand badge - always present */}
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 48,
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "12px 22px 12px 14px",
            borderRadius: 9999,
            background: "#FFFFFF",
            boxShadow: "0 6px 22px rgba(20,18,14,0.16)",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 34,
              height: 34,
              background: INK,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 17,
                height: 17,
                background: VERMILLION,
                borderRadius: 2,
                transform: "rotate(45deg)",
                right: 5,
                top: 8,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            Homico
          </div>
        </div>

        {/* Job details */}
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 54,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 9,
                height: 9,
                borderRadius: 9999,
                background: VERMILLION,
              }}
            />
            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: hasPhoto ? "rgba(255,255,255,0.9)" : VERMILLION,
                letterSpacing: "0.02em",
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 700,
              color: fg,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              maxWidth: 1040,
            }}
          >
            {title}
          </div>

          {(price || location) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 26,
              }}
            >
              {price && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 22px",
                    borderRadius: 9999,
                    background: VERMILLION,
                    color: "#FFFFFF",
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {price}
                </div>
              )}
              {location && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    fontSize: 24,
                    fontWeight: 500,
                    color: subFg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: 7,
                      height: 7,
                      borderRadius: 9999,
                      background: hasPhoto
                        ? "rgba(255,255,255,0.6)"
                        : "#A89B80",
                    }}
                  />
                  {location}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font
        ? [{ name: "NotoGeo", data: font, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}

import { ImageResponse } from "next/og";

// Branded social share card for a professional profile. Always carries the
// current Homico logo + the pro's avatar, name, rating and trades - so a
// share never falls back to the old static /og-image.png or a bare avatar.
// Referenced from the profile layout's generateMetadata as
// `${APP_URL}/api/og/pro?id=...`.

export const runtime = "edge";

const API_URL =
  process.env.NEXT_PUBLIC_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.homico.ge";
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "homico";

const VERMILLION = "#EF4E24";
const INK = "#14120E";
const PAPER = "#FAFAF7";

function absoluteImage(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (path.includes("cloudinary.com") && path.includes("/upload/")) {
      return path.replace("/upload/", "/upload/w_400,h_400,c_fill,q_auto,f_auto/");
    }
    return path;
  }
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${path}`;
}

// Georgian-capable font subset so the (usually Georgian) name/title/trades
// render as glyphs, not tofu. Old User-Agent forces a ttf (not woff2).
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

  let pro: Record<string, unknown> | null = null;
  if (id) {
    try {
      const r = await fetch(`${API_URL}/users/pros/${id}`, {
        next: { revalidate: 300 },
      });
      if (r.ok) pro = await r.json();
    } catch {
      /* fall through to a brand-only card */
    }
  }

  const nameRaw = (pro?.name as string) || "Homico";
  const name = nameRaw.length > 36 ? nameRaw.slice(0, 34) + "…" : nameRaw;
  const title = (pro?.title as string) || "";
  const area = (pro?.serviceAreas as string[] | undefined)?.[0] || "";
  const rating =
    typeof pro?.avgRating === "number" && pro.avgRating > 0
      ? (pro.avgRating as number).toFixed(1)
      : "";
  const reviews = (pro?.totalReviews as number | undefined) || 0;
  const avatar = absoluteImage(pro?.avatar as string | undefined);
  const eyebrow = "პროფესიონალი · Homico";

  const fontText = `${name}${title}${area}${eyebrow}Homico 0123456789. ·-…შეფასება`;
  const font = await loadFont(fontText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, #FEEDE6 0%, ${PAPER} 55%, #FBD3C5 100%)`,
          fontFamily: font ? "NotoGeo" : "sans-serif",
          padding: 72,
          alignItems: "center",
          gap: 56,
        }}
      >
        {/* Brand badge */}
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
            boxShadow: "0 6px 22px rgba(20,18,14,0.14)",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 32,
              height: 32,
              background: INK,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                background: VERMILLION,
                borderRadius: 2,
                transform: "rotate(45deg)",
                right: 5,
                top: 8,
              }}
            />
          </div>
          <div style={{ fontSize: 25, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>
            Homico
          </div>
        </div>

        {/* Avatar */}
        <div
          style={{
            display: "flex",
            width: 300,
            height: 300,
            flexShrink: 0,
            borderRadius: 36,
            overflow: "hidden",
            background: "#FFFFFF",
            boxShadow: "0 20px 50px -20px rgba(20,18,14,0.45)",
          }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" width={300} height={300} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: INK,
                color: "#FFFFFF",
                fontSize: 120,
                fontWeight: 700,
              }}
            >
              {name.slice(0, 1)}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", width: 9, height: 9, borderRadius: 9999, background: VERMILLION }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: VERMILLION, letterSpacing: "0.02em" }}>
              {eyebrow}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: INK, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {name}
          </div>

          {title && (
            <div style={{ display: "flex", marginTop: 12, fontSize: 28, fontWeight: 500, color: "#5E594C" }}>
              {title}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
            {rating && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 9999,
                  background: VERMILLION,
                  color: "#FFFFFF",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#FFFFFF"
                  />
                </svg>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{rating}</span>
                {reviews > 0 && (
                  <span style={{ fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                    · {reviews} შეფასება
                  </span>
                )}
              </div>
            )}
            {area && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: 500, color: "#5E594C" }}>
                <div style={{ display: "flex", width: 7, height: 7, borderRadius: 9999, background: "#A89B80" }} />
                {area}
              </div>
            )}
          </div>
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

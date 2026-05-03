import { ImageResponse } from "next/og";

// Dynamic OG image for the entire site — generated from brand tokens at request
// time so it never drifts from the design system. Replaces the old static
// /og-image.png. Next.js auto-wires this into every page's open-graph and
// twitter-image meta tags (no need to reference it in layout metadata).
//
// To override per-route, drop another opengraph-image.tsx into that route.

export const runtime = "edge";
export const alt = "Homico — vetted home renovation pros in Tbilisi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Brand tokens (mirror src/constants/theme.ts)
  const VERMILLION = "#EF4E24";
  const VERMILLION_50 = "#FEEDE6";
  const VERMILLION_100 = "#FBD3C5";
  const INK = "#14120E";
  const FG_SECONDARY = "#3D3930";
  const FG_MUTED = "#5E594C";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${VERMILLION_50} 0%, #FFFFFF 50%, ${VERMILLION_100} 100%)`,
          padding: 96,
          position: "relative",
        }}
      >
        {/* Decorative blob — top-right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: VERMILLION,
            opacity: 0.12,
            filter: "blur(60px)",
          }}
        />
        {/* Decorative blob — bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: VERMILLION,
            opacity: 0.08,
            filter: "blur(80px)",
          }}
        />

        {/* Homico logo: dark square + vermillion diamond (mirrors HomicoLogo.tsx) */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 144,
            height: 144,
            background: INK,
            borderRadius: 18,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 76,
              height: 76,
              background: VERMILLION,
              borderRadius: 4,
              transform: "rotate(45deg)",
              right: 18,
              top: 34,
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: INK,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Homico
        </div>

        {/* Tagline — English (Latin) so we don't need to fetch a Georgian
            font for the edge runtime. The page's <html lang="ka"> + Georgian
            meta description still serve KA traffic correctly. */}
        <div
          style={{
            fontSize: 38,
            color: FG_SECONDARY,
            textAlign: "center",
            maxWidth: 920,
            lineHeight: 1.25,
            fontWeight: 500,
          }}
        >
          Vetted home renovation pros in Tbilisi
        </div>

        {/* Trust strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginTop: 40,
            fontSize: 22,
            color: FG_MUTED,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: VERMILLION,
              }}
            />
            Clear quotes
          </span>
          <span style={{ color: "#C9C3B5" }}>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: VERMILLION,
              }}
            />
            Real reviews
          </span>
          <span style={{ color: "#C9C3B5" }}>·</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: VERMILLION,
              }}
            />
            No chasing
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

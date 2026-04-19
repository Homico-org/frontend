import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#14120E',
          position: 'relative',
        }}
      >
        {/* Subtle brand glow */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,78,36,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Brand mark — ink square + vermillion diamond */}
        <div style={{ display: 'flex', position: 'relative', width: 120, height: 120, marginBottom: 40 }}>
          {/* Ink square */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#FAF7F2',
            }}
          />
          {/* Vermillion diamond */}
          <div
            style={{
              position: 'absolute',
              width: 52,
              height: 52,
              backgroundColor: '#EF4E24',
              transform: 'rotate(45deg)',
              top: '50%',
              left: '50%',
              marginTop: -26,
              marginLeft: -26,
            }}
          />
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: '#FAF7F2',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Homico
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: '#A89B80',
            letterSpacing: '0.16em',
            textTransform: 'uppercase' as const,
          }}
        >
          Home Services Marketplace
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: '#EF4E24',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function AppBackground() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render anything on mobile
  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
      {/* Visible Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.25,
        }}
      />

      {/* Secondary smaller grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-border-subtle) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.25,
        }}
      />

      {/* Terracotta Gradient Orb - Top Right */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          top: '-150px',
          right: '-100px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(210, 105, 30, 0.12) 0%, rgba(210, 105, 30, 0.04) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Terracotta Gradient Orb - Bottom Left */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-100px',
          left: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(205, 133, 63, 0.10) 0%, rgba(205, 133, 63, 0.03) 40%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'float 20s ease-in-out infinite',
        }}
      />

      {/* Medium Accent Orb - Center */}
      <div
        className="absolute rounded-full"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(210, 105, 30, 0.06) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Floating Geometric Objects */}
      <div>
        {/* Large hollow square - top left area */}
        <div
          className="absolute"
          style={{
            top: '12%',
            left: '15%',
            width: '80px',
            height: '80px',
            border: '2px solid rgba(210, 105, 30, 0.12)',
            borderRadius: '8px',
            animation: 'floatRotate 30s ease-in-out infinite',
          }}
        />

        {/* Medium hollow circle - right side */}
        <div
          className="absolute"
          style={{
            top: '55%',
            right: '12%',
            width: '100px',
            height: '100px',
            border: '2px solid rgba(205, 133, 63, 0.10)',
            borderRadius: '50%',
            animation: 'floatRotate 25s ease-in-out infinite reverse',
          }}
        />

        {/* Small filled circle - accent */}
        <div
          className="absolute rounded-full"
          style={{
            top: '25%',
            right: '30%',
            width: '12px',
            height: '12px',
            background: 'rgba(210, 105, 30, 0.20)',
            animation: 'float 15s ease-in-out infinite',
          }}
        />

        {/* Another small filled circle */}
        <div
          className="absolute rounded-full"
          style={{
            top: '70%',
            left: '25%',
            width: '8px',
            height: '8px',
            background: 'rgba(205, 133, 63, 0.15)',
            animation: 'float 18s ease-in-out infinite reverse',
          }}
        />

        {/* Diamond shape - bottom right */}
        <div
          className="absolute"
          style={{
            bottom: '20%',
            right: '25%',
            width: '50px',
            height: '50px',
            border: '2px solid rgba(210, 105, 30, 0.10)',
            transform: 'rotate(45deg)',
            animation: 'floatDiamond 22s ease-in-out infinite',
          }}
        />

        {/* Another diamond - top area */}
        <div
          className="absolute"
          style={{
            top: '18%',
            left: '40%',
            width: '30px',
            height: '30px',
            border: '1.5px solid rgba(205, 133, 63, 0.08)',
            transform: 'rotate(45deg)',
            animation: 'floatDiamond 28s ease-in-out infinite reverse',
          }}
        />

        {/* Horizontal accent line */}
        <div
          className="absolute"
          style={{
            top: '35%',
            left: '10%',
            right: '10%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(210, 105, 30, 0.08) 30%, rgba(210, 105, 30, 0.08) 70%, transparent 100%)',
          }}
        />

        {/* Another horizontal line */}
        <div
          className="absolute"
          style={{
            top: '65%',
            left: '15%',
            right: '15%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(205, 133, 63, 0.06) 30%, rgba(205, 133, 63, 0.06) 70%, transparent 100%)',
          }}
        />

        {/* Plus/Cross shape */}
        <div
          className="absolute"
          style={{
            top: '45%',
            left: '8%',
            width: '24px',
            height: '2px',
            background: 'rgba(210, 105, 30, 0.12)',
            animation: 'float 20s ease-in-out infinite',
          }}
        >
          <div
            className="absolute"
            style={{
              top: '-11px',
              left: '11px',
              width: '2px',
              height: '24px',
              background: 'rgba(210, 105, 30, 0.12)',
            }}
          />
        </div>

        {/* Another plus shape */}
        <div
          className="absolute"
          style={{
            top: '80%',
            right: '10%',
            width: '20px',
            height: '2px',
            background: 'rgba(205, 133, 63, 0.10)',
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        >
          <div
            className="absolute"
            style={{
              top: '-9px',
              left: '9px',
              width: '2px',
              height: '20px',
              background: 'rgba(205, 133, 63, 0.10)',
            }}
          />
        </div>

        {/* Corner brackets - architectural detail */}
        <div className="absolute top-6 left-6 w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[rgba(210,105,30,0.15)] to-transparent" />
          <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[rgba(210,105,30,0.15)] to-transparent" />
        </div>
        <div className="absolute top-6 right-6 w-16 h-16">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-[rgba(210,105,30,0.15)] to-transparent" />
          <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-[rgba(210,105,30,0.15)] to-transparent" />
        </div>
        <div className="absolute bottom-6 left-6 w-16 h-16">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[rgba(205,133,63,0.12)] to-transparent" />
          <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-[rgba(205,133,63,0.12)] to-transparent" />
        </div>
        <div className="absolute bottom-6 right-6 w-16 h-16">
          <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[rgba(205,133,63,0.12)] to-transparent" />
          <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-[rgba(205,133,63,0.12)] to-transparent" />
        </div>

        {/* Large decorative ring */}
        <div
          className="absolute"
          style={{
            top: '30%',
            right: '-100px',
            width: '300px',
            height: '300px',
            border: '1px solid rgba(210, 105, 30, 0.05)',
            borderRadius: '50%',
            animation: 'spinSlow 60s linear infinite',
          }}
        />
      </div>

      {/* Keyframe animations via global style */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes floatRotate {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(90deg);
          }
          50% {
            transform: translateY(0px) rotate(180deg);
          }
          75% {
            transform: translateY(15px) rotate(270deg);
          }
        }

        @keyframes floatDiamond {
          0%, 100% {
            transform: rotate(45deg) translateY(0px);
          }
          50% {
            transform: rotate(45deg) translateY(-15px);
          }
        }

        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

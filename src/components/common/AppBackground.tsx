'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Floating decorative element wrapper
const FloatingObject = ({
  children,
  x,
  y,
  delay = 0,
  duration = 20,
  rotate = 0,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  delay?: number;
  duration?: number;
  rotate?: number;
}) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      transform: `rotate(${rotate}deg)`,
      animation: `appBgFloat ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }}
  >
    {children}
  </div>
);

// ====== DECORATIVE SVG OBJECTS ======

// Geometric House Shape
const HouseShape = ({ size = 60, opacity = 0.06 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={{ opacity }}>
    <path
      d="M30 8L52 26V52H8V26L30 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
    <rect x="24" y="36" width="12" height="16" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="14" y="30" width="8" height="8" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <rect x="38" y="30" width="8" height="8" stroke="currentColor" strokeWidth="0.75" fill="none" />
  </svg>
);

// Hammer Tool
const Hammer = ({ size = 55, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 55 55" fill="none" style={{ opacity }}>
    <rect x="24" y="20" width="7" height="30" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path
      d="M15 8H40C42 8 44 10 44 12V20H11V12C11 10 13 8 15 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
    <line x1="18" y1="12" x2="18" y2="18" stroke="currentColor" strokeWidth="0.5" />
    <line x1="27.5" y1="12" x2="27.5" y2="18" stroke="currentColor" strokeWidth="0.5" />
    <line x1="37" y1="12" x2="37" y2="18" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

// Paintbrush
const Paintbrush = ({ size = 50, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" style={{ opacity }}>
    <path
      d="M10 40L20 30L30 20C32 18 36 18 38 20L30 28L20 38C18 36 14 38 10 40Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
    <path d="M30 20L40 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="42" cy="8" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Wrench
const Wrench = ({ size = 50, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" style={{ opacity }}>
    <path
      d="M12 38L32 18M32 18C30 14 32 8 38 6C40 12 38 18 32 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 38L8 42C6 44 8 48 12 46L16 42"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Blueprint Grid
const Blueprint = ({ size = 70, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity }}>
    <rect x="5" y="5" width="60" height="60" stroke="currentColor" strokeWidth="1" fill="none" />
    <line x1="5" y1="25" x2="65" y2="25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
    <line x1="5" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
    <line x1="25" y1="5" x2="25" y2="65" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
    <line x1="45" y1="5" x2="45" y2="65" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 2" />
    <circle cx="35" cy="35" r="10" stroke="currentColor" strokeWidth="0.75" fill="none" />
  </svg>
);

// Ruler
const Ruler = ({ size = 80, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size * 0.25} viewBox="0 0 80 20" fill="none" style={{ opacity }}>
    <rect x="2" y="2" width="76" height="16" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
    {[10, 20, 30, 40, 50, 60, 70].map((x) => (
      <line key={x} x1={x} y1="2" x2={x} y2={x % 20 === 0 ? 10 : 7} stroke="currentColor" strokeWidth="0.5" />
    ))}
  </svg>
);

// Light Bulb (Ideas/Design)
const LightBulb = ({ size = 45, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 45 45" fill="none" style={{ opacity }}>
    <path
      d="M22.5 5C15 5 10 11 10 17C10 23 15 26 15 30H30C30 26 35 23 35 17C35 11 30 5 22.5 5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <line x1="15" y1="33" x2="30" y2="33" stroke="currentColor" strokeWidth="1" />
    <line x1="17" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="1" />
    <line x1="19" y1="39" x2="26" y2="39" stroke="currentColor" strokeWidth="1" />
    <path d="M22.5 12V20M18 16H27" stroke="currentColor" strokeWidth="0.75" />
  </svg>
);

// Key (Property/Home)
const Key = ({ size = 50, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" style={{ opacity }}>
    <circle cx="15" cy="15" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="15" cy="15" r="5" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <line x1="22" y1="22" x2="42" y2="42" stroke="currentColor" strokeWidth="1.5" />
    <line x1="35" y1="35" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5" />
    <line x1="40" y1="40" x2="45" y2="35" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// Saw
const Saw = ({ size = 60, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none" style={{ opacity }}>
    <rect x="35" y="8" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path
      d="M5 28L35 13"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5 28L8 25L11 28L14 25L17 28L20 25L23 28L26 25L29 28L32 25L35 28"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

// Tiles/Grid Pattern
const Tiles = ({ size = 50, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" style={{ opacity }}>
    <rect x="5" y="5" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="27" y="5" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="5" y="27" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="27" y="27" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Leaf/Plant (Organic Element)
const Leaf = ({ size = 40, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ opacity }}>
    <path
      d="M20 35C20 35 8 28 8 15C8 8 15 5 20 5C25 5 32 8 32 15C32 28 20 35 20 35Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M20 10V30" stroke="currentColor" strokeWidth="0.75" />
    <path d="M15 15L20 20L25 15" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <path d="M13 22L20 27L27 22" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

// Circle Pattern
const CirclePattern = ({ size = 60, opacity = 0.03 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={{ opacity }}>
    <circle cx="30" cy="30" r="25" stroke="currentColor" strokeWidth="1" fill="none" />
    <circle cx="30" cy="30" r="18" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="30" cy="30" r="4" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

// Hexagon
const Hexagon = ({ size = 50, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" style={{ opacity }}>
    <polygon
      points="25,5 45,15 45,35 25,45 5,35 5,15"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <polygon
      points="25,12 38,19 38,31 25,38 12,31 12,19"
      stroke="currentColor"
      strokeWidth="0.5"
      fill="none"
    />
  </svg>
);

export default function AppBackground() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Theme-aware colors and opacities
  const objectColor = isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(13, 99, 85, 0.35)';
  const objectOpacity = isDark ? 0.08 : 0.12;

  return (
    <>
      {/* Global Keyframes */}
      <style jsx global>{`
        @keyframes appBgFloat {
          0%, 100% {
            transform: translateY(0px) rotate(var(--rotate, 0deg));
            opacity: var(--base-opacity, 1);
          }
          33% {
            transform: translateY(-12px) rotate(calc(var(--rotate, 0deg) + 2deg));
          }
          66% {
            transform: translateY(-6px) rotate(calc(var(--rotate, 0deg) - 1deg));
          }
        }

        @keyframes appBgPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        @keyframes appBgDrift {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(10px) translateY(-5px);
          }
          50% {
            transform: translateX(5px) translateY(8px);
          }
          75% {
            transform: translateX(-8px) translateY(3px);
          }
        }
      `}</style>

      {/* Fixed background layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Gradient Orbs - More visible in light mode */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            top: '-200px',
            right: '-150px',
            background: isDark
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
            opacity: isDark ? 0.6 : 0.8,
            animation: 'appBgDrift 30s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            bottom: '-100px',
            left: '-100px',
            background: isDark
              ? 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
            opacity: isDark ? 0.5 : 0.7,
            animation: 'appBgDrift 25s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            top: '40%',
            left: '60%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            opacity: isDark ? 0.4 : 0.6,
            animation: 'appBgDrift 35s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />

        {/* Floating Objects Container - Theme aware */}
        <div style={{ color: objectColor }}>
          {/* Top Left Zone */}
          <FloatingObject x={3} y={5} delay={0} duration={28}>
            <HouseShape size={65} opacity={isDark ? 0.12 : 0.18} />
          </FloatingObject>
          <FloatingObject x={8} y={25} delay={4} duration={24} rotate={-10}>
            <Hammer size={50} opacity={isDark ? 0.1 : 0.15} />
          </FloatingObject>

          {/* Top Right Zone */}
          <FloatingObject x={85} y={8} delay={2} duration={26} rotate={15}>
            <Blueprint size={75} opacity={isDark ? 0.08 : 0.12} />
          </FloatingObject>
          <FloatingObject x={92} y={20} delay={6} duration={22}>
            <LightBulb size={40} opacity={isDark ? 0.1 : 0.16} />
          </FloatingObject>

          {/* Middle Left Zone */}
          <FloatingObject x={2} y={50} delay={3} duration={30} rotate={5}>
            <Wrench size={45} opacity={isDark ? 0.1 : 0.14} />
          </FloatingObject>
          <FloatingObject x={6} y={70} delay={7} duration={25}>
            <Key size={50} opacity={isDark ? 0.1 : 0.16} />
          </FloatingObject>

          {/* Middle Right Zone */}
          <FloatingObject x={88} y={45} delay={1} duration={27} rotate={-5}>
            <Paintbrush size={55} opacity={isDark ? 0.1 : 0.14} />
          </FloatingObject>
          <FloatingObject x={94} y={65} delay={5} duration={23}>
            <Leaf size={45} opacity={isDark ? 0.1 : 0.16} />
          </FloatingObject>

          {/* Bottom Left Zone */}
          <FloatingObject x={5} y={88} delay={8} duration={29} rotate={10}>
            <Tiles size={55} opacity={isDark ? 0.08 : 0.12} />
          </FloatingObject>

          {/* Bottom Right Zone */}
          <FloatingObject x={85} y={85} delay={4} duration={26}>
            <Hexagon size={50} opacity={isDark ? 0.1 : 0.14} />
          </FloatingObject>

          {/* Scattered Center Elements (very subtle) */}
          <FloatingObject x={25} y={15} delay={2} duration={35} rotate={-8}>
            <Ruler size={90} opacity={isDark ? 0.06 : 0.1} />
          </FloatingObject>
          <FloatingObject x={65} y={30} delay={6} duration={32}>
            <CirclePattern size={55} opacity={isDark ? 0.06 : 0.1} />
          </FloatingObject>
          <FloatingObject x={40} y={75} delay={3} duration={28} rotate={12}>
            <Saw size={65} opacity={isDark ? 0.06 : 0.1} />
          </FloatingObject>
        </div>

        {/* Subtle Grid Overlay - More visible in light mode */}
        <div
          className="absolute inset-0"
          style={{
            opacity: isDark ? 0.02 : 0.03,
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise Texture Overlay */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: isDark ? 0.03 : 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </>
  );
}

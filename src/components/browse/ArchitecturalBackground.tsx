'use client';

import { useEffect, useState } from 'react';

// Architectural and design-themed floating elements
const FloatingElement = ({
  children,
  className = '',
  delay = 0,
  duration = 20,
  x = 0,
  y = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}) => {
  return (
    <div
      className={`absolute pointer-events-none select-none ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `float-gentle ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Blueprint Grid Pattern
const BlueprintGrid = ({ size = 60, opacity = 0.03 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" style={{ opacity }}>
    <rect x="0" y="0" width="60" height="60" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <line x1="20" y1="0" x2="20" y2="60" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
    <line x1="40" y1="0" x2="40" y2="60" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
    <line x1="0" y1="20" x2="60" y2="20" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
    <line x1="0" y1="40" x2="60" y2="40" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
  </svg>
);

// Floor Plan Symbol - Room
const FloorPlanRoom = ({ size = 80, opacity = 0.06 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
    <rect x="8" y="8" width="64" height="64" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="16" y="16" width="20" height="20" stroke="currentColor" strokeWidth="0.75" fill="none" strokeDasharray="3 2" />
    <rect x="44" y="16" width="20" height="20" stroke="currentColor" strokeWidth="0.75" fill="none" strokeDasharray="3 2" />
    <line x1="8" y1="50" x2="25" y2="50" stroke="currentColor" strokeWidth="1" />
    <line x1="35" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" />
    {/* Door arc */}
    <path d="M25 50 Q30 45 35 50" stroke="currentColor" strokeWidth="0.75" fill="none" />
  </svg>
);

// Architectural Compass/Divider
const ArchitecturalCompass = ({ size = 70, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity }}>
    <circle cx="35" cy="15" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
    <line x1="35" y1="19" x2="20" y2="60" stroke="currentColor" strokeWidth="1.5" />
    <line x1="35" y1="19" x2="50" y2="60" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="20" cy="60" r="2" fill="currentColor" fillOpacity="0.5" />
    <path d="M47 55 L50 60 L53 55" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// T-Square Ruler
const TSquareRuler = ({ size = 90, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 90 90" fill="none" style={{ opacity }}>
    <rect x="10" y="10" width="70" height="8" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <rect x="10" y="18" width="8" height="62" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    {/* Measurement marks */}
    {[20, 30, 40, 50, 60, 70].map((x) => (
      <line key={x} x1={x} y1="10" x2={x} y2="14" stroke="currentColor" strokeWidth="0.5" />
    ))}
    {[28, 38, 48, 58, 68].map((y) => (
      <line key={y} x1="10" y1={y} x2="14" y2={y} stroke="currentColor" strokeWidth="0.5" />
    ))}
  </svg>
);

// Triangle Set Square
const SetSquare = ({ size = 65, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 65 65" fill="none" style={{ opacity }}>
    <polygon points="10,55 55,55 10,10" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="10" y1="40" x2="25" y2="55" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
    <circle cx="20" cy="45" r="8" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

// Golden Ratio Spiral
const GoldenSpiral = ({ size = 100, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ opacity }}>
    <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <rect x="10" y="10" width="49.4" height="80" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <rect x="10" y="10" width="49.4" height="49.4" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <path
      d="M59.4 10 Q59.4 59.4 10 59.4"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <path
      d="M10 59.4 Q40 59.4 40 30"
      stroke="currentColor"
      strokeWidth="0.75"
      fill="none"
    />
  </svg>
);

// House Outline
const HouseOutline = ({ size = 75, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 75 75" fill="none" style={{ opacity }}>
    <path d="M10 35 L37.5 10 L65 35" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="15" y="35" width="45" height="30" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="30" y="45" width="15" height="20" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="20" y="42" width="8" height="8" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <rect x="47" y="42" width="8" height="8" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <line x1="24" y1="42" x2="24" y2="50" stroke="currentColor" strokeWidth="0.5" />
    <line x1="20" y1="46" x2="28" y2="46" stroke="currentColor" strokeWidth="0.5" />
    <line x1="51" y1="42" x2="51" y2="50" stroke="currentColor" strokeWidth="0.5" />
    <line x1="47" y1="46" x2="55" y2="46" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

// Brick Pattern
const BrickPattern = ({ size = 70, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 50" fill="none" style={{ opacity }}>
    <rect x="5" y="5" width="28" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <rect x="37" y="5" width="28" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <rect x="5" y="21" width="28" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <rect x="37" y="21" width="28" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    <rect x="21" y="37" width="28" height="12" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
  </svg>
);

// Geometric Window
const GeometricWindow = ({ size = 60, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 80" fill="none" style={{ opacity }}>
    <rect x="5" y="5" width="50" height="70" stroke="currentColor" strokeWidth="1.5" fill="none" rx="2" />
    <line x1="30" y1="5" x2="30" y2="75" stroke="currentColor" strokeWidth="1" />
    <line x1="5" y1="40" x2="55" y2="40" stroke="currentColor" strokeWidth="1" />
    <rect x="10" y="10" width="15" height="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <rect x="35" y="10" width="15" height="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <rect x="10" y="45" width="15" height="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <rect x="35" y="45" width="15" height="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

// Pencil Icon
const ArchitectPencil = ({ size = 80, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
    <rect x="30" y="10" width="10" height="50" stroke="currentColor" strokeWidth="1" fill="none" transform="rotate(15 35 35)" />
    <polygon points="35,62 30,75 40,75" stroke="currentColor" strokeWidth="1" fill="none" transform="rotate(15 35 35)" />
    <line x1="30" y1="55" x2="40" y2="55" stroke="currentColor" strokeWidth="0.75" transform="rotate(15 35 35)" />
  </svg>
);

// Column/Pillar
const ClassicColumn = ({ size = 50, opacity = 0.05 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 50 80" fill="none" style={{ opacity }}>
    <rect x="10" y="5" width="30" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
    <rect x="13" y="11" width="24" height="58" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="10" y="69" width="30" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
    {/* Fluting lines */}
    <line x1="18" y1="14" x2="18" y2="66" stroke="currentColor" strokeWidth="0.5" />
    <line x1="25" y1="14" x2="25" y2="66" stroke="currentColor" strokeWidth="0.5" />
    <line x1="32" y1="14" x2="32" y2="66" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

// Paint Roller
const PaintRoller = ({ size = 70, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity }}>
    <rect x="10" y="15" width="35" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="45" y1="23" x2="55" y2="23" stroke="currentColor" strokeWidth="1.5" />
    <line x1="55" y1="23" x2="55" y2="55" stroke="currentColor" strokeWidth="1.5" />
    <rect x="52" y="55" width="6" height="10" stroke="currentColor" strokeWidth="1" fill="none" rx="1" />
    {/* Texture lines on roller */}
    <line x1="15" y1="19" x2="15" y2="27" stroke="currentColor" strokeWidth="0.5" />
    <line x1="22" y1="19" x2="22" y2="27" stroke="currentColor" strokeWidth="0.5" />
    <line x1="29" y1="19" x2="29" y2="27" stroke="currentColor" strokeWidth="0.5" />
    <line x1="36" y1="19" x2="36" y2="27" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

// Hexagon Pattern (Modern Tiles)
const HexagonTile = ({ size = 80, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
    <polygon points="40,5 65,20 65,50 40,65 15,50 15,20" stroke="currentColor" strokeWidth="1" fill="none" />
    <polygon points="40,15 55,24 55,42 40,51 25,42 25,24" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="40" cy="35" r="5" stroke="currentColor" strokeWidth="0.5" fill="none" />
  </svg>
);

// Dimension Arrow
const DimensionArrow = ({ size = 100, opacity = 0.03 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 100 30" fill="none" style={{ opacity }}>
    <line x1="10" y1="15" x2="90" y2="15" stroke="currentColor" strokeWidth="1" />
    <polygon points="10,15 18,10 18,20" fill="currentColor" />
    <polygon points="90,15 82,10 82,20" fill="currentColor" />
    <line x1="10" y1="8" x2="10" y2="22" stroke="currentColor" strokeWidth="0.75" />
    <line x1="90" y1="8" x2="90" y2="22" stroke="currentColor" strokeWidth="0.75" />
    <text x="45" y="10" fontSize="8" fill="currentColor" opacity="0.7">2.5m</text>
  </svg>
);

// Level Tool
const LevelTool = ({ size = 90, opacity = 0.04 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size * 0.35} viewBox="0 0 90 32" fill="none" style={{ opacity }}>
    <rect x="5" y="5" width="80" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <rect x="35" y="10" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
    <circle cx="45" cy="16" r="4" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <circle cx="45" cy="16" r="1.5" fill="currentColor" fillOpacity="0.5" />
    {/* End markers */}
    <line x1="15" y1="10" x2="15" y2="22" stroke="currentColor" strokeWidth="0.5" />
    <line x1="75" y1="10" x2="75" y2="22" stroke="currentColor" strokeWidth="0.5" />
  </svg>
);

export default function ArchitecturalBackground() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render on mobile or before mounting
  if (!mounted || isMobile) return null;

  return (
    <>
      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(2deg);
          }
          50% {
            transform: translateY(-8px) rotate(-1deg);
          }
          75% {
            transform: translateY(-20px) rotate(1deg);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-12px) translateX(8px);
          }
          66% {
            transform: translateY(-6px) translateX(-5px);
          }
        }

        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.07; }
        }
      `}</style>

      {/* Fixed positioning to stay visible during scroll - hidden on mobile for cleaner UX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block" style={{ zIndex: 1 }}>
        {/* Gradient overlays */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-30 dark:opacity-15">
          <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/20 via-transparent to-transparent blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-25 dark:opacity-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-transparent blur-3xl" />
        </div>

        {/* Floating architectural elements - carefully positioned */}
        {/* Light mode: stronger colors, Dark mode: subtle colors */}
        <div className="text-emerald-700/50 dark:text-emerald-400/35">
          {/* Top left area */}
          <FloatingElement x={5} y={8} delay={0} duration={25}>
            <FloorPlanRoom size={90} opacity={0.12} />
          </FloatingElement>

          <FloatingElement x={2} y={35} delay={3} duration={22}>
            <TSquareRuler size={80} opacity={0.10} />
          </FloatingElement>

          {/* Top right area */}
          <FloatingElement x={85} y={5} delay={2} duration={28}>
            <GoldenSpiral size={110} opacity={0.09} />
          </FloatingElement>

          <FloatingElement x={78} y={25} delay={5} duration={20}>
            <ArchitecturalCompass size={65} opacity={0.11} />
          </FloatingElement>

          {/* Middle left */}
          <FloatingElement x={8} y={55} delay={1.5} duration={24}>
            <HouseOutline size={70} opacity={0.11} />
          </FloatingElement>

          {/* Middle right */}
          <FloatingElement x={88} y={50} delay={4} duration={26}>
            <GeometricWindow size={55} opacity={0.10} />
          </FloatingElement>

          {/* Bottom left area */}
          <FloatingElement x={3} y={75} delay={2.5} duration={23}>
            <SetSquare size={75} opacity={0.10} />
          </FloatingElement>

          <FloatingElement x={15} y={85} delay={6} duration={21}>
            <BrickPattern size={80} opacity={0.09} />
          </FloatingElement>

          {/* Bottom right area */}
          <FloatingElement x={82} y={75} delay={1} duration={27}>
            <ClassicColumn size={45} opacity={0.11} />
          </FloatingElement>

          <FloatingElement x={90} y={88} delay={4.5} duration={19}>
            <HexagonTile size={70} opacity={0.10} />
          </FloatingElement>

          {/* Scattered middle elements */}
          <FloatingElement x={45} y={15} delay={3.5} duration={30}>
            <DimensionArrow size={120} opacity={0.07} />
          </FloatingElement>

          <FloatingElement x={60} y={65} delay={2} duration={25}>
            <LevelTool size={100} opacity={0.09} />
          </FloatingElement>

          <FloatingElement x={25} y={45} delay={5.5} duration={22}>
            <PaintRoller size={60} opacity={0.10} />
          </FloatingElement>

          <FloatingElement x={70} y={40} delay={0.5} duration={24}>
            <ArchitectPencil size={70} opacity={0.09} />
          </FloatingElement>

          {/* Additional subtle grid patterns */}
          <FloatingElement x={30} y={80} delay={7} duration={35}>
            <BlueprintGrid size={100} opacity={0.05} />
          </FloatingElement>

          <FloatingElement x={55} y={10} delay={4} duration={32}>
            <BlueprintGrid size={80} opacity={0.05} />
          </FloatingElement>
        </div>

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    </>
  );
}

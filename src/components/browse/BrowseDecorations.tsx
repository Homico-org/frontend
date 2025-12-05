'use client';

import { useTheme } from '@/contexts/ThemeContext';

// Premium construction & renovation icons - sophisticated line art style
const ToolIcon = ({
  children,
  className = '',
  size = 48,
}: {
  children: React.ReactNode;
  className?: string;
  size?: number;
}) => (
  <div
    className={`pointer-events-none select-none ${className}`}
    style={{ width: size, height: size }}
  >
    {children}
  </div>
);

// Hammer - Classic tool
const HammerIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M12 36L24 24M24 24L18 18M24 24L30 30"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="8" y="32"
      width="8" height="14"
      rx="2"
      transform="rotate(-45 8 32)"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M26 14L34 6L42 14L34 22L26 14Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M30 10L38 18"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

// Wrench - Precision tool
const WrenchIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M38 10C35.79 7.79 32.52 7.01 29.56 7.93L18 19.49L28.51 30L40.07 18.44C40.99 15.48 40.21 12.21 38 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M18 19.49L8.71 28.78C6.76 30.73 6.76 33.9 8.71 35.85L12.15 39.29C14.1 41.24 17.27 41.24 19.22 39.29L28.51 30"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="34" cy="14" r="2" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Paint Brush - Artistic tool
const PaintBrushIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M38 6L26 18C24 20 24 23 26 25C28 27 31 27 33 25L42 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M26 25L14 37C12 39 8 42 6 42C6 40 9 36 11 34L23 22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M33 8L40 15"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </svg>
);

// Ruler - Measuring tool
const RulerIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect
      x="6" y="18"
      width="36" height="12"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    {[10, 16, 22, 28, 34, 40].map((x, i) => (
      <line
        key={x}
        x1={x} y1="18"
        x2={x} y2={i % 2 === 0 ? "24" : "22"}
        stroke="currentColor"
        strokeWidth="1"
      />
    ))}
    <text x="12" y="27" fontSize="4" fill="currentColor" opacity="0.6">cm</text>
  </svg>
);

// Drill - Power tool
const DrillIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect
      x="18" y="16"
      width="24" height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M18 20H8L6 24L8 28H18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <rect
      x="24" y="32"
      width="8" height="8"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="34" cy="24" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
    <line x1="28" y1="19" x2="28" y2="29" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// Saw - Cutting tool
const SawIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M8 28H40"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 28L40 28L44 20H12L8 28Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M16 28V36L12 40H20L16 36"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Saw teeth */}
    <path
      d="M12 20L14 16L16 20L18 16L20 20L22 16L24 20L26 16L28 20L30 16L32 20L34 16L36 20L38 16L40 20L42 16L44 20"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// Pliers - Gripping tool
const PliersIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M18 30L8 44M30 30L40 44"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 18C16 14 20 10 24 10C28 10 32 14 32 18V22H16V18Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <ellipse
      cx="24" cy="26"
      rx="10" ry="6"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <line x1="24" y1="20" x2="24" y2="32" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// Tape Measure
const TapeMeasureIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <circle
      cx="24" cy="24"
      r="14"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="24" cy="24"
      r="6"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <path
      d="M38 24H46"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="43" y="21"
      width="3" height="6"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    {/* Measurement marks */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        x1={24 + 11 * Math.cos(angle * Math.PI / 180)}
        y1={24 + 11 * Math.sin(angle * Math.PI / 180)}
        x2={24 + 14 * Math.cos(angle * Math.PI / 180)}
        y2={24 + 14 * Math.sin(angle * Math.PI / 180)}
        stroke="currentColor"
        strokeWidth="0.75"
      />
    ))}
  </svg>
);

// Screwdriver
const ScrewdriverIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M24 6L28 10L26 32H22L20 10L24 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <rect
      x="20" y="32"
      width="8" height="12"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <line x1="20" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="1" />
    <line x1="20" y1="40" x2="28" y2="40" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// Helmet - Safety
const HelmetIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <path
      d="M8 28C8 18 14 10 24 10C34 10 40 18 40 28"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M6 28H42V32C42 34 40 36 38 36H10C8 36 6 34 6 32V28Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 28V20"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <ellipse
      cx="24" cy="16"
      rx="8" ry="3"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

// Level tool
const LevelIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect
      x="4" y="18"
      width="40" height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <rect
      x="18" y="21"
      width="12" height="6"
      rx="1"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
    />
    <circle cx="24" cy="24" r="2" stroke="currentColor" strokeWidth="0.75" fill="none" />
    <line x1="10" y1="21" x2="10" y2="27" stroke="currentColor" strokeWidth="0.75" />
    <line x1="38" y1="21" x2="38" y2="27" stroke="currentColor" strokeWidth="0.75" />
  </svg>
);

// Blueprint/Plans
const BlueprintIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    <rect
      x="6" y="8"
      width="36" height="32"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <rect
      x="12" y="14"
      width="10" height="10"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 1"
      fill="none"
    />
    <rect
      x="26" y="14"
      width="10" height="6"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 1"
      fill="none"
    />
    <path
      d="M12 30H36M12 34H28"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    <circle cx="32" cy="26" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

// Decorations configuration with positions
const decorations = [
  { Icon: HammerIcon, position: 'top-[8%] left-[3%]', rotation: '-12deg', size: 44, delay: '0s' },
  { Icon: WrenchIcon, position: 'top-[15%] right-[5%]', rotation: '15deg', size: 40, delay: '0.5s' },
  { Icon: PaintBrushIcon, position: 'top-[35%] left-[2%]', rotation: '-8deg', size: 42, delay: '1s' },
  { Icon: RulerIcon, position: 'top-[55%] right-[3%]', rotation: '5deg', size: 48, delay: '1.5s' },
  { Icon: DrillIcon, position: 'bottom-[30%] left-[4%]', rotation: '10deg', size: 46, delay: '2s' },
  { Icon: SawIcon, position: 'bottom-[15%] right-[4%]', rotation: '-5deg', size: 44, delay: '2.5s' },
  { Icon: TapeMeasureIcon, position: 'top-[70%] left-[3%]', rotation: '8deg', size: 40, delay: '3s' },
  { Icon: ScrewdriverIcon, position: 'top-[45%] right-[2%]', rotation: '-15deg', size: 38, delay: '3.5s' },
  { Icon: HelmetIcon, position: 'bottom-[45%] right-[5%]', rotation: '3deg', size: 42, delay: '4s' },
  { Icon: LevelIcon, position: 'top-[25%] left-[4%]', rotation: '-3deg', size: 50, delay: '4.5s' },
  { Icon: BlueprintIcon, position: 'bottom-[8%] left-[5%]', rotation: '6deg', size: 46, delay: '5s' },
  { Icon: PliersIcon, position: 'top-[85%] right-[3%]', rotation: '-10deg', size: 40, delay: '5.5s' },
];

export default function BrowseDecorations() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <>
      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes float-tool {
          0%, 100% {
            transform: translateY(0) rotate(var(--rotation));
            opacity: var(--base-opacity);
          }
          50% {
            transform: translateY(-8px) rotate(calc(var(--rotation) + 3deg));
            opacity: calc(var(--base-opacity) + 0.05);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 0px currentColor);
          }
          50% {
            filter: drop-shadow(0 0 8px currentColor);
          }
        }
      `}</style>

      {/* Decoration container - fixed positioning to stay visible during scroll */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {decorations.map(({ Icon, position, rotation, size, delay }, index) => (
          <div
            key={index}
            className={`absolute ${position} hidden lg:block`}
            style={{
              '--rotation': rotation,
              '--base-opacity': isDark ? '0.12' : '0.18',
              animation: `float-tool 8s ease-in-out infinite`,
              animationDelay: delay,
            } as React.CSSProperties}
          >
            <ToolIcon size={size}>
              <Icon
                className={`w-full h-full ${
                  isDark
                    ? 'text-emerald-400/[0.20]'
                    : 'text-emerald-700/[0.25]'
                } transition-colors duration-500`}
              />
            </ToolIcon>
          </div>
        ))}

        {/* Subtle gradient orbs for depth - more visible in light mode */}
        <div
          className={`absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] ${
            isDark ? 'bg-emerald-500/8' : 'bg-emerald-500/15'
          }`}
        />
        <div
          className={`absolute bottom-[20%] left-[5%] w-[250px] h-[250px] rounded-full blur-[80px] ${
            isDark ? 'bg-amber-500/8' : 'bg-amber-500/12'
          }`}
        />
        <div
          className={`absolute top-[50%] left-[15%] w-[200px] h-[200px] rounded-full blur-[60px] ${
            isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/10'
          }`}
        />
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

interface ConfettiBurstProps {
  /**
   * Trigger the burst on this prop becoming true. Pass a one-shot
   * boolean (e.g., set true on success effect, never reset) so the
   * burst only fires once per mount.
   */
  active?: boolean;
  /**
   * Number of confetti particles. Default 32 balances "noticeable"
   * with "not a Times Square assault on lower-spec phones."
   */
  count?: number;
  /**
   * How long the burst lasts before particles are removed from
   * the DOM. Defaults to 1.4s.
   */
  durationMs?: number;
}

interface Particle {
  id: number;
  /** Horizontal offset from center (px) */
  dx: number;
  /** Vertical drop distance (px) */
  dy: number;
  /** Final rotation (deg) */
  rot: number;
  /** Per-particle color */
  color: string;
  /** Slight stagger so they don't all leave at once */
  delay: number;
  /** Width in px - rectangular particles read more like party
   *  ribbons than uniform dots. */
  w: number;
  h: number;
}

// Brand-aligned palette with two accent-adjacent tones so the burst
// reads as "ours" rather than a generic stock confetti.
const COLORS = ["#EF4E24", "#F28764", "#22C55E", "#3B82F6", "#FACC15", "#A855F7"];

function randomParticles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // Polar coords give a uniform fan-out instead of a clustered
    // square distribution.
    const angle = (Math.random() * Math.PI) - Math.PI / 2; // -90° to +90°
    const distance = 120 + Math.random() * 160;
    out.push({
      id: i,
      dx: Math.cos(angle) * distance,
      // Negative dy so particles arc upward before falling - the
      // CSS keyframe applies gravity over the second half.
      dy: -Math.sin(angle) * distance - 40,
      rot: (Math.random() - 0.5) * 720,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 120,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 6,
    });
  }
  return out;
}

/**
 * Tiny celebratory confetti burst. Pure CSS animation (no extra
 * deps, ~3KB gzipped). Spawns N rectangular particles that arc
 * outward from the center then fall under gravity, fading out.
 *
 * Honors `prefers-reduced-motion` - users with that preference get
 * no particles at all (the burst is purely decorative, no info is
 * lost).
 *
 * ```tsx
 * <ConfettiBurst active={shouldCelebrate} />
 * ```
 */
export default function ConfettiBurst({
  active = true,
  count = 32,
  durationMs = 1400,
}: ConfettiBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    // Respect reduced-motion - the burst is pure decoration.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    setParticles(randomParticles(count));
    const id = window.setTimeout(() => setParticles([]), durationMs + 200);
    return () => window.clearTimeout(id);
  }, [active, count, durationMs]);

  if (particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[10000] overflow-hidden flex items-center justify-center"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute block rounded-sm"
          style={
            {
              width: `${p.w}px`,
              height: `${p.h}px`,
              backgroundColor: p.color,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
              ["--rot" as string]: `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${durationMs}ms`,
            } as React.CSSProperties
          }
        />
      ))}
      <style jsx>{`
        span {
          /* Start at center, arc to (--dx, --dy), then fall +200px
             under "gravity" while rotating + fading. */
          animation-name: confetti-burst;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: forwards;
          opacity: 0;
        }
        @keyframes confetti-burst {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          60% {
            transform: translate(var(--dx), var(--dy)) rotate(calc(var(--rot) * 0.6));
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), calc(var(--dy) + 200px)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

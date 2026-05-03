"use client";

import { useEffect, useRef, useState } from "react";

// Shared internals for landing page sections.
// Kept as one file because they're tightly coupled to landing page motion language
// and not used elsewhere in the app.

export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  stagger = false,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
  index?: number;
}) {
  const { ref, isInView } = useInView(0.1);
  const actualDelay = stagger ? delay + index * 80 : delay;
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${actualDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function TextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView(0.2);
  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.18em] -mb-[0.18em] align-baseline">
          <span
            className="inline-block transition-all duration-500 ease-out"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? "translateY(0)" : "translateY(100%)",
              transitionDelay: `${delay + i * 60}ms`,
            }}
          >
            {word}&nbsp;
          </span>
        </span>
      ))}
    </span>
  );
}

// Theme-aware glass: 70% elevated surface + subtle border so it works in both
// light and dark. `color-mix` gives per-token translucency without arbitrary-opacity.
export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`backdrop-blur-xl shadow-xl border border-[var(--hm-border-subtle)] ${className}`}
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--hm-bg-elevated) 70%, transparent)",
      }}
    >
      {children}
    </div>
  );
}

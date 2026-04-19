"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
  value: number; // hour 0-23
  onChange: (hour: number) => void;
  hours?: number[]; // available hours
  size?: "sm" | "md";
  className?: string;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function TimePicker({
  value,
  onChange,
  hours = Array.from({ length: 17 }, (_, i) => i + 6),
  size = "sm",
  className = "",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  // Position
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = Math.min(hours.length * 32 + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropH && rect.top > dropH;

    setPos({
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      left: rect.left,
    });
  }, [isOpen, hours.length]);

  const isSm = size === "sm";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg border transition-all ${
          isOpen
            ? "border-[var(--hm-brand-500)]/40 ring-2 ring-[var(--hm-brand-500)]/10"
            : "border-[var(--hm-border)] hover:border-[var(--hm-border-strong)]"
        } bg-[var(--hm-bg-elevated)] ${
          isSm ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm"
        } ${className}`}
      >
        <Clock className={`text-[var(--hm-fg-muted)] ${isSm ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
        <span className="font-medium text-[var(--hm-fg-primary)]">
          {formatHour(value)}
        </span>
      </button>

      {isOpen && pos && mounted && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[200] w-[100px] rounded-xl shadow-2xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] overflow-hidden"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="max-h-[232px] overflow-y-auto py-1 scrollbar-thin">
            {hours.map((h) => {
              const isActive = h === value;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => { onChange(h); setIsOpen(false); }}
                  className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
                  }`}
                  style={isActive ? { backgroundColor: 'var(--hm-brand-500)' } : undefined}
                >
                  {formatHour(h)}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

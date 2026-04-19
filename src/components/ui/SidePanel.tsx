"use client";

import { X } from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "sidePanelWidth";
const MIN_WIDTH = 400;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 480;

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const w = parseInt(stored, 10);
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) return w;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SidePanel({ isOpen, onClose, title, children }: SidePanelProps) {
  const [width, setWidth] = useState(getStoredWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };

    const handleUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(STORAGE_KEY, width.toString());
      } catch {
        // ignore
      }
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, width]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed z-[61] top-0 right-0 bottom-0 flex flex-col bg-[var(--hm-bg-elevated)] shadow-2xl border-l border-[var(--hm-border)]"
        style={{
          width: window.innerWidth < 640 ? "100%" : width,
          animation: "sidePanelSlideIn 0.2s ease-out",
        }}
      >
        {/* Resize handle — desktop only, always visible grip */}
        <div
          onMouseDown={handleResizeStart}
          className={`hidden sm:flex absolute left-0 top-0 bottom-0 w-4 cursor-col-resize z-10 items-center justify-center group ${
            isResizing ? "bg-[var(--hm-brand-500)]/10" : "hover:bg-[var(--hm-brand-500)]/5"
          }`}
        >
          <div className="flex flex-col gap-[3px]">
            <span className={`w-[3px] h-[3px] rounded-full transition-colors ${isResizing ? "bg-[var(--hm-brand-500)]" : "bg-[var(--hm-border-strong)] group-hover:bg-[var(--hm-brand-500)]"}`} />
            <span className={`w-[3px] h-[3px] rounded-full transition-colors ${isResizing ? "bg-[var(--hm-brand-500)]" : "bg-[var(--hm-border-strong)] group-hover:bg-[var(--hm-brand-500)]"}`} />
            <span className={`w-[3px] h-[3px] rounded-full transition-colors ${isResizing ? "bg-[var(--hm-brand-500)]" : "bg-[var(--hm-border-strong)] group-hover:bg-[var(--hm-brand-500)]"}`} />
            <span className={`w-[3px] h-[3px] rounded-full transition-colors ${isResizing ? "bg-[var(--hm-brand-500)]" : "bg-[var(--hm-border-strong)] group-hover:bg-[var(--hm-brand-500)]"}`} />
            <span className={`w-[3px] h-[3px] rounded-full transition-colors ${isResizing ? "bg-[var(--hm-brand-500)]" : "bg-[var(--hm-border-strong)] group-hover:bg-[var(--hm-brand-500)]"}`} />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hm-border)] flex-shrink-0">
          <h2 className="text-sm font-semibold text-[var(--hm-fg-primary)] truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] transition-colors text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes sidePanelSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>,
    document.body
  );
}

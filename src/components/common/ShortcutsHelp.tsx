"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { ConfirmModal } from "@/components/ui/Modal";
import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";

interface ShortcutRow {
  keys: string[];
  labelKey: string;
}

/**
 * Cheat-sheet modal that lists every keyboard shortcut. Triggered by
 * pressing `?` anywhere in the app. Makes Cmd+K + arrow nav
 * discoverable - users can't use shortcuts they can't find.
 *
 * Mounted globally near the other system overlays. Self-contained:
 * own keyboard listener, own open state, doesn't need a provider.
 */
export default function ShortcutsHelp() {
  const { t } = useLanguage();
  const { open: openPalette, isOpen: paletteOpen } = useCommandPalette();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKey = (e: KeyboardEvent) => {
      // `?` opens the cheatsheet. Skip when typing in an input so
      // we don't hijack literal `?` typed into messages, search
      // fields, or the command palette itself.
      if (e.key !== "?") return;
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isEditable) return;
      // If the palette is open, `?` is for typing into its search.
      if (paletteOpen) return;
      e.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [paletteOpen]);

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
  const mod = isMac ? "⌘" : "Ctrl";

  const rows: ShortcutRow[] = [
    { keys: [mod, "K"], labelKey: "shortcuts.openPalette" },
    { keys: ["?"], labelKey: "shortcuts.showHelp" },
    { keys: ["Esc"], labelKey: "shortcuts.closeModal" },
    { keys: ["↵"], labelKey: "shortcuts.submitForm" },
    { keys: ["↑"], labelKey: "shortcuts.navigateUp" },
    { keys: ["↓"], labelKey: "shortcuts.navigateDown" },
  ];

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={() => {
        setIsOpen(false);
        openPalette();
      }}
      title={t("shortcuts.title")}
      icon={<Keyboard className="w-6 h-6" />}
      variant="accent"
      cancelLabel={t("common.close")}
      confirmLabel={t("commandPalette.openHint")}
    >
      <div className="space-y-2 mb-3">
        {rows.map((row) => (
          <div
            key={row.labelKey}
            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--hm-bg-tertiary)]/40"
          >
            <span className="text-sm text-[var(--hm-fg-secondary)]">
              {t(row.labelKey)}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0">
              {row.keys.map((k, i) => (
                <kbd
                  key={i}
                  className="px-2 py-0.5 rounded-md text-xs font-mono text-[var(--hm-fg-primary)] border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] shadow-sm"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </ConfirmModal>
  );
}

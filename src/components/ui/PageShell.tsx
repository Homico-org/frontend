import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./PageHeader";

type PageShellVariant = "standalone" | "embedded";

export interface PageShellProps {
  /** Page title */
  title: string;
  /** Optional subtitle under title */
  subtitle?: string;
  /** Optional icon on the left (Lucide icon component) */
  icon?: LucideIcon;
  /** Optional content on the right of the header (buttons, badges, etc.) */
  rightContent?: React.ReactNode;
  /** Optional back navigation */
  backHref?: string;
  backLabel?: string;
  /** Header extra content (e.g. search input) */
  headerChildren?: React.ReactNode;
  /** Page body */
  children: React.ReactNode;
  /** Layout variant. Use `embedded` when a parent layout already provides padding/width (e.g. an app shell layout). */
  variant?: PageShellVariant;
  /** Hide the header section (useful when parent layout renders the header) */
  showHeader?: boolean;
  /** Outer wrapper className */
  className?: string;
  /** Body wrapper className */
  bodyClassName?: string;
  /** Override the header width constraint wrapper (defaults to max-w-4xl for standalone, none for embedded) */
  headerContentClassName?: string;
  /** Override the body width constraint wrapper (defaults to max-w-4xl for standalone, none for embedded) */
  bodyContentClassName?: string;
}

/**
 * Generic page layout wrapper that standardizes title/subtitle headers.
 *
 * - `standalone`: full-page background + default `PageHeader` sizing
 * - `embedded`: no extra padding/width (assumes parent provides it)
 */
export function PageShell({
  title,
  subtitle,
  icon,
  rightContent,
  backHref,
  backLabel,
  headerChildren,
  children,
  variant = "standalone",
  showHeader = true,
  className,
  bodyClassName,
  headerContentClassName,
  bodyContentClassName,
}: PageShellProps) {
  const isEmbedded = variant === "embedded";
  const resolvedHeaderContentClassName =
    headerContentClassName ?? (isEmbedded ? "max-w-none" : "mx-auto max-w-4xl");
  const resolvedBodyContentClassName =
    bodyContentClassName ?? (isEmbedded ? undefined : "mx-auto max-w-4xl");

  return (
    <div
      className={cn(
        !isEmbedded && "min-h-screen bg-white dark:bg-neutral-950",
        className,
      )}
    >
      {showHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          backHref={backHref}
          backLabel={backLabel}
          rightContent={rightContent}
          bordered={!isEmbedded}
          variant={isEmbedded ? "transparent" : "default"}
          containerClassName={isEmbedded ? "px-0 py-0" : undefined}
          contentClassName={resolvedHeaderContentClassName}
          className={cn(isEmbedded && "mb-4 sm:mb-6")}
        >
          {headerChildren}
        </PageHeader>
      )}

      <div
        className={cn(
          isEmbedded ? undefined : "px-4 py-6 sm:px-6 lg:px-8",
          bodyClassName,
        )}
      >
        <div className={resolvedBodyContentClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageShell;


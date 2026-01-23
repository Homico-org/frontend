'use client';

import {
  Hammer,
  Zap,
  Droplets,
  Flame,
  Layers,
  Footprints,
  ArrowUpFromLine,
  Paintbrush,
  Grid3x3,
  DoorOpen,
  LucideIcon,
} from 'lucide-react';
import type { PriceCategory } from '@/data/priceDatabase';

/**
 * Maps price categories to their corresponding Lucide icons.
 */
export const categoryIconMap: Record<PriceCategory, LucideIcon> = {
  demolition: Hammer,
  electrical: Zap,
  plumbing: Droplets,
  heating: Flame,
  walls: Layers,
  flooring: Footprints,
  ceiling: ArrowUpFromLine,
  painting: Paintbrush,
  tiling: Grid3x3,
  doors_windows: DoorOpen,
};

/**
 * Gets the Lucide icon component for a price category.
 * @param category - The price category key
 * @returns The corresponding Lucide icon component
 */
export function getCategoryIcon(category: PriceCategory): LucideIcon {
  return categoryIconMap[category] || Hammer;
}

/**
 * Array of all categories with their icons for use in filters/navigation.
 */
export const categoryList = Object.entries(categoryIconMap).map(([key, icon]) => ({
  key: key as PriceCategory,
  icon,
}));

export default categoryIconMap;

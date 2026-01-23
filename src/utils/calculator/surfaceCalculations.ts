import { type RoomDimensions, type ComputedSurfaces } from '@/components/tools/calculator/types';

// Standard opening sizes (in square meters)
const DOOR_AREA = 1.8; // ~0.9m × 2m standard interior door
const WINDOW_AREA = 1.5; // ~1.0m × 1.5m standard window

/**
 * Calculate all surfaces for a room based on dimensions
 */
export function calculateSurfaces(dimensions: RoomDimensions): ComputedSurfaces {
  const { length, width, height, doors, windows } = dimensions;

  // Floor and ceiling area (same for rectangular rooms)
  const floorArea = length * width;
  const ceilingArea = floorArea;

  // Perimeter (for baseboards, cornices)
  const perimeter = 2 * (length + width);

  // Wall area = perimeter × height - openings
  const openingsArea = doors * DOOR_AREA + windows * WINDOW_AREA;
  const grossWallArea = perimeter * height;
  const wallArea = Math.max(0, grossWallArea - openingsArea);

  // Interior corners (4 for a rectangular room)
  const corners = 4;

  return {
    floorArea: Math.round(floorArea * 100) / 100,
    wallArea: Math.round(wallArea * 100) / 100,
    ceilingArea: Math.round(ceilingArea * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    corners,
  };
}

/**
 * Calculate total surfaces across all rooms
 */
export function calculateTotalSurfaces(rooms: { computed: ComputedSurfaces }[]): ComputedSurfaces {
  return rooms.reduce(
    (totals, room) => ({
      floorArea: totals.floorArea + room.computed.floorArea,
      wallArea: totals.wallArea + room.computed.wallArea,
      ceilingArea: totals.ceilingArea + room.computed.ceilingArea,
      perimeter: totals.perimeter + room.computed.perimeter,
      corners: totals.corners + room.computed.corners,
    }),
    { floorArea: 0, wallArea: 0, ceilingArea: 0, perimeter: 0, corners: 0 }
  );
}

/**
 * Format area with unit
 */
export function formatArea(area: number, unit: 'sqm' | 'lm' = 'sqm'): string {
  const formatted = area.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return unit === 'sqm' ? `${formatted} m²` : `${formatted} m`;
}

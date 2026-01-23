import {
  type Room,
  type QualityLevel,
  type FlooringType,
  type WallType,
  type CeilingType,
  type WorkCategories,
  type BreakdownItem,
  type RoomBreakdown,
  type CategoryBreakdown,
  type CalculationResult,
  QUALITY_MULTIPLIERS,
} from '@/components/tools/calculator/types';
import { type PriceCategory } from '@/data/priceDatabase';

// Price per unit by material type and quality (low/mid/high)
// These are approximate averages from the price database

interface PriceRange {
  low: number;
  mid: number;
  high: number;
}

const FLOORING_PRICES: Record<FlooringType, { work: PriceRange; material: PriceRange }> = {
  laminate: { work: { low: 18, mid: 25, high: 35 }, material: { low: 20, mid: 35, high: 60 } },
  parquet: { work: { low: 35, mid: 50, high: 70 }, material: { low: 60, mid: 100, high: 180 } },
  tile: { work: { low: 35, mid: 50, high: 70 }, material: { low: 25, mid: 50, high: 100 } },
  vinyl: { work: { low: 12, mid: 18, high: 25 }, material: { low: 15, mid: 30, high: 50 } },
  carpet: { work: { low: 8, mid: 12, high: 18 }, material: { low: 15, mid: 30, high: 60 } },
};

const WALL_PRICES: Record<WallType, { work: PriceRange; material: PriceRange }> = {
  paint: { work: { low: 8, mid: 14, high: 22 }, material: { low: 3, mid: 6, high: 12 } },
  wallpaper: { work: { low: 12, mid: 18, high: 28 }, material: { low: 10, mid: 25, high: 50 } },
  tile: { work: { low: 40, mid: 55, high: 75 }, material: { low: 25, mid: 50, high: 100 } },
  decorative_plaster: { work: { low: 35, mid: 55, high: 80 }, material: { low: 20, mid: 40, high: 80 } },
};

const CEILING_PRICES: Record<CeilingType, { work: PriceRange; material: PriceRange }> = {
  paint: { work: { low: 10, mid: 16, high: 24 }, material: { low: 3, mid: 6, high: 12 } },
  stretch: { work: { low: 35, mid: 55, high: 85 }, material: { low: 20, mid: 35, high: 60 } },
  drywall: { work: { low: 30, mid: 45, high: 65 }, material: { low: 15, mid: 25, high: 40 } },
  suspended: { work: { low: 40, mid: 60, high: 90 }, material: { low: 25, mid: 45, high: 70 } },
};

// Fixed prices for work items
const WORK_PRICES = {
  demolition: { sqm: { low: 12, mid: 18, high: 28 } },
  electrical: {
    outlet: { low: 40, mid: 60, high: 90 },
    switch: { low: 35, mid: 50, high: 75 },
    lightingPoint: { low: 50, mid: 75, high: 110 },
    acPoint: { low: 150, mid: 220, high: 320 },
  },
  plumbing: {
    toilet: { low: 180, mid: 280, high: 420 },
    sink: { low: 120, mid: 180, high: 280 },
    shower: { low: 250, mid: 380, high: 550 },
    bathtub: { low: 200, mid: 300, high: 450 },
  },
  heating: {
    radiator: { low: 90, mid: 130, high: 200 },
    underfloorSqm: { low: 35, mid: 55, high: 85 },
    boiler: { low: 600, mid: 900, high: 1400 },
  },
  doors: {
    interior: { low: 120, mid: 180, high: 280 },
    entrance: { low: 250, mid: 400, high: 600 },
  },
  baseboard: { lm: { low: 10, mid: 14, high: 22 } },
  screed: { sqm: { low: 20, mid: 30, high: 45 } },
  plastering: { sqm: { low: 22, mid: 32, high: 48 } },
};

function getQualityPrice(range: PriceRange, quality: QualityLevel): number {
  switch (quality) {
    case 'economy':
      return range.low;
    case 'standard':
      return range.mid;
    case 'premium':
      return range.high;
  }
}

/**
 * Calculate costs for a single room
 */
export function calculateRoomCosts(
  room: Room,
  quality: QualityLevel,
  includeMaterials: boolean
): BreakdownItem[] {
  const items: BreakdownItem[] = [];
  const { computed, materials } = room;

  // Flooring
  const flooringPrices = FLOORING_PRICES[materials.flooring];
  const flooringWorkPrice = getQualityPrice(flooringPrices.work, quality);
  items.push({
    id: `${room.id}-flooring`,
    name: `flooring_${materials.flooring}`,
    category: 'flooring',
    quantity: computed.floorArea,
    unit: 'sqm',
    unitPrice: flooringWorkPrice,
    total: computed.floorArea * flooringWorkPrice,
  });

  if (includeMaterials) {
    const flooringMatPrice = getQualityPrice(flooringPrices.material, quality);
    items.push({
      id: `${room.id}-flooring-mat`,
      name: `flooring_${materials.flooring}_material`,
      category: 'flooring',
      quantity: computed.floorArea,
      unit: 'sqm',
      unitPrice: flooringMatPrice,
      total: computed.floorArea * flooringMatPrice,
    });
  }

  // Baseboard
  const baseboardPrice = getQualityPrice(WORK_PRICES.baseboard.lm, quality);
  items.push({
    id: `${room.id}-baseboard`,
    name: 'baseboard',
    category: 'flooring',
    quantity: computed.perimeter,
    unit: 'lm',
    unitPrice: baseboardPrice,
    total: computed.perimeter * baseboardPrice,
  });

  // Walls (only non-bathroom rooms get wall treatment, bathroom gets tiling)
  const wallPrices = WALL_PRICES[materials.walls];
  const wallCategory: PriceCategory = materials.walls === 'tile' ? 'tiling' : 'painting';
  const wallWorkPrice = getQualityPrice(wallPrices.work, quality);
  items.push({
    id: `${room.id}-walls`,
    name: `walls_${materials.walls}`,
    category: wallCategory,
    quantity: computed.wallArea,
    unit: 'sqm',
    unitPrice: wallWorkPrice,
    total: computed.wallArea * wallWorkPrice,
  });

  if (includeMaterials) {
    const wallMatPrice = getQualityPrice(wallPrices.material, quality);
    items.push({
      id: `${room.id}-walls-mat`,
      name: `walls_${materials.walls}_material`,
      category: wallCategory,
      quantity: computed.wallArea,
      unit: 'sqm',
      unitPrice: wallMatPrice,
      total: computed.wallArea * wallMatPrice,
    });
  }

  // Wall preparation (plastering)
  if (materials.walls !== 'tile') {
    const plasterPrice = getQualityPrice(WORK_PRICES.plastering.sqm, quality);
    items.push({
      id: `${room.id}-plastering`,
      name: 'wall_plastering',
      category: 'walls',
      quantity: computed.wallArea,
      unit: 'sqm',
      unitPrice: plasterPrice,
      total: computed.wallArea * plasterPrice,
    });
  }

  // Ceiling
  const ceilingPrices = CEILING_PRICES[materials.ceiling];
  const ceilingWorkPrice = getQualityPrice(ceilingPrices.work, quality);
  items.push({
    id: `${room.id}-ceiling`,
    name: `ceiling_${materials.ceiling}`,
    category: 'ceiling',
    quantity: computed.ceilingArea,
    unit: 'sqm',
    unitPrice: ceilingWorkPrice,
    total: computed.ceilingArea * ceilingWorkPrice,
  });

  if (includeMaterials) {
    const ceilingMatPrice = getQualityPrice(ceilingPrices.material, quality);
    items.push({
      id: `${room.id}-ceiling-mat`,
      name: `ceiling_${materials.ceiling}_material`,
      category: 'ceiling',
      quantity: computed.ceilingArea,
      unit: 'sqm',
      unitPrice: ceilingMatPrice,
      total: computed.ceilingArea * ceilingMatPrice,
    });
  }

  // Floor screed
  const screedPrice = getQualityPrice(WORK_PRICES.screed.sqm, quality);
  items.push({
    id: `${room.id}-screed`,
    name: 'floor_screed',
    category: 'flooring',
    quantity: computed.floorArea,
    unit: 'sqm',
    unitPrice: screedPrice,
    total: computed.floorArea * screedPrice,
  });

  return items;
}

/**
 * Calculate work category costs (electrical, plumbing, etc.)
 */
export function calculateWorkCategoryCosts(
  workCategories: WorkCategories,
  totalFloorArea: number,
  quality: QualityLevel
): BreakdownItem[] {
  const items: BreakdownItem[] = [];

  // Demolition
  if (workCategories.demolition) {
    const demoPrice = getQualityPrice(WORK_PRICES.demolition.sqm, quality);
    items.push({
      id: 'demolition',
      name: 'demolition',
      category: 'demolition',
      quantity: totalFloorArea,
      unit: 'sqm',
      unitPrice: demoPrice,
      total: totalFloorArea * demoPrice,
    });
  }

  // Electrical
  const { electrical } = workCategories;
  if (electrical.enabled) {
    if (electrical.outlets > 0) {
      const price = getQualityPrice(WORK_PRICES.electrical.outlet, quality);
      items.push({
        id: 'elec-outlets',
        name: 'electrical_outlets',
        category: 'electrical',
        quantity: electrical.outlets,
        unit: 'unit',
        unitPrice: price,
        total: electrical.outlets * price,
      });
    }
    if (electrical.switches > 0) {
      const price = getQualityPrice(WORK_PRICES.electrical.switch, quality);
      items.push({
        id: 'elec-switches',
        name: 'electrical_switches',
        category: 'electrical',
        quantity: electrical.switches,
        unit: 'unit',
        unitPrice: price,
        total: electrical.switches * price,
      });
    }
    if (electrical.lightingPoints > 0) {
      const price = getQualityPrice(WORK_PRICES.electrical.lightingPoint, quality);
      items.push({
        id: 'elec-lighting',
        name: 'electrical_lighting',
        category: 'electrical',
        quantity: electrical.lightingPoints,
        unit: 'unit',
        unitPrice: price,
        total: electrical.lightingPoints * price,
      });
    }
    if (electrical.acPoints > 0) {
      const price = getQualityPrice(WORK_PRICES.electrical.acPoint, quality);
      items.push({
        id: 'elec-ac',
        name: 'electrical_ac',
        category: 'electrical',
        quantity: electrical.acPoints,
        unit: 'unit',
        unitPrice: price,
        total: electrical.acPoints * price,
      });
    }
  }

  // Plumbing
  const { plumbing } = workCategories;
  if (plumbing.enabled) {
    if (plumbing.toilets > 0) {
      const price = getQualityPrice(WORK_PRICES.plumbing.toilet, quality);
      items.push({
        id: 'plumb-toilet',
        name: 'plumbing_toilet',
        category: 'plumbing',
        quantity: plumbing.toilets,
        unit: 'unit',
        unitPrice: price,
        total: plumbing.toilets * price,
      });
    }
    if (plumbing.sinks > 0) {
      const price = getQualityPrice(WORK_PRICES.plumbing.sink, quality);
      items.push({
        id: 'plumb-sink',
        name: 'plumbing_sink',
        category: 'plumbing',
        quantity: plumbing.sinks,
        unit: 'unit',
        unitPrice: price,
        total: plumbing.sinks * price,
      });
    }
    if (plumbing.showers > 0) {
      const price = getQualityPrice(WORK_PRICES.plumbing.shower, quality);
      items.push({
        id: 'plumb-shower',
        name: 'plumbing_shower',
        category: 'plumbing',
        quantity: plumbing.showers,
        unit: 'unit',
        unitPrice: price,
        total: plumbing.showers * price,
      });
    }
    if (plumbing.bathtubs > 0) {
      const price = getQualityPrice(WORK_PRICES.plumbing.bathtub, quality);
      items.push({
        id: 'plumb-bathtub',
        name: 'plumbing_bathtub',
        category: 'plumbing',
        quantity: plumbing.bathtubs,
        unit: 'unit',
        unitPrice: price,
        total: plumbing.bathtubs * price,
      });
    }
  }

  // Heating
  const { heating } = workCategories;
  if (heating.enabled) {
    if (heating.radiators > 0) {
      const price = getQualityPrice(WORK_PRICES.heating.radiator, quality);
      items.push({
        id: 'heat-radiator',
        name: 'heating_radiator',
        category: 'heating',
        quantity: heating.radiators,
        unit: 'unit',
        unitPrice: price,
        total: heating.radiators * price,
      });
    }
    if (heating.underfloorArea > 0) {
      const price = getQualityPrice(WORK_PRICES.heating.underfloorSqm, quality);
      items.push({
        id: 'heat-underfloor',
        name: 'heating_underfloor',
        category: 'heating',
        quantity: heating.underfloorArea,
        unit: 'sqm',
        unitPrice: price,
        total: heating.underfloorArea * price,
      });
    }
    if (heating.boiler) {
      const price = getQualityPrice(WORK_PRICES.heating.boiler, quality);
      items.push({
        id: 'heat-boiler',
        name: 'heating_boiler',
        category: 'heating',
        quantity: 1,
        unit: 'unit',
        unitPrice: price,
        total: price,
      });
    }
  }

  // Doors & Windows
  const { doorsWindows } = workCategories;
  if (doorsWindows.enabled) {
    if (doorsWindows.interiorDoors > 0) {
      const price = getQualityPrice(WORK_PRICES.doors.interior, quality);
      items.push({
        id: 'doors-interior',
        name: 'doors_interior',
        category: 'doors_windows',
        quantity: doorsWindows.interiorDoors,
        unit: 'unit',
        unitPrice: price,
        total: doorsWindows.interiorDoors * price,
      });
    }
    if (doorsWindows.entranceDoor) {
      const price = getQualityPrice(WORK_PRICES.doors.entrance, quality);
      items.push({
        id: 'doors-entrance',
        name: 'doors_entrance',
        category: 'doors_windows',
        quantity: 1,
        unit: 'unit',
        unitPrice: price,
        total: price,
      });
    }
  }

  return items;
}

/**
 * Calculate full breakdown
 */
export function calculateFullBreakdown(
  rooms: Room[],
  workCategories: WorkCategories,
  quality: QualityLevel,
  includeMaterials: boolean
): CalculationResult {
  // Calculate per-room costs
  const byRoom: RoomBreakdown[] = rooms.map((room) => {
    const items = calculateRoomCosts(room, quality, includeMaterials);
    return {
      roomId: room.id,
      roomName: room.name || room.type,
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
    };
  });

  // Calculate work category costs
  const totalFloorArea = rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);
  const workItems = calculateWorkCategoryCosts(workCategories, totalFloorArea, quality);

  // Combine all items
  const allItems = [...byRoom.flatMap((r) => r.items), ...workItems];

  // Group by category
  const categoryMap = new Map<PriceCategory, BreakdownItem[]>();
  allItems.forEach((item) => {
    const existing = categoryMap.get(item.category) || [];
    categoryMap.set(item.category, [...existing, item]);
  });

  const byCategory: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
    ([category, items]) => ({
      category,
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
    })
  );

  // Calculate totals
  const grandTotal = allItems.reduce((sum, item) => sum + item.total, 0);
  const materialItems = allItems.filter((item) => item.name.includes('_material'));
  const laborItems = allItems.filter((item) => !item.name.includes('_material'));

  const totalLabor = laborItems.reduce((sum, item) => sum + item.total, 0);
  const totalMaterials = materialItems.reduce((sum, item) => sum + item.total, 0);

  return {
    byRoom,
    byCategory,
    totalLabor: Math.round(totalLabor),
    totalMaterials: Math.round(totalMaterials),
    grandTotal: Math.round(grandTotal),
    lowEstimate: Math.round(grandTotal * 0.85),
    highEstimate: Math.round(grandTotal * 1.2),
  };
}

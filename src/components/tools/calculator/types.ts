import { type PriceCategory } from '@/data/priceDatabase';

// Room Types
export type RoomType = 'living' | 'bedroom' | 'bathroom' | 'kitchen' | 'hallway' | 'balcony';

// Material Types
export type FlooringType = 'laminate' | 'parquet' | 'tile' | 'vinyl' | 'carpet';
export type WallType = 'paint' | 'wallpaper' | 'tile' | 'decorative_plaster';
export type CeilingType = 'paint' | 'stretch' | 'drywall' | 'suspended';

// Quality Level
export type QualityLevel = 'economy' | 'standard' | 'premium';

// Calculator Step
export type CalculatorStep = 1 | 2 | 3 | 4;

// Dimensions
export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  doors: number;
  windows: number;
}

// Computed Surfaces
export interface ComputedSurfaces {
  floorArea: number;
  wallArea: number;
  ceilingArea: number;
  perimeter: number;
  corners: number;
}

// Materials for a room
export interface RoomMaterials {
  flooring: FlooringType;
  walls: WallType;
  ceiling: CeilingType;
}

// Room
export interface Room {
  id: string;
  name: string;
  type: RoomType;
  dimensions: RoomDimensions;
  materials: RoomMaterials;
  computed: ComputedSurfaces;
}

// Work category configs
export interface ElectricalConfig {
  enabled: boolean;
  outlets: number;
  switches: number;
  lightingPoints: number;
  acPoints: number;
}

export interface PlumbingConfig {
  enabled: boolean;
  toilets: number;
  sinks: number;
  showers: number;
  bathtubs: number;
}

export interface HeatingConfig {
  enabled: boolean;
  radiators: number;
  underfloorArea: number;
  boiler: boolean;
}

export interface DoorsWindowsConfig {
  enabled: boolean;
  interiorDoors: number;
  entranceDoor: boolean;
}

export interface WorkCategories {
  demolition: boolean;
  electrical: ElectricalConfig;
  plumbing: PlumbingConfig;
  heating: HeatingConfig;
  doorsWindows: DoorsWindowsConfig;
}

// Calculator State
export interface CalculatorState {
  step: 1 | 2 | 3 | 4 | 5;
  rooms: Room[];
  activeRoomId: string | null;
  workCategories: WorkCategories;
  qualityLevel: QualityLevel;
  includeMaterials: boolean;
}

// Breakdown item
export interface BreakdownItem {
  id: string;
  name: string;
  category: PriceCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

// Room breakdown
export interface RoomBreakdown {
  roomId: string;
  roomName: string;
  items: BreakdownItem[];
  subtotal: number;
}

// Category breakdown
export interface CategoryBreakdown {
  category: PriceCategory;
  items: BreakdownItem[];
  subtotal: number;
}

// Calculation result
export interface CalculationResult {
  byRoom: RoomBreakdown[];
  byCategory: CategoryBreakdown[];
  totalLabor: number;
  totalMaterials: number;
  grandTotal: number;
  lowEstimate: number;
  highEstimate: number;
}

// Default values
export const DEFAULT_DIMENSIONS: RoomDimensions = {
  length: 4,
  width: 3,
  height: 2.7,
  doors: 1,
  windows: 1,
};

export const DEFAULT_MATERIALS: RoomMaterials = {
  flooring: 'laminate',
  walls: 'paint',
  ceiling: 'paint',
};

export const DEFAULT_ELECTRICAL: ElectricalConfig = {
  enabled: true,
  outlets: 10,
  switches: 6,
  lightingPoints: 8,
  acPoints: 1,
};

export const DEFAULT_PLUMBING: PlumbingConfig = {
  enabled: true,
  toilets: 1,
  sinks: 2,
  showers: 1,
  bathtubs: 1,
};

export const DEFAULT_HEATING: HeatingConfig = {
  enabled: true,
  radiators: 4,
  underfloorArea: 0,
  boiler: false,
};

export const DEFAULT_DOORS_WINDOWS: DoorsWindowsConfig = {
  enabled: true,
  interiorDoors: 4,
  entranceDoor: false,
};

export const DEFAULT_WORK_CATEGORIES: WorkCategories = {
  demolition: true,
  electrical: DEFAULT_ELECTRICAL,
  plumbing: DEFAULT_PLUMBING,
  heating: DEFAULT_HEATING,
  doorsWindows: DEFAULT_DOORS_WINDOWS,
};

export const QUALITY_MULTIPLIERS: Record<QualityLevel, number> = {
  economy: 0.85,
  standard: 1.0,
  premium: 1.4,
};

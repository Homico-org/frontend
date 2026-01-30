import {
  type Room,
  type RoomType,
  type RoomDimensions,
  type RoomMaterials,
  DEFAULT_MATERIALS,
} from '@/components/tools/calculator/types';
import { calculateSurfaces } from './surfaceCalculations';

// Generate unique ID
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default dimensions by room type
const ROOM_DIMENSIONS: Record<RoomType, RoomDimensions> = {
  living: { length: 5, width: 4, height: 2.7, doors: 1, windows: 2 },
  bedroom: { length: 4, width: 3.5, height: 2.7, doors: 1, windows: 1 },
  bathroom: { length: 2.5, width: 2, height: 2.7, doors: 1, windows: 1 },
  kitchen: { length: 3.5, width: 3, height: 2.7, doors: 1, windows: 1 },
  hallway: { length: 4, width: 1.5, height: 2.7, doors: 2, windows: 0 },
  balcony: { length: 3, width: 1.2, height: 2.7, doors: 1, windows: 0 },
};

// Default materials by room type
const ROOM_MATERIALS: Record<RoomType, RoomMaterials> = {
  living: { flooring: 'laminate', walls: 'paint', ceiling: 'paint' },
  bedroom: { flooring: 'laminate', walls: 'wallpaper', ceiling: 'paint' },
  bathroom: { flooring: 'tile', walls: 'tile', ceiling: 'stretch' },
  kitchen: { flooring: 'tile', walls: 'paint', ceiling: 'paint' },
  hallway: { flooring: 'laminate', walls: 'paint', ceiling: 'paint' },
  balcony: { flooring: 'tile', walls: 'paint', ceiling: 'paint' },
};

/**
 * Create a new room with default values based on type
 */
export function createRoom(type: RoomType, customName?: string): Room {
  const dimensions = { ...ROOM_DIMENSIONS[type] };
  const materials = { ...ROOM_MATERIALS[type] };

  return {
    id: generateRoomId(),
    name: customName || '',
    type,
    dimensions,
    materials,
    computed: calculateSurfaces(dimensions),
  };
}

/**
 * Update room dimensions and recalculate surfaces
 */
export function updateRoomDimensions(room: Room, dimensions: Partial<RoomDimensions>): Room {
  const newDimensions = { ...room.dimensions, ...dimensions };
  return {
    ...room,
    dimensions: newDimensions,
    computed: calculateSurfaces(newDimensions),
  };
}

/**
 * Update room materials
 */
export function updateRoomMaterials(room: Room, materials: Partial<RoomMaterials>): Room {
  return {
    ...room,
    materials: { ...room.materials, ...materials },
  };
}

// Apartment presets
export type ApartmentPreset = 'studio' | '1br' | '2br' | '3br';

interface PresetConfig {
  rooms: { type: RoomType; name: string }[];
}

const APARTMENT_PRESETS: Record<ApartmentPreset, PresetConfig> = {
  studio: {
    rooms: [
      { type: 'living', name: '' },
      { type: 'bathroom', name: '' },
      { type: 'kitchen', name: '' },
    ],
  },
  '1br': {
    rooms: [
      { type: 'living', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bathroom', name: '' },
      { type: 'kitchen', name: '' },
      { type: 'hallway', name: '' },
    ],
  },
  '2br': {
    rooms: [
      { type: 'living', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bathroom', name: '' },
      { type: 'kitchen', name: '' },
      { type: 'hallway', name: '' },
    ],
  },
  '3br': {
    rooms: [
      { type: 'living', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bedroom', name: '' },
      { type: 'bathroom', name: '' },
      { type: 'bathroom', name: '' },
      { type: 'kitchen', name: '' },
      { type: 'hallway', name: '' },
    ],
  },
};

/**
 * Generate rooms for an apartment preset
 */
export function generatePresetRooms(preset: ApartmentPreset): Room[] {
  const config = APARTMENT_PRESETS[preset];
  return config.rooms.map((roomConfig) => createRoom(roomConfig.type, roomConfig.name));
}

/**
 * Calculate total area of all rooms
 */
export function calculateTotalArea(rooms: Room[]): number {
  return rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);
}

/**
 * Create a room with custom parameters (from AI analysis)
 */
export function createRoomWithParams(params: {
  name: string;
  type: RoomType;
  length: number;
  width: number;
  height: number;
  doors: number;
  windows: number;
  flooring: RoomMaterials['flooring'];
  walls: RoomMaterials['walls'];
  ceiling: RoomMaterials['ceiling'];
}): Room {
  const dimensions: RoomDimensions = {
    length: params.length,
    width: params.width,
    height: params.height,
    doors: params.doors,
    windows: params.windows,
  };
  const materials: RoomMaterials = {
    flooring: params.flooring,
    walls: params.walls,
    ceiling: params.ceiling,
  };

  return {
    id: generateRoomId(),
    name: params.name,
    type: params.type,
    dimensions,
    materials,
    computed: calculateSurfaces(dimensions),
  };
}

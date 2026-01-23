'use client';

import { useCallback } from 'react';
import {
  Home,
  BedDouble,
  Bath,
  ChefHat,
  LayoutDashboard,
  Warehouse,
  X,
  Sofa,
} from 'lucide-react';
import { type Room, type RoomType } from './types';
import { createRoom, updateRoomDimensions } from '@/utils/calculator';

interface StepRoomsProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
  t: (key: string) => string;
}

const ROOM_TYPE_ICONS: Record<RoomType, typeof Home> = {
  living: Sofa,
  bedroom: BedDouble,
  bathroom: Bath,
  kitchen: ChefHat,
  hallway: LayoutDashboard,
  balcony: Warehouse,
};

const ROOM_TYPES: RoomType[] = ['living', 'bedroom', 'bathroom', 'kitchen', 'hallway', 'balcony'];

export function StepRooms({ rooms, onRoomsChange, t }: StepRoomsProps) {
  const handleAddRoom = useCallback(
    (type: RoomType) => {
      const newRoom = createRoom(type);
      onRoomsChange([...rooms, newRoom]);
    },
    [rooms, onRoomsChange]
  );

  const handleRemoveRoom = useCallback(
    (roomId: string) => {
      if (rooms.length <= 1) return;
      onRoomsChange(rooms.filter((r) => r.id !== roomId));
    },
    [rooms, onRoomsChange]
  );

  const handleDimensionChange = useCallback(
    (roomId: string, field: 'length' | 'width', value: number) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      const updatedRoom = updateRoomDimensions(room, { [field]: value });
      onRoomsChange(rooms.map((r) => (r.id === roomId ? updatedRoom : r)));
    },
    [rooms, onRoomsChange]
  );

  const totalArea = rooms.reduce((sum, room) => sum + room.computed.floorArea, 0);

  return (
    <div className="space-y-6">
      {/* Add Room */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          {t('tools.calculator.addRoom')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ROOM_TYPES.map((type) => {
            const Icon = ROOM_TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => handleAddRoom(type)}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-forest-50 dark:hover:bg-forest-900/20 border border-neutral-200 dark:border-neutral-700 hover:border-forest-300 dark:hover:border-forest-700 transition-all group"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-forest-100 dark:group-hover:bg-forest-900/30 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-neutral-500 group-hover:text-forest-600 dark:group-hover:text-forest-400" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-forest-700 dark:group-hover:text-forest-300 text-center truncate">
                  {t(`tools.calculator.roomTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {t('tools.calculator.yourRooms')}
          </h3>
          <div className="text-sm font-medium text-terracotta-600 dark:text-terracotta-400">
            {t('tools.calculator.totalLabel')}: {totalArea.toFixed(0)} m²
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => {
            const RoomIcon = ROOM_TYPE_ICONS[room.type];
            return (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl group hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center flex-shrink-0">
                    <RoomIcon className="w-5 h-5 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 dark:text-white truncate text-sm">
                      {t(`tools.calculator.roomTypes.${room.type}`)}
                      {rooms.filter((r) => r.type === room.type).length > 1 && (
                        <span className="text-neutral-500 ml-1">
                          #{rooms.filter((r) => r.type === room.type).findIndex((r) => r.id === room.id) + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dimension Inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={room.dimensions.length}
                    onChange={(e) => handleDimensionChange(room.id, 'length', parseFloat(e.target.value) || 1)}
                    min={1}
                    max={20}
                    step={0.1}
                    className="w-14 h-9 px-2 text-center text-sm font-medium text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                  />
                  <span className="text-neutral-400 text-sm">×</span>
                  <input
                    type="number"
                    value={room.dimensions.width}
                    onChange={(e) => handleDimensionChange(room.id, 'width', parseFloat(e.target.value) || 1)}
                    min={1}
                    max={20}
                    step={0.1}
                    className="w-14 h-9 px-2 text-center text-sm font-medium text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                  />
                  <span className="text-sm font-semibold text-terracotta-600 dark:text-terracotta-400 min-w-[50px] text-right">
                    {room.computed.floorArea.toFixed(1)} m²
                  </span>
                  <button
                    onClick={() => handleRemoveRoom(room.id)}
                    disabled={rooms.length <= 1}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <h3 className="text-sm font-semibold text-[var(--hm-fg-secondary)] mb-4">
          {t('tools.calculator.addRoom')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ROOM_TYPES.map((type) => {
            const Icon = ROOM_TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => handleAddRoom(type)}
                className="p-3 rounded-xl bg-[var(--hm-bg-tertiary)]/50 hover:bg-forest-50 border border-[var(--hm-border)] hover:border-forest-300 transition-all group"
              >
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-lg bg-[var(--hm-bg-tertiary)] group-hover:bg-forest-100 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-fg-secondary)]" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-medium text-[var(--hm-fg-secondary)] group-hover:text-[var(--hm-n-700)] text-center truncate">
                  {t(`tools.calculator.roomTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Room List */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--hm-fg-secondary)]">
            {t('tools.calculator.yourRooms')}
          </h3>
          <div className="text-sm font-medium text-[var(--hm-brand-600)]">
            {t('tools.calculator.totalLabel')}: {totalArea.toFixed(0)} m²
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => {
            const RoomIcon = ROOM_TYPE_ICONS[room.type];
            return (
              <div
                key={room.id}
                className="flex items-center justify-between p-4 bg-[var(--hm-bg-tertiary)]/50 rounded-xl group hover:bg-[var(--hm-bg-tertiary)] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-100)] flex items-center justify-center flex-shrink-0">
                    <RoomIcon className="w-5 h-5 text-[var(--hm-brand-600)]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--hm-fg-primary)] truncate text-sm">
                      {t(`tools.calculator.roomTypes.${room.type}`)}
                      {rooms.filter((r) => r.type === room.type).length > 1 && (
                        <span className="text-[var(--hm-fg-muted)] ml-1">
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
                    className="w-14 h-9 px-2 text-center text-sm font-medium text-[var(--hm-fg-primary)] bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20 focus:border-[var(--hm-brand-500)]"
                  />
                  <span className="text-[var(--hm-fg-muted)] text-sm">×</span>
                  <input
                    type="number"
                    value={room.dimensions.width}
                    onChange={(e) => handleDimensionChange(room.id, 'width', parseFloat(e.target.value) || 1)}
                    min={1}
                    max={20}
                    step={0.1}
                    className="w-14 h-9 px-2 text-center text-sm font-medium text-[var(--hm-fg-primary)] bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20 focus:border-[var(--hm-brand-500)]"
                  />
                  <span className="text-sm font-semibold text-[var(--hm-brand-600)] min-w-[50px] text-right">
                    {room.computed.floorArea.toFixed(1)} m²
                  </span>
                  <button
                    onClick={() => handleRemoveRoom(room.id)}
                    disabled={rooms.length <= 1}
                    className="p-2 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

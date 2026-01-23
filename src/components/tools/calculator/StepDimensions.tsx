'use client';

import { useCallback, useState } from 'react';
import {
  Ruler,
  ArrowLeftRight,
  ArrowUpDown,
  MoveVertical,
  DoorOpen,
  Square,
  LayoutGrid,
  Maximize,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { type Room, type RoomDimensions } from './types';
import { updateRoomDimensions } from '@/utils/calculator';

interface StepDimensionsProps {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomsChange: (rooms: Room[]) => void;
  onActiveRoomChange: (roomId: string | null) => void;
  t: (key: string) => string;
}

const ROOM_TYPE_COLORS: Record<string, string> = {
  living: 'bg-terracotta-100 dark:bg-terracotta-900/30 text-terracotta-600 dark:text-terracotta-400',
  bedroom: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  bathroom: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  kitchen: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  hallway: 'bg-forest-100 dark:bg-forest-900/30 text-forest-600 dark:text-forest-400',
  balcony: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
};

export function StepDimensions({
  rooms,
  activeRoomId,
  onRoomsChange,
  onActiveRoomChange,
  t,
}: StepDimensionsProps) {
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const activeIndex = rooms.findIndex((r) => r.id === activeRoom?.id);

  const handleDimensionChange = useCallback(
    (field: keyof RoomDimensions, value: number) => {
      if (!activeRoom) return;
      const updatedRoom = updateRoomDimensions(activeRoom, { [field]: value });
      onRoomsChange(rooms.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    },
    [activeRoom, rooms, onRoomsChange]
  );

  const handlePrevRoom = useCallback(() => {
    if (activeIndex > 0) {
      onActiveRoomChange(rooms[activeIndex - 1].id);
    }
  }, [activeIndex, rooms, onActiveRoomChange]);

  const handleNextRoom = useCallback(() => {
    if (activeIndex < rooms.length - 1) {
      onActiveRoomChange(rooms[activeIndex + 1].id);
    }
  }, [activeIndex, rooms, onActiveRoomChange]);

  if (!activeRoom) return null;

  const dimensionInputs = [
    { key: 'length' as const, icon: ArrowLeftRight, label: t('tools.calculator.dimensions.length'), min: 1, max: 20, step: 0.1 },
    { key: 'width' as const, icon: ArrowUpDown, label: t('tools.calculator.dimensions.width'), min: 1, max: 20, step: 0.1 },
    { key: 'height' as const, icon: MoveVertical, label: t('tools.calculator.dimensions.height'), min: 2, max: 4, step: 0.1 },
  ];

  const countInputs = [
    { key: 'doors' as const, icon: DoorOpen, label: t('tools.calculator.dimensions.doors'), min: 0, max: 5 },
    { key: 'windows' as const, icon: Square, label: t('tools.calculator.dimensions.windows'), min: 0, max: 6 },
  ];

  return (
    <div className="space-y-6">
      {/* Room Selector */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevRoom}
            disabled={activeIndex === 0}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <div className="flex-1 mx-4">
            <div className="flex items-center justify-center gap-2">
              {rooms.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => onActiveRoomChange(room.id)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    room.id === activeRoom.id
                      ? 'bg-terracotta-500 w-6'
                      : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="font-semibold text-neutral-900 dark:text-white">
                {t(`tools.calculator.roomTypes.${activeRoom.type}`)}
              </span>
              <span className="text-neutral-500 text-sm ml-2">
                ({activeIndex + 1}/{rooms.length})
              </span>
            </div>
          </div>

          <button
            onClick={handleNextRoom}
            disabled={activeIndex === rooms.length - 1}
            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Dimension Inputs */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
            <Ruler className="w-5 h-5 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {t('tools.calculator.dimensions.title')}
            </h3>
            <p className="text-sm text-neutral-500">{t('tools.calculator.dimensions.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {dimensionInputs.map(({ key, icon: Icon, label, min, max, step }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={activeRoom.dimensions[key]}
                  onChange={(e) => handleDimensionChange(key, parseFloat(e.target.value) || min)}
                  min={min}
                  max={max}
                  step={step}
                  className="w-full px-4 py-3 pr-10 text-lg font-semibold text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">m</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {countInputs.map(({ key, icon: Icon, label, min, max }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDimensionChange(key, Math.max(min, activeRoom.dimensions[key] - 1))}
                  className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center text-lg font-medium"
                >
                  −
                </button>
                <span className="flex-1 text-center text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                  {activeRoom.dimensions[key]}
                </span>
                <button
                  onClick={() => handleDimensionChange(key, Math.min(max, activeRoom.dimensions[key] + 1))}
                  className="w-10 h-10 rounded-lg bg-terracotta-500 text-white hover:bg-terracotta-600 transition-colors flex items-center justify-center text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Computed Surfaces Preview */}
      <div className="bg-gradient-to-br from-forest-50 to-forest-100 dark:from-forest-900/30 dark:to-forest-800/20 rounded-2xl p-5 border border-forest-200 dark:border-forest-800/30">
        <h3 className="font-semibold text-forest-800 dark:text-forest-300 mb-4 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
          {t('tools.calculator.surfaces.title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/60 dark:bg-neutral-900/40 rounded-xl p-3 text-center">
            <div className="text-xs text-forest-600 dark:text-forest-400 mb-1">
              {t('tools.calculator.surfaces.floor')}
            </div>
            <div className="text-xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
              {activeRoom.computed.floorArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-neutral-900/40 rounded-xl p-3 text-center">
            <div className="text-xs text-forest-600 dark:text-forest-400 mb-1">
              {t('tools.calculator.surfaces.walls')}
            </div>
            <div className="text-xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
              {activeRoom.computed.wallArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-neutral-900/40 rounded-xl p-3 text-center">
            <div className="text-xs text-forest-600 dark:text-forest-400 mb-1">
              {t('tools.calculator.surfaces.ceiling')}
            </div>
            <div className="text-xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
              {activeRoom.computed.ceilingArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-neutral-900/40 rounded-xl p-3 text-center">
            <div className="text-xs text-forest-600 dark:text-forest-400 mb-1">
              {t('tools.calculator.surfaces.perimeter')}
            </div>
            <div className="text-xl font-bold text-forest-700 dark:text-forest-300 tabular-nums">
              {activeRoom.computed.perimeter.toFixed(1)} <span className="text-sm font-normal">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

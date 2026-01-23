'use client';

import { useCallback } from 'react';
import {
  Paintbrush,
  Layers,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid3x3,
  Wallpaper,
  Scissors,
  Expand,
  Copy,
} from 'lucide-react';
import { type Room, type RoomMaterials, type FlooringType, type WallType, type CeilingType } from './types';
import { updateRoomMaterials } from '@/utils/calculator';

interface StepMaterialsProps {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomsChange: (rooms: Room[]) => void;
  onActiveRoomChange: (roomId: string | null) => void;
  t: (key: string) => string;
}

const FLOORING_OPTIONS: { type: FlooringType; icon: typeof Layers }[] = [
  { type: 'laminate', icon: Layers },
  { type: 'parquet', icon: Grid3x3 },
  { type: 'tile', icon: Grid3x3 },
  { type: 'vinyl', icon: Layers },
  { type: 'carpet', icon: Scissors },
];

const WALL_OPTIONS: { type: WallType; icon: typeof Paintbrush }[] = [
  { type: 'paint', icon: Paintbrush },
  { type: 'wallpaper', icon: Wallpaper },
  { type: 'tile', icon: Grid3x3 },
  { type: 'decorative_plaster', icon: Sparkles },
];

const CEILING_OPTIONS: { type: CeilingType; icon: typeof ArrowUpFromLine }[] = [
  { type: 'paint', icon: Paintbrush },
  { type: 'stretch', icon: Expand },
  { type: 'drywall', icon: Layers },
  { type: 'suspended', icon: ArrowUpFromLine },
];

export function StepMaterials({
  rooms,
  activeRoomId,
  onRoomsChange,
  onActiveRoomChange,
  t,
}: StepMaterialsProps) {
  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const activeIndex = rooms.findIndex((r) => r.id === activeRoom?.id);

  const handleMaterialChange = useCallback(
    <K extends keyof RoomMaterials>(field: K, value: RoomMaterials[K]) => {
      if (!activeRoom) return;
      const updatedRoom = updateRoomMaterials(activeRoom, { [field]: value });
      onRoomsChange(rooms.map((r) => (r.id === activeRoom.id ? updatedRoom : r)));
    },
    [activeRoom, rooms, onRoomsChange]
  );

  const handleApplyToAll = useCallback(() => {
    if (!activeRoom) return;
    const { materials } = activeRoom;
    onRoomsChange(rooms.map((r) => updateRoomMaterials(r, materials)));
  }, [activeRoom, rooms, onRoomsChange]);

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
              {rooms.map((room) => (
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

        {/* Apply to All Button */}
        <button
          onClick={handleApplyToAll}
          className="w-full mt-4 py-2.5 px-4 text-sm font-medium text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/20 hover:bg-forest-100 dark:hover:bg-forest-900/30 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.materials.applyToAll')}
        </button>
      </div>

      {/* Flooring */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {t('tools.calculator.materials.flooring')}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {FLOORING_OPTIONS.map(({ type, icon: Icon }) => {
            const isSelected = activeRoom.materials.flooring === type;
            return (
              <button
                key={type}
                onClick={() => handleMaterialChange('flooring', type)}
                className={`p-4 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-amber-700 dark:text-amber-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {t(`tools.calculator.materials.flooringTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Walls */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/30 flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-terracotta-600 dark:text-terracotta-400" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {t('tools.calculator.materials.walls')}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WALL_OPTIONS.map(({ type, icon: Icon }) => {
            const isSelected = activeRoom.materials.walls === type;
            return (
              <button
                key={type}
                onClick={() => handleMaterialChange('walls', type)}
                className={`p-4 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-terracotta-50 dark:bg-terracotta-900/20 ring-2 ring-terracotta-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-terracotta-600 dark:text-terracotta-400' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-terracotta-700 dark:text-terracotta-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {t(`tools.calculator.materials.wallTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ceiling */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {t('tools.calculator.materials.ceiling')}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CEILING_OPTIONS.map(({ type, icon: Icon }) => {
            const isSelected = activeRoom.materials.ceiling === type;
            return (
              <button
                key={type}
                onClick={() => handleMaterialChange('ceiling', type)}
                className={`p-4 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {t(`tools.calculator.materials.ceilingTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

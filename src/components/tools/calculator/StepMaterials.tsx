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
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-4 border border-[var(--hm-border)]">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevRoom}
            disabled={activeIndex === 0}
            className="p-2 rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-n-200)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      ? 'bg-[var(--hm-brand-500)] w-6'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="font-semibold text-[var(--hm-fg-primary)]">
                {t(`tools.calculator.roomTypes.${activeRoom.type}`)}
              </span>
              <span className="text-[var(--hm-fg-muted)] text-sm ml-2">
                ({activeIndex + 1}/{rooms.length})
              </span>
            </div>
          </div>

          <button
            onClick={handleNextRoom}
            disabled={activeIndex === rooms.length - 1}
            className="p-2 rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-n-200)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Apply to All Button */}
        <button
          onClick={handleApplyToAll}
          className="w-full mt-4 py-2.5 px-4 text-sm font-medium text-[var(--hm-fg-secondary)] bg-[var(--hm-bg-tertiary)] hover:bg-forest-100 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" strokeWidth={1.5} />
          {t('tools.calculator.materials.applyToAll')}
        </button>
      </div>

      {/* Flooring */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--hm-warning-100)]/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[var(--hm-warning-500)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-[var(--hm-fg-primary)]">
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
                    ? 'bg-[var(--hm-warning-50)]/20 ring-2 ring-amber-500'
                    : 'bg-[var(--hm-bg-tertiary)]/50 hover:bg-[var(--hm-bg-tertiary)]'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-[var(--hm-warning-500)]' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-[var(--hm-warning-500)]' : 'text-[var(--hm-fg-secondary)]'}`}>
                  {t(`tools.calculator.materials.flooringTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Walls */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-100)] flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-[var(--hm-brand-600)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-[var(--hm-fg-primary)]">
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
                    ? 'bg-[var(--hm-brand-50)] ring-2 ring-[var(--hm-brand-500)]'
                    : 'bg-[var(--hm-bg-tertiary)]/50 hover:bg-[var(--hm-bg-tertiary)]'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-[var(--hm-brand-600)]' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-[var(--hm-brand-700)]' : 'text-[var(--hm-fg-secondary)]'}`}>
                  {t(`tools.calculator.materials.wallTypes.${type}`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ceiling */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--hm-info-100)]/30 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5 text-[var(--hm-info-500)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-semibold text-[var(--hm-fg-primary)]">
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
                    ? 'bg-[var(--hm-info-50)]/20 ring-2 ring-blue-500'
                    : 'bg-[var(--hm-bg-tertiary)]/50 hover:bg-[var(--hm-bg-tertiary)]'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    isSelected ? 'text-[var(--hm-info-500)]' : 'text-neutral-500'
                  }`}
                  strokeWidth={1.5}
                />
                <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-[var(--hm-fg-secondary)]'}`}>
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

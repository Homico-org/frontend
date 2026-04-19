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
  living: 'bg-[var(--hm-brand-100)] text-[var(--hm-brand-600)]',
  bedroom: 'bg-violet-100 text-violet-600',
  bathroom: 'bg-[var(--hm-info-100)]/30 text-[var(--hm-info-500)]',
  kitchen: 'bg-[var(--hm-warning-100)]/30 text-[var(--hm-warning-500)]',
  hallway: 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)]',
  balcony: 'bg-cyan-100 text-cyan-600',
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
              {rooms.map((room, idx) => (
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
      </div>

      {/* Dimension Inputs */}
      <div className="bg-[var(--hm-bg-elevated)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--hm-brand-100)] flex items-center justify-center">
            <Ruler className="w-5 h-5 text-[var(--hm-brand-600)]" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--hm-fg-primary)]">
              {t('tools.calculator.dimensions.title')}
            </h3>
            <p className="text-sm text-[var(--hm-fg-muted)]">{t('tools.calculator.dimensions.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {dimensionInputs.map(({ key, icon: Icon, label, min, max, step }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
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
                  className="w-full px-4 py-3 pr-10 text-lg font-semibold text-[var(--hm-fg-primary)] bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hm-brand-500)]/20 focus:border-[var(--hm-brand-500)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--hm-fg-muted)]">m</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {countInputs.map(({ key, icon: Icon, label, min, max }) => (
            <div key={key}>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {label}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDimensionChange(key, Math.max(min, activeRoom.dimensions[key] - 1))}
                  className="w-10 h-10 rounded-lg bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-n-200)] transition-colors flex items-center justify-center text-lg font-medium"
                >
                  −
                </button>
                <span className="flex-1 text-center text-xl font-bold text-[var(--hm-fg-primary)] tabular-nums">
                  {activeRoom.dimensions[key]}
                </span>
                <button
                  onClick={() => handleDimensionChange(key, Math.min(max, activeRoom.dimensions[key] + 1))}
                  className="w-10 h-10 rounded-lg bg-[var(--hm-brand-500)] text-white hover:bg-[var(--hm-brand-600)] transition-colors flex items-center justify-center text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Computed Surfaces Preview */}
      <div className="bg-gradient-to-br from-[var(--hm-bg-page)] to-[var(--hm-bg-tertiary)] rounded-2xl p-5 border border-[var(--hm-border)]">
        <h3 className="font-semibold text-[var(--hm-n-800)] mb-4 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
          {t('tools.calculator.surfaces.title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/40 rounded-xl p-3 text-center">
            <div className="text-xs text-[var(--hm-fg-secondary)] mb-1">
              {t('tools.calculator.surfaces.floor')}
            </div>
            <div className="text-xl font-bold text-[var(--hm-n-700)] tabular-nums">
              {activeRoom.computed.floorArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/40 rounded-xl p-3 text-center">
            <div className="text-xs text-[var(--hm-fg-secondary)] mb-1">
              {t('tools.calculator.surfaces.walls')}
            </div>
            <div className="text-xl font-bold text-[var(--hm-n-700)] tabular-nums">
              {activeRoom.computed.wallArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/40 rounded-xl p-3 text-center">
            <div className="text-xs text-[var(--hm-fg-secondary)] mb-1">
              {t('tools.calculator.surfaces.ceiling')}
            </div>
            <div className="text-xl font-bold text-[var(--hm-n-700)] tabular-nums">
              {activeRoom.computed.ceilingArea.toFixed(1)} <span className="text-sm font-normal">m²</span>
            </div>
          </div>
          <div className="bg-white/40 rounded-xl p-3 text-center">
            <div className="text-xs text-[var(--hm-fg-secondary)] mb-1">
              {t('tools.calculator.surfaces.perimeter')}
            </div>
            <div className="text-xl font-bold text-[var(--hm-n-700)] tabular-nums">
              {activeRoom.computed.perimeter.toFixed(1)} <span className="text-sm font-normal">m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

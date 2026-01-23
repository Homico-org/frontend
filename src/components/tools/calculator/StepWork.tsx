'use client';

import { useCallback } from 'react';
import {
  Hammer,
  Zap,
  Droplets,
  Flame,
  DoorOpen,
  Plug,
  ToggleLeft,
  Lightbulb,
  Wind,
  Bath,
  Waves,
  ThermometerSun,
  Heater,
  CircleDot,
} from 'lucide-react';
import { type WorkCategories, type ElectricalConfig, type PlumbingConfig, type HeatingConfig, type DoorsWindowsConfig } from './types';
import { Toggle } from '@/components/ui/Toggle';

interface StepWorkProps {
  workCategories: WorkCategories;
  totalFloorArea: number;
  onWorkCategoriesChange: (workCategories: WorkCategories) => void;
  t: (key: string) => string;
}

function CounterInput({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
  icon: Icon,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  icon: typeof Plug;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center text-sm font-medium"
        >
          −
        </button>
        <span className="w-10 text-center font-bold text-neutral-900 dark:text-white tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-terracotta-500 text-white hover:bg-terracotta-600 transition-colors flex items-center justify-center text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function StepWork({ workCategories, totalFloorArea, onWorkCategoriesChange, t }: StepWorkProps) {
  const updateElectrical = useCallback(
    (updates: Partial<ElectricalConfig>) => {
      onWorkCategoriesChange({
        ...workCategories,
        electrical: { ...workCategories.electrical, ...updates },
      });
    },
    [workCategories, onWorkCategoriesChange]
  );

  const updatePlumbing = useCallback(
    (updates: Partial<PlumbingConfig>) => {
      onWorkCategoriesChange({
        ...workCategories,
        plumbing: { ...workCategories.plumbing, ...updates },
      });
    },
    [workCategories, onWorkCategoriesChange]
  );

  const updateHeating = useCallback(
    (updates: Partial<HeatingConfig>) => {
      onWorkCategoriesChange({
        ...workCategories,
        heating: { ...workCategories.heating, ...updates },
      });
    },
    [workCategories, onWorkCategoriesChange]
  );

  const updateDoorsWindows = useCallback(
    (updates: Partial<DoorsWindowsConfig>) => {
      onWorkCategoriesChange({
        ...workCategories,
        doorsWindows: { ...workCategories.doorsWindows, ...updates },
      });
    },
    [workCategories, onWorkCategoriesChange]
  );

  return (
    <div className="space-y-4">
      {/* Demolition */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white">
                {t('tools.calculator.work.demolition')}
              </h3>
              <p className="text-sm text-neutral-500">{totalFloorArea.toFixed(0)} m²</p>
            </div>
          </div>
          <Toggle
            checked={workCategories.demolition}
            onChange={(e) => onWorkCategoriesChange({ ...workCategories, demolition: e.target.checked })}
            variant="primary"
          />
        </div>
      </div>

      {/* Electrical */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {t('tools.calculator.work.electrical')}
            </h3>
          </div>
          <Toggle
            checked={workCategories.electrical.enabled}
            onChange={(e) => updateElectrical({ enabled: e.target.checked })}
            variant="primary"
          />
        </div>
        {workCategories.electrical.enabled && (
          <div className="px-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            <CounterInput
              value={workCategories.electrical.outlets}
              onChange={(v) => updateElectrical({ outlets: v })}
              max={50}
              label={t('tools.calculator.work.outlets')}
              icon={Plug}
            />
            <CounterInput
              value={workCategories.electrical.switches}
              onChange={(v) => updateElectrical({ switches: v })}
              max={30}
              label={t('tools.calculator.work.switches')}
              icon={ToggleLeft}
            />
            <CounterInput
              value={workCategories.electrical.lightingPoints}
              onChange={(v) => updateElectrical({ lightingPoints: v })}
              max={40}
              label={t('tools.calculator.work.lightingPoints')}
              icon={Lightbulb}
            />
            <CounterInput
              value={workCategories.electrical.acPoints}
              onChange={(v) => updateElectrical({ acPoints: v })}
              max={10}
              label={t('tools.calculator.work.acPoints')}
              icon={Wind}
            />
          </div>
        )}
      </div>

      {/* Plumbing */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {t('tools.calculator.work.plumbing')}
            </h3>
          </div>
          <Toggle
            checked={workCategories.plumbing.enabled}
            onChange={(e) => updatePlumbing({ enabled: e.target.checked })}
            variant="primary"
          />
        </div>
        {workCategories.plumbing.enabled && (
          <div className="px-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            <CounterInput
              value={workCategories.plumbing.toilets}
              onChange={(v) => updatePlumbing({ toilets: v })}
              max={5}
              label={t('tools.calculator.work.toilets')}
              icon={CircleDot}
            />
            <CounterInput
              value={workCategories.plumbing.sinks}
              onChange={(v) => updatePlumbing({ sinks: v })}
              max={10}
              label={t('tools.calculator.work.sinks')}
              icon={Droplets}
            />
            <CounterInput
              value={workCategories.plumbing.showers}
              onChange={(v) => updatePlumbing({ showers: v })}
              max={5}
              label={t('tools.calculator.work.showers')}
              icon={Waves}
            />
            <CounterInput
              value={workCategories.plumbing.bathtubs}
              onChange={(v) => updatePlumbing({ bathtubs: v })}
              max={3}
              label={t('tools.calculator.work.bathtubs')}
              icon={Bath}
            />
          </div>
        )}
      </div>

      {/* Heating */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {t('tools.calculator.work.heating')}
            </h3>
          </div>
          <Toggle
            checked={workCategories.heating.enabled}
            onChange={(e) => updateHeating({ enabled: e.target.checked })}
            variant="primary"
          />
        </div>
        {workCategories.heating.enabled && (
          <div className="px-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            <CounterInput
              value={workCategories.heating.radiators}
              onChange={(v) => updateHeating({ radiators: v })}
              max={20}
              label={t('tools.calculator.work.radiators')}
              icon={Heater}
            />
            <CounterInput
              value={workCategories.heating.underfloorArea}
              onChange={(v) => updateHeating({ underfloorArea: v })}
              max={Math.ceil(totalFloorArea)}
              label={`${t('tools.calculator.work.underfloor')} (m²)`}
              icon={ThermometerSun}
            />
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('tools.calculator.work.boiler')}
                </span>
              </div>
              <Toggle
                checked={workCategories.heating.boiler}
                onChange={(e) => updateHeating({ boiler: e.target.checked })}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Doors & Windows */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {t('tools.calculator.work.doorsWindows')}
            </h3>
          </div>
          <Toggle
            checked={workCategories.doorsWindows.enabled}
            onChange={(e) => updateDoorsWindows({ enabled: e.target.checked })}
            variant="primary"
          />
        </div>
        {workCategories.doorsWindows.enabled && (
          <div className="px-5 divide-y divide-neutral-100 dark:divide-neutral-800">
            <CounterInput
              value={workCategories.doorsWindows.interiorDoors}
              onChange={(v) => updateDoorsWindows({ interiorDoors: v })}
              max={15}
              label={t('tools.calculator.work.interiorDoors')}
              icon={DoorOpen}
            />
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <DoorOpen className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t('tools.calculator.work.entranceDoor')}
                </span>
              </div>
              <Toggle
                checked={workCategories.doorsWindows.entranceDoor}
                onChange={(e) => updateDoorsWindows({ entranceDoor: e.target.checked })}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

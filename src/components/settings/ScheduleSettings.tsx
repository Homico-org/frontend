"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { DaySchedule, ScheduleOverride } from "@/types/shared";
import DatePicker from "@/components/common/DatePicker";
import Checkbox from "@/components/ui/Checkbox";
import TimePicker from "@/components/ui/TimePicker";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DAY_KEYS: Array<{ key: string; dayOfWeek: number; short: string; shortKa: string; shortRu: string }> = [
  { key: "dayMonday", dayOfWeek: 0, short: "Mon", shortKa: "ორშ", shortRu: "Пн" },
  { key: "dayTuesday", dayOfWeek: 1, short: "Tue", shortKa: "სამ", shortRu: "Вт" },
  { key: "dayWednesday", dayOfWeek: 2, short: "Wed", shortKa: "ოთხ", shortRu: "Ср" },
  { key: "dayThursday", dayOfWeek: 3, short: "Thu", shortKa: "ხუთ", shortRu: "Чт" },
  { key: "dayFriday", dayOfWeek: 4, short: "Fri", shortKa: "პარ", shortRu: "Пт" },
  { key: "daySaturday", dayOfWeek: 5, short: "Sat", shortKa: "შაბ", shortRu: "Сб" },
  { key: "daySunday", dayOfWeek: 6, short: "Sun", shortKa: "კვი", shortRu: "Вс" },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAY_KEYS.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  isAvailable: d.dayOfWeek < 5,
  startHour: 9,
  endHour: 18,
}));

export default function ScheduleSettings() {
  const { t, locale, pick } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [newOverrideBlocked, setNewOverrideBlocked] = useState(true);

  const loadSchedule = useCallback(async () => {
    try {
      const { data } = await api.get("/users/me/schedule");
      if (data.weeklySchedule?.length > 0) setSchedule(data.weeklySchedule);
      if (data.scheduleOverrides) setOverrides(data.scheduleOverrides);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const updateDay = (dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d)),
    );
  };

  const addOverride = () => {
    if (!newOverrideDate) return;
    if (overrides.some((o) => o.date === newOverrideDate)) return;
    setOverrides((prev) => [...prev, { date: newOverrideDate, isBlocked: newOverrideBlocked }]);
    setNewOverrideDate("");
  };

  const removeOverride = (date: string) => {
    setOverrides((prev) => prev.filter((o) => o.date !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/users/me/schedule", { weeklySchedule: schedule, scheduleOverrides: overrides });
      toast.success(t("settings.scheduleSaved"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const getDayLabel = (d: typeof DAY_KEYS[number]) => pick({ en: d.short, ka: d.shortKa, ru: d.shortRu });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-[var(--hm-fg-muted)]">
        {t("settings.scheduleDescription")}
      </p>

      {/* Weekly Schedule */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-2">
          {t("settings.availability")}
        </h3>

        <div className="rounded-lg border border-[var(--hm-border)] overflow-hidden">
          {DAY_KEYS.map(( dayInfo, idx) => {
            const day = schedule.find((d) => d.dayOfWeek === dayInfo.dayOfWeek);
            if (!day) return null;
            const isLast = idx === DAY_KEYS.length - 1;

            return (
              <div
                key={dayInfo.dayOfWeek}
                className={`flex items-center gap-2 px-3 py-2 ${!isLast ? "border-b border-[var(--hm-border-subtle)]" : ""} ${
                  day.isAvailable ? "bg-[var(--hm-bg-elevated)]" : "bg-[var(--hm-bg-tertiary)]/50"
                }`}
              >
                {/* Toggle */}
                <button
                  onClick={() => updateDay(dayInfo.dayOfWeek, { isAvailable: !day.isAvailable })}
                  className={`w-8 h-[18px] rounded-full relative transition-colors flex-shrink-0 ${
                    day.isAvailable ? "bg-[var(--hm-brand-500)]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-[var(--hm-bg-elevated)] shadow-sm transition-transform ${
                      day.isAvailable ? "left-[17px]" : "left-[2px]"
                    }`}
                  />
                </button>

                {/* Day name */}
                <span className={`w-10 text-xs font-semibold flex-shrink-0 ${
                  day.isAvailable ? "text-[var(--hm-fg-primary)]" : "text-[var(--hm-fg-muted)]"
                }`}>
                  {getDayLabel(dayInfo)}
                </span>

                {/* Time selectors or closed */}
                {day.isAvailable ? (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <TimePicker
                      value={day.startHour}
                      onChange={(h) => updateDay(dayInfo.dayOfWeek, { startHour: h })}
                      hours={HOURS}
                    />
                    <span className="text-[var(--hm-fg-muted)] text-xs">–</span>
                    <TimePicker
                      value={day.endHour}
                      onChange={(h) => updateDay(dayInfo.dayOfWeek, { endHour: h })}
                      hours={HOURS.filter((h) => h > day.startHour)}
                    />
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--hm-fg-muted)] italic ml-auto">
                    {t("booking.closed")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider">
          {t("settings.dateOverrides")}
        </h3>

        {overrides.length > 0 && (
          <div className="space-y-1">
            {overrides.map((o) => (
              <div
                key={o.date}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--hm-bg-elevated)] border border-[var(--hm-border)]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--hm-fg-primary)]">
                    {o.date}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: o.isBlocked ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      color: o.isBlocked ? "#ef4444" : "#22c55e",
                    }}
                  >
                    {o.isBlocked ? t("settings.blocked") : t("settings.customHours")}
                  </span>
                </div>
                <button
                  onClick={() => removeOverride(o.date)}
                  className="p-1 rounded hover:bg-[var(--hm-error-50)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <DatePicker
            value={newOverrideDate}
            onChange={setNewOverrideDate}
            min={new Date().toISOString().split("T")[0]}
            locale={locale as 'ka' | 'en' | 'ru'}
            size="sm"
            className="flex-1"
          />
          <Checkbox
            checked={newOverrideBlocked}
            onChange={setNewOverrideBlocked}
            label={t("settings.blockDate")}
            size="sm"
          />
          <button
            onClick={addOverride}
            disabled={!newOverrideDate}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--hm-brand-500)] text-white disabled:opacity-40 hover:bg-[var(--hm-brand-600)] transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="pt-2 border-t border-[var(--hm-border)]">
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <LoadingSpinner size="xs" className="mr-2" /> : null}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toggle } from "@/components/ui/Toggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { DaySchedule, ScheduleOverride } from "@/types/shared";
import { Clock, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DAY_KEYS: Array<{ key: string; dayOfWeek: number }> = [
  { key: "dayMonday", dayOfWeek: 0 },
  { key: "dayTuesday", dayOfWeek: 1 },
  { key: "dayWednesday", dayOfWeek: 2 },
  { key: "dayThursday", dayOfWeek: 3 },
  { key: "dayFriday", dayOfWeek: 4 },
  { key: "daySaturday", dayOfWeek: 5 },
  { key: "daySunday", dayOfWeek: 6 },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAY_KEYS.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  isAvailable: d.dayOfWeek < 5, // Mon-Fri default
  startHour: 9,
  endHour: 18,
}));

export default function ScheduleSettings() {
  const { t } = useLanguage();
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
      if (data.weeklySchedule?.length > 0) {
        setSchedule(data.weeklySchedule);
      }
      if (data.scheduleOverrides) {
        setOverrides(data.scheduleOverrides);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const updateDay = (dayOfWeek: number, updates: Partial<DaySchedule>) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d)),
    );
  };

  const addOverride = () => {
    if (!newOverrideDate) return;
    if (overrides.some((o) => o.date === newOverrideDate)) return;

    setOverrides((prev) => [
      ...prev,
      { date: newOverrideDate, isBlocked: newOverrideBlocked },
    ]);
    setNewOverrideDate("");
  };

  const removeOverride = (date: string) => {
    setOverrides((prev) => prev.filter((o) => o.date !== date));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/users/me/schedule", {
        weeklySchedule: schedule,
        scheduleOverrides: overrides,
      });
      toast.success(t("settings.scheduleSaved"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" color="#C4735B" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("settings.schedule")}
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t("settings.scheduleDescription")}
        </p>
      </div>

      {/* Weekly Schedule */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} style={{ color: "#C4735B" }} />
          <h3
            className="font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("settings.availability")}
          </h3>
        </div>

        {DAY_KEYS.map(({ key, dayOfWeek }) => {
          const day = schedule.find((d) => d.dayOfWeek === dayOfWeek);
          if (!day) return null;

          return (
            <div
              key={dayOfWeek}
              className="flex items-center gap-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <div className="w-28 shrink-0">
                <Toggle
                  checked={day.isAvailable}
                  onChange={() =>
                    updateDay(dayOfWeek, { isAvailable: !day.isAvailable })
                  }
                  size="sm"
                  label={t(`settings.${key}`)}
                />
              </div>

              {day.isAvailable ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={day.startHour}
                    onChange={(e) =>
                      updateDay(dayOfWeek, {
                        startHour: Number(e.target.value),
                      })
                    }
                    className="rounded-lg px-2 py-1.5 text-sm border"
                    style={{
                      backgroundColor: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    —
                  </span>
                  <select
                    value={day.endHour}
                    onChange={(e) =>
                      updateDay(dayOfWeek, { endHour: Number(e.target.value) })
                    }
                    className="rounded-lg px-2 py-1.5 text-sm border"
                    style={{
                      backgroundColor: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {HOURS.filter((h) => h > day.startHour).map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span
                  className="text-sm italic"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {t("booking.closed")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Date Overrides */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          borderColor: "var(--color-border)",
        }}
      >
        <h3
          className="font-medium mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("settings.dateOverrides")}
        </h3>

        {overrides.length > 0 && (
          <div className="space-y-2 mb-3">
            {overrides.map((o) => (
              <div
                key={o.date}
                className="flex items-center justify-between rounded-lg px-3 py-2 border"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  backgroundColor: "var(--color-bg-primary)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {o.date}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: o.isBlocked
                        ? "rgba(239,68,68,0.1)"
                        : "rgba(34,197,94,0.1)",
                      color: o.isBlocked ? "#ef4444" : "#22c55e",
                    }}
                  >
                    {o.isBlocked
                      ? t("settings.blocked")
                      : t("settings.customHours")}
                  </span>
                </div>
                <button
                  onClick={() => removeOverride(o.date)}
                  className="p-1 rounded hover:bg-red-50"
                >
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <input
              type="date"
              value={newOverrideDate}
              onChange={(e) => setNewOverrideDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg px-3 py-2 text-sm border"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm whitespace-nowrap">
            <input
              type="checkbox"
              checked={newOverrideBlocked}
              onChange={(e) => setNewOverrideBlocked(e.target.checked)}
              className="rounded"
            />
            <span style={{ color: "var(--color-text-secondary)" }}>
              {t("settings.blockDate")}
            </span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={addOverride}
            disabled={!newOverrideDate}
          >
            <Plus size={14} className="mr-1" />
            {t("settings.addOverride")}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size="xs" className="mr-2" /> : null}
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

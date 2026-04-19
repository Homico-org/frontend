"use client";
import { ACCENT_COLOR } from "@/constants/theme";

import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  locale?: "ka" | "en" | "ru";
  className?: string;
  size?: "sm" | "md";
}

const MONTHS = {
  ka: [
    "იანვარი",
    "თებერვალი",
    "მარტი",
    "აპრილი",
    "მაისი",
    "ივნისი",
    "ივლისი",
    "აგვისტო",
    "სექტემბერი",
    "ოქტომბერი",
    "ნოემბერი",
    "დეკემბერი",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
};

const WEEKDAYS = {
  ka: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

const ACCENT = ACCENT_COLOR;

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  locale: localeProp,
  className = "",
  size = "md",
}: DatePickerProps) {
  const { t, locale: contextLocale } = useLanguage();
  const locale = (localeProp || contextLocale) as "ka" | "en" | "ru";

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside — close only if click is outside BOTH trigger and calendar
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (calendarRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const calHeight = 330;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < calHeight && rect.top > calHeight;

    setDropdownPos({
      top: openUp ? rect.top - calHeight - 4 : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 288),
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  const formatDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
  };

  const getDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isDisabled = (d: Date) => {
    const s = d.toISOString().split("T")[0];
    return (min && s < min) || (max && s > max) || false;
  };

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) =>
    selectedDate?.toDateString() === d.toDateString();

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(d.toISOString().split("T")[0]);
    setIsOpen(false);
  };

  const months = MONTHS[locale] || MONTHS.en;
  const weekdays = WEEKDAYS[locale] || WEEKDAYS.en;
  const days = getDays(currentMonth);
  const isSm = size === "sm";

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full rounded-lg border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] transition-all text-left ${
          isOpen
            ? "border-[var(--hm-brand-500)]/40 ring-2 ring-[var(--hm-brand-500)]/10"
            : "hover:border-[var(--hm-border-strong)]"
        } ${isSm ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}`}
      >
        <Calendar
          className={`flex-shrink-0 text-[var(--hm-fg-muted)] ${isSm ? "w-3.5 h-3.5" : "w-4 h-4"}`}
        />
        <span
          className={`flex-1 truncate ${value ? "text-[var(--hm-fg-primary)]" : "text-[var(--hm-fg-muted)]"}`}
        >
          {value ? formatDisplay(value) : placeholder || t("common.ddmmyyyy")}
        </span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="p-0.5 rounded hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)]"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Calendar dropdown — portal */}
      {isOpen &&
        dropdownPos &&
        mounted &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-[200] w-[272px] rounded-xl shadow-2xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--hm-border-subtle)]">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-[var(--hm-fg-primary)]">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-2 pt-2">
              {weekdays.map((wd) => (
                <div
                  key={wd}
                  className="h-7 flex items-center justify-center text-[10px] font-semibold text-[var(--hm-fg-muted)] uppercase"
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5 px-2 pb-2">
              {days.map((day, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(day)}
                      disabled={isDisabled(day)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                        isSelected(day)
                          ? "text-white shadow-sm"
                          : isToday(day)
                            ? "font-bold"
                            : ""
                      } ${
                        isDisabled(day)
                          ? "opacity-25 cursor-not-allowed"
                          : isSelected(day)
                            ? ""
                            : "hover:bg-[var(--hm-bg-tertiary)]"
                      }`}
                      style={
                        isSelected(day)
                          ? { backgroundColor: ACCENT }
                          : isToday(day)
                            ? { color: ACCENT }
                            : { color: "var(--hm-fg-primary)" }
                      }
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--hm-border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-[11px] font-medium text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)] transition-colors"
              >
                {t("browse.clearAll")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (!isDisabled(today)) {
                    onChange(today.toISOString().split("T")[0]);
                    setIsOpen(false);
                  }
                }}
                className="text-[11px] font-semibold transition-colors hover:opacity-80"
                style={{ color: ACCENT }}
              >
                {t("common.today")}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

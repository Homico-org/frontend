"use client";

import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { TimeSlot } from "@/types/shared";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function getNext30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayName(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(
    locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US",
    {
      weekday: "short",
    },
  );
}

function getDayNum(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDate();
}

function getMonthName(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(
    locale === "ka" ? "ka-GE" : locale === "ru" ? "ru-RU" : "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );
}

export default function BookingModal({
  isOpen,
  onClose,
  professionalId,
  professionalName,
}: BookingModalProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const allDays = getNext30Days();
  const visibleDays = allDays.slice(weekOffset * 7, weekOffset * 7 + 7);

  const fetchSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const { data } = await api.get(
          `/bookings/pro/${professionalId}/availability?date=${date}`,
        );
        setSlots(Array.isArray(data) ? data : []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [professionalId],
  );

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate("");
      setSlots([]);
      setSelectedSlot(null);
      setNote("");
      setSuccess(false);
      setWeekOffset(0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedDate || selectedSlot === null) return;
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        professionalId,
        date: selectedDate,
        startHour: selectedSlot,
        endHour: selectedSlot + 1,
        note: note.trim() || undefined,
      });
      setSuccess(true);
      toast.success(t("booking.bookingSuccess"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const availableSlots = slots.filter((s) => s.available);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        icon={<Calendar size={20} style={{ color: "#C4735B" }} />}
        title={t("booking.bookAppointment")}
      />

      <ModalBody>
        {success ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
            >
              <Check size={32} className="text-green-500" />
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t("booking.bookingSuccess")}
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {selectedDate} ·{" "}
              {selectedSlot !== null ? formatHour(selectedSlot) : ""} —{" "}
              {selectedSlot !== null ? formatHour(selectedSlot + 1) : ""}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t("booking.with")} {professionalName}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Date Selection */}
            <div>
              <label
                className="text-sm font-medium mb-2 block"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t("booking.selectDate")}
              </label>
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                  disabled={weekOffset === 0}
                  className="p-1 rounded-lg disabled:opacity-30"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span
                  className="text-xs flex-1 text-center"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {visibleDays.length > 0 &&
                    getMonthName(visibleDays[0], locale)}
                </span>
                <button
                  onClick={() => setWeekOffset(Math.min(3, weekOffset + 1))}
                  disabled={weekOffset >= 3}
                  className="p-1 rounded-lg disabled:opacity-30"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {visibleDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className="flex flex-col items-center py-2 px-1 rounded-xl transition-all text-center"
                    style={{
                      backgroundColor:
                        selectedDate === day
                          ? "#C4735B"
                          : "var(--color-bg-primary)",
                      color:
                        selectedDate === day
                          ? "#fff"
                          : "var(--color-text-primary)",
                      border:
                        selectedDate === day
                          ? "2px solid #C4735B"
                          : "2px solid var(--color-border-subtle)",
                    }}
                  >
                    <span className="text-[10px] uppercase opacity-70">
                      {getDayName(day, locale)}
                    </span>
                    <span className="text-lg font-semibold leading-tight">
                      {getDayNum(day)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label
                  className="text-sm font-medium mb-2 flex items-center gap-1.5"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <Clock size={14} />
                  {t("booking.selectTime")}
                </label>

                {loadingSlots ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="md" color="#C4735B" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <Alert variant="info">{t("booking.noSlotsAvailable")}</Alert>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.hour}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.hour)}
                        className="py-2 px-1 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor:
                            selectedSlot === slot.hour
                              ? "#C4735B"
                              : slot.available
                                ? "var(--color-bg-primary)"
                                : "var(--color-bg-tertiary)",
                          color:
                            selectedSlot === slot.hour
                              ? "#fff"
                              : "var(--color-text-primary)",
                          border:
                            selectedSlot === slot.hour
                              ? "2px solid #C4735B"
                              : "2px solid var(--color-border-subtle)",
                        }}
                      >
                        {formatHour(slot.hour)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            {selectedSlot !== null && (
              <div>
                <label
                  className="text-sm font-medium mb-1.5 block"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {t("booking.yourNote")}
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("booking.notePlaceholder")}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {success ? (
          <Button onClick={onClose}>{t("common.close")}</Button>
        ) : (
          <div className="flex gap-2 w-full justify-end">
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || selectedSlot === null || submitting}
            >
              {submitting && <LoadingSpinner size="xs" className="mr-2" />}
              {t("booking.confirm")}
            </Button>
          </div>
        )}
      </ModalFooter>
    </Modal>
  );
}

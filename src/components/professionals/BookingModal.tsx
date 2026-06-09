"use client";

import DatePicker from "@/components/common/DatePicker";
import { Alert } from "@/components/ui/Alert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { TimeSlot } from "@/types/shared";
import { extractApiErrorMessage } from "@/utils/errorUtils";
import { Calendar, Check, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
  // When booking a pro into a Project role, these link the resulting
  // booking back to the engagement (server-side, at creation).
  projectId?: string;
  engagementId?: string;
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

export default function BookingModal({
  isOpen,
  onClose,
  professionalId,
  professionalName,
  projectId,
  engagementId,
}: BookingModalProps) {
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

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
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate("");
      setSlots([]);
      setSelectedSlot(null);
      setNote("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedDate || selectedSlot === null) return;
    setSubmitting(true);
    try {
      // Post-payments rework: response now includes paymentRedirectUrl
      // alongside the nested booking. Older backends still return the
      // bare booking document - both shapes are accepted so this client
      // works while prod is mid-deploy. If neither shape produces an
      // ID, that's a real bug and we surface it instead of navigating
      // to `/bookings/undefined/pay`.
      const { data } = await api.post<unknown>("/bookings", {
        professionalId,
        date: selectedDate,
        startHour: selectedSlot,
        endHour: selectedSlot + 1,
        note: note.trim() || undefined,
        projectId,
        engagementId,
      });
      const r = data as {
        booking?: { _id?: string; id?: string };
        paymentRedirectUrl?: string;
        _id?: string;
        id?: string;
      };
      const bookingId = r.booking?._id ?? r.booking?.id ?? r._id ?? r.id;
      if (!bookingId) {
        toast.error(t("common.error"));
        return;
      }
      onClose();
      // Hard-navigate directly to the payment provider's URL so the
      // user lands on the actual payment step, not on an intermediate
      // summary that requires another click. window.location.href is
      // more reliable than router.push from a closing modal (no race
      // with the unmount). See ServiceBookingModal for the longer note.
      if (r.paymentRedirectUrl) {
        window.location.href = r.paymentRedirectUrl;
      } else {
        // No redirect URL - route to this booking's pay page (it's
        // AWAITING_PAYMENT) rather than the bookings list.
        router.push(`/bookings/${bookingId}/pay`);
      }
      return;
    } catch (err: any) {
      // NestJS returns validation errors as `message: string[]` -
      // passing the array straight into toast.error rendered nothing
      // and looked like a no-op. Helper joins arrays + falls through.
      console.error('[BookingModal] Booking submit failed', err);
      toast.error(extractApiErrorMessage(err, t("common.error")));
    } finally {
      setSubmitting(false);
    }
  };

  // Drop hours that have already passed when today is selected - the backend
  // marks slots available by schedule alone and doesn't account for "now".
  const availableSlots = slots.filter((s) => {
    if (!s.available) return false;
    if (selectedDate === today) return s.hour > new Date().getHours();
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        icon={<Calendar size={18} style={{ color: 'var(--hm-brand-500)' }} />}
        title={t("booking.bookAppointment")}
      />

      <ModalBody>
        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-[var(--hm-success-50)]">
              <Check size={24} className="text-[var(--hm-success-500)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--hm-fg-primary)] mb-1">
              {t("booking.bookingSuccess")}
            </h3>
            <p className="text-sm text-[var(--hm-fg-muted)]">
              {selectedDate} · {selectedSlot !== null ? `${formatHour(selectedSlot)} - ${formatHour(selectedSlot + 1)}` : ""}
            </p>
            <p className="text-xs text-[var(--hm-fg-muted)] mt-0.5">
              {professionalName}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-1.5 block">
                {t("booking.selectDate")}
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                min={today}
                max={maxDate}
                locale={locale as "ka" | "en" | "ru"}
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t("booking.selectTime")}
                </label>

                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" color="var(--hm-brand-500)" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <Alert variant="info" size="sm">
                    {t("booking.noSlotsAvailable")}
                  </Alert>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {availableSlots
                      .map((slot) => (
                        <button
                          key={slot.hour}
                          onClick={() => setSelectedSlot(slot.hour)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all ${
                            selectedSlot === slot.hour
                              ? "bg-[var(--hm-brand-500)] text-white shadow-sm"
                              : "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
                          }`}
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
                <label className="text-xs font-semibold text-[var(--hm-fg-muted)] uppercase tracking-wider mb-1.5 block">
                  {t("booking.yourNote")}
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("booking.notePlaceholder")}
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {success ? (
          <Button onClick={onClose} size="sm">{t("common.close")}</Button>
        ) : (
          <div className="flex gap-2 w-full justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedDate || selectedSlot === null || submitting}
              loading={submitting}
            >
              {t("booking.confirm")}
            </Button>
          </div>
        )}
      </ModalFooter>
    </Modal>
  );
}

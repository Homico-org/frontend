"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type DisputeType = "pro_noshow" | "client_noshow" | "quality" | "other";

interface RaiseDisputeModalProps {
  bookingId: string | null;
  /** 'client' or 'pro' - filters the available dispute types. */
  raisedByRole: "client" | "pro";
  onClose: () => void;
  onRaised?: () => void;
}

interface UploadResponse {
  url?: string;
  path?: string;
}

const TYPES_BY_ROLE: Record<"client" | "pro", DisputeType[]> = {
  // Client can report pro no-show OR quality issues.
  client: ["pro_noshow", "quality", "other"],
  // Pro can report client no-show.
  pro: ["client_noshow", "other"],
};

const MAX_EVIDENCE = 5;

/**
 * Lets either party report a problem with a booking. Freezes the escrow
 * until admin reviews in /admin/disputes. Evidence (photos) lives on the
 * dispute doc as URLs from the upload endpoint.
 *
 * Type list is filtered by role - clients can't claim "client no-show",
 * pros can't claim "pro no-show" against themselves. The "quality" type
 * is client-only because a pro can't really dispute their own work
 * quality.
 */
export default function RaiseDisputeModal({
  bookingId,
  raisedByRole,
  onClose,
  onRaised,
}: RaiseDisputeModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<DisputeType>(TYPES_BY_ROLE[raisedByRole][0]);
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = bookingId !== null;

  const reset = useCallback(() => {
    setType(TYPES_BY_ROLE[raisedByRole][0]);
    setDescription("");
    setEvidenceUrls([]);
    setError(null);
    setSubmitting(false);
    setUploading(false);
  }, [raisedByRole]);

  const handleClose = useCallback(() => {
    if (submitting || uploading) return;
    reset();
    onClose();
  }, [submitting, uploading, reset, onClose]);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (evidenceUrls.length + files.length > MAX_EVIDENCE) {
        toast.error(
          t("dispute.tooManyPhotos", { max: String(MAX_EVIDENCE) }),
        );
        return;
      }
      setUploading(true);
      try {
        const uploads = await Promise.all(
          Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const { data } = await api.post<UploadResponse>(
              "/upload",
              formData,
              { headers: { "Content-Type": "multipart/form-data" } },
            );
            return data.url ?? data.path;
          }),
        );
        const newUrls = uploads.filter((u): u is string => !!u);
        setEvidenceUrls((prev) => [...prev, ...newUrls]);
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? t("common.error");
        toast.error(msg);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [evidenceUrls.length, toast, t],
  );

  const handleRemove = useCallback((url: string) => {
    setEvidenceUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!bookingId) return;
      if (description.trim().length < 10) {
        setError(t("dispute.descriptionTooShort"));
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await api.post(`/bookings/${bookingId}/dispute`, {
          type,
          description: description.trim(),
          evidenceUrls,
        });
        toast.success(t("dispute.successToast"));
        onRaised?.();
        reset();
        onClose();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? t("common.error");
        setError(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [bookingId, description, type, evidenceUrls, toast, t, onRaised, reset, onClose],
  );

  const availableTypes = TYPES_BY_ROLE[raisedByRole];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton
      preventClose={submitting}
      ariaLabel={t("dispute.title")}
    >
      <ModalHeader title={t("dispute.title")} description={t("dispute.subtitle")} />
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <Alert variant="warning">{t("dispute.warning")}</Alert>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("dispute.typeLabel")}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {availableTypes.map((tt) => {
                  const selected = type === tt;
                  return (
                    <button
                      key={tt}
                      type="button"
                      onClick={() => setType(tt)}
                      disabled={submitting}
                      className={`group text-left rounded-xl px-4 py-3 text-sm transition-all duration-150 disabled:opacity-50 ${
                        selected
                          ? "-translate-y-[1px]"
                          : "hover:-translate-y-[1px] hover:shadow-sm"
                      }`}
                      style={
                        selected
                          ? {
                              background:
                                "linear-gradient(180deg, rgba(239,78,36,0.12) 0%, rgba(239,78,36,0.04) 100%)",
                              border: "1px solid rgba(239,78,36,0.45)",
                              color: "var(--hm-fg-primary)",
                              boxShadow:
                                "0 4px 10px -2px rgba(239,78,36,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
                            }
                          : {
                              backgroundColor: "var(--hm-bg-elevated)",
                              border: "1px solid var(--hm-border-subtle)",
                              color: "var(--hm-fg-primary)",
                              boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
                            }
                      }
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2">
                        {/* Tiny radio-style indicator gives the choice a
                            tactile "I picked this one" affordance without
                            using a real <input type=radio>. */}
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all"
                          style={{
                            backgroundColor: selected
                              ? "#EF4E24"
                              : "transparent",
                            border: `2px solid ${selected ? "#EF4E24" : "var(--hm-border)"}`,
                          }}
                        >
                          {selected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span
                          className="font-semibold"
                          style={{
                            color: selected
                              ? "#EF4E24"
                              : "var(--hm-fg-primary)",
                          }}
                        >
                          {t(`dispute.type.${tt}`)}
                        </span>
                      </div>
                      <span
                        className="block text-xs mt-1 ml-6 leading-relaxed"
                        style={{ color: "var(--hm-fg-muted)" }}
                      >
                        {t(`dispute.typeHint.${tt}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("dispute.descriptionLabel")} *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("dispute.descriptionPlaceholder")}
                rows={4}
                required
                disabled={submitting}
                maxLength={1000}
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--hm-text-tertiary)" }}
              >
                {description.length}/1000
              </p>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("dispute.evidenceLabel")}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
                disabled={submitting || uploading || evidenceUrls.length >= MAX_EVIDENCE}
              />
              <div className="flex flex-wrap gap-2">
                {evidenceUrls.map((url) => (
                  <div
                    key={url}
                    className="group relative w-20 h-20 rounded-xl overflow-hidden transition-all hover:-translate-y-[1px] hover:shadow-md"
                    style={{
                      border: "1px solid var(--hm-border-subtle)",
                      boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                    }}
                  >
                    <Image
                      src={url}
                      alt="evidence"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Generous tap zone (28px hit area on a 20px-look
                        icon button) sized for finger-tapping. The audit
                        flagged the previous p-1 at only ~22px clickable.
                        Sized down the visual but kept the touch comfort. */}
                    <button
                      type="button"
                      onClick={() => handleRemove(url)}
                      disabled={submitting}
                      className="absolute top-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.65)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                      aria-label={t("dispute.removeEvidence")}
                    >
                      <X size={12} color="white" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
                {evidenceUrls.length < MAX_EVIDENCE && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting || uploading}
                    className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 hover:-translate-y-[1px] hover:border-[var(--hm-brand-400)]"
                    style={{
                      backgroundColor: "var(--hm-bg-elevated)",
                      border: "1.5px dashed var(--hm-border)",
                      color: "var(--hm-fg-muted)",
                    }}
                  >
                    <Camera size={18} className="transition-transform group-hover:scale-110" />
                    <span className="text-[10.5px] font-medium">
                      {uploading ? "..." : t("dispute.addPhoto")}
                    </span>
                  </button>
                )}
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--hm-text-tertiary)" }}
              >
                {t("dispute.evidenceHint")}
              </p>
            </div>

            {error && <Alert variant="error">{error}</Alert>}
          </div>
        </ModalBody>
        <ModalFooter>
          {/* Mobile-stack so both buttons stay above iOS HIG 44px
              comfort target at narrow widths. Primary above secondary
              on mobile (column-reverse), conventional order on sm+. */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting || description.trim().length < 10}
              loading={submitting}
              className="w-full sm:w-auto"
            >
              {t("dispute.submit")}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

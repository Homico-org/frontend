"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type Unit =
  | "fixed"
  | "hourly"
  | "per_sqm"
  | "per_item"
  | "per_day"
  | "per_visit"
  | "byAgreement";

interface RequestCustomServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill the service name field (useful when triggered from a failed
   *  AI search - we know what the pro was looking for). */
  initialName?: string;
  /** Fired with the created suggestion id on success. */
  onSubmitted?: (suggestionId: string) => void;
}

interface UploadResponse {
  url?: string;
  path?: string;
}

const UNITS: Unit[] = [
  "fixed",
  "hourly",
  "per_sqm",
  "per_item",
  "per_day",
  "per_visit",
  "byAgreement",
];

/**
 * Modal for pros to suggest a missing service. Identity (name + phone +
 * UID) is auto-attached server-side from the JWT - the form intentionally
 * doesn't ask for it again.
 *
 * Fields:
 *   - serviceName (required, 2-120 chars)
 *   - description (required, 5-1000 chars)
 *   - suggestedCategoryKey (optional dropdown of existing top-level categories)
 *   - suggestedPrice + suggestedUnit (optional, paired)
 *   - photo (optional, uses POST /upload, max 1)
 *
 * Closes + toasts on success. Server validation errors surface inline
 * with the field-error banner.
 */
export default function RequestCustomServiceModal({
  isOpen,
  onClose,
  initialName = "",
  onSubmitted,
}: RequestCustomServiceModalProps) {
  const { t, pick } = useLanguage();
  const toast = useToast();
  const { categories } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceName, setServiceName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<Unit>("fixed");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on a fresh open (initialName may have changed).
  const reset = useCallback(() => {
    setServiceName(initialName);
    setDescription("");
    setCategoryKey("");
    setPrice("");
    setUnit("fixed");
    setPhotoUrl(null);
    setError(null);
    setSubmitting(false);
    setUploading(false);
  }, [initialName]);

  const handleClose = useCallback(() => {
    if (submitting || uploading) return;
    reset();
    onClose();
  }, [submitting, uploading, reset, onClose]);

  const handleUpload = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post<UploadResponse>("/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = data.url ?? data.path;
        if (url) setPhotoUrl(url);
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
    [toast, t],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (serviceName.trim().length < 2) {
        setError(t("catalogRequest.nameTooShort"));
        return;
      }
      if (description.trim().length < 5) {
        setError(t("catalogRequest.descriptionTooShort"));
        return;
      }
      const priceNum = price.trim() ? parseFloat(price) : undefined;
      if (priceNum !== undefined && (Number.isNaN(priceNum) || priceNum < 0)) {
        setError(t("catalogRequest.priceInvalid"));
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        const payload = {
          serviceName: serviceName.trim(),
          description: description.trim(),
          suggestedCategoryKey: categoryKey || undefined,
          suggestedPrice: priceNum,
          suggestedUnit: priceNum !== undefined ? unit : undefined,
          photoUrl: photoUrl ?? undefined,
          // Locale stored so admin reviewers see context (was the pro on
          // /ka/services when they reported the missing service?).
          locale: typeof window !== "undefined" ? navigator.language.slice(0, 2) : undefined,
        };
        const { data } = await api.post<{ id: string; status: string }>(
          "/catalog-suggestions",
          payload,
        );
        toast.success(t("catalogRequest.successToast"));
        onSubmitted?.(data.id);
        reset();
        onClose();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string | string[] } } })
            ?.response?.data?.message;
        const display = Array.isArray(msg)
          ? msg.join(", ")
          : msg || t("common.error");
        setError(display);
        toast.error(display);
      } finally {
        setSubmitting(false);
      }
    },
    [
      serviceName,
      description,
      price,
      categoryKey,
      unit,
      photoUrl,
      toast,
      t,
      onSubmitted,
      reset,
      onClose,
    ],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton
      preventClose={submitting}
      ariaLabel={t("catalogRequest.title")}
    >
      <ModalHeader
        title={t("catalogRequest.title")}
        description={t("catalogRequest.subtitle")}
      />
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <Alert variant="info">{t("catalogRequest.explainer")}</Alert>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("catalogRequest.nameLabel")} *
              </label>
              <Input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder={t("catalogRequest.namePlaceholder")}
                required
                autoFocus
                maxLength={120}
                disabled={submitting}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("catalogRequest.descriptionLabel")} *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("catalogRequest.descriptionPlaceholder")}
                required
                rows={3}
                maxLength={1000}
                disabled={submitting}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("catalogRequest.categoryLabel")}
              </label>
              <select
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--hm-bg-elevated)",
                  border: "1px solid var(--hm-border-subtle)",
                  color: "var(--hm-text-primary)",
                }}
              >
                <option value="">{t("catalogRequest.categoryPlaceholder")}</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {pick({ en: c.name, ka: c.nameKa })}
                  </option>
                ))}
              </select>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--hm-text-tertiary)" }}
              >
                {t("catalogRequest.categoryHint")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--hm-text-secondary)" }}
                >
                  {t("catalogRequest.priceLabel")}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50"
                  disabled={submitting}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--hm-text-secondary)" }}
                >
                  {t("catalogRequest.unitLabel")}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Unit)}
                  disabled={submitting || !price}
                  className="w-full rounded-lg px-3 py-2 text-sm disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--hm-bg-elevated)",
                    border: "1px solid var(--hm-border-subtle)",
                    color: "var(--hm-text-primary)",
                  }}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t(`catalogRequest.unit.${u}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("catalogRequest.photoLabel")}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                className="hidden"
                disabled={submitting || uploading}
              />
              {photoUrl ? (
                <div
                  className="relative w-24 h-24 rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--hm-border-subtle)" }}
                >
                  <Image
                    src={photoUrl}
                    alt="suggested service"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    disabled={submitting}
                    className="absolute top-1 right-1 rounded-full p-0.5"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                    aria-label={t("common.delete")}
                  >
                    <X size={12} color="white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting || uploading}
                  className="w-24 h-24 rounded-lg flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--hm-bg-elevated)",
                    border: "1px dashed var(--hm-border-subtle)",
                    color: "var(--hm-text-secondary)",
                  }}
                >
                  <Camera size={18} />
                  <span className="text-xs">
                    {uploading ? "..." : t("catalogRequest.addPhoto")}
                  </span>
                </button>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--hm-text-tertiary)" }}
              >
                {t("catalogRequest.photoHint")}
              </p>
            </div>

            {error && <Alert variant="error">{error}</Alert>}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={submitting}
              loading={submitting}
            >
              {t("catalogRequest.submit")}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

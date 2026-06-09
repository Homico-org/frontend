"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { useCallback, useState } from "react";

type AdminRole = "client" | "pro" | "admin";

interface CreatedUser {
  id: string;
  uid: number;
  role: AdminRole;
  email?: string;
  phone?: string;
  name?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fired with the new user when creation succeeds. Page should refresh its list. */
  onCreated?: (user: CreatedUser) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: AdminRole;
  city: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "client",
  city: "",
};

/**
 * Admin-only modal: create a user with explicit role (including admin).
 *
 * Validates locally before hitting the API:
 *  - name required
 *  - either email or phone required
 *  - password >= 8 chars
 *  - phone (if provided) must look like E.164 (+digits, 8-15)
 *
 * Server enforces the same rules and adds uniqueness checks - we surface
 * server errors in the toast verbatim so the admin sees real conflicts
 * (e.g. "phone already exists").
 */
export default function CreateUserModal({
  isOpen,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setError(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return; // ignore close while submitting
    reset();
    onClose();
  }, [submitting, reset, onClose]);

  const validate = useCallback((): string | null => {
    if (!form.name.trim()) return t("admin.createUserNameRequired");
    if (!form.email.trim() && !form.phone.trim()) {
      return t("admin.createUserNeedContact");
    }
    if (form.password.length < 8) return t("admin.createUserPasswordTooShort");
    if (form.phone.trim()) {
      const cleaned = form.phone.replace(/[\s-]/g, "");
      if (!/^\+?\d{8,15}$/.test(cleaned)) {
        return t("admin.createUserPhoneInvalid");
      }
    }
    return null;
  }, [form, t]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const localError = validate();
      if (localError) {
        setError(localError);
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.replace(/[\s-]/g, "") || undefined,
          password: form.password,
          role: form.role,
          city: form.city.trim() || undefined,
        };
        const { data } = await api.post<CreatedUser>("/admin/users", payload);
        toast.success(t("admin.createUserSuccess"));
        onCreated?.(data);
        reset();
        onClose();
      } catch (err) {
        // Surface the server message when available (e.g. ConflictException).
        const serverMessage =
          (err as { response?: { data?: { message?: string | string[] } } })
            ?.response?.data?.message;
        const display = Array.isArray(serverMessage)
          ? serverMessage.join(", ")
          : serverMessage || t("admin.createUserFailed");
        setError(display);
        toast.error(display);
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate, toast, t, onCreated, onClose, reset],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton
      preventClose={submitting}
      ariaLabel={t("admin.createUserTitle")}
    >
      <ModalHeader
        title={t("admin.createUserTitle")}
        description={t("admin.createUserSubtitle")}
      />
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <FieldRow label={t("admin.createUserName") + " *"}>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("admin.createUserNamePlaceholder")}
                autoFocus
                required
                disabled={submitting}
              />
            </FieldRow>

            <FieldRow label={t("admin.createUserEmail")}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="user@example.com"
                disabled={submitting}
                autoComplete="off"
              />
            </FieldRow>

            <FieldRow label={t("admin.createUserPhone")}>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+15551234567"
                disabled={submitting}
                autoComplete="off"
              />
              <Hint>{t("admin.createUserPhoneHint")}</Hint>
            </FieldRow>

            <FieldRow label={t("admin.createUserPassword") + " *"}>
              <PasswordInput
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder={t("admin.createUserPasswordPlaceholder")}
                required
                disabled={submitting}
                autoComplete="new-password"
              />
              <Hint>{t("admin.createUserPasswordHint")}</Hint>
            </FieldRow>

            <FieldRow label={t("admin.createUserRole") + " *"}>
              <div className="grid grid-cols-3 gap-2">
                {(["client", "pro", "admin"] as const).map((role) => (
                  <RolePill
                    key={role}
                    role={role}
                    selected={form.role === role}
                    onSelect={() => updateField("role", role)}
                    label={t(
                      role === "client"
                        ? "admin.createUserRoleClient"
                        : role === "pro"
                          ? "admin.createUserRolePro"
                          : "admin.createUserRoleAdmin",
                    )}
                    disabled={submitting}
                  />
                ))}
              </div>
            </FieldRow>

            <FieldRow label={t("admin.createUserCity")}>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="city"
                disabled={submitting}
              />
            </FieldRow>

            {error && (
              <p
                role="alert"
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  color: "rgb(220, 38, 38)",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="default" loading={submitting} disabled={submitting}>
              {t("admin.createUserSubmit")}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ color: "var(--hm-text-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mt-1" style={{ color: "var(--hm-text-tertiary)" }}>
      {children}
    </p>
  );
}

function RolePill({
  role,
  label,
  selected,
  onSelect,
  disabled,
}: {
  role: AdminRole;
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const accent =
    role === "admin"
      ? "#A855F7"
      : role === "pro"
        ? "#EF4E24"
        : "#3B82F6";
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      style={{
        backgroundColor: selected ? `${accent}1A` : "var(--hm-bg-elevated)",
        border: `1px solid ${selected ? accent : "var(--hm-border-subtle)"}`,
        color: selected ? accent : "var(--hm-text-primary)",
      }}
    >
      {label}
    </button>
  );
}

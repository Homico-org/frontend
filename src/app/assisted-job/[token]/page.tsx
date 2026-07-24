"use client";

import { Button } from "@/components/ui/button";
import { FormGroup, Input, Textarea } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface AssistedPreview {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  category: string;
  subcategory?: string;
  services: { name?: string; nameKa?: string; nameRu?: string }[];
  propertyType?: string;
  description?: string;
  areaSize?: string;
  timing?: string;
  budgetType?: string;
  budgetMin?: string;
  budgetMax?: string;
  location?: string;
  images: string[];
  videos: string[];
  existingUser: boolean;
  hasPassword: boolean;
}

export default function AssistedJobClientPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();
  const { locale } = useLanguage();
  const lang = (["en", "ka", "ru"].includes(locale) ? locale : "en") as
    | "en"
    | "ka"
    | "ru";

  const [preview, setPreview] = useState<AssistedPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable + auth fields
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    api
      .get(`/assisted-jobs/${token}`)
      .then((res) => {
        if (!alive) return;
        const p = res.data as AssistedPreview;
        setPreview(p);
        setDescription(p.description ?? "");
        setAreaSize(p.areaSize ?? "");
        setBudgetMin(p.budgetMin ?? "");
        setBudgetMax(p.budgetMax ?? "");
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(
          err?.response?.data?.message || "This link is no longer valid.",
        );
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const serviceLabel = useCallback(
    (s: { name?: string; nameKa?: string; nameRu?: string }) =>
      (lang === "ka" ? s.nameKa : lang === "ru" ? s.nameRu : s.name) || s.name,
    [lang],
  );

  const handleApprove = async () => {
    if (submitting || !preview) return;
    if (!consent) {
      toast.warning("Please confirm the details to continue.");
      return;
    }
    const needsPassword = !preview.existingUser || preview.hasPassword;
    if (needsPassword && password.trim().length < 6) {
      toast.warning("Your password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/assisted-jobs/${token}/approve`, {
        consent: true,
        password: password.trim() || undefined,
        description: description.trim(),
        areaSize: areaSize.trim() || undefined,
        budgetMin: budgetMin.trim() || undefined,
        budgetMax: budgetMax.trim() || undefined,
      });
      const { access_token, refresh_token, user, redirectPath } = res.data;
      if (access_token && user) {
        login(access_token, user, refresh_token);
      }
      toast.success("Your request is live!");
      router.push(redirectPath || "/ge/jobs");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Couldn't submit. Please try again.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hm-bg-page)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hm-brand-500)]" />
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--hm-bg-page)] px-5">
        <div className="max-w-md rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hm-bg-tertiary)]">
            <Lock className="h-6 w-6 text-[var(--hm-fg-muted)]" />
          </div>
          <h1 className="text-[18px] font-semibold text-[var(--hm-fg-primary)]">
            Link unavailable
          </h1>
          <p className="mt-2 text-[14px] text-[var(--hm-fg-secondary)]">
            {loadError}
          </p>
        </div>
      </div>
    );
  }

  const needsPassword = !preview.existingUser || preview.hasPassword;
  const serviceNames = preview.services.map(serviceLabel).filter(Boolean);
  const budgetLabel =
    preview.budgetType === "negotiable" || (!budgetMin && !budgetMax)
      ? "Negotiable"
      : `${budgetMin || "?"}${budgetMax ? ` – ${budgetMax}` : ""} ₾`;

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <div className="mx-auto max-w-xl px-5 py-8">
        <h1 className="flex items-center gap-2 text-[22px] font-semibold text-[var(--hm-fg-primary)]">
          <Sparkles className="h-5 w-5 text-[var(--hm-brand-500)]" />
          Review your request
        </h1>
        <p className="mt-1 text-[14px] text-[var(--hm-fg-secondary)]">
          Hi {preview.clientName} — we prepared this for you. Check the details,
          adjust anything, and confirm to go live.
        </p>

        {/* Recap */}
        <div className="mt-5 space-y-3 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5">
          <Row label="Service" value={serviceNames.join(", ") || preview.category} />
          {preview.location && (
            <Row
              label="Location"
              value={
                <span className="inline-flex items-start gap-1">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--hm-fg-muted)]" />
                  {preview.location}
                </span>
              }
            />
          )}
          <Row label="Budget" value={budgetLabel} />
          {preview.images.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {preview.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Editable */}
        <div className="mt-4 space-y-4 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5">
          <p className="text-[13px] font-medium text-[var(--hm-fg-muted)]">
            Adjust if needed
          </p>
          <FormGroup label="Description" optional>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add anything we should know…"
              minRows={2}
              autoResize
            />
          </FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Area" optional>
              <Input
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                rightIcon={<span className="text-[13px]">m²</span>}
              />
            </FormGroup>
            <FormGroup label="Budget (₾)" optional>
              <div className="flex items-center gap-2">
                <Input
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="min"
                  inputMode="numeric"
                />
                <span className="text-[var(--hm-fg-muted)]">–</span>
                <Input
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="max"
                  inputMode="numeric"
                />
              </div>
            </FormGroup>
          </div>
        </div>

        {/* Account + approve */}
        <div className="mt-4 space-y-4 rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5">
          <div className="flex items-center gap-2 rounded-xl bg-[var(--hm-bg-tertiary)] px-3 py-2.5">
            <Phone className="h-4 w-4 text-[var(--hm-fg-muted)]" />
            <span className="text-[14px] text-[var(--hm-fg-primary)]">
              {preview.clientPhone}
            </span>
          </div>
          {needsPassword ? (
            <FormGroup
              label={
                preview.existingUser ? "Your password" : "Create a password"
              }
              required
              hint={
                preview.existingUser
                  ? "Sign in to your existing account."
                  : "You'll use this + your phone number to sign in later."
              }
            >
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </FormGroup>
          ) : (
            <p className="rounded-xl bg-[var(--hm-bg-tertiary)] px-3 py-2.5 text-[13px] text-[var(--hm-fg-secondary)]">
              This link signs you in — no password needed. You can set one later
              in your account.
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--hm-brand-500)]"
            />
            <span className="text-[13px] text-[var(--hm-fg-secondary)]">
              I confirm these details are correct and I accept the Terms.
            </span>
          </label>

          <Button
            className="w-full"
            size="lg"
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            onClick={handleApprove}
            loading={submitting}
            disabled={
              !consent || (needsPassword && password.trim().length < 6)
            }
          >
            Approve & create my request
          </Button>
          <p className="flex items-center justify-center gap-1 text-[12px] text-[var(--hm-fg-muted)]">
            <ImageIcon className="h-3.5 w-3.5" />
            Pros will be able to send you offers once it&apos;s live.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-20 shrink-0 text-[13px] font-medium text-[var(--hm-fg-muted)]">
        {label}
      </span>
      <span className="flex-1 text-[14px] text-[var(--hm-fg-primary)]">
        {value}
      </span>
    </div>
  );
}

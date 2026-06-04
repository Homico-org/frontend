"use client";

import AuthGuard from "@/components/common/AuthGuard";
import BackButton from "@/components/common/BackButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { BadgeCheck, Landmark, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface BankAccount {
  bankCode: string;
  accountNumber: string;
  holderName: string;
  verifiedAt?: string;
}

interface PayoutAccountResponse {
  bankAccount: BankAccount | null;
  name: string;
}

interface PendingPayoutSummary {
  count: number;
  totalPayoutMinor: number;
  currency: string;
  oldestEscrowAt: string | null;
}

/**
 * Pro-side page for setting the bank account where Homico pays out escrow
 * money. Distinct from any client-side payment methods.
 *
 * Local validation:
 *   - bankCode required (we offer a curated list of the main GE banks)
 *   - accountNumber: any non-empty string for v1 (no IBAN format check
 *     yet because Georgia uses GE-prefixed IBANs alongside legacy formats
 *     and we'd rather accept too much than reject valid input).
 *   - holderName required, default-filled from user.name
 *
 * Admin verification: after the pro saves, an admin reviews and sets
 * verifiedAt via a separate flow (Phase 1: manual; Phase 3: automated
 * via BoG's name-match API). Unverified accounts can still receive
 * payouts in Phase 1 because the admin is in the loop on every batch.
 */

// Hardcoded list of the major Georgian banks. SWIFT codes from official
// directory. Order: most-used first.
const GEORGIAN_BANKS = [
  { code: "BAGAGE22", label: "Bank of Georgia" },
  { code: "TBCBGE22", label: "TBC Bank" },
  { code: "LBRTGE22", label: "Liberty Bank" },
  { code: "BCTRGE22", label: "Cartu Bank" },
  { code: "BSCGGE22", label: "Basisbank" },
  { code: "CRCEGE22", label: "Credo Bank" },
  { code: "BCYBGE22", label: "Bank Crypto" },
  { code: "VTBVGE22", label: "VTB Bank Georgia" },
];

export default function PayoutsSettingsPage() {
  const { t } = useLanguage();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [defaultName, setDefaultName] = useState("");
  // Pending escrow summary - drives the "you have X waiting" nudge banner.
  // Silent escrows are a UX dead-end: a pro who hasn't set their bank
  // account up has no reason to think "let me check my payouts settings"
  // unless we tell them money is sitting there for them.
  const [pendingSummary, setPendingSummary] = useState<PendingPayoutSummary | null>(null);

  // Form state
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // Bank-account + pending-summary read in parallel. The summary
      // never blocks the form - if it 404s on a non-pro role or fails,
      // the page still works, we just skip the banner.
      const [accountRes, summaryRes] = await Promise.allSettled([
        api.get<PayoutAccountResponse>("/users/me/payout-account"),
        api.get<PendingPayoutSummary>("/payments/me/pending-payout-summary"),
      ]);

      if (accountRes.status === "fulfilled") {
        const data = accountRes.value.data;
        setAccount(data.bankAccount);
        setDefaultName(data.name ?? "");
        if (data.bankAccount) {
          setBankCode(data.bankAccount.bankCode);
          setAccountNumber(data.bankAccount.accountNumber);
          setHolderName(data.bankAccount.holderName);
        } else {
          // Pre-fill holder name from the user's profile so common case
          // is one less field to type.
          setHolderName(data.name ?? "");
        }
      }
      if (summaryRes.status === "fulfilled") {
        setPendingSummary(summaryRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load payout account:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(async () => {
    if (!bankCode) {
      setError(t("payoutSettings.bankRequired"));
      return;
    }
    if (accountNumber.trim().length < 5) {
      setError(t("payoutSettings.accountInvalid"));
      return;
    }
    if (holderName.trim().length < 2) {
      setError(t("payoutSettings.holderRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.put<{ bankAccount: BankAccount }>(
        "/users/me/payout-account",
        {
          bankCode,
          accountNumber: accountNumber.trim(),
          holderName: holderName.trim(),
        },
      );
      setAccount(data.bankAccount);
      toast.success(t("payoutSettings.savedToast"));
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? t("common.error");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [bankCode, accountNumber, holderName, toast, t]);

  const isVerified = !!account?.verifiedAt;
  // Banner condition: pro has money sitting in pending_release but hasn't
  // set up a bank account. This is the silent dead-end the admin payout
  // gap creates - the admin can't process them, the pro doesn't know
  // why. The banner closes the loop.
  const showMissingBankNudge =
    !account && (pendingSummary?.count ?? 0) > 0;
  const totalPendingGel = (pendingSummary?.totalPayoutMinor ?? 0) / 100;

  return (
    <AuthGuard allowedRoles={["pro"]}>
      <div
        className="min-h-screen px-4 py-6 sm:px-6 sm:py-8"
        style={{ backgroundColor: "var(--hm-bg-page)" }}
      >
        <div className="max-w-xl mx-auto">
          {/* Breadcrumb trail. Deep-linked users (e.g. from a Cmd+K
              jump or a saved bookmark) need to know where they are
              in the settings hierarchy. The back arrow alone doesn't
              communicate the parent location. */}
          <nav aria-label={t("common.breadcrumb")} className="mb-4 flex items-center gap-1.5 text-xs text-[var(--hm-fg-muted)]">
            <Link
              href="/settings"
              className="hover:text-[var(--hm-brand-500)] transition-colors"
            >
              {t("common.settings")}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[var(--hm-fg-secondary)] font-medium">
              {t("payoutSettings.title")}
            </span>
          </nav>

          <BackButton href="/settings" variant="minimal" label={t("nav.back")} className="mb-4" />

          <div className="flex items-start gap-3 mb-6">
            <div
              className="rounded-xl p-2.5 flex-shrink-0"
              style={{ backgroundColor: "rgba(59, 130, 246, 0.12)" }}
            >
              <Landmark size={22} color="#3B82F6" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--hm-text-primary)" }}
              >
                {t("payoutSettings.title")}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--hm-text-secondary)" }}
              >
                {t("payoutSettings.subtitle")}
              </p>
            </div>
          </div>

          {/* Pending-payout nudge banner. Renders only when the pro has
              escrows already paid into Homico but no bank account on
              file. Tone is opportunity-framed ("you have X waiting"),
              not scolding ("you need to do this") - the action is the
              same form below either way. */}
          {showMissingBankNudge && (
            <Alert
              variant="warning"
              size="md"
              icon={<ShieldAlert />}
              className="mb-4"
            >
              <div>
                <p className="font-semibold mb-0.5">
                  {t("payoutSettings.pendingNudgeTitle", {
                    amount: totalPendingGel.toFixed(2),
                    count: pendingSummary!.count,
                  })}
                </p>
                <p className="text-xs">
                  {t("payoutSettings.pendingNudgeBody")}
                </p>
              </div>
            </Alert>
          )}

          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("payoutSettings.formTitle")}</CardTitle>
                {account && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: isVerified
                        ? "rgba(22, 163, 74, 0.12)"
                        : "rgba(217, 119, 6, 0.12)",
                      color: isVerified
                        ? "rgb(22, 163, 74)"
                        : "rgb(180, 83, 9)",
                    }}
                  >
                    {isVerified ? <BadgeCheck size={12} /> : <ShieldAlert size={12} />}
                    {isVerified
                      ? t("payoutSettings.verified")
                      : t("payoutSettings.pendingVerification")}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="info">
                    {t("payoutSettings.explainer")}
                  </Alert>

                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                      style={{ color: "var(--hm-text-secondary)" }}
                    >
                      {t("payoutSettings.bankLabel")} *
                    </label>
                    <select
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      disabled={saving}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{
                        backgroundColor: "var(--hm-bg-elevated)",
                        border: "1px solid var(--hm-border-subtle)",
                        color: "var(--hm-text-primary)",
                      }}
                    >
                      <option value="">{t("payoutSettings.bankPlaceholder")}</option>
                      {GEORGIAN_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                      style={{ color: "var(--hm-text-secondary)" }}
                    >
                      {t("payoutSettings.accountLabel")} *
                    </label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="GE12 BG00 0000 0000 0000 00"
                      disabled={saving}
                      autoComplete="off"
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--hm-text-tertiary)" }}
                    >
                      {t("payoutSettings.accountHint")}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
                      style={{ color: "var(--hm-text-secondary)" }}
                    >
                      {t("payoutSettings.holderLabel")} *
                    </label>
                    <Input
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder={defaultName}
                      disabled={saving}
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--hm-text-tertiary)" }}
                    >
                      {t("payoutSettings.holderHint")}
                    </p>
                  </div>

                  {error && <Alert variant="error">{error}</Alert>}

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                  >
                    {account ? t("payoutSettings.update") : t("payoutSettings.save")}
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

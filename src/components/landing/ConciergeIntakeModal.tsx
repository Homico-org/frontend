"use client";

import CategoryIcon from "@/components/categories/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/Modal";
import { PhoneInput, type CountryCode } from "@/components/ui/PhoneInput";
import {
  SelectionGroup,
  type SelectionOption,
} from "@/components/ui/SelectionGroup";
import { useCategories } from "@/contexts/CategoriesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

type Step = 1 | 2 | 3 | "success";
type Timing = "asap" | "this_week" | "flexible";

// PhoneInput gives us a digits-only string. The original validation
// here pinned to Georgian mobile numbers (9 digits starting with 5);
// after the multi-country migration we accept any reasonable E.164
// local-number length (7-15 digits) and just reject dummy all-same-
// digit sequences. The backend SMS provider performs the authoritative
// validation per country.
function isValidPhone(digits: string): boolean {
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

interface ConciergeIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select a category and start on step 2. Used by landing category tiles. */
  initialCategory?: string;
}

export default function ConciergeIntakeModal({
  isOpen,
  onClose,
  initialCategory,
}: ConciergeIntakeModalProps): React.ReactElement | null {
  const { t, locale, pick, country } = useLanguage();
  const { categories } = useCategories();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [timing, setTiming] = useState<Timing>("flexible");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset(): void {
    setStep(1);
    setCategory("");
    setDescription("");
    setAddress("");
    setTiming("flexible");
    setName("");
    setPhone("");
    setEmail("");
    setIsSubmitting(false);
  }

  function handleClose(): void {
    onClose();
    setTimeout(reset, 300);
  }

  // When opened with a pre-selected category (from a landing tile), skip
  // step 1 entirely and land on "tell us what you need".
  useEffect(() => {
    if (isOpen && initialCategory) {
      setCategory(initialCategory);
      setStep(2);
    }
  }, [isOpen, initialCategory]);

  const timingOptions: SelectionOption<Timing>[] = [
    {
      value: "asap",
      label: t("concierge.timingAsap"),
      labelKa: t("concierge.timingAsap"),
      icon: <Zap className="w-4 h-4" />,
    },
    {
      value: "this_week",
      label: t("concierge.timingThisWeek"),
      labelKa: t("concierge.timingThisWeek"),
      icon: <Clock className="w-4 h-4" />,
    },
    {
      value: "flexible",
      label: t("concierge.timingFlexible"),
      labelKa: t("concierge.timingFlexible"),
      icon: <Calendar className="w-4 h-4" />,
    },
  ];

  function canProceed(): boolean {
    if (step === 1) return !!category;
    if (step === 2) {
      return (
        description.trim().length >= 5 && address.trim().length >= 3
      );
    }
    if (step === 3) {
      return (
        name.trim().length >= 2 &&
        isValidPhone(phone.replace(/\D/g, ""))
      );
    }
    return false;
  }

  async function handleSubmit(): Promise<void> {
    if (!canProceed() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post("/service-requests", {
        category,
        description: description.trim(),
        address: address.trim(),
        timing,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        locale,
      });
      setStep("success");
    } catch {
      toast.error(t("concierge.submitError"));
      setIsSubmitting(false);
    }
  }

  function handleNext(): void {
    if (!canProceed()) return;
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) void handleSubmit();
  }

  function handleBack(): void {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      showCloseButton
      preventClose={isSubmitting}
    >
      {step === "success" ? (
        <>
          <ModalHeader
            icon={
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--hm-success-500) 30%, transparent)",
                  }}
                />
                <CheckCircle2 className="relative w-6 h-6" />
              </div>
            }
            variant="success"
            title={t("concierge.successTitle")}
            description={t("concierge.successDescription")}
          />
          <ModalBody>
            <p className="text-[14px] sm:text-[15px] text-[var(--hm-fg-secondary)] leading-relaxed">
              {t("concierge.successBody")}
            </p>
            <div className="mt-5 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--hm-brand-500)]/[0.06] text-[13px] text-[var(--hm-fg-primary)]">
              <Clock className="w-4 h-4 text-[var(--hm-brand-500)] shrink-0" />
              <span className="font-medium">{t("concierge.successEta")}</span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleClose} className="w-full">
              {t("common.close")}
            </Button>
          </ModalFooter>
        </>
      ) : (
        <>
          <div className="px-6 sm:px-8 pt-6 sm:pt-7">
            <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-[var(--hm-fg-primary)] leading-tight">
              {t("concierge.modalTitle")}
            </h2>
            {/* Progress indicator - 3 even segments, only color changes by state */}
            <div
              className="mt-4 flex items-center gap-2"
              role="progressbar"
              aria-valuenow={typeof step === "number" ? step : 3}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`${t("concierge.step")} ${step} / 3`}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      n <= (step as number)
                        ? "var(--hm-brand-500)"
                        : "var(--hm-border)",
                  }}
                />
              ))}
              <span className="ml-2 text-[12px] font-medium text-[var(--hm-fg-muted)] tabular-nums whitespace-nowrap">
                {step} / 3
              </span>
            </div>
          </div>

          <ModalBody>
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-[15px] sm:text-[16px] font-medium text-[var(--hm-fg-primary)]">
                  {t("concierge.q1")}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {categories.map((cat) => {
                    const active = category === cat.key;
                    const accent = cat.color || "var(--hm-brand-500)";
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setCategory(cat.key);
                          setStep(2);
                        }}
                        className="group relative flex flex-col items-center justify-start gap-2.5 p-3 sm:p-3.5 rounded-xl border text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                        style={{
                          borderColor: active
                            ? accent
                            : "var(--hm-border-subtle)",
                          backgroundColor: active
                            ? `${accent}10`
                            : "var(--hm-bg-elevated)",
                        }}
                      >
                        <span
                          className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 group-hover:scale-105"
                          style={{
                            backgroundColor: active ? accent : `${accent}14`,
                            color: active ? "white" : accent,
                          }}
                        >
                          <CategoryIcon
                            type={cat.icon || cat.key}
                            className="w-5 h-5 sm:w-6 sm:h-6"
                          />
                        </span>
                        <span
                          className="text-[11.5px] sm:text-[12px] font-semibold leading-tight line-clamp-2"
                          style={{
                            color: active
                              ? accent
                              : "var(--hm-fg-primary)",
                          }}
                        >
                          {pick({ en: cat.name, ka: cat.nameKa })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {(() => {
                  const cat = categories.find((c) => c.key === category);
                  if (!cat) return null;
                  const accent = cat.color || "var(--hm-brand-500)";
                  return (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors hover:bg-[var(--hm-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                      style={{
                        borderColor: `${accent}40`,
                        color: accent,
                        backgroundColor: `${accent}10`,
                      }}
                      aria-label={`${t("common.back")} - ${pick({ en: cat.name, ka: cat.nameKa })}`}
                    >
                      <CategoryIcon
                        type={cat.icon || cat.key}
                        className="w-3.5 h-3.5"
                      />
                      <span>{pick({ en: cat.name, ka: cat.nameKa })}</span>
                      <ArrowLeft className="w-3 h-3 opacity-60" />
                    </button>
                  );
                })()}
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("concierge.q2Description")}
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("concierge.q2Placeholder")}
                    rows={4}
                    autoFocus
                  />
                  <p className="text-[11px] text-[var(--hm-fg-muted)] mt-1">
                    {t("concierge.q2Hint")}
                  </p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("concierge.q2Address")}
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("concierge.q2AddressPlaceholder")}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                  <p className="text-[11px] text-[var(--hm-fg-muted)] mt-1">
                    {t("concierge.q2AddressHint")}
                  </p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("concierge.q2Timing")}
                  </label>
                  <SelectionGroup
                    options={timingOptions}
                    value={timing}
                    onChange={(v) => setTiming(v)}
                    layout="vertical"
                    size="sm"
                    locale={locale as "en" | "ka" | "ru"}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                {(() => {
                  const cat = categories.find((c) => c.key === category);
                  if (!cat) return null;
                  const accent = cat.color || "var(--hm-brand-500)";
                  return (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors hover:bg-[var(--hm-bg-tertiary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                      style={{
                        borderColor: `${accent}40`,
                        color: accent,
                        backgroundColor: `${accent}10`,
                      }}
                      aria-label={`${t("common.back")} - ${pick({ en: cat.name, ka: cat.nameKa })}`}
                    >
                      <CategoryIcon
                        type={cat.icon || cat.key}
                        className="w-3.5 h-3.5"
                      />
                      <span>{pick({ en: cat.name, ka: cat.nameKa })}</span>
                    </button>
                  );
                })()}
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("common.firstName")}
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("common.firstName")}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("register.phoneNumber")}
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(v) => setPhone(v)}
                    country={country as CountryCode}
                    error={
                      phone.length > 0 &&
                      !isValidPhone(phone.replace(/\D/g, ""))
                        ? t("concierge.phoneInvalid")
                        : undefined
                    }
                    hint={t("concierge.phoneHint")}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--hm-fg-primary)] mb-1.5">
                    {t("concierge.q3Email")}{" "}
                    <span className="text-[var(--hm-fg-muted)] font-normal">
                      ({t("common.optional")})
                    </span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("concierge.q3EmailPlaceholder")}
                  />
                </div>
                <p className="text-[11px] text-[var(--hm-fg-muted)]">
                  {t("concierge.q3Consent")}
                </p>
              </div>
            )}
          </ModalBody>
          {step !== 1 && (
            <ModalFooter>
              <div className="flex items-center gap-2 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t("common.back")}
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : step === 3 ? (
                    <>
                      {t("concierge.submit")}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      {t("common.continue")}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </ModalFooter>
          )}
        </>
      )}
    </Modal>
  );
}

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
import { PhoneInput } from "@/components/ui/PhoneInput";
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
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

type Step = 1 | 2 | 3 | "success";
type Timing = "asap" | "this_week" | "flexible";

// PhoneInput gives us a digits-only string. Georgian mobile numbers are
// 9 digits starting with 5 (e.g. 577000000). Reject dummy sequences like
// 000000000 / 555555555 (all-same-digit) and wrong lengths.
function isValidGeorgianMobile(digits: string): boolean {
  if (digits.length !== 9) return false;
  if (!digits.startsWith("5")) return false;
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
  const { t, locale, pick } = useLanguage();
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
      icon: <Sparkles className="w-4 h-4" />,
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
        isValidGeorgianMobile(phone.replace(/\D/g, ""))
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
      size="md"
      showCloseButton
      preventClose={isSubmitting}
    >
      {step === "success" ? (
        <>
          <ModalHeader
            icon={<CheckCircle2 className="w-6 h-6" />}
            variant="success"
            title={t("concierge.successTitle")}
            description={t("concierge.successDescription")}
          />
          <ModalBody>
            <p className="text-sm text-[var(--hm-fg-secondary)] leading-relaxed">
              {t("concierge.successBody")}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--hm-fg-muted)]">
              <Clock className="w-3.5 h-3.5 text-[var(--hm-brand-500)]" />
              <span>{t("concierge.successEta")}</span>
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
            <h2 className="text-2xl sm:text-[28px] font-serif font-medium text-[var(--hm-fg-primary)] tracking-tight">
              {t("concierge.modalTitle")}
            </h2>
            {/* Progress dots — no more "Step X / 3" text */}
            <div
              className="mt-3 flex items-center gap-1.5"
              aria-label={`${t("concierge.step")} ${step} / 3`}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: n === step ? 28 : 8,
                    backgroundColor:
                      n === step
                        ? "var(--hm-brand-500)"
                        : n < (step as number)
                          ? "color-mix(in srgb, var(--hm-brand-500) 40%, transparent)"
                          : "var(--hm-border)",
                  }}
                />
              ))}
            </div>
          </div>

          <ModalBody>
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-[14px] text-[var(--hm-fg-secondary)]">
                  {t("concierge.q1")}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((cat) => {
                    const active = category === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setCategory(cat.key);
                          setStep(2);
                        }}
                        className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hm-brand-500)]/40"
                        style={{
                          borderColor: active
                            ? "var(--hm-brand-500)"
                            : "var(--hm-border-subtle)",
                          backgroundColor: active
                            ? "color-mix(in srgb, var(--hm-brand-500) 8%, transparent)"
                            : "transparent",
                        }}
                      >
                        <span
                          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                          style={{
                            backgroundColor: active
                              ? "var(--hm-brand-500)"
                              : "color-mix(in srgb, var(--hm-brand-500) 8%, transparent)",
                          }}
                        >
                          <CategoryIcon
                            type={cat.icon || cat.key}
                            className={`w-5 h-5 ${
                              active
                                ? "text-white"
                                : "text-[var(--hm-brand-500)]"
                            }`}
                          />
                        </span>
                        <span
                          className="text-[12px] font-medium leading-tight"
                          style={{
                            color: active
                              ? "var(--hm-brand-500)"
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
                    country="GE"
                    error={
                      phone.length > 0 &&
                      !isValidGeorgianMobile(phone.replace(/\D/g, ""))
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

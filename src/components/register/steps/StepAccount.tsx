"use client";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { FormGroup, Input, Label } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { CountryCode, useLanguage } from "@/contexts/LanguageContext";
import { SocialIcon } from "@/components/icons";
import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";
import type {
  AuthMethod,
  FormData,
  VerificationChannel,
} from "../hooks/useRegistration";

export interface AccountStepProps {
  locale: "en" | "ka" | "ru";
  userType: "client" | "pro";
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  formData: FormData;
  handleInputChange: (field: string, value: string) => void;
  error: string;
  isLoading: boolean;

  // Password
  repeatPassword: string;
  setRepeatPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showRepeatPassword: boolean;
  setShowRepeatPassword: (show: boolean) => void;

  // Terms
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;

  // Phone & Country
  phoneCountry: CountryCode;
  setPhoneCountry: (code: CountryCode) => void;
  showCountryDropdown: boolean;
  setShowCountryDropdown: (show: boolean) => void;

  // Verification channel
  verificationChannel: VerificationChannel;
  setVerificationChannel: (channel: VerificationChannel) => void;

  // Avatar (Pro)
  avatarPreview: string | null;
  avatarUploading: boolean;
  uploadedAvatarUrl: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAvatar: () => void;

  // Navigation
  canProceed: boolean;
  onNext: () => void;
  onSwitchType: () => void;

  // UI options
  showFooter?: boolean; // Hide footer for pro registration (page has its own footer)
}

export default function StepAccount({
  locale,
  userType,
  formData,
  handleInputChange,
  error,
  isLoading,
  repeatPassword,
  setRepeatPassword,
  verificationChannel,
  setVerificationChannel,
  avatarPreview,
  avatarUploading,
  uploadedAvatarUrl,
  avatarInputRef,
  handleAvatarSelect,
  removeAvatar,
  canProceed,
  onNext,
  onSwitchType,
  showFooter = true,
  agreedToTerms,
  setAgreedToTerms,
  phoneCountry,
  setPhoneCountry,
}: AccountStepProps) {
  const { t } = useLanguage();
  const isPro = userType === "pro";

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 mb-0.5 sm:mb-1">
          {isPro
            ? t("register.professionalAccount")
            : t("register.createAccount")}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          {t("register.fillInYourBasicInformation")}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" size="sm">
          {error}
        </Alert>
      )}

      {/* Registration Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="space-y-3 sm:space-y-4"
      >
        {/* Avatar Upload for Pro */}
        {isPro && (
          <Card
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 transition-all ${
              uploadedAvatarUrl
                ? "border-emerald-500/50"
                : "border-[#C4735B] ring-4 ring-[#C4735B]/10"
            }`}
          >
            <div className="relative shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden cursor-pointer border-2 border-dashed transition-all ${
                  avatarPreview
                    ? "border-transparent"
                    : "border-[#C4735B] hover:border-[#A85D47]"
                }`}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#C4735B]/10 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-[#C4735B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="md" color="white" />
                </div>
              )}
              {avatarPreview && !avatarUploading && (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAvatar();
                  }}
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                >
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              )}
              <input
                ref={avatarInputRef as React.RefObject<HTMLInputElement>}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-xs sm:text-sm font-medium text-neutral-900">
                  {t("register.profilePhoto")}
                </h3>
                <span className="text-[9px] sm:text-[10px] text-[#C4735B] font-medium">
                  {t("common.required")}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-500">
                {t("register.uploadARealPhotoOf")}
              </p>
              {uploadedAvatarUrl && (
                <Badge variant="success" size="xs" className="mt-1">
                  {t("register.uploaded")}
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Name and Email - Stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <FormGroup>
            <Label required>{t("common.fullName")}</Label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder={t("register.giorgiBeridze")}
              required
              autoComplete="off"
              data-form-type="other"
              className="bg-white dark:bg-neutral-900 h-10 sm:h-11 text-sm"
            />
          </FormGroup>
          <FormGroup>
            <Label optional>{t("common.email")}</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="name@example.com"
              className="h-10 sm:h-11 text-sm"
            />
          </FormGroup>
        </div>

        {/* Phone section */}
        <FormGroup>
          <Label required>{t("common.phone")}</Label>

          {/* Channel toggle - Smaller on mobile */}
          <div className="flex gap-1.5 sm:gap-2 mb-2">
            <Button
              type="button"
              onClick={() => setVerificationChannel("sms")}
              variant="ghost"
              size="sm"
              className={`h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${
                verificationChannel === "sms"
                  ? "bg-[#C4735B] text-white hover:bg-[#A85D47] hover:text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
              }`}
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
              SMS
            </Button>
            <Button
              type="button"
              onClick={() => setVerificationChannel("whatsapp")}
              variant="ghost"
              size="sm"
              className={`h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm ${
                verificationChannel === "whatsapp"
                  ? "bg-[#25D366] text-white hover:bg-[#1da851] hover:text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
              }`}
            >
              <SocialIcon name="whatsapp" size="sm" className="mr-1 sm:mr-1.5" />
              WhatsApp
            </Button>
          </div>

          <PhoneInput
            value={formData.phone}
            onChange={(value) => handleInputChange("phone", value)}
            country={phoneCountry}
            onCountryChange={setPhoneCountry}
            placeholder="555 123 456"
            required
          />
        </FormGroup>

        {/* Password fields - Stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <FormGroup>
            <Label required>{t("common.password")}</Label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={t("register.min6Chars")}
              required
              minLength={6}
              className="h-10 sm:h-11"
            />
          </FormGroup>
          <FormGroup>
            <Label required>{t("register.repeatPassword")}</Label>
            <PasswordInput
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder={t("register.repeat")}
              required
              minLength={6}
              className="h-10 sm:h-11"
              error={
                repeatPassword && formData.password !== repeatPassword
                  ? t("validation.passwordsNotMatch")
                  : undefined
              }
            />
          </FormGroup>
        </div>

        {/* Terms - Better touch target */}
        <label className="flex items-start gap-2.5 sm:gap-3 cursor-pointer p-2 -mx-2 rounded-lg active:bg-neutral-50 transition-colors">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
          />
          <span className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {locale === "ka" ? (
              <>
                ვეთანხმები{" "}
                <Link
                  href="/terms"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  პირობებს
                </Link>{" "}
                და{" "}
                <Link
                  href="/privacy"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  კონფიდენციალურობას
                </Link>
              </>
            ) : locale === "ru" ? (
              <>
                Я согласен с{" "}
                <Link
                  href="/terms"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Условиями
                </Link>{" "}
                и{" "}
                <Link
                  href="/privacy"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Политикой конфиденциальности
                </Link>
              </>
            ) : (
              <>
                I agree to{" "}
                <Link
                  href="/terms"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms
                </Link>{" "}
                &{" "}
                <Link
                  href="/privacy"
                  className="text-[#C4735B] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy
                </Link>
              </>
            )}
          </span>
        </label>

        {/* Submit Button - Sticky on mobile for better UX */}
        {showFooter && (
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !canProceed}
              loading={isLoading}
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
              size="lg"
            >
              {isPro ? t("common.continue") : t("register.createAccount")}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </div>
        )}
      </form>

      {/* Switch type button */}
      {showFooter && (
        <div className="pt-3 sm:pt-4 border-t border-neutral-100">
          <button
            type="button"
            onClick={onSwitchType}
            className="w-full py-2 text-xs sm:text-sm text-neutral-500 hover:text-[#C4735B] transition-colors text-center"
          >
            {isPro
              ? t("register.backToClientRegistration")
              : t("register.registerAsProfessional")}
          </button>
        </div>
      )}
    </div>
  );
}

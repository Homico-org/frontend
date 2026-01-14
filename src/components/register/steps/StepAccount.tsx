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
import { MessageSquare } from "lucide-react";
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
          {isPro
            ? t('register.professionalAccount')
            : t('register.createAccount')}
        </h1>
        <p className="text-sm text-neutral-500">
          {t('register.fillInYourBasicInformation')}
        </p>
      </div>

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
        className="space-y-4"
      >
        {/* Avatar Upload for Pro */}
        {isPro && (
          <Card
            className={`flex items-center gap-4 p-4 border-2 transition-all ${
              uploadedAvatarUrl
                ? "border-emerald-500/50"
                : "border-[#C4735B] ring-4 ring-[#C4735B]/10"
            }`}
          >
            <div className="relative">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-dashed transition-all ${
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
                      className="w-8 h-8 text-[#C4735B]"
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
                  <LoadingSpinner size="lg" color="white" />
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
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
                >
                  <svg
                    className="w-3 h-3"
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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-neutral-900">
                  {t('register.profilePhoto')}
                </h3>
                <span className="text-[10px] text-[#C4735B] font-medium">
                  {t('common.required')}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {t('register.uploadARealPhotoOf')}
              </p>
              {uploadedAvatarUrl && (
                <Badge variant="success" size="xs" className="mt-1">
                  {t('register.uploaded')}
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormGroup>
            <Label required locale={locale}>
              {t('common.fullName')}
            </Label>
            <Input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder={t('register.giorgiBeridze')}
              required
              autoComplete="off"
              data-form-type="other"
              className="bg-white dark:bg-neutral-900"
            />
          </FormGroup>
          <FormGroup>
            <Label locale={locale}>
              {locale === "ka" ? "ელ-ფოსტა" : "Email"}
              <span className="ml-1 text-neutral-400 font-normal">
                ({t('common.optional')})
              </span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="name@example.com"
            />
          </FormGroup>
        </div>

        {/* Phone section */}
        <FormGroup>
          <Label required locale={locale}>
            {t('common.phone')}
          </Label>

          {/* Channel toggle */}
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              onClick={() => setVerificationChannel("sms")}
              variant="ghost"
              size="sm"
              className={
                verificationChannel === "sms"
                  ? "bg-[#C4735B] text-white hover:bg-[#A85D47] hover:text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
              }
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              SMS
            </Button>
            <Button
              type="button"
              onClick={() => setVerificationChannel("whatsapp")}
              variant="ghost"
              size="sm"
              className={
                verificationChannel === "whatsapp"
                  ? "bg-[#25D366] text-white hover:bg-[#1da851] hover:text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
              }
            >
              <SocialIcon name="whatsapp" size="sm" className="mr-1.5" />
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

        {/* Password fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormGroup>
            <Label required locale={locale}>
              {t('common.password')}
            </Label>
            <PasswordInput
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={t('register.min6Chars')}
              required
              minLength={6}
            />
          </FormGroup>
          <FormGroup>
            <Label required locale={locale}>
              {t('register.repeatPassword')}
            </Label>
            <PasswordInput
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder={t('register.repeat')}
              required
              minLength={6}
              error={
                repeatPassword && formData.password !== repeatPassword
                  ? t('validation.passwordsNotMatch')
                  : undefined
              }
            />
          </FormGroup>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
          />
          <span className="text-xs text-neutral-600 leading-relaxed">
            {locale === "ka" ? (
              <>
                ვეთანხმები{" "}
                <Link
                  href="/terms"
                  className="text-[#C4735B] hover:underline"
                >
                  პირობებს
                </Link>{" "}
                და{" "}
                <Link
                  href="/privacy"
                  className="text-[#C4735B] hover:underline"
                >
                  კონფიდენციალურობას
                </Link>
              </>
            ) : (
              <>
                I agree to{" "}
                <Link
                  href="/terms"
                  className="text-[#C4735B] hover:underline"
                >
                  Terms
                </Link>{" "}
                &{" "}
                <Link
                  href="/privacy"
                  className="text-[#C4735B] hover:underline"
                >
                  Privacy
                </Link>
              </>
            )}
          </span>
        </label>

        {/* Submit - only show if showFooter is true (for client registration or standalone) */}
        {showFooter && (
          <Button
            type="submit"
            disabled={isLoading || !canProceed}
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            {isPro
              ? t('common.continue')
              : t('register.createAccount')}
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
        )}
      </form>

      {/* Switch type button */}
      <div className="pt-3 border-t border-neutral-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSwitchType}
          className="text-neutral-500 hover:text-[#C4735B]"
        >
          {isPro
            ? t('register.backToClientRegistration')
            : t('register.registerAsProfessional')}
        </Button>
      </div>
    </div>
  );
}

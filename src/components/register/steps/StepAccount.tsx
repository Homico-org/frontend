"use client";

import GoogleSignInButton, {
  GoogleUserData,
} from "@/components/auth/GoogleSignInButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { FormGroup, Input, Label } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Tabs } from "@/components/ui/Tabs";
import { CountryCode } from "@/contexts/LanguageContext";
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
  locale: "en" | "ka";
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

  // Google
  handleGoogleSuccess: (userData: GoogleUserData) => void;
  handleGoogleError: (errorMsg: string) => void;

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
  authMethod,
  setAuthMethod,
  formData,
  handleInputChange,
  error,
  isLoading,
  repeatPassword,
  setRepeatPassword,
  showPassword,
  setShowPassword,
  showRepeatPassword,
  setShowRepeatPassword,
  agreedToTerms,
  setAgreedToTerms,
  phoneCountry,
  setPhoneCountry,
  verificationChannel,
  setVerificationChannel,
  avatarPreview,
  avatarUploading,
  uploadedAvatarUrl,
  avatarInputRef,
  handleAvatarSelect,
  removeAvatar,
  handleGoogleSuccess,
  handleGoogleError,
  canProceed,
  onNext,
  onSwitchType,
  showFooter = true,
}: AccountStepProps) {
  const isPro = userType === "pro";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
          {isPro
            ? locale === "ka"
              ? "პროფესიონალური ანგარიში"
              : "Professional Account"
            : locale === "ka"
              ? "ანგარიშის შექმნა"
              : "Create Account"}
        </h1>
        <p className="text-sm text-neutral-500">
          {locale === "ka"
            ? "შეავსე ძირითადი ინფორმაცია"
            : "Fill in your basic information"}
        </p>
      </div>

      {/* Auth Method Tabs */}
      <Card className="p-3">
        <Tabs
          tabs={[
            {
              id: "google",
              label: "Google",
              icon: (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              ),
            },
            {
              id: "mobile",
              label: locale === "ka" ? "ტელეფონი" : "Mobile",
              shortLabel: locale === "ka" ? "მობილური" : "Phone",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              ),
            },
            {
              id: "email",
              label: locale === "ka" ? "ელ-ფოსტა" : "Email",
              shortLabel: locale === "ka" ? "მეილი" : "Email",
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ),
            },
          ]}
          activeTab={authMethod}
          onChange={(tabId) => setAuthMethod(tabId as AuthMethod)}
          variant="pills"
          size="sm"
          fullWidth
          compact
          tabClassName="!px-2 !py-1.5 !text-xs"
        />
        <p className="text-center text-[10px] text-neutral-400 mt-2">
          {locale === "ka"
            ? "შემდეგ შესვლისას გამოიყენე იგივე მეთოდი"
            : "Use the same method when logging in later"}
        </p>
      </Card>

      {error && (
        <Alert variant="error" size="sm">
          {error}
        </Alert>
      )}

      {/* Google Auth Content */}
      {authMethod === "google" && (
        <Card className="p-6 space-y-4">
          <GoogleSignInButton
            buttonKey={isPro ? "pro-register" : "client-register"}
            text="signup_with"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isActive={authMethod === "google"}
            loadingText={locale === "ka" ? "იტვირთება..." : "Loading..."}
          />
          <p className="text-center text-xs text-neutral-500">
            {isPro
              ? locale === "ka"
                ? "Google-ით რეგისტრაციის შემდეგ დაგჭირდებათ ტელეფონის ვერიფიკაცია"
                : "After Google sign-up, you'll need to verify your phone number"
              : locale === "ka"
                ? "დააჭირე Google-ით გასაგრძელებლად"
                : "Click to continue with Google"}
          </p>
        </Card>
      )}

      {/* Email/Mobile Auth Form */}
      {(authMethod === "email" || authMethod === "mobile") && (
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
                    {locale === "ka" ? "პროფილის ფოტო" : "Profile Photo"}
                  </h3>
                  <span className="text-[10px] text-[#C4735B] font-medium">
                    {locale === "ka" ? "(სავალდებულო)" : "(required)"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {locale === "ka"
                    ? "ატვირთე რეალური ფოტო"
                    : "Upload a real photo of yourself"}
                </p>
                {uploadedAvatarUrl && (
                  <Badge variant="success" size="xs" className="mt-1">
                    {locale === "ka" ? "✓ ატვირთულია" : "✓ Uploaded"}
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Name and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup>
              <Label required locale={locale}>
                {locale === "ka" ? "სრული სახელი" : "Full Name"}
              </Label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder={
                  locale === "ka" ? "გიორგი ბერიძე" : "Giorgi Beridze"
                }
                required
              />
            </FormGroup>
            <FormGroup>
              <Label required={authMethod === "email"} locale={locale}>
                {locale === "ka" ? "ელ-ფოსტა" : "Email"}
                {authMethod !== "email" && (
                  <span className="ml-1 text-neutral-400 font-normal">
                    ({locale === "ka" ? "არასავალდებულო" : "optional"})
                  </span>
                )}
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="name@example.com"
                required={authMethod === "email"}
              />
            </FormGroup>
          </div>

          {/* Phone section (for mobile auth) */}
          {authMethod === "mobile" && (
            <FormGroup>
              <Label required locale={locale}>
                {locale === "ka" ? "ტელეფონი" : "Phone"}
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
          )}

          {/* Password fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup>
              <Label required locale={locale}>
                {locale === "ka" ? "პაროლი" : "Password"}
              </Label>
              <PasswordInput
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={
                  locale === "ka" ? "მინ. 6 სიმბოლო" : "Min. 6 chars"
                }
                required
                minLength={6}
              />
            </FormGroup>
            <FormGroup>
              <Label required locale={locale}>
                {locale === "ka" ? "გაიმეორე პაროლი" : "Repeat Password"}
              </Label>
              <PasswordInput
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder={locale === "ka" ? "გაიმეორე" : "Repeat"}
                required
                minLength={6}
                error={
                  repeatPassword && formData.password !== repeatPassword
                    ? "პაროლები არ ემთხვევა"
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
                ? locale === "ka"
                  ? "გაგრძელება"
                  : "Continue"
                : locale === "ka"
                  ? "ანგარიშის შექმნა"
                  : "Create Account"}
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
      )}

      {/* Switch type button */}
      <div className="pt-3 border-t border-neutral-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSwitchType}
          className="text-neutral-500 hover:text-[#C4735B]"
        >
          {isPro
            ? locale === "ka"
              ? "← დაბრუნება კლიენტის რეგისტრაციაზე"
              : "← Back to client registration"
            : locale === "ka"
              ? "→ რეგისტრაცია როგორც პროფესიონალი"
              : "→ Register as professional"}
        </Button>
      </div>
    </div>
  );
}

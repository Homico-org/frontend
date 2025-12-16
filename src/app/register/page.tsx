"use client";

import BackButton from "@/components/common/BackButton";
import PortfolioProjectsInput, {
  PortfolioProject,
} from "@/components/common/PortfolioProjectsInput";
import CategorySubcategorySelector from "@/components/common/CategorySubcategorySelector";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import {
  countries,
  CountryCode,
  useLanguage,
} from "@/contexts/LanguageContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

// Hook to redirect authenticated users
function useAuthRedirectFromRegister() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "company") {
        router.replace("/company/jobs");
      } else if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/browse");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  return { authLoading, isAuthenticated, user };
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, country, locale } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);

  const { authLoading, isAuthenticated, user } = useAuthRedirectFromRegister();
  const isProRegistration = searchParams.get("type") === "pro";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: isProRegistration ? "pro" : "client", // Default to client
    phone: "",
    city: "",
    idNumber: "",
    selectedCategories: [] as string[],
    selectedSubcategories: [] as string[],
    avatar: "", // Profile picture URL for pro users
    whatsapp: "", // Optional WhatsApp number
    telegram: "", // Optional Telegram username
  });

  // Social contact state
  const [activeSocialInput, setActiveSocialInput] = useState<'whatsapp' | 'telegram' | null>(null);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Portfolio projects state (optional for pro registration)
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProject[]
  >([]);

  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(
    country as CountryCode
  );
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Verification state
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", ""]);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentCountryData = countries[country as CountryCode] || countries.US;
  const citiesList =
    locale === "ka"
      ? currentCountryData.citiesLocal
      : currentCountryData.cities;
  const filteredCities = citiesList.filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Validation state for progress tracking
  const getValidationState = () => {
    const hasFirstName = !!formData.firstName.trim();
    const hasLastName = !!formData.lastName.trim();
    const hasIdNumber = formData.idNumber.length === 11;
    const hasPhone = !!formData.phone.trim();
    const hasPassword = formData.password.length >= 6;
    const hasPasswordMatch =
      formData.password === formData.confirmPassword && hasPassword;
    const hasCategory =
      formData.role === "client" || formData.selectedCategories.length > 0;
    const hasAvatar = formData.role === "client" || !!avatarPreview;

    return {
      firstName: hasFirstName,
      lastName: hasLastName,
      idNumber: hasIdNumber,
      phone: hasPhone,
      password: hasPassword,
      passwordMatch: hasPasswordMatch,
      category: hasCategory,
      avatar: hasAvatar,
    };
  };

  const validation = getValidationState();
  const requiredFieldsForRole =
    formData.role === "pro"
      ? ([
          "firstName",
          "lastName",
          "idNumber",
          "phone",
          "password",
          "passwordMatch",
          "category",
          "avatar",
        ] as const)
      : ([
          "firstName",
          "lastName",
          "idNumber",
          "phone",
          "password",
          "passwordMatch",
        ] as const);

  const completedFields = requiredFieldsForRole.filter(
    (field) => validation[field]
  ).length;
  const totalFields = requiredFieldsForRole.length;

  const canSubmitForm = () => {
    return requiredFieldsForRole.every((field) => validation[field]);
  };

  const getFirstMissingField = () => {
    if (!validation.firstName)
      return {
        key: "firstName",
        label: locale === "ka" ? "სახელი" : "First name",
      };
    if (!validation.lastName)
      return {
        key: "lastName",
        label: locale === "ka" ? "გვარი" : "Last name",
      };
    if (!validation.idNumber)
      return {
        key: "idNumber",
        label: locale === "ka" ? "პირადი ნომერი" : "ID number",
      };
    if (!validation.phone)
      return { key: "phone", label: locale === "ka" ? "ტელეფონი" : "Phone" };
    if (!validation.password)
      return {
        key: "password",
        label: locale === "ka" ? "პაროლი" : "Password",
      };
    if (!validation.passwordMatch)
      return {
        key: "passwordMatch",
        label:
          locale === "ka" ? "პაროლის დადასტურება" : "Password confirmation",
      };
    if (formData.role === "pro" && !validation.category)
      return {
        key: "category",
        label: locale === "ka" ? "სპეციალობა" : "Specialty",
      };
    if (formData.role === "pro" && !validation.avatar)
      return {
        key: "avatar",
        label: locale === "ka" ? "პროფილის ფოტო" : "Profile photo",
      };
    return null;
  };

  useEffect(() => {
    setPhoneCountry(country as CountryCode);
  }, [country]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = { ...fieldErrors };
    switch (name) {
      case "password":
        if (value.length > 0 && value.length < 6) {
          errors.password =
            locale === "ka" ? "მინიმუმ 6 სიმბოლო" : "Min 6 characters";
        } else {
          delete errors.password;
        }
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword =
            locale === "ka" ? "პაროლები არ ემთხვევა" : "Passwords do not match";
        } else if (formData.confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (value && value !== formData.password) {
          errors.confirmPassword =
            locale === "ka" ? "პაროლები არ ემთხვევა" : "Passwords do not match";
        } else {
          delete errors.confirmPassword;
        }
        break;
      case "idNumber":
        if (value.length > 0 && value.length !== 11) {
          errors.idNumber =
            locale === "ka"
              ? "პირადი ნომერი უნდა იყოს 11 ციფრი"
              : "ID must be 11 digits";
        } else {
          delete errors.idNumber;
        }
        break;
    }
    setFieldErrors(errors);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const handleCategoriesChange = (categories: string[]) => {
    setFormData({
      ...formData,
      selectedCategories: categories,
    });
    // Auto-expand the first selected category
    if (categories.length > 0) {
      setExpandedCategory(categories[categories.length - 1]);
    }
  };

  const handleSubcategoriesChange = (subcategories: string[]) => {
    setFormData({
      ...formData,
      selectedSubcategories: subcategories,
    });
  };

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(
        locale === "ka"
          ? "გთხოვთ აირჩიოთ სურათი"
          : "Please select an image file"
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        locale === "ka"
          ? "სურათი უნდა იყოს 5MB-ზე ნაკლები"
          : "Image must be less than 5MB"
      );
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    setAvatarUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", avatarFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`,
        {
          method: "POST",
          body: formDataUpload,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error("Avatar upload failed:", err);
      return null;
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormData({ ...formData, avatar: "" });
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const sendOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verification/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type: "phone" }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || (locale === "ka" ? "ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა" : "Failed to send verification code"));

      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || (locale === "ka" ? "ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან." : "Failed to send verification code. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const code = phoneOtp.join("");

      if (code.length !== 4) {
        throw new Error(
          locale === "ka"
            ? "შეიყვანეთ 4-ნიშნა კოდი"
            : "Please enter 4-digit code"
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verification/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, code, type: "phone" }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Invalid verification code");

      setIsPhoneVerified(true);
      setShowVerification(false);
      // Now submit the registration
      await submitRegistration();
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const otp = [...phoneOtp];
    otp[index] = value.slice(-1);
    setPhoneOtp(otp);
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !phoneOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    const otp = pastedData.split("");
    while (otp.length < 4) otp.push("");
    setPhoneOtp(otp);
  };

  const validateForm = () => {
    if (!formData.role) {
      setError(
        locale === "ka"
          ? "აირჩიეთ ანგარიშის ტიპი"
          : "Please select account type"
      );
      return false;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError(
        locale === "ka" ? "შეავსეთ სახელი და გვარი" : "Please enter your name"
      );
      return false;
    }
    if (!formData.idNumber || formData.idNumber.length !== 11) {
      setError(
        locale === "ka"
          ? "პირადი ნომერი უნდა იყოს 11 ციფრი"
          : "ID number must be 11 digits"
      );
      return false;
    }
    if (!formData.phone) {
      setError(
        locale === "ka"
          ? "ტელეფონის ნომერი სავალდებულოა"
          : "Phone number is required"
      );
      return false;
    }
    if (formData.password.length < 6) {
      setError(
        locale === "ka"
          ? "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"
          : "Password must be at least 6 characters"
      );
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(
        locale === "ka" ? "პაროლები არ ემთხვევა" : "Passwords do not match"
      );
      return false;
    }
    if (formData.role === "pro" && formData.selectedCategories.length === 0) {
      setError(
        locale === "ka" ? "აირჩიეთ სპეციალობა" : "Please select your specialty"
      );
      return false;
    }
    if (formData.role === "pro" && !avatarFile && !avatarPreview) {
      setError(
        locale === "ka"
          ? "პროფილის ფოტო სავალდებულოა"
          : "Profile photo is required for professionals"
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    // Check if phone exists
    setIsLoading(true);
    try {
      const phoneCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`
      ).then((r) => r.json());

      const idCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=idNumber&value=${encodeURIComponent(formData.idNumber)}`
      ).then((r) => r.json());

      if (phoneCheck.exists) {
        setError(
          locale === "ka"
            ? "ეს ტელეფონის ნომერი უკვე რეგისტრირებულია"
            : "This phone number is already registered"
        );
        setIsLoading(false);
        return;
      }

      if (idCheck.exists) {
        setError(
          locale === "ka"
            ? "ეს პირადი ნომერი უკვე რეგისტრირებულია"
            : "This ID number is already registered"
        );
        setIsLoading(false);
        return;
      }

      // Show phone verification
      setShowVerification(true);
      await sendOtp();
    } catch (err) {
      setError(
        locale === "ka"
          ? "შეცდომა. სცადეთ თავიდან."
          : "Error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistration = async () => {
    setIsLoading(true);
    try {
      // Upload avatar first if present (for pro users)
      let avatarUrl = formData.avatar;
      if (formData.role === "pro" && avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email || undefined,
            password: formData.password,
            idNumber: formData.idNumber,
            role: formData.role,
            phone: `${countries[phoneCountry].phonePrefix}${formData.phone}`,
            city: formData.city || undefined,
            avatar: avatarUrl || undefined,
            whatsapp: formData.whatsapp || undefined,
            telegram: formData.telegram || undefined,
            selectedCategories:
              formData.role === "pro" ? formData.selectedCategories : undefined,
            selectedSubcategories:
              formData.role === "pro"
                ? formData.selectedSubcategories
                : undefined,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      login(data.access_token, data.user);
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (data.user.role === "pro") {
        sessionStorage.setItem(
          "proRegistrationData",
          JSON.stringify({
            categories: formData.selectedCategories,
            subcategories: formData.selectedSubcategories,
            portfolioProjects:
              portfolioProjects.length > 0 ? portfolioProjects : undefined,
            avatar: avatarUrl || data.user.avatar || undefined,
          })
        );
        router.push("/pro/profile-setup");
      } else {
        router.push("/browse");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && user)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="w-12 h-12 rounded-full border-2 border-[#E07B4F]/20 dark:border-[#E07B4F]/30 border-t-[#E07B4F] animate-spin" />
      </div>
    );
  }

  // Phone verification modal
  if (showVerification) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl border"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            onClick={() => setShowVerification(false)}
            className="mb-6 flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {locale === "ka" ? "უკან" : "Back"}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#E07B4F]/10 dark:bg-[#E07B4F]/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#E07B4F] dark:text-[#E8956A]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              {locale === "ka" ? "დაადასტურე ნომერი" : "Verify your phone"}
            </h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ka" ? "კოდი გაიგზავნა ნომერზე:" : "Code sent to:"}{" "}
              <span className="font-medium">
                {countries[phoneCountry].phonePrefix}
                {formData.phone}
              </span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => {
                  otpInputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={phoneOtp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                onPaste={handleOtpPaste}
                className="w-14 h-14 text-center text-2xl font-semibold rounded-xl border-2 transition-all duration-200 outline-none"
                style={{
                  backgroundColor: "var(--color-bg-tertiary)",
                  borderColor: phoneOtp[index]
                    ? "#E07B4F"
                    : "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            ))}
          </div>

          <button
            onClick={verifyOtp}
            disabled={isLoading || phoneOtp.join("").length !== 4}
            className="w-full py-4 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #D26B3F 0%, #E07B4F 100%)",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
            ) : locale === "ka" ? (
              "დადასტურება"
            ) : (
              "Verify"
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={sendOtp}
              disabled={resendTimer > 0 || isLoading}
              className="text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                color: resendTimer > 0 ? "var(--color-text-muted)" : "#E07B4F",
              }}
            >
              {resendTimer > 0
                ? `${locale === "ka" ? "თავიდან გაგზავნა" : "Resend"} (${resendTimer}s)`
                : locale === "ka"
                  ? "კოდის თავიდან გაგზავნა"
                  : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page-premium min-h-screen">
      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24">
        <div className="mb-4">
          <BackButton />
        </div>
        {/* Title */}
        <div className="text-center mb-6">
          <div className="auth-icon-premium mx-auto mb-3">
            <svg className="w-7 h-7 text-[#E07B4F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {locale === "ka" ? "შექმენი ანგარიში" : "Create your account"}
          </h1>
          <p
            className="text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {locale === "ka"
              ? "შეუერთდი Homico-ს საზოგადოებას"
              : "Join the Homico community"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error mb-8">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400 flex-1">
              {error}
            </p>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Account Type - Refined Toggle Design */}
          <section>
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              {locale === "ka" ? "ანგარიშის ტიპი" : "Account Type"}
            </h2>
            <div className="inline-flex gap-2 w-full sm:w-auto">
              {[
                {
                  key: "client",
                  label: locale === "ka" ? "მომხმარებელი" : "Client",
                  icon: (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  key: "pro",
                  label: locale === "ka" ? "პროფესიონალი" : "Professional",
                  icon: (
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                },
              ].map((type) => {
                const isSelected = formData.role === type.key;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      if (type.key !== "pro") {
                        // Clear avatar when switching to client
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        if (avatarInputRef.current) {
                          avatarInputRef.current.value = "";
                        }
                      }
                      setFormData({
                        ...formData,
                        role: type.key,
                        selectedCategories: [],
                        selectedSubcategories: [],
                        avatar: type.key !== "pro" ? "" : formData.avatar,
                      });
                    }}
                    className={`auth-toggle-btn flex-1 sm:flex-none ${isSelected ? 'active' : ''}`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#E07B4F]/60 dark:text-[#E8956A]/60'}>
                      {type.icon}
                    </span>
                    <span>{type.label}</span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Account type description */}
            {formData.role && (
              <div
                className={`mt-4 auth-section-premium flex items-start gap-3 ${formData.role === 'pro' ? 'border-emerald-500/20' : ''}`}
                style={{
                  backgroundColor:
                    formData.role === "pro"
                      ? "rgba(16, 185, 129, 0.05)"
                      : undefined,
                }}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    formData.role === "pro"
                      ? "bg-[#E07B4F] text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  {formData.role === "pro" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      style={{ color: "var(--color-text-secondary)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p
                    className="font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {formData.role === "pro"
                      ? locale === "ka"
                        ? "პროფესიონალი"
                        : "Professional Account"
                      : locale === "ka"
                        ? "მომხმარებელი"
                        : "Client Account"}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {formData.role === "pro"
                      ? locale === "ka"
                        ? "შექმენი პროფილი და შესთავაზე შენი მომსახურება მომხმარებლებს"
                        : "Create your profile and offer services to clients"
                      : locale === "ka"
                        ? "მოძებნე და დაიქირავე საუკეთესო პროფესიონალები"
                        : "Find and hire the best professionals"}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Profile Picture Upload - Only for Pro */}
          {formData.role === "pro" && (
            <section>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    validation.avatar
                      ? "bg-[#E07B4F] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {validation.avatar ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {locale === "ka" ? "პროფილის ფოტო" : "Profile Photo"}
                  </h2>
                  {!validation.avatar && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {locale === "ka" ? "სავალდებულო" : "Required"}
                    </span>
                  )}
                </div>
              </div>
              <p
                className="text-sm mb-4 ml-11"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {locale === "ka"
                  ? "ატვირთე პროფესიონალური ფოტო კლიენტებისთვის"
                  : "Upload a professional photo for clients to see"}
              </p>

              <div className="flex items-start gap-6">
                {/* Avatar Preview */}
                <div className="relative group">
                  <div
                    className={`w-28 h-28 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      avatarPreview
                        ? "ring-4 ring-[#E07B4F]/20"
                        : "border-2 border-dashed"
                    }`}
                    style={{
                      backgroundColor: avatarPreview
                        ? undefined
                        : "var(--color-bg-secondary)",
                      borderColor: avatarPreview
                        ? undefined
                        : "var(--color-border)",
                    }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-10 h-10"
                        style={{ color: "var(--color-text-muted)" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Remove button */}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm cursor-pointer transition-all duration-200 ${
                      avatarPreview
                        ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        : "bg-[#E07B4F] text-white hover:bg-[#D26B3F] shadow-lg shadow-[#E07B4F]/25"
                    }`}
                    style={{
                      color: avatarPreview
                        ? "var(--color-text-primary)"
                        : undefined,
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {avatarPreview
                      ? locale === "ka"
                        ? "შეცვალე ფოტო"
                        : "Change Photo"
                      : locale === "ka"
                        ? "ატვირთე ფოტო"
                        : "Upload Photo"}
                  </label>

                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {locale === "ka"
                      ? "JPG, PNG ან GIF. მაქს. 5MB"
                      : "JPG, PNG or GIF. Max 5MB"}
                  </p>

                  {avatarUploading && (
                    <div className="mt-3 flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-[#E07B4F]"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-sm text-[#E07B4F] dark:text-[#E8956A]">
                        {locale === "ka" ? "იტვირთება..." : "Uploading..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Personal Info */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  validation.firstName &&
                  validation.lastName &&
                  validation.idNumber &&
                  validation.phone
                    ? "bg-[#E07B4F] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {validation.firstName &&
                validation.lastName &&
                validation.idNumber &&
                validation.phone ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  "1"
                )}
              </div>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {locale === "ka" ? "პირადი ინფორმაცია" : "Personal Information"}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "სახელი" : "First Name"}</span>
                  {validation.firstName ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={locale === "ka" ? "გიორგი" : "John"}
                  className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    border: `2px solid ${focusedField === "firstName" ? "#E07B4F" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "გვარი" : "Last Name"}</span>
                  {validation.lastName ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={locale === "ka" ? "გელაშვილი" : "Doe"}
                  className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    border: `2px solid ${focusedField === "lastName" ? "#E07B4F" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* ID Number */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "პირადი ნომერი" : "ID Number"}</span>
                  {validation.idNumber ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.idNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "idNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  onFocus={() => setFocusedField("idNumber")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    border: `2px solid ${focusedField === "idNumber" ? "#E07B4F" : fieldErrors.idNumber ? "#ef4444" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="01234567890"
                />
                {fieldErrors.idNumber && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.idNumber}
                  </p>
                )}
              </div>

              {/* Phone - Required field next to ID Number */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "ტელეფონი" : "Phone"}</span>
                  {validation.phone ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <div
                    className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 flex-shrink-0"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <span>{countries[phoneCountry].flag}</span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {countries[phoneCountry].phonePrefix}
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      handleInputChange(
                        "phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className="flex-1 px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      border: `2px solid ${focusedField === "phone" ? "#E07B4F" : "var(--color-border)"}`,
                      color: "var(--color-text-primary)",
                    }}
                    placeholder="555 123 456"
                  />
                </div>
              </div>

              {/* Password - Required field */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "პაროლი" : "Password"}</span>
                  {validation.password ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-base transition-all duration-200 outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      border: `2px solid ${focusedField === "password" ? "#E07B4F" : fieldErrors.password ? "#ef4444" : "var(--color-border)"}`,
                      color: "var(--color-text-primary)",
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password - Required field */}
              <div>
                <label
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span>{locale === "ka" ? "გაიმეორეთ პაროლი" : "Confirm Password"}</span>
                  {validation.passwordMatch ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E07B4F]">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-base transition-all duration-200 outline-none"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      border: `2px solid ${focusedField === "confirmPassword" ? "#E07B4F" : fieldErrors.confirmPassword ? "#ef4444" : "var(--color-border)"}`,
                      color: "var(--color-text-primary)",
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Email - Optional field */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {locale === "ka" ? "ელ-ფოსტა" : "Email"}{" "}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    ({locale === "ka" ? "არასავალდებულო" : "optional"})
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    border: `2px solid ${focusedField === "email" ? "#E07B4F" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                  }}
                  placeholder="example@email.com"
                />
              </div>

              {/* City - Optional field */}
              <div ref={cityDropdownRef} className="relative">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {locale === "ka" ? "ქალაქი" : "City"}
                </label>
                <input
                  type="text"
                  value={formData.city || citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setFormData({ ...formData, city: "" });
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => {
                    setFocusedField("city");
                    setShowCityDropdown(true);
                  }}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    border: `2px solid ${focusedField === "city" ? "#E07B4F" : "var(--color-border)"}`,
                    color: "var(--color-text-primary)",
                  }}
                  placeholder={
                    locale === "ka" ? "აირჩიეთ ქალაქი" : "Select city"
                  }
                />
                {showCityDropdown && filteredCities.length > 0 && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-xl border shadow-lg max-h-48 overflow-y-auto"
                    style={{
                      backgroundColor: "var(--color-bg-secondary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, city });
                          setCitySearch("");
                          setShowCityDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* WhatsApp & Telegram - Full width row for pro users */}
              {formData.role === "pro" && (
                <div className="sm:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {locale === "ka" ? "დამატებითი კონტაქტი" : "Additional Contact"}{" "}
                    <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                      ({locale === "ka" ? "არასავალდებულო" : "optional"})
                    </span>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSocialInput(activeSocialInput === 'whatsapp' ? null : 'whatsapp')}
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${
                          formData.whatsapp
                            ? 'bg-[#25D366]/10 border-[#25D366] text-[#25D366]'
                            : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[#25D366]/50 hover:text-[#25D366]'
                        }`}
                        style={{ backgroundColor: formData.whatsapp ? undefined : "var(--color-bg-secondary)" }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange("whatsapp", e.target.value.replace(/\D/g, ""))}
                        onFocus={() => setFocusedField("whatsapp")}
                        onBlur={() => setFocusedField(null)}
                        className="flex-1 px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-secondary)",
                          border: `2px solid ${focusedField === "whatsapp" ? "#25D366" : formData.whatsapp ? "#25D366" : "var(--color-border)"}`,
                          color: "var(--color-text-primary)",
                        }}
                        placeholder={locale === "ka" ? "WhatsApp ნომერი" : "WhatsApp number"}
                      />
                    </div>
                    {/* Telegram */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveSocialInput(activeSocialInput === 'telegram' ? null : 'telegram')}
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${
                          formData.telegram
                            ? 'bg-[#0088cc]/10 border-[#0088cc] text-[#0088cc]'
                            : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[#0088cc]/50 hover:text-[#0088cc]'
                        }`}
                        style={{ backgroundColor: formData.telegram ? undefined : "var(--color-bg-secondary)" }}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </button>
                      <input
                        type="text"
                        value={formData.telegram}
                        onChange={(e) => handleInputChange("telegram", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        onFocus={() => setFocusedField("telegram")}
                        onBlur={() => setFocusedField(null)}
                        className="flex-1 px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-secondary)",
                          border: `2px solid ${focusedField === "telegram" ? "#0088cc" : formData.telegram ? "#0088cc" : "var(--color-border)"}`,
                          color: "var(--color-text-primary)",
                        }}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Category Selection - Only for Pro */}
          {formData.role === "pro" && (
            <section>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    validation.category
                      ? "bg-[#E07B4F] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {validation.category ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {locale === "ka"
                      ? "აირჩიე სპეციალობა"
                      : "Choose Your Specialty"}
                  </h2>
                  {!validation.category && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {locale === "ka" ? "სავალდებულო" : "Required"}
                    </span>
                  )}
                </div>
              </div>
              <p
                className="text-sm mb-4 ml-11"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {locale === "ka"
                  ? "აირჩიე კატეგორია და შენი სპეციალიზაცია (მაქს. 4 კატეგორია)"
                  : "Select categories and your specializations (max 4 categories)"}
              </p>

              <CategorySubcategorySelector
                selectedCategories={formData.selectedCategories}
                selectedSubcategories={formData.selectedSubcategories}
                onCategoriesChange={handleCategoriesChange}
                onSubcategoriesChange={handleSubcategoriesChange}
                singleCategoryMode={false}
                maxCategories={4}
                maxSubcategories={10}
                showCustomSpecialties={true}
              />
            </section>
          )}

          {/* Portfolio Projects - Optional for Pro */}
          {formData.role === "pro" && formData.selectedCategories.length > 0 && (
            <section>
              <PortfolioProjectsInput
                projects={portfolioProjects}
                onChange={setPortfolioProjects}
                maxProjects={3}
              />
            </section>
          )}
        </form>
      </main>

      {/* Fixed Actions Footer - compact design matching post-job */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Progress indicator - compact */}
            {!canSubmitForm() && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center relative">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="#E07B4F"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedFields / totalFields) * 75.4} 75.4`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {completedFields}/{totalFields}
                  </span>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium hidden sm:block">
                  {getFirstMissingField()?.label}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (canSubmitForm() && formRef.current) {
                  formRef.current.requestSubmit();
                }
              }}
              disabled={isLoading || !canSubmitForm()}
              className={`
                flex-1 py-3 px-6 rounded-full font-medium text-sm transition-all duration-200 ease-out
                flex items-center justify-center gap-2 border
                ${canSubmitForm()
                  ? 'bg-[#E07B4F]/[0.08] border-[#E07B4F]/40 text-[#E07B4F] dark:text-[#E8956A] hover:bg-[#E07B4F]/[0.12] hover:border-[#E07B4F]/50'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>
                    {locale === "ka" ? "მიმდინარეობს..." : "Processing..."}
                  </span>
                </>
              ) : canSubmitForm() ? (
                <>
                  <span>
                    {locale === "ka" ? "რეგისტრაცია" : "Create Account"}
                  </span>
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </>
              ) : (
                <span>
                  {locale === "ka" ? "შეავსე ველები" : "Fill required fields"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-[#E07B4F]/20 dark:border-[#E07B4F]/30 border-t-[#E07B4F] animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

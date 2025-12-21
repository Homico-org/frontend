"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCategories } from "@/contexts/CategoriesContext";
import {
  countries,
  CountryCode,
  useLanguage,
} from "@/contexts/LanguageContext";
import { AnalyticsEvent, useAnalytics } from "@/hooks/useAnalytics";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

// Google OAuth types - using type assertion to avoid conflicts with google maps types
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
  }) => void;
  prompt: () => void;
  renderButton: (
    element: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
    }
  ) => void;
}

interface GoogleUserData {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

// Step configuration
type RegistrationStep = 'account' | 'category' | 'services' | 'review';

interface StepConfig {
  id: RegistrationStep;
  title: { en: string; ka: string };
  subtitle: { en: string; ka: string };
}

const PRO_STEPS: StepConfig[] = [
  { id: 'account', title: { en: 'Create Account', ka: 'ანგარიშის შექმნა' }, subtitle: { en: 'Your basic information', ka: 'ძირითადი ინფორმაცია' } },
  { id: 'category', title: { en: 'Services', ka: 'სერვისები' }, subtitle: { en: 'What services do you provide?', ka: 'რა სერვისებს გთავაზობთ?' } },
  { id: 'services', title: { en: 'Portfolio', ka: 'პორტფოლიო' }, subtitle: { en: 'Showcase your expertise', ka: 'აჩვენე შენი გამოცდილება' } },
  { id: 'review', title: { en: 'Review', ka: 'გადახედვა' }, subtitle: { en: 'Confirm your details', ka: 'დაადასტურე შენი მონაცემები' } },
];

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

// Logo component using favicon
function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image src="/favicon.svg" alt="Homico" width={32} height={32} className="h-8 w-auto" />
    </Link>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, country, locale } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { categories } = useCategories();

  const { authLoading, isAuthenticated, user } = useAuthRedirectFromRegister();
  const isProRegistration = searchParams.get("type") === "pro";

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account');
  const [userType, setUserType] = useState<'client' | 'pro'>(isProRegistration ? 'pro' : 'client');

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    idNumber: "",
    selectedCategories: [] as string[],
    selectedSubcategories: [] as string[],
    whatsapp: "",
    telegram: "",
  });

  // Service/Portfolio data
  const [services, setServices] = useState<Array<{
    title: string;
    price: string;
    description: string;
  }>>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // UI states
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Verification state
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", ""]);
  const [showVerification, setShowVerification] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google OAuth state
  const [googleUser, setGoogleUser] = useState<GoogleUserData | null>(null);
  const [showGooglePhoneVerification, setShowGooglePhoneVerification] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    architects: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    designers: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    'service-workers': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  useEffect(() => {
    setPhoneCountry(country as CountryCode);
  }, [country]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Decode JWT token to get user info
  const decodeJwt = (token: string): { email: string; name: string; picture?: string; sub: string } | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // Handle Google Sign In callback
  const handleGoogleCallback = useCallback((response: { credential: string }) => {
    const decoded = decodeJwt(response.credential);
    if (decoded) {
      setGoogleUser({
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        googleId: decoded.sub,
      });
      setFormData(prev => ({
        ...prev,
        fullName: decoded.name,
        email: decoded.email,
      }));
      setAgreedToTerms(true);
      setShowGooglePhoneVerification(true);
    } else {
      setError(locale === "ka" ? "Google-ით შესვლა ვერ მოხერხდა" : "Failed to sign in with Google");
    }
  }, [locale]);

  // Initialize Google Sign In
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleAccounts = (window as any)?.google?.accounts?.id as GoogleAccountsId | undefined;

    if (googleScriptLoaded && googleAccounts && googleButtonRef.current) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn('Google Client ID not configured');
        return;
      }

      googleAccounts.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });

      googleAccounts.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        shape: 'rectangular',
        width: 300,
      });
    }
  }, [googleScriptLoaded, handleGoogleCallback]);

  // Handle Google OAuth registration completion
  const submitGoogleRegistration = async () => {
    if (!googleUser) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google-register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            googleId: googleUser.googleId,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            phone: `${countries[phoneCountry].phonePrefix}${formData.phone}`,
            role: userType,
            city: formData.city || undefined,
            selectedCategories: userType === "pro" ? formData.selectedCategories : undefined,
            selectedSubcategories: userType === "pro" ? formData.selectedSubcategories : undefined,
            isPhoneVerified: true,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      login(data.access_token, data.user);
      trackEvent(
        data.user.role === 'pro' ? AnalyticsEvent.REGISTER_PRO : AnalyticsEvent.REGISTER_CLIENT,
        { userRole: data.user.role, authMethod: 'google' }
      );

      if (data.user.role === "pro") {
        sessionStorage.setItem(
          "proRegistrationData",
          JSON.stringify({
            categories: formData.selectedCategories,
            subcategories: formData.selectedSubcategories,
            services: services.length > 0 ? services : undefined,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
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

  // Handle Google phone verification and OTP
  const handleGooglePhoneSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Check if phone exists
      const phoneCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`
      ).then((r) => r.json());

      if (phoneCheck.exists) {
        setError(locale === "ka" ? "ეს ტელეფონის ნომერი უკვე რეგისტრირებულია" : "This phone number is already registered");
        setIsLoading(false);
        return;
      }

      // Send OTP
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
      if (!response.ok) throw new Error(data.message || "Failed to send verification code");

      setResendTimer(60);
      setShowVerification(true);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP for Google registration
  const verifyGoogleOtp = async (otpCode?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const code = otpCode || phoneOtp.join("");

      if (code.length !== 4) {
        throw new Error(locale === "ka" ? "შეიყვანეთ 4-ნიშნა კოდი" : "Please enter 4-digit code");
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
      if (!response.ok) throw new Error(data.message || "Invalid verification code");

      setShowVerification(false);
      await submitGoogleRegistration();
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setPhoneOtp(["", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const getCurrentStepIndex = () => {
    if (userType === 'client') return 0;
    return PRO_STEPS.findIndex(s => s.id === currentStep);
  };

  const getProgressPercentage = () => {
    if (userType === 'client') return 100;
    const index = getCurrentStepIndex();
    return ((index + 1) / PRO_STEPS.length) * 100;
  };

  const canProceedFromAccount = () => {
    return formData.fullName.trim() && formData.password.length >= 6 && formData.phone && agreedToTerms;
  };

  const canProceedFromCategory = () => {
    return formData.selectedCategories.length > 0;
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedCategories.includes(categoryKey);
      if (isSelected) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter(c => c !== categoryKey),
          selectedSubcategories: prev.selectedSubcategories.filter(s => {
            const cat = categories.find(c => c.key === categoryKey);
            return !cat?.subcategories.some(sub => sub.key === s);
          })
        };
      } else if (prev.selectedCategories.length < 3) {
        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, categoryKey]
        };
      }
      return prev;
    });
  };

  const handleSubcategoryToggle = (subcategoryKey: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubcategories.includes(subcategoryKey);
      if (isSelected) {
        return {
          ...prev,
          selectedSubcategories: prev.selectedSubcategories.filter(s => s !== subcategoryKey)
        };
      } else {
        return {
          ...prev,
          selectedSubcategories: [...prev.selectedSubcategories, subcategoryKey]
        };
      }
    });
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addService = () => {
    setServices(prev => [...prev, { title: '', price: '', description: '' }]);
  };

  const updateService = (index: number, field: string, value: string) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (userType === 'client') {
      handleSubmit();
      return;
    }

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < PRO_STEPS.length - 1) {
      setCurrentStep(PRO_STEPS[currentIndex + 1].id);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(PRO_STEPS[currentIndex - 1].id);
    }
  };

  const goToStep = (step: RegistrationStep) => {
    setCurrentStep(step);
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
      if (!response.ok) throw new Error(data.message || "Failed to send verification code");

      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otpCode?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const code = otpCode || phoneOtp.join("");

      if (code.length !== 4) {
        throw new Error(locale === "ka" ? "შეიყვანეთ 4-ნიშნა კოდი" : "Please enter 4-digit code");
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
      if (!response.ok) throw new Error(data.message || "Invalid verification code");

      setShowVerification(false);
      await submitRegistration();
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setPhoneOtp(["", "", "", ""]);
      otpInputRefs.current[0]?.focus();
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

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    if (newOtp.every((digit) => digit !== "") && newOtp.length === 4) {
      // Use Google OTP verification if user signed in with Google
      const verifyFn = googleUser ? verifyGoogleOtp : verifyOtp;
      setTimeout(() => verifyFn(newOtp.join("")), 100);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !phoneOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Check if phone exists
      const phoneCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`
      ).then((r) => r.json());

      if (phoneCheck.exists) {
        setError(locale === "ka" ? "ეს ტელეფონის ნომერი უკვე რეგისტრირებულია" : "This phone number is already registered");
        setIsLoading(false);
        return;
      }

      if (formData.idNumber) {
        const idCheck = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=idNumber&value=${encodeURIComponent(formData.idNumber)}`
        ).then((r) => r.json());

        if (idCheck.exists) {
          setError(locale === "ka" ? "ეს პირადი ნომერი უკვე რეგისტრირებულია" : "This ID number is already registered");
          setIsLoading(false);
          return;
        }
      }

      setShowVerification(true);
      await sendOtp();
    } catch (err) {
      setError(locale === "ka" ? "შეცდომა. სცადეთ თავიდან." : "Error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName.trim(),
            email: formData.email || undefined,
            password: formData.password,
            idNumber: formData.idNumber || undefined,
            role: userType,
            phone: `${countries[phoneCountry].phonePrefix}${formData.phone}`,
            city: formData.city || undefined,
            whatsapp: formData.whatsapp || undefined,
            telegram: formData.telegram || undefined,
            selectedCategories: userType === "pro" ? formData.selectedCategories : undefined,
            selectedSubcategories: userType === "pro" ? formData.selectedSubcategories : undefined,
            isPhoneVerified: true,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      login(data.access_token, data.user);
      trackEvent(
        data.user.role === 'pro' ? AnalyticsEvent.REGISTER_PRO : AnalyticsEvent.REGISTER_CLIENT,
        { userRole: data.user.role }
      );

      if (data.user.role === "pro") {
        sessionStorage.setItem(
          "proRegistrationData",
          JSON.stringify({
            categories: formData.selectedCategories,
            subcategories: formData.selectedSubcategories,
            services: services.length > 0 ? services : undefined,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
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

  // Loading state
  if (authLoading || (isAuthenticated && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
      </div>
    );
  }

  // Phone verification modal
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF9]">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-xl border border-neutral-100">
          <button
            onClick={() => setShowVerification(false)}
            className="mb-6 flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === "ka" ? "უკან" : "Back"}
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              {locale === "ka" ? "დაადასტურე ნომერი" : "Verify your phone"}
            </h2>
            <p className="text-neutral-500">
              {locale === "ka" ? "კოდი გაიგზავნა ნომერზე:" : "Code sent to:"}{" "}
              <span className="font-medium text-neutral-700">
                {countries[phoneCountry].phonePrefix}{formData.phone}
              </span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={phoneOtp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                className={`w-14 h-14 text-center text-2xl font-semibold rounded-xl border-2 transition-all outline-none ${
                  phoneOtp[index] ? 'border-[#C4735B] bg-[#C4735B]/5' : 'border-neutral-200 bg-white'
                } focus:border-[#C4735B] focus:bg-[#C4735B]/5`}
              />
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <svg className="animate-spin h-5 w-5 text-[#C4735B]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-neutral-500">{locale === "ka" ? "მოწმდება..." : "Verifying..."}</span>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={googleUser ? handleGooglePhoneSubmit : sendOtp}
              disabled={resendTimer > 0 || isLoading}
              className="text-sm font-medium text-[#C4735B] hover:text-[#A85D47] disabled:text-neutral-400 transition-colors"
            >
              {resendTimer > 0
                ? `${locale === "ka" ? "თავიდან გაგზავნა" : "Resend"} (${resendTimer}s)`
                : locale === "ka" ? "კოდის თავიდან გაგზავნა" : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GOOGLE PHONE VERIFICATION - Shown after Google sign in
  if (showGooglePhoneVerification && googleUser) {
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={() => setGoogleScriptLoaded(true)}
        />
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            {/* Back button */}
            <button
              onClick={() => {
                setShowGooglePhoneVerification(false);
                setGoogleUser(null);
                setShowVerification(false);
                setPhoneOtp(["", "", "", ""]);
                setError("");
              }}
              className="mb-4 flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {locale === "ka" ? "უკან" : "Back"}
            </button>

            {/* Google user info */}
            <div className="text-center mb-6">
              {googleUser.picture && (
                <img
                  src={googleUser.picture}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-[#C4735B]/20"
                />
              )}
              <h2 className="text-lg font-semibold text-neutral-900 mb-1">
                {locale === "ka" ? `გამარჯობა, ${googleUser.name}!` : `Hello, ${googleUser.name}!`}
              </h2>
              <p className="text-xs text-neutral-500">{googleUser.email}</p>
            </div>

            {!showVerification ? (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-2">
                    {locale === "ka" ? "დაადასტურე ტელეფონის ნომერი" : "Verify your phone number"}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    {locale === "ka"
                      ? "რეგისტრაციის დასასრულებლად საჭიროა ტელეფონის ნომრის დადასტურება."
                      : "Phone verification is required to complete registration."}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ტელეფონი" : "Phone"} *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 bg-neutral-50 flex-shrink-0">
                        <span className="text-sm">{countries[phoneCountry].flag}</span>
                        <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                        placeholder="555 123 456"
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* User type selection for pro */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserType('client')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        userType === 'client'
                          ? 'bg-[#C4735B] text-white border-[#C4735B]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {locale === "ka" ? "კლიენტი" : "Client"}
                    </button>
                    <button
                      onClick={() => setUserType('pro')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        userType === 'pro'
                          ? 'bg-[#C4735B] text-white border-[#C4735B]'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {locale === "ka" ? "პროფესიონალი" : "Professional"}
                    </button>
                  </div>

                  <button
                    onClick={handleGooglePhoneSubmit}
                    disabled={isLoading || !formData.phone}
                    className="w-full py-2.5 rounded-lg bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{locale === "ka" ? "..." : "..."}</span>
                      </>
                    ) : (
                      <span>{locale === "ka" ? "კოდის გაგზავნა" : "Send verification code"}</span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-sm font-medium text-neutral-900 mb-1">
                    {locale === "ka" ? "შეიყვანე კოდი" : "Enter verification code"}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {locale === "ka" ? "კოდი გაიგზავნა ნომერზე:" : "Code sent to:"}{" "}
                    <span className="font-medium text-neutral-700">
                      {countries[phoneCountry].phonePrefix}{formData.phone}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex justify-center gap-2 mb-4">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={phoneOtp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      className={`w-12 h-12 text-center text-xl font-semibold rounded-lg border-2 transition-all outline-none ${
                        phoneOtp[index] ? 'border-[#C4735B] bg-[#C4735B]/5' : 'border-neutral-200 bg-white'
                      } focus:border-[#C4735B] focus:bg-[#C4735B]/5`}
                    />
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <svg className="animate-spin h-4 w-4 text-[#C4735B]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs text-neutral-500">{locale === "ka" ? "მოწმდება..." : "Verifying..."}</span>
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowVerification(false);
                      setPhoneOtp(["", "", "", ""]);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 mr-4"
                  >
                    {locale === "ka" ? "ნომრის შეცვლა" : "Change number"}
                  </button>
                  <button
                    onClick={handleGooglePhoneSubmit}
                    disabled={resendTimer > 0 || isLoading}
                    className="text-xs font-medium text-[#C4735B] hover:text-[#A85D47] disabled:text-neutral-400 transition-colors"
                  >
                    {resendTimer > 0
                      ? `${locale === "ka" ? "თავიდან" : "Resend"} (${resendTimer}s)`
                      : locale === "ka" ? "თავიდან გაგზავნა" : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // CLIENT REGISTRATION - Simple single-page form
  if (userType === 'client' && currentStep === 'account') {
    return (
      <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleScriptLoaded(true)}
      />
      <div className="min-h-screen bg-[#FAFAF9]">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
                {locale === "ka" ? "დახმარება" : "Help"}
              </Link>
              <button
                onClick={() => openLoginModal()}
                className="text-xs font-medium text-[#C4735B] hover:text-[#A85D47] transition-colors"
              >
                {locale === "ka" ? "შესვლა" : "Log In"}
              </button>
            </div>
          </div>
        </header>

        <main className="pt-12 min-h-screen flex">
          {/* Left side - Marketing content */}
          <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] bg-gradient-to-br from-[#FDF8F6] to-[#FAF5F2] p-8 xl:p-10 flex-col justify-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-16 right-16 w-24 h-24 rounded-full bg-[#C4735B]/5 blur-2xl" />
            <div className="absolute bottom-24 left-12 w-36 h-36 rounded-full bg-[#C4735B]/8 blur-3xl" />

            <div className="relative z-10 max-w-md">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h1 className="text-2xl xl:text-3xl font-bold text-neutral-900 mb-3 leading-tight">
                {locale === "ka" ? (
                  <>დაასრულე სამუშაოს განთავსება ანგარიშის შექმნით.</>
                ) : (
                  <>Finish posting your job by creating an account.</>
                )}
              </h1>

              <p className="text-sm text-neutral-600 mb-6">
                {locale === "ka"
                  ? "დაუკავშირდი საქართველოს საუკეთესო პროფესიონალებს."
                  : "Connect with the best professionals in Georgia."}
              </p>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                {[
                  { icon: "✓", text: locale === "ka" ? "უფასოდ განათავსე სამუშაო" : "Free to post jobs" },
                  { icon: "✓", text: locale === "ka" ? "ვერიფიცირებული პროფესიონალები" : "Verified professionals" },
                  { icon: "✓", text: locale === "ka" ? "უსაფრთხო გადახდები" : "Secure payments" },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#C4735B]/10 flex items-center justify-center text-[#C4735B] text-xs font-medium">
                      {benefit.icon}
                    </span>
                    <span className="text-sm text-neutral-700">{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="p-3 rounded-xl bg-white shadow-sm border border-neutral-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C4735B] to-[#A85D47] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    ნ
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-600 text-xs mb-1">
                      "{locale === "ka" ? "10 წუთში ვიპოვე შესანიშნავი სანტექნიკი!" : "Found a great plumber in 10 mins!"}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900 text-xs">Nino G.</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Registration form */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
            <div className="w-full max-w-sm">
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 p-5">
                {/* Social login buttons */}
                <div className="space-y-2 mb-4">
                  {/* Google Sign In Button */}
                  <div
                    ref={googleButtonRef}
                    className="flex justify-center [&>div]:!w-full"
                  />
                  {!googleScriptLoaded && (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-400"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="text-xs font-medium">
                        {locale === "ka" ? "იტვირთება..." : "Loading..."}
                      </span>
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-neutral-400 text-[10px] tracking-wider">
                      {locale === "ka" ? "ან ელ-ფოსტით" : "OR WITH EMAIL"}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                {/* Registration form */}
                <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "სრული სახელი" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder={locale === "ka" ? "გიორგი ბერიძე" : "Giorgi Beridze"}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ელ-ფოსტა" : "Email"}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ტელეფონი" : "Phone"}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 bg-neutral-50 flex-shrink-0">
                        <span className="text-sm">{countries[phoneCountry].flag}</span>
                        <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                        placeholder="555 123 456"
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "პაროლი" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder={locale === "ka" ? "მინ. 6 სიმბოლო" : "Min. 6 characters"}
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
                    />
                    <span className="text-xs text-neutral-600">
                      {locale === "ka" ? (
                        <>ვეთანხმები <Link href="/terms" className="text-[#C4735B] hover:underline">პირობებს</Link> და <Link href="/privacy" className="text-[#C4735B] hover:underline">კონფიდენციალურობას</Link>.</>
                      ) : (
                        <>I agree to <Link href="/terms" className="text-[#C4735B] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#C4735B] hover:underline">Privacy Policy</Link>.</>
                      )}
                    </span>
                  </label>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading || !canProceedFromAccount()}
                    className="w-full py-2.5 rounded-lg bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{locale === "ka" ? "მიმდინარეობს..." : "Processing..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{locale === "ka" ? "ანგარიშის შექმნა" : "Create Account"}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Login link */}
                <p className="mt-4 text-center text-xs text-neutral-600">
                  {locale === "ka" ? "უკვე გაქვს ანგარიში?" : "Already have an account?"}{" "}
                  <button onClick={() => openLoginModal()} className="text-[#C4735B] font-medium hover:underline">
                    {locale === "ka" ? "შესვლა" : "Log in"}
                  </button>
                </p>

                {/* Pro registration link */}
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setUserType('pro')}
                    className="w-full py-2 rounded-lg border border-dashed border-neutral-200 hover:border-[#C4735B]/50 hover:bg-[#C4735B]/5 transition-all text-xs text-neutral-600 hover:text-[#C4735B]"
                  >
                    {locale === "ka" ? "ხარ პროფესიონალი? დარეგისტრირდი აქ" : "Are you a professional? Register here"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      </>
    );
  }

  // PRO REGISTRATION - Multi-step wizard
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <button className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                {locale === "ka" ? "შენახვა" : "Save"}
              </button>
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                {locale === "ka" ? `${getCurrentStepIndex() + 1}/${PRO_STEPS.length}` : `STEP ${getCurrentStepIndex() + 1}/${PRO_STEPS.length}`}
              </span>
              <span className="text-[10px] font-medium text-[#C4735B]">
                {PRO_STEPS[getCurrentStepIndex()].title[locale === "ka" ? "ka" : "en"]}
              </span>
            </div>
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C4735B] to-[#D4896B] rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 p-2 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* STEP 1: Account Creation */}
          {currentStep === 'account' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "პროფესიონალური ანგარიში" : "Professional Account"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "შეავსე ძირითადი ინფორმაცია" : "Fill in your basic information"}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "სრული სახელი" : "Full Name"} *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder={locale === "ka" ? "გიორგი ბერიძე" : "Giorgi Beridze"}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ტელეფონი" : "Phone"} *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 bg-neutral-50 flex-shrink-0">
                        <span className="text-sm">{countries[phoneCountry].flag}</span>
                        <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                        placeholder="555 123 456"
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "პაროლი" : "Password"} *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ელ-ფოსტა" : "Email"} <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "პირადი ნომერი" : "ID Number"} <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange("idNumber", e.target.value.replace(/\D/g, ""))}
                      maxLength={11}
                      placeholder="01234567890"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "ქალაქი" : "City"} <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder={locale === "ka" ? "თბილისი" : "Tbilisi"}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-neutral-300 text-[#C4735B] focus:ring-[#C4735B]"
                />
                <span className="text-xs text-neutral-600">
                  {locale === "ka" ? (
                    <>ვეთანხმები <Link href="/terms" className="text-[#C4735B] hover:underline">პირობებს</Link> და <Link href="/privacy" className="text-[#C4735B] hover:underline">კონფიდენციალურობას</Link>.</>
                  ) : (
                    <>I agree to <Link href="/terms" className="text-[#C4735B] hover:underline">Terms</Link> and <Link href="/privacy" className="text-[#C4735B] hover:underline">Privacy Policy</Link>.</>
                  )}
                </span>
              </label>

              {/* Switch to client */}
              <div className="pt-3 border-t border-neutral-100">
                <button
                  onClick={() => setUserType('client')}
                  className="text-xs text-neutral-500 hover:text-[#C4735B] transition-colors"
                >
                  {locale === "ka" ? "← დაბრუნება კლიენტის რეგისტრაციაზე" : "← Back to client registration"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Category Selection */}
          {currentStep === 'category' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "რა სერვისებს გთავაზობთ?" : "What services do you provide?"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "აირჩიეთ კატეგორია და უნარები" : "Select your profession and skills"}
                </p>
              </div>

              {/* Main Categories */}
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 mb-2">
                  1. {locale === "ka" ? "კატეგორია" : "Category"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {categories.map((category) => {
                    const isSelected = formData.selectedCategories.includes(category.key);
                    return (
                      <button
                        key={category.key}
                        onClick={() => handleCategoryToggle(category.key)}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#C4735B] bg-[#C4735B]/5'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#C4735B] flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                          isSelected ? 'bg-[#C4735B] text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {categoryIcons[category.key] || (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          )}
                        </div>
                        <h3 className="text-xs font-medium text-neutral-900 line-clamp-1">
                          {locale === "ka" ? category.nameKa : category.name}
                        </h3>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategories / Skills */}
              {formData.selectedCategories.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      2. {locale === "ka" ? "უნარები" : "Skills"}
                    </h2>
                    {formData.selectedSubcategories.length > 0 && (
                      <span className="text-xs text-[#C4735B] font-medium">
                        {formData.selectedSubcategories.length} {locale === "ka" ? "არჩეული" : "selected"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {formData.selectedCategories.flatMap(catKey => {
                      const category = categories.find(c => c.key === catKey);
                      return category?.subcategories || [];
                    }).map((subcategory) => {
                      const isSelected = formData.selectedSubcategories.includes(subcategory.key);
                      return (
                        <button
                          key={subcategory.key}
                          onClick={() => handleSubcategoryToggle(subcategory.key)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[#C4735B] text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {locale === "ka" ? subcategory.nameKa : subcategory.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Services & Portfolio */}
          {currentStep === 'services' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "დაამატე სერვისები და ფოტოები" : "Add services and photos of your work"}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Services */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                    {locale === "ka" ? "სერვისები" : "Services"}
                  </h2>

                  {/* Popular Tags */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {['Leak Repair', 'Installation', 'Maintenance'].map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleTagToggle(tag)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                              isSelected
                                ? 'bg-[#C4735B] text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {isSelected ? '' : '+ '}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Service Form */}
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <input
                          type="text"
                          placeholder={locale === "ka" ? "სერვისი" : "Service name"}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs focus:border-[#C4735B] outline-none"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">₾</span>
                        <input
                          type="text"
                          placeholder="50"
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs focus:border-[#C4735B] outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addService}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
                    >
                      + {locale === "ka" ? "დამატება" : "Add"}
                    </button>
                  </div>

                  {/* Added Services */}
                  {services.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {services.map((service, index) => (
                        <div key={index} className="p-2 rounded-lg border border-neutral-200 bg-white flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium text-neutral-900">{service.title || 'Service'}</span>
                            <span className="text-xs text-[#C4735B] ml-2">₾{service.price || '0'}</span>
                          </div>
                          <button onClick={() => removeService(index)} className="text-neutral-400 hover:text-red-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Portfolio */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <h2 className="text-sm font-semibold text-neutral-900 mb-3">
                    {locale === "ka" ? "ფოტოები" : "Photos"}
                  </h2>

                  {/* Upload area */}
                  <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 text-center hover:border-[#C4735B]/50 transition-colors cursor-pointer mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-neutral-900">
                      {locale === "ka" ? "ატვირთე ფოტოები" : "Upload photos"}
                    </p>
                    <p className="text-[10px] text-neutral-500">JPG, PNG · 5MB</p>
                  </div>

                  {/* Preview grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-neutral-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "გადახედვა" : "Review"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "დაადასტურე მონაცემები" : "Confirm your details"}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {/* Account Info Review */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      {locale === "ka" ? "ანგარიში" : "Account"}
                    </h2>
                    <button onClick={() => goToStep('account')} className="text-xs font-medium text-[#C4735B] hover:underline">
                      {locale === "ka" ? "რედაქტირება" : "Edit"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-neutral-500">{locale === "ka" ? "სახელი" : "Name"}</p>
                      <p className="font-medium text-neutral-900 truncate">{formData.fullName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{locale === "ka" ? "ტელ." : "Phone"}</p>
                      <p className="font-medium text-neutral-900">{countries[phoneCountry].phonePrefix}{formData.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{locale === "ka" ? "ელ-ფოსტა" : "Email"}</p>
                      <p className="font-medium text-neutral-900 truncate">{formData.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{locale === "ka" ? "ქალაქი" : "City"}</p>
                      <p className="font-medium text-neutral-900">{formData.city || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Services Review */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-neutral-900">
                      {locale === "ka" ? "სერვისები" : "Services"}
                    </h2>
                    <button onClick={() => goToStep('category')} className="text-xs font-medium text-[#C4735B] hover:underline">
                      {locale === "ka" ? "რედაქტირება" : "Edit"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedCategories.map(catKey => {
                        const category = categories.find(c => c.key === catKey);
                        return (
                          <span key={catKey} className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-[10px] font-medium">
                            {locale === "ka" ? category?.nameKa : category?.name}
                          </span>
                        );
                      })}
                      {formData.selectedCategories.length === 0 && <span className="text-neutral-400 text-xs">-</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedSubcategories.slice(0, 5).map(subKey => {
                        let subcategory;
                        for (const cat of categories) {
                          const found = cat.subcategories.find(s => s.key === subKey);
                          if (found) { subcategory = found; break; }
                        }
                        return (
                          <span key={subKey} className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px]">
                            {locale === "ka" ? subcategory?.nameKa : subcategory?.name}
                          </span>
                        );
                      })}
                      {formData.selectedSubcategories.length > 5 && (
                        <span className="text-[10px] text-neutral-500">+{formData.selectedSubcategories.length - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Review */}
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-neutral-900">
                    {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
                  </h2>
                  <button onClick={() => goToStep('services')} className="text-xs font-medium text-[#C4735B] hover:underline">
                    {locale === "ka" ? "რედაქტირება" : "Edit"}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  {services.length > 0 && (
                    <div className="flex-1 text-xs">
                      <span className="text-neutral-500">{services.length} {locale === "ka" ? "სერვისი" : "service(s)"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with navigation */}
      <footer className="sticky bottom-0 bg-white border-t border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {getCurrentStepIndex() > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {locale === "ka" ? "უკან" : "Back"}
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={
                isLoading ||
                (currentStep === 'account' && !canProceedFromAccount()) ||
                (currentStep === 'category' && !canProceedFromCategory())
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C4735B] hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{locale === "ka" ? "..." : "..."}</span>
                </>
              ) : currentStep === 'review' ? (
                <>
                  <span>{locale === "ka" ? "დასრულება" : "Complete"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span>{locale === "ka" ? "გაგრძელება" : "Continue"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
          <div className="w-12 h-12 rounded-full border-2 border-[#C4735B]/20 border-t-[#C4735B] animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

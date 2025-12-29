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
import AvatarCropper from "@/components/common/AvatarCropper";
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
      } else if (user.role === "pro" && user.isProfileCompleted === false) {
        // Incomplete pro users must complete their profile
        router.replace("/pro/profile-setup");
      } else {
        router.replace("/browse");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  return { authLoading, isAuthenticated, user };
}

// Logo component using icon.svg
function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image src="/icon.svg" alt="Homico" width={120} height={30} className="h-7 w-auto" />
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
  const [showTypeSelection, setShowTypeSelection] = useState(!isProRegistration);

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    selectedCategories: [] as string[],
    selectedSubcategories: [] as string[],
    whatsapp: "",
    telegram: "",
  });

  // Avatar upload state (for pro registration)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Client avatar state - random illustrated avatars
  const AVATAR_COUNT = 19;
  const [clientAvatarIndex, setClientAvatarIndex] = useState<number>(() =>
    Math.floor(Math.random() * AVATAR_COUNT) + 1
  );
  const [clientCustomAvatar, setClientCustomAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const clientAvatarInputRef = useRef<HTMLInputElement>(null);

  const getClientAvatarUrl = () => {
    if (clientCustomAvatar) return clientCustomAvatar;
    return `/images/avatars/avatar-${clientAvatarIndex}.png`;
  };

  // Handle client avatar file upload
  const handleClientAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;

      // Upload to server
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setClientCustomAvatar(data.url);
        } else {
          // If upload fails, use base64 as fallback preview
          setClientCustomAvatar(base64);
        }
      } catch (error) {
        // If upload fails, use base64 as fallback preview
        setClientCustomAvatar(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Shuffle to a different random avatar
  const shuffleClientAvatar = () => {
    setClientCustomAvatar(null);
    let newIndex = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    // Avoid getting the same avatar
    while (newIndex === clientAvatarIndex && AVATAR_COUNT > 1) {
      newIndex = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    }
    setClientAvatarIndex(newIndex);
  };

  // Service/Portfolio data - custom services that user types (up to 5)
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [newCustomService, setNewCustomService] = useState('');

  // Legacy services (keeping for backwards compatibility)
  const [services, setServices] = useState<Array<{
    title: string;
    price: string;
    description: string;
  }>>([]);
  const [newService, setNewService] = useState({ title: '', price: '' });
  const [portfolioProjects, setPortfolioProjects] = useState<Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
  }>>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // UI states
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Verification state
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", ""]);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationChannel, setVerificationChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Google OAuth state
  const [googleUser, setGoogleUser] = useState<GoogleUserData | null>(null);
  const [showGooglePhoneVerification, setShowGooglePhoneVerification] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(() => {
    // Check if script is already loaded (e.g., from cache)
    if (typeof window !== 'undefined') {
      return !!(window as any)?.google?.accounts?.id;
    }
    return false;
  });
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

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCountryDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-country-dropdown]')) {
          setShowCountryDropdown(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCountryDropdown]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first OTP input when verification step appears
  useEffect(() => {
    if (showVerification) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showVerification]);

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

  // Check for Google script on mount (handles cached script scenario)
  useEffect(() => {
    if (!googleScriptLoaded) {
      // Poll for the script to be ready (handles race conditions)
      const checkGoogle = () => {
        if ((window as any)?.google?.accounts?.id) {
          setGoogleScriptLoaded(true);
        }
      };

      // Check immediately and then poll for a short time
      checkGoogle();
      const interval = setInterval(checkGoogle, 100);
      const timeout = setTimeout(() => clearInterval(interval), 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [googleScriptLoaded]);

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
      // Prepare pro-specific fields for Google registration
      const proFieldsGoogle = userType === "pro" ? {
        selectedCategories: formData.selectedCategories,
        selectedSubcategories: formData.selectedSubcategories,
        customServices: customServices.length > 0 ? customServices : undefined,
        portfolioProjects: portfolioProjects.filter(p => p.images.length > 0).map(p => ({
          title: p.title,
          description: p.description,
          images: p.images,
        })),
      } : {};

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
            password: formData.password,
            role: userType,
            city: formData.city || undefined,
            isPhoneVerified: true,
            ...proFieldsGoogle,
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
            customServices: customServices.length > 0 ? customServices : undefined,
            portfolioProjects: portfolioProjects.filter(p => p.images.length > 0),
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

  // Handle Google phone verification - channel is already selected on form
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

      // Channel is already selected, go directly to verification
      setShowVerification(true);
      await sendOtp(verificationChannel);
    } catch (err: any) {
      setError(err.message || "Failed to verify phone number");
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

  // Avatar upload handler - opens cropper first
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(locale === "ka" ? "მხოლოდ სურათები არის დაშვებული" : "Only image files are allowed");
      return;
    }

    // Validate file size (max 10MB for raw image, will be compressed after crop)
    if (file.size > 10 * 1024 * 1024) {
      setError(locale === "ka" ? "ფაილი ძალიან დიდია (მაქს. 10MB)" : "File is too large (max 10MB)");
      return;
    }

    setError("");
    // Open cropper with the selected image
    const imageUrl = URL.createObjectURL(file);
    setRawAvatarImage(imageUrl);
    setShowAvatarCropper(true);
  };

  // Handle cropped image from cropper
  const handleCroppedAvatar = async (croppedBlob: Blob) => {
    setShowAvatarCropper(false);

    // Clean up raw image URL
    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }

    // Create preview from cropped blob
    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);

    // Upload the cropped image
    setAvatarUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, 'avatar.jpg');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedAvatarUrl(data.url);
    } catch {
      setError(locale === "ka" ? "სურათის ატვირთვა ვერ მოხერხდა" : "Failed to upload image");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowAvatarCropper(false);
    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const removeAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setUploadedAvatarUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
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
    // Avatar is required for pro registration
    const hasAvatar = userType === 'pro' ? !!uploadedAvatarUrl : true;
    // Password match is required for client registration
    const passwordsMatch = userType === 'client' ? formData.password === repeatPassword : true;
    return formData.fullName.trim() && formData.password.length >= 6 && formData.phone && agreedToTerms && hasAvatar && passwordsMatch;
  };

  const canProceedFromCategory = () => {
    return formData.selectedCategories.length > 0;
  };

  const canProceedFromServices = () => {
    // Require at least 1 project with at least 1 image
    return portfolioProjects.length > 0 && portfolioProjects.some(p => p.images.length > 0);
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
    if (newService.title.trim()) {
      setServices(prev => [...prev, { title: newService.title.trim(), price: newService.price || '0', description: '' }]);
      setNewService({ title: '', price: '' });
    }
  };

  const updateService = (index: number, field: string, value: string) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const addPortfolioProject = () => {
    setPortfolioProjects(prev => [...prev, {
      id: `project-${Date.now()}`,
      title: '',
      description: '',
      images: []
    }]);
  };

  const updatePortfolioProject = (id: string, field: string, value: string | string[]) => {
    setPortfolioProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePortfolioProject = (id: string) => {
    setPortfolioProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleProjectImageUpload = (projectId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(locale === "ka" ? "მხოლოდ JPG, PNG ან WebP ფორმატი" : "Only JPG, PNG or WebP allowed");
        return;
      }
      if (file.size > maxSize) {
        setError(locale === "ka" ? "ფაილი ძალიან დიდია (მაქს. 5MB)" : "File too large (max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPortfolioProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, images: [...p.images, base64] };
          }
          return p;
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProjectImage = (projectId: string, imageIndex: number) => {
    setPortfolioProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, images: p.images.filter((_, i) => i !== imageIndex) };
      }
      return p;
    }));
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

  const sendOtp = async (channel: 'sms' | 'whatsapp' = verificationChannel) => {
    setIsLoading(true);
    setError("");
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verification/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, type: "phone", channel }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send verification code");

      setVerificationChannel(channel);
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

      // Channel is already selected on the form, go directly to verification
      setShowVerification(true);
      await sendOtp(verificationChannel);
    } catch (err) {
      setError(locale === "ka" ? "შეცდომა. სცადეთ თავიდან." : "Error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegistration = async () => {
    setIsLoading(true);
    try {
      // Prepare pro-specific fields
      const proFields = userType === "pro" ? {
        selectedCategories: formData.selectedCategories,
        selectedSubcategories: formData.selectedSubcategories,
        customServices: customServices.length > 0 ? customServices : undefined,
        portfolioProjects: portfolioProjects.filter(p => p.images.length > 0).map(p => ({
          title: p.title,
          description: p.description,
          images: p.images,
        })),
      } : {};

      // Determine avatar URL based on user type
      const avatarUrl = userType === 'pro'
        ? uploadedAvatarUrl || undefined
        : getClientAvatarUrl();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName.trim(),
            email: formData.email || undefined,
            password: formData.password,
            role: userType,
            phone: `${countries[phoneCountry].phonePrefix}${formData.phone}`,
            city: formData.city || undefined,
            whatsapp: formData.whatsapp || undefined,
            telegram: formData.telegram || undefined,
            avatar: avatarUrl,
            isPhoneVerified: true,
            ...proFields,
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
            customServices: customServices.length > 0 ? customServices : undefined,
            portfolioProjects: portfolioProjects.filter(p => p.images.length > 0),
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
    const isWhatsApp = verificationChannel === 'whatsapp';
    const channelColor = isWhatsApp ? '#25D366' : '#C4735B';

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAF9]">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white shadow-xl border border-neutral-100">
          <button
            onClick={() => {
              setShowVerification(false);
              setPhoneOtp(["", "", "", ""]);
              setError("");
            }}
            className="mb-6 flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === "ka" ? "უკან" : "Back"}
          </button>

          <div className="text-center mb-8">
            {isWhatsApp ? (
              <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            )}
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              {locale === "ka" ? "დაადასტურე ნომერი" : "Verify your phone"}
            </h2>
            <p className="text-neutral-500">
              {locale === "ka"
                ? `კოდი გაიგზავნა ${isWhatsApp ? 'WhatsApp-ზე' : 'SMS-ით'}:`
                : `Code sent via ${isWhatsApp ? 'WhatsApp' : 'SMS'}:`}{" "}
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
                style={{
                  borderColor: phoneOtp[index] ? channelColor : undefined,
                  backgroundColor: phoneOtp[index] ? `${channelColor}08` : undefined,
                }}
                className={`w-14 h-14 text-center text-2xl font-semibold rounded-xl border-2 transition-all outline-none ${
                  phoneOtp[index] ? '' : 'border-neutral-200 bg-white'
                }`}
              />
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <svg className="animate-spin h-5 w-5" style={{ color: channelColor }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-neutral-500">{locale === "ka" ? "მოწმდება..." : "Verifying..."}</span>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={googleUser ? handleGooglePhoneSubmit : () => sendOtp()}
              disabled={resendTimer > 0 || isLoading}
              style={{ color: resendTimer > 0 || isLoading ? undefined : channelColor }}
              className="text-sm font-medium hover:opacity-80 disabled:text-neutral-400 transition-colors"
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
                      {locale === "ka"
                        ? `${verificationChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ნომერი`
                        : `${verificationChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Number`} <span className="text-[#C4735B]">*</span>
                    </label>

                    {/* Channel selection toggle */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setVerificationChannel('sms')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          verificationChannel === 'sms'
                            ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerificationChannel('whatsapp')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          verificationChannel === 'whatsapp'
                            ? 'border-[#25D366] bg-[#25D366]/5 text-[#25D366]'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative" data-country-dropdown>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors flex-shrink-0"
                        >
                          <span className="text-sm">{countries[phoneCountry].flag}</span>
                          <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                          <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[200px] overflow-y-auto">
                            {(Object.keys(countries) as CountryCode[]).map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => {
                                  setPhoneCountry(code);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 transition-colors ${phoneCountry === code ? 'bg-neutral-100' : ''}`}
                              >
                                <span className="text-sm">{countries[code].flag}</span>
                                <span className="text-xs text-neutral-600">{countries[code].phonePrefix}</span>
                                <span className="text-xs text-neutral-500">{countries[code].name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                        placeholder={verificationChannel === 'whatsapp' ? "WhatsApp 555 123 456" : "555 123 456"}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password field for pro registration */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "პაროლი" : "Password"} <span className="text-[#C4735B]">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder={locale === "ka" ? "მინ. 6 სიმბოლო" : "Min. 6 characters"}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                      required
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {locale === "ka"
                        ? "პაროლი საჭიროა ტელეფონით შესვლისთვის"
                        : "Password allows login with phone number"}
                    </p>
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
                    disabled={isLoading || !formData.phone || formData.password.length < 6}
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

  // TYPE SELECTION SCREEN
  if (showTypeSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FBF9F7] via-[#F7F3EF] to-[#F3EDE7]">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-neutral-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
                {locale === "ka" ? "დახმარება" : "Help"}
              </Link>
              <button
                onClick={() => openLoginModal()}
                className="text-sm font-medium text-[#C4735B] hover:text-[#A85D47] transition-colors"
              >
                {locale === "ka" ? "შესვლა" : "Log In"}
              </button>
            </div>
          </div>
        </header>

        <main className="relative pt-14 min-h-screen flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-4xl">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/50 text-sm text-neutral-600 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {locale === "ka" ? "უფასო რეგისტრაცია" : "Free to register"}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                {locale === "ka" ? "როგორ გსურს შემოგვიერთდე?" : "How would you like to join?"}
              </h1>
              <p className="text-lg text-neutral-500 max-w-xl mx-auto">
                {locale === "ka"
                  ? "აირჩიე შენთვის შესაფერისი ვარიანტი და დაიწყე უკვე დღეს"
                  : "Choose the option that fits you best and get started today"}
              </p>
            </div>

            {/* Type Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {/* Client Card */}
              <button
                onClick={() => {
                  setUserType('client');
                  setShowTypeSelection(false);
                }}
                className="group relative bg-white rounded-3xl border border-neutral-200/80 p-2 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-200/50 hover:border-neutral-300 hover:-translate-y-1"
              >
                {/* Image Container with rounded corners */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mb-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
                  <Image
                    src="/images/client.png"
                    alt="Client"
                    fill
                    className="object-contain object-center p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Content */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {locale === "ka" ? "კლიენტი" : "Client"}
                    </h3>
                  </div>

                  <p className="text-neutral-500 mb-5 leading-relaxed">
                    {locale === "ka"
                      ? "იპოვე საუკეთესო პროფესიონალები შენი პროექტისთვის"
                      : "Find the best professionals for your project"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{locale === "ka" ? "უფასო" : "Free"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#C4735B] font-semibold group-hover:gap-3 transition-all">
                      <span>{locale === "ka" ? "დაწყება" : "Get Started"}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {/* Pro Card */}
              <button
                onClick={() => {
                  setUserType('pro');
                  setShowTypeSelection(false);
                }}
                className="group relative bg-gradient-to-br from-[#C4735B] via-[#B86A52] to-[#A85D47] rounded-3xl p-2 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-[#C4735B]/30 hover:-translate-y-1 overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                {/* Badge */}
                <div className="absolute top-5 right-5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {locale === "ka" ? "გამოიმუშავე" : "Earn Money"}
                  </span>
                </div>

                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm mb-5">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#C4735B]/20 to-transparent" />
                  <Image
                    src="/images/pro-plumber.png"
                    alt="Professional"
                    fill
                    className="object-contain object-center p-6 group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Content */}
                <div className="relative px-4 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {locale === "ka" ? "პროფესიონალი" : "Professional"}
                    </h3>
                  </div>

                  <p className="text-white/80 mb-5 leading-relaxed">
                    {locale === "ka"
                      ? "შექმენი პროფილი და იპოვე ახალი კლიენტები"
                      : "Create your profile and find new clients"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{locale === "ka" ? "უფასო პროფილი" : "Free profile"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                      <span>{locale === "ka" ? "გაწევრიანება" : "Join Now"}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Login link */}
            <p className="text-center text-neutral-500">
              {locale === "ka" ? "უკვე გაქვს ანგარიში?" : "Already have an account?"}{" "}
              <button onClick={() => openLoginModal()} className="text-[#C4735B] font-semibold hover:text-[#A85D47] transition-colors">
                {locale === "ka" ? "შესვლა" : "Log in"}
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // CLIENT REGISTRATION - Redesigned two-column layout with avatar on left
  if (userType === 'client' && currentStep === 'account') {
    return (
      <>
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleScriptLoaded(true)}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#FDFCFB] via-[#FAF8F6] to-[#F5F0EC]">
        {/* Minimal floating header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <Link href="/help" className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors">
                {locale === "ka" ? "დახმარება" : "Help"}
              </Link>
              <button
                onClick={() => openLoginModal()}
                className="text-xs font-medium px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200/50 text-neutral-700 hover:bg-white hover:border-neutral-300 transition-all shadow-sm"
              >
                {locale === "ka" ? "შესვლა" : "Log In"}
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-screen flex items-center justify-center pt-16 pb-8 px-4">
          <div className="w-full max-w-4xl">
            {/* Main card with two columns */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-neutral-900/5 border border-neutral-100 overflow-hidden">
              <div className="flex flex-col lg:flex-row">

                {/* Left column - Avatar & Welcome */}
                <div className="lg:w-[340px] bg-gradient-to-br from-[#C4735B] via-[#B8694F] to-[#A85D47] p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-black/10 blur-2xl" />

                  {/* Welcome text */}
                  <div className="relative z-10">
                    <h1 className="text-xl lg:text-2xl font-bold text-white mb-2 leading-tight">
                      {locale === "ka" ? "კეთილი იყოს შენი მობრძანება!" : "Welcome aboard!"}
                    </h1>
                    <p className="text-white/80 text-sm">
                      {locale === "ka"
                        ? "შექმენი ანგარიში და იპოვე საუკეთესო პროფესიონალები"
                        : "Create an account to find the best professionals"}
                    </p>
                  </div>

                  {/* Avatar section - centered */}
                  <div className="relative z-10 flex flex-col items-center py-6 lg:py-10">
                    {/* Main avatar display */}
                    <div className="relative group mb-4">
                      <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                        <Image
                          src={getClientAvatarUrl()}
                          alt="Avatar"
                          width={160}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Sparkle badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-500 rounded-xl flex items-center justify-center shadow-lg rotate-12 transition-transform group-hover:rotate-0">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Avatar actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={shuffleClientAvatar}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-medium transition-all border border-white/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {locale === "ka" ? "შეცვალე" : "Shuffle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => clientAvatarInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-[#C4735B] text-xs font-medium transition-all shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {locale === "ka" ? "ატვირთე" : "Upload"}
                      </button>
                      {clientCustomAvatar && (
                        <button
                          type="button"
                          onClick={() => setClientCustomAvatar(null)}
                          className="p-2 rounded-xl bg-white/20 hover:bg-red-500/80 text-white transition-all"
                          title={locale === "ka" ? "წაშლა" : "Remove"}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-white/60 text-xs mt-3 text-center">
                      {clientCustomAvatar
                        ? (locale === "ka" ? "✓ საკუთარი ფოტო" : "✓ Custom photo")
                        : (locale === "ka" ? "აირჩიე ან ატვირთე ფოტო" : "Choose or upload a photo")
                      }
                    </p>

                    {/* Hidden file input */}
                    <input
                      ref={clientAvatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleClientAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Benefits at bottom */}
                  <div className="relative z-10 space-y-2">
                    {[
                      { icon: "✓", text: locale === "ka" ? "უფასოდ განათავსე სამუშაო" : "Free to post jobs" },
                      { icon: "✓", text: locale === "ka" ? "ვერიფიცირებული პროფესიონალები" : "Verified professionals" },
                      { icon: "✓", text: locale === "ka" ? "უსაფრთხო გადახდები" : "Secure payments" },
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
                          {benefit.icon}
                        </span>
                        <span className="text-white/90 text-xs">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right column - Form */}
                <div className="flex-1 p-6 lg:p-8">
                  {/* Google Sign In */}
                  <div className="mb-4">
                    <div
                      ref={googleButtonRef}
                      className="flex justify-center [&>div]:!rounded-full [&>div>div]:!rounded-full [&_iframe]:!rounded-full"
                    />
                    {!googleScriptLoaded && (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 bg-white text-neutral-400"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-sm font-medium">{locale === "ka" ? "იტვირთება..." : "Loading..."}</span>
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-neutral-400 text-xs">
                        {locale === "ka" ? "ან" : "or"}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Compact form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-3">
                    {/* Name and Email in row on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          {locale === "ka" ? "სრული სახელი" : "Full Name"} <span className="text-[#C4735B]">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder={locale === "ka" ? "გიორგი ბერიძე" : "Giorgi Beridze"}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          {locale === "ka" ? "ელ-ფოსტა" : "Email"}
                          <span className="ml-1 text-neutral-400 font-normal">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone section */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        {locale === "ka" ? "ტელეფონი" : "Phone"} <span className="text-[#C4735B]">*</span>
                      </label>

                      {/* Compact channel toggle */}
                      <div className="flex gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => setVerificationChannel('sms')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                            verificationChannel === 'sms'
                              ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                              : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerificationChannel('whatsapp')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
                            verificationChannel === 'whatsapp'
                              ? 'border-[#25D366] bg-[#25D366]/5 text-[#25D366]'
                              : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WhatsApp
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative" data-country-dropdown>
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                          >
                            <span className="text-base">{countries[phoneCountry].flag}</span>
                            <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                            <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showCountryDropdown && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 min-w-[180px] max-h-[200px] overflow-y-auto">
                              {(Object.keys(countries) as CountryCode[]).map((code) => (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => {
                                    setPhoneCountry(code);
                                    setShowCountryDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 transition-colors text-sm ${phoneCountry === code ? 'bg-neutral-100' : ''}`}
                                >
                                  <span>{countries[code].flag}</span>
                                  <span className="text-neutral-600">{countries[code].phonePrefix}</span>
                                  <span className="text-neutral-400 text-xs">{countries[code].name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                          placeholder="555 123 456"
                          className="flex-1 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Password fields in a row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          {locale === "ka" ? "პაროლი" : "Password"} <span className="text-[#C4735B]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            placeholder={locale === "ka" ? "მინ. 6 სიმბოლო" : "Min. 6 chars"}
                            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-2 focus:ring-[#C4735B]/10 outline-none transition-all"
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
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          {locale === "ka" ? "გაიმეორე პაროლი" : "Repeat Password"} <span className="text-[#C4735B]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showRepeatPassword ? "text" : "password"}
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            placeholder={locale === "ka" ? "გაიმეორე" : "Repeat"}
                            className={`w-full px-3 py-2.5 pr-10 rounded-xl border bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:ring-2 outline-none transition-all ${
                              repeatPassword && formData.password !== repeatPassword
                                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                : repeatPassword && formData.password === repeatPassword
                                  ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
                                  : 'border-neutral-200 focus:border-[#C4735B] focus:ring-[#C4735B]/10'
                            }`}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showRepeatPassword ? (
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
                        {repeatPassword && formData.password !== repeatPassword && (
                          <p className="mt-1 text-xs text-red-500">
                            {locale === "ka" ? "პაროლები არ ემთხვევა" : "Passwords don't match"}
                          </p>
                        )}
                      </div>
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
                          <>ვეთანხმები <Link href="/terms" className="text-[#C4735B] hover:underline">პირობებს</Link> და <Link href="/privacy" className="text-[#C4735B] hover:underline">კონფიდენციალურობას</Link></>
                        ) : (
                          <>I agree to <Link href="/terms" className="text-[#C4735B] hover:underline">Terms</Link> & <Link href="/privacy" className="text-[#C4735B] hover:underline">Privacy</Link></>
                        )}
                      </span>
                    </label>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !canProceedFromAccount()}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C4735B] to-[#B8694F] hover:from-[#B8694F] hover:to-[#A85D47] disabled:from-neutral-200 disabled:to-neutral-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C4735B]/20 disabled:shadow-none"
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

                  {/* Footer links */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => setShowTypeSelection(true)}
                      className="text-xs text-neutral-500 hover:text-[#C4735B] transition-colors"
                    >
                      ← {locale === "ka" ? "სხვა ტიპით" : "Other type"}
                    </button>
                    <p className="text-xs text-neutral-500">
                      {locale === "ka" ? "უკვე გაქვს ანგარიში?" : "Have account?"}{" "}
                      <button onClick={() => openLoginModal()} className="text-[#C4735B] font-medium hover:underline">
                        {locale === "ka" ? "შესვლა" : "Log in"}
                      </button>
                    </p>
                  </div>
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
    <>
      {/* Avatar Cropper Modal */}
      {showAvatarCropper && rawAvatarImage && (
        <AvatarCropper
          image={rawAvatarImage}
          onCropComplete={handleCroppedAvatar}
          onCancel={handleCropCancel}
          locale={locale}
        />
      )}

      <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header with progress */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-12 flex items-center justify-between">
            <Logo />
            <Link href="/help" className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors">
              {locale === "ka" ? "დახმარება" : "Help"}
            </Link>
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

              {/* Avatar Upload - REQUIRED */}
              <div className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 transition-all ${
                uploadedAvatarUrl
                  ? 'border-emerald-500/50'
                  : 'border-[#C4735B] ring-4 ring-[#C4735B]/10'
              }`}>
                <div className="relative">
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className={`w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-dashed transition-all ${
                      avatarPreview
                        ? 'border-transparent'
                        : 'border-[#C4735B] hover:border-[#A85D47]'
                    }`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#C4735B]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                  {avatarPreview && !avatarUploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={avatarInputRef}
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
                      <span className="text-red-500 ml-1">*</span>
                    </h3>
                    {uploadedAvatarUrl ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                        {locale === "ka" ? "ატვირთულია" : "Uploaded"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-[10px] font-medium">
                        {locale === "ka" ? "სავალდებულო" : "Required"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {locale === "ka" ? "კლიენტები უფრო ენდობიან ფოტოიან პროფილებს" : "Clients trust profiles with photos more"}
                  </p>
                  {!avatarPreview && (
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-[#C4735B] text-white text-xs font-medium hover:bg-[#A85D47] transition-colors"
                    >
                      {locale === "ka" ? "ფოტოს ატვირთვა" : "Upload photo"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "სრული სახელი" : "Full Name"} <span className="text-[#C4735B]">*</span>
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
                      {locale === "ka"
                        ? `${verificationChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ნომერი`
                        : `${verificationChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} Number`} <span className="text-[#C4735B]">*</span>
                    </label>

                    {/* Channel selection toggle */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setVerificationChannel('sms')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          verificationChannel === 'sms'
                            ? 'border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerificationChannel('whatsapp')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          verificationChannel === 'whatsapp'
                            ? 'border-[#25D366] bg-[#25D366]/5 text-[#25D366]'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative" data-country-dropdown>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors flex-shrink-0"
                        >
                          <span className="text-sm">{countries[phoneCountry].flag}</span>
                          <span className="text-xs text-neutral-600">{countries[phoneCountry].phonePrefix}</span>
                          <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[200px] overflow-y-auto">
                            {(Object.keys(countries) as CountryCode[]).map((code) => (
                              <button
                                key={code}
                                type="button"
                                onClick={() => {
                                  setPhoneCountry(code);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 transition-colors ${phoneCountry === code ? 'bg-neutral-100' : ''}`}
                              >
                                <span className="text-sm">{countries[code].flag}</span>
                                <span className="text-xs text-neutral-600">{countries[code].phonePrefix}</span>
                                <span className="text-xs text-neutral-500">{countries[code].name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, ""))}
                        placeholder={verificationChannel === 'whatsapp' ? "WhatsApp 555 123 456" : "555 123 456"}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      {locale === "ka" ? "პაროლი" : "Password"} <span className="text-[#C4735B]">*</span>
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
                  1. {locale === "ka" ? "კატეგორია" : "Category"} <span className="text-[#C4735B]">*</span>
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

              {/* Custom Services - User can add up to 5 - Only show after category is selected */}
              {formData.selectedCategories.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      3. {locale === "ka" ? "სერვისები" : "Services"}
                      <span className="text-neutral-400 font-normal text-[10px]">({locale === "ka" ? "არასავალდებულო" : "optional"})</span>
                    </h2>
                    {customServices.length > 0 && (
                      <span className="text-xs text-[#C4735B] font-medium">
                        {customServices.length}/5
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-500 mb-3">
                    {locale === "ka"
                      ? "ჩაწერე რა სერვისებს სთავაზობ კლიენტებს (მაქს. 5)"
                      : "Write what services you offer to clients (max 5)"}
                  </p>

                  {/* Added custom services */}
                  {customServices.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {customServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-[#C4735B]/5 border border-[#C4735B]/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C4735B] flex-shrink-0" />
                          <span className="flex-1 text-sm text-neutral-900">{service}</span>
                          <button
                            onClick={() => setCustomServices(prev => prev.filter((_, i) => i !== index))}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new service input */}
                  {customServices.length < 5 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomService}
                        onChange={(e) => setNewCustomService(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCustomService.trim()) {
                            e.preventDefault();
                            setCustomServices(prev => [...prev, newCustomService.trim()]);
                            setNewCustomService('');
                          }
                        }}
                        placeholder={locale === "ka" ? "მაგ: ინტერიერის დიზაინი" : "e.g: Interior design"}
                        className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:border-[#C4735B] focus:ring-1 focus:ring-[#C4735B]/10 outline-none transition-all"
                      />
                      <button
                        onClick={() => {
                          if (newCustomService.trim()) {
                            setCustomServices(prev => [...prev, newCustomService.trim()]);
                            setNewCustomService('');
                          }
                        }}
                        disabled={!newCustomService.trim()}
                        className="px-3 py-2 rounded-lg bg-[#C4735B] text-white text-sm font-medium hover:bg-[#A85D47] disabled:bg-neutral-200 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Portfolio (Projects Only) */}
          {currentStep === 'services' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-neutral-900 mb-1">
                  {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
                </h1>
                <p className="text-sm text-neutral-500">
                  {locale === "ka" ? "აჩვენე შენი ნამუშევრები (მინიმუმ 1 პროექტი სავალდებულოა)" : "Showcase your work (minimum 1 project required)"}
                </p>
              </div>

              {/* Required notice */}
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-700">
                  {locale === "ka" ? "მინიმუმ 1 პროექტი სავალდებულოა რეგისტრაციისთვის" : "At least 1 project is required to complete registration"}
                </p>
              </div>

              {/* Portfolio Projects Section */}
              <div className={`p-4 rounded-xl bg-white border-2 transition-all ${
                portfolioProjects.length > 0 && portfolioProjects.some(p => p.images.length > 0)
                  ? 'border-emerald-500/50'
                  : 'border-[#C4735B] ring-4 ring-[#C4735B]/10'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#C4735B]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {locale === "ka" ? "პროექტები" : "Projects"}
                      <span className="text-[#C4735B]">*</span>
                    </h2>
                    {portfolioProjects.length > 0 && portfolioProjects.some(p => p.images.length > 0) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                        {locale === "ka" ? "შევსებულია" : "Completed"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-[10px] font-medium">
                        {locale === "ka" ? "სავალდებულო" : "Required"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={addPortfolioProject}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C4735B] text-white text-xs font-medium hover:bg-[#A85D47] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {locale === "ka" ? "დამატება" : "Add"}
                  </button>
                </div>

                {portfolioProjects.length === 0 ? (
                  <div
                    onClick={addPortfolioProject}
                    className="border-2 border-dashed border-[#C4735B]/30 rounded-xl p-6 text-center hover:border-[#C4735B]/50 hover:bg-[#C4735B]/5 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#C4735B]/10 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-neutral-900 mb-1">
                      {locale === "ka" ? "დაამატე პირველი პროექტი" : "Add your first project"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {locale === "ka" ? "აჩვენე შენი ნამუშევრები" : "Showcase your work"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {portfolioProjects.map((project, index) => (
                      <div key={project.id} className="p-3 rounded-xl bg-[#C4735B]/5 border border-[#C4735B]/10">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={project.title}
                              onChange={(e) => updatePortfolioProject(project.id, 'title', e.target.value)}
                              placeholder={locale === "ka" ? `პროექტი ${index + 1}` : `Project ${index + 1}`}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#C4735B]/20 bg-white text-xs font-medium focus:border-[#C4735B] outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removePortfolioProject(project.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <textarea
                          value={project.description}
                          onChange={(e) => updatePortfolioProject(project.id, 'description', e.target.value)}
                          placeholder={locale === "ka" ? "აღწერა (არასავალდებულო)" : "Description (optional)"}
                          rows={2}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-[#C4735B]/20 bg-white text-xs resize-none focus:border-[#C4735B] outline-none mb-2"
                        />

                        {/* Uploaded images preview */}
                        {project.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {project.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={img}
                                  alt={`Project ${index + 1} image ${imgIndex + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-[#C4735B]/20"
                                />
                                <button
                                  onClick={() => removeProjectImage(project.id, imgIndex)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload area */}
                        <label className="block border-2 border-dashed border-[#C4735B]/20 rounded-lg p-3 text-center hover:border-[#C4735B]/40 hover:bg-[#C4735B]/5 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => handleProjectImageUpload(project.id, e.target.files)}
                            className="hidden"
                          />
                          <svg className="w-5 h-5 text-[#C4735B]/50 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <p className="text-[10px] text-neutral-500">
                            {project.images.length > 0
                              ? (locale === "ka" ? "დაამატე მეტი ფოტო" : "Add more photos")
                              : (locale === "ka" ? "ატვირთე ფოტოები" : "Upload photos")}
                          </p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">JPG, PNG, WebP · 5MB</p>
                        </label>
                      </div>
                    ))}

                    {/* Add more projects button */}
                    <button
                      onClick={addPortfolioProject}
                      className="w-full p-3 rounded-xl border-2 border-dashed border-[#C4735B]/20 text-[#C4735B] text-xs font-medium hover:border-[#C4735B]/40 hover:bg-[#C4735B]/5 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {locale === "ka" ? "კიდევ ერთი პროექტი" : "Add another project"}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-400 text-center">
                {locale === "ka"
                  ? "ეს ინფორმაცია შეგიძლია მოგვიანებით შეცვალო პროფილის პარამეტრებში"
                  : "You can update this information later in your profile settings"}
              </p>
            </div>
          )}

          {/* STEP 4: Review - Profile Preview */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              {/* Profile Card Preview */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDF8F6] to-[#FAF5F2] p-6 lg:p-8 border border-[#C4735B]/20">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4735B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C4735B]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative">
                  {/* Header label */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 rounded-full bg-[#C4735B]/10 text-[10px] font-medium text-[#C4735B] uppercase tracking-wider">
                      {locale === "ka" ? "პროფილის გადახედვა" : "Profile Preview"}
                    </span>
                    <button
                      onClick={() => goToStep('account')}
                      className="px-3 py-1 rounded-full bg-[#C4735B]/10 hover:bg-[#C4735B]/20 text-[10px] font-medium text-[#C4735B] transition-all"
                    >
                      {locale === "ka" ? "რედაქტირება" : "Edit Profile"}
                    </button>
                  </div>

                  {/* Profile info */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Avatar */}
                    <div className="relative group">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-[#C4735B]/20 shadow-lg">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#C4735B] to-[#A85D47] flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {formData.fullName?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-[#FDF8F6] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
                        {formData.fullName || (locale === "ka" ? "თქვენი სახელი" : "Your Name")}
                      </h2>
                      {formData.city && (
                        <p className="text-neutral-500 text-sm mb-3">
                          {formData.city}
                        </p>
                      )}

                      {/* Categories as tags */}
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {formData.selectedCategories.slice(0, 3).map(catKey => {
                          const category = categories.find(c => c.key === catKey);
                          return (
                            <span
                              key={catKey}
                              className="px-3 py-1 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-xs font-medium"
                            >
                              {locale === "ka" ? category?.nameKa : category?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Stats row - show projects and services/skills count */}
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#C4735B]/10">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-neutral-900">{portfolioProjects.filter(p => p.images.length > 0).length}</p>
                      <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                        {locale === "ka" ? "პროექტი" : "Projects"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-neutral-900">{customServices.length}</p>
                      <p className="text-[11px] text-neutral-500 uppercase tracking-wider">
                        {locale === "ka" ? "სერვისი" : "Services"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Gallery */}
              {portfolioProjects.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#C4735B]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#C4735B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {locale === "ka" ? "პორტფოლიო" : "Portfolio"}
                    </h3>
                    <button onClick={() => goToStep('services')} className="text-xs font-medium text-[#C4735B] hover:underline">
                      {locale === "ka" ? "რედაქტირება" : "Edit"}
                    </button>
                  </div>

                  {/* Projects Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolioProjects.map((project) => (
                      <div key={project.id} className="group relative">
                        {project.images.length > 0 ? (
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100">
                            <img
                              src={project.images[0]}
                              alt={project.title || 'Project'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm font-medium truncate">
                                  {project.title || (locale === "ka" ? "უსათაურო" : "Untitled")}
                                </p>
                                {project.images.length > 1 && (
                                  <p className="text-white/60 text-xs mt-0.5">
                                    +{project.images.length - 1} {locale === "ka" ? "ფოტო" : "more"}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Image count badge */}
                            {project.images.length > 1 && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                                {project.images.length}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-xl bg-neutral-100 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-8 h-8 text-neutral-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-xs text-neutral-400">{locale === "ka" ? "ფოტო არ არის" : "No image"}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Contact Info */}
                <div className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-[#C4735B]/30 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {locale === "ka" ? "საკონტაქტო" : "Contact"}
                    </h3>
                    <button onClick={() => goToStep('account')} className="text-[10px] font-medium text-[#C4735B] hover:underline">
                      {locale === "ka" ? "შეცვლა" : "Change"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-400">{locale === "ka" ? "ტელეფონი" : "Phone"}</p>
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {countries[phoneCountry].phonePrefix}{formData.phone || '-'}
                        </p>
                      </div>
                    </div>
                    {formData.email && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-400">{locale === "ka" ? "ელ-ფოსტა" : "Email"}</p>
                          <p className="text-sm font-medium text-neutral-900 truncate">{formData.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services List - Show if there are custom services */}
                {customServices.length > 0 && (
                  <div className="p-4 rounded-xl bg-white border border-neutral-200 hover:border-[#C4735B]/30 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        {locale === "ka" ? "სერვისები" : "Services"}
                      </h3>
                      <button onClick={() => goToStep('category')} className="text-[10px] font-medium text-[#C4735B] hover:underline">
                        {locale === "ka" ? "შეცვლა" : "Change"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {customServices.map((service, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[#C4735B]/10 text-[#C4735B] text-xs font-medium"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                (currentStep === 'category' && !canProceedFromCategory()) ||
                (currentStep === 'services' && !canProceedFromServices())
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
    </>
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

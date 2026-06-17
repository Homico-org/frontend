'use client';

import { useAuth } from '@/contexts/AuthContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { trackPixel } from '@/utils/metaPixel';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { SelectedService } from '../steps/StepSelectServices';

// Simplified Pro registration flow: Phone → Profile → Services → Complete
export type ProRegistrationStep = 'phone' | 'profile' | 'services' | 'complete';
export type VerificationChannel = 'sms' | 'whatsapp';

export interface UseProRegistrationReturn {
  // Navigation
  currentStep: ProRegistrationStep;
  goToStep: (step: ProRegistrationStep) => void;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  
  // Phone verification
  phone: string;
  setPhone: (value: string) => void;
  phoneCountry: CountryCode;
  setPhoneCountry: (code: CountryCode) => void;
  verificationChannel: VerificationChannel;
  setVerificationChannel: (channel: VerificationChannel) => void;
  showOtp: boolean;
  setShowOtp: (show: boolean) => void;
  otp: string;
  setOtp: (value: string) => void;
  sendOtp: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendTimer: number;
  
  // Profile
  fullName: string;
  setFullName: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  avatarPreview: string | null;
  setAvatarPreview: (url: string | null) => void;
  avatarUploading: boolean;
  uploadedAvatarUrl: string | null;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarRemove: () => void;
  showAvatarCropper: boolean;
  rawAvatarImage: string | null;
  handleCroppedAvatar: (croppedBlob: Blob) => Promise<void>;
  handleCropCancel: () => void;
  
  // Services
  selectedServices: SelectedService[];
  setSelectedServices: (services: SelectedService[]) => void;
  
  // UI State
  isLoading: boolean;
  error: string;
  setError: (error: string) => void;
  
  // Completion
  submitRegistration: () => Promise<void>;
  onGoToProfile: () => void;
  onGoToDashboard: () => void;
  
  // Utils
  locale: 'en' | 'ka' | 'ru';
  canProceedFromProfile: () => boolean;
  canProceedFromServices: () => boolean;
}

export function useProRegistration(): UseProRegistrationReturn {
  const router = useRouter();
  const { login } = useAuth();
  const { country, locale, pick } = useLanguage();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<ProRegistrationStep>('phone');
  
  // Store registered user ID for profile navigation
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  
  // Phone state
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [verificationChannel, setVerificationChannel] = useState<VerificationChannel>('sms');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  
  // Services state
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  // Send OTP
  const sendOtp = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const fullPhone = `${countries[phoneCountry]?.phonePrefix || '+995'}${phone}`;

      // Check if phone is already registered
      const phoneCheck = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(fullPhone)}`
      ).then(r => r.json());

      if (phoneCheck.exists) {
        setError(pick({ en: 'This phone number is already registered', ka: 'ეს ტელეფონის ნომერი უკვე რეგისტრირებულია' }));
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          identifier: fullPhone,
          channel: verificationChannel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send OTP');
      }

      setShowOtp(true);
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }, [phone, phoneCountry, verificationChannel, pick]);
  
  // Verify OTP
  const verifyOtp = useCallback(async (code: string) => {
    setIsLoading(true);
    setError('');
    try {
      const fullPhone = `${countries[phoneCountry]?.phonePrefix || '+995'}${phone}`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          identifier: fullPhone,
          code,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid code');
      }
      
      setPhoneVerified(true);
      setCurrentStep('profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [phone, phoneCountry]);
  
  // Avatar handling
  const handleAvatarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(pick({
        en: 'Image must be under 10MB.',
        ka: 'სურათი უნდა იყოს 10MB-ზე ნაკლები.',
        ru: 'Изображение должно быть меньше 10 МБ.',
      }));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setRawAvatarImage(reader.result as string);
      setShowAvatarCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [pick]);
  
  const handleCroppedAvatar = useCallback(async (croppedBlob: Blob) => {
    setShowAvatarCropper(false);
    setAvatarUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setUploadedAvatarUrl(data.url);
      setAvatarPreview(data.url);
    } catch (err) {
      setError(pick({
        en: 'Photo upload failed. Please try again.',
        ka: 'ფოტოს ატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.',
        ru: 'Не удалось загрузить фото. Попробуйте ещё раз.',
      }));
    } finally {
      setAvatarUploading(false);
      setRawAvatarImage(null);
    }
  }, [pick]);

  const handleCropCancel = useCallback(() => {
    setShowAvatarCropper(false);
    setRawAvatarImage(null);
  }, []);
  
  const handleAvatarRemove = useCallback(() => {
    setAvatarPreview(null);
    setUploadedAvatarUrl(null);
  }, []);
  
  // Validation — name is collected later in /pro/profile-setup/about
  // (split into firstName + lastName), so it's no longer required here.
  const canProceedFromProfile = useCallback(() => {
    const hasValidCity = city.trim().length >= 2;
    const hasAvatar = !!uploadedAvatarUrl;
    const hasValidPassword = password.length >= 6;
    const passwordsMatch = password === confirmPassword;
    return hasValidCity && hasAvatar && hasValidPassword && passwordsMatch;
  }, [city, uploadedAvatarUrl, password, confirmPassword]);
  
  const canProceedFromServices = useCallback(() => {
    return selectedServices.length > 0;
  }, [selectedServices]);
  
  // Navigation
  const goToStep = useCallback((step: ProRegistrationStep) => {
    setCurrentStep(step);
    setError('');
  }, []);
  
  // Submit registration (defined before handleNext to avoid hoisting issues)
  const submitRegistration = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const fullPhone = `${countries[phoneCountry]?.phonePrefix || '+995'}${phone}`;
      
      // Derive categories from selected services
      const selectedCategories = [...new Set(selectedServices.map(s => s.categoryKey))];
      const selectedSubcategories = selectedServices.map(s => s.key);
      
      // Backend requires non-empty `name` on registration. We no longer
      // collect it on this screen (it's split into first/last name in
      // /pro/profile-setup/about), so fall back to the phone number as a
      // placeholder. profile-setup will overwrite it with the real value.
      const placeholderName = fullName.trim() || fullPhone;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          name: placeholderName,
          city: city.trim(),
          avatar: uploadedAvatarUrl,
          role: 'pro',
          password: password,
          // Categories + subcategories are now collected later in
          // /pro/profile-setup/services with full per-service pricing detail.
          // Send empty arrays here — pre-filling them at registration was
          // duplicate work since profile-setup overwrites with structured data.
          selectedCategories,
          selectedSubcategories,
          isPhoneVerified: true,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        const msg = data.message || 'Registration failed';
        // Translate known backend errors
        if (msg.includes('phone number already exists')) {
          throw new Error(pick({ en: 'This phone number is already registered', ka: 'ეს ტელეფონის ნომერი უკვე რეგისტრირებულია' }));
        }
        if (msg.includes('email already exists')) {
          throw new Error(pick({ en: 'This email is already registered', ka: 'ეს ელ-ფოსტა უკვე რეგისტრირებულია' }));
        }
        throw new Error(msg);
      }

      const data = await response.json();

      // Login the user
      if (data.access_token && data.user) {
        login(data.access_token, data.user);
        // Store user ID for profile navigation
        setRegisteredUserId(data.user._id || data.user.id);
        // Meta Pixel: account created = registration complete. Fires here (at
        // signup) rather than at pro profile-setup completion, since most
        // sign-ups never finish the full multi-step profile.
        trackPixel("CompleteRegistration");
      }

      // Skip the celebration step — drop the user straight into profile-setup
      // so they can fill the structured fields (firstName + lastName, areas,
      // services with pricing, portfolio) without an interim screen.
      router.push('/pro/profile-setup/about');
    } catch (err) {
      setError(err instanceof Error ? err.message : pick({ en: 'Registration failed', ka: 'რეგისტრაცია ვერ მოხერხდა' }));
    } finally {
      setIsLoading(false);
    }
  }, [phone, phoneCountry, fullName, city, password, uploadedAvatarUrl, selectedServices, login, pick, router]);
  
  const handleNext = useCallback(async () => {
    setError('');

    switch (currentStep) {
      case 'phone':
        // Phone verification handled by sendOtp/verifyOtp
        break;
      case 'profile':
        // Submit registration directly — services + categories are collected
        // later in /pro/profile-setup/services with structured per-service
        // pricing. submitRegistration handles the redirect.
        if (canProceedFromProfile()) {
          await submitRegistration();
        }
        break;
    }
  }, [currentStep, canProceedFromProfile, submitRegistration]);
  
  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'profile':
        setCurrentStep('phone');
        setShowOtp(false);
        break;
      case 'services':
        setCurrentStep('profile');
        break;
      case 'complete':
        // Can't go back from complete
        break;
    }
  }, [currentStep]);
  
  // Completion handlers
  const onGoToProfile = useCallback(() => {
    // Navigate to profile setup since the profile isn't complete yet
    // After completing profile setup, user will be redirected to their public profile
    router.push('/pro/profile-setup');
  }, [router]);
  
  const onGoToDashboard = useCallback(() => {
    router.push('/pro/dashboard');
  }, [router]);
  
  return {
    // Navigation
    currentStep,
    goToStep,
    handleNext,
    handleBack,
    
    // Phone
    phone,
    setPhone,
    phoneCountry,
    setPhoneCountry,
    verificationChannel,
    setVerificationChannel,
    showOtp,
    setShowOtp,
    otp,
    setOtp,
    sendOtp,
    verifyOtp,
    resendTimer,
    
    // Profile
    fullName,
    setFullName,
    city,
    setCity,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    avatarPreview,
    setAvatarPreview,
    avatarUploading,
    uploadedAvatarUrl,
    handleAvatarSelect,
    handleAvatarRemove,
    showAvatarCropper,
    rawAvatarImage,
    handleCroppedAvatar,
    handleCropCancel,
    
    // Services
    selectedServices,
    setSelectedServices,
    
    // UI
    isLoading,
    error,
    setError,
    
    // Completion
    submitRegistration,
    onGoToProfile,
    onGoToDashboard,
    
    // Utils
    locale: locale as 'en' | 'ka' | 'ru',
    canProceedFromProfile,
    canProceedFromServices,
  };
}

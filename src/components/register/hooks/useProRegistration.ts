'use client';

import { useAuth } from '@/contexts/AuthContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
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
  const { country, locale } = useLanguage();
  
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
  }, [phone, phoneCountry, verificationChannel]);
  
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
      setError('Image must be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setRawAvatarImage(reader.result as string);
      setShowAvatarCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);
  
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
      setError('Failed to upload image');
    } finally {
      setAvatarUploading(false);
      setRawAvatarImage(null);
    }
  }, []);
  
  const handleCropCancel = useCallback(() => {
    setShowAvatarCropper(false);
    setRawAvatarImage(null);
  }, []);
  
  const handleAvatarRemove = useCallback(() => {
    setAvatarPreview(null);
    setUploadedAvatarUrl(null);
  }, []);
  
  // Validation
  const canProceedFromProfile = useCallback(() => {
    const hasValidName = fullName.trim().length >= 2;
    const hasValidCity = city.trim().length >= 2;
    const hasAvatar = !!uploadedAvatarUrl;
    const hasValidPassword = password.length >= 6;
    const passwordsMatch = password === confirmPassword;
    return hasValidName && hasValidCity && hasAvatar && hasValidPassword && passwordsMatch;
  }, [fullName, city, uploadedAvatarUrl, password, confirmPassword]);
  
  const canProceedFromServices = useCallback(() => {
    return selectedServices.length > 0;
  }, [selectedServices]);
  
  // Navigation
  const goToStep = useCallback((step: ProRegistrationStep) => {
    setCurrentStep(step);
    setError('');
  }, []);
  
  const handleNext = useCallback(async () => {
    setError('');
    
    switch (currentStep) {
      case 'phone':
        // Phone verification handled by sendOtp/verifyOtp
        break;
      case 'profile':
        if (canProceedFromProfile()) {
          setCurrentStep('services');
        }
        break;
      case 'services':
        if (canProceedFromServices()) {
          await submitRegistration();
        }
        break;
    }
  }, [currentStep, canProceedFromProfile, canProceedFromServices, submitRegistration]);
  
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
  
  // Submit registration
  const submitRegistration = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const fullPhone = `${countries[phoneCountry]?.phonePrefix || '+995'}${phone}`;
      
      // Derive categories from selected services
      const selectedCategories = [...new Set(selectedServices.map(s => s.categoryKey))];
      const selectedSubcategories = selectedServices.map(s => s.key);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          name: fullName.trim(),
          city: city.trim(),
          avatar: uploadedAvatarUrl,
          role: 'pro',
          password: password,
          selectedCategories,
          selectedSubcategories,
          isPhoneVerified: true,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      // Login the user
      if (data.access_token && data.user) {
        login(data.access_token, data.user);
        // Store user ID for profile navigation
        setRegisteredUserId(data.user._id || data.user.id);
      }
      
      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, [phone, phoneCountry, fullName, city, password, uploadedAvatarUrl, selectedServices, login]);
  
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

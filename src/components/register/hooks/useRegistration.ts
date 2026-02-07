'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useCategories } from '@/contexts/CategoriesContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { AnalyticsEvent, useAnalytics } from '@/hooks/useAnalytics';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// Step configuration
export type RegistrationStep = 'account' | 'category' | 'services' | 'review';
export type AuthMethod = 'mobile';
export type VerificationChannel = 'sms' | 'whatsapp';

export interface StepConfig {
  id: RegistrationStep;
  title: { en: string; ka: string };
  subtitle: { en: string; ka: string };
}

export const PRO_STEPS: StepConfig[] = [
  { id: 'account', title: { en: 'Create Account', ka: 'ანგარიშის შექმნა' }, subtitle: { en: 'Your basic information', ka: 'ძირითადი ინფორმაცია' } },
  { id: 'category', title: { en: 'Services', ka: 'სერვისები' }, subtitle: { en: 'What services do you provide?', ka: 'რა სერვისებს გთავაზობთ?' } },
  { id: 'services', title: { en: 'Portfolio', ka: 'პორტფოლიო' }, subtitle: { en: 'Showcase your expertise', ka: 'აჩვენე შენი გამოცდილება' } },
  { id: 'review', title: { en: 'Review', ka: 'გადახედვა' }, subtitle: { en: 'Confirm your details', ka: 'დაადასტურე შენი მონაცემები' } },
];

export interface FormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  selectedCategories: string[];
  selectedSubcategories: string[];
  whatsapp: string;
  telegram: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  beforeAfterPairs: Array<{ id: string; beforeImage: string; afterImage: string }>;
}

export interface UseRegistrationReturn {
  // Router & Context
  router: ReturnType<typeof useRouter>;
  locale: 'en' | 'ka' | 'ru';
  country: string;
  categories: ReturnType<typeof useCategories>['categories'];
  openLoginModal: () => void;
  
  // Auth state
  authLoading: boolean;
  isAuthenticated: boolean;
  user: any;
  
  // Step state
  currentStep: RegistrationStep;
  setCurrentStep: (step: RegistrationStep) => void;
  userType: 'client' | 'pro';
  setUserType: (type: 'client' | 'pro') => void;
  showTypeSelection: boolean;
  setShowTypeSelection: (show: boolean) => void;
  
  // Auth method
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  
  // Form data
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleInputChange: (field: string, value: string) => void;
  
  // Password
  repeatPassword: string;
  setRepeatPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showRepeatPassword: boolean;
  setShowRepeatPassword: (show: boolean) => void;
  
  // Avatar (Pro)
  avatarPreview: string | null;
  setAvatarPreview: (url: string | null) => void;
  avatarUploading: boolean;
  uploadedAvatarUrl: string | null;
  setUploadedAvatarUrl: (url: string | null) => void;
  showAvatarCropper: boolean;
  setShowAvatarCropper: (show: boolean) => void;
  rawAvatarImage: string | null;
  setRawAvatarImage: (url: string | null) => void;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCroppedAvatar: (croppedBlob: Blob) => Promise<void>;
  handleCropCancel: () => void;
  removeAvatar: () => void;
  
  // Client avatar
  clientAvatarIndex: number;
  clientCustomAvatar: string | null;
  setClientCustomAvatar: (url: string | null) => void;
  clientAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  getClientAvatarUrl: () => string;
  shuffleClientAvatar: () => void;
  handleClientAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Phone & Country
  phoneCountry: CountryCode;
  setPhoneCountry: (code: CountryCode) => void;
  showCountryDropdown: boolean;
  setShowCountryDropdown: (show: boolean) => void;
  
  // Verification
  verificationChannel: VerificationChannel;
  setVerificationChannel: (channel: VerificationChannel) => void;
  showVerification: boolean;
  setShowVerification: (show: boolean) => void;
  phoneOtp: string[];
  setPhoneOtp: React.Dispatch<React.SetStateAction<string[]>>;
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  resendTimer: number;
  sendOtp: (channel?: VerificationChannel) => Promise<void>;
  verifyOtp: (otpCode?: string) => Promise<void>;
  
  // Categories
  handleCategoryToggle: (categoryKey: string) => void;
  handleSubcategoryToggle: (subcategoryKey: string) => void;
  
  // Services
  customServices: string[];
  setCustomServices: React.Dispatch<React.SetStateAction<string[]>>;
  newCustomService: string;
  setNewCustomService: (value: string) => void;
  
  // Portfolio
  portfolioProjects: PortfolioProject[];
  setPortfolioProjects: React.Dispatch<React.SetStateAction<PortfolioProject[]>>;
  addPortfolioProject: () => void;
  updatePortfolioProject: (id: string, field: string, value: string | string[]) => void;
  removePortfolioProject: (id: string) => void;
  handleProjectImageUpload: (projectId: string, files: FileList | null) => void;
  removeProjectImage: (projectId: string, imageIndex: number) => void;
  handleProjectVideoUpload: (projectId: string, files: FileList | null) => void;
  removeProjectVideo: (projectId: string, videoIndex: number) => void;
  handleBeforeAfterUpload: (projectId: string, type: 'before' | 'after', file: File) => void;
  removeBeforeAfterPair: (projectId: string, pairId: string) => void;
  
  // UI state
  error: string;
  setError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  
  // Navigation
  getCurrentStepIndex: () => number;
  getProgressPercentage: () => number;
  canProceedFromAccount: () => boolean;
  canProceedFromCategory: () => boolean;
  canProceedFromServices: () => boolean;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  goToStep: (step: RegistrationStep) => void;
  
  // Submit
  submitRegistration: () => Promise<void>;
}

export function useRegistration(): UseRegistrationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { country, locale } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { categories } = useCategories();

  const isProRegistration = searchParams.get('common.type') === 'pro';

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('account');
  const [userType, setUserType] = useState<'client' | 'pro'>(isProRegistration ? 'pro' : 'client');
  const [showTypeSelection, setShowTypeSelection] = useState(!isProRegistration);

  // Auth method state
  const [authMethod, setAuthMethod] = useState<AuthMethod>('mobile');

  // Form data
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    selectedCategories: [],
    selectedSubcategories: [],
    whatsapp: '',
    telegram: '',
  });

  // Password
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Avatar (Pro)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Client avatar
  const AVATAR_COUNT = 19;
  const [clientAvatarIndex, setClientAvatarIndex] = useState<number>(() =>
    Math.floor(Math.random() * AVATAR_COUNT) + 1
  );
  const [clientCustomAvatar, setClientCustomAvatar] = useState<string | null>(null);
  const clientAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Phone & Country
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Verification
  const [verificationChannel, setVerificationChannel] = useState<VerificationChannel>('sms');
  const [showVerification, setShowVerification] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  // Services
  const [customServices, setCustomServices] = useState<string[]>([]);
  const [newCustomService, setNewCustomService] = useState('');

  // Portfolio
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);

  // UI state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Sync phone country with context
  useEffect(() => {
    setPhoneCountry(country as CountryCode);
  }, [country]);

  // Close country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCountryDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-country-dropdown]")) {
          setShowCountryDropdown(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCountryDropdown]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus OTP input
  useEffect(() => {
    if (showVerification) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showVerification]);

  // Redirect authenticated users (but not during active registration)
  useEffect(() => {
    // Skip redirect if user is in registration flow (type selection shown or pro registration in progress)
    if (showTypeSelection) {
      return;
    }
    
    // Skip redirect for pro users with incomplete profile on register page
    // They might be completing registration or viewing the success screen
    if (!authLoading && isAuthenticated && user) {
      // Only redirect if not a pro with incomplete profile
      // Pro users with incomplete profile should be able to stay on register page
      if (user.role === 'company') {
        router.replace('/company/jobs');
      } else if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'pro' && user.isProfileCompleted === true) {
        // Only redirect completed pro users
        router.replace('/jobs');
      } else if (user.role === 'client') {
        router.replace('/portfolio');
      }
      // Pro users with incomplete profile stay on register page
    }
  }, [authLoading, isAuthenticated, user, router, showTypeSelection]);

  // Handlers
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const getClientAvatarUrl = useCallback(() => {
    if (clientCustomAvatar) return clientCustomAvatar;
    return `https://res.cloudinary.com/dakcvkodo/image/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/homico/avatars/avatar-${clientAvatarIndex}.png`;
  }, [clientCustomAvatar, clientAvatarIndex]);

  const shuffleClientAvatar = useCallback(() => {
    setClientCustomAvatar(null);
    let newIndex = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    while (newIndex === clientAvatarIndex && AVATAR_COUNT > 1) {
      newIndex = Math.floor(Math.random() * AVATAR_COUNT) + 1;
    }
    setClientAvatarIndex(newIndex);
  }, [clientAvatarIndex]);

  const handleClientAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (response.ok) {
          const data = await response.json();
          setClientCustomAvatar(data.url);
        } else {
          setClientCustomAvatar(base64);
        }
      } catch {
        setClientCustomAvatar(base64);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAvatarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(locale === 'ka' ? 'მხოლოდ სურათები არის დაშვებული' : 'Only image files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(locale === 'ka' ? 'ფაილი ძალიან დიდია (მაქს. 10MB)' : 'File is too large (max 10MB)');
      return;
    }

    setError('');
    const imageUrl = URL.createObjectURL(file);
    setRawAvatarImage(imageUrl);
    setShowAvatarCropper(true);
  }, [locale]);

  const handleCroppedAvatar = useCallback(async (croppedBlob: Blob) => {
    setShowAvatarCropper(false);

    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }

    const previewUrl = URL.createObjectURL(croppedBlob);
    setAvatarPreview(previewUrl);

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
      if (data.url) {
        setUploadedAvatarUrl(data.url);
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(locale === 'ka' ? 'სურათის ატვირთვა ვერ მოხერხდა' : 'Failed to upload image');
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }, [rawAvatarImage, locale]);

  const handleCropCancel = useCallback(() => {
    setShowAvatarCropper(false);
    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }, [rawAvatarImage]);

  const removeAvatar = useCallback(() => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setUploadedAvatarUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  }, [avatarPreview]);

  // OTP functions
  const sendOtp = useCallback(async (channel: VerificationChannel = verificationChannel) => {
    const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, channel, type: 'phone' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send OTP');
      }

      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      throw err;
    }
  }, [verificationChannel, phoneCountry, formData.phone]);

  const verifyOtp = useCallback(async (otpCode?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const identifier = `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const code = otpCode || phoneOtp.join('');

      if (code.length !== 4) {
        throw new Error(locale === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი' : 'Please enter 4-digit code');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, type: 'phone' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid verification code');

      setShowVerification(false);
      await submitRegistration();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setPhoneOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [phoneCountry, formData.phone, phoneOtp, locale]);

  // Category handlers
  const handleCategoryToggle = useCallback((categoryKey: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedCategories.includes(categoryKey);
      if (isSelected) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter(c => c !== categoryKey),
          selectedSubcategories: prev.selectedSubcategories.filter(s => {
            const cat = categories.find(c => c.key === categoryKey);
            return !cat?.subcategories.some(sub => sub.key === s);
          }),
        };
      } else if (prev.selectedCategories.length < 3) {
        return {
          ...prev,
          selectedCategories: [...prev.selectedCategories, categoryKey],
        };
      }
      return prev;
    });
  }, [categories]);

  const handleSubcategoryToggle = useCallback((subcategoryKey: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedSubcategories.includes(subcategoryKey);
      return {
        ...prev,
        selectedSubcategories: isSelected
          ? prev.selectedSubcategories.filter(s => s !== subcategoryKey)
          : [...prev.selectedSubcategories, subcategoryKey],
      };
    });
  }, []);

  // Portfolio handlers
  const addPortfolioProject = useCallback(() => {
    setPortfolioProjects(prev => [...prev, {
      id: `project-${Date.now()}`,
      title: '',
      description: '',
      images: [],
      videos: [],
      beforeAfterPairs: [],
    }]);
  }, []);

  const updatePortfolioProject = useCallback((id: string, field: string, value: string | string[]) => {
    setPortfolioProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const removePortfolioProject = useCallback((id: string) => {
    setPortfolioProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleProjectImageUpload = useCallback((projectId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(locale === 'ka' ? 'მხოლოდ JPG, PNG ან WebP ფორმატი' : 'Only JPG, PNG or WebP allowed');
        return;
      }
      if (file.size > maxSize) {
        setError(locale === 'ka' ? 'ფაილი ძალიან დიდია (მაქს. 5MB)' : 'File too large (max 5MB)');
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
  }, [locale]);

  const removeProjectImage = useCallback((projectId: string, imageIndex: number) => {
    setPortfolioProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, images: p.images.filter((_, i) => i !== imageIndex) };
      }
      return p;
    }));
  }, []);

  const handleProjectVideoUpload = useCallback((projectId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxSize = 100 * 1024 * 1024;
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(locale === 'ka' ? 'მხოლოდ MP4, WebM ან MOV ფორმატი' : 'Only MP4, WebM or MOV allowed');
        return;
      }
      if (file.size > maxSize) {
        setError(locale === 'ka' ? 'ვიდეო ძალიან დიდია (მაქს. 100MB)' : 'Video too large (max 100MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPortfolioProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, videos: [...p.videos, base64] };
          }
          return p;
        }));
      };
      reader.readAsDataURL(file);
    });
  }, [locale]);

  const removeProjectVideo = useCallback((projectId: string, videoIndex: number) => {
    setPortfolioProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, videos: p.videos.filter((_, i) => i !== videoIndex) };
      }
      return p;
    }));
  }, []);

  const handleBeforeAfterUpload = useCallback((projectId: string, type: 'before' | 'after', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPortfolioProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const pairs = [...p.beforeAfterPairs];
          const lastPair = pairs[pairs.length - 1];
          
          if (type === 'before') {
            if (!lastPair || lastPair.afterImage) {
              pairs.push({ id: `pair-${Date.now()}`, beforeImage: base64, afterImage: '' });
            } else {
              pairs[pairs.length - 1] = { ...lastPair, beforeImage: base64 };
            }
          } else {
            if (lastPair && !lastPair.afterImage) {
              pairs[pairs.length - 1] = { ...lastPair, afterImage: base64 };
            }
          }
          
          return { ...p, beforeAfterPairs: pairs };
        }
        return p;
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const removeBeforeAfterPair = useCallback((projectId: string, pairId: string) => {
    setPortfolioProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, beforeAfterPairs: p.beforeAfterPairs.filter(pair => pair.id !== pairId) };
      }
      return p;
    }));
  }, []);

  // Navigation helpers
  const getCurrentStepIndex = useCallback(() => {
    if (userType === 'client') return 0;
    return PRO_STEPS.findIndex(s => s.id === currentStep);
  }, [userType, currentStep]);

  const getProgressPercentage = useCallback(() => {
    if (userType === 'client') return 100;
    const index = getCurrentStepIndex();
    return ((index + 1) / PRO_STEPS.length) * 100;
  }, [userType, getCurrentStepIndex]);

  const canProceedFromAccount = useCallback((): boolean => {
    const hasAvatar = userType === 'pro' ? !!uploadedAvatarUrl : true;
    const passwordsMatch = userType === 'client' ? formData.password === repeatPassword : true;
    return Boolean(formData.fullName.trim()) && formData.password.length >= 6 && Boolean(formData.phone) && agreedToTerms && hasAvatar && passwordsMatch;
  }, [userType, uploadedAvatarUrl, formData, repeatPassword, agreedToTerms]);

  const canProceedFromCategory = useCallback(() => {
    return formData.selectedCategories.length > 0 && formData.selectedSubcategories.length > 0;
  }, [formData.selectedCategories, formData.selectedSubcategories]);

  const canProceedFromServices = useCallback(() => {
    return portfolioProjects.length > 0 && portfolioProjects.some(p => p.images.length > 0 || p.videos.length > 0 || p.beforeAfterPairs.length > 0);
  }, [portfolioProjects]);

  const goToStep = useCallback((step: RegistrationStep) => {
    setCurrentStep(step);
  }, []);

  const handleBack = useCallback(() => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(PRO_STEPS[stepIndex - 1].id);
    }
  }, [getCurrentStepIndex]);

  const submitRegistration = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const proFields = userType === 'pro' ? {
        avatar: uploadedAvatarUrl,
        selectedCategories: formData.selectedCategories,
        selectedSubcategories: formData.selectedSubcategories,
        customServices: customServices.length > 0 ? customServices : undefined,
        portfolioProjects: portfolioProjects.filter(p => p.images.length > 0 || p.videos.length > 0 || p.beforeAfterPairs.length > 0).map(p => ({
          title: p.title,
          description: p.description,
          images: p.images,
          videos: p.videos,
          beforeAfterPairs: p.beforeAfterPairs,
        })),
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
      } : {};

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email || undefined,
          password: formData.password,
          phone: `${countries[phoneCountry].phonePrefix}${formData.phone}`,
          role: userType,
          city: formData.city || undefined,
          isPhoneVerified: true,
          avatar: userType === 'client' ? getClientAvatarUrl() : undefined,
          ...proFields,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      login(data.access_token, data.user);
      trackEvent(
        data.user.role === 'pro' ? AnalyticsEvent.REGISTER_PRO : AnalyticsEvent.REGISTER_CLIENT,
        { userRole: data.user.role, authMethod }
      );

      localStorage.setItem('homi_last_auth_method', 'mobile');
      localStorage.setItem('homi_last_auth_identifier', `${countries[phoneCountry].phonePrefix}${formData.phone}`);

      if (data.user.role === 'pro') {
        sessionStorage.setItem('proRegistrationData', JSON.stringify({
          categories: formData.selectedCategories,
          subcategories: formData.selectedSubcategories,
          customServices: customServices.length > 0 ? customServices : undefined,
          portfolioProjects: portfolioProjects.filter(p => p.images.length > 0 || p.videos.length > 0 || p.beforeAfterPairs.length > 0),
        }));
        router.push('/pro/profile-setup');
      } else {
        router.push('/portfolio');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userType, formData, customServices, portfolioProjects, phoneCountry, uploadedAvatarUrl, getClientAvatarUrl, authMethod, login, trackEvent, router]);

  const handleNext = useCallback(async () => {
    setError('');

    if (userType === 'client') {
      // Client registration - submit directly after OTP
      setIsLoading(true);
      try {
        // Check if phone/email exists
        const phoneCheck = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`
        ).then(r => r.json());

        if (phoneCheck.exists) {
          setError(locale === 'ka' ? 'ეს ტელეფონის ნომერი უკვე რეგისტრირებულია' : 'This phone number is already registered');
          setIsLoading(false);
          return;
        }

        // Show phone verification
        setShowVerification(true);
        await sendOtp(verificationChannel);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Pro registration - multi-step
    if (currentStep === 'account') {
      setIsLoading(true);
      try {
        const phoneCheck = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`
        ).then(r => r.json());

        if (phoneCheck.exists) {
          setError(locale === 'ka' ? 'ეს ტელეფონის ნომერი უკვე რეგისტრირებულია' : 'This phone number is already registered');
          setIsLoading(false);
          return;
        }

        if (formData.email) {
          const emailCheck = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=email&value=${encodeURIComponent(formData.email)}`
          ).then(r => r.json());

          if (emailCheck.exists) {
            setError(locale === 'ka' ? 'ეს ელ-ფოსტა უკვე რეგისტრირებულია' : 'This email is already registered');
            setIsLoading(false);
            return;
          }
        }

        setCurrentStep('category');
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 'category') {
      setCurrentStep('services');
    } else if (currentStep === 'services') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setShowVerification(true);
      await sendOtp(verificationChannel);
    }
  }, [userType, currentStep, formData, phoneCountry, authMethod, locale, verificationChannel, sendOtp, submitRegistration]);

  return {
    router,
    locale,
    country,
    categories,
    openLoginModal,
    authLoading,
    isAuthenticated,
    user,
    currentStep,
    setCurrentStep,
    userType,
    setUserType,
    showTypeSelection,
    setShowTypeSelection,
    authMethod,
    setAuthMethod,
    formData,
    setFormData,
    handleInputChange,
    repeatPassword,
    setRepeatPassword,
    showPassword,
    setShowPassword,
    showRepeatPassword,
    setShowRepeatPassword,
    avatarPreview,
    setAvatarPreview,
    avatarUploading,
    uploadedAvatarUrl,
    setUploadedAvatarUrl,
    showAvatarCropper,
    setShowAvatarCropper,
    rawAvatarImage,
    setRawAvatarImage,
    avatarInputRef,
    handleAvatarSelect,
    handleCroppedAvatar,
    handleCropCancel,
    removeAvatar,
    clientAvatarIndex,
    clientCustomAvatar,
    setClientCustomAvatar,
    clientAvatarInputRef,
    getClientAvatarUrl,
    shuffleClientAvatar,
    handleClientAvatarUpload,
    phoneCountry,
    setPhoneCountry,
    showCountryDropdown,
    setShowCountryDropdown,
    verificationChannel,
    setVerificationChannel,
    showVerification,
    setShowVerification,
    phoneOtp,
    setPhoneOtp,
    otpInputRefs,
    resendTimer,
    sendOtp,
    verifyOtp,
    handleCategoryToggle,
    handleSubcategoryToggle,
    customServices,
    setCustomServices,
    newCustomService,
    setNewCustomService,
    portfolioProjects,
    setPortfolioProjects,
    addPortfolioProject,
    updatePortfolioProject,
    removePortfolioProject,
    handleProjectImageUpload,
    removeProjectImage,
    handleProjectVideoUpload,
    removeProjectVideo,
    handleBeforeAfterUpload,
    removeBeforeAfterPair,
    error,
    setError,
    isLoading,
    setIsLoading,
    agreedToTerms,
    setAgreedToTerms,
    getCurrentStepIndex,
    getProgressPercentage,
    canProceedFromAccount,
    canProceedFromCategory,
    canProceedFromServices,
    handleNext,
    handleBack,
    goToStep,
    submitRegistration,
  };
}


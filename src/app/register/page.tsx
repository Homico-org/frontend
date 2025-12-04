'use client';

import { useAuth } from '@/contexts/AuthContext';
import { countries, CountryCode, useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES, getCategoryByKey } from '@/constants/categories';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Category {
  _id: string;
  key: string;
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

// Design styles for Interior Designers
const designStyles = [
  'Modern',
  'Minimalist',
  'Classic',
  'Scandinavian',
  'Industrial',
  'Bohemian',
  'Contemporary',
  'Traditional',
  'Art Deco',
  'Mid-Century Modern',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, country, locale } = useLanguage();
  const errorRef = useRef<HTMLDivElement>(null);

  // Steps: 1 = role, 2 = basic info, 2.5 = email verify, 2.75 = phone verify, 3 = category (pro), 4 = category-specific
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    city: '',
    avatar: '',
    idNumber: '', // Personal ID number (required)
    selectedCategory: '', // Single category now
    selectedSubcategories: [] as string[], // Multiple subcategories
    // Interior Designer specific
    pinterestLinks: [''],
    designStyle: '',
    // Architect specific
    cadastralId: '',
    architectLicenseNumber: '',
  });

  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(country as CountryCode);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Verification state
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get cities based on selected country
  const currentCountryData = countries[country as CountryCode] || countries.US;
  const citiesList = locale === 'ka' ? currentCountryData.citiesLocal : currentCountryData.cities;
  const filteredCities = citiesList.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Existing field validation states (checked on submit)
  const [existingFields, setExistingFields] = useState<Record<string, boolean>>({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactField, setContactField] = useState<'email' | 'phone' | 'idNumber' | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Categories from backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  useEffect(() => {
    setPhoneCountry(country as CountryCode);
  }, [country]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openContactModal = (field: 'email' | 'phone' | 'idNumber') => {
    setContactField(field);
    setShowContactModal(true);
    setContactMessage('');
    setContactSubmitted(false);
  };

  const submitContactForm = async () => {
    if (!contactMessage.trim()) return;

    setContactSubmitting(true);
    try {
      // Create a support ticket
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'account_issue',
          field: contactField,
          value: contactField === 'phone'
            ? `${countries[phoneCountry].phonePrefix}${formData.phone}`
            : contactField === 'email'
              ? formData.email
              : formData.idNumber,
          message: contactMessage,
          contactEmail: formData.email || undefined,
          contactPhone: formData.phone ? `${countries[phoneCountry].phonePrefix}${formData.phone}` : undefined,
        }),
      });

      if (response.ok) {
        setContactSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit contact form:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = { ...fieldErrors };
    switch (name) {
      case 'password':
        if (value.length > 0 && value.length < 6) {
          errors.password = locale === 'ka' ? 'მინიმუმ 6 სიმბოლო' : 'Min 6 characters';
        } else {
          delete errors.password;
        }
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match';
        } else if (formData.confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          errors.confirmPassword = locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    setFieldErrors(errors);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const addPinterestLink = () => {
    if (formData.pinterestLinks.length < 5) {
      setFormData({
        ...formData,
        pinterestLinks: [...formData.pinterestLinks, '']
      });
    }
  };

  const updatePinterestLink = (index: number, value: string) => {
    const newLinks = [...formData.pinterestLinks];
    newLinks[index] = value;
    setFormData({ ...formData, pinterestLinks: newLinks });
  };

  const removePinterestLink = (index: number) => {
    if (formData.pinterestLinks.length > 1) {
      const newLinks = formData.pinterestLinks.filter((_, i) => i !== index);
      setFormData({ ...formData, pinterestLinks: newLinks });
    }
  };

  const validatePinterestLink = (url: string): boolean => {
    if (!url) return true;
    return url.includes('pinterest.com') || url.includes('pin.it');
  };

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Send OTP function
  const sendOtp = async (type: 'email' | 'phone') => {
    setIsLoading(true);
    setError('');
    try {
      const identifier = type === 'email'
        ? formData.email
        : `${countries[phoneCountry].phonePrefix}${formData.phone}`;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setOtpSent(true);
      setResendTimer(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP function
  const verifyOtp = async (type: 'email' | 'phone') => {
    setIsLoading(true);
    setError('');
    try {
      const identifier = type === 'email'
        ? formData.email
        : `${countries[phoneCountry].phonePrefix}${formData.phone}`;
      const code = type === 'email' ? emailOtp.join('') : phoneOtp.join('');

      if (code.length !== 6) {
        throw new Error(locale === 'ka' ? 'შეიყვანეთ 6-ნიშნა კოდი' : 'Please enter 6-digit code');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      if (type === 'email') {
        setIsEmailVerified(true);
        // Move to phone verification
        setStep(2.75);
        setOtpSent(false);
        setEmailOtp(['', '', '', '', '', '']);
      } else {
        setIsPhoneVerified(true);
        // Move to next step based on role
        if (formData.role === 'pro') {
          setStep(3);
        } else {
          handleSubmit(new Event('submit') as any);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string, type: 'email' | 'phone') => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const otp = type === 'email' ? [...emailOtp] : [...phoneOtp];
    otp[index] = value.slice(-1); // Only take last character

    if (type === 'email') {
      setEmailOtp(otp);
    } else {
      setPhoneOtp(otp);
    }

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent, type: 'email' | 'phone') => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const otp = pastedData.split('');
    while (otp.length < 6) otp.push('');

    if (type === 'email') {
      setEmailOtp(otp);
    } else {
      setPhoneOtp(otp);
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number, type: 'email' | 'phone') => {
    if (e.key === 'Backspace') {
      const otp = type === 'email' ? emailOtp : phoneOtp;
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      // Role selected, move to basic info
      if (!formData.role) {
        setError(locale === 'ka' ? 'გთხოვთ აირჩიოთ როლი' : 'Please select a role');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Basic info validated, move to email verification
      if (!formData.idNumber || formData.idNumber.length !== 11) {
        setError(locale === 'ka' ? 'პირადი ნომერი უნდა იყოს 11 ციფრი' : 'ID number must be 11 digits');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError(locale === 'ka' ? 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' : 'Password must be at least 6 characters');
        return;
      }
      if (!formData.phone) {
        setError(locale === 'ka' ? 'ტელეფონის ნომერი სავალდებულოა' : 'Phone number is required');
        return;
      }

      // Check if email, phone, or ID number already exist
      setIsLoading(true);
      try {
        const checks = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=email&value=${encodeURIComponent(formData.email)}`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=phone&value=${encodeURIComponent(countries[phoneCountry].phonePrefix + formData.phone)}`).then(r => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-exists?field=idNumber&value=${encodeURIComponent(formData.idNumber)}`).then(r => r.json()),
        ]);

        const [emailCheck, phoneCheck, idCheck] = checks;

        const newExistingFields: Record<string, boolean> = {};
        if (emailCheck.exists) newExistingFields.email = true;
        if (phoneCheck.exists) newExistingFields.phone = true;
        if (idCheck.exists) newExistingFields.idNumber = true;

        if (Object.keys(newExistingFields).length > 0) {
          setExistingFields(newExistingFields);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to check existing fields:', err);
      }
      setIsLoading(false);

      // Go to email verification
      setStep(2.5);
      sendOtp('email');
    } else if (step === 3) {
      // Category selected, move to category-specific info
      if (!formData.selectedCategory) {
        setError(locale === 'ka' ? 'გთხოვთ აირჩიოთ კატეგორია' : 'Please select a category');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate category-specific fields for pros
    if (formData.role === 'pro') {
      if (formData.selectedCategory === 'interior-design') {
        const validLinks = formData.pinterestLinks.filter(link => link.trim());
        if (validLinks.length === 0) {
          setError(locale === 'ka' ? 'გთხოვთ დაამატოთ მინიმუმ ერთი ლინკი' : 'Please add at least one link');
          return;
        }
        for (const link of validLinks) {
          if (!validatePinterestLink(link)) {
            setError(locale === 'ka' ? 'გთხოვთ შეიყვანოთ სწორი ლინკი' : 'Please enter a valid link');
            return;
          }
        }
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          idNumber: formData.idNumber,
          role: formData.role,
          phone: formData.phone || undefined,
          city: formData.city || undefined,
          avatar: formData.avatar || undefined,
          selectedCategories: formData.role === 'pro' ? [formData.selectedCategory] : undefined,
          selectedSubcategories: formData.role === 'pro' ? formData.selectedSubcategories : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login(data.access_token, data.user);
      await new Promise(resolve => setTimeout(resolve, 100));

      if (data.user.role === 'pro') {
        // Store category-specific data to be saved in profile setup
        sessionStorage.setItem('proRegistrationData', JSON.stringify({
          category: formData.selectedCategory,
          subcategories: formData.selectedSubcategories,
          pinterestLinks: formData.pinterestLinks.filter(l => l.trim()),
          designStyle: formData.designStyle,
          cadastralId: formData.cadastralId,
          architectLicenseNumber: formData.architectLicenseNumber,
        }));
        router.push('/pro/profile-setup');
      } else {
        router.push('/browse');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return locale === 'ka' ? 'მოგესალმებით Homico-ში' : 'Welcome to Homico';
      case 2:
        return locale === 'ka' ? 'შექმენი ანგარიში' : 'Create Account';
      case 2.5:
        return locale === 'ka' ? 'ელ-ფოსტის ვერიფიკაცია' : 'Verify Email';
      case 2.75:
        return locale === 'ka' ? 'ტელეფონის ვერიფიკაცია' : 'Verify Phone';
      case 3:
        return locale === 'ka' ? 'აირჩიე სპეციალობა' : 'Choose Your Specialty';
      case 4:
        return formData.selectedCategory === 'interior-design'
          ? (locale === 'ka' ? 'დაამატე პორტფოლიო' : 'Add Your Portfolio')
          : (locale === 'ka' ? 'პროფესიული ვერიფიკაცია' : 'Professional Verification');
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return locale === 'ka' ? 'როგორ გსურთ გამოიყენოთ პლატფორმა?' : 'How would you like to use the platform?';
      case 2:
        return locale === 'ka' ? 'შეავსეთ თქვენი ინფორმაცია' : 'Fill in your information';
      case 2.5:
        return locale === 'ka' ? `კოდი გაგზავნილია ${formData.email}-ზე` : `Code sent to ${formData.email}`;
      case 2.75:
        return locale === 'ka' ? `კოდი გაგზავნილია ${countries[phoneCountry].phonePrefix}${formData.phone}-ზე` : `Code sent to ${countries[phoneCountry].phonePrefix}${formData.phone}`;
      case 3:
        return locale === 'ka' ? 'აირჩიეთ თქვენი პროფესიული მიმართულება' : 'Select your professional direction';
      case 4:
        return formData.selectedCategory === 'interior-design'
          ? (locale === 'ka' ? 'დაამატეთ ლინკები თქვენი ნამუშევრებისთვის' : 'Add Pinterest links to showcase your work')
          : (locale === 'ka' ? 'შეიყვანეთ თქვენი საკადასტრო კოდი ვერიფიკაციისთვის' : 'Enter your cadastral ID for verification');
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center py-8 px-4">
      <div className="max-w-xl w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl font-serif font-semibold text-forest-800 dark:text-primary-400">Homico</span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary-400"></span>
        </Link>

        {/* Progress Steps */}
        {formData.role === 'pro' && step > 1 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                  step >= s ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg' : 'bg-neutral-200 dark:bg-dark-border text-neutral-400 dark:text-neutral-500'
                }`}>
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s - 1}
                </div>
                {s < 4 && (
                  <div className={`w-12 h-1 mx-1 rounded ${step > s ? 'bg-forest-800 dark:bg-primary-400' : 'bg-neutral-200 dark:bg-dark-border'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-luxury dark:shadow-none p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">{getStepTitle()}</h2>
            <p className="text-neutral-500 dark:text-neutral-400">{getStepSubtitle()}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              ref={errorRef}
              className="mb-5 p-4 bg-terracotta-50 border border-terracotta-200 rounded-xl flex items-start gap-3"
            >
              <svg className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-terracotta-700">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-terracotta-400 hover:text-terracotta-600 transition-all duration-200 ease-out">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={step === 4 ? handleSubmit : handleNextStep} className="space-y-5">

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'client' })}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.role === 'client'
                        ? 'border-forest-800 dark:border-primary-400 bg-cream-100 dark:bg-dark-elevated shadow-lg'
                        : 'border-neutral-200 dark:border-dark-border hover:border-forest-600 dark:hover:border-primary-400 hover:bg-cream-50 dark:hover:bg-dark-elevated'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
                      formData.role === 'client' ? 'bg-forest-800 dark:bg-primary-400 shadow-lg' : 'bg-neutral-100 dark:bg-dark-border'
                    }`}>
                      <svg className={`w-7 h-7 ${formData.role === 'client' ? 'text-white dark:text-dark-bg' : 'text-neutral-500 dark:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${formData.role === 'client' ? 'text-forest-800 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                      {locale === 'ka' ? 'მინდა დავიქირაო' : 'I want to hire'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {locale === 'ka' ? 'ვეძებ პროფესიონალებს ჩემი პროექტისთვის' : 'Looking for professionals for my project'}
                    </p>
                    {formData.role === 'client' && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-primary-400 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'pro' })}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.role === 'pro'
                        ? 'border-terracotta-500 dark:border-terracotta-400 bg-terracotta-50 dark:bg-terracotta-900/20 shadow-lg'
                        : 'border-neutral-200 dark:border-dark-border hover:border-terracotta-400 hover:bg-terracotta-50/50 dark:hover:bg-terracotta-900/10'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 ${
                      formData.role === 'pro' ? 'bg-terracotta-500 dark:bg-terracotta-500 shadow-lg' : 'bg-neutral-100 dark:bg-dark-border'
                    }`}>
                      <svg className={`w-7 h-7 ${formData.role === 'pro' ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${formData.role === 'pro' ? 'text-terracotta-600 dark:text-terracotta-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
                      {locale === 'ka' ? 'ვარ პროფესიონალი' : 'I am a professional'}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {locale === 'ka' ? 'მინდა შევთავაზო ჩემი მომსახურება' : 'I want to offer my services'}
                    </p>
                    <p className="text-xs text-terracotta-500/80 dark:text-terracotta-400/80 mt-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {locale === 'ka' ? 'ასევე შეგიძლიათ დაიქირაოთ სხვა სპეციალისტები' : 'You can also hire other professionals anytime'}
                    </p>
                    {formData.role === 'pro' && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-terracotta-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!formData.role}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
                </button>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-all duration-200 ease-out mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === 'ka' ? 'უკან' : 'Back'}
                </button>

                {/* Name and ID Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'სახელი და გვარი' : 'Full Name'} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input"
                      placeholder={locale === 'ka' ? 'გიორგი ბერიძე' : 'John Doe'}
                    />
                  </div>

                  <div>
                    <label htmlFor="idNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'პირადი ნომერი' : 'ID Number'} *
                    </label>
                    <div className="relative">
                      <input
                        id="idNumber"
                        type="text"
                        required
                        value={formData.idNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                          handleInputChange('idNumber', value);
                          setExistingFields(prev => ({ ...prev, idNumber: false }));
                        }}
                        className={`input pr-10 ${
                          existingFields.idNumber
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                            : formData.idNumber && formData.idNumber.length !== 11
                              ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                              : formData.idNumber.length === 11 && !existingFields.idNumber
                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                : ''
                        }`}
                        placeholder={locale === 'ka' ? '11-ნიშნა კოდი' : '11-digit ID'}
                        maxLength={11}
                      />
                      {/* Status indicator */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {existingFields.idNumber ? (
                          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : formData.idNumber.length === 11 ? (
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                    {formData.idNumber && formData.idNumber.length !== 11 && !existingFields.idNumber && (
                      <p className="text-xs text-amber-600 mt-1">
                        {locale === 'ka' ? `${formData.idNumber.length}/11 ციფრი` : `${formData.idNumber.length}/11 digits`}
                      </p>
                    )}
                    {existingFields.idNumber && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {locale === 'ka' ? 'ეს პირადი ნომერი უკვე რეგისტრირებულია.' : 'This ID number is already registered.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => openContactModal('idNumber')}
                          className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                        >
                          {locale === 'ka' ? 'დაგვიკავშირდით დახმარებისთვის' : 'Contact us for help'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                    {locale === 'ka' ? 'ელ-ფოსტა' : 'Email'} *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange('email', value);
                        setExistingFields(prev => ({ ...prev, email: false }));
                      }}
                      className={`input pr-10 ${
                        existingFields.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : formData.email && formData.email.includes('@') && formData.email.includes('.') && !existingFields.email
                            ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                            : ''
                      }`}
                      placeholder="you@example.com"
                    />
                    {/* Status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {existingFields.email ? (
                        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : formData.email && formData.email.includes('@') && formData.email.includes('.') ? (
                        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                  {existingFields.email && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {locale === 'ka' ? 'ეს ელ-ფოსტა უკვე რეგისტრირებულია.' : 'This email is already registered.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => openContactModal('email')}
                        className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                      >
                        {locale === 'ka' ? 'დაგვიკავშირდით დახმარებისთვის' : 'Contact us for help'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'პაროლი' : 'Password'} *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`input pr-10 ${fieldErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder={locale === 'ka' ? 'მინ. 6 სიმბოლო' : 'Min 6 characters'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-all duration-200 ease-out"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'გაიმეორე პაროლი' : 'Confirm Password'} *
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`input pr-10 ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder={locale === 'ka' ? 'გაიმეორე პაროლი' : 'Re-enter password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-all duration-200 ease-out"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Phone and City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'ტელეფონი' : 'Phone'} *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            const current = Object.keys(countries).indexOf(phoneCountry);
                            const next = (current + 1) % Object.keys(countries).length;
                            setPhoneCountry(Object.keys(countries)[next] as CountryCode);
                          }}
                          className="flex items-center gap-1.5 px-3 py-3 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 ease-out min-w-[90px]"
                        >
                          <span className="text-lg">{countries[phoneCountry].flag}</span>
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{countries[phoneCountry].phonePrefix}</span>
                        </button>
                      </div>
                      <div className="relative flex-1">
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            handleInputChange('phone', value);
                            setExistingFields(prev => ({ ...prev, phone: false }));
                          }}
                          className={`input pr-10 w-full ${
                            existingFields.phone
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                              : formData.phone && formData.phone.length >= 9 && !existingFields.phone
                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                : ''
                          }`}
                          placeholder="555 123 456"
                        />
                        {/* Status indicator */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {existingFields.phone ? (
                            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : formData.phone && formData.phone.length >= 9 ? (
                            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {existingFields.phone && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {locale === 'ka' ? 'ეს ტელეფონი უკვე რეგისტრირებულია.' : 'This phone number is already registered.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => openContactModal('phone')}
                          className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
                        >
                          {locale === 'ka' ? 'დაგვიკავშირდით დახმარებისთვის' : 'Contact us for help'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div ref={cityDropdownRef} className="relative">
                    <label htmlFor="city" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'ქალაქი' : 'City'} <span className="text-neutral-400 text-xs">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                    </label>
                    <div className="relative">
                      <input
                        id="city"
                        type="text"
                        value={formData.city || citySearch}
                        onChange={(e) => {
                          setCitySearch(e.target.value);
                          setFormData({ ...formData, city: '' });
                          setShowCityDropdown(true);
                        }}
                        onFocus={() => setShowCityDropdown(true)}
                        className="input pr-10"
                        placeholder={locale === 'ka' ? 'აირჩიე ქალაქი' : 'Select city'}
                      />
                      <svg className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {showCityDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg shadow-lg dark:shadow-none max-h-48 overflow-y-auto">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, city });
                                setCitySearch('');
                                setShowCityDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-dark-border transition-all duration-200 ease-out"
                            >
                              {city}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">{locale === 'ka' ? 'შედეგები არ მოიძებნა' : 'No results found'}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || Object.keys(fieldErrors).length > 0 || !formData.name || !formData.email || !formData.password || !formData.confirmPassword || formData.password.length < 6 || formData.password !== formData.confirmPassword || !formData.phone || !formData.idNumber || formData.idNumber.length !== 11 || existingFields.email || existingFields.phone || existingFields.idNumber}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                    </span>
                  ) : formData.role === 'pro' ? (
                    locale === 'ka' ? 'გაგრძელება' : 'Continue'
                  ) : (
                    locale === 'ka' ? 'რეგისტრაცია' : 'Create Account'
                  )}
                </button>
              </>
            )}

            {/* Step 2.5: Email Verification */}
            {step === 2.5 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setOtpSent(false);
                    setEmailOtp(['', '', '', '', '', '']);
                  }}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-all duration-200 ease-out mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === 'ka' ? 'უკან' : 'Back'}
                </button>

                {/* Email icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-cream-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-forest-800 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-3 text-center">
                    {locale === 'ka' ? 'შეიყვანეთ 6-ნიშნა კოდი' : 'Enter 6-digit code'}
                  </label>
                  <div className="flex justify-center gap-2">
                    {emailOtp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value, 'email')}
                        onKeyDown={(e) => handleOtpKeyDown(e, index, 'email')}
                        onPaste={(e) => handleOtpPaste(e, 'email')}
                        className="w-12 h-14 text-center text-xl font-bold border-2 border-neutral-200 dark:border-dark-border dark:bg-dark-card dark:text-neutral-50 rounded-xl focus:border-forest-800 dark:focus:border-primary-400 focus:ring-2 focus:ring-forest-200 dark:focus:ring-primary-400/20 transition-all duration-200"
                      />
                    ))}
                  </div>
                </div>

                {/* Resend button */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {locale === 'ka' ? `კოდის ხელახლა გაგზავნა ${resendTimer} წამში` : `Resend code in ${resendTimer}s`}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendOtp('email')}
                      disabled={isLoading}
                      className="text-sm text-forest-800 dark:text-primary-400 hover:text-terracotta-500 dark:hover:text-primary-300 font-medium"
                    >
                      {locale === 'ka' ? 'კოდის ხელახლა გაგზავნა' : 'Resend code'}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => verifyOtp('email')}
                  disabled={isLoading || emailOtp.join('').length !== 6}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {locale === 'ka' ? 'მოწმდება...' : 'Verifying...'}
                    </span>
                  ) : (
                    locale === 'ka' ? 'დადასტურება' : 'Verify'
                  )}
                </button>
              </div>
            )}

            {/* Step 2.75: Phone Verification */}
            {step === 2.75 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setStep(2.5);
                    setOtpSent(false);
                    setPhoneOtp(['', '', '', '', '', '']);
                    setIsEmailVerified(false);
                  }}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-all duration-200 ease-out mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === 'ka' ? 'უკან' : 'Back'}
                </button>

                {/* Phone icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-primary-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>

                {/* Send OTP button if not sent */}
                {!otpSent && (
                  <button
                    type="button"
                    onClick={() => sendOtp('phone')}
                    disabled={isLoading}
                    className="w-full btn btn-primary py-3 text-base font-semibold"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {locale === 'ka' ? 'იგზავნება...' : 'Sending...'}
                      </span>
                    ) : (
                      locale === 'ka' ? 'კოდის გაგზავნა' : 'Send Code'
                    )}
                  </button>
                )}

                {/* OTP Input - show after sent */}
                {otpSent && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-3 text-center">
                        {locale === 'ka' ? 'შეიყვანეთ 6-ნიშნა კოდი' : 'Enter 6-digit code'}
                      </label>
                      <div className="flex justify-center gap-2">
                        {phoneOtp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { otpInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value, 'phone')}
                            onKeyDown={(e) => handleOtpKeyDown(e, index, 'phone')}
                            onPaste={(e) => handleOtpPaste(e, 'phone')}
                            className="w-12 h-14 text-center text-xl font-bold border-2 border-neutral-200 dark:border-dark-border dark:bg-dark-card dark:text-neutral-50 rounded-xl focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-400/20 transition-all duration-200"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resend button */}
                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {locale === 'ka' ? `კოდის ხელახლა გაგზავნა ${resendTimer} წამში` : `Resend code in ${resendTimer}s`}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendOtp('phone')}
                          disabled={isLoading}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                          {locale === 'ka' ? 'კოდის ხელახლა გაგზავნა' : 'Resend code'}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => verifyOtp('phone')}
                      disabled={isLoading || phoneOtp.join('').length !== 6}
                      className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {locale === 'ka' ? 'მოწმდება...' : 'Verifying...'}
                        </span>
                      ) : (
                        locale === 'ka' ? 'დადასტურება' : 'Verify'
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Category Selection (Pro only) */}
            {step === 3 && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-all duration-200 ease-out mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === 'ka' ? 'უკან' : 'Back'}
                </button>

                <div className="grid grid-cols-1 gap-4">
                  {categoriesLoading ? (
                    <div className="flex justify-center py-8">
                      <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedCategory: cat.key, selectedSubcategories: [] })}
                        className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                          formData.selectedCategory === cat.key
                            ? 'border-blue-500 dark:border-primary-400 bg-blue-50 dark:bg-primary-900/20 shadow-lg shadow-blue-100 dark:shadow-none'
                            : 'border-neutral-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-primary-400 hover:bg-blue-50/50 dark:hover:bg-primary-900/10'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 ${
                          formData.selectedCategory === cat.key
                            ? 'bg-forest-800 dark:bg-primary-400 shadow-lg'
                            : 'bg-neutral-100 dark:bg-dark-border'
                        }`}>
                          {cat.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold mb-1 ${
                            formData.selectedCategory === cat.key ? 'text-blue-700 dark:text-primary-400' : 'text-neutral-900 dark:text-neutral-50'
                          }`}>
                            {locale === 'ka' ? cat.nameKa : cat.name}
                          </h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {locale === 'ka' ? cat.descriptionKa : cat.description}
                          </p>
                        </div>
                        {formData.selectedCategory === cat.key && (
                          <div className="absolute top-4 right-4">
                            <div className="w-6 h-6 bg-forest-800 dark:bg-primary-400 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Subcategory Selection */}
                {formData.selectedCategory && (
                  <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-dark-border/50 border border-neutral-200 dark:border-dark-border">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                      {locale === 'ka' ? 'აირჩიეთ სპეციალიზაციები' : 'Select Specializations'} *
                    </label>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                      {locale === 'ka' ? 'შეგიძლიათ აირჩიოთ რამდენიმე' : 'You can select multiple'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getCategoryByKey(formData.selectedCategory)?.subcategories.map((sub) => {
                        const isSelected = formData.selectedSubcategories.includes(sub.key);
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  selectedSubcategories: formData.selectedSubcategories.filter(k => k !== sub.key)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedSubcategories: [...formData.selectedSubcategories, sub.key]
                                });
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                              isSelected
                                ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg border-transparent shadow-md'
                                : 'bg-white dark:bg-dark-card text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {locale === 'ka' ? sub.nameKa : sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!formData.selectedCategory || formData.selectedSubcategories.length === 0}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
                </button>
              </div>
            )}

            {/* Step 4: Category-specific Info */}
            {step === 4 && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-all duration-200 ease-out mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {locale === 'ka' ? 'უკან' : 'Back'}
                </button>

                {/* Interior Designer specific fields */}
                {formData.selectedCategory === 'interior-design' && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400">
                        Pinterest {locale === 'ka' ? 'ლინკები' : 'Links'} *
                      </label>
                      {formData.pinterestLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={link}
                            onChange={(e) => updatePinterestLink(index, e.target.value)}
                            placeholder="https://pinterest.com/yourboard"
                            className={`input flex-1 ${link && !validatePinterestLink(link) ? 'border-red-300' : ''}`}
                          />
                          {formData.pinterestLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePinterestLink(index)}
                              className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.pinterestLinks.length < 5 && (
                        <button
                          type="button"
                          onClick={addPinterestLink}
                          className="flex items-center gap-2 text-forest-800 dark:text-primary-400 hover:text-terracotta-500 dark:hover:text-primary-300 text-sm font-medium transition-all duration-200 ease-out"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {locale === 'ka' ? 'დაამატე კიდევ ლინკი' : 'Add another link'}
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                        {locale === 'ka' ? 'დიზაინის სტილი' : 'Design Style'} <span className="text-neutral-400 text-xs">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {designStyles.map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setFormData({ ...formData, designStyle: formData.designStyle === style ? '' : style })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.designStyle === style
                                ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg shadow-md'
                                : 'bg-neutral-100 dark:bg-dark-border text-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                  </>
                )}

                {/* Architect specific fields */}
                {formData.selectedCategory === 'architecture' && (
                  <>
                    <div>
                      <label htmlFor="cadastralId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                        {locale === 'ka' ? 'საკადასტრო კოდი' : 'Cadastral ID'} *
                      </label>
                      <input
                        id="cadastralId"
                        type="text"
                        required
                        value={formData.cadastralId}
                        onChange={(e) => handleInputChange('cadastralId', e.target.value)}
                        className="input"
                        placeholder="01.18.01.004.001"
                      />
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {locale === 'ka'
                          ? 'საჯარო რეესტრიდან მიღებული საკადასტრო კოდი ვერიფიკაციისთვის'
                          : 'Cadastral ID from Public Service Hall for verification'
                        }
                      </p>
                    </div>

                    <div>
                      <label htmlFor="licenseNumber" className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                        {locale === 'ka' ? 'ლიცენზიის ნომერი' : 'License Number'} <span className="text-neutral-400 text-xs">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                      </label>
                      <input
                        id="licenseNumber"
                        type="text"
                        value={formData.architectLicenseNumber}
                        onChange={(e) => handleInputChange('architectLicenseNumber', e.target.value)}
                        className="input"
                        placeholder={locale === 'ka' ? 'არქიტექტორის ლიცენზია' : 'Architect license number'}
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (formData.selectedCategory === 'interior-design' && !formData.pinterestLinks.some(link => link.trim())) || (formData.selectedCategory === 'architecture' && !formData.cadastralId)}
                  className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                    </span>
                  ) : (
                    locale === 'ka' ? 'დასრულება და რეგისტრაცია' : 'Complete Registration'
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-dark-border">
            <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              {locale === 'ka' ? 'უკვე გაქვთ ანგარიში?' : 'Already have an account?'}{' '}
              <Link href="/login" className="text-forest-800 dark:text-primary-400 hover:text-terracotta-500 dark:hover:text-primary-300 font-medium transition-all duration-200 ease-out">
                {locale === 'ka' ? 'შესვლა' : 'Sign in'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            {/* Close button */}
            <button
              onClick={() => {
                setShowContactModal(false);
                setContactField(null);
                setContactMessage('');
                setContactSubmitted(false);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!contactSubmitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'დაგვიკავშირდით' : 'Contact Us'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {contactField === 'email' && (locale === 'ka'
                      ? 'ეს ელ-ფოსტა უკვე რეგისტრირებულია. თუ ეს თქვენი ანგარიშია, დაგვიტოვეთ შეტყობინება.'
                      : 'This email is already registered. If this is your account, leave us a message.')}
                    {contactField === 'phone' && (locale === 'ka'
                      ? 'ეს ტელეფონი უკვე რეგისტრირებულია. თუ ეს თქვენი ანგარიშია, დაგვიტოვეთ შეტყობინება.'
                      : 'This phone is already registered. If this is your account, leave us a message.')}
                    {contactField === 'idNumber' && (locale === 'ka'
                      ? 'ეს პირადი ნომერი უკვე რეგისტრირებულია. თუ ეს თქვენი ანგარიშია, დაგვიტოვეთ შეტყობინება.'
                      : 'This ID number is already registered. If this is your account, leave us a message.')}
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                      {locale === 'ka' ? 'თქვენი შეტყობინება' : 'Your Message'} *
                    </label>
                    <textarea
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                      className="input w-full resize-none"
                      placeholder={locale === 'ka' ? 'აღწერეთ თქვენი პრობლემა...' : 'Describe your issue...'}
                    />
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-dark-border/50 rounded-lg">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium">{locale === 'ka' ? 'მონაცემები:' : 'Data:'}</span>{' '}
                      {contactField === 'email' && formData.email}
                      {contactField === 'phone' && `${countries[phoneCountry].phonePrefix}${formData.phone}`}
                      {contactField === 'idNumber' && formData.idNumber}
                    </p>
                  </div>

                  <button
                    onClick={submitContactForm}
                    disabled={contactSubmitting || !contactMessage.trim()}
                    className="w-full btn btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {contactSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {locale === 'ka' ? 'იგზავნება...' : 'Sending...'}
                      </span>
                    ) : (
                      locale === 'ka' ? 'გაგზავნა' : 'Send Message'
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                  {locale === 'ka' ? 'შეტყობინება გაგზავნილია!' : 'Message Sent!'}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                  {locale === 'ka'
                    ? 'ჩვენი გუნდი მალე დაგიკავშირდებათ.'
                    : 'Our team will contact you soon.'}
                </p>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactField(null);
                    setContactMessage('');
                    setContactSubmitted(false);
                  }}
                  className="btn btn-outline px-8"
                >
                  {locale === 'ka' ? 'დახურვა' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

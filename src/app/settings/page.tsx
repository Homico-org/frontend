'use client';

import Avatar from '@/components/common/Avatar';
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Bell, BriefcaseBusiness, Camera, Check, CheckCircle2, ChevronRight, CreditCard, Eye, EyeOff, FileText, Loader2, Lock, Mail, Megaphone, MessageSquare, Send, Shield, Smartphone, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

// Types for payment methods
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  cardLast4?: string;
  cardBrand?: string;
  cardExpiry?: string;
  cardholderName?: string;
  bankName?: string;
  maskedIban?: string;
  isDefault: boolean;
  createdAt: string;
}

// Types for notification preferences
interface NotificationPreferences {
  email: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
    marketing: boolean;
  };
  push: {
    enabled: boolean;
    newJobs: boolean;
    proposals: boolean;
    messages: boolean;
  };
  sms: {
    enabled: boolean;
    proposals: boolean;
    messages: boolean;
  };
}

interface NotificationSettingsData {
  email: string | null;
  isEmailVerified: boolean;
  phone: string | null;
  isPhoneVerified: boolean;
  preferences: NotificationPreferences;
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    avatar: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences state
  const [notificationData, setNotificationData] = useState<NotificationSettingsData | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add email modal state
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [addEmailError, setAddEmailError] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'email' | 'otp' | 'success'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardFormData, setCardFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardholderName: '',
    setAsDefault: false,
  });
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal('/settings');
    }
  }, [isLoading, isAuthenticated, openLoginModal]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, 'bytes');

    // For demo purposes, we'll convert to base64 data URL
    // In production, you'd upload to a CDN/cloud storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      console.log('Base64 generated, length:', base64.length);
      setFormData(prev => ({ ...prev, avatar: base64 }));
    };
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          city: formData.city,
          avatar: formData.avatar,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setMessage({ type: 'success', text: t('settings.profile.successMessage') });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.profile.errorMessage') });
    } finally {
      setIsSaving(false);
    }
  };

  // Payment methods functions
  const fetchPaymentMethods = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'payments' && isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [activeTab, isAuthenticated, fetchPaymentMethods]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatCardExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleAddCard = async () => {
    setIsAddingCard(true);
    setPaymentMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'card',
          cardNumber: cardFormData.cardNumber.replace(/\s/g, ''),
          cardExpiry: cardFormData.cardExpiry,
          cardholderName: cardFormData.cardholderName,
          setAsDefault: cardFormData.setAsDefault,
        }),
      });

      if (res.ok) {
        const newCard = await res.json();
        setPaymentMethods(prev => [...prev, newCard]);
        setShowAddCardModal(false);
        setCardFormData({ cardNumber: '', cardExpiry: '', cardholderName: '', setAsDefault: false });
        setPaymentMessage({
          type: 'success',
          text: locale === 'ka' ? 'ბარათი წარმატებით დაემატა' : 'Card added successfully'
        });
      } else {
        throw new Error('Failed to add card');
      }
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        text: locale === 'ka' ? 'ბარათის დამატება ვერ მოხერხდა' : 'Failed to add card'
      });
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setDeletingCardId(cardId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPaymentMethods(prev => prev.filter(pm => pm.id !== cardId));
        setPaymentMessage({
          type: 'success',
          text: locale === 'ka' ? 'ბარათი წაიშალა' : 'Card deleted'
        });
      }
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        text: locale === 'ka' ? 'წაშლა ვერ მოხერხდა' : 'Failed to delete'
      });
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/payment-methods/default`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethodId: cardId }),
      });

      if (res.ok) {
        setPaymentMethods(prev => prev.map(pm => ({
          ...pm,
          isDefault: pm.id === cardId,
        })));
      }
    } catch (error) {
      console.error('Error setting default card:', error);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    // Validate passwords
    if (!passwordData.currentPassword) {
      setPasswordMessage({
        type: 'error',
        text: locale === 'ka' ? 'შეიყვანეთ მიმდინარე პაროლი' : 'Please enter your current password',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: locale === 'ka' ? 'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო' : 'New password must be at least 6 characters',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        setPasswordMessage({
          type: 'success',
          text: locale === 'ka' ? 'პაროლი წარმატებით შეიცვალა' : 'Password changed successfully',
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        if (res.status === 409) {
          setPasswordMessage({
            type: 'error',
            text: locale === 'ka' ? 'მიმდინარე პაროლი არასწორია' : 'Current password is incorrect',
          });
        } else {
          throw new Error(data.message || 'Failed to change password');
        }
      }
    } catch (error: any) {
      setPasswordMessage({
        type: 'error',
        text: error.message || (locale === 'ka' ? 'პაროლის შეცვლა ვერ მოხერხდა' : 'Failed to change password'),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = locale === 'ka'
      ? ['სუსტი', 'სუსტი', 'საშუალო', 'კარგი', 'ძლიერი']
      : ['Weak', 'Weak', 'Medium', 'Good', 'Strong'];

    return { strength, label: labels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  // Fetch notification preferences
  const fetchNotificationPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingNotifications(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/users/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationData(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'notifications' && !notificationData) {
      fetchNotificationPreferences();
    }
  }, [activeTab, notificationData, fetchNotificationPreferences]);

  // Update notification preference
  const updateNotificationPreference = async (
    channel: 'email' | 'push' | 'sms',
    key: string,
    value: boolean
  ) => {
    if (!notificationData) return;

    // Optimistic update
    setNotificationData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          [channel]: {
            ...prev.preferences[channel],
            [key]: value,
          },
        },
      };
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/users/notification-preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [channel]: { [key]: value },
        }),
      });

      if (!res.ok) {
        // Revert on error
        fetchNotificationPreferences();
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      setNotificationMessage({
        type: 'error',
        text: locale === 'ka' ? 'პარამეტრების შენახვა ვერ მოხერხდა' : 'Failed to save preferences',
      });
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // Add email flow
  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setAddEmailError(locale === 'ka' ? 'შეიყვანეთ სწორი ელ-ფოსტა' : 'Please enter a valid email');
      return;
    }

    setIsAddingEmail(true);
    setAddEmailError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/add-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to add email');
      }

      // Email added, now send OTP
      setIsSendingOtp(true);
      const otpRes = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newEmail, type: 'email' }),
      });

      if (otpRes.ok) {
        setEmailOtpStep('otp');
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (error: any) {
      setAddEmailError(error.message || (locale === 'ka' ? 'ელ-ფოსტის დამატება ვერ მოხერხდა' : 'Failed to add email'));
    } finally {
      setIsAddingEmail(false);
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setAddEmailError(locale === 'ka' ? 'შეიყვანეთ 6-ნიშნა კოდი' : 'Please enter 6-digit code');
      return;
    }

    setIsVerifyingOtp(true);
    setAddEmailError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      // First verify the OTP
      const verifyRes = await fetch(`${API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newEmail, code: otpCode, type: 'email' }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Invalid code');
      }

      // Mark email as verified
      const updateRes = await fetch(`${API_URL}/users/verify-email-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (updateRes.ok) {
        setEmailOtpStep('success');
        // Refresh notification data
        await fetchNotificationPreferences();
        // Update user context
        if (user) {
          updateUser({ ...user, email: newEmail });
        }
        setTimeout(() => {
          setShowAddEmailModal(false);
          setEmailOtpStep('email');
          setNewEmail('');
          setOtpCode('');
        }, 2000);
      } else {
        throw new Error('Failed to verify email');
      }
    } catch (error: any) {
      setAddEmailError(error.message || (locale === 'ka' ? 'კოდი არასწორია' : 'Invalid verification code'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    setIsSendingOtp(true);
    setAddEmailError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newEmail, type: 'email' }),
      });
      if (!res.ok) throw new Error('Failed to resend code');
      setNotificationMessage({
        type: 'success',
        text: locale === 'ka' ? 'კოდი გაიგზავნა ხელახლა' : 'Code resent successfully',
      });
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      setAddEmailError(locale === 'ka' ? 'კოდის გაგზავნა ვერ მოხერხდა' : 'Failed to resend code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: locale === 'ka' ? 'პაროლის შეცვლა' : 'Password', icon: Lock },
    { id: 'payments', label: t('settings.tabs.payments'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen relative">
      <Header />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-xl sm:text-2xl font-serif font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('settings.title')}
          </h1>
          <p
            className="mt-1 text-sm sm:text-base"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Horizontal tabs on mobile */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out whitespace-nowrap touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-[#E07B4F] text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline md:hidden lg:inline">{tab.label}</span>
                  <span className="sm:hidden md:inline lg:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('settings.profile.title')}
                </h2>

                {message && (
                  <div
                    className="p-3 sm:p-4 rounded-xl text-sm"
                    style={{
                      backgroundColor: message.type === 'success'
                        ? 'rgba(var(--color-primary-rgb), 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                      color: message.type === 'success'
                        ? 'var(--color-primary)'
                        : '#ef4444',
                      border: `1px solid ${message.type === 'success' ? 'var(--color-primary)' : '#ef4444'}`,
                    }}
                  >
                    {message.text}
                  </div>
                )}

                {/* Avatar Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative group">
                    <Avatar
                      src={formData.avatar}
                      name={formData.name}
                      size="2xl"
                      className="ring-4 ring-neutral-200 dark:ring-neutral-700"
                    />
                    <button
                      onClick={handleAvatarClick}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-all duration-200 ease-out cursor-pointer touch-manipulation"
                    >
                      <Camera className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {t('settings.profile.profilePhoto')}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t('settings.profile.photoHint')}
                    </p>
                    <button
                      onClick={handleAvatarClick}
                      className="mt-2 text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] transition-all duration-200 ease-out touch-manipulation"
                    >
                      {t('settings.profile.uploadPhoto')}
                    </button>
                  </div>
                </div>

                <div
                  className="border-t pt-5 sm:pt-6"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="grid gap-3 sm:gap-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.fullName')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl cursor-not-allowed opacity-60"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      />
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {t('settings.profile.emailHint')}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.phone')}
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder={t('settings.profile.phonePlaceholder')}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.city')}
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder={t('settings.profile.cityPlaceholder')}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('settings.profile.saving')}
                      </>
                    ) : (
                      t('settings.profile.saveChanges')
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {locale === 'ka' ? 'შეტყობინებები' : 'Notifications'}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? 'აირჩიეთ როგორ გსურთ შეტყობინებების მიღება' : 'Choose how you want to receive notifications'}
                  </p>
                </div>

                {notificationMessage && (
                  <div
                    className="p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
                    style={{
                      backgroundColor: notificationMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: notificationMessage.type === 'success' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${notificationMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    }}
                  >
                    {notificationMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {notificationMessage.text}
                  </div>
                )}

                {isLoadingNotifications ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                    </span>
                  </div>
                ) : notificationData ? (
                  <div className="space-y-6">
                    {/* Email Notifications Section */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                      {/* Email Header */}
                      <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(210, 105, 30, 0.1)' }}>
                            <Mail className="w-5 h-5 text-[#E07B4F]" />
                          </div>
                          <div>
                            <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {locale === 'ka' ? 'ელ-ფოსტა' : 'Email'}
                            </h3>
                            {notificationData.email ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notificationData.email}</span>
                                {notificationData.isEmailVerified ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    {locale === 'ka' ? 'დასადასტურებელი' : 'Unverified'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                {locale === 'ka' ? 'ელ-ფოსტა არ არის დამატებული' : 'No email added'}
                              </span>
                            )}
                          </div>
                        </div>
                        {notificationData.email ? (
                          <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationData.preferences.email.enabled}
                              onChange={(e) => updateNotificationPreference('email', 'enabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-[#E07B4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-200" />
                          </label>
                        ) : (
                          <button
                            onClick={() => setShowAddEmailModal(true)}
                            className="px-3 py-1.5 text-sm font-medium text-[#E07B4F] bg-[#E07B4F]/10 hover:bg-[#E07B4F]/20 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Mail className="w-4 h-4" />
                            {locale === 'ka' ? 'დამატება' : 'Add Email'}
                          </button>
                        )}
                      </div>

                      {/* Email Options */}
                      {notificationData.email && notificationData.preferences.email.enabled && (
                        <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                          {[
                            { key: 'newJobs', icon: BriefcaseBusiness, label: locale === 'ka' ? 'ახალი სამუშაოები' : 'New Jobs', desc: locale === 'ka' ? 'როცა შენს კატეგორიაში ახალი სამუშაო დაიდება' : 'When new jobs match your categories' },
                            { key: 'proposals', icon: FileText, label: locale === 'ka' ? 'შეთავაზებები' : 'Proposals', desc: locale === 'ka' ? 'როცა სპეციალისტი გამოგიგზავნის შეთავაზებას' : 'When a pro sends you a proposal' },
                            { key: 'messages', icon: MessageSquare, label: locale === 'ka' ? 'შეტყობინებები' : 'Messages', desc: locale === 'ka' ? 'როცა ახალ შეტყობინებას მიიღებ' : 'When you receive a new message' },
                            { key: 'marketing', icon: Megaphone, label: locale === 'ka' ? 'მარკეტინგი' : 'Marketing', desc: locale === 'ka' ? 'სიახლეები და სპეციალური შეთავაზებები' : 'News and special offers' },
                          ].map((item) => (
                            <div key={item.key} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                                <div>
                                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{item.desc}</p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationData.preferences.email[item.key as keyof typeof notificationData.preferences.email]}
                                  onChange={(e) => updateNotificationPreference('email', item.key, e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-[#E07B4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all duration-200" />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Push Notifications Section */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                      <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                            <Bell className="w-5 h-5 text-violet-500" />
                          </div>
                          <div>
                            <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {locale === 'ka' ? 'Push შეტყობინებები' : 'Push Notifications'}
                            </h3>
                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {locale === 'ka' ? 'ბრაუზერისა და აპის შეტყობინებები' : 'Browser and app notifications'}
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationData.preferences.push.enabled}
                            onChange={(e) => updateNotificationPreference('push', 'enabled', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-violet-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-200" />
                        </label>
                      </div>

                      {notificationData.preferences.push.enabled && (
                        <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                          {[
                            { key: 'newJobs', icon: BriefcaseBusiness, label: locale === 'ka' ? 'ახალი სამუშაოები' : 'New Jobs' },
                            { key: 'proposals', icon: FileText, label: locale === 'ka' ? 'შეთავაზებები' : 'Proposals' },
                            { key: 'messages', icon: MessageSquare, label: locale === 'ka' ? 'შეტყობინებები' : 'Messages' },
                          ].map((item) => (
                            <div key={item.key} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationData.preferences.push[item.key as keyof typeof notificationData.preferences.push]}
                                  onChange={(e) => updateNotificationPreference('push', item.key, e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-violet-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all duration-200" />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SMS Notifications Section */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                      <div className="p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                            <Smartphone className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {locale === 'ka' ? 'SMS შეტყობინებები' : 'SMS Notifications'}
                            </h3>
                            {notificationData.phone ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{notificationData.phone}</span>
                                {notificationData.isPhoneVerified && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                {locale === 'ka' ? 'ტელეფონი არ არის დამატებული' : 'No phone added'}
                              </span>
                            )}
                          </div>
                        </div>
                        {notificationData.phone ? (
                          <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={notificationData.preferences.sms.enabled}
                              onChange={(e) => updateNotificationPreference('sms', 'enabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-200" />
                          </label>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-tertiary)' }}>
                            {locale === 'ka' ? 'მიუწვდომელია' : 'Unavailable'}
                          </span>
                        )}
                      </div>

                      {notificationData.phone && notificationData.preferences.sms.enabled && (
                        <div className="divide-y" style={{ borderTop: '1px solid var(--color-border)', borderColor: 'var(--color-border)' }}>
                          {[
                            { key: 'proposals', icon: FileText, label: locale === 'ka' ? 'შეთავაზებები' : 'Proposals' },
                            { key: 'messages', icon: MessageSquare, label: locale === 'ka' ? 'შეტყობინებები' : 'Messages' },
                          ].map((item) => (
                            <div key={item.key} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={notificationData.preferences.sms[item.key as keyof typeof notificationData.preferences.sms]}
                                  onChange={(e) => updateNotificationPreference('sms', item.key, e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all duration-200" />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info box */}
                    <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          {locale === 'ka' ? 'თქვენი მონაცემები დაცულია' : 'Your data is protected'}
                        </p>
                        <p className="text-xs mt-1 text-blue-600/70 dark:text-blue-400/70">
                          {locale === 'ka'
                            ? 'ჩვენ არასდროს გავყიდით თქვენს ინფორმაციას მესამე მხარეს'
                            : 'We never sell your information to third parties'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'პარამეტრების ჩატვირთვა ვერ მოხერხდა' : 'Failed to load preferences'}
                    </p>
                    <button
                      onClick={fetchNotificationPreferences}
                      className="mt-3 text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F]"
                    >
                      {locale === 'ka' ? 'თავიდან ცდა' : 'Try again'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {locale === 'ka' ? 'პაროლის შეცვლა' : 'Change Password'}
                  </h2>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {locale === 'ka'
                      ? 'შეიყვანეთ მიმდინარე პაროლი და აირჩიეთ ახალი'
                      : 'Enter your current password and choose a new one'}
                  </p>
                </div>

                {passwordMessage && (
                  <div
                    className="p-3 sm:p-4 rounded-xl text-sm flex items-center gap-3"
                    style={{
                      backgroundColor: passwordMessage.type === 'success'
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                      color: passwordMessage.type === 'success'
                        ? '#22c55e'
                        : '#ef4444',
                      border: `1px solid ${passwordMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    }}
                  >
                    {passwordMessage.type === 'success' ? (
                      <Check className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {locale === 'ka' ? 'მიმდინარე პაროლი' : 'Current Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder={locale === 'ka' ? 'შეიყვანეთ მიმდინარე პაროლი' : 'Enter current password'}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {locale === 'ka' ? 'ახალი პაროლი' : 'New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder={locale === 'ka' ? 'შეიყვანეთ ახალი პაროლი' : 'Enter new password'}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${(passwordStrength.strength / 5) * 100}%`,
                                backgroundColor:
                                  passwordStrength.strength <= 1 ? '#ef4444' :
                                  passwordStrength.strength <= 2 ? '#f97316' :
                                  passwordStrength.strength <= 3 ? '#eab308' :
                                  '#22c55e',
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                passwordStrength.strength <= 1 ? '#ef4444' :
                                passwordStrength.strength <= 2 ? '#f97316' :
                                passwordStrength.strength <= 3 ? '#eab308' :
                                '#22c55e',
                            }}
                          >
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {locale === 'ka'
                            ? 'გამოიყენეთ მინიმუმ 6 სიმბოლო, დიდი ასოები, ციფრები და სპეციალური სიმბოლოები'
                            : 'Use at least 6 characters, uppercase letters, numbers and special characters'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {locale === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder={locale === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Confirm new password'}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 text-base rounded-xl transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? '1px solid #ef4444'
                            : '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs mt-1 text-red-500">
                        {locale === 'ka' ? 'პაროლები არ ემთხვევა' : 'Passwords do not match'}
                      </p>
                    )}
                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                      <p className="text-xs mt-1 text-green-500 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {locale === 'ka' ? 'პაროლები ემთხვევა' : 'Passwords match'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {locale === 'ka' ? 'იცვლება...' : 'Changing...'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          {locale === 'ka' ? 'პაროლის შეცვლა' : 'Change Password'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className="text-base sm:text-lg font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {locale === 'ka' ? 'გადახდის მეთოდები' : 'Payment Methods'}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'მართეთ თქვენი შენახული ბარათები' : 'Manage your saved cards'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddCardModal(true)}
                    className="px-4 py-2 bg-[#E07B4F] hover:bg-[#D26B3F] text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
                  </button>
                </div>

                {paymentMessage && (
                  <div
                    className="p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in"
                    style={{
                      backgroundColor: paymentMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: paymentMessage.type === 'success' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${paymentMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    }}
                  >
                    {paymentMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {paymentMessage.text}
                  </div>
                )}

                {isLoadingPayments ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
                    </span>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-10 sm:py-12">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                      <CreditCard
                        className="h-8 w-8"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      />
                    </div>
                    <p
                      className="text-sm sm:text-base font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {locale === 'ka' ? 'ბარათები არ არის დამატებული' : 'No cards added yet'}
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {locale === 'ka' ? 'დაამატეთ ბარათი სწრაფი გადახდისთვის' : 'Add a card for faster checkout'}
                    </p>
                    <button
                      onClick={() => setShowAddCardModal(true)}
                      className="mt-4 px-6 py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl transition-all flex items-center gap-2 mx-auto"
                    >
                      <CreditCard className="w-4 h-4" />
                      {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: method.isDefault ? '2px solid #E07B4F' : '1px solid var(--color-border)',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Card Brand Icon */}
                          <div
                            className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: method.cardBrand === 'Visa' ? '#1A1F71' :
                                method.cardBrand === 'Mastercard' ? '#EB001B' :
                                method.cardBrand === 'Amex' ? '#006FCF' : '#6B7280',
                              color: 'white',
                            }}
                          >
                            {method.cardBrand === 'Visa' ? 'VISA' :
                              method.cardBrand === 'Mastercard' ? 'MC' :
                              method.cardBrand === 'Amex' ? 'AMEX' : 'CARD'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                •••• {method.cardLast4}
                              </span>
                              {method.isDefault && (
                                <span className="text-[10px] font-medium text-[#E07B4F] bg-[#E07B4F]/10 px-2 py-0.5 rounded-full">
                                  {locale === 'ka' ? 'მთავარი' : 'Default'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {method.cardholderName}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                {locale === 'ka' ? 'ვადა' : 'Exp'}: {method.cardExpiry}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!method.isDefault && (
                            <button
                              onClick={() => handleSetDefaultCard(method.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {locale === 'ka' ? 'მთავარად დაყენება' : 'Set Default'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCard(method.id)}
                            disabled={deletingCardId === method.id}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                          >
                            {deletingCardId === method.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info box */}
                <div className="p-4 rounded-xl flex items-start gap-3 mt-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {locale === 'ka' ? 'უსაფრთხო გადახდა' : 'Secure Payments'}
                    </p>
                    <p className="text-xs mt-1 text-blue-600/70 dark:text-blue-400/70">
                      {locale === 'ka'
                        ? 'თქვენი ბარათის ინფორმაცია დაშიფრულია და უსაფრთხოდ ინახება'
                        : 'Your card information is encrypted and securely stored'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Email Modal */}
      {showAddEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (emailOtpStep === 'email') {
                setShowAddEmailModal(false);
                setNewEmail('');
                setAddEmailError('');
              }
            }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Header */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E07B4F]/10">
                    <Mail className="w-5 h-5 text-[#E07B4F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {emailOtpStep === 'success'
                        ? (locale === 'ka' ? 'წარმატებით დაემატა!' : 'Successfully Added!')
                        : emailOtpStep === 'otp'
                          ? (locale === 'ka' ? 'დაადასტურე ელ-ფოსტა' : 'Verify Email')
                          : (locale === 'ka' ? 'ელ-ფოსტის დამატება' : 'Add Email')}
                    </h3>
                    {emailOtpStep === 'otp' && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {locale === 'ka' ? `კოდი გაიგზავნა ${newEmail}-ზე` : `Code sent to ${newEmail}`}
                      </p>
                    )}
                  </div>
                </div>
                {emailOtpStep !== 'success' && (
                  <button
                    onClick={() => {
                      setShowAddEmailModal(false);
                      setEmailOtpStep('email');
                      setNewEmail('');
                      setOtpCode('');
                      setAddEmailError('');
                    }}
                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {emailOtpStep === 'success' ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka'
                      ? 'თქვენი ელ-ფოსტა წარმატებით დადასტურდა'
                      : 'Your email has been verified successfully'}
                  </p>
                </div>
              ) : emailOtpStep === 'otp' ? (
                <div className="space-y-4">
                  {addEmailError && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {addEmailError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? '6-ნიშნა კოდი' : '6-digit code'}
                    </label>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpCode[index] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newOtp = otpCode.split('');
                            newOtp[index] = val;
                            setOtpCode(newOtp.join(''));
                            // Auto-focus next input
                            if (val && index < 5) {
                              const next = e.target.nextElementSibling as HTMLInputElement;
                              next?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                              const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                              prev?.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setOtpCode(paste);
                          }}
                          className="w-full h-12 text-center text-xl font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                          style={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={resendOtp}
                      disabled={isSendingOtp}
                      className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {locale === 'ka' ? 'ხელახლა გაგზავნა' : 'Resend code'}
                    </button>
                    <button
                      onClick={() => {
                        setEmailOtpStep('email');
                        setOtpCode('');
                      }}
                      className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {locale === 'ka' ? 'ელ-ფოსტის შეცვლა' : 'Change email'}
                    </button>
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {locale === 'ka' ? 'მოწმდება...' : 'Verifying...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {locale === 'ka' ? 'დადასტურება' : 'Verify'}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka'
                      ? 'დაამატე ელ-ფოსტა რომ მიიღო შეტყობინებები ელ-ფოსტით'
                      : 'Add your email to receive notifications via email'}
                  </p>

                  {addEmailError && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {addEmailError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'ელ-ფოსტა' : 'Email address'}
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={locale === 'ka' ? 'შეიყვანე ელ-ფოსტა' : 'Enter your email'}
                      className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleAddEmail}
                    disabled={isAddingEmail || !newEmail}
                    className="w-full py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAddingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isSendingOtp ? (locale === 'ka' ? 'კოდი იგზავნება...' : 'Sending code...') : (locale === 'ka' ? 'ემატება...' : 'Adding...')}
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddCardModal(false);
              setCardFormData({ cardNumber: '', cardExpiry: '', cardholderName: '', setAsDefault: false });
            }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Header */}
            <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E07B4F]/10">
                    <CreditCard className="w-5 h-5 text-[#E07B4F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'შეიყვანეთ ბარათის მონაცემები' : 'Enter your card details'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddCardModal(false);
                    setCardFormData({ cardNumber: '', cardExpiry: '', cardholderName: '', setAsDefault: false });
                  }}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {locale === 'ka' ? 'ბარათის ნომერი' : 'Card Number'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardFormData.cardNumber}
                  onChange={(e) => setCardFormData(prev => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value)
                  }))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Expiry and Cardholder in row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? 'ვადა' : 'Expiry'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardFormData.cardExpiry}
                    onChange={(e) => setCardFormData(prev => ({
                      ...prev,
                      cardExpiry: formatCardExpiry(e.target.value)
                    }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? 'CVV' : 'CVV'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="***"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {locale === 'ka' ? 'ბარათის მფლობელი' : 'Cardholder Name'}
                </label>
                <input
                  type="text"
                  value={cardFormData.cardholderName}
                  onChange={(e) => setCardFormData(prev => ({
                    ...prev,
                    cardholderName: e.target.value.toUpperCase()
                  }))}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F] uppercase"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Set as default checkbox */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={cardFormData.setAsDefault}
                  onChange={(e) => setCardFormData(prev => ({ ...prev, setAsDefault: e.target.checked }))}
                  className="w-5 h-5 rounded border-neutral-300 text-[#E07B4F] focus:ring-[#E07B4F]"
                />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka' ? 'მთავარ ბარათად დაყენება' : 'Set as default card'}
                </span>
              </label>

              {/* Submit Button */}
              <button
                onClick={handleAddCard}
                disabled={isAddingCard || !cardFormData.cardNumber || !cardFormData.cardExpiry || !cardFormData.cardholderName}
                className="w-full py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingCard ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {locale === 'ka' ? 'ემატება...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="flex items-center gap-2 justify-center pt-2">
                <Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka' ? 'თქვენი მონაცემები დაცულია' : 'Your data is secure'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

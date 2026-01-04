'use client';

import AuthGuard from '@/components/common/AuthGuard';
import Avatar from '@/components/common/Avatar';
import AvatarCropper from '@/components/common/AvatarCropper';
import BackButton from '@/components/common/BackButton';
import Header, { HeaderSpacer } from '@/components/common/Header';
import PasswordChangeForm from '@/components/settings/PasswordChangeForm';
import PaymentMethodCard, { EmptyPaymentMethods, type PaymentMethod } from '@/components/settings/PaymentMethodCard';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage, countries } from '@/contexts/LanguageContext';
import { AlertCircle, AlertTriangle, BadgeCheck, Bell, BriefcaseBusiness, Calendar, Camera, Check, CheckCircle2, ChevronDown, ChevronRight, CreditCard, Eye, EyeOff, Facebook, FileText, Globe, Instagram, Linkedin, Loader2, Lock, Mail, MapPin, Megaphone, MessageCircle, MessageSquare, RefreshCw, Send, Shield, Smartphone, Trash2, Upload, User, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

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

function SettingsPageContent() {
  const { user, isAuthenticated, isLoading, updateUser, logout } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isTabsOpen, setIsTabsOpen] = useState(false);
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

  // Verification state (for pro users)
  const [verificationData, setVerificationData] = useState({
    facebookUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    websiteUrl: '',
    idDocumentUrl: '',
    idDocumentBackUrl: '',
    selfieWithIdUrl: '',
    verificationStatus: 'pending',
  });
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [isSavingVerification, setIsSavingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Profile deactivation state (for pro users)
  const [isProfileDeactivated, setIsProfileDeactivated] = useState(false);
  const [deactivatedUntil, setDeactivatedUntil] = useState<Date | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [deactivateUntilInput, setDeactivateUntilInput] = useState('');
  const [deactivateReasonInput, setDeactivateReasonInput] = useState('');
  const [deactivationError, setDeactivationError] = useState('');

  // Avatar cropper state
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Phone change verification state
  const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [phoneChangeError, setPhoneChangeError] = useState('');
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);

  // City dropdown state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Get cities from country data
  const georgianCities = countries.GE.citiesLocal;
  const englishCities = countries.GE.cities;

  // Click outside to close city dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };

    if (showCityDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCityDropdown]);

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

  // Avatar select handler - opens cropper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: locale === 'ka' ? 'მხოლოდ სურათები არის დაშვებული' : 'Only image files are allowed' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: locale === 'ka' ? 'ფაილი ძალიან დიდია (მაქს. 10MB)' : 'File is too large (max 10MB)' });
      return;
    }

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
    setFormData(prev => ({ ...prev, avatar: previewUrl }));

    // Upload the cropped image
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, 'avatar.jpg');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/avatar`, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      // Update with the actual URL from server
      setFormData(prev => ({ ...prev, avatar: data.url }));
      setMessage({ type: 'success', text: locale === 'ka' ? 'სურათი აიტვირთა' : 'Image uploaded successfully' });
    } catch {
      setMessage({ type: 'error', text: locale === 'ka' ? 'სურათის ატვირთვა ვერ მოხერხდა' : 'Failed to upload image' });
      // Revert to previous avatar on error
      setFormData(prev => ({ ...prev, avatar: user?.avatar || '' }));
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setShowAvatarCropper(false);
    if (rawAvatarImage) {
      URL.revokeObjectURL(rawAvatarImage);
      setRawAvatarImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      } else {
        // If endpoint fails, set default preferences so UI still works
        console.error('Notification preferences endpoint failed:', res.status);
        setNotificationData({
          email: user?.email || null,
          isEmailVerified: false,
          phone: user?.phone || null,
          isPhoneVerified: false,
          preferences: {
            email: { enabled: true, newJobs: true, proposals: true, messages: true, marketing: false },
            push: { enabled: true, newJobs: true, proposals: true, messages: true },
            sms: { enabled: false, proposals: false, messages: false },
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      // Set defaults on error so UI renders
      setNotificationData({
        email: user?.email || null,
        isEmailVerified: false,
        phone: user?.phone || null,
        isPhoneVerified: false,
        preferences: {
          email: { enabled: true, newJobs: true, proposals: true, messages: true, marketing: false },
          push: { enabled: true, newJobs: true, proposals: true, messages: true },
          sms: { enabled: false, proposals: false, messages: false },
        },
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === 'notifications' && !notificationData) {
      fetchNotificationPreferences();
    }
  }, [activeTab, notificationData, fetchNotificationPreferences]);

  // Fetch verification data for pro users
  const fetchVerificationData = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'pro') return;

    setIsLoadingVerification(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationData({
          facebookUrl: data.facebookUrl || '',
          instagramUrl: data.instagramUrl || '',
          linkedinUrl: data.linkedinUrl || '',
          websiteUrl: data.websiteUrl || '',
          idDocumentUrl: data.idDocumentUrl || '',
          idDocumentBackUrl: data.idDocumentBackUrl || '',
          selfieWithIdUrl: data.selfieWithIdUrl || '',
          verificationStatus: data.verificationStatus || 'pending',
        });
      }
    } catch (error) {
      console.error('Failed to fetch verification data:', error);
    } finally {
      setIsLoadingVerification(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (activeTab === 'verification' && user?.role === 'pro') {
      fetchVerificationData();
    }
  }, [activeTab, user?.role, fetchVerificationData]);

  // Upload verification document
  const uploadVerificationDocument = async (file: File, field: 'idDocumentUrl' | 'idDocumentBackUrl' | 'selfieWithIdUrl') => {
    setUploadingField(field);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url || data.path;
        setVerificationData(prev => ({ ...prev, [field]: imageUrl }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setVerificationMessage({
        type: 'error',
        text: locale === 'ka' ? 'ატვირთვა ვერ მოხერხდა' : 'Upload failed',
      });
    } finally {
      setUploadingField(null);
    }
  };

  // Save verification data
  const saveVerificationData = async () => {
    setIsSavingVerification(true);
    setVerificationMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      const hasIdDocuments = verificationData.idDocumentUrl && verificationData.selfieWithIdUrl;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facebookUrl: verificationData.facebookUrl || undefined,
          instagramUrl: verificationData.instagramUrl || undefined,
          linkedinUrl: verificationData.linkedinUrl || undefined,
          websiteUrl: verificationData.websiteUrl || undefined,
          idDocumentUrl: verificationData.idDocumentUrl || undefined,
          idDocumentBackUrl: verificationData.idDocumentBackUrl || undefined,
          selfieWithIdUrl: verificationData.selfieWithIdUrl || undefined,
          // Update status to 'submitted' if ID documents are uploaded
          ...(hasIdDocuments && verificationData.verificationStatus === 'pending' ? { verificationStatus: 'submitted' } : {}),
        }),
      });

      if (response.ok) {
        if (hasIdDocuments && verificationData.verificationStatus === 'pending') {
          setVerificationData(prev => ({ ...prev, verificationStatus: 'submitted' }));
        }
        setVerificationMessage({
          type: 'success',
          text: locale === 'ka' ? 'წარმატებით შეინახა' : 'Saved successfully',
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setVerificationMessage({
        type: 'error',
        text: locale === 'ka' ? 'შენახვა ვერ მოხერხდა' : 'Save failed',
      });
    } finally {
      setIsSavingVerification(false);
    }
  };

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

      if (res.ok) {
        // Show success briefly
        setNotificationMessage({
          type: 'success',
          text: locale === 'ka' ? 'შენახულია' : 'Saved',
        });
        setTimeout(() => setNotificationMessage(null), 1500);
      } else {
        console.error('Failed to update notification preferences:', res.status);
        // Keep the optimistic update - user changed the toggle
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Keep the optimistic update - don't show error for better UX
    }
  };

  // Add/Change email flow
  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setAddEmailError(locale === 'ka' ? 'შეიყვანეთ სწორი ელ-ფოსტა' : 'Please enter a valid email');
      return;
    }

    // Prevent setting the same email
    if (newEmail.toLowerCase() === formData.email?.toLowerCase()) {
      setAddEmailError(locale === 'ka' ? 'ეს იგივე ელ-ფოსტაა' : 'This is the same email');
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
      setAddEmailError(error.message || (locale === 'ka' ? 'ელ-ფოსტის განახლება ვერ მოხერხდა' : 'Failed to update email'));
    } finally {
      setIsAddingEmail(false);
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 4) {
      setAddEmailError(locale === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი' : 'Please enter 4-digit code');
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
        // Update local formData
        setFormData(prev => ({ ...prev, email: newEmail }));
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

  // Phone change flow
  const handleChangePhone = async () => {
    const cleanPhone = newPhone.replace(/\s/g, '');

    if (!cleanPhone || cleanPhone.length < 9) {
      setPhoneChangeError(locale === 'ka' ? 'შეიყვანეთ სწორი ტელეფონის ნომერი' : 'Please enter a valid phone number');
      return;
    }

    setIsChangingPhone(true);
    setPhoneChangeError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Format the phone number
      let formattedPhone = cleanPhone;
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('995')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+995' + formattedPhone;
        }
      }

      // Send OTP to new phone
      setIsSendingPhoneOtp(true);
      const otpRes = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formattedPhone, type: 'phone' }),
      });

      if (otpRes.ok) {
        setNewPhone(formattedPhone);
        setPhoneOtpStep('otp');
      } else {
        const data = await otpRes.json();
        throw new Error(data.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      setPhoneChangeError(error.message || (locale === 'ka' ? 'კოდის გაგზავნა ვერ მოხერხდა' : 'Failed to send verification code'));
    } finally {
      setIsChangingPhone(false);
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtpCode.length !== 4) {
      setPhoneChangeError(locale === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი' : 'Please enter 4-digit code');
      return;
    }

    setIsVerifyingPhoneOtp(true);
    setPhoneChangeError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      // Verify the OTP
      const verifyRes = await fetch(`${API_URL}/verification/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newPhone, code: phoneOtpCode, type: 'phone' }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Invalid code');
      }

      // Update phone number in profile
      const updateRes = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: newPhone }),
      });

      if (updateRes.ok) {
        setPhoneOtpStep('success');
        // Update local state
        setFormData(prev => ({ ...prev, phone: newPhone }));
        // Update user context
        if (user) {
          updateUser({ ...user, phone: newPhone });
        }
        setTimeout(() => {
          setShowPhoneChangeModal(false);
          setPhoneOtpStep('phone');
          setNewPhone('');
          setPhoneOtpCode('');
        }, 2000);
      } else {
        throw new Error('Failed to update phone');
      }
    } catch (error: any) {
      setPhoneChangeError(error.message || (locale === 'ka' ? 'კოდი არასწორია' : 'Invalid verification code'));
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const resendPhoneOtp = async () => {
    setIsSendingPhoneOtp(true);
    setPhoneChangeError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/verification/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newPhone, type: 'phone' }),
      });
      if (!res.ok) throw new Error('Failed to resend code');
      setMessage({
        type: 'success',
        text: locale === 'ka' ? 'კოდი გაიგზავნა ხელახლა' : 'Code resent successfully',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setPhoneChangeError(locale === 'ka' ? 'კოდის გაგზავნა ვერ მოხერხდა' : 'Failed to resend code');
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    const confirmWord = locale === 'ka' ? 'წაშლა' : 'DELETE';
    if (deleteConfirmText !== confirmWord) {
      setDeleteError(locale === 'ka' ? `გთხოვთ ჩაწეროთ "${confirmWord}" დასადასტურებლად` : `Please type "${confirmWord}" to confirm`);
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Clear auth state and redirect - logout() will handle state cleanup and navigation
        logout();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error: any) {
      setDeleteError(error.message || (locale === 'ka' ? 'ანგარიშის წაშლა ვერ მოხერხდა' : 'Failed to delete account'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Fetch deactivation status for pro users
  const fetchDeactivationStatus = useCallback(async () => {
    if (!isAuthenticated || (user?.role !== 'pro' && user?.role !== 'admin')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/users/me/deactivation-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsProfileDeactivated(data.isDeactivated);
        setDeactivatedUntil(data.deactivatedUntil ? new Date(data.deactivatedUntil) : null);
        setDeactivationReason(data.reason || '');
      }
    } catch (error) {
      console.error('Failed to fetch deactivation status:', error);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (activeTab === 'account' && (user?.role === 'pro' || user?.role === 'admin')) {
      fetchDeactivationStatus();
    }
  }, [activeTab, user?.role, fetchDeactivationStatus]);

  // Deactivate pro profile
  const handleDeactivateProfile = async () => {
    setIsDeactivating(true);
    setDeactivationError('');
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/users/me/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deactivateUntil: deactivateUntilInput || undefined,
          reason: deactivateReasonInput || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsProfileDeactivated(true);
        setDeactivatedUntil(data.deactivatedUntil ? new Date(data.deactivatedUntil) : null);
        setDeactivationReason(data.deactivationReason || '');
        setShowDeactivateModal(false);
        setDeactivateUntilInput('');
        setDeactivateReasonInput('');
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to deactivate profile');
      }
    } catch (error: any) {
      setDeactivationError(error.message || (locale === 'ka' ? 'დეაქტივაცია ვერ მოხერხდა' : 'Failed to deactivate profile'));
    } finally {
      setIsDeactivating(false);
    }
  };

  // Reactivate pro profile
  const handleReactivateProfile = async () => {
    setIsReactivating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/users/me/reactivate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsProfileDeactivated(false);
        setDeactivatedUntil(null);
        setDeactivationReason('');
      }
    } catch (error) {
      console.error('Failed to reactivate profile:', error);
    } finally {
      setIsReactivating(false);
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
    // Payments tab - only visible in development
    ...(process.env.NODE_ENV === 'development' ? [{ id: 'payments', label: t('settings.tabs.payments'), icon: CreditCard }] : []),
    { id: 'account', label: locale === 'ka' ? 'ანგარიში' : 'Account', icon: Shield },
  ];

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

      <div className="min-h-screen relative">
        <Header />
        <HeaderSpacer />

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

        {/* Desktop: Sidebar + Content layout */}
        <div className="hidden sm:flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Vertical tabs */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="flex md:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#E07B4F] text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="md:hidden lg:inline">{tab.label}</span>
                  <span className="hidden md:inline lg:hidden">{tab.label.split(' ')[0]}</span>
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

                {/* Avatar Upload - Only for clients (not pro or company) */}
                {user?.role === 'client' && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative group">
                      <Avatar
                        src={formData.avatar}
                        name={formData.name}
                        size="2xl"
                        className="ring-4 ring-neutral-200 dark:ring-neutral-700"
                      />
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                      {!isUploadingAvatar && (
                        <label
                          htmlFor="avatar-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-all duration-200 ease-out cursor-pointer touch-manipulation"
                        >
                          <Camera className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                        </label>
                      )}
                      <input
                        id="avatar-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploadingAvatar}
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
                      <label
                        htmlFor="avatar-upload"
                        className={`mt-2 text-sm font-medium transition-all duration-200 ease-out touch-manipulation cursor-pointer inline-block ${
                          isUploadingAvatar
                            ? 'text-neutral-400 cursor-not-allowed'
                            : 'text-[#E07B4F] hover:text-[#D26B3F]'
                        }`}
                      >
                        {isUploadingAvatar
                          ? (locale === 'ka' ? 'იტვირთება...' : 'Uploading...')
                          : t('settings.profile.uploadPhoto')}
                      </label>
                    </div>
                  </div>
                )}

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
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="email"
                            value={formData.email}
                            disabled
                            placeholder={locale === 'ka' ? 'ელ-ფოსტა არ არის დამატებული' : 'No email added'}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200 cursor-not-allowed opacity-70"
                            style={{
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                          {formData.email && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                                  {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewEmail(''); // Clear the field so user enters new email
                            setAddEmailError('');
                            setEmailOtpStep('email');
                            setOtpCode('');
                            setShowAddEmailModal(true);
                          }}
                          className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all hover:bg-[#E07B4F]/10"
                          style={{
                            border: '1px solid #E07B4F',
                            color: '#E07B4F',
                          }}
                        >
                          {formData.email
                            ? (locale === 'ka' ? 'შეცვლა' : 'Change')
                            : (locale === 'ka' ? 'დამატება' : 'Add')}
                        </button>
                      </div>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {locale === 'ka' ? 'ელ-ფოსტის შეცვლა მოითხოვს ვერიფიკაციას' : 'Changing your email requires verification'}
                      </p>
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.phone')}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="tel"
                            inputMode="tel"
                            value={formData.phone}
                            disabled
                            placeholder={t('settings.profile.phonePlaceholder')}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200 cursor-not-allowed opacity-70"
                            style={{
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)',
                            }}
                          />
                          {formData.phone && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                                  {locale === 'ka' ? 'დადასტურებული' : 'Verified'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPhone(formData.phone || '');
                            setShowPhoneChangeModal(true);
                          }}
                          className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all hover:bg-[#E07B4F]/10"
                          style={{
                            border: '1px solid #E07B4F',
                            color: '#E07B4F',
                          }}
                        >
                          {formData.phone
                            ? (locale === 'ka' ? 'შეცვლა' : 'Change')
                            : (locale === 'ka' ? 'დამატება' : 'Add')}
                        </button>
                      </div>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {locale === 'ka' ? 'ნომრის შეცვლა მოითხოვს ვერიფიკაციას' : 'Changing your number requires verification'}
                      </p>
                    </div>
                    <div ref={cityDropdownRef} className="relative">
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {t('settings.profile.city')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCityDropdown(!showCityDropdown)}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200 flex items-center justify-between text-left"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: formData.city ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                          <span>
                            {formData.city || t('settings.profile.cityPlaceholder')}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${showCityDropdown ? 'rotate-180' : ''}`}
                          style={{ color: 'var(--color-text-tertiary)' }}
                        />
                      </button>

                      {/* City Dropdown */}
                      {showCityDropdown && (
                        <div
                          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl shadow-lg animate-fade-in"
                          style={{
                            backgroundColor: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {/* Clear selection option */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, city: '' }));
                              setShowCityDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            <X className="w-3.5 h-3.5" />
                            {locale === 'ka' ? 'არ მითითება' : 'Not specified'}
                          </button>
                          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                          {georgianCities.map((cityKa, index) => {
                            const cityEn = englishCities[index];
                            const displayCity = locale === 'ka' ? cityKa : cityEn;
                            const isSelected = formData.city === cityKa || formData.city === cityEn;

                            return (
                              <button
                                key={cityEn}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, city: displayCity }));
                                  setShowCityDropdown(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-[#E07B4F]/10'
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                style={{
                                  color: isSelected ? '#E07B4F' : 'var(--color-text-primary)',
                                }}
                              >
                                <span>{displayCity}</span>
                                {isSelected && <Check className="w-4 h-4" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
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
              <PasswordChangeForm
                locale={locale as 'en' | 'ka'}
                onSubmit={async (currentPassword, newPassword) => {
                  try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const token = localStorage.getItem('access_token');

                    const res = await fetch(`${API_URL}/users/change-password`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });

                    if (res.ok) {
                      return { success: true };
                    } else {
                      const data = await res.json();
                      if (res.status === 409) {
                        return { success: false, error: locale === 'ka' ? 'მიმდინარე პაროლი არასწორია' : 'Current password is incorrect' };
                      }
                      return { success: false, error: data.message };
                    }
                  } catch (error: any) {
                    return { success: false, error: error.message };
                  }
                }}
              />
            )}

            {activeTab === 'payments' && process.env.NODE_ENV === 'development' && (
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
                  <EmptyPaymentMethods
                    locale={locale as 'en' | 'ka'}
                    onAddCard={() => setShowAddCardModal(true)}
                  />
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        locale={locale as 'en' | 'ka'}
                        onSetDefault={handleSetDefaultCard}
                        onDelete={handleDeleteCard}
                      />
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

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {locale === 'ka' ? 'ანგარიშის მართვა' : 'Account Management'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka' ? 'მართეთ თქვენი ანგარიშის პარამეტრები' : 'Manage your account settings'}
                  </p>
                </div>

                {/* Pro Profile Deactivation - Only for pro users and admin */}
                {(user?.role === 'pro' || user?.role === 'admin') && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: isProfileDeactivated
                        ? '1px solid rgba(234, 179, 8, 0.3)'
                        : '1px solid var(--color-border)',
                      background: isProfileDeactivated
                        ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.1) 100%)'
                        : 'var(--color-bg-elevated)',
                    }}
                  >
                    <div className="px-5 py-4 border-b" style={{ borderColor: isProfileDeactivated ? 'rgba(234, 179, 8, 0.15)' : 'var(--color-border)' }}>
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className={`w-5 h-5 ${isProfileDeactivated ? 'text-yellow-600' : 'text-[#E07B4F]'}`} />
                        <h3 className={`font-semibold ${isProfileDeactivated ? 'text-yellow-600 dark:text-yellow-500' : ''}`} style={{ color: isProfileDeactivated ? undefined : 'var(--color-text-primary)' }}>
                          {locale === 'ka' ? 'პროფესიონალის პროფილი' : 'Professional Profile'}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                      {isProfileDeactivated ? (
                        // Show reactivation UI when deactivated
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-700 dark:text-yellow-500">
                                {locale === 'ka' ? 'პროფილი დეაქტივირებულია' : 'Profile is deactivated'}
                              </p>
                              <p className="text-sm mt-1 text-yellow-600/80 dark:text-yellow-500/80">
                                {locale === 'ka'
                                  ? 'თქვენი პროფილი არ ჩანს კლიენტებისთვის'
                                  : 'Your profile is hidden from clients'}
                              </p>
                              {deactivatedUntil && (
                                <p className="text-sm mt-2 text-yellow-600/80 dark:text-yellow-500/80">
                                  {locale === 'ka' ? 'დაბრუნდება:' : 'Returns:'} {deactivatedUntil.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              )}
                              {deactivationReason && (
                                <p className="text-sm mt-1 text-yellow-600/60 dark:text-yellow-500/60">
                                  {locale === 'ka' ? 'მიზეზი:' : 'Reason:'} {deactivationReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleReactivateProfile}
                            disabled={isReactivating}
                            className="w-full px-5 py-3 bg-[#E07B4F] hover:bg-[#C4735B] text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isReactivating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            {locale === 'ka' ? 'პროფილის გააქტიურება' : 'Reactivate Profile'}
                          </button>
                        </div>
                      ) : (
                        // Show deactivation option when active
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                              {locale === 'ka' ? 'დროებით გამორთვა' : 'Temporarily Pause'}
                            </h4>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                              {locale === 'ka'
                                ? 'დროებით დამალეთ თქვენი პროფილი კლიენტებისგან. შეგიძლიათ ნებისმიერ დროს გააქტიუროთ.'
                                : 'Temporarily hide your profile from clients. You can reactivate anytime.'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowDeactivateModal(true)}
                            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30"
                          >
                            <BriefcaseBusiness className="w-4 h-4" />
                            {locale === 'ka' ? 'პროფილის დამალვა' : 'Pause Profile'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(239, 68, 68, 0.08) 100%)',
                  }}
                >
                  <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="font-semibold text-red-600 dark:text-red-400">
                        {locale === 'ka' ? 'საშიში ზონა' : 'Danger Zone'}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {locale === 'ka' ? 'ანგარიშის წაშლა' : 'Delete Account'}
                        </h4>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {locale === 'ka'
                            ? 'სამუდამოდ წაშალეთ თქვენი ანგარიში და ყველა მონაცემი. ეს მოქმედება შეუქცევადია.'
                            : 'Permanently delete your account and all data. This action cannot be undone.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                        {locale === 'ka' ? 'ანგარიშის წაშლა' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {user?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {user?.email || user?.phone}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {locale === 'ka' ? 'ანგარიშის ID:' : 'Account ID:'} #{user?.uid || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Accordion Layout */}
        <div className="sm:hidden space-y-3">
          {tabs.map((tab) => {
            const isOpen = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900"
              >
                <button
                  onClick={() => setActiveTab(isOpen ? '' : tab.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOpen ? 'bg-[#E07B4F]' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                      <tab.icon className={`h-4 w-4 ${isOpen ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${isOpen ? 'text-[#E07B4F]' : 'text-neutral-900 dark:text-white'}`}>
                      {tab.label}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="pt-4">
                      {tab.id === 'profile' && (
                        <div className="space-y-6">
                          {message && (
                            <div
                              className="p-3 rounded-xl text-sm"
                              style={{
                                backgroundColor: message.type === 'success'
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: message.type === 'success' ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)',
                              }}
                            >
                              {message.text}
                            </div>
                          )}

                          {/* Avatar */}
                          <div className="flex flex-col items-center">
                            <div className="relative">
                              <Avatar
                                src={formData.avatar}
                                name={formData.name}
                                size="2xl"
                                className="ring-2 ring-offset-2 ring-neutral-200 dark:ring-neutral-700"
                              />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                style={{ backgroundColor: '#E07B4F' }}
                              >
                                <Camera className="w-4 h-4 text-white" />
                              </button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </div>
                          </div>

                          {/* Name */}
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                              {t('settings.profile.name')}
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/30"
                              style={{
                                backgroundColor: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                              }}
                            />
                          </div>

                          {/* City */}
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                              {t('settings.profile.city')}
                            </label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]/30"
                              style={{
                                backgroundColor: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                              }}
                            />
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="w-full py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#E07B4F' }}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {locale === 'ka' ? 'ინახება...' : 'Saving...'}
                              </>
                            ) : (
                              locale === 'ka' ? 'შენახვა' : 'Save Changes'
                            )}
                          </button>
                        </div>
                      )}

                      {tab.id === 'notifications' && (
                        <div className="space-y-4">
                          {isLoadingNotifications || !notificationData ? (
                            <div className="py-8 flex justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                            </div>
                          ) : (
                            <>
                              {/* Email Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#E07B4F]" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {locale === 'ka' ? 'ელ-ფოსტა' : 'Email'}
                                    </span>
                                    {notificationData.email && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        {notificationData.isEmailVerified ? (locale === 'ka' ? 'დადასტურებული' : 'Verified') : (locale === 'ka' ? 'დასადასტურებელი' : 'Unverified')}
                                      </span>
                                    )}
                                  </div>
                                  {notificationData.email ? (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notificationData.preferences.email.enabled}
                                        onChange={(e) => updateNotificationPreference('email', 'enabled', e.target.checked)}
                                      />
                                      <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-[#E07B4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                                    </label>
                                  ) : (
                                    <button
                                      onClick={() => setShowAddEmailModal(true)}
                                      className="text-xs font-medium text-[#E07B4F]"
                                    >
                                      {locale === 'ka' ? 'დამატება' : 'Add'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Push Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-violet-500" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {locale === 'ka' ? 'Push შეტყობინებები' : 'Push Notifications'}
                                    </span>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={notificationData.preferences.push.enabled}
                                      onChange={(e) => updateNotificationPreference('push', 'enabled', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-[#E07B4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                                  </label>
                                </div>
                              </div>

                              {/* SMS Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {locale === 'ka' ? 'SMS შეტყობინებები' : 'SMS Notifications'}
                                    </span>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={notificationData.preferences.sms.enabled}
                                      onChange={(e) => updateNotificationPreference('sms', 'enabled', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-[#E07B4F] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                                  </label>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {tab.id === 'payments' && process.env.NODE_ENV === 'development' && (
                        <div className="space-y-4">
                          {isLoadingPayments ? (
                            <div className="py-8 flex justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                            </div>
                          ) : paymentMethods.length === 0 ? (
                            <div className="text-center py-6">
                              <CreditCard className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                              <p className="text-sm text-neutral-500 mb-4">
                                {locale === 'ka' ? 'ბარათები არ არის დამატებული' : 'No cards added yet'}
                              </p>
                              <button
                                onClick={() => setShowAddCardModal(true)}
                                className="px-4 py-2 bg-[#E07B4F] hover:bg-[#D26B3F] text-white text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                {locale === 'ka' ? 'ბარათის დამატება' : 'Add Card'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                  <PaymentMethodCard
                                    key={method.id}
                                    method={method}
                                    locale={locale as 'en' | 'ka'}
                                    onSetDefault={handleSetDefaultCard}
                                    onDelete={handleDeleteCard}
                                  />
                                ))}
                              </div>
                              <button
                                onClick={() => setShowAddCardModal(true)}
                                className="w-full px-4 py-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium rounded-xl transition-all hover:border-[#E07B4F] hover:text-[#E07B4F] flex items-center justify-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                {locale === 'ka' ? 'ახალი ბარათის დამატება' : 'Add New Card'}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {tab.id === 'security' && (
                        <PasswordChangeForm
                          locale={locale as 'en' | 'ka'}
                          onSubmit={async (currentPassword, newPassword) => {
                            try {
                              const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                              const token = localStorage.getItem('access_token');

                              const res = await fetch(`${API_URL}/users/change-password`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ currentPassword, newPassword }),
                              });

                              if (res.ok) {
                                return { success: true };
                              } else {
                                const data = await res.json();
                                if (res.status === 409) {
                                  return { success: false, error: locale === 'ka' ? 'მიმდინარე პაროლი არასწორია' : 'Current password is incorrect' };
                                }
                                return { success: false, error: data.message };
                              }
                            } catch (error: any) {
                              return { success: false, error: error.message };
                            }
                          }}
                        />
                      )}

                      {tab.id === 'account' && (
                        <div className="space-y-4">
                          {/* Account Info */}
                          <div
                            className="p-4 rounded-xl flex items-start gap-3"
                            style={{
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {user?.name}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                {user?.email || user?.phone}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                {locale === 'ka' ? 'ანგარიშის ID:' : 'Account ID:'} #{user?.uid || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Delete Account Button */}
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            {locale === 'ka' ? 'ანგარიშის წაშლა' : 'Delete Account'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isDeletingAccount) {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
                setDeleteError('');
              }
            }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Header with gradient */}
            <div
              className="p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                {locale === 'ka' ? 'ანგარიშის წაშლა' : 'Delete Account'}
              </h3>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {locale === 'ka'
                  ? 'ეს მოქმედება შეუქცევადია და წაშლის თქვენს ყველა მონაცემს.'
                  : 'This action is irreversible and will delete all your data.'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Warning list */}
              <div className="space-y-2.5">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka' ? 'ეს მოქმედება წაშლის:' : 'This will permanently delete:'}
                </p>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {locale === 'ka' ? 'თქვენი პროფილი და პირადი ინფორმაცია' : 'Your profile and personal information'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {locale === 'ka' ? 'ყველა განთავსებული სამუშაო და წინადადება' : 'All posted jobs and proposals'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {locale === 'ka' ? 'შეტყობინებები და შეფასებები' : 'Messages and reviews'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {locale === 'ka' ? 'შენახული ბარათები და გადახდის ისტორია' : 'Saved cards and payment history'}
                  </li>
                </ul>
              </div>

              {/* Confirmation input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka'
                    ? 'ჩაწერეთ "წაშლა" დასადასტურებლად'
                    : 'Type "DELETE" to confirm'}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={locale === 'ka' ? 'წაშლა' : 'DELETE'}
                  disabled={isDeletingAccount}
                  className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-center tracking-widest"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Error message */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3 rounded-xl font-medium transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== (locale === 'ka' ? 'წაშლა' : 'DELETE')}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:disabled:bg-red-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'ka' ? 'იშლება...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {locale === 'ka' ? 'წაშლა' : 'Delete'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Profile Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isDeactivating) {
                setShowDeactivateModal(false);
                setDeactivateUntilInput('');
                setDeactivateReasonInput('');
                setDeactivationError('');
              }
            }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Header */}
            <div
              className="p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
                borderBottom: '1px solid rgba(234, 179, 8, 0.15)',
              }}
            >
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-4">
                <BriefcaseBusiness className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-500">
                {locale === 'ka' ? 'პროფილის დამალვა' : 'Pause Profile'}
              </h3>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {locale === 'ka'
                  ? 'თქვენი პროფილი დროებით დაიმალება კლიენტებისგან'
                  : 'Your profile will be temporarily hidden from clients'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Until date (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka' ? 'დაბრუნების თარიღი (არასავალდებულო)' : 'Return date (optional)'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                  {!deactivateUntilInput && (
                    <div
                      className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-sm"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {locale === 'ka' ? 'აირჩიეთ თარიღი' : 'Select date'}
                    </div>
                  )}
                  <input
                    type="date"
                    value={deactivateUntilInput}
                    onChange={(e) => setDeactivateUntilInput(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${!deactivateUntilInput ? 'text-transparent' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: deactivateUntilInput ? 'var(--color-text-primary)' : 'transparent',
                    }}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {locale === 'ka'
                    ? 'თუ არ აირჩევთ, შეგიძლიათ ხელით გააქტიუროთ'
                    : 'If not set, you can manually reactivate anytime'}
                </p>
              </div>

              {/* Reason (optional) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {locale === 'ka' ? 'მიზეზი (არასავალდებულო)' : 'Reason (optional)'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <BriefcaseBusiness className="w-5 h-5 text-yellow-600" />
                  </div>
                  <select
                    value={deactivateReasonInput}
                    onChange={(e) => setDeactivateReasonInput(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 appearance-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: deactivateReasonInput ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    }}
                  >
                    <option value="">{locale === 'ka' ? 'აირჩიეთ მიზეზი' : 'Select reason'}</option>
                    <option value="vacation">{locale === 'ka' ? 'შვებულება' : 'Vacation'}</option>
                    <option value="busy">{locale === 'ka' ? 'დატვირთული გრაფიკი' : 'Busy schedule'}</option>
                    <option value="personal">{locale === 'ka' ? 'პირადი მიზეზები' : 'Personal reasons'}</option>
                    <option value="other">{locale === 'ka' ? 'სხვა' : 'Other'}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                <p className="font-medium text-yellow-700 dark:text-yellow-500 text-sm mb-3">
                  {locale === 'ka' ? 'რა მოხდება?' : 'What happens?'}
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <EyeOff className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {locale === 'ka' ? 'კლიენტები ვერ ნახავენ თქვენს პროფილს' : 'Clients won\'t see your profile'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {locale === 'ka' ? 'არსებული შეტყობინებები შენარჩუნდება' : 'Existing messages will be preserved'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {locale === 'ka' ? 'ნებისმიერ დროს შეგიძლიათ გააქტიურება' : 'You can reactivate anytime'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {deactivationError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{deactivationError}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivateUntilInput('');
                    setDeactivateReasonInput('');
                    setDeactivationError('');
                  }}
                  disabled={isDeactivating}
                  className="flex-1 py-3 rounded-xl font-medium transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeactivateProfile}
                  disabled={isDeactivating}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 dark:disabled:bg-yellow-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'ka' ? 'იმალება...' : 'Pausing...'}
                    </>
                  ) : (
                    <>
                      <BriefcaseBusiness className="w-4 h-4" />
                      {locale === 'ka' ? 'პროფილის დამალვა' : 'Pause Profile'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        ? (locale === 'ka' ? 'წარმატებით შეიცვალა!' : 'Successfully Updated!')
                        : emailOtpStep === 'otp'
                          ? (locale === 'ka' ? 'დაადასტურე ელ-ფოსტა' : 'Verify Email')
                          : formData.email
                            ? (locale === 'ka' ? 'ელ-ფოსტის შეცვლა' : 'Change Email')
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
                      ? 'თქვენი ელ-ფოსტა წარმატებით განახლდა'
                      : 'Your email has been updated successfully'}
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
                    disabled={isVerifyingOtp || otpCode.length !== 4}
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
                    {formData.email
                      ? (locale === 'ka'
                        ? 'შეიყვანე ახალი ელ-ფოსტა. ვერიფიკაციის კოდი გაიგზავნება ახალ მისამართზე.'
                        : 'Enter your new email. A verification code will be sent to the new address.')
                      : (locale === 'ka'
                        ? 'დაამატე ელ-ფოსტა რომ მიიღო შეტყობინებები ელ-ფოსტით'
                        : 'Add your email to receive notifications via email')}
                  </p>

                  {/* Show current email when changing */}
                  {formData.email && (
                    <div className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {locale === 'ka' ? 'მიმდინარე ელ-ფოსტა' : 'Current email'}
                        </p>
                        <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {addEmailError && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {addEmailError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {formData.email
                        ? (locale === 'ka' ? 'ახალი ელ-ფოსტა' : 'New email address')
                        : (locale === 'ka' ? 'ელ-ფოსტა' : 'Email address')}
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

      {/* Phone Change Modal */}
      {showPhoneChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (phoneOtpStep === 'phone') {
                setShowPhoneChangeModal(false);
                setNewPhone('');
                setPhoneChangeError('');
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
                    <Smartphone className="w-5 h-5 text-[#E07B4F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {phoneOtpStep === 'success'
                        ? (locale === 'ka' ? 'წარმატებით შეიცვალა!' : 'Successfully Changed!')
                        : phoneOtpStep === 'otp'
                          ? (locale === 'ka' ? 'დაადასტურე ნომერი' : 'Verify Number')
                          : (locale === 'ka' ? 'ტელეფონის შეცვლა' : 'Change Phone')}
                    </h3>
                    {phoneOtpStep === 'otp' && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {locale === 'ka' ? `კოდი გაიგზავნა ${newPhone}-ზე` : `Code sent to ${newPhone}`}
                      </p>
                    )}
                  </div>
                </div>
                {phoneOtpStep !== 'success' && (
                  <button
                    onClick={() => {
                      setShowPhoneChangeModal(false);
                      setPhoneOtpStep('phone');
                      setNewPhone('');
                      setPhoneOtpCode('');
                      setPhoneChangeError('');
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
              {phoneOtpStep === 'success' ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {locale === 'ka'
                      ? 'თქვენი ტელეფონის ნომერი წარმატებით შეიცვალა'
                      : 'Your phone number has been changed successfully'}
                  </p>
                </div>
              ) : phoneOtpStep === 'otp' ? (
                <div className="space-y-4">
                  {phoneChangeError && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {phoneChangeError}
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
                          value={phoneOtpCode[index] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            const newOtp = phoneOtpCode.split('');
                            newOtp[index] = val;
                            setPhoneOtpCode(newOtp.join(''));
                            // Auto-focus next input
                            if (val && index < 5) {
                              const next = e.target.nextElementSibling as HTMLInputElement;
                              next?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !phoneOtpCode[index] && index > 0) {
                              const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                              prev?.focus();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setPhoneOtpCode(paste);
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
                      onClick={resendPhoneOtp}
                      disabled={isSendingPhoneOtp}
                      className="text-sm font-medium text-[#E07B4F] hover:text-[#D26B3F] disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSendingPhoneOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {locale === 'ka' ? 'ხელახლა გაგზავნა' : 'Resend code'}
                    </button>
                    <button
                      onClick={() => {
                        setPhoneOtpStep('phone');
                        setPhoneOtpCode('');
                      }}
                      className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {locale === 'ka' ? 'ნომრის შეცვლა' : 'Change number'}
                    </button>
                  </div>

                  <button
                    onClick={handleVerifyPhoneOtp}
                    disabled={isVerifyingPhoneOtp || phoneOtpCode.length !== 4}
                    className="w-full py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingPhoneOtp ? (
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
                      ? 'შეიყვანე ახალი ტელეფონის ნომერი. ჩვენ გამოგიგზავნით ვერიფიკაციის კოდს.'
                      : 'Enter your new phone number. We will send you a verification code.'}
                  </p>

                  {phoneChangeError && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {phoneChangeError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {locale === 'ka' ? 'ტელეფონის ნომერი' : 'Phone number'}
                    </label>
                    <div className="flex gap-2">
                      <div
                        className="flex items-center px-3 rounded-xl text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        +995
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={newPhone.replace(/^\+995/, '')}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setNewPhone(cleaned);
                        }}
                        placeholder="5XX XXX XXX"
                        className="flex-1 px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F]"
                        style={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePhone}
                    disabled={isChangingPhone || !newPhone}
                    className="w-full py-3 bg-[#E07B4F] hover:bg-[#D26B3F] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isChangingPhone ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isSendingPhoneOtp ? (locale === 'ka' ? 'კოდი იგზავნება...' : 'Sending code...') : (locale === 'ka' ? 'იტვირთება...' : 'Loading...')}
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
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>}>
      <AuthGuard>
        <SettingsPageContent />
      </AuthGuard>
    </Suspense>
  );
}

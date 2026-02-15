'use client';

import AuthGuard from '@/components/common/AuthGuard';
import AvatarCropper from '@/components/common/AvatarCropper';
import Select from '@/components/common/Select';
import { AccountSettings, EmailChangeModal, NotificationSettings, PasswordChangeForm, PaymentSettings, PhoneChangeModal, ProfileSettings } from '@/components/settings';
import PaymentMethodCard, { type PaymentMethod } from '@/components/settings/PaymentMethodCard';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toggle } from '@/components/ui/Toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { countries, useLanguage } from '@/contexts/LanguageContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { AlertTriangle, Bell, BriefcaseBusiness, Calendar, ChevronDown, CreditCard, EyeOff, Lock, Mail, MessageCircle, RefreshCw, Shield, Smartphone, Trash2, User, X } from 'lucide-react';
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
  const initialTab = searchParams.get("tab") || 'profile';
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

  // Email change modal state (logic now in EmailChangeModal component)
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);

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

  // Phone change modal state (logic now in PhoneChangeModal component)
  const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);

  // City dropdown state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useClickOutside<HTMLDivElement>(() => setShowCityDropdown(false), showCityDropdown);

  // Get cities from country data
  const georgianCities = countries.GE.citiesLocal;
  const englishCities = countries.GE.cities;

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
      setMessage({ type: 'error', text: t('settings.onlyImageFilesAreAllowed') });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('settings.fileIsTooLargeMax') });
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
      // Update AuthContext immediately so avatar reflects everywhere (header, etc.)
      updateUser({ avatar: data.url });
      setMessage({ type: 'success', text: t('settings.imageUploadedSuccessfully') });
    } catch {
      setMessage({ type: 'error', text: t('settings.failedToUploadImage') });
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
        setMessage({ type: 'success', text: t("settings.profileUpdated") });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: t("common.error") });
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
          text: t('settings.cardAddedSuccessfully')
        });
      } else {
        throw new Error('Failed to add card');
      }
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        text: t('settings.failedToAddCard')
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
          text: t('settings.cardDeleted')
        });
      }
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        text: t('settings.failedToDelete')
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
        text: t('common.uploadFailed'),
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
          text: t('settings.savedSuccessfully'),
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      setVerificationMessage({
        type: 'error',
        text: t('settings.saveFailed'),
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
          text: t('settings.saved'),
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
  // Email/Phone modal handlers moved to EmailChangeModal and PhoneChangeModal components

  // Delete account handler
  const handleDeleteAccount = async () => {
    const confirmWord = t('settings.deleteConfirmWord');
    if (deleteConfirmText !== confirmWord) {
      setDeleteError(t('settings.typeWordToConfirm', { word: confirmWord }));
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
    } catch (error) {
      const err = error as { message?: string };
      setDeleteError(err.message || (t('settings.failedToDeleteAccount')));
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
    } catch (error) {
      const err = error as { message?: string };
      setDeactivationError(err.message || (t('settings.failedToDeactivateProfile')));
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
        <LoadingSpinner size="xl" color="#C4735B" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('common.profile'), icon: User },
    { id: 'notifications', label: t('common.notifications'), icon: Bell },
    { id: 'security', label: t('common.password'), icon: Lock },
    // Payments tab - only visible in development
    ...(process.env.NODE_ENV === 'development' ? [{ id: 'payments', label: t("settings.payments"), icon: CreditCard }] : []),
    { id: 'account', label: t('settings.account'), icon: Shield },
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

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div className="mb-4 sm:mb-8">
          <h1
            className="text-lg sm:text-2xl font-serif font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('settings.title')}
          </h1>
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
                  <span className="hidden md:inline lg:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <ProfileSettings
                onOpenEmailModal={() => setShowAddEmailModal(true)}
                onOpenPhoneModal={() => setShowPhoneChangeModal(true)}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationSettings
                locale={locale}
                notificationData={notificationData}
                isLoading={isLoadingNotifications}
                message={notificationMessage}
                onUpdatePreference={updateNotificationPreference}
                onAddEmail={() => setShowAddEmailModal(true)}
                onRetry={fetchNotificationPreferences}
              />
            )}

            {activeTab === 'security' && (
              <PasswordChangeForm
                locale={locale as 'en' | 'ka' | 'ru'}
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
                        return { success: false, error: t('settings.currentPasswordIsIncorrect') };
                      }
                      return { success: false, error: data.message };
                    }
                  } catch (error) {
                    const err = error as { message?: string };
                    return { success: false, error: err.message };
                  }
                }}
              />
            )}

            {activeTab === 'payments' && process.env.NODE_ENV === 'development' && (
              <PaymentSettings onOpenAddCardModal={() => setShowAddCardModal(true)} />
            )}

            {activeTab === 'account' && (
              <AccountSettings
                onOpenDeleteModal={() => setShowDeleteModal(true)}
                onOpenDeactivateModal={() => setShowDeactivateModal(true)}
              />
            )}
          </div>
        </div>

        {/* Mobile: Accordion Layout */}
        <div className="sm:hidden space-y-2">
          {tabs.map((tab) => {
            const isOpen = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900"
              >
                <button
                  onClick={() => setActiveTab(isOpen ? '' : tab.id)}
                  className="w-full flex items-center justify-between px-3 py-3 text-left active:bg-neutral-50 dark:active:bg-neutral-800/50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOpen ? 'bg-[#E07B4F]' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                      <tab.icon className={`h-4 w-4 ${isOpen ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}`} />
                    </div>
                    <span className={`text-sm font-medium ${isOpen ? 'text-[#E07B4F]' : 'text-neutral-900 dark:text-white'}`}>
                      {tab.label}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="pt-3">
                      {tab.id === 'profile' && (
                        <ProfileSettings
                          isMobile
                          onOpenEmailModal={() => setShowAddEmailModal(true)}
                          onOpenPhoneModal={() => setShowPhoneChangeModal(true)}
                        />
                      )}

                      {tab.id === 'notifications' && (
                        <div className="space-y-4">
                          {isLoadingNotifications || !notificationData ? (
                            <div className="py-8 flex justify-center">
                              <LoadingSpinner size="md" color="#9ca3af" />
                            </div>
                          ) : (
                            <>
                              {/* Email Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#E07B4F]" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {t('common.email')}
                                    </span>
                                    {notificationData.email && (
                                      <Badge variant={notificationData.isEmailVerified ? "success" : "warning"} size="xs">
                                        {notificationData.isEmailVerified ? (t('common.verified')) : (t('settings.unverified'))}
                                      </Badge>
                                    )}
                                  </div>
                                  {notificationData.email ? (
                                    <Toggle
                                      checked={notificationData.preferences.email.enabled}
                                      onChange={(e) => updateNotificationPreference('email', 'enabled', e.target.checked)}
                                      size="sm"
                                      variant="primary"
                                    />
                                  ) : (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => setShowAddEmailModal(true)}
                                      className="text-xs h-auto p-0"
                                    >
                                      {t('common.add')}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Push Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-violet-500" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {t('settings.pushNotifications')}
                                    </span>
                                  </div>
                                  <Toggle
                                    checked={notificationData.preferences.push.enabled}
                                    onChange={(e) => updateNotificationPreference('push', 'enabled', e.target.checked)}
                                    size="sm"
                                    variant="primary"
                                  />
                                </div>
                              </div>

                              {/* SMS Notifications */}
                              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                                <div className="p-3 flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-green-500" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                      {t('settings.smsNotifications')}
                                    </span>
                                  </div>
                                  <Toggle
                                    checked={notificationData.preferences.sms.enabled}
                                    onChange={(e) => updateNotificationPreference('sms', 'enabled', e.target.checked)}
                                    size="sm"
                                    variant="primary"
                                  />
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
                              <LoadingSpinner size="md" color="#9ca3af" />
                            </div>
                          ) : paymentMethods.length === 0 ? (
                            <div className="text-center py-6">
                              <CreditCard className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                              <p className="text-sm text-neutral-500 mb-4">
                                {t('settings.noCardsAddedYet')}
                              </p>
                              <Button
                                onClick={() => setShowAddCardModal(true)}
                                size="sm"
                                leftIcon={<CreditCard className="w-4 h-4" />}
                              >
                                {t('settings.addCard')}
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="space-y-2">
                                {paymentMethods.map((method) => (
                                  <PaymentMethodCard
                                    key={method.id}
                                    method={method}
                                    locale={locale as 'en' | 'ka' | 'ru'}
                                    onSetDefault={handleSetDefaultCard}
                                    onDelete={handleDeleteCard}
                                  />
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddCardModal(true)}
                                className="w-full border-dashed"
                                leftIcon={<CreditCard className="w-4 h-4" />}
                              >
                                {t('settings.addNewCard')}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {tab.id === 'security' && (
                        <PasswordChangeForm
                          locale={locale as 'en' | 'ka' | 'ru'}
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
                                  return { success: false, error: t('settings.currentPasswordIsIncorrect') };
                                }
                                return { success: false, error: data.message };
                              }
                            } catch (error) {
                              const err = error as { message?: string };
                              return { success: false, error: err.message };
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
                                {t('settings.accountId')} #{user?.uid || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Delete Account Button */}
                          <Button
                            variant="destructive"
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                          >
                            {t('settings.deleteAccount')}
                          </Button>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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

          {/* Modal - Sheet on mobile */}
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Drag handle - mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {/* Header with gradient */}
            <div
              className="p-4 sm:p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                {t('settings.deleteAccount')}
              </h3>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.thisActionIsIrreversibleAnd')}
              </p>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Warning list */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.thisWillPermanentlyDelete')}
                </p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {t('settings.yourProfileAndPersonalInformation')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {t('settings.allPostedJobsAndProposals')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {t('settings.messagesAndReviews')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {t('settings.savedCardsAndPaymentHistory')}
                  </li>
                </ul>
              </div>

              {/* Confirmation input */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.typeDeleteToConfirm')}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={t('settings.deleteConfirmWord')}
                  disabled={isDeletingAccount}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-center tracking-widest text-sm sm:text-base"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Error message */}
              {deleteError && (
                <Alert variant="error" size="sm">
                  {deleteError}
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2 pb-2 sm:pb-0">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  disabled={isDeletingAccount}
                  className="flex-1 h-10 sm:h-11 text-sm"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== t('settings.deleteConfirmWord')}
                  loading={isDeletingAccount}
                  className="flex-1 h-10 sm:h-11 text-sm"
                  leftIcon={!isDeletingAccount ? <Trash2 className="w-4 h-4" /> : undefined}
                >
                  {isDeletingAccount
                    ? (t('common.deleting'))
                    : (t('common.delete'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Profile Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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

          {/* Modal - Sheet on mobile */}
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Drag handle - mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div
              className="p-4 sm:p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
                borderBottom: '1px solid rgba(234, 179, 8, 0.15)',
              }}
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BriefcaseBusiness className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-500">
                {t('settings.pauseProfile')}
              </h3>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.yourProfileWillBeTemporarily')}
              </p>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Until date (optional) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.returnDateOptional')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                  </div>
                  {!deactivateUntilInput && (
                    <div
                      className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 pointer-events-none text-xs sm:text-sm"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {t('settings.selectDate')}
                    </div>
                  )}
                  <input
                    type="date"
                    value={deactivateUntilInput}
                    onChange={(e) => setDeactivateUntilInput(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500/50 text-sm sm:text-base ${!deactivateUntilInput ? 'text-transparent' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: deactivateUntilInput ? 'var(--color-text-primary)' : 'transparent',
                    }}
                  />
                </div>
                <p className="text-[10px] sm:text-xs mt-1 sm:mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('settings.ifNotSetYouCan')}
                </p>
              </div>

              {/* Reason (optional) */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.reasonOptional')}
                </label>
                <Select
                  value={deactivateReasonInput}
                  onChange={setDeactivateReasonInput}
                  placeholder={t('settings.selectReason')}
                  options={[
                    { value: 'vacation', label: t('settings.vacation') },
                    { value: 'busy', label: t('settings.busySchedule') },
                    { value: 'personal', label: t('settings.personalReasons') },
                    { value: 'other', label: t('common.other') },
                  ]}
                />
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                <p className="font-medium text-yellow-700 dark:text-yellow-500 text-xs sm:text-sm mb-2 sm:mb-3">
                  {t('settings.whatHappens')}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {t('settings.clientsWontSeeYourProfile')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {t('settings.existingMessagesWillBePreserved')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <span className="text-xs sm:text-sm text-yellow-700/90 dark:text-yellow-500/90">
                      {t('settings.youCanReactivateAnytime')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {deactivationError && (
                <Alert variant="error" size="sm">
                  {deactivationError}
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 sm:gap-3 pt-2 pb-2 sm:pb-0">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivateUntilInput('');
                    setDeactivateReasonInput('');
                    setDeactivationError('');
                  }}
                  disabled={isDeactivating}
                  className="flex-1 h-10 sm:h-11 text-sm"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleDeactivateProfile}
                  disabled={isDeactivating}
                  loading={isDeactivating}
                  className="flex-1 h-10 sm:h-11 text-sm bg-yellow-500 hover:bg-yellow-600"
                  leftIcon={!isDeactivating ? <BriefcaseBusiness className="w-4 h-4" /> : undefined}
                >
                  {isDeactivating
                    ? (t('settings.pausing'))
                    : (t('settings.pauseProfile'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Email Modal */}
      <EmailChangeModal
        isOpen={showAddEmailModal}
        onClose={() => setShowAddEmailModal(false)}
        currentEmail={formData.email}
        locale={locale}
        onSuccess={(newEmail) => {
          setFormData(prev => ({ ...prev, email: newEmail }));
          updateUser({ email: newEmail });
          // Also update notification data so email section becomes active
          setNotificationData(prev => prev ? {
            ...prev,
            email: newEmail,
            isEmailVerified: true, // Email was just verified via OTP
          } : null);
        }}
      />

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddCardModal(false);
              setCardFormData({ cardNumber: '', cardExpiry: '', cardholderName: '', setAsDefault: false });
            }}
          />

          {/* Modal - Sheet on mobile */}
          <div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
          >
            {/* Drag handle - mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            </div>

            {/* Header */}
            <div className="p-4 sm:p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#E07B4F]/10">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#E07B4F]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
                      {t('settings.addCard')}
                    </h3>
                    <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {t('settings.enterYourCardDetails')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setShowAddCardModal(false);
                    setCardFormData({ cardNumber: '', cardExpiry: '', cardholderName: '', setAsDefault: false });
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.cardNumber')}
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F] text-sm sm:text-base"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Expiry and Cardholder in row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('settings.expiry')}
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
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F] text-sm sm:text-base"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('settings.cvv')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="***"
                    maxLength={4}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F] text-sm sm:text-base"
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
                <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('settings.cardholderName')}
                </label>
                <input
                  type="text"
                  value={cardFormData.cardholderName}
                  onChange={(e) => setCardFormData(prev => ({
                    ...prev,
                    cardholderName: e.target.value.toUpperCase()
                  }))}
                  placeholder="JOHN DOE"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#E07B4F] uppercase text-sm sm:text-base"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Set as default checkbox */}
              <label className="flex items-center gap-2.5 sm:gap-3 cursor-pointer p-2.5 sm:p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={cardFormData.setAsDefault}
                  onChange={(e) => setCardFormData(prev => ({ ...prev, setAsDefault: e.target.checked }))}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-neutral-300 text-[#E07B4F] focus:ring-[#E07B4F]"
                />
                <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {t('settings.setAsDefaultCard')}
                </span>
              </label>

              {/* Submit Button */}
              <Button
                onClick={handleAddCard}
                disabled={isAddingCard || !cardFormData.cardNumber || !cardFormData.cardExpiry || !cardFormData.cardholderName}
                loading={isAddingCard}
                className="w-full h-10 sm:h-11 text-sm"
                leftIcon={!isAddingCard ? <CreditCard className="w-4 h-4" /> : undefined}
              >
                {isAddingCard
                  ? (t('settings.adding'))
                  : (t('settings.addCard'))}
              </Button>

              {/* Security Note */}
              <div className="flex items-center gap-2 justify-center pt-1 sm:pt-2 pb-2 sm:pb-0">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t('settings.yourDataIsSecure')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Change Modal */}
      <PhoneChangeModal
        isOpen={showPhoneChangeModal}
        onClose={() => setShowPhoneChangeModal(false)}
        currentPhone={formData.phone}
        locale={locale}
        onSuccess={(newPhone) => {
          setFormData(prev => ({ ...prev, phone: newPhone }));
          updateUser({ phone: newPhone });
          // Also update notification data so SMS section becomes active
          setNotificationData(prev => prev ? {
            ...prev,
            phone: newPhone,
          } : null);
        }}
      />
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" color="#9ca3af" /></div>}>
      <AuthGuard>
        <SettingsPageContent />
      </AuthGuard>
    </Suspense>
  );
}

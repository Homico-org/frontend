'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/common/Header';
import Avatar from '@/components/common/Avatar';
import { User, Bell, Shield, CreditCard, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t } = useLanguage();
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

    // For demo purposes, we'll convert to base64 data URL
    // In production, you'd upload to a CDN/cloud storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => ({ ...prev, avatar: base64 }));
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
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'payments', label: t('settings.tabs.payments'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen relative">
      <Header />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
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
                      ? 'bg-emerald-600 text-white'
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
                      className="ring-4"
                      style={{ ringColor: 'var(--color-border)' }}
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
                      className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-all duration-200 ease-out touch-manipulation"
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
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
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
                <h2
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('settings.notifications.title')}
                </h2>
                <div className="space-y-1">
                  {[
                    { key: 'email', label: t('settings.notifications.email') },
                    { key: 'push', label: t('settings.notifications.push') },
                    { key: 'sms', label: t('settings.notifications.sms') },
                    { key: 'marketing', label: t('settings.notifications.marketing') }
                  ].map((item, index, arr) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3"
                      style={{
                        borderBottom: index < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      <span
                        className="text-sm sm:text-base"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {item.label}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer touch-manipulation">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-600 rounded-full peer peer-checked:bg-emerald-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all duration-200" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('settings.security.title')}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t('settings.security.currentPassword')}
                    </label>
                    <input
                      type="password"
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
                      {t('settings.security.newPassword')}
                    </label>
                    <input
                      type="password"
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
                      {t('settings.security.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base rounded-xl transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 ease-out touch-manipulation"
                    >
                      {t('settings.security.updatePassword')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {t('settings.payments.title')}
                </h2>
                <div className="text-center py-6 sm:py-8">
                  <CreditCard
                    className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-3"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {t('settings.payments.noMethods')}
                  </p>
                  <button
                    className="mt-4 w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 ease-out touch-manipulation"
                  >
                    {t('settings.payments.addMethod')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

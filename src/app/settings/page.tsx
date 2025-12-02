'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/common/Header';
import Avatar from '@/components/common/Avatar';
import { User, Bell, Shield, CreditCard, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
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
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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
      <div className="min-h-screen bg-cream-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-800"></div>
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
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-50">{t('settings.title')}</h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('settings.subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-56 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ease-out whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-cream-100 dark:hover:bg-dark-card'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-6">{t('settings.profile.title')}</h2>

                {message && (
                  <div className={`mb-6 p-4 rounded-xl text-sm ${
                    message.type === 'success'
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800'
                      : 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-900/20 dark:text-terracotta-300 dark:border-terracotta-800'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar
                        src={formData.avatar}
                        name={formData.name}
                        size="2xl"
                        className="ring-4 ring-neutral-100 dark:ring-dark-border-subtle"
                      />
                      <button
                        onClick={handleAvatarClick}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out cursor-pointer"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-50">{t('settings.profile.profilePhoto')}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('settings.profile.photoHint')}
                      </p>
                      <button
                        onClick={handleAvatarClick}
                        className="mt-2 text-sm text-forest-800 dark:text-primary-400 hover:text-terracotta-500 dark:hover:text-primary-300 font-medium transition-all duration-200 ease-out"
                      >
                        {t('settings.profile.uploadPhoto')}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-dark-border pt-6">
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.profile.fullName')}</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.profile.email')}</label>
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl bg-neutral-50 dark:bg-dark-elevated text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-neutral-400">{t('settings.profile.emailHint')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.profile.phone')}</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder={t('settings.profile.phonePlaceholder')}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.profile.city')}</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder={t('settings.profile.cityPlaceholder')}
                          className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-6">{t('settings.notifications.title')}</h2>
                <div className="space-y-4">
                  {[
                    { key: 'email', label: t('settings.notifications.email') },
                    { key: 'push', label: t('settings.notifications.push') },
                    { key: 'sms', label: t('settings.notifications.sms') },
                    { key: 'marketing', label: t('settings.notifications.marketing') }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-dark-border last:border-0">
                      <span className="text-neutral-700 dark:text-neutral-400">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-200 dark:bg-dark-elevated peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-forest-100 dark:peer-focus:ring-primary-400/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 dark:after:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-200 peer-checked:bg-forest-800 dark:peer-checked:bg-primary-400"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-6">{t('settings.security.title')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.security.currentPassword')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.security.newPassword')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">{t('settings.security.confirmPassword')}</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800 dark:bg-dark-elevated dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button className="px-6 py-2.5 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out">
                      {t('settings.security.updatePassword')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-card dark:shadow-none p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-6">{t('settings.payments.title')}</h2>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">{t('settings.payments.noMethods')}</p>
                  <button className="mt-4 px-6 py-2.5 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl hover:bg-forest-700 dark:hover:bg-primary-500 transition-all duration-200 ease-out">
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

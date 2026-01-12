'use client';

import Select from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  Building2,
  Camera,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  Save,
  ExternalLink,
  Check,
  X
} from 'lucide-react';

import { storage } from '@/services/storage';
import { COMPANY_ACCENT as ACCENT, COMPANY_ACCENT_HOVER as ACCENT_HOVER } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/Toggle';
import { Input, Textarea } from '@/components/ui/input';

interface CompanySettings {
  name: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  tagline?: string;
  companyType: 'construction' | 'service_agency' | 'both';
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  serviceAreas: string[];
  workingHours?: string;
  foundedYear?: number;
  taxId?: string;
  // Notification settings
  emailNotifications: boolean;
  proposalNotifications: boolean;
  jobAlerts: boolean;
  weeklyReport: boolean;
}

export default function CompanySettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    description: '',
    tagline: '',
    companyType: 'both',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    serviceAreas: [],
    workingHours: '',
    foundedYear: undefined,
    taxId: '',
    emailNotifications: true,
    proposalNotifications: true,
    jobAlerts: true,
    weeklyReport: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'billing'>('profile');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/settings');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      fetchSettings();
    }
  }, [authLoading, user]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/companies/my/company/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
        if (data.logo) {
          setLogoPreview(storage.getFileUrl(data.logo));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/companies/my/company/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success(t('settings.settingsSaved'));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast.error(t('settings.errorSavingSettings'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const formData = new FormData();
      formData.append('logo', file);

      const res = await fetch(`${API_URL}/companies/my/company/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        toast.success(t('settings.logoUploaded'));
      }
    } catch (error) {
      toast.error(t('settings.errorUploadingLogo'));
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: Building2 },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'billing', label: t('settings.billing'), icon: CreditCard },
  ] as const;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <LoadingSpinner size="lg" variant="border" color={ACCENT} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t('common.settings')}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {t('settings.manageYourCompanyProfileAnd')}
          </p>
        </div>

        {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'secondary'}
                onClick={() => setActiveTab(tab.id)}
                leftIcon={<Icon className="w-4 h-4" />}
                className="whitespace-nowrap"
                style={activeTab === tab.id ? { backgroundColor: ACCENT } : {}}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Logo Section */}
              <div className="flex flex-col sm:flex-row gap-6 pb-8 border-b border-[var(--color-border-primary)]">
                <div className="flex-shrink-0">
                  <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-[var(--color-border-primary)] hover:border-[#E07B4F] transition-colors">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Company logo" fill className="object-cover" sizes="96px" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
                          <Building2 className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] flex items-center justify-center shadow-lg group-hover:border-[#E07B4F] transition-colors">
                      <Camera className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                    {t('settings.companyLogo')}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    {t('settings.uploadYourCompanyLogoRecommended')}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {t('settings.basicInformation')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('settings.companyName')}
                    </label>
                    <Input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('settings.tagline')}
                    </label>
                    <Input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder={t('settings.shortDescription')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('common.description')}
                    </label>
                    <Textarea
                      value={settings.description || ''}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('settings.companyType')}
                    </label>
                    <Select
                      value={settings.companyType}
                      onChange={(value) => setSettings({ ...settings, companyType: value as typeof settings.companyType })}
                      options={[
                        { value: 'construction', label: t('settings.construction') },
                        { value: 'service_agency', label: t('settings.serviceAgency') },
                        { value: 'both', label: t('settings.both') },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('settings.foundedYear')}
                    </label>
                    <Input
                      type="number"
                      value={settings.foundedYear || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseInt(value);
                        if (value === '' || (parsed >= 1900 && parsed <= new Date().getFullYear())) {
                          setSettings({ ...settings, foundedYear: parsed || undefined });
                        }
                      }}
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-6 pt-8 border-t border-[var(--color-border-primary)]">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {t('settings.contactInformation')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      {t('common.email')}
                    </label>
                    <Input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      {t('common.phone')}
                    </label>
                    <Input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      {t('common.website')}
                    </label>
                    <Input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {t('settings.city')}
                    </label>
                    <Input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('common.address')}
                    </label>
                    <Input
                      type="text"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {t('settings.workingHours')}
                    </label>
                    <Input
                      type="text"
                      value={settings.workingHours || ''}
                      onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                      placeholder={t('settings.egMonfri9am6pm')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-6">
                {t('settings.notificationPreferences')}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {t('settings.emailNotifications')}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {t('settings.receiveNotificationsViaEmail')}
                    </p>
                  </div>
                  <Toggle
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {t('settings.proposalNotifications')}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {t('settings.updatesOnYourProposals')}
                    </p>
                  </div>
                  <Toggle
                    checked={settings.proposalNotifications}
                    onChange={(e) => setSettings({ ...settings, proposalNotifications: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {t('settings.jobAlerts')}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {t('settings.newJobOpportunitiesMatchingYour')}
                    </p>
                  </div>
                  <Toggle
                    checked={settings.jobAlerts}
                    onChange={(e) => setSettings({ ...settings, jobAlerts: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {t('settings.weeklyReport')}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {t('settings.weeklySummaryOfYourActivity')}
                    </p>
                  </div>
                  <Toggle
                    checked={settings.weeklyReport}
                    onChange={(e) => setSettings({ ...settings, weeklyReport: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-6 sm:p-8">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-6">
                {t('settings.billingSubscription')}
              </h3>

              {/* Current Plan */}
              <div className="p-6 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-1">
                      {t('settings.currentPlan')}
                    </p>
                    <h4 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {t('settings.freePlan')}
                    </h4>
                  </div>
                  <Badge variant="success" size="sm">
                    {t('common.active')}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {t('settings.basicFeaturesForFree')}
                </p>
                <Button rightIcon={<ExternalLink className="w-4 h-4" />}>
                  {t('settings.upgradeToPremium')}
                </Button>
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-2xl border border-[var(--color-border-primary)]">
                <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                  {t('settings.paymentMethod')}
                </h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {t('settings.noPaymentMethodAdded')}
                </p>
                <Button
                  variant="link"
                  className="mt-4 p-0"
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  {t('settings.addPaymentMethod')}
                </Button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="px-6 sm:px-8 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
                leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
              >
                {isSaving
                  ? (t('common.saving'))
                  : (t('settings.saveChanges'))}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

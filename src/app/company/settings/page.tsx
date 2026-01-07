'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
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
  const { locale } = useLanguage();
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
        toast.success(locale === 'ka' ? 'პარამეტრები შენახულია!' : 'Settings saved!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error saving settings');
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
        toast.success(locale === 'ka' ? 'ლოგო ატვირთულია!' : 'Logo uploaded!');
      }
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error uploading logo');
    }
  };

  const tabs = [
    { id: 'profile', label: locale === 'ka' ? 'პროფილი' : 'Profile', icon: Building2 },
    { id: 'notifications', label: locale === 'ka' ? 'შეტყობინებები' : 'Notifications', icon: Bell },
    { id: 'billing', label: locale === 'ka' ? 'გადახდა' : 'Billing', icon: CreditCard },
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
            {locale === 'ka' ? 'პარამეტრები' : 'Settings'}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {locale === 'ka' ? 'მართეთ კომპანიის პროფილი და პარამეტრები' : 'Manage your company profile and preferences'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                style={activeTab === tab.id ? { backgroundColor: ACCENT } : {}}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
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
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
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
                    {locale === 'ka' ? 'კომპანიის ლოგო' : 'Company Logo'}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    {locale === 'ka' ? 'ატვირთეთ კომპანიის ლოგო. რეკომენდებულია 400x400 პიქსელი.' : 'Upload your company logo. Recommended size: 400x400px.'}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'ძირითადი ინფორმაცია' : 'Basic Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'კომპანიის სახელი' : 'Company Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'სლოგანი' : 'Tagline'}
                    </label>
                    <input
                      type="text"
                      value={settings.tagline || ''}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      placeholder={locale === 'ka' ? 'მოკლე აღწერა' : 'Short description'}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'აღწერა' : 'Description'}
                    </label>
                    <textarea
                      value={settings.description || ''}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'კომპანიის ტიპი' : 'Company Type'}
                    </label>
                    <select
                      value={settings.companyType}
                      onChange={(e) => setSettings({ ...settings, companyType: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    >
                      <option value="construction">{locale === 'ka' ? 'სამშენებლო' : 'Construction'}</option>
                      <option value="service_agency">{locale === 'ka' ? 'სერვისის სააგენტო' : 'Service Agency'}</option>
                      <option value="both">{locale === 'ka' ? 'ორივე' : 'Both'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'დაარსების წელი' : 'Founded Year'}
                    </label>
                    <input
                      type="number"
                      value={settings.foundedYear || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = parseInt(value);
                        if (value === '' || (parsed >= 1900 && parsed <= new Date().getFullYear())) {
                          setSettings({ ...settings, foundedYear: parsed || undefined });
                        }
                      }}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-6 pt-8 border-t border-[var(--color-border-primary)]">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {locale === 'ka' ? 'საკონტაქტო ინფორმაცია' : 'Contact Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      {locale === 'ka' ? 'ელფოსტა' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      {locale === 'ka' ? 'ტელეფონი' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      {locale === 'ka' ? 'ვებსაიტი' : 'Website'}
                    </label>
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      placeholder="https://"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {locale === 'ka' ? 'ქალაქი' : 'City'}
                    </label>
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'მისამართი' : 'Address'}
                    </label>
                    <input
                      type="text"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'სამუშაო საათები' : 'Working Hours'}
                    </label>
                    <input
                      type="text"
                      value={settings.workingHours || ''}
                      onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                      placeholder={locale === 'ka' ? 'მაგ: ორშ-პარ, 09:00-18:00' : 'e.g., Mon-Fri, 9AM-6PM'}
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-6">
                {locale === 'ka' ? 'შეტყობინებების პარამეტრები' : 'Notification Preferences'}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'ელფოსტის შეტყობინებები' : 'Email Notifications'}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'მიიღეთ შეტყობინებები ელფოსტით' : 'Receive notifications via email'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                      settings.emailNotifications ? 'bg-[#E07B4F]' : 'bg-[var(--color-border-primary)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        settings.emailNotifications ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'შეთავაზების შეტყობინებები' : 'Proposal Notifications'}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'შეტყობინებები შეთავაზებების სტატუსის შესახებ' : 'Updates on your proposals'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, proposalNotifications: !settings.proposalNotifications })}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                      settings.proposalNotifications ? 'bg-[#E07B4F]' : 'bg-[var(--color-border-primary)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        settings.proposalNotifications ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'ახალი სამუშაოები' : 'Job Alerts'}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'შეტყობინებები ახალი სამუშაოების შესახებ' : 'New job opportunities matching your profile'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, jobAlerts: !settings.jobAlerts })}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                      settings.jobAlerts ? 'bg-[#E07B4F]' : 'bg-[var(--color-border-primary)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        settings.jobAlerts ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-secondary)]">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'ყოველკვირეული რეპორტი' : 'Weekly Report'}
                    </p>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'ყოველკვირეული შეჯამება' : 'Weekly summary of your activity'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, weeklyReport: !settings.weeklyReport })}
                    className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                      settings.weeklyReport ? 'bg-[#E07B4F]' : 'bg-[var(--color-border-primary)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        settings.weeklyReport ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-6 sm:p-8">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-6">
                {locale === 'ka' ? 'გადახდის პარამეტრები' : 'Billing & Subscription'}
              </h3>

              {/* Current Plan */}
              <div className="p-6 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-1">
                      {locale === 'ka' ? 'მიმდინარე გეგმა' : 'Current Plan'}
                    </p>
                    <h4 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'უფასო' : 'Free Plan'}
                    </h4>
                  </div>
                  <Badge variant="success" size="sm">
                    {locale === 'ka' ? 'აქტიური' : 'Active'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {locale === 'ka' ? 'ძირითადი ფუნქციები უფასოდ' : 'Basic features for free'}
                </p>
                <Button rightIcon={<ExternalLink className="w-4 h-4" />}>
                  {locale === 'ka' ? 'განაახლე პრემიუმზე' : 'Upgrade to Premium'}
                </Button>
              </div>

              {/* Payment Method */}
              <div className="p-6 rounded-2xl border border-[var(--color-border-primary)]">
                <h4 className="font-medium text-[var(--color-text-primary)] mb-4">
                  {locale === 'ka' ? 'გადახდის მეთოდი' : 'Payment Method'}
                </h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {locale === 'ka' ? 'გადახდის მეთოდი არ არის დამატებული' : 'No payment method added'}
                </p>
                <Button
                  variant="link"
                  className="mt-4 p-0"
                  leftIcon={<CreditCard className="w-4 h-4" />}
                >
                  {locale === 'ka' ? 'დაამატე გადახდის მეთოდი' : 'Add Payment Method'}
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
                  ? (locale === 'ka' ? 'ინახება...' : 'Saving...')
                  : (locale === 'ka' ? 'შენახვა' : 'Save Changes')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

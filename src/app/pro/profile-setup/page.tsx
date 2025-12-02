'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

interface PortfolioProject {
  title: string;
  description: string;
  location: string;
  images: string[];
  videos: string[];
}

interface ProRegistrationData {
  category: string;
  pinterestLinks: string[];
  designStyle: string;
  basePrice: string;
  cadastralId: string;
  architectLicenseNumber: string;
}

export default function ProProfileSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, locale } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileType, setProfileType] = useState<'personal' | 'company'>('personal');
  const [registrationData, setRegistrationData] = useState<ProRegistrationData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    description: '',
    categories: [] as string[],
    yearsExperience: '',
    serviceAreas: [] as string[],
    pricingModel: 'project_based',
    basePrice: '',
    currency: 'USD',
    tagline: '',
    bio: '',
    avatar: '',
    // Category-specific fields
    pinterestLinks: [] as string[],
    designStyle: '',
    cadastralId: '',
    architectLicenseNumber: '',
  });
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [newProject, setNewProject] = useState<PortfolioProject>({
    title: '',
    description: '',
    location: '',
    images: [],
    videos: [],
  });
  const [editProject, setEditProject] = useState<PortfolioProject>({
    title: '',
    description: '',
    location: '',
    images: [],
    videos: [],
  });
  const [locationData, setLocationData] = useState<{
    country: string;
    nationwide: string;
    regions: Record<string, string[]>;
    emoji: string;
  } | null>(null);

  // Load registration data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('proRegistrationData');
    if (storedData) {
      try {
        const parsed: ProRegistrationData = JSON.parse(storedData);
        setRegistrationData(parsed);
        // Pre-populate form data with registration data
        const pinterestLinks = parsed.pinterestLinks && parsed.pinterestLinks.length > 0
          ? parsed.pinterestLinks
          : (parsed.category === 'Interior Design' ? [''] : []);
        setFormData(prev => ({
          ...prev,
          categories: parsed.category ? [parsed.category] : [],
          pinterestLinks,
          designStyle: parsed.designStyle || '',
          basePrice: parsed.basePrice || '',
          pricingModel: parsed.category === 'Interior Design' ? 'from' : prev.pricingModel,
          cadastralId: parsed.cadastralId || '',
          architectLicenseNumber: parsed.architectLicenseNumber || '',
          // Set default title based on category
          title: parsed.category === 'Interior Design'
            ? (locale === 'ka' ? 'ინტერიერის დიზაინერი' : 'Interior Designer')
            : parsed.category === 'Architecture'
            ? (locale === 'ka' ? 'არქიტექტორი' : 'Architect')
            : '',
        }));
        // Clear the session storage after reading
        sessionStorage.removeItem('proRegistrationData');
      } catch (err) {
        console.error('Failed to parse registration data:', err);
      }
    }
  }, [locale]);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        let detectedCountry = 'United States';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Tbilisi') || timezone.includes('Georgia')) {
          detectedCountry = 'Georgia';
        }
        const locale = navigator.language;
        if (locale.startsWith('ka')) {
          detectedCountry = 'Georgia';
        }
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/pro-profiles/locations?country=${encodeURIComponent(detectedCountry)}`
        );
        const data = await response.json();
        setLocationData(data);
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      }
    };
    fetchLocationData();
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'pro')) {
      router.push('/browse');
    }
  }, [user, authLoading, router]);

  const toggleCategory = (category: string) => {
    if (formData.categories.includes(category)) {
      setFormData({ ...formData, categories: formData.categories.filter(c => c !== category) });
    } else {
      // No limit - allow unlimited categories
      setFormData({ ...formData, categories: [...formData.categories, category] });
    }
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !formData.categories.includes(customCategory.trim())) {
      setFormData({ ...formData, categories: [...formData.categories, customCategory.trim()] });
      setCustomCategory('');
      setShowCustomCategoryInput(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setFormData({ ...formData, avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleServiceArea = (area: string) => {
    if (formData.serviceAreas.includes(area)) {
      setFormData({ ...formData, serviceAreas: formData.serviceAreas.filter(a => a !== area) });
    } else {
      setFormData({ ...formData, serviceAreas: [...formData.serviceAreas, area] });
    }
  };

  const toggleNationwide = () => {
    if (!locationData) return;
    const nationwide = locationData.nationwide;
    if (formData.serviceAreas.includes(nationwide)) {
      setFormData({ ...formData, serviceAreas: [] });
    } else {
      setFormData({ ...formData, serviceAreas: [nationwide] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.serviceAreas.length === 0) {
      setError(t('profileSetup.serviceAreas'));
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // Build the request body with category-specific fields
      const requestBody: any = {
        ...formData,
        profileType,
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
        basePrice: formData.basePrice ? parseFloat(formData.basePrice) : undefined,
        portfolioProjects,
      };

      // Add Interior Design specific fields
      if (formData.categories.includes('Interior Design')) {
        requestBody.pinterestLinks = formData.pinterestLinks.filter(link => link.trim());
        requestBody.designStyle = formData.designStyle;
      }

      // Add Architecture specific fields
      if (formData.categories.includes('Architecture')) {
        requestBody.cadastralId = formData.cadastralId;
        requestBody.architectLicenseNumber = formData.architectLicenseNumber;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pro-profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create profile');
      }

      router.push('/browse');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Steps: 1 = Profile Type, 2 = Service Areas, 3 = Pricing, 4 = Portfolio
  // Category & verification info is already collected during registration
  const totalSteps = 4;

  // Helper function to get translated category
  const getCategoryLabel = (category: string) => {
    const translated = t(`categories.${category}`);
    if (translated === `categories.${category}`) {
      return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return translated;
  };

  // Preview Card Component
  const PreviewCard = () => (
    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5 max-w-sm mx-auto">
      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none rounded-2xl" />

      {/* Content */}
      <div className="relative">
        {/* Header - Avatar + Info */}
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/60 shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center text-white text-xl font-semibold ring-2 ring-white/60 shadow-lg">
                {user?.name?.charAt(0) || 'P'}
              </div>
            )}
            {/* Available indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white shadow-sm" />
          </div>

          {/* Name & Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">
              {profileType === 'company' ? formData.companyName : user?.name || 'Professional'}
            </h3>
            <p className="text-sm text-neutral-500 truncate">
              {formData.title || (formData.categories[0] ? getCategoryLabel(formData.categories[0]) : 'Professional')}
            </p>
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg border border-neutral-100/50">
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-neutral-600 font-medium">{formData.yearsExperience || 0}+ yrs</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg border border-neutral-100/50">
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neutral-600 font-medium">0 jobs</span>
          </div>
          {formData.basePrice && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 backdrop-blur-sm rounded-lg border border-emerald-100">
              <span className="text-emerald-700 font-medium">{locale === 'ka' ? 'დან' : 'from'} {formData.basePrice} ₾/m²</span>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {formData.categories.slice(0, 2).map((cat, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-neutral-900/5 text-neutral-700 text-xs rounded-lg font-medium"
            >
              {getCategoryLabel(cat)}
            </span>
          ))}
          {formData.categories.length > 2 && (
            <span className="px-2 py-1 text-neutral-400 text-xs">
              +{formData.categories.length - 2}
            </span>
          )}
        </div>

        {/* Footer - Location & Arrow */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100/50">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm truncate max-w-[120px]">{formData.serviceAreas[0] || 'Not set'}</span>
          </div>

          <div className="flex items-center gap-1 text-sm font-medium text-neutral-900">
            <span>View</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="text-sm">{locale === 'ka' ? 'დახურვა' : 'Close'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-4">
              <p className="text-white/90 text-sm font-medium">
                {locale === 'ka' ? 'ასე დაინახავენ თქვენს ბარათს კლიენტები' : 'This is how clients will see your card'}
              </p>
            </div>

            {/* Preview Card */}
            <PreviewCard />

            {/* Tip */}
            <div className="mt-4 text-center">
              <p className="text-white/70 text-xs">
                {locale === 'ka'
                  ? 'პროფილის სურათის დამატება გაზრდის თქვენს ხილვადობას'
                  : 'Adding a profile picture will increase your visibility'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddProjectModal(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-dark-elevated rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {locale === 'ka' ? 'პროექტის დამატება' : 'Add Project'}
              </h3>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-200 ease-out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'პროექტის სახელი' : 'Project Title'} *
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="input"
                  placeholder={locale === 'ka' ? 'მაგ: თანამედროვე აპარტამენტის დიზაინი' : 'e.g., Modern Apartment Design'}
                />
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'აღწერა' : 'Description'} *
                </label>
                <textarea
                  id="projectDescription"
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="input resize-none"
                  placeholder={locale === 'ka' ? 'აღწერეთ პროექტი...' : 'Describe the project...'}
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'სურათები' : 'Images'} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {newProject.images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProject({
                          ...newProject,
                          images: newProject.images.filter((_, i) => i !== index)
                        })}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {newProject.images.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-dark-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{locale === 'ka' ? 'დამატება' : 'Add'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              if (file.size > 5 * 1024 * 1024) {
                                setError(locale === 'ka' ? 'სურათი უნდა იყოს 5MB-ზე ნაკლები' : 'Image must be less than 5MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewProject(prev => ({
                                  ...prev,
                                  images: [...prev.images, reader.result as string].slice(0, 10)
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                  {locale === 'ka'
                    ? `${newProject.images.length}/10 სურათი (მაქს. 5MB თითო)`
                    : `${newProject.images.length}/10 images (max 5MB each)`}
                </p>
              </div>

              {/* Videos Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'ვიდეოები' : 'Videos'}
                  <span className="text-neutral-400 text-xs ml-1">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {newProject.videos.map((video, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden group bg-neutral-900">
                      <video src={video} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProject({
                          ...newProject,
                          videos: newProject.videos.filter((_, i) => i !== index)
                        })}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 ease-out"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {newProject.videos.length < 3 && (
                    <label className="aspect-video rounded-lg border-2 border-dashed border-neutral-300 dark:border-dark-border hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{locale === 'ka' ? 'ვიდეო' : 'Video'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 100 * 1024 * 1024) {
                              setError(locale === 'ka' ? 'ვიდეო უნდა იყოს 100MB-ზე ნაკლები' : 'Video must be less than 100MB');
                              e.target.value = '';
                              return;
                            }
                            // Use URL.createObjectURL for video preview
                            const videoUrl = URL.createObjectURL(file);
                            setNewProject(prev => ({
                              ...prev,
                              videos: [...prev.videos, videoUrl].slice(0, 3)
                            }));
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                  {locale === 'ka'
                    ? `${newProject.videos.length}/3 ვიდეო (მაქს. 100MB თითო)`
                    : `${newProject.videos.length}/3 videos (max 100MB each)`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddProjectModal(false);
                  setNewProject({ title: '', description: '', location: '', images: [], videos: [] });
                }}
                className="flex-1 btn btn-secondary"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newProject.title && newProject.description && newProject.images.length > 0) {
                    setPortfolioProjects([...portfolioProjects, { ...newProject }]);
                    setNewProject({ title: '', description: '', location: '', images: [], videos: [] });
                    setShowAddProjectModal(false);
                  }
                }}
                disabled={!newProject.title || !newProject.description || newProject.images.length === 0}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'ka' ? 'დამატება' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProjectIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditProjectModal(false);
              setEditingProjectIndex(null);
            }}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-dark-elevated rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {locale === 'ka' ? 'პროექტის რედაქტირება' : 'Edit Project'}
              </h3>
              <button
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProjectIndex(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-200 ease-out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="editProjectTitle" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {locale === 'ka' ? 'პროექტის სახელი' : 'Project Title'} *
                </label>
                <input
                  id="editProjectTitle"
                  type="text"
                  value={editProject.title}
                  onChange={(e) => setEditProject({ ...editProject, title: e.target.value })}
                  className="input"
                  placeholder={locale === 'ka' ? 'მაგ: თანამედროვე აპარტამენტის დიზაინი' : 'e.g., Modern Apartment Design'}
                />
              </div>

              <div>
                <label htmlFor="editProjectDescription" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {locale === 'ka' ? 'აღწერა' : 'Description'} *
                </label>
                <textarea
                  id="editProjectDescription"
                  rows={3}
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  className="input resize-none"
                  placeholder={locale === 'ka' ? 'აღწერეთ პროექტი...' : 'Describe the project...'}
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'სურათები' : 'Images'} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {editProject.images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={img} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditProject({
                          ...editProject,
                          images: editProject.images.filter((_, i) => i !== index)
                        })}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {editProject.images.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{locale === 'ka' ? 'დამატება' : 'Add'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              if (file.size > 5 * 1024 * 1024) {
                                setError(locale === 'ka' ? 'სურათი უნდა იყოს 5MB-ზე ნაკლები' : 'Image must be less than 5MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditProject(prev => ({
                                  ...prev,
                                  images: [...prev.images, reader.result as string].slice(0, 10)
                                }));
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">
                  {locale === 'ka'
                    ? `${editProject.images.length}/10 სურათი (მაქს. 5MB თითო)`
                    : `${editProject.images.length}/10 images (max 5MB each)`}
                </p>
              </div>

              {/* Videos Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {locale === 'ka' ? 'ვიდეოები' : 'Videos'}
                  <span className="text-neutral-400 text-xs ml-1">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {editProject.videos.map((video, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden group bg-neutral-900">
                      <video src={video} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditProject({
                          ...editProject,
                          videos: editProject.videos.filter((_, i) => i !== index)
                        })}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-all duration-200 ease-out"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {editProject.videos.length < 3 && (
                    <label className="aspect-video rounded-lg border-2 border-dashed border-neutral-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{locale === 'ka' ? 'ვიდეო' : 'Video'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 100 * 1024 * 1024) {
                              setError(locale === 'ka' ? 'ვიდეო უნდა იყოს 100MB-ზე ნაკლები' : 'Video must be less than 100MB');
                              e.target.value = '';
                              return;
                            }
                            const videoUrl = URL.createObjectURL(file);
                            setEditProject(prev => ({
                              ...prev,
                              videos: [...prev.videos, videoUrl].slice(0, 3)
                            }));
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">
                  {locale === 'ka'
                    ? `${editProject.videos.length}/3 ვიდეო (მაქს. 100MB თითო)`
                    : `${editProject.videos.length}/3 videos (max 100MB each)`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProjectIndex(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editProject.title && editProject.description && editProject.images.length > 0 && editingProjectIndex !== null) {
                    const updatedProjects = [...portfolioProjects];
                    updatedProjects[editingProjectIndex] = { ...editProject };
                    setPortfolioProjects(updatedProjects);
                    setShowEditProjectModal(false);
                    setEditingProjectIndex(null);
                  }
                }}
                disabled={!editProject.title || !editProject.description || editProject.images.length === 0}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locale === 'ka' ? 'შენახვა' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <h1 className="text-2xl font-bold text-blue-500">Homico</h1>
          </Link>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">{t('profileSetup.completeProfile')}</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('profileSetup.step', { current: currentStep, total: totalSteps })}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-neutral-200 dark:bg-dark-border-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-dark-elevated rounded-xl border border-neutral-200 dark:border-dark-border shadow-sm p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Profile Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{t('profileSetup.chooseType')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileType('personal')}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ease-out ${
                      profileType === 'personal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                        profileType === 'personal' ? 'bg-blue-500' : 'bg-neutral-100'
                      }`}>
                        <svg className={`w-5 h-5 ${profileType === 'personal' ? 'text-white' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{t('profileSetup.personal')}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('profileSetup.workIndependently')}</p>
                    </div>
                    {profileType === 'personal' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType('company')}
                    className={`relative p-4 rounded-xl border transition-all duration-200 ease-out ${
                      profileType === 'company'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                        profileType === 'company' ? 'bg-blue-500' : 'bg-neutral-100'
                      }`}>
                        <svg className={`w-5 h-5 ${profileType === 'company' ? 'text-white' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{t('profileSetup.company')}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('profileSetup.representBusiness')}</p>
                    </div>
                    {profileType === 'company' && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                </div>

                {/* Company Name & Years Experience */}
                <div className="space-y-4 pt-2">
                  {profileType === 'company' && (
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {t('profileSetup.companyName')} *
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        required={profileType === 'company'}
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="input"
                        placeholder="Your company name"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="yearsExperience" className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {t('profileSetup.yearsExperience')} *
                    </label>
                    <input
                      id="yearsExperience"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={formData.yearsExperience}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, yearsExperience: value });
                      }}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Areas */}
            {currentStep === 2 && locationData && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{t('profileSetup.serviceAreas')} *</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('profileSetup.whereProvide')}</p>
                </div>

                {/* Nationwide Option */}
                <button
                  type="button"
                  onClick={toggleNationwide}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 ease-out ${
                    formData.serviceAreas.includes(locationData.nationwide)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        formData.serviceAreas.includes(locationData.nationwide)
                          ? 'bg-blue-500'
                          : 'bg-neutral-100'
                      }`}>
                        <span className="text-lg">{locationData.emoji}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{locationData.nationwide}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('profileSetup.allRegions')}</p>
                      </div>
                    </div>
                    {formData.serviceAreas.includes(locationData.nationwide) && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Regional Options */}
                {!formData.serviceAreas.includes(locationData.nationwide) && (
                  <div className="space-y-2">
                    {Object.entries(locationData.regions).map(([regionName, cities]) => (
                      <details key={regionName} className="group border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden">
                        <summary className="cursor-pointer list-none p-3 bg-neutral-50 dark:bg-dark-card hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-all duration-200 ease-out flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm font-medium text-neutral-700">{regionName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                              {cities.filter(city => formData.serviceAreas.includes(city)).length}/{cities.length}
                            </span>
                            <svg className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="p-2 grid grid-cols-3 gap-1.5">
                          {cities.map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => toggleServiceArea(city)}
                              className={`p-2 rounded text-sm transition-all duration-200 ease-out text-center ${
                                formData.serviceAreas.includes(city)
                                  ? 'bg-blue-100 text-blue-700 font-medium border border-blue-200'
                                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-transparent'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{t('profileSetup.pricingDetails')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('profileSetup.setPricing')}</p>
                </div>

                {/* Interior Designer: Only square meter pricing - show for Interior Design OR when no category is selected (default) */}
                {(formData.categories.includes('Interior Design') || !formData.categories.includes('Architecture')) && (
                  <>
                    <div>
                      <label htmlFor="basePrice" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {locale === 'ka' ? 'საწყისი ფასი კვ.მ-ზე' : 'Starting Price per m²'} *
                      </label>
                      <div className="relative">
                        <input
                          id="basePrice"
                          type="text"
                          inputMode="decimal"
                          required
                          value={formData.basePrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            setFormData({ ...formData, basePrice: value, pricingModel: 'from' });
                          }}
                          className="input pr-16"
                          placeholder="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                          ₾/m²
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1.5">
                        {locale === 'ka'
                          ? 'მინიმალური ფასი კვადრატულ მეტრზე დიზაინის მომსახურებისთვის'
                          : 'Minimum price per square meter for design services'
                        }
                      </p>
                    </div>

                    {/* Card preview note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {locale === 'ka' ? 'ეს ფასი გამოჩნდება თქვენს ბარათზე' : 'This price will be shown on your card'}
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            {locale === 'ka'
                              ? 'მომხმარებლები დაინახავენ "დან XX ₾/m²" თქვენს პროფილზე'
                              : 'Users will see "from XX ₾/m²" on your profile'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Architect: Full pricing options */}
                {formData.categories.includes('Architecture') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {locale === 'ka' ? 'ფასის მოდელი' : 'Pricing Model'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'hourly', labelKey: 'hourly', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                          { value: 'project_based', labelKey: 'project', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { value: 'from', labelKey: 'starting', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
                        ].map((model) => (
                          <button
                            key={model.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, pricingModel: model.value })}
                            className={`p-3 rounded-lg border transition-all duration-200 ease-out ${
                              formData.pricingModel === model.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <svg className={`w-5 h-5 ${formData.pricingModel === model.value ? 'text-blue-600' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={model.icon} />
                              </svg>
                              <span className={`text-xs font-medium ${formData.pricingModel === model.value ? 'text-blue-700' : 'text-neutral-600'}`}>
                                {t(`profileSetup.${model.labelKey}`)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="basePrice" className="block text-sm font-medium text-neutral-700 mb-1.5">
                        {t('profileSetup.basePrice')}
                      </label>
                      <input
                        id="basePrice"
                        type="text"
                        inputMode="decimal"
                        value={formData.basePrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          setFormData({ ...formData, basePrice: value });
                        }}
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t('profileSetup.aboutServices')} *
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input resize-none"
                    placeholder={t('profileSetup.describeExperience')}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Portfolio */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{t('profileSetup.portfolio')}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('profileSetup.addProjects')}</p>
                  </div>
                  {/* Preview Button */}
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 ease-out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {locale === 'ka' ? 'გადახედვა' : 'Preview'}
                  </button>
                </div>

                {/* Profile Picture */}
                <div className="flex items-center gap-4 pb-4 border-b border-neutral-100 dark:border-dark-border">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      {t('profileSetup.profilePicture')} *
                    </label>
                  </div>
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-dark-border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null);
                          setFormData({ ...formData, avatar: '' });
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 ease-out"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="group w-16 h-16 rounded-xl bg-neutral-50 dark:bg-dark-card border border-dashed border-neutral-300 dark:border-dark-border flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out">
                      <svg className="w-6 h-6 text-neutral-400 group-hover:text-blue-500 transition-all duration-200 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {t('profileSetup.bio')} *
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    required
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="input resize-none"
                    placeholder={t('profileSetup.tellAboutYourself')}
                  />
                </div>

                {/* Add Project Button */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      {t('profileSetup.addProject')} *
                    </label>
                    {portfolioProjects.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        {portfolioProjects.length} {locale === 'ka' ? 'პროექტი' : portfolioProjects.length === 1 ? 'project' : 'projects'}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {portfolioProjects.map((project, index) => (
                      <div
                        key={index}
                        className="p-4 bg-neutral-50 dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 ease-out cursor-pointer"
                        onClick={() => {
                          setEditProject({ ...project });
                          setEditingProjectIndex(index);
                          setShowEditProjectModal(true);
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          {project.images.length > 0 && (
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                              <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{project.title}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{project.description}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditProject({ ...project });
                                    setEditingProjectIndex(index);
                                    setShowEditProjectModal(true);
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 ease-out"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPortfolioProjects(portfolioProjects.filter((_, i) => i !== index));
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 ease-out"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {/* Media counts */}
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{project.images.length} {locale === 'ka' ? 'სურათი' : 'images'}</span>
                              </div>
                              {project.videos.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>{project.videos.length} {locale === 'ka' ? 'ვიდეო' : 'videos'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowAddProjectModal(true)}
                      className="p-4 rounded-lg border border-dashed border-neutral-300 dark:border-dark-border text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-out group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 group-hover:bg-blue-100 flex items-center justify-center transition-all duration-200 ease-out">
                          <svg className="w-5 h-5 text-neutral-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-blue-600">{t('profileSetup.addProject')}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="btn btn-secondary"
                >
                  {t('common.back')}
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && ((profileType === 'company' && !formData.companyName) || !formData.yearsExperience)) ||
                    (currentStep === 2 && formData.serviceAreas.length === 0) ||
                    (currentStep === 3 && (((formData.categories.includes('Interior Design') || !formData.categories.includes('Architecture')) && !formData.basePrice) || !formData.description))
                  }
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.continue')}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || formData.serviceAreas.length === 0 || !formData.bio || !formData.avatar || portfolioProjects.length === 0}
                  className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('profileSetup.creating')}
                    </span>
                  ) : (
                    t('profileSetup.completeSetup')
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

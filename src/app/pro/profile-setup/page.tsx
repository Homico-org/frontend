'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { getCategoryByKey, CATEGORIES } from '@/constants/categories';

interface PortfolioProject {
  title: string;
  description: string;
  images: string[];
  year?: string;
  budget?: string;
}

// Category-specific step configurations
const categorySteps = {
  'interior-design': [
    { key: 'profile', title: 'Profile', titleKa: 'პროფილი' },
    { key: 'style', title: 'Design Style', titleKa: 'დიზაინის სტილი' },
    { key: 'pricing', title: 'Pricing', titleKa: 'ფასები' },
    { key: 'portfolio', title: 'Portfolio', titleKa: 'პორტფოლიო' },
    { key: 'areas', title: 'Service Areas', titleKa: 'მომსახურების ზონები' },
  ],
  'architecture': [
    { key: 'profile', title: 'Profile', titleKa: 'პროფილი' },
    { key: 'credentials', title: 'Credentials', titleKa: 'კვალიფიკაცია' },
    { key: 'services', title: 'Services', titleKa: 'მომსახურებები' },
    { key: 'portfolio', title: 'Portfolio', titleKa: 'პორტფოლიო' },
    { key: 'areas', title: 'Service Areas', titleKa: 'მომსახურების ზონები' },
  ],
  'craftsmen': [
    { key: 'profile', title: 'Profile', titleKa: 'პროფილი' },
    { key: 'skills', title: 'Skills', titleKa: 'უნარები' },
    { key: 'pricing', title: 'Rates', titleKa: 'ტარიფები' },
    { key: 'portfolio', title: 'Work Examples', titleKa: 'სამუშაო მაგალითები' },
    { key: 'areas', title: 'Service Areas', titleKa: 'მომსახურების ზონები' },
  ],
  'home-care': [
    { key: 'profile', title: 'Profile', titleKa: 'პროფილი' },
    { key: 'services', title: 'Services', titleKa: 'სერვისები' },
    { key: 'pricing', title: 'Pricing', titleKa: 'ფასები' },
    { key: 'availability', title: 'Availability', titleKa: 'ხელმისაწვდომობა' },
    { key: 'areas', title: 'Service Areas', titleKa: 'მომსახურების ზონები' },
  ],
};

// Design styles for designers
const designStyles = [
  { key: 'modern', name: 'Modern', nameKa: 'თანამედროვე', icon: '◇' },
  { key: 'minimalist', name: 'Minimalist', nameKa: 'მინიმალისტური', icon: '○' },
  { key: 'classic', name: 'Classic', nameKa: 'კლასიკური', icon: '❖' },
  { key: 'scandinavian', name: 'Scandinavian', nameKa: 'სკანდინავიური', icon: '△' },
  { key: 'industrial', name: 'Industrial', nameKa: 'ინდუსტრიული', icon: '⬡' },
  { key: 'bohemian', name: 'Bohemian', nameKa: 'ბოჰემური', icon: '✿' },
  { key: 'contemporary', name: 'Contemporary', nameKa: 'კონტემპორარული', icon: '◈' },
  { key: 'mediterranean', name: 'Mediterranean', nameKa: 'ხმელთაშუაზღვური', icon: '☼' },
];

// Availability options
const availabilityOptions = [
  { key: 'weekdays', name: 'Weekdays', nameKa: 'სამუშაო დღეები' },
  { key: 'weekends', name: 'Weekends', nameKa: 'შაბათ-კვირა' },
  { key: 'evenings', name: 'Evenings', nameKa: 'საღამოობით' },
  { key: 'emergency', name: 'Emergency Calls', nameKa: 'გადაუდებელი გამოძახება' },
];

export default function ProProfileSetupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileType, setProfileType] = useState<'personal' | 'company'>('personal');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    // Basic profile
    title: '',
    companyName: '',
    bio: '',
    yearsExperience: '',
    avatar: '',
    // Designer specific
    designStyles: [] as string[],
    portfolioUrl: '',
    // Architect specific
    licenseNumber: '',
    cadastralId: '',
    certifications: [] as string[],
    // Craftsmen specific
    tools: [] as string[],
    // Home care specific
    availability: [] as string[],
    // Pricing
    pricingModel: 'project_based',
    basePrice: '',
    hourlyRate: '',
    // Service areas
    serviceAreas: [] as string[],
    nationwide: false,
  });

  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<{
    country: string;
    nationwide: string;
    regions: Record<string, string[]>;
    emoji: string;
  } | null>(null);

  // Load registration data from sessionStorage or user profile
  useEffect(() => {
    const storedData = sessionStorage.getItem('proRegistrationData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setSelectedCategory(parsed.category || 'interior-design');
        setSelectedSubcategories(parsed.subcategories || []);
        if (parsed.pinterestLinks?.[0]) {
          setFormData(prev => ({ ...prev, portfolioUrl: parsed.pinterestLinks[0] }));
        }
        if (parsed.cadastralId) {
          setFormData(prev => ({ ...prev, cadastralId: parsed.cadastralId }));
        }
        // Load portfolio projects if they were added during registration
        if (parsed.portfolioProjects && Array.isArray(parsed.portfolioProjects)) {
          setPortfolioProjects(parsed.portfolioProjects);
        }
        sessionStorage.removeItem('proRegistrationData');
      } catch (err) {
        console.error('Failed to parse registration data:', err);
        setSelectedCategory('interior-design');
      }
    } else if (user?.selectedCategories && user.selectedCategories.length > 0) {
      // Fallback to user's selected categories from profile
      setSelectedCategory(user.selectedCategories[0]);
    } else {
      // Default to interior-design if no data available
      setSelectedCategory('interior-design');
    }
  }, [user]);

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        let detectedCountry = 'Georgia';
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Tbilisi') || timezone.includes('Georgia')) {
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

  // Auth redirect
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'pro')) {
      router.push('/browse');
    }
  }, [user, authLoading, router]);

  const steps = categorySteps[selectedCategory as keyof typeof categorySteps] || categorySteps['interior-design'];
  const totalSteps = steps.length;

  const getCategoryInfo = () => {
    return getCategoryByKey(selectedCategory) || CATEGORIES[0];
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(locale === 'ka' ? 'სურათი უნდა იყოს 2MB-ზე ნაკლები' : 'Image must be less than 2MB');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
        setFormData(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDesignStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      designStyles: prev.designStyles.includes(style)
        ? prev.designStyles.filter(s => s !== style)
        : [...prev.designStyles, style]
    }));
  };

  const toggleAvailability = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }));
  };

  const toggleServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area]
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const categoryInfo = getCategoryInfo();

      // Determine pricing model based on category
      let pricingModel = formData.pricingModel;
      if (selectedCategory === 'interior-design' || selectedCategory === '') {
        // Designers use "from" (per m²) pricing
        pricingModel = 'from';
      } else if (selectedCategory === 'craftsmen' || selectedCategory === 'home-care') {
        // Craftsmen and home-care use hourly pricing
        pricingModel = 'hourly';
      }
      // Architecture uses formData.pricingModel (project_based or from)

      const requestBody = {
        profileType,
        title: formData.title || (locale === 'ka' ? categoryInfo.nameKa : categoryInfo.name),
        companyName: profileType === 'company' ? formData.companyName : undefined,
        bio: formData.bio,
        description: formData.bio,
        categories: [selectedCategory || 'interior-design'],
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        avatar: formData.avatar,
        pricingModel,
        basePrice: parseFloat(formData.basePrice) || undefined,
        serviceAreas: formData.nationwide && locationData ? [locationData.nationwide] : formData.serviceAreas,
        portfolioProjects,
        // Designer specific
        designStyles: selectedCategory === 'interior-design' ? formData.designStyles : undefined,
        pinterestLinks: formData.portfolioUrl ? [formData.portfolioUrl] : undefined,
        // Architect specific
        architectLicenseNumber: selectedCategory === 'architecture' ? formData.licenseNumber : undefined,
        cadastralId: selectedCategory === 'architecture' ? formData.cadastralId : undefined,
        // Home care specific
        availability: selectedCategory === 'home-care' ? formData.availability : undefined,
      };

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

  const canProceed = () => {
    const step = steps[currentStep];
    switch (step.key) {
      case 'profile':
        return formData.bio && formData.yearsExperience && (profileType === 'personal' || formData.companyName);
      case 'style':
        return formData.designStyles.length > 0;
      case 'credentials':
        return true; // Optional
      case 'skills':
        return true; // Optional
      case 'services':
        return true; // Optional
      case 'pricing':
        return formData.basePrice || formData.hourlyRate;
      case 'portfolio':
        return portfolioProjects.length > 0 || formData.portfolioUrl;
      case 'availability':
        return formData.availability.length > 0;
      case 'areas':
        return formData.nationwide || formData.serviceAreas.length > 0;
      default:
        return true;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {locale === 'ka' ? 'იტვირთება...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();

  // Category-specific icon
  const CategoryIcon = () => {
    switch (selectedCategory) {
      case 'interior-design':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        );
      case 'architecture':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
        );
      case 'craftsmen':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        );
      case 'home-care':
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 dark:from-dark-bg dark:via-dark-bg dark:to-dark-elevated">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-800/5 dark:bg-primary-400/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-terracotta-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-dark-elevated rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                {editingIndex !== null
                  ? (locale === 'ka' ? 'პროექტის რედაქტირება' : 'Edit Project')
                  : (locale === 'ka' ? 'პროექტის დამატება' : 'Add Project')
                }
              </h3>
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                  setEditingIndex(null);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-border transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {locale === 'ka' ? 'პროექტის სახელი' : 'Project Title'} *
                </label>
                <input
                  type="text"
                  value={editingProject?.title || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, title: e.target.value } : { title: e.target.value, description: '', images: [] })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                  placeholder={locale === 'ka' ? 'მაგ: თანამედროვე აპარტამენტი' : 'e.g., Modern Apartment'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {locale === 'ka' ? 'აღწერა' : 'Description'} *
                </label>
                <textarea
                  rows={3}
                  value={editingProject?.description || ''}
                  onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : { title: '', description: e.target.value, images: [] })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all resize-none"
                  placeholder={locale === 'ka' ? 'პროექტის მოკლე აღწერა...' : 'Brief project description...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {locale === 'ka' ? 'სურათები' : 'Images'} *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(editingProject?.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingProject(prev => prev ? { ...prev, images: prev.images.filter((_, i) => i !== idx) } : null)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(editingProject?.images?.length || 0) < 8 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400 hover:bg-forest-800/5 dark:hover:bg-primary-400/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1">
                      <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              if (file.size > 5 * 1024 * 1024) return;
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingProject(prev => prev
                                  ? { ...prev, images: [...prev.images, reader.result as string].slice(0, 8) }
                                  : { title: '', description: '', images: [reader.result as string] }
                                );
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
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                  setEditingIndex(null);
                }}
                className="flex-1 px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-dark-border transition-all"
              >
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingProject?.title && editingProject?.description && editingProject?.images?.length > 0) {
                    if (editingIndex !== null) {
                      const updated = [...portfolioProjects];
                      updated[editingIndex] = editingProject;
                      setPortfolioProjects(updated);
                    } else {
                      setPortfolioProjects([...portfolioProjects, editingProject]);
                    }
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setEditingIndex(null);
                  }
                }}
                disabled={!editingProject?.title || !editingProject?.description || !editingProject?.images?.length}
                className="flex-1 px-4 py-3 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl font-medium hover:bg-forest-700 dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {editingIndex !== null
                  ? (locale === 'ka' ? 'შენახვა' : 'Save')
                  : (locale === 'ka' ? 'დამატება' : 'Add')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="text-2xl font-serif font-semibold text-forest-800 dark:text-primary-400 group-hover:text-forest-600 dark:group-hover:text-primary-300 transition-colors">Homico</span>
              <span className="w-2 h-2 rounded-full bg-primary-400" />
            </Link>
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-forest-800/10 dark:bg-primary-400/10 rounded-full">
              <div className="text-forest-800 dark:text-primary-400">
                <CategoryIcon />
              </div>
              <span className="text-sm font-medium text-forest-800 dark:text-primary-400">
                {locale === 'ka' ? categoryInfo.nameKa : categoryInfo.name}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            {locale === 'ka' ? 'დაასრულე შენი პროფილი' : 'Complete Your Profile'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {locale === 'ka'
              ? 'შეავსე ინფორმაცია რომ კლიენტებმა გიპოვონ'
              : 'Fill in your details so clients can find you'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all duration-300 flex-shrink-0 ${
                    index < currentStep
                      ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg cursor-pointer hover:scale-105'
                      : index === currentStep
                        ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg ring-4 ring-forest-800/20 dark:ring-primary-400/20'
                        : 'bg-neutral-100 dark:bg-dark-border text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 rounded-full transition-all duration-300 ${
                    index < currentStep
                      ? 'bg-forest-800 dark:bg-primary-400'
                      : 'bg-neutral-200 dark:bg-dark-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {locale === 'ka' ? steps[currentStep].titleKa : steps[currentStep].title}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-terracotta-50 dark:bg-terracotta-500/10 border border-terracotta-200 dark:border-terracotta-500/30 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-terracotta-700 dark:text-terracotta-400 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-terracotta-400 hover:text-terracotta-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-100 dark:border-dark-border shadow-xl dark:shadow-none overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Step: Profile */}
            {steps[currentStep].key === 'profile' && (
              <div className="space-y-6">
                {/* Profile Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    {locale === 'ka' ? 'პროფილის ტიპი' : 'Profile Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProfileType('personal')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                        profileType === 'personal'
                          ? 'border-forest-800 dark:border-primary-400 bg-forest-800/5 dark:bg-primary-400/5'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                          profileType === 'personal' ? 'bg-forest-800 dark:bg-primary-400' : 'bg-neutral-100 dark:bg-dark-border'
                        }`}>
                          <svg className={`w-6 h-6 ${profileType === 'personal' ? 'text-white dark:text-dark-bg' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {locale === 'ka' ? 'პირადი' : 'Personal'}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {locale === 'ka' ? 'ინდივიდუალური' : 'Individual'}
                        </p>
                      </div>
                      {profileType === 'personal' && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-forest-800 dark:bg-primary-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileType('company')}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                        profileType === 'company'
                          ? 'border-forest-800 dark:border-primary-400 bg-forest-800/5 dark:bg-primary-400/5'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                          profileType === 'company' ? 'bg-forest-800 dark:bg-primary-400' : 'bg-neutral-100 dark:bg-dark-border'
                        }`}>
                          <svg className={`w-6 h-6 ${profileType === 'company' ? 'text-white dark:text-dark-bg' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">
                          {locale === 'ka' ? 'კომპანია' : 'Company'}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {locale === 'ka' ? 'ბიზნესი' : 'Business'}
                        </p>
                      </div>
                      {profileType === 'company' && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-forest-800 dark:bg-primary-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Company Name (if company) */}
                {profileType === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {locale === 'ka' ? 'კომპანიის სახელი' : 'Company Name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                      placeholder={locale === 'ka' ? 'შეიყვანე კომპანიის სახელი' : 'Enter company name'}
                    />
                  </div>
                )}

                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'პროფილის სურათი' : 'Profile Photo'}
                  </label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <img src={avatarPreview} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-neutral-200 dark:border-dark-border" />
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarPreview(null);
                            setFormData(prev => ({ ...prev, avatar: '' }));
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-terracotta-500 text-white rounded-full flex items-center justify-center hover:bg-terracotta-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400 bg-neutral-50 dark:bg-dark-elevated flex items-center justify-center cursor-pointer transition-all group">
                        <svg className="w-8 h-8 text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    )}
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      <p>{locale === 'ka' ? 'PNG, JPG მაქს. 2MB' : 'PNG, JPG up to 2MB'}</p>
                    </div>
                  </div>
                </div>

                {/* Years Experience */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'გამოცდილება (წელი)' : 'Years of Experience'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                    placeholder="0"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'შენს შესახებ' : 'About You'} *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all resize-none"
                    placeholder={locale === 'ka' ? 'მოკლედ აღწერე შენი გამოცდილება და უნარები...' : 'Briefly describe your experience and skills...'}
                  />
                </div>
              </div>
            )}

            {/* Step: Design Style (Designer) */}
            {steps[currentStep].key === 'style' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'დიზაინის სტილები' : 'Design Styles'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'აირჩიე სტილები რომლებშიც მუშაობ' : 'Select the styles you work with'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {designStyles.map((style) => (
                      <button
                        key={style.key}
                        type="button"
                        onClick={() => toggleDesignStyle(style.key)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          formData.designStyles.includes(style.key)
                            ? 'border-forest-800 dark:border-primary-400 bg-forest-800/5 dark:bg-primary-400/5'
                            : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{style.icon}</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {locale === 'ka' ? style.nameKa : style.name}
                          </span>
                        </div>
                        {formData.designStyles.includes(style.key) && (
                          <div className="absolute top-3 right-3">
                            <div className="w-5 h-5 bg-forest-800 dark:bg-primary-400 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Credentials (Architect) */}
            {steps[currentStep].key === 'credentials' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'კვალიფიკაცია და ლიცენზიები' : 'Credentials & Licenses'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'დაამატე შენი პროფესიული დოკუმენტები' : 'Add your professional documentation'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'ლიცენზიის ნომერი' : 'License Number'}
                    <span className="text-neutral-400 text-xs ml-2">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                    placeholder={locale === 'ka' ? 'არქიტექტორის ლიცენზია' : 'Architect License'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'საკადასტრო კოდი' : 'Cadastral ID'}
                    <span className="text-neutral-400 text-xs ml-2">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cadastralId}
                    onChange={(e) => setFormData(prev => ({ ...prev, cadastralId: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                    placeholder="01.18.01.004.001"
                  />
                </div>

                <div className="p-4 bg-forest-800/5 dark:bg-primary-400/5 border border-forest-800/10 dark:border-primary-400/10 rounded-xl">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-forest-800 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {locale === 'ka'
                        ? 'ლიცენზირებული არქიტექტორები უფრო მეტ ნდობას იმსახურებენ კლიენტებისგან'
                        : 'Licensed architects gain more trust from clients'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Skills (Craftsmen) */}
            {steps[currentStep].key === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'შენი სპეციალიზაციები' : 'Your Specializations'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'რა სამუშაოებს ასრულებ?' : 'What types of work do you do?'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedSubcategories.map((sub) => {
                    const catInfo = getCategoryByKey(selectedCategory);
                    const subInfo = catInfo?.subcategories.find(s => s.key === sub);
                    return (
                      <div key={sub} className="px-4 py-2 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl text-sm font-medium">
                        {locale === 'ka' ? subInfo?.nameKa : subInfo?.name}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-forest-800/5 dark:bg-primary-400/5 border border-forest-800/10 dark:border-primary-400/10 rounded-xl">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-forest-800 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {locale === 'ka'
                        ? 'ეს სპეციალიზაციები შენ რეგისტრაციისას აირჩიე. შეგიძლია მოგვიანებით დაამატო'
                        : 'These are the specializations you selected during registration. You can add more later'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Services (Architect/Home Care) */}
            {steps[currentStep].key === 'services' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'შენი სერვისები' : 'Your Services'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'რა სერვისებს სთავაზობ კლიენტებს?' : 'What services do you offer to clients?'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedSubcategories.map((sub) => {
                    const catInfo = getCategoryByKey(selectedCategory);
                    const subInfo = catInfo?.subcategories.find(s => s.key === sub);
                    return (
                      <div key={sub} className="px-4 py-2 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl text-sm font-medium">
                        {locale === 'ka' ? subInfo?.nameKa : subInfo?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step: Pricing */}
            {steps[currentStep].key === 'pricing' && (
              <div className="space-y-6">
                {/* Designer pricing */}
                {(selectedCategory === 'interior-design' || selectedCategory === '') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'ka' ? 'საწყისი ფასი კვ.მ-ზე' : 'Starting Price per m²'} *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all pr-16"
                          placeholder="50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₾/m²</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {locale === 'ka' ? 'კლიენტები დაინახავენ "დან XX ₾/m²"' : 'Clients will see "from XX ₾/m²"'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'ka' ? 'საკონსულტაციო შეხვედრის ფასი' : 'Consultation Fee'}
                        <span className="text-neutral-400 text-xs ml-2">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all pr-16"
                          placeholder="100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₾</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {locale === 'ka' ? 'პირველი შეხვედრის/კონსულტაციის ფასი' : 'Price for initial consultation meeting'}
                      </p>
                    </div>
                  </>
                )}

                {/* Craftsmen & Home Care pricing */}
                {(selectedCategory === 'craftsmen' || selectedCategory === 'home-care') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'ka' ? 'საათობრივი ტარიფი' : 'Hourly Rate'} *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all pr-16"
                          placeholder="25"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₾/სთ</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {locale === 'ka' ? 'მინიმალური გამოძახება' : 'Minimum Call-out Fee'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all pr-12"
                          placeholder="50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">₾</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {locale === 'ka' ? 'მინიმალური ფასი გამოძახებისთვის' : 'Minimum fee for a service call'}
                      </p>
                    </div>
                  </>
                )}

                {/* Architect pricing */}
                {selectedCategory === 'architecture' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                        {locale === 'ka' ? 'ფასის მოდელი' : 'Pricing Model'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'project_based', label: locale === 'ka' ? 'პროექტი' : 'Project', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { value: 'from', label: locale === 'ka' ? 'კვ.მ-დან' : 'Per m²', icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4' },
                        ].map((model) => (
                          <button
                            key={model.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, pricingModel: model.value }))}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              formData.pricingModel === model.value
                                ? 'border-forest-800 dark:border-primary-400 bg-forest-800/5 dark:bg-primary-400/5'
                                : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                            }`}
                          >
                            <svg className={`w-6 h-6 mx-auto mb-2 ${formData.pricingModel === model.value ? 'text-forest-800 dark:text-primary-400' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={model.icon} />
                            </svg>
                            <span className={`text-sm font-medium ${formData.pricingModel === model.value ? 'text-forest-800 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400'}`}>
                              {model.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {formData.pricingModel === 'from'
                          ? (locale === 'ka' ? 'ფასი კვ.მ-ზე' : 'Price per m²')
                          : (locale === 'ka' ? 'საბაზისო ფასი' : 'Base Price')
                        } *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                          className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all pr-16"
                          placeholder={formData.pricingModel === 'from' ? '50' : '500'}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                          {formData.pricingModel === 'from' ? '₾/m²' : '₾'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        {formData.pricingModel === 'from'
                          ? (locale === 'ka' ? 'კლიენტები დაინახავენ "დან XX ₾/m²"' : 'Clients will see "from XX ₾/m²"')
                          : (locale === 'ka' ? 'საწყისი ფასი პროექტისთვის' : 'Starting price for a project')
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step: Portfolio */}
            {steps[currentStep].key === 'portfolio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'პორტფოლიო' : 'Portfolio'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'დაამატე შენი საუკეთესო სამუშაოები' : 'Add your best work examples'}
                  </p>
                </div>

                {/* Portfolio URL */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {locale === 'ka' ? 'პორტფოლიოს ბმული' : 'Portfolio URL'}
                    <span className="text-neutral-400 text-xs ml-2">({locale === 'ka' ? 'არასავალდებულო' : 'optional'})</span>
                  </label>
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-elevated border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-800 dark:focus:ring-primary-400 transition-all"
                    placeholder="https://behance.net/yourprofile"
                  />
                </div>

                {/* Projects */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    {locale === 'ka' ? 'პროექტები' : 'Projects'} *
                  </label>
                  <div className="space-y-3">
                    {portfolioProjects.map((project, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 bg-neutral-50 dark:bg-dark-elevated rounded-xl border border-neutral-200 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400 transition-all cursor-pointer"
                        onClick={() => {
                          setEditingProject(project);
                          setEditingIndex(index);
                          setShowProjectModal(true);
                        }}
                      >
                        {project.images[0] && (
                          <img src={project.images[0]} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">{project.title}</h4>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">{project.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{project.images.length} {locale === 'ka' ? 'სურათი' : 'images'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPortfolioProjects(portfolioProjects.filter((_, i) => i !== index));
                          }}
                          className="p-2 text-neutral-400 hover:text-terracotta-500 hover:bg-terracotta-50 dark:hover:bg-terracotta-500/10 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject({ title: '', description: '', images: [] });
                        setEditingIndex(null);
                        setShowProjectModal(true);
                      }}
                      className="w-full p-6 rounded-xl border-2 border-dashed border-neutral-300 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400 hover:bg-forest-800/5 dark:hover:bg-primary-400/5 transition-all group"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-border group-hover:bg-forest-800 dark:group-hover:bg-primary-400 flex items-center justify-center transition-all">
                          <svg className="w-6 h-6 text-neutral-400 group-hover:text-white dark:group-hover:text-dark-bg transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-forest-800 dark:group-hover:text-primary-400 transition-colors">
                          {locale === 'ka' ? 'პროექტის დამატება' : 'Add Project'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Availability (Home Care) */}
            {steps[currentStep].key === 'availability' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
                    {locale === 'ka' ? 'ხელმისაწვდომობა' : 'Availability'}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    {locale === 'ka' ? 'როდის ხარ ხელმისაწვდომი?' : 'When are you available?'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {availabilityOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleAvailability(option.key)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        formData.availability.includes(option.key)
                          ? 'border-forest-800 dark:border-primary-400 bg-forest-800/5 dark:bg-primary-400/5'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300'
                      }`}
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">
                        {locale === 'ka' ? option.nameKa : option.name}
                      </span>
                      {formData.availability.includes(option.key) && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 bg-forest-800 dark:bg-primary-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white dark:text-dark-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Service Areas */}
            {steps[currentStep].key === 'areas' && locationData && (
              <div className="space-y-6">
                {/* Nationwide Toggle - Hero Card */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, nationwide: !prev.nationwide, serviceAreas: [] }))}
                  className={`group relative w-full overflow-hidden rounded-2xl transition-all duration-500 ${
                    formData.nationwide
                      ? 'ring-2 ring-forest-800 dark:ring-primary-400 ring-offset-2 dark:ring-offset-dark-card'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {/* Background with map pattern */}
                  <div className={`absolute inset-0 transition-all duration-500 ${
                    formData.nationwide
                      ? 'bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 dark:from-primary-500 dark:via-primary-400 dark:to-primary-600'
                      : 'bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 dark:from-dark-elevated dark:via-dark-card dark:to-dark-elevated'
                  }`} />

                  {/* Decorative map lines */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
                      <path d="M0 100 Q100 50 200 100 T400 100" fill="none" stroke="currentColor" strokeWidth="1" className={formData.nationwide ? 'text-white' : 'text-forest-800 dark:text-primary-400'} />
                      <path d="M0 120 Q150 70 250 120 T400 120" fill="none" stroke="currentColor" strokeWidth="1" className={formData.nationwide ? 'text-white' : 'text-forest-800 dark:text-primary-400'} />
                      <circle cx="100" cy="80" r="3" className={formData.nationwide ? 'fill-white' : 'fill-forest-800 dark:fill-primary-400'} />
                      <circle cx="200" cy="100" r="4" className={formData.nationwide ? 'fill-white' : 'fill-forest-800 dark:fill-primary-400'} />
                      <circle cx="300" cy="90" r="3" className={formData.nationwide ? 'fill-white' : 'fill-forest-800 dark:fill-primary-400'} />
                      <circle cx="150" cy="110" r="2" className={formData.nationwide ? 'fill-white' : 'fill-forest-800 dark:fill-primary-400'} />
                      <circle cx="250" cy="85" r="2" className={formData.nationwide ? 'fill-white' : 'fill-forest-800 dark:fill-primary-400'} />
                    </svg>
                  </div>

                  <div className="relative p-6 flex items-center gap-5">
                    {/* Globe Icon */}
                    <div className={`relative flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      formData.nationwide
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-forest-800/10 dark:bg-primary-400/10 group-hover:bg-forest-800/15 dark:group-hover:bg-primary-400/15'
                    }`}>
                      <svg className={`w-8 h-8 transition-all duration-500 ${
                        formData.nationwide ? 'text-white' : 'text-forest-800 dark:text-primary-400'
                      }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      {formData.nationwide && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-forest-800 dark:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <h3 className={`text-xl font-bold mb-1 transition-colors duration-500 ${
                        formData.nationwide ? 'text-white' : 'text-neutral-900 dark:text-neutral-50'
                      }`}>
                        {locationData.nationwide}
                      </h3>
                      <p className={`text-sm transition-colors duration-500 ${
                        formData.nationwide ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {locale === 'ka' ? 'მომსახურება მთელი ქვეყნის მასშტაბით' : 'Serve clients across the entire country'}
                      </p>
                    </div>

                    {/* Radio indicator */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      formData.nationwide
                        ? 'border-white bg-white'
                        : 'border-neutral-300 dark:border-dark-border group-hover:border-forest-800 dark:group-hover:border-primary-400'
                    }`}>
                      {formData.nationwide && (
                        <div className="w-3 h-3 rounded-full bg-forest-800 dark:bg-primary-500" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-dark-border to-transparent" />
                  <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    {locale === 'ka' ? 'ან აირჩიე რეგიონები' : 'or select regions'}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-dark-border to-transparent" />
                </div>

                {/* Regional Selection */}
                <div className={`space-y-3 transition-all duration-300 ${formData.nationwide ? 'opacity-40 pointer-events-none' : ''}`}>
                  {/* Selected count badge */}
                  {formData.serviceAreas.length > 0 && !formData.nationwide && (
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {locale === 'ka' ? 'არჩეული ქალაქები:' : 'Selected cities:'}
                      </span>
                      <span className="px-3 py-1 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg text-sm font-semibold rounded-full">
                        {formData.serviceAreas.length}
                      </span>
                    </div>
                  )}

                  {/* Region Cards */}
                  <div className="grid gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(locationData.regions).map(([regionName, cities], regionIndex) => {
                      const selectedInRegion = cities.filter(c => formData.serviceAreas.includes(c)).length;
                      const allSelected = selectedInRegion === cities.length;

                      return (
                        <details
                          key={regionName}
                          className="group rounded-xl overflow-hidden bg-neutral-50 dark:bg-dark-elevated border border-neutral-100 dark:border-dark-border hover:border-forest-800/30 dark:hover:border-primary-400/30 transition-all duration-300"
                        >
                          <summary className="cursor-pointer list-none p-4 flex items-center gap-4 select-none">
                            {/* Region Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              selectedInRegion > 0
                                ? 'bg-forest-800 dark:bg-primary-400'
                                : 'bg-neutral-200 dark:bg-dark-border group-hover:bg-forest-800/10 dark:group-hover:bg-primary-400/10'
                            }`}>
                              <svg className={`w-5 h-5 transition-colors ${
                                selectedInRegion > 0 ? 'text-white dark:text-dark-bg' : 'text-neutral-400 dark:text-neutral-500'
                              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                                {regionName}
                              </h4>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {cities.length} {locale === 'ka' ? 'ქალაქი' : 'cities'}
                              </p>
                            </div>

                            {/* Selection indicator */}
                            <div className="flex items-center gap-3">
                              {selectedInRegion > 0 && (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                  allSelected
                                    ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg'
                                    : 'bg-forest-800/10 dark:bg-primary-400/10 text-forest-800 dark:text-primary-400'
                                }`}>
                                  {selectedInRegion}/{cities.length}
                                </span>
                              )}
                              <svg className="w-5 h-5 text-neutral-400 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>

                          {/* Cities Grid */}
                          <div className="px-4 pb-4 pt-2">
                            {/* Select All for Region */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (allSelected) {
                                  setFormData(prev => ({
                                    ...prev,
                                    serviceAreas: prev.serviceAreas.filter(a => !cities.includes(a))
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    serviceAreas: [...new Set([...prev.serviceAreas, ...cities])]
                                  }));
                                }
                              }}
                              className={`w-full mb-3 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                allSelected
                                  ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg'
                                  : 'bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-forest-800 dark:hover:border-primary-400 hover:text-forest-800 dark:hover:text-primary-400'
                              }`}
                            >
                              {allSelected ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {locale === 'ka' ? 'ყველა არჩეულია' : 'All Selected'}
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {locale === 'ka' ? 'აირჩიე ყველა' : 'Select All'}
                                </>
                              )}
                            </button>

                            {/* City chips */}
                            <div className="flex flex-wrap gap-2">
                              {cities.map((city) => {
                                const isSelected = formData.serviceAreas.includes(city);
                                return (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleServiceArea(city);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg shadow-md'
                                        : 'bg-white dark:bg-dark-card text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border hover:border-forest-800 dark:hover:border-primary-400 hover:text-forest-800 dark:hover:text-primary-400'
                                    }`}
                                  >
                                    {isSelected && (
                                      <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {city}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 md:px-8 py-4 bg-neutral-50 dark:bg-dark-elevated border-t border-neutral-100 dark:border-dark-border flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-700 dark:text-neutral-300 font-medium hover:bg-white dark:hover:bg-dark-card transition-all"
              >
                {locale === 'ka' ? 'უკან' : 'Back'}
              </button>
            )}

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex-1 px-6 py-3 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl font-medium hover:bg-forest-700 dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {locale === 'ka' ? 'გაგრძელება' : 'Continue'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !canProceed()}
                className="flex-1 px-6 py-3 bg-forest-800 dark:bg-primary-400 text-white dark:text-dark-bg rounded-xl font-medium hover:bg-forest-700 dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === 'ka' ? 'იქმნება...' : 'Creating...'}
                  </span>
                ) : (
                  locale === 'ka' ? 'დასრულება' : 'Complete Setup'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push('/browse')}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {locale === 'ka' ? 'გამოტოვება და მოგვიანებით დასრულება' : 'Skip and complete later'}
          </button>
        </div>
      </div>
    </div>
  );
}

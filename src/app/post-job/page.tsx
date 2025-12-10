'use client';

import AddressPicker from '@/components/common/AddressPicker';
import CategorySubcategorySelector from '@/components/common/CategorySubcategorySelector';
import DatePicker from '@/components/common/DatePicker';
import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Reference {
  type: 'link' | 'image' | 'pinterest' | 'instagram';
  url: string;
  title?: string;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', labelKa: 'ბინა', icon: 'apartment' },
  { value: 'house', label: 'House', labelKa: 'სახლი', icon: 'house' },
  { value: 'office', label: 'Office', labelKa: 'ოფისი', icon: 'office' },
  { value: 'building', label: 'Building', labelKa: 'შენობა', icon: 'building' },
  { value: 'other', label: 'Other', labelKa: 'სხვა', icon: 'other' },
];

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Budget', labelKa: 'ფიქსირებული', icon: 'fixed' },
  { value: 'range', label: 'Budget Range', labelKa: 'დიაპაზონი', icon: 'range' },
  { value: 'per_sqm', label: 'Per m²', labelKa: 'კვ.მ-ზე', icon: 'sqm' },
  { value: 'negotiable', label: 'Negotiable', labelKa: 'შეთანხმებით', icon: 'negotiable' },
];

// Property Type Icons
const PropertyIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'apartment':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
        </svg>
      );
    case 'house':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
          <path d="M9 21V14h6v7" />
        </svg>
      );
    case 'office':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" strokeLinecap="round" />
        </svg>
      );
    case 'building':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
          <path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      );
  }
};

// Budget Type Icons
const BudgetIcon = ({ type, className = '' }: { type: string; className?: string }) => {
  switch (type) {
    case 'fixed':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 6v12M9 9h6M9 15h6" strokeLinecap="round" />
        </svg>
      );
    case 'range':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'sqm':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <path d="M4 12h16M12 4v16" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 12h8M12 3v18" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
};

export default function PostJobPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { locale } = useLanguage();
  const { isClientMode } = useViewMode();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editJobId = searchParams.get('edit');
  const isEditMode = !!editJobId;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Category selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [customSpecialties, setCustomSpecialties] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    propertyType: '',
    propertyTypeOther: '',
    areaSize: '',
    roomCount: '',
    deadline: '',
    budgetType: 'negotiable',
    budgetAmount: '',
    budgetMin: '',
    budgetMax: '',
    pricePerUnit: '',
  });

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [newReferenceUrl, setNewReferenceUrl] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [notifyAllPros, setNotifyAllPros] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auth check - allow both client and pro users
  useEffect(() => {
    const canPostJob = user?.role === 'client' || user?.role === 'pro';
    if (!authLoading && (!isAuthenticated || !canPostJob)) {
      openLoginModal('/post-job');
    }
  }, [authLoading, isAuthenticated, user, openLoginModal]);

  // Fetch job data for edit mode
  useEffect(() => {
    if (!editJobId || !isAuthenticated) return;

    const fetchJobData = async () => {
      setIsLoadingJob(true);
      try {
        const response = await api.get(`/jobs/${editJobId}`);
        const job = response.data;

        setSelectedCategory(job.category || '');
        setSelectedSubcategories(job.skills || []);

        setFormData({
          title: job.title || '',
          description: job.description || '',
          location: job.location || '',
          propertyType: job.propertyType || '',
          propertyTypeOther: job.propertyTypeOther || '',
          areaSize: job.areaSize?.toString() || '',
          roomCount: job.roomCount?.toString() || '',
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          budgetType: job.budgetType || 'negotiable',
          budgetAmount: job.budgetAmount?.toString() || '',
          budgetMin: job.budgetMin?.toString() || '',
          budgetMax: job.budgetMax?.toString() || '',
          pricePerUnit: job.pricePerUnit?.toString() || '',
        });

        if (job.references) setReferences(job.references);
        if (job.media?.length > 0) {
          setExistingMedia(job.media);
        } else if (job.images?.length > 0) {
          setExistingMedia(job.images.map((url: string) => ({ type: 'image' as const, url })));
        }

      } catch (err: any) {
        console.error('Failed to fetch job:', err);
        setError('Failed to load job data');
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobData();
  }, [editJobId, isAuthenticated]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: MediaFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const addReference = () => {
    if (!newReferenceUrl.trim()) return;
    let type: Reference['type'] = 'link';
    if (newReferenceUrl.includes('pinterest')) type = 'pinterest';
    else if (newReferenceUrl.includes('instagram')) type = 'instagram';
    setReferences(prev => [...prev, { type, url: newReferenceUrl.trim() }]);
    setNewReferenceUrl('');
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // Validation state for each field
  const getValidationState = () => {
    const hasCategory = !!selectedCategory;
    const hasSpecialty = selectedSubcategories.length > 0 || customSpecialties.length > 0;
    const hasTitle = !!formData.title.trim();
    const hasDescription = !!formData.description.trim();
    const hasPropertyType = !!formData.propertyType && (formData.propertyType !== 'other' || !!formData.propertyTypeOther.trim());

    let budgetValid = true;
    if (formData.budgetType === 'fixed') budgetValid = !!formData.budgetAmount;
    if (formData.budgetType === 'range') budgetValid = !!formData.budgetMin && !!formData.budgetMax;
    if (formData.budgetType === 'per_sqm') budgetValid = !!formData.pricePerUnit;

    return {
      category: hasCategory,
      specialty: hasSpecialty,
      title: hasTitle,
      description: hasDescription,
      propertyType: hasPropertyType,
      budget: budgetValid,
    };
  };

  const validation = getValidationState();
  const completedFields = Object.values(validation).filter(Boolean).length;
  const totalFields = Object.keys(validation).length;

  const canSubmit = (): boolean => {
    return Object.values(validation).every(Boolean);
  };

  // Get first missing field for display
  const getFirstMissingField = () => {
    if (!validation.category) return { key: 'category', label: locale === 'ka' ? 'კატეგორია' : 'Category' };
    if (!validation.specialty) return { key: 'specialty', label: locale === 'ka' ? 'სპეციალობა' : 'Specialty' };
    if (!validation.title) return { key: 'title', label: locale === 'ka' ? 'სათაური' : 'Title' };
    if (!validation.description) return { key: 'description', label: locale === 'ka' ? 'აღწერა' : 'Description' };
    if (!validation.propertyType) return { key: 'propertyType', label: locale === 'ka' ? 'ობიექტის ტიპი' : 'Property type' };
    if (!validation.budget) return { key: 'budget', label: locale === 'ka' ? 'ბიუჯეტი' : 'Budget' };
    return null;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedMedia: { type: 'image' | 'video'; url: string }[] = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const mediaFile = mediaFiles[i];
        setUploadProgress(Math.round((i / mediaFiles.length) * 50));
        const formDataUpload = new FormData();
        formDataUpload.append('file', mediaFile.file);
        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedMedia.push({
          type: mediaFile.type,
          url: uploadRes.data.url || uploadRes.data.filename
        });
      }

      setUploadProgress(75);

      const jobData: any = {
        title: formData.title,
        description: formData.description,
        category: selectedCategory,
        skills: [...selectedSubcategories, ...customSpecialties],
        propertyType: formData.propertyType,
        budgetType: formData.budgetType,
      };

      if (formData.propertyType === 'other' && formData.propertyTypeOther) {
        jobData.propertyTypeOther = formData.propertyTypeOther;
      }
      if (formData.location) jobData.location = formData.location;
      if (formData.areaSize) jobData.areaSize = Number(formData.areaSize);
      if (formData.roomCount) jobData.roomCount = Number(formData.roomCount);
      if (formData.deadline) jobData.deadline = formData.deadline;

      if (formData.budgetType === 'fixed' && formData.budgetAmount) {
        jobData.budgetAmount = Number(formData.budgetAmount);
      }
      if (formData.budgetType === 'range') {
        if (formData.budgetMin) jobData.budgetMin = Number(formData.budgetMin);
        if (formData.budgetMax) jobData.budgetMax = Number(formData.budgetMax);
      }
      if (formData.budgetType === 'per_sqm' && formData.pricePerUnit) {
        jobData.pricePerUnit = Number(formData.pricePerUnit);
      }

      if (references.length > 0) jobData.references = references;
      if (notifyAllPros) jobData.notifyPros = true;

      if (uploadedMedia.length) {
        jobData.images = uploadedMedia.filter(m => m.type === 'image').map(m => m.url);
      } else if (isEditMode && existingMedia.length > 0) {
        jobData.images = existingMedia.filter(m => m.type === 'image').map(m => m.url);
      }

      setUploadProgress(90);

      if (isEditMode && editJobId) {
        await api.put(`/jobs/${editJobId}`, jobData);
      } else {
        await api.post('/jobs', jobData);
      }

      setUploadProgress(100);

      toast.success(
        isEditMode
          ? (locale === 'ka' ? 'სამუშაო განახლდა' : 'Job updated')
          : (locale === 'ka' ? 'სამუშაო შეიქმნა' : 'Job created'),
        isEditMode
          ? (locale === 'ka' ? 'თქვენი სამუშაო წარმატებით განახლდა' : 'Your job has been successfully updated')
          : (locale === 'ka' ? 'თქვენი სამუშაო წარმატებით გამოქვეყნდა' : 'Your job has been successfully posted')
      );

      router.push('/my-jobs');
    } catch (err: any) {
      console.error('Failed to save job:', err);
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} job`);
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? `სამუშაოს ${isEditMode ? 'განახლება' : 'შექმნა'} ვერ მოხერხდა` : `Failed to ${isEditMode ? 'update' : 'create'} job`
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (authLoading || isLoadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
        </div>
      </div>
    );
  }

  const totalSpecialties = selectedSubcategories.length + customSpecialties.length;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      <main className={`relative z-10 pt-16 pb-24 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="container-custom pt-8 md:pt-12">
          <div className="max-w-2xl mx-auto">
            {/* Hero Section */}
            <section className="mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
                  {locale === 'ka' ? 'ახალი პროექტი' : 'New Project'}
                </span>
              </div>

              {/* Main headline */}
              <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-4">
                {isEditMode ? (
                  locale === 'ka' ? (
                    <>პროექტის <span className="text-[var(--color-accent)]">რედაქტირება</span></>
                  ) : (
                    <>Edit Your <span className="text-[var(--color-accent)]">Project</span></>
                  )
                ) : (
                  locale === 'ka' ? (
                    <>აღწერე შენი <span className="text-[var(--color-accent)]">პროექტი</span></>
                  ) : (
                    <>Describe Your <span className="text-[var(--color-accent)]">Project</span></>
                  )
                )}
              </h1>

              <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl mb-8 leading-relaxed">
                {locale === 'ka'
                  ? 'შეავსე დეტალები და მიიღე შეთავაზებები საუკეთესო სპეციალისტებისგან.'
                  : 'Fill in the details and receive proposals from top professionals.'
                }
              </p>
            </section>

            {/* Main Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              {/* Section 1: Category & Specializations */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.category && validation.specialty
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--color-accent)] text-white'
                  }`}>
                    {validation.category && validation.specialty ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '1'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'რა გჭირდება?' : 'What do you need?'}
                      </h2>
                      {!validation.category && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'სავალდებულო' : 'Required'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'აირჩიე კატეგორია და სპეციალობა' : 'Select category and specialty'}
                    </p>
                  </div>
                </div>

                <CategorySubcategorySelector
                  selectedCategory={selectedCategory}
                  selectedSubcategories={selectedSubcategories}
                  onCategoryChange={setSelectedCategory}
                  onSubcategoriesChange={setSelectedSubcategories}
                  customSpecialties={customSpecialties}
                  onCustomSpecialtiesChange={setCustomSpecialties}
                  showCustomSpecialties={false}
                  singleCategoryMode={true}
                />
              </section>

              {/* Section 2: Project Details */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.title && validation.description && validation.propertyType
                      ? 'bg-emerald-500 text-white'
                      : totalSpecialties > 0
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
                  }`}>
                    {validation.title && validation.description && validation.propertyType ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '2'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'პროექტის დეტალები' : 'Project Details'}
                      </h2>
                      {totalSpecialties > 0 && (!validation.title || !validation.description || !validation.propertyType) && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'შეავსე' : 'Fill in'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'აღწერე რა გინდა გაკეთდეს' : 'Describe what needs to be done'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  {/* Title */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>{locale === 'ka' ? 'პროექტის სათაური' : 'Project Title'}</span>
                      {validation.title ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder={locale === 'ka' ? 'მაგ: 2 ოთახიანი ბინის რემონტი' : 'e.g. 2-bedroom apartment renovation'}
                      className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all ${
                        validation.title
                          ? 'border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      <span>{locale === 'ka' ? 'აღწერა' : 'Description'}</span>
                      {validation.description ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={4}
                      placeholder={locale === 'ka' ? 'დეტალურად აღწერე რა გინდა გაკეთდეს...' : 'Describe what you need in detail...'}
                      className={`w-full px-4 py-3 bg-[var(--color-bg-primary)] border rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all resize-none ${
                        validation.description
                          ? 'border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20'
                          : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-soft)]'
                      }`}
                    />
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                      <span>{locale === 'ka' ? 'ობიექტის ტიპი' : 'Property Type'}</span>
                      {validation.propertyType ? (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PROPERTY_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            updateFormData('propertyType', type.value);
                            if (type.value !== 'other') updateFormData('propertyTypeOther', '');
                          }}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                            formData.propertyType === type.value
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/50'
                              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-bg-primary)]'
                          }`}
                        >
                          <PropertyIcon
                            type={type.icon}
                            className={`w-6 h-6 transition-colors ${
                              formData.propertyType === type.value
                                ? 'text-[var(--color-accent)]'
                                : 'text-[var(--color-text-tertiary)]'
                            }`}
                          />
                          <span className={`text-xs font-medium text-center transition-colors ${
                            formData.propertyType === type.value
                              ? 'text-[var(--color-accent)]'
                              : 'text-[var(--color-text-secondary)]'
                          }`}>
                            {locale === 'ka' ? type.labelKa : type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {formData.propertyType === 'other' && (
                      <input
                        type="text"
                        value={formData.propertyTypeOther}
                        onChange={(e) => updateFormData('propertyTypeOther', e.target.value)}
                        placeholder={locale === 'ka' ? 'მიუთითე ობიექტის ტიპი...' : 'Specify property type...'}
                        className="w-full mt-3 px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                    )}
                  </div>

                  {/* Size & Rooms */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'ფართობი (მ²)' : 'Area (m²)'}
                      </label>
                      <input
                        type="number"
                        value={formData.areaSize}
                        onChange={(e) => updateFormData('areaSize', e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'ოთახების რაოდენობა' : 'Number of Rooms'}
                      </label>
                      <input
                        type="number"
                        value={formData.roomCount}
                        onChange={(e) => updateFormData('roomCount', e.target.value)}
                        placeholder="3"
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'სასურველი დასრულების თარიღი' : 'Preferred Deadline'}
                    </label>
                    <DatePicker
                      value={formData.deadline}
                      onChange={(value) => updateFormData('deadline', value)}
                      min={new Date().toISOString().split('T')[0]}
                      locale={locale}
                      placeholder={locale === 'ka' ? 'აირჩიე თარიღი' : 'Select date'}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <AddressPicker
                      value={formData.location}
                      onChange={(value) => updateFormData('location', value)}
                      locale={locale}
                      label={locale === 'ka' ? 'მდებარეობა' : 'Location'}
                      required={false}
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Budget */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${
                    validation.budget
                      ? 'bg-emerald-500 text-white'
                      : validation.title && validation.description && validation.propertyType
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]'
                  }`}>
                    {validation.budget ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : '3'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'ბიუჯეტი' : 'Budget'}
                      </h2>
                      {validation.title && validation.description && validation.propertyType && !validation.budget && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {locale === 'ka' ? 'მიუთითე' : 'Specify'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'რამდენის დახარჯვა გეგმავ?' : 'How much are you planning to spend?'}
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  {/* Budget Type Selection */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {BUDGET_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData('budgetType', type.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.budgetType === type.value
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/50'
                            : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)] bg-[var(--color-bg-primary)]'
                        }`}
                      >
                        <BudgetIcon
                          type={type.icon}
                          className={`w-5 h-5 transition-colors ${
                            formData.budgetType === type.value
                              ? 'text-[var(--color-accent)]'
                              : 'text-[var(--color-text-tertiary)]'
                          }`}
                        />
                        <span className={`text-xs font-medium text-center transition-colors ${
                          formData.budgetType === type.value
                            ? 'text-[var(--color-accent)]'
                            : 'text-[var(--color-text-secondary)]'
                        }`}>
                          {locale === 'ka' ? type.labelKa : type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Budget Input Fields */}
                  {formData.budgetType === 'fixed' && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'ბიუჯეტის თანხა (₾)' : 'Budget Amount (₾)'}
                      </label>
                      <input
                        type="number"
                        value={formData.budgetAmount}
                        onChange={(e) => updateFormData('budgetAmount', e.target.value)}
                        placeholder="5000"
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-lg font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                    </div>
                  )}

                  {formData.budgetType === 'range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                          {locale === 'ka' ? 'მინიმუმ (₾)' : 'Minimum (₾)'}
                        </label>
                        <input
                          type="number"
                          value={formData.budgetMin}
                          onChange={(e) => updateFormData('budgetMin', e.target.value)}
                          placeholder="3000"
                          className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-lg font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                          {locale === 'ka' ? 'მაქსიმუმ (₾)' : 'Maximum (₾)'}
                        </label>
                        <input
                          type="number"
                          value={formData.budgetMax}
                          onChange={(e) => updateFormData('budgetMax', e.target.value)}
                          placeholder="8000"
                          className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-lg font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {formData.budgetType === 'per_sqm' && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        {locale === 'ka' ? 'ფასი კვ.მ-ზე (₾)' : 'Price per m² (₾)'}
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerUnit}
                        onChange={(e) => updateFormData('pricePerUnit', e.target.value)}
                        placeholder="50"
                        className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-lg font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                      {formData.areaSize && formData.pricePerUnit && (
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                          {locale === 'ka' ? 'სავარაუდო ჯამი:' : 'Estimated total:'}{' '}
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            ₾{(Number(formData.areaSize) * Number(formData.pricePerUnit)).toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {formData.budgetType === 'negotiable' && (
                    <div className="p-4 rounded-xl bg-[var(--color-accent-soft)]/50 border border-[var(--color-accent)]/20 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {locale === 'ka'
                          ? 'სპეციალისტები შემოგთავაზებენ საკუთარ ფასებს'
                          : 'Professionals will propose their own prices'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 4: Media & References (Optional) */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)] font-bold border border-[var(--color-border-subtle)]">
                    4
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                      {locale === 'ka' ? 'ფოტოები და ინსპირაცია' : 'Photos & Inspiration'}
                    </h2>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {locale === 'ka' ? 'არასავალდებულო - დაეხმარე სპეციალისტს' : 'Optional - help pros understand'}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  {/* Existing Media (Edit Mode) */}
                  {isEditMode && existingMedia.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                        {locale === 'ka' ? 'არსებული ფოტოები' : 'Current Photos'} ({existingMedia.length})
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {existingMedia.map((media, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                            <img
                              src={storage.getFileUrl(media.url)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                      {locale === 'ka' ? 'ატვირთე ფოტოები' : 'Upload Photos'}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="group p-8 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)] cursor-pointer transition-all duration-300"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center group-hover:bg-[var(--color-accent-soft)] group-hover:scale-110 transition-all duration-300">
                          <svg className="w-7 h-7 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="font-medium text-[var(--color-text-primary)] mb-1">
                          {locale === 'ka' ? 'ატვირთე ფოტოები' : 'Upload photos'}
                        </p>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                          PNG, JPG, MP4
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Files Preview */}
                  {mediaFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {mediaFiles.map((media, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                          {media.type === 'image' ? (
                            <img src={media.preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={media.preview} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeMediaFile(idx)}
                              className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30"
                            >
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* References/Inspiration Links */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                      {locale === 'ka' ? 'ინსპირაციის ბმულები' : 'Inspiration Links'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newReferenceUrl}
                        onChange={(e) => setNewReferenceUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReference())}
                        placeholder={locale === 'ka' ? 'ბმული ინსპირაციისთვის...' : 'Link for inspiration...'}
                        className="flex-1 px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={addReference}
                        disabled={!newReferenceUrl.trim()}
                        className="px-4 py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--color-accent)]/25"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    {references.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {references.map((ref, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)]"
                          >
                            <svg className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="flex-1 text-sm text-[var(--color-text-secondary)] truncate">
                              {ref.url}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeReference(idx)}
                              className="p-1 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Notify All Professionals */}
              <section className="mb-6">
                <label
                  className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--color-accent-soft)]/50 to-[var(--color-highlight-soft)]/30 border border-[var(--color-accent)]/20 cursor-pointer group hover:border-[var(--color-accent)]/40 transition-all duration-300"
                  onClick={() => setNotifyAllPros(!notifyAllPros)}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      notifyAllPros
                        ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] group-hover:border-[var(--color-accent)]'
                    }`}>
                      {notifyAllPros && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {locale === 'ka' ? 'მიიღეთ მეტი შეთავაზება' : 'Get More Proposals'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-white">
                        {locale === 'ka' ? 'რეკომენდებული' : 'Recommended'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {locale === 'ka'
                        ? 'ჩართვით ადასტურებთ რომ მიუვიდეს შეტყობინება ყველა შესაბამის პროფესიონალს თქვენი პროექტის შესახებ რათა მიიღოთ მეტი შეთავაზება სწრაფად.'
                        : 'Notify all matching professionals about your project and receive more proposals faster.'}
                    </p>
                  </div>
                </label>
              </section>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

            </form>
          </div>
        </div>
      </main>

      {/* Submit Button - Fixed at bottom, compact design */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-t border-[var(--color-border-subtle)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Progress indicator - compact */}
            {!canSubmit() && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center relative">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="var(--color-border)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(completedFields / totalFields) * 75.4} 75.4`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {completedFields}/{totalFields}
                  </span>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium hidden sm:block">
                  {getFirstMissingField()?.label}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={() => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }}
              disabled={isSubmitting || !canSubmit()}
              className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                canSubmit()
                  ? 'bg-[var(--color-accent)] text-white hover:shadow-[0_4px_20px_rgba(13,150,104,0.3)]'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{uploadProgress > 0 ? `${uploadProgress}%` : (locale === 'ka' ? 'მიმდინარეობს...' : 'Processing...')}</span>
                </>
              ) : canSubmit() ? (
                <>
                  <span>{isEditMode ? (locale === 'ka' ? 'შენახვა' : 'Save') : (locale === 'ka' ? 'გამოქვეყნება' : 'Publish')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              ) : (
                <span>{locale === 'ka' ? 'შეავსე ველები' : 'Fill required fields'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

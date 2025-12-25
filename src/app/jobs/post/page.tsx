'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Select from '@/components/common/Select';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function PostJobPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: [] as string[],
    location: '',
    // Size specifications
    areaSize: '',
    sizeUnit: 'sqm',
    roomCount: '',
    // Budget specifications
    budgetType: 'negotiable',
    budgetAmount: '',
    budgetMin: '',
    budgetMax: '',
    pricePerUnit: '',
    deadline: '',
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Redirect if not authenticated or not a client/admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== 'client' && user?.role !== 'admin'))) {
      router.push('/browse');
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => URL.revokeObjectURL(media.preview));
    };
  }, [mediaFiles]);

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMediaFiles: MediaFile[] = [];
    const maxFiles = 10;
    const maxSize = 50 * 1024 * 1024; // 50MB

    Array.from(files).forEach(file => {
      if (mediaFiles.length + newMediaFiles.length >= maxFiles) {
        setError(t('postJob.maxFilesError'));
        return;
      }

      if (file.size > maxSize) {
        setError(t('postJob.fileTooLarge'));
        return;
      }

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        setError(t('postJob.invalidFileType'));
        return;
      }

      newMediaFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      });
    });

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
    setError('');

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    const token = localStorage.getItem('access_token');

    for (let i = 0; i < mediaFiles.length; i++) {
      const media = mediaFiles[i];
      const formData = new FormData();
      formData.append('file', media.file);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error('Failed to upload file:', err);
      }

      setUploadProgress(((i + 1) / mediaFiles.length) * 100);
    }

    return uploadedUrls;
  };

  const calculateEstimatedTotal = () => {
    if (formData.budgetType === 'per_sqm' && formData.pricePerUnit && formData.areaSize) {
      return parseFloat(formData.pricePerUnit) * parseFloat(formData.areaSize);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.budgetType === 'fixed' && !formData.budgetAmount) {
      setError(t('postJob.budgetRequired'));
      return;
    }

    if (formData.budgetType === 'per_sqm' && !formData.pricePerUnit) {
      setError(t('postJob.pricePerUnitRequired'));
      return;
    }

    if (formData.budgetType === 'range' && (!formData.budgetMin || !formData.budgetMax)) {
      setError(t('postJob.budgetRangeRequired'));
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Upload media files first
      const mediaUrls = await uploadMedia();

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          skills: formData.skills,
          location: formData.location,
          areaSize: formData.areaSize ? parseFloat(formData.areaSize) : undefined,
          sizeUnit: formData.areaSize ? formData.sizeUnit : undefined,
          roomCount: formData.roomCount ? parseInt(formData.roomCount) : undefined,
          budgetType: formData.budgetType,
          budgetAmount: formData.budgetAmount ? parseFloat(formData.budgetAmount) : undefined,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
          pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
          deadline: formData.deadline || undefined,
          images: mediaUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to post job');
      }

      router.push('/browse');
    } catch (err: any) {
      setError(err.message || 'Failed to post job. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const estimatedTotal = calculateEstimatedTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 dark:from-dark-300 dark:via-dark-300 dark:to-dark-300 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{t('postJob.title')}</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{t('postJob.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl dark:shadow-dark-card border-2 border-neutral-200 dark:border-dark-border p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                {t('postJob.jobTitle')} <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder={t('postJob.jobTitlePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                {t('postJob.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder={t('postJob.descriptionPlaceholder')}
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                {t('postJob.mediaUpload')} <span className="text-neutral-400">({t('auth.optional')})</span>
              </label>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{t('postJob.mediaUploadDescription')}</p>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-neutral-700 dark:text-neutral-400 font-medium mb-1">{t('postJob.clickToUpload')}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('postJob.dragAndDrop')}</p>
                <p className="text-xs text-neutral-400 mt-2">{t('postJob.supportedFormats')}</p>
              </div>

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-400">
                      {mediaFiles.length} {t('postJob.filesSelected')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        mediaFiles.forEach(m => URL.revokeObjectURL(m.preview));
                        setMediaFiles([]);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      {t('postJob.removeAll')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-dark-300">
                        {media.type === 'image' ? (
                          <img
                            src={media.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                            <video
                              src={media.preview}
                              className="max-w-full max-h-full"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {media.type === 'video' && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                            {t('postJob.video')}
                          </div>
                        )}
                      </div>
                    ))}
                    {mediaFiles.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
                      >
                        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-neutral-500">{t('postJob.addMore')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('postJob.category')} <span className="text-red-500">*</span>
                </label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  options={categories.map((cat) => ({ value: cat, label: t(`categories.${cat}`) || cat }))}
                  placeholder={t('postJob.selectCategory')}
                  searchable
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                  {t('postJob.location')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input"
                  placeholder={t('postJob.locationPlaceholder')}
                />
              </div>
            </div>

            {/* Area/Size Specifications */}
            <div className="bg-neutral-50 dark:bg-dark-300 rounded-xl p-5 border border-neutral-200 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                {t('postJob.sizeSpecifications')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">{t('postJob.areaSize')}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.areaSize}
                      onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                      className="input flex-1"
                      placeholder="85"
                    />
                    <Select
                      value={formData.sizeUnit}
                      onChange={(value) => setFormData({ ...formData, sizeUnit: value })}
                      options={[
                        { value: 'sqm', label: t('postJob.sqm') },
                        { value: 'room', label: t('postJob.rooms') },
                        { value: 'floor', label: t('postJob.floors') },
                        { value: 'unit', label: t('postJob.units') },
                        { value: 'item', label: t('postJob.items') },
                      ]}
                      className="w-28"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">{t('postJob.roomCount')}</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.roomCount}
                    onChange={(e) => setFormData({ ...formData, roomCount: e.target.value })}
                    className="input"
                    placeholder="3"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                {t('postJob.requiredSkills')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input flex-1"
                  placeholder={t('postJob.addSkill')}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn btn-outline px-6"
                >
                  {t('common.add')}
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-primary-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-3">
                {t('postJob.budget')} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                    <input
                      type="radio"
                      name="budgetType"
                      value="fixed"
                      checked={formData.budgetType === 'fixed'}
                      onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                      className="text-primary-500"
                    />
                    <span className="text-sm font-medium">{t('postJob.fixedPrice')}</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                    <input
                      type="radio"
                      name="budgetType"
                      value="range"
                      checked={formData.budgetType === 'range'}
                      onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                      className="text-primary-500"
                    />
                    <span className="text-sm font-medium">{t('postJob.priceRange')}</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                    <input
                      type="radio"
                      name="budgetType"
                      value="per_sqm"
                      checked={formData.budgetType === 'per_sqm'}
                      onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                      className="text-primary-500"
                    />
                    <span className="text-sm font-medium">{t('postJob.perSqm')}</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-neutral-200 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                    <input
                      type="radio"
                      name="budgetType"
                      value="negotiable"
                      checked={formData.budgetType === 'negotiable'}
                      onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                      className="text-primary-500"
                    />
                    <span className="text-sm font-medium">{t('jobs.negotiable')}</span>
                  </label>
                </div>

                {formData.budgetType === 'fixed' && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">GEL</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.budgetAmount}
                      onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                      className="input w-full pl-14"
                      placeholder={t('postJob.totalBudgetPlaceholder')}
                    />
                  </div>
                )}

                {formData.budgetType === 'range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">GEL</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        className="input pl-14"
                        placeholder={t('postJob.minBudget')}
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">GEL</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                        className="input pl-14"
                        placeholder={t('postJob.maxBudget')}
                      />
                    </div>
                  </div>
                )}

                {formData.budgetType === 'per_sqm' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">GEL</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                        className="input w-full pl-14"
                        placeholder={t('postJob.pricePerSqmPlaceholder')}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">/ {t('postJob.sqm')}</span>
                    </div>
                    {estimatedTotal && (
                      <div className="flex items-center gap-2 p-3 bg-[#E07B4F]/5 border border-[#E07B4F]/20 rounded-xl">
                        <svg className="w-5 h-5 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-[#B8560E]">
                          {t('postJob.estimatedTotal')}: <strong>GEL {estimatedTotal.toLocaleString()}</strong>
                          <span className="text-[#E07B4F] ml-1">({formData.areaSize} {t('postJob.sqm')} × GEL {formData.pricePerUnit})</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {formData.budgetType === 'negotiable' && (
                  <p className="text-sm text-neutral-500">
                    {t('postJob.negotiableDescription')}
                  </p>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-400 mb-2">
                {t('postJob.deadline')} <span className="text-neutral-400">({t('auth.optional')})</span>
              </label>
              <input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-primary-700">{t('postJob.uploadingMedia')}</span>
                  <span className="text-sm text-primary-600">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/browse')}
                className="flex-1 btn btn-outline"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('postJob.posting')}
                  </span>
                ) : t('jobs.postJob')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

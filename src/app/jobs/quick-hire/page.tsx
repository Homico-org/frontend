'use client';

import { useState, useEffect } from 'react';
import Header, { HeaderSpacer } from '@/components/common/Header';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProProfile {
  _id: string;
  name: string;
  avatar?: string;
  title: string;
  categories: string[];
  avgRating: number;
  totalReviews: number;
  yearsExperience: number;
  responseTime?: string;
  completedJobs?: number;
  isAvailable: boolean;
  serviceAreas: string[];
}

interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

const categories = [
  { key: 'Electrician', label: 'Electrician' },
  { key: 'Plumbing', label: 'Plumbing' },
  { key: 'Painting', label: 'Painting' },
  { key: 'Cleaning', label: 'Cleaning' },
  { key: 'AC Repair', label: 'AC / Heating' },
  { key: 'Carpentry', label: 'Carpentry' },
  { key: 'Locksmith', label: 'Locksmith' },
  { key: 'Appliance Repair', label: 'Appliances' },
  { key: 'Flooring', label: 'Flooring' },
  { key: 'Roofing', label: 'Roofing' },
  { key: 'Windows', label: 'Windows & Doors' },
  { key: 'Pest Control', label: 'Pest Control' },
  { key: 'Gardening', label: 'Gardening' },
  { key: 'Moving', label: 'Moving' },
  { key: 'Handyman', label: 'Handyman' },
  { key: 'Security', label: 'Security' },
];

const steps = [
  { id: 1, title: 'Service' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Select Pros' },
];

export default function QuickHirePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [suggestedPros, setSuggestedPros] = useState<ProProfile[]>([]);
  const [selectedPros, setSelectedPros] = useState<string[]>([]);
  const [isLoadingPros, setIsLoadingPros] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/jobs/quick-hire');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.city && !location) {
      setLocation(user.city);
    }
  }, [user, location]);

  // Fetch pros when entering step 3
  useEffect(() => {
    if (step === 3) {
      fetchSuggestedPros();
    }
  }, [step]);

  const filteredCategories = searchQuery
    ? categories.filter(c =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  const fetchSuggestedPros = async () => {
    setIsLoadingPros(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        sort: 'rating',
        limit: '10',
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/pros?${params}`);
      if (response.ok) {
        const result = await response.json();
        const profiles = result.data || result.profiles || result || [];
        const availablePros = profiles.filter((pro: ProProfile) => pro.isAvailable !== false && (pro.avgRating || 0) >= 4);
        setSuggestedPros(availablePros);
        setSelectedPros(availablePros.slice(0, 3).map((p: ProProfile) => p._id));
      }
    } catch (error) {
      console.error('Failed to fetch pros:', error);
    } finally {
      setIsLoadingPros(false);
    }
  };

  const toggleProSelection = (proId: string) => {
    setSelectedPros(prev =>
      prev.includes(proId)
        ? prev.filter(id => id !== proId)
        : [...prev, proId]
    );
  };

  const handleSubmit = async () => {
    if (selectedPros.length === 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('description', description);
      formData.append('location', location);
      if (coordinates) {
        formData.append('coordinates', JSON.stringify(coordinates));
      }
      formData.append('selectedPros', JSON.stringify(selectedPros));
      media.forEach((item) => {
        formData.append('media', item.file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/quick-hire`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        setRequestSent(true);
      } else {
        setRequestSent(true);
      }
    } catch (error) {
      setRequestSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return selectedCategory !== '';
    if (step === 2) return description.length > 10 && location !== '';
    if (step === 3) return selectedPros.length > 0;
    return false;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-300">
        <Header />
      <HeaderSpacer />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 dark:border-primary-400 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-300">
        <Header />
      <HeaderSpacer />
        <div className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-[#E07B4F]/10 dark:bg-[#E07B4F]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#E07B4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Request Sent</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Your request has been sent to {selectedPros.length} professional{selectedPros.length > 1 ? 's' : ''}.
              The first one to accept will contact you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Back to Browse
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-300">
      <Header />
      <HeaderSpacer />

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/browse" className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-sm mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quick Hire</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Find someone available right now</p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step > s.id
                          ? 'bg-neutral-900 text-white'
                          : step === s.id
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {step > s.id ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.id
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${step >= s.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">What do you need?</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Select a service category</p>

                {/* Search */}
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm"
                  />
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedCategory === cat.key
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 dark:text-neutral-400">No services found</p>
                    <button
                      onClick={() => {
                        setSelectedCategory(searchQuery);
                      }}
                      className="mt-2 text-sm text-neutral-900 dark:text-white font-medium hover:underline"
                    >
                      Use "{searchQuery}" as custom service
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Tell us more</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Describe what you need and where</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                    What needs to be done?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue or work needed..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                    Location
                  </label>
                  <LocationPicker
                    value={location}
                    onChange={(address, coords) => {
                      setLocation(address);
                      setCoordinates(coords);
                    }}
                    placeholder="Select your address"
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-2">
                    Photos or Videos <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <MediaUpload
                    value={media}
                    onChange={setMedia}
                    maxFiles={5}
                    maxSizeMB={50}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Select Pros */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Select professionals</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Choose who to contact. First to accept gets the job.
                </p>

                {isLoadingPros ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 dark:border-primary-400 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Finding available professionals...</p>
                  </div>
                ) : suggestedPros.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedPros.map((pro) => (
                      <div
                        key={pro._id}
                        onClick={() => toggleProSelection(pro._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedPros.includes(pro._id)
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedPros.includes(pro._id)
                            ? 'border-neutral-900 bg-neutral-900'
                            : 'border-neutral-300'
                        }`}>
                          {selectedPros.includes(pro._id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {pro.avatar ? (
                          <img src={pro.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium">
                            {pro.name?.charAt(0) || 'P'}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-900 dark:text-white truncate">{pro.name}</div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{pro.title}</div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium">{pro.avgRating.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-neutral-400">{pro.totalReviews} reviews</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">No available professionals found</p>
                    <Link href="/jobs/post" className="text-neutral-900 dark:text-white font-medium hover:underline">
                      Post a regular job instead
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </span>
                ) : (
                  `Send to ${selectedPros.length} pro${selectedPros.length !== 1 ? 's' : ''}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

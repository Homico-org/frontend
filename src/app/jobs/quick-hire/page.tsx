'use client';

import Avatar from '@/components/common/Avatar';
import Header, { HeaderSpacer } from '@/components/common/Header';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import type { ProProfile } from '@/types/shared';
import { ChevronLeft, Check, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
        setSelectedPros(availablePros.slice(0, 3).map((p: ProProfile) => p.id));
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
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
      <HeaderSpacer />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
        </div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <Header />
      <HeaderSpacer />
        <div className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-[var(--hm-brand-500)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-[var(--hm-brand-500)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--hm-fg-primary)] mb-3">Request Sent</h1>
            <p className="text-[var(--hm-fg-secondary)] mb-8">
              Your request has been sent to {selectedPros.length} professional{selectedPros.length > 1 ? 's' : ''}.
              The first one to accept will contact you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/professionals"
                className="px-6 py-3 bg-[var(--hm-bg-tertiary)] hover:bg-[var(--hm-border)] text-[var(--hm-fg-secondary)] font-medium rounded-xl transition-colors"
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
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <Header />
      <HeaderSpacer />

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/professionals" className="inline-flex items-center gap-2 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-secondary)] text-sm mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-[var(--hm-fg-primary)]">Quick Hire</h1>
            <p className="text-[var(--hm-fg-muted)] mt-1">Find someone available right now</p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <div className="flex items-center">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step >= s.id
                          ? 'bg-[var(--hm-brand-500)] text-white'
                          : 'bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                      }`}
                    >
                      {step > s.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        s.id
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${step >= s.id ? 'text-[var(--hm-fg-primary)]' : 'text-[var(--hm-fg-muted)]'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${step > s.id ? 'bg-[var(--hm-brand-500)]' : 'bg-[var(--hm-border)]'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="bg-[var(--hm-bg-elevated)] rounded-2xl border border-[var(--hm-border)] p-6">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">What do you need?</h2>
                <p className="text-sm text-[var(--hm-fg-muted)] mb-4">Select a service category</p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--hm-fg-muted)] z-10" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services..."
                    className="pl-10"
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
                          ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)] text-white'
                          : 'border-[var(--hm-border)] hover:border-[var(--hm-border-strong)] text-[var(--hm-fg-secondary)]'
                      }`}
                    >
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[var(--hm-fg-muted)]">No services found</p>
                    <button
                      onClick={() => {
                        setSelectedCategory(searchQuery);
                      }}
                      className="mt-2 text-sm text-[var(--hm-fg-primary)] font-medium hover:underline"
                    >
                      Use &quot;{searchQuery}&quot; as custom service
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">Tell us more</h2>
                  <p className="text-sm text-[var(--hm-fg-muted)] mb-4">Describe what you need and where</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                    What needs to be done?
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue or work needed..."
                    rows={4}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
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
                  <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
                    Photos or Videos <span className="text-[var(--hm-fg-muted)] font-normal">(optional)</span>
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
                <h2 className="text-lg font-semibold text-[var(--hm-fg-primary)] mb-1">Select professionals</h2>
                <p className="text-sm text-[var(--hm-fg-muted)] mb-4">
                  Choose who to contact. First to accept gets the job.
                </p>

                {isLoadingPros ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-3">
                      <LoadingSpinner size="lg" color="var(--hm-brand-500)" />
                    </div>
                    <p className="text-sm text-[var(--hm-fg-muted)]">Finding available professionals...</p>
                  </div>
                ) : suggestedPros.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedPros.map((pro) => (
                      <div
                        key={pro.id}
                        onClick={() => toggleProSelection(pro.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedPros.includes(pro.id)
                            ? 'border-[var(--hm-fg-primary)] bg-[var(--hm-bg-tertiary)]'
                            : 'border-[var(--hm-border)] hover:border-[var(--hm-border-strong)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedPros.includes(pro.id)
                            ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]'
                            : 'border-[var(--hm-border-strong)]'
                        }`}>
                          {selectedPros.includes(pro.id) && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </div>

                        <Avatar
                          src={pro.avatar}
                          name={pro.name || 'P'}
                          size="md"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--hm-fg-primary)] truncate">{pro.name}</div>
                          <div className="text-sm text-[var(--hm-fg-muted)] truncate">{pro.title}</div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 text-[var(--hm-warning-500)] fill-current" />
                            <span className="font-medium">{pro.avgRating.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-[var(--hm-fg-muted)]">{pro.totalReviews} reviews</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[var(--hm-fg-secondary)] mb-4">No available professionals found</p>
                    <Link href="/post-job" className="text-[var(--hm-fg-primary)] font-medium hover:underline">
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
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : `Send to ${selectedPros.length} pro${selectedPros.length !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

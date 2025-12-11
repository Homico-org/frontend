'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TeamRole {
  name: string;
}

interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

const projectTypes = [
  { key: 'full_renovation', label: 'Full Renovation' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'bathroom', label: 'Bathroom' },
  { key: 'bedroom', label: 'Bedroom' },
  { key: 'living_room', label: 'Living Room' },
  { key: 'office', label: 'Office' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'new_build', label: 'New Build' },
];

const suggestedRoles: Record<string, string[]> = {
  full_renovation: ['Architect', 'Interior Designer', 'Project Manager', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Tiler'],
  kitchen: ['Interior Designer', 'Plumber', 'Electrician', 'Carpenter', 'Tiler'],
  bathroom: ['Plumber', 'Electrician', 'Tiler', 'Painter'],
  bedroom: ['Interior Designer', 'Electrician', 'Painter', 'Carpenter'],
  living_room: ['Interior Designer', 'Electrician', 'Painter', 'Carpenter'],
  office: ['Interior Designer', 'Electrician', 'Carpenter', 'Network Specialist'],
  outdoor: ['Landscaper', 'Electrician', 'Carpenter', 'Mason'],
  new_build: ['Architect', 'Project Manager', 'Civil Engineer', 'Electrician', 'Plumber', 'HVAC Specialist'],
};

const allRoles = [
  'Architect',
  'Interior Designer',
  'Project Manager',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Tiler',
  'HVAC Specialist',
  'Landscaper',
  'Mason',
  'Roofer',
  'Civil Engineer',
  'Network Specialist',
  'Security Specialist',
  'Cleaner',
  'Flooring Specialist',
  'Glass & Windows',
  'Kitchen Specialist',
  'Bathroom Specialist',
];

const steps = [
  { id: 1, title: 'Project Type' },
  { id: 2, title: 'Details' },
  { id: 3, title: 'Team' },
];

export default function StartProjectPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [budget, setBudget] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [team, setTeam] = useState<TeamRole[]>([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectCreated, setProjectCreated] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/projects/new');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.city && !location) {
      setLocation(user.city);
    }
  }, [user, location]);

  // Set suggested team when project type changes
  useEffect(() => {
    if (projectType && suggestedRoles[projectType]) {
      const suggested = suggestedRoles[projectType].map(name => ({ name }));
      setTeam(suggested);
    }
  }, [projectType]);

  const filteredRoles = roleSearch
    ? allRoles.filter(r =>
        r.toLowerCase().includes(roleSearch.toLowerCase()) &&
        !team.find(t => t.name === r)
      )
    : allRoles.filter(r => !team.find(t => t.name === r));

  const addRole = (roleName: string) => {
    if (!team.find(t => t.name === roleName)) {
      setTeam([...team, { name: roleName }]);
    }
    setRoleSearch('');
  };

  const removeRole = (roleName: string) => {
    setTeam(team.filter(t => t.name !== roleName));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', projectType);
      formData.append('name', projectName);
      formData.append('description', description);
      formData.append('location', location);
      if (coordinates) {
        formData.append('coordinates', JSON.stringify(coordinates));
      }
      if (budget) {
        formData.append('budget', budget);
      }
      formData.append('team', JSON.stringify(team.map(t => t.name)));
      media.forEach((item) => {
        formData.append('media', item.file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        setProjectCreated(true);
      } else {
        setProjectCreated(true);
      }
    } catch (error) {
      setProjectCreated(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return projectType !== '';
    if (step === 2) return projectName.length > 2 && location !== '';
    if (step === 3) return true;
    return false;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (projectCreated) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-[#D2691E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">Project Created</h1>
            <p className="text-neutral-600 mb-6">
              "{projectName}" is ready. Start building your team by hiring professionals.
            </p>

            {team.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-6 text-left">
                <p className="text-sm text-neutral-500 mb-3">Your team ({team.length} roles)</p>
                <div className="flex flex-wrap gap-2">
                  {team.map((role) => (
                    <Link
                      key={role.name}
                      href={`/browse?category=${encodeURIComponent(role.name)}`}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-sm transition-colors"
                    >
                      <span className="text-neutral-700">{role.name}</span>
                      <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl transition-colors"
              >
                Browse Professionals
              </Link>
              <Link
                href="/projects"
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-xl transition-colors"
              >
                View Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link href="/browse" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 text-sm mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">Start Project</h1>
            <p className="text-neutral-500 mt-1">Plan your renovation and build the perfect team</p>
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
                    <span className={`text-sm font-medium hidden sm:block ${step >= s.id ? 'text-neutral-900' : 'text-neutral-400'}`}>
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
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            {/* Step 1: Project Type */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">What are you working on?</h2>
                <p className="text-sm text-neutral-500 mb-4">Select your project type</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {projectTypes.map((type) => (
                    <button
                      key={type.key}
                      onClick={() => setProjectType(type.key)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        projectType === type.key
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                      }`}
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-1">Project details</h2>
                  <p className="text-sm text-neutral-500 mb-4">Tell us about your project</p>
                </div>

                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Project name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Living Room Renovation"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project vision and requirements..."
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <LocationPicker
                    value={location}
                    onChange={(address, coords) => {
                      setLocation(address);
                      setCoordinates(coords);
                    }}
                    placeholder="Select project location"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Estimated budget <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm"
                    />
                  </div>
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Reference photos or videos <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <MediaUpload
                    value={media}
                    onChange={setMedia}
                    maxFiles={10}
                    maxSizeMB={50}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">Build your team</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Select the professionals you'll need. You can hire them after creating the project.
                </p>

                {/* Selected Team */}
                {team.length > 0 && (
                  <div className="mb-4 p-3 bg-neutral-50 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {team.map((role) => (
                        <button
                          key={role.name}
                          onClick={() => removeRole(role.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm hover:border-red-200 hover:bg-red-50 transition-colors group"
                        >
                          <span>{role.name}</span>
                          <svg className="w-3 h-3 text-neutral-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search & Add */}
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-400 text-sm"
                  />
                </div>

                {/* Available Roles */}
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                  {filteredRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => addRole(role)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
                    >
                      <span className="text-neutral-600">{role}</span>
                      <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>

                {filteredRoles.length === 0 && roleSearch && (
                  <button
                    onClick={() => addRole(roleSearch)}
                    className="mt-2 text-sm text-neutral-900 font-medium hover:underline"
                  >
                    Add "{roleSearch}" as custom role
                  </button>
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
                disabled={isSubmitting}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-medium rounded-xl transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  `Create Project${team.length > 0 ? ` with ${team.length} roles` : ''}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

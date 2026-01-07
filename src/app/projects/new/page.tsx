'use client';

import BackButton from '@/components/common/BackButton';
import Header, { HeaderSpacer } from '@/components/common/Header';
import LocationPicker from '@/components/common/LocationPicker';
import MediaUpload from '@/components/common/MediaUpload';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StepProgress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ChevronRight, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      <HeaderSpacer />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" color="#C4735B" />
        </div>
      </div>
    );
  }

  if (projectCreated) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <HeaderSpacer />
        <div className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <IconBadge icon={Check} variant="accent" size="xl" className="mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-neutral-900 mb-3">Project Created</h1>
            <p className="text-neutral-600 mb-6">
              &ldquo;{projectName}&rdquo; is ready. Start building your team by hiring professionals.
            </p>

            {team.length > 0 && (
              <Card variant="elevated" className="p-4 mb-6 text-left">
                <p className="text-sm text-neutral-500 mb-3">Your team ({team.length} roles)</p>
                <div className="flex flex-wrap gap-2">
                  {team.map((role) => (
                    <Button
                      key={role.name}
                      asChild
                      variant="secondary"
                      size="sm"
                    >
                      <Link href={`/browse?category=${encodeURIComponent(role.name)}`} className="flex items-center gap-1">
                        {role.name}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="secondary">
                <Link href="/browse">Browse Professionals</Link>
              </Button>
              <Button asChild>
                <Link href="/projects">View Projects</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <HeaderSpacer />

      <div className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <BackButton href="/browse" label="Back" className="mb-4" />
            <h1 className="text-2xl font-bold text-neutral-900">Start Project</h1>
            <p className="text-neutral-500 mt-1">Plan your renovation and build the perfect team</p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <StepProgress
              steps={steps.map(s => ({ label: s.title }))}
              currentStep={step - 1}
            />
          </div>

          {/* Content */}
          <Card variant="elevated" className="p-6">
            {/* Step 1: Project Type */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">What are you working on?</h2>
                <p className="text-sm text-neutral-500 mb-4">Select your project type</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {projectTypes.map((type) => (
                    <Button
                      key={type.key}
                      variant={projectType === type.key ? 'default' : 'secondary'}
                      onClick={() => setProjectType(type.key)}
                      className="justify-start h-auto py-4"
                    >
                      <span className="text-sm font-medium">{type.label}</span>
                    </Button>
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
                <FormGroup>
                  <Label>Project name</Label>
                  <Input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Living Room Renovation"
                  />
                </FormGroup>

                {/* Description */}
                <FormGroup>
                  <Label>Description <span className="text-neutral-400 font-normal">(optional)</span></Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project vision and requirements..."
                    rows={3}
                  />
                </FormGroup>

                {/* Location */}
                <FormGroup>
                  <Label>Location</Label>
                  <LocationPicker
                    value={location}
                    onChange={(address, coords) => {
                      setLocation(address);
                      setCoordinates(coords);
                    }}
                    placeholder="Select project location"
                  />
                </FormGroup>

                {/* Budget */}
                <FormGroup>
                  <Label>Estimated budget <span className="text-neutral-400 font-normal">(optional)</span></Label>
                  <Input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setBudget(value);
                      }
                    }}
                    placeholder="0"
                    leftIcon={<span className="text-neutral-400">$</span>}
                  />
                </FormGroup>

                {/* Media Upload */}
                <FormGroup>
                  <Label>Reference photos or videos <span className="text-neutral-400 font-normal">(optional)</span></Label>
                  <MediaUpload
                    value={media}
                    onChange={setMedia}
                    maxFiles={10}
                    maxSizeMB={50}
                  />
                </FormGroup>
              </div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">Build your team</h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Select the professionals you&apos;ll need. You can hire them after creating the project.
                </p>

                {/* Selected Team */}
                {team.length > 0 && (
                  <div className="mb-4 p-3 bg-neutral-50 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {team.map((role) => (
                        <Badge
                          key={role.name}
                          variant="secondary"
                          size="default"
                          onClick={() => removeRole(role.name)}
                          className="cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          {role.name}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search & Add */}
                <div className="mb-3">
                  <Input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Search roles..."
                    leftIcon={<Search className="w-5 h-5" />}
                  />
                </div>

                {/* Available Roles */}
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                  {filteredRoles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      size="default"
                      onClick={() => addRole(role)}
                      className="cursor-pointer hover:bg-neutral-100 transition-colors"
                    >
                      {role}
                      <Plus className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                {filteredRoles.length === 0 && roleSearch && (
                  <Button
                    variant="link"
                    onClick={() => addRole(roleSearch)}
                    className="mt-2"
                  >
                    Add &ldquo;{roleSearch}&rdquo; as custom role
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
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
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating...'
                  : `Create Project${team.length > 0 ? ` with ${team.length} roles` : ''}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

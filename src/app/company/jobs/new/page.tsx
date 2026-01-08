'use client';

import BackButton from '@/components/common/BackButton';
import Select from '@/components/common/Select';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { FormGroup, Input, Label, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { COMPANY_ACCENT as ACCENT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { api } from '@/lib/api';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Employee {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  status: string;
}

export default function CreateCompanyJobPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: [] as string[],
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    location: '',
    address: '',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: '',
    deadline: '',
    priority: 'medium',
    quotedPrice: '',
    currency: 'GEL',
    internalNotes: '',
    tags: [] as string[],
    assignedEmployees: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories = [
    'Plumbing',
    'Electrical',
    'Painting',
    'Carpentry',
    'Landscaping',
    'Cleaning',
    'Moving',
    'HVAC',
    'Roofing',
    'General Repair',
    'Renovation',
    'Flooring',
    'Window Installation',
    'Door Installation',
    'Appliance Repair',
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal('/company/jobs/new');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'company') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'company') {
      fetchEmployees();
    }
  }, [isAuthenticated, user]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/companies/my/company/employees?status=active');
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // For now, we'll use a placeholder client ID since the DTO requires it
      // In production, this would come from selecting an existing client or creating a new one
      const jobData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        skills: formData.skills,
        clientId: user?.id, // Temporary: using company user as client
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        location: formData.location,
        address: formData.address,
        scheduledDate: formData.scheduledDate || undefined,
        scheduledTime: formData.scheduledTime || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        deadline: formData.deadline || undefined,
        priority: formData.priority,
        quotedPrice: formData.quotedPrice ? parseFloat(formData.quotedPrice) : undefined,
        currency: formData.currency,
        internalNotes: formData.internalNotes || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const response = await api.post('/companies/my/company/jobs', jobData);
      const data = response.data;

      // If employees selected, assign them
      if (formData.assignedEmployees.length > 0) {
        await api.post(`/companies/my/company/jobs/${data._id}/assign`, {
          employeeIds: formData.assignedEmployees,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/company/jobs');
      }, 1500);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const toggleEmployee = (employeeId: string) => {
    if (formData.assignedEmployees.includes(employeeId)) {
      setFormData({
        ...formData,
        assignedEmployees: formData.assignedEmployees.filter(id => id !== employeeId),
      });
    } else {
      setFormData({
        ...formData,
        assignedEmployees: [...formData.assignedEmployees, employeeId],
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" color={ACCENT} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <Card variant="elevated" className="p-8 text-center">
          <IconBadge icon={Check} variant="success" size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Job Created!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Redirecting to jobs list...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <BackButton href="/company/jobs" label="Back to Jobs" className="mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Create New Job</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Create a job and assign it to your team members</p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError('')} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Details */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Job Details</h2>

            <div className="space-y-4">
              {/* Title */}
              <FormGroup>
                <Label required>Job Title</Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Kitchen Renovation - Vake District"
                  required
                />
              </FormGroup>

              {/* Category */}
              <FormGroup>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  options={categories.map((cat) => ({ value: cat, label: cat }))}
                  placeholder="Select a category"
                  searchable
                />
              </FormGroup>

              {/* Description */}
              <FormGroup>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job details, requirements, and scope..."
                  rows={4}
                />
              </FormGroup>

              {/* Skills */}
              <FormGroup>
                <Label>Required Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={addSkill} variant="secondary">
                    Add
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="info"
                        size="sm"
                        removable
                        onRemove={() => removeSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </FormGroup>

              {/* Priority */}
              <FormGroup>
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      variant={formData.priority === p.value ? 'default' : 'secondary'}
                      size="sm"
                      className={formData.priority === p.value ? p.color : ''}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </FormGroup>
            </div>
          </Card>

          {/* Client Information */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Client Information</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup>
                <Label>Client Name</Label>
                <Input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Full name"
                />
              </FormGroup>

              <FormGroup>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="+995 555 123 456"
                />
              </FormGroup>

              <FormGroup className="md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@email.com"
                />
              </FormGroup>
            </div>
          </Card>

          {/* Location */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Location</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup>
                <Label>City/District</Label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Tbilisi, Vake"
                />
              </FormGroup>

              <FormGroup>
                <Label>Full Address</Label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="15 Chavchavadze Ave, Apt 12"
                />
              </FormGroup>
            </div>
          </Card>

          {/* Scheduling */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Scheduling</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup>
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <Label>Scheduled Time</Label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <Label>Estimated Duration</Label>
                <Input
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="e.g., 3 days, 4 hours"
                />
              </FormGroup>

              <FormGroup>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </FormGroup>
            </div>
          </Card>

          {/* Pricing */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Pricing</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <FormGroup>
                <Label>Quoted Price</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={formData.quotedPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setFormData({ ...formData, quotedPrice: value });
                      }
                    }}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Select
                    value={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    options={[
                      { value: 'GEL', label: 'GEL' },
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                    ]}
                    className="w-24"
                  />
                </div>
              </FormGroup>
            </div>
          </Card>

          {/* Assign Employees */}
          {employees.length > 0 && (
            <Card variant="elevated">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Assign Team Members</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Select employees to assign to this job</p>

              <div className="grid md:grid-cols-2 gap-3">
                {employees.map((employee) => (
                  <Button
                    key={employee._id}
                    type="button"
                    onClick={() => toggleEmployee(employee._id)}
                    variant={formData.assignedEmployees.includes(employee._id) ? 'default' : 'outline'}
                    className="h-auto p-3 justify-start"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
                      formData.assignedEmployees.includes(employee._id) ? 'bg-white/20' : 'bg-neutral-400'
                    }`}>
                      {employee.userId?.avatar ? (
                        <img src={employee.userId.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        employee.userId?.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 text-left ml-3">
                      <p className="font-medium">{employee.userId?.name || 'Unknown'}</p>
                      <p className="text-xs opacity-70 capitalize">{employee.role}</p>
                    </div>
                    {formData.assignedEmployees.includes(employee._id) && (
                      <Check className="w-5 h-5 ml-2" />
                    )}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* Internal Notes & Tags */}
          <Card variant="elevated">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Internal Notes</h2>

            <div className="space-y-4">
              <FormGroup>
                <Label>Notes (only visible to your team)</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="Add any internal notes about this job..."
                  rows={3}
                />
              </FormGroup>

              {/* Tags */}
              <FormGroup>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={addTag} variant="secondary">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        size="sm"
                        removable
                        onRemove={() => removeTag(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </FormGroup>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => router.push('/company/jobs')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

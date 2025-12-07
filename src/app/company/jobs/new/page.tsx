'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import Select from '@/components/common/Select';

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
    } catch (err: any) {
      setError(err.message || 'Failed to create job');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <div className="bg-white dark:bg-dark-card rounded-xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Job Created!</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Redirecting to jobs list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/company/jobs"
            className="inline-flex items-center text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Create New Job</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Create a job and assign it to your team members</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Details */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Job Details</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Kitchen Renovation - Vake District"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  options={categories.map((cat) => ({ value: cat, label: cat }))}
                  placeholder="Select a category"
                  searchable
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job details, requirements, and scope..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill..."
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-neutral-100 dark:bg-dark-elevated text-neutral-700 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-card transition-all duration-200 ease-out"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-blue-900"
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

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.priority === p.value
                          ? `${p.color} ring-2 ring-offset-2 ring-current`
                          : 'bg-neutral-100 dark:bg-dark-elevated text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-card'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Client Information</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="+995 555 123 456"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@email.com"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Location</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  City/District
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Tbilisi, Vake"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Full Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="15 Chavchavadze Ave, Apt 12"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Scheduling</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  placeholder="e.g., 3 days, 4 hours"
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Pricing</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Quoted Price
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quotedPrice}
                    onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                    placeholder="0.00"
                    className="flex-1 px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-300 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>
            </div>
          </div>

          {/* Assign Employees */}
          {employees.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Assign Team Members</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Select employees to assign to this job</p>

              <div className="grid md:grid-cols-2 gap-3">
                {employees.map((employee) => (
                  <button
                    key={employee._id}
                    type="button"
                    onClick={() => toggleEmployee(employee._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                      formData.assignedEmployees.includes(employee._id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-500'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      formData.assignedEmployees.includes(employee._id) ? 'bg-blue-500' : 'bg-neutral-400'
                    }`}>
                      {employee.userId?.avatar ? (
                        <img src={employee.userId.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        employee.userId?.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{employee.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">{employee.role}</p>
                    </div>
                    {formData.assignedEmployees.includes(employee._id) && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes & Tags */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Internal Notes</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Notes (only visible to your team)
                </label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="Add any internal notes about this job..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-300 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1.5">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 border border-neutral-300 dark:border-dark-border dark:bg-dark-300 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-neutral-100 dark:bg-dark-elevated text-neutral-700 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-card transition-all duration-200 ease-out"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 dark:bg-dark-elevated text-neutral-700 dark:text-neutral-400 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-neutral-900 dark:hover:text-white"
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/browse')}
              className="flex-1 px-6 py-3 border border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-400 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-all duration-200 ease-out font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 ease-out font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

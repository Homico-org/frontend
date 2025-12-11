'use client';

import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InviteEmployeePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker',
    jobTitle: '',
    department: '',
    skills: [] as string[],
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/employees/invite');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const res = await fetch(`${API_URL}/companies/my/company/employees/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to invite employee');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/company/employees');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
        <Header />
        <main className="container-custom py-8">
          <div className="max-w-md mx-auto bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 text-center">
            <div className="w-16 h-16 bg-[#D2691E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#D2691E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Invitation Sent!</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              An invitation email has been sent to {formData.email}. They can use the invitation link to join your company.
            </p>
            <Link
              href="/company/employees"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 ease-out"
            >
              Back to Employees
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <Header />

      <main className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/company/employees"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Employees
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Invite Team Member</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Send an invitation to add a new employee to your company
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-4">Basic Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+995 555 123 456"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Position */}
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-4">Role & Position</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="worker">Worker</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Senior Electrician"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-400 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Electrical"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-50 mb-4">Skills</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a skill..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2.5 bg-neutral-100 dark:bg-dark-elevated hover:bg-neutral-200 dark:hover:bg-dark-card rounded-xl font-medium transition-all duration-200 ease-out"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
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

              {/* Role Permissions Info */}
              <div className="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-xl">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-50 mb-2">Role Permissions</h4>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
                  {formData.role === 'manager' ? (
                    <>
                      <p>Managers can:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>View and accept jobs</li>
                        <li>Manage other workers</li>
                        <li>View financial information</li>
                        <li>Message clients</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>Workers can:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>View assigned jobs</li>
                        <li>Update job progress</li>
                        <li>Message clients</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-8 flex items-center justify-end gap-3">
              <Link
                href="/company/employees"
                className="px-6 py-2.5 border border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-elevated rounded-xl font-medium transition-all duration-200 ease-out"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

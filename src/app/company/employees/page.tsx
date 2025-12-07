'use client';

import Header from '@/components/common/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'manager' | 'worker';
  jobTitle?: string;
  department?: string;
  status: 'pending' | 'active' | 'inactive' | 'terminated';
  skills?: string[];
  completedJobs?: number;
  avgRating?: number;
  hireDate?: string;
  isAvailable?: boolean;
}

export default function CompanyEmployeesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', role: '', search: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLoginModal('/company/employees');
    }
    if (!authLoading && user?.role !== 'company') {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router, openLoginModal]);

  useEffect(() => {
    if (!authLoading && user?.role === 'company') {
      fetchEmployees();
    }
  }, [authLoading, user]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('access_token');

      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.role) params.append('role', filter.role);
      if (filter.search) params.append('search', filter.search);

      const res = await fetch(`${API_URL}/companies/my/company/employees?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'inactive': return 'bg-neutral-100 text-neutral-700';
      case 'terminated': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'worker': return 'bg-neutral-100 text-neutral-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <Header />

      <main className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Team Members</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your company employees</p>
          </div>
          <Link
            href="/company/employees/invite"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 ease-out flex items-center gap-2 self-start"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Employee
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by name, email..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="flex-1 min-w-[200px] px-4 py-2 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="px-4 py-2 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl text-sm"
            >
              <option value="">All Roles</option>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="worker">Worker</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-neutral-200 dark:border-dark-border dark:bg-dark-elevated dark:text-white rounded-xl text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
            <button
              onClick={fetchEmployees}
              className="px-4 py-2 bg-neutral-100 dark:bg-dark-elevated hover:bg-neutral-200 dark:hover:bg-dark-card rounded-xl text-sm font-medium transition-all duration-200 ease-out"
            >
              Search
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{employees.length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Total Employees</div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
            <div className="text-2xl font-bold text-green-600">{employees.filter(e => e.status === 'active').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Active</div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
            <div className="text-2xl font-bold text-amber-600">{employees.filter(e => e.status === 'pending').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Pending Invites</div>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
            <div className="text-2xl font-bold text-blue-600">{employees.filter(e => e.role === 'manager').length}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Managers</div>
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-dark-elevated border-b border-neutral-200 dark:border-dark-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Employee</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Performance</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:border-dark-border">
                {employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-all duration-200 ease-out">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {employee.name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-50">{employee.name}</div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(employee.role)}`}>
                          {employee.role}
                        </span>
                        {employee.jobTitle && (
                          <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{employee.jobTitle}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-neutral-900 dark:text-neutral-50">{employee.completedJobs || 0} jobs</div>
                        {employee.avgRating && (
                          <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {employee.avgRating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/company/employees/${employee._id}`}
                          className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-all duration-200 ease-out"
                          title="View Details"
                        >
                          <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {employee.role !== 'owner' && (
                          <button
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-all duration-200 ease-out"
                            title="More Options"
                          >
                            <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {employees.length === 0 && (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mb-4">No employees found</p>
              <Link
                href="/company/employees/invite"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all duration-200 ease-out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invite First Employee
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

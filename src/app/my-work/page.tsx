'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/common/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import Header, { HeaderSpacer } from '@/components/common/Header';
import AppBackground from '@/components/common/AppBackground';
import Card, { CardImage, CardContent, CardBadge, CardFooter } from '@/components/common/Card';
import Link from 'next/link';
import {
  Briefcase,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  Building2,
  DollarSign,
  Phone,
  Mail,
  CheckCheck,
  AlertTriangle,
  Hammer,
  Trophy,
} from 'lucide-react';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
  pricePerUnit?: number;
  deadline?: string;
  status: string;
  images: string[];
  media: { type: string; url: string }[];
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    city?: string;
    phone?: string;
    accountType?: string;
    companyName?: string;
  };
}

interface ActiveJob {
  _id: string;
  jobId: Job;
  proposedPrice: number;
  estimatedDuration: number;
  estimatedDurationUnit: string;
  status: 'accepted' | 'completed';
  conversationId?: string;
  acceptedAt?: string;
  createdAt: string;
}

type TabFilter = 'active' | 'completed';

function MyWorkPageContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale: language } = useLanguage();
  const toast = useToast();
  const router = useRouter();

  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<TabFilter>('active');
  const [completingJobId, setCompletingJobId] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'pro')) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchActiveJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/jobs/my-active-jobs/pro');
      setActiveJobs(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch active jobs:', err);
      setError(err.response?.data?.message || 'Failed to load active jobs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'pro' && !hasFetched.current) {
      hasFetched.current = true;
      fetchActiveJobs();
    }
  }, [isAuthenticated, user, fetchActiveJobs]);

  const handleCompleteJob = async (jobId: string) => {
    setCompletingJobId(jobId);
    try {
      await api.post(`/jobs/${jobId}/complete`);
      setActiveJobs(prev => prev.map(j => 
        j.jobId?._id === jobId ? { ...j, status: 'completed' } : j
      ));
      toast.success(
        language === 'ka' ? 'სამუშაო დასრულდა' : 'Job completed',
        language === 'ka' ? 'სამუშაო წარმატებით დასრულდა' : 'The job has been marked as completed'
      );
    } catch (err: any) {
      toast.error(
        language === 'ka' ? 'შეცდომა' : 'Error',
        err.response?.data?.message || 'Failed to complete job'
      );
    } finally {
      setCompletingJobId(null);
    }
  };

  // Filter jobs
  const filteredJobs = activeJobs.filter(job => {
    if (tabFilter === 'active') return job.status === 'accepted';
    return job.status === 'completed';
  });

  // Stats
  const stats = {
    active: activeJobs.filter(j => j.status === 'accepted').length,
    completed: activeJobs.filter(j => j.status === 'completed').length,
  };

  const formatBudget = (job: Job) => {
    if (job.budgetType === 'fixed' && job.budgetAmount) {
      return `₾${job.budgetAmount.toLocaleString()}`;
    }
    if (job.budgetType === 'range' && job.budgetMin && job.budgetMax) {
      return `₾${job.budgetMin.toLocaleString()} - ₾${job.budgetMax.toLocaleString()}`;
    }
    return language === 'ka' ? 'შეთანხმებით' : 'Negotiable';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Loading State
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen relative">
        <AppBackground />
        <Header />
      <HeaderSpacer />
        <div className="relative z-20 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Hammer className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'ka' ? 'იტვირთება...' : 'Loading your work...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen relative">
        <AppBackground />
        <Header />
      <HeaderSpacer />
        <div className="relative z-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {language === 'ka' ? 'შეცდომა' : 'Error'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Button onClick={fetchActiveJobs}>
              {language === 'ka' ? 'ხელახლა ცდა' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AppBackground />
      <Header />
      <HeaderSpacer />

      <main className="relative z-20 max-w-5xl mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="!p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {language === 'ka' ? 'ჩემი სამუშაოები' : 'My Work'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {language === 'ka' 
                ? 'აქტიური და დასრულებული პროექტები'
                : 'Active and completed projects'}
            </p>
          </div>
          <Button href="/my-proposals" variant="outline" size="sm">
            {language === 'ka' ? 'შეთავაზებები' : 'Proposals'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 p-4 rounded-2xl border" style={{ 
          backgroundColor: 'var(--color-bg-elevated)', 
          borderColor: 'var(--color-border)' 
        }}>
          <div className="flex gap-2">
            <button
              onClick={() => setTabFilter('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tabFilter === 'active'
                  ? 'bg-[#E07B4F] text-white'
                  : 'bg-[#E07B4F]/5 text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10'
              }`}
            >
              <Hammer className="w-4 h-4" />
              {language === 'ka' ? 'მიმდინარე' : 'Active'}
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                tabFilter === 'active' ? 'bg-white/20' : 'bg-[#E07B4F]/10 text-[#E07B4F]'
              }`}>
                {stats.active}
              </span>
            </button>
            <button
              onClick={() => setTabFilter('completed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tabFilter === 'completed'
                  ? 'bg-[#E07B4F] text-white'
                  : 'bg-[#E07B4F]/5 text-[var(--color-text-secondary)] hover:bg-[#E07B4F]/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              {language === 'ka' ? 'დასრულებული' : 'Completed'}
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                tabFilter === 'completed' ? 'bg-white/20' : 'bg-[#E07B4F]/10 text-[#E07B4F]'
              }`}>
                {stats.completed}
              </span>
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-accent)]/10 mx-auto mb-5 flex items-center justify-center">
              {tabFilter === 'active' ? (
                <Hammer className="w-10 h-10 text-[var(--color-accent)]" />
              ) : (
                <Trophy className="w-10 h-10 text-[var(--color-accent)]" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {tabFilter === 'active'
                ? (language === 'ka' ? 'მიმდინარე სამუშაოები არ გაქვს' : 'No active jobs')
                : (language === 'ka' ? 'დასრულებული სამუშაოები არ გაქვს' : 'No completed jobs')}
            </h3>
            <p className="max-w-sm mx-auto text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {tabFilter === 'active'
                ? (language === 'ka'
                    ? 'როცა კლიენტი მიიღებს შენს შეთავაზებას, სამუშაო აქ გამოჩნდება'
                    : 'When a client accepts your proposal, the job will appear here')
                : (language === 'ka'
                    ? 'დასრულებული პროექტები აქ გამოჩნდება'
                    : 'Your completed projects will appear here')}
            </p>
            {tabFilter === 'active' && (
              <Button href="/browse/jobs">
                {language === 'ka' ? 'სამუშაოების ნახვა' : 'Browse Jobs'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((activeJob) => {
              const job = activeJob.jobId;
              if (!job) return null;
              
              const allMedia = [
                ...(job.media || []).map(m => ({ url: m.url, type: m.type })),
                ...(job.images || []).filter(img => !job.media?.some(m => m.url === img)).map(url => ({ url, type: 'image' }))
              ];
              const hasMedia = allMedia.length > 0;
              const isOrg = job.clientId?.accountType === 'organization';
              const isCompleting = completingJobId === job._id;

              return (
                <Card
                  key={activeJob._id}
                  variant="elevated"
                  hover="lift"
                  className={`group ${
                    activeJob.status === 'accepted'
                      ? 'ring-2 ring-emerald-500/30 ring-offset-1 ring-offset-[#FFFDF9] dark:ring-offset-[#1c1917]'
                      : ''
                  }`}
                >
                  <div className={`flex flex-col ${hasMedia ? 'lg:flex-row' : ''}`}>
                    {/* Media Section */}
                    {hasMedia && (
                      <div className="relative w-full lg:w-64 flex-shrink-0 overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
                        <CardImage aspectRatio="16/10" overlay="gradient" className="h-40 lg:h-full lg:min-h-[200px]">
                          <img
                            src={storage.getFileUrl(allMedia[0].url)}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <CardBadge 
                            position="top-left" 
                            variant="solid" 
                            color={activeJob.status === 'accepted' ? 'success' : 'primary'}
                          >
                            {activeJob.status === 'accepted' 
                              ? (language === 'ka' ? 'მიმდინარე' : 'Active')
                              : (language === 'ka' ? 'დასრულებული' : 'Completed')}
                          </CardBadge>
                        </CardImage>
                      </div>
                    )}

                    {/* Content Section */}
                    <CardContent spacing="normal" className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Status Badge - if no media */}
                          {!hasMedia && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                activeJob.status === 'accepted' 
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-[#E07B4F]/15 text-[#E07B4F]'
                              }`}>
                                {activeJob.status === 'accepted' ? (
                                  <Clock className="w-3 h-3" />
                                ) : (
                                  <CheckCheck className="w-3 h-3" />
                                )}
                                {activeJob.status === 'accepted' 
                                  ? (language === 'ka' ? 'მიმდინარე' : 'Active')
                                  : (language === 'ka' ? 'დასრულებული' : 'Completed')}
                              </span>
                            </div>
                          )}

                          {/* Job Title */}
                          <Link href={`/jobs/${job._id}`} className="block group/title">
                            <h3 className="text-lg font-semibold leading-snug line-clamp-2 transition-colors text-[var(--color-text-primary)] group-hover/title:text-[#E07B4F]">
                              {job.title}
                            </h3>
                          </Link>

                          {/* Client Info */}
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar
                              src={job.clientId?.avatar}
                              name={job.clientId?.name || 'Client'}
                              size="xs"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {job.clientId?.name}
                            </span>
                            {isOrg && job.clientId?.companyName && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#E07B4F]/10 text-[#E07B4F]">
                                <Building2 className="w-3 h-3" />
                                {job.clientId.companyName}
                              </span>
                            )}
                          </div>

                          {/* Job Meta */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-sm text-[var(--color-text-secondary)]">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#E07B4F]/60" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-[#E07B4F]">
                              <DollarSign className="w-3.5 h-3.5" />
                              ₾{activeJob.proposedPrice?.toLocaleString()}
                            </span>
                            {activeJob.acceptedAt && (
                              <span className="flex items-center gap-1.5 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                {language === 'ka' ? 'დაიწყო:' : 'Started:'} {formatDate(activeJob.acceptedAt)}
                              </span>
                            )}
                          </div>

                          {/* Client Contact */}
                          {job.clientId && (
                            <div className="mt-3 p-3 rounded-lg bg-[#E07B4F]/5 border border-[#E8D5C4]/40 dark:border-[#3d2f24]/40">
                              <p className="text-xs font-semibold text-[#E07B4F] mb-2">
                                {language === 'ka' ? 'კლიენტის კონტაქტი' : 'Client Contact'}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                {job.clientId.phone && (
                                  <a href={`tel:${job.clientId.phone}`} className="flex items-center gap-1.5 text-[#E07B4F] hover:underline">
                                    <Phone className="w-3.5 h-3.5" />
                                    {job.clientId.phone}
                                  </a>
                                )}
                                {job.clientId.email && (
                                  <a href={`mailto:${job.clientId.email}`} className="flex items-center gap-1.5 text-[#E07B4F] hover:underline">
                                    <Mail className="w-3.5 h-3.5" />
                                    {job.clientId.email}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Actions Footer */}
                  <CardFooter className="flex flex-wrap items-center gap-3">
                    {/* Message Button */}
                    <Button
                      href={activeJob.conversationId ? `/messages?conversation=${activeJob.conversationId}` : `/messages`}
                      size="sm"
                      variant="outline"
                      icon={<MessageCircle className="w-4 h-4" />}
                    >
                      {language === 'ka' ? 'მესიჯი' : 'Message'}
                    </Button>

                    {/* Mark Complete - for active jobs */}
                    {activeJob.status === 'accepted' && (
                      <Button
                        onClick={() => handleCompleteJob(job._id)}
                        disabled={isCompleting}
                        size="sm"
                        icon={isCompleting ? undefined : <CheckCircle className="w-4 h-4" />}
                        className="!bg-emerald-500 hover:!bg-emerald-600"
                      >
                        {isCompleting
                          ? (language === 'ka' ? 'მიმდინარეობს...' : 'Completing...')
                          : (language === 'ka' ? 'დასრულება' : 'Mark Complete')}
                      </Button>
                    )}

                    <Link
                      href={`/jobs/${job._id}`}
                      className="ml-auto flex items-center gap-1.5 text-sm font-medium text-[#E07B4F] hover:underline"
                    >
                      {language === 'ka' ? 'დეტალები' : 'View Details'}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MyWorkPage() {
  return (
    <AuthGuard allowedRoles={['pro', 'admin']}>
      <MyWorkPageContent />
    </AuthGuard>
  );
}


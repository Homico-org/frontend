'use client';

import ArchitecturalBackground from '@/components/browse/ArchitecturalBackground';
import Avatar from '@/components/common/Avatar';
import BackButton from '@/components/common/BackButton';
import Header, { HeaderSpacer } from '@/components/common/Header';
import JobCard from '@/components/common/JobCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import type { Job, PublicUserProfile } from '@/types/shared';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const toast = useToast();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/${params.id}`);
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        const error = err as { message?: string };
        setError(error.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    if (params.id) fetchProfile();
  }, [params.id]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!params.id) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/user/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };
    if (params.id) fetchJobs();
  }, [params.id]);

  useEffect(() => {
    if (profile?.name) {
      document.title = `${profile.name} | Homico`;
    }
    return () => {
      document.title = 'Homico';
    };
  }, [profile?.name]);

  const handleContact = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    // Navigate to messages with this user as recipient
    router.push(`/messages?recipient=${profile?.id}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) {
      openLoginModal();
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          recipientId: profile?.id,
          message: message
        })
      });

      if (response.ok) {
        setShowContactModal(false);
        setMessage('');
        toast.success(t('common.messageSent'));
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('common.linkCopied'));
    }
  };

  const getMemberSince = () => {
    if (profile?.createdAt) {
      const date = new Date(profile.createdAt);
      return date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const getRoleLabel = () => {
    if (profile?.role === 'client') {
      return t('users.client');
    }
    if (profile?.role === 'pro') {
      return t('users.professional');
    }
    return profile?.role || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <ArchitecturalBackground />
        <Header />
      <HeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="xl" variant="border" color={ACCENT_COLOR} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <ArchitecturalBackground />
        <Header />
      <HeaderSpacer />
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              {t('users.userNotFound')}
            </h2>
            <p className="text-[var(--color-text-tertiary)] mb-6">
              {locale === 'ka' ? 'სამწუხაროდ, ეს გვერდი არ არსებობს' : 'Sorry, this page doesn\'t exist'}
            </p>
            <button onClick={() => router.push('/portfolio')} className="px-6 py-3 text-sm font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity">
              {t('common.goBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <ArchitecturalBackground />
      <style jsx global>{`
        .user-page {
          --font-display: 'Inter', sans-serif;
          --font-body: 'Inter', sans-serif;
        }

        .user-page .font-display {
          font-family: var(--font-display);
          font-weight: 600;
        }

        .user-page * {
          font-family: var(--font-body);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 5s ease-in-out infinite; }

        /* Name underline effect */
        .name-underline {
          position: relative;
          display: inline-block;
        }

        .name-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-accent), transparent);
          border-radius: 1px;
        }

        /* Stat item */
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        /* Hide scrollbar */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <Header />
      <HeaderSpacer />

      {/* Main Content */}
      <main className="user-page">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          <BackButton />
        </div>
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

          {/* Profile Section */}
          <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>

              {/* Avatar & Basic Info */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4 animate-float">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-[var(--color-border)] ring-offset-4 ring-offset-[var(--color-bg-primary)]"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-[var(--color-border)] ring-offset-4 ring-offset-[var(--color-bg-primary)]"
                      style={{ background: 'linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary))' }}
                    >
                      <span className="font-display text-3xl font-bold text-[var(--color-text-secondary)]">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Role badge */}
                  <div className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    {getRoleLabel()}
                  </div>
                </div>

                {/* Name */}
                <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-1 name-underline">
                  {profile.name}
                </h1>

                {/* Location */}
                {profile.city && (
                  <p className="text-sm text-[var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
                    <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {profile.city}
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-8 mb-8 py-4 border-y border-[var(--color-border-subtle)]">
                <div className="stat-item">
                  <span className="font-display text-xl font-bold text-[var(--color-text-primary)]">{jobs.length}</span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {t('common.jobs')}
                  </span>
                </div>
                <div className="w-px h-8 bg-[var(--color-border-subtle)]" />
                <div className="stat-item">
                  <span className="font-display text-xl font-bold text-[var(--color-text-primary)]">
                    {getMemberSince()}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {t('common.member')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleContact}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  {t('common.message')}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  {t('common.share')}
                </button>
              </div>
            </div>
          </div>

          {/* Jobs Section */}
          {jobs.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 pb-12">
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                  {t('users.activeJobs')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state for jobs */}
          {jobs.length === 0 && (
            <div className="max-w-2xl mx-auto px-4 pb-12">
              <div className="text-center py-12 border border-dashed border-[var(--color-border)] rounded-2xl">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {t('users.noActiveJobPostingsYet')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-[var(--color-bg-primary)] sm:rounded-2xl rounded-t-2xl p-6 animate-scale-in">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                size="md"
                rounded="full"
              />
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">{profile.name}</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {t('users.sendAMessage')}
                </p>
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('users.writeYourMessage')}
              className="w-full h-32 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] resize-none text-sm"
            />

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="w-full mt-4 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <LoadingSpinner size="md" color="white" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  {t('common.send')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { Briefcase, Frown, MapPin, MessageCircle, Send, Share2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { t, pick } = useLanguage();
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
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
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
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <ArchitecturalBackground />
        <Header />
      <HeaderSpacer />
        <div className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--hm-bg-page)] flex items-center justify-center">
              <Frown className="w-10 h-10 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-[var(--hm-fg-primary)] mb-2">
              {t('users.userNotFound')}
            </h2>
            <p className="text-[var(--hm-fg-muted)] mb-6">
              {pick({ en: "Sorry, this page doesn't exist", ka: 'სამწუხაროდ, ეს გვერდი არ არსებობს' })}
            </p>
            <button onClick={() => router.push('/portfolio')} className="px-6 py-3 text-sm font-semibold rounded-xl bg-[var(--hm-brand-500)] text-white hover:opacity-90 transition-opacity">
              {t('common.goBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <ArchitecturalBackground />
      <style jsx global>{`
        .user-page {
          --font-display: var(--hm-font-display);
          --font-body: var(--hm-font-body);
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
          background: linear-gradient(90deg, var(--hm-brand-500), transparent);
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
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-[var(--hm-border)] ring-offset-4 ring-offset-[var(--hm-bg-page)]"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-[var(--hm-border)] ring-offset-4 ring-offset-[var(--hm-bg-page)]"
                      style={{ background: 'linear-gradient(135deg, var(--hm-bg-tertiary), var(--hm-bg-page))' }}
                    >
                      <span className="font-display text-3xl font-bold text-[var(--hm-fg-secondary)]">
                        {profile.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Role badge */}
                  <div className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-[var(--hm-bg-page)] border border-[var(--hm-border)] rounded-full text-[10px] font-medium text-[var(--hm-fg-secondary)] uppercase tracking-wider">
                    {getRoleLabel()}
                  </div>
                </div>

                {/* Name */}
                <h1 className="font-display text-2xl font-bold text-[var(--hm-fg-primary)] mb-1 name-underline">
                  {profile.name}
                </h1>

                {/* Location */}
                {profile.city && (
                  <p className="text-sm text-[var(--hm-fg-muted)] flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />
                    {profile.city}
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-center gap-8 mb-8 py-4 border-y border-[var(--hm-border-subtle)]">
                <div className="stat-item">
                  <span className="font-display text-xl font-bold text-[var(--hm-fg-primary)]">{jobs.length}</span>
                  <span className="text-[11px] text-[var(--hm-fg-muted)] uppercase tracking-wider">
                    {t('common.jobs')}
                  </span>
                </div>
                <div className="w-px h-8 bg-[var(--hm-border-subtle)]" />
                <div className="stat-item">
                  <span className="font-display text-xl font-bold text-[var(--hm-fg-primary)]">
                    {getMemberSince()}
                  </span>
                  <span className="text-[11px] text-[var(--hm-fg-muted)] uppercase tracking-wider">
                    {t('common.member')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleContact}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--hm-brand-500)] text-white text-sm font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                  {t('common.message')}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--hm-border)] text-[var(--hm-fg-secondary)] text-sm font-medium hover:border-[var(--hm-border-strong)] hover:text-[var(--hm-fg-primary)] transition-all"
                >
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  {t('common.share')}
                </button>
              </div>
            </div>
          </div>

          {/* Jobs Section */}
          {jobs.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 pb-12">
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="font-display text-lg font-semibold text-[var(--hm-fg-primary)] mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[var(--hm-brand-500)]" strokeWidth={1.5} />
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
              <div className="text-center py-12 border border-dashed border-[var(--hm-border)] rounded-2xl">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--hm-bg-page)] flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[var(--hm-fg-muted)]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[var(--hm-fg-muted)]">
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
          <div className="relative w-full sm:max-w-md bg-[var(--hm-bg-page)] sm:rounded-2xl rounded-t-2xl p-6 animate-scale-in">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--hm-bg-page)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--hm-fg-muted)]" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                size="md"
                rounded="full"
              />
              <div>
                <h3 className="font-semibold text-[var(--hm-fg-primary)]">{profile.name}</h3>
                <p className="text-sm text-[var(--hm-fg-muted)]">
                  {t('users.sendAMessage')}
                </p>
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('users.writeYourMessage')}
              className="w-full h-32 px-4 py-3 rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-page)] text-[var(--hm-fg-primary)] placeholder:text-[var(--hm-fg-muted)] focus:outline-none focus:border-[var(--hm-brand-500)] resize-none text-sm"
            />

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="w-full mt-4 py-3 rounded-xl bg-[var(--hm-brand-500)] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <LoadingSpinner size="md" color="white" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, CheckCircle2, Eye, EyeOff, Lock, MapPin, ShieldX, Star, Users, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { OTPInput } from '@/components/ui/OTPInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import CategoryIcon from '@/components/categories/CategoryIcon';
import axios from 'axios';

interface InviteData {
  token: string;
  name: string;
  phone: string;
  city: string | null;
  cityKey: string | null;
  category: string;
  subcategory: string;
  categoryKa: string;
  subcategoryKa: string;
  type: string;
  rating: number;
  reviewCount: number;
}

type PageState = 'loading' | 'preview' | 'otp' | 'password' | 'activating' | 'success' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const { closeLoginModal } = useAuthModal();
  const { t, locale } = useLanguage();
  const token = params.token as string;

  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    closeLoginModal();
  }, [closeLoginModal]);

  useEffect(() => { setIsVisible(true); }, []);

  useEffect(() => {
    if (!token) return;
    if (token === 'preview') {
      setInvite({
        token: 'preview', name: 'ლევანი ნიკოლაძე', phone: '+995551234567',
        city: 'თბილისი', cityKey: 'tbilisi', category: 'plumber',
        subcategory: 'pipes', categoryKa: 'სანტექნიკოსი', subcategoryKa: 'მილები და გაჟონვა',
        type: 'professional', rating: 4.8, reviewCount: 24,
      });
      setState('preview');
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    axios.get(`${baseUrl}/invite/${token}`)
      .then((res) => { setInvite(res.data); setState('preview'); })
      .catch(() => { setState('error'); });
  }, [token]);

  const maskPhone = (phone: string) => phone.length < 8 ? phone : phone.slice(0, 4) + ' ••• ' + phone.slice(-2);

  const handleSendOtp = async () => {
    if (!invite) return;
    setSendingOtp(true); setError('');
    try {
      await api.post('/verification/send-otp', { identifier: invite.phone, type: 'phone' });
      setState('otp');
    } catch { setError(t('invite.otpFailed')); }
    finally { setSendingOtp(false); }
  };

  const handleOtpComplete = (code: string) => {
    setOtpCode(code);
    setState('password');
    setError('');
  };

  const handleActivate = async () => {
    if (!invite || !otpCode) return;
    if (password.length < 6) { setError(t('invite.passwordTooShort')); return; }
    if (password !== confirmPassword) { setError(t('invite.passwordMismatch')); return; }
    setState('activating'); setError('');
    try {
      const res = await api.post('/invite/activate', {
        token: invite.token, phone: invite.phone, code: otpCode, password,
      });
      setState('success');
      login(res.data.access_token, res.data.user, res.data.refresh_token);
      if (invite) {
        sessionStorage.setItem('proRegistrationData', JSON.stringify({
          categories: [invite.category],
          subcategories: [invite.subcategory],
          city: invite.city || invite.cityKey,
        }));
      }
      setTimeout(() => router.push('/pro/profile-setup'), 1500);
    } catch {
      setError(t('invite.verifyFailed'));
      setState('password');
    }
  };

  const pick = (en: string, ka: string) => locale === 'ka' ? ka : en;
  const cat = locale === 'ka' ? invite?.categoryKa : invite?.category;
  const sub = locale === 'ka' ? invite?.subcategoryKa : invite?.subcategory;

  if (state === 'loading') {
    return <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: 'var(--hm-bg-page)' }}><LoadingSpinner size="lg" color="var(--hm-brand-500)" /></div>;
  }

  if (state === 'error' || !invite) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
        <div className="text-center">
          <ShieldX className="w-12 h-12 text-[var(--hm-n-300)] mx-auto mb-4" />
          <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--hm-fg-primary)' }}>{t('invite.invalidLink')}</h1>
          <p className="text-sm" style={{ color: 'var(--hm-fg-muted)' }}>{t('invite.invalidLinkDesc')}</p>
        </div>
      </div>
    );
  }

  const benefits = [
    { icon: <Users className="w-5 h-5" />, text: pick('Find clients looking for your services', 'იპოვე კლიენტები, რომლებსაც შენი სერვისი სჭირდებათ') },
    { icon: <Briefcase className="w-5 h-5" />, text: pick('Receive matching job proposals', 'მიიღე შენზე მორგებული სამუშაო შეთავაზებები') },
    { icon: <Star className="w-5 h-5" />, text: pick('Build reputation with verified reviews', 'დააგროვე შეფასებები და გაიზარდე რეიტინგი') },
    { icon: <Zap className="w-5 h-5" />, text: pick('Get booked directly by clients', 'მიიღე ჯავშნები პირდაპირ კლიენტებისგან') },
  ];

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: 'var(--hm-bg-page)' }}>
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[#F06B43] flex items-center justify-center">
            <span className="text-white text-sm font-black">H</span>
          </div>
          <span className="font-semibold" style={{ color: 'var(--hm-fg-primary)' }}>Homico</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-12">
        {/* Preview — Main invite screen */}
        {state === 'preview' && (
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Hero card */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{ backgroundColor: 'rgba(239,78,36,0.06)', border: '1px solid rgba(239,78,36,0.15)' }}
            >
              {/* Category icon + info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--hm-brand-500)] to-[#F06B43] flex items-center justify-center text-white shadow-lg">
                  <CategoryIcon type={invite.category} className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: 'var(--hm-fg-primary)' }}>
                    {invite.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-[var(--hm-brand-500)]">{cat}</span>
                    <span style={{ color: 'var(--hm-fg-muted)' }}>·</span>
                    <span className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>{sub}</span>
                  </div>
                </div>
              </div>

              {invite.city && (
                <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--hm-fg-secondary)' }}>
                  <MapPin className="w-4 h-4 text-[var(--hm-brand-500)]" />
                  {invite.city}
                </div>
              )}

              <p className="text-sm leading-relaxed" style={{ color: 'var(--hm-fg-secondary)' }}>
                {pick(
                  `You've been invited to join Homico — Georgia's platform for home service professionals. Set up your profile, showcase your work, and start getting clients.`,
                  `მოგიწვიეთ Homico-ზე — პლატფორმაზე, სადაც სახლის სერვისის სპეციალისტები კლიენტებს პოულობენ. შექმენი პროფილი, დაამატე შენი ნამუშევრები და დაიწყე შეკვეთების მიღება.`
                )}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--hm-fg-muted)' }}>
                {pick('What you get', 'რა შესაძლებლობებს მიიღებ')}
              </p>
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                  style={{
                    transitionDelay: `${200 + i * 100}ms`,
                    backgroundColor: 'var(--hm-bg-elevated)',
                    border: '1px solid var(--hm-border-subtle)',
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(239,78,36,0.1)', color: 'var(--hm-brand-500)' }}>
                    {b.icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--hm-fg-primary)' }}>
                    {b.text}
                  </span>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="flex items-center gap-2 mb-6">
              {[
                pick('1. Verify phone', '1. ნომრის დადასტურება'),
                pick('2. Set password', '2. პაროლის შექმნა'),
                pick('3. Setup profile', '3. პროფილის შევსება'),
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex-1 text-center py-2 px-1 rounded-lg text-[11px] font-medium"
                  style={{ backgroundColor: 'var(--hm-bg-tertiary)', color: 'var(--hm-fg-secondary)' }}
                >
                  {step}
                </div>
              ))}
            </div>

            {error && <p className="text-[var(--hm-error-500)] text-sm mb-3">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={sendingOtp}
              className="w-full h-13 py-3.5 rounded-2xl bg-[var(--hm-brand-500)] text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:bg-[var(--hm-brand-600)] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[var(--hm-brand-500)]/20"
            >
              {sendingOtp ? <LoadingSpinner size="sm" /> : (
                <>
                  {pick('Get Started', 'დაწყება')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: 'var(--hm-fg-muted)' }}>
              {pick('We\'ll send a verification code to', 'დადასტურების კოდი გაიგზავნება ნომერზე')} {maskPhone(invite.phone)}
            </p>
            <p className="text-center text-[11px] mt-1" style={{ color: 'var(--hm-fg-muted)' }}>
              {pick('Free to join. No monthly fees.', 'რეგისტრაცია უფასოა · ყოველთვიური გადასახადი არ არის')}
            </p>
          </div>
        )}

        {/* OTP step */}
        {state === 'otp' && (
          <div className="pt-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-[var(--hm-brand-500)]" />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--hm-fg-primary)' }}>
              {t('invite.enterCode')}
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--hm-fg-secondary)' }}>
              {t('invite.codeSent')} <span className="font-mono font-medium" style={{ color: 'var(--hm-fg-primary)' }}>{maskPhone(invite.phone)}</span>
            </p>
            <div className="flex justify-center mb-6">
              <OTPInput length={4} value={otpCode} onChange={setOtpCode} onComplete={handleOtpComplete} autoFocus />
            </div>
            {error && <p className="text-[var(--hm-error-500)] text-sm mt-4">{error}</p>}
          </div>
        )}

        {/* Password step */}
        {(state === 'password' || state === 'activating') && (
          <div className="pt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-[var(--hm-brand-500)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--hm-fg-primary)' }}>
                  {pick('Set your password', 'შექმენი პაროლი')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>
                  {pick('Min 6 characters', 'მინიმუმ 6 სიმბოლო')}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={pick('Password', 'პაროლი')}
                  className="w-full h-12 px-4 pr-12 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: 'var(--hm-border-subtle)', backgroundColor: 'var(--hm-bg-elevated)', color: 'var(--hm-fg-primary)' }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" style={{ color: 'var(--hm-fg-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--hm-fg-muted)' }} />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={pick('Confirm password', 'გაიმეორეთ პაროლი')}
                className="w-full h-12 px-4 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--hm-border-subtle)', backgroundColor: 'var(--hm-bg-elevated)', color: 'var(--hm-fg-primary)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
              />
            </div>

            {error && <p className="text-[var(--hm-error-500)] text-sm mb-3">{error}</p>}

            <button
              onClick={handleActivate}
              disabled={state === 'activating' || password.length < 6 || !confirmPassword}
              className="w-full h-12 rounded-xl bg-[var(--hm-brand-500)] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-[var(--hm-brand-600)] active:scale-[0.98] disabled:opacity-50"
            >
              {state === 'activating' ? <LoadingSpinner size="sm" /> : (
                <>
                  {pick('Activate Account', 'ანგარიშის გაქტივება')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="pt-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--hm-success-100)] flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-[var(--hm-success-500)]" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--hm-fg-primary)' }}>
              {t('invite.success')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--hm-fg-secondary)' }}>
              {t('invite.redirecting')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

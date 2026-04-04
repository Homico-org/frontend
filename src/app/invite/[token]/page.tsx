'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Phone, ShieldX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { OTPInput } from '@/components/ui/OTPInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

type PageState = 'loading' | 'preview' | 'otp' | 'verifying' | 'success' | 'error';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth();
  const { t, locale } = useLanguage();
  const token = params.token as string;

  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (token === 'preview') {
      setInvite({
        token: 'preview', name: 'ლევანი ნიკოლაძე', phone: '+995551234567',
        city: 'თბილისი', cityKey: 'tbilisi', category: 'renovation',
        subcategory: 'plumbing', categoryKa: 'რემონტი', subcategoryKa: 'სანტექნიკა',
        type: 'professional', rating: 4.8, reviewCount: 24,
      });
      setState('preview');
      return;
    }
    api.get(`/invite/${token}`)
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

  const handleVerify = async (code: string) => {
    if (!invite) return;
    setState('verifying'); setError('');
    try {
      const res = await api.post('/invite/activate', { token: invite.token, phone: invite.phone, code });
      setState('success');
      login(res.data.access_token, res.data.user);
      setTimeout(() => router.push('/register/professional'), 1500);
    } catch { setError(t('invite.verifyFailed')); setState('otp'); }
  };

  const cat = locale === 'ka' ? invite?.categoryKa : invite?.category;
  const sub = locale === 'ka' ? invite?.subcategoryKa : invite?.subcategory;

  if (state === 'loading') {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-white"><LoadingSpinner size="lg" /></div>;
  }

  if (state === 'error' || !invite) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 bg-white">
        <div className="text-center">
          <ShieldX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-1">{t('invite.invalidLink')}</h1>
          <p className="text-sm text-gray-400">{t('invite.invalidLinkDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <div className="max-w-sm mx-auto px-6 py-10 flex flex-col min-h-[100dvh]">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-auto">
          <div className="w-7 h-7 rounded-lg bg-[#C4735B] flex items-center justify-center">
            <span className="text-white text-xs font-black">H</span>
          </div>
          <span className="text-gray-900 font-semibold">Homico</span>
        </div>

        {/* Center content */}
        <div className="my-auto py-12">

          {state === 'preview' && (
            <>
              {/* Name + meta */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{invite.name}</h1>
              <p className="text-gray-400 text-sm mb-6">{t('invite.subtitle')}</p>

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                <span className="text-[#C4735B] font-medium">{cat}</span>
                <span className="text-gray-300">·</span>
                <span>{sub}</span>
                {invite.city && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>{invite.city}</span>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 mt-4 mb-6" />

              {/* Benefits — just text, minimal */}
              <ul className="space-y-3 mb-8 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#C4735B]" />
                  {t('invite.benefit1')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#C4735B]" />
                  {t('invite.benefit2')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#C4735B]" />
                  {t('invite.benefit3')}
                </li>
              </ul>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full h-12 rounded-xl bg-[#C4735B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#B5624A] active:scale-[0.98] disabled:opacity-50 group"
              >
                {sendingOtp ? <LoadingSpinner size="sm" /> : (
                  <>
                    {t('invite.verifyAndActivate')}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-300 mt-3">{maskPhone(invite.phone)}</p>
            </>
          )}

          {(state === 'otp' || state === 'verifying') && (
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t('invite.enterCode')}</h2>
              <p className="text-sm text-gray-400 mb-8">
                {t('invite.codeSent')} <span className="text-gray-600 font-mono">{maskPhone(invite.phone)}</span>
              </p>
              <div className="flex justify-center mb-6">
                <OTPInput length={4} value={otpCode} onChange={setOtpCode} onComplete={handleVerify} disabled={state === 'verifying'} autoFocus />
              </div>
              {state === 'verifying' && <LoadingSpinner size="md" />}
              {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
          )}

          {state === 'success' && (
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-1">{t('invite.success')}</h2>
              <p className="text-sm text-gray-400">{t('invite.redirecting')}</p>
            </div>
          )}
        </div>

        {/* Footer spacer */}
        <div className="mt-auto" />
      </div>
    </div>
  );
}

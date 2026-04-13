'use client';

import { Button } from '@/components/ui/button';
import { useCriticalNotification } from '@/contexts/CriticalNotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Hammer,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import CountdownTimer from './CountdownTimer';

const COUNTDOWN_SECONDS: Record<string, number> = {
  new_booking: 30,
  booking_confirmed: 15,
  booking_started: 15,
  booking_completed: 15,
};

const typeConfig: Record<string, {
  icon: typeof Calendar;
  gradient: string;
  accentColor: string;
}> = {
  new_booking: {
    icon: Calendar,
    gradient: 'from-[#C4735B] to-[#A85D4A]',
    accentColor: '#C4735B',
  },
  booking_confirmed: {
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-emerald-700',
    accentColor: '#10B981',
  },
  booking_started: {
    icon: Hammer,
    gradient: 'from-blue-500 to-blue-700',
    accentColor: '#3B82F6',
  },
  booking_completed: {
    icon: Star,
    gradient: 'from-amber-500 to-amber-700',
    accentColor: '#F59E0B',
  },
};

// Month names for date formatting
const monthNames: Record<string, string[]> = {
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

function formatDate(dateStr: string, locale: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const months = monthNames[locale] || monthNames.en;
  return `${day} ${months[monthIdx]}`;
}

function extractDateTimeFromMessage(message: string, locale: string): { date?: string; time?: string } {
  const result: { date?: string; time?: string } = {};
  const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) result.date = formatDate(dateMatch[1], locale);
  const timeMatch = message.match(/at (\d{1,2}:\d{2})/);
  if (timeMatch) result.time = timeMatch[1];
  const hourMatch = message.match(/(\d{1,2}):00/);
  if (hourMatch && !result.time) result.time = hourMatch[1] + ':00';
  return result;
}

export default function CriticalNotificationOverlay() {
  const { currentNotification, secondsRemaining, queueLength, dismissCurrent, handlePrimaryAction } = useCriticalNotification();
  const { t, locale } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound management
  useEffect(() => {
    if (!currentNotification) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const playSound = () => {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/sounds/notification.mp3');
        }
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(() => {});
      } catch {
        // Ignore
      }
    };

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    playSound();

    // Repeat sound for new_booking (most critical)
    if (currentNotification.type === 'new_booking') {
      intervalRef.current = setInterval(playSound, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentNotification]);

  if (!currentNotification) return null;

  const config = typeConfig[currentNotification.type] || typeConfig.new_booking;
  const Icon = config.icon;
  const total = COUNTDOWN_SECONDS[currentNotification.type] || 15;
  const { date, time } = extractDateTimeFromMessage(currentNotification.message, locale);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in" />

      {/* Content */}
      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Dismiss button */}
        <button
          onClick={dismissCurrent}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Card */}
        <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Header gradient */}
          <div className={`bg-gradient-to-br ${config.gradient} px-6 pt-8 pb-6 text-center relative`}>
            {/* Countdown timer - top right */}
            <div className="absolute top-4 right-4">
              <CountdownTimer total={total} remaining={secondsRemaining} />
            </div>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Icon className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-1">
              {t(`criticalNotification.${currentNotification.type}.title`)}
            </h2>

            {/* Queue indicator */}
            {queueLength > 0 && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20 text-xs text-white/80">
                +{queueLength} {t('criticalNotification.more')}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-3">
            {/* Date & Time */}
            {(date || time) && (
              <div className="flex items-center gap-3 text-neutral-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm">{date}</span>
                </div>
                {time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm">{time}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/10"
                onClick={dismissCurrent}
              >
                {t('criticalNotification.dismiss')}
              </Button>
              <Button
                className="flex-1 text-white font-semibold"
                style={{ backgroundColor: config.accentColor }}
                onClick={handlePrimaryAction}
              >
                {t(`criticalNotification.${currentNotification.type}.action`)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

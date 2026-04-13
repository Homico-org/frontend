'use client';

import { useCriticalNotification } from '@/contexts/CriticalNotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Hammer,
  Star,
  X,
} from 'lucide-react';

const typeConfig: Record<string, {
  icon: typeof Calendar;
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  new_booking: {
    icon: Calendar,
    bgColor: 'bg-[#C4735B]/10',
    borderColor: 'border-[#C4735B]/30',
    textColor: 'text-[#C4735B]',
  },
  booking_confirmed: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  booking_started: {
    icon: Hammer,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  booking_completed: {
    icon: Star,
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
};

export default function CriticalNotificationBanner() {
  const { dismissedNotifications, clearDismissed, handleDismissedAction } = useCriticalNotification();
  const { t } = useLanguage();

  if (dismissedNotifications.length === 0) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-[55] pointer-events-none">
      <div className="max-w-2xl mx-auto px-3 py-2 space-y-2">
        {dismissedNotifications.map((notification) => {
          const config = typeConfig[notification.type] || typeConfig.new_booking;
          const Icon = config.icon;

          return (
            <div
              key={notification.id}
              className={`pointer-events-auto flex items-center gap-3 px-3 py-2.5 rounded-xl border ${config.bgColor} ${config.borderColor} backdrop-blur-md shadow-lg animate-slide-down`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${config.textColor}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content — tappable to act */}
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => handleDismissedAction(notification.id)}
              >
                <p className={`text-sm font-semibold ${config.textColor} truncate`}>
                  {t(`criticalNotification.${notification.type}.title`)}
                </p>
              </button>

              {/* Action arrow */}
              <button
                onClick={() => handleDismissedAction(notification.id)}
                className={`flex-shrink-0 ${config.textColor}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                onClick={() => clearDismissed(notification.id)}
                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

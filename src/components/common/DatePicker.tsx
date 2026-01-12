'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

import { useLanguage } from "@/contexts/LanguageContext";
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  locale?: 'ka' | 'en' | 'ru';
  className?: string;
}

const MONTHS_KA = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_KA = ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
  locale = 'ka',
  className = ''
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), isOpen);

  const months = locale === 'ka' ? MONTHS_KA : MONTHS_EN;
  const weekdays = locale === 'ka' ? WEEKDAYS_KA : WEEKDAYS_EN;

  // Parse the value to Date
  const selectedDate = value ? new Date(value) : null;

  // Set current month to selected date or today
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week (0 = Sunday, convert to Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full sm:w-64 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-forest-500 dark:focus-within:ring-primary-400"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        <span
          className="flex-1 text-base"
          style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
        >
          {value ? formatDisplayDate(value) : (placeholder || (t('common.ddmmyyyy')))}
        </span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Calendar dropdown - opens on top */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 p-4 rounded-xl shadow-xl z-50 w-72"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <div key={idx} className="aspect-square">
                {day ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={isDateDisabled(day)}
                    className={`
                      w-full h-full rounded-lg text-sm font-medium
                      flex items-center justify-center
                      transition-all duration-150
                      ${isSelected(day)
                        ? 'bg-forest-600 dark:bg-primary-500 text-white'
                        : isToday(day)
                        ? 'ring-1 ring-forest-500 dark:ring-primary-400'
                        : ''
                      }
                      ${isDateDisabled(day)
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }
                    `}
                    style={{
                      color: isSelected(day) ? undefined : 'var(--color-text-primary)'
                    }}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  onChange(today.toISOString().split('T')[0]);
                  setIsOpen(false);
                }
              }}
              className="w-full py-2 text-sm font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {t('common.today')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

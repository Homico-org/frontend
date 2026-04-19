'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center h-9 w-9 rounded-xl bg-[var(--hm-bg-tertiary)] hover:bg-[var(--hm-n-200)] transition-all"
      title={isDark ? t('header.lightMode') : t('header.darkMode')}
      aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
    >
      {isDark ? (
        <Sun className="w-[18px] h-[18px] text-[var(--hm-fg-secondary)]" strokeWidth={1.75} />
      ) : (
        <Moon className="w-[18px] h-[18px] text-[var(--hm-fg-secondary)]" strokeWidth={1.75} />
      )}
    </button>
  );
}

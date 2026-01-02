'use client';

import { Bell, Mail, MessageSquare, Megaphone, Smartphone, BriefcaseBusiness, Send } from 'lucide-react';

export interface NotificationToggleProps {
  /** Label for the toggle */
  label: string;
  /** Optional description text */
  description?: string;
  /** Icon type */
  icon?: 'bell' | 'mail' | 'message' | 'megaphone' | 'phone' | 'briefcase' | 'send';
  /** Whether the toggle is checked */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

const iconMap = {
  bell: Bell,
  mail: Mail,
  message: MessageSquare,
  megaphone: Megaphone,
  phone: Smartphone,
  briefcase: BriefcaseBusiness,
  send: Send,
};

export default function NotificationToggle({
  label,
  description,
  icon,
  checked,
  onChange,
  disabled = false,
  className = '',
}: NotificationToggleProps) {
  const IconComponent = icon ? iconMap[icon] : null;

  return (
    <div
      className={`flex items-center justify-between py-3 ${className}`}
      style={{ borderBottom: '1px solid var(--color-border-light, rgba(0,0,0,0.05))' }}
    >
      <div className="flex items-center gap-3">
        {IconComponent && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-tertiary, rgba(0,0,0,0.05))' }}
          >
            <IconComponent
              className="w-4 h-4"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          </div>
        )}
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {label}
          </p>
          {description && (
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E07B4F] focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          backgroundColor: checked ? '#E07B4F' : 'var(--color-bg-tertiary, #d1d5db)',
        }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// Group component for notification categories
export interface NotificationGroupProps {
  /** Title of the group */
  title: string;
  /** Optional description */
  description?: string;
  /** Icon for the group header */
  icon?: 'bell' | 'mail' | 'message' | 'megaphone' | 'phone' | 'briefcase' | 'send';
  /** Whether the entire group is enabled */
  enabled: boolean;
  /** Handler for the main toggle */
  onEnabledChange: (enabled: boolean) => void;
  /** Child toggle items */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

export function NotificationGroup({
  title,
  description,
  icon,
  enabled,
  onEnabledChange,
  children,
  className = '',
}: NotificationGroupProps) {
  const IconComponent = icon ? iconMap[icon] : Bell;

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Group Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(224, 123, 79, 0.1)' }}
          >
            <IconComponent className="w-5 h-5 text-[#E07B4F]" />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </p>
            {description && (
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Main Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E07B4F] focus:ring-offset-2"
          style={{
            backgroundColor: enabled ? '#E07B4F' : 'var(--color-bg-tertiary, #d1d5db)',
          }}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Child Items */}
      {enabled && (
        <div
          className="px-4 pb-3"
          style={{ borderTop: '1px solid var(--color-border-light, rgba(0,0,0,0.05))' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

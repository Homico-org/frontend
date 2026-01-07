'use client';

import { Bell, Mail, MessageSquare, Megaphone, Smartphone, BriefcaseBusiness, Send } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';

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
  /** Size of the toggle */
  size?: 'sm' | 'md';
  /** Color variant */
  variant?: 'primary' | 'violet' | 'success';
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
  size = 'md',
  variant = 'primary',
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

      <Toggle
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        size={size}
        variant={variant}
      />
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
  /** Color variant */
  variant?: 'primary' | 'violet' | 'success';
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
  variant = 'primary',
  children,
  className = '',
}: NotificationGroupProps) {
  const IconComponent = icon ? iconMap[icon] : Bell;

  const iconColors = {
    primary: 'text-[#E07B4F]',
    violet: 'text-violet-500',
    success: 'text-green-500',
  };

  const iconBgColors = {
    primary: 'rgba(224, 123, 79, 0.1)',
    violet: 'rgba(139, 92, 246, 0.1)',
    success: 'rgba(34, 197, 94, 0.1)',
  };

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
            style={{ backgroundColor: iconBgColors[variant] }}
          >
            <IconComponent className={`w-5 h-5 ${iconColors[variant]}`} />
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

        <Toggle
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          variant={variant}
        />
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

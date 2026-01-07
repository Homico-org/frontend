'use client';

import UserTypeCard from './UserTypeCard';

export interface UserTypeSelectorProps {
  /** Currently selected user type */
  value: 'client' | 'pro' | null;
  /** Called when user type is selected */
  onChange: (type: 'client' | 'pro') => void;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Custom className */
  className?: string;
}

// Cloudinary image URLs
const IMAGES = {
  client: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/client.png',
  pro: 'https://res.cloudinary.com/dakcvkodo/image/upload/w_600,h_450,c_pad,q_auto,f_auto/homico/avatars/pro-plumber.png',
};

const translations = {
  en: {
    client: {
      title: 'Client',
      description: 'Find specialists',
      descriptionLong: 'Find trusted professionals for your home projects',
      cta: 'Get Started',
      freeLabel: 'Free forever',
    },
    pro: {
      title: 'Professional',
      description: 'Get hired',
      descriptionLong: 'Grow your business and connect with clients',
      cta: 'Join Now',
      freeLabel: 'Start earning today',
      badge: 'Popular',
    },
  },
  ka: {
    client: {
      title: 'კლიენტი',
      description: 'იპოვე სპეციალისტი',
      descriptionLong: 'იპოვე სანდო სპეციალისტები შენი სახლისთვის',
      cta: 'დაწყება',
      freeLabel: 'უფასოა',
    },
    pro: {
      title: 'სპეციალისტი',
      description: 'მიიღე შეკვეთები',
      descriptionLong: 'გაზარდე ბიზნესი და დაუკავშირდი კლიენტებს',
      cta: 'შემოგვიერთდი',
      freeLabel: 'დაიწყე შემოსავალი',
      badge: 'პოპულარული',
    },
  },
};

/**
 * UserTypeSelector - A responsive component for selecting user type during registration
 * 
 * - On desktop (md+): Shows full cards side by side
 * - On mobile: Shows compact segmented control
 */
export default function UserTypeSelector({
  value,
  onChange,
  locale = 'en',
  className = '',
}: UserTypeSelectorProps) {
  const t = translations[locale];

  return (
    <div className={className}>
      {/* Mobile: Compact cards */}
      <div className="md:hidden">
        <div className="bg-neutral-100/80 backdrop-blur-sm p-2 rounded-2xl">
          <div className="grid grid-cols-2 gap-2">
            <UserTypeCard
              type="client"
              variant="compact"
              title={t.client.title}
              description={t.client.description}
              ctaText={t.client.cta}
              imageUrl={IMAGES.client}
              onClick={() => onChange('client')}
              selected={value === 'client'}
            />
            <UserTypeCard
              type="pro"
              variant="compact"
              title={t.pro.title}
              description={t.pro.description}
              ctaText={t.pro.cta}
              badge={t.pro.badge}
              imageUrl={IMAGES.pro}
              onClick={() => onChange('pro')}
              selected={value === 'pro'}
            />
          </div>
        </div>
      </div>

      {/* Desktop: Full cards */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <UserTypeCard
          type="client"
          variant="default"
          title={t.client.title}
          description={t.client.descriptionLong}
          ctaText={t.client.cta}
          freeLabel={t.client.freeLabel}
          imageUrl={IMAGES.client}
          onClick={() => onChange('client')}
          locale={locale}
        />
        <UserTypeCard
          type="pro"
          variant="default"
          title={t.pro.title}
          description={t.pro.descriptionLong}
          ctaText={t.pro.cta}
          freeLabel={t.pro.freeLabel}
          badge={t.pro.badge}
          imageUrl={IMAGES.pro}
          onClick={() => onChange('pro')}
          locale={locale}
        />
      </div>
    </div>
  );
}


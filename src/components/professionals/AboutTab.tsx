'use client';

import { SocialIcon, socialColors } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Edit3, Globe, Plus, X } from 'lucide-react';
import { useState } from 'react';

export interface SocialLinks {
  whatsapp?: string;
  telegram?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export interface AboutTabProps {
  /** Profile description */
  description?: string;
  /** Custom services offered */
  customServices?: string[];
  /** Subcategories/skills grouped by category */
  groupedServices: Record<string, string[]>;
  /** Function to get category label */
  getCategoryLabel: (categoryKey: string) => string;
  /** Function to get subcategory label */
  getSubcategoryLabel: (subcategoryKey: string) => string;
  /** WhatsApp number */
  whatsapp?: string;
  /** Telegram username */
  telegram?: string;
  /** Facebook URL */
  facebookUrl?: string;
  /** Instagram URL */
  instagramUrl?: string;
  /** LinkedIn URL */
  linkedinUrl?: string;
  /** Website URL */
  websiteUrl?: string;
  /** Locale for translations */
  locale?: 'en' | 'ka';
  /** Is current user viewing their own profile */
  isOwner?: boolean;
  /** Handler to save description */
  onSaveDescription?: (description: string) => Promise<void>;
  /** Handler to save custom services */
  onSaveServices?: (services: string[]) => Promise<void>;
  /** Handler to save social links */
  onSaveSocialLinks?: (links: SocialLinks) => Promise<void>;
}

export default function AboutTab({
  description,
  customServices,
  groupedServices,
  getCategoryLabel,
  getSubcategoryLabel,
  whatsapp,
  telegram,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
  locale = 'en',
  isOwner = false,
  onSaveDescription,
  onSaveServices,
  onSaveSocialLinks,
}: AboutTabProps) {
  const hasContactLinks = whatsapp || telegram || facebookUrl || instagramUrl || linkedinUrl || websiteUrl;

  // Inline editing states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(description || '');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  const [isEditingServices, setIsEditingServices] = useState(false);
  const [editServices, setEditServices] = useState<string[]>(customServices || []);
  const [newService, setNewService] = useState('');
  const [isSavingServices, setIsSavingServices] = useState(false);

  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [editSocial, setEditSocial] = useState<SocialLinks>({
    whatsapp: whatsapp || '',
    telegram: telegram || '',
    facebookUrl: facebookUrl || '',
    instagramUrl: instagramUrl || '',
    linkedinUrl: linkedinUrl || '',
    websiteUrl: websiteUrl || '',
  });
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  const handleSaveDescription = async () => {
    if (!onSaveDescription) return;
    setIsSavingDescription(true);
    try {
      await onSaveDescription(editDescription);
      setIsEditingDescription(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveServices = async () => {
    if (!onSaveServices) return;
    setIsSavingServices(true);
    try {
      await onSaveServices(editServices);
      setIsEditingServices(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSavingServices(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    if (!onSaveSocialLinks) return;
    setIsSavingSocial(true);
    try {
      // Clean empty strings
      const cleanedLinks: SocialLinks = {
        whatsapp: editSocial.whatsapp?.trim() || undefined,
        telegram: editSocial.telegram?.trim() || undefined,
        facebookUrl: editSocial.facebookUrl?.trim() || undefined,
        instagramUrl: editSocial.instagramUrl?.trim() || undefined,
        linkedinUrl: editSocial.linkedinUrl?.trim() || undefined,
        websiteUrl: editSocial.websiteUrl?.trim() || undefined,
      };
      await onSaveSocialLinks(cleanedLinks);
      setIsEditingSocial(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSavingSocial(false);
    }
  };

  const addService = () => {
    if (newService.trim() && !editServices.includes(newService.trim())) {
      setEditServices([...editServices, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setEditServices(editServices.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Description */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 group relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            {locale === 'ka' ? 'შესახებ' : 'About'}
          </h3>
          {isOwner && !isEditingDescription && (
            <button
              onClick={() => {
                setEditDescription(description || '');
                setIsEditingDescription(true);
              }}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="space-y-3">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={locale === 'ka' ? 'აღწერეთ თქვენი გამოცდილება და სერვისები...' : 'Describe your experience and services...'}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingDescription(false)}
                disabled={isSavingDescription}
              >
                <X className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDescription}
                loading={isSavingDescription}
              >
                <Check className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'შენახვა' : 'Save'}
              </Button>
            </div>
          </div>
        ) : description ? (
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        ) : isOwner ? (
          <button
            onClick={() => setIsEditingDescription(true)}
            className="w-full py-6 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 hover:text-[#C4735B] hover:border-[#C4735B] transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">{locale === 'ka' ? 'აღწერის დამატება' : 'Add Description'}</span>
          </button>
        ) : (
          <p className="text-neutral-400 italic">{locale === 'ka' ? 'აღწერა არ არის' : 'No description'}</p>
        )}
      </div>

      {/* Services Grid */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 group relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            {locale === 'ka' ? 'სერვისები' : 'Services'}
          </h3>
          {isOwner && !isEditingServices && (
            <button
              onClick={() => {
                setEditServices(customServices || []);
                setIsEditingServices(true);
              }}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditingServices ? (
          <div className="space-y-3">
            {/* Current services with remove buttons */}
            <div className="flex flex-wrap gap-2">
              {editServices.map((service, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#C4735B]/10 text-[#C4735B] text-sm"
                >
                  <span>{service}</span>
                  <button
                    onClick={() => removeService(idx)}
                    className="w-4 h-4 rounded-full hover:bg-[#C4735B]/20 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new service */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addService()}
                placeholder={locale === 'ka' ? 'ახალი სერვისი...' : 'New service...'}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
              <Button variant="outline" size="sm" onClick={addService}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingServices(false)}
                disabled={isSavingServices}
              >
                <X className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveServices}
                loading={isSavingServices}
              >
                <Check className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'შენახვა' : 'Save'}
              </Button>
            </div>
          </div>
        ) : customServices && customServices.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customServices.map((service, idx) => (
              <Badge key={idx} variant="premium" size="default">
                {service}
              </Badge>
            ))}
          </div>
        ) : isOwner ? (
          <button
            onClick={() => setIsEditingServices(true)}
            className="w-full py-6 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 hover:text-[#C4735B] hover:border-[#C4735B] transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">{locale === 'ka' ? 'სერვისების დამატება' : 'Add Services'}</span>
          </button>
        ) : (
          <p className="text-neutral-400 italic">{locale === 'ka' ? 'სერვისები არ არის' : 'No services listed'}</p>
        )}
      </div>

      {/* Skills section removed - categories now shown in hero */}

      {/* Contact & Social Links */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-100 dark:border-neutral-800 group relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            {locale === 'ka' ? 'კონტაქტი და სოციალური' : 'Contact & Social'}
          </h3>
          {isOwner && !isEditingSocial && (
            <button
              onClick={() => {
                setEditSocial({
                  whatsapp: whatsapp || '',
                  telegram: telegram || '',
                  facebookUrl: facebookUrl || '',
                  instagramUrl: instagramUrl || '',
                  linkedinUrl: linkedinUrl || '',
                  websiteUrl: websiteUrl || '',
                });
                setIsEditingSocial(true);
              }}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#C4735B] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditingSocial ? (
          <div className="space-y-3">
            {/* WhatsApp */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${socialColors.whatsapp}15`, color: socialColors.whatsapp }}
              >
                <SocialIcon name="whatsapp" size="md" />
              </div>
              <input
                type="text"
                value={editSocial.whatsapp || ''}
                onChange={(e) => setEditSocial({ ...editSocial, whatsapp: e.target.value })}
                placeholder={locale === 'ka' ? '+995 XXX XXX XXX' : '+995 XXX XXX XXX'}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            {/* Telegram */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${socialColors.telegram}15`, color: socialColors.telegram }}
              >
                <SocialIcon name="telegram" size="md" />
              </div>
              <input
                type="text"
                value={editSocial.telegram || ''}
                onChange={(e) => setEditSocial({ ...editSocial, telegram: e.target.value })}
                placeholder={locale === 'ka' ? '@username' : '@username'}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            {/* Facebook */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${socialColors.facebook}15`, color: socialColors.facebook }}
              >
                <SocialIcon name="facebook" size="md" />
              </div>
              <input
                type="url"
                value={editSocial.facebookUrl || ''}
                onChange={(e) => setEditSocial({ ...editSocial, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/..."
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${socialColors.instagram}15`, color: socialColors.instagram }}
              >
                <SocialIcon name="instagram" size="md" />
              </div>
              <input
                type="url"
                value={editSocial.instagramUrl || ''}
                onChange={(e) => setEditSocial({ ...editSocial, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/..."
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            {/* LinkedIn */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${socialColors.linkedin}15`, color: socialColors.linkedin }}
              >
                <SocialIcon name="linkedin" size="md" />
              </div>
              <input
                type="url"
                value={editSocial.linkedinUrl || ''}
                onChange={(e) => setEditSocial({ ...editSocial, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            {/* Website */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-600 dark:text-neutral-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={editSocial.websiteUrl || ''}
                onChange={(e) => setEditSocial({ ...editSocial, websiteUrl: e.target.value })}
                placeholder="https://your-website.com"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C4735B] focus:border-transparent text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSocial(false)}
                disabled={isSavingSocial}
              >
                <X className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSocialLinks}
                loading={isSavingSocial}
              >
                <Check className="w-4 h-4 mr-1" />
                {locale === 'ka' ? 'შენახვა' : 'Save'}
              </Button>
            </div>
          </div>
        ) : hasContactLinks ? (
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-full flex items-center justify-center gap-2 hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.whatsapp}15`, color: socialColors.whatsapp }}
              >
                <SocialIcon name="whatsapp" size="md" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            )}
            {telegram && (
              <a
                href={`https://t.me/${telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 rounded-full flex items-center justify-center gap-2 hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.telegram}15`, color: socialColors.telegram }}
              >
                <SocialIcon name="telegram" size="md" />
                <span className="text-sm font-medium">Telegram</span>
              </a>
            )}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.facebook}15`, color: socialColors.facebook }}
              >
                <SocialIcon name="facebook" size="md" />
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.instagram}15`, color: socialColors.instagram }}
              >
                <SocialIcon name="instagram" size="md" />
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-colors"
                style={{ backgroundColor: `${socialColors.linkedin}15`, color: socialColors.linkedin }}
              >
                <SocialIcon name="linkedin" size="md" />
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : isOwner ? (
          <button
            onClick={() => setIsEditingSocial(true)}
            className="w-full py-6 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 hover:text-[#C4735B] hover:border-[#C4735B] transition-colors"
          >
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm">{locale === 'ka' ? 'სოციალური ბმულების დამატება' : 'Add Social Links'}</span>
          </button>
        ) : (
          <p className="text-neutral-400 italic">{locale === 'ka' ? 'სოციალური ბმულები არ არის' : 'No social links'}</p>
        )}
      </div>
    </div>
  );
}


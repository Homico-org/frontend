'use client';

import Image from 'next/image';
import Avatar from '@/components/common/Avatar';
import MediaLightbox from '@/components/common/MediaLightbox';
import { Button } from '@/components/ui/button';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input, Textarea } from '@/components/ui/input';
import { ACCENT_COLOR as ACCENT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  ShoppingBag,
  ThumbsUp,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useLanguage } from "@/contexts/LanguageContext";
// User type for workspace components
interface WorkspaceUser {
  id: string;
  name: string;
  avatar?: string;
}

// Helper to get ID from object (handles both id and _id)
const getId = (obj: { id?: string; _id?: string } | undefined): string => {
  if (!obj) return '';
  return obj.id || obj._id || '';
};

// Types
interface WorkspaceItem {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  type: 'image' | 'file' | 'link' | 'product';
  // For images/files
  fileUrl?: string;
  // For links
  linkUrl?: string;
  // For products
  price?: number;
  currency?: string;
  storeName?: string;
  storeAddress?: string;
  // Reactions & comments
  reactions: {
    type: 'like' | 'love' | 'approved';
    userId: string;
    userName: string;
  }[];
  comments: {
    id?: string;
    _id?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

interface SectionAttachment {
  id?: string;
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // 'image' | 'document' | 'other'
  fileSize?: number;
  uploadedAt: string;
}

interface WorkspaceSection {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  attachments: SectionAttachment[];
  items: WorkspaceItem[];
  isExpanded: boolean;
  createdAt: string;
}

interface ProjectWorkspaceProps {
  jobId: string;
  locale: string;
  isClient: boolean;
  embedded?: boolean; // When true, shows content directly without accordion
}

export default function ProjectWorkspace({ jobId, locale, isClient, embedded = false }: ProjectWorkspaceProps) {
  const { user } = useAuth();

  const { t } = useLanguage();
  const toast = useToast();

  const [isExpanded, setIsExpanded] = useState(embedded); // Auto-expand if embedded
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState<string | null>(null); // sectionId or null
  const [editingSection, setEditingSection] = useState<WorkspaceSection | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  // Comment state
  const [activeCommentItem, setActiveCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Image lightbox state
  const [lightboxImages, setLightboxImages] = useState<{ url: string; type: 'image' }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openImageLightbox = (images: SectionAttachment[], clickedIndex: number) => {
    setLightboxImages(images.map(a => ({ url: a.fileUrl, type: 'image' as const })));
    setLightboxIndex(clickedIndex);
  };

  // Fetch workspace data
  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/jobs/projects/${jobId}/workspace`);
      setSections(response.data.sections || []);
      setHasLoaded(true);
    } catch (error) {
      // If 404, workspace doesn't exist yet - that's ok
      const apiErr = error as { response?: { status?: number } };
      if (apiErr.response?.status !== 404) {
        console.error('Failed to fetch workspace:', error);
      }
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if ((isExpanded || embedded) && !hasLoaded) {
      fetchWorkspace();
      // Mark materials as viewed
      api.post(`/jobs/projects/${jobId}/materials/viewed`).catch(() => {});
    }
  }, [isExpanded, embedded, hasLoaded, fetchWorkspace, jobId]);

  // Section CRUD
  const [isSavingSection, setIsSavingSection] = useState(false);

  const handleCreateSection = async (title: string, description?: string, attachments?: SectionAttachment[]) => {
    if (isSavingSection) return; // Prevent double submission

    try {
      setIsSavingSection(true);
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections`, {
        title,
        description,
        attachments: attachments || [],
      });
      setSections(prev => [...prev, { ...response.data.section, isExpanded: true }]);
      setShowSectionModal(false);
      toast.success(
        t('projects.sectionCreated'),
        t('projects.newSectionHasBeenAdded')
      );
    } catch (error) {
      toast.error(
        t('common.error'),
        t('projects.failedToCreateSection')
      );
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleUpdateSection = async (sectionId: string, title: string, description?: string, attachments?: SectionAttachment[]) => {
    try {
      const response = await api.patch(`/jobs/projects/${jobId}/workspace/sections/${sectionId}`, {
        title,
        description,
        attachments,
      });
      setSections(prev => prev.map(s =>
        getId(s) === sectionId ? { ...s, title, description, attachments: response.data.section?.attachments || s.attachments } : s
      ));
      setEditingSection(null);
      toast.success(t('projects.saved'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await api.delete(`/jobs/projects/${jobId}/workspace/sections/${sectionId}`);
      setSections(prev => prev.filter(s => getId(s) !== sectionId));
      toast.success(t('projects.deleted'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setDeletingSectionId(null);
    }
  };

  // Item CRUD
  const handleCreateItem = async (sectionId: string, itemData: Partial<WorkspaceItem>) => {
    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items`, itemData);
      setSections(prev => prev.map(s =>
        getId(s) === sectionId
          ? { ...s, items: [...s.items, response.data.item] }
          : s
      ));
      setShowItemModal(null);
      toast.success(t('projects.added'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    try {
      await api.delete(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items/${itemId}`);
      setSections(prev => prev.map(s =>
        getId(s) === sectionId
          ? { ...s, items: s.items.filter(i => getId(i) !== itemId) }
          : s
      ));
      toast.success(t('projects.deleted'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // Reactions
  const handleReaction = async (sectionId: string, itemId: string, type: 'like' | 'love' | 'approved') => {
    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items/${itemId}/reactions`, { type });
      setSections(prev => prev.map(s =>
        getId(s) === sectionId
          ? {
              ...s,
              items: s.items.map(i =>
                getId(i) === itemId ? { ...i, reactions: response.data.reactions } : i
              )
            }
          : s
      ));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  // Comments
  const handleAddComment = async (sectionId: string, itemId: string) => {
    if (!commentText.trim()) return;

    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items/${itemId}/comments`, {
        content: commentText,
      });
      setSections(prev => prev.map(s =>
        getId(s) === sectionId
          ? {
              ...s,
              items: s.items.map(i =>
                getId(i) === itemId ? { ...i, comments: response.data.comments } : i
              )
            }
          : s
      ));
      setCommentText('');
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      getId(s) === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

  // Render content section (shared between accordion and embedded modes)
  const renderContent = () => (
    <>
      {/* Toolbar */}
      {!isClient && (
        <div className={embedded ? "pb-3 mb-3 border-b border-[var(--hm-border)]" : "px-4 py-3 border-b border-[var(--hm-border)] bg-[var(--hm-bg-elevated)]"}>
          <Button
            size="sm"
            onClick={() => setShowSectionModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('projects.addSection')}
          </Button>
        </div>
      )}

      {/* Content */}
      <div className={embedded ? "" : "p-4"}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" color={ACCENT} />
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--hm-fg-muted)]">
            <FolderPlus className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">{t('projects.noMaterialsYet')}</p>
            <p className="text-xs mt-1">
              {isClient
                ? (t('projects.professionalWillAddMaterialsHere'))
                : (t('projects.addSectionsToOrganizeProject'))
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <SectionCard
                key={getId(section)}
                section={section}
                locale={locale}
                isClient={isClient}
                user={user}
                onToggle={() => toggleSection(getId(section))}
                onEdit={() => setEditingSection(section)}
                onDelete={() => setDeletingSectionId(getId(section))}
                onAddItem={() => setShowItemModal(getId(section))}
                onDeleteItem={(itemId) => handleDeleteItem(getId(section), itemId)}
                onReaction={(itemId, type) => handleReaction(getId(section), itemId, type)}
                activeCommentItem={activeCommentItem}
                setActiveCommentItem={setActiveCommentItem}
                commentText={commentText}
                setCommentText={setCommentText}
                onAddComment={(itemId) => handleAddComment(getId(section), itemId)}
                onOpenImageLightbox={openImageLightbox}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  // Render modals (shared between both modes)
  const renderModals = () => (
    <>
      {/* Section Modal */}
      {(showSectionModal || editingSection) && (
        <SectionModal
          locale={locale}
          section={editingSection}
          isSaving={isSavingSection}
          onClose={() => {
            setShowSectionModal(false);
            setEditingSection(null);
          }}
          onSave={(title, description, attachments) => {
            if (editingSection) {
              handleUpdateSection(getId(editingSection), title, description, attachments);
            } else {
              handleCreateSection(title, description, attachments);
            }
          }}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          locale={locale}
          onClose={() => setShowItemModal(null)}
          onSave={(itemData) => handleCreateItem(showItemModal!, itemData)}
        />
      )}

      {/* Image Lightbox */}
      <MediaLightbox
        items={lightboxImages}
        currentIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        getImageUrl={(url) => storage.getFileUrl(url)}
        locale={locale as "en" | "ka" | "ru"}
        showThumbnails={lightboxImages.length > 1}
        showInfo={false}
      />

      <ConfirmModal
        isOpen={!!deletingSectionId}
        onClose={() => setDeletingSectionId(null)}
        onConfirm={() => deletingSectionId && handleDeleteSection(deletingSectionId)}
        title={t('projects.deleteThisSection')}
        variant="danger"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
      />
    </>
  );

  // Embedded mode: show content directly
  if (embedded) {
    return (
      <div>
        {renderContent()}
        {renderModals()}
      </div>
    );
  }

  // Accordion mode (default)
  return (
    <div className="border-t border-[var(--hm-border)]">
      {/* Header Toggle */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-auto justify-between p-4 rounded-none hover:bg-[var(--hm-bg-tertiary)]/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--hm-bg-tertiary)]">
            <FolderPlus className="w-4 h-4 text-[var(--hm-fg-secondary)]" />
            <span className="text-sm font-semibold text-[var(--hm-fg-primary)]">
              {t('projects.projectMaterials')}
            </span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                {totalItems}
              </span>
            )}
          </div>
          {sections.length > 0 && (
            <span className="text-xs text-[var(--hm-fg-muted)] hidden sm:inline">
              {sections.length} {t('projects.sections')}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-5 h-5 text-[var(--hm-fg-muted)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </Button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-[var(--hm-bg-tertiary)]/30 rounded-2xl border border-[var(--hm-border)] overflow-hidden">
            {renderContent()}
          </div>
        </div>
      )}

      {renderModals()}
    </div>
  );
}

// Section Card Component
function SectionCard({
  section,
  locale,
  isClient,
  user,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onDeleteItem,
  onReaction,
  activeCommentItem,
  setActiveCommentItem,
  commentText,
  setCommentText,
  onAddComment,
  onOpenImageLightbox,
}: {
  section: WorkspaceSection;
  locale: string;
  isClient: boolean;
  user: WorkspaceUser | null;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onReaction: (itemId: string, type: 'like' | 'love' | 'approved') => void;
  activeCommentItem: string | null;
  setActiveCommentItem: (id: string | null) => void;
  commentText: string;
  setCommentText: (text: string) => void;
  onAddComment: (itemId: string) => void;
  onOpenImageLightbox: (images: SectionAttachment[], clickedIndex: number) => void;
}) {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 144, // 144 = menu width (w-36 = 9rem = 144px)
      });
    }
    setShowMenu(!showMenu);
  };

  return (
    <div className="bg-[var(--hm-bg-elevated)] rounded-xl border border-[var(--hm-border)] overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--hm-bg-tertiary)]/50 transition-colors"
        onClick={onToggle}
      >
        <ChevronDown
          className={`w-4 h-4 text-[var(--hm-fg-muted)] transition-transform ${section.isExpanded ? '' : '-rotate-90'}`}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--hm-fg-primary)] truncate">
            {section.title}
          </h4>
          {section.description && (
            <p className="text-xs text-[var(--hm-fg-muted)] truncate">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {section.attachments && section.attachments.length > 0 && (
            <span className="text-xs text-[var(--hm-fg-muted)] px-2 py-0.5 rounded-full bg-[var(--hm-bg-tertiary)] flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {section.attachments.length}
            </span>
          )}
          <span className="text-xs text-[var(--hm-fg-muted)] px-2 py-0.5 rounded-full bg-[var(--hm-bg-tertiary)]">
            {section.items.length} {t('common.items')}
          </span>
        </div>

        {!isClient && (
          <>
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon-sm"
              onClick={handleMenuClick}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div
                  className="fixed z-[9999] w-36 bg-[var(--hm-bg-elevated)] rounded-lg border border-[var(--hm-border)] shadow-xl py-1"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                    className="w-full justify-start"
                    leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                    className="w-full justify-start text-[var(--hm-error-500)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Section Content */}
      {section.isExpanded && (
        <div className="border-t border-[var(--hm-border)]">
          {/* Section Attachments Gallery */}
          {section.attachments && section.attachments.length > 0 && (
            <div className="p-4 bg-[var(--hm-bg-tertiary)]/30 border-b border-[var(--hm-border)]">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-[var(--hm-fg-muted)]" />
                <span className="text-xs font-medium text-[var(--hm-fg-secondary)]">
                  {t('projects.attachments')} ({section.attachments.length})
                </span>
              </div>
              {/* Image Grid */}
              {(() => {
                const imageAtts = section.attachments.filter(a => a.fileType === 'image');
                return imageAtts.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {imageAtts.map((att, idx) => (
                    <button
                      key={getId(att)}
                      onClick={() => onOpenImageLightbox(imageAtts, idx)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-[var(--hm-bg-page)] border border-[var(--hm-border)] hover:border-[var(--hm-brand-500)] transition-colors group cursor-pointer"
                    >
                      <Image
                        src={storage.getFileUrl(att.fileUrl)}
                        alt={att.fileName}
                        fill
                        sizes="(min-width: 640px) 16vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              ) : null;
              })()}
              {/* Document List */}
              {section.attachments.filter(a => a.fileType !== 'image').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {section.attachments.filter(a => a.fileType !== 'image').map((att) => (
                    <a
                      key={getId(att)}
                      href={storage.getFileUrl(att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--hm-bg-page)] border border-[var(--hm-border)] hover:border-[var(--hm-brand-500)] transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-[var(--hm-fg-muted)] group-hover:text-[var(--hm-brand-500)]" />
                      <span className="text-xs text-[var(--hm-fg-primary)] truncate max-w-[120px]">{att.fileName}</span>
                      <ExternalLink className="w-3 h-3 text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {section.items.length === 0 && (!section.attachments || section.attachments.length === 0) ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[var(--hm-fg-muted)]">
                {t('projects.noItemsInThisSection')}
              </p>
            </div>
          ) : section.items.length > 0 ? (
            <div className="divide-y divide-[var(--hm-border)]">
              {section.items.map((item) => (
                <ItemRow
                  key={getId(item)}
                  item={item}
                  locale={locale}
                  isClient={isClient}
                  user={user}
                  onDelete={() => onDeleteItem(getId(item))}
                  onReaction={(type) => onReaction(getId(item), type)}
                  isCommentActive={activeCommentItem === getId(item)}
                  onToggleComment={() => setActiveCommentItem(activeCommentItem === getId(item) ? null : getId(item))}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onAddComment={() => onAddComment(getId(item))}
                />
              ))}
            </div>
          ) : null}

          {/* Add Item Button */}
          {!isClient && (
            <div className="px-4 py-3 bg-[var(--hm-bg-tertiary)]/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddItem}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                {t('projects.addItem')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Item Row Component
function ItemRow({
  item,
  locale,
  isClient,
  user,
  onDelete,
  onReaction,
  isCommentActive,
  onToggleComment,
  commentText,
  setCommentText,
  onAddComment,
}: {
  item: WorkspaceItem;
  locale: string;
  isClient: boolean;
  user: WorkspaceUser | null;
  onDelete: () => void;
  onReaction: (type: 'like' | 'love' | 'approved') => void;
  isCommentActive: boolean;
  onToggleComment: () => void;
  commentText: string;
  setCommentText: (text: string) => void;
  onAddComment: () => void;
}) {
  const { t } = useLanguage();
  const userReaction = item.reactions?.find(r => r.userId === user?.id);

  const getItemIcon = () => {
    switch (item.type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'link': return <LinkIcon className="w-4 h-4" />;
      case 'product': return <ShoppingBag className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const isImage = item.type === 'image' || (item.fileUrl && item.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i));

  return (
    <div className="px-4 py-3 hover:bg-[var(--hm-bg-tertiary)]/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Thumbnail or Icon */}
        <div className="relative w-12 h-12 rounded-lg bg-[var(--hm-bg-tertiary)] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--hm-border)]">
          {isImage && item.fileUrl ? (
            <Image
              src={storage.getFileUrl(item.fileUrl)}
              alt={item.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="text-[var(--hm-fg-muted)]">{getItemIcon()}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h5 className="text-sm font-medium text-[var(--hm-fg-primary)] truncate">
                {item.title}
              </h5>
              {item.description && (
                <p className="text-xs text-[var(--hm-fg-muted)] line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              )}
            </div>

            {!isClient && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                className="hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Product details */}
          {item.type === 'product' && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.price && (
                <span className="text-xs font-semibold text-[var(--hm-brand-500)]">
                  {item.currency || '₾'}{item.price}
                </span>
              )}
              {item.storeName && (
                <span className="text-xs text-[var(--hm-fg-muted)]">
                  @ {item.storeName}
                </span>
              )}
              {item.storeAddress && (
                <span className="text-xs text-[var(--hm-fg-muted)] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.storeAddress}
                </span>
              )}
            </div>
          )}

          {/* Link */}
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--hm-brand-500)] hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              {t('projects.openLink')}
            </a>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-2">
            {/* Reactions - Only clients can react to items */}
            {isClient ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onReaction('like')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    userReaction?.type === 'like'
                      ? 'bg-[var(--hm-info-100)] text-[var(--hm-info-500)]'
                      : 'hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  {item.reactions?.filter(r => r.type === 'like').length || 0}
                </button>
                <button
                  onClick={() => onReaction('love')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    userReaction?.type === 'love'
                      ? 'bg-[var(--hm-error-100)] text-[var(--hm-error-500)]'
                      : 'hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                  }`}
                >
                  <Heart className="w-3 h-3" />
                  {item.reactions?.filter(r => r.type === 'love').length || 0}
                </button>
                <button
                  onClick={() => onReaction('approved')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    userReaction?.type === 'approved'
                      ? 'bg-[var(--hm-success-50)] text-[var(--hm-success-500)]'
                      : 'hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
                  }`}
                >
                  ✓
                  {item.reactions?.filter(r => r.type === 'approved').length || 0}
                </button>
              </div>
            ) : (
              /* Pro can see reaction counts but not interact */
              <div className="flex items-center gap-1 opacity-60">
                {(item.reactions?.filter(r => r.type === 'like').length || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--hm-info-500)]">
                    <ThumbsUp className="w-3 h-3" />
                    {item.reactions?.filter(r => r.type === 'like').length}
                  </span>
                )}
                {(item.reactions?.filter(r => r.type === 'love').length || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--hm-error-500)]">
                    <Heart className="w-3 h-3" />
                    {item.reactions?.filter(r => r.type === 'love').length}
                  </span>
                )}
                {(item.reactions?.filter(r => r.type === 'approved').length || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[var(--hm-success-500)]">
                    ✓ {item.reactions?.filter(r => r.type === 'approved').length}
                  </span>
                )}
              </div>
            )}

            {/* Comment toggle */}
            <button
              onClick={onToggleComment}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                isCommentActive
                  ? 'bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]'
                  : 'hover:bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              {item.comments?.length || 0}
            </button>
          </div>

          {/* Comments Section */}
          {isCommentActive && (
            <div className="mt-3 pt-3 border-t border-[var(--hm-border)]">
              {/* Existing Comments */}
              {item.comments?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {item.comments.map((comment) => (
                    <div key={getId(comment)} className="flex items-start gap-2">
                      <Avatar
                        src={comment.userAvatar}
                        name={comment.userName}
                        size="xs"
                        className="w-6 h-6 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-[var(--hm-fg-primary)]">
                            {comment.userName}
                          </span>
                          <span className="text-[10px] text-[var(--hm-fg-muted)]">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--hm-fg-secondary)] mt-0.5">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
                  placeholder={t('projects.addComment')}
                  className="flex-1 text-xs"
                />
                <Button
                  size="icon-sm"
                  onClick={onAddComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Section Modal
function SectionModal({
  locale,
  section,
  isSaving,
  onClose,
  onSave,
}: {
  locale: string;
  section: WorkspaceSection | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (title: string, description?: string, attachments?: SectionAttachment[]) => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(section?.title || '');
  const [description, setDescription] = useState(section?.description || '');
  const [attachments, setAttachments] = useState<SectionAttachment[]>(section?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed file types
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
  const ALLOWED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt';

  const getFileType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'document';
    return 'other';
  };

  const isAllowedFile = (file: File): boolean => {
    // Check MIME type
    if (ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_DOC_TYPES.includes(file.type)) {
      return true;
    }
    // Fallback to extension check
    const ext = file.name.split(".").pop()?.toLowerCase() || '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];
    return allowedExts.includes(ext);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError('');
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!isAllowedFile(file)) {
          setUploadError(t('projects.onlyJpgPngWebpGif'));
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload', formData);
        const fileUrl = response.data.url || response.data.filename;

        const newAttachment: SectionAttachment = {
          _id: `temp-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileUrl,
          fileType: getFileType(file.name),
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(t('common.uploadFailed'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)]">
            {section
              ? (t('projects.editSection'))
              : (t('projects.newSection'))
            }
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('projects.title')} *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('projects.egKitchenMaterials')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('common.description')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('common.optional')}
              rows={2}
            />
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('projects.attachments')}
            </label>

            {/* Upload Error */}
            {uploadError && (
              <div className="mb-2 p-2 rounded-lg bg-[var(--hm-error-50)] text-[var(--hm-error-500)] text-xs">
                {uploadError}
              </div>
            )}

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept={ALLOWED_FILE_EXTENSIONS}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              loading={isUploading}
              leftIcon={!isUploading ? <Upload className="w-4 h-4" /> : undefined}
              className="w-full h-auto py-3 rounded-xl border-2 border-dashed border-[var(--hm-border)] bg-transparent text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-transparent"
            >
              {isUploading ? t('common.uploading') : t('projects.uploadFiles')}
            </Button>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, index) => (
                  <div
                    key={getId(att)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)]"
                  >
                    {att.fileType === 'image' ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--hm-bg-page)] flex-shrink-0">
                        <Image
                          src={storage.getFileUrl(att.fileUrl)}
                          alt={att.fileName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--hm-bg-page)] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[var(--hm-fg-muted)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--hm-fg-primary)] truncate">{att.fileName}</p>
                      {att.fileSize && (
                        <p className="text-xs text-[var(--hm-fg-muted)]">{formatFileSize(att.fileSize)}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeAttachment(index)}
                      className="flex-shrink-0 text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => title.trim() && !isSaving && onSave(title.trim(), description.trim() || undefined, attachments.length > 0 ? attachments : undefined)}
            disabled={!title.trim() || isSaving}
            loading={isSaving}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Item Modal
function ItemModal({
  locale,
  onClose,
  onSave,
}: {
  locale: string;
  onClose: () => void;
  onSave: (data: Partial<WorkspaceItem>) => void;
}) {
  const { t } = useLanguage();
  const [type, setType] = useState<'image' | 'file' | 'link' | 'product'>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allowed file types
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif';
  const ALLOWED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt';

  const isAllowedImageFile = (file: File): boolean => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return true;
    const ext = file.name.split(".").pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // Validate image files (no SVG)
    if (type === 'image' && !isAllowedImageFile(file)) {
      setUploadError(t('projects.onlyJpgPngWebpAnd'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData);
      setFileUrl(response.data.url || response.data.filename);
      if (!title) setTitle(file.name.split(".")[0]);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(t('common.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const itemData: Partial<WorkspaceItem> = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
    };

    if (type === 'image' || type === 'file') {
      itemData.fileUrl = fileUrl;
    }
    if (type === 'link') {
      itemData.linkUrl = linkUrl;
    }
    if (type === 'product') {
      itemData.fileUrl = fileUrl;
      itemData.linkUrl = linkUrl;
      itemData.price = price ? parseFloat(price) : undefined;
      itemData.storeName = storeName || undefined;
      itemData.storeAddress = storeAddress || undefined;
    }

    onSave(itemData);
  };

  const typeOptions = [
    { value: 'image', label: t('common.image'), icon: ImageIcon },
    { value: 'file', label: t('common.file'), icon: FileText },
    { value: 'link', label: t('projects.link'), icon: LinkIcon },
    { value: 'product', label: t('projects.product'), icon: ShoppingBag },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--hm-fg-primary)]">
            {t('projects.addItem')}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-2">
              {t('common.type')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value as typeof type)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      type === opt.value
                        ? 'border-[var(--hm-brand-500)] bg-[var(--hm-brand-500)]/10 text-[var(--hm-brand-500)]'
                        : 'border-[var(--hm-border)] text-[var(--hm-fg-muted)] hover:border-[var(--hm-fg-muted)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('common.title')} *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
              {t('common.description')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* File Upload for image/file/product */}
          {(type === 'image' || type === 'file' || type === 'product') && (
            <div>
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                {type === 'image' ? t('common.image') : t('common.file')}
              </label>
              {uploadError && (
                <div className="mb-2 p-2 rounded-lg bg-[var(--hm-error-50)] text-[var(--hm-error-500)] text-xs">
                  {uploadError}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept={type === 'image' ? ALLOWED_IMAGE_EXTENSIONS : ALLOWED_FILE_EXTENSIONS}
                className="hidden"
              />
              {fileUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--hm-bg-tertiary)] border border-[var(--hm-border)]">
                  {type === 'image' ? (
                    <Image src={storage.getFileUrl(fileUrl)} alt="Attachment" width={64} height={64} className="rounded-lg object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-[var(--hm-fg-muted)]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--hm-fg-primary)] truncate">{fileUrl.split("/").pop()}</p>
                    <Button
                      variant="link"
                      onClick={() => setFileUrl('')}
                      className="text-xs text-[var(--hm-error-500)] h-auto"
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  loading={isUploading}
                  leftIcon={!isUploading ? <Upload className="w-5 h-5" /> : undefined}
                  className="w-full h-auto py-8 rounded-xl border-2 border-dashed border-[var(--hm-border)] bg-transparent text-[var(--hm-fg-muted)] hover:border-[var(--hm-brand-500)] hover:text-[var(--hm-brand-500)] hover:bg-transparent"
                >
                  {!isUploading && t('projects.upload')}
                </Button>
              )}
            </div>
          )}

          {/* Link URL for link/product */}
          {(type === 'link' || type === 'product') && (
            <div>
              <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                {t('projects.url')}
              </label>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          )}

          {/* Product-specific fields */}
          {type === 'product' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                    {t('common.price')}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setPrice(value);
                      }
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                    {t('projects.store')}
                  </label>
                  <Input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--hm-fg-secondary)] mb-1.5">
                  {t('common.address')}
                </label>
                <Input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {t('common.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

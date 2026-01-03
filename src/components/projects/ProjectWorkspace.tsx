'use client';

import Avatar from '@/components/common/Avatar';
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

const ACCENT = '#C4735B';

// Types
interface WorkspaceItem {
  _id: string;
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
    _id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

interface SectionAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string; // 'image' | 'document' | 'other'
  fileSize?: number;
  uploadedAt: string;
}

interface WorkspaceSection {
  _id: string;
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
}

export default function ProjectWorkspace({ jobId, locale, isClient }: ProjectWorkspaceProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [sections, setSections] = useState<WorkspaceSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState<string | null>(null); // sectionId or null
  const [editingSection, setEditingSection] = useState<WorkspaceSection | null>(null);

  // Comment state
  const [activeCommentItem, setActiveCommentItem] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Fetch workspace data
  const fetchWorkspace = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/jobs/projects/${jobId}/workspace`);
      setSections(response.data.sections || []);
      setHasLoaded(true);
    } catch (error: any) {
      // If 404, workspace doesn't exist yet - that's ok
      if (error.response?.status !== 404) {
        console.error('Failed to fetch workspace:', error);
      }
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      fetchWorkspace();
    }
  }, [isExpanded, hasLoaded, fetchWorkspace]);

  // Section CRUD
  const handleCreateSection = async (title: string, description?: string, attachments?: SectionAttachment[]) => {
    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections`, {
        title,
        description,
        attachments: attachments || [],
      });
      setSections(prev => [...prev, { ...response.data.section, isExpanded: true }]);
      setShowSectionModal(false);
      toast.success(
        locale === 'ka' ? 'სექცია შეიქმნა' : 'Section created',
        locale === 'ka' ? 'ახალი სექცია დაემატა' : 'New section has been added'
      );
    } catch (error) {
      toast.error(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'სექციის შექმნა ვერ მოხერხდა' : 'Failed to create section'
      );
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
        s._id === sectionId ? { ...s, title, description, attachments: response.data.section?.attachments || s.attachments } : s
      ));
      setEditingSection(null);
      toast.success(locale === 'ka' ? 'შენახულია' : 'Saved');
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm(locale === 'ka' ? 'წაშალოთ ეს სექცია?' : 'Delete this section?')) return;

    try {
      await api.delete(`/jobs/projects/${jobId}/workspace/sections/${sectionId}`);
      setSections(prev => prev.filter(s => s._id !== sectionId));
      toast.success(locale === 'ka' ? 'წაიშალა' : 'Deleted');
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    }
  };

  // Item CRUD
  const handleCreateItem = async (sectionId: string, itemData: Partial<WorkspaceItem>) => {
    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items`, itemData);
      setSections(prev => prev.map(s =>
        s._id === sectionId
          ? { ...s, items: [...s.items, response.data.item] }
          : s
      ));
      setShowItemModal(null);
      toast.success(locale === 'ka' ? 'დაემატა' : 'Added');
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    }
  };

  const handleDeleteItem = async (sectionId: string, itemId: string) => {
    try {
      await api.delete(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items/${itemId}`);
      setSections(prev => prev.map(s =>
        s._id === sectionId
          ? { ...s, items: s.items.filter(i => i._id !== itemId) }
          : s
      ));
      toast.success(locale === 'ka' ? 'წაიშალა' : 'Deleted');
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    }
  };

  // Reactions
  const handleReaction = async (sectionId: string, itemId: string, type: 'like' | 'love' | 'approved') => {
    try {
      const response = await api.post(`/jobs/projects/${jobId}/workspace/sections/${sectionId}/items/${itemId}/reactions`, { type });
      setSections(prev => prev.map(s =>
        s._id === sectionId
          ? {
              ...s,
              items: s.items.map(i =>
                i._id === itemId ? { ...i, reactions: response.data.reactions } : i
              )
            }
          : s
      ));
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
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
        s._id === sectionId
          ? {
              ...s,
              items: s.items.map(i =>
                i._id === itemId ? { ...i, comments: response.data.comments } : i
              )
            }
          : s
      ));
      setCommentText('');
    } catch (error) {
      toast.error(locale === 'ka' ? 'შეცდომა' : 'Error');
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s =>
      s._id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="border-t border-[var(--color-border)]">
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)]">
            <FolderPlus className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {locale === 'ka' ? 'პროექტის მასალები' : 'Project Materials'}
            </span>
            {totalItems > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                {totalItems}
              </span>
            )}
          </div>
          {sections.length > 0 && (
            <span className="text-xs text-[var(--color-text-tertiary)] hidden sm:inline">
              {sections.length} {locale === 'ka' ? 'სექცია' : 'sections'}
            </span>
          )}
        </div>
        <ChevronRight
          className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-[var(--color-bg-tertiary)]/30 rounded-2xl border border-[var(--color-border)] overflow-hidden">
            {/* Toolbar */}
            {!isClient && (
              <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                <button
                  onClick={() => setShowSectionModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Plus className="w-4 h-4" />
                  {locale === 'ka' ? 'სექციის დამატება' : 'Add Section'}
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
                </div>
              ) : sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-tertiary)]">
                  <FolderPlus className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm font-medium">{locale === 'ka' ? 'ჯერ არ არის მასალები' : 'No materials yet'}</p>
                  <p className="text-xs mt-1">
                    {isClient
                      ? (locale === 'ka' ? 'პროფესიონალი დაამატებს მასალებს' : 'Professional will add materials here')
                      : (locale === 'ka' ? 'დაამატე სექციები პროექტის მასალებისთვის' : 'Add sections to organize project materials')
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section) => (
                    <SectionCard
                      key={section._id}
                      section={section}
                      locale={locale}
                      isClient={isClient}
                      user={user}
                      onToggle={() => toggleSection(section._id)}
                      onEdit={() => setEditingSection(section)}
                      onDelete={() => handleDeleteSection(section._id)}
                      onAddItem={() => setShowItemModal(section._id)}
                      onDeleteItem={(itemId) => handleDeleteItem(section._id, itemId)}
                      onReaction={(itemId, type) => handleReaction(section._id, itemId, type)}
                      activeCommentItem={activeCommentItem}
                      setActiveCommentItem={setActiveCommentItem}
                      commentText={commentText}
                      setCommentText={setCommentText}
                      onAddComment={(itemId) => handleAddComment(section._id, itemId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {(showSectionModal || editingSection) && (
        <SectionModal
          locale={locale}
          section={editingSection}
          onClose={() => {
            setShowSectionModal(false);
            setEditingSection(null);
          }}
          onSave={(title, description, attachments) => {
            if (editingSection) {
              handleUpdateSection(editingSection._id, title, description, attachments);
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
}: {
  section: WorkspaceSection;
  locale: string;
  isClient: boolean;
  user: any;
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
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
        onClick={onToggle}
      >
        <ChevronDown
          className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${section.isExpanded ? '' : '-rotate-90'}`}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {section.title}
          </h4>
          {section.description && (
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {section.attachments && section.attachments.length > 0 && (
            <span className="text-xs text-[var(--color-text-tertiary)] px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {section.attachments.length}
            </span>
          )}
          <span className="text-xs text-[var(--color-text-tertiary)] px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)]">
            {section.items.length} {locale === 'ka' ? 'ელემენტი' : 'items'}
          </span>
        </div>

        {!isClient && (
          <div className="relative z-30">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] shadow-xl py-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {locale === 'ka' ? 'რედაქტირება' : 'Edit'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {locale === 'ka' ? 'წაშლა' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Section Content */}
      {section.isExpanded && (
        <div className="border-t border-[var(--color-border)]">
          {/* Section Attachments Gallery */}
          {section.attachments && section.attachments.length > 0 && (
            <div className="p-4 bg-[var(--color-bg-tertiary)]/30 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {locale === 'ka' ? 'დანართები' : 'Attachments'} ({section.attachments.length})
                </span>
              </div>
              {/* Image Grid */}
              {section.attachments.filter(a => a.fileType === 'image').length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {section.attachments.filter(a => a.fileType === 'image').map((att) => (
                    <a
                      key={att._id}
                      href={storage.getFileUrl(att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[#E07B4F] transition-colors group"
                    >
                      <img
                        src={storage.getFileUrl(att.fileUrl)}
                        alt={att.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              )}
              {/* Document List */}
              {section.attachments.filter(a => a.fileType !== 'image').length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {section.attachments.filter(a => a.fileType !== 'image').map((att) => (
                    <a
                      key={att._id}
                      href={storage.getFileUrl(att.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[#E07B4F] transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[#E07B4F]" />
                      <span className="text-xs text-[var(--color-text-primary)] truncate max-w-[120px]">{att.fileName}</span>
                      <ExternalLink className="w-3 h-3 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {section.items.length === 0 && (!section.attachments || section.attachments.length === 0) ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {locale === 'ka' ? 'ცარიელი სექცია' : 'No items in this section'}
              </p>
            </div>
          ) : section.items.length > 0 ? (
            <div className="divide-y divide-[var(--color-border)]">
              {section.items.map((item) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  locale={locale}
                  isClient={isClient}
                  user={user}
                  onDelete={() => onDeleteItem(item._id)}
                  onReaction={(type) => onReaction(item._id, type)}
                  isCommentActive={activeCommentItem === item._id}
                  onToggleComment={() => setActiveCommentItem(activeCommentItem === item._id ? null : item._id)}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onAddComment={() => onAddComment(item._id)}
                />
              ))}
            </div>
          ) : null}

          {/* Add Item Button */}
          {!isClient && (
            <div className="px-4 py-3 bg-[var(--color-bg-tertiary)]/30">
              <button
                onClick={onAddItem}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {locale === 'ka' ? 'ელემენტის დამატება' : 'Add item'}
              </button>
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
  user: any;
  onDelete: () => void;
  onReaction: (type: 'like' | 'love' | 'approved') => void;
  isCommentActive: boolean;
  onToggleComment: () => void;
  commentText: string;
  setCommentText: (text: string) => void;
  onAddComment: () => void;
}) {
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
    <div className="px-4 py-3 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Thumbnail or Icon */}
        <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--color-border)]">
          {isImage && item.fileUrl ? (
            <img
              src={storage.getFileUrl(item.fileUrl)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[var(--color-text-tertiary)]">{getItemIcon()}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h5 className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {item.title}
              </h5>
              {item.description && (
                <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              )}
            </div>

            {!isClient && (
              <button
                onClick={onDelete}
                className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product details */}
          {item.type === 'product' && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {item.price && (
                <span className="text-xs font-semibold text-[#E07B4F]">
                  {item.currency || '₾'}{item.price}
                </span>
              )}
              {item.storeName && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  @ {item.storeName}
                </span>
              )}
              {item.storeAddress && (
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
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
              className="inline-flex items-center gap-1 text-xs text-[#E07B4F] hover:underline mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              {locale === 'ka' ? 'ბმული' : 'Open link'}
            </a>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-2">
            {/* Reactions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onReaction('like')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  userReaction?.type === 'like'
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                    : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                {item.reactions?.filter(r => r.type === 'like').length || 0}
              </button>
              <button
                onClick={() => onReaction('love')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  userReaction?.type === 'love'
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-500'
                    : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                }`}
              >
                <Heart className="w-3 h-3" />
                {item.reactions?.filter(r => r.type === 'love').length || 0}
              </button>
              <button
                onClick={() => onReaction('approved')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                  userReaction?.type === 'approved'
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-600'
                    : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                }`}
              >
                ✓
                {item.reactions?.filter(r => r.type === 'approved').length || 0}
              </button>
            </div>

            {/* Comment toggle */}
            <button
              onClick={onToggleComment}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                isCommentActive
                  ? 'bg-[#E07B4F]/10 text-[#E07B4F]'
                  : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              {item.comments?.length || 0}
            </button>
          </div>

          {/* Comments Section */}
          {isCommentActive && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              {/* Existing Comments */}
              {item.comments?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {item.comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-2">
                      <Avatar
                        src={comment.userAvatar}
                        name={comment.userName}
                        size="xs"
                        className="w-6 h-6 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-[var(--color-text-primary)]">
                            {comment.userName}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
                  placeholder={locale === 'ka' ? 'კომენტარი...' : 'Add comment...'}
                  className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#C4735B]/30"
                />
                <button
                  onClick={onAddComment}
                  disabled={!commentText.trim()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
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
  onClose,
  onSave,
}: {
  locale: string;
  section: WorkspaceSection | null;
  onClose: () => void;
  onSave: (title: string, description?: string, attachments?: SectionAttachment[]) => void;
}) {
  const [title, setTitle] = useState(section?.title || '');
  const [description, setDescription] = useState(section?.description || '');
  const [attachments, setAttachments] = useState<SectionAttachment[]>(section?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    if (imageExts.includes(ext)) return 'image';
    if (docExts.includes(ext)) return 'document';
    return 'other';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-bg-elevated)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {section
              ? (locale === 'ka' ? 'სექციის რედაქტირება' : 'Edit Section')
              : (locale === 'ka' ? 'ახალი სექცია' : 'New Section')
            }
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <X className="w-5 h-5 text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {locale === 'ka' ? 'სათაური' : 'Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ka' ? 'მაგ: სამზარეულოს მასალები' : 'e.g., Kitchen Materials'}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {locale === 'ka' ? 'აღწერა' : 'Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === 'ka' ? 'სურვილისამებრ...' : 'Optional...'}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50 resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {locale === 'ka' ? 'დანართები' : 'Attachments'}
            </label>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[#E07B4F] hover:text-[#E07B4F] transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {locale === 'ka' ? 'იტვირთება...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {locale === 'ka' ? 'ფაილების ატვირთვა' : 'Upload Files'}
                </>
              )}
            </button>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, index) => (
                  <div
                    key={att._id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]"
                  >
                    {att.fileType === 'image' ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-bg-primary)] flex-shrink-0">
                        <img
                          src={storage.getFileUrl(att.fileUrl)}
                          alt={att.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-primary)] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)] truncate">{att.fileName}</p>
                      {att.fileSize && (
                        <p className="text-xs text-[var(--color-text-tertiary)]">{formatFileSize(att.fileSize)}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          </button>
          <button
            onClick={() => title.trim() && onSave(title.trim(), description.trim() || undefined, attachments.length > 0 ? attachments : undefined)}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: ACCENT }}
          >
            {locale === 'ka' ? 'შენახვა' : 'Save'}
          </button>
        </div>
      </div>
    </div>
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
  const [type, setType] = useState<'image' | 'file' | 'link' | 'product'>('image');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData);
      setFileUrl(response.data.url || response.data.filename);
      if (!title) setTitle(file.name.split('.')[0]);
    } catch (error) {
      console.error('Upload failed:', error);
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
    { value: 'image', label: locale === 'ka' ? 'სურათი' : 'Image', icon: ImageIcon },
    { value: 'file', label: locale === 'ka' ? 'ფაილი' : 'File', icon: FileText },
    { value: 'link', label: locale === 'ka' ? 'ბმული' : 'Link', icon: LinkIcon },
    { value: 'product', label: locale === 'ka' ? 'პროდუქტი' : 'Product', icon: ShoppingBag },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--color-bg-elevated)] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {locale === 'ka' ? 'ელემენტის დამატება' : 'Add Item'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] transition-colors">
            <X className="w-5 h-5 text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              {locale === 'ka' ? 'ტიპი' : 'Type'}
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
                        ? 'border-[#E07B4F] bg-[#E07B4F]/10 text-[#E07B4F]'
                        : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-tertiary)]'
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
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {locale === 'ka' ? 'სათაური' : 'Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              {locale === 'ka' ? 'აღწერა' : 'Description'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50 resize-none"
            />
          </div>

          {/* File Upload for image/file/product */}
          {(type === 'image' || type === 'file' || type === 'product') && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                {type === 'image' ? (locale === 'ka' ? 'სურათი' : 'Image') : (locale === 'ka' ? 'ფაილი' : 'File')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept={type === 'image' ? 'image/*' : '*'}
                className="hidden"
              />
              {fileUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                  {type === 'image' ? (
                    <img src={storage.getFileUrl(fileUrl)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-[var(--color-text-tertiary)]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">{fileUrl.split('/').pop()}</p>
                    <button
                      onClick={() => setFileUrl('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {locale === 'ka' ? 'წაშლა' : 'Remove'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[#E07B4F] hover:text-[#E07B4F] transition-colors"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {locale === 'ka' ? 'ატვირთვა' : 'Upload'}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Link URL for link/product */}
          {(type === 'link' || type === 'product') && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                {locale === 'ka' ? 'ბმული' : 'URL'}
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
              />
            </div>
          )}

          {/* Product-specific fields */}
          {type === 'product' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {locale === 'ka' ? 'ფასი' : 'Price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setPrice(value);
                      }
                    }}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {locale === 'ka' ? 'მაღაზია' : 'Store'}
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                  {locale === 'ka' ? 'მისამართი' : 'Address'}
                </label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[#E07B4F]/50"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            {locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: ACCENT }}
          >
            {locale === 'ka' ? 'დამატება' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

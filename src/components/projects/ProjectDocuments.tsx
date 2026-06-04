'use client';

import FilePreviewModal, { fileKind } from '@/components/common/FilePreviewModal';
import ImageLightbox from '@/components/common/ImageLightbox';
import DocumentAnnotator from '@/components/projects/DocumentAnnotator';
import TimeAgo from '@/components/common/TimeAgo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormGroup, Input, Textarea } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/api';
import { storage } from '@/services/storage';
import {
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderOpen,
  History,
  MapPin,
  MessageSquare,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';

export interface ProjectDocVersion {
  version: number;
  url: string;
  fileType?: string;
  createdAt: string;
}

export interface ProjectDocComment {
  id: string;
  text: string;
  authorId?: string;
  authorName?: string;
  x?: number;
  y?: number;
  createdAt: string;
}

export interface ProjectDoc {
  id: string;
  name: string;
  url: string;
  fileType?: string;
  category: 'deliverable' | 'drawing' | 'permit' | 'contract' | 'moodboard' | 'other';
  phase?: string;
  engagementId?: string;
  stepId?: string;
  approvalStatus: 'none' | 'pending' | 'approved' | 'changes_requested';
  note?: string;
  version?: number;
  versions?: ProjectDocVersion[];
  comments?: ProjectDocComment[];
  createdAt: string;
}

const CATEGORIES: ProjectDoc['category'][] = [
  'drawing',
  'permit',
  'contract',
  'moodboard',
  'deliverable',
  'other',
];

const CATEGORY_LABEL_KEY: Record<ProjectDoc['category'], string> = {
  drawing: 'projects.docCatDrawing',
  permit: 'projects.docCatPermit',
  contract: 'projects.docCatContract',
  moodboard: 'projects.docCatMoodboard',
  deliverable: 'projects.docCatDeliverable',
  other: 'projects.docCatOther',
};

const APPROVAL_BADGE: Record<
  ProjectDoc['approvalStatus'],
  { key: string; variant: 'success' | 'warning' | 'danger' } | null
> = {
  none: null,
  pending: { key: 'projects.docPendingReview', variant: 'warning' },
  approved: { key: 'projects.docApproved', variant: 'success' },
  changes_requested: { key: 'projects.docChangesRequested', variant: 'danger' },
};

// 50 MB upload cap - matches the backend limit so large CAD/render files
// aren't blocked client-side.
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_LABEL = '50 MB';

function isImageDoc(d: { fileType?: string; url: string; name: string }): boolean {
  return fileKind(d) === 'image';
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileExt(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toUpperCase() : '';
}

interface ProjectDocumentsProps {
  projectId: string;
  documents: ProjectDoc[];
  canManage: boolean; // client: can approve / request changes / remove any
  onChanged: () => Promise<void> | void;
}

export default function ProjectDocuments({
  projectId,
  documents,
  canManage,
  onChanged,
}: ProjectDocumentsProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const versionFileRef = useRef<HTMLInputElement>(null);
  const versionDocIdRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<ProjectDoc['category']>('drawing');
  const [filter, setFilter] = useState<'all' | ProjectDoc['category']>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Staged file pending the upload dialog (name / category / note review).
  const [staged, setStaged] = useState<{ file: File; preview: string | null } | null>(
    null,
  );
  const [docName, setDocName] = useState('');
  const [docNote, setDocNote] = useState('');

  // Staged new-version file, pending a preview + replace confirmation.
  const [versionStaged, setVersionStaged] = useState<{
    doc: ProjectDoc;
    file: File;
    preview: string | null;
  } | null>(null);

  // Image preview lightbox for already-uploaded documents.
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(
    null,
  );
  // Non-image preview (pdf / video / audio / generic) shown in a modal.
  const [previewDoc, setPreviewDoc] = useState<ProjectDoc | null>(null);

  // Image markup: track by id so the annotator picks up fresh pins after a
  // refetch (the live doc is re-derived from `documents` on each render).
  const [annotatorDocId, setAnnotatorDocId] = useState<string | null>(null);

  // Per-document comment thread: which doc's thread is open, the draft,
  // and whether a comment post is in flight.
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const errMsg = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || t('projects.tryAgain');

  // Pick a file -> stage it and open the dialog (no immediate upload, so the
  // user can name it, categorize it, add a note, and confirm the preview).
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(
        t('projects.docTooLarge'),
        t('projects.docMaxSize', { size: MAX_LABEL }),
      );
      return;
    }
    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;
    setStaged({ file, preview });
    setDocName(file.name);
    setDocNote('');
  };

  const closeUpload = () => {
    if (staged?.preview) URL.revokeObjectURL(staged.preview);
    setStaged(null);
    setDocName('');
    setDocNote('');
  };

  const confirmUpload = async () => {
    if (!staged) return;
    const name = docName.trim();
    if (!name) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', staged.file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.post(`/projects/${projectId}/documents`, {
        name,
        url,
        fileType: staged.file.type,
        category,
        note: docNote.trim() || undefined,
      });
      await onChanged();
      toast.success(t('projects.docUploaded'));
      closeUpload();
    } catch (err) {
      toast.error(t('projects.docUploadFailed'), errMsg(err));
    } finally {
      setUploading(false);
    }
  };

  const triggerVersionUpload = (docId: string) => {
    versionDocIdRef.current = docId;
    versionFileRef.current?.click();
  };

  // Pick a new-version file -> stage it for a preview + replace confirm
  // (rather than replacing the live document immediately), so a pro can
  // see what they're about to supersede the current version with.
  const handleVersionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = versionDocIdRef.current;
    versionDocIdRef.current = null;
    if (versionFileRef.current) versionFileRef.current.value = '';
    if (!file || !docId) return;
    if (file.size > MAX_BYTES) {
      toast.error(
        t('projects.docTooLarge'),
        t('projects.docMaxSize', { size: MAX_LABEL }),
      );
      return;
    }
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;
    setVersionStaged({ doc, file, preview });
  };

  const closeVersion = () => {
    if (versionStaged?.preview) URL.revokeObjectURL(versionStaged.preview);
    setVersionStaged(null);
  };

  const confirmVersionUpload = async () => {
    if (!versionStaged) return;
    const { doc, file } = versionStaged;
    setBusyId(doc.id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/upload', fd);
      const url = (up.data.url || up.data.filename) as string;
      await api.post(`/projects/${projectId}/documents/${doc.id}/version`, {
        url,
        name: file.name,
        fileType: file.type,
      });
      await onChanged();
      toast.success(t('projects.docVersionUploaded'));
      closeVersion();
    } catch (err) {
      toast.error(t('projects.docUploadFailed'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const setApproval = async (
    docId: string,
    status: 'approved' | 'changes_requested',
  ) => {
    setBusyId(docId);
    try {
      await api.patch(`/projects/${projectId}/documents/${docId}/approval`, {
        status,
      });
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (docId: string) => {
    setBusyId(docId);
    try {
      await api.delete(`/projects/${projectId}/documents/${docId}`);
      await onChanged();
      toast.success(t('projects.docRemoved'));
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleComments = (docId: string) => {
    setCommentsOpenId((cur) => (cur === docId ? null : docId));
    setCommentDraft('');
  };

  const addComment = async (docId: string) => {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentBusy(true);
    try {
      await api.post(`/projects/${projectId}/documents/${docId}/comments`, {
        text,
        authorName: user?.name,
      });
      setCommentDraft('');
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const removeComment = async (docId: string, commentId: string) => {
    try {
      await api.delete(
        `/projects/${projectId}/documents/${docId}/comments/${commentId}`,
      );
      await onChanged();
    } catch (err) {
      toast.error(t('projects.tryAgain'), errMsg(err));
    }
  };

  const present = CATEGORIES.filter((c) =>
    documents.some((d) => d.category === c),
  );
  const filtered =
    filter === 'all' ? documents : documents.filter((d) => d.category === filter);

  // Image docs in current view, for lightbox navigation.
  const imageDocs = filtered.filter(isImageDoc);
  const openLightbox = (doc: ProjectDoc) => {
    const images = imageDocs.map((d) => storage.getFileUrl(d.url));
    const index = imageDocs.findIndex((d) => d.id === doc.id);
    setLightbox({ images, index: index < 0 ? 0 : index });
  };
  // Open a document preview: images use the gallery lightbox, everything
  // else (pdf / video / audio / generic) opens the preview modal.
  const openDoc = (doc: ProjectDoc) => {
    if (isImageDoc(doc)) openLightbox(doc);
    else setPreviewDoc(doc);
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="inline-flex items-center gap-2 text-[18px] font-bold text-[var(--hm-fg-primary)]">
          <FolderOpen className="w-5 h-5 text-[var(--hm-brand-500)]" />
          {t('projects.documentsTitle')}
        </h2>
        <Button
          size="sm"
          onClick={() => fileRef.current?.click()}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          {t('projects.upload')}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        <input
          ref={versionFileRef}
          type="file"
          className="hidden"
          onChange={handleVersionFile}
        />
      </div>

      {/* Category filter pills */}
      {present.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', ...present] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c as 'all' | ProjectDoc['category'])}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                filter === c
                  ? 'bg-[var(--hm-fg-primary)] text-[var(--hm-bg-elevated)]'
                  : 'text-[var(--hm-fg-muted)] hover:bg-[var(--hm-bg-tertiary)]'
              }`}
            >
              {c === 'all'
                ? t('projects.filterAll')
                : t(CATEGORY_LABEL_KEY[c as ProjectDoc['category']])}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 flex flex-col items-center text-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--hm-brand-500)]/[0.10] text-[var(--hm-brand-500)]">
            <FolderOpen className="w-6 h-6" />
          </span>
          <p className="text-[14px] text-[var(--hm-fg-muted)] max-w-[42ch]">
            {t('projects.docNone')}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {t('projects.upload')}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] divide-y divide-[var(--hm-border-subtle)] overflow-hidden">
          {filtered.map((doc) => {
            const badge = APPROVAL_BADGE[doc.approvalStatus];
            const busy = busyId === doc.id;
            const version = doc.version ?? 1;
            const history = doc.versions ?? [];
            const expanded = expandedId === doc.id;
            const image = isImageDoc(doc);
            // The general thread excludes pinned comments (x/y) - those live
            // in the image markup view so they aren't double-shown/counted.
            const comments = (doc.comments ?? []).filter(
              (c) => typeof c.x !== 'number' || typeof c.y !== 'number',
            );
            const commentsOpen = commentsOpenId === doc.id;
            return (
              <div key={doc.id}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Leading: image thumbnail or file icon - opens preview */}
                  <button
                    type="button"
                    onClick={() => openDoc(doc)}
                    aria-label={t('projects.docPreview')}
                    className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] flex items-center justify-center text-[var(--hm-fg-muted)] hover:opacity-90 transition-opacity"
                  >
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={storage.getOptimizedImageUrl(doc.url)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDoc(doc)}
                        className="text-[14px] font-medium text-[var(--hm-fg-primary)] truncate hover:text-[var(--hm-brand-500)] text-left"
                      >
                        {doc.name}
                      </button>
                      {version > 1 && (
                        <Badge variant="secondary" size="sm">
                          {t('projects.docVersion', { version })}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[var(--hm-fg-muted)]">
                        {t(CATEGORY_LABEL_KEY[doc.category])}
                      </span>
                      {badge && (
                        <Badge variant={badge.variant} size="sm">
                          {t(badge.key)}
                        </Badge>
                      )}
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : doc.id)
                          }
                          className="inline-flex items-center gap-0.5 text-[11px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] transition-colors"
                        >
                          <History className="w-3 h-3" />
                          {t('projects.docVersionHistory', {
                            count: history.length,
                          })}
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleComments(doc.id)}
                        className="inline-flex items-center gap-0.5 text-[11px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {t('projects.comments')}
                        {comments.length > 0 ? ` (${comments.length})` : ''}
                      </button>
                    </div>
                    {doc.note && (
                      <p className="text-[11px] text-[var(--hm-fg-muted)] mt-1 line-clamp-2">
                        {doc.note}
                      </p>
                    )}
                  </div>

                  {/* Client review actions on a pending deliverable */}
                  {canManage && doc.approvalStatus === 'pending' && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setApproval(doc.id, 'changes_requested')}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        {t('projects.requestChanges')}
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={busy}
                        onClick={() => setApproval(doc.id, 'approved')}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        {t('projects.docApprove')}
                      </Button>
                    </div>
                  )}

                  {/* Markup: pinned annotations on an image deliverable. */}
                  {image && (
                    <button
                      type="button"
                      onClick={() => setAnnotatorDocId(doc.id)}
                      aria-label={t('projects.markup')}
                      title={t('projects.markup')}
                      className="shrink-0 relative p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      {(() => {
                        const pinCount = (doc.comments ?? []).filter(
                          (c) =>
                            typeof c.x === 'number' && typeof c.y === 'number',
                        ).length;
                        return pinCount > 0 ? (
                          <span
                            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                            style={{ backgroundColor: 'var(--hm-brand-500)' }}
                          >
                            {pinCount}
                          </span>
                        ) : null;
                      })()}
                    </button>
                  )}

                  {/* Re-issue: upload a new version. Mirrors the ungated top
                      Upload; backend allows only the uploader or client. */}
                  <button
                    type="button"
                    onClick={() => triggerVersionUpload(doc.id)}
                    disabled={busy}
                    aria-label={t('projects.docNewVersion')}
                    title={t('projects.docNewVersion')}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)] hover:bg-[var(--hm-bg-tertiary)] transition-colors"
                  >
                    {busy ? (
                      <LoadingSpinner size="xs" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </button>

                  {canManage && doc.approvalStatus !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => remove(doc.id)}
                      disabled={busy}
                      aria-label={t('common.delete')}
                      className="shrink-0 p-1.5 rounded-lg text-[var(--hm-fg-muted)] hover:text-[var(--hm-error-500)] hover:bg-[var(--hm-error-50)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Prior-version history */}
                {expanded && history.length > 0 && (
                  <ul className="px-4 pb-3 pl-[68px] space-y-1">
                    {[...history]
                      .sort((a, b) => b.version - a.version)
                      .map((v) => (
                        <li key={v.version}>
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-brand-500)]"
                          >
                            {t('projects.docVersion', { version: v.version })}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      ))}
                  </ul>
                )}

                {/* Comment thread */}
                {commentsOpen && (
                  <div className="px-4 pb-3 pl-[68px] space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-[12px] text-[var(--hm-fg-muted)]">
                        {t('projects.noComments')}
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {comments.map((c) => {
                          const mine =
                            (!!user?.id && c.authorId === user.id) || canManage;
                          return (
                            <li key={c.id} className="group flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-semibold text-[var(--hm-fg-primary)]">
                                    {c.authorName || t('projects.someone')}
                                  </span>
                                  <TimeAgo
                                    isoDate={c.createdAt}
                                    variant="compact"
                                    className="text-[10px] text-[var(--hm-fg-muted)]"
                                  />
                                </div>
                                <p className="text-[12px] text-[var(--hm-fg-secondary)] whitespace-pre-wrap break-words">
                                  {c.text}
                                </p>
                              </div>
                              {mine && (
                                <button
                                  type="button"
                                  onClick={() => removeComment(doc.id, c.id)}
                                  aria-label={t('common.delete')}
                                  className="shrink-0 p-1 rounded text-[var(--hm-fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--hm-error-500)] transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {/* Add comment */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={commentsOpen ? commentDraft : ''}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addComment(doc.id);
                          }
                        }}
                        placeholder={t('projects.commentPlaceholder')}
                        className="h-9 text-[13px]"
                        maxLength={1000}
                      />
                      <Button
                        size="sm"
                        onClick={() => addComment(doc.id)}
                        disabled={commentBusy || !commentDraft.trim()}
                        aria-label={t('common.send')}
                        className="shrink-0 px-2.5"
                      >
                        {commentBusy ? (
                          <LoadingSpinner size="xs" color="white" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload dialog: preview + name + category + note before committing */}
      <Modal
        isOpen={!!staged}
        onClose={closeUpload}
        size="md"
        showCloseButton
        preventClose={uploading}
        ariaLabel={t('projects.docUploadTitle')}
      >
        <ModalHeader title={t('projects.docUploadTitle')} />
        <ModalBody>
          {staged && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] overflow-hidden flex items-center justify-center min-h-[140px]">
                {staged.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staged.preview}
                    alt=""
                    className="max-h-56 w-auto object-contain"
                  />
                ) : (
                  <div className="py-10 flex flex-col items-center gap-2 text-[var(--hm-fg-muted)]">
                    <FileText className="w-12 h-12" />
                    {fileExt(staged.file.name) && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {fileExt(staged.file.name)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* File meta */}
              <p className="text-[11px] text-[var(--hm-fg-muted)] -mt-1">
                {(staged.file.type || fileExt(staged.file.name)) + ' · '}
                {humanSize(staged.file.size)}
              </p>

              {/* Name */}
              <FormGroup label={t('projects.docNameLabel')}>
                <Input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder={t('projects.docNamePlaceholder')}
                  maxLength={120}
                />
              </FormGroup>

              {/* Category */}
              <FormGroup label={t('projects.docCategoryLabel')}>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ProjectDoc['category'])
                  }
                  className="w-full h-11 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] px-3 text-[14px] text-[var(--hm-fg-primary)] focus:outline-none focus:border-[var(--hm-brand-500)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(CATEGORY_LABEL_KEY[c])}
                    </option>
                  ))}
                </select>
              </FormGroup>

              {/* Note */}
              <FormGroup label={t('projects.docNoteLabel')} optional>
                <Textarea
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder={t('projects.docNotePlaceholder')}
                  rows={2}
                  maxLength={400}
                />
              </FormGroup>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={closeUpload} disabled={uploading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={confirmUpload}
            disabled={uploading || !docName.trim()}
            leftIcon={
              uploading ? (
                <LoadingSpinner size="xs" color="white" />
              ) : (
                <Upload className="w-4 h-4" />
              )
            }
          >
            {t('projects.upload')}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Image preview lightbox */}
      {lightbox && (
        <ImageLightbox
          isOpen
          onClose={() => setLightbox(null)}
          images={lightbox.images}
          initialIndex={lightbox.index}
          ariaLabel={t('projects.documentsTitle')}
        />
      )}

      {/* Generic preview for non-image docs (pdf / video / audio inline,
          graceful open/download fallback for the rest). */}
      <FilePreviewModal
        file={
          previewDoc
            ? { name: previewDoc.name, url: previewDoc.url, fileType: previewDoc.fileType }
            : null
        }
        onClose={() => setPreviewDoc(null)}
      />

      {/* Image markup. Re-derive the live doc from `documents` so pins
          refresh after each add/delete. */}
      {(() => {
        const annotatorDoc = annotatorDocId
          ? documents.find((d) => d.id === annotatorDocId)
          : null;
        if (!annotatorDoc) return null;
        return (
          <DocumentAnnotator
            projectId={projectId}
            doc={annotatorDoc}
            canManage={canManage}
            onChanged={onChanged}
            onClose={() => setAnnotatorDocId(null)}
          />
        );
      })()}

      {/* New-version confirm: preview the incoming file before it replaces
          the current version (which needs fresh client sign-off). */}
      <Modal
        isOpen={!!versionStaged}
        onClose={closeVersion}
        size="md"
        showCloseButton
        preventClose={!!versionStaged && busyId === versionStaged.doc.id}
        ariaLabel={t('projects.docNewVersion')}
      >
        {versionStaged && (
          <>
            <ModalHeader title={t('projects.docNewVersion')} />
            <ModalBody>
              <div className="space-y-3">
                <p className="text-[13px] text-[var(--hm-fg-secondary)]">
                  {t('projects.docVersionReplace', {
                    name: versionStaged.doc.name,
                    version: (versionStaged.doc.version ?? 1) + 1,
                  })}
                </p>
                <div className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] overflow-hidden flex items-center justify-center min-h-[120px]">
                  {versionStaged.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={versionStaged.preview}
                      alt=""
                      className="max-h-48 w-auto object-contain"
                    />
                  ) : (
                    <div className="py-8 flex flex-col items-center gap-2 text-[var(--hm-fg-muted)]">
                      <FileText className="w-10 h-10" />
                      {fileExt(versionStaged.file.name) && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          {fileExt(versionStaged.file.name)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[var(--hm-fg-muted)]">
                  {versionStaged.file.name} ·{' '}
                  {humanSize(versionStaged.file.size)}
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={closeVersion}
                disabled={busyId === versionStaged.doc.id}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={confirmVersionUpload}
                disabled={busyId === versionStaged.doc.id}
                leftIcon={
                  busyId === versionStaged.doc.id ? (
                    <LoadingSpinner size="xs" color="white" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )
                }
              >
                {t('projects.upload')}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </section>
  );
}

"use client";

import Avatar from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import {
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  MessageCircle,
  Paperclip,
  Phone,
  Play,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import PollsTab from "@/components/polls/PollsTab";
import ProjectWorkspace from "@/components/projects/ProjectWorkspace";

// Homico Terracotta Color Palette - Light & Fresh
const TERRACOTTA = {
  primary: "#C4735B",                    // Main terracotta
  light: "#E8A593",                      // Soft peachy light
  warm: "#F5DCD4",                       // Very soft warm pink
  bg: "#FDF8F6",                         // Nearly white with warm tint
  accent: "#D98B74",                     // Slightly brighter accent
};

export type ProjectStage =
  | "hired"
  | "started"
  | "in_progress"
  | "review"
  | "completed";

interface ProjectMessage {
  _id?: string;
  senderId: string | { _id: string; name: string; avatar?: string };
  senderName?: string;
  senderAvatar?: string;
  senderRole?: "client" | "pro";
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface ProjectComment {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: "client" | "pro";
  content: string;
  createdAt: string;
}

interface ProjectAttachment {
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  description?: string;
  uploadedAt: string;
}

interface ProjectTracking {
  _id: string;
  jobId: string;
  clientId: { _id: string; name: string; avatar?: string };
  proId: {
    _id: string;
    name: string;
    avatar?: string;
    phone?: string;
    title?: string;
  };
  currentStage: ProjectStage;
  progress: number;
  hiredAt: string;
  startedAt?: string;
  expectedEndDate?: string;
  completedAt?: string;
  comments: ProjectComment[];
  attachments: ProjectAttachment[];
  agreedPrice?: number;
  estimatedDuration?: number;
  estimatedDurationUnit?: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  images: string[];
  media: { type: string; url: string }[];
  budgetType: string;
  budgetAmount?: number;
  budgetMin?: number;
  budgetMax?: number;
}

interface ProjectTrackerCardProps {
  job: Job;
  project: ProjectTracking;
  isClient: boolean;
  locale: string;
  onRefresh?: () => void;
}

const STAGES: {
  key: ProjectStage;
  label: string;
  labelKa: string;
  icon: React.ReactNode;
  progress: number;
}[] = [
  { key: "hired", label: "Hired", labelKa: "დაქირავებული", icon: <Check className="w-3.5 h-3.5" />, progress: 10 },
  { key: "started", label: "Started", labelKa: "დაწყებული", icon: <Play className="w-3.5 h-3.5" />, progress: 25 },
  { key: "in_progress", label: "In Progress", labelKa: "მიმდინარე", icon: <Clock className="w-3.5 h-3.5" />, progress: 50 },
  { key: "review", label: "Review", labelKa: "შემოწმება", icon: <Eye className="w-3.5 h-3.5" />, progress: 75 },
  { key: "completed", label: "Done", labelKa: "დასრულებული", icon: <CheckCircle2 className="w-3.5 h-3.5" />, progress: 100 },
];

type TabKey = "overview" | "chat" | "polls" | "materials";

function getStageIndex(stage: ProjectStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getSenderId(senderId: string | { _id: string }): string {
  if (typeof senderId === "string") return senderId;
  return senderId._id;
}

// Inline Stage Stepper Component - Clean & Intuitive
function InlineStageStepper({
  currentStage,
  locale,
  isPro,
  isUpdating,
  onStageChange,
}: {
  currentStage: ProjectStage;
  locale: string;
  isPro: boolean;
  isUpdating: boolean;
  onStageChange: (stage: ProjectStage) => void;
}) {
  const currentIndex = getStageIndex(currentStage);
  const progress = STAGES[currentIndex]?.progress || 0;

  return (
    <div className="p-4">
      {/* Progress Bar - Clean and prominent */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {locale === "ka" ? STAGES[currentIndex]?.labelKa : STAGES[currentIndex]?.label}
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: TERRACOTTA.primary }}
          >
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: TERRACOTTA.primary,
            }}
          />
        </div>
      </div>

      {/* Stage Pills - Scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isNext = index === currentIndex + 1;
          const canAdvance = isPro && isNext && !isUpdating;

          return (
            <button
              key={stage.key}
              onClick={() => canAdvance && onStageChange(stage.key)}
              disabled={!canAdvance}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${isCompleted
                  ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : isCurrent
                    ? 'text-white shadow-sm'
                    : canAdvance
                      ? 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-2 border-dashed hover:border-solid cursor-pointer'
                      : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500'
                }
              `}
              style={{
                backgroundColor: isCurrent ? TERRACOTTA.primary : undefined,
                borderColor: canAdvance ? TERRACOTTA.light : undefined,
              }}
            >
              {isUpdating && isCurrent ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isCompleted ? (
                <Check className="w-3 h-3" />
              ) : (
                stage.icon
              )}
              <span>{locale === "ka" ? stage.labelKa : stage.label}</span>
              {canAdvance && (
                <ChevronRight className="w-3 h-3 ml-0.5" style={{ color: TERRACOTTA.primary }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200
        ${active
          ? ''
          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
        }
      `}
      style={{ color: active ? TERRACOTTA.primary : undefined }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1"
          style={{ backgroundColor: TERRACOTTA.primary }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {/* Active indicator */}
      {active && (
        <div
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
          style={{ backgroundColor: TERRACOTTA.primary }}
        />
      )}
    </button>
  );
}

export default function ProjectTrackerCard({
  job,
  project,
  isClient,
  locale,
  onRefresh,
}: ProjectTrackerCardProps) {
  const { user } = useAuth();
  const toast = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Chat state
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesLoadedRef = useRef(false);

  // Local state for optimistic updates
  const [localStage, setLocalStage] = useState<ProjectStage>(project.currentStage);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const currentStageIndex = getStageIndex(localStage);
  const firstImage = job.media?.[0]?.url || job.images?.[0];
  const partnerName = isClient ? project.proId?.name : project.clientId?.name;
  const partnerAvatar = isClient ? project.proId?.avatar : project.clientId?.avatar;
  const partnerTitle = isClient ? project.proId?.title : undefined;
  const partnerPhone = isClient ? project.proId?.phone : undefined;

  // Fetch messages when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat' && !messagesLoadedRef.current) {
      fetchMessages();
    }
  }, [activeTab]);

  // WebSocket connection for chat
  useEffect(() => {
    if (activeTab !== 'chat' || !user) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const backendUrl = apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;

    socketRef.current = io(`${backendUrl}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("joinProjectChat", job._id);
    });

    socketRef.current.on("projectMessage", handleNewMessage);
    socketRef.current.on("projectTyping", handleTyping);

    return () => {
      socketRef.current?.emit("leaveProjectChat", job._id);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [activeTab, user, job._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === 'chat' && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, activeTab]);

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/jobs/projects/${job._id}/messages`);
      setMessages(response.data.messages || []);
      messagesLoadedRef.current = true;
    } catch (error) {
      if (project.comments?.length) {
        const legacyMessages: ProjectMessage[] = project.comments.map((c, idx) => ({
          _id: `legacy-${idx}`,
          senderId: c.userId,
          senderName: c.userName,
          senderAvatar: c.userAvatar,
          senderRole: c.userRole,
          content: c.content,
          createdAt: c.createdAt,
        }));
        setMessages(legacyMessages);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewMessage = useCallback((message: ProjectMessage) => {
    const senderId = getSenderId(message.senderId);
    if (senderId === user?.id) return;

    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, [user?.id]);

  const handleTyping = useCallback(({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
    if (userId !== user?.id) {
      setOtherUserTyping(typing);
    }
  }, [user?.id]);

  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("projectTyping", { jobId: job._id, isTyping: true });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("projectTyping", { jobId: job._id, isTyping: false });
    }, 2000);
  }, [job._id, isTyping]);

  const handleSendMessage = async (attachments?: string[]) => {
    const messageContent = newMessage.trim();
    const hasContent = messageContent.length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if ((!hasContent && !hasAttachments) || isSubmitting || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ProjectMessage = {
      _id: tempId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: isClient ? "client" : "pro",
      content: messageContent,
      attachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      setIsSubmitting(true);
      const response = await api.post(`/jobs/projects/${job._id}/messages`, {
        content: messageContent || "",
        attachments: hasAttachments ? attachments : undefined,
      });

      if (response.data?.message) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? response.data.message : m)));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setNewMessage(messageContent);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "შეტყობინება ვერ გაიგზავნა" : "Failed to send message"
      );
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await api.post("/upload", formData);
      const fileUrl = uploadResponse.data.url || uploadResponse.data.filename;
      await handleSendMessage([fileUrl]);
    } catch (err) {
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "ფაილი ვერ აიტვირთა" : "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleStageChange = async (newStage: ProjectStage) => {
    const previousStage = localStage;

    setLocalStage(newStage);
    setIsUpdatingStage(true);

    try {
      await api.patch(`/jobs/projects/${job._id}/stage`, { stage: newStage });
      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        locale === "ka" ? "სტატუსი განახლდა" : "Stage updated"
      );
    } catch (err) {
      setLocalStage(previousStage);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "სტატუსი ვერ განახლდა" : "Failed to update stage"
      );
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Tab content renderers
  const renderOverviewTab = () => (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Project Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Started */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {locale === "ka" ? "დაწყება" : "Started"}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {project.startedAt ? formatDate(project.startedAt, locale) : formatDate(project.hiredAt, locale)}
          </span>
        </div>

        {/* Due Date */}
        <div className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2 mb-2 text-neutral-500 dark:text-neutral-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              {locale === "ka" ? "ვადა" : "Due"}
            </span>
          </div>
          <span className="text-lg font-semibold text-neutral-900 dark:text-white">
            {project.expectedEndDate
              ? formatDate(project.expectedEndDate, locale)
              : project.estimatedDuration
                ? `${project.estimatedDuration} ${project.estimatedDurationUnit || "days"}`
                : "—"}
          </span>
        </div>
      </div>

      {/* Budget - Clean with terracotta accent */}
      {(project.agreedPrice || job.budgetAmount || (job.budgetMin && job.budgetMax)) && (
        <div
          className="rounded-xl p-4 border-2"
          style={{
            borderColor: TERRACOTTA.warm,
            backgroundColor: TERRACOTTA.bg,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              {locale === "ka" ? "შეთანხმებული თანხა" : "Agreed Budget"}
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: TERRACOTTA.primary }}
            >
              {project.agreedPrice
                ? `₾${project.agreedPrice.toLocaleString()}`
                : job.budgetAmount
                  ? `₾${job.budgetAmount.toLocaleString()}`
                  : `₾${job.budgetMin?.toLocaleString()}-${job.budgetMax?.toLocaleString()}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="flex flex-col h-[380px] sm:h-[420px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-800/30">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: TERRACOTTA.primary }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {locale === "ka" ? "ჯერ არ არის შეტყობინება" : "No messages yet"}
            </p>
            <p className="text-xs mt-1">
              {locale === "ka" ? "დაიწყე საუბარი" : "Start the conversation"}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const senderId = getSenderId(msg.senderId);
              const isMine = senderId === user?.id;
              const senderName = msg.senderName || (typeof msg.senderId === "object" ? msg.senderId.name : "");
              const senderAvatar = msg.senderAvatar || (typeof msg.senderId === "object" ? msg.senderId.avatar : undefined);

              return (
                <div key={msg._id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}>
                    {!isMine && (
                      <Avatar src={senderAvatar} name={senderName} size="sm" className="w-7 h-7 flex-shrink-0" />
                    )}
                    <div>
                      {/* Attachments */}
                      {msg.attachments?.map((attachment, aIdx) => {
                        const isImage = attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                          attachment.includes("/image/upload/") ||
                          (attachment.includes("cloudinary") && !attachment.includes("/raw/"));

                        return (
                          <div key={aIdx} className="mb-1">
                            {isImage ? (
                              <a href={storage.getFileUrl(attachment)} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={storage.getFileUrl(attachment)}
                                  alt=""
                                  className="max-w-[200px] rounded-xl border border-neutral-200 dark:border-neutral-700"
                                />
                              </a>
                            ) : (
                              <a
                                href={storage.getFileUrl(attachment)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-700 rounded-xl border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                              >
                                <FileText className="w-4 h-4 text-neutral-500" />
                                <span className="text-xs truncate max-w-[120px]">{attachment.split("/").pop()}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}

                      {/* Message bubble */}
                      {msg.content && (
                        <div
                          className={`
                            px-4 py-2.5 rounded-2xl
                            ${isMine
                              ? "rounded-br-md text-white"
                              : "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-bl-md shadow-sm"
                            }
                          `}
                          style={isMine ? { backgroundColor: TERRACOTTA.primary } : {}}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-neutral-400"}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 px-3 py-2 bg-white dark:bg-neutral-700 rounded-2xl rounded-bl-md shadow-sm">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: TERRACOTTA.primary, animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            style={{ color: isUploading ? undefined : TERRACOTTA.primary }}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              emitTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={locale === "ka" ? "დაწერე შეტყობინება..." : "Type a message..."}
            className="flex-1 px-4 py-2.5 text-sm bg-neutral-100 dark:bg-neutral-800 border-0 rounded-full focus:outline-none focus:ring-2 text-neutral-900 dark:text-white placeholder:text-neutral-400"
            style={{ "--tw-ring-color": TERRACOTTA.primary } as React.CSSProperties}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim() || isSubmitting}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: TERRACOTTA.primary }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPollsTab = () => (
    <div className="p-4">
      <PollsTab
        jobId={job._id}
        isPro={!isClient}
        isClient={isClient}
        userId={user?.id}
        locale={locale}
        embedded
      />
    </div>
  );

  const renderMaterialsTab = () => (
    <div className="p-4">
      <ProjectWorkspace
        jobId={job._id}
        locale={locale}
        isClient={isClient}
        embedded
      />
    </div>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Header with Hero */}
      <div className="relative">
        {/* Background Image */}
        <div className="h-20 sm:h-24 relative overflow-hidden">
          {firstImage ? (
            <img src={storage.getFileUrl(firstImage)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${TERRACOTTA.primary} 0%, ${TERRACOTTA.light} 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
        </div>

        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              #{job._id.slice(-6).toUpperCase()}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white line-clamp-1">{job.title}</h3>
        </div>
      </div>

      {/* Inline Stage Stepper - Clean design */}
      <div className="border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <InlineStageStepper
          currentStage={localStage}
          locale={locale}
          isPro={!isClient}
          isUpdating={isUpdatingStage}
          onStageChange={handleStageChange}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-around border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          icon={<Eye className="w-4 h-4" />}
          label={locale === "ka" ? "მიმოხილვა" : "Overview"}
        />
        <TabButton
          active={activeTab === "chat"}
          onClick={() => setActiveTab("chat")}
          icon={<MessageCircle className="w-4 h-4" />}
          label={locale === "ka" ? "ჩატი" : "Chat"}
          badge={messages.length}
        />
        <TabButton
          active={activeTab === "polls"}
          onClick={() => setActiveTab("polls")}
          icon={<BarChart3 className="w-4 h-4" />}
          label={locale === "ka" ? "გამოკითხვები" : "Polls"}
        />
        <TabButton
          active={activeTab === "materials"}
          onClick={() => setActiveTab("materials")}
          icon={<FolderOpen className="w-4 h-4" />}
          label={locale === "ka" ? "მასალები" : "Materials"}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[180px]">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "polls" && renderPollsTab()}
        {activeTab === "materials" && renderMaterialsTab()}
      </div>

      {/* Bottom Action Bar - Partner Info + Actions */}
      <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Partner Info */}
          <Link
            href={isClient ? `/professionals/${project.proId?._id}` : `/users/${project.clientId?._id}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={partnerAvatar}
              name={partnerName}
              size="md"
              className="w-10 h-10 ring-2 ring-neutral-100 dark:ring-neutral-700"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {partnerName}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {isClient
                  ? (partnerTitle || (locale === 'ka' ? 'სპეციალისტი' : 'Professional'))
                  : (locale === 'ka' ? 'კლიენტი' : 'Client')
                }
              </p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {isClient && partnerPhone && (
              <a
                href={`tel:${partnerPhone}`}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                style={{ color: TERRACOTTA.primary }}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <Link
              href={`/jobs/${job._id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: TERRACOTTA.primary }}
            >
              {locale === "ka" ? "დეტალები" : "Details"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

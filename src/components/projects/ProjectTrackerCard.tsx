"use client";

import Avatar from "@/components/common/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { storage } from "@/services/storage";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Paperclip,
  Play,
  Send,
  X
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Terracotta palette
const ACCENT = "#C4735B";
const ACCENT_LIGHT = "#D4897A";
const ACCENT_DARK = "#A85D4A";

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

// Legacy comment interface for backwards compatibility
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
}[] = [
  {
    key: "hired",
    label: "Hired",
    labelKa: "დაქირავებული",
    icon: <Check className="w-3.5 h-3.5" />,
  },
  {
    key: "started",
    label: "Started",
    labelKa: "დაწყებული",
    icon: <Play className="w-3.5 h-3.5" />,
  },
  {
    key: "in_progress",
    label: "In Progress",
    labelKa: "მიმდინარე",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    key: "review",
    label: "Review",
    labelKa: "შემოწმება",
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  {
    key: "completed",
    label: "Completed",
    labelKa: "დასრულებული",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
];

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

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === "ka") {
    if (diffMins < 60) return `${diffMins} წუთის წინ`;
    if (diffHours < 24) return `${diffHours} საათის წინ`;
    return `${diffDays} დღის წინ`;
  }

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getSenderId(senderId: string | { _id: string }): string {
  if (typeof senderId === "string") return senderId;
  return senderId._id;
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Chat state
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
  const [localStage, setLocalStage] = useState<ProjectStage>(
    project.currentStage
  );
  const [localProgress, setLocalProgress] = useState(project.progress);

  const currentStageIndex = getStageIndex(localStage);
  const firstImage = job.media?.[0]?.url || job.images?.[0];

  // Get conversation partner ID
  const partnerId = isClient ? project.proId?._id : project.clientId?._id;

  // Fetch messages when expanded
  useEffect(() => {
    if (isExpanded && !messagesLoadedRef.current) {
      fetchMessages();
    }
  }, [isExpanded]);

  // WebSocket connection
  useEffect(() => {
    if (!isExpanded || !user) return;

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
      console.log("[ProjectChat] Connected to WebSocket");
      socketRef.current?.emit("joinProjectChat", job._id);
    });

    socketRef.current.on("projectMessage", handleNewMessage);
    socketRef.current.on("projectTyping", handleTyping);

    return () => {
      socketRef.current?.emit("leaveProjectChat", job._id);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isExpanded, user, job._id]);

  // Scroll to bottom when messages change - only scroll within chat container
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isExpanded]);

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/jobs/projects/${job._id}/messages`);
      setMessages(response.data.messages || []);
      messagesLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      // Fallback to comments if messages endpoint doesn't exist
      if (project.comments?.length) {
        const legacyMessages: ProjectMessage[] = project.comments.map(
          (c, idx) => ({
            _id: `legacy-${idx}`,
            senderId: c.userId,
            senderName: c.userName,
            senderAvatar: c.userAvatar,
            senderRole: c.userRole,
            content: c.content,
            createdAt: c.createdAt,
          })
        );
        setMessages(legacyMessages);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewMessage = useCallback(
    (message: ProjectMessage) => {
      const senderId = getSenderId(message.senderId);
      if (senderId === user?.id) return; // Skip own messages

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    },
    [user?.id]
  );

  const handleTyping = useCallback(
    ({ userId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (userId !== user?.id) {
        setOtherUserTyping(typing);
      }
    },
    [user?.id]
  );

  const emitTyping = useCallback(() => {
    if (!socketRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("projectTyping", {
        jobId: job._id,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("projectTyping", {
        jobId: job._id,
        isTyping: false,
      });
    }, 2000);
  }, [job._id, isTyping]);

  const handleSendMessage = async (attachments?: string[]) => {
    const messageContent = newMessage.trim();
    const hasContent = messageContent.length > 0;
    const hasAttachments = attachments && attachments.length > 0;

    if ((!hasContent && !hasAttachments) || isSubmitting || !user) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic update
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

      // Replace temp message with real one
      if (response.data?.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? response.data.message : m))
        );
      }
    } catch (err) {
      // Rollback on error
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

      // Send message with attachment
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
    const previousProgress = localProgress;

    // Calculate new progress based on stage
    const stageProgress: Record<ProjectStage, number> = {
      hired: 10,
      started: 25,
      in_progress: 50,
      review: 75,
      completed: 100,
    };

    // Optimistic update
    setLocalStage(newStage);
    setLocalProgress(stageProgress[newStage]);
    setShowStageModal(false);

    try {
      setIsSubmitting(true);
      await api.patch(`/jobs/projects/${job._id}/stage`, { stage: newStage });
      toast.success(
        locale === "ka" ? "წარმატება" : "Success",
        locale === "ka" ? "სტატუსი განახლდა" : "Stage updated"
      );
    } catch (err) {
      // Rollback on error
      setLocalStage(previousStage);
      setLocalProgress(previousProgress);
      toast.error(
        locale === "ka" ? "შეცდომა" : "Error",
        locale === "ka" ? "სტატუსი ვერ განახლდა" : "Failed to update stage"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap");

        .project-card {
          font-family: "Outfit", system-ui, sans-serif;
        }
        .project-card .font-mono {
          font-family: "Space Mono", monospace;
        }

        @keyframes progress-shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .progress-bar-shine {
          animation: progress-shine 2s ease-in-out infinite;
        }

        .stage-active::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid currentColor;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        .card-gradient {
          background: linear-gradient(
            135deg,
            rgba(196, 115, 91, 0.03) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(196, 115, 91, 0.05) 100%
          );
        }

        .timeline-dot {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timeline-dot:hover {
          transform: scale(1.2);
        }
      `}</style>

      <div className="project-card bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 transition-all duration-300 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50">
        {/* Header Section with Gradient Overlay */}
        <div className="relative">
          {/* Background Image or Color */}
          <div className="h-32 sm:h-40 relative overflow-hidden">
            {firstImage ? (
              <img
                src={storage.getFileUrl(firstImage)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                }}
              />
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {locale === "ka" ? "აქტიური პროექტი" : "Active Project"}
                  </span>
                  <span className="text-white/60 text-xs font-mono">
                    #{job._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white line-clamp-1">
                  {job.title}
                </h3>
              </div>

              {/* Assigned Pro/Client Info */}
              <Link
                href={
                  isClient
                    ? `/professionals/${project.proId?._id}`
                    : `/users/${project.clientId?._id}`
                }
                className="flex-shrink-0 flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 hover:bg-black/40 transition-colors"
              >
                <Avatar
                  src={
                    isClient ? project.proId?.avatar : project.clientId?.avatar
                  }
                  name={isClient ? project.proId?.name : project.clientId?.name}
                  size="md"
                  className="w-10 h-10 ring-2 ring-white/30"
                />
                <div className="text-right">
                  <p className="text-[10px] text-white/60 uppercase tracking-wider">
                    {isClient
                      ? locale === "ka"
                        ? "სპეციალისტი"
                        : "Assigned Pro"
                      : locale === "ka"
                        ? "კლიენტი"
                        : "Client"}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {isClient ? project.proId?.name : project.clientId?.name}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 card-gradient">
          {/* Stage Timeline */}
          <div className="relative mb-4">
            {/* Progress Line */}
            <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-neutral-200 dark:bg-neutral-700" />
            <div
              className="absolute top-3.5 left-0 h-0.5 transition-all duration-500 overflow-hidden"
              style={{
                width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                backgroundColor: ACCENT,
              }}
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent progress-bar-shine" />
            </div>

            {/* Stage Dots */}
            <div className="relative flex justify-between">
              {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isPending = index > currentStageIndex;

                return (
                  <button
                    key={stage.key}
                    onClick={() => !isClient && setShowStageModal(true)}
                    disabled={isClient}
                    className={`timeline-dot flex flex-col items-center gap-1.5 ${!isClient ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "text-white"
                          : isCurrent
                            ? "text-white stage-active"
                            : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"
                      }`}
                      style={{
                        backgroundColor:
                          isCompleted || isCurrent ? ACCENT : undefined,
                        color: isCurrent ? ACCENT : undefined,
                      }}
                    >
                      {stage.icon}
                    </div>
                    <span
                      className={`text-[10px] font-medium hidden sm:block ${
                        isCurrent
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-400"
                      }`}
                    >
                      {locale === "ka" ? stage.labelKa : stage.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${localProgress}%`, backgroundColor: ACCENT }}
              >
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent progress-bar-shine" />
              </div>
            </div>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: ACCENT }}
            >
              {localProgress}%
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
          {/* Started Date */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === "ka" ? "დაწყება" : "Started"}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
              {project.startedAt
                ? formatDate(project.startedAt, locale)
                : formatDate(project.hiredAt, locale)}
            </span>
          </div>

          {/* Expected End */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === "ka" ? "დასრულება" : "Due"}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-white">
              {project.expectedEndDate
                ? formatDate(project.expectedEndDate, locale)
                : project.estimatedDuration
                  ? `${project.estimatedDuration} ${project.estimatedDurationUnit || "days"}`
                  : "—"}
            </span>
          </div>

          {/* Agreed Price */}
          <div className="px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-neutral-400 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-medium">
                {locale === "ka" ? "თანხა" : "Budget"}
              </span>
            </div>
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: ACCENT }}
            >
              {project.agreedPrice
                ? `₾${project.agreedPrice.toLocaleString()}`
                : job.budgetAmount
                  ? `₾${job.budgetAmount.toLocaleString()}`
                  : job.budgetMin && job.budgetMax
                    ? `₾${job.budgetMin.toLocaleString()}-${job.budgetMax.toLocaleString()}`
                    : locale === "ka"
                      ? "შეთანხმებით"
                      : "TBD"}
            </span>
          </div>
        </div>

        {/* Chat Section */}
        <div className="px-4 sm:px-5 py-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${ACCENT}15` }}
              >
                <MessageSquare className="w-4 h-4" style={{ color: ACCENT }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: ACCENT }}
                >
                  {locale === "ka" ? "ჩატი" : "Chat"}
                </span>
                {messages.length > 0 && (
                  <span
                    className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {messages.length}
                  </span>
                )}
              </div>
              {messages.length > 0 && (
                <span className="text-xs text-neutral-400 hidden sm:inline">
                  {locale === "ka" ? "ბოლო:" : "Last:"}{" "}
                  {formatRelativeTime(
                    messages[messages.length - 1].createdAt,
                    locale
                  )}
                </span>
              )}
            </div>
            <ChevronRight
              className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {/* Expanded Chat */}
          {isExpanded && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              {/* Messages Container */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl overflow-hidden">
                {/* Messages Area */}
                <div className="h-64 sm:h-80 overflow-y-auto p-4 space-y-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div
                        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{
                          borderColor: ACCENT,
                          borderTopColor: "transparent",
                        }}
                      />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                      <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">
                        {locale === "ka"
                          ? "ჯერ არ არის შეტყობინება"
                          : "No messages yet"}
                      </p>
                      <p className="text-xs mt-1">
                        {locale === "ka"
                          ? "დაიწყე საუბარი"
                          : "Start the conversation"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const senderId = getSenderId(msg.senderId);
                        const isMine = senderId === user?.id;
                        const senderName =
                          msg.senderName ||
                          (typeof msg.senderId === "object"
                            ? msg.senderId.name
                            : "");
                        const senderAvatar =
                          msg.senderAvatar ||
                          (typeof msg.senderId === "object"
                            ? msg.senderId.avatar
                            : undefined);

                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`flex items-end gap-2 max-w-[80%] ${isMine ? "flex-row-reverse" : ""}`}
                            >
                              {!isMine && (
                                <Avatar
                                  src={senderAvatar}
                                  name={senderName}
                                  size="sm"
                                  className="w-7 h-7 flex-shrink-0"
                                />
                              )}
                              <div>
                                {/* Attachments */}
                                {msg.attachments?.map((attachment, aIdx) => {
                                  // Check if it's an image (handle both file extensions and Cloudinary URLs)
                                  const isImage =
                                    attachment.match(
                                      /\.(jpg|jpeg|png|gif|webp)$/i
                                    ) ||
                                    attachment.includes("/image/upload/") ||
                                    (attachment.includes("cloudinary") &&
                                      !attachment.includes("/raw/"));

                                  return (
                                    <div key={aIdx} className="mb-1">
                                      {isImage ? (
                                        <a
                                          href={storage.getFileUrl(attachment)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
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
                                          <span className="text-xs truncate max-w-[120px]">
                                            {attachment.split("/").pop()}
                                          </span>
                                        </a>
                                      )}
                                    </div>
                                  );
                                })}
                                {/* Message Content */}
                                {msg.content ? (
                                  <div
                                    className={`px-3.5 py-2 rounded-2xl ${
                                      isMine
                                        ? "rounded-br-md text-white"
                                        : "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-bl-md border border-neutral-200 dark:border-neutral-600"
                                    }`}
                                    style={
                                      isMine ? { backgroundColor: ACCENT } : {}
                                    }
                                  >
                                    <p className="text-sm leading-relaxed">
                                      {msg.content}
                                    </p>
                                    <p
                                      className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-neutral-400"}`}
                                    >
                                      {formatMessageTime(msg.createdAt)}
                                    </p>
                                  </div>
                                ) : msg.attachments?.length ? (
                                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                                    {formatMessageTime(msg.createdAt)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Typing indicator */}
                      {otherUserTyping && (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 px-3 py-2 bg-white dark:bg-neutral-700 rounded-2xl rounded-bl-md border border-neutral-200 dark:border-neutral-600">
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    {/* File Upload Button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
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

                    {/* Text Input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        emitTyping();
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSendMessage()
                      }
                      placeholder={
                        locale === "ka"
                          ? "დაწერე შეტყობინება..."
                          : "Type a message..."
                      }
                      className="flex-1 px-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1"
                      style={{ "--tw-ring-color": ACCENT } as any}
                    />

                    {/* Send Button */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!newMessage.trim() || isSubmitting}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-4 sm:px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
          <Link
            href={`/messages?conversation=${isClient ? project.proId?._id : project.clientId?._id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {locale === "ka" ? "მესიჯი" : "Message"}
          </Link>

          <Link
            href={`/jobs/${job._id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            {locale === "ka" ? "დეტალები" : "View Details"}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stage Change Modal */}
      {showStageModal && !isClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStageModal(false)}
          />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {locale === "ka" ? "სტატუსის განახლება" : "Update Stage"}
              </h3>
              <button
                onClick={() => setShowStageModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const canSelect = index > currentStageIndex || isCurrent;

                return (
                  <button
                    key={stage.key}
                    onClick={() => canSelect && handleStageChange(stage.key)}
                    disabled={!canSelect || isSubmitting}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent
                        ? "ring-2"
                        : canSelect
                          ? "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          : "opacity-50 cursor-not-allowed"
                    }`}
                    style={{
                      backgroundColor: isCurrent ? `${ACCENT}10` : undefined,
                      ["--tw-ring-color" as any]: ACCENT,
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted || isCurrent
                          ? "text-white"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400"
                      }`}
                      style={{
                        backgroundColor:
                          isCompleted || isCurrent ? ACCENT : undefined,
                      }}
                    >
                      {stage.icon}
                    </div>
                    <span
                      className={`font-medium ${
                        isCurrent
                          ? ""
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                      style={{ color: isCurrent ? ACCENT : undefined }}
                    >
                      {locale === "ka" ? stage.labelKa : stage.label}
                    </span>
                    {isCurrent && (
                      <span
                        className="ml-auto text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {locale === "ka" ? "მიმდინარე" : "Current"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

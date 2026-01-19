"use client";

import Avatar from "@/components/common/Avatar";
import Select from "@/components/common/Select";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { ProProfile } from "@/types/shared";
import {
  Briefcase,
  Check,
  ChevronDown,
  ExternalLink,
  Filter,
  Search,
  Send,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface InviteProsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  subcategory?: string;
  category?: string;
}

type SortOption = "recommended" | "rating" | "projects" | "experience";

export default function InviteProsModal({
  isOpen,
  onClose,
  jobId,
  subcategory,
  category,
}: InviteProsModalProps) {
  const { t } = useLanguage();
  const toast = useToast();

  const [pros, setPros] = useState<ProProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alreadyInvitedIds, setAlreadyInvitedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const listRef = useRef<HTMLDivElement>(null);
  const LIMIT = 15;

  // Fetch matching professionals
  const fetchPros = useCallback(async (pageNum: number, reset = false) => {
    if (!isOpen) return;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", LIMIT.toString());
      
      if (subcategory) {
        params.append("subcategory", subcategory);
      } else if (category) {
        params.append("category", category);
      }
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      if (sortBy !== "recommended") {
        params.append("sort", sortBy);
      }
      
      if (minRating > 0) {
        params.append("minRating", minRating.toString());
      }

      const response = await api.get(`/users/pros?${params.toString()}`);
      const result = response.data;
      const newPros = result.data || [];
      
      if (reset) {
        setPros(newPros);
      } else {
        setPros(prev => [...prev, ...newPros]);
      }
      
      setHasMore(newPros.length === LIMIT);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching pros:", error);
      if (reset) {
        toast.error(t("common.error"), t("job.failedToLoadPros"));
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isOpen, subcategory, category, searchQuery, sortBy, minRating, t, toast]);

  // Fetch already invited pros
  const fetchInvitedPros = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/invited-pros`).catch(() => ({ data: [] }));
      const invitedIds = new Set<string>(
        (response.data || []).map((p: { id?: string; _id?: string }) => p.id || p._id)
      );
      setAlreadyInvitedIds(invitedIds);
      setSelectedIds(new Set(invitedIds));
    } catch (error) {
      console.error("Error fetching invited pros:", error);
    }
  }, [jobId]);

  // Initial fetch
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setPros([]);
      fetchPros(1, true);
      fetchInvitedPros();
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setShowFilters(false);
      setSortBy("recommended");
      setMinRating(0);
    }
  }, [isOpen, fetchPros, fetchInvitedPros]);

  // Refetch when filters change
  useEffect(() => {
    if (isOpen && !isLoading) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchPros(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, sortBy, minRating]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!listRef.current || isLoadingMore || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchPros(page + 1, false);
    }
  }, [isLoadingMore, hasMore, page, fetchPros]);

  useEffect(() => {
    const listEl = listRef.current;
    if (listEl) {
      listEl.addEventListener("scroll", handleScroll);
      return () => listEl.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Toggle pro selection (only for non-invited pros)
  const toggleSelection = (proId: string) => {
    if (alreadyInvitedIds.has(proId)) return;
    
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(proId)) {
        newSet.delete(proId);
      } else {
        newSet.add(proId);
      }
      return newSet;
    });
  };

  // Open pro profile in new tab
  const openProProfile = (proId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/professionals/${proId}`, "_blank");
  };

  // Get count of newly selected pros (not already invited)
  const newlySelectedCount = Array.from(selectedIds).filter(
    (id) => !alreadyInvitedIds.has(id)
  ).length;

  // Send invites only to newly selected pros
  const handleSendInvites = async () => {
    const newProIds = Array.from(selectedIds).filter(
      (id) => !alreadyInvitedIds.has(id)
    );
    
    if (newProIds.length === 0) return;

    setIsSending(true);
    try {
      await api.post(`/jobs/${jobId}/invite`, {
        proIds: newProIds,
      });

      toast.success(
        t("job.invitationsSent"),
        `${newProIds.length} ${t("job.prosInvited")}`
      );

      setAlreadyInvitedIds((prev) => {
        const newSet = new Set(prev);
        newProIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      onClose();
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error(t("common.error"), t("job.failedToSendInvites"));
    } finally {
      setIsSending(false);
    }
  };

  const getProjectsCount = (pro: ProProfile) => {
    // Match the logic from ProCard - use max of all available sources
    const portfolioCount = pro.portfolioProjects?.length || 0;
    const portfolioItemCount = pro.portfolioItemCount || 0;
    const externalJobs = pro.externalCompletedJobs || 0;
    const completedProjects = typeof pro.completedProjects === 'number' ? pro.completedProjects : 0;
    const completedJobsCounter = pro.completedJobs || 0;
    
    return Math.max(completedJobsCounter, portfolioCount, portfolioItemCount, completedProjects, externalJobs);
  };

  const sortOptions = useMemo(() => [
    { value: "recommended", label: t("common.recommended") || "Recommended" },
    { value: "rating", label: t("common.rating") || "Rating" },
    { value: "projects", label: t("job.projects") || "Projects" },
    { value: "experience", label: t("common.experience") || "Experience" },
  ], [t]);

  const ratingOptions = useMemo(() => [
    { value: "0", label: t("common.all") || "All" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
    { value: "4.5", label: "4.5+" },
  ], [t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col h-[80vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t("job.invitePros")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-5 pb-3 space-y-3 border-b border-neutral-100 dark:border-neutral-800">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("job.searchByName")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4735B]/20 focus:border-[#C4735B]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters || minRating > 0 || sortBy !== "recommended"
                  ? "border-[#C4735B] bg-[#C4735B]/5 text-[#C4735B]"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">{t("common.sortBy")}:</span>
                <Select
                  options={sortOptions}
                  value={sortBy}
                  onChange={(val) => setSortBy(val as SortOption)}
                  size="sm"
                  className="min-w-[140px]"
                />
              </div>

              {/* Min Rating */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">{t("common.rating")}:</span>
                <Select
                  options={ratingOptions}
                  value={minRating.toString()}
                  onChange={(val) => setMinRating(parseFloat(val))}
                  size="sm"
                  className="min-w-[80px]"
                />
              </div>
            </div>
          )}

          {/* Selection count */}
          {newlySelectedCount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#C4735B]/10 text-[#C4735B]">
              <span className="text-sm font-medium">
                {newlySelectedCount} {t("job.selected")}
              </span>
              <button
                onClick={() => setSelectedIds(new Set(alreadyInvitedIds))}
                className="text-xs hover:underline"
              >
                {t("job.clearAll")}
              </button>
            </div>
          )}
        </div>

        {/* Pros list with infinite scroll */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-5 pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : pros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400">
                {t("job.noProsFound")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pros.map((pro) => {
                const isSelected = selectedIds.has(pro.id);
                const isAlreadyInvited = alreadyInvitedIds.has(pro.id);
                const projectsCount = getProjectsCount(pro);
                
                return (
                  <div
                    key={pro.id}
                    onClick={() => toggleSelection(pro.id)}
                    className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                      isAlreadyInvited
                        ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-default opacity-70"
                        : isSelected
                          ? "border-[#C4735B] bg-[#C4735B]/5 cursor-pointer"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer"
                    }`}
                  >
                    {/* Selection checkbox */}
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-1 transition-all ${
                        isAlreadyInvited
                          ? "bg-emerald-500 border-emerald-500"
                          : isSelected
                            ? "bg-[#C4735B] border-[#C4735B]"
                            : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {(isSelected || isAlreadyInvited) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      src={pro.avatar}
                      name={pro.name}
                      size="md"
                      className="flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                          {pro.name}
                        </h4>
                        {pro.avgRating > 0 && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-medium">
                              {pro.avgRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {isAlreadyInvited && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {t("job.invited")}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 flex-wrap">
                        {pro.city && <span>{pro.city}</span>}
                        <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                          <Briefcase className="w-3.5 h-3.5" />
                          {projectsCount} {t("job.projects")}
                        </span>
                        {pro.yearsExperience > 0 && (
                          <span>
                            {pro.yearsExperience} {t("job.years")}
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      {pro.bio && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                          {pro.bio}
                        </p>
                      )}
                    </div>

                    {/* Open profile button */}
                    <button
                      onClick={(e) => openProProfile(pro.id, e)}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-[#C4735B] transition-colors"
                      title={t("job.viewProfile")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              
              {/* End of list */}
              {!hasMore && pros.length > 0 && (
                <p className="text-center text-xs text-neutral-400 py-4">
                  {t("common.noMoreResults") || "No more results"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSendInvites}
            disabled={newlySelectedCount === 0 || isSending}
            className="gap-2"
          >
            {isSending ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t("job.invite")} ({newlySelectedCount})
          </Button>
        </div>
      </div>
    </Modal>
  );
}

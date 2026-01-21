"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import type { Job } from "@/types/shared";
import { Briefcase, Check, MapPin, Send, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface InviteProToJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  proId: string;
  proName?: string;
  initialJobs?: Job[];
}

export default function InviteProToJobModal({
  isOpen,
  onClose,
  proId,
  proName,
  initialJobs,
}: InviteProToJobModalProps) {
  const { t } = useLanguage();
  const toast = useToast();

  const [jobs, setJobs] = useState<Job[]>(initialJobs ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const hasJobs = jobs.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    // If parent passed initialJobs (even empty), treat it as authoritative.
    if (initialJobs !== undefined) {
      setJobs(initialJobs);
      setSelectedJobId(initialJobs[0]?.id || "");
      return;
    }

    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/jobs/my-jobs?status=open");
        const list = Array.isArray(response.data) ? (response.data as Job[]) : [];
        setJobs(list);
        setSelectedJobId(list[0]?.id || "");
      } catch (err) {
        console.error("Failed to fetch my jobs:", err);
        toast.error(t("common.error"), t("job.failedToLoadProjects"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [isOpen, initialJobs, t, toast]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const handleInvite = async () => {
    if (!selectedJobId) return;

    setIsSending(true);
    try {
      const res = await api.post(`/jobs/${selectedJobId}/invite`, {
        proIds: [proId],
      });

      const invitedCount =
        typeof res?.data?.invitedCount === "number" ? res.data.invitedCount : 1;

      if (invitedCount === 0) {
        toast.success(
          t("job.invitationsSent"),
          t("professional.proAlreadyInvited") || "Already invited"
        );
      } else {
        toast.success(
          t("job.invitationsSent"),
          `${proName || t("professional.title")} ${t("job.invited") || "invited"}`
        );
      }

      onClose();
    } catch (err) {
      console.error("Error inviting pro to job:", err);
      toast.error(t("common.error"), t("job.failedToSendInvites"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {t("professional.inviteToJob")}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {proName ? `${proName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
            aria-label={t("common.close") || "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : !hasJobs ? (
          <div className="py-6 space-y-3">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
              <Briefcase className="w-5 h-5" />
              <span className="text-sm font-medium">
                {initialJobs !== undefined
                  ? t("professional.noMatchingJobsToInvite")
                  : t("professional.noOpenJobsToInvite")}
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {initialJobs !== undefined
                ? t("professional.adjustJobSkillsToInvite")
                : t("professional.postJobToInvite")}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Link href="/post-job">
                <Button>{t("job.postJob") || t("common.create")}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {jobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-[#C4735B] bg-[#C4735B]/5"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-[#C4735B] border-[#C4735B]"
                            : "border-neutral-300 dark:border-neutral-600"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                          {job.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {job.location && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">{job.location}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {selectedJob ? selectedJob.title : ""}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isSending}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={!selectedJobId || isSending}
                  className="gap-2"
                >
                  {isSending ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t("job.invite")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}


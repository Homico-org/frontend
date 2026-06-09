import type { ProjectStage } from "@/types/shared";

// Single source of truth for the project lifecycle stages. Used by
// `components/jobs/ProjectStatusBar.tsx` and the job detail page's
// progress bar / timeline / event log. Previously duplicated in both
// files, which meant a stage rename or reorder needed two edits.
//
// Icon rendering stays at the call site (`renderStageIcon` below) so
// each consumer can pass the className it needs. For locale-aware
// labels prefer the i18n keys at `jobDetail.stages.<key>` (ka/en/ru
// all populated). The inline `label` / `labelKa` fields below are
// kept for legacy call sites that still use `pick(...)` for stage
// names; new code should reach for `t("jobDetail.stages.<key>")`.
export interface ProjectStageInfo {
  key: ProjectStage;
  label: string;
  labelKa: string;
  iconName: "check" | "play" | "clock" | "eye" | "check-circle-2";
  progress: number;
}

export const PROJECT_STAGES: ProjectStageInfo[] = [
  { key: "hired", label: "Hired", labelKa: "დაქირავებული", iconName: "check", progress: 10 },
  { key: "started", label: "Started", labelKa: "დაწყებული", iconName: "play", progress: 25 },
  { key: "in_progress", label: "In Progress", labelKa: "მიმდინარე", iconName: "clock", progress: 50 },
  { key: "review", label: "Review", labelKa: "შემოწმება", iconName: "eye", progress: 75 },
  { key: "completed", label: "Done", labelKa: "დასრულებული", iconName: "check-circle-2", progress: 100 },
];

export function getProjectStageIndex(stage: ProjectStage): number {
  return PROJECT_STAGES.findIndex((s) => s.key === stage);
}

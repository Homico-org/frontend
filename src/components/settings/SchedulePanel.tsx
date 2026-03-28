"use client";

import SidePanel from "@/components/ui/SidePanel";
import { useLanguage } from "@/contexts/LanguageContext";
import ScheduleSettings from "./ScheduleSettings";

interface SchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchedulePanel({ isOpen, onClose }: SchedulePanelProps) {
  const { t } = useLanguage();

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={t("settings.schedule")}>
      <ScheduleSettings />
    </SidePanel>
  );
}

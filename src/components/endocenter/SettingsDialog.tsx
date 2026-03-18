import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Building2, Palette, Settings, Target, Users, X } from "lucide-react";
import CompanySettingsTab from "@/components/endocenter/settings/CompanySettingsTab";
import TeamSettingsTab from "@/components/endocenter/settings/TeamSettingsTab";
import RecordsSettingsTab from "@/components/endocenter/settings/RecordsSettingsTab";
import MetricsSettingsTab from "@/components/endocenter/settings/MetricsSettingsTab";
import GoalsSettingsTab from "@/components/endocenter/settings/GoalsSettingsTab";
import ThemeEditor from "@/components/endocenter/ThemeEditor";
import { useParams } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

type TabId = "company" | "team" | "records" | "metrics" | "goals" | "theme";

const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "team", label: "Equipe", icon: Users },
  { id: "records", label: "Registros", icon: Settings },
  { id: "metrics", label: "Métricas", icon: BarChart3 },
  { id: "goals", label: "Metas", icon: Target },
  { id: "theme", label: "Tema", icon: Palette },
];

export default function SettingsDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("company");
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center ios-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={reduceMotion ? false : { y: 36, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 20, opacity: 0, scale: 0.99 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 360, mass: 0.65 }}
            className="w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col ios-modal-surface"
            style={{
              borderRadius: "var(--ios-radius-2xl) var(--ios-radius-2xl) 0 0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-2.5 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-foreground/12" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Lobby de Gestão</h2>
                <p className="text-xs text-muted-foreground">Empresa, equipe, registros e métricas</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-secondary/70"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Segmented control */}
            <div className="mx-6 mb-4 ios-segmented grid grid-cols-5 gap-0">
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className="ios-segmented-item flex items-center justify-center gap-1.5"
                    data-active={tab === item.id}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: "easeOut" }}
                >
                  {tab === "company" && <CompanySettingsTab />}
                  {tab === "team" && <TeamSettingsTab />}
                  {tab === "records" && <RecordsSettingsTab />}
                  {tab === "metrics" && <MetricsSettingsTab />}
                  {tab === "goals" && <GoalsSettingsTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

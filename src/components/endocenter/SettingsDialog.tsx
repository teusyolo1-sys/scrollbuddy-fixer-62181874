import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Building2, Settings, Users, X } from "lucide-react";
import CompanySettingsTab from "@/components/endocenter/settings/CompanySettingsTab";
import TeamSettingsTab from "@/components/endocenter/settings/TeamSettingsTab";
import RecordsSettingsTab from "@/components/endocenter/settings/RecordsSettingsTab";
import MetricsSettingsTab from "@/components/endocenter/settings/MetricsSettingsTab";

interface Props {
  open: boolean;
  onClose: () => void;
}

type TabId = "company" | "team" | "records" | "metrics";

const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "team", label: "Funcionários", icon: Users },
  { id: "records", label: "Lobby", icon: Settings },
  { id: "metrics", label: "Métricas", icon: BarChart3 },
];

export default function SettingsDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("company");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/55 backdrop-blur-xl flex items-end sm:items-center justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="w-full sm:max-w-3xl max-h-[92vh] overflow-hidden ios-glass-ultra border border-white/60 rounded-t-3xl sm:rounded-3xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-foreground/15" />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div>
                <h2 className="text-base font-semibold text-foreground">Lobby de Gestão</h2>
                <p className="text-xs text-muted-foreground">Cadastre empresa, equipe, métricas e registros de todas as abas.</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-border/50">
              <div className="p-1 rounded-xl bg-secondary/70 grid grid-cols-4 gap-1">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === "company" && <CompanySettingsTab />}
              {tab === "team" && <TeamSettingsTab />}
              {tab === "records" && <RecordsSettingsTab />}
              {tab === "metrics" && <MetricsSettingsTab />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, Calendar, CheckSquare, DollarSign, Moon, RefreshCw, Rocket, Settings, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EndocenterProvider, useEndocenter, defaultTabLabels } from "@/store/endocenterStore";
import { useTheme } from "@/hooks/useTheme";
import TeamDashboard from "@/components/endocenter/TeamDashboard";
import MasterSchedule from "@/components/endocenter/MasterSchedule";
import ProjectPipeline from "@/components/endocenter/ProjectPipeline";
import ResponsibilityMatrix from "@/components/endocenter/ResponsibilityMatrix";
import WorkflowDiagram from "@/components/endocenter/WorkflowDiagram";
import DeadlineManagement from "@/components/endocenter/DeadlineManagement";
import BudgetCalculator from "@/components/endocenter/BudgetCalculator";
import SettingsDialog from "@/components/endocenter/SettingsDialog";
import NotificationCenter from "@/components/endocenter/NotificationCenter";

const tabDefs = [
  { id: "dashboard" as const, icon: BarChart3 },
  { id: "schedule" as const, icon: Calendar },
  { id: "pipeline" as const, icon: Rocket },
  { id: "matrix" as const, icon: CheckSquare },
  { id: "workflow" as const, icon: RefreshCw },
  { id: "deadlines" as const, icon: AlertTriangle },
  { id: "budget" as const, icon: DollarSign },
];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<(typeof tabDefs)[number]["id"]>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { company } = useEndocenter();
  const tabLabels = company.tabLabels ?? defaultTabLabels;
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header — iOS 26 frosted glass dark bar */}
      <header className="liquid-glass-navbar sticky top-0 w-full z-30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.12, x: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                onClick={() => navigate("/")}
                className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-white/80" />
              </motion.button>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl font-bold text-white tracking-tight"
                >
                  {company.name}
                </motion.h1>
                <p className="text-xs text-white/45 mt-0.5">
                  {company.subtitle} · {company.month}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter onNavigateToTask={() => setActiveTab("matrix")} />
              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                title={resolvedTheme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                <motion.div
                  key={resolvedTheme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-white/80" />
                  )}
                </motion.div>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88, rotate: 90 }}
                whileHover={{ scale: 1.12, rotate: 45 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
                title="Configurações"
              >
                <Settings className="h-4 w-4 text-white/80" />
              </motion.button>
            </div>
          </div>

          {/* Navigation tabs — pill style */}
          <nav className="flex gap-1.5 overflow-x-auto pb-3 -mb-px">
            {tabDefs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="group relative flex items-center gap-1.5 px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium hover:bg-white/10"
                  style={{
                    borderRadius: "var(--ios-radius)",
                    backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <span className="inline-flex">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {tabLabels[tab.id]}
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-3 right-3 h-[3px]"
                      style={{ borderRadius: 999, background: "hsl(var(--ios-blue))" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-5 sm:px-6 py-7">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.5 }}
        >
          {activeTab === "dashboard" && <TeamDashboard />}
          {activeTab === "schedule" && <MasterSchedule />}
          {activeTab === "pipeline" && <ProjectPipeline />}
          {activeTab === "matrix" && <ResponsibilityMatrix />}
          {activeTab === "workflow" && <WorkflowDiagram />}
          {activeTab === "deadlines" && <DeadlineManagement />}
          {activeTab === "budget" && <BudgetCalculator />}
        </motion.div>
      </main>

      <footer className="relative z-0 text-center py-8 text-xs text-muted-foreground">
        {company.name} · Dashboard operacional
      </footer>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function EndocenterDashboard() {
  return (
    <EndocenterProvider>
      <DashboardContent />
    </EndocenterProvider>
  );
}

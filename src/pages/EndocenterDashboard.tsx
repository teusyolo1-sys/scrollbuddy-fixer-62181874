import { useState } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, Calendar, CheckSquare, Moon, RefreshCw, Rocket, Settings, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EndocenterProvider, useEndocenter } from "@/store/endocenterStore";
import { useTheme } from "@/hooks/useTheme";
import TeamDashboard from "@/components/endocenter/TeamDashboard";
import MasterSchedule from "@/components/endocenter/MasterSchedule";
import ProjectPipeline from "@/components/endocenter/ProjectPipeline";
import ResponsibilityMatrix from "@/components/endocenter/ResponsibilityMatrix";
import WorkflowDiagram from "@/components/endocenter/WorkflowDiagram";
import DeadlineManagement from "@/components/endocenter/DeadlineManagement";
import SettingsDialog from "@/components/endocenter/SettingsDialog";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "schedule", label: "Cronograma", icon: Calendar },
  { id: "pipeline", label: "Pipeline", icon: Rocket },
  { id: "matrix", label: "Responsabilidades", icon: CheckSquare },
  { id: "workflow", label: "Fluxo", icon: RefreshCw },
  { id: "deadlines", label: "Prazos & Crises", icon: AlertTriangle },
] as const;

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { company } = useEndocenter();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header — iOS 26 frosted glass dark bar */}
      <header className="sticky top-0 z-50 ios-glass-dark" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
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

            <motion.button
              whileTap={{ scale: 0.88, rotate: 90 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              title="Configurações"
            >
              <Settings className="h-4 w-4 text-white/80" />
            </motion.button>
          </div>

          {/* Navigation tabs — pill style */}
          <nav className="flex gap-1.5 overflow-x-auto pb-3 -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={!active ? { scale: 1.04, backgroundColor: "rgba(255,255,255,0.07)" } : { scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative flex items-center gap-1.5 px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium"
                  style={{
                    borderRadius: "var(--ios-radius)",
                    backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
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

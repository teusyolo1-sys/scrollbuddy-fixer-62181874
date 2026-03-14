import { useState } from "react";
import { BarChart3, Calendar, Rocket, CheckSquare, RefreshCw, AlertTriangle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { EndocenterProvider, useEndocenter } from "@/store/endocenterStore";
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
];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { company } = useEndocenter();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(220,20%,95%) 0%, hsl(220,25%,97%) 100%)" }}>
      {/* iOS-style header with glass effect */}
      <header className="sticky top-0 z-50 ios-glass-dark" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              >
                {company.name}
              </motion.h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {company.subtitle} · {company.month}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9, rotate: 45 }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)" }}
              title="Configurações"
            >
              <Settings size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
            </motion.button>
          </div>

          {/* iOS-style segmented navigation */}
          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 relative"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ background: "hsl(215,90%,60%)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {activeTab === "dashboard" && <TeamDashboard />}
          {activeTab === "schedule" && <MasterSchedule />}
          {activeTab === "pipeline" && <ProjectPipeline />}
          {activeTab === "matrix" && <ResponsibilityMatrix />}
          {activeTab === "workflow" && <WorkflowDiagram />}
          {activeTab === "deadlines" && <DeadlineManagement />}
        </motion.div>
      </main>

      <footer className="text-center py-6 text-xs" style={{ color: "hsl(220,10%,65%)" }}>
        {company.name} Marketing Dashboard · Atualizado em {company.month}
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

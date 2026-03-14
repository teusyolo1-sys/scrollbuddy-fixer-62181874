import { useState } from "react";
import { AlertTriangle, BarChart3, Calendar, CheckSquare, RefreshCw, Rocket, Settings } from "lucide-react";
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
] as const;

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { company } = useEndocenter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 ios-glass-dark border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-xl sm:text-2xl font-bold text-white">
                {company.name}
              </motion.h1>
              <p className="text-sm text-white/60">{company.subtitle} · {company.month}</p>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition-colors flex items-center justify-center"
              title="Abrir lobby de gestão"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    active ? "bg-white/15 text-white" : "text-white/55"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          {activeTab === "dashboard" && <TeamDashboard />}
          {activeTab === "schedule" && <MasterSchedule />}
          {activeTab === "pipeline" && <ProjectPipeline />}
          {activeTab === "matrix" && <ResponsibilityMatrix />}
          {activeTab === "workflow" && <WorkflowDiagram />}
          {activeTab === "deadlines" && <DeadlineManagement />}
        </motion.div>
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        {company.name} · Lobby integrado de gestão operacional
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

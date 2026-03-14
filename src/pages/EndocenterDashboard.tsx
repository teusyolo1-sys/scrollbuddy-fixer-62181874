import { useState } from "react";
import { BarChart3, Calendar, Rocket, CheckSquare, RefreshCw, AlertTriangle, Settings } from "lucide-react";
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
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9" }}>
      <header style={{ backgroundColor: "#0A1628" }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {company.name} — Dashboard da Equipe
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {company.subtitle} · {company.month}
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Configurações"
            >
              <Settings size={20} />
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 -mb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.15)" : "transparent",
                    color: activeTab === tab.id ? "#FFFFFF" : "#94A3B8",
                    borderBottom: activeTab === tab.id ? "2px solid #3B82F6" : "2px solid transparent",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "dashboard" && <TeamDashboard />}
        {activeTab === "schedule" && <MasterSchedule />}
        {activeTab === "pipeline" && <ProjectPipeline />}
        {activeTab === "matrix" && <ResponsibilityMatrix />}
        {activeTab === "workflow" && <WorkflowDiagram />}
        {activeTab === "deadlines" && <DeadlineManagement />}
      </main>

      <footer className="text-center py-6 text-xs text-slate-400">
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

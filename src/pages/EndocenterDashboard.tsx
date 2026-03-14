import { useState } from "react";
import { BarChart3, Calendar, Rocket, CheckSquare, RefreshCw, AlertTriangle } from "lucide-react";
import TeamDashboard from "@/components/endocenter/TeamDashboard";
import MasterSchedule from "@/components/endocenter/MasterSchedule";
import ProjectPipeline from "@/components/endocenter/ProjectPipeline";
import ResponsibilityMatrix from "@/components/endocenter/ResponsibilityMatrix";
import WorkflowDiagram from "@/components/endocenter/WorkflowDiagram";
import DeadlineManagement from "@/components/endocenter/DeadlineManagement";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "schedule", label: "Cronograma", icon: Calendar },
  { id: "pipeline", label: "Pipeline", icon: Rocket },
  { id: "matrix", label: "Responsabilidades", icon: CheckSquare },
  { id: "workflow", label: "Fluxo", icon: RefreshCw },
  { id: "deadlines", label: "Prazos & Crises", icon: AlertTriangle },
];

export default function EndocenterDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F1F5F9" }}>
      <header style={{ backgroundColor: "#0A1628" }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Endocenter — Dashboard da Equipe
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Gestão operacional de marketing · Março 2025
              </p>
            </div>
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
        Endocenter Marketing Dashboard · Atualizado em Março 2025
      </footer>
    </div>
  );
}

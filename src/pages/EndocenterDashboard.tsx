import { useState, useEffect, useCallback, lazy } from "react";
import CompanyThemeProvider from "@/components/endocenter/ThemeProvider";
import { AlertTriangle, ArrowLeft, BarChart3, Calendar, CheckSquare, DollarSign, FolderOpen, Monitor, Moon, RefreshCw, Rocket, Settings, Shield, Sun, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { EndocenterProvider, useEndocenter, defaultTabLabels } from "@/store/endocenterStore";
import { useTheme } from "@/hooks/useTheme";
import { useTabPermissions, type TabKey } from "@/hooks/useTabPermissions";
import { useUserRole } from "@/hooks/useUserRole";
import TeamDashboard from "@/components/endocenter/TeamDashboard";
import MasterSchedule from "@/components/endocenter/MasterSchedule";
import ProjectPipeline from "@/components/endocenter/ProjectPipeline";
import ResponsibilityMatrix from "@/components/endocenter/ResponsibilityMatrix";
import WorkflowDiagram from "@/components/endocenter/WorkflowDiagram";
import DeadlineManagement from "@/components/endocenter/DeadlineManagement";
import BudgetCalculator from "@/components/endocenter/BudgetCalculator";
import TeamAnalytics from "@/components/endocenter/TeamAnalytics";
import SettingsDialog from "@/components/endocenter/SettingsDialog";
import NotificationCenter from "@/components/endocenter/NotificationCenter";
import DriveFileManager from "@/components/endocenter/DriveFileManager";


const tabDefs = [
  { id: "dashboard" as const, icon: BarChart3 },
  { id: "schedule" as const, icon: Calendar },
  { id: "pipeline" as const, icon: Rocket },
  { id: "matrix" as const, icon: CheckSquare },
  { id: "workflow" as const, icon: RefreshCw },
  { id: "deadlines" as const, icon: AlertTriangle },
  { id: "budget" as const, icon: DollarSign },
  { id: "team" as const, icon: Users },
  { id: "files" as const, icon: FolderOpen },
];

function DashboardContent() {
  const { companyId } = useParams<{ companyId: string }>();
  const { allowedTabs, loading: permLoading } = useTabPermissions();
  const { isAdmin } = useUserRole();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { company } = useEndocenter();
  const tabLabels = company.tabLabels ?? defaultTabLabels;
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  const visibleTabs = tabDefs.filter(t => allowedTabs.includes(t.id));
  // Persistir aba ativa por empresa no sessionStorage
  const tabStorageKey = `activeTab_${companyId || 'default'}`;

  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem(tabStorageKey);
    if (saved && visibleTabs.find(t => t.id === saved)) {
      return saved as TabKey;
    }
    return visibleTabs[0]?.id || "dashboard";
  });

  const setActiveTab = useCallback((tab: TabKey) => {
    setActiveTabState(tab);
    sessionStorage.setItem(tabStorageKey, tab);
  }, [tabStorageKey]);

  // Ensure activeTab is valid when permissions load
  useEffect(() => {
    if (!permLoading && visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      const saved = sessionStorage.getItem(tabStorageKey);
      if (saved && visibleTabs.find(t => t.id === saved)) {
        setActiveTab(saved as TabKey);
      } else {
        setActiveTab(visibleTabs[0].id);
      }
    }
  }, [permLoading, visibleTabs, activeTab, setActiveTab, tabStorageKey]);

  if (permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Sem permissões</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Você ainda não tem acesso a nenhuma aba. Peça ao administrador para liberar suas permissões.
          </p>
          <button onClick={() => navigate("/")} className="text-sm text-primary hover:underline mt-4">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="liquid-glass-navbar sticky top-0 w-full z-30 border-b border-border/20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.12, x: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 14 }}
                onClick={() => navigate("/")}
                className="w-9 h-9 rounded-2xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </motion.button>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg sm:text-xl font-bold text-foreground tracking-tight"
                >
                  {company.name}
                </motion.h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {company.subtitle} · {company.month}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter onNavigateToTask={() => setActiveTab("matrix")} />

              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  onClick={() => navigate("/permissions")}
                  className="w-9 h-9 rounded-2xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                  title="Gerenciar permissões"
                >
                  <Shield className="h-4 w-4 text-foreground" />
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                onClick={() => {
                  if (theme === "system") setTheme("light");
                  else if (theme === "light") setTheme("dark");
                  else setTheme("system");
                }}
                className="w-9 h-9 rounded-2xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                title={theme === "system" ? "Tema: Automático" : theme === "dark" ? "Tema: Escuro" : "Tema: Claro"}
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                >
                  {theme === "system" ? (
                    <Monitor className="h-4 w-4 text-foreground" />
                  ) : resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 text-foreground" />
                  )}
                </motion.div>
              </motion.button>

              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.88, rotate: 90 }}
                  whileHover={{ scale: 1.12, rotate: 45 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  onClick={() => setSettingsOpen(true)}
                  className="w-9 h-9 rounded-2xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4 text-foreground" />
                </motion.button>
              )}
            </div>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto pb-3 -mb-px">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`group relative flex items-center gap-1.5 px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                  style={{ borderRadius: "var(--ios-radius)" }}
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

      <main className="relative max-w-7xl mx-auto px-5 sm:px-6 py-7">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.5 }}
        >
          {activeTab === "dashboard" && <TeamDashboard companyId={companyId} />}
          {activeTab === "schedule" && <MasterSchedule />}
          {activeTab === "pipeline" && <ProjectPipeline />}
          {activeTab === "matrix" && <ResponsibilityMatrix companyId={companyId} />}
          {activeTab === "workflow" && <WorkflowDiagram />}
          {activeTab === "deadlines" && <DeadlineManagement />}
          {activeTab === "budget" && <BudgetCalculator companyId={companyId} />}
          {activeTab === "team" && <TeamAnalytics companyId={companyId} />}
          {activeTab === "files" && companyId && <DriveFileManager companyId={companyId} companyName={company.name} />}
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
  const { companyId } = useParams<{ companyId: string }>();
  return (
    <EndocenterProvider companyId={companyId}>
      <CompanyThemeProvider>
        <DashboardContent />
      </CompanyThemeProvider>
    </EndocenterProvider>
  );
}

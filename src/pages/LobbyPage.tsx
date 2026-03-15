import { useState, useMemo, useEffect } from "react";
import { Plus, Building2, Users, ArrowRight, LogIn, LogOut, User, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface CompanyCard {
  id: string;
  name: string;
  subtitle: string;
  month: string;
  memberCount: number;
  color: string;
}

const STORAGE_KEY = "endocenter_settings";
const COMPANIES_KEY = "endocenter_companies";

function loadCompanies(): CompanyCard[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  // Fallback: check if there's a single existing project
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return [
        {
          id: "default",
          name: data.company?.name || "Endocenter",
          subtitle: data.company?.subtitle || "Gestão operacional",
          month: data.company?.month || "Março 2025",
          memberCount: data.team?.length || 4,
          color: "#007AFF",
        },
      ];
    }
  } catch {}

  return [
    {
      id: "default",
      name: "Endocenter",
      subtitle: "Gestão operacional de marketing",
      month: "Março 2025",
      memberCount: 4,
      color: "#007AFF",
    },
  ];
}

function saveCompanies(companies: CompanyCard[]) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export default function LobbyPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [companies, setCompanies] = useState<CompanyCard[]>(loadCompanies);
  const [allowedCompanyIds, setAllowedCompanyIds] = useState<string[] | null>(null);
  const navigate = useNavigate();

  // Fetch company permissions for non-admin users
  useEffect(() => {
    if (!user || isAdmin) {
      setAllowedCompanyIds(null); // admin sees all
      return;
    }
    const fetchPerms = async () => {
      const { data } = await supabase
        .from('company_permissions')
        .select('company_id, granted')
        .eq('user_id', user.id)
        .eq('granted', true) as { data: { company_id: string; granted: boolean }[] | null };
      setAllowedCompanyIds((data || []).map(d => d.company_id));
    };
    fetchPerms();
  }, [user, isAdmin]);

  const visibleCompanies = useMemo(() => {
    if (isAdmin || allowedCompanyIds === null) return companies;
    return companies.filter(c => allowedCompanyIds.includes(c.id));
  }, [companies, allowedCompanyIds, isAdmin]);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const addCompany = () => {
    const newCompany: CompanyCard = {
      id: `company_${Date.now()}`,
      name: "Nova Empresa",
      subtitle: "Gestão operacional",
      month: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      memberCount: 0,
      color: ["#007AFF", "#AF52DE", "#FF3B30", "#30D158", "#FF9500", "#00C7BE"][companies.length % 6],
    };

    const updated = [...companies, newCompany];
    setCompanies(updated);
    saveCompanies(updated);
  };

  const openCompany = (company: CompanyCard) => {
    navigate("/endocenter");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero area with subtle gradient */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, hsl(230 30% 94%) 0%, hsl(240 10% 96%) 60%)",
          minHeight: "40vh",
        }}
      >
        {/* Floating blurred orbs for iOS 26 depth */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(215 100% 65%), transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute top-40 -left-20 w-60 h-60 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(265 80% 70%), transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-8">
          <div className="flex items-start justify-between">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 25 }}>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Seus projetos
              </h1>
              <p className="text-lg mt-2 text-muted-foreground max-w-md">
                Gerencie equipes, métricas e operações de marketing em um só lugar.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {!authLoading && (
                user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {user.user_metadata?.display_name || user.email?.split("@")[0]}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => navigate("/permissions")}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                        title="Gerenciar permissões"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={async () => { await signOut(); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </button>
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Company cards grid */}
      <div className="max-w-5xl mx-auto px-6 -mt-4 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCompanies.map((company, i) => {
            const gradient = gradients[i % gradients.length];
            return (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.15), type: "spring", damping: 26, stiffness: 340 }}
                onClick={() => openCompany(company)}
                className="liquid-glass-card border border-white/30 dark:border-white/10 rounded-3xl p-0 text-left overflow-hidden group"
              >
                {/* Gradient header */}
                <div className="h-28 relative" style={{ background: gradient }}>
                  <div className="absolute inset-0 bg-black/5" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-xl flex items-center justify-center border border-white/30">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-white/80 text-xs">
                      <Users className="h-3.5 w-3.5" />
                      {company.memberCount} membros
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 pt-4">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{company.subtitle}</p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="ios-badge ios-status-info">{company.month}</span>
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* Add company card — only for admins */}
          {isAdmin && (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visibleCompanies.length * 0.08, type: "spring", damping: 22 }}
            onClick={addCompany}
            className="liquid-glass-card border border-white/30 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center min-h-[220px] group"
            style={{ boxShadow: "none" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground mt-3 group-hover:text-primary transition-colors">
              Nova empresa
            </span>
          </motion.button>
          )}

          {visibleCompanies.length === 0 && !isAdmin && (
            <div className="col-span-full text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Você ainda não tem acesso a nenhuma empresa.</p>
              <p className="text-xs text-muted-foreground mt-1">Peça ao administrador para liberar seu acesso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Building2, Users, ArrowRight, LogIn, LogOut, Shield, ImagePlus, Pencil } from "lucide-react";
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
  bannerUrl?: string;
  logoUrl?: string;
}

const STORAGE_KEY = "endocenter_settings";
const COMPANIES_KEY = "endocenter_companies";

function loadCompanies(): CompanyCard[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return [{
        id: "default",
        name: data.company?.name || "Endocenter",
        subtitle: data.company?.subtitle || "Gestão operacional",
        month: data.company?.month || "Março 2025",
        memberCount: data.team?.length || 4,
        color: "#007AFF",
      }];
    }
  } catch {}
  return [{
    id: "default",
    name: "Endocenter",
    subtitle: "Gestão operacional de marketing",
    month: "Março 2025",
    memberCount: 4,
    color: "#007AFF",
  }];
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

/* ── Framer-inspired animated mesh background ── */
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Mesh gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(230 30% 96%) 0%, hsl(240 20% 98%) 40%, hsl(220 25% 95%) 100%)",
        }}
      />

      {/* Orb 1 — large blue, top-right drift */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(215 100% 72% / 0.25), transparent 65%)",
          filter: "blur(80px)",
          top: "-15%",
          right: "-10%",
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 2 — purple, left side */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(265 70% 72% / 0.18), transparent 65%)",
          filter: "blur(70px)",
          top: "25%",
          left: "-12%",
        }}
        animate={{
          x: [0, 35, -15, 0],
          y: [0, -20, 30, 0],
          scale: [1, 0.96, 1.06, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 3 — cyan, center-bottom */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(190 80% 65% / 0.15), transparent 65%)",
          filter: "blur(60px)",
          bottom: "0%",
          right: "15%",
        }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, -15, 25, 0],
          scale: [1, 1.04, 0.98, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb 4 — warm accent, subtle */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(35 90% 70% / 0.1), transparent 65%)",
          filter: "blur(60px)",
          top: "50%",
          right: "40%",
        }}
        animate={{
          x: [0, 20, -30, 0],
          y: [0, 25, -10, 0],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}

/* ── File upload helper ── */
function useFileUpload(onLoad: (dataUrl: string) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const trigger = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return { inputRef, trigger, handleChange };
}

export default function LobbyPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [companies, setCompanies] = useState<CompanyCard[]>(loadCompanies);
  const [allowedCompanyIds, setAllowedCompanyIds] = useState<string[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || isAdmin) { setAllowedCompanyIds(null); return; }
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

  if (!authLoading && !user) { navigate("/auth", { replace: true }); return null; }
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const updateCompany = (id: string, updates: Partial<CompanyCard>) => {
    const updated = companies.map(c => c.id === id ? { ...c, ...updates } : c);
    setCompanies(updated);
    saveCompanies(updated);
  };

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

  const openCompany = (company: CompanyCard) => navigate("/endocenter");

  return (
    <div className="min-h-screen relative" style={{ isolation: "isolate" }}>
      {/* Animated background */}
      <AnimatedBackground />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: "40vh" }}>
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-8">
          <div className="flex items-start justify-between">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 25 }}>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">Seus projetos</h1>
              <p className="text-lg mt-2 text-muted-foreground max-w-md">
                Gerencie equipes, métricas e operações de marketing em um só lugar.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {user ? (
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
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <LogIn className="h-4 w-4" /> Entrar
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Company cards grid */}
      <div className="relative max-w-5xl mx-auto px-6 -mt-4 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCompanies.map((company, i) => (
            <CompanyCardItem
              key={company.id}
              company={company}
              index={i}
              isAdmin={isAdmin}
              onOpen={() => openCompany(company)}
              onUpdate={(updates) => updateCompany(company.id, updates)}
            />
          ))}

          {isAdmin && (
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.03, boxShadow: "0 16px 40px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ delay: visibleCompanies.length * 0.08, type: "spring", damping: 22 }}
              onClick={addCompany}
              className="liquid-glass-card border border-white/30 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center min-h-[220px] group"
              style={{ boxShadow: "none" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground mt-3 group-hover:text-primary transition-colors">Nova empresa</span>
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

/* ── Company Card with banner/logo upload ── */
function CompanyCardItem({
  company,
  index,
  isAdmin,
  onOpen,
  onUpdate,
}: {
  company: CompanyCard;
  index: number;
  isAdmin: boolean;
  onOpen: () => void;
  onUpdate: (updates: Partial<CompanyCard>) => void;
}) {
  const gradient = gradients[index % gradients.length];

  const bannerUpload = useFileUpload((url) => onUpdate({ bannerUrl: url }));
  const logoUpload = useFileUpload((url) => onUpdate({ logoUrl: url }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.15), type: "spring", damping: 22, stiffness: 300 }}
      className="liquid-glass-card border border-white/30 dark:border-white/10 rounded-3xl p-0 text-left overflow-hidden group cursor-pointer"
      onClick={onOpen}
    >
      {/* Gradient / Banner header */}
      <div className="h-28 relative overflow-hidden">
        {company.bannerUrl ? (
          <img src={company.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: gradient }} />
        )}
        <div className="absolute inset-0 bg-black/5" />

        {/* Admin: banner upload overlay */}
        {isAdmin && (
          <>
            <input ref={bannerUpload.inputRef} type="file" accept="image/*" className="hidden" onChange={bannerUpload.handleChange} />
            <button
              onClick={(e) => { e.stopPropagation(); bannerUpload.trigger(); }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 opacity-0 group-hover:opacity-100 transition-all"
              title="Alterar banner"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          {/* Logo */}
          <div className="relative">
            {company.logoUrl ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-xl">
                <img src={company.logoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-xl flex items-center justify-center border border-white/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
            {isAdmin && (
              <>
                <input ref={logoUpload.inputRef} type="file" accept="image/*" className="hidden" onChange={logoUpload.handleChange} />
                <button
                  onClick={(e) => { e.stopPropagation(); logoUpload.trigger(); }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  title="Alterar logo"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <Users className="h-3.5 w-3.5" />
            {company.memberCount} membros
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pt-4">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{company.name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{company.subtitle}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="ios-badge ios-status-info">{company.month}</span>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

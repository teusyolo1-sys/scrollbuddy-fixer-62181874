import { useState, useEffect, useRef } from "react";
import { Plus, Building2, Users, ArrowRight, LogIn, LogOut, Shield, ImagePlus, Pencil, Wallet, Sun, Moon, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyWallet } from "@/hooks/useAgencyWallet";
import TrashBinModal from "@/components/TrashBinModal";

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
  const isDark = document.documentElement.classList.contains("dark");

  const base = isDark
    ? "linear-gradient(180deg, hsl(220 20% 10%) 0%, hsl(220 18% 8%) 30%, hsl(220 15% 7%) 60%, hsl(220 20% 9%) 100%)"
    : "linear-gradient(180deg, hsl(210 40% 97%) 0%, hsl(215 35% 95%) 30%, hsl(220 30% 93%) 60%, hsl(210 25% 96%) 100%)";

  const haze = isDark
    ? "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(220 40% 15% / 0.4), transparent 70%)"
    : "radial-gradient(ellipse 120% 80% at 50% 0%, hsl(210 60% 88% / 0.4), transparent 70%)";

  const cloudOpacity = isDark ? 0.15 : 0.6;
  const wispOpacity = isDark ? 0.1 : 0.35;
  const orbOpacity = isDark ? 0.06 : 0.12;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      <div className="absolute inset-0" style={{ background: base }} />
      <div className="absolute inset-x-0 top-0 h-[60%]" style={{ background: haze }} />
      <div
        className="absolute inset-x-0 bottom-0 h-[45%]"
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 20% 90%, hsl(0 0% ${isDark ? '100%' : '100%'} / ${cloudOpacity}), transparent 60%),
            radial-gradient(ellipse 60% 35% at 75% 85%, hsl(0 0% 100% / ${cloudOpacity * 0.83}), transparent 55%),
            radial-gradient(ellipse 90% 30% at 50% 95%, hsl(0 0% 100% / ${cloudOpacity * 0.75}), transparent 50%)
          `,
        }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "60%", height: "25%", bottom: "5%", left: "-5%",
          background: `radial-gradient(ellipse, hsl(0 0% 100% / ${wispOpacity}), transparent 65%)`,
          filter: "blur(40px)", willChange: "transform",
        }}
        animate={{ x: [0, 60, 0] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "50%", height: "20%", bottom: "12%", right: "-8%",
          background: `radial-gradient(ellipse, hsl(0 0% 100% / ${wispOpacity * 0.85}), transparent 60%)`,
          filter: "blur(35px)", willChange: "transform",
        }}
        animate={{ x: [0, -50, 0] }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute"
        style={{
          width: "40%", height: "15%", bottom: "20%", left: "20%",
          background: `radial-gradient(ellipse, hsl(210 30% ${isDark ? '20%' : '96%'} / ${wispOpacity * 0.7}), transparent 60%)`,
          filter: "blur(30px)", willChange: "transform",
        }}
        animate={{ x: [0, 30, -20, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          background: `radial-gradient(circle, hsl(215 50% ${isDark ? '25%' : '80%'} / ${orbOpacity}), transparent 65%)`,
          filter: "blur(80px)", top: "-10%", right: "10%", willChange: "transform",
        }}
        animate={{ x: [0, -30, 15, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <div
        className="absolute inset-0 opacity-[0.02]"
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
  const { profit, totalRevenue, loading: walletLoading } = useAgencyWallet();
  const { resolvedTheme, setTheme } = useTheme();
  const [walletHovered, setWalletHovered] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const navigate = useNavigate();

  // Load companies from backend
  useEffect(() => {
    if (!user) return;
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true }) as { data: any[] | null };
      
      if (data && data.length > 0) {
        setCompanies(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          subtitle: c.subtitle,
          month: c.month,
          memberCount: 0,
          color: c.color,
          bannerUrl: c.banner_url,
          logoUrl: c.logo_url,
        })));
      } else {
        // Migrate from localStorage on first load (admin only)
        if (isAdmin) {
          const legacy = loadCompanies();
          for (const c of legacy) {
            const { data: inserted } = await supabase
              .from('companies')
              .insert({
                name: c.name,
                subtitle: c.subtitle,
                month: c.month,
                color: c.color,
                banner_url: c.bannerUrl,
                logo_url: c.logoUrl,
                created_by: user.id,
              } as any)
              .select()
              .single() as { data: any };
            if (inserted) {
              c.id = inserted.id;
            }
          }
          setCompanies(legacy.map(c => ({ ...c })));
        }
      }
      setLoadingCompanies(false);
    };
    fetchCompanies();
  }, [user, isAdmin]);

  if (!authLoading && !user) { navigate("/auth", { replace: true }); return null; }
  if (authLoading || loadingCompanies) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  const updateCompany = async (id: string, updates: Partial<CompanyCard>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Persist to DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle;
    if (updates.bannerUrl !== undefined) dbUpdates.banner_url = updates.bannerUrl;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('companies').update(dbUpdates).eq('id', id);
    }
  };

  const addCompany = async () => {
    const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const color = ["#007AFF", "#AF52DE", "#FF3B30", "#30D158", "#FF9500", "#00C7BE"][companies.length % 6];
    const { data } = await supabase
      .from('companies')
      .insert({
        name: "Nova Empresa",
        subtitle: "Gestão operacional",
        month,
        color,
        created_by: user!.id,
      } as any)
      .select()
      .single() as { data: any };
    
    if (data) {
      setCompanies(prev => [...prev, {
        id: data.id,
        name: data.name,
        subtitle: data.subtitle,
        month: data.month,
        memberCount: 0,
        color: data.color,
        bannerUrl: data.banner_url,
        logoUrl: data.logo_url,
      }]);
    }
  };

  const openCompany = (company: CompanyCard) => navigate(`/endocenter/${company.id}`);

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
                    <>
                      {/* Wallet icon with hover balance */}
                      <div className="relative" onMouseEnter={() => setWalletHovered(true)} onMouseLeave={() => setWalletHovered(false)}>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate("/agency-wallet")}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Caixa da Agência"
                        >
                          <Wallet className="h-4 w-4" />
                        </motion.button>
                        <AnimatePresence>
                          {walletHovered && !walletLoading && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{ type: "spring", damping: 25, stiffness: 400 }}
                              className="absolute top-full right-0 mt-2 px-4 py-3 rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-[var(--ios-shadow-lg)] min-w-[180px] z-50"
                            >
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Saldo da Agência</p>
                              <p className={`text-lg font-extrabold ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(profit)}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Receita total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        onClick={() => navigate("/permissions")}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                        title="Gerenciar permissões"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    title="Alternar tema"
                  >
                    {resolvedTheme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                  </button>
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
          {companies.map((company, i) => (
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
              transition={{ delay: companies.length * 0.08, type: "spring", damping: 22 }}
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

          {companies.length === 0 && !isAdmin && (
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
  const [editingName, setEditingName] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const [nameValue, setNameValue] = useState(company.name);
  const [subtitleValue, setSubtitleValue] = useState(company.subtitle);
  const nameRef = useRef<HTMLInputElement>(null);
  const subtitleRef = useRef<HTMLInputElement>(null);

  const bannerUpload = useFileUpload((url) => onUpdate({ bannerUrl: url }));
  const logoUpload = useFileUpload((url) => onUpdate({ logoUrl: url }));

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== company.name) onUpdate({ name: trimmed });
    else setNameValue(company.name);
    setEditingName(false);
  };

  const commitSubtitle = () => {
    const trimmed = subtitleValue.trim();
    if (trimmed && trimmed !== company.subtitle) onUpdate({ subtitle: trimmed });
    else setSubtitleValue(company.subtitle);
    setEditingSubtitle(false);
  };

  useEffect(() => { if (editingName) nameRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (editingSubtitle) subtitleRef.current?.focus(); }, [editingSubtitle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.97, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.15), type: "spring", damping: 22, stiffness: 300 }}
      className="liquid-glass-card border border-white/30 dark:border-white/10 rounded-3xl p-0 text-left overflow-hidden group cursor-pointer"
      onClick={(e) => {
        // Don't navigate if editing
        if (editingName || editingSubtitle) return;
        onOpen();
      }}
    >
      {/* Hidden file inputs */}
      {isAdmin && (
        <>
          <input ref={bannerUpload.inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { e.stopPropagation(); bannerUpload.handleChange(e); }} />
          <input ref={logoUpload.inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { e.stopPropagation(); logoUpload.handleChange(e); }} />
        </>
      )}

      {/* Gradient / Banner header */}
      <div className="h-28 relative overflow-hidden">
        {company.bannerUrl ? (
          <img src={company.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: gradient }} />
        )}
        <div className="absolute inset-0 bg-black/5" />

        {isAdmin && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); bannerUpload.trigger(); }}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            title="Alterar banner"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        )}

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
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
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); logoUpload.trigger(); }}
                className="absolute -bottom-1 -right-1 z-10 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
                title="Alterar logo"
              >
                <Pencil className="h-3 w-3" />
              </button>
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
        <div className="flex items-center gap-1.5">
          {editingName ? (
            <input
              ref={nameRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setNameValue(company.name); setEditingName(false); } }}
              onClick={(e) => e.stopPropagation()}
              className="text-lg font-bold text-foreground bg-transparent border-b-2 border-primary outline-none w-full"
              maxLength={60}
            />
          ) : (
            <>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{company.name}</h3>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary"
                  title="Editar nome"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {editingSubtitle ? (
            <input
              ref={subtitleRef}
              value={subtitleValue}
              onChange={(e) => setSubtitleValue(e.target.value)}
              onBlur={commitSubtitle}
              onKeyDown={(e) => { if (e.key === "Enter") commitSubtitle(); if (e.key === "Escape") { setSubtitleValue(company.subtitle); setEditingSubtitle(false); } }}
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-muted-foreground bg-transparent border-b border-primary/50 outline-none w-full"
              maxLength={80}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{company.subtitle}</p>
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingSubtitle(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary"
                  title="Editar descrição"
                >
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              )}
            </>
          )}
        </div>
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

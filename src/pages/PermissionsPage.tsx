import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTabPermissions, TAB_KEYS, TAB_LABELS } from '@/hooks/useTabPermissions';
import { useSectionPermissions, TAB_SECTIONS } from '@/hooks/useSectionPermissions';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Check, X, Loader2, ArrowLeft, Building2, ChevronRight, ChevronDown, User, Pencil, Eye, Info, EyeOff, Settings2 } from 'lucide-react';
import type { TabKey } from '@/hooks/useTabPermissions';

const TAB_DESCRIPTIONS: Record<TabKey, string> = {
  dashboard: 'Visão geral com métricas, gráficos de desempenho e resumo de atividades do projeto.',
  schedule: 'Cronograma master com datas, marcos e prazos de cada etapa do projeto.',
  pipeline: 'Pipeline de projetos com acompanhamento visual do progresso de cada entrega.',
  matrix: 'Matriz de responsabilidades com Kanban, tarefas atribuídas por cargo e área.',
  workflow: 'Fluxograma visual dos processos operacionais e suas dependências.',
  deadlines: 'Gestão de prazos críticos, crises e alertas de vencimentos próximos.',
  budget: 'Controle financeiro com entradas, categorias e participantes do orçamento.',
  team: 'Painel do time com KPIs individuais, SLA, atividades e histórico de performance.',
};
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
}

interface CompanyPerm {
  user_id: string;
  company_id: string;
  granted: boolean;
}

const COMPANIES_KEY = "endocenter_companies";
const STORAGE_KEY = "endocenter_settings";

function loadCompanyList(): { id: string; name: string }[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((c: any) => ({ id: c.id, name: c.name }));
    }
  } catch {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return [{ id: "default", name: data.company?.name || "Endocenter" }];
    }
  } catch {}
  return [{ id: "default", name: "Endocenter" }];
}

function getInitials(name: string | null, email: string | null) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

/* ── Toggle Pill ── */
function TogglePill({ label, granted, onToggle, description }: { label: string; granted: boolean; onToggle: () => void; description?: string }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            granted
              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
              : 'bg-muted/40 text-muted-foreground border border-border/50 hover:bg-muted/60'
          }`}
        >
          {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 opacity-40" />}
          {label}
        </motion.button>
        {description && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowInfo(!showInfo)}
            className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Info className="h-3 w-3" />
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {showInfo && description && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="absolute left-0 top-full mt-1.5 z-10 w-64 p-2.5 rounded-xl bg-popover border border-border shadow-lg"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── User Profile Detail Panel ── */
function UserProfilePanel({
  profile,
  permissions,
  companyPerms,
  companies,
  onToggleTab,
  onToggleAllTabs,
  onToggleCompany,
  onClose,
  getUserSectionPerm,
  onSetSectionPerm,
}: {
  profile: UserProfile;
  permissions: { user_id: string; tab_key: string; granted: boolean }[];
  companyPerms: CompanyPerm[];
  companies: { id: string; name: string }[];
  onToggleTab: (tabKey: string, current: boolean) => void;
  onToggleAllTabs: () => void;
  onToggleCompany: (companyId: string, current: boolean) => void;
  onClose: () => void;
  getUserSectionPerm: (tabKey: string, sectionKey: string) => { canView: boolean; canEdit: boolean };
  onSetSectionPerm: (tabKey: string, sectionKey: string, canView: boolean, canEdit: boolean) => void;
}) {
  const [expandedTab, setExpandedTab] = useState<string | null>(null);

  const getUserPerm = (tabKey: string) =>
    permissions.find(p => p.user_id === profile.id && p.tab_key === tabKey)?.granted ?? false;
  const allGranted = TAB_KEYS.every(k => getUserPerm(k));
  const grantedCount = TAB_KEYS.filter(k => getUserPerm(k)).length;
  const getCompanyPerm = (companyId: string) =>
    companyPerms.find(p => p.user_id === profile.id && p.company_id === companyId)?.granted ?? false;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center ios-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col ios-modal-surface"
        style={{
          borderRadius: "var(--ios-radius-2xl, 28px) var(--ios-radius-2xl, 28px) 0 0",
        }}
      >
        {/* Grab handle mobile */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-foreground/10" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-border/30">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary shrink-0">
            {getInitials(profile.display_name, profile.email)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">
              {profile.display_name || 'Sem nome'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Abas do Dashboard ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Abas do Dashboard
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onToggleAllTabs}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  allGranted
                    ? 'bg-primary/12 text-primary border border-primary/25'
                    : 'bg-muted/40 text-muted-foreground border border-border/50'
                }`}
              >
                {allGranted ? 'Revogar todos' : 'Liberar todos'}
              </motion.button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {grantedCount} de {TAB_KEYS.length} abas liberadas — clique em <Settings2 className="inline h-3 w-3" /> para configurar seções
            </p>

            <div className="space-y-2">
              {TAB_KEYS.map(key => {
                const granted = getUserPerm(key);
                const isExpanded = expandedTab === key;
                const sections = TAB_SECTIONS[key];

                return (
                  <div key={key} className="rounded-xl border border-border/40 overflow-hidden">
                    {/* Tab row */}
                    <div className="flex items-center gap-2 p-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onToggleTab(key, granted)}
                        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          granted
                            ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3 opacity-40" />}
                        {TAB_LABELS[key]}
                      </motion.button>

                      {/* Expand sections button */}
                      {granted && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedTab(isExpanded ? null : key)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Configurar seções"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <Settings2 className="h-3.5 w-3.5" />}
                        </motion.button>
                      )}
                    </div>

                    {/* Expanded sections */}
                    <AnimatePresence>
                      {isExpanded && granted && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border/30"
                        >
                          <div className="p-3 space-y-1.5 bg-muted/20">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                              Seções de "{TAB_LABELS[key]}"
                            </p>
                            {sections.map(section => {
                              const { canView, canEdit } = getUserSectionPerm(key, section.key);
                              return (
                                <div
                                  key={section.key}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-card/60 border border-border/30"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold text-foreground">{section.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{section.description}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* View toggle */}
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => onSetSectionPerm(key, section.key, !canView, canView ? false : canEdit)}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                        canView
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                          : 'bg-muted/50 text-muted-foreground/40'
                                      }`}
                                      title={canView ? 'Pode ver' : 'Não pode ver'}
                                    >
                                      {canView ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                    </motion.button>

                                    {/* Edit toggle */}
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        if (!canView) return; // Must be viewable to be editable
                                        onSetSectionPerm(key, section.key, canView, !canEdit);
                                      }}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                        canEdit
                                          ? 'bg-primary/15 text-primary'
                                          : 'bg-muted/50 text-muted-foreground/40'
                                      } ${!canView ? 'opacity-30 cursor-not-allowed' : ''}`}
                                      title={canEdit ? 'Pode editar' : 'Somente leitura'}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </motion.button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Acesso a Empresas ── */}
          {companies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Acesso a Empresas
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Empresas que este profissional pode visualizar.
              </p>
              <div className="flex flex-wrap gap-2">
                {companies.map(c => (
                  <TogglePill
                    key={c.id}
                    label={c.name}
                    granted={getCompanyPerm(c.id)}
                    onToggle={() => onToggleCompany(c.id, getCompanyPerm(c.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Edição de Interface ── */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edição na Interface
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Permissões de edição são controladas automaticamente pelo cargo do usuário. 
              Cada profissional pode editar apenas seu próprio perfil.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <Check className="h-3.5 w-3.5" /> Editar perfil próprio
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground border border-border/50">
                <X className="h-3 w-3 opacity-40" /> Editar perfis de outros
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground border border-border/50">
                <X className="h-3 w-3 opacity-40" /> Configurações gerais
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function PermissionsPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { permissions, loading: permLoading, setPermission, setAllPermissions } = useTabPermissions();
  const { getUserSectionPerm, setSectionPermission, loading: secLoading } = useSectionPermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [companyPerms, setCompanyPerms] = useState<CompanyPerm[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const companies = loadCompanyList();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, email, display_name');
      setUsers((data || []).filter(u => u.id !== user?.id) as UserProfile[]);
      setLoadingUsers(false);
    };
    if (user) fetchUsers();
  }, [user]);

  useEffect(() => {
    const fetchCompanyPerms = async () => {
      const { data } = await supabase.from('company_permissions').select('user_id, company_id, granted') as { data: CompanyPerm[] | null };
      setCompanyPerms(data || []);
    };
    if (user) fetchCompanyPerms();
  }, [user]);

  const toggleCompanyPerm = async (userId: string, companyId: string, current: boolean) => {
    if (current) {
      await supabase.from('company_permissions').delete().match({ user_id: userId, company_id: companyId } as any);
      setCompanyPerms(prev => prev.filter(p => !(p.user_id === userId && p.company_id === companyId)));
    } else {
      await supabase.from('company_permissions').upsert({
        user_id: userId, company_id: companyId, granted: true, granted_by: user?.id,
      } as any, { onConflict: 'user_id,company_id' });
      setCompanyPerms(prev => [
        ...prev.filter(p => !(p.user_id === userId && p.company_id === companyId)),
        { user_id: userId, company_id: companyId, granted: true },
      ]);
    }
    toast.success(!current ? 'Acesso concedido' : 'Acesso revogado');
  };

  const handleToggleTab = async (userId: string, tabKey: string, current: boolean) => {
    await setPermission(userId, tabKey, !current);
    toast.success(!current ? 'Permissão concedida' : 'Permissão revogada');
  };

  const handleToggleAllTabs = async (userId: string) => {
    const allGranted = TAB_KEYS.every(k =>
      permissions.find(p => p.user_id === userId && p.tab_key === k)?.granted ?? false
    );
    await setAllPermissions(userId, !allGranted);
    toast.success(!allGranted ? 'Todas concedidas' : 'Todas revogadas');
  };

  if (roleLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const getGrantedTabCount = (userId: string) =>
    TAB_KEYS.filter(k => permissions.find(p => p.user_id === userId && p.tab_key === k)?.granted).length;

  const getGrantedCompanyCount = (userId: string) =>
    companies.filter(c => companyPerms.find(p => p.user_id === userId && p.company_id === c.id)?.granted).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="liquid-glass-navbar sticky top-0 w-full z-30 border-b border-border/20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Gerenciar Permissões</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-8">
        {loadingUsers ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Quando outros usuários se registrarem, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">
              Clique em um profissional para gerenciar suas permissões.
            </p>
            {users.map((u, i) => {
              const tabCount = getGrantedTabCount(u.id);
              const companyCount = getGrantedCompanyCount(u.id);
              return (
                <motion.button
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:bg-muted/20 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground bg-primary shrink-0">
                    {getInitials(u.display_name, u.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {u.display_name || 'Sem nome'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {tabCount}/{TAB_KEYS.length} abas
                      </span>
                      {companies.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {companyCount}/{companies.length} empresas
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      {/* User Detail Panel */}
      <AnimatePresence>
        {selectedUser && (
          <UserProfilePanel
            profile={selectedUser}
            permissions={permissions}
            companyPerms={companyPerms}
            companies={companies}
            onToggleTab={(tabKey, current) => handleToggleTab(selectedUser.id, tabKey, current)}
            onToggleAllTabs={() => handleToggleAllTabs(selectedUser.id)}
            onToggleCompany={(companyId, current) => toggleCompanyPerm(selectedUser.id, companyId, current)}
            onClose={() => setSelectedUser(null)}
            getUserSectionPerm={(tabKey, sectionKey) => getUserSectionPerm(selectedUser.id, tabKey, sectionKey)}
            onSetSectionPerm={async (tabKey, sectionKey, canView, canEdit) => {
              await setSectionPermission(selectedUser.id, tabKey, sectionKey, canView, canEdit);
              toast.success(canView ? (canEdit ? 'Visualização + edição' : 'Somente visualização') : 'Seção oculta');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

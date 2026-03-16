import { useState, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ExternalLink, Trash2, TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Loader2, X, Pencil,
  Instagram, Facebook, RefreshCw,
} from "lucide-react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSocialAccounts, PLATFORM_CONFIG, type SocialPlatform, type SocialAccount } from "@/hooks/useSocialAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useSectionPermissions } from "@/hooks/useSectionPermissions";
import { toast } from "@/hooks/use-toast";

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
};

/* ── Add Account Modal ── */
function AddAccountModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (platform: SocialPlatform, name: string, url: string) => Promise<void>;
}) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd(platform, name.trim(), url.trim());
    setSaving(false);
    setName('');
    setUrl('');
    onClose();
  };

  if (!open) return null;

  const platforms: SocialPlatform[] = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Adicionar rede social</h3>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/50"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Platform selector */}
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Plataforma</label>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map(p => {
                    const cfg = PLATFORM_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                          platform === p
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <span className="text-lg block mb-1">{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Nome do perfil</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="@nomedoperfil"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">URL do perfil (opcional)</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://instagram.com/nomedoperfil"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Update Metrics Modal ── */
function UpdateMetricsModal({ open, onClose, account, onSave }: {
  open: boolean;
  onClose: () => void;
  account: SocialAccount;
  onSave: (data: { followers: number; engagement_rate: number; reach: number; posts_count: number }) => Promise<void>;
}) {
  const [followers, setFollowers] = useState(String(account.followers));
  const [engagement, setEngagement] = useState(String(account.engagement_rate));
  const [reach, setReach] = useState(String(account.reach));
  const [posts, setPosts] = useState(String(account.posts_count));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      followers: Number(followers) || 0,
      engagement_rate: Number(engagement) || 0,
      reach: Number(reach) || 0,
      posts_count: Number(posts) || 0,
    });
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  const fields = [
    { label: 'Seguidores', value: followers, set: setFollowers, icon: Users },
    { label: 'Engajamento (%)', value: engagement, set: setEngagement, icon: Heart },
    { label: 'Alcance', value: reach, set: setReach, icon: Eye },
    { label: 'Posts', value: posts, set: setPosts, icon: MessageCircle },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-lg">{PLATFORM_CONFIG[account.platform]?.icon}</span>
                <h3 className="text-lg font-bold text-foreground">{account.profile_name}</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/50"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-3">
              {fields.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground block">{f.label}</label>
                      <input
                        type="number"
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-secondary/30 border border-border text-sm text-foreground outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                );
              })}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 mt-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Atualizar métricas
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Account Card ── */
const AccountCard = memo(function AccountCard({ account, metricsHistory, isAdmin, canEdit, onUpdate, onDelete, onFetchApi }: {
  account: SocialAccount;
  metricsHistory: { date: string; followers: number; reach: number }[];
  isAdmin: boolean;
  canEdit: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  onFetchApi?: () => void;
}) {
  const [fetching, setFetching] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = PLATFORM_CONFIG[account.platform];
  const PlatformIcon = PLATFORM_ICONS[account.platform];

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setShowChart(true), 2000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowChart(false);
  }, []);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  };

  const stats = [
    { label: 'Seguidores', value: formatNumber(account.followers), icon: Users },
    { label: 'Engajamento', value: `${account.engagement_rate.toFixed(1)}%`, icon: Heart },
    { label: 'Alcance', value: formatNumber(account.reach), icon: Eye },
    { label: 'Posts', value: String(account.posts_count), icon: MessageCircle },
  ];

  const hasHistory = metricsHistory.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ios-card p-0 overflow-hidden group relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header with platform color */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${cfg.color}15` }}>
            {PlatformIcon ? (
              <PlatformIcon className="h-5 w-5" style={{ color: cfg.color }} />
            ) : (
              <span className="text-lg">{cfg.icon}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{account.profile_name}</p>
            <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onFetchApi && (isAdmin || canEdit) && (
            <button
              onClick={async () => {
                setFetching(true);
                await onFetchApi();
                setFetching(false);
              }}
              disabled={fetching}
              className="p-2 rounded-xl hover:bg-primary/10 transition-colors"
              title="Buscar dados via API"
            >
              {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <RefreshCw className="h-3.5 w-3.5 text-primary" />}
            </button>
          )}
          {account.profile_url && (
            <a
              href={account.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          )}
          {(isAdmin || canEdit) && (
            <>
              <button onClick={onUpdate} className="p-2 rounded-xl hover:bg-primary/10 transition-colors">
                <Pencil className="h-3.5 w-3.5 text-primary" />
              </button>
              <button onClick={onDelete} className="p-2 rounded-xl hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px bg-border/30 mx-5 rounded-2xl overflow-hidden mb-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card p-3 text-center">
              <Icon className="h-3.5 w-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Hover chart overlay — appears after 2s hover */}
      <AnimatePresence>
        {showChart && hasHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 140 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="px-4 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-semibold text-muted-foreground">Evolução de seguidores</p>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={metricsHistory}>
                <defs>
                  <linearGradient id={`hgrad-${account.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={35} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="followers" stroke={cfg.color} strokeWidth={2} fill={`url(#hgrad-${account.id})`} name="Seguidores" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
        {showChart && !hasHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 50 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 flex items-center justify-center"
          >
            <p className="text-[10px] text-muted-foreground italic">Dados insuficientes para exibir gráfico. Atualize mais de uma vez.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last updated */}
      <div className="px-5 pb-3 pt-1">
        <p className="text-[10px] text-muted-foreground">
          Atualizado em {new Date(account.last_updated).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </motion.div>
  );
});

/* ── Main Section Component ── */
export default function SocialMediaSection({ companyId }: { companyId?: string }) {
  const { accounts, metrics, loading, addAccount, updateAccount, deleteAccount, addMetricEntry, fetchFromInstagramApi } = useSocialAccounts(companyId);
  const { isAdmin } = useUserRole();
  const { canViewSection, canEditSection } = useSectionPermissions();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<SocialAccount | null>(null);

  const canView = canViewSection('dashboard', 'social_accounts');
  const canEdit = canEditSection('dashboard', 'social_accounts');

  if (!canView) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleUpdateMetrics = async (account: SocialAccount, data: { followers: number; engagement_rate: number; reach: number; posts_count: number }) => {
    // Update the account snapshot
    await updateAccount(account.id, data);
    // Also add a metric history entry
    await addMetricEntry(account.id, {
      date: new Date().toISOString().split('T')[0],
      followers: data.followers,
      engagement_rate: data.engagement_rate,
      reach: data.reach,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    });
    toast({ title: "Métricas atualizadas" });
  };

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
    toast({ title: "Conta removida" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Redes Sociais</h3>
          <p className="text-xs text-muted-foreground">Acompanhe o desenvolvimento dos perfis</p>
        </div>
        {(isAdmin || canEdit) && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
            <Share2 className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma rede social cadastrada</p>
          {(isAdmin || canEdit) && (
            <button
              onClick={() => setAddOpen(true)}
              className="text-xs text-primary font-semibold mt-2 hover:underline"
            >
              Adicionar primeira conta
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              metricsHistory={(metrics[account.id] || []).map(m => ({
                date: m.date,
                followers: m.followers,
                reach: m.reach,
              }))}
              isAdmin={isAdmin}
              canEdit={canEdit}
               onUpdate={() => setEditAccount(account)}
               onDelete={() => handleDelete(account.id)}
               onFetchApi={account.platform === 'instagram' ? () => fetchFromInstagramApi(account.id, account.profile_name) : undefined}
            />
          ))}
        </div>
      )}

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addAccount}
      />

      {editAccount && (
        <UpdateMetricsModal
          open={!!editAccount}
          onClose={() => setEditAccount(null)}
          account={editAccount}
          onSave={(data) => handleUpdateMetrics(editAccount, data)}
        />
      )}
    </div>
  );
}

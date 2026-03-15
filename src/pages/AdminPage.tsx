import { useState, useEffect, useCallback } from 'react';
import InviteManager from '@/components/admin/InviteManager';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  KeyRound, Trash2, Ban, CheckCircle2, Plus, RefreshCw,
  LogOut, ArrowLeft, Copy, CreditCard, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  api_key: string;
  email: string;
  is_active: boolean;
  payment_status: string;
  plan: string;
  note: string | null;
  active_ip: string | null;
  created_at: string;
  expires_at: string | null;
  max_devices: number;
}

const AdminPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Generate form
  const [genEmail, setGenEmail] = useState('');
  const [genPlan, setGenPlan] = useState('lifetime');
  const [genNote, setGenNote] = useState('');
  const [genQty, setGenQty] = useState(1);
  const [genPayment, setGenPayment] = useState('pending');
  const [generating, setGenerating] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke('validate-api-key', {
      body: { apiKey: '', action: 'admin_list' },
    });
    if (data?.keys) setKeys(data.keys);
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    setGenerating(true);
    const { data } = await supabase.functions.invoke('validate-api-key', {
      body: {
        apiKey: '', action: 'admin_create',
        email: genEmail || user?.email,
        plan: genPlan, note: genNote,
        quantity: genQty, payment_status: genPayment,
      },
    });
    if (data?.success) {
      toast.success(`🎉 ${data.keys.length} chave(s) gerada(s)!`);
      setGenEmail(''); setGenNote('');
      fetchKeys();
    } else {
      toast.error('Erro ao gerar chaves');
    }
    setGenerating(false);
  };

  const handleRevoke = async (id: string) => {
    await supabase.functions.invoke('validate-api-key', {
      body: { apiKey: '', action: 'admin_revoke', keyId: id },
    });
    toast.success('Chave revogada');
    fetchKeys();
  };

  const handleDelete = async (id: string) => {
    await supabase.functions.invoke('validate-api-key', {
      body: { apiKey: '', action: 'admin_delete', keyId: id },
    });
    toast.success('Chave deletada');
    fetchKeys();
  };

  const handleSetPayment = async (id: string, status: string) => {
    await supabase.functions.invoke('validate-api-key', {
      body: { apiKey: '', action: 'admin_set_payment', keyId: id, payment_status: status },
    });
    toast.success(`Status: ${status}`);
    fetchKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('📋 Chave copiada!');
  };

  const filtered = keys.filter(k =>
    k.api_key.toLowerCase().includes(search.toLowerCase()) ||
    k.email.toLowerCase().includes(search.toLowerCase()) ||
    (k.note || '').toLowerCase().includes(search.toLowerCase())
  );

  const paymentBadge = (status: string) => {
    if (status === 'paid') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Pago</Badge>;
    if (status === 'pending') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendente</Badge>;
    return <Badge variant="destructive">Cancelado</Badge>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <KeyRound size={18} className="text-primary" />
              Painel Admin — API Keys
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Generate Section */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Plus size={14} className="text-primary" /> Gerar Novas Chaves
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Email do cliente" value={genEmail} onChange={e => setGenEmail(e.target.value)} />
            <select value={genPlan} onChange={e => setGenPlan(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="lifetime">Lifetime</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
            <select value={genPayment} onChange={e => setGenPayment(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
            <Input placeholder="Nota/Label" value={genNote} onChange={e => setGenNote(e.target.value)} />
            <div className="flex gap-2">
              <Input type="number" min={1} max={50} value={genQty} onChange={e => setGenQty(parseInt(e.target.value) || 1)} className="w-20" />
              <Button onClick={handleCreate} disabled={generating} className="flex-1">
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Gerar
              </Button>
            </div>
          </div>
        </div>

        {/* Invite Manager */}
        <div className="bg-card border border-border rounded-xl p-5">
          <InviteManager />
        </div>

        {/* Search + Stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por chave, email ou nota..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={fetchKeys}>
            <RefreshCw size={12} /> Atualizar
          </Button>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Total: <strong className="text-foreground">{keys.length}</strong></span>
            <span>Pagas: <strong className="text-emerald-400">{keys.filter(k => k.payment_status === 'paid').length}</strong></span>
            <span>Pendentes: <strong className="text-amber-400">{keys.filter(k => k.payment_status === 'pending').length}</strong></span>
          </div>
        </div>

        {/* Keys Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Chave</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Ativo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nota</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma chave encontrada</td></tr>
                ) : filtered.map(k => (
                  <tr key={k.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-xs bg-secondary/60 px-2 py-0.5 rounded">{k.api_key}</code>
                        <button onClick={() => copyKey(k.api_key)} className="text-muted-foreground hover:text-foreground">
                          <Copy size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{k.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{k.plan}</Badge>
                    </td>
                    <td className="px-4 py-3">{paymentBadge(k.payment_status)}</td>
                    <td className="px-4 py-3">
                      {k.is_active
                        ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ativa</Badge>
                        : <Badge variant="destructive">Revogada</Badge>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{k.active_ip || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{k.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {k.payment_status !== 'paid' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:text-emerald-300"
                            title="Marcar como Pago" onClick={() => handleSetPayment(k.id, 'paid')}>
                            <CreditCard size={13} />
                          </Button>
                        )}
                        {k.payment_status === 'paid' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:text-amber-300"
                            title="Marcar como Pendente" onClick={() => handleSetPayment(k.id, 'pending')}>
                            <CreditCard size={13} />
                          </Button>
                        )}
                        {k.is_active && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:text-amber-300"
                            title="Revogar" onClick={() => handleRevoke(k.id)}>
                            <Ban size={13} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80"
                          title="Deletar" onClick={() => handleDelete(k.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

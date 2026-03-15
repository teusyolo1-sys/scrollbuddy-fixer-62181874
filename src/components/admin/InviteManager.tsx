import { useState } from 'react';
import { useInvites, Invite } from '@/hooks/useInvites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, Link2, Loader2, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InviteManager = () => {
  const { invites, loading, createInvite, deleteInvite } = useInvites();
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);

  const baseUrl = window.location.origin;

  const handleCreate = async () => {
    setCreating(true);
    try {
      const invite = await createInvite({ max_uses: maxUses, note });
      if (invite) {
        const link = `${baseUrl}/auth?invite=${invite.code}`;
        await navigator.clipboard.writeText(link);
        toast.success('Convite criado e link copiado!');
        setNote('');
        setMaxUses(1);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setCreating(false);
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/auth?invite=${code}`);
    toast.success('Link copiado!');
  };

  const handleDelete = async (id: string) => {
    await deleteInvite(id);
    toast.success('Convite removido');
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link2 size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Convites</h2>
      </div>

      {/* Create invite form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Nota (opcional)</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Para João da equipe de design"
              className="text-sm"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-muted-foreground mb-1 block">Máx. usos</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="text-sm"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating} size="sm" className="gap-1.5">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Gerar convite
          </Button>
        </div>
      </div>

      {/* Invite list */}
      <div className="space-y-2">
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum convite criado ainda</p>
        ) : (
          invites.map((inv: Invite) => {
            const isExhausted = inv.use_count >= inv.max_uses;
            return (
              <div
                key={inv.id}
                className={`bg-card border border-border rounded-lg p-3 flex items-center gap-3 ${isExhausted ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-primary truncate">{inv.code}</code>
                    {inv.note && <span className="text-xs text-muted-foreground truncate">— {inv.note}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {inv.use_count}/{inv.max_uses} usos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(inv.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                    {isExhausted && <span className="text-destructive font-medium">Esgotado</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(inv.code)} title="Copiar link">
                  <Copy size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inv.id)} title="Excluir">
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InviteManager;

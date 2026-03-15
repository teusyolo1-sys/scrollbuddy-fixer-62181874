import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTabPermissions, TAB_KEYS, TAB_LABELS, type TabKey } from '@/hooks/useTabPermissions';
import { motion } from 'framer-motion';
import { Shield, Users, Check, X, Loader2, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
}

export default function PermissionsPage() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { permissions, loading: permLoading, setPermission, setAllPermissions } = useTabPermissions();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, email, display_name');
      setUsers((data || []).filter(u => u.id !== user?.id) as UserProfile[]);
      setLoadingUsers(false);
    };
    if (user) fetchUsers();
  }, [user]);

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

  const getUserPerm = (userId: string, tabKey: string) => {
    return permissions.find(p => p.user_id === userId && p.tab_key === tabKey)?.granted ?? false;
  };

  const getUserAllGranted = (userId: string) => {
    return TAB_KEYS.every(k => getUserPerm(userId, k));
  };

  const handleToggle = async (userId: string, tabKey: string, current: boolean) => {
    await setPermission(userId, tabKey, !current);
    toast.success(!current ? 'Permissão concedida' : 'Permissão revogada');
  };

  const handleToggleAll = async (userId: string) => {
    const allGranted = getUserAllGranted(userId);
    await setAllPermissions(userId, !allGranted);
    toast.success(!allGranted ? 'Todas as permissões concedidas' : 'Todas as permissões revogadas');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="liquid-glass-navbar sticky top-0 w-full z-30 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-4 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-white/80" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-white">Gerenciar Permissões</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-8">
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
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                Acesso liberado
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-muted border border-border" />
                Sem acesso
              </div>
            </div>

            {/* Users table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground min-w-[200px]">Usuário</th>
                    {TAB_KEYS.map(key => (
                      <th key={key} className="text-center py-3 px-2 text-xs font-medium text-muted-foreground min-w-[90px]">
                        {TAB_LABELS[key]}
                      </th>
                    ))}
                    <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground min-w-[80px]">Todos</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const allGranted = getUserAllGranted(u.id);
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-foreground">{u.display_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        {TAB_KEYS.map(tabKey => {
                          const granted = getUserPerm(u.id, tabKey);
                          return (
                            <td key={tabKey} className="text-center py-3 px-2">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleToggle(u.id, tabKey, granted)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                                  granted
                                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                    : 'bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50'
                                }`}
                              >
                                {granted ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                              </motion.button>
                            </td>
                          );
                        })}
                        <td className="text-center py-3 px-2">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => handleToggleAll(u.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                              allGranted
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'bg-muted/30 text-muted-foreground border border-border/50 hover:bg-muted/50'
                            }`}
                            title={allGranted ? 'Revogar todos' : 'Conceder todos'}
                          >
                            {allGranted ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import type { TabKey } from './useTabPermissions';

export interface TabSection {
  key: string;
  label: string;
  description: string;
}

// Sections available in each tab
export const TAB_SECTIONS: Record<TabKey, TabSection[]> = {
  dashboard: [
    { key: 'metrics', label: 'Métricas', description: 'Cards de KPIs e indicadores principais' },
    { key: 'charts', label: 'Gráficos', description: 'Gráficos de desempenho e evolução' },
    { key: 'activity_summary', label: 'Resumo de atividades', description: 'Feed de atividades recentes' },
  ],
  schedule: [
    { key: 'calendar_view', label: 'Calendário', description: 'Visualização do cronograma em calendário' },
    { key: 'milestones', label: 'Marcos', description: 'Marcos e datas importantes do projeto' },
  ],
  pipeline: [
    { key: 'project_cards', label: 'Cards de projetos', description: 'Cards visuais de cada projeto no pipeline' },
    { key: 'status_filters', label: 'Filtros de status', description: 'Filtros para organizar por status' },
  ],
  matrix: [
    { key: 'kanban_board', label: 'Kanban', description: 'Quadro Kanban com tarefas por coluna' },
    { key: 'task_creation', label: 'Criar tarefas', description: 'Botão para adicionar novas tarefas' },
    { key: 'task_details', label: 'Detalhes da tarefa', description: 'Modal com detalhes, chat e anexos' },
  ],
  workflow: [
    { key: 'diagram', label: 'Fluxograma', description: 'Visualização do diagrama de processos' },
    { key: 'process_editor', label: 'Editor de processos', description: 'Adicionar/editar etapas do fluxo' },
  ],
  deadlines: [
    { key: 'crisis_list', label: 'Lista de crises', description: 'Lista de prazos críticos e urgentes' },
    { key: 'deadline_alerts', label: 'Alertas', description: 'Notificações de vencimentos próximos' },
  ],
  budget: [
    { key: 'entries_table', label: 'Tabela de entradas', description: 'Lista de entradas financeiras e categorias' },
    { key: 'budget_charts', label: 'Gráficos financeiros', description: 'Gráficos de distribuição do orçamento' },
    { key: 'participants', label: 'Participantes', description: 'Gestão de participantes em entradas' },
  ],
  team: [
    { key: 'own_profile_only', label: 'Apenas próprio perfil', description: 'Restringe a visualização apenas ao perfil do próprio usuário, sem ver os colegas' },
    { key: 'kpis', label: 'KPIs individuais', description: 'Cards de performance de cada membro' },
    { key: 'sla_charts', label: 'Gráficos de SLA', description: 'Gráficos de SLA e tempo de entrega' },
    { key: 'activities', label: 'Atividades', description: 'Registro de atividades da equipe' },
    { key: 'complaints_history', label: 'Histórico de sinalizações', description: 'Reclamações e feedbacks (admin)' },
  ],
};

export interface SectionPermission {
  user_id: string;
  tab_key: string;
  section_key: string;
  can_view: boolean;
  can_edit: boolean;
}

export function useSectionPermissions() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [permissions, setPermissions] = useState<SectionPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) { setPermissions([]); setLoading(false); return; }
    const { data } = await supabase
      .from('tab_section_permissions' as any)
      .select('user_id, tab_key, section_key, can_view, can_edit')
      .order('created_at', { ascending: true }) as { data: any[] | null };
    setPermissions((data || []) as SectionPermission[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const setSectionPermission = async (
    userId: string,
    tabKey: string,
    sectionKey: string,
    canView: boolean,
    canEdit: boolean
  ) => {
    await supabase.from('tab_section_permissions' as any).upsert({
      user_id: userId,
      tab_key: tabKey,
      section_key: sectionKey,
      can_view: canView,
      can_edit: canEdit,
      granted_by: user?.id,
    } as any, { onConflict: 'user_id,tab_key,section_key' });

    setPermissions(prev => {
      const filtered = prev.filter(p => !(p.user_id === userId && p.tab_key === tabKey && p.section_key === sectionKey));
      return [...filtered, { user_id: userId, tab_key: tabKey, section_key: sectionKey, can_view: canView, can_edit: canEdit }];
    });
  };

  // Check if current user can view a section
  const canViewSection = (tabKey: string, sectionKey: string): boolean => {
    if (isAdmin) return true;
    const perm = permissions.find(p => p.user_id === user?.id && p.tab_key === tabKey && p.section_key === sectionKey);
    // If no explicit permission exists, default to visible (tab-level permission already controls access)
    return perm?.can_view ?? true;
  };

  // Check if current user can edit a section
  const canEditSection = (tabKey: string, sectionKey: string): boolean => {
    if (isAdmin) return true;
    const perm = permissions.find(p => p.user_id === user?.id && p.tab_key === tabKey && p.section_key === sectionKey);
    return perm?.can_edit ?? false;
  };

  // Get permissions for a specific user (admin view)
  const getUserSectionPerm = (userId: string, tabKey: string, sectionKey: string): { canView: boolean; canEdit: boolean } => {
    const perm = permissions.find(p => p.user_id === userId && p.tab_key === tabKey && p.section_key === sectionKey);
    return { canView: perm?.can_view ?? true, canEdit: perm?.can_edit ?? false };
  };

  return { permissions, loading, setSectionPermission, canViewSection, canEditSection, getUserSectionPerm, refetch: fetchPermissions };
}

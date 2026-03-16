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
    { key: 'metrics', label: 'Métricas do time', description: 'Cards com KPIs, leads qualificados, CPL e ROAS' },
    { key: 'charts', label: 'Métricas do cliente', description: 'Gráficos de seguidores, conversão e faturamento' },
    { key: 'social_accounts', label: 'Redes sociais', description: 'Gerenciamento de contas sociais conectadas' },
    { key: 'team_composition', label: 'Composição da equipe', description: 'Cards dos membros da equipe' },
    { key: 'remuneration_values', label: 'Valores financeiros da equipe', description: 'Remuneração, valor/hora e custos' },
  ],
  schedule: [
    { key: 'calendar_view', label: 'Calendário semanal', description: 'Visualização das semanas com tarefas' },
    { key: 'task_hours', label: 'Horas por tarefa', description: 'Contagem de horas por função e tarefa' },
    { key: 'add_tasks', label: 'Adicionar tarefas', description: 'Permissão para criar novas tarefas no cronograma' },
  ],
  pipeline: [
    { key: 'project_cards', label: 'Cards de projetos', description: 'Visualização dos projetos com progresso' },
    { key: 'project_values', label: 'Valores de investimento', description: 'Valores financeiros por projeto' },
    { key: 'edit_pipeline', label: 'Editar pipeline', description: 'Adicionar, remover e editar projetos e tarefas' },
  ],
  matrix: [
    { key: 'kanban_board', label: 'Quadro Kanban', description: 'Visualização das tarefas por coluna' },
    { key: 'task_creation', label: 'Criar tarefas', description: 'Botão para adicionar novas tarefas' },
    { key: 'task_details', label: 'Detalhes da tarefa', description: 'Abrir modal com descrição, checklist, chat e anexos' },
    { key: 'task_chat', label: 'Chat nas tarefas', description: 'Enviar mensagens dentro das tarefas' },
    { key: 'move_tasks', label: 'Mover tarefas', description: 'Arrastar tarefas entre colunas' },
  ],
  workflow: [
    { key: 'diagram', label: 'Fluxograma visual', description: 'Visualização do diagrama de processos' },
    { key: 'process_editor', label: 'Editar processos', description: 'Adicionar, editar e remover etapas do fluxo' },
    { key: 'rules_and_sla', label: 'Regras e SLAs', description: 'Visualização das regras e prazos de cada etapa' },
  ],
  deadlines: [
    { key: 'crisis_list', label: 'Lista de prazos', description: 'Tabela de prazos críticos com status' },
    { key: 'deadline_alerts', label: 'Alertas', description: 'Notificações visuais de vencimentos' },
    { key: 'crisis_scenarios', label: 'Cenários de crise', description: 'Planos de contingência e passos' },
    { key: 'edit_deadlines', label: 'Editar prazos', description: 'Adicionar e modificar prazos e cenários' },
  ],
  budget: [
    { key: 'entries_table', label: 'Entradas financeiras', description: 'Tabela de investimentos, gastos e faturamento' },
    { key: 'budget_charts', label: 'Gráficos financeiros', description: 'Distribuição e evolução do orçamento' },
    { key: 'participants', label: 'Participantes', description: 'Quem está envolvido em cada entrada' },
    { key: 'agency_fees', label: 'Taxas da agência', description: 'Valores de fee da agência' },
    { key: 'edit_budget', label: 'Editar orçamento', description: 'Adicionar e modificar entradas financeiras' },
  ],
  team: [
    { key: 'own_profile_only', label: 'Apenas próprio perfil', description: 'Restringe visualização apenas ao perfil do próprio usuário' },
    { key: 'kpis', label: 'KPIs individuais', description: 'Cards de performance de cada membro' },
    { key: 'sla_charts', label: 'Gráficos de SLA', description: 'Gráficos de SLA e tempo de entrega' },
    { key: 'activities', label: 'Atividades', description: 'Registro de atividades da equipe' },
    { key: 'complaints_history', label: 'Histórico de sinalizações', description: 'Reclamações e feedbacks internos' },
    { key: 'team_remuneration', label: 'Remuneração do time', description: 'Valores salariais e custos do time' },
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

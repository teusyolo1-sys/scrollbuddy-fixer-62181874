import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  html_content: string | null;
  zip_file_path: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  version_number: number;
  html_content: string;
  label: string | null;
  created_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar projetos');
    } else {
      setProjects((data as Project[]) || []);
    }
    setLoading(false);
  }, [user]);

  const saveProject = useCallback(async (
    projectId: string | null,
    name: string,
    htmlContent: string
  ): Promise<string | null> => {
    if (!user) return null;

    if (projectId) {
      const { error } = await supabase
        .from('projects')
        .update({ name, html_content: htmlContent, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      if (error) {
        toast.error('Erro ao salvar projeto');
        return null;
      }
      return projectId;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name, html_content: htmlContent })
        .select('id')
        .single();
      if (error) {
        toast.error('Erro ao criar projeto');
        return null;
      }
      return (data as { id: string }).id;
    }
  }, [user]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir projeto');
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Projeto excluído');
    }
  }, []);

  const saveVersion = useCallback(async (projectId: string, htmlContent: string, label?: string) => {
    if (!user) return;
    // Get next version number
    const { data: existing } = await supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? (existing[0] as { version_number: number }).version_number + 1 : 1;

    const { error } = await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        user_id: user.id,
        version_number: nextVersion,
        html_content: htmlContent,
        label: label || `Versão ${nextVersion}`,
      });

    if (error) {
      toast.error('Erro ao salvar versão');
    }
  }, [user]);

  const fetchVersions = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar versões');
    } else {
      setVersions((data as ProjectVersion[]) || []);
    }
  }, []);

  return {
    projects, versions, loading,
    fetchProjects, saveProject, deleteProject,
    saveVersion, fetchVersions,
  };
};

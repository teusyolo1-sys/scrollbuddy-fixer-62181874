import { useEffect, useState } from 'react';
import { useProjects, type Project } from '@/hooks/useProjects';
import { FolderOpen, Trash2, Clock, Plus, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onNewProject: () => void;
}

const ProjectsDialog = ({ open, onClose, onLoadProject, onNewProject }: Props) => {
  const { projects, loading, fetchProjects, deleteProject } = useProjects();

  useEffect(() => {
    if (open) fetchProjects();
  }, [open, fetchProjects]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Meus Projetos</h2>
          <button onClick={onNewProject} className="tb-btn bg-primary text-primary-foreground text-xs">
            <Plus size={12} /> Novo
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {!loading && projects.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhum projeto salvo ainda
            </p>
          )}

          {projects.map(project => (
            <div
              key={project.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/60 transition-colors cursor-pointer group"
              onClick={() => { onLoadProject(project); onClose(); }}
            >
              <FolderOpen size={18} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/20 text-destructive/60 hover:text-destructive transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsDialog;

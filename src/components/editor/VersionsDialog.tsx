import { useEffect } from 'react';
import { useProjects, type ProjectVersion } from '@/hooks/useProjects';
import { Clock, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
  onRestore: (html: string) => void;
}

const VersionsDialog = ({ open, projectId, onClose, onRestore }: Props) => {
  const { versions, fetchVersions } = useProjects();

  useEffect(() => {
    if (open && projectId) fetchVersions(projectId);
  }, [open, projectId, fetchVersions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Histórico de Versões</h2>
          <p className="text-xs text-muted-foreground mt-1">Restaure uma versão anterior do projeto</p>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
          {versions.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhuma versão salva ainda
            </p>
          )}

          {versions.map(v => (
            <div
              key={v.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/60 transition-colors group"
            >
              <Clock size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{v.label || `Versão ${v.version_number}`}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(v.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => { onRestore(v.html_content); onClose(); }}
                className="opacity-0 group-hover:opacity-100 tb-btn bg-primary/10 border border-primary/30 text-primary text-[10px]"
              >
                <RotateCcw size={11} />
                Restaurar
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

export default VersionsDialog;

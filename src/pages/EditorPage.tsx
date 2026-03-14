import { useRef, useEffect, useState, useCallback } from 'react';
import {
  FolderOpen, Edit3, Check, Plus, Box, Code, X, Undo2,
  Monitor, Tablet, Smartphone, Palette, Type,
  Download, SlidersHorizontal, LayoutGrid, Save,
  FolderKanban, Clock, LogOut, LayoutTemplate, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, type Project } from '@/hooks/useProjects';
import { useApiKey } from '@/hooks/useApiKey';
import { useUserRole } from '@/hooks/useUserRole';
import { useTrial } from '@/hooks/useTrial';
import ProjectsDialog from '@/components/editor/ProjectsDialog';
import VersionsDialog from '@/components/editor/VersionsDialog';
import TemplatesDialog from '@/components/editor/TemplatesDialog';
import ApiKeyModal from '@/components/editor/ApiKeyModal';
import TrialModal from '@/components/TrialModal';
import TrialTimer from '@/components/TrialTimer';
import LicenseCountdown from '@/components/LicenseCountdown';
import { toast } from 'sonner';

interface EditorState {
  hasFile: boolean;
  editMode: boolean;
  canUndo: boolean;
  fileName: string;
}

const EditorPage = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, signOut } = useAuth();
  const { saveProject, saveVersion } = useProjects();
  const { isValidated, releaseKey, expiresAt, plan } = useApiKey();
  const { isAdmin, loading: rolesLoading } = useUserRole();
  const trial = useTrial();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Block actions if trial expired and no valid key
  const canUse = isValidated || (trial.trialStarted && !trial.trialExpired);

  const requireAccess = useCallback((action: () => void) => {
    if (isValidated) {
      action();
    } else if (trial.trialStarted && !trial.trialExpired) {
      action();
    } else if (trial.trialExpired) {
      navigate('/checkout');
    } else {
      setShowApiKeyModal(true);
    }
  }, [isValidated, trial.trialStarted, trial.trialExpired, navigate]);

  const [state, setState] = useState<EditorState>({
    hasFile: false, editMode: false, canUndo: false, fileName: '',
  });
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.t === 'editorState') {
        setState({
          hasFile: e.data.hasFile,
          editMode: e.data.editMode,
          canUndo: e.data.canUndo,
          fileName: e.data.fileName,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const send = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  const handleSave = useCallback(async () => {
    send({ t: 'cmd:getHtml' });
    const handler = async (e: MessageEvent) => {
      if (e.data?.t === 'htmlContent') {
        window.removeEventListener('message', handler);
        const html = e.data.html as string;
        const name = state.fileName || 'Sem título';
        const id = await saveProject(currentProjectId, name, html);
        if (id) {
          setCurrentProjectId(id);
          await saveVersion(id, html);
          toast.success('💾 Projeto salvo!');
        }
      }
    };
    window.addEventListener('message', handler);
  }, [send, currentProjectId, state.fileName, saveProject, saveVersion]);

  const handleLoadProject = useCallback((project: Project) => {
    setCurrentProjectId(project.id);
    if (project.html_content) {
      send({ t: 'cmd:loadHtml', html: project.html_content, fileName: project.name });
    }
  }, [send]);

  const handleRestoreVersion = useCallback((html: string) => {
    send({ t: 'cmd:loadHtml', html, fileName: state.fileName });
    toast.success('🔄 Versão restaurada!');
  }, [send, state.fileName]);

  const handleInsertTemplate = useCallback((html: string) => {
    send({ t: 'cmd:insertSection', html });
    toast.success('✅ Template inserido!');
  }, [send]);

  const devices = [
    { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
    { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
    { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* TopBar */}
      <div className="h-12 min-h-[48px] flex items-center px-3 gap-1 z-50 relative border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <button onClick={() => requireAccess(() => send({ t: 'cmd:triggerZip' }))} className="tb-btn bg-gradient-to-br from-amber-500 to-amber-600 text-primary-foreground shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-px">
          <FolderOpen size={13} /> Carregar ZIP
        </button>

        <button onClick={() => requireAccess(() => setShowProjects(true))} className="tb-btn bg-secondary/60 border border-border text-secondary-foreground hover:bg-secondary hover:text-foreground">
          <FolderKanban size={12} /> Projetos
        </button>

        {state.hasFile && (
          <>
            <button onClick={() => requireAccess(() => send({ t: 'cmd:toggleEditMode' }))} className={`tb-btn ${state.editMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'}`}>
              {state.editMode ? <Check size={12} /> : <Edit3 size={12} />}
              {state.editMode ? 'Finalizar' : 'Editar'}
            </button>

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            {state.editMode && (
              <>
                <button onClick={() => requireAccess(() => send({ t: 'cmd:openModal', id: 'add-sec-modal' }))} className="tb-btn bg-secondary/60 border border-border text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Plus size={11} /> Seção
                </button>
                <button onClick={() => requireAccess(() => setShowTemplates(true))} className="tb-btn bg-secondary/60 border border-border text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <LayoutTemplate size={11} /> Templates
                </button>
                <button onClick={() => requireAccess(() => send({ t: 'cmd:addContainer' }))} className="tb-btn bg-secondary/60 border border-border text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Box size={11} /> Contêiner
                </button>
                <button onClick={() => requireAccess(() => send({ t: 'cmd:openModal', id: 'code-modal' }))} className="tb-btn bg-secondary/60 border border-border text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Code size={12} /> Código
                </button>
              </>
            )}

            <button onClick={() => send({ t: 'cmd:closeFile' })} className="tb-btn bg-destructive/10 border border-destructive/25 text-destructive/70 hover:bg-destructive/20">
              <X size={11} /> Fechar
            </button>

            <div className="flex-1" />

            {state.canUndo && (
              <button onClick={() => send({ t: 'cmd:undo' })} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                <Undo2 size={12} /> Desfazer
              </button>
            )}

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            <div className="flex gap-0.5 bg-secondary/40 rounded-lg p-0.5">
              {devices.map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => { setDeviceMode(mode); send({ t: 'cmd:setDevice', mode }); }} title={label} className={`p-1.5 rounded-md flex items-center justify-center transition-all ${deviceMode === mode ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            <button onClick={() => send({ t: 'cmd:toggleProperties' })} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <SlidersHorizontal size={12} /> Props
            </button>
            <button onClick={() => send({ t: 'cmd:toggleStructure' })} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <LayoutGrid size={12} /> Estrutura
            </button>
            <button onClick={() => send({ t: 'cmd:openModal', id: 'global-colors-modal' })} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <Palette size={12} /> Cores
            </button>
            <button onClick={() => send({ t: 'cmd:openModal', id: 'custom-fonts-modal' })} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <Type size={12} /> Fontes
            </button>

            <button onClick={() => requireAccess(handleSave)} className="tb-btn bg-emerald-600 text-primary-foreground shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-px">
              <Save size={12} /> Salvar
            </button>

            {currentProjectId && (
              <button onClick={() => setShowVersions(true)} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                <Clock size={12} /> Versões
              </button>
            )}

            <button onClick={() => requireAccess(() => send({ t: 'cmd:downloadZip' }))} className="tb-btn bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-px">
              <Download size={12} /> ZIP
            </button>

            <div className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary/10 border border-primary/25 text-primary whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
              ✅ {state.fileName}
            </div>
          </>
        )}

        {!state.hasFile && <div className="flex-1" />}

        {/* Admin — only visible for admin role */}
        {isAdmin && (
          <button onClick={() => navigate('/admin')} title="Painel Admin" className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary">
            <Shield size={12} />
          </button>
        )}

        <button onClick={async () => { await releaseKey(); signOut(); }} title="Sair" className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <LogOut size={12} />
        </button>
      </div>

      {/* Iframe */}
      <iframe ref={iframeRef} src="/editor.html?embedded=1" className="flex-1 w-full border-none" title="Site Editor Pro" allow="clipboard-read; clipboard-write" />

      {/* Trial Modal */}
      {!trial.loading && !isValidated && (
        <TrialModal open={trial.showTrialModal} onStart={trial.startTrial} />
      )}

      {/* Trial Timer — show when trial active and no paid key */}
      {!isValidated && trial.trialStarted && (
        <TrialTimer timeString={trial.timeString} expired={trial.trialExpired} remainingMs={trial.remainingMs} />
      )}

      {/* License countdown — floating only when ≤ 1h remaining */}
      {isValidated && <LicenseCountdown expiresAt={expiresAt} plan={plan} />}

      {/* Trial expired overlay */}
      {!isValidated && trial.trialExpired && (
        <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => navigate('/checkout')}
        >
          <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-2xl max-w-md mx-4">
            <Clock size={48} className="text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tempo esgotado!</h2>
            <p className="text-muted-foreground mb-6">
              Seu teste gratuito de 5 minutos terminou. Adquira uma licença para continuar usando o editor.
            </p>
            <button
              onClick={() => navigate('/checkout')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Ver Planos
            </button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ProjectsDialog open={showProjects} onClose={() => setShowProjects(false)} onLoadProject={handleLoadProject} onNewProject={() => { setShowProjects(false); send({ t: 'cmd:triggerZip' }); }} />
      <VersionsDialog open={showVersions} projectId={currentProjectId} onClose={() => setShowVersions(false)} onRestore={handleRestoreVersion} />
      <TemplatesDialog open={showTemplates} onClose={() => setShowTemplates(false)} onInsert={handleInsertTemplate} />
      <ApiKeyModal open={showApiKeyModal} onValidated={() => setShowApiKeyModal(false)} />
    </div>
  );
};

export default EditorPage;

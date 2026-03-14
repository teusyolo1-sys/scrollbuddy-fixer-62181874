import { useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { FolderOpen, Edit3, Check, Plus, Box, Code, X, Undo2, Monitor, Tablet, Smartphone, Palette, Type, FileCode, Download, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { loadZipFile } from '@/lib/zipLoader';
import JSZip from 'jszip';

const TopBar = () => {
  const {
    isFileLoaded, fileName, editMode,
    deviceMode, setDeviceMode, toggleEditMode,
    setFileLoaded, closeFile, setZipFiles, setBlobMap,
    setCurrentHtml, pushHistory, undo, history,
    propertiesPanelOpen, structurePanelOpen, togglePropertiesPanel, toggleStructurePanel,
  } = useEditorStore();

  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleLoadZip = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.info('⏳ Carregando...');
    try {
      const { html, zipFiles, blobMap } = await loadZipFile(file);
      setZipFiles(zipFiles);
      setBlobMap(blobMap);
      setCurrentHtml(html);
      setFileLoaded(file.name);
      setTimeout(() => pushHistory(html), 600);
      toast.success('✅ Site carregado!');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    }
    e.target.value = '';
  }, [setZipFiles, setBlobMap, setCurrentHtml, setFileLoaded, pushHistory]);

  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) {
      setCurrentHtml(prev);
      toast.success('↩ Desfeito!');
    } else {
      toast.warning('⚠️ Nada para desfazer');
    }
  }, [undo, setCurrentHtml]);

  const handleClose = useCallback(() => {
    if (confirm('Fechar o arquivo? Alterações não salvas serão perdidas.')) {
      closeFile();
      toast.success('📁 Arquivo fechado');
    }
  }, [closeFile]);

  const handleDownload = useCallback(async () => {
    const { currentHtml, zipFiles, fileName } = useEditorStore.getState();
    if (!currentHtml) {
      toast.warning('Nenhum conteúdo para baixar');
      return;
    }
    toast.info('⏳ Preparando download...');
    try {
      const zip = new JSZip();
      zip.file('index.html', currentHtml);
      for (const [path, blob] of Object.entries(zipFiles)) {
        if (!path.endsWith('.html') && !path.endsWith('/')) {
          zip.file(path, blob);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = fileName || 'site-editado.zip';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('✅ Download iniciado!');
    } catch (err: any) {
      toast.error('❌ Erro ao gerar ZIP: ' + err.message);
    }
  }, []);

  const devices = [
    { mode: 'desktop' as const, icon: Monitor, label: 'Desktop' },
    { mode: 'tablet' as const, icon: Tablet, label: 'Tablet' },
    { mode: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <>
      <input type="file" ref={zipInputRef} accept=".zip" className="hidden" onChange={handleLoadZip} />
      <div className="h-12 min-h-[48px] flex items-center px-3 gap-1 z-50 relative glass-surface border-b border-border">
        {/* Accent gradient line at top */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-accent-line)' }} />

        {/* Load ZIP button */}
        <button
          onClick={() => zipInputRef.current?.click()}
          className="tb-btn bg-gradient-to-br from-amber-500 to-amber-600 text-primary-foreground shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-px"
        >
          <FolderOpen size={13} />
          Carregar ZIP
        </button>

        {isFileLoaded && (
          <>
            {/* Edit mode toggle */}
            <button
              onClick={toggleEditMode}
              className={`tb-btn ${editMode
                ? 'bg-primary text-primary-foreground accent-glow'
                : 'accent-dim-bg border border-primary/30 text-primary hover:accent-mid-bg'
              }`}
            >
              {editMode ? <Check size={12} /> : <Edit3 size={12} />}
              {editMode ? 'Finalizar Edição' : 'Editar'}
            </button>

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            {editMode && (
              <>
                <button className="tb-btn glass-border-hi bg-secondary/60 text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Plus size={11} />
                  Seção
                </button>
                <button className="tb-btn glass-border-hi bg-secondary/60 text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Box size={11} />
                  Contêiner
                </button>
                <button className="tb-btn glass-border-hi bg-secondary/60 text-secondary-foreground hover:bg-secondary hover:text-foreground">
                  <Code size={12} />
                  Código
                </button>
              </>
            )}

            <button
              onClick={handleClose}
              className="tb-btn bg-destructive/10 border border-destructive/25 text-destructive/70 hover:bg-destructive/20"
            >
              <X size={11} />
              Fechar
            </button>

            <div className="flex-1" />

            {history.length > 1 && (
              <button onClick={handleUndo} className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                <Undo2 size={12} />
                Desfazer
              </button>
            )}

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            {/* Device buttons */}
            <div className="flex gap-0.5 bg-secondary/40 rounded-lg p-0.5">
              {devices.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setDeviceMode(mode)}
                  title={label}
                  className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                    deviceMode === mode
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <div className="w-px h-[18px] bg-border mx-1 shrink-0" />

            <button
              onClick={togglePropertiesPanel}
              className={`tb-btn border ${propertiesPanelOpen
                ? 'accent-dim-bg border-primary/30 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <SlidersHorizontal size={12} />
              Propriedades
            </button>
            <button
              onClick={toggleStructurePanel}
              className={`tb-btn border ${structurePanelOpen
                ? 'accent-dim-bg border-primary/30 text-primary'
                : 'bg-transparent border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <LayoutGrid size={12} />
              Estrutura
            </button>

            <button className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <Palette size={12} />
              Cores
            </button>
            <button className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <Type size={12} />
              Fontes
            </button>
            <button className="tb-btn bg-transparent border border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <FileCode size={12} />
              HTML
            </button>

            <button
              onClick={handleDownload}
              className="tb-btn bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-px"
            >
              <Download size={12} />
              Baixar ZIP
            </button>

            {/* Status badge */}
            <div className="px-3 py-1 rounded-full text-[10px] font-bold accent-dim-bg border border-primary/25 text-primary whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis">
              ✅ {fileName.replace('.zip', '')}
            </div>
          </>
        )}

        {!isFileLoaded && <div className="flex-1" />}
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-extrabold py-1.5 px-6 rounded-t-xl z-[9999] tracking-wider uppercase flex items-center gap-3 shadow-lg shadow-primary/30">
          ✏️ MODO EDIÇÃO ATIVO
          <button
            onClick={toggleEditMode}
            className="bg-primary-foreground/20 border-none text-primary-foreground px-2.5 py-0.5 rounded text-[10px] font-extrabold"
          >
            ✓ Finalizar
          </button>
        </div>
      )}
    </>
  );
};

export default TopBar;

import { useEditorStore } from '@/store/editorStore';
import { LayoutGrid, PanelRight, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StructurePanel = () => {
  const {
    isFileLoaded, sections, selectedSectionId,
    structurePanelOpen, structureDocked, structureMinimized,
    setSelectedSection, toggleStructurePanel, toggleStructureDock, toggleStructureMinimize,
    editMode,
  } = useEditorStore();

  const handleSelectSection = (id: string | null) => {
    if (!id || id === selectedSectionId) {
      setSelectedSection(id);
      return;
    }

    setSelectedSection(id);
    const iframe = document.getElementById('editor-preview-iframe') as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage({ t: 'hilite', id }, '*');
  };

  if (!isFileLoaded) return null;

  if (!structurePanelOpen && !structureDocked) {
    return null;
  }

  if (structureDocked) {
    return (
      <div className="w-[205px] min-w-[205px] border-l border-border flex flex-col overflow-hidden bg-card/95">
        <PanelHeader
          onClose={toggleStructurePanel}
          onDock={toggleStructureDock}
          onMinimize={toggleStructureMinimize}
          isDocked
          isMinimized={structureMinimized}
        />
        {!structureMinimized && (
          <PanelBody
            isFileLoaded={isFileLoaded}
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            editMode={editMode}
          />
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed top-[60px] right-4 w-[235px] z-[1000] rounded-[14px] glass-surface border border-border/50 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_0_1px_hsl(152_100%_45%/0.05)] flex flex-col overflow-hidden max-h-[calc(100vh-80px)]"
      >
        <PanelHeader
          onClose={toggleStructurePanel}
          onDock={toggleStructureDock}
          onMinimize={toggleStructureMinimize}
          isDocked={false}
          isMinimized={structureMinimized}
        />
        {!structureMinimized && (
          <PanelBody
            isFileLoaded={isFileLoaded}
            sections={sections}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            editMode={editMode}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const PanelHeader = ({
  onClose, onDock, onMinimize, isDocked, isMinimized
}: {
  onClose: () => void; onDock: () => void; onMinimize: () => void;
  isDocked: boolean; isMinimized: boolean;
}) => (
  <div className={`px-2.5 h-10 flex items-center gap-1.5 border-b border-border/50 shrink-0 bg-secondary/20 ${!isDocked ? 'cursor-move' : ''} select-none`}>
    <LayoutGrid size={13} className="text-primary shrink-0" />
    <span className="text-[9.5px] font-bold tracking-widest uppercase text-muted-foreground flex-1">Estrutura</span>
    <PanelBtn onClick={onDock} title={isDocked ? 'Soltar' : 'Fixar'} active={isDocked}>
      <PanelRight size={11} />
    </PanelBtn>
    <PanelBtn onClick={onMinimize} title={isMinimized ? 'Expandir' : 'Minimizar'}>
      <Minus size={10} />
    </PanelBtn>
    <PanelBtn onClick={onClose} title="Fechar">
      <X size={10} />
    </PanelBtn>
  </div>
);

const PanelBtn = ({ onClick, title, children, active }: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0 text-[10px] transition-all ${
      active
        ? 'accent-dim-bg border border-primary/30 text-primary'
        : 'bg-secondary/50 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

const PanelBody = ({
  isFileLoaded, sections, selectedSectionId, onSelectSection, editMode
}: {
  isFileLoaded: boolean; sections: any[]; selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void; editMode: boolean;
}) => (
  <div className="flex-1 overflow-y-auto p-1.5">
    {!isFileLoaded ? (
      <div className="py-6 px-4 text-center text-muted-foreground text-[11px] leading-relaxed">
        Carregue um ZIP para<br />ver a estrutura do site
      </div>
    ) : sections.length === 0 ? (
      <div className="py-6 px-4 text-center text-muted-foreground text-[11px] leading-relaxed">
        Nenhuma seção detectada
      </div>
    ) : (
      sections.map((sec) => (
        <button
          key={sec.id}
          onClick={() => onSelectSection(sec.id)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer border mb-0.5 transition-all text-left ${
            selectedSectionId === sec.id
              ? 'accent-dim-bg border-primary/20'
              : 'border-transparent hover:bg-secondary/40'
          }`}
        >
          <span className={`flex items-center shrink-0 ${selectedSectionId === sec.id ? 'text-primary' : 'text-muted-foreground'}`}>
            <LayoutGrid size={11} />
          </span>
          <span className={`text-[11px] font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${
            selectedSectionId === sec.id ? 'text-primary font-semibold' : 'text-secondary-foreground'
          }`}>
            {sec.name}
          </span>
        </button>
      ))
    )}
  </div>
);

export default StructurePanel;

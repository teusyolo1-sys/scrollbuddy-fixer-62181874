import { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getEditorScript } from '@/lib/zipLoader';
import { FolderOpen } from 'lucide-react';

const PreviewArea = () => {
  const { isFileLoaded, currentHtml, deviceMode, editMode } = useEditorStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject editor script + scrollbar patch into HTML
  const getIframeHtml = useCallback((html: string) => {
    const edScript = getEditorScript();
    const scrollbarPatch = `<style id="ed-scrollbar-patch">
      * { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.55) transparent !important; }
      ::-webkit-scrollbar { width: 8px; height: 8px; background: transparent !important; }
      ::-webkit-scrollbar-track { background: transparent !important; }
      ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.55) !important; border-radius: 9999px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.75) !important; }
      ::-webkit-scrollbar-corner { background: transparent !important; }
    </style>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${scrollbarPatch}</head>`);
    } else {
      html = `${scrollbarPatch}${html}`;
    }

    if (html.includes('</body>')) {
      return html.replace('</body>', edScript + '</body>');
    }
    return html + edScript;
  }, []);

  useEffect(() => {
    if (!iframeRef.current || !currentHtml) return;
    iframeRef.current.srcdoc = getIframeHtml(currentHtml);
  }, [currentHtml, getIframeHtml]);

  // Send edit mode to iframe
  useEffect(() => {
    if (!iframeRef.current?.contentWindow) return;
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ t: 'setEditMode', on: editMode }, '*');
    }, 200);
    return () => clearTimeout(timer);
  }, [editMode]);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (d.t === 'sel') {
        useEditorStore.getState().setSelectedSection(d.id);
      }
      if (d.t === 'elSel') {
        // Element selected in iframe - update properties
        useEditorStore.getState().setSelectedElementProps(d.props);
        useEditorStore.getState().setSelectedElement(d.props?.id || null);
      }
      if (d.t === 'sync') {
        try {
          const doc = iframeRef.current?.contentDocument;
          if (!doc) return;
          const sections = Array.from(doc.querySelectorAll('[data-ed]')).map((el) => ({
            id: el.getAttribute('data-ed')!,
            tag: el.tagName.toLowerCase(),
            name: el.getAttribute('data-ed')!,
          }));
          useEditorStore.getState().setSections(sections);
        } catch (e) { /* cross-origin */ }
      }
      if (d.t === 'ready') {
        iframeRef.current?.contentWindow?.postMessage({ t: 'setEditMode', on: useEditorStore.getState().editMode }, '*');
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage({ t: 'sync' }, '*');
          try {
            const doc = iframeRef.current?.contentDocument;
            if (!doc) return;
            const sections = Array.from(doc.querySelectorAll('[data-ed]')).map((el) => ({
              id: el.getAttribute('data-ed')!,
              tag: el.tagName.toLowerCase(),
              name: el.getAttribute('data-ed')!,
            }));
            useEditorStore.getState().setSections(sections);
          } catch (e) { /* cross-origin */ }
        }, 300);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const wrapClass = deviceMode === 'tablet' ? 'p-5' : deviceMode === 'mobile' ? 'p-5' : '';
  const frameClass = deviceMode === 'tablet'
    ? 'w-[768px] min-h-full shadow-[0_0_0_1px_hsl(0_0%_100%/0.06),0_24px_80px_rgba(0,0,0,0.8)] rounded-md'
    : deviceMode === 'mobile'
      ? 'w-[390px] min-h-full shadow-[0_0_0_1px_hsl(0_0%_100%/0.08),0_24px_80px_rgba(0,0,0,0.8)] rounded-[14px]'
      : 'w-full h-full';

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--gradient-preview)' }}>
      {/* Preview top bar with mac dots */}
      <div className="px-4 py-2 bg-background/90 border-b border-border flex items-center gap-2.5 shrink-0">
        <div className="flex gap-[5px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        </div>
        <span className="text-[10px] text-muted-foreground ml-1">
          Duplo-clique em texto para editar · Clique em imagem para trocar · Clique em seção para propriedades
        </span>
      </div>

      {/* Preview content */}
      <div className={`flex-1 overflow-auto flex items-start justify-center transition-[padding] duration-300 ${wrapClass}`}>
        {!isFileLoaded ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-12 text-center">
            <div className="text-[52px] opacity-25 animate-float">🗂️</div>
            <div className="text-xl font-bold text-foreground/50 tracking-tight">Nenhum site carregado</div>
            <div className="text-[13px] text-muted-foreground max-w-[300px] leading-relaxed">
              Clique em "Carregar ZIP" e selecione a pasta do seu site comprimida em .zip
            </div>
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="bg-primary text-primary-foreground border-none rounded-xl px-8 py-3.5 font-bold text-[13px] tracking-wide shadow-lg shadow-primary/35 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/50"
            >
              <FolderOpen className="inline mr-2" size={16} />
              Carregar ZIP do Site
            </button>
          </div>
        ) : (
          <iframe
            id="editor-preview-iframe"
            ref={iframeRef}
            className={`border-none bg-foreground shrink-0 transition-[width] duration-300 ${frameClass}`}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewArea;

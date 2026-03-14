import { useCallback, useRef } from 'react';
import { useEditorStore, type ElementProps } from '@/store/editorStore';
import Section from '@/components/editor/ui/Section';
import NumberInput from '@/components/editor/ui/NumberInput';
import ColorInput from '@/components/editor/ui/ColorInput';
import {
  Settings, Minus, X, Type, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic,
} from 'lucide-react';

const FONT_LIST = [
  'DM Sans', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Nunito', 'Syne', 'Oswald', 'Playfair Display', 'Merriweather',
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New',
];

const PropertiesPanel = () => {
  const {
    isFileLoaded, editMode, selectedElementProps, propertiesPanelOpen,
    togglePropertiesPanel,
  } = useEditorStore();

  const sendToIframe = useCallback((msg: Record<string, unknown>) => {
    const iframe = document.getElementById('editor-preview-iframe') as HTMLIFrameElement | null;
    iframe?.contentWindow?.postMessage(msg, '*');
  }, []);

  const setProp = useCallback((prop: string, value: string) => {
    sendToIframe({ t: 'setProp', prop, value });
  }, [sendToIframe]);

  if (!isFileLoaded || !propertiesPanelOpen) return null;

  const el = selectedElementProps;

  return (
    <div className="w-[280px] min-w-[280px] flex flex-col overflow-hidden border-l border-border bg-card/95">
      {/* Header */}
      <div className="px-3 h-10 flex items-center gap-1.5 border-b border-border shrink-0 bg-secondary/20 select-none">
        <Settings size={13} className="text-primary shrink-0" />
        <span className="text-[9.5px] font-bold tracking-widest uppercase text-muted-foreground flex-1">
          Propriedades
        </span>
        <button
          onClick={togglePropertiesPanel}
          className="w-[22px] h-[22px] rounded-md flex items-center justify-center bg-secondary/50 border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <X size={10} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isFileLoaded ? (
          <EmptyState icon="🖱️" title="Carregue um ZIP" desc="Carregue um arquivo ZIP contendo seu site para começar a editar" />
        ) : !editMode ? (
          <EmptyState icon="👁" title="Modo visualização" desc='Clique em "Editar" para começar a editar o site' />
        ) : !el ? (
          <EmptyState icon="🖱️" title="Clique em um elemento" desc="Selecione qualquer texto, botão ou seção no preview para editar" />
        ) : (
          <>
            {/* Element info */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <span className="text-muted-foreground">
                {isTextTag(el.tag) ? <Type size={14} /> : <Square size={14} />}
              </span>
              <span className="text-[12px] font-medium text-foreground">{el.tag.toUpperCase()}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{el.id}</span>
            </div>

            {/* Typography Section */}
            {isTextTag(el.tag) && (
              <Section title="Tipografia">
                <div className="space-y-2.5">
                  {/* Font Family */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-10 shrink-0">Fonte</span>
                    <select
                      value={getMatchingFont(el.fontFamily)}
                      onChange={(e) => setProp('fontFamily', e.target.value)}
                      className="flex-1 h-7 px-2 text-[11px] bg-secondary rounded-md text-foreground border border-transparent focus:border-primary focus:outline-none appearance-none cursor-pointer"
                    >
                      {FONT_LIST.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size + Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Tam"
                      value={parseFloat(el.fontSize) || 16}
                      onChange={(v) => setProp('fontSize', v + 'px')}
                      min={8}
                      max={200}
                      suffix="px"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground w-6 shrink-0">Peso</span>
                      <select
                        value={el.fontWeight}
                        onChange={(e) => setProp('fontWeight', e.target.value)}
                        className="flex-1 h-7 px-1.5 text-[11px] bg-secondary rounded-md text-foreground border border-transparent focus:border-primary focus:outline-none appearance-none cursor-pointer"
                      >
                        {['100','200','300','400','500','600','700','800','900'].map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line Height + Letter Spacing */}
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput
                      label="Lh"
                      value={parseFloat(el.lineHeight) || 1.5}
                      onChange={(v) => setProp('lineHeight', v + 'px')}
                      min={0}
                      step={0.1}
                      suffix="px"
                    />
                    <NumberInput
                      label="Ls"
                      value={parseFloat(el.letterSpacing) || 0}
                      onChange={(v) => setProp('letterSpacing', v + 'px')}
                      min={-5}
                      max={20}
                      step={0.5}
                      suffix="px"
                    />
                  </div>

                  {/* Text Align */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground w-10 shrink-0">Alinhar</span>
                    <div className="flex gap-0.5">
                      {(['left', 'center', 'right'] as const).map((v) => {
                        const Icon = v === 'left' ? AlignLeft : v === 'center' ? AlignCenter : AlignRight;
                        const isActive = el.textAlign === v || (el.textAlign === 'start' && v === 'left');
                        return (
                          <button
                            key={v}
                            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                              isActive ? 'accent-dim-bg border border-primary/30 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                            }`}
                            onClick={() => setProp('textAlign', v)}
                          >
                            <Icon size={13} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Color */}
                  <ColorInput
                    label="Cor"
                    value={el.color === 'transparent' ? '#FFFFFF' : el.color}
                    onChange={(c) => setProp('color', c)}
                  />
                </div>
              </Section>
            )}

            {/* Aparência Section */}
            <Section title="Aparência">
              <div className="space-y-2.5">
                {/* Background Color */}
                <ColorInput
                  label="Fundo"
                  value={el.backgroundColor === 'transparent' ? '#000000' : el.backgroundColor}
                  onChange={(c) => setProp('backgroundColor', c)}
                />

                {/* Opacity */}
                <NumberInput
                  label="Opac"
                  value={Math.round(parseFloat(el.opacity) * 100)}
                  onChange={(v) => setProp('opacity', String(v / 100))}
                  min={0}
                  max={100}
                  suffix="%"
                />

                {/* Border Radius */}
                <NumberInput
                  label="Raio"
                  value={parseFloat(el.borderRadius) || 0}
                  onChange={(v) => setProp('borderRadius', v + 'px')}
                  min={0}
                  max={999}
                  suffix="px"
                />
              </div>
            </Section>

            {/* Layout Section */}
            <Section title="Layout">
              <div className="space-y-2.5">
                {/* Width / Height */}
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="L"
                    value={parseFloat(el.width) || 0}
                    onChange={(v) => setProp('width', v + 'px')}
                    min={0}
                    suffix="px"
                  />
                  <NumberInput
                    label="A"
                    value={parseFloat(el.height) || 0}
                    onChange={(v) => setProp('height', v + 'px')}
                    min={0}
                    suffix="px"
                  />
                </div>

                {/* Padding */}
                <NumberInput
                  label="Pad"
                  value={parseFloat(el.padding) || 0}
                  onChange={(v) => setProp('padding', v + 'px')}
                  min={0}
                  suffix="px"
                />

                {/* Margin */}
                <NumberInput
                  label="Marg"
                  value={parseFloat(el.margin) || 0}
                  onChange={(v) => setProp('margin', v + 'px')}
                  min={-999}
                  suffix="px"
                />
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

function isTextTag(tag: string): boolean {
  return ['h1','h2','h3','h4','h5','h6','p','a','button','span','li','label','strong','em','small'].includes(tag);
}

function getMatchingFont(fontFamily: string): string {
  const lower = fontFamily.toLowerCase();
  for (const f of FONT_LIST) {
    if (lower.includes(f.toLowerCase())) return f;
  }
  return FONT_LIST[0];
}

const EmptyState = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="py-8 px-4 text-center text-muted-foreground">
    <div className="text-[26px] opacity-20 mb-3">{icon}</div>
    <div className="text-xs font-semibold text-foreground mb-1.5">{title}</div>
    <div className="text-[11px] leading-relaxed">{desc}</div>
  </div>
);

export default PropertiesPanel;

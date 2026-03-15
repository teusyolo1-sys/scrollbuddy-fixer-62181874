import { useRef, useCallback, useState, useEffect } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Heading1, Heading2, Heading3, Type,
  Minus, Link2, Image, Undo2, Redo2, ChevronDown,
  Subscript, Superscript, Quote, Code, RemoveFormatting
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const fontFamilies = [
  { label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'SF Mono', 'Fira Code', monospace" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const fontSizes = [
  { label: "8", value: "1" },
  { label: "10", value: "2" },
  { label: "12", value: "3" },
  { label: "14", value: "4" },
  { label: "18", value: "5" },
  { label: "24", value: "6" },
  { label: "36", value: "7" },
];

const fontWeights = [
  { label: "Thin", value: "200" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra Bold", value: "800" },
  { label: "Black", value: "900" },
];

const textColors = [
  "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#FFFFFF",
  "#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#16A34A",
  "#0284C7", "#2563EB", "#4F46E5", "#7C3AED", "#9333EA", "#C026D3",
  "#DB2777", "#E11D48",
];

type DropdownType = "font" | "size" | "weight" | "color" | "highlight" | null;

export default function RichTextEditor({ value, onChange, placeholder = "Comece a escrever...", minHeight = "400px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [currentFont, setCurrentFont] = useState("Sans Serif");
  const [currentSize, setCurrentSize] = useState("14");
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Save selection before any toolbar interaction
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore selection before executing commands
  const restoreSelection = useCallback(() => {
    const range = savedSelectionRef.current;
    if (range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    emitChange();
  }, [restoreSelection, emitChange]);

  const applyFontWeight = useCallback((weight: string) => {
    restoreSelection();
    editorRef.current?.focus();
    // Use styleWithCSS to apply font-weight via execCommand
    document.execCommand("styleWithCSS", false, "true");
    // Remove existing bold first if needed, then apply via span
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      setActiveDropdown(null);
      return;
    }
    
    // Extract contents and wrap in styled span
    const fragment = range.extractContents();
    const span = document.createElement("span");
    span.style.fontWeight = weight;
    span.appendChild(fragment);
    range.insertNode(span);
    
    // Select the new span
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.addRange(newRange);
    
    emitChange();
    setActiveDropdown(null);
  }, [restoreSelection, emitChange]);

  const applyFontFamily = useCallback((font: string, label: string) => {
    exec("fontName", font);
    setCurrentFont(label);
    setActiveDropdown(null);
  }, [exec]);

  const applyFontSize = useCallback((size: string, label: string) => {
    exec("fontSize", size);
    setCurrentSize(label);
    setActiveDropdown(null);
  }, [exec]);

  const applyColor = useCallback((color: string) => {
    exec("foreColor", color);
    setActiveDropdown(null);
  }, [exec]);

  const applyHighlight = useCallback((color: string) => {
    exec("hiliteColor", color);
    setActiveDropdown(null);
  }, [exec]);

  const insertLink = useCallback(() => {
    const url = prompt("URL do link:");
    if (url) exec("createLink", url);
  }, [exec]);

  const insertImage = useCallback(() => {
    const url = prompt("URL da imagem:");
    if (url) exec("insertImage", url);
  }, [exec]);

  const toggleBlock = useCallback((tag: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const block = node?.nodeType === 1 ? node as HTMLElement : node?.parentElement;
      const current = block?.closest("blockquote, pre, h1, h2, h3");
      if (current && current.tagName.toLowerCase() === tag.replace(/[<>]/g, "")) {
        exec("formatBlock", "<p>");
        return;
      }
    }
    exec("formatBlock", tag);
  }, [restoreSelection, exec]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  // Track selection changes inside the editor
  useEffect(() => {
    const handler = () => saveSelection();
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [saveSelection]);

  const ToolBtn = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
    >
      {children}
    </button>
  );

  const DropdownBtn = ({ type, label, children }: { type: DropdownType; label: string; children: React.ReactNode }) => (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
        onClick={() => setActiveDropdown(activeDropdown === type ? null : type)}
        className="h-7 px-2 rounded-lg flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
        title={label}
      >
        {label} <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {activeDropdown === type && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto min-w-[140px]"
          onMouseDown={(e) => e.preventDefault()}>
          {children}
        </div>
      )}
    </div>
  );

  const Divider = () => <div className="w-px h-5 bg-border/60 mx-0.5 shrink-0" />;

  return (
    <div className="flex flex-col h-full border border-border/60 rounded-2xl overflow-hidden bg-card">
      {/* Toolbar Row 1 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/30 flex-wrap">
        <ToolBtn onClick={() => exec("undo")} title="Desfazer"><Undo2 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("redo")} title="Refazer"><Redo2 className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />

        <DropdownBtn type="font" label={currentFont}>
          {fontFamilies.map((f) => (
            <button key={f.value} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFontFamily(f.value, f.label)}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors" style={{ fontFamily: f.value }}>
              {f.label}
            </button>
          ))}
        </DropdownBtn>

        <DropdownBtn type="size" label={`${currentSize}px`}>
          {fontSizes.map((s) => (
            <button key={s.value} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFontSize(s.value, s.label)}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
              {s.label}px
            </button>
          ))}
        </DropdownBtn>

        <DropdownBtn type="weight" label="Peso">
          {fontWeights.map((w) => (
            <button key={w.value} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFontWeight(w.value)}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors" style={{ fontWeight: parseInt(w.value) }}>
              {w.label}
            </button>
          ))}
        </DropdownBtn>

        <Divider />
        <ToolBtn onClick={() => exec("bold")} title="Negrito"><Bold className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Itálico"><Italic className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Sublinhado"><Underline className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("strikeThrough")} title="Tachado"><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("subscript")} title="Subscrito"><Subscript className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("superscript")} title="Sobrescrito"><Superscript className="h-3.5 w-3.5" /></ToolBtn>
      </div>

      {/* Toolbar Row 2 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/20 flex-wrap">
        <ToolBtn onClick={() => exec("formatBlock", "<h1>")} title="Título 1"><Heading1 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h2>")} title="Título 2"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<h3>")} title="Título 3"><Heading3 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("formatBlock", "<p>")} title="Parágrafo"><Type className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => toggleBlock("<blockquote>")} title="Citação"><Quote className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => toggleBlock("<pre>")} title="Código"><Code className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />

        <ToolBtn onClick={() => exec("justifyLeft")} title="Esquerda"><AlignLeft className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyCenter")} title="Centro"><AlignCenter className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyRight")} title="Direita"><AlignRight className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("justifyFull")} title="Justificar"><AlignJustify className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />

        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Lista"><List className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertOrderedList")} title="Lista numerada"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="Linha"><Minus className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />

        <DropdownBtn type="color" label="Cor">
          <div className="grid grid-cols-6 gap-1 p-2">
            {textColors.map((c) => (
              <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => applyColor(c)}
                className="w-5 h-5 rounded-md border border-border/40 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
            ))}
          </div>
        </DropdownBtn>

        <DropdownBtn type="highlight" label="Destaque">
          <div className="grid grid-cols-6 gap-1 p-2">
            {textColors.map((c) => (
              <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => applyHighlight(c)}
                className="w-5 h-5 rounded-md border border-border/40 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
            ))}
          </div>
        </DropdownBtn>
        <Divider />

        <ToolBtn onClick={insertLink} title="Link"><Link2 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={insertImage} title="Imagem"><Image className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => exec("removeFormat")} title="Limpar formatação"><RemoveFormatting className="h-3.5 w-3.5" /></ToolBtn>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="flex-1 px-5 py-4 text-sm text-foreground outline-none overflow-y-auto
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground/50 [&:empty]:before:pointer-events-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_pre]:bg-secondary [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          [&_a]:text-primary [&_a]:underline
          [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2
          [&_hr]:border-border/50 [&_hr]:my-3"
        style={{ minHeight }}
      />
    </div>
  );
}

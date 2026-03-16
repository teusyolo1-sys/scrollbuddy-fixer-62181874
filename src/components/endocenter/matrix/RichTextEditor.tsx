import { useRef, useCallback, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Heading1, Heading2, Heading3, Type,
  Minus, Link2, Image, Undo2, Redo2, ChevronDown,
  Subscript, Superscript, Quote, Code, RemoveFormatting, MousePointer2,
  RectangleHorizontal, Square, Maximize, PanelLeft, PanelRight, Columns2,
  CircleDot, BoxSelect, Trash2, Check, FileUp
} from "lucide-react";
import mammoth from "mammoth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export interface RichTextEditorHandle {
  insertImageUrl: (url: string) => void;
}

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

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({ value, onChange, placeholder = "Comece a escrever...", minHeight = "400px" }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [currentFont, setCurrentFont] = useState("Sans Serif");
  const [currentSize, setCurrentSize] = useState("14");
  const savedSelectionRef = useRef<Range | null>(null);
  const [hoveredImg, setHoveredImg] = useState<HTMLImageElement | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [resizing, setResizing] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const updateOverlayRect = useCallback((img: HTMLImageElement) => {
    const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;
    const rect = img.getBoundingClientRect();
    const scrollTop = editorRef.current?.scrollTop || 0;
    const scrollLeft = editorRef.current?.scrollLeft || 0;
    setHoveredRect({
      x: rect.left - wrapperRect.left + scrollLeft,
      y: rect.top - wrapperRect.top + scrollTop,
      w: rect.width,
      h: rect.height,
    });
  }, []);

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

  // Expose insertImageUrl to parent
  useImperativeHandle(ref, () => ({
    insertImageUrl: (url: string) => {
      editorRef.current?.focus();
      document.execCommand("insertImage", false, url);
      emitChange();
    },
  }), [emitChange]);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const escapeHtml = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }, []);

  const importDocument = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (editorRef.current) {
          editorRef.current.innerHTML += result.value;
          emitChange();
        }
        toast.success("Documento Word importado!");
      } else if (ext === "pdf") {
        const win = window as Window & { pdfjsLib?: any };
        if (!win.pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-pdfjs="true"]') as HTMLScriptElement | null;
            if (existing) {
              existing.addEventListener("load", () => resolve(), { once: true });
              existing.addEventListener("error", () => reject(new Error("Falha ao carregar PDF.js")), { once: true });
              return;
            }

            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.async = true;
            script.dataset.pdfjs = "true";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Falha ao carregar PDF.js"));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = win.pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("PDF.js não foi inicializado");
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let html = "";
        let importedAsImage = false;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const items = content.items as Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>;

          const lines: string[] = [];
          let currentLine: string[] = [];
          let lastY: number | null = null;

          for (const item of items) {
            const rawText = item.str?.trim();
            const y = item.transform?.[5] ?? null;

            if (!rawText) {
              if (item.hasEOL && currentLine.length > 0) {
                lines.push(currentLine.join(" "));
                currentLine = [];
                lastY = null;
              }
              continue;
            }

            const shouldBreakLine = lastY !== null && y !== null && Math.abs(y - lastY) > 4;
            if (shouldBreakLine && currentLine.length > 0) {
              lines.push(currentLine.join(" "));
              currentLine = [];
            }

            currentLine.push(escapeHtml(rawText));
            lastY = y;

            if (item.hasEOL) {
              lines.push(currentLine.join(" "));
              currentLine = [];
              lastY = null;
            }
          }

          if (currentLine.length > 0) {
            lines.push(currentLine.join(" "));
          }

          const cleanedLines = lines.filter((line) => line.trim().length > 0);

          if (cleanedLines.length > 0) {
            html += `<section data-pdf-page="${i}">${cleanedLines.map((line) => `<p>${line}</p>`).join("")}</section>`;
            if (i < pdf.numPages) html += "<hr />";
            continue;
          }

          importedAsImage = true;
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/png");
          html += `<figure><img src="${dataUrl}" alt="Página ${i} do PDF" /></figure>`;
        }

        if (editorRef.current) {
          editorRef.current.innerHTML += html;
          emitChange();
        }

        toast.success(importedAsImage ? "PDF importado; páginas escaneadas ficaram como imagem." : "PDF importado como conteúdo editável!");
      } else if (ext === "txt" || ext === "md") {
        const text = await file.text();
        const html = text.split("\n").map((l) => `<p>${l || "<br>"}</p>`).join("");
        if (editorRef.current) {
          editorRef.current.innerHTML += html;
          emitChange();
        }
        toast.success("Arquivo de texto importado!");
      } else {
        toast.error("Formato não suportado. Use .docx, .pdf ou .txt");
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Erro ao importar documento");
    }
  }, [emitChange, escapeHtml]);

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
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Importar documento"><FileUp className="h-3.5 w-3.5" /></ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importDocument(file);
            e.target.value = "";
          }}
        />
        <Divider />
        <ToolBtn onClick={() => exec("removeFormat")} title="Limpar formatação"><RemoveFormatting className="h-3.5 w-3.5" /></ToolBtn>
      </div>

      {/* Editor area wrapper */}
      <div ref={editorWrapperRef} className="relative flex-1 min-h-0">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onMouseOver={(e) => {
            if (resizing) return;
            const target = e.target as HTMLElement;
            if (target.tagName === "IMG") {
              setHoveredImg(target as HTMLImageElement);
              updateOverlayRect(target as HTMLImageElement);
            }
          }}
          onMouseOut={(e) => {
            if (resizing) return;
            const related = e.relatedTarget as HTMLElement | null;
            if ((e.target as HTMLElement).tagName === "IMG" && related?.tagName !== "IMG") {
              setHoveredImg(null);
              setHoveredRect(null);
            }
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "IMG") {
              e.preventDefault();
              setSelectedImg(target as HTMLImageElement);
            } else {
              setSelectedImg(null);
            }
          }}
          data-placeholder={placeholder}
          className="h-full px-5 py-4 text-sm text-foreground outline-none overflow-y-auto
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

        {/* Image hover overlay — covers entire image */}
        <AnimatePresence>
          {hoveredImg && hoveredRect && !selectedImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute pointer-events-none flex items-center justify-center overflow-hidden"
              style={{
                left: hoveredRect.x,
                top: hoveredRect.y,
                width: hoveredRect.w,
                height: hoveredRect.h,
                borderRadius: "0.75rem",
              }}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]" />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-1.5"
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center"
                >
                  <MousePointer2 className="h-5 w-5 text-foreground" />
                </motion.div>
                <span className="text-[10px] font-semibold text-white drop-shadow-md">Clique para ampliar</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image toolbar + resize handles when selected */}
        {selectedImg && (() => {
          const wrapperRect = editorWrapperRef.current?.getBoundingClientRect();
          const imgRect = selectedImg.getBoundingClientRect();
          if (!wrapperRect) return null;
          const x = imgRect.left - wrapperRect.left + (editorRef.current?.scrollLeft || 0);
          const y = imgRect.top - wrapperRect.top + (editorRef.current?.scrollTop || 0);

          const applyImgStyle = (styles: Record<string, string>) => {
            Object.assign(selectedImg.style, styles);
            emitChange();
            setSelectedImg(null);
            setTimeout(() => setSelectedImg(selectedImg), 0);
          };

          const setAlignment = (align: string) => {
            // Reset float and margin
            selectedImg.style.float = "none";
            selectedImg.style.marginLeft = "";
            selectedImg.style.marginRight = "";
            selectedImg.style.display = "";
            if (align === "left") {
              applyImgStyle({ float: "left", marginRight: "12px", marginBottom: "8px", display: "block" });
            } else if (align === "right") {
              applyImgStyle({ float: "right", marginLeft: "12px", marginBottom: "8px", display: "block" });
            } else if (align === "center") {
              applyImgStyle({ float: "none", display: "block", marginLeft: "auto", marginRight: "auto" });
            } else {
              applyImgStyle({ float: "none", display: "inline-block", marginLeft: "0", marginRight: "0" });
            }
          };

          const setSizePreset = (pct: string) => {
            applyImgStyle({ width: pct, height: "auto" });
          };

          const toggleStyle = (prop: string, onVal: string, offVal: string) => {
            const current = selectedImg.style[prop as any] || "";
            const isOn = current === onVal || (onVal.includes("solid") && current.includes("solid")) || (onVal.includes("rgba") && current.includes("rgba"));
            applyImgStyle({ [prop]: isOn ? offVal : onVal });
          };

          const ImgToolBtn = ({ onClick, children, title, active }: { onClick: () => void; children: React.ReactNode; title: string; active?: boolean }) => (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClick}
              title={title}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {children}
            </button>
          );

          const Sep = () => <div className="w-px h-5 bg-border/50 mx-0.5 shrink-0" />;

          return (
            <>
              {/* Floating toolbar above image */}
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-30 pointer-events-auto"
                style={{
                  left: x,
                  top: y > 52 ? y - 48 : y + imgRect.height + 8,
                  maxWidth: Math.max(imgRect.width, 340),
                }}
              >
                <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-card border border-border/60 shadow-lg flex-wrap"
                  style={{ backdropFilter: "blur(12px)" }}>
                  {/* Alignment */}
                  <ImgToolBtn onClick={() => setAlignment("left")} title="Alinhar à esquerda" active={selectedImg.style.float === "left"}>
                    <PanelLeft className="h-3.5 w-3.5" />
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setAlignment("center")} title="Centralizar" active={selectedImg.style.marginLeft === "auto"}>
                    <AlignCenter className="h-3.5 w-3.5" />
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setAlignment("right")} title="Alinhar à direita" active={selectedImg.style.float === "right"}>
                    <PanelRight className="h-3.5 w-3.5" />
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setAlignment("inline")} title="Em linha (lado a lado)" active={selectedImg.style.display === "inline-block"}>
                    <Columns2 className="h-3.5 w-3.5" />
                  </ImgToolBtn>

                  <Sep />

                  {/* Size presets */}
                  <ImgToolBtn onClick={() => setSizePreset("25%")} title="25%">
                    <span className="text-[9px] font-bold">25</span>
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setSizePreset("50%")} title="50%">
                    <span className="text-[9px] font-bold">50</span>
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setSizePreset("75%")} title="75%">
                    <span className="text-[9px] font-bold">75</span>
                  </ImgToolBtn>
                  <ImgToolBtn onClick={() => setSizePreset("100%")} title="100%">
                    <Maximize className="h-3.5 w-3.5" />
                  </ImgToolBtn>

                  <Sep />

                  {/* Border */}
                  <ImgToolBtn
                    onClick={() => toggleStyle("border", "2px solid hsl(var(--border))", "none")}
                    title="Borda"
                    active={selectedImg.style.border?.includes("solid")}
                  >
                    <BoxSelect className="h-3.5 w-3.5" />
                  </ImgToolBtn>

                  {/* Shadow */}
                  <ImgToolBtn
                    onClick={() => toggleStyle("boxShadow", "0 4px 20px rgba(0,0,0,0.15)", "none")}
                    title="Sombra"
                    active={selectedImg.style.boxShadow?.includes("rgba")}
                  >
                    <RectangleHorizontal className="h-3.5 w-3.5" />
                  </ImgToolBtn>

                  {/* Rounded */}
                  <ImgToolBtn
                    onClick={() => toggleStyle("borderRadius", "50%", "0.75rem")}
                    title="Circular"
                    active={selectedImg.style.borderRadius === "50%"}
                  >
                    <CircleDot className="h-3.5 w-3.5" />
                  </ImgToolBtn>

                  <Sep />

                  {/* Delete */}
                  <ImgToolBtn
                    onClick={() => { selectedImg.remove(); setSelectedImg(null); emitChange(); }}
                    title="Remover imagem"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </ImgToolBtn>

                  <Sep />

                  {/* Confirm / deselect */}
                  <ImgToolBtn
                    onClick={() => setSelectedImg(null)}
                    title="Concluir edição"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </ImgToolBtn>
                </div>
              </motion.div>

              {/* Selection border + resize handles */}
              <div
                className="absolute pointer-events-none"
                style={{ left: x, top: y, width: imgRect.width, height: imgRect.height }}
              >
                <div className="absolute inset-0 border-2 border-primary rounded-xl" />
                {(["nw", "ne", "sw", "se"] as const).map((corner) => {
                  const isRight = corner.includes("e");
                  const isBottom = corner.includes("s");
                  const cursor = corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
                  return (
                    <div
                      key={corner}
                      className="absolute w-3 h-3 bg-primary rounded-sm border-2 border-white shadow pointer-events-auto"
                      style={{
                        cursor,
                        left: isRight ? "calc(100% - 6px)" : "-6px",
                        top: isBottom ? "calc(100% - 6px)" : "-6px",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setResizing(true);
                        resizeStartRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          startW: selectedImg.offsetWidth,
                          startH: selectedImg.offsetHeight,
                        };
                        const aspect = selectedImg.offsetWidth / selectedImg.offsetHeight;

                        const onMove = (ev: MouseEvent) => {
                          if (!resizeStartRef.current) return;
                          const { startX, startW } = resizeStartRef.current;
                          let dx = ev.clientX - startX;
                          if (!isRight) dx = -dx;
                          const newW = Math.max(50, startW + dx);
                          const newH = newW / aspect;
                          selectedImg.style.width = `${newW}px`;
                          selectedImg.style.height = `${newH}px`;
                        };

                        const onUp = () => {
                          setResizing(false);
                          resizeStartRef.current = null;
                          emitChange();
                          setSelectedImg(null);
                          setTimeout(() => setSelectedImg(selectedImg), 0);
                          document.removeEventListener("mousemove", onMove);
                          document.removeEventListener("mouseup", onUp);
                        };

                        document.addEventListener("mousemove", onMove);
                        document.addEventListener("mouseup", onUp);
                      }}
                    />
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
});

export default RichTextEditor;

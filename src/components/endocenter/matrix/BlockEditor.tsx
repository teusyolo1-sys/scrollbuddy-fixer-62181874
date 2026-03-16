import { useEffect, useCallback, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Minus, Image, Table as TableIcon, Link2, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, Highlighter, FileUp,
  Undo2, Redo2, ChevronDown, Superscript as SuperscriptIcon, Type
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import mammoth from "mammoth";
import { toast } from "sonner";

export interface BlockEditorHandle {
  insertImageUrl: (url: string) => void;
}

interface BlockEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/* ── Config data ── */
const fontFamilies = [
  { label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'SF Mono', 'Fira Code', monospace" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const fontSizes = ["8", "10", "12", "14", "18", "24", "36"];

const textColors = [
  "#FFFFFF", "#B7B7B7", "#999999", "#666666", "#434343", "#000000",
  "#DC2626", "#EA580C", "#D97706", "#CA8A04", "#65A30D", "#16A34A",
  "#0284C7", "#2563EB", "#4F46E5", "#7C3AED", "#9333EA", "#C026D3",
  "#DB2777", "#E11D48",
];

/* ── Slash command items ── */
const SLASH_ITEMS = [
  { title: "Título 1", description: "Heading grande", icon: Heading1, command: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Título 2", description: "Heading médio", icon: Heading2, command: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Título 3", description: "Heading pequeno", icon: Heading3, command: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Lista", description: "Lista com marcadores", icon: List, command: (editor: any) => editor.chain().focus().toggleBulletList().run() },
  { title: "Lista numerada", description: "Lista ordenada", icon: ListOrdered, command: (editor: any) => editor.chain().focus().toggleOrderedList().run() },
  { title: "Checklist", description: "Lista de tarefas", icon: CheckSquare, command: (editor: any) => editor.chain().focus().toggleTaskList().run() },
  { title: "Citação", description: "Bloco de citação", icon: Quote, command: (editor: any) => editor.chain().focus().toggleBlockquote().run() },
  { title: "Código", description: "Bloco de código", icon: Code, command: (editor: any) => editor.chain().focus().toggleCodeBlock().run() },
  { title: "Divisor", description: "Linha horizontal", icon: Minus, command: (editor: any) => editor.chain().focus().setHorizontalRule().run() },
  { title: "Tabela", description: "Tabela 3×3", icon: TableIcon, command: (editor: any) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: "Imagem", description: "Inserir por URL", icon: Image, command: (editor: any) => {
    const url = prompt("URL da imagem:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }},
];

/* ── Slash Commands Extension ── */
const SlashCommands = Extension.create({
  name: "slashCommands",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("slashCommands"),
        props: {
          handleKeyDown(view, event) {
            if (event.key === "/") {
              const { $from } = view.state.selection;
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
              if (textBefore.trim() === "") {
                setTimeout(() => {
                  document.dispatchEvent(new CustomEvent("tiptap-slash", { detail: { editor } }));
                }, 10);
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

/* ── Font size extension (via inline style) ── */
const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize?.replace(/['"]+/g, "") || null,
          renderHTML: (attrs) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
});

type DropdownType = "font" | "size" | "color" | "highlight" | null;

const BlockEditor = forwardRef<BlockEditorHandle, BlockEditorProps>(function BlockEditor(
  { value, onChange, placeholder = "Digite '/' para comandos...", minHeight = "400px" },
  ref
) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialContentSet = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      SlashCommands,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none h-full",
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (_view, event) => {
        if (slashOpen) {
          const filtered = SLASH_ITEMS.filter((i) =>
            i.title.toLowerCase().includes(slashFilter.toLowerCase())
          );
          if (event.key === "ArrowDown") { event.preventDefault(); setSlashIndex((i) => (i + 1) % filtered.length); return true; }
          if (event.key === "ArrowUp") { event.preventDefault(); setSlashIndex((i) => (i - 1 + filtered.length) % filtered.length); return true; }
          if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[slashIndex]) {
              const { state } = _view;
              const { $from } = state.selection;
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
              const slashIdx = textBefore.lastIndexOf("/");
              if (slashIdx >= 0) {
                _view.dispatch(state.tr.delete($from.start() + slashIdx, $from.pos));
              }
              filtered[slashIndex].command(editor);
              setSlashOpen(false);
              setSlashFilter("");
            }
            return true;
          }
          if (event.key === "Escape") { setSlashOpen(false); setSlashFilter(""); return true; }
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) { setSlashFilter((f) => f + event.key); setSlashIndex(0); }
          if (event.key === "Backspace") { slashFilter.length > 0 ? setSlashFilter((f) => f.slice(0, -1)) : setSlashOpen(false); }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value && !initialContentSet.current) {
      const cur = editor.getHTML();
      if (cur === "<p></p>" || !cur) editor.commands.setContent(value);
      initialContentSet.current = true;
    }
  }, [editor, value]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.editor === editor) {
        setSlashOpen(true); setSlashFilter(""); setSlashIndex(0);
        const { view } = editor!;
        const coords = view.coordsAtPos(view.state.selection.from);
        const wr = editorWrapperRef.current?.getBoundingClientRect();
        if (wr) setSlashPos({ top: coords.bottom - wr.top + 4, left: coords.left - wr.left });
      }
    };
    document.addEventListener("tiptap-slash", handler);
    return () => document.removeEventListener("tiptap-slash", handler);
  }, [editor]);

  useEffect(() => {
    if (!slashOpen) return;
    const handler = (e: MouseEvent) => {
      if (slashRef.current && !slashRef.current.contains(e.target as Node)) { setSlashOpen(false); setSlashFilter(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [slashOpen]);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!activeDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeDropdown]);

  useImperativeHandle(ref, () => ({
    insertImageUrl: (url: string) => { editor?.chain().focus().setImage({ src: url }).run(); },
  }), [editor]);

  const importDocument = useCallback(async (file: File) => {
    if (!editor) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "docx") {
        const ab = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: ab });
        editor.chain().focus().insertContent(result.value).run();
        toast.success("Documento Word importado!");
      } else if (ext === "txt" || ext === "md") {
        const text = await file.text();
        const html = text.split("\n").map((l) => `<p>${l || "<br>"}</p>`).join("");
        editor.chain().focus().insertContent(html).run();
        toast.success("Arquivo de texto importado!");
      } else {
        toast.error("Formato não suportado. Use .docx ou .txt");
      }
    } catch { toast.error("Erro ao importar documento"); }
  }, [editor]);

  if (!editor) return null;

  const filteredSlashItems = SLASH_ITEMS.filter((i) =>
    i.title.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const ToolBtn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button
      type="button"
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

  const DropdownBtn = ({ type, label, children }: { type: DropdownType; label: string; children: React.ReactNode }) => (
    <div className="relative" data-dropdown-container>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
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
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer"><Undo2 className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer"><Redo2 className="h-3.5 w-3.5" /></ToolBtn>
        <Divider />

        <DropdownBtn type="font" label="Fonte">
          {fontFamilies.map((f) => (
            <button key={f.value} onMouseDown={(e) => e.preventDefault()}
              onClick={() => { editor.chain().focus().setFontFamily(f.value).run(); setActiveDropdown(null); }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors"
              style={{ fontFamily: f.value }}>
              {f.label}
            </button>
          ))}
        </DropdownBtn>

        <DropdownBtn type="size" label="Tamanho">
          {fontSizes.map((s) => (
            <button key={s} onMouseDown={(e) => e.preventDefault()}
              onClick={() => { editor.chain().focus().setMark("textStyle", { fontSize: `${s}px` }).run(); setActiveDropdown(null); }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
              {s}px
            </button>
          ))}
        </DropdownBtn>

        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscrito">
          <SubscriptIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Sobrescrito">
          <SuperscriptIcon className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Toolbar Row 2 */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/20 flex-wrap">
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Parágrafo">
          <Type className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Código inline">
          <Code className="h-3.5 w-3.5" />
        </ToolBtn>
        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Esquerda">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centro">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Direita">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justificar">
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolBtn>
        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist">
          <CheckSquare className="h-3.5 w-3.5" />
        </ToolBtn>
        <Divider />

        <DropdownBtn type="color" label="Cor">
          <div className="grid grid-cols-5 gap-1 p-2">
            {textColors.map((c) => (
              <button key={c} onMouseDown={(e) => e.preventDefault()}
                onClick={() => { editor.chain().focus().setColor(c).run(); setActiveDropdown(null); }}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </DropdownBtn>

        <DropdownBtn type="highlight" label="Destaque">
          <div className="grid grid-cols-5 gap-1 p-2">
            {textColors.map((c) => (
              <button key={c} onMouseDown={(e) => e.preventDefault()}
                onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setActiveDropdown(null); }}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </DropdownBtn>

        <Divider />
        <ToolBtn onClick={() => { const url = prompt("URL do link:"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} title="Link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => { const url = prompt("URL da imagem:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} title="Imagem">
          <Image className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Tabela">
          <TableIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divisor">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => fileInputRef.current?.click()} title="Importar documento">
          <FileUp className="h-3.5 w-3.5" />
        </ToolBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt,.md"
          className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) importDocument(file); e.target.value = ""; }}
        />
      </div>

      {/* Editor content */}
      <div ref={editorWrapperRef} className="relative flex-1 min-h-0 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="block-editor-content h-full px-5 py-4 text-sm text-foreground"
        />

        {/* Slash command popup */}
        <AnimatePresence>
          {slashOpen && slashPos && filteredSlashItems.length > 0 && (
            <motion.div
              ref={slashRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-64 max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-card shadow-lg"
              style={{ top: slashPos.top, left: slashPos.left }}
            >
              <div className="p-1.5">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Blocos
                </div>
                {filteredSlashItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const { state, view } = editor;
                        const { $from } = state.selection;
                        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
                        const slashIdx = textBefore.lastIndexOf("/");
                        if (slashIdx >= 0) {
                          view.dispatch(state.tr.delete($from.start() + slashIdx, $from.pos));
                        }
                        item.command(editor);
                        setSlashOpen(false);
                        setSlashFilter("");
                      }}
                      className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-left transition-colors ${
                        i === slashIndex ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        i === slashIndex ? "bg-primary/15" : "bg-secondary"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default BlockEditor;

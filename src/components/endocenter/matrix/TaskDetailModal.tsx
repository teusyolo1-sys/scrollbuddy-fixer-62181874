import { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import {
  X, Type, Pencil, Settings2, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResponsibilityItem } from "@/store/endocenterStore";
import type { BlockEditorHandle } from "./BlockEditor";
import PdfViewer from "./PdfViewer";
import ChatFAB from "./task-detail/ChatFAB";
import TaskSidebar from "./task-detail/TaskSidebar";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/hooks/useAuth";

const LazyBlockEditor = lazy(() => import("./BlockEditor"));

interface Props {
  item: ResponsibilityItem;
  roleColor: string;
  roleName: string;
  teamMembers: string[];
  companyId?: string;
  onUpdate: (updates: Partial<ResponsibilityItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TaskDetailModal({ item, roleColor, roleName, teamMembers, companyId, onUpdate, onDelete, onClose }: Props) {
  const { user } = useAuth();
  const { messages: chatMessages } = useChatMessages(item.id, companyId);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(item.task);
  const [description, setDescription] = useState(item.description);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<BlockEditorHandle>(null);
  const lastSeenCountRef = useRef(chatMessages.length);

  // Auto-critical based on due date
  const isAutoCritical = useMemo(() => {
    if (item.done || !item.dueDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  }, [item.dueDate, item.done]);
  const isCritical = item.critical || isAutoCritical;

  // When chat opens, mark as read
  useEffect(() => {
    if (chatOpen) {
      lastSeenCountRef.current = chatMessages.length;
    }
  }, [chatOpen, chatMessages.length]);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  // Debounced description save
  const descSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const handleDescriptionChange = useCallback((html: string) => {
    setDescription(html);
    clearTimeout(descSaveRef.current);
    descSaveRef.current = setTimeout(() => {
      onUpdate({ description: html });
    }, 500);
  }, [onUpdate]);

  useEffect(() => {
    return () => clearTimeout(descSaveRef.current);
  }, []);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 ios-modal-overlay"
        onClick={onClose}
      >
        <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="rounded-3xl ios-modal-surface overflow-hidden flex flex-col transition-[max-width,height] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ 
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            maxWidth: editingDescription ? "80rem" : "28rem",
            height: editingDescription ? "85vh" : "75vh",
            width: "100%",
          }}
        >
          {/* Cover */}
          {item.cover && (
            <div className="relative h-32 overflow-hidden group shrink-0">
              <img src={item.cover} alt="" className="w-full h-full object-cover" />
              <motion.button onClick={() => onUpdate({ cover: "" })} whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          )}

          {/* Header bar — only when editing */}
          {editingDescription && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: roleColor }}>
                  {roleName}
                </span>
                {isCritical && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isAutoCritical && !item.critical ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"}`}>
                    {isAutoCritical && !item.critical ? "⏰ Urgente" : "✦ Crítico"}
                  </span>
                )}
                {item.labels.map((l) => (
                  <span key={l.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
                <div className="w-px h-4 bg-border/50 mx-1 shrink-0" />
                {editingTitle ? (
                  <div className="flex-1 min-w-0 relative flex items-center border border-primary/30 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all duration-200"
                    style={{ borderRadius: "var(--ios-radius-sm)", backgroundColor: "hsl(var(--secondary) / 0.5)" }}>
                    <div className="w-1 h-6 rounded-full bg-primary shrink-0 ml-3" />
                    <input
                      ref={titleRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => { onUpdate({ task: title }); setEditingTitle(false); }}
                      onKeyDown={(e) => e.key === "Enter" && (onUpdate({ task: title }), setEditingTitle(false))}
                      className="text-base font-bold text-foreground bg-transparent outline-none flex-1 min-w-0 px-2.5 py-2"
                    />
                  </div>
                ) : (
                  <div onClick={() => setEditingTitle(true)} 
                    className="group/title relative flex-1 min-w-0 flex items-center gap-2 py-2 px-2 cursor-text rounded-xl hover:bg-secondary/40 transition-all duration-200">
                    <h2 className="text-base font-bold text-foreground truncate flex-1 min-w-0 group-hover/title:text-primary transition-colors">
                      {item.task}
                    </h2>
                    <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 scale-0 group-hover/title:opacity-100 group-hover/title:scale-100 transition-all duration-300 bg-primary/10">
                      <Pencil className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.12, rotate: 30 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${sidebarOpen ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  title="Propriedades">
                  <Settings2 className="h-4 w-4" />
                </motion.button>
                <motion.button onClick={() => setEditingDescription(false)}
                  whileHover={{ scale: 1.12, y: 2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Minimizar">
                  <ChevronDown className="h-4 w-4" />
                </motion.button>
                <motion.button onClick={onClose}
                  whileHover={{ scale: 1.12, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Title bar for compact 9:16 mode */}
          {!editingDescription && (
            <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: roleColor }}>
                  {roleName}
                </span>
                <h2 className="text-sm font-bold text-foreground truncate">{item.task}</h2>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button onClick={onClose}
                  whileHover={{ scale: 1.12, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  className="w-7 h-7 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="relative flex flex-1 min-h-0 overflow-hidden">
            {/* Editor / Read-only view */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
              {editingDescription ? (
                <div className="flex flex-col h-full">
                  <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Carregando editor...
                    </div>
                  }>
                    <LazyBlockEditor
                      ref={editorRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      minHeight="100%"
                      placeholder="Digite '/' para comandos · Comece a escrever..."
                    />
                  </Suspense>
                </div>
              ) : (
                <div 
                  className="flex-1 overflow-y-auto cursor-pointer group relative"
                  onClick={() => setEditingDescription(true)}
                >
                  <div className="p-5 h-full">
                    {description && description !== "<br>" && description.replace(/<[^>]*>/g, "").trim() ? (
                      <div className="text-sm text-foreground prose prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_pre]:bg-secondary [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2 [&_hr]:border-border/50 [&_hr]:my-3"
                        dangerouslySetInnerHTML={{ __html: description }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/40">
                        <Type className="h-10 w-10" />
                        <p className="text-sm font-medium text-center">Clique para editar</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:scale-100 scale-90 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80 px-3 py-2"
                      style={{
                        borderRadius: "var(--ios-radius)",
                        background: "hsla(var(--card), 0.75)",
                        backdropFilter: "blur(20px) saturate(1.8)",
                        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
                        border: "0.5px solid hsla(var(--border), 0.4)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                      }}>
                      <Pencil className="h-3.5 w-3.5 text-primary" /> Editar
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 text-[9px] font-mono text-muted-foreground/30 bg-secondary/50 px-1.5 py-0.5 group-hover:top-12 transition-all duration-200" style={{ borderRadius: "6px" }}>
                    9:16
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {sidebarOpen && (
              <div
                className="absolute right-3 top-14 bottom-3 z-20 transition-all duration-300 ease-out overflow-hidden"
                style={{ width: 300 }}
              >
                <div
                  className="h-full overflow-hidden"
                  style={{
                    width: 300,
                    background: "var(--ios-glass)",
                    backdropFilter: "blur(var(--ios-blur-heavy))",
                    WebkitBackdropFilter: "blur(var(--ios-blur-heavy))",
                    borderRadius: "var(--ios-radius)",
                    boxShadow: "var(--ios-shadow-lg)",
                    border: "1px solid hsl(var(--border) / 0.25)",
                    clipPath: "inset(0 round var(--ios-radius))",
                  }}
                >
                  <TaskSidebar
                    item={item}
                    roleColor={roleColor}
                    roleName={roleName}
                    teamMembers={teamMembers}
                    companyId={companyId}
                    editingDescription={editingDescription}
                    editorRef={editorRef}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onViewPdf={setViewingPdf}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        </div>

        {/* Chat FAB */}
        <ChatFAB
          taskId={item.id}
          taskName={item.task}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          chatMessages={chatMessages}
          userId={user?.id}
          lastSeenCount={lastSeenCountRef.current}
        />

        {/* PDF Viewer overlay */}
        <AnimatePresence>
          {viewingPdf && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6"
              onClick={() => setViewingPdf(null)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-3xl h-[80vh] rounded-2xl overflow-hidden"
                style={{ boxShadow: "var(--ios-shadow-float)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <PdfViewer url={viewingPdf} onClose={() => setViewingPdf(null)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

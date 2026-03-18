import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  File, FileText, Folder, FolderOpen, FolderPlus, Image,
  RefreshCw, Trash2, Upload, Video, ChevronRight, Table2,
  Presentation, ExternalLink, X, Loader2,
} from "lucide-react";
import { useGoogleDrive, type DriveFile } from "@/hooks/useGoogleDrive";
import { useSectionPermissions } from "@/hooks/useSectionPermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DriveFileManagerProps {
  companyId: string;
  companyName: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/vnd.google-apps.folder") return Folder;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return Table2;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType.includes("document") || mimeType.includes("word")) return FileText;
  if (mimeType.startsWith("video/")) return Video;
  return File;
};

const getFileColor = (mimeType: string) => {
  if (mimeType === "application/vnd.google-apps.folder") return "hsl(45, 100%, 51%)";
  if (mimeType.startsWith("image/")) return "hsl(340, 82%, 52%)";
  if (mimeType === "application/pdf") return "hsl(4, 90%, 58%)";
  if (mimeType.includes("spreadsheet")) return "hsl(122, 39%, 49%)";
  if (mimeType.includes("presentation")) return "hsl(36, 100%, 50%)";
  if (mimeType.includes("document")) return "hsl(207, 90%, 54%)";
  if (mimeType.startsWith("video/")) return "hsl(271, 76%, 53%)";
  return "hsl(200, 18%, 46%)";
};

const formatSize = (bytes?: string) => {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return d.toLocaleDateString("pt-BR");
};

/* ── Droppable folder card ── */
function DroppableFolderCard({
  file,
  onOpen,
  onDelete,
  onDropFile,
}: {
  file: DriveFile;
  onOpen: () => void;
  onDelete?: () => void;
  onDropFile: (files: FileList, folderId: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) e.dataTransfer.dropEffect = "copy";
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) onDropFile(e.dataTransfer.files, file.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={onOpen}
      className={`
        group relative flex flex-col p-4 rounded-xl bg-card cursor-pointer
        border transition-all duration-200
        ${isDragOver
          ? "ring-2 ring-primary scale-[1.03] bg-primary/10 border-primary/40"
          : "border-border/20 hover:bg-accent/50 hover:border-border/40 hover:shadow-sm"
        }
      `}
    >
      {/* Folder icon — open when dragging */}
      <div className="relative w-10 h-10 mb-3">
        <svg
          viewBox="0 0 24 24"
          className={`w-10 h-10 transition-all duration-200 absolute inset-0 ${isDragOver ? "opacity-0 scale-90" : "opacity-100"}`}
          fill="none"
          stroke="hsl(45, 100%, 51%)"
          strokeWidth="1.5"
        >
          <path
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            fill="hsl(45, 100%, 51%)"
            fillOpacity="0.15"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={`w-10 h-10 transition-all duration-200 absolute inset-0 ${isDragOver ? "opacity-100 scale-110" : "opacity-0 scale-90"}`}
          fill="none"
          stroke="hsl(45, 100%, 51%)"
          strokeWidth="1.5"
        >
          <path d="M5 19h14a2 2 0 001.84-2.77L18 9H6l-2.84 7.23A2 2 0 005 19z" fill="hsl(45, 100%, 51%)" fillOpacity="0.25" />
          <path d="M3 7v2h18V7a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" fill="hsl(45, 100%, 51%)" fillOpacity="0.15" />
        </svg>
      </div>

      <p className="font-medium text-sm truncate text-foreground">{file.name}</p>
      <p className="text-xs text-muted-foreground">{file.modifiedTime ? formatDate(file.modifiedTime) : ""}</p>

      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-[inherit] pointer-events-none">
          <p className="text-xs font-medium text-primary">Soltar aqui</p>
        </div>
      )}

      {/* Actions on hover */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {file.webViewLink && (
          <button
            onClick={(e) => { e.stopPropagation(); window.open(file.webViewLink, "_blank"); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Abrir no Drive"
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            title="Deletar"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main component ── */
export default function DriveFileManager({ companyId, companyName }: DriveFileManagerProps) {
  const {
    files, loading, uploading, syncing, currentPath,
    fetchFiles, uploadFile, uploadFiles, uploadToFolder, deleteFile,
    createSubfolder, openFolder, goBack, goToPathIndex,
  } = useGoogleDrive(companyId, companyName);

  const { canViewSection, canEditSection } = useSectionPermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);

  const canUpload = canEditSection("files", "upload_files");
  const canDelete = canEditSection("files", "delete_files");
  const canCreateFolders = canEditSection("files", "create_folders");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload || !e.dataTransfer.files.length) return;
    uploadFiles(e.dataTransfer.files);
  }, [canUpload, uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (canUpload) setDragOver(true);
  }, [canUpload]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createSubfolder(newFolderName.trim());
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      openFolder(file);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, "_blank");
    }
  };

  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : undefined;

  if (!canViewSection("files", "view_files")) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p>Você não tem permissão para visualizar arquivos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Breadcrumb + sync indicator */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto">
          {currentPath.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1 whitespace-nowrap">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              <button
                onClick={async () => {
                  if (i < currentPath.length - 1) await goToPathIndex(i);
                }}
                className={`hover:text-foreground transition-colors ${i === currentPath.length - 1 ? "text-foreground font-medium" : ""}`}
              >
                {p.name}
              </button>
            </span>
          ))}
          {syncing && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60 ml-2 shrink-0" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canCreateFolders && (
            <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)} className="gap-1.5">
              <FolderPlus className="h-3.5 w-3.5" />
              Nova pasta
            </Button>
          )}
          {canUpload && (
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Enviando..." : "Upload"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => fetchFiles(currentFolderId, { force: true })} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* New folder input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
              <FolderPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nome da pasta" className="h-8 text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} />
              <Button size="sm" onClick={handleCreateFolder} className="h-8">Criar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)} className="h-8 w-8 p-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />

      {/* Drop zone + file grid */}
      <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={() => setDragOver(false)} className="relative">
        {/* Drag overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex flex-col items-center justify-center gap-2">
              <Upload className="h-10 w-10 text-primary/60" />
              <p className="text-sm font-medium text-primary">Solte os arquivos aqui</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton loading (first time, no cache) */}
        {loading && files.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ios-card p-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-muted/50 mb-3" />
                <div className="h-4 bg-muted/50 rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl border-2 border-dashed border-border/40 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => canUpload && fileInputRef.current?.click()}
          >
            <FolderOpen className="h-14 w-14 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhum arquivo ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              {canUpload ? "Arraste arquivos ou clique em Upload" : "Nenhum arquivo nesta pasta"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Back button */}
            {currentPath.length > 1 && (
              <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={goBack} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/20">
                <ChevronRight className="h-5 w-5 rotate-180 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Voltar</span>
              </motion.button>
            )}

            {files.map((file, i) => {
              const isFolder = file.mimeType === "application/vnd.google-apps.folder";

              if (isFolder) {
                return (
                  <DroppableFolderCard
                    key={file.id}
                    file={file}
                    onOpen={() => openFolder(file)}
                    onDelete={canDelete ? () => setDeleteTarget(file) : undefined}
                    onDropFile={(droppedFiles, folderId) => uploadToFolder(droppedFiles, folderId)}
                  />
                );
              }

              const Icon = getFileIcon(file.mimeType);
              const color = getFileColor(file.mimeType);

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleFileClick(file)}
                  className="group relative flex flex-col p-4 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer border border-border/20 hover:border-border/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      {file.thumbnailLink ? (
                        <img
                          src={file.thumbnailLink}
                          alt={file.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : (
                        <Icon className="h-5 w-5" style={{ color }} />
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.webViewLink && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(file.webViewLink, "_blank"); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Abrir no Drive">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(file); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Deletar">
                          <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground truncate" title={file.name}>{file.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    {file.size && <span>{formatSize(file.size)}</span>}
                    {file.modifiedTime && <span>{formatDate(file.modifiedTime)}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-6 right-6 bg-card border border-border shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 z-50">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Enviando arquivo...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar arquivo</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja deletar "{deleteTarget?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) {
                  await deleteFile(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

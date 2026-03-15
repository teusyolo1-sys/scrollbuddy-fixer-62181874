import { createPortal } from "react-dom";
import { Pencil, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";

interface CardContextMenuProps {
  pos: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onFullscreen: () => void;
}

export function CardContextMenu({ pos, onClose, onRename, onFullscreen }: CardContextMenuProps) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 400 }}
        className="fixed z-[9999] bg-card border border-border/60 rounded-xl shadow-xl py-1.5 px-1 min-w-[180px] backdrop-blur-xl"
        style={{
          left: Math.min(pos.x, window.innerWidth - 200),
          top: Math.min(pos.y, window.innerHeight - 120),
        }}
      >
        <button onClick={() => { onRename(); onClose(); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent/40 transition-colors text-foreground">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Renomear</span>
        </button>
        <button onClick={() => { onFullscreen(); onClose(); }}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-accent/40 transition-colors text-foreground">
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Abrir em tela cheia</span>
        </button>
      </motion.div>
    </>,
    document.body
  );
}

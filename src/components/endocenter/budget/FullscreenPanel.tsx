import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FullscreenPanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function FullscreenPanel({ title, onClose, children }: FullscreenPanelProps) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] bg-background/80 backdrop-blur-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent/30 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

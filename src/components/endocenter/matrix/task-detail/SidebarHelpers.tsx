import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const COMPLAINT_CATEGORIES = ["Qualidade", "Atraso", "Refação", "Comunicação"];

export { COMPLAINT_CATEGORIES };

export function SideSection({
  icon: Icon,
  label,
  children,
  defaultOpen = false,
}: {
  icon: any;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-semibold text-foreground/80 hover:text-foreground hover:bg-secondary/40 transition-colors"
        style={{ borderRadius: "var(--ios-radius-sm)" }}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open ? "500px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-3 pt-1 space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

export function ComplaintCategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(!open);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="ios-input w-full px-2.5 py-2 text-[11px] flex items-center justify-between text-foreground"
      >
        <span>{value}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed z-[201] rounded-xl overflow-hidden"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border) / 0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              backdropFilter: "blur(20px)",
            }}
          >
            {COMPLAINT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange(cat); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[11px] transition-colors ${
                  cat === value
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-secondary/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </>,
        document.body
      )}
    </>
  );
}

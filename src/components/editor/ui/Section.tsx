import { useState } from "react";
import { ChevronDown, Plus, Settings } from "lucide-react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  onSettings?: () => void;
  defaultOpen?: boolean;
  badge?: number;
}

export default function Section({
  title,
  children,
  onAdd,
  onSettings,
  defaultOpen = true,
  badge,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
          />
          <span className="text-[11px] font-medium text-secondary-foreground uppercase tracking-wider">
            {title}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="text-[9px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onSettings && (
            <span
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onSettings(); }}
            >
              <Settings className="w-3 h-3" />
            </span>
          )}
          {onAdd && (
            <span
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              <Plus className="w-3 h-3" />
            </span>
          )}
        </div>
      </button>
      {isOpen && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

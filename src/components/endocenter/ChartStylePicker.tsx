import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, TrendingUp, GitBranch, Flame, PieChart as PieIcon,
  Radar as RadarIcon, Layers, Activity, Circle, Droplets,
  LayoutGrid, Columns3, ArrowDownUp, Target,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart,
} from "recharts";

export type ChartStyle =
  | "area" | "line" | "bar" | "column" | "pie" | "radar"
  | "scatter" | "bubble" | "funnel" | "waterfall" | "heatmap"
  | "pareto" | "treemap" | "gantt";

export interface ChartStyleConfig {
  key: ChartStyle;
  label: string;
  icon: typeof TrendingUp;
  description: string;
}

export const CHART_STYLES: ChartStyleConfig[] = [
  { key: "line", label: "Linha", icon: TrendingUp, description: "Tendências ao longo do tempo" },
  { key: "area", label: "Área", icon: Activity, description: "Volume acumulado com preenchimento" },
  { key: "bar", label: "Barras", icon: BarChart3, description: "Comparação horizontal entre valores" },
  { key: "column", label: "Colunas", icon: Columns3, description: "Comparação vertical entre períodos" },
  { key: "pie", label: "Pizza / Rosca", icon: PieIcon, description: "Proporção entre categorias" },
  { key: "radar", label: "Radar / Teia", icon: RadarIcon, description: "Performance multidimensional" },
  { key: "scatter", label: "Dispersão", icon: Circle, description: "Correlação entre variáveis" },
  { key: "bubble", label: "Bolhas", icon: Droplets, description: "Dispersão com magnitude" },
  { key: "funnel", label: "Funil (Pipeline)", icon: Target, description: "Conversão em etapas" },
  { key: "waterfall", label: "Cascata", icon: ArrowDownUp, description: "Variação incremental de valores" },
  { key: "heatmap", label: "Mapa de Calor", icon: Flame, description: "Intensidade por período" },
  { key: "pareto", label: "Pareto", icon: Layers, description: "80/20 — barras + linha cumulativa" },
  { key: "treemap", label: "Treemap", icon: LayoutGrid, description: "Hierarquia proporcional de áreas" },
  { key: "gantt", label: "Gantt", icon: GitBranch, description: "Cronograma de atividades" },
];

/* ── Sample data for previews ── */
const SAMPLE_LINE = [
  { name: "Jan", value: 20 }, { name: "Fev", value: 45 },
  { name: "Mar", value: 35 }, { name: "Abr", value: 60 },
  { name: "Mai", value: 50 }, { name: "Jun", value: 80 },
];
const SAMPLE_PIE = [
  { name: "A", value: 40 }, { name: "B", value: 30 },
  { name: "C", value: 20 }, { name: "D", value: 10 },
];
const SAMPLE_RADAR = [
  { subject: "Vendas", A: 80 }, { subject: "Leads", A: 60 },
  { subject: "ROI", A: 90 }, { subject: "Alcance", A: 45 },
  { subject: "NPS", A: 70 },
];
const SAMPLE_SCATTER = [
  { x: 10, y: 30 }, { x: 20, y: 50 }, { x: 30, y: 25 },
  { x: 40, y: 70 }, { x: 50, y: 45 }, { x: 60, y: 80 },
];
const SAMPLE_BUBBLE = [
  { x: 10, y: 30, z: 200 }, { x: 25, y: 55, z: 400 },
  { x: 40, y: 20, z: 300 }, { x: 55, y: 65, z: 500 },
];
const SAMPLE_WATERFALL = [
  { name: "Início", value: 50, fill: "#3b82f6" },
  { name: "+Vendas", value: 30, fill: "#10b981" },
  { name: "+Leads", value: 20, fill: "#10b981" },
  { name: "-Custo", value: -15, fill: "#ef4444" },
  { name: "Final", value: 85, fill: "#8b5cf6" },
];
const SAMPLE_PARETO = [
  { name: "A", value: 45, cum: 45 }, { name: "B", value: 25, cum: 70 },
  { name: "C", value: 15, cum: 85 }, { name: "D", value: 10, cum: 95 },
  { name: "E", value: 5, cum: 100 },
];

const PREVIEW_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

/* ── Mini chart previews ── */
function MiniPreview({ style }: { style: ChartStyle }) {
  const size = { width: 180, height: 100 };

  switch (style) {
    case "line":
      return (
        <ResponsiveContainer {...size}>
          <LineChart data={SAMPLE_LINE}>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "area":
      return (
        <ResponsiveContainer {...size}>
          <AreaChart data={SAMPLE_LINE}>
            <defs>
              <linearGradient id="prev-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#prev-area)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case "bar":
      return (
        <ResponsiveContainer {...size}>
          <BarChart data={SAMPLE_LINE} layout="vertical" barSize={10}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "column":
      return (
        <ResponsiveContainer {...size}>
          <BarChart data={SAMPLE_LINE} barSize={14}>
            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer {...size}>
          <PieChart>
            <Pie data={SAMPLE_PIE} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={36} strokeWidth={0}>
              {SAMPLE_PIE.map((_, i) => <Cell key={i} fill={PREVIEW_COLORS[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    case "radar":
      return (
        <ResponsiveContainer {...size}>
          <RadarChart data={SAMPLE_RADAR} cx="50%" cy="50%" outerRadius={35}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7 }} />
            <Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      );
    case "scatter":
      return (
        <ResponsiveContainer {...size}>
          <ScatterChart>
            <XAxis type="number" dataKey="x" hide />
            <YAxis type="number" dataKey="y" hide />
            <Scatter data={SAMPLE_SCATTER} fill="#ec4899" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "bubble":
      return (
        <ResponsiveContainer {...size}>
          <ScatterChart>
            <XAxis type="number" dataKey="x" hide />
            <YAxis type="number" dataKey="y" hide />
            <Scatter data={SAMPLE_BUBBLE} fill="#06b6d4" fillOpacity={0.6}>
              {SAMPLE_BUBBLE.map((entry, i) => (
                <Cell key={i} fill={PREVIEW_COLORS[i % PREVIEW_COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "funnel":
      return (
        <svg width={180} height={100} viewBox="0 0 180 100">
          {[0, 1, 2, 3].map((i) => {
            const w = 160 - i * 30;
            const x = (180 - w) / 2;
            const y = i * 24 + 4;
            return (
              <motion.rect
                key={i} x={x} y={y} rx={4} height={20}
                fill={PREVIEW_COLORS[i]}
                initial={{ width: 0 }}
                animate={{ width: w }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              />
            );
          })}
        </svg>
      );
    case "waterfall":
      return (
        <ResponsiveContainer {...size}>
          <BarChart data={SAMPLE_WATERFALL} barSize={18}>
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {SAMPLE_WATERFALL.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    case "heatmap":
      return (
        <svg width={180} height={100} viewBox="0 0 180 100">
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 7 }).map((_, col) => {
              const intensity = Math.random();
              const r = Math.round(59 + intensity * 196);
              const g = Math.round(130 - intensity * 80);
              const b = Math.round(246 - intensity * 150);
              return (
                <motion.rect
                  key={`${row}-${col}`}
                  x={col * 25 + 4} y={row * 19 + 4}
                  width={22} height={16} rx={3}
                  fill={`rgb(${r},${g},${b})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (row * 7 + col) * 0.02 }}
                />
              );
            })
          )}
        </svg>
      );
    case "pareto":
      return (
        <ResponsiveContainer {...size}>
          <ComposedChart data={SAMPLE_PARETO}>
            <Bar dataKey="value" fill="#3b82f6" barSize={20} radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="cum" stroke="#ef4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "treemap":
      return (
        <svg width={180} height={100} viewBox="0 0 180 100">
          {[
            { x: 4, y: 4, w: 90, h: 55, c: "#3b82f6" },
            { x: 98, y: 4, w: 78, h: 32, c: "#10b981" },
            { x: 98, y: 40, w: 40, h: 19, c: "#f59e0b" },
            { x: 142, y: 40, w: 34, h: 19, c: "#ec4899" },
            { x: 4, y: 63, w: 55, h: 33, c: "#8b5cf6" },
            { x: 63, y: 63, w: 56, h: 33, c: "#06b6d4" },
            { x: 123, y: 63, w: 53, h: 33, c: "#ef4444" },
          ].map((r, i) => (
            <motion.rect
              key={i} x={r.x} y={r.y} rx={3}
              width={r.w} height={r.h} fill={r.c} fillOpacity={0.8}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          ))}
        </svg>
      );
    case "gantt":
      return (
        <svg width={180} height={100} viewBox="0 0 180 100">
          {[
            { y: 8, x: 10, w: 80, c: "#3b82f6" },
            { y: 30, x: 40, w: 100, c: "#10b981" },
            { y: 52, x: 20, w: 60, c: "#f59e0b" },
            { y: 74, x: 70, w: 90, c: "#ec4899" },
          ].map((bar, i) => (
            <motion.rect
              key={i} x={bar.x} y={bar.y} rx={4}
              height={16} fill={bar.c}
              initial={{ width: 0 }}
              animate={{ width: bar.w }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          ))}
        </svg>
      );
    default:
      return null;
  }
}

/* ── Hover Preview Tooltip ── */
export function ChartStyleMenuItem({
  config,
  isActive,
  onSelect,
}: {
  config: ChartStyleConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setPreviewPos({
          x: rect.left - 210,
          y: Math.min(rect.top, window.innerHeight - 160),
        });
      }
      setShowPreview(true);
    }, 1500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowPreview(false);
  }, []);

  const Icon = config.icon;

  return (
    <>
      <div
        ref={itemRef}
        onClick={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`flex items-center gap-2.5 px-2 py-1.5 text-sm rounded-sm cursor-default select-none transition-colors hover:bg-accent hover:text-accent-foreground ${isActive ? "bg-primary/10 text-primary font-semibold" : ""}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{config.label}</span>
        {isActive && (
          <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      {showPreview && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed z-[9999] bg-card border border-border/60 shadow-xl p-3 pointer-events-none"
            style={{
              left: previewPos.x,
              top: previewPos.y,
              borderRadius: 16,
              width: 210,
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            }}
          >
            <div className="text-[10px] font-bold text-foreground mb-1">{config.label}</div>
            <div className="text-[9px] text-muted-foreground mb-2">{config.description}</div>
            <div className="bg-secondary/20 rounded-xl p-1 overflow-hidden">
              <MiniPreview style={config.key} />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

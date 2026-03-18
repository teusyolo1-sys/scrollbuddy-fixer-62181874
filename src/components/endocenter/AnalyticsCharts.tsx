import { useMemo, useState, useRef, useEffect, memo, useCallback, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, Target, Eye, Plus, Loader2, ChevronDown, Check, Palette, Trash2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
} from "recharts";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { useClientMetrics, METRIC_CONFIG, METRIC_TYPES, type MetricType } from "@/hooks/useClientMetrics";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { CHART_STYLES, ChartStyleMenuItem, type ChartStyle } from "./ChartStylePicker";

const ICONS: Record<MetricType, typeof TrendingUp> = {
  seguidores: Users,
  vendas: ShoppingCart,
  conversao: Target,
  faturamento: TrendingUp,
  leads: Eye,
  alcance: BarChart3,
};

/* ── Color Palettes ── */
interface ColorPalette {
  name: string;
  colors: string[];
}

const COLOR_PALETTES: ColorPalette[] = [
  { name: "Oceano", colors: ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e", "#84cc16"] },
  { name: "Sunset", colors: ["#f43f5e", "#f97316", "#f59e0b", "#eab308", "#ec4899", "#a855f7"] },
  { name: "Neon", colors: ["#06ffa5", "#00d4ff", "#a855f7", "#f43f5e", "#facc15", "#22d3ee"] },
  { name: "Pastéis", colors: ["#93c5fd", "#c4b5fd", "#f9a8d4", "#fca5a5", "#fcd34d", "#86efac"] },
  { name: "Floresta", colors: ["#166534", "#15803d", "#4d7c0f", "#a16207", "#92400e", "#065f46"] },
  { name: "Corporativo", colors: ["#1e40af", "#4338ca", "#6d28d9", "#be185d", "#0f766e", "#b45309"] },
  { name: "Candy", colors: ["#ec4899", "#f472b6", "#c084fc", "#818cf8", "#38bdf8", "#34d399"] },
  { name: "Monocromático", colors: ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"] },
];

function PaletteSwatches({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-0.5">
      {colors.slice(0, 6).map((c, i) => (
        <span key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

/* ── iOS 26 Custom Dropdown ── */
function IosDropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; color?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = ref.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const mobile = window.innerWidth < 640;
      setIsMobileMenu(mobile);

      if (mobile) {
        setMenuStyle({
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 9999,
        });
        return;
      }

      const viewportHeight = window.innerHeight;
      const estimatedHeight = Math.min(options.length * 48 + 12, 260);
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpwards = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        top: openUpwards ? Math.max(12, rect.top - estimatedHeight - 6) : rect.bottom + 6,
        width: rect.width,
        zIndex: 9999,
      });
    };

    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    updatePosition();
    window.addEventListener("mousedown", close);
    window.addEventListener("touchstart", close);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("touchstart", close);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="ios-input w-full px-3 py-2 text-sm flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />}
          <span className="text-foreground truncate">{selected?.label || "Selecionar"}</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.span>
      </button>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {isMobileMenu && (
                <motion.button
                  type="button"
                  aria-label="Fechar seleção"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 bg-background/45 backdrop-blur-sm"
                  style={{ zIndex: 9998 }}
                />
              )}
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: isMobileMenu ? 18 : -4, scale: isMobileMenu ? 1 : 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isMobileMenu ? 18 : -4, scale: isMobileMenu ? 1 : 0.96 }}
                transition={{ type: "spring", damping: 24, stiffness: 400 }}
                className={isMobileMenu ? "bg-card border border-border/60 shadow-lg p-2 max-h-[50vh] overflow-y-auto" : "bg-card border border-border/60 shadow-lg p-1 max-h-60 overflow-y-auto"}
                style={{
                  ...menuStyle,
                  borderRadius: isMobileMenu ? "var(--ios-radius-lg)" : "var(--ios-radius, 16px)",
                  boxShadow: "var(--ios-shadow-float, 0 8px 32px rgba(0,0,0,0.12))",
                }}
              >
                {isMobileMenu && <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-border/80" />}
                {options.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary/60 transition-colors"
                  >
                    {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                    <span className="flex-1 text-left text-foreground">{opt.label}</span>
                    {value === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

/* ── Chart renderer supporting all styles ── */
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

function ChartByStyle({ style, data, color, type }: {
  style: ChartStyle;
  data: { name: string; value: number }[];
  color: string;
  type: string;
}) {
  const cfg = METRIC_CONFIG[type as MetricType];
  const gradientId = `grad-${type}-${style}-${color.replace("#", "")}`;
  const tooltipStyle = { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" };
  const tickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))", opacity: 0.7 };
  const fmt = (v: number) => [cfg?.format(v) ?? v, cfg?.label ?? type];

  // Only compute pareto data when needed
  const paretoData = useMemo(() => {
    if (style !== "pareto") return data;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, d) => s + d.value, 0);
    let cum = 0;
    return sorted.map((d) => {
      cum += d.value;
      return { ...d, cum: total > 0 ? parseFloat(((cum / total) * 100).toFixed(1)) : 0 };
    });
  }, [data, style]);

  switch (style) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 4, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }} activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "hsl(var(--card))" }} />
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
            <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} dot={{ r: 3, fill: color, stroke: "hsl(var(--card))", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "bar": {
      const dynamicBarSize = data.length <= 2 ? 36 : data.length <= 4 ? 22 : 14;
      const dynamicHeight = data.length <= 1 ? 80 : data.length <= 3 ? 120 : 160;
      return (
        <ResponsiveContainer width="100%" height={dynamicHeight}>
          <BarChart data={data} layout="vertical" barSize={dynamicBarSize} maxBarSize={44} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} cursor={{ fill: "transparent" }} />
            <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} background={{ fill: 'transparent' }} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    case "column":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={16} maxBarSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={60} strokeWidth={1} stroke="hsl(var(--card))">
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
          </PieChart>
        </ResponsiveContainer>
      );

    case "radar": {
      const radarData = data.map((d) => ({ subject: d.name, value: d.value }));
      return (
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={55}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip contentStyle={tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    case "scatter": {
      const scatterData = data.map((d, i) => ({ x: i + 1, y: d.value, name: d.name }));
      return (
        <ResponsiveContainer width="100%" height={160}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis type="number" dataKey="x" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={scatterData} fill={color} fillOpacity={0.8}>
              {scatterData.map((_, i) => (
                <Cell key={i} fill={color} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case "bubble": {
      const bubbleData = data.map((d, i) => ({ x: i + 1, y: d.value, z: d.value * 10, name: d.name }));
      return (
        <ResponsiveContainer width="100%" height={160}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis type="number" dataKey="x" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={bubbleData} fill={color} fillOpacity={0.5}>
              {bubbleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case "funnel": {
      const sorted = [...data].sort((a, b) => b.value - a.value);
      const maxVal = sorted[0]?.value || 1;
      return (
        <div className="h-[160px] flex flex-col justify-center gap-1 px-2">
          {sorted.map((d, i) => {
            const widthPct = Math.max((d.value / maxVal) * 100, 10);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-8 text-right truncate">{d.name}</span>
                <div className="flex-1 h-5 rounded-md bg-secondary/20 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                    className="h-full rounded-md"
                    style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                  />
                </div>
                <span className="text-[9px] font-bold" style={{ color }}>{d.value}</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "waterfall":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={16} maxBarSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => {
                const prev = i > 0 ? data[i - 1].value : 0;
                const isUp = entry.value >= prev;
                return <Cell key={i} fill={isUp ? "#10b981" : "#ef4444"} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );

    case "heatmap": {
      const weeks = Math.min(data.length, 7);
      const cellW = Math.floor(160 / weeks);
      const maxV = Math.max(...data.map((d) => d.value), 1);
      return (
        <div className="h-[160px] flex items-center justify-center">
          <svg width="100%" height={140} viewBox={`0 0 ${weeks * (cellW + 4)} 140`}>
            {data.slice(0, weeks * 5).map((d, i) => {
              const col = i % weeks;
              const row = Math.floor(i / weeks);
              const intensity = d.value / maxV;
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);
              return (
                <rect
                  key={i}
                  x={col * (cellW + 4)}
                  y={row * 28}
                  width={cellW}
                  height={24}
                  rx={4}
                  fill={`rgba(${r},${g},${b},${0.1 + intensity * 0.9})`}
                />
              );
            })}
          </svg>
        </div>
      );
    }

    case "pareto":
      return (
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={paretoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} />
            <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={tickStyle} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="right" orientation="right" tick={tickStyle} axisLine={false} tickLine={false} width={35} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar yAxisId="left" dataKey="value" fill={color} barSize={16} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="cum" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );

    case "treemap": {
      const maxV = Math.max(...data.map((d) => d.value), 1);
      const totalArea = 160 * 280;
      let cx = 0, cy = 0, rowH = 0;
      const rects = data.map((d, i) => {
        const area = (d.value / data.reduce((s, x) => s + x.value, 0)) * totalArea;
        const w = Math.max(Math.sqrt(area * 1.6), 30);
        const h = Math.max(area / w, 20);
        if (cx + w > 280) { cx = 0; cy += rowH + 4; rowH = 0; }
        const rect = { x: cx, y: cy, w, h, name: d.name, value: d.value, color: PIE_COLORS[i % PIE_COLORS.length] };
        cx += w + 4;
        rowH = Math.max(rowH, h);
        return rect;
      });
      return (
        <div className="h-[160px] overflow-hidden px-1">
          <svg width="100%" height={160} viewBox={`0 0 280 160`}>
            {rects.map((r, i) => (
              <g key={i}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={r.color} fillOpacity={0.75} />
                <text x={r.x + 4} y={r.y + 14} fontSize={9} fill="white" fontWeight="bold">{r.name}</text>
              </g>
            ))}
          </svg>
        </div>
      );
    }

    case "gantt": {
      const maxV = Math.max(...data.map((d) => d.value), 1);
      return (
        <div className="h-[160px] flex flex-col justify-center gap-2 px-2">
          {data.map((d, i) => {
            const widthPct = (d.value / maxV) * 80;
            const offset = (i * 5) % 20;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-8 text-right truncate">{d.name}</span>
                <div className="flex-1 relative h-4">
                  <div className="absolute inset-0 bg-secondary/20 rounded-full" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="absolute h-full rounded-full"
                    style={{ left: `${offset}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    default:
      return (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
  }
}

/* ── Individual Metric Chart Card ── */
const MetricChartCard = memo(function MetricChartCard({ type, data, delay, chartStyle, onStyleChange, relatedInfo, color, onColorChange, onDelete }: {
  type: MetricType;
  data: { name: string; value: number }[];
  delay: number;
  chartStyle: ChartStyle;
  onStyleChange: (style: ChartStyle) => void;
  relatedInfo?: string;
  color: string;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}) {
  const cfg = METRIC_CONFIG[type];
  const Icon = ICONS[type];

  const latest = data[data.length - 1]?.value ?? 0;
  const prev = data.length > 1 ? data[data.length - 2].value : latest;
  const change = prev > 0 ? ((latest - prev) / prev * 100) : 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, type: "spring", damping: 22 }}
          className="ios-card p-5 h-[300px] cursor-context-menu flex flex-col"
          style={{ overflow: "visible" }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{cfg.label}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold" style={{ color }}>{cfg.format(latest)}</span>
                  {change !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${change > 0 ? "text-green-500" : "text-red-500"}`}>
                      {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedInfo && (
            <div className="mb-2 px-2 py-1 rounded-lg bg-secondary/40 text-[10px] font-medium text-muted-foreground">
              {relatedInfo}
            </div>
          )}

          <div className="flex-1 min-h-0">
            <ChartByStyle style={chartStyle} data={data} color={color} type={type} />
          </div>

          <div className="mt-auto pt-1 text-[10px] text-muted-foreground/50 text-right">
            Clique direito para alterar estilo
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 max-h-[400px] overflow-y-auto">
        <ContextMenuLabel>Estilo do gráfico</ContextMenuLabel>
        <ContextMenuSeparator />
        {CHART_STYLES.map((cfg) => (
          <ChartStyleMenuItem
            key={cfg.key}
            config={cfg}
            isActive={chartStyle === cfg.key}
            onSelect={() => onStyleChange(cfg.key)}
          />
        ))}
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="h-3.5 w-3.5 mr-2" />
            Paleta de Cores
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52">
            {COLOR_PALETTES.map((palette) => {
              const idx = METRIC_TYPES.indexOf(type) % palette.colors.length;
              const paletteColor = palette.colors[idx];
              return (
                <ContextMenuItem
                  key={palette.name}
                  onClick={() => onColorChange(paletteColor)}
                  className="flex items-center gap-2"
                >
                  <PaletteSwatches colors={palette.colors} />
                  <span className="text-xs font-medium">{palette.name}</span>
                  {color === paletteColor && <Check className="h-3 w-3 ml-auto text-primary" />}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Excluir gráfico</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

/* ── Funnel visualization ── */
function ConversionFunnel({ data, colorOverrides, onApplyPalette }: {
  data: Record<MetricType, { name: string; value: number }[]>;
  colorOverrides: Record<string, string>;
  onApplyPalette: (palette: ColorPalette) => void;
}) {
  const funnelSteps: { type: MetricType; label: string }[] = [
    { type: "alcance", label: "Alcance" },
    { type: "seguidores", label: "Seguidores" },
    { type: "leads", label: "Leads" },
    { type: "vendas", label: "Vendas" },
    { type: "faturamento", label: "Faturamento" },
  ];

  const stepsWithData = funnelSteps.filter((s) => data[s.type]?.length > 0);
  if (stepsWithData.length < 2) return null;

  const latestValues = stepsWithData.map((s) => {
    const vals = data[s.type];
    return {
      ...s,
      value: vals[vals.length - 1]?.value ?? 0,
      color: colorOverrides[s.type] || METRIC_CONFIG[s.type].color,
      format: METRIC_CONFIG[s.type].format,
    };
  });

  const maxVal = Math.max(...latestValues.map((v) => v.value), 1);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 22 }}
          className="ios-card p-5 cursor-context-menu"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Funil de Conversão</h3>
            <span className="ml-auto text-[10px] text-muted-foreground/50">Clique direito para paleta</span>
          </div>
          <div className="space-y-3">
            {latestValues.map((step, i) => {
              const widthPct = Math.max((step.value / maxVal) * 100, 8);
              const nextStep = latestValues[i + 1];
              const convRate = nextStep && step.value > 0
                ? ((nextStep.value / step.value) * 100).toFixed(1)
                : null;
              return (
                <div key={step.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{step.label}</span>
                    <span className="text-xs font-bold" style={{ color: step.color }}>{step.format(step.value)}</span>
                  </div>
                  <div className="relative h-8 rounded-xl bg-secondary/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 rounded-xl"
                      style={{ background: `linear-gradient(90deg, ${step.color}40, ${step.color})` }}
                    />
                  </div>
                  {convRate && (
                    <div className="flex items-center justify-center mt-1 mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                        ↓ {convRate}% conversão
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" />
          Paleta de Cores do Funil
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {COLOR_PALETTES.map((palette) => (
          <ContextMenuItem
            key={palette.name}
            onClick={() => onApplyPalette(palette)}
            className="flex items-center gap-2"
          >
            <PaletteSwatches colors={palette.colors} />
            <span className="text-xs font-medium">{palette.name}</span>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function AnalyticsCharts({ companyId }: { companyId?: string }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { metrics, loading, addMetric, removeAllByType } = useClientMetrics(companyId);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<MetricType>("seguidores");
  const [formValue, setFormValue] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [chartStyles, setChartStyles] = useState<Record<string, ChartStyle>>({});
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});

  // Hidden charts persisted in localStorage per company
  const storageKey = `hidden-charts-${companyId || 'default'}`;
  const [hiddenCharts, setHiddenCharts] = useState<MetricType[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const hideChart = useCallback((type: MetricType) => {
    setHiddenCharts((prev) => {
      const next = [...prev, type];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    // Also remove manual entries
    removeAllByType(type);
  }, [removeAllByType, storageKey]);

  const unhideChart = useCallback((type: MetricType) => {
    setHiddenCharts((prev) => {
      const next = prev.filter((t) => t !== type);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const setStyleFor = useCallback((type: string, style: ChartStyle) => {
    setChartStyles((prev) => ({ ...prev, [type]: style }));
  }, []);

  const setColorFor = useCallback((type: string, color: string) => {
    setColorOverrides((prev) => ({ ...prev, [type]: color }));
  }, []);

  const applyFunnelPalette = (palette: ColorPalette) => {
    const newOverrides: Record<string, string> = { ...colorOverrides };
    METRIC_TYPES.forEach((t, i) => {
      newOverrides[t] = palette.colors[i % palette.colors.length];
    });
    setColorOverrides(newOverrides);
  };

  const perMetricData = useMemo(() => {
    const result: Record<MetricType, { name: string; value: number }[]> = {} as any;
    METRIC_TYPES.forEach((type) => {
      const filtered = metrics.filter((m) => m.metric_type === type);
      if (filtered.length === 0) return;
      const byDate: Record<string, number> = {};
      filtered.forEach((m) => {
        byDate[m.date] = (byDate[m.date] || 0) + m.value;
      });
      result[type] = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => {
          const d = new Date(date + "T00:00:00");
          return { name: `${d.getDate()}/${d.getMonth() + 1}`, value };
        });
    });

    if (result.leads && result.vendas && !result.conversao) {
      const leadsByDate: Record<string, number> = {};
      const vendasByDate: Record<string, number> = {};
      result.leads.forEach((d) => { leadsByDate[d.name] = d.value; });
      result.vendas.forEach((d) => { vendasByDate[d.name] = d.value; });
      const allDates = [...new Set([...Object.keys(leadsByDate), ...Object.keys(vendasByDate)])].sort();
      const convData = allDates.map((name) => {
        const l = leadsByDate[name] || 0;
        const v = vendasByDate[name] || 0;
        return { name, value: l > 0 ? parseFloat(((v / l) * 100).toFixed(1)) : 0 };
      }).filter((d) => d.value > 0);
      if (convData.length > 0) result.conversao = convData;
    }

    return result;
  }, [metrics]);

  const activeTypes = METRIC_TYPES.filter((t) => perMetricData[t]?.length > 0 && !hiddenCharts.includes(t));

  const getRelatedInfo = (type: MetricType): string | undefined => {
    if (type === "conversao" && perMetricData.leads && perMetricData.vendas) return "⚡ Calculado automaticamente: Vendas ÷ Leads × 100";
    if (type === "leads" && perMetricData.alcance) {
      const alcLast = perMetricData.alcance[perMetricData.alcance.length - 1]?.value ?? 0;
      const leadsLast = perMetricData.leads[perMetricData.leads.length - 1]?.value ?? 0;
      if (alcLast > 0) return `🎯 ${((leadsLast / alcLast) * 100).toFixed(1)}% do alcance vira lead`;
    }
    if (type === "faturamento" && perMetricData.vendas) {
      const vendasLast = perMetricData.vendas[perMetricData.vendas.length - 1]?.value ?? 0;
      const fatLast = perMetricData.faturamento?.[perMetricData.faturamento.length - 1]?.value ?? 0;
      if (vendasLast > 0) return `💰 Ticket médio: R$ ${(fatLast / vendasLast).toFixed(0)}`;
    }
    return undefined;
  };

  const AUTO_METRIC_TYPES: MetricType[] = ['seguidores', 'alcance'];
  const isAutoType = AUTO_METRIC_TYPES.includes(formType);

  const handleAdd = async () => {
    // Unhide the chart type if it was hidden
    unhideChart(formType);

    // For auto metrics (seguidores/alcance), value is optional - just unhide
    if (isAutoType && !formValue.trim()) {
      setShowForm(false);
      return;
    }

    const val = parseFloat(formValue);
    if (isNaN(val)) return;
    await addMetric(formType, val, formDate);
    setFormValue("");
    setShowForm(false);
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const dropdownOptions = METRIC_TYPES.map((t) => ({
    value: t,
    label: METRIC_CONFIG[t].label,
    color: colorOverrides[t] || METRIC_CONFIG[t].color,
  }));

  const defaultStyles: Record<string, ChartStyle> = {
    seguidores: "area",
    vendas: "column",
    conversao: "line",
    faturamento: "area",
    leads: "bar",
    alcance: "area",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Métricas do cliente</h3>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ios-card p-4 overflow-visible"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <IosDropdown value={formType} onChange={(v) => setFormType(v as MetricType)} options={dropdownOptions} />
              <input type="number" placeholder="Valor" value={formValue} onChange={(e) => setFormValue(e.target.value)} className="ios-input px-3 py-2 text-sm" />
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="ios-input px-3 py-2 text-sm" />
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Adicionar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTypes.length >= 2 && (
        <ConversionFunnel data={perMetricData} colorOverrides={colorOverrides} onApplyPalette={applyFunnelPalette} />
      )}

      {activeTypes.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {activeTypes.map((type, i) => (
            <MetricChartCard
              key={type}
              type={type}
              data={perMetricData[type]}
              delay={i * 0.06}
              chartStyle={chartStyles[type] || defaultStyles[type] || "area"}
              onStyleChange={(s) => setStyleFor(type, s)}
              relatedInfo={getRelatedInfo(type)}
              color={colorOverrides[type] || METRIC_CONFIG[type].color}
              onColorChange={(c) => setColorFor(type, c)}
              onDelete={() => hideChart(type)}
            />
          ))}
        </div>
      ) : (
        <div className="ios-card p-8 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma métrica registrada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em "Registrar" para adicionar seguidores, vendas, conversão e mais</p>
        </div>
      )}

      {hiddenCharts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Gráficos ocultos:</span>
          {hiddenCharts.map((type) => (
            <button
              key={type}
              onClick={() => unhideChart(type)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/60 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              {METRIC_CONFIG[type].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

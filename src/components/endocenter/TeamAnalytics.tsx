import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader2, ChevronDown, Check, TrendingUp, TrendingDown, User } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useTeamActivities } from "@/hooks/useTeamActivities";
import { useEndocenter } from "@/store/endocenterStore";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const MEMBER_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];

/* ── iOS 26 Dropdown ── */
function IosDropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="ios-input w-full px-3 py-2 text-sm flex items-center justify-between gap-2">
        <span className="text-foreground truncate">{selected?.label || "Selecionar"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", damping: 18, stiffness: 400 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-card border border-border/60 shadow-lg p-1 max-h-48 overflow-y-auto"
            style={{ borderRadius: "var(--ios-radius, 16px)", boxShadow: "var(--ios-shadow-float, 0 8px 32px rgba(0,0,0,0.12))" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-secondary/60 transition-colors"
              >
                <span className="flex-1 text-left text-foreground">{opt.label}</span>
                {value === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Chart per member ── */
function MemberCharts({ memberName, activities, color, delay }: {
  memberName: string;
  activities: { activity_type: string; value: number; unit: string; date: string }[];
  color: string;
  delay: number;
}) {
  // Group activities by type
  const byType = useMemo(() => {
    const map: Record<string, { values: { name: string; value: number }[]; unit: string; latest: number; prev: number }> = {};
    activities.forEach((a) => {
      if (!map[a.activity_type]) map[a.activity_type] = { values: [], unit: a.unit, latest: 0, prev: 0 };
      const d = new Date(a.date + "T00:00:00");
      map[a.activity_type].values.push({ name: `${d.getDate()}/${d.getMonth() + 1}`, value: a.value });
    });
    // Sort and set latest/prev
    Object.values(map).forEach((entry) => {
      entry.values.sort((a, b) => a.name.localeCompare(b.name));
      entry.latest = entry.values[entry.values.length - 1]?.value ?? 0;
      entry.prev = entry.values.length > 1 ? entry.values[entry.values.length - 2].value : entry.latest;
    });
    return map;
  }, [activities]);

  const types = Object.keys(byType);
  const chartVariants = ["area", "bar", "line"] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 22 }}
      className="ios-card p-5 space-y-4"
    >
      {/* Member header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <User className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground">{memberName}</h4>
          <p className="text-xs text-muted-foreground">{types.length} atividade{types.length !== 1 ? "s" : ""} registrada{types.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* KPI row for this member */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {types.map((type) => {
          const { latest, prev, unit } = byType[type];
          const change = prev > 0 ? ((latest - prev) / prev * 100) : 0;
          return (
            <div key={type} className="p-3 rounded-2xl bg-secondary/30 border border-border/30">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{type}</div>
              <div className="text-lg font-extrabold text-foreground mt-0.5">
                {latest.toLocaleString("pt-BR")}{unit ? ` ${unit}` : ""}
              </div>
              {change !== 0 && (
                <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${change > 0 ? "text-green-500" : "text-red-500"}`}>
                  {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change).toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Individual charts per activity type */}
      <div className="grid sm:grid-cols-2 gap-4">
        {types.map((type, idx) => {
          const { values, unit } = byType[type];
          const variant = chartVariants[idx % 3];
          if (values.length < 1) return null;

          return (
            <div key={type} className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">{type} {unit ? `(${unit})` : ""}</div>
              <ResponsiveContainer width="100%" height={140}>
                {variant === "area" ? (
                  <AreaChart data={values}>
                    <defs>
                      <linearGradient id={`g-${memberName}-${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} />
                    <Area type="monotone" dataKey="value" stroke={color} fill={`url(#g-${memberName}-${type})`} strokeWidth={2} />
                  </AreaChart>
                ) : variant === "bar" ? (
                  <BarChart data={values} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} />
                    <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={values}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }} />
                    <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function TeamAnalytics() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { team } = useEndocenter();
  const { activities, loading, addActivity } = useTeamActivities();
  const [showForm, setShowForm] = useState(false);
  const [formMember, setFormMember] = useState("");
  const [formType, setFormType] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));

  // Get unique member names from activities + team
  const memberNames = useMemo(() => {
    const names = new Set<string>();
    team.forEach((m) => names.add(m.name));
    activities.forEach((a) => names.add(a.member_name));
    return Array.from(names).sort();
  }, [team, activities]);

  // Group activities by member
  const byMember = useMemo(() => {
    const map: Record<string, typeof activities> = {};
    activities.forEach((a) => {
      if (!map[a.member_name]) map[a.member_name] = [];
      map[a.member_name].push(a);
    });
    return map;
  }, [activities]);

  const membersWithData = Object.keys(byMember).sort();

  // Common activity type suggestions
  const activitySuggestions = useMemo(() => {
    const types = new Set<string>();
    activities.forEach((a) => types.add(a.activity_type));
    ["Posts", "Horas trabalhadas", "Remuneração", "Leads gerados", "Vendas", "Reuniões", "Entregas"].forEach((t) => types.add(t));
    return Array.from(types);
  }, [activities]);

  const handleAdd = async () => {
    if (!formMember || !formType || !formValue) return;
    await addActivity(formMember, formType, parseFloat(formValue), formUnit, formDate);
    setFormValue("");
    setShowForm(false);
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Análise do Time</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gráficos individuais por membro da equipe</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar atividade
          </button>
        )}
      </div>

      {/* Add activity form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ios-card p-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <IosDropdown
                value={formMember}
                onChange={setFormMember}
                options={memberNames.map((n) => ({ value: n, label: n }))}
              />
              <IosDropdown
                value={formType}
                onChange={setFormType}
                options={activitySuggestions.map((t) => ({ value: t, label: t }))}
              />
              <input
                type="number"
                placeholder="Valor"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Unidade (h, R$, un)"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="ios-input px-3 py-2 text-sm"
              />
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Adicionar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member charts */}
      {membersWithData.length > 0 ? (
        <div className="space-y-5">
          {membersWithData.map((name, i) => (
            <MemberCharts
              key={name}
              memberName={name}
              activities={byMember[name]}
              color={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              delay={i * 0.08}
            />
          ))}
        </div>
      ) : (
        <div className="ios-card p-10 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Registre atividades dos membros para ver gráficos individuais de performance
          </p>
        </div>
      )}
    </div>
  );
}

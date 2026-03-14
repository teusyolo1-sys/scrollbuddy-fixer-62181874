import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  photoUrl: string;
  color: string;
  colorLight: string;
  colorBorder: string;
  remuneration: number;
  hours: number;
  tasks: string[];
  kpis: string[];
  status: string;
}

export interface CompanyInfo {
  name: string;
  subtitle: string;
  month: string;
}

interface EndocenterStore {
  company: CompanyInfo;
  setCompany: (c: CompanyInfo) => void;
  team: TeamMember[];
  setTeam: (t: TeamMember[]) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
}

const defaultTeam: TeamMember[] = [
  {
    id: "traffic", role: "Gestor de Tráfego", name: "Rafael Almeida", photoUrl: "",
    color: "#1E6FD9", colorLight: "#EFF6FF", colorBorder: "#BFDBFE",
    remuneration: 3800, hours: 160,
    tasks: ["Gestão Meta Ads & Google Ads", "Otimização de campanhas", "Relatórios de performance", "Análise de público-alvo"],
    kpis: ["CPL < R$25", "ROAS > 3.5x", "CTR > 2%"], status: "Ativo",
  },
  {
    id: "copy", role: "Copywriter", name: "Fernanda Costa", photoUrl: "",
    color: "#7C3AED", colorLight: "#F5F3FF", colorBorder: "#DDD6FE",
    remuneration: 3200, hours: 120,
    tasks: ["Textos para anúncios", "Legendas de posts", "Scripts de vídeo", "E-mails e WhatsApp"],
    kpis: ["4 copies/semana", "Aprovação em 1ª rodada > 80%", "Taxa abertura email > 30%"], status: "Ativo",
  },
  {
    id: "design", role: "Designer", name: "Lucas Mendes", photoUrl: "",
    color: "#DC2626", colorLight: "#FFF1F2", colorBorder: "#FECDD3",
    remuneration: 3000, hours: 120,
    tasks: ["Criação de posts e stories", "Artes para anúncios", "Materiais visuais institucionais", "Diagramação de LPs"],
    kpis: ["12 peças/semana", "Aprovação em 1ª rodada > 75%", "Entrega no prazo > 95%"], status: "Ativo",
  },
  {
    id: "strategy", role: "Estrategista", name: "Mariana Oliveira", photoUrl: "",
    color: "#059669", colorLight: "#ECFDF5", colorBorder: "#A7F3D0",
    remuneration: 4500, hours: 80,
    tasks: ["Planejamento de conteúdo mensal", "Briefings para equipe", "Revisão e aprovação final", "Relatório estratégico mensal"],
    kpis: ["Briefing entregue até dia 25/mês", "Aprovação em < 24h", "Meta mensal de leads"], status: "Ativo",
  },
];

const defaultCompany: CompanyInfo = {
  name: "Endocenter",
  subtitle: "Gestão operacional de marketing",
  month: "Março 2025",
};

const STORAGE_KEY = "endocenter_settings";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(data: { company: CompanyInfo; team: TeamMember[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const EndocenterContext = createContext<EndocenterStore | null>(null);

export function EndocenterProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [company, setCompanyState] = useState<CompanyInfo>(stored?.company || defaultCompany);
  const [team, setTeamState] = useState<TeamMember[]>(stored?.team || defaultTeam);

  useEffect(() => {
    saveToStorage({ company, team });
  }, [company, team]);

  const setCompany = (c: CompanyInfo) => setCompanyState(c);
  const setTeam = (t: TeamMember[]) => setTeamState(t);
  const updateMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamState((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  return (
    <EndocenterContext.Provider value={{ company, setCompany, team, setTeam, updateMember }}>
      {children}
    </EndocenterContext.Provider>
  );
}

export function useEndocenter() {
  const ctx = useContext(EndocenterContext);
  if (!ctx) throw new Error("useEndocenter must be used within EndocenterProvider");
  return ctx;
}

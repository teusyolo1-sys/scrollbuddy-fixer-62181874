import type { TrashItem } from "./types";

const STORAGE_KEY = "endocenter_settings";

const getStorageKey = (companyId?: string) =>
  companyId ? `endocenter_${companyId}` : STORAGE_KEY;

interface PersistedEndocenterData {
  team?: Record<string, unknown>[];
  [key: string]: unknown;
}

export const loadPersistedData = (companyId?: string): PersistedEndocenterData | null => {
  try {
    const scoped = localStorage.getItem(getStorageKey(companyId));
    if (scoped) return JSON.parse(scoped);

    if (companyId) {
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy) return JSON.parse(legacy);
    }
  } catch {
    return null;
  }
  return null;
};

export const savePersistedData = (data: PersistedEndocenterData, companyId?: string) => {
  localStorage.setItem(getStorageKey(companyId), JSON.stringify(data));
};

/**
 * Rebuilds a TeamMember from trash item_data.
 * Uses item_name as the canonical name to avoid mismatches.
 */
export const buildRestoredMember = (item: TrashItem) => {
  const rawColor = typeof item.item_data.color === "string" ? item.item_data.color : "#64748B";
  const role = typeof item.item_data.role === "string" ? item.item_data.role : "Membro";
  const specialty = typeof item.item_data.specialty === "string" ? item.item_data.specialty : role;

  return {
    ...item.item_data,
    id: typeof item.item_data.id === "string" ? item.item_data.id : item.item_id,
    // Always use item_name as the authoritative name
    name: item.item_name,
    role,
    specialty,
    caseNotes: typeof item.item_data.caseNotes === "string" ? item.item_data.caseNotes : "",
    photoUrl: typeof item.item_data.photoUrl === "string" ? item.item_data.photoUrl : "",
    color: rawColor,
    colorLight: typeof item.item_data.colorLight === "string" ? item.item_data.colorLight : `${rawColor}1A`,
    colorBorder: typeof item.item_data.colorBorder === "string" ? item.item_data.colorBorder : `${rawColor}33`,
    remuneration: typeof item.item_data.remuneration === "number" ? item.item_data.remuneration : 0,
    hours: typeof item.item_data.hours === "number" ? item.item_data.hours : 0,
    tasks: Array.isArray(item.item_data.tasks) ? item.item_data.tasks : [],
    kpis: Array.isArray(item.item_data.kpis) ? item.item_data.kpis : [],
    status: typeof item.item_data.status === "string" ? item.item_data.status : "Ativo",
  };
};

/**
 * Restores a member back into localStorage team array.
 */
export function restoreMemberToLocalStorage(item: TrashItem): void {
  const companyId = typeof item.item_data.companyId === "string" ? item.item_data.companyId : undefined;
  const currentData = loadPersistedData(companyId) ?? {};
  const restoredMember = buildRestoredMember(item);
  const currentTeam = Array.isArray(currentData.team) ? currentData.team : [];

  const nextTeam = currentTeam.some((m) => m?.id === restoredMember.id)
    ? currentTeam.map((m) => (m?.id === restoredMember.id ? { ...m, ...restoredMember } : m))
    : [...currentTeam, restoredMember];

  savePersistedData({ ...currentData, team: nextTeam }, companyId);
}

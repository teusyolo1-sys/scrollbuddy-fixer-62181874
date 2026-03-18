export type RadiusTarget = 'cards' | 'inputs' | 'tabs' | 'buttons' | 'badges' | 'modals' | 'avatars' | 'progress' | 'icons' | 'tooltips' | 'dropdowns' | 'containers';

export const RADIUS_TARGETS: { key: RadiusTarget; label: string }[] = [
  { key: 'cards', label: 'Cards / Painéis' },
  { key: 'containers', label: 'Contêineres internos' },
  { key: 'inputs', label: 'Inputs / Selects' },
  { key: 'tabs', label: 'Barra de abas' },
  { key: 'buttons', label: 'Botões' },
  { key: 'badges', label: 'Badges / Etiquetas' },
  { key: 'modals', label: 'Modais / Diálogos' },
  { key: 'avatars', label: 'Avatares / Ícones' },
  { key: 'progress', label: 'Barras de progresso' },
  { key: 'icons', label: 'Caixas de ícones' },
  { key: 'tooltips', label: 'Tooltips / Popovers' },
  { key: 'dropdowns', label: 'Dropdowns / Menus' },
];

export const ALL_RADIUS_TARGETS: RadiusTarget[] = RADIUS_TARGETS.map(t => t.key);

export interface CompanyTheme {
  accentColor: string;
  accentName: string;
  fontFamily: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  radiusTargets: RadiusTarget[];
  wallpaper: 'none' | 'preset' | 'custom';
  wallpaperUrl: string;
  wallpaperOpacity: number;
  wallpaperBlur: number;
  surfaceOpacity: number;
  darkSurfaceOpacity: number;
}

export const DEFAULT_THEME: CompanyTheme = {
  accentColor: '#3b82f6',
  accentName: 'Azul',
  fontFamily: 'Inter',
  borderRadius: 'rounded',
  radiusTargets: [...ALL_RADIUS_TARGETS],
  wallpaper: 'none',
  wallpaperUrl: '',
  wallpaperOpacity: 0.08,
  wallpaperBlur: 0,
  surfaceOpacity: 0.85,
  darkSurfaceOpacity: 0.75,
};

export const ACCENT_PRESETS = [
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Violeta', color: '#8b5cf6' },
  { name: 'Rosa', color: '#ec4899' },
  { name: 'Vermelho', color: '#ef4444' },
  { name: 'Laranja', color: '#f97316' },
  { name: 'Âmbar', color: '#f59e0b' },
  { name: 'Esmeralda', color: '#10b981' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Ciano', color: '#06b6d4' },
  { name: 'Índigo', color: '#6366f1' },
  { name: 'Fúcsia', color: '#d946ef' },
  { name: 'Grafite', color: '#64748b' },
];

export const FONT_PRESETS = [
  { name: 'Inter', value: 'Inter', style: 'Moderna e limpa', url: '' },
  { name: 'DM Sans', value: '"DM Sans"', style: 'Geométrica e profissional', url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap' },
  { name: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans"', style: 'Elegante e contemporânea', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap' },
  { name: 'Outfit', value: 'Outfit', style: 'Clean e arredondada', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap' },
  { name: 'Manrope', value: 'Manrope', style: 'Técnica e séria', url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap' },
  { name: 'Space Grotesk', value: '"Space Grotesk"', style: 'Futurista e bold', url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
];

export const WALLPAPER_PRESETS = [
  { name: 'Nenhum', key: 'none', css: '', pattern: '' },
  { name: 'Mesh Azul', key: 'mesh-blue', css: 'radial-gradient(at 20% 20%, hsl(215 80% 60% / 0.15) 0%, transparent 50%), radial-gradient(at 80% 80%, hsl(265 60% 55% / 0.12) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(190 70% 50% / 0.08) 0%, transparent 60%)', pattern: '' },
  { name: 'Mesh Quente', key: 'mesh-warm', css: 'radial-gradient(at 30% 20%, hsl(340 70% 55% / 0.14) 0%, transparent 50%), radial-gradient(at 70% 70%, hsl(30 80% 55% / 0.12) 0%, transparent 50%), radial-gradient(at 50% 90%, hsl(50 90% 55% / 0.08) 0%, transparent 50%)', pattern: '' },
  { name: 'Mesh Verde', key: 'mesh-green', css: 'radial-gradient(at 25% 25%, hsl(160 70% 45% / 0.14) 0%, transparent 50%), radial-gradient(at 75% 75%, hsl(130 50% 50% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(180 60% 40% / 0.06) 0%, transparent 60%)', pattern: '' },
  { name: 'Mesh Roxo', key: 'mesh-purple', css: 'radial-gradient(at 20% 30%, hsl(270 70% 55% / 0.15) 0%, transparent 45%), radial-gradient(at 80% 60%, hsl(300 60% 50% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 80%, hsl(240 50% 55% / 0.08) 0%, transparent 50%)', pattern: '' },
  { name: 'Dots', key: 'dots', css: '', pattern: 'dots' },
  { name: 'Grid', key: 'lines', css: '', pattern: 'lines' },
];

export const RADIUS_PRESETS = [
  { name: 'Reto', value: 'sharp' as const, cssVar: '4px' },
  { name: 'Arredondado', value: 'rounded' as const, cssVar: '12px' },
  { name: 'Pílula', value: 'pill' as const, cssVar: '24px' },
];

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function themeToCSS(theme: CompanyTheme, isDark: boolean): Record<string, string> {
  const { h, s, l } = hexToHSL(theme.accentColor);
  const fontValue = theme.fontFamily === 'Inter'
    ? '"Inter", sans-serif'
    : `${FONT_PRESETS.find(f => f.name === theme.fontFamily)?.value || theme.fontFamily}, "Inter", sans-serif`;
  const radiusValue = RADIUS_PRESETS.find(r => r.value === theme.borderRadius)?.cssVar || '12px';

  return {
    '--theme-accent': `${h} ${s}% ${isDark ? Math.min(l + 10, 70) : l}%`,
    '--theme-accent-hex': theme.accentColor,
    '--theme-accent-fg': l > 55 ? '0 0% 10%' : '0 0% 100%',
    '--theme-font': fontValue,
    '--theme-radius': radiusValue,
    '--theme-surface-opacity': String(isDark ? theme.darkSurfaceOpacity : theme.surfaceOpacity),
    '--theme-wallpaper-opacity': String(theme.wallpaperOpacity),
    '--theme-wallpaper-blur': `${theme.wallpaperBlur}px`,
  };
}

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

export type WallpaperCategory = 'none' | 'mesh' | 'solid' | 'gradient' | 'pattern' | 'image' | 'animated';

export interface CompanyTheme {
  accentColor: string;
  accentName: string;
  fontFamily: string;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  radiusTargets: RadiusTarget[];
  wallpaper: WallpaperCategory;
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

// ── Mesh Gradient Presets ──
export const MESH_PRESETS = [
  { name: 'Oceano', css: 'radial-gradient(at 20% 20%, hsl(215 80% 60% / 0.15) 0%, transparent 50%), radial-gradient(at 80% 80%, hsl(265 60% 55% / 0.12) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(190 70% 50% / 0.08) 0%, transparent 60%)' },
  { name: 'Pôr do sol', css: 'radial-gradient(at 30% 20%, hsl(340 70% 55% / 0.14) 0%, transparent 50%), radial-gradient(at 70% 70%, hsl(30 80% 55% / 0.12) 0%, transparent 50%), radial-gradient(at 50% 90%, hsl(50 90% 55% / 0.08) 0%, transparent 50%)' },
  { name: 'Floresta', css: 'radial-gradient(at 25% 25%, hsl(160 70% 45% / 0.14) 0%, transparent 50%), radial-gradient(at 75% 75%, hsl(130 50% 50% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(180 60% 40% / 0.06) 0%, transparent 60%)' },
  { name: 'Lavanda', css: 'radial-gradient(at 20% 30%, hsl(270 70% 55% / 0.15) 0%, transparent 45%), radial-gradient(at 80% 60%, hsl(300 60% 50% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 80%, hsl(240 50% 55% / 0.08) 0%, transparent 50%)' },
  { name: 'Aurora', css: 'radial-gradient(at 10% 50%, hsl(160 80% 50% / 0.15) 0%, transparent 40%), radial-gradient(at 50% 20%, hsl(200 70% 55% / 0.12) 0%, transparent 45%), radial-gradient(at 90% 70%, hsl(280 60% 55% / 0.1) 0%, transparent 40%)' },
  { name: 'Chama', css: 'radial-gradient(at 30% 80%, hsl(15 90% 50% / 0.14) 0%, transparent 45%), radial-gradient(at 70% 30%, hsl(40 85% 55% / 0.12) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(0 80% 45% / 0.06) 0%, transparent 55%)' },
  { name: 'Meia-noite', css: 'radial-gradient(at 20% 20%, hsl(230 60% 40% / 0.18) 0%, transparent 45%), radial-gradient(at 80% 80%, hsl(260 50% 35% / 0.15) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(220 40% 30% / 0.1) 0%, transparent 60%)' },
  { name: 'Primavera', css: 'radial-gradient(at 25% 30%, hsl(330 65% 60% / 0.12) 0%, transparent 45%), radial-gradient(at 75% 70%, hsl(140 55% 50% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(50 70% 55% / 0.06) 0%, transparent 55%)' },
  { name: 'Neon', css: 'radial-gradient(at 15% 50%, hsl(180 100% 50% / 0.12) 0%, transparent 40%), radial-gradient(at 85% 50%, hsl(300 100% 50% / 0.1) 0%, transparent 40%), radial-gradient(at 50% 90%, hsl(60 100% 50% / 0.06) 0%, transparent 45%)' },
  { name: 'Glacial', css: 'radial-gradient(at 30% 30%, hsl(200 80% 70% / 0.15) 0%, transparent 50%), radial-gradient(at 70% 70%, hsl(190 60% 60% / 0.1) 0%, transparent 50%), radial-gradient(at 50% 50%, hsl(210 50% 80% / 0.08) 0%, transparent 60%)' },
];

// ── Solid Color Presets ──
export const SOLID_PRESETS = [
  { name: 'Azul escuro', css: 'hsl(220 40% 13%)' },
  { name: 'Grafite', css: 'hsl(220 10% 16%)' },
  { name: 'Marinho', css: 'hsl(230 35% 12%)' },
  { name: 'Carvão', css: 'hsl(0 0% 10%)' },
  { name: 'Noturno', css: 'hsl(250 25% 11%)' },
  { name: 'Esmeralda escuro', css: 'hsl(160 30% 10%)' },
  { name: 'Vinho', css: 'hsl(340 30% 12%)' },
  { name: 'Chocolate', css: 'hsl(25 25% 12%)' },
  { name: 'Branco', css: 'hsl(0 0% 100%)' },
  { name: 'Neve', css: 'hsl(210 20% 98%)' },
  { name: 'Creme', css: 'hsl(40 30% 96%)' },
  { name: 'Lavanda claro', css: 'hsl(250 30% 97%)' },
  { name: 'Menta claro', css: 'hsl(160 25% 96%)' },
  { name: 'Rosa claro', css: 'hsl(340 25% 97%)' },
];

// ── Gradient (Linear) Presets ──
export const GRADIENT_PRESETS = [
  { name: 'Oceano profundo', css: 'linear-gradient(135deg, hsl(220 60% 15%) 0%, hsl(250 50% 20%) 100%)' },
  { name: 'Noite estrelada', css: 'linear-gradient(180deg, hsl(230 40% 12%) 0%, hsl(260 35% 18%) 50%, hsl(220 30% 10%) 100%)' },
  { name: 'Aurora boreal', css: 'linear-gradient(135deg, hsl(180 50% 15%) 0%, hsl(220 40% 18%) 50%, hsl(280 35% 15%) 100%)' },
  { name: 'Pôr do sol', css: 'linear-gradient(135deg, hsl(340 50% 18%) 0%, hsl(20 60% 20%) 50%, hsl(40 50% 15%) 100%)' },
  { name: 'Floresta negra', css: 'linear-gradient(180deg, hsl(150 30% 10%) 0%, hsl(170 25% 14%) 50%, hsl(140 20% 8%) 100%)' },
  { name: 'Vinho tinto', css: 'linear-gradient(135deg, hsl(340 40% 12%) 0%, hsl(350 35% 16%) 50%, hsl(330 30% 10%) 100%)' },
  { name: 'Carvão dourado', css: 'linear-gradient(135deg, hsl(0 0% 10%) 0%, hsl(35 30% 15%) 100%)' },
  { name: 'Gelo', css: 'linear-gradient(180deg, hsl(200 30% 92%) 0%, hsl(210 25% 96%) 100%)' },
  { name: 'Névoa rosa', css: 'linear-gradient(135deg, hsl(330 20% 95%) 0%, hsl(270 15% 96%) 100%)' },
  { name: 'Amanhecer', css: 'linear-gradient(180deg, hsl(35 40% 94%) 0%, hsl(20 50% 92%) 50%, hsl(340 30% 95%) 100%)' },
  { name: 'Azul celeste', css: 'linear-gradient(180deg, hsl(200 50% 93%) 0%, hsl(210 40% 97%) 100%)' },
  { name: 'Menta suave', css: 'linear-gradient(135deg, hsl(160 30% 94%) 0%, hsl(180 25% 96%) 100%)' },
];

// ── Pattern Presets ──
export interface PatternPreset {
  name: string;
  getCss: (isDark: boolean) => Record<string, string>;
}

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    name: 'Dots',
    getCss: (isDark) => ({
      backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
    }),
  },
  {
    name: 'Grid',
    getCss: (isDark) => ({
      backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
    }),
  },
  {
    name: 'Grid fino',
    getCss: (isDark) => ({
      backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'} 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
    }),
  },
  {
    name: 'Diagonal',
    getCss: (isDark) => ({
      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 10px, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 11px)`,
    }),
  },
  {
    name: 'Hexagonal',
    getCss: (isDark) => {
      const c = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
      return {
        backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px), radial-gradient(circle, ${c} 1px, transparent 1px)`,
        backgroundSize: '30px 52px',
        backgroundPosition: '0 0, 15px 26px',
      };
    },
  },
  {
    name: 'Cross',
    getCss: (isDark) => {
      const c = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
      return {
        backgroundImage: `radial-gradient(circle, ${c} 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      };
    },
  },
  {
    name: 'Noise',
    getCss: () => ({
      backgroundImage: `radial-gradient(at 20% 80%, #fff 1px, transparent 0px)`,
      backgroundSize: '3px 3px',
      mixBlendMode: 'plus-lighter',
    }),
  },
];

// ── Animated Presets ──
export interface AnimatedPreset {
  name: string;
  description: string;
  keyframes: string;
  getHtml: () => string;
}

export const ANIMATED_PRESETS: AnimatedPreset[] = [
  {
    name: 'Orbs flutuantes',
    description: 'Bolhas de cor que flutuam suavemente',
    keyframes: `
      @keyframes floatOrb1 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(50px,-30px)} 50%{transform:translate(-20px,40px)} 75%{transform:translate(30px,20px)} }
      @keyframes floatOrb2 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-40px,30px)} 50%{transform:translate(30px,-20px)} 75%{transform:translate(-20px,-30px)} }
      @keyframes floatOrb3 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(30px,40px)} 50%{transform:translate(-40px,-20px)} 75%{transform:translate(20px,-30px)} }
    `,
    getHtml: () => `
      <div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0">
        <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary)/0.12),transparent 70%);top:10%;left:20%;animation:floatOrb1 20s ease-in-out infinite"></div>
        <div style="position:absolute;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary)/0.08),transparent 70%);top:50%;right:15%;animation:floatOrb2 25s ease-in-out infinite"></div>
        <div style="position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary)/0.06),transparent 70%);bottom:10%;left:40%;animation:floatOrb3 18s ease-in-out infinite"></div>
      </div>
    `,
  },
  {
    name: 'Gradiente rotativo',
    description: 'Gradiente que gira lentamente',
    keyframes: `@keyframes spinGrad { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`,
    getHtml: () => `<div style="position:fixed;inset:-50%;width:200%;height:200%;pointer-events:none;z-index:0;animation:spinGrad 30s linear infinite;background:conic-gradient(from 0deg,hsl(var(--primary)/0.06),transparent 30%,hsl(var(--primary)/0.04),transparent 60%,hsl(var(--primary)/0.08),transparent 90%)"></div>`,
  },
  {
    name: 'Pulso suave',
    description: 'Manchas de cor que pulsam',
    keyframes: `
      @keyframes pulse1 { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
      @keyframes pulse2 { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.2);opacity:0.9} }
    `,
    getHtml: () => `
      <div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0">
        <div style="position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary)/0.1),transparent 60%);top:20%;left:30%;animation:pulse1 8s ease-in-out infinite"></div>
        <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary)/0.07),transparent 60%);bottom:20%;right:20%;animation:pulse2 10s ease-in-out infinite 2s"></div>
      </div>
    `,
  },
  {
    name: 'Partículas',
    description: 'Pontos de luz subindo lentamente',
    keyframes: `@keyframes particleUp { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(-110vh);opacity:0} }`,
    getHtml: () => {
      const particles = Array.from({ length: 15 }, (_, i) => {
        const left = (i * 6.7 + 3) % 100;
        const delay = (i * 0.7) % 10;
        const dur = 12 + (i * 0.5) % 8;
        const size = 2 + (i * 0.2) % 3;
        return `<div style="position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:hsl(var(--primary)/0.25);left:${left}%;bottom:-10px;animation:particleUp ${dur}s linear infinite ${delay}s"></div>`;
      }).join('');
      return `<div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0">${particles}</div>`;
    },
  },
  {
    name: 'Ondas',
    description: 'Ondas suaves no fundo',
    keyframes: `@keyframes waveShift { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`,
    getHtml: () => `
      <div style="position:fixed;bottom:0;left:0;right:0;height:300px;pointer-events:none;z-index:0;overflow:hidden">
        <svg viewBox="0 0 1440 300" style="position:absolute;bottom:0;width:200%;animation:waveShift 15s linear infinite" preserveAspectRatio="none">
          <path d="M0,200 C360,100 720,280 1080,180 C1260,130 1350,200 1440,200 L1440,300 L0,300 Z" fill="hsl(var(--primary)/0.04)"/>
          <path d="M0,220 C300,150 600,260 900,200 C1100,160 1300,230 1440,210 L1440,300 L0,300 Z" fill="hsl(var(--primary)/0.03)"/>
        </svg>
      </div>
    `,
  },
  {
    name: 'Estrelas',
    description: 'Céu estrelado com brilho sutil',
    keyframes: `@keyframes twinkle { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`,
    getHtml: () => {
      const stars = Array.from({ length: 30 }, (_, i) => {
        const x = (i * 3.33 + 1) % 100;
        const y = (i * 3.33 + 2) % 100;
        const delay = (i * 0.17) % 5;
        const dur = 3 + (i * 0.13) % 4;
        const size = 1 + (i * 0.07) % 2;
        return `<div style="position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:hsl(var(--primary)/0.3);left:${x}%;top:${y}%;animation:twinkle ${dur}s ease-in-out infinite ${delay}s"></div>`;
      }).join('');
      return `<div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0">${stars}</div>`;
    },
  },
];

// ── Legacy compat ──
export const WALLPAPER_PRESETS = [
  { name: 'Nenhum', key: 'none', css: '', pattern: '' },
  ...MESH_PRESETS.map((m, i) => ({ name: m.name, key: `mesh-${i}`, css: m.css, pattern: '' })),
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

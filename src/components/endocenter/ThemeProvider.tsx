import { useEffect, useMemo } from 'react';
import { useEndocenter } from '@/store/endocenterStore';
import { useTheme } from '@/hooks/useTheme';
import {
  DEFAULT_THEME, themeToCSS, isWallpaperLight, FONT_PRESETS, MESH_PRESETS, SOLID_PRESETS,
  GRADIENT_PRESETS, PATTERN_PRESETS, ANIMATED_PRESETS, ALL_RADIUS_TARGETS,
  type CompanyTheme, type RadiusTarget,
} from '@/lib/companyTheme';

// Light-mode foreground tokens to force when a light wallpaper is used in dark mode
const LIGHT_FOREGROUND_OVERRIDES: Record<string, string> = {
  '--foreground': '230 25% 12%',
  '--card-foreground': '230 25% 12%',
  '--popover-foreground': '230 25% 12%',
  '--secondary-foreground': '230 20% 30%',
  '--muted-foreground': '230 8% 52%',
};

export default function CompanyThemeProvider({ children }: { children: React.ReactNode }) {
  const { company } = useEndocenter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const theme: CompanyTheme = useMemo(() => {
    try {
      const raw = (company as any).theme;
      if (raw && typeof raw === 'object') return { ...DEFAULT_THEME, ...raw };
    } catch {}
    return DEFAULT_THEME;
  }, [company]);

  const cssVars = useMemo(() => themeToCSS(theme, isDark), [theme, isDark]);
  const forceLightText = useMemo(() => isDark && isWallpaperLight(theme), [isDark, theme]);

  // Load custom font
  useEffect(() => {
    if (theme.fontFamily === 'Inter') return;
    const fontConfig = FONT_PRESETS.find(f => f.name === theme.fontFamily);
    if (!fontConfig?.url) return;
    const linkId = 'theme-font-link';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = fontConfig.url;
  }, [theme.fontFamily]);

  const style = useMemo(() => {
    const base: Record<string, string> = { ...cssVars };
    base['--primary'] = cssVars['--theme-accent'];
    base['--accent'] = cssVars['--theme-accent'];
    base['--ring'] = cssVars['--theme-accent'];
    base['--radius'] = cssVars['--theme-radius'];
    base['fontFamily'] = cssVars['--theme-font'];

    // Force dark foreground text when light wallpaper is active in dark mode
    if (forceLightText) {
      Object.assign(base, LIGHT_FOREGROUND_OVERRIDES);
    }

    return base;
  }, [cssVars, forceLightText]);

  const targets = theme.radiusTargets || ALL_RADIUS_TARGETS;
  const dataAttrs = useMemo(() => {
    const attrs: Record<string, string> = {};
    for (const t of (ALL_RADIUS_TARGETS as RadiusTarget[])) {
      attrs[`data-radius-${t}`] = targets.includes(t) ? 'true' : 'false';
    }
    return attrs;
  }, [targets]);

  const wallpaperNode = useMemo(() => {
    if (theme.wallpaper === 'none' || !theme.wallpaperUrl) return null;

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      opacity: theme.wallpaperOpacity,
      filter: theme.wallpaperBlur > 0 ? `blur(${theme.wallpaperBlur}px)` : undefined,
    };

    if (theme.wallpaper === 'mesh') {
      const preset = MESH_PRESETS.find(m => m.name === theme.wallpaperUrl);
      if (!preset) return null;
      return <div style={{ ...baseStyle, background: preset.css }} />;
    }

    if (theme.wallpaper === 'solid') {
      return <div style={{ ...baseStyle, background: theme.wallpaperUrl, opacity: 1 }} />;
    }

    if (theme.wallpaper === 'gradient') {
      const preset = GRADIENT_PRESETS.find(g => g.name === theme.wallpaperUrl);
      if (!preset) return null;
      return <div style={{ ...baseStyle, background: preset.css, opacity: 1 }} />;
    }

    if (theme.wallpaper === 'pattern') {
      const preset = PATTERN_PRESETS.find(p => p.name === theme.wallpaperUrl);
      if (!preset) return null;
      const patternCss = preset.getCss(isDark);
      return <div style={{ ...baseStyle, ...patternCss } as any} />;
    }

    if (theme.wallpaper === 'image') {
      return (
        <div style={{
          ...baseStyle,
          backgroundImage: `url(${theme.wallpaperUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }} />
      );
    }

    if (theme.wallpaper === 'animated') {
      const preset = ANIMATED_PRESETS.find(a => a.name === theme.wallpaperUrl);
      if (!preset) return null;
      return (
        <>
          <style>{preset.keyframes}</style>
          <div
            style={{ opacity: theme.wallpaperOpacity }}
            dangerouslySetInnerHTML={{ __html: preset.getHtml() }}
          />
        </>
      );
    }

    // Legacy: preset key (backward compat with old WALLPAPER_PRESETS)
    const legacyMesh = MESH_PRESETS.find((_, i) => `mesh-${i}` === theme.wallpaperUrl);
    if (legacyMesh) {
      return <div style={{ ...baseStyle, background: legacyMesh.css }} />;
    }

    return null;
  }, [theme, isDark]);

  return (
    <div style={style as any} className="contents" {...dataAttrs}>
      {wallpaperNode}
      {children}
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { useEndocenter } from '@/store/endocenterStore';
import { useTheme } from '@/hooks/useTheme';
import { DEFAULT_THEME, themeToCSS, FONT_PRESETS, WALLPAPER_PRESETS, ALL_RADIUS_TARGETS, type CompanyTheme, type RadiusTarget } from '@/lib/companyTheme';

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
    return base;
  }, [cssVars]);

  // Build data attributes for radius targets
  const targets = theme.radiusTargets || ALL_RADIUS_TARGETS;
  const dataAttrs = useMemo(() => {
    const attrs: Record<string, string> = {};
    for (const t of (ALL_RADIUS_TARGETS as RadiusTarget[])) {
      attrs[`data-radius-${t}`] = targets.includes(t) ? 'true' : 'false';
    }
    return attrs;
  }, [targets]);

  const wallpaperStyle = useMemo(() => {
    if (theme.wallpaper === 'none' || !theme.wallpaperUrl) return null;

    if (theme.wallpaper === 'custom' && theme.wallpaperUrl) {
      return {
        backgroundImage: `url(${theme.wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' as const,
        opacity: theme.wallpaperOpacity,
        filter: theme.wallpaperBlur > 0 ? `blur(${theme.wallpaperBlur}px)` : undefined,
      };
    }

    // Preset wallpapers
    const preset = WALLPAPER_PRESETS.find(w => w.key === theme.wallpaperUrl);
    if (preset?.css) {
      return { background: preset.css, opacity: theme.wallpaperOpacity };
    }
    if (preset?.pattern === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        opacity: theme.wallpaperOpacity,
      };
    }
    if (preset?.pattern === 'lines') {
      return {
        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: theme.wallpaperOpacity,
      };
    }
    if (preset?.pattern === 'noise') {
      return {
        backgroundImage: `radial-gradient(at 20% 80%, #fff 1px, transparent 0px)`,
        backgroundSize: '3px 3px',
        opacity: theme.wallpaperOpacity,
        mixBlendMode: 'plus-lighter' as any,
      };
    }

    // CSS gradient stored directly
    if (theme.wallpaperUrl.startsWith('radial-gradient') || theme.wallpaperUrl.startsWith('linear-gradient')) {
      return { background: theme.wallpaperUrl, opacity: theme.wallpaperOpacity };
    }

    return null;
  }, [theme, isDark]);

  return (
    <div style={style as any} className="contents" {...dataAttrs}>
      {wallpaperStyle && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 0, ...wallpaperStyle } as any}
        />
      )}
      {children}
    </div>
  );
}

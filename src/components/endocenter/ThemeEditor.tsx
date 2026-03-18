import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Palette, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEndocenter } from '@/store/endocenterStore';
import { useTheme } from '@/hooks/useTheme';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DEFAULT_THEME, ACCENT_PRESETS, FONT_PRESETS, WALLPAPER_PRESETS, RADIUS_PRESETS,
  RADIUS_TARGETS, ALL_RADIUS_TARGETS, themeToCSS,
  type CompanyTheme, type RadiusTarget,
} from '@/lib/companyTheme';

interface Props {
  companyId?: string;
}

export default function ThemeEditor({ companyId }: Props) {
  const { company, setCompany } = useEndocenter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const colorInputRef = useRef<HTMLInputElement>(null);

  const initial: CompanyTheme = useMemo(() => {
    const raw = (company as any).theme;
    return raw && typeof raw === 'object' ? { ...DEFAULT_THEME, ...raw } : DEFAULT_THEME;
  }, [company]);

  const [theme, setTheme] = useState<CompanyTheme>(initial);
  const [saving, setSaving] = useState(false);

  // Sync when company changes
  useEffect(() => {
    const raw = (company as any).theme;
    if (raw && typeof raw === 'object') {
      setTheme({ ...DEFAULT_THEME, ...raw });
    }
  }, [company]);

  const update = (partial: Partial<CompanyTheme>) => {
    setTheme(prev => ({ ...prev, ...partial }));
  };

  const previewVars = useMemo(() => themeToCSS(theme, isDark), [theme, isDark]);

  // Load font for preview
  useEffect(() => {
    if (theme.fontFamily === 'Inter') return;
    const fc = FONT_PRESETS.find(f => f.name === theme.fontFamily);
    if (!fc?.url) return;
    const id = 'theme-editor-font';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = fc.url;
  }, [theme.fontFamily]);

  const saveTheme = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await supabase.from('companies').update({ theme: theme as any }).eq('id', companyId);
      setCompany({ ...company, theme } as any);
      toast.success('Tema salvo!');
    } catch {
      toast.error('Erro ao salvar tema');
    }
    setSaving(false);
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  const radiusVal = RADIUS_PRESETS.find(r => r.value === theme.borderRadius)?.cssVar || '12px';

  return (
    <div className="space-y-5">
      {/* Live Preview */}
      <div
        className="ios-card p-4 relative overflow-hidden"
        style={{
          '--primary': previewVars['--theme-accent'],
          fontFamily: previewVars['--theme-font'],
        } as any}
      >
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Preview ao vivo</h3>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl"
            style={{
              background: theme.accentColor,
              borderRadius: radiusVal,
            }}
          >
            Aa
          </div>
          <div className="flex-1 space-y-2">
            <div
              className="h-3 rounded-full"
              style={{ background: `${theme.accentColor}30`, width: '80%' }}
            />
            <div
              className="h-3 rounded-full"
              style={{ background: `${theme.accentColor}20`, width: '60%' }}
            />
            <button
              className="px-3 py-1 text-xs font-semibold text-white"
              style={{
                background: theme.accentColor,
                borderRadius: radiusVal,
              }}
            >
              Botão exemplo
            </button>
          </div>
        </div>
        {/* Wallpaper preview overlay */}
        {theme.wallpaper !== 'none' && theme.wallpaperUrl && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: WALLPAPER_PRESETS.find(w => w.key === theme.wallpaperUrl)?.css || undefined,
              opacity: theme.wallpaperOpacity,
              borderRadius: 'inherit',
            }}
          />
        )}
      </div>

      {/* Accent Color */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Cor principal</h4>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map(preset => (
            <button
              key={preset.color}
              onClick={() => update({ accentColor: preset.color, accentName: preset.name })}
              className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                background: preset.color,
                transform: theme.accentColor === preset.color ? 'scale(1.2)' : undefined,
                boxShadow: theme.accentColor === preset.color
                  ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${preset.color}`
                  : undefined,
              }}
              title={preset.name}
            >
              {theme.accentColor === preset.color && (
                <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
          {/* Custom color */}
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/60 transition-colors"
            title="Cor personalizada"
          >
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={theme.accentColor}
            onChange={e => update({ accentColor: e.target.value, accentName: 'Custom' })}
            className="sr-only"
          />
        </div>
      </div>

      {/* Font Family */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Fonte</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONT_PRESETS.map(font => {
            const isActive = theme.fontFamily === font.name;
            return (
              <button
                key={font.name}
                onClick={() => update({ fontFamily: font.name })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 hover:border-border'
                }`}
                style={{ fontFamily: `${font.value}, sans-serif` }}
              >
                <span className="text-sm font-semibold text-foreground block">{font.name}</span>
                <span className="text-[10px] text-muted-foreground">{font.style}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Border Radius */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Bordas</h4>
        <div className="flex gap-2 mb-4">
          {RADIUS_PRESETS.map(preset => {
            const isActive = theme.borderRadius === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => update({ borderRadius: preset.value })}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 hover:border-border'
                }`}
              >
                <div
                  className="w-8 h-8 mx-auto mb-1 border-2 border-foreground/30"
                  style={{ borderRadius: preset.cssVar }}
                />
                <span className="text-xs font-medium text-foreground">{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Granular radius targets */}
        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Aplicar bordas em:</span>
            <button
              onClick={() => {
                const allSelected = (theme.radiusTargets || ALL_RADIUS_TARGETS).length === ALL_RADIUS_TARGETS.length;
                update({ radiusTargets: allSelected ? [] : [...ALL_RADIUS_TARGETS] });
              }}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              {(theme.radiusTargets || ALL_RADIUS_TARGETS).length === ALL_RADIUS_TARGETS.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {RADIUS_TARGETS.map(({ key, label }) => {
              const targets = theme.radiusTargets || ALL_RADIUS_TARGETS;
              const checked = targets.includes(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(val) => {
                      const current = theme.radiusTargets || [...ALL_RADIUS_TARGETS];
                      const next = val
                        ? [...current, key]
                        : current.filter(t => t !== key);
                      update({ radiusTargets: next as RadiusTarget[] });
                    }}
                  />
                  <span className="text-xs text-foreground">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wallpaper */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Papel de parede</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {WALLPAPER_PRESETS.map(wp => {
            const isActive = (theme.wallpaper === 'none' && wp.key === 'none') ||
              (theme.wallpaper !== 'none' && theme.wallpaperUrl === wp.key);
            return (
              <button
                key={wp.key}
                onClick={() => {
                  if (wp.key === 'none') {
                    update({ wallpaper: 'none', wallpaperUrl: '' });
                  } else {
                    update({ wallpaper: 'preset', wallpaperUrl: wp.key });
                  }
                }}
                className={`shrink-0 w-20 h-14 rounded-xl border-2 overflow-hidden transition-all relative ${
                  isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border/40 hover:border-border'
                }`}
              >
                {wp.css ? (
                  <div className="absolute inset-0" style={{ background: wp.css }} />
                ) : wp.pattern === 'dots' ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
                      backgroundSize: '8px 8px',
                    }}
                  />
                ) : wp.pattern === 'lines' ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`,
                      backgroundSize: '12px 12px',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/30" />
                )}
                <span className="absolute bottom-0.5 left-0 right-0 text-[8px] font-medium text-foreground/70 text-center truncate px-0.5">
                  {wp.name}
                </span>
                {isActive && (
                  <Check className="h-3 w-3 text-primary absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Intensity Sliders */}
      {theme.wallpaper !== 'none' && (
        <div className="ios-card p-4 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground">Intensidade</h4>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">Opacidade do papel</span>
              <span className="text-[11px] font-medium text-foreground">{Math.round(theme.wallpaperOpacity * 100)}%</span>
            </div>
            <input
              type="range" min="0" max="0.3" step="0.01"
              value={theme.wallpaperOpacity}
              onChange={e => update({ wallpaperOpacity: parseFloat(e.target.value) })}
              className="w-full accent-primary h-1.5"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">Desfoque</span>
              <span className="text-[11px] font-medium text-foreground">{theme.wallpaperBlur}px</span>
            </div>
            <input
              type="range" min="0" max="20" step="1"
              value={theme.wallpaperBlur}
              onChange={e => update({ wallpaperBlur: parseInt(e.target.value) })}
              className="w-full accent-primary h-1.5"
            />
          </div>
        </div>
      )}

      {/* Surface Opacity */}
      <div className="ios-card p-4">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">Transparência dos cards</span>
          <span className="text-[11px] font-medium text-foreground">{Math.round((isDark ? theme.darkSurfaceOpacity : theme.surfaceOpacity) * 100)}%</span>
        </div>
        <input
          type="range" min="0.5" max="1" step="0.01"
          value={isDark ? theme.darkSurfaceOpacity : theme.surfaceOpacity}
          onChange={e => {
            const val = parseFloat(e.target.value);
            update(isDark ? { darkSurfaceOpacity: val } : { surfaceOpacity: val });
          }}
          className="w-full accent-primary h-1.5"
        />
        <p className="text-[10px] text-muted-foreground mt-1">100% = sólido, 50% = mais glass</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={resetTheme}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar padrão
        </button>
        <button
          onClick={saveTheme}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Salvando...' : 'Salvar tema'}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        O tema é exclusivo desta empresa e mantém o estilo glass da interface.
      </p>
    </div>
  );
}

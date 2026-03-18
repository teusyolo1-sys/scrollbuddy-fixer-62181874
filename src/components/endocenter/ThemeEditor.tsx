import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, Ban, Grid3x3, Circle, Blend, Fingerprint, Image, Sparkles, Palette, RotateCcw, Save, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEndocenter } from '@/store/endocenterStore';
import { useTheme } from '@/hooks/useTheme';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DEFAULT_THEME, ACCENT_PRESETS, FONT_PRESETS, RADIUS_PRESETS,
  RADIUS_TARGETS, ALL_RADIUS_TARGETS, themeToCSS,
  MESH_PRESETS, SOLID_PRESETS, GRADIENT_PRESETS, PATTERN_PRESETS, ANIMATED_PRESETS,
  type CompanyTheme, type RadiusTarget, type WallpaperCategory,
} from '@/lib/companyTheme';

interface Props { companyId?: string; }

const BG_TABS: { key: WallpaperCategory; label: string; icon: React.ElementType }[] = [
  { key: 'none', label: 'Nenhum', icon: Ban },
  { key: 'mesh', label: 'Mesh', icon: Grid3x3 },
  { key: 'solid', label: 'Sólido', icon: Circle },
  { key: 'gradient', label: 'Degradê', icon: Blend },
  { key: 'pattern', label: 'Padrão', icon: Fingerprint },
  { key: 'image', label: 'Imagem', icon: Image },
  { key: 'animated', label: 'Animado', icon: Sparkles },
];

export default function ThemeEditor({ companyId }: Props) {
  const { company, setCompany } = useEndocenter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial: CompanyTheme = useMemo(() => {
    const raw = (company as any).theme;
    return raw && typeof raw === 'object' ? { ...DEFAULT_THEME, ...raw } : DEFAULT_THEME;
  }, [company]);

  const [theme, setTheme] = useState<CompanyTheme>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bgTab, setBgTab] = useState<WallpaperCategory>(theme.wallpaper || 'none');

  useEffect(() => {
    const raw = (company as any).theme;
    if (raw && typeof raw === 'object') {
      const t = { ...DEFAULT_THEME, ...raw };
      setTheme(t);
      setBgTab(t.wallpaper || 'none');
    }
  }, [company]);

  const update = (partial: Partial<CompanyTheme>) => setTheme(prev => ({ ...prev, ...partial }));
  const previewVars = useMemo(() => themeToCSS(theme, isDark), [theme, isDark]);

  useEffect(() => {
    if (theme.fontFamily === 'Inter') return;
    const fc = FONT_PRESETS.find(f => f.name === theme.fontFamily);
    if (!fc?.url) return;
    const id = 'theme-editor-font';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
    link.href = fc.url;
  }, [theme.fontFamily]);

  const saveTheme = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await supabase.from('companies').update({ theme: theme as any }).eq('id', companyId);
      setCompany({ ...company, theme } as any);
      toast.success('Tema salvo!');
    } catch { toast.error('Erro ao salvar tema'); }
    setSaving(false);
  };

  const resetTheme = () => { setTheme(DEFAULT_THEME); setBgTab('none'); };
  const radiusVal = RADIUS_PRESETS.find(r => r.value === theme.borderRadius)?.cssVar || '12px';

  const handleImageUpload = async (file: File) => {
    if (!companyId) return;
    setUploading(true);
    try {
      const fileName = `${companyId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('company-wallpapers').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('company-wallpapers').getPublicUrl(fileName);
      update({ wallpaper: 'image', wallpaperUrl: urlData.publicUrl });
      toast.success('Imagem carregada!');
    } catch (e: any) {
      toast.error('Erro no upload: ' + (e.message || ''));
    }
    setUploading(false);
  };

  const selectBg = (category: WallpaperCategory, url: string) => {
    update({ wallpaper: category, wallpaperUrl: url });
  };

  // ── Thumbnail helper ──
  const Thumb = ({ active, onClick, style, label, children }: {
    active: boolean; onClick: () => void; style?: React.CSSProperties; label: string; children?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`shrink-0 w-20 h-14 rounded-xl border-2 overflow-hidden transition-all relative ${
        active ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border hover:border-foreground/30'
      }`}
      title={label}
    >
      {children || <div className="absolute inset-0" style={style} />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/95 via-background/75 to-transparent" />
      <span className="absolute bottom-1 left-1 right-1 text-[8px] font-medium text-foreground text-center truncate">
        {label}
      </span>
      {active && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background/85 ring-1 ring-border/60">
          <Check className="h-2.5 w-2.5 text-primary" />
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Live Preview */}
      <div className="ios-card p-4 relative overflow-hidden" style={{ '--primary': previewVars['--theme-accent'], fontFamily: previewVars['--theme-font'] } as any}>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Preview ao vivo</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl" style={{ background: theme.accentColor, borderRadius: radiusVal }}>Aa</div>
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full" style={{ background: `${theme.accentColor}30`, width: '80%' }} />
            <div className="h-3 rounded-full" style={{ background: `${theme.accentColor}20`, width: '60%' }} />
            <button className="px-3 py-1 text-xs font-semibold text-white" style={{ background: theme.accentColor, borderRadius: radiusVal }}>Botão exemplo</button>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Cor principal</h4>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map(preset => (
            <button key={preset.color} onClick={() => update({ accentColor: preset.color, accentName: preset.name })}
              className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                background: preset.color,
                transform: theme.accentColor === preset.color ? 'scale(1.2)' : undefined,
                boxShadow: theme.accentColor === preset.color ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${preset.color}` : undefined,
              }} title={preset.name}>
              {theme.accentColor === preset.color && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />}
            </button>
          ))}
          <button onClick={() => colorInputRef.current?.click()} className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/60 transition-colors" title="Cor personalizada">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <input ref={colorInputRef} type="color" value={theme.accentColor} onChange={e => update({ accentColor: e.target.value, accentName: 'Custom' })} className="sr-only" />
        </div>
      </div>

      {/* Font Family */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Fonte</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONT_PRESETS.map(font => (
            <button key={font.name} onClick={() => update({ fontFamily: font.name })}
              className={`p-3 rounded-xl border text-left transition-all ${theme.fontFamily === font.name ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-border'}`}
              style={{ fontFamily: `${font.value}, sans-serif` }}>
              <span className="text-sm font-semibold text-foreground block">{font.name}</span>
              <span className="text-[10px] text-muted-foreground">{font.style}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Bordas</h4>
        <div className="flex gap-2 mb-4">
          {RADIUS_PRESETS.map(preset => (
            <button key={preset.value} onClick={() => update({ borderRadius: preset.value })}
              className={`flex-1 p-3 rounded-xl border text-center transition-all ${theme.borderRadius === preset.value ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-border'}`}>
              <div className="w-8 h-8 mx-auto mb-1 border-2 border-foreground/30" style={{ borderRadius: preset.cssVar }} />
              <span className="text-xs font-medium text-foreground">{preset.name}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground">Aplicar bordas em:</span>
            <button onClick={() => {
              const allSelected = (theme.radiusTargets || ALL_RADIUS_TARGETS).length === ALL_RADIUS_TARGETS.length;
              update({ radiusTargets: allSelected ? [] : [...ALL_RADIUS_TARGETS] });
            }} className="text-[10px] font-medium text-primary hover:underline">
              {(theme.radiusTargets || ALL_RADIUS_TARGETS).length === ALL_RADIUS_TARGETS.length ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {RADIUS_TARGETS.map(({ key, label }) => {
              const targets = theme.radiusTargets || ALL_RADIUS_TARGETS;
              const checked = targets.includes(key);
              return (
                <label key={key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors">
                  <Checkbox checked={checked} onCheckedChange={(val) => {
                    const current = theme.radiusTargets || [...ALL_RADIUS_TARGETS];
                    const next = val ? [...current, key] : current.filter(t => t !== key);
                    update({ radiusTargets: next as RadiusTarget[] });
                  }} />
                  <span className="text-xs text-foreground">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Wallpaper ── */}
      <div className="ios-card p-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3">Papel de parede</h4>

        {/* Segmented control */}
        <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-xl bg-secondary/40">
          {BG_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => {
                setBgTab(tab.key);
                if (tab.key === 'none') selectBg('none', '');
              }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  bgTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
        </div>

        {/* Mesh */}
        {bgTab === 'mesh' && (
          <div className="grid grid-cols-4 gap-2">
            {MESH_PRESETS.map(m => (
              <Thumb key={m.name} active={theme.wallpaper === 'mesh' && theme.wallpaperUrl === m.name}
                onClick={() => selectBg('mesh', m.name)} label={m.name} style={{ background: m.css }} />
            ))}
          </div>
        )}

        {/* Solid */}
        {bgTab === 'solid' && (
          <div className="grid grid-cols-4 gap-2">
            {SOLID_PRESETS.map(s => (
              <Thumb key={s.name} active={theme.wallpaper === 'solid' && theme.wallpaperUrl === s.css}
                onClick={() => selectBg('solid', s.css)} label={s.name} style={{ background: s.css }} />
            ))}
          </div>
        )}

        {/* Gradient */}
        {bgTab === 'gradient' && (
          <div className="grid grid-cols-4 gap-2">
            {GRADIENT_PRESETS.map(g => (
              <Thumb key={g.name} active={theme.wallpaper === 'gradient' && theme.wallpaperUrl === g.name}
                onClick={() => selectBg('gradient', g.name)} label={g.name} style={{ background: g.css }} />
            ))}
          </div>
        )}

        {/* Pattern */}
        {bgTab === 'pattern' && (
          <div className="grid grid-cols-4 gap-2">
            {PATTERN_PRESETS.map(p => (
              <Thumb key={p.name} active={theme.wallpaper === 'pattern' && theme.wallpaperUrl === p.name}
                onClick={() => selectBg('pattern', p.name)} label={p.name} style={{ ...p.getCss(isDark), backgroundColor: isDark ? '#1a1a2e' : '#f0f0f0' } as any} />
            ))}
          </div>
        )}

        {/* Image */}
        {bgTab === 'image' && (
          <div className="space-y-3">
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/60 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {uploading ? 'Carregando...' : 'Escolher imagem'}
            </button>
            {theme.wallpaper === 'image' && theme.wallpaperUrl && (
              <div className="relative rounded-xl overflow-hidden h-24">
                <img src={theme.wallpaperUrl} alt="Wallpaper" className="w-full h-full object-cover" />
                <button onClick={() => selectBg('none', '')}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Animated */}
        {bgTab === 'animated' && (
          <div className="grid grid-cols-2 gap-2">
            {ANIMATED_PRESETS.map(a => (
              <button key={a.name} onClick={() => selectBg('animated', a.name)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  theme.wallpaper === 'animated' && theme.wallpaperUrl === a.name
                    ? 'border-primary ring-2 ring-primary/30' : 'border-border/40 hover:border-border'
                }`}>
                <span className="text-xs font-semibold text-foreground block">{a.name}</span>
                <span className="text-[10px] text-muted-foreground">{a.description}</span>
              </button>
            ))}
          </div>
        )}

        {bgTab === 'none' && (
          <p className="text-xs text-muted-foreground text-center py-4">Sem papel de parede</p>
        )}
      </div>

      {/* Intensity Sliders */}
      {theme.wallpaper !== 'none' && (
        <div className="ios-card p-4 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground">Intensidade</h4>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">Opacidade do fundo</span>
              <span className="text-[11px] font-medium text-foreground">{Math.round(theme.wallpaperOpacity * 100)}%</span>
            </div>
            <input type="range" min="0" max="0.5" step="0.01" value={theme.wallpaperOpacity}
              onChange={e => update({ wallpaperOpacity: parseFloat(e.target.value) })} className="w-full accent-primary h-1.5" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">Desfoque</span>
              <span className="text-[11px] font-medium text-foreground">{theme.wallpaperBlur}px</span>
            </div>
            <input type="range" min="0" max="30" step="1" value={theme.wallpaperBlur}
              onChange={e => update({ wallpaperBlur: parseInt(e.target.value) })} className="w-full accent-primary h-1.5" />
          </div>
        </div>
      )}

      {/* Surface Opacity */}
      <div className="ios-card p-4">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">Transparência dos cards</span>
          <span className="text-[11px] font-medium text-foreground">{Math.round((isDark ? theme.darkSurfaceOpacity : theme.surfaceOpacity) * 100)}%</span>
        </div>
        <input type="range" min="0.5" max="1" step="0.01" value={isDark ? theme.darkSurfaceOpacity : theme.surfaceOpacity}
          onChange={e => { const val = parseFloat(e.target.value); update(isDark ? { darkSurfaceOpacity: val } : { surfaceOpacity: val }); }}
          className="w-full accent-primary h-1.5" />
        <p className="text-[10px] text-muted-foreground mt-1">100% = sólido, 50% = mais glass</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={resetTheme} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
        </button>
        <button onClick={saveTheme} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {saving ? 'Salvando...' : 'Salvar tema'}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground px-1">O tema é exclusivo desta empresa e mantém o estilo glass da interface.</p>
    </div>
  );
}

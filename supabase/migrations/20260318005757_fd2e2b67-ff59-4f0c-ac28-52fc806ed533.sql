ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT jsonb_build_object(
  'accentColor', '#3b82f6',
  'accentName', 'Azul',
  'fontFamily', 'Inter',
  'borderRadius', 'rounded',
  'wallpaper', 'none',
  'wallpaperUrl', '',
  'wallpaperOpacity', 0.08,
  'wallpaperBlur', 0,
  'surfaceOpacity', 0.85,
  'darkSurfaceOpacity', 0.75
);

UPDATE public.companies
SET theme = jsonb_build_object(
  'accentColor', '#3b82f6',
  'accentName', 'Azul',
  'fontFamily', 'Inter',
  'borderRadius', 'rounded',
  'wallpaper', 'none',
  'wallpaperUrl', '',
  'wallpaperOpacity', 0.08,
  'wallpaperBlur', 0,
  'surfaceOpacity', 0.85,
  'darkSurfaceOpacity', 0.75
)
WHERE theme IS NULL;
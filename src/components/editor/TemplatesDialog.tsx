import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LayoutGrid, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string | null;
  html_content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

// Built-in templates (no DB needed initially)
const builtInTemplates: Template[] = [
  {
    id: 'hero-1',
    name: 'Hero com CTA',
    category: 'hero',
    description: 'Seção hero com título, subtítulo e botão',
    html_content: `<section style="padding:80px 20px;text-align:center;background:linear-gradient(135deg,#1a1a2e,#16213e);">
  <h1 style="font-size:3rem;font-weight:800;color:#fff;margin-bottom:16px;">Título Principal</h1>
  <p style="font-size:1.2rem;color:#ccc;margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto;">Subtítulo descritivo do seu produto ou serviço.</p>
  <a href="#" style="display:inline-block;padding:14px 32px;background:#00e676;color:#000;border-radius:8px;font-weight:700;text-decoration:none;">Começar Agora</a>
</section>`,
  },
  {
    id: 'features-1',
    name: 'Grade de Features',
    category: 'features',
    description: '3 colunas com ícones e descrições',
    html_content: `<section style="padding:60px 20px;background:#0d1117;">
  <h2 style="text-align:center;font-size:2rem;color:#fff;margin-bottom:40px;">Recursos</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;max-width:900px;margin:0 auto;">
    <div style="padding:24px;background:#161b22;border-radius:12px;border:1px solid #30363d;">
      <h3 style="color:#58a6ff;margin-bottom:8px;">⚡ Rápido</h3>
      <p style="color:#8b949e;font-size:0.9rem;">Desempenho otimizado para a melhor experiência.</p>
    </div>
    <div style="padding:24px;background:#161b22;border-radius:12px;border:1px solid #30363d;">
      <h3 style="color:#58a6ff;margin-bottom:8px;">🔒 Seguro</h3>
      <p style="color:#8b949e;font-size:0.9rem;">Proteção de dados de ponta a ponta.</p>
    </div>
    <div style="padding:24px;background:#161b22;border-radius:12px;border:1px solid #30363d;">
      <h3 style="color:#58a6ff;margin-bottom:8px;">🎨 Customizável</h3>
      <p style="color:#8b949e;font-size:0.9rem;">Personalize cada detalhe ao seu gosto.</p>
    </div>
  </div>
</section>`,
  },
  {
    id: 'cta-1',
    name: 'CTA Banner',
    category: 'cta',
    description: 'Banner de chamada para ação',
    html_content: `<section style="padding:60px 20px;background:linear-gradient(90deg,#00e676,#00b0ff);text-align:center;">
  <h2 style="font-size:2rem;font-weight:800;color:#000;margin-bottom:12px;">Pronto para começar?</h2>
  <p style="color:#000;opacity:0.7;margin-bottom:24px;">Junte-se a milhares de usuários satisfeitos.</p>
  <a href="#" style="display:inline-block;padding:14px 32px;background:#000;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">Criar Conta Grátis</a>
</section>`,
  },
  {
    id: 'footer-1',
    name: 'Footer Simples',
    category: 'footer',
    description: 'Rodapé com links e copyright',
    html_content: `<footer style="padding:40px 20px;background:#0d1117;border-top:1px solid #30363d;">
  <div style="max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;">
    <p style="color:#8b949e;font-size:0.85rem;">© 2025 Sua Empresa. Todos os direitos reservados.</p>
    <div style="display:flex;gap:16px;">
      <a href="#" style="color:#58a6ff;text-decoration:none;font-size:0.85rem;">Privacidade</a>
      <a href="#" style="color:#58a6ff;text-decoration:none;font-size:0.85rem;">Termos</a>
      <a href="#" style="color:#58a6ff;text-decoration:none;font-size:0.85rem;">Contato</a>
    </div>
  </div>
</footer>`,
  },
];

const categories = ['todos', 'hero', 'features', 'cta', 'footer'];

const TemplatesDialog = ({ open, onClose, onInsert }: Props) => {
  const [templates, setTemplates] = useState<Template[]>(builtInTemplates);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Also load from DB
    setLoading(true);
    supabase.from('section_templates').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        const dbTemplates = (data as Template[]);
        setTemplates([...builtInTemplates, ...dbTemplates]);
      }
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  const filtered = selectedCategory === 'todos'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Templates de Seções</h2>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[55vh] grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading && (
            <div className="col-span-2 flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {filtered.map(t => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/60 transition-colors cursor-pointer group"
              onClick={() => { onInsert(t.html_content); onClose(); }}
            >
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid size={14} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">{t.description}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                {t.category}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <button onClick={onClose} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesDialog;

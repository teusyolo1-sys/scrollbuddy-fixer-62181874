import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useApiKey } from '@/hooks/useApiKey';

interface ApiKeyModalProps {
  open: boolean;
  onValidated: () => void;
}

const ApiKeyModal = ({ open, onValidated }: ApiKeyModalProps) => {
  const { validateKey, autoApply, generateKey, isLoading, error } = useApiKey();
  const [keyInput, setKeyInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<'validate' | 'generate'>('validate');
  const [autoApplying, setAutoApplying] = useState(false);

  // Try auto-apply on mount
  const handleAutoApply = async () => {
    setAutoApplying(true);
    const ok = await autoApply();
    setAutoApplying(false);
    if (ok) {
      toast.success('🔑 Chave aplicada automaticamente!');
      onValidated();
    }
  };

  const handleValidate = async () => {
    const valid = await validateKey(keyInput);
    if (valid) {
      toast.success('🔑 Chave validada com sucesso!');
      onValidated();
    }
  };

  const handleGenerate = async () => {
    const key = await generateKey();
    if (key) {
      setGeneratedKey(key);
      toast.success('🎉 Chave gerada! Copie e guarde em local seguro.');
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      toast.success('📋 Chave copiada!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Validação de API Key
          </DialogTitle>
          <DialogDescription>
            Insira sua chave de acesso para usar o editor. Cada chave é vinculada ao seu email e permite apenas um dispositivo por vez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 bg-secondary/40 rounded-lg p-1 mb-4">
          <button
            onClick={() => setTab('validate')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              tab === 'validate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Validar Chave
          </button>
          <button
            onClick={() => setTab('generate')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              tab === 'generate' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gerar Nova Chave
          </button>
        </div>

        {tab === 'validate' && (
          <div className="space-y-4">
            <Button
              onClick={handleAutoApply}
              disabled={isLoading || autoApplying}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              {autoApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Detectar chave automaticamente
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou insira manualmente</span></div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <Input
                placeholder="xxxx-0x00-0x0x-xxxx"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="font-mono tracking-wider"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleValidate} disabled={isLoading || !keyInput.trim()} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Validar
            </Button>
          </div>
        )}

        {tab === 'generate' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere uma nova chave no formato <code className="bg-secondary px-1 py-0.5 rounded text-xs">zzzz-0f00-0f0f-zzzz</code>. 
              A chave será vinculada ao seu email.
            </p>
            {generatedKey && (
              <div className="flex items-center gap-2 p-3 bg-secondary/60 rounded-lg border border-border">
                <code className="flex-1 font-mono text-sm tracking-wider text-foreground">{generatedKey}</code>
                <Button variant="ghost" size="icon" onClick={copyKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button onClick={handleGenerate} disabled={isLoading} variant={generatedKey ? 'outline' : 'default'} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {generatedKey ? 'Gerar Outra' : 'Gerar Chave'}
            </Button>
            {generatedKey && (
              <Button onClick={() => { setKeyInput(generatedKey); setTab('validate'); }} className="w-full" variant="secondary">
                Usar esta chave
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;

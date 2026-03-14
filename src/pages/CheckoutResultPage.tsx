import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { useApiKey } from '@/hooks/useApiKey';
import { toast } from 'sonner';

const CheckoutResultPage = () => {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const { autoApply, isValidated } = useApiKey();
  const [applying, setApplying] = useState(false);

  // Auto-apply key on success
  useEffect(() => {
    if (status === 'success' && !isValidated) {
      setApplying(true);
      // Small delay to allow webhook to process
      const timer = setTimeout(async () => {
        const ok = await autoApply();
        setApplying(false);
        if (ok) {
          toast.success('🔑 Chave ativada automaticamente!');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, isValidated, autoApply]);

  const configs = {
    success: {
      icon: CheckCircle2,
      iconClass: 'text-emerald-400',
      title: 'Pagamento Aprovado! 🎉',
      description: applying
        ? 'Ativando sua chave automaticamente...'
        : isValidated
        ? 'Sua chave foi ativada! Você já pode usar o editor.'
        : 'Sua chave de API foi ativada automaticamente. Volte ao editor e comece a criar!',
      bgClass: 'bg-emerald-500/10 border-emerald-500/30',
    },
    failure: {
      icon: XCircle,
      iconClass: 'text-destructive',
      title: 'Pagamento Não Aprovado',
      description: 'Houve um problema com o pagamento. Tente novamente ou use outro método.',
      bgClass: 'bg-destructive/10 border-destructive/30',
    },
    pending: {
      icon: Clock,
      iconClass: 'text-amber-400',
      title: 'Pagamento Pendente',
      description: 'Estamos aguardando a confirmação. Sua chave será ativada automaticamente após a aprovação.',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
    },
  };

  const config = configs[status as keyof typeof configs] || configs.failure;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className={`max-w-md w-full rounded-2xl border p-8 text-center ${config.bgClass}`}>
        {applying ? (
          <Loader2 size={64} className="mx-auto mb-4 text-emerald-400 animate-spin" />
        ) : (
          <Icon size={64} className={`mx-auto mb-4 ${config.iconClass}`} />
        )}
        <h1 className="text-2xl font-bold mb-2">{config.title}</h1>
        <p className="text-muted-foreground mb-6">{config.description}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/')} size="lg">
            <ArrowLeft size={16} /> Voltar ao Editor
          </Button>
          {status !== 'success' && (
            <Button variant="outline" onClick={() => navigate('/checkout')}>
              Tentar Novamente
            </Button>
          )}
          {status === 'success' && !isValidated && !applying && (
            <Button variant="outline" onClick={async () => {
              setApplying(true);
              const ok = await autoApply();
              setApplying(false);
              if (ok) toast.success('🔑 Chave ativada!');
              else toast.error('Pagamento ainda não confirmado. Tente novamente em instantes.');
            }}>
              Tentar ativar novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutResultPage;

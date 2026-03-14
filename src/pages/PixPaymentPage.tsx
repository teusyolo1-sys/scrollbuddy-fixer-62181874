import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, Clock, Copy, Loader2, QrCode, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PixData {
  payment_id: number;
  key_id: string;
  api_key: string;
  plan: string;
  total_price: number;
  pix_qr_code: string;
  pix_qr_code_base64: string;
  pix_expiration: string;
}

const PixPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pixData = location.state as PixData | null;
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'approved' | 'expired'>('waiting');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Redirect if no data
  useEffect(() => {
    if (!pixData) {
      navigate('/checkout', { replace: true });
    }
  }, [pixData, navigate]);

  // Countdown
  useEffect(() => {
    if (!pixData?.pix_expiration) return;
    const expMs = new Date(pixData.pix_expiration).getTime();

    const tick = () => {
      const diff = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) setStatus('expired');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pixData?.pix_expiration]);

  // Poll payment status
  useEffect(() => {
    if (!pixData?.key_id || status !== 'waiting') return;

    const poll = async () => {
      const { data } = await supabase
        .from('api_keys')
        .select('payment_status')
        .eq('id', pixData.key_id)
        .single();

      if (data?.payment_status === 'approved') {
        setStatus('approved');
        toast.success('Pagamento confirmado!');
        setTimeout(() => navigate('/checkout/success', { replace: true }), 2000);
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [pixData?.key_id, status, navigate]);

  const handleCopy = useCallback(() => {
    if (!pixData?.pix_qr_code) return;
    navigator.clipboard.writeText(pixData.pix_qr_code);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 3000);
  }, [pixData?.pix_qr_code]);

  if (!pixData) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-200px] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[150px]" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border/20 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted" onClick={() => navigate('/checkout')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-base font-bold text-foreground">Pagamento via PIX</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Status card */}
          {status === 'approved' ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Check size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Pagamento Confirmado!</h2>
              <p className="mt-2 text-muted-foreground">Redirecionando...</p>
            </div>
          ) : status === 'expired' ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-10 text-center">
              <h2 className="text-xl font-bold text-foreground">PIX Expirado</h2>
              <p className="mt-2 text-sm text-muted-foreground">O tempo para pagamento acabou.</p>
              <Button className="mt-6" onClick={() => navigate('/checkout')}>
                <RefreshCw size={16} className="mr-2" /> Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-border/20 bg-muted/30 px-6 py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">Total a pagar</p>
                <p className="text-3xl font-black text-foreground">
                  R$ {pixData.total_price.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-6 px-6 py-8">
                <div className="rounded-2xl border border-border/30 bg-white p-4">
                  {pixData.pix_qr_code_base64 ? (
                    <img
                      src={`data:image/png;base64,${pixData.pix_qr_code_base64}`}
                      alt="QR Code PIX"
                      className="h-52 w-52"
                    />
                  ) : (
                    <div className="flex h-52 w-52 items-center justify-center">
                      <QrCode size={80} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Escaneie o QR Code ou copie o código abaixo
                </p>

                {/* Copy button */}
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full gap-2 rounded-xl border-border/40 bg-muted/30 hover:bg-muted/50"
                >
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>

                {/* Timer */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} className="text-primary" />
                  <span>
                    Expira em{' '}
                    <span className="font-mono font-bold text-foreground">
                      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                  </span>
                </div>

                {/* Waiting indicator */}
                <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-2 text-xs font-medium text-primary">
                  <Loader2 size={14} className="animate-spin" />
                  Aguardando pagamento...
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PixPaymentPage;

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Loader2, Copy, Check, ShieldOff, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTOTP } from "@/hooks/useTOTP";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "loading" | "already_configured" | "scan" | "done";

export default function TOTPSetupModal({ open, onClose }: Props) {
  const { isConfigured, setup, verifySetup, disable } = useTOTP();
  const [step, setStep] = useState<Step>("loading");
  const [otpData, setOtpData] = useState<{ secret: string; qr_data: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasStarted = useRef(false);

  useEffect(() => {
    if (open && !hasStarted.current) {
      hasStarted.current = true;
      if (isConfigured) {
        setStep("already_configured");
      } else {
        startSetup();
      }
    }
    if (!open) {
      hasStarted.current = false;
      setOtpData(null);
      setStep("loading");
      setCode("");
    }
  }, [open, isConfigured]);

  const startSetup = async () => {
    setStep("loading");
    setCode("");
    try {
      const data = await setup();
      setOtpData(data);
      setStep("scan");
    } catch {
      toast({ title: "Erro ao gerar QR Code", variant: "destructive" });
      onClose();
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    const valid = await verifySetup(code);
    setVerifying(false);
    if (valid) {
      setStep("done");
      toast({ title: "2FA ativado com sucesso!" });
      setTimeout(() => onClose(), 1500);
    } else {
      toast({ title: "Código inválido", description: "Tente novamente", variant: "destructive" });
      setCode("");
    }
  };

  const handleDisable = async () => {
    setVerifying(true);
    try {
      await disable();
      toast({ title: "2FA desativado" });
      onClose();
    } catch {
      toast({ title: "Erro ao desativar 2FA", variant: "destructive" });
    }
    setVerifying(false);
  };

  const handleReconfigure = async () => {
    await startSetup();
  };

  const copySecret = () => {
    if (otpData?.secret) {
      navigator.clipboard.writeText(otpData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {step === "already_configured" ? "2FA Ativo" : "Configurar 2FA"}
                  </h2>
                  <p className="text-xs text-muted-foreground">Google Authenticator ou Authy</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center gap-5">
              {step === "loading" && (
                <div className="py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {step === "already_configured" && (
                <div className="py-4 text-center w-full space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">2FA já está ativo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sua conta está protegida com autenticação de dois fatores.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleReconfigure}
                      disabled={verifying}
                      className="w-full py-3 rounded-2xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reconfigurar 2FA
                    </button>
                    <button
                      onClick={handleDisable}
                      disabled={verifying}
                      className="w-full py-3 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                    >
                      {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                      Desativar 2FA
                    </button>
                  </div>
                </div>
              )}

              {step === "scan" && otpData && (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Escaneie o QR Code no seu app de autenticação
                  </p>
                  <div className="p-4 rounded-2xl bg-white">
                    <QRCodeSVG value={otpData.qr_data} size={200} />
                  </div>

                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-1.5">Ou digite o código manualmente:</p>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border">
                      <code className="text-xs font-mono text-foreground flex-1 break-all select-all">
                        {otpData.secret}
                      </code>
                      <button onClick={copySecret} className="p-1.5 rounded-lg hover:bg-secondary transition-colors shrink-0">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-2">Digite o código de 6 dígitos:</p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={code} onChange={setCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={code.length !== 6 || verifying}
                    className="w-full py-3 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Verificar e ativar
                  </button>
                </>
              )}

              {step === "done" && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground">2FA ativado!</p>
                  <p className="text-sm text-muted-foreground mt-1">Sua conta está mais segura agora.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

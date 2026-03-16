import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useTOTP } from "@/hooks/useTOTP";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  companyName: string;
  companyId: string;
  onDeleted: () => void;
  onSetup2FA: () => void;
}

export default function DeleteCompanyModal({ open, onClose, companyName, companyId, onDeleted, onSetup2FA }: Props) {
  const { isConfigured, loading: totpLoading } = useTOTP();
  const [confirmName, setConfirmName] = useState("");
  const [code, setCode] = useState("");
  const [deleting, setDeleting] = useState(false);

  const nameMatches = confirmName.trim().toLowerCase() === companyName.trim().toLowerCase();
  const canDelete = nameMatches && code.length === 6 && !deleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);

    // Verify TOTP
    const { data } = await supabase.functions.invoke('totp-manage', { body: { action: 'verify', code } });
    if (!data?.valid) {
      toast({ title: "Código inválido", description: "O código 2FA está incorreto", variant: "destructive" });
      setCode("");
      setDeleting(false);
      return;
    }

    // Delete company (CASCADE will handle related tables)
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
      setDeleting(false);
      return;
    }

    // Cleanup localStorage
    localStorage.removeItem(`endocenter_${companyId}`);

    toast({ title: "Empresa deletada permanentemente" });
    setDeleting(false);
    setConfirmName("");
    setCode("");
    onDeleted();
    onClose();
  };

  const handleClose = () => {
    setConfirmName("");
    setCode("");
    onClose();
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
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-destructive/30 bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Deletar empresa</h2>
                  <p className="text-xs text-muted-foreground">Esta ação é irreversível</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {totpLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !isConfigured ? (
                /* 2FA not configured */
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-7 w-7 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">2FA necessário</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para deletar empresas, configure a autenticação de dois fatores primeiro.
                    </p>
                  </div>
                  <button
                    onClick={() => { handleClose(); onSetup2FA(); }}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
                  >
                    Configurar agora
                  </button>
                </div>
              ) : (
                /* 2FA configured - show delete flow */
                <>
                  <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">
                          Deletar "{companyName}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Todos os dados da empresa serão perdidos permanentemente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirm name */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">
                      Digite <strong className="text-foreground">{companyName}</strong> para confirmar:
                    </label>
                    <input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-destructive/50 transition-colors"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  {/* OTP */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">
                      Código do Google Authenticator:
                    </label>
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

                  {/* Delete button */}
                  <button
                    onClick={handleDelete}
                    disabled={!canDelete}
                    className="w-full py-3 rounded-2xl bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Deletar permanentemente
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

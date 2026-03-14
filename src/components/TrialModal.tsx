import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';

interface TrialModalProps {
  open: boolean;
  onStart: () => void;
}

const TrialModal = ({ open, onStart }: TrialModalProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md text-center border-primary/20" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Sparkles size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Teste Gratuito</h2>
          <p className="text-muted-foreground max-w-sm">
            Você tem <span className="font-bold text-primary">5 minutos</span> para explorar
            todas as funcionalidades do editor gratuitamente!
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>O cronômetro inicia ao clicar em OK</span>
          </div>
          <Button onClick={onStart} size="lg" className="mt-2 px-8">
            OK, Começar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialModal;

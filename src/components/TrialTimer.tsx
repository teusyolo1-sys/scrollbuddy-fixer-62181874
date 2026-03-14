import { Clock, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrialTimerProps {
  timeString: string;
  expired: boolean;
  remainingMs: number;
}

const TrialTimer = ({ timeString, expired, remainingMs }: TrialTimerProps) => {
  const navigate = useNavigate();
  const isLow = remainingMs < 60000;

  if (expired) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-xl shadow-lg animate-pulse cursor-pointer"
        onClick={() => navigate('/checkout')}
      >
        <Clock size={14} />
        <span className="text-xs font-bold">Tempo esgotado!</span>
        <ShoppingCart size={14} />
        <span className="text-xs font-bold">Adquirir licença</span>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-colors ${
      isLow
        ? 'bg-destructive/90 text-destructive-foreground animate-pulse'
        : 'bg-card border border-border text-foreground'
    }`}>
      <Clock size={14} className={isLow ? 'text-destructive-foreground' : 'text-primary'} />
      <span className={`text-sm font-mono font-bold ${isLow ? 'text-destructive-foreground' : 'text-foreground'}`}>{timeString}</span>
      <span className={`text-[10px] ${isLow ? 'text-destructive-foreground/90' : 'text-muted-foreground'}`}>teste</span>
    </div>
  );
};

export default TrialTimer;

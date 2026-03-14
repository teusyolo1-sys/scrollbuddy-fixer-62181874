import { useState, useEffect } from 'react';
import { Clock, ShoppingCart, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LicenseCountdownProps {
  expiresAt: string | null;
  plan: string | null;
}

const formatTime = (ms: number) => {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const LicenseCountdown = ({ expiresAt, plan }: LicenseCountdownProps) => {
  const navigate = useNavigate();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, diff));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // No expiration (lifetime plan) or no data
  if (!expiresAt || remainingMs === null) return null;

  const oneHourMs = 60 * 60 * 1000;
  const isExpired = remainingMs <= 0;
  const isUnderOneHour = remainingMs <= oneHourMs;

  // Only show floating countdown when ≤ 1 hour remaining
  if (!isUnderOneHour && !isExpired) return null;

  if (isExpired) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-destructive-foreground shadow-[0_4px_20px_hsl(350_80%_55%/0.4)] cursor-pointer animate-pulse"
        onClick={() => navigate('/checkout')}
      >
        <Clock size={14} />
        <span className="text-xs font-bold">Licença expirada!</span>
        <ShoppingCart size={14} />
        <span className="text-xs font-bold">Renovar</span>
      </div>
    );
  }

  // Under 1 hour — show countdown
  const isLow = remainingMs < 5 * 60 * 1000; // < 5 min

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-2.5 rounded-xl px-4 py-2.5 shadow-lg transition-all ${
        isLow
          ? 'bg-destructive/90 text-destructive-foreground animate-pulse shadow-[0_4px_20px_hsl(350_80%_55%/0.3)]'
          : 'bg-card border border-primary/30 text-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.15)]'
      }`}
    >
      <Timer size={14} className={isLow ? 'text-destructive-foreground' : 'text-primary'} />
      <span className={`text-sm font-mono font-bold tabular-nums ${isLow ? 'text-destructive-foreground' : 'text-foreground'}`}>
        {formatTime(remainingMs)}
      </span>
      <span className={`text-[10px] ${isLow ? 'text-destructive-foreground/80' : 'text-muted-foreground'}`}>
        restante
      </span>
    </div>
  );
};

export default LicenseCountdown;

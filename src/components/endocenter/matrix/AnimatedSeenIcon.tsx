import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedSeenIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export default function AnimatedSeenIcon({ size = 22, className = "", active = false }: AnimatedSeenIconProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(true);
    const timeout = setTimeout(() => setPlaying(false), 1400);
    const interval = setInterval(() => {
      setPlaying(true);
      setTimeout(() => setPlaying(false), 1400);
    }, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const strokeCol = active ? "hsl(var(--primary-foreground))" : "currentColor";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={playing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Empty speech bubble — seen/read state */}
      <motion.path
        d="M12 2C6.477 2 2 5.92 2 10.667c0 2.627 1.3 4.98 3.333 6.573V22l4.453-2.48A11.07 11.07 0 0 0 12 19.333C17.523 19.333 22 15.413 22 10.667 22 5.92 17.523 2 12 2Z"
        stroke={strokeCol}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </motion.svg>
  );
}

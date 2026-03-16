import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedChatIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export default function AnimatedChatIcon({ size = 22, className = "", active = false }: AnimatedChatIconProps) {
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

  // iOS SF Symbols-style chat bubble — thin stroke, no fill, clean geometry
  const strokeColor = active ? "hsl(var(--primary-foreground))" : "currentColor";
  const dotColor = active ? "hsl(var(--primary-foreground))" : "currentColor";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={playing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Clean iOS-style chat bubble outline */}
      <motion.path
        d="M7.5 21L3 21C2.44772 21 2 20.5523 2 20L2 6C2 4.34315 3.34315 3 5 3L19 3C20.6569 3 22 4.34315 22 6L22 14C22 15.6569 20.6569 17 19 17L11.5 17L7.5 21Z"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Three minimal dots — sequential fade-bounce */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={8.5 + i * 3.5}
          cy={10.5}
          r={1.15}
          fill={dotColor}
          animate={
            playing
              ? {
                  y: [0, -2.5, 0],
                  opacity: [0.35, 1, 0.35],
                }
              : { y: 0, opacity: 0.5 }
          }
          transition={
            playing
              ? {
                  delay: i * 0.12,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </motion.svg>
  );
}

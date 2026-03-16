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

  const strokeCol = active ? "hsl(var(--primary-foreground))" : "currentColor";
  const dotCol = active ? "hsl(var(--primary-foreground))" : "currentColor";

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      animate={playing ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <path
        d="M5.5 7.5C5.5 5.567 7.067 4 9 4h6c3.038 0 5.5 2.239 5.5 5s-2.462 5-5.5 5h-2.8L8 17.5V14.3C6.495 13.55 5.5 12.161 5.5 10.5V7.5Z"
        stroke={strokeCol}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Three dots — animate opacity only to avoid SVG transform bugs */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={8 + i * 4}
          cy={10.667}
          r={1.35}
          fill={dotCol}
          animate={
            playing
              ? { opacity: [0.3, 1, 0.3] }
              : { opacity: 0.6 }
          }
          transition={
            playing
              ? { delay: i * 0.15, duration: 0.5, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />
      ))}
    </motion.svg>
  );
}

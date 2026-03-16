import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedAskIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export default function AnimatedAskIcon({ size = 22, className = "", active = false }: AnimatedAskIconProps) {
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
      animate={playing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
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
      {/* Question mark — animated bounce */}
      <motion.text
        x="12"
        y="13"
        textAnchor="middle"
        dominantBaseline="central"
        fill={strokeCol}
        fontSize="11"
        fontWeight="700"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
        animate={
          playing
            ? { y: [13, 10.5, 13], opacity: [0.5, 1, 0.5] }
            : { y: 13, opacity: 0.7 }
        }
        transition={
          playing
            ? { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
            : { duration: 0.3 }
        }
      >
        ?
      </motion.text>
    </motion.svg>
  );
}

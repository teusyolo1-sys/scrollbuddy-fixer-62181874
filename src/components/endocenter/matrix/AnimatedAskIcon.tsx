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
    const timeout = setTimeout(() => setPlaying(false), 1200);
    const interval = setInterval(() => {
      setPlaying(true);
      setTimeout(() => setPlaying(false), 1200);
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
      animate={playing ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <path
        d="M12 3.75c-4.28 0-7.75 2.91-7.75 6.5 0 1.86.94 3.53 2.45 4.72v3.28a.5.5 0 0 0 .82.38l3.26-2.72c.4.06.8.09 1.22.09 4.28 0 7.75-2.91 7.75-6.5s-3.47-6.5-7.75-6.5Z"
        stroke={strokeCol}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <motion.text
        x="12"
        y="10.9"
        textAnchor="middle"
        dominantBaseline="central"
        fill={strokeCol}
        fontSize="9.5"
        fontWeight="700"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
        animate={playing ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.85 }}
        transition={playing ? { duration: 0.55, ease: "easeInOut" } : { duration: 0.2 }}
      >
        ?
      </motion.text>
    </motion.svg>
  );
}

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedChatIconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

export default function AnimatedChatIcon({ size = 28, className = "", active = false }: AnimatedChatIconProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Play animation immediately, then every 5 seconds
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

  const dotVariants = {
    hidden: { y: 0, opacity: 0.4 },
    visible: (i: number) => ({
      y: [0, -3, 0],
      opacity: [0.4, 1, 0.4],
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeInOut",
      },
    }),
  };

  const bubbleVariants = {
    idle: { scale: 1 },
    pop: {
      scale: [1, 1.12, 1],
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const r = size / 28; // scale factor

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      variants={bubbleVariants}
      animate={playing ? "pop" : "idle"}
    >
      {/* Chat bubble shape */}
      <motion.path
        d="M4 6C4 4.34315 5.34315 3 7 3H21C22.6569 3 24 4.34315 24 6V16C24 17.6569 22.6569 19 21 19H16L11 23.5V19H7C5.34315 19 4 17.6569 4 16V6Z"
        fill="currentColor"
        strokeWidth={0}
      />
      {/* Three dots */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={10 + i * 4}
          cy={11.5}
          r={1.6 * r}
          fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--background))"}
          custom={i}
          variants={dotVariants}
          animate={playing ? "visible" : "hidden"}
        />
      ))}
    </motion.svg>
  );
}

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

// ── Design tokens (from design-dna.json) ─────────────────────
const DEFAULT_COLOR = "#000000"; // solid black

export interface MorphingSquareProps {
  /** Square size in px (default 16) */
  size?: number;
  /** Fill color (default Design DNA secondary blue) */
  color?: string;
  /** Animation duration in seconds (default 2) */
  duration?: number;
}

export function MorphingSquare({
  size = 16,
  color = DEFAULT_COLOR,
  duration = 2,
  style,
  ...props
}: MorphingSquareProps & Omit<HTMLMotionProps<"div">, "animate" | "transition">) {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        flexShrink: 0,
        ...style,
      }}
      animate={{
        borderRadius: [`${size * 0.06}px`, `${size * 0.5}px`, `${size * 0.06}px`],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      {...props}
    />
  );
}

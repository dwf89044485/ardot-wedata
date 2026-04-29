"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// ── Design tokens (from design-dna.json) ─────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const T = {
  tertiary: "rgba(0,0,0,0.5)",
} as const;

// ── Types ────────────────────────────────────────────────────────
interface ThinkingSummaryProps {
  /** Summary text displayed, e.g. "分析了你的需求并为你规划任务" */
  text?: string;
  /** Click handler — can be used to expand detail in the future */
  onClick?: () => void;
}

// ── Component ────────────────────────────────────────────────────
export default function ThinkingSummary({
  text = "分析了你的需求并为你规划任务",
  onClick,
}: ThinkingSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        cursor: onClick ? "pointer" : "default",
        fontFamily: FONT,
      }}
      onClick={onClick}
      whileHover={onClick ? { opacity: 0.7 } : undefined}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "28px",
          color: T.tertiary,
          textAlign: "justify",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <ChevronRight
        style={{
          width: 16,
          height: 16,
          color: T.tertiary,
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}

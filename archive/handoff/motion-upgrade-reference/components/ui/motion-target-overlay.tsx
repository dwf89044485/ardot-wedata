"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Design DNA secondary blue: #1664FF → rgb(22, 100, 255)
// ---------------------------------------------------------------------------
const BLUE = "22, 100, 255";

const BORDER_IDLE = `1.5px dashed rgba(${BLUE}, 0.35)`;
const BORDER_HOVER = `1.5px dashed rgba(${BLUE}, 0.6)`;
const BG_IDLE = `rgba(${BLUE}, 0.04)`;
const BG_HOVER = `rgba(${BLUE}, 0.08)`;
const SHADOW_HOVER = `0 2px 12px rgba(${BLUE}, 0.12)`;
const LABEL_BG = `rgba(${BLUE}, 0.85)`;

const PAD = 12;
// Sample for 600ms at 60fps to catch framer-motion animations
const SAMPLE_MS = 600;

interface MotionTargetOverlayProps {
  targetId: string;
  targetLabel: string;
  isSelecting: boolean;
  onSelect: (targetId: string) => void;
  children: React.ReactNode;
  /** 嵌套 overlay 时，内层需要更高的 zIndex 才能被选中 */
  zIndex?: number;
}

type Bounds = { top: number; right: number; bottom: number; left: number };
const ZERO: Bounds = { top: 0, right: 0, bottom: 0, left: 0 };

/** Clip `rect` to the visible area of any overflow-clipping ancestor up to `root`. */
function clipToVisibleArea(
  rect: DOMRect,
  el: Element,
  root: HTMLElement,
): { left: number; top: number; right: number; bottom: number } | null {
  let clipped = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };

  let ancestor = el.parentElement;
  while (ancestor && ancestor !== root) {
    const style = getComputedStyle(ancestor);
    const ov = style.overflow + style.overflowX + style.overflowY;
    if (/hidden|scroll|auto|clip/.test(ov)) {
      const ar = ancestor.getBoundingClientRect();
      clipped.left = Math.max(clipped.left, ar.left);
      clipped.top = Math.max(clipped.top, ar.top);
      clipped.right = Math.min(clipped.right, ar.right);
      clipped.bottom = Math.min(clipped.bottom, ar.bottom);
      // 完全被裁剪掉了
      if (clipped.left >= clipped.right || clipped.top >= clipped.bottom) return null;
    }
    ancestor = ancestor.parentElement;
  }

  return clipped;
}

/** Measure visual extent of all descendants relative to `root`, respecting overflow clipping. */
function measure(root: HTMLElement): Bounds {
  const rr = root.getBoundingClientRect();
  let minX = 0, minY = 0, maxX = rr.width, maxY = rr.height;

  root.querySelectorAll("*").forEach((el) => {
    // Skip overlay decoration/interaction layers from nested MotionTargetOverlays
    if ((el as HTMLElement).dataset?.motionOverlay !== undefined) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;

    const visible = clipToVisibleArea(r, el, root);
    if (!visible) return;

    const l = visible.left - rr.left;
    const t = visible.top - rr.top;
    const w = visible.right - visible.left;
    const h = visible.bottom - visible.top;
    if (l < minX) minX = l;
    if (t < minY) minY = t;
    if (l + w > maxX) maxX = l + w;
    if (t + h > maxY) maxY = t + h;
  });

  return { top: minY, right: maxX - rr.width, bottom: maxY - rr.height, left: minX };
}

function union(a: Bounds, b: Bounds): Bounds {
  return {
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
    left: Math.min(a.left, b.left),
  };
}

export default function MotionTargetOverlay({
  targetId,
  targetLabel,
  isSelecting,
  onSelect,
  children,
  zIndex,
}: MotionTargetOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);
  // ★ ref on the CONTENT wrapper — never touches overlay layers
  const contentRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<Bounds>(ZERO);

  useEffect(() => {
    if (!isSelecting) {
      setBounds(ZERO);
      setIsHovered(false);
      return;
    }
    if (!contentRef.current) return;

    let accum: Bounds = ZERO;
    let raf: number;
    const start = performance.now();

    const sample = () => {
      if (!contentRef.current) return;
      const next = union(accum, measure(contentRef.current));
      // 仅在边界变化时更新，避免无效重渲染
      if (next.top !== accum.top || next.right !== accum.right ||
          next.bottom !== accum.bottom || next.left !== accum.left) {
        accum = next;
        setBounds({ ...accum });
      }
      if (performance.now() - start < SAMPLE_MS) {
        raf = requestAnimationFrame(sample);
      }
    };

    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [isSelecting]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(targetId);
  }, [onSelect, targetId]);

  const oT = bounds.top - PAD;
  const oR = -(bounds.right + PAD);
  const oB = -(bounds.bottom + PAD);
  const oL = bounds.left - PAD;

  return (
    <div style={{ position: "relative", zIndex }}>
      {/* ① Content — ref here so measurement only sees real children */}
      <div ref={contentRef} style={{ pointerEvents: isSelecting ? "none" : "auto" }}>{children}</div>

      {isSelecting && (
        <>
          {/* ② Interaction layer */}
          <div
            data-motion-overlay
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            style={{ position: "absolute", top: oT, right: oR, bottom: oB, left: oL, zIndex: 1, cursor: "pointer", pointerEvents: "auto" }}
          />

          {/* ③ Decorative border */}
          <div
            data-motion-overlay
            style={{
              position: "absolute", top: oT, right: oR, bottom: oB, left: oL,
              borderRadius: 16,
              border: isHovered ? BORDER_HOVER : BORDER_IDLE,
              background: isHovered ? BG_HOVER : BG_IDLE,
              boxShadow: isHovered ? SHADOW_HOVER : "none",
              pointerEvents: "none",
              transition: "border 220ms, background 220ms, box-shadow 220ms, top 200ms, right 200ms, bottom 200ms, left 200ms",
              zIndex: 2,
            }}
          />

          {/* ④ Label pill */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                data-motion-overlay
                initial={{ opacity: 0, y: 6, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 6, x: "-50%" }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "absolute", top: oT - 28,
                  left: `calc((${oL}px + 100% - ${oR}px) / 2)`,
                  padding: "3px 12px", borderRadius: 6, background: LABEL_BG,
                  color: "#fff", fontSize: 11, fontWeight: 500,
                  fontFamily: "'PingFang SC', -apple-system, sans-serif",
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 3,
                  textShadow: "0 0 4px rgba(255,255,255,0.3)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {targetLabel}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

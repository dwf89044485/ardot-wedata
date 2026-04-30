"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── 仅本胶囊关心的 motion mode 子集 ──────────────────────
export type MotionPillMode = "idle" | "motion-selecting" | "editing" | "motion-creating" | "motion-creating-input" | "motion-creating-generating";

// ── Inline SVG icons ──────────────────────────────────────
const _I = ({ d, size = 14, strokeWidth = 2.1 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const _I2 = ({ paths, size = 14, strokeWidth = 2.1 }: { paths: string[]; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths.map((d, i) => <path key={i} d={d} />)}</svg>
);
const MousePointerClick = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => (
  <_I2 size={size} strokeWidth={strokeWidth} paths={[
    "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08",
    "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z",
    "M2 2l8 8",
  ]} />
);
const XIcon = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => (
  <_I2 size={size} strokeWidth={strokeWidth} paths={["M18 6 6 18", "m6 6 12 12"]} />
);
const Sparkles = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => (
  <_I2 size={size} strokeWidth={strokeWidth} paths={[
    "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
    "M5 3v4", "M19 17v4", "M3 5h4", "M17 19h4",
  ]} />
);
const Plus = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => (
  <_I2 size={size} strokeWidth={strokeWidth} paths={["M12 5v14", "M5 12h14"]} />
);

// ── Design tokens（完全对齐底部 Tablet 视口胶囊） ────────
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const PILL_H = 44;
const PILL_PAD = 6;
const CTRL_H = 32;
const PILL_RADIUS = 21;
const BTN_RADIUS = 20;
const COLOR_TEXT = "#ffffffd9";
const COLOR_TEXT_MUTED = "#ffffffa6";
const COLOR_TEXT_DISABLED = "#ffffff73";
const COLOR_BORDER = "#3B3C3F";
const COLOR_BG = "#202124";
const COLOR_HOVER = "rgba(255,255,255,0.12)";
const SHADOW = "0 8px 20px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)";

// ── Reusable text button（复刻 Tablet 胶囊按钮样式） ─────
function PillBtn({
  onClick,
  disabled,
  muted,
  active,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  muted?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const color = disabled || muted ? COLOR_TEXT_DISABLED : active ? COLOR_TEXT : COLOR_TEXT_MUTED;

  const handleEnter = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (disabled) return;
    e.currentTarget.style.background = COLOR_HOVER;
  }, [disabled]);
  const handleLeave = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    if (disabled) return;
    e.currentTarget.style.background = active ? COLOR_HOVER : "transparent";
  }, [disabled, active]);
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onClick?.();
  }, [disabled, onClick]);

  return (
    <span
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: CTRL_H,
        padding: "0 14px",
        borderRadius: BTN_RADIUS,
        background: active ? COLOR_HOVER : "transparent",
        color,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: disabled ? "default" : "pointer",
        transition: "background 120ms, color 120ms",
        outline: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {children}
    </span>
  );
}

// ── 圆形关闭按钮（带底色） ───────────────────────────────
function CloseBtn({ onClick }: { onClick: () => void }) {
  const handleEnter = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.24)";
  }, []);
  const handleLeave = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
  }, []);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        color: COLOR_TEXT_MUTED,
        cursor: "pointer",
        transition: "background 120ms",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <XIcon size={12} strokeWidth={2.2} />
    </span>
  );
}

// ── Loading 旋转动画 ─────────────────────────────────────
const LoadingSpinner = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ animation: "motion-pill-spin 1s linear infinite" }}
  >
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ── Props ────────────────────────────────────────────────
export interface MotionEditorPillProps {
  /** 当前编辑器模式（父级 motionMode 的子集判断） */
  mode: MotionPillMode;
  /** idle 胶囊被点击 → 进入动效选择态 */
  onEnter: () => void;
  /** editing 时点击"重新选择" → 回到选择态 */
  onReselect: () => void;
  /** editing 时点击"新建动效" → 进入 motion-creating 元素选择态 */
  onCreateMotion: () => void;
  /** selecting / editing / creating 时点击"退出" → 回 idle */
  onExit: () => void;
}

// ── Main component ───────────────────────────────────────
export default function MotionEditorPill({ mode, onEnter, onReselect, onCreateMotion, onExit }: MotionEditorPillProps) {
  const isIdle = mode === "idle";
  const isSelecting = mode === "motion-selecting";
  const isEditing = mode === "editing";
  const isCreating = mode === "motion-creating";
  const isCreatingInput = mode === "motion-creating-input";
  const isGenerating = mode === "motion-creating-generating";

  // 不同模式对应的内容 key，用于 AnimatePresence 做交叉淡入
  let contentKey: string = "idle";
  let content: React.ReactNode;
  if (isSelecting) {
    contentKey = "selecting";
    content = (
      <>
        <PillBtn muted disabled>请选择组件</PillBtn>
        <CloseBtn onClick={onExit} />
      </>
    );
  } else if (isCreating) {
    contentKey = "creating";
    content = (
      <>
        <PillBtn muted disabled>请选择元素</PillBtn>
        <CloseBtn onClick={onExit} />
      </>
    );
  } else if (isCreatingInput) {
    contentKey = "creating-input";
    content = (
      <>
        <PillBtn muted disabled>描述动效中</PillBtn>
        <CloseBtn onClick={onExit} />
      </>
    );
  } else if (isGenerating) {
    contentKey = "generating";
    content = (
      <>
        <PillBtn muted disabled>
          <LoadingSpinner size={14} />
          正在生成动效...
        </PillBtn>
        <CloseBtn onClick={onExit} />
      </>
    );
  } else if (isEditing) {
    contentKey = "editing";
    content = (
      <>
        <PillBtn onClick={onReselect}>
          <MousePointerClick size={14} />
          重新选择
        </PillBtn>
        <CloseBtn onClick={onExit} />
      </>
    );
  } else {
    contentKey = "idle";
    content = (
      <>
        <PillBtn onClick={onEnter}>
          <Sparkles size={14} />
          编辑动效
        </PillBtn>
        <PillBtn onClick={onCreateMotion}>
          <Plus size={14} />
          新建动效
        </PillBtn>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes motion-pill-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <motion.div
      data-editor-ui
      initial={false}
      animate={{ width: "auto" }}
      transition={{ duration: 0.24, ease: EASE }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: PILL_H,
        padding: PILL_PAD,
        borderRadius: PILL_RADIUS,
        border: `1px solid ${COLOR_BORDER}`,
        background: COLOR_BG,
        boxShadow: SHADOW,
        color: COLOR_TEXT,
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={contentKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: EASE }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </motion.div>
    </>
  );
}

"use client";

import React, { useState, useRef, useId, useCallback, useMemo, useEffect, Children, isValidElement } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useAnchorPosition } from "@/lib/use-anchor-position";

// ── Inline SVG icons (replaces lucide-react dependency) ──────────────
const _I = ({ d, size = 24, strokeWidth = 2 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const _I2 = ({ paths, size = 24, strokeWidth = 2 }: { paths: string[]; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths.map((d, i) => <path key={i} d={d} />)}</svg>
);
const RotateCcw = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"]} />;
const X = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M18 6 6 18", "m6 6 12 12"]} />;
const MousePointerClick = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08", "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z", "M2 2l8 8"]} />;
const Sun = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41", "M2 12h2", "M20 12h2", "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"]} />;
const Moon = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I size={size} strokeWidth={strokeWidth} d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;
const Sparkles = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z", "M5 3v4", "M19 17v4", "M3 5h4", "M17 19h4"]} />;
const Palette = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10c0 .926-.126 1.824-.363 2.674-.31 1.108-1.497 1.826-2.637 1.826H17a2 2 0 0 0-2 2c0 .554-.225 1.056-.588 1.419A4.999 4.999 0 0 1 12 22Z", "M2.5 12.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M8 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M12 6.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", "M16 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"]} />;
const Copy = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M20 8H10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z", "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"]} />;
const LogOut = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} />;
const ChevronUp = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I size={size} strokeWidth={strokeWidth} d="m18 15-6-6-6 6" />;
const ChevronDown = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I size={size} strokeWidth={strokeWidth} d="m6 9 6 6 6-6" />;
const MessageSquarePlus = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M12 7v6", "M9 10h6"]} />;
const Trash2 = ({ size, strokeWidth }: { size?: number; strokeWidth?: number }) => <_I2 size={size} strokeWidth={strokeWidth} paths={["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M10 11v6", "M14 11v6"]} />;

// ── Shared types (consumed by other components via re-export) ─────
export interface MotionParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  /** 分组名；无 group 则不分组，直接展开 */
  group?: string;
  /** 若指定，仅在这些状态下显示此参数；未指定则始终显示 */
  states?: string[];
  /** 展开此参数所在分组时，自动切换到该组件状态 */
  linkedState?: string;
  /** 控件类型，默认 slider；xy 为二维拖拽面板 */
  control?: "slider" | "xy";
  /** 当 control=xy 时，Y 轴参数 key */
  pairKey?: string;
  /** 在该参数前渲染分割线（组内分隔） */
  dividerBefore?: boolean;
}

export interface MotionStateDef {
  value: string;
  label: string;
}

export interface MotionTargetDef {
  id: string;
  label: string;
  schema: MotionParamDef[];
  defaultConfig: Record<string, number>;
  states?: MotionStateDef[];
  defaultState?: string;
}

export type MotionMode = "idle" | "motion-selecting" | "editing" | "style-selecting" | "style-editing" | "comment-selecting" | "comment-editing";
export type MotionTheme = "light" | "dark";

// ── Design tokens ──────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const FONT =
  "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ── Props ──────────────────────────────────────────────────────────
interface MotionStateOption {
  value: string;
  label: string;
}

interface MotionPanelProps {
  targetLabel: string;
  schema: MotionParamDef[];
  config: Record<string, number>;
  defaultConfig: Record<string, number>;
  onChange: (config: Record<string, number>) => void;
  stateOptions?: MotionStateOption[];
  selectedState?: string;
  onStateChange?: (state: string) => void;
  onSliderCommit?: (key: string, value: number) => void;
  theme?: MotionTheme;
  onClose: () => void;
  /** 锚点元素，面板将定位到该元素旁边 */
  anchorElement?: HTMLElement | null;
  /** 停靠模式：在固定右栏内渲染，而非浮窗 */
  docked?: boolean;
}

// ── Sub-component: StepButton ──────────────────────────────────────
function StepButton({
  direction,
  isDark,
  onClick,
}: {
  direction: "minus" | "plus";
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "minus" ? "减少" : "增加"}
      style={{
        width: 16,
        height: 16,
        border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.10)",
        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        flexShrink: 0,
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 600,
        color: isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.40)",
        transition: "all 100ms",
        fontFamily: "'Monaco', 'Menlo', monospace",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.7)";
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.40)";
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";
      }}
    >
      {direction === "minus" ? "−" : "+"}
    </button>
  );
}

// ── Sub-component: EditableValue ───────────────────────────────────
function EditableValue({
  value,
  decimals,
  isDefault,
  isDark,
  min,
  max,
  step,
  onCommit,
}: {
  value: number;
  decimals: number;
  isDefault: boolean;
  isDark: boolean;
  min: number;
  max: number;
  step: number;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const startEdit = () => {
    setDraft(value.toFixed(decimals));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onCommit(clamp(parsed));
  };

  // 键盘 ↑↓ 微调
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { commit(); return; }
    if (e.key === "Escape") { e.stopPropagation(); setEditing(false); return; }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const parsed = parseFloat(draft);
      if (isNaN(parsed)) return;
      const s = e.shiftKey ? step * 10 : step;
      const delta = e.key === "ArrowUp" ? s : -s;
      const next = clamp(parsed + delta);
      const nextStr = next.toFixed(decimals);
      setDraft(nextStr);
      onCommit(next);
    }
  };

  // 数字拖拽调值
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startVal = value;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const s = ev.shiftKey ? step * 0.1 : step;
      const next = clamp(startVal + Math.round(dx * s * 10) / 10);
      onCommit(next);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [value, min, max, step, onCommit]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        style={{
          width: 38,
          height: 16,
          fontSize: 11,
          fontWeight: 500,
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
          textAlign: "center",
          border: isDark ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(0,0,0,0.18)",
          borderRadius: 3,
          outline: "none",
          background: isDark ? "rgba(15,18,24,0.95)" : "#fff",
          color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
          padding: "0 2px",
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      onMouseDown={handleDragStart}
      title="点击编辑，或左右拖拽调整"
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: isDefault
          ? (isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.4)")
          : (isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"),
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
        minWidth: 32,
        textAlign: "center",
        transition: "color 100ms",
        cursor: "ew-resize",
        borderRadius: 3,
        padding: "0 2px",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {value.toFixed(decimals)}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function MotionPanel({
  targetLabel,
  schema,
  config,
  defaultConfig,
  onChange,
  stateOptions,
  selectedState,
  onStateChange,
  onSliderCommit,
  theme = "dark",
  onClose,
  anchorElement,
  docked = false,
}: MotionPanelProps) {
  const anchorPos = useAnchorPosition(docked ? null : anchorElement);
  const [copyFeedback, setCopyFeedback] = useState<'copy'|'reset'|null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const p of schema) {
      if (p.group && !(p.group in init)) {
        init[p.group] = true;
      }
    }
    return init;
  });
  const sliderId = useId();
  const dragControls = useDragControls();
  const isDark = theme === "dark";

  const colors = isDark
    ? {
        panelBg: "rgba(15,18,24,0.80)",
        panelBorder: "rgba(255,255,255,0.14)",
        panelShadow: "0 14px 38px rgba(0,0,0,0.42)",
        dividerStrong: "rgba(255,255,255,0.12)",
        divider: "rgba(255,255,255,0.08)",
        dividerSoft: "rgba(255,255,255,0.06)",
        textPrimary: "rgba(255,255,255,0.9)",
        textSecondary: "rgba(255,255,255,0.72)",
        textTertiary: "rgba(255,255,255,0.48)",
        textMuted: "rgba(255,255,255,0.36)",
        buttonBg: "rgba(255,255,255,0.1)",
        buttonBgHover: "rgba(255,255,255,0.16)",
        buttonText: "rgba(255,255,255,0.62)",
        buttonTextHover: "rgba(255,255,255,0.9)",
        sliderTrack: "rgba(255,255,255,0.18)",
        sliderProgress: "rgba(118,180,255,0.82)",
        sliderThumbBg: "#0F1520",
        sliderThumbBorder: "rgba(255,255,255,0.42)",
        sliderThumbBorderHover: "rgba(255,255,255,0.66)",
        sliderThumbBorderActive: "rgba(255,255,255,0.78)",
        sliderThumbShadow: "0 1px 6px rgba(0,0,0,0.45)",
        sliderThumbShadowHover: "0 2px 8px rgba(0,0,0,0.55)",
        codeBg: "rgba(0,0,0,0.22)",
      }
    : {
        panelBg: "rgba(255,255,255,0.72)",
        panelBorder: "rgba(0,0,0,0.08)",
        panelShadow: "0 8px 32px rgba(0,0,0,0.08)",
        dividerStrong: "rgba(0,0,0,0.10)",
        divider: "rgba(0,0,0,0.06)",
        dividerSoft: "rgba(0,0,0,0.04)",
        textPrimary: "rgba(0,0,0,0.85)",
        textSecondary: "rgba(0,0,0,0.65)",
        textTertiary: "rgba(0,0,0,0.40)",
        textMuted: "rgba(0,0,0,0.28)",
        buttonBg: "rgba(0,0,0,0.05)",
        buttonBgHover: "rgba(0,0,0,0.10)",
        buttonText: "rgba(0,0,0,0.40)",
        buttonTextHover: "rgba(0,0,0,0.70)",
        sliderTrack: "#E6E9EF",
        sliderProgress: "rgba(0,0,0,0.22)",
        sliderThumbBg: "#fff",
        sliderThumbBorder: "rgba(0,0,0,0.22)",
        sliderThumbBorderHover: "rgba(0,0,0,0.40)",
        sliderThumbBorderActive: "rgba(0,0,0,0.50)",
        sliderThumbShadow: "0 1px 4px rgba(0,0,0,0.12)",
        sliderThumbShadowHover: "0 1px 6px rgba(0,0,0,0.2)",
        codeBg: "rgba(0,0,0,0.025)",
      };

  const stateSelector = isDark
    ? {
        containerBg: "#4F5156",
        containerBorder: "none",
        itemBaseBg: "#4F5156",
        itemBaseText: "#FFFFFF",
        itemActiveBg: "#FFFFFF",
        itemActiveText: "#383A40",
      }
    : {
        containerBg: "#F5F5F5",
        containerBorder: "1px solid #EFEFEF",
        itemBaseBg: "#F5F5F5",
        itemBaseText: "#383A40",
        itemActiveBg: "#4F5156",
        itemActiveText: "#FFFFFF",
      };

  const toggleGroup = useCallback((label: string, linkedState?: string) => {
    setCollapsedGroups((prev) => {
      const isCurrentlyCollapsed = prev[label] ?? true;
      if (isCurrentlyCollapsed) {
        // 展开此组，收起其他所有组（手风琴）
        const next: Record<string, boolean> = {};
        for (const key of Object.keys(prev)) {
          next[key] = true; // 全部收起
        }
        next[label] = false; // 展开当前
        return next;
      }
      // 收起当前组
      return { ...prev, [label]: true };
    });
    // 展开时联动切换组件状态
    const isCurrentlyCollapsed = collapsedGroups[label] ?? true;
    if (isCurrentlyCollapsed && linkedState && onStateChange) {
      onStateChange(linkedState);
    }
  }, [collapsedGroups, onStateChange]);

  const handleSliderChange = (key: string, value: number) => {
    onChange({ ...config, [key]: value });
  };

  const handleResetParameter = (key: string) => {
    onChange({ ...config, [key]: defaultConfig[key] });
  };

  const handleResetAll = () => {
    onChange({ ...defaultConfig });
    setCopyFeedback('reset');
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const getPercent = (param: MotionParamDef) =>
    ((config[param.key] - param.min) / (param.max - param.min)) * 100;

  const hasAnyChange = schema.some(
    (p) => config[p.key] !== defaultConfig[p.key]
  );

  const cls = `motion-slider-${sliderId.replace(/:/g, "")}`;

  // Build ordered groups from schema, preserving first-appearance order
  // Filter params by selectedState when param.states is defined
  const { groups, ungroupedParams } = useMemo(() => {
    const result: { label: string; params: MotionParamDef[]; linkedState?: string }[] = [];
    const ungrouped: MotionParamDef[] = [];
    const map = new Map<string, MotionParamDef[]>();
    const stateMap = new Map<string, string | undefined>();
    for (const p of schema) {
      // Skip params that don't match current state
      if (p.states && selectedState && !p.states.includes(selectedState)) continue;
      if (!p.group) {
        ungrouped.push(p);
        continue;
      }
      let arr = map.get(p.group);
      if (!arr) {
        arr = [];
        map.set(p.group, arr);
        stateMap.set(p.group, p.linkedState);
        result.push({ label: p.group, params: arr, linkedState: p.linkedState });
      }
      arr.push(p);
    }
    return { groups: result, ungroupedParams: ungrouped };
  }, [schema, selectedState]);

  // 外部状态变化时，自动展开对应 linkedState 的分组
  useEffect(() => {
    if (!selectedState) return;
    const matchGroup = groups.find((g) => g.linkedState === selectedState);
    if (matchGroup) {
      setCollapsedGroups((prev) => {
        const next: Record<string, boolean> = {};
        for (const key of Object.keys(prev)) {
          next[key] = true;
        }
        next[matchGroup.label] = false;
        return next;
      });
    }
  }, [selectedState, groups]);

  const renderSlider = (param: MotionParamDef) => {
    const pct = getPercent(param);
    const isDefault = config[param.key] === defaultConfig[param.key];
    const decimals = param.step < 1 ? 2 : 0;

    const clampAndSet = (raw: number) => {
      const clamped = Math.min(param.max, Math.max(param.min, raw));
      const rounded = parseFloat(clamped.toFixed(decimals));
      handleSliderChange(param.key, rounded);
    };

    return (
      <div
        key={param.key}
        style={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: colors.textSecondary,
            }}
          >
            {param.label}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {!isDefault && (
              <button
                onClick={() => handleResetParameter(param.key)}
                title="重置为默认值"
                style={{
                  width: 18,
                  height: 18,
                  border: "none",
                  background: colors.buttonBg,
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.buttonText,
                  transition: "all 100ms",
                  padding: 0,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.buttonTextHover;
                  e.currentTarget.style.background = colors.buttonBgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.buttonText;
                  e.currentTarget.style.background = colors.buttonBg;
                }}
              >
                <RotateCcw size={11} />
              </button>
            )}
            <StepButton
              direction="minus"
              isDark={isDark}
              onClick={() => clampAndSet(config[param.key] - param.step)}
            />
            <EditableValue
              value={config[param.key]}
              decimals={decimals}
              isDefault={isDefault}
              isDark={isDark}
              min={param.min}
              max={param.max}
              step={param.step}
              onCommit={clampAndSet}
            />
            <StepButton
              direction="plus"
              isDark={isDark}
              onClick={() => clampAndSet(config[param.key] + param.step)}
            />
          </div>
        </div>

        <input
          type="range"
          className={cls}
          min={param.min}
          max={param.max}
          step={param.step}
          value={config[param.key]}
          onChange={(e) =>
            handleSliderChange(param.key, parseFloat(e.target.value))
          }
          onMouseUp={(e) =>
            onSliderCommit?.(param.key, parseFloat(e.currentTarget.value))
          }
          style={{
            background: `linear-gradient(to right, ${colors.sliderProgress} 0%, ${colors.sliderProgress} ${pct}%, ${colors.sliderTrack} ${pct}%, ${colors.sliderTrack} 100%)`,
          }}
        />
      </div>
    );
  };

  const renderXYPad = (param: MotionParamDef) => {
    const pairKey = param.pairKey;
    if (!pairKey) return renderSlider(param);

    const decimals = param.step < 1 ? 2 : 0;
    const defaultX = defaultConfig[param.key] ?? 0;
    const defaultY = defaultConfig[pairKey] ?? 0;
    const currentX = config[param.key] ?? defaultX;
    const currentY = config[pairKey] ?? defaultY;
    const isDefault = currentX === defaultX && currentY === defaultY;

    const clamp = (raw: number) => {
      const clamped = Math.min(param.max, Math.max(param.min, raw));
      return parseFloat(clamped.toFixed(decimals));
    };

    const setPair = (rawX: number, rawY: number) => {
      const nextX = clamp(rawX);
      const nextY = clamp(rawY);
      onChange({ ...config, [param.key]: nextX, [pairKey]: nextY });
      return { x: nextX, y: nextY };
    };

    const toPercent = (value: number) =>
      ((value - param.min) / (param.max - param.min)) * 100;

    const xPercent = toPercent(currentX);
    const yPercent = toPercent(currentY);

    const updateFromPointer = (
      clientX: number,
      clientY: number,
      element: HTMLDivElement
    ) => {
      const rect = element.getBoundingClientRect();
      const xRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const yRatio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const nextX = param.min + xRatio * (param.max - param.min);
      const nextY = param.min + yRatio * (param.max - param.min);
      return setPair(nextX, nextY);
    };

    return (
      <div key={param.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: colors.textSecondary,
            }}
          >
            {param.label}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.textPrimary,
                fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                minWidth: 62,
                textAlign: "right",
              }}
            >
              {currentX.toFixed(decimals)}, {currentY.toFixed(decimals)}
            </span>
            {!isDefault && (
              <button
                onClick={() => {
                  onChange({ ...config, [param.key]: defaultX, [pairKey]: defaultY });
                  onSliderCommit?.(param.key, defaultX);
                  onSliderCommit?.(pairKey, defaultY);
                }}
                title="重置为默认值"
                style={{
                  width: 18,
                  height: 18,
                  border: "none",
                  background: colors.buttonBg,
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.buttonText,
                  transition: "all 100ms",
                  padding: 0,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.buttonTextHover;
                  e.currentTarget.style.background = colors.buttonBgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.buttonText;
                  e.currentTarget.style.background = colors.buttonBg;
                }}
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        </div>

        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const element = e.currentTarget;
            let latest = updateFromPointer(e.clientX, e.clientY, element);

            element.setPointerCapture(e.pointerId);
            const handleMove = (event: PointerEvent) => {
              latest = updateFromPointer(event.clientX, event.clientY, element);
            };
            const handleUp = (event: PointerEvent) => {
              if (element.hasPointerCapture(event.pointerId)) {
                element.releasePointerCapture(event.pointerId);
              }
              element.removeEventListener("pointermove", handleMove);
              element.removeEventListener("pointerup", handleUp);
              element.removeEventListener("pointercancel", handleUp);
              onSliderCommit?.(param.key, latest.x);
              onSliderCommit?.(pairKey, latest.y);
            };

            element.addEventListener("pointermove", handleMove);
            element.addEventListener("pointerup", handleUp);
            element.addEventListener("pointercancel", handleUp);
          }}
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            position: "relative",
            borderRadius: 12,
            border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.12)",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
            backgroundImage: isDark
              ? "radial-gradient(circle at center, rgba(255,255,255,0.16) 1px, transparent 1.5px)"
              : "radial-gradient(circle at center, rgba(0,0,0,0.15) 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            overflow: "hidden",
            touchAction: "none",
            cursor: "crosshair",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgba(22,100,255,0.35)",
              transform: "translateX(-0.5px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: "rgba(22,100,255,0.35)",
              transform: "translateY(-0.5px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${xPercent}%`,
              top: `${yPercent}%`,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#22D3EE",
              boxShadow: isDark
                ? "0 0 0 3px rgba(34,211,238,0.24), 0 2px 8px rgba(0,0,0,0.48)"
                : "0 0 0 3px rgba(34,211,238,0.18), 0 2px 6px rgba(0,0,0,0.2)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    );
  };

  const renderParam = (param: MotionParamDef) => {
    const content = param.control === "xy" ? renderXYPad(param) : renderSlider(param);
    if (!param.dividerBefore) return content;
    return (
      <div
        key={`${param.key}-divider`}
        style={{
          borderTop: `1px solid ${colors.dividerStrong}`,
          paddingTop: 10,
          marginTop: 4,
        }}
      >
        {content}
      </div>
    );
  };

  const panelNode = (
    <>
      <style>{`
        .${cls} {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          margin: 6px 0;
          padding: 0;
          border: none;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          vertical-align: middle;
        }
        .${cls}::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
        .${cls}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 8px;
          height: 16px;
          margin-top: -6px;
          border-radius: 4px;
          background: ${colors.sliderThumbBg};
          border: 1.5px solid ${colors.sliderThumbBorder};
          box-shadow: ${colors.sliderThumbShadow};
          cursor: pointer;
          transition: border-color 120ms, box-shadow 120ms, transform 120ms;
        }
        .${cls}::-webkit-slider-thumb:hover {
          border-color: ${colors.sliderThumbBorderHover};
          box-shadow: ${colors.sliderThumbShadowHover};
          transform: scaleX(1.15);
        }
        .${cls}::-webkit-slider-thumb:active {
          border-color: ${colors.sliderThumbBorderActive};
          transform: scaleY(0.9);
        }
        .${cls}::-moz-range-track {
          height: 4px;
          border: none;
          border-radius: 2px;
          background: ${colors.sliderTrack};
        }
        .${cls}::-moz-range-progress {
          height: 4px;
          border-radius: 2px;
          background: ${colors.sliderProgress};
        }
        .${cls}::-moz-range-thumb {
          width: 8px;
          height: 16px;
          border-radius: 4px;
          background: ${colors.sliderThumbBg};
          border: 1.5px solid ${colors.sliderThumbBorder};
          box-shadow: ${colors.sliderThumbShadow};
          cursor: pointer;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 40 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6, y: 40 }}
        transition={{ duration: 0.35, ease: EASE }}
        drag={!docked}
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0.15}
        dragMomentum={false}
        style={{
          position: docked ? "relative" : "fixed",
          ...(!docked
            ? (anchorPos
              ? { top: anchorPos.top, left: anchorPos.left }
              : { top: 20, right: 20 })
            : {}),
          width: docked ? "100%" : 300,
          ...(!docked ? {
            borderRadius: 12,
            backgroundColor: colors.panelBg,
            backdropFilter: "blur(13px) saturate(90%)",
            WebkitBackdropFilter: "blur(13px) saturate(90%)",
            border: `1px solid ${colors.panelBorder}`,
            boxShadow: colors.panelShadow,
            overflow: "hidden",
          } : {}),
          fontFamily: FONT,
          zIndex: docked ? "auto" : 99998,
        }}
      >
        {/* ── Header ── */}
        <div
          onPointerDown={(e) => {
            if (docked) return;
            const target = e.target as HTMLElement;
            if (target.closest("button")) return;
            dragControls.start(e);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: `1px solid ${colors.divider}`,
            userSelect: "none",
            cursor: docked ? "default" : "grab",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.textPrimary,
            }}
          >
            {targetLabel}
          </span>
        </div>

        {stateOptions && selectedState !== undefined && onStateChange && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "10px 12px",
              borderBottom: `1px solid ${colors.divider}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: colors.textTertiary,
                letterSpacing: "0.02em",
              }}
            >
              组件状态
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 4,
                borderRadius: 40,
                background: stateSelector.containerBg,
                border: stateSelector.containerBorder,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {stateOptions.map((option) => {
                const isSelected = option.value === selectedState;
                return (
                  <button
                    key={option.value}
                    onClick={() => onStateChange(option.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: "none",
                      borderRadius: 40,
                      padding: "4px 10px",
                      fontSize: 12,
                      lineHeight: "20px",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? stateSelector.itemActiveText : stateSelector.itemBaseText,
                      background: isSelected ? stateSelector.itemActiveBg : stateSelector.itemBaseBg,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      transition: "background-color 150ms, color 150ms",
                    }}
                    onMouseEnter={(e) => {
                      if (isSelected) return;
                      e.currentTarget.style.background = stateSelector.itemActiveBg;
                      e.currentTarget.style.color = stateSelector.itemActiveText;
                    }}
                    onMouseLeave={(e) => {
                      if (isSelected) return;
                      e.currentTarget.style.background = stateSelector.itemBaseBg;
                      e.currentTarget.style.color = stateSelector.itemBaseText;
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Parameter groups ── */}
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* 无分组的参数直接平铺展示 */}
          {ungroupedParams.length > 0 && (
            <div
              style={{
                padding: "6px 12px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {ungroupedParams.map(renderParam)}
            </div>
          )}

          {groups.map((group) => {
            return (
              <div
                key={group.label}
                style={{ borderBottom: `1px solid ${colors.dividerSoft}` }}
              >
                {/* 分组标题（纯展示，不可点击） */}
                <div
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.textTertiary,
                    fontFamily: FONT,
                    letterSpacing: "0.02em",
                  }}
                >
                  <span>{group.label}</span>
                </div>

                {/* 参数直接平铺展示 */}
                <div
                  style={{
                    padding: "2px 12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {group.params.map(renderParam)}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer: 重置 | 复制 ── */}
        <div style={{ borderTop: `1px solid ${colors.divider}`, padding: '10px 12px 12px' }}>
          <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 6 }}>
            {hasAnyChange ? `${schema.filter(p => config[p.key] !== defaultConfig[p.key]).length} 项修改` : '无修改'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { if (hasAnyChange) handleResetAll(); }}
              onMouseEnter={e => { if (hasAnyChange) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              style={{
                flex: 1, height: 28, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)'}`, borderRadius: 8,
                background: 'transparent', color: hasAnyChange ? colors.textSecondary : colors.textMuted,
                fontSize: 11, fontWeight: 500, cursor: hasAnyChange ? 'pointer' : 'default',
                fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 100ms',
              }}
            >{copyFeedback === 'reset' ? '✓ 已重置' : '重置'}</button>
            <button
              onClick={() => {
                if (!hasAnyChange) return;
                const changed = schema.filter(p => config[p.key] !== defaultConfig[p.key]);
                const lines = changed.map(p => `  ${p.key}: ${defaultConfig[p.key]} → ${config[p.key]}  // ${p.label}`);
                const text = `我在动效编辑器中调整了「${targetLabel}」的以下参数，请根据这些变更找到对应的代码并更新：\n\n{\n${lines.join(',\n')}\n}`;
                navigator.clipboard.writeText(text);
                setCopyFeedback('copy');
                setTimeout(() => setCopyFeedback(null), 1500);
              }}
              onMouseEnter={e => { if (hasAnyChange) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              style={{
                flex: 1, height: 28, border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)'}`, borderRadius: 8,
                background: 'transparent', color: hasAnyChange ? colors.textSecondary : colors.textMuted,
                fontSize: 11, fontWeight: 500, cursor: hasAnyChange ? 'pointer' : 'default',
                fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 100ms',
              }}
            >{copyFeedback === 'copy' ? '✓ 已复制' : '复制'}</button>
          </div>
        </div>
      </motion.div>
    </>
  );

  if (docked) return panelNode;
  return createPortal(panelNode, document.body);
}

// ── EditorSelectButton (right-bottom toggle) ───────────────────────
interface EditorSelectButtonProps {
  mode: MotionMode;
  theme?: MotionTheme;
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
  onToggle: () => void;           // idle → motion-selecting
  onStyleToggle?: () => void;     // idle → style-selecting
  onCommentToggle?: () => void;   // idle → comment-selecting
  onReselect: () => void;         // editing → motion-selecting
  onExitEditing: () => void;      // selecting/editing/style-editing → idle(expanded)
  onThemeToggle?: () => void;
  onClose?: () => void;           // 兼容旧调用，优先走 onExitEditing
  onResetAll?: () => void;        // 全部重置
  onCopyChanges?: () => void;     // 复制所有改动
  changeCount?: number;           // 汇总改动数
  changesPreviewText?: string;
  commentCount?: number;          // 批注数
  commentPreviewText?: string;    // 批注预览文本
  onCopyComments?: () => void;    // 复制批注
  onClearComments?: () => void;   // 清空批注
}

/* shared pill style */
const PILL_OUTER_PAD = 4;
const PILL_CONTROL_H = 36;
// 左侧操作区不再设 minWidth，靠 pill 的 minWidth: 280 保底
// framer-motion width:"auto" + minWidth 保证模式切换时不跳变

function handlePillPointerDown(e: React.PointerEvent, disabled = false) {
  if (!disabled) e.stopPropagation();
}

function triggerPillAction(
  e: React.MouseEvent | React.KeyboardEvent,
  onClick: (e: React.MouseEvent) => void,
  disabled = false,
) {
  if (disabled) return;
  e.stopPropagation();
  onClick(e as unknown as React.MouseEvent);
}

function handlePillKeyDown(
  e: React.KeyboardEvent,
  onClick: (e: React.MouseEvent) => void,
  disabled = false,
) {
  if (disabled) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    triggerPillAction(e, onClick);
  }
}

function setPillHoverBackground(el: HTMLElement, hovered: boolean, isDark: boolean, disabled = false) {
  if (disabled) return;
  el.style.background = hovered
    ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)")
    : "transparent";
}

function getPillBase(isDark: boolean): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 22,
    border: isDark ? "1px solid rgba(255,255,255,0.20)" : "1px solid rgba(0,0,0,0.14)",
    background: isDark
      ? "linear-gradient(180deg, rgba(24,27,34,0.96) 0%, rgba(10,12,16,0.97) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(242,245,251,0.96) 100%)",
    boxShadow: isDark
      ? "0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.04)"
      : "0 8px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.86), 0 0 0 1px rgba(0,0,0,0.03)",
    display: "flex",
    alignItems: "center",
    color: isDark ? "rgba(255,255,255,0.96)" : "rgba(0,0,0,0.76)",
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };
}

/* reusable icon button inside the pill */
function PillIconBtn({ title, onClick, children, isDark }: { title?: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode; isDark: boolean }) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={title}
      onPointerDown={(e) => handlePillPointerDown(e)}
      onClick={(e) => triggerPillAction(e, onClick)}
      onKeyDown={(e) => handlePillKeyDown(e, onClick)}
      onMouseEnter={(e) => setPillHoverBackground(e.currentTarget, true, isDark)}
      onMouseLeave={(e) => setPillHoverBackground(e.currentTarget, false, isDark)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: PILL_CONTROL_H, height: PILL_CONTROL_H, borderRadius: PILL_CONTROL_H / 2, cursor: "pointer",
        transition: "background 120ms", background: "transparent", flexShrink: 0, outline: "none",
      }}
    >
      {children}
    </span>
  );
}

/* reusable text button inside the pill */
function PillTextBtn({ onClick, muted, disabled, fullWidth, children, isDark, sx }: { onClick: (e: React.MouseEvent) => void; muted?: boolean; disabled?: boolean; fullWidth?: boolean; children: React.ReactNode; isDark: boolean; sx?: React.CSSProperties }) {
  const hasIcon = Children.toArray(children).some(c => isValidElement(c));
  return (
    <span
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? true : undefined}
      onPointerDown={(e) => handlePillPointerDown(e, !!disabled)}
      onClick={(e) => triggerPillAction(e, onClick, !!disabled)}
      onKeyDown={(e) => handlePillKeyDown(e, onClick, !!disabled)}
      onMouseEnter={(e) => setPillHoverBackground(e.currentTarget, true, isDark, !!disabled)}
      onMouseLeave={(e) => setPillHoverBackground(e.currentTarget, false, isDark, !!disabled)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        height: PILL_CONTROL_H, padding: "0 10px", borderRadius: PILL_CONTROL_H / 2, cursor: disabled ? "default" : "pointer",
        transition: disabled ? "none" : "background 120ms", background: "transparent",
        fontSize: 13, fontWeight: 500, outline: "none",
        color: muted
          ? (isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)")
          : (isDark ? "rgba(255,255,255,0.94)" : "rgba(0,0,0,0.76)"),
        userSelect: "none", whiteSpace: "nowrap",
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        // 无 icon 的按钮（如"请选择组件"）补 minWidth，与带 icon 按钮等宽，防止模式切换时 pill 跳动
        minWidth: (!hasIcon && !fullWidth) ? 90 : undefined,
        ...sx,
      }}
    >
      {children}
    </span>
  );
}

/* vertical divider */
function PillDivider({ isDark }: { isDark: boolean }) {
  return <span style={{ width: 1, height: 20, background: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)", flexShrink: 0, margin: "0 4px" }} />;
}

export function EditorSelectButton({
  mode,
  theme = "dark",
  expanded,
  onExpandedChange,
  onToggle,
  onStyleToggle,
  onCommentToggle,
  onReselect,
  onExitEditing,
  onThemeToggle,
  onClose,
  onResetAll,
  onCopyChanges,
  changeCount = 0,
  changesPreviewText,
  commentCount = 0,
  commentPreviewText,
  onCopyComments,
  onClearComments,
}: EditorSelectButtonProps) {
  const isIdle = mode === "idle";
  const isSelecting = mode === "motion-selecting";
  const isEditing = mode === "editing";
  const isStyleSelecting = mode === "style-selecting";
  const isStyleEditing = mode === "style-editing";
  const isCommentSelecting = mode === "comment-selecting";
  const isCommentEditing = mode === "comment-editing";
  const isDark = theme === "dark";
  const pillBase = getPillBase(isDark);
  const isCollapsed = isIdle && !expanded;

  const suppressClickRef = useRef(false);
  const [isChangesPreviewOpen, setIsChangesPreviewOpen] = useState(false);

  const handleDragStart = useCallback(() => {
    suppressClickRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, []);

  const handlePillClick = useCallback(() => {
    if (suppressClickRef.current) return;
    if (isCollapsed) onExpandedChange(true);
  }, [isCollapsed, onExpandedChange]);

  // 左侧操作区文本（根据 mode 变化，用 AnimatePresence 做交叉淡入）
  let leftKey = "idle";
  let leftContent: React.ReactNode = null;
  if (isIdle && expanded) {
    leftKey = "idle-expanded";
    leftContent = (
      <>
        <PillTextBtn onClick={() => { onToggle(); }} isDark={isDark}>
          <Sparkles size={14} strokeWidth={2.1} />
          动效编辑
        </PillTextBtn>
        <PillTextBtn onClick={() => { onStyleToggle?.(); }} isDark={isDark}>
          <Palette size={14} strokeWidth={2.1} />
          样式编辑
        </PillTextBtn>
        <PillTextBtn onClick={() => { onCommentToggle?.(); }} isDark={isDark}>
          <MessageSquarePlus size={14} strokeWidth={2.1} />
          批注
        </PillTextBtn>
      </>
    );
  } else if (isSelecting) {
    leftKey = "motion-selecting";
    leftContent = (
      <>
        <PillTextBtn onClick={() => {}} muted disabled isDark={isDark}>请选择组件</PillTextBtn>
        <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
          <LogOut size={14} strokeWidth={2.1} />
          退出编辑
        </PillTextBtn>
      </>
    );
  } else if (isStyleSelecting) {
    leftKey = "style-selecting";
    leftContent = (
      <>
        <PillTextBtn onClick={() => {}} muted disabled isDark={isDark}>请选择元素</PillTextBtn>
        <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
          <LogOut size={14} strokeWidth={2.1} />
          退出编辑
        </PillTextBtn>
      </>
    );
  } else if (isCommentSelecting) {
    leftKey = "comment-selecting";
    leftContent = (
      <>
        <PillTextBtn onClick={() => {}} muted disabled isDark={isDark}>点击元素添加批注</PillTextBtn>
        <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
          <LogOut size={14} strokeWidth={2.1} />
          退出批注
        </PillTextBtn>
      </>
    );
  } else if (isCommentEditing) {
    leftKey = "comment-editing";
    leftContent = (
      <>
        <PillTextBtn onClick={() => onReselect()} isDark={isDark}>
          <MousePointerClick size={14} strokeWidth={2.1} />
          继续批注
        </PillTextBtn>
        <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
          <LogOut size={14} strokeWidth={2.1} />
          退出批注
        </PillTextBtn>
      </>
    );
  } else if (isEditing) {
    leftKey = "editing";
    leftContent = (
      <>
        <PillTextBtn onClick={() => onReselect()} isDark={isDark}>
          <MousePointerClick size={14} strokeWidth={2.1} />
          重新选择
        </PillTextBtn>
        <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
          <LogOut size={14} strokeWidth={2.1} />
          退出编辑
        </PillTextBtn>
      </>
    );
  } else if (isStyleEditing) {
    leftKey = "style-editing";
    leftContent = (
      <PillTextBtn onClick={() => onExitEditing()} isDark={isDark}>
        <LogOut size={14} strokeWidth={2.1} />
        退出编辑
      </PillTextBtn>
    );
  }

  // 宽度逻辑：收起态固定，展开态自适应内容
  const COLLAPSED_W = 128;
  const CHANGES_PANEL_W = 176;
  const PILL_GAP = 4;
  const CHANGES_PREVIEW_W = CHANGES_PANEL_W + PILL_GAP + 320;
  const CHANGES_PREVIEW_H = 300;
  // idle 下有改动时始终显示胶囊；非 idle 下需要 expanded
  const showChangesPanel = changeCount > 0 && (isIdle || !isCollapsed);
  const showChangesPreview = showChangesPanel && isChangesPreviewOpen && !!changesPreviewText;
  const [isCommentPreviewOpen, setIsCommentPreviewOpen] = useState(false);
  const showCommentPanel = commentCount > 0 && (isIdle || !isCollapsed);
  const showCommentPreview = showCommentPanel && isCommentPreviewOpen && !!commentPreviewText;

  useEffect(() => {
    if (!showChangesPanel || !changesPreviewText) {
      setIsChangesPreviewOpen(false);
    }
  }, [showChangesPanel, changesPreviewText]);

  useEffect(() => {
    if (!showCommentPanel || !commentPreviewText) {
      setIsCommentPreviewOpen(false);
    }
  }, [showCommentPanel, commentPreviewText]);

  const smoothTransition = { type: "spring", stiffness: 220, damping: 26, mass: 0.95 } as const;
  const selectorWidthTransition = isCollapsed
    ? ({ duration: 0.22, ease: EASE, delay: 0.08 } as const)
    : ({ duration: 0.24, ease: EASE } as const);
  const expandedContentTransition = isCollapsed
    ? ({ duration: 0.1, ease: EASE } as const)
    : ({ duration: 0.14, ease: EASE, delay: 0.08 } as const);
  const collapsedContentTransition = isCollapsed
    ? ({ duration: 0.14, ease: EASE, delay: 0.1 } as const)
    : ({ duration: 0.1, ease: EASE } as const);
  const selectorContentTransition = { duration: 0.2, ease: EASE } as const;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      data-editor-ui
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        touchAction: "none",
        cursor: "grab",
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
      }}
    >
      {/* changes 胶囊 + 展开面板（展开面板 absolute 向上弹出） */}
      <motion.div
        initial={false}
        animate={{
          opacity: showChangesPanel ? 1 : 0,
        }}
        transition={smoothTransition}
        style={{
          position: "relative",
          flexShrink: 0,
          height: 44,
          width: showChangesPanel ? "fit-content" : 0,
          overflow: showChangesPanel ? "visible" : "hidden",
          pointerEvents: showChangesPanel ? "auto" : "none",
        }}
      >
        {/* 展开面板：absolute，从底部向上弹出，不撑容器宽度 */}
        <motion.div
          initial={false}
          animate={{
            opacity: showChangesPreview ? 1 : 0,
            y: showChangesPreview ? 0 : 12,
            pointerEvents: showChangesPreview ? "auto" : "none",
          }}
          transition={{ duration: 0.24, ease: EASE }}
          style={{
            position: "absolute",
            bottom: 44 + 6,
            left: 0,
            width: CHANGES_PREVIEW_W,
            height: CHANGES_PREVIEW_H,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(15,18,24,0.80)" : "rgba(255,255,255,0.92)",
            border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.10)",
            boxShadow: isDark ? "0 14px 38px rgba(0,0,0,0.42)" : "0 14px 30px rgba(0,0,0,0.14)",
            backdropFilter: "blur(13px) saturate(90%)",
            WebkitBackdropFilter: "blur(13px) saturate(90%)",
            padding: 10,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          {/* 内嵌代码色块 */}
          <div
            style={{
              flex: 1,
              borderRadius: 8,
              background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.04)",
              padding: "14px 16px",
              overflowY: "auto",
              boxSizing: "border-box",
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
              fontSize: 12,
              lineHeight: 1.75,
              color: isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.72)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "text",
            }}
          >
            {changesPreviewText}
          </div>
        </motion.div>

        {/* 控制胶囊：紧凑自适应宽度 */}
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxSizing: "border-box",
            padding: PILL_OUTER_PAD,
            color: isDark ? "rgba(255,255,255,0.96)" : "rgba(0,0,0,0.78)",
            border: pillBase.border,
            borderRadius: pillBase.borderRadius,
            background: pillBase.background,
            boxShadow: pillBase.boxShadow,
            backdropFilter: pillBase.backdropFilter,
            WebkitBackdropFilter: pillBase.WebkitBackdropFilter,
          }}
        >
          <PillTextBtn onClick={() => setIsChangesPreviewOpen((prev) => !prev)} isDark={isDark} sx={{ paddingLeft: 20 }}>
            {changeCount} 项改动 {showChangesPreview ? <ChevronDown size={13} strokeWidth={2.1} /> : <ChevronUp size={13} strokeWidth={2.1} />}
          </PillTextBtn>
          <PillIconBtn title="复制改动" onClick={() => onCopyChanges?.()} isDark={isDark}>
            <Copy size={13} strokeWidth={2.1} />
          </PillIconBtn>
          <PillIconBtn title="全部重置" onClick={() => onResetAll?.()} isDark={isDark}>
            <RotateCcw size={13} strokeWidth={2.1} />
          </PillIconBtn>
        </div>
      </motion.div>

      {/* comment 批注胶囊 + 展开面板 */}
      <motion.div
        initial={false}
        animate={{
          opacity: showCommentPanel ? 1 : 0,
        }}
        transition={smoothTransition}
        style={{
          position: "relative",
          flexShrink: 0,
          height: 44,
          width: showCommentPanel ? "fit-content" : 0,
          overflow: showCommentPanel ? "visible" : "hidden",
          pointerEvents: showCommentPanel ? "auto" : "none",
        }}
      >
        {/* 展开面板：absolute，从底部向上弹出 */}
        <motion.div
          initial={false}
          animate={{
            opacity: showCommentPreview ? 1 : 0,
            y: showCommentPreview ? 0 : 12,
            pointerEvents: showCommentPreview ? "auto" : "none",
          }}
          transition={{ duration: 0.24, ease: EASE }}
          style={{
            position: "absolute",
            bottom: 44 + 6,
            left: 0,
            width: CHANGES_PREVIEW_W,
            height: CHANGES_PREVIEW_H,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(15,18,24,0.80)" : "rgba(255,255,255,0.92)",
            border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.10)",
            boxShadow: isDark ? "0 14px 38px rgba(0,0,0,0.42)" : "0 14px 30px rgba(0,0,0,0.14)",
            backdropFilter: "blur(13px) saturate(90%)",
            WebkitBackdropFilter: "blur(13px) saturate(90%)",
            padding: 10,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: 8,
              background: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.04)",
              padding: "14px 16px",
              overflowY: "auto",
              boxSizing: "border-box",
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
              fontSize: 12,
              lineHeight: 1.75,
              color: isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.72)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              userSelect: "text",
            }}
          >
            {commentPreviewText}
          </div>
        </motion.div>

        {/* 控制胶囊 */}
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxSizing: "border-box",
            padding: PILL_OUTER_PAD,
            color: isDark ? "rgba(255,255,255,0.96)" : "rgba(0,0,0,0.78)",
            border: pillBase.border,
            borderRadius: pillBase.borderRadius,
            background: pillBase.background,
            boxShadow: pillBase.boxShadow,
            backdropFilter: pillBase.backdropFilter,
            WebkitBackdropFilter: pillBase.WebkitBackdropFilter,
          }}
        >
          <PillTextBtn onClick={() => setIsCommentPreviewOpen((prev) => !prev)} isDark={isDark} sx={{ paddingLeft: 20 }}>
            {commentCount} 条批注 {showCommentPreview ? <ChevronDown size={13} strokeWidth={2.1} /> : <ChevronUp size={13} strokeWidth={2.1} />}
          </PillTextBtn>
          <PillIconBtn title="复制批注" onClick={() => onCopyComments?.()} isDark={isDark}>
            <Copy size={13} strokeWidth={2.1} />
          </PillIconBtn>
          <PillIconBtn title="清空批注" onClick={() => onClearComments?.()} isDark={isDark}>
            <Trash2 size={13} strokeWidth={2.1} />
          </PillIconBtn>
        </div>
      </motion.div>

      <motion.div
        onClick={handlePillClick}
        initial={false}
        animate={{ width: isCollapsed ? COLLAPSED_W : "auto" }}
        transition={selectorWidthTransition}
          style={{
            ...pillBase,
            overflow: "hidden",
            padding: PILL_OUTER_PAD,
            cursor: isCollapsed ? "pointer" : "default",
            position: "relative",
            width: COLLAPSED_W,
            minWidth: COLLAPSED_W,
          }}
      >
        {/* 收起态内容 — 绝对定位叠加 */}
        <motion.div
          initial={false}
          animate={{
            opacity: isCollapsed ? 1 : 0,
          }}
          transition={collapsedContentTransition}
          style={{
            position: isCollapsed ? "relative" : "absolute",
            inset: isCollapsed ? undefined : 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            lineHeight: 1,
            padding: 0,
            cursor: "pointer",
            width: "100%",
            pointerEvents: isCollapsed ? "auto" : "none",
          }}
        >
          <MousePointerClick size={16} strokeWidth={2.2} />
          进入编辑模式
        </motion.div>

        {/* 展开态内容 — 固定结构，始终渲染 */}
        <motion.div
          initial={false}
          animate={{
            opacity: isCollapsed ? 0 : 1,
          }}
          transition={expandedContentTransition}
          style={{
            position: isCollapsed ? "absolute" : "relative",
            inset: isCollapsed ? 0 : undefined,
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: 0,
            whiteSpace: "nowrap",
            pointerEvents: isCollapsed ? "none" : "auto",
          }}
        >
          {/* 左侧操作区 — flex:1 占满剩余空间，内容居左 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              height: PILL_CONTROL_H,
              flex: 1,
              minWidth: 0,
            }}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={leftKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={selectorContentTransition}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  width: "100%",
                }}
              >
                {leftContent}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 右侧固定区 — 始终不动 */}
          <PillDivider isDark={isDark} />
          <PillIconBtn title={isDark ? "切换为亮色" : "切换为暗色"} onClick={() => onThemeToggle?.()} isDark={isDark}>
            {isDark ? <Sun size={14} strokeWidth={2.1} /> : <Moon size={14} strokeWidth={2.1} />}
          </PillIconBtn>
          <PillDivider isDark={isDark} />
          <PillIconBtn title="关闭" onClick={() => {
            if (isSelecting || isStyleSelecting || isEditing || isStyleEditing || isCommentSelecting || isCommentEditing) { (onClose ?? onExitEditing)(); }
            else { onExpandedChange(false); }
          }} isDark={isDark}>
            <X size={15} strokeWidth={2.2} />
          </PillIconBtn>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Alias for backwards compatibility
export { EditorSelectButton as MotionSelectButton };

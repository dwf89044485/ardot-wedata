"use client";

import React, { useState, useRef, useId, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Copy, Check, MousePointer, RotateCcw, X, MousePointerClick, Sun, Moon } from "lucide-react";

// ── Shared types (consumed by other components via re-export) ─────
export interface MotionParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  group: string;
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

export type MotionMode = "idle" | "motion-selecting" | "editing";
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
  onCommit,
}: {
  value: number;
  decimals: number;
  isDefault: boolean;
  isDark: boolean;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value.toFixed(decimals));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onCommit(parsed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
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
      title="点击编辑"
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
        cursor: "text",
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
}: MotionPanelProps) {
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    for (const p of schema) {
      if (!(p.group in init)) {
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
        panelBg: "rgba(15,18,24,0.86)",
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
        panelBg: "rgba(255,255,255,0.80)",
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
  };

  const getPercent = (param: MotionParamDef) =>
    ((config[param.key] - param.min) / (param.max - param.min)) * 100;

  const hasAnyChange = schema.some(
    (p) => config[p.key] !== defaultConfig[p.key]
  );

  const cls = `motion-slider-${sliderId.replace(/:/g, "")}`;

  // Build ordered groups from schema, preserving first-appearance order
  // Filter params by selectedState when param.states is defined
  const groups = useMemo(() => {
    const result: { label: string; params: MotionParamDef[]; linkedState?: string }[] = [];
    const map = new Map<string, MotionParamDef[]>();
    const stateMap = new Map<string, string | undefined>();
    for (const p of schema) {
      // Skip params that don't match current state
      if (p.states && selectedState && !p.states.includes(selectedState)) continue;
      let arr = map.get(p.group);
      if (!arr) {
        arr = [];
        map.set(p.group, arr);
        stateMap.set(p.group, p.linkedState);
        result.push({ label: p.group, params: arr, linkedState: p.linkedState });
      }
      arr.push(p);
    }
    return result;
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

  const generateCode = useMemo(() => {
    const fmt = (key: string) => {
      const p = schema.find((s) => s.key === key);
      if (!p) return String(config[key]);
      return p.step < 1 ? config[key].toFixed(2) : String(config[key]);
    };
    const lines = Object.keys(config).map((k) => `  ${k}: ${fmt(k)},`);
    return `// ${targetLabel} → config\nexport const config = {\n${lines.join("\n")}\n};`;
  }, [config, schema, targetLabel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

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
              display: "flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            {param.label}
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: colors.textMuted,
                fontFamily: "'Monaco', 'Menlo', monospace",
              }}
            >
              {param.key}
            </span>
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
              display: "flex",
              alignItems: "baseline",
              gap: 4,
            }}
          >
            {param.label}
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: colors.textMuted,
                fontFamily: "'Monaco', 'Menlo', monospace",
              }}
            >
              {param.key}/{pairKey}
            </span>
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

  return (
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
        drag
        dragControls={dragControls}
        dragListener={false}
        dragElastic={0.15}
        dragMomentum={false}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 300,
          borderRadius: 12,
          backgroundColor: colors.panelBg,
          backdropFilter: "blur(13px) saturate(90%)",
          WebkitBackdropFilter: "blur(13px) saturate(90%)",
          border: `1px solid ${colors.panelBorder}`,
          boxShadow: colors.panelShadow,
          overflow: "hidden",
          fontFamily: FONT,
          zIndex: 10,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: `1px solid ${colors.divider}`,
            userSelect: "none",
          }}
        >
          <span
            onPointerDown={(e) => {
              dragControls.start(e);
            }}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.textPrimary,
              cursor: "grab",
            }}
          >
            {targetLabel}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {hasAnyChange && (
              <button
                onClick={handleResetAll}
                title="全部重置为默认值"
                style={{
                  width: 20,
                  height: 20,
                  border: "none",
                  background: colors.buttonBg,
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  flexShrink: 0,
                  color: colors.buttonText,
                  transition: "all 100ms",
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
                <RotateCcw size={12} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 20,
                height: 20,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                color: colors.textTertiary,
                borderRadius: 4,
                transition: "color 100ms, background 100ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.buttonTextHover;
                e.currentTarget.style.background = colors.buttonBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textTertiary;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          </div>
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
                padding: 6,
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
          {groups.map((group) => {
            const singleGroup = groups.length === 1;
            const isGroupCollapsed = singleGroup ? false : (collapsedGroups[group.label] ?? true);
            return (
              <div
                key={group.label}
                style={{ borderBottom: singleGroup ? undefined : `1px solid ${colors.dividerSoft}` }}
              >
                {!singleGroup && (
                <button
                  onClick={() => toggleGroup(group.label, group.linkedState)}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.textTertiary,
                    fontFamily: FONT,
                    transition: "background 100ms",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = colors.dividerSoft)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      display: "inline-block",
                      transition: "transform 200ms",
                      transform: isGroupCollapsed
                        ? "rotate(0deg)"
                        : "rotate(90deg)",
                      fontSize: 9,
                    }}
                  >
                    ▶
                  </span>
                  <span>{group.label}</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: colors.textMuted,
                      fontWeight: 400,
                    }}
                  >
                    {group.params.length}
                  </span>
                </button>
                )}

                {singleGroup ? (
                  <div
                    style={{
                      padding: "6px 12px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {group.params.map(renderParam)}
                  </div>
                ) : (
                <AnimatePresence>
                  {!isGroupCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      style={{ overflow: "hidden" }}
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Code section ── */}
        <div style={{ borderTop: `1px solid ${colors.divider}` }}>
          <button
            onClick={() => setIsCodeExpanded(!isCodeExpanded)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              color: colors.textTertiary,
              fontFamily: FONT,
              transition: "background 100ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = colors.dividerSoft)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <span
              style={{
                display: "inline-block",
                transition: "transform 200ms",
                transform: isCodeExpanded
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
                fontSize: 10,
              }}
            >
              ▶
            </span>
            <span>代码</span>
          </button>

          <AnimatePresence>
            {isCodeExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    padding: "8px 12px 10px",
                    backgroundColor: colors.codeBg,
                    borderTop: `1px solid ${colors.dividerSoft}`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: "'Monaco', 'Menlo', monospace",
                      color: colors.textMuted,
                      marginBottom: 6,
                      lineHeight: 1,
                    }}
                  >
                    {targetLabel} → config
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontFamily:
                        "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                      color: colors.textSecondary,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      paddingRight: 32,
                    }}
                  >
                    {generateCode}
                  </pre>

                  <button
                    onClick={handleCopy}
                    title={copyFeedback ? "已复制" : "复制代码"}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 26,
                      height: 26,
                      border: "none",
                      background: copyFeedback
                        ? "rgba(34,197,94,0.1)"
                        : colors.buttonBg,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: copyFeedback
                        ? "#22C55E"
                        : colors.buttonText,
                      transition: "all 150ms",
                    }}
                    onMouseEnter={(e) =>
                      !copyFeedback &&
                      (e.currentTarget.style.background =
                        colors.buttonBgHover)
                    }
                    onMouseLeave={(e) =>
                      !copyFeedback &&
                      (e.currentTarget.style.background = copyFeedback
                        ? "rgba(34,197,94,0.1)"
                        : colors.buttonBg)
                    }
                  >
                    {copyFeedback ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// ── EditorSelectButton (right-bottom toggle) ───────────────────────
interface EditorSelectButtonProps {
  mode: MotionMode;
  theme?: MotionTheme;
  onToggle: () => void;      // idle → selecting
  onReselect: () => void;    // editing → selecting
  onThemeToggle?: () => void;
  onClose: () => void;       // any non-idle → idle
}

/* shared pill style */
const pillBase: React.CSSProperties = {
  height: 44,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "linear-gradient(180deg, rgba(24,27,34,0.96) 0%, rgba(10,12,16,0.97) 100%)",
  boxShadow:
    "0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(255,255,255,0.04)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.96)",
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: "nowrap" as const,
  fontFamily: "inherit",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

export function EditorSelectButton({
  mode,
  theme = "dark",
  onToggle,
  onReselect,
  onThemeToggle,
  onClose,
}: EditorSelectButtonProps) {
  const isIdle = mode === "idle";
  const isSelecting = mode === "motion-selecting";
  const isEditing = mode === "editing";
  const isDark = theme === "dark";
  const buttonTransition = { duration: 0.24, ease: EASE };

  // selecting / editing 状态下的文案
  const label = isSelecting ? "请先选择组件" : isEditing ? "重新选择" : "编辑动效";
  const suppressClickRef = useRef(false);

  const handleDragStart = useCallback(() => {
    suppressClickRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const handleMainButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isIdle) {
      onToggle();
    }
  }, [isIdle, onToggle]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        zIndex: 50,
        justifyContent: "flex-end",
        touchAction: "none",
        cursor: "grab",
      }}
    >
      <motion.button
        onClick={handleMainButtonClick}
        initial={false}
        animate={{
          width: isIdle ? 110 : isEditing ? 196 : 160,
          paddingLeft: isIdle ? 12 : 6,
          paddingRight: isIdle ? 12 : 6,
        }}
        transition={buttonTransition}
        style={{
          ...pillBase,
          overflow: "hidden",
          cursor: isIdle ? "pointer" : "default",
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          {isIdle ? (
            <motion.span
              key="edit-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={buttonTransition}
              style={{
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MousePointerClick size={16} strokeWidth={2.2} />
              编辑动效
            </motion.span>
          ) : (
            <motion.span
              key={`${mode}-label`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={buttonTransition}
              style={{
                width: "100%",
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: isEditing ? 2 : 6,
              }}
            >
              <span
                onClick={isEditing
                  ? (e) => {
                      e.stopPropagation();
                      onReselect();
                    }
                  : undefined}
                onMouseEnter={(e) => {
                  if (!isEditing) return;
                  e.currentTarget.style.color = "rgba(255,255,255,1)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                }}
                onMouseLeave={(e) => {
                  if (!isEditing) return;
                  e.currentTarget.style.color = "rgba(255,255,255,0.94)";
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: isEditing ? 6 : 0,
                  marginLeft: 0,
                  marginRight: 0,
                  paddingLeft: isEditing ? 6 : 0,
                  paddingRight: isEditing ? 10 : 0,
                  cursor: isEditing ? "pointer" : "default",
                  userSelect: "none",
                  letterSpacing: "0.01em",
                  fontSize: 13,
                  fontWeight: 500,
                  color: isSelecting ? "rgba(255,255,255,0.64)" : "rgba(255,255,255,0.94)",
                  textAlign: "center",
                  transition: "color 120ms, background 120ms",
                  height: 28,
                  background: "transparent",
                  borderRadius: 14,
                }}
              >
                {isEditing && <MousePointerClick size={16} strokeWidth={2.2} />}
                <span>{label}</span>
              </span>
              {isEditing && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeToggle?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onThemeToggle?.();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title={isDark ? "切换为亮色" : "切换为暗色"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    cursor: onThemeToggle ? "pointer" : "default",
                    transition: "background 120ms, opacity 120ms, transform 120ms",
                    transform: "scale(1)",
                    opacity: 0.96,
                    flexShrink: 0,
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!onThemeToggle) return;
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                    e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.96";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {isDark ? <Sun size={14} strokeWidth={2.1} /> : <Moon size={14} strokeWidth={2.1} />}
                </span>
              )}
              <span
                style={{
                  width: 1,
                  height: 20,
                  background: "rgba(255,255,255,0.22)",
                  marginLeft: isEditing ? 4 : 0,
                  marginRight: 4,
                  flexShrink: 0,
                }}
              />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  cursor: "pointer",
                  transition: "background 120ms, opacity 120ms, transform 120ms",
                  transform: "scale(1)",
                  opacity: 0.96,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.96";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <X size={15} strokeWidth={2.2} />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

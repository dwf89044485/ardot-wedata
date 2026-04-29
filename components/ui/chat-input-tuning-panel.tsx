"use client";

import { useControls, folder, button, Leva } from "leva";
import { useState, useEffect, useCallback } from "react";

// ── Default values extracted from claude-style-chat-input.tsx ──
const DEFAULTS = {
  // Layout
  paddingTop: 16,
  innerPaddingX: 24,
  innerCornerRadius: 24,
  borderCornerRadius: 25,
  borderPaddingActive: 1.5,
  borderPaddingIdle: 1,
  cornerSmoothing: 1,
  preserveSmoothing: true,
  activeMinHeight: 88,

  // Bottom bar
  barPadding: 16,
  barHeight: 32,
  barGap: 8,
  barBtnBorderRadius: 20,

  // Border animation
  borderRotateDuration: 4,

  // Glow
  glowBlur: 32,
  glowOpacity: 1,
  glowSpread: -30,
  shadowOffsetX: 0,
  shadowOffsetY: 6,

  // Shadow
  defaultShadowOpacity: 1,

  // Textarea
  textareaFontSize: 16,
  textareaLineHeight: 24,
  textareaCaretColor: "#1664FF",
  textareaMaxHeight: 320,

  // Placeholder shimmer
  shimmerDuration: 5,

  // Colors
  innerBg: "#FFFFFF",
  borderColorIdle: "#DFE2E8",
  textColor: "rgba(0,0,0,0.9)",
  sendBtnBgActive: "#1D2129",
  sendBtnBgIdle: "#E8EAED",
};

type TuningValues = typeof DEFAULTS;

/**
 * Export current values in LLM-friendly format
 */
function copyForLLM(values: TuningValues) {
  const changes = Object.entries(values)
    .filter(([key, val]) => {
      const defaultVal = DEFAULTS[key as keyof TuningValues];
      const numVal = Number(val);
      const numDefault = Number(defaultVal);
      if (!isNaN(numVal) && !isNaN(numDefault)) {
        return Math.abs(numVal - numDefault) > 0.001;
      }
      return val !== defaultVal;
    })
    .map(([key, val]) => ({
      key,
      from: DEFAULTS[key as keyof TuningValues],
      to: val,
    }));

  const markdown = `## Tuned Parameters for ChatInput

### Layout
\`\`\`typescript
const layout = {
  paddingTop: ${values.paddingTop},
  innerPaddingX: ${values.innerPaddingX},
  innerCornerRadius: ${values.innerCornerRadius},
  borderCornerRadius: ${values.borderCornerRadius},
  borderPaddingActive: ${values.borderPaddingActive},
  borderPaddingIdle: ${values.borderPaddingIdle},
  cornerSmoothing: ${values.cornerSmoothing},
  activeMinHeight: ${values.activeMinHeight},
};
\`\`\`

### Bottom Bar
\`\`\`typescript
const bar = {
  padding: ${values.barPadding},
  height: ${values.barHeight},
  gap: ${values.barGap},
  btnBorderRadius: ${values.barBtnBorderRadius},
};
\`\`\`

### Border Animation
\`\`\`typescript
const border = {
  rotateDuration: ${values.borderRotateDuration},
  colorIdle: '${values.borderColorIdle}',
};
\`\`\`

### Glow Effect
\`\`\`typescript
const glow = {
  blur: ${values.glowBlur},
  opacity: ${values.glowOpacity},
  spread: ${values.glowSpread},
  offsetX: ${values.shadowOffsetX},
  offsetY: ${values.shadowOffsetY},
};
\`\`\`

### Shadow
\`\`\`typescript
const shadow = {
  defaultOpacity: ${values.defaultShadowOpacity},
};
\`\`\`

### Textarea
\`\`\`typescript
const textarea = {
  fontSize: ${values.textareaFontSize},
  lineHeight: ${values.textareaLineHeight},
  caretColor: '${values.textareaCaretColor}',
  maxHeight: ${values.textareaMaxHeight},
};
\`\`\`

### Placeholder Shimmer
\`\`\`typescript
const shimmer = {
  duration: ${values.shimmerDuration},
};
\`\`\`

### Colors
\`\`\`typescript
const colors = {
  innerBg: '${values.innerBg}',
  borderColorIdle: '${values.borderColorIdle}',
  textColor: '${values.textColor}',
  sendBtnBgActive: '${values.sendBtnBgActive}',
  sendBtnBgIdle: '${values.sendBtnBgIdle}',
};
\`\`\`

### Changes from Defaults
${changes.length > 0
    ? changes.map((c) => `- **${c.key}**: \`${c.from}\` → \`${c.to}\``).join("\n")
    : "_No changes from defaults_"}
`;

  navigator.clipboard.writeText(markdown);
  console.log("[TuningPanel] Copied to clipboard");
}

/**
 * ChatInput Tuning Panel — Leva-based visual parameter editor.
 *
 * Usage:
 *   <ChatInputTuningPanel onValuesChange={setTuningValues} />
 *
 * Toggle with ⌘⇧D. Only active in development mode.
 */
export default function ChatInputTuningPanel({
  onValuesChange,
}: {
  onValuesChange: (values: Partial<TuningValues>) => void;
}) {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "d") {
        e.preventDefault();
        setShowPanel((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isDev = process.env.NODE_ENV === "development";

  const values = useControls(
    {
      layout: folder(
        {
          paddingTop: { value: DEFAULTS.paddingTop, min: 0, max: 40, step: 1 },
          innerPaddingX: { value: DEFAULTS.innerPaddingX, min: 8, max: 48, step: 2 },
          innerCornerRadius: { value: DEFAULTS.innerCornerRadius, min: 0, max: 40, step: 0.5 },
          borderCornerRadius: { value: DEFAULTS.borderCornerRadius, min: 0, max: 40, step: 0.5 },
          borderPaddingActive: { value: DEFAULTS.borderPaddingActive, min: 0.5, max: 4, step: 0.25 },
          borderPaddingIdle: { value: DEFAULTS.borderPaddingIdle, min: 0.5, max: 4, step: 0.25 },
          cornerSmoothing: { value: DEFAULTS.cornerSmoothing, min: 0, max: 1, step: 0.05 },
          preserveSmoothing: DEFAULTS.preserveSmoothing,
          activeMinHeight: { value: DEFAULTS.activeMinHeight, min: 40, max: 200, step: 4 },
        },
        { collapsed: false }
      ),

      "bottom bar": folder(
        {
          barPadding: { value: DEFAULTS.barPadding, min: 4, max: 32, step: 2 },
          barHeight: { value: DEFAULTS.barHeight, min: 20, max: 48, step: 2 },
          barGap: { value: DEFAULTS.barGap, min: 0, max: 16, step: 1 },
          barBtnBorderRadius: { value: DEFAULTS.barBtnBorderRadius, min: 8, max: 32, step: 1 },
        },
        { collapsed: true }
      ),

      "border anim": folder(
        {
          borderRotateDuration: { value: DEFAULTS.borderRotateDuration, min: 0.5, max: 12, step: 0.1 },
          borderColorIdle: DEFAULTS.borderColorIdle,
        },
        { collapsed: false }
      ),

      glow: folder(
        {
          glowBlur: { value: DEFAULTS.glowBlur, min: 0, max: 100, step: 1 },
          glowOpacity: { value: DEFAULTS.glowOpacity, min: 0, max: 1, step: 0.05 },
          glowSpread: { value: DEFAULTS.glowSpread, min: -50, max: 30, step: 1 },
          shadowOffsetX: { value: DEFAULTS.shadowOffsetX, min: -30, max: 30, step: 1 },
          shadowOffsetY: { value: DEFAULTS.shadowOffsetY, min: -30, max: 30, step: 1 },
        },
        { collapsed: false }
      ),

      shadow: folder(
        {
          defaultShadowOpacity: { value: DEFAULTS.defaultShadowOpacity, min: 0, max: 1, step: 0.05 },
        },
        { collapsed: true }
      ),

      textarea: folder(
        {
          textareaFontSize: { value: DEFAULTS.textareaFontSize, min: 12, max: 24, step: 1 },
          textareaLineHeight: { value: DEFAULTS.textareaLineHeight, min: 16, max: 36, step: 1 },
          textareaCaretColor: DEFAULTS.textareaCaretColor,
          textareaMaxHeight: { value: DEFAULTS.textareaMaxHeight, min: 100, max: 600, step: 20 },
        },
        { collapsed: true }
      ),

      shimmer: folder(
        {
          shimmerDuration: { value: DEFAULTS.shimmerDuration, min: 1, max: 15, step: 0.5 },
        },
        { collapsed: true }
      ),

      colors: folder(
        {
          innerBg: DEFAULTS.innerBg,
          textColor: DEFAULTS.textColor,
          sendBtnBgActive: DEFAULTS.sendBtnBgActive,
          sendBtnBgIdle: DEFAULTS.sendBtnBgIdle,
        },
        { collapsed: true }
      ),

      "Copy for LLM": button(() => copyForLLM(values as unknown as TuningValues)),
      "Reset All": button(() => window.location.reload()),
    },
    [showPanel] // re-create when panel visibility toggles
  );

  // Notify parent whenever values change
  const notifyParent = useCallback(() => {
    onValuesChange(values as unknown as Partial<TuningValues>);
  }, [values, onValuesChange]);

  useEffect(() => {
    notifyParent();
  }, [notifyParent]);

  if (!isDev) return null;

  return (
    <>
      <Leva
        hidden={!showPanel}
        collapsed={false}
        oneLineLabels={false}
        flat={false}
        titleBar={{ title: "Chat Input Tuning" }}
      />
      {/* Dev hint */}
      {!showPanel && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            padding: "8px 12px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "monospace",
            zIndex: 9999,
          }}
        >
          ⌘⇧D to tune
        </div>
      )}
    </>
  );
}

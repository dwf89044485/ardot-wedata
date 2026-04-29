# MotionTargetOverlay: Quick Reference Card

## Copy-Paste Integration Template

### For New Component (my-button.tsx)

```typescript
import type { MotionTargetDef } from "@/components/ui/motion-panel";

// 1. Define motion schema
export const MY_BUTTON_MOTION: MotionTargetDef = {
  id: "my-button",
  label: "My Button Motion",
  schema: [
    { key: "hoverScale", label: "Hover Scale", min: 1, max: 1.5, step: 0.05, group: "Hover" },
    { key: "hoverDuration", label: "Hover Duration", min: 0.1, max: 0.5, step: 0.05, group: "Animation" },
  ],
  defaultConfig: { hoverScale: 1.1, hoverDuration: 0.2 },
};

// 2. Component receives config
interface MyButtonProps {
  config?: Record<string, number>;
  previewState?: string;
}

export function MyButton({ config = MY_BUTTON_MOTION.defaultConfig, previewState }: MyButtonProps) {
  // Use config in styles or animations
  return <button style={{ transform: `scale(${config.hoverScale})` }}>Click me</button>;
}
```

### For page.tsx

```typescript
// 1. Add import
import { MyButton, MY_BUTTON_MOTION } from "@/components/ui/my-button";

// 2. Add state (near other motion states ~line 111)
const [myButtonConfig, setMyButtonConfig] = useState(MY_BUTTON_MOTION.defaultConfig);

// 3a. Wrap component with overlay (wherever it appears)
<MotionTargetOverlay
  targetId="my-button"
  targetLabel={MY_BUTTON_MOTION.label}
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <MyButton config={myButtonConfig} previewState={motionMode === "editing" && motionTarget === "my-button" ? "editing" : undefined} />
</MotionTargetOverlay>

// 3b. Add MotionPanel inside AnimatePresence (near line 416)
{motionMode === "editing" && motionTarget === "my-button" && (
  <MotionPanel
    targetLabel={MY_BUTTON_MOTION.label}
    schema={MY_BUTTON_MOTION.schema}
    config={myButtonConfig}
    defaultConfig={MY_BUTTON_MOTION.defaultConfig}
    onChange={(c) => setMyButtonConfig(c)}
    onClose={handleMotionPanelClose}
  />
)}
```

---

## Key Constants Reference

### Design Tokens (from motion-target-overlay.tsx)

```typescript
// Color
const BLUE = "22, 100, 255";
const BORDER_IDLE = "1.5px dashed rgba(22, 100, 255, 0.35)";
const BORDER_HOVER = "1.5px dashed rgba(22, 100, 255, 0.6)";
const BG_IDLE = "rgba(22, 100, 255, 0.04)";
const BG_HOVER = "rgba(22, 100, 255, 0.08)";
const LABEL_BG = "rgba(22, 100, 255, 0.85)";

// Timing
const SAMPLE_MS = 600;  // How long to measure
const PAD = 12;         // Padding around bounds

// Transitions
transition: "border 220ms, background 220ms, box-shadow 220ms, ..."
```

---

## Schema Definition (MotionParamDef)

```typescript
{
  key: "paramName",           // Object key (e.g. "hoverScale")
  label: "Display Label",     // Shown in MotionPanel (e.g. "Hover Scale")
  min: 0,                     // Slider minimum
  max: 100,                   // Slider maximum
  step: 1,                    // Increment per click
  group: "Group Name"         // Section header (e.g. "Hover Effects")
}
```

**Example params from existing components:**

```
Agent Cards:
  { key: "overlapX", label: "卡片重叠", min: -50, max: 0, step: 1, group: "扇形布局" }
  { key: "rotateOuter", label: "外侧卡旋转", min: -45, max: 45, step: 1, group: "扇形角度" }
  
Chat Input:
  { key: "borderRotateDuration", label: "边框旋转时长", min: 0.5, max: 12, step: 0.1, group: "边框动画" }
  { key: "glowOpacity", label: "光晕透明度", min: 0, max: 1, step: 0.05, group: "光晕" }
```

---

## State Machine: Motion Modes

```
Type: "idle" | "motion-selecting" | "editing"

IDLE
  └─ Button click → SELECTING

SELECTING
  ├─ Overlay click → EDITING
  └─ Button click → IDLE

EDITING
  ├─ Panel close (✕) → IDLE
  └─ Button click → IDLE
```

---

## Common Parameter Ranges

| Type | Min | Max | Step | Example |
|------|-----|-----|------|---------|
| Duration (s) | 0.1 | 2.0 | 0.05 | 0.3 |
| Scale | 0.5 | 2.0 | 0.1 | 1.2 |
| Opacity | 0 | 1 | 0.05 | 0.8 |
| Angle (°) | -180 | 180 | 1 | 45 |
| Distance (px) | 0 | 100 | 1 | 24 |
| Blur (px) | 0 | 64 | 1 | 12 |
| Offset | -50 | 50 | 1 | -8 |

---

## Debugging Tips

### Overlay not appearing?
```typescript
// Check 1: isSelecting prop
console.log("motionMode:", motionMode);  // Should be "motion-selecting"

// Check 2: targetId matches
console.log("MotionTargetOverlay targetId:", "my-button");
console.log("MotionTargetDef.id:", MY_BUTTON_MOTION.id);  // Must match

// Check 3: Component is wrapped
// Verify: <MotionTargetOverlay> wraps <MyButton>
```

### Overlay bounds wrong?
```typescript
// The measurement runs in useEffect for 600ms
// During this time, avoid animations > 500ms
// Or extend SAMPLE_MS constant

// Check child elements don't have overflow: hidden
// which could clip descendant measurements
```

### Slider not updating component?
```typescript
// Check: config prop passed to component
<MyButton config={myButtonConfig} />

// Check: Component actually uses config
export function MyButton({ config }) {
  return <button style={{ transform: `scale(${config.hoverScale})` }} />;
}

// Check: onChange fires
onChange={(c) => setMyButtonConfig(c)}
console.log("config updated:", c);
```

---

## MotionTargetOverlay Props

```typescript
interface MotionTargetOverlayProps {
  targetId: string;              // Unique ID
  targetLabel: string;           // Label pill text
  isSelecting: boolean;          // Show overlay?
  onSelect: (id: string) => void; // Click handler
  children: React.ReactNode;     // Wrapped component
}
```

**Required:** All props are required.

**Typical usage:**
```typescript
<MotionTargetOverlay
  targetId="agent-cards"
  targetLabel="Agent 卡片动效"
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <AgentFanCards config={fanConfig} />
</MotionTargetOverlay>
```

---

## File Locations

```
Source Files:
  /components/ui/motion-target-overlay.tsx    (169 lines)
  /components/ui/motion-panel.tsx             (exported types)
  /app/page.tsx                               (integration point)

Example Components:
  /components/ui/agent-card.tsx               (AGENT_CARD_MOTION)
  /components/ui/claude-style-chat-input.tsx (CHAT_INPUT_MOTION)

Documentation:
  /docs/motion-editor-system.md               (system architecture)
```

---

## Measurement Algorithm (Simplified)

```
When isSelecting becomes true:
  1. Start 600ms loop with requestAnimationFrame
  2. Each frame:
     a. Measure all child elements with getBoundingClientRect()
     b. Calculate bounding box (min/max x/y)
     c. Union with previous bounds (keep growing, never shrinking during 600ms)
     d. If bounds changed, update state → re-render overlay border
  3. After 600ms, stop measuring
  4. When isSelecting becomes false, cleanup timer

Result: Overlay border smoothly expands to fit animated component
```

---

## Z-Index Layers

```
Top (highest):     3  ← Label pill
                   2  ← Decorative border + background
                   1  ← Interaction layer (clicks)
Bottom (lowest):   0  ← Your component (children)
```

All z-indices relative to parent container (position: relative).

---

## Checklist: New Component Ready?

- [ ] MotionTargetDef exported with id, label, schema, defaultConfig
- [ ] Component receives `config` prop and uses it
- [ ] `page.tsx` imports component + MotionTargetDef
- [ ] State added: `const [myConfig, setMyConfig] = useState(...)`
- [ ] Component wrapped with `<MotionTargetOverlay>`
- [ ] `<MotionPanel>` condition added to `<AnimatePresence>`
- [ ] `onChange={(c) => setMyConfig(c)}` passed to MotionPanel
- [ ] `npx tsc --noEmit` runs with zero errors
- [ ] `npm run build` succeeds
- [ ] Overlay appears when clicking motion button in "motion-selecting" mode
- [ ] Clicking overlay switches to "editing" mode
- [ ] Panel appears in editing mode
- [ ] Slider changes update component in real-time


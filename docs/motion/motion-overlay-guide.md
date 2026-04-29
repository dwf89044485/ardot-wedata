# MotionTargetOverlay Component: Complete Technical Guide

## Overview

`MotionTargetOverlay` is a wrapper component that enables any element to be selected and visually highlighted in the Motion Editor system. It provides:

1. **Visual Selection Feedback** — Blue dashed outline when in "motion-selecting" mode
2. **Click Detection** — Transparent interactive layer to capture clicks
3. **Bounds Measurement** — Automatic detection of component visual extent (handles transforms)
4. **Label Pill** — Floating label showing component name on hover
5. **Zero Configuration** — No setup needed for new components using it

---

## Architecture: Four-Layer Design

The overlay wraps components in a four-layer structure:

```
<MotionTargetOverlay>
  ① <div ref={contentRef} pointerEvents="none">
       {children}  ← Your actual component
     </div>
  ② <div onClick={handleClick} />  ← Interactive layer
  ③ <div border="dashed" />         ← Visual border + background
  ④ <AnimatePresence>{label}</AnimatePresence>  ← Label pill
</MotionTargetOverlay>
```

### Layer Details

| Layer | Purpose | Key Properties |
|-------|---------|-----------------|
| ① Content | Measurement anchor | `ref={contentRef}`, `pointerEvents="none"` during motion-selecting |
| ② Interaction | Click detection | `position: absolute`, `cursor: "pointer"`, `zIndex: 1` |
| ③ Decoration | Visual feedback | Dashed border, background fill, shadow, `zIndex: 2` |
| ④ Label | Context label | `Framer Motion` animated pill, `zIndex: 3` |

---

## Measurement Algorithm

### Problem
Motion-animated components often have visual extent beyond their CSS box model (rotation, scaling, translation). A single `getBoundingClientRect()` snapshot can miss the full range.

### Solution: Union-Based Sampling

```typescript
function measure(root: HTMLElement): Bounds {
  const rr = root.getBoundingClientRect();
  let minX = 0, minY = 0, maxX = rr.width, maxY = rr.height;

  // Iterate all descendants
  root.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;  // Skip hidden/collapsed
    
    const l = r.left - rr.left, t = r.top - rr.top;
    minX = Math.min(minX, l);
    minY = Math.min(minY, t);
    maxX = Math.max(maxX, l + r.width);
    maxY = Math.max(maxY, t + r.height);
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
```

### Sampling Loop
```typescript
// Run 600ms at 60fps (36 frames total)
const SAMPLE_MS = 600;
const start = performance.now();

const sample = () => {
  const next = union(accum, measure(contentRef.current));
  
  // Only update state if bounds actually changed
  if (boundsChanged(next, accum)) {
    accum = next;
    setBounds({ ...accum });
  }
  
  if (performance.now() - start < SAMPLE_MS) {
    raf = requestAnimationFrame(sample);
  }
};

raf = requestAnimationFrame(sample);
```

**Why 600ms?** Captures framer-motion animations which typically take 0.3-0.5s. Provides buffer for staggered animations.

### Result
The overlay's visible bounds expand smoothly to encompass the entire animated component as it moves, scales, or rotates.

---

## Visual Design Tokens

### Color System

**Design DNA: Secondary Blue #1664FF → rgb(22, 100, 255)**

```typescript
const BLUE = "22, 100, 255";

const BORDER_IDLE = `1.5px dashed rgba(${BLUE}, 0.35)`;     // 35% opacity
const BORDER_HOVER = `1.5px dashed rgba(${BLUE}, 0.6)`;     // 60% opacity

const BG_IDLE = `rgba(${BLUE}, 0.04)`;                      // Very subtle fill
const BG_HOVER = `rgba(${BLUE}, 0.08)`;                     // Slightly darker

const SHADOW_HOVER = `0 2px 12px rgba(${BLUE}, 0.12)`;      // Soft glow

const LABEL_BG = `rgba(${BLUE}, 0.85)`;                     // Opaque for label
```

### Spacing & Geometry

```typescript
const PAD = 12;  // Padding around component bounds

// Offset calculation
const oT = bounds.top - PAD;          // top: negative moves up
const oR = -(bounds.right + PAD);     // right: inverted for margin
const oB = -(bounds.bottom + PAD);    // bottom: inverted for margin
const oL = bounds.left - PAD;         // left: negative moves left
```

### Animation Timing

```typescript
// All transitions smooth over 220ms
transition: "border 220ms, background 220ms, box-shadow 220ms, top 200ms, right 200ms, bottom 200ms, left 200ms"

// Label pill: framer-motion
initial={{ opacity: 0, y: 6 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 6 }}
transition={{ duration: 0.15, ease: "easeOut" }}
```

---

## Integration in page.tsx

### 1. Agent Cards Example (Line 495)

```typescript
<MotionTargetOverlay
  targetId="agent-cards"
  targetLabel={AGENT_CARD_MOTION.label}
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <AgentFanCards
    config={fanConfig}
    previewState={motionMode === "editing" && motionTarget === "agent-cards" ? agentCardPreviewState : undefined}
    onSkillClick={handleSkillClick}
    onSummon={handleSummon}
  />
</MotionTargetOverlay>
```

**Props mapping:**
- `targetId="agent-cards"` — Must match `MotionTargetDef.id` from `agent-card.tsx`
- `targetLabel={AGENT_CARD_MOTION.label}` — Displayed in the label pill ("Agent 卡片动效")
- `isSelecting={motionMode === "motion-selecting"}` — Controls visibility of overlay UI
- `onSelect={handleMotionSelect}` — Callback → sets `motionTarget="agent-cards"` → switches to editing mode

### 2. Chat Input Example (Line 655)

```typescript
<MotionTargetOverlay
  targetId="chat-input"
  targetLabel={CHAT_INPUT_MOTION.label}
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <ClaudeChatInput
    ref={chatInputRef}
    placeholder={...}
    skills={chatPhase === "welcome" ? activeSkills : []}
    config={chatInputConfig}
    previewState={motionMode === "editing" && motionTarget === "chat-input" ? chatInputPreviewState : undefined}
  />
</MotionTargetOverlay>
```

**Key pattern:** The `previewState` prop is set conditionally based on whether that component is currently being edited.

---

## State Machine Integration

### Mode Transitions

```
         Click button              Click component              Click ✕
  idle ────────────────► motion-selecting ─────────────────► editing ────────► idle
   ▲                         │                                         ▲
   │                         │ Click ✕                                 │
   └─────────────────────────┘                                         │
                                      Click ✕ ──────────────────────┘
```

### Event Handlers in page.tsx

```typescript
// ① Button click: idle ↔ motion-selecting/editing
const handleMotionButtonClick = useCallback(() => {
  if (motionMode === "idle") {
    setMotionMode("motion-selecting");  // Enter motion-selecting mode
  } else {
    // Reset everything
    setMotionMode("idle");
    setMotionTarget(null);
    setAgentCardPreviewState((AGENT_CARD_MOTION.defaultState as AgentCardPreviewState) ?? "default");
    setChatInputPreviewState((CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState) ?? "default");
  }
}, [motionMode]);

// ② Click on overlay component: motion-selecting → editing
const handleMotionSelect = useCallback((targetId: string) => {
  setMotionTarget(targetId);      // "agent-cards" or "chat-input"
  setMotionMode("editing");       // Switch to editing
}, []);

// ③ Close panel: editing → idle
const handleMotionPanelClose = useCallback(() => {
  setMotionMode("idle");
  setMotionTarget(null);
  setAgentCardPreviewState((AGENT_CARD_MOTION.defaultState as AgentCardPreviewState) ?? "default");
  setChatInputPreviewState((CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState) ?? "default");
}, []);
```

---

## MotionTargetOverlay Props Reference

```typescript
interface MotionTargetOverlayProps {
  targetId: string;              // Unique identifier ("agent-cards", "chat-input")
  targetLabel: string;           // Human-readable name for label pill
  isSelecting: boolean;          // Controls overlay visibility (true = show, false = hide)
  onSelect: (targetId: string) => void;  // Fired when user clicks on overlay
  children: React.ReactNode;     // The component being wrapped
}
```

### Render Behavior

| isSelecting | Content | Interaction Layer | Border | Label |
|-------------|---------|-------------------|--------|-------|
| false       | visible | hidden            | hidden | hidden |
| true/hovering | pointerEvents: "none" | visible | dashed border, idle style | visible |
| true/hovered | pointerEvents: "none" | visible | dashed border, hover style | animated pill |

---

## Common Issues & Solutions

### Issue 1: Overlay border expands unexpectedly

**Cause:** `ref` placed on outer container, `querySelectorAll("*")` measures overlay's own layers.

**Solution:** Place `ref` only on content wrapper:
```typescript
<div ref={contentRef} style={{ pointerEvents: "none" }}>
  {children}
</div>
```

### Issue 2: Animation bounds captured before they fully expand

**Cause:** Single rAF sample too early, component still animating in.

**Solution:** 600ms sampling window catches framer-motion's typical 0.3-0.5s animation:
```typescript
const SAMPLE_MS = 600;
```

### Issue 3: Child elements intercept clicks

**Cause:** Child's `pointerEvents: "auto"` override.

**Solution:** Use `pointerEvents: "none"` on content layer + independent interaction layer:
```typescript
<div ref={contentRef} style={{ pointerEvents: isSelecting ? "none" : "auto" }}>
```

### Issue 4: Label pill cuts off at screen edge

**Cause:** Label positioned absolutely without viewport constraints.

**Solution:** (Currently not handled) Could add clamping logic in future version.

---

## Performance Considerations

### Memory
- Per overlay: 1 ref + 1 state (Bounds object with 4 properties)
- Measurement function: O(n) where n = descendant count
- No retained memory after unmount

### CPU
- 600ms sampling: ~36 frames at 60fps = 36 measure() calls
- measure() iterates all descendants: typically 5-50 elements for UI components
- 36 × 50 = ~1800 DOM queries total per component—acceptable for editing mode

### GPU
- Border and background: GPU-accelerated via CSS transitions
- Label pill: Framer Motion handles 60fps smoothly
- No canvas/WebGL overhead

### Optimization Tips
- Only one overlay should be in "motion-selecting" mode at a time
- Sampling stops after 600ms, doesn't loop indefinitely
- `setBounds` only updates when bounds actually change (not every frame)

---

## Extension Points

### Add Keyboard Shortcuts
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isSelecting) onSelect(null);
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isSelecting, onSelect]);
```

### Custom Styling per Component
```typescript
// Pass styles as prop
interface MotionTargetOverlayProps {
  // ... existing props ...
  styles?: {
    borderColor?: string;
    labelBgColor?: string;
    borderWidth?: number;
  };
}
```

### Nested Overlay Support
Currently assumes single-level wrapping. To support nested overlays:
- Add `depth` prop to z-index calculation
- Adjust padding based on nesting level
- Modify measurement to exclude nested overlay layers

---

## Design System Integration

### Related Components
- **MotionPanel** (`motion-panel.tsx`) — Parameter adjustment UI
- **EditorSelectButton** (`motion-panel.tsx`) — Mode toggle button
- **AgentFanCards** (`agent-card.tsx`) — First example component
- **ClaudeChatInput** (`claude-style-chat-input.tsx`) — Second example component

### Token Reuse
All colors derive from Design DNA secondary blue. To change color scheme:

```typescript
// In motion-target-overlay.tsx
const BLUE = "22, 100, 255";  // Change this

// Regenerated values
const BORDER_IDLE = `1.5px dashed rgba(${BLUE}, 0.35)`;
const BG_IDLE = `rgba(${BLUE}, 0.04)`;
// etc.
```

---

## Testing Checklist

- [ ] Overlay hidden when `isSelecting={false}`
- [ ] Overlay visible and interactive when `isSelecting={true}`
- [ ] Label pill appears on hover
- [ ] Border transitions smoothly idle → hover
- [ ] Bounds update correctly during animation (600ms sampling)
- [ ] Click on overlay fires `onSelect(targetId)`
- [ ] Descendants with `transform` are measured correctly
- [ ] No memory leaks in useEffect cleanup


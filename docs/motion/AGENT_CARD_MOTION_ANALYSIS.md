# Agent Card Motion/Animation System - Complete Analysis

## Executive Summary

The Agent Card component has a **comprehensive, parameterized motion system** built on **Framer Motion** with a **schema-driven editor panel**. The system organizes ~24 motion parameters into 8 logical groups, controlling everything from card layout geometry to hover physics to blur effects. All parameters are real-time adjustable via a motion panel UI.

---

## 1. Motion Parameters Overview

### 1.1 Complete Parameter List (24 parameters organized into 8 groups)

**AGENT_CARD_MOTION export location:** `components/ui/agent-card.tsx` (lines 117-160)

| Group | Parameter Key | Label | Type | Range | Default | Purpose |
|-------|---------------|-------|------|-------|---------|---------|
| **扇形布局** (Fan Layout) | `overlapX` | 卡片重叠 (Card Overlap) | number | -30 to 20 | -20 | Horizontal spacing between cards in fan arrangement |
| **扇形角度** (Fan Angles) | `rotateOuter` | 外侧旋转 (Outer Rotation) | number | 0° to 30° | 11° | Rotation angle for outer cards (cards 1 & 4) |
| | `rotateInner` | 内侧旋转 (Inner Rotation) | number | 0° to 15° | 4° | Rotation angle for inner cards (cards 2 & 3) |
| | `outerCardOffset` | 外侧下沉 (Outer Offset) | number | 0 to 60px | 38px | Vertical downward shift for outer cards |
| **Hover 推开** (Hover Push) | `dist1X` | 近邻推开 (1st Neighbor Push) | number | 0 to 60px | 40px | Horizontal push distance for adjacent cards (±1) on hover |
| | `dist2X` | 次邻推开 (2nd Neighbor Push) | number | 0 to 40px | 24px | Horizontal push distance for far cards (±2) on hover |
| **悬浮物理** (Hover Physics) | `hoverHeight` | 悬浮高度 (Float Height) | number | 0 to 1.4 | 0.30 | Normalized height value (0=rest, 1=max float) that drives Y offset, scale & shadow |
| | `yFactor` | Y偏移系数 (Y Offset Factor) | number | 0 to 80px | 40px | Multiplier for upward movement: y = -hoverHeight * yFactor |
| | `scaleFactor` | 放大系数 (Scale Factor) | number | 0 to 0.8 | 0.30 | Multiplier for scale expansion: scale = 1 + hoverHeight * scaleFactor |
| **Hover 投影** (Hover Shadows) | `shadowBlur1Range` | 主投影模糊 (Primary Shadow Blur) | number | 0 to 300px | 64px | Blur increase for primary shadow at peak hover |
| | `shadowY1Range` | 主投影Y偏移 (Primary Shadow Y) | number | 0 to 150px | 40px | Y offset increase for primary shadow at peak hover |
| | `shadowAlpha1Range` | 主投影透明度 (Primary Shadow Alpha) | number | 0 to 0.5 | 0.06 | Opacity increase for primary shadow at peak hover |
| | `shadowBlur2Range` | 副投影模糊 (Secondary Shadow Blur) | number | 0 to 150px | 120px | Blur increase for secondary shadow at peak hover |
| | `shadowY2Range` | 副投影Y偏移 (Secondary Shadow Y) | number | 0 to 80px | 56px | Y offset increase for secondary shadow at peak hover |
| | `shadowAlpha2Range` | 副投影透明度 (Secondary Shadow Alpha) | number | 0 to 0.3 | 0.02 | Opacity increase for secondary shadow at peak hover |
| **静态投影** (Rest Shadows) | `restShadowY` | 投影Y (Shadow Y) | number | 0 to 20px | 3px | Baseline Y offset for shadow at rest state |
| | `restShadowBlur` | 投影模糊 (Shadow Blur) | number | 0 to 40px | 8px | Baseline blur for shadow at rest state |
| | `restShadowAlpha` | 投影透明度 (Shadow Alpha) | number | 0 to 0.2 | 0.03 | Baseline opacity for shadow at rest state |
| **信息区毛玻璃** (Info Glass Morphism) | `infoFromOpacity` | 渐变起始透明度 (Gradient Start Opacity) | number | 0 to 1 | 0.80 | Top gradient opacity for frosted glass backdrop on info area |
| | `infoToOpacity` | 渐变结束透明度 (Gradient End Opacity) | number | 0 to 1 | 0.70 | Bottom gradient opacity for frosted glass backdrop on info area |
| | `infoBlur` | 高斯模糊 (Gaussian Blur) | number | 0 to 60px | 13px | Blur radius for frosted glass effect |
| | `infoSaturate` | 饱和度 (Saturation) | number | 0 to 300% | 90% | Color saturation of frosted glass background |
| **动画** (Animations) | `fanTransitionDuration` | 推开时长 (Fan Transition Duration) | number | 0.1 to 1.0s | 0.60s | Duration for fan push-apart animation on hover |
| | `hoverTransitionDuration` | 浮起时长 (Hover Transition Duration) | number | 0.1 to 1.0s | 0.30s | Duration for float-up animation on hover |

---

## 2. Animation Types Present in Agent Cards

### 2.1 Card-Level Animations (Within AgentFanCards Component)

The four-card fan arrangement uses **three parallel animation channels**:

#### A. **Fan Push Animation** (fanTransitionDuration)
- **Trigger:** Hover on any card
- **Affected:** All 4 cards in the fan
- **Animation Type:** Simultaneous horizontal displacement
- **Formula:** 
  - Hovered card: x = 0 (stays centered)
  - +/- 1 neighbor: x = +/- dist1X
  - +/- 2 neighbor (far card): x = +/- dist2X
- **Code location:** AgentFanCards component, lines 807-820 (getOffset function), applied in motion.div animate block lines 846-859

#### B. **Float-Up Animation** (hoverTransitionDuration)
- **Trigger:** Hover on any card
- **Affected:** Hovered card only
- **Animation Type:** Y translation + scale + shadow change
- **Formula:**
  - Y offset: y = -hoverHeight * yFactor
  - Scale: scale = 1 + hoverHeight * scaleFactor
  - Shadow: Interpolated between rest and peak values using h (hoverHeight)
- **Duration:** Independent from fanTransitionDuration (typically faster: 0.30s vs 0.60s)

#### C. **Rotation Animation** (rotateOuter, rotateInner)
- **Trigger:** Always applied (static, then interpolates during fan push)
- **Effect:** Each card has fixed rotation around bottom center
- **Formula:**
  - Cards 0 & 3 (outer): rotate = +/- rotateOuter
  - Cards 1 & 2 (inner): rotate = +/- rotateInner
- **Code:** AgentFanCards lines 838-840

#### D. **Z-Index Stacking** (Not parameterized)
- **Effect:** On hover, card gets zIndex: 20, others get zIndex: 1
- **Code:** Line 867

### 2.2 Internal Element Animations (Within Individual AgentCard)

#### A. **Info Pane Slide-In/Out** (Not parameterized by motion system)
- **Trigger:** isHovered state
- **Animation:**
  - Rest state: y = CARD_HEIGHT - 158 (pane at bottom, 158px visible)
  - Hover state: y = 0 (pane fully visible)
- **Code:** Lines 396-400, hardcoded motion.div

#### B. **Typography Size Change** (Controlled by motion system indirectly)
- **Trigger:** Hover
- **Animation:** Title font size: 18px -> 20px
- **Code:** Lines 434-439

#### C. **Content Cross-Fade** (Controlled by motion system indirectly)
- **Components:** 
  1. Skills tags (default) <-> Description (hover)
  2. Stats, separator, expanded skills, CTA (appear on hover with opacity: 0 -> 1)
- **Code:** Lines 454-456 (skills), 503-522 (description), 530-601 (other content)
- **Duration:** Uses shared transition variable from parent config

#### D. **Frosted Glass Properties** (Fully parameterized)
- **Parameters Involved:**
  - infoFromOpacity / infoToOpacity: Gradient backdrop opacity
  - infoBlur: Blur filter strength
  - infoSaturate: Color saturation
- **Applied:** motion.div wrapping info area, lines 408-410
- **Note:** These are CSS properties, not animated; they change with config updates

---

## 3. Motion System Architecture

### 3.1 Schema-Driven Design

The system uses a declarative schema approach where each motion-enabled component exports a MotionTargetDef describing its parameters:

```typescript
export const AGENT_CARD_MOTION: MotionTargetDef = {
  id: "agent-cards",                    // Unique identifier
  label: "Agent 卡片动效",              // Display name
  schema: [                             // 24 parameter definitions
    { key: "overlapX", label: "卡片重叠", min: -30, max: 20, step: 1, group: "扇形布局" },
    // ... more parameters
  ],
  states: [                             // Optional preview states
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "default",
  defaultConfig: DEFAULT_FAN_CONFIG,
}
```

### 3.2 Integration Points

#### A. Component Export (agent-card.tsx)
- Exports AGENT_CARD_MOTION constant (MotionTargetDef)
- Accepts fanConfig?: FanCardsConfig prop on AgentFanCards
- Exports FanCardsConfig interface with JSDoc comments

#### B. Page-Level State Management (app/page.tsx)
- Line 111: const [fanConfig, setFanConfig] = useState<FanCardsConfig>(DEFAULT_FAN_CONFIG);
- Lines 501-507: Wrapped with <MotionTargetOverlay> + <AgentFanCards config={fanConfig} />
- Lines 417-428: Conditional <MotionPanel> renders when motionTarget === "agent-cards"

#### C. Selection & Editing UI (motion-panel.tsx + motion-target-overlay.tsx)
- MotionTargetOverlay: Wraps component, shows blue dashed outline in motion-selecting mode
- MotionPanel: Auto-generates sliders from schema, dispatches onChange callbacks
- EditorSelectButton: Right-bottom corner toggle (MousePointer -> X icon)

### 3.3 State Machine

```
User clicks EditorSelectButton
       |
       v
motionMode: "idle" <-> "motion-selecting"
                    |
                    v
            User clicks component
                    |
                    v
            motionMode: "editing"
            + motionTarget: "agent-cards"
                    |
                    v
            MotionPanel renders
            + Overlays disappear
            + realtime onChange callbacks
```

---

## 4. Parameter Organization & Default Values

### 4.1 Grouped by Visual Functionality

**Fan Layout (Spatial)**
- overlapX = -20px — cards slightly overlap left-to-right

**Fan Angles (Rotational)**
- rotateOuter = 11° — outer cards tilt out
- rotateInner = 4° — inner cards tilt slightly
- outerCardOffset = 38px — outer cards sit lower

**Hover Interaction (Displacement)**
- dist1X = 40px — adjacent cards push apart significantly
- dist2X = 24px — far card pushes less

**Hover Physics (3D Float Effect)**
- hoverHeight = 0.30 — normalized 0-1 scale
- yFactor = 40px — converts height to upward movement
- scaleFactor = 0.30 — grows card 30% when hovered

**Shadow Layers (Depth Cues)**
- Rest state (static):
  - restShadowY = 3px
  - restShadowBlur = 8px
  - restShadowAlpha = 0.03
- Peak state (hover, interpolated):
  - shadowBlur1Range = +64px -> total 72px
  - shadowY1Range = +40px -> total 43px
  - shadowAlpha1Range = +0.06 -> total 0.09
  - shadowBlur2Range = +120px
  - shadowY2Range = +56px
  - shadowAlpha2Range = +0.02

**Frosted Glass (Info Pane Backdrop)**
- infoFromOpacity = 0.80 — top gradient opacity
- infoToOpacity = 0.70 — bottom gradient opacity
- infoBlur = 13px — gaussian blur
- infoSaturate = 90% — slightly desaturated

**Animation Timing**
- fanTransitionDuration = 0.60s — slower push-apart
- hoverTransitionDuration = 0.30s — faster float-up

### 4.2 Easing Curves

All animations use shared easing:
```typescript
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
```
This is a cubic bezier with smooth entrance and sharp exit (Material Design influenced).

---

## 5. Visual Composition Layers

### 5.1 Four-Card Fan Arrangement

```
Rest State                          On Hover (Card 2 hovered)
┌────────────┐                      ┌────────────┐
│ Card 0     │ rotateOuter +11°     │ Card 0     │ pushed -40px
│ x: 0       │                      │ x: -40     │
└────────────┘                      └────────────┘
  ↓ -20px overlap                      ↓ overlap
┌────────────┐                      ┌────────────┐
│ Card 1     │ rotateInner +4°      │ Card 1     │ pushed -24px
│ x: 0       │                      │ x: -24     │
└────────────┘                      └────────────┘
  ↓ -20px overlap                      ↓ overlap
┌────────────┐                      ┌────────────┐
│ Card 2     │ rotateInner -4°      │ Card 2     │ HOVER
│ x: 0       │                      │ x: 0       │ y: -12px, scale: 1.3x
└────────────┘                      │ zIndex: 20 │
  ↓ -20px overlap                    └────────────┘
┌────────────┐                        ↓ overlap
│ Card 3     │ rotateOuter -11°     ┌────────────┐
│ x: 0       │                      │ Card 3     │ pushed +24px
└────────────┘                      │ x: +24     │
                                    └────────────┘
```

### 5.2 Single Card Internal Layout

```
┌──────────────────────────────────────┐
│  Avatar image (full fill, 288x438px) │
├──────────────────────────────────────┤
│  Frosted glass info pane (Y animated)│
│  ┌────────────────────────────────────
│  │ • English name (Rigel, 20px)
│  │ • Chinese title (18->20px on hover)
│  │ ├─ Skills tags (4x, hover->fade)
│  │ └─ Description (hover->fade in)
│  │ ┌────────────────────────────────
│  │ │ • Stats (3 columns)
│  │ ├────────────────────────────────
│  │ │ • Expanded skills (2x3 grid)
│  │ ├────────────────────────────────
│  │ │ • CTA "Summon" button
│  │ └────────────────────────────────
│  └────────────────────────────────────
└──────────────────────────────────────┘
```

---

## 6. Control Flow: Config → Rendering

### 6.1 Config Structure

```typescript
interface FanCardsConfig {
  // 24 parameters organized as shown in section 4
}

const DEFAULT_FAN_CONFIG: FanCardsConfig = {
  overlapX: -20,
  rotateOuter: 11,
  // ... (all 24 parameters with defaults)
}
```

### 6.2 Data Flow

```
User adjusts slider in MotionPanel
  |
  v
onChange callback in page.tsx
  |
  v
setFanConfig(newConfig)
  |
  v
AgentFanCards receives updated config prop
  |
  v
Calculations in render:
  • getOffset(i) computes x displacement per card
  • deriveHoverPhysics(hoverHeight, config) computes y, scale, shadow
  • restShadow(config) computes baseline shadow
  |
  v
motion.div animate prop updates
  |
  v
Framer Motion transitions smoothly
  |
  v
Visual result on screen
```

### 6.3 Key Computation Functions

#### A. restShadow(config) (line 167-169)
```typescript
// Interpolates rest shadow into CSS box-shadow string
return `0 ${config.restShadowY}px ${config.restShadowBlur}px rgba(0,0,0,${config.restShadowAlpha.toFixed(2)})`;
```

#### B. deriveHoverPhysics(h, config) (line 171-185)
```typescript
// h = normalized hoverHeight (0 to 1)
// Returns: { y, scale, shadow } at that hover state
const y = -h * config.yFactor;
const scale = 1 + h * config.scaleFactor;
// Shadow interpolates from rest to peak:
const shadowBlur1 = config.restShadowBlur + h * config.shadowBlur1Range;
// ... (6 more shadow values)
```

---

## 7. Summary Table: Motion Parameters Quick Reference

| Category | Count | Parameters | Typical Impact |
|----------|-------|-----------|-----------------|
| Layout | 4 | overlapX, rotateOuter, rotateInner, outerCardOffset | Visual composition of 4-card fan |
| Interaction | 2 | dist1X, dist2X | How far cards push apart on hover |
| Physics | 3 | hoverHeight, yFactor, scaleFactor | Float-up intensity & smoothness |
| Shadows | 6 | shadow*Range (blur, Y, alpha x2) + rest shadows x3 | Depth enhancement on hover |
| Glass | 4 | infoFromOpacity, infoToOpacity, infoBlur, infoSaturate | Info pane backdrop appearance |
| Timing | 2 | fanTransitionDuration, hoverTransitionDuration | Animation speed (separate channels) |
| **TOTAL** | **24** | — | Complete visual parameterization |

---

## 8. Code References

### Key Exports
- **AGENT_CARD_MOTION** (MotionTargetDef): components/ui/agent-card.tsx lines 117-160
- **DEFAULT_FAN_CONFIG** (FanCardsConfig): components/ui/agent-card.tsx lines 81-114
- **AgentFanCards** component: components/ui/agent-card.tsx lines 791-883

### Integration in page.tsx
- Fan config state: line 111
- Overlay + component: lines 495-507
- Motion panel: lines 417-428

### Motion System Infrastructure
- **MotionTargetDef** interface: components/ui/motion-panel.tsx lines 22-29
- **MotionMode** type: components/ui/motion-panel.tsx line 31
- **MotionPanel** component: components/ui/motion-panel.tsx lines 190+
- **MotionTargetOverlay**: components/ui/motion-target-overlay.tsx

---

## 9. Notable Observations

1. **Dual Animation Channels**: Fan push (0.60s) and float-up (0.30s) operate independently -> creates layered depth effect

2. **Physics-Driven Shadows**: Shadow interpolation uses same hoverHeight parameter as Y and scale, creating unified depth hierarchy

3. **Information Hierarchy**: Info pane doesn't animate - it slides up/down in background while content fades in/out (crossfade UX pattern)

4. **Parameterized Backdrop**: Frosted glass properties change instantly with config updates; not eased

5. **No Between-Card Animations**: Cards don't rotate individually on hover; only push apart horizontally

6. **Symmetrical Layout**: Left/right cards mirror each other (rotateOuter positive/negative, dist1X/dist2X applied by direction)

7. **Flexible States System**: Schema supports states array for preview; agents use default/hover states

8. **Single Easing Curve**: All animations share one cubic bezier (0.4, 0, 0.2, 1) for visual consistency

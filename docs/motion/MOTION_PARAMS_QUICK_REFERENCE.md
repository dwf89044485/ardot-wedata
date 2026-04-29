# Agent Card Motion Parameters - Quick Reference

## 24 Total Parameters Organized into 8 Groups

### 📐 Fan Layout (Spatial) — 1 param
```
overlapX: -30 to 20
  Default: -20px
  Effect: Horizontal card spacing in fan
```

### 🔄 Fan Angles (Rotational) — 3 params
```
rotateOuter:    0-30°    (default: 11°)   → outer cards tilt
rotateInner:    0-15°    (default: 4°)    → inner cards tilt slightly
outerCardOffset: 0-60px  (default: 38px)  → outer cards drop lower
```

### 👉 Hover Push (Displacement on Hover) — 2 params
```
dist1X: 0-60px (default: 40px)  → adjacent cards (±1) push distance
dist2X: 0-40px (default: 24px)  → far card (±2) push distance
```

### 🎈 Hover Physics (3D Float Effect) — 3 params
These work together to create the float-up illusion:
```
hoverHeight:  0-1.4     (default: 0.30)   → "how high" (0-1 normalized)
yFactor:      0-80px    (default: 40px)   → multiplier for Y movement
scaleFactor:  0-0.8     (default: 0.30)   → multiplier for size growth

Math:
  y = -hoverHeight * yFactor
  scale = 1 + hoverHeight * scaleFactor
```

### 🌑 Hover Shadows (Depth Layer 1: Primary) — 3 params
```
shadowBlur1Range:  0-300px (default: 64px)   → blur increase
shadowY1Range:     0-150px (default: 40px)   → Y offset increase
shadowAlpha1Range: 0-0.5   (default: 0.06)   → opacity increase
```

### 🌑 Hover Shadows (Depth Layer 2: Secondary) — 3 params
```
shadowBlur2Range:  0-150px (default: 120px)  → blur increase
shadowY2Range:     0-80px  (default: 56px)   → Y offset increase
shadowAlpha2Range: 0-0.3   (default: 0.02)   → opacity increase
```

### 🌑 Static Shadows (At Rest) — 3 params
```
restShadowY:     0-20px  (default: 3px)    → Y offset baseline
restShadowBlur:  0-40px  (default: 8px)    → blur baseline
restShadowAlpha: 0-0.2   (default: 0.03)   → opacity baseline
```

### 🔮 Frosted Glass Info Pane — 4 params
```
infoFromOpacity: 0-1    (default: 0.80)    → top gradient opacity
infoToOpacity:   0-1    (default: 0.70)    → bottom gradient opacity
infoBlur:        0-60px (default: 13px)    → blur radius
infoSaturate:    0-300% (default: 90%)     → color saturation
```

### ⏱️ Animation Timing — 2 params
```
fanTransitionDuration:   0.1-1.0s (default: 0.60s) → push-apart speed
hoverTransitionDuration: 0.1-1.0s (default: 0.30s) → float-up speed
```

---

## Animation Channels (What Actually Moves)

### Channel 1: Fan Push (fanTransitionDuration = 0.60s)
- **Trigger:** Hover on any card
- **Affected:** All 4 cards
- **Movement:** Horizontal displacement only
  - Hovered: x = 0 (center)
  - Neighbor: x = ±dist1X (e.g., ±40px)
  - Far: x = ±dist2X (e.g., ±24px)

### Channel 2: Float-Up (hoverTransitionDuration = 0.30s)
- **Trigger:** Hover on any card
- **Affected:** Hovered card only
- **Movement:** Y translation + scale + shadow change
  - Y offset: y = -hoverHeight * yFactor
  - Scale: scale = 1 + hoverHeight * scaleFactor
  - Shadow: Interpolates between rest and peak

### Channel 3: Rotation (Always Applied)
- **No parameter for speed** (not eased, static)
- **Affected:** All 4 cards
- **Movement:** Fixed rotation around bottom center
  - Outer cards: ±rotateOuter
  - Inner cards: ±rotateInner

---

## Parameter Dependency Map

```
hoverHeight (0-1.4)
  ├─ Y movement: × yFactor (0-80px)
  ├─ Scale growth: × scaleFactor (0-0.8)
  └─ Shadow interpolation: linear blend from rest to peak
       ├─ Blur:  restShadowBlur + h × shadowBlur*Range
       ├─ Y:     restShadowY + h × shadowY*Range
       └─ Alpha: restShadowAlpha + h × shadowAlpha*Range

rotateOuter / rotateInner
  └─ Applied statically; no animation speed param

distX parameters (dist1X, dist2X)
  └─ Animated over fanTransitionDuration

Glass parameters (infoBlur, infoSaturate, etc.)
  └─ No animation speed; instant on config change
```

---

## When to Use Each Parameter

| Want to... | Adjust... |
|-----------|-----------|
| Change card spacing in fan | `overlapX` |
| Make outer cards more/less tilted | `rotateOuter`, `rotateInner` |
| Change how far cards push apart on hover | `dist1X`, `dist2X` |
| Make card float higher/more | `hoverHeight`, `yFactor` |
| Make card grow bigger on hover | `scaleFactor` |
| Enhance shadow depth on hover | `shadowBlur1Range`, `shadowY1Range`, `shadowAlpha1Range` |
| Add secondary shadow effect | `shadowBlur2Range`, `shadowY2Range`, `shadowAlpha2Range` |
| Change baseline shadow | `restShadowY`, `restShadowBlur`, `restShadowAlpha` |
| Make info pane backdrop less/more visible | `infoFromOpacity`, `infoToOpacity` |
| Soften/sharpen info pane backdrop | `infoBlur` |
| Adjust info pane backdrop color | `infoSaturate` |
| Slow down/speed up card push-apart | `fanTransitionDuration` |
| Slow down/speed up card float-up | `hoverTransitionDuration` |

---

## Code Integration Points

### For Motion Editor Access
1. **Click** EditorSelectButton (bottom-right corner)
2. **Enter** "motion-selecting" mode → blue dashed outlines appear
3. **Click** on Agent Cards area
4. **Enter** "editing" mode → MotionPanel slides in with 24 sliders
5. **Adjust** any parameter → real-time preview

### For Developers
- **Export location:** `components/ui/agent-card.tsx` (AGENT_CARD_MOTION)
- **Config prop:** `AgentFanCards` accepts `config?: FanCardsConfig`
- **Default config:** `DEFAULT_FAN_CONFIG` (line 81-114)
- **Integration:** `app/page.tsx` (lines 111, 495-507, 417-428)

---

## Visual Effects Checklist

- [x] **Rest State**: 3px shadow, minimal effect
- [x] **Hover Push**: Neighboring cards move away (horizontal)
- [x] **Hover Float**: Hovered card rises up (vertical)
- [x] **Hover Scale**: Hovered card grows
- [x] **Hover Shadow**: Dramatic shadow underneath
- [x] **Info Pane**: Frosted glass background (tunable blur/saturation)
- [x] **Content Fade**: Skills → Description crossfade
- [x] **Typography**: Title grows from 18px → 20px
- [x] **Z-Index**: Hovered card appears on top (z-index: 20)
- [x] **Easing**: All animations use cubic bezier (0.4, 0, 0.2, 1)

---

## Export Definition (TypeScript)

```typescript
export const AGENT_CARD_MOTION: MotionTargetDef = {
  id: "agent-cards",
  label: "Agent 卡片动效",
  schema: [
    // 24 parameters, each with:
    // { key, label, min, max, step, group }
  ],
  states: [
    { value: "default", label: "默认" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "default",
  defaultConfig: DEFAULT_FAN_CONFIG,
};
```

---

## Key Formulas

```typescript
// Rest shadow (static, used as baseline)
shadow = `0 ${y}px ${blur}px rgba(0,0,0,${alpha})`

// Hover physics (h = hoverHeight 0-1)
y = -h * yFactor
scale = 1 + h * scaleFactor

// Shadow interpolation (linear blend)
shadowBlur = restShadowBlur + h * shadowBlurRange
shadowY = restShadowY + h * shadowYRange
shadowAlpha = restShadowAlpha + h * shadowAlphaRange

// Fan push (per card i)
if hovered:
  x = 0
else if distance = 1:
  x = ±dist1X
else if distance = 2:
  x = ±dist2X
```


# Motion System Integration Guide

> Complete reference for integrating new motion-enabled components into the schema-driven motion editor system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [State Management](#state-management)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Topics](#advanced-topics)
8. [Existing Implementations](#existing-implementations)

---

## Quick Start

Adding a new motion component requires **exactly 3 files to be modified**:

1. **Component file** (e.g., `components/ui/my-component.tsx`): Export `MotionTargetDef`
2. **Page file** (`app/page.tsx`): Add state + wrap with `MotionTargetOverlay` + add `MotionPanel` condition
3. **Nothing else** — the motion editor infrastructure handles the rest

---

## Core Concepts

### Schema-Driven Architecture

The motion system uses a declarative schema pattern where each motion component exports metadata:

```typescript
export const MY_COMPONENT_MOTION: MotionTargetDef = {
  id: "unique-id",                    // Used for routing in state machine
  label: "Display Name",               // Shown in UI
  schema: [                            // Parameter definitions
    { key: "duration", label: "Duration", min: 0.1, max: 1, step: 0.05, group: "Timing" }
  ],
  defaultConfig: { duration: 0.3 },   // Initial parameter values
  states?: ["hover", "active"],       // Optional: preview states
  defaultState?: "hover"              // Optional: initial preview state
};
```

### Three-State Machine

```
idle ──(click button)──> motion-selecting ──(click component)──> editing ──(close)──> idle
```

- **idle**: Normal browsing, no motion UI visible
- **motion-selecting**: Blue dashed borders visible on all registered components, hoverable/clickable
- **editing**: Parameter panel slides in, component responds to slider changes in real-time

### Config Flow

```
User adjusts slider
        ↓
MotionPanel onChange callback triggered
        ↓
setChatInputConfig(newConfig) called
        ↓
Component re-renders with new config
        ↓
Framer Motion applies updated animation values
        ↓
Real-time preview in viewport
```

---

## Step-by-Step Integration

### Phase 1: Component Preparation

**File:** `components/ui/my-component.tsx`

```typescript
import type { MotionTargetDef } from "@/components/ui/motion-panel";
import { motion } from "framer-motion";

// 1. Define the configuration interface
export interface MyComponentConfig {
  duration: number;
  delay: number;
  intensity: number;
}

// 2. Export the motion definition
export const MY_COMPONENT_MOTION: MotionTargetDef = {
  id: "my-component",
  label: "My Component Animation",
  schema: [
    {
      key: "duration",
      label: "Animation Duration",
      min: 0.1,
      max: 1.0,
      step: 0.05,
      group: "Timing"
    },
    {
      key: "delay",
      label: "Start Delay",
      min: 0,
      max: 0.5,
      step: 0.05,
      group: "Timing"
    },
    {
      key: "intensity",
      label: "Effect Intensity",
      min: 0,
      max: 1,
      step: 0.1,
      group: "Visual"
    }
  ],
  defaultConfig: {
    duration: 0.3,
    delay: 0,
    intensity: 0.5
  }
};

// 3. Update component props
interface MyComponentProps {
  config: Record<string, number>;      // Required: motion config
  isEditorHovered?: boolean;           // Optional: pause animation when editing
  // ... other props
}

// 4. Use config in component
export function MyComponent({ config, isEditorHovered }: MyComponentProps) {
  return (
    <motion.div
      animate={{
        scale: 1 + config.intensity * 0.2,
        opacity: isEditorHovered ? 0.7 : 1
      }}
      transition={{
        duration: config.duration,
        delay: config.delay
      }}
    >
      {/* content */}
    </motion.div>
  );
}
```

### Phase 2: Page Integration

**File:** `app/page.tsx`

```typescript
// ① Import the component and its motion definition
import { MyComponent, MY_COMPONENT_MOTION } from "@/components/ui/my-component";

export default function Page() {
  // ② Add state for the component's motion config (near other motion state)
  const [myComponentConfig, setMyComponentConfig] = useState(
    MY_COMPONENT_MOTION.defaultConfig
  );

  // ③a Wrap component with MotionTargetOverlay
  return (
    <MotionTargetOverlay
      targetId="my-component"
      targetLabel={MY_COMPONENT_MOTION.label}
      isSelecting={motionMode === "motion-selecting"}
      onSelect={handleMotionSelect}
    >
      <MyComponent 
        config={myComponentConfig}
        isEditorHovered={isEditorHovered}
      />
    </MotionTargetOverlay>

    // ③b Add MotionPanel condition in AnimatePresence
    <AnimatePresence>
      {motionMode === "editing" && motionTarget === "my-component" && (
        <MotionPanel
          targetLabel={MY_COMPONENT_MOTION.label}
          schema={MY_COMPONENT_MOTION.schema}
          config={myComponentConfig}
          defaultConfig={MY_COMPONENT_MOTION.defaultConfig}
          onChange={(c) => setMyComponentConfig(c)}
          onHoverChange={setIsEditorHovered}
          onClose={handleMotionPanelClose}
        />
      )}
    </AnimatePresence>
  );
}
```

### Phase 3: Verification

- [ ] Component exports `MotionTargetDef` with all 4 required fields
- [ ] Component Props interface accepts `config: Record<string, number>` and `isEditorHovered?: boolean`
- [ ] Page.tsx has state for component config initialized from `defaultConfig`
- [ ] Component wrapped in `<MotionTargetOverlay>` with matching `targetId`
- [ ] `<MotionPanel>` added to `<AnimatePresence>` with correct condition
- [ ] `MotionPanel` receives `onHoverChange={setIsEditorHovered}` callback
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] Build passes: `npm run build`

---

## State Management

### Required States (in page.tsx)

```typescript
// Motion system states
const [motionMode, setMotionMode] = useState<"idle" | "motion-selecting" | "editing">("idle");
const [motionTarget, setMotionTarget] = useState<string | null>(null);
const [isEditorHovered, setIsEditorHovered] = useState(false);

// Per-component config states
const [myComponentConfig, setMyComponentConfig] = useState(
  MY_COMPONENT_MOTION.defaultConfig
);
```

### State Update Handlers

```typescript
// Provided by motion infrastructure (don't modify):
const handleMotionButtonClick = useCallback(() => {
  if (motionMode === "idle") {
    setMotionMode("motion-selecting");
  } else {
    setMotionMode("idle");
    setMotionTarget(null);
    setIsEditorHovered(false);
  }
}, [motionMode]);

const handleMotionSelect = useCallback((targetId: string) => {
  setMotionTarget(targetId);
  setMotionMode("editing");
}, []);

const handleMotionPanelClose = useCallback(() => {
  setMotionMode("idle");
  setMotionTarget(null);
  setIsEditorHovered(false);
}, []);
```

---

## Common Patterns

### Pattern 1: Conditional Animation (Hover-Based)

```typescript
export function HoverComponent({ config, isEditorHovered }: HoverComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      onHoverStart={() => !isEditorHovered && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={{
        scale: isHovered ? 1 + config.scaleOnHover : 1,
        y: isHovered ? -config.floatDistance : 0
      }}
      transition={{ duration: config.duration }}
    >
      {/* content */}
    </motion.div>
  );
}
```

### Pattern 2: Multi-Element Stagger

```typescript
export function StaggerComponent({ config, isEditorHovered }: StaggerComponentProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: config.staggerDelay,
        delayChildren: config.initialDelay
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: config.itemDuration } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate={isEditorHovered ? "hidden" : "visible"}>
      {items.map((item, i) => (
        <motion.div key={i} variants={itemVariants}>
          {item}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Pattern 3: Physics-Based (Like AgentCard)

```typescript
function derivePhysics(config: MyComponentConfig) {
  // Normalize input to 0-1 range
  const intensity = config.intensity / config.maxIntensity;
  
  return {
    yOffset: -intensity * config.yFactor,
    scaleMultiplier: 1 + intensity * config.scaleFactor,
    shadowAlpha: intensity * config.maxShadowAlpha
  };
}

export function PhysicsComponent({ config }: PhysicsComponentProps) {
  const physics = derivePhysics(config);
  
  return (
    <motion.div
      animate={{
        y: physics.yOffset,
        scale: physics.scaleMultiplier,
        boxShadow: `0 ${config.shadowY}px ${config.shadowBlur}px rgba(0,0,0,${physics.shadowAlpha})`
      }}
      transition={{ duration: config.transitionDuration }}
    >
      {/* content */}
    </motion.div>
  );
}
```

### Pattern 4: Preview States

```typescript
// In component file
export const MY_COMPONENT_MOTION: MotionTargetDef = {
  // ... other fields
  states: ["rest", "hover", "active"],
  defaultState: "rest"
};

// In page.tsx
const [myComponentPreviewState, setMyComponentPreviewState] = useState<string>("rest");

// In MotionPanel
<MotionPanel
  // ... other props
  stateOptions={MY_COMPONENT_MOTION.states}
  onStateChange={setMyComponentPreviewState}
/>

// In component
export function MyComponent({ 
  config, 
  isEditorHovered,
  previewState
}: MyComponentProps) {
  const state = previewState || (isHovered ? "hover" : "rest");
  
  return (
    <motion.div animate={stateVariants[state]}>
      {/* content */}
    </motion.div>
  );
}
```

---

## Troubleshooting

### Issue: "MotionTargetDef is not exported"

**Cause:** Component file doesn't export `MotionTargetDef` or is exporting with wrong name

**Solution:** In component file, add:
```typescript
import type { MotionTargetDef } from "@/components/ui/motion-panel";

export const MY_COMPONENT_MOTION: MotionTargetDef = { /* ... */ };
```

### Issue: Slider changes don't update component

**Cause:** Component not receiving config prop or not using config values in animation

**Solution:** 
1. Verify `<MyComponent config={myComponentConfig} />`
2. Verify component uses `config.parameterName` in motion.div animate
3. Check TypeScript: `config` should be `Record<string, number>`

### Issue: Overlay border doesn't appear in motion-selecting mode

**Cause:** Component not wrapped in `MotionTargetOverlay` or targetId mismatch

**Solution:**
```typescript
// Must match MY_COMPONENT_MOTION.id
<MotionTargetOverlay targetId="my-component" {/* ... */}>
  <MyComponent />
</MotionTargetOverlay>
```

### Issue: Panel doesn't appear when component is selected

**Cause:** MotionPanel condition not matching or targetId mismatch

**Solution:** Verify condition:
```typescript
{motionMode === "editing" && motionTarget === "my-component" && (
  <MotionPanel /* ... */ />
)}
```
Both `motionTarget` and component's `targetId` must be identical.

### Issue: Animation pauses when panel hovers but shouldn't

**Cause:** Component not receiving `isEditorHovered` prop

**Solution:** Add to component:
```typescript
<MyComponent 
  config={myComponentConfig}
  isEditorHovered={isEditorHovered}  // ← Add this
/>
```

---

## Advanced Topics

### Custom Derived Values

Some animations need computed values based on config. Create helper functions:

```typescript
// In component file, before export
function computeDerivedValues(config: MyComponentConfig) {
  return {
    // Ease function for intensity
    easedIntensity: Math.pow(config.intensity, 1.5),
    
    // Clamp dependent value
    shadowAlpha: Math.min(config.intensity * 2, 1),
    
    // Interpolation between two configs
    colorLerp: interpolateColor(config.colorStart, config.colorEnd, config.blend)
  };
}

// Use in component
const derived = computeDerivedValues(config);
<motion.div animate={{ opacity: derived.shadowAlpha }} />
```

### Multi-Stage Animations

```typescript
const stageVariants = {
  initial: { opacity: 0 },
  stage1: { 
    opacity: 1,
    transition: { duration: config.stage1Duration }
  },
  stage2: {
    scale: 1.1,
    transition: { duration: config.stage2Duration }
  }
};

<motion.div
  initial="initial"
  animate={isEditorHovered ? "initial" : ["stage1", "stage2"]}
  variants={stageVariants}
/>
```

### Performance: useMotionTemplate

For expensive calculations on every render:

```typescript
import { useMotionTemplate } from "framer-motion";

export function OptimizedComponent({ config }: OptimizedComponentProps) {
  const shadowTemplate = useMotionTemplate`
    0 ${config.shadowY}px ${config.shadowBlur}px rgba(0,0,0,${config.shadowAlpha})
  `;
  
  return (
    <motion.div style={{ boxShadow: shadowTemplate }}>
      {/* content */}
    </motion.div>
  );
}
```

---

## Existing Implementations

### Agent Card (`components/ui/agent-card.tsx`)

**Overview:** Fan layout with 4 cards, hover-triggered float-up animation, dual-layer shadows, frosted glass info pane

**MotionTargetDef:** `AGENT_CARD_MOTION` (24 parameters across 8 groups)

**Key Parameters:**
- Fan Layout: `overlapX`, `rotateOuter`, `rotateInner`, `outerCardOffset`
- Hover Physics: `hoverHeight`, `yFactor`, `scaleFactor`
- Shadows: `shadowBlur1Range`, `shadowY1Range`, `shadowAlpha1Range` (primary), `shadowBlur2Range`, `shadowY2Range`, `shadowAlpha2Range` (secondary)
- Frosted Glass: `infoBlur`, `infoSaturate`, `infoFromOpacity`, `infoToOpacity`
- Timing: `fanTransitionDuration`, `hoverTransitionDuration`

**State Machine:**
- Four cards arranged in fan layout with CSS `transform`
- Hover on card → `hoverHeight` increases (0 to 1)
- Derived physics: Y offset, scale, shadow interpolation
- Info pane slides up, title enlarges, content crossfades

**Integration Point:** `app/page.tsx` line ~417-428

### Chat Input (`components/ui/chat-input.tsx`)

*Status: Schema prepared, awaiting full implementation*

**Planned MotionTargetDef:** `CHAT_INPUT_MOTION`

**Planned Parameters:**
- Timing: `expandDuration` (0.1-1.0s)
- Frosted Glass: `blurRadius` (0-30px)
- (Additional parameters TBD)

---

## Reference: Motion System Architecture

```
┌─────────────────────────────────────────┐
│         Schema-Driven Motion System     │
└─────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
   Core Types            Infrastructure
   ──────────            ──────────────
   • MotionMode          • MotionPanel
   • MotionTargetDef       (auto-generates sliders)
   • MotionParamDef      • EditorSelectButton
                           (mode toggle)
                         • MotionTargetOverlay
                           (wraps components)
        ↓                       ↓
   Component File         Page.tsx
   ─────────────          ────────
   Export schema          • State management
   Consume config         • Route selection
   Use in animation       • Panel condition
        ↓
   Framer Motion
   ─────────────
   Animates based on config
```

---

## Checklist for New Component

Use this when integrating a new motion component:

- [ ] Component interface defined with motion parameters
- [ ] `MotionTargetDef` exported from component file
- [ ] All 24 required schema fields present in MotionParamDef objects
- [ ] `defaultConfig` covers all keys in schema
- [ ] Component accepts `config: Record<string, number>` prop
- [ ] Component accepts optional `isEditorHovered?: boolean` prop
- [ ] Page.tsx imports component and `MotionTargetDef`
- [ ] Page.tsx state created for component config
- [ ] Component wrapped in `MotionTargetOverlay` with matching `targetId`
- [ ] `MotionPanel` condition added to `AnimatePresence`
- [ ] Panel condition checks: `motionMode === "editing" && motionTarget === "target-id"`
- [ ] Panel receives `onChange`, `onHoverChange`, `onClose` callbacks
- [ ] Panel receives `stateOptions` and `onStateChange` if using preview states
- [ ] All animation values derived from config
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] Build passes: `npm run build`
- [ ] Component responds to slider changes in real-time
- [ ] Component pauses/resumes based on `isEditorHovered`


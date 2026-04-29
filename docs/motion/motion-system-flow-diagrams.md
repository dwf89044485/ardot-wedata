# Motion Editor System: Data Flow & Architecture Diagrams

## Component Hierarchy

```
page.tsx (State Manager)
│
├── motionMode state: "idle" | "motion-selecting" | "editing"
├── motionTarget state: null | "agent-cards" | "chat-input"
├── fanConfig state: FanCardsConfig
├── chatInputConfig state: Record<string, number>
├── agentCardPreviewState state: "default" | "preview"
├── chatInputPreviewState state: "default" | "active"
│
├── EditorSelectButton (Bottom-right toggle)
│   └── Click → handleMotionButtonClick() → setMotionMode()
│
├── Content Area (Line 445-557)
│   │
│   ├── MotionPanel (Agent Cards)
│   │   ├── Condition: motionMode === "editing" && motionTarget === "agent-cards"
│   │   ├── Props: schema, config, onChange, onClose
│   │   └── onChange → setFanConfig()
│   │
│   └── MotionPanel (Chat Input)
│       ├── Condition: motionMode === "editing" && motionTarget === "chat-input"
│       ├── Props: schema, config, onChange, onClose
│       └── onChange → setChatInputConfig()
│
└── Input Area (Line 560-673)
    │
    ├── MotionTargetOverlay (Agent Cards) — Line 495
    │   ├── Props: targetId="agent-cards", isSelecting={motionMode === "motion-selecting"}
    │   ├── onClick → onSelect("agent-cards") → handleMotionSelect()
    │   │              ├── setMotionTarget("agent-cards")
    │   │              └── setMotionMode("editing")
    │   │
    │   └── AgentFanCards
    │       ├── config={fanConfig}
    │       └── previewState={motionTarget === "agent-cards" ? agentCardPreviewState : undefined}
    │
    └── MotionTargetOverlay (Chat Input) — Line 655
        ├── Props: targetId="chat-input", isSelecting={motionMode === "motion-selecting"}
        ├── onClick → onSelect("chat-input") → handleMotionSelect()
        │              ├── setMotionTarget("chat-input")
        │              └── setMotionMode("editing")
        │
        └── ClaudeChatInput
            ├── config={chatInputConfig}
            └── previewState={motionTarget === "chat-input" ? chatInputPreviewState : undefined}
```

---

## State Machine with Event Triggers

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOTION MODE STATE                            │
└─────────────────────────────────────────────────────────────────┘

    IDLE State
    ════════════════════════════════════════
    • Overlays hidden (isSelecting=false)
    • Normal component interaction
    • MotionPanel not visible
    
    ▲              │
    │              │ Click EditorSelectButton
    │              │ (handleMotionButtonClick)
    │              ▼
    │    SELECTING State
    │    ════════════════════════════════════════
    │    • All overlays visible (isSelecting=true)
    │    • Blue dashed borders + labels shown
    │    • Components have pointerEvents: "none"
    │    • Overlay interactive layer active (zIndex: 1)
    │    
    │    ▲          │
    │    │          │ Click overlay
    │    │          │ (MotionTargetOverlay.onSelect)
    │    │          │ → handleMotionSelect(targetId)
    │    │          │ → setMotionMode("editing")
    │    │          │ → setMotionTarget(targetId)
    │    │          ▼
    │    │   EDITING State
    │    │   ════════════════════════════════════════
    │    │   • Overlays hidden (isSelecting=false)
    │    │   • MotionPanel visible for targetId
    │    │   • Component receives previewState
    │    │   • User adjusts sliders
    │    │   • onChange → setConfig()
    │    │
    │    │   When user closes panel:
    │    │   • Click ✕ on MotionPanel
    │    │   • → handleMotionPanelClose()
    │    │   • → setMotionMode("idle")
    │    │   • → setMotionTarget(null)
    │    └───────────────────────────────────────→
    │
    │ From SELECTING or EDITING:
    │ Click EditorSelectButton again
    │ (handleMotionButtonClick with motionMode !== "idle")
    └─────────────────────────────────────────────────

State Reset on Exit:
    • motionMode → "idle"
    • motionTarget → null
    • previewState → defaultState
```

---

## MotionTargetOverlay: Internal Measurement Flow

```
┌─────────────────────────────────────────────────────┐
│     MotionTargetOverlay.useEffect() triggers        │
│     when: isSelecting changes from false → true     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ Initialize measurement loop    │
        │ const start = performance.now()│
        │ let accum = ZERO               │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │ requestAnimationFrame(sample) loop:        │
        │ Duration: 600ms max (SAMPLE_MS = 600)     │
        │ Frequency: Every frame (~16.67ms @ 60fps) │
        └────────────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │          │
        ┌───────────▼──────────┴──────────────┐
        │ Each frame: sample() {              │
        │   const current = measure(content)  │
        │   const next = union(accum, current)│
        │                                     │
        │   if (boundsChanged) {              │
        │     accum = next                    │
        │     setBounds(accum) ─────► Re-render
        │   }                                 │
        │                                     │
        │   if (elapsed < 600ms) {            │
        │     raf = requestAnimationFrame()   │
        │   } else {                          │
        │     return (stop looping)           │
        │   }                                 │
        │ }                                   │
        └────────────────────────────────────┘
                         │
                         ▼
        After 600ms, sampling stops
        Final bounds captured ✓

Key Functions:

measure(root: HTMLElement) → Bounds
├─ rr = root.getBoundingClientRect()
├─ For each el in root.querySelectorAll("*"):
│  ├─ r = el.getBoundingClientRect()
│  └─ Expand minX/Y, maxX/Y to include this element
└─ return { top, right, bottom, left }

union(a: Bounds, b: Bounds) → Bounds
├─ top: min(a.top, b.top)
├─ right: max(a.right, b.right)
├─ bottom: max(a.bottom, b.bottom)
└─ left: min(a.left, b.left)
```

---

## Render Output: Layer Stacking

```
┌────────────────────────────────────────────────────────────┐
│           MotionTargetOverlay DOM Tree                     │
│         (when isSelecting = true & hovering)               │
└────────────────────────────────────────────────────────────┘

<div style={{ position: "relative" }}>
  
  ④ <AnimatePresence>
     {isHovered && (
       <motion.div
         style={{
           position: "absolute",
           top: oT - 28,
           left: "50%",
           zIndex: 3,          ← TOPMOST
           transform: "translateX(-50%)",
           background: LABEL_BG,
           color: "#fff",
           animation: opacity 0→1, y 6→0
         }}
       >
         {targetLabel}
       </motion.div>
     )}
  </AnimatePresence>

  ③ <div
     style={{
       position: "absolute",
       top: oT, right: oR, bottom: oB, left: oL,
       zIndex: 2,          ← MIDDLE
       border: BORDER_HOVER,
       background: BG_HOVER,
       boxShadow: SHADOW_HOVER,
       borderRadius: 16,
       transition: "border 220ms, ..."
     }}
  />

  ② <div
     onMouseEnter={() => setIsHovered(true)}
     onMouseLeave={() => setIsHovered(false)}
     onClick={handleClick}
     style={{
       position: "absolute",
       top: oT, right: oR, bottom: oB, left: oL,
       zIndex: 1,          ← MIDDLE
       cursor: "pointer"
     }}
  />

  ① <div ref={contentRef} style={{ pointerEvents: "none" }}>
     {children}            ← ACTUAL COMPONENT
  </div>
  
</div>

Z-Index Hierarchy (topmost to bottommost):
  3: Label pill (only when hovered)
  2: Decorative border + background
  1: Interaction layer (click detection)
  0: Content (children)
```

---

## Data Flow: User Adjusts Parameter

```
page.tsx State:
├── fanConfig = { overlapX: -20, rotateOuter: 11, ... }
└── chatInputConfig = { borderRotateDuration: 4, ... }

                    │
                    ▼
    User moves slider in MotionPanel
                    │
                    ▼
    MotionPanel onChange callback fires
    └─ onChange={setFanConfig} or setChatInputConfig
                    │
                    ▼
    State updates:
    ├── fanConfig = { overlapX: -25, ... }  (changed)
    └── AgentFanCards re-renders with new config
                    │
                    ▼
    AgentFanCards calculates new styles:
    └─ Uses fanConfig.overlapX to position cards
                    │
                    ▼
    Component animates to new position
                    │
                    ▼
    MotionTargetOverlay continues sampling (600ms loop still active)
    └─ Measures new bounds as cards move
                    │
                    ▼
    Overlay border expands/contracts to fit new bounds
    └─ setBounds() → re-render overlay layers
                    │
                    ▼
    User sees real-time visual feedback
    ✓ Slider adjustment → immediate preview
```

---

## Component Integration Checklist

When adding a new motion component (e.g., "my-component"):

```
Step 1: Component Definition (my-component.tsx)
  ├─ Export MotionTargetDef
  │  ├─ id: "my-component"
  │  ├─ label: "My Component Motion"
  │  ├─ schema: [ { key: "param1", min: 0, max: 100, ... }, ... ]
  │  ├─ defaultConfig: { param1: 50, ... }
  │  └─ [optional] states + defaultState
  │
  └─ Props: config, previewState?, onSomething

Step 2: page.tsx Registration (3 changes)
  ├─ Import: import { MY_COMPONENT_MOTION } from "@/components/ui/my-component"
  │
  ├─ State: const [myConfig, setMyConfig] = useState(MY_COMPONENT_MOTION.defaultConfig)
  │
  └─ Render (2 places):
     ├─ Wrap component:
     │  <MotionTargetOverlay
     │    targetId="my-component"
     │    targetLabel={MY_COMPONENT_MOTION.label}
     │    isSelecting={motionMode === "motion-selecting"}
     │    onSelect={handleMotionSelect}
     │  >
     │    <MyComponent config={myConfig} previewState={...} />
     │  </MotionTargetOverlay>
     │
     └─ Add MotionPanel:
        {motionMode === "editing" && motionTarget === "my-component" && (
          <MotionPanel
            targetLabel={MY_COMPONENT_MOTION.label}
            schema={MY_COMPONENT_MOTION.schema}
            config={myConfig}
            defaultConfig={MY_COMPONENT_MOTION.defaultConfig}
            onChange={setMyConfig}
            onClose={handleMotionPanelClose}
          />
        )}

Step 3: Verify
  ├─ npx tsc --noEmit
  └─ npm run build
```

---

## File Dependencies

```
motion-target-overlay.tsx
├─ No internal dependencies
├─ Imports: React, framer-motion
└─ Re-exports: (none)

motion-panel.tsx
├─ Exports: MotionPanel, EditorSelectButton, MotionMode, MotionTargetDef, MotionParamDef
├─ Imports: React, framer-motion, lucide-react
└─ Used by: page.tsx, agent-card.tsx, claude-style-chat-input.tsx

agent-card.tsx
├─ Exports: AgentFanCards, AGENT_CARD_MOTION, DEFAULT_FAN_CONFIG, FanCardsConfig
├─ Imports: React, motion-panel (types only)
└─ Used by: page.tsx

claude-style-chat-input.tsx
├─ Exports: ClaudeChatInput, CHAT_INPUT_MOTION, ChatInputPreviewState
├─ Imports: React, motion-panel (types only)
└─ Used by: page.tsx

page.tsx (Integration Point)
├─ Imports: MotionTargetOverlay, MotionPanel, EditorSelectButton
├─ Imports: AgentFanCards, AGENT_CARD_MOTION
├─ Imports: ClaudeChatInput, CHAT_INPUT_MOTION
└─ Manages: All motion state + callbacks
```


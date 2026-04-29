# Motion System Documentation Index

> Complete reference library for the schema-driven motion editor system.

---

## 📚 Documentation Files

### 1. **MOTION_SYSTEM_INTEGRATION_GUIDE.md**
   - **Purpose:** Step-by-step guide for integrating new motion-enabled components
   - **Audience:** Developers adding new animated components
   - **Key Sections:**
     - Quick start (3-file modification checklist)
     - Core concepts (schema-driven architecture, state machine)
     - Phase 1-3 integration walkthrough
     - Common patterns (hover-based, stagger, physics-based, preview states)
     - Troubleshooting guide (7 common issues + solutions)
     - Advanced topics (derived values, multi-stage animations, performance)

### 2. **AGENT_CARD_MOTION_ANALYSIS.md**
   - **Purpose:** Deep technical analysis of the Agent Card motion system
   - **Audience:** Developers maintaining or extending Agent Cards
   - **Key Sections:**
     - System overview (24 parameters, 8 groups)
     - Complete parameter reference table with ranges/defaults
     - Animation type taxonomy (fan layout, hover physics, shadows, glass, timing)
     - Architecture diagram and data flow
     - Code organization and file structure
     - Detailed visual composition breakdown
     - Control flow analysis with pseudocode
     - Code references (line numbers, implementation details)
     - Key observations about design patterns

### 3. **MOTION_PARAMS_QUICK_REFERENCE.md**
   - **Purpose:** Fast lookup guide for motion parameters and animations
   - **Audience:** Developers working with Agent Cards
   - **Key Sections:**
     - Parameter groups with min/max/default values
     - Animation channels and their timing
     - Dependency map showing parameter relationships
     - Use-case examples (change blur, adjust card overlap, etc.)
     - Integration points in codebase
     - Key formulas (physics calculations)
     - Framer Motion animation targets used

### 4. **docs/motion-editor-system.md**
   - **Purpose:** System design and infrastructure documentation
   - **Audience:** Architects, infrastructure developers
   - **Key Sections:**
     - Quick overview of schema-driven approach
     - Integration checklist for new components
     - Type system definitions
     - State machine diagram
     - Component responsibility table
     - Reference implementation code
     - Appendices: overlay internals, troubleshooting, tech decisions

---

## 🎯 Quick Navigation

### I need to...

#### Add a new motion component
→ Start with **MOTION_SYSTEM_INTEGRATION_GUIDE.md**
   - Follow "Quick Start" section for 3-file modification overview
   - Use "Step-by-Step Integration" for detailed Phase 1-3 walkthrough
   - Reference "Common Patterns" for code examples

#### Understand Agent Card animations
→ Start with **AGENT_CARD_MOTION_ANALYSIS.md**
   - Read "System Overview" for 30-second summary
   - Use "Parameter Reference" table as lookup
   - Check "Animation Type Taxonomy" to understand how animations work together

#### Find a specific parameter or value
→ Use **MOTION_PARAMS_QUICK_REFERENCE.md**
   - Search by parameter name
   - Check "Dependency Map" for parameter relationships
   - Use "Key Formulas" for calculation reference

#### Understand the overall architecture
→ Read **docs/motion-editor-system.md** first, then **MOTION_SYSTEM_INTEGRATION_GUIDE.md**
   - Motion editor system explains infrastructure
   - Integration guide explains practical implementation

#### Debug a motion problem
→ Use **MOTION_SYSTEM_INTEGRATION_GUIDE.md** section: "Troubleshooting"
   - 7 common issues listed with causes and solutions
   - Covers integration, state management, animation, and UI issues

#### Set up preview states for editing
→ **MOTION_SYSTEM_INTEGRATION_GUIDE.md** section: "Common Patterns" → "Pattern 4: Preview States"
   - Shows how to add `states` and `defaultState` to MotionTargetDef
   - Demonstrates integration in page.tsx
   - Shows component usage

---

## 🔑 Key Concepts

### Schema-Driven Architecture
Each motion component exports a `MotionTargetDef` describing:
- **id**: Unique identifier for routing
- **label**: Display name in UI
- **schema**: Array of parameter definitions (min/max/step/group)
- **defaultConfig**: Initial values for all parameters
- **states** (optional): Preview states for editing UI

The motion editor auto-generates a parameter panel from this schema—no custom panel code needed.

### Three-State Machine
```
idle ──(click button)──> motion-selecting ──(click component)──> editing ──(close)──> idle
```

- **idle**: Normal browsing
- **motion-selecting**: Components show blue dashed borders, are hoverable/clickable
- **editing**: Parameter panel slides in, real-time preview on slider changes

### Config Flow
```
slider change → onChange callback → setState → re-render → Framer Motion applies values
```

### Component Structure
```
Component exports:       Page.tsx:
  ↓                        ↓
MotionTargetDef      →  State management
Config interface         Overlay wrapping
Animation logic          Panel rendering
```

---

## 📋 Integration Checklist

Before adding a new motion component, verify:

- [ ] Component exports `MotionTargetDef` with id/label/schema/defaultConfig
- [ ] All schema items have: key, label, min, max, step, group
- [ ] Component accepts `config: Record<string, number>` prop
- [ ] Component accepts optional `isEditorHovered?: boolean` prop
- [ ] Page.tsx has state for component's config
- [ ] Component wrapped in `<MotionTargetOverlay targetId="...">` (matches MotionTargetDef.id)
- [ ] `<MotionPanel>` added to `<AnimatePresence>` with correct condition
- [ ] MotionPanel receives: targetLabel, schema, config, defaultConfig, onChange, onHoverChange, onClose
- [ ] TypeScript: `npx tsc --noEmit` (zero errors)
- [ ] Build: `npm run build` (succeeds)

---

## 📁 File Locations

| File | Type | Purpose |
|------|------|---------|
| `components/ui/motion-panel.tsx` | Component + Types | Auto-slider generation, type definitions |
| `components/ui/motion-target-overlay.tsx` | Component | Selection UI wrapper, boundary measurement |
| `components/ui/motion-select-button.tsx` | Component | Right-corner mode toggle button |
| `components/ui/agent-card.tsx` | Component | Reference implementation (Agent Cards) |
| `app/page.tsx` | Page | State management hub, component orchestration |
| `docs/motion-editor-system.md` | Documentation | System design, architecture |

---

## 🎬 Animation Channels

Agent Card uses three independent animation channels:

### 1. Fan Layout Channel
- **Trigger:** Component mounting
- **Duration:** `fanTransitionDuration` (default 0.60s)
- **Values:** x position, rotation per card
- **Driven by:** Card index, `overlapX`, `rotateOuter`, `rotateInner`, `outerCardOffset`

### 2. Float-Up Channel
- **Trigger:** Hover on card
- **Duration:** `hoverTransitionDuration` (default 0.30s)
- **Values:** y offset (from `yFactor`), scale (from `scaleFactor`)
- **Driven by:** `hoverHeight` (0-1), normalized hover intensity

### 3. Shadow Channel
- **Trigger:** Hover on card
- **Duration:** `hoverTransitionDuration` (same as float-up)
- **Values:** Two shadow layers with independent blur/y/alpha
- **Driven by:** `hoverHeight` interpolated between rest and peak shadow values

---

## 🔧 Developer Workflow

### Adding Agent Card to Motion Editor
1. ✅ Agent Card component exports `AGENT_CARD_MOTION` schema (24 parameters)
2. ✅ Page.tsx maintains `fanConfig` state
3. ✅ AgentFanCards wrapped in `<MotionTargetOverlay>`
4. ✅ MotionPanel conditionally rendered when target === "agent-cards"
5. ✅ All animation values derived from `config` prop

### Adding New Component (e.g., Chat Input)
1. Create component with motion logic
2. Export `MotionTargetDef` (use CHAT_INPUT_MOTION as template)
3. Add state to page.tsx: `const [chatInputConfig, setConfig] = useState(...)`
4. Wrap component: `<MotionTargetOverlay targetId="chat-input" ...>`
5. Add panel condition: `{motionMode === "editing" && motionTarget === "chat-input" && <MotionPanel ... />}`

---

## 🎓 Learning Path

### Beginner: "I want to understand how this works"
1. Read: **docs/motion-editor-system.md** (15 min)
   - Understand the schema-driven pattern
   - Learn the three-state machine
2. Read: **AGENT_CARD_MOTION_ANALYSIS.md** → "System Overview" section (10 min)
   - See concrete example of 24 parameters
   - Understand animation types
3. Skim: **MOTION_PARAMS_QUICK_REFERENCE.md** (5 min)
   - See parameter lookup format

**Total time: ~30 minutes**

### Intermediate: "I need to add a new animated component"
1. Read: **MOTION_SYSTEM_INTEGRATION_GUIDE.md** → "Quick Start" (3 min)
2. Follow: "Step-by-Step Integration" sections 1-3 (20 min)
3. Reference: "Common Patterns" for code examples (5 min)
4. Use: "Checklist" at end to verify all requirements (5 min)

**Total time: ~35 minutes**

### Advanced: "I need to customize Agent Card animations"
1. Skim: **AGENT_CARD_MOTION_ANALYSIS.md** → "Architecture" section (10 min)
2. Reference: **MOTION_PARAMS_QUICK_REFERENCE.md** → "Key Formulas" (5 min)
3. Review: **AGENT_CARD_MOTION_ANALYSIS.md** → "Code References" (10 min)
4. Read: source code with line numbers as guide

**Total time: ~25 minutes**

---

## 🚀 Real-World Examples

### Example 1: Change Agent Card blur effect
1. Open **MOTION_PARAMS_QUICK_REFERENCE.md**
2. Find: `infoBlur` parameter
3. Note: Range is 0-30px, default is 10px
4. In motion editor: Select Agent Cards → Adjust "Info Pane Blur" slider
5. See: Real-time blur change in info pane

### Example 2: Make cards overlap more
1. Open **MOTION_PARAMS_QUICK_REFERENCE.md**
2. Find: `overlapX` parameter
3. Note: Range is -30 to 20px, default is -20px
4. In motion editor: Select Agent Cards → Adjust "Card Overlap" slider
5. See: Cards move closer together or further apart

### Example 3: Add float-up animation to new component
1. Open **MOTION_SYSTEM_INTEGRATION_GUIDE.md**
2. Follow: "Step-by-Step Integration"
3. Reference: "Common Patterns" → "Pattern 3: Physics-Based"
4. Copy: `derivePhysics` function structure
5. Add: `hoverHeight`, `yFactor`, `scaleFactor` parameters to schema
6. Implement: Physics calculations in component

---

## 📖 Type Reference

### MotionTargetDef
```typescript
interface MotionTargetDef {
  id: string;                              // Unique identifier
  label: string;                           // Display name
  schema: MotionParamDef[];                // Parameter definitions
  defaultConfig: Record<string, number>;   // Default values
  states?: string[];                       // Optional preview states
  defaultState?: string;                   // Optional default state
}
```

### MotionParamDef
```typescript
interface MotionParamDef {
  key: string;        // Config key (e.g., "duration")
  label: string;      // Display name (e.g., "Animation Duration")
  min: number;        // Slider minimum
  max: number;        // Slider maximum
  step: number;       // Slider step size
  group: string;      // Grouping category (e.g., "Timing")
}
```

### MotionMode
```typescript
type MotionMode = "idle" | "motion-selecting" | "editing";
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution | Reference |
|-------|----------|-----------|
| Slider doesn't update component | Check config prop is passed and used | Integration Guide → Troubleshooting |
| Blue border doesn't appear | Verify targetId matches MotionTargetDef.id | Integration Guide → Troubleshooting |
| Panel doesn't render | Check condition: `motionTarget === "id"` | Integration Guide → Troubleshooting |
| Animation jerks on slider change | Use useMotionTemplate for expensive calcs | Integration Guide → Advanced Topics |
| Component still animates when panel hovered | Pass isEditorHovered prop | Integration Guide → Troubleshooting |

---

## 📞 Quick Links

- **System architecture:** docs/motion-editor-system.md
- **Integration steps:** MOTION_SYSTEM_INTEGRATION_GUIDE.md
- **Agent Card details:** AGENT_CARD_MOTION_ANALYSIS.md
- **Parameter lookup:** MOTION_PARAMS_QUICK_REFERENCE.md
- **Component files:** components/ui/motion-{panel,target-overlay,select-button}.tsx
- **Implementation:** components/ui/agent-card.tsx
- **State management:** app/page.tsx

---

## ✅ Verification Commands

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Development server
npm run dev

# Test specific component
npm run test components/ui/my-component.tsx
```

---

## 📝 Document Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-10 | Initial comprehensive documentation suite |

---

**Last Updated:** 2026-04-10

For questions or updates, refer to the specific documentation file mentioned above.


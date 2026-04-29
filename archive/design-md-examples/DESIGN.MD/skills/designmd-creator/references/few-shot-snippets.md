# Few-shot Snippets for DESIGN.md Writing

Use this file only for extra range — it is **supplemental**, not primary.

The template (`assets/TEMPLATE_DESIGN.md`) already contains essential few-shot cues at the end of each section. Those are the primary style examples. This file provides additional corpus-faithful variants for when you need to see how a different kind of system (editorial vs. cinematic vs. precision-engineering) would fill the same section. If the template examples already cover the source system's style, you do not need this file at all.

Do not copy these blindly. Adapt them to the source system.

## 1. Visual Theme & Atmosphere

### Editorial warmth
```md
The interface is built around a warm editorial thesis: parchment-toned surfaces, serif-led hierarchy, and restrained UI chrome. It feels authored and tactile rather than default-digital.
```

### Product showcase minimalism
```md
The design language is cinematic and reductionist: solid color fields, aggressive headline compression, and a near-total refusal of decorative noise. Product imagery carries the emotional weight.
```

### Engineering precision
```md
The system feels infrastructural and exacting: monochrome surfaces, ring-like borders, and dense information blocks balanced by strict spacing control. Visual confidence comes from precision rather than flourish.
```

## 2. Color Palette & Roles

### Single-accent budget
```md
### Interactive / Accent
- **Brand Accent** (`#0071e3`): Primary CTA, active links, and the rare high-signal action moment.
- **Accent Restraint Rule**: No secondary accent colors in standard UI chrome.
```

### Warm-neutral system
```md
### Surface
- **Canvas Background** (`#f5f4ed`): Main page canvas with a paper-like warmth.
- **Surface Raised** (`#ffffff`): Cards and inset reading surfaces.

### Border
- **Border Soft** (`rgba(38, 37, 30, 0.12)`): Warm low-contrast edge treatment.
```

### Shadow-as-border system
```md
### Border / Shadow
- **Border Shadow** (`rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`): Primary edge definition replacing conventional borders.
- **Card Stack** (`rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px`): Default multi-layer card treatment.
```

## 3. Typography Rules

### Display compression
```md
### Principles
- **Compression as identity**: Display headlines use tight tracking and low line-height to create billboard-like impact.
- **Release by scale**: Tracking relaxes and line-height opens as text moves into supporting roles.
```

### Serif / sans separation
```md
### Principles
- **Serif for thought, sans for action**: Headlines and editorial framing use serif; controls, labels, and utilities use sans.
- **Warmth over neutrality**: Typography should feel human and literary rather than technical or cold.
```

### Utility-first restraint
```md
### Principles
- **Weight restraint**: Hierarchy comes primarily from size, spacing, and contrast instead of a wide weight ladder.
- **Mono as register shift**: Monospace appears only where the interface needs a technical voice.
```

## 4. Component Stylings

### Pill CTA
```md
**Primary CTA**
- Background: `#0071e3`
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 980px
- Border / Shadow: none
- Hover: background brightens slightly
- Use: high-priority product action
```

### Border-shadow card
```md
**Card Container**
- Background: `#ffffff`
- Border / Shadow: `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px`
- Radius: 12px
- Padding: 24px
- Use: default grouped content surface
```

### Signature workflow module
```md
**Workflow Pipeline**
- Structure: Three connected steps with distinct accent colors and directional flow
- Visual Role: Makes the product's operating model instantly legible
- Use: hero-adjacent storytelling, overview sections, feature framing
```

## 5. Layout Principles

### Cinematic pacing
```md
### Whitespace Philosophy
- **Scene construction**: Full-viewport sections create a scene-by-scene rhythm rather than a continuous scroll of similar blocks.
- **Hero breathing room**: Major product statements sit inside unusually large top and bottom margins.
```

### Editorial pacing
```md
### Whitespace Philosophy
- **Reading cadence**: Text blocks and supporting visuals are spaced like editorial spreads rather than dashboard widgets.
- **Room before ornament**: Separation comes from whitespace first, dividers second.
```

### Precision grid
```md
### Grid & Container
- Max content width: `1200px`
- Grid logic: tight multi-column desktop grid that collapses cleanly without changing content order
- Section layout: dense interior alignment, generous exterior margins
```

## 6. Depth & Elevation

### Minimal-elevation philosophy
```md
**Shadow Philosophy**: Depth is intentionally restrained. Most separation comes from surface contrast and subtle edge definition rather than lifted drop shadows.
```

### Ring-based philosophy
```md
**Shadow Philosophy**: The system uses ring-like shadow treatments as soft boundaries, creating separation without the heaviness of visible borders.
```

### Layered-card philosophy
```md
**Shadow Philosophy**: Borders live inside the shadow stack. Cards should feel precisely separated and lightly lifted, never soft or atmospheric.
```

## 7. Section-shape variants

### Guardrail form
```md
### Do
- Use the accent color only for high-signal actions and interactive emphasis
- Preserve the intended spacing rhythm even when content density increases

### Don't
- Don't add secondary accent colors to solve hierarchy problems
- Don't replace soft ring/shadow boundaries with hard 1px borders unless the system already does so
```

### Motion/state form
```md
### Hover States
- Cards intensify from ambient shadow to elevated shadow
- Links shift from neutral text to accent emphasis

### Focus States
- Focus is indicated with warm ring treatment, not default blue browser outlines

### Transitions
- State changes should feel quick and restrained, never playful or elastic
```

## 8. Responsive Behavior

### Showcase layout collapse
```md
### Collapsing Strategy
- Hero text scales down aggressively while preserving tight tracking proportions
- Side-by-side product moments collapse into stacked narrative blocks
- CTA groups remain visually paired before they wrap
```

### Dense interface collapse
```md
### Collapsing Strategy
- Multi-column information grids compress to two columns, then one
- Navigation reduces to a compact menu without changing label language
- Technical annotations move below primary content instead of disappearing
```

## 9. Agent Prompt Guide

### Showcase prompt
```md
- "Create a hero section on a black background with a 56px display headline, weight 600, line-height 1.07, and tight negative tracking. Use one accent blue only for the primary CTA and keep all secondary controls visually quiet."
```

### Editorial prompt
```md
- "Design a feature card on a warm parchment surface using serif headline typography, restrained sans body text, a soft warm border treatment, and generous internal spacing that feels more like a magazine spread than a dashboard tile."
```

### Precision UI prompt
```md
- "Build a white card with no conventional CSS border. Use a ring-like shadow stack for edge definition, 12px radius, a compact 24px title, and a monochrome palette with one restrained accent reserved for interactive states."
```
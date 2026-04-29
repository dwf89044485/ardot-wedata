# Corpus Patterns for DESIGN.md

Use this file only when the template is not enough.

The template already contains the essential structure and writing cues. This reference should add judgment, not repeat the scaffold.

## What this file is for

Use this file when you need help with questions like:
- should this subsection stay or be deleted?
- does this source signal belong in section 1, 4, or 5?
- should section 7 be guardrails or motion/state behavior?
- am I writing reusable system rules, or just describing one page?
- is the draft still corpus-faithful even though the source system is unusual?

## Source evidence → section mapping

Use this mapping when source materials feel messy or overlapping.

| Source signal | Put it primarily in | Notes |
|---|---|---|
| Overall mood, visual thesis, brand feeling | `1. Visual Theme & Atmosphere` | Use short framing paragraphs, then distill into `Key Characteristics` |
| Repeated accent usage, neutral system, border color logic | `2. Color Palette & Roles` | Group by role, not hue |
| Font pairings, tracking behavior, hierarchy compression | `3. Typography Rules` | Principles should explain why the hierarchy feels the way it does |
| CTA specs, cards, nav, screenshots, branded modules | `4. Component Stylings` | Put operational specs here, not in section 1 |
| Spacing rhythm, container width, section pacing, radius progression | `5. Layout Principles` | Prefer reusable layout rules over one screen description |
| Ring, border, shadow, layering logic | `6. Depth & Elevation` | Explain whether borders live in box model or shadow stack |
| Guardrails or state behavior | `7. Do's and Don'ts` / `Interaction & Motion` | Pick one dominant form |
| Breakpoint changes, collapse rules, touch constraints | `8. Responsive Behavior` | Say what changes and what stays stable |
| AI-usable prompts and quick token lookup | `9. Agent Prompt Guide` | Must be directly runnable by an agent |

## Section decision rules beyond the template

### 1. Visual Theme & Atmosphere
This section is a design thesis, not a mood board. In the corpus, each top-performing DESIGN.md uses 2–3 focused paragraphs that each unpack one core design decision.

Corpus evidence:
- Apple: paragraph 1 = reductive philosophy ("every pixel exists in service of the product"), paragraph 2 = SF Pro optical sizing system with exact tracking values, paragraph 3 = binary black/gray color strategy with single accent
- Cursor: paragraph 1 = warm canvas + text color warmth, paragraph 2 = three-font system (gothic/serif/mono), paragraph 3 = oklab border technique
- Vercel: paragraph 1 = white gallery emptiness, paragraph 2 = Geist compression tracking, paragraph 3 = shadow-as-border philosophy

Then `Key Characteristics` distills these into 6–9 scannable bullets with exact values (hex codes, px values, specific technique names).

Too page-specific (avoid):
- the hero has a large screenshot on the right
- the pricing section uses three cards

### 2. Color Palette & Roles
Group names should reflect the system's own vocabulary, not a generic template.

Corpus evidence — each system uses different group names:
- Apple: Primary / Interactive / Text / Surface & Dark Variants / Button States / Shadows
- Cursor: Primary / Accent / Semantic / Timeline-Feature Colors / Surface Scale / Border Colors / Shadows & Depth
- Vercel: Primary / Workflow Accent Colors / Console-Code Colors / Interactive / Neutral Scale / Surface & Overlay / Shadows & Depth

Some systems also embed implementation token references alongside semantic names. IBM writes every color entry with its Carbon token: `**Blue 60** (#0f62fe): --cds-button-primary, --cds-link-primary`. If the source system uses a token/variable architecture, include the token names — they make the DESIGN.md directly implementable.

If you only know raw colors from the source, infer the role before writing the line item.

Bad:
- `#171717`
- `#f5f4ed`
- `#c96442`

Good:
- **Primary Text** (`#171717`): Main headings and long-form body copy.
- **Canvas Background** (`#f5f4ed`): Warm page background used across primary marketing surfaces.
- **Brand Accent** (`#c96442`): High-signal interactive emphasis used in CTAs and active links.

### 3. Typography Rules
Do not stop at the hierarchy table. The corpus always explains the typographic logic behind the table in `Principles`.

Corpus evidence:
- Apple: "Optical sizing as philosophy" — SF Pro changes letterforms by size. "Negative tracking at all sizes" — not just headlines.
- Cursor: "Gothic compression for impact" — explains tracking relaxation curve from -2.16px to normal. "Serif for soul" — explains why jjannon exists.
- Vercel: "Compression as identity" — text that feels "minified, like code optimized for production." "Three weights, strict roles" — 400/500/600 only.

If the source uses only one family, the `Principles` section should explain how hierarchy is created anyway:
- size contrast
- tracking shifts
- weight restraint
- line-height compression

### 4. Component Stylings
Only keep subsections that are load-bearing for the system.

Usually keep:
- `Buttons`
- `Cards & Containers`
- `Navigation`
- `Image Treatment`

Keep only when relevant:
- `Inputs & Forms`
- `Distinctive Components`

If a branded module appears repeatedly and acts like a signature, it belongs in `Distinctive Components` even if it is not a traditional UI control.

### 5. Layout Principles
This section should read like compositional rules, not generic spacing tokens.

Weak:
- 8px spacing system
- 1200px container

Stronger:
- the system uses compact internal spacing inside cards but generous vertical gaps between sections
- full-width bands alternate with centered content islands to create room-by-room pacing

### 6. Depth & Elevation
Use this section to explain the design philosophy of separation. Every corpus example has a distinct depth story.

Corpus evidence:
- Apple: shadow is rare and mimics studio photography lighting (`3px 5px 30px` at 0.22 opacity). Most elevation comes from background color contrast, not shadows.
- Cursor: borders use perceptually uniform oklab color space. Elevation shadows use dramatically large blur values (28px, 70px) for atmospheric lift.
- Vercel: multi-value shadow stacks where each layer has a purpose — one for "border" (0px spread 1px), one for ambient softness, one for depth at distance, one inner `#fafafa` ring for glow.
- IBM: deliberately shadow-averse — depth comes entirely from background-color layering (white → `#f4f4f4` → `#e0e0e0`). Shadows are reserved for floating elements only (dropdowns, modals). This is a valid depth philosophy — do not invent a shadow ladder for a system that intentionally avoids shadows.

Questions to answer:
- are borders explicit or simulated with shadows/rings?
- does depth come from shadow blur, surface contrast, or both?
- is elevation common or intentionally rare?

If the source has almost no elevation, say that clearly instead of inventing a shadow ladder.

### 7. Do's and Don'ts vs Interaction & Motion
Choose `Do's and Don'ts` when the strongest signals are static design boundaries.

Corpus evidence:
- Apple uses Do's and Don'ts: its rules are about constraints ("ONLY use Apple Blue for interactive elements", "don't introduce additional accent colors", "don't use borders on cards"). Interaction is intentionally minimal.
- Vercel uses Do's and Don'ts: its rules are about technique ("use shadow-as-border instead of CSS border", "don't use positive letter-spacing on Geist").
- Cursor uses Interaction & Motion: its strongest signals are the hover-to-crimson text shift, oklab border focus states, and shadow transition timing (150ms/200ms). These state behaviors are a defining part of the brand.

Choose `Interaction & Motion` when the strongest signals are:
- hover transitions
- focus treatment
- active-state behavior
- animation timing
- stateful UI emphasis

Do not split the section into both forms unless the source clearly gives both enough weight.

### 8. Responsive Behavior
Do not list breakpoints without behavioral change.

Every breakpoint row should imply:
- what collapses
- what scales
- what stays visually consistent

### 9. Agent Prompt Guide
This section fails if it is only a token dump.

Corpus evidence — every good prompt combines natural-language intent with exact values in a single sentence:
- Apple: "Create a hero section on black background. Headline at 56px SF Pro Display weight 600, line-height 1.07, letter-spacing -0.28px, color white."
- Cursor: "Create a hero section on `#f2f1ed` warm cream background. Headline at 72px CursorGothic weight 400, line-height 1.10, letter-spacing -2.16px, color `#26251e`."
- Vercel: "Design a card: white background, no CSS border. Use shadow stack: rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px."

A valid prompt example combines:
- intent (what to build)
- component type
- exact values (colors, sizes, spacing, shadows)
- behavioral constraint or guardrail

### Border Radius Scale
The template provides Micro/Standard/Large/Pill as default tiers, but some systems reject rounding entirely. IBM uses 0px border-radius on buttons, inputs, cards, and tiles — rectangles ARE the design identity, with pill-shaped tags (24px) as the sole exception. If a system’s strongest signal is sharp corners, say so explicitly rather than filling in a generic radius scale.

## Common failure modes to catch

### Structure drift
- adding extra top-level sections that the corpus does not need
- moving layout/depth ideas into section 1 prose
- mixing section 7 guardrails and motion into one muddy section

### Specificity drift
- using vague adjectives instead of exact values
- naming colors by hue instead of by role
- describing one screenshot rather than the system

### Style drift
- writing long generic design essays
- turning component specs into paragraphs
- making `Agent Prompt Guide` too abstract to use

## Fast pre-finish audit

Before you finish, ask:
1. Could another page in the same product reuse these rules?
2. Did I describe the system, not just the current artifact?
3. Are the most distinctive signals expressed as rules, not only examples?
4. If section 7 changed form, was that driven by source evidence?
5. Could an AI agent build from section 9 without guessing core values?
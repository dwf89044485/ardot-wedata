# How to Write a DESIGN.md

A focused guide for writing DESIGN.md files that match the existing format, dimensions, and writing style used in this repository.

This guide stays close to the current DESIGN.md corpus here. The goal is not to invent a new documentation format. The goal is to help teams write new DESIGN.md files that fit the same structure and level of detail.

> A good DESIGN.md turns a brand's visual language into repeatable, implementation-ready rules.

---

## 1. What a strong DESIGN.md should do

A strong DESIGN.md should let a designer, engineer, or AI agent answer these questions clearly:

1. What should this product feel like?
2. Which visual decisions create that feeling?
3. How do those decisions map to color, typography, components, layout, and depth?
4. What makes this design system distinct?
5. What should never be changed or diluted?

If the file cannot guide implementation, it is incomplete.

---

## 2. Use the existing 9-section framework

The DESIGN.md files in this repository follow a stable 9-section structure. New files should follow the same framework.

| # | Section | Purpose |
|---|---------|---------|
| 1 | Visual Theme & Atmosphere | Brand feeling, visual personality, design philosophy |
| 2 | Color Palette & Roles | Semantic color system with exact values and usage roles |
| 3 | Typography Rules | Font families, hierarchy table, and typographic principles |
| 4 | Component Stylings | Buttons, cards, navigation, image treatment, and distinctive components |
| 5 | Layout Principles | Spacing, grid, whitespace, radius, and composition rules |
| 6 | Depth & Elevation | Borders, shadows, surface hierarchy, and elevation logic |
| 7 | Do's and Don'ts / Interaction & Motion | Guardrails, anti-patterns, or motion/state behavior |
| 8 | Responsive Behavior | Breakpoints, touch targets, collapsing rules, and image behavior |
| 9 | Agent Prompt Guide | Quick-reference tokens and example prompts for AI generation |

Section 7 varies slightly in the current corpus:
- most files use **Do's and Don'ts**
- some motion-heavy files use **Interaction & Motion**

Either is acceptable, but the section must still define behavioral boundaries.

---

## 3. Writing rules that apply across the whole file

### 3.1 Pair intent with exact values
Every section should include both:
- a short explanation of design intent
- exact values, roles, or rules

Do not write only mood.
Do not write only tokens.

### 3.2 Use semantic roles, not anonymous values
Prefer:
- **Primary Text** (`#171717`)
- **Brand Accent** (`#0071e3`)
- **Card Shadow** (`rgba(...) ...`)

Do not dump raw values without naming their role.

### 3.3 Use explicit native notation
Prefer native, exact formats:

| Type | Preferred format | Example |
|------|------------------|---------|
| Color | hex / rgba / oklab | `#0071e3`, `rgba(0,0,0,0.8)` |
| Size | px, optionally with rem | `56px (3.5rem)` |
| Weight | numeric | `600` |
| Line Height | unitless ratio | `1.07` |
| Letter Spacing | px | `-0.28px` |
| Radius | px / % | `8px`, `50%`, `9999px` |
| Shadow | full CSS shorthand | `rgba(0,0,0,0.22) 3px 5px 30px 0px` |

### 3.4 Keep the prose short and specific
Good DESIGN.md writing is precise. Avoid vague adjectives unless they are immediately grounded in rules.

Bad:
- clean
- premium
- modern

Good:
- Warm off-white background instead of pure white
- Single accent color reserved for high-signal interactive moments
- Tight display tracking with restrained body typography

### 3.5 Describe reusable patterns, not one page
The file should capture a system that can be reused across pages. Do not narrate a single homepage layout unless that pattern is actually part of the system.

---

## 4. How to write each section

## 1. Visual Theme & Atmosphere
This section sets the overall visual thesis.

Recommended structure:
1. 1–3 short paragraphs
2. a **Key Characteristics** list with 5–8 bullets

What to include:
- overall mood
- visual personality
- typography tone
- color temperature
- what makes the brand recognizably different

Good bullets are concrete:
- Warm cream canvas instead of pure white
- Aggressive negative tracking on display type
- Borders expressed through ring-like shadows
- Product screenshots framed with soft radius and light edge treatment

---

## 2. Color Palette & Roles
Group colors by role, not by hue.

Recommended subsections:
- Primary
- Interactive / Accent
- Semantic
- Text
- Surface
- Border
- Shadow

For each entry, include:
- semantic name
- exact value
- usage role

Recommended format:

```md
- **Primary Text** (`#171717`): Main headings and body copy.
```

This section should explain not just which colors exist, but how each one behaves in the system.

---

## 3. Typography Rules
This section defines the typographic system and its logic.

Recommended structure:
1. **Font Family**
2. **Hierarchy** table
3. **Principles**

The hierarchy table should include:
- Role
- Font
- Size
- Weight
- Line Height
- Letter Spacing
- Notes

Recommended principles cover:
- how hierarchy is created
- where display and body fonts differ
- whether tracking is tight or relaxed
- how weight is distributed across the scale

If the source system uses custom fonts, always include realistic fallbacks.

---

## 4. Component Stylings
This section translates the system into concrete UI patterns.

Minimum coverage:
- Buttons
- Cards & Containers
- Navigation
- Image Treatment
- Distinctive Components

Optional additions when the source supports them:
- Inputs & Forms
- Tags / Badges
- Tables / Lists

For each variant, use a compact spec style:

```md
**Primary CTA**
- Background:
- Text:
- Padding:
- Radius:
- Border / Shadow:
- Hover:
- Focus:
- Use:
```

The **Distinctive Components** subsection is important. Use it for brand-specific modules that define the visual identity and do not fit generic component families.

---

## 5. Layout Principles
This section explains how the interface is composed.

Recommended subsections:
- Spacing System
- Grid & Container
- Whitespace Philosophy
- Border Radius Scale

What to capture:
- base spacing unit
- spacing scale
- max content width
- grid logic
- whitespace rhythm
- radius progression

This section should make the page rhythm legible, not just list sizes.

---

## 6. Depth & Elevation
This section defines edge treatment and hierarchy.

Recommended structure:
1. an elevation table with `Level | Treatment | Use`
2. a short **Shadow Philosophy** explanation
3. optional **Decorative Depth** notes if relevant

What to clarify:
- whether borders are real borders, rings, or shadows
- whether shadows are subtle, layered, or nearly absent
- how focus is expressed
- how surfaces separate from one another

---

## 7. Do's and Don'ts / Interaction & Motion
This section defines behavioral rules and boundaries.

If the source system is mostly static, use:
- **Do** list
- **Don't** list

If the source system expresses strong state behavior, use:
- Hover States
- Focus States
- Active States
- Transitions

In either case, this section should make the system harder to misapply.

---

## 8. Responsive Behavior
This section explains how the system adapts across breakpoints.

Recommended structure:
1. Breakpoints table
2. Touch Targets
3. Collapsing Strategy
4. Image Behavior

The breakpoints table should include:
- Name
- Width
- Key Changes

This section should explain what changes, what stacks, and what must remain visually stable.

---

## 9. Agent Prompt Guide
This section makes the DESIGN.md directly usable for AI generation.

Recommended structure:
1. **Quick Color Reference**
2. **Example Component Prompts**
3. **Iteration Guide**

The example prompts should combine natural-language intent with exact values.

Example:

```md
"Create a hero section on a warm off-white background. Use a 56px display heading with weight 600, line-height 1.07, and letter-spacing -0.28px. Use a single blue accent only for the primary CTA."
```

This section should be compact and immediately reusable.

---

## 5. Research workflow before writing

Before drafting a new DESIGN.md, inspect multiple surfaces from the source brand:
- homepage
- product pages
- pricing page
- docs page
- product UI if accessible
- desktop and mobile views

Extract recurring patterns in:
- colors
- typography
- spacing
- radius
- borders and shadows
- CTA hierarchy
- screenshot framing
- distinctive modules

Do not infer the full system from one hero section.

---

## 6. Quality checklist

- [ ] Uses the current 9-section DESIGN.md framework
- [ ] Section 1 ends with clear Key Characteristics
- [ ] Colors are grouped by role and every value has a use case
- [ ] Typography includes a full hierarchy table
- [ ] Components are documented in compact, implementation-ready specs
- [ ] Layout covers spacing, grid, whitespace, and radius
- [ ] Depth includes both values and philosophy
- [ ] Section 7 defines either guardrails or state behavior clearly
- [ ] Responsive behavior includes breakpoints and adaptation rules
- [ ] Agent Prompt Guide includes quick reference and prompt examples
- [ ] The file is specific enough for an engineer or AI agent to use directly

---

## 7. Recommended template

```md
# Design System of <Company>

## 1. Visual Theme & Atmosphere
<1-3 paragraphs>

**Key Characteristics:**
- 
- 
- 
- 
- 

## 2. Color Palette & Roles
### Primary
- **Primary Text** (`#`):
- **Primary Background** (`#`):

### Interactive / Accent
- **Brand Accent** (`#`):

### Semantic
- **Success** (`#`):
- **Error** (`#`):

### Text
- **Secondary Text** (`#`):

### Surface
- **Surface 100** (`#`):

### Border
- **Border Primary** (`#` or `oklab(...)`):

### Shadow
- **Card Shadow** (`...`):

## 3. Typography Rules
### Font Family
- Display:
- Body:
- Mono:
- Fallbacks:

### Hierarchy
| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
|      |      |      |        |             |                |       |

### Principles
- 
- 
- 

## 4. Component Stylings
### Buttons
### Cards & Containers
### Navigation
### Image Treatment
### Distinctive Components

## 5. Layout Principles
### Spacing System
### Grid & Container
### Whitespace Philosophy
### Border Radius Scale

## 6. Depth & Elevation
| Level | Treatment | Use |
|-------|-----------|-----|
|       |           |     |

**Shadow Philosophy:**

## 7. Do's and Don'ts
### Do
- 
- 
- 

### Don't
- 
- 
- 

## 8. Responsive Behavior
### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
|      |       |             |

### Touch Targets
### Collapsing Strategy
### Image Behavior

## 9. Agent Prompt Guide
### Quick Color Reference
### Example Component Prompts
### Iteration Guide
```

---

## 8. Final rule

Stay close to the structure that already works in the current DESIGN.md corpus.
Do not add new top-level sections unless the source system truly demands them.
The file should feel like the other DESIGN.md files in this repository, not like a different documentation format.
---
name: designmd-creator
description: Create, rewrite, audit, or refine DESIGN.md files so they match the established DESIGN.md corpus structure and writing style. Use this skill whenever the user asks to "write a DESIGN.md", "create a DESIGN.md", "turn a site or brand into a DESIGN.md", "improve an existing DESIGN.md", "align this to the DESIGN.md framework", "extract a design system into markdown", or "make this match the current DESIGN.md corpus", even if they do not mention the skill by name.
version: 0.1.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# DESIGN.md Creator

Create or refine DESIGN.md files using the same framework, section order, density, and writing pattern established by the current DESIGN.md corpus.

## Core objective

Produce a DESIGN.md that is:
- corpus-faithful in structure
- specific in values and roles
- reusable across pages
- directly usable by engineers and AI agents

Do not invent a new documentation format.
Do not add extra top-level sections unless the source system truly requires it.
Do not mix product strategy, team process, or unrelated organizational guidance into the DESIGN.md.

## Why this framework

The 9-section structure mirrors how real design systems decompose. Look at the corpus: Apple's DESIGN.md separates its single-accent-color discipline (section 2) from its cinematic section-pacing (section 5) from its shadow-as-sculpture philosophy (section 6) — each section answers a different implementation question. Cursor splits its oklab border system (section 6) from its three-font-voice strategy (section 3) from its warm-cream surface scale (section 2). Vercel isolates its shadow-as-border technique (section 6) from its three-weight typography rule (section 3) from its workflow accent colors (section 2).

The fixed order means every DESIGN.md in the corpus is instantly navigable — color roles always live in section 2, depth logic always lives in section 6. Engineers can look up exact values without reading prose. Designers can audit consistency by checking section-by-section. AI agents can parse the document into structured tokens for code generation.

## Default output shape

Use the current 9-section framework:

1. `Visual Theme & Atmosphere`
2. `Color Palette & Roles`
3. `Typography Rules`
4. `Component Stylings`
5. `Layout Principles`
6. `Depth & Elevation`
7. `Do's and Don'ts` **or** `Interaction & Motion`
8. `Responsive Behavior`
9. `Agent Prompt Guide`

Section 7 varies by system:
- prefer `Do's and Don'ts` when the strongest design signals are static boundaries — Apple uses this because its interaction model is intentionally minimal (single accent color, no hover shadows, no state animations)
- use `Interaction & Motion` when hover, focus, and transition behavior are distinctive — Cursor uses this because its hover-to-crimson text shift and oklab border focus states are signature interactions

## When to use this skill

Use this skill for any of these tasks:
- drafting a new DESIGN.md from source materials
- rewriting an existing DESIGN.md to match the corpus format
- auditing a DESIGN.md for missing sections or weak writing
- converting visual observations into a proper DESIGN.md
- tightening a template so it matches representative corpus samples

## Workflow

### 1. Identify the task mode

Choose one mode before drafting:
- **Create** — no DESIGN.md exists yet
- **Rewrite** — a DESIGN.md exists but does not match the corpus format
- **Refine** — a DESIGN.md exists and needs tighter structure, values, or writing
- **Audit** — compare a DESIGN.md against the corpus and report gaps

### 2. Gather source evidence

Read the most relevant source materials first.

Prioritize:
- the user's existing DESIGN.md, if present
- representative DESIGN.md files in the current repo, if present
- any template or guide files in the current repo
- the brand/site/product materials the user wants translated into a DESIGN.md

Do not infer the whole system from one hero block when broader materials are available.

### 3. Extract system-level signals

Before drafting, extract recurring patterns in:
- overall atmosphere
- color roles
- typography hierarchy
- component behavior
- layout rhythm
- depth treatment
- responsive adaptation
- AI-ready prompt cues

Stay close to observed evidence.
Avoid speculative brand traits that are not supported by the source materials.

### 4. Draft in corpus style

When drafting, keep the writing pattern consistent with the corpus:

- **Section 1 is a design thesis, not a mood summary.** In the corpus, section 1 uses 2–3 focused paragraphs that each unpack a core design decision — Apple dedicates one paragraph to its reductive philosophy, one to its optical-sizing typography system, and one to its binary color strategy. Cursor does the same with warm-canvas → three-font-voices → oklab-borders. Then `Key Characteristics` distills these into 6–9 scannable bullets with exact values.
- **Section 2 groups colors by semantic role, not by hue.** Apple groups by Primary / Interactive / Text / Surface / Button States / Shadows. Cursor groups by Primary / Accent / Semantic / Timeline / Surface Scale / Border Colors. The grouping names should reflect the system's own vocabulary.
- **Section 3 always has three parts: Font Family → Hierarchy table → Principles.** The Principles sub-section is where the corpus explains *why* the hierarchy feels the way it does — Apple explains optical sizing as philosophy, Vercel explains compression as identity.
- **Section 4 uses compact spec formatting** — key-value pairs, not prose. Each button/card/nav spec reads like a build instruction.
- **Section 5 captures reusable layout rules**, not page descriptions. Apple: "cinematic breathing room" and "compression within, expansion between." Vercel: "gallery emptiness" and "compressed text, expanded space."
- **Section 6 starts with a `Level | Treatment | Use` table**, then explains the depth philosophy in prose. Apple: shadow-as-sculpture. Vercel: shadow-as-border with multi-layer stacks. Cursor: oklab-space atmospheric lift.
- **Section 9 prompts combine natural-language intent with exact values.** Every corpus example writes prompts like: "Create a hero section on black background. Headline at 56px SF Pro Display weight 600, line-height 1.07, letter-spacing -0.28px, color white." — not just "make a hero."

Use the bundled asset `assets/TEMPLATE_DESIGN.md` as the structural starting point when a clean scaffold is needed. That template already embeds the essential section-by-section guidance, so the main drafting flow can stay in one file.

Use the reference files only as supplemental material when you need judgment beyond the template:
- `references/corpus-patterns.md` for edge-case section decisions, source-signal mapping, and failure-mode checks
- `references/few-shot-snippets.md` for additional corpus-faithful style variants and range examples

### 5. Validate before finishing

Check all of the following:
- the 9 sections are present and in the right order
- section 1 ends with clear `Key Characteristics`
- color entries use semantic names, exact values, and use cases
- typography includes `Font Family`, `Hierarchy`, and `Principles`
- component section includes `Buttons`, `Cards & Containers`, `Navigation`, `Image Treatment`, and `Distinctive Components`
- layout includes `Spacing System`, `Grid & Container`, `Whitespace Philosophy`, and `Border Radius Scale`
- depth includes `Level | Treatment | Use` and `Shadow Philosophy`
- section 7 is written as either guardrails or motion behavior, not both mashed together incoherently
- responsive section includes `Breakpoints`, `Touch Targets`, `Collapsing Strategy`, and `Image Behavior`
- agent prompt guide includes `Quick Color Reference`, `Example Component Prompts`, and `Iteration Guide`

## Output expectations

When writing or rewriting a DESIGN.md:
1. Write the full DESIGN.md content. If the user's project already has a DESIGN.md, overwrite it in place. If no DESIGN.md exists, create it at the project root (or the location the user specifies).
2. If useful, append a short note listing any source gaps or assumptions that limited fidelity.

When auditing instead of drafting, produce:
1. a section-by-section gap report
2. exact rewrite recommendations

## Non-goals

Do not:
- add unrelated methodology sections
- add local collaboration advice unless the user explicitly asks for it
- recommend rhetorical tricks as general best practices
- flatten the document into raw tokens without narrative guidance
- keep the document abstract when exact values are available

## Example usage patterns

**Example 1: Create from a live site**
Input: "I just launched my SaaS product at example.com. Turn the visual language into a DESIGN.md so my team can build new pages consistently."
Output: Read the site's styles and visual patterns, then produce a 9-section DESIGN.md at the project root with exact color values, typography specs, and reusable component rules.

**Example 2: Rewrite a vague draft**
Input: "This DESIGN.md is too vague — it says 'modern and clean' but has no actual values. Make it match the corpus."
Output: Overwrite the existing DESIGN.md with tighter sections, exact values, and corpus-faithful structure. Note any values that had to be inferred.

**Example 3: Audit for compliance**
Input: "Check whether this DESIGN.md really follows the framework. We're about to hand it to a contractor."
Output: A section-by-section gap report with specific missing items (e.g., 'Color Palette has no semantic names') and exact rewrite recommendations.

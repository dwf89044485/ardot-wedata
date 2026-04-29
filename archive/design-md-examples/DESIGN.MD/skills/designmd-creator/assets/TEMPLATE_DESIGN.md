# Design System of <Company>

> Write this file in the same 9-section framework used by the existing DESIGN.md files in this repository.
>
> This template is intentionally template-first: the essential structural and writing guidance is embedded here so you can fill it out while looking at one file.
>
> Keep the writing pattern consistent with the corpus:
> - short narrative framing
> - exact semantic values
> - compact component specs
> - clear design guardrails
> - AI-ready prompt examples
>
> Fidelity rules:
> - stay in the 9-section order unless the source system truly forces a change
> - prefer observed brand signals over speculation
> - prefer reusable system rules over one-page description
> - prefer exact values over vague adjectives

---

## 1. Visual Theme & Atmosphere

> Typical shape: 1–3 short paragraphs, then a `Key Characteristics` list with 5–8 bullets.

<Write 1–3 short paragraphs: overall atmosphere, visual personality, color temperature, typographic tone, and what sets this apart from similar products. / 用 1–3 段短文写清楚：整体氛围、视觉人格、色彩温度、排版语气，以及与同类产品最不同的地方。>

**Key Characteristics:**
- <Trait 1: be specific, e.g. "warm off-white canvas instead of pure white" / 写具体，例如"暖白底色而不是纯白">
- <Trait 2: e.g. "display headings use visible negative tracking" / 可写字体气质，例如"展示级标题使用明显负字距">
- <Trait 3: e.g. border/shadow strategy / 可写边界/阴影策略>
- <Trait 4: e.g. page rhythm or hero treatment / 可写页面节奏或主视觉处理>
- <Trait 5: e.g. brand-specific visual signals / 可写品牌特有视觉信号>

**Few-shot style examples:**
- Warm parchment canvas with serif-led editorial pacing
- Shadow-as-border system with compressed sans-serif display typography
- Product-as-hero photography on solid-color fields

---

## 2. Color Palette & Roles

> Subsection names can vary, but the writing pattern must match the corpus: group by **role**, and every color entry needs a semantic name, exact value, and usage context.
> / 子节名称不要求完全一致，但写法要与现有语料一致：按"角色"分组，每个颜色都要有语义名、精确值、使用场景。
>
> Common groupings: Primary / Interactive / Accent / Text / Surface / Border / Shadow / Semantic / Neutral Scale
> / 常见分组：Primary / Interactive / Accent / Text / Surface / Border / Shadow / Semantic / Neutral Scale

### Primary
- **Primary Text** (`#`): <Default body and main headings / 默认正文与主标题>
- **Primary Background** (`#`): <Main background / 主背景>
- **Primary Surface** (`#`): <Primary surface / 主承载面>

### Interactive / Accent
- **Brand Accent** (`#`): <Brand accent / 品牌强调色>
- **Link Color** (`#`): <Link or text interactive color / 链接或文字交互色>
- **Focus Color** (`#`): <Focus state color / 焦点态颜色>

### Text
- **Secondary Text** (`#`): <Secondary text / 次级文字>
- **Tertiary Text** (`#`): <De-emphasized info / 弱化信息>

### Surface
- **Surface 100** (`#`): <Lightest surface / 最浅表面>
- **Surface 200** (`#`): <Default surface / 默认表面>
- **Surface 300** (`#`): <Emphasized surface / 强化表面>

### Border
- **Border Primary** (`#` / `rgba(...)` / `oklab(...)`): <Default border / 默认边界>
- **Border Strong** (`#` / `rgba(...)` / `oklab(...)`): <Strong border / 强调边界>

### Shadow
- **Card Shadow** (`...`): <Default card shadow / 默认卡片阴影>
- **Elevated Shadow** (`...`): <Elevated shadow / 高层级阴影>

### Semantic
- **Success** (`#`): <Success state / 成功态>
- **Warning** (`#`): <Warning state / 警告态>
- **Error** (`#`): <Error state / 错误态>

**Few-shot style examples:**
- **Primary Text** (`#171717`): Main headings and body copy.
- **Brand Accent** (`#0071e3`): Primary CTA, links, and focus rings.
- **Border Primary** (`oklab(0.263084 -0.00230259 0.0124794 / 0.1)`): Standard warm border treatment.

---

## 3. Typography Rules

> Use the fixed three-part structure: `Font Family` / `Hierarchy` / `Principles`. Keep the `Hierarchy` table columns as `Role | Font | Size | Weight | Line Height | Letter Spacing | Notes`.
> / 固定采用 `Font Family` / `Hierarchy` / `Principles` 三段结构。`Hierarchy` 表格保持 `Role | Font | Size | Weight | Line Height | Letter Spacing | Notes`。

### Font Family
- **Display**: <Display font / 展示级字体>
- **Body**: <Body font / 正文字体>
- **Mono**: <Code/technical font, omit if none / 代码/技术标签字体，如无可删>
- **Fallbacks**: <Full fallback chain / 完整 fallback 链>
- **OpenType Features**: <If applicable / 如有可写>

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero |  |  |  |  |  |  |
| Section Heading |  |  |  |  |  |  |
| Sub-heading |  |  |  |  |  |  |
| Card Title |  |  |  |  |  |  |
| Body Large |  |  |  |  |  |  |
| Body |  |  |  |  |  |  |
| Caption |  |  |  |  |  |  |
| Mono Body |  |  |  |  |  |  |

### Principles
- **<Principle 1>**: <How hierarchy is established — e.g. size / weight / tracking / 解释层级靠什么建立，例如尺寸 / 字重 / 字距>
- **<Principle 2>**: <How display and body fonts divide labor / 解释 Display 与 Body 的分工>
- **<Principle 3>**: <Overall tracking, line-height, and weight patterns / 解释字距、行高、字重的总体规律>

**Few-shot style examples:**
- **Compression as identity**: Display typography uses strong negative tracking that relaxes as size decreases.
- **Serif for authority, sans for utility**: Headlines use serif; UI controls and body use sans.
- **Optical sizing as philosophy**: Display and body text shift families at a specific size threshold.

---

## 4. Component Stylings

> Use compact spec formatting, not prose. Keep subsections that best represent the system; remove unused ones, but always keep `Distinctive Components` when the brand has recognizable signature modules.
> / 用紧凑 spec 写法，不写散文。保留最能代表系统的组件；没有的子节可以删，但品牌有强识别模块时应保留 `Distinctive Components`。

### Buttons

**Primary CTA**
- Background:
- Text:
- Padding:
- Radius:
- Border / Shadow:
- Hover:
- Active:
- Focus:
- Use:

**Secondary Button**
- Background:
- Text:
- Padding:
- Radius:
- Border / Shadow:
- Hover:
- Focus:
- Use:

### Cards & Containers
- Background:
- Border / Shadow:
- Radius:
- Padding:
- Hover:
- Use:

### Inputs & Forms
- Background:
- Text:
- Border:
- Radius:
- Focus:

### Navigation
- Background:
- Text:
- Height:
- Border / Shadow:
- Active:
- Mobile Behavior:

### Image Treatment
- Screenshot Style:
- Border / Shadow:
- Radius:
- Background Treatment:
- Use:

### Distinctive Components

**<Brand signature module 1 / 品牌特有模块 1>**
- Structure:
- Visual Role:
- Use:

**<Brand signature module 2 / 品牌特有模块 2>**
- Structure:
- Visual Role:
- Use:

**Few-shot style examples:**
- **Primary CTA**
  - Background: `#0071e3`
  - Text: `#ffffff`
  - Radius: 8px
  - Use: Primary call-to-action
- **Workflow Pipeline**
  - Structure: Three horizontal steps with distinct accent colors
  - Visual Role: Represents the product's core workflow
  - Use: Hero or feature explanation sections

---

## 5. Layout Principles

> Write reusable system rules, not page-specific descriptions. Focus on spacing scale, container logic, whitespace rhythm, and border-radius progression.
> / 本章写可复用的系统规则，不是页面截图描述：重点交代间距 scale、容器逻辑、留白节奏、圆角 progression。

### Spacing System
- Base unit:
- Scale:
- Notes:

### Grid & Container
- Max content width:
- Grid logic:
- Section layout:

### Whitespace Philosophy
- **<Principle 1>**: <How whitespace creates rhythm / 留白如何建立节奏>
- **<Principle 2>**: <How sections are separated / 模块之间如何分隔>
- **<Principle 3>**: <Relationship between text density and outer whitespace / 文本密度与外部留白的关系>

### Border Radius Scale
- Micro:
- Standard:
- Large:
- Pill / Circle:

**Few-shot style examples:**
- **Gallery emptiness**: Generous section spacing creates calm, high-clarity pacing.
- **Cinematic breathing room**: Full-viewport sections create scene-by-scene rhythm.
- **Content island approach**: Alternating surfaces create distinct visual rooms.

---

## 6. Depth & Elevation

> Write the `Level | Treatment | Use` table first, then explain `Shadow Philosophy`. Keep `Decorative Depth` only when it constitutes a meaningful visual signal.
> / 先写 `Level | Treatment | Use` 表，再解释 `Shadow Philosophy`。`Decorative Depth` 只有在它本身构成视觉信号时才保留。

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) |  |  |
| Level 1 |  |  |
| Level 2 |  |  |
| Level 3 |  |  |
| Focus |  |  |

**Shadow Philosophy:**

<Short paragraph explaining how this system handles borders, shadows, rings, and surface layering. / 用一小段说明这个系统如何处理边界、阴影、ring、surface 层级。>

### Decorative Depth
- <Omit if none / 如无可删>

**Few-shot style examples:**
- Borders live in the shadow layer rather than the box model.
- Depth comes from warm ring halos instead of conventional drop shadows.
- Shadows are rare; contrast between surfaces does most of the work.

---

## 7. Do's and Don'ts

> **Decision point**: Choose ONE form for this section based on the source system's strongest signals.
> - If the system's strongest signals are static design boundaries → use `Do's and Don'ts` (the default below)
> - If the system's strongest signals are hover, focus, active states, and animation → rename this section to `## 7. Interaction & Motion` and use `Hover States / Focus States / Active States / Transitions` structure instead
> Do not mix both forms unless the source clearly supports both.
>
> / 只选一种形态：静态边界更强时用 `Do's and Don'ts`；状态行为更强时改成 `Interaction & Motion`。不要两种混写。
> 如果这个系统更强调状态行为而不是静态边界，可以把本章改写为 `## 7. Interaction & Motion`，并使用 `Hover States / Focus States / Active States / Transitions` 结构。

### Do
- <Rule to follow 1 / 应当遵守的规则 1>
- <Rule to follow 2 / 应当遵守的规则 2>
- <Rule to follow 3 / 应当遵守的规则 3>
- <Rule to follow 4 / 应当遵守的规则 4>

### Don't
- <Anti-pattern 1 / 不应出现的做法 1>
- <Anti-pattern 2 / 不应出现的做法 2>
- <Anti-pattern 3 / 不应出现的做法 3>
- <Anti-pattern 4 / 不应出现的做法 4>

**Few-shot style examples:**
- Do use the brand accent only for high-signal interaction moments.
- Do keep the display tracking tight and the whitespace generous.
- Don't introduce extra accent colors into standard UI chrome.
- Don't replace a shadow-border system with CSS borders.

---

## 8. Responsive Behavior

> Don't just list breakpoints — explain what changes and what must stay visually stable.
> / 不只写断点，还要写什么发生变化、什么必须保持稳定。

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile |  |  |
| Tablet |  |  |
| Desktop |  |  |
| Large Desktop |  |  |

### Touch Targets
- Minimum target:
- Notes:

### Collapsing Strategy
- <How column count changes / 列数如何变化>
- <How navigation collapses / 导航如何折叠>
- <How text and buttons scale / 文本与按钮如何缩放>

### Image Behavior
- <Crop, scale, or swap images? / 图片是裁切、缩放还是换图>
- <How screenshots and media adapt on small screens / 截图和媒体在小屏下如何处理>

**Few-shot style examples:**
- Hero: 72px → 36px → 26px while preserving proportional tracking.
- Feature cards: 3-column → 2-column → single column stacked.
- Navigation: horizontal links → hamburger menu.

---

## 9. Agent Prompt Guide

> This section must be directly usable by AI agents: prompts should combine natural-language intent with exact values, not just list tokens.
> / 这一章要能直接给 AI 使用：prompt 里同时写自然语言意图和精确值，不要只列 token。

### Quick Color Reference
- Background:
- Primary Text:
- Accent:
- Border:
- Shadow:

### Example Component Prompts
- "<Write 1 hero prompt with natural-language intent + exact values / 写 1 条 hero prompt，包含自然语言意图 + 精确值>"
- "<Write 1 button or card prompt with intent + values / 写 1 条按钮或卡片 prompt，包含自然语言意图 + 精确值>"
- "<Write 1 layout or module prompt with intent + values / 写 1 条布局或模块 prompt，包含自然语言意图 + 精确值>"

### Iteration Guide
1. <Check color roles are correct / 先检查颜色角色是否正确>
2. <Check typography hierarchy and tracking / 再检查字体层级和字距是否正确>
3. <Check component borders, shadows, radii are consistent / 再检查组件边界、阴影、圆角是否一致>
4. <Check page rhythm and responsive behavior match / 最后检查页面节奏与响应式是否匹配>

**Few-shot style examples:**
- "Create a hero section on a warm off-white background. Use a 56px display heading with weight 600, line-height 1.07, and letter-spacing -0.28px. Use a single accent color only for the primary CTA."
- "Design a card with no CSS border. Use a shadow-border stack, 8px radius, a 24px card title, and restrained body text in a lower-contrast neutral."

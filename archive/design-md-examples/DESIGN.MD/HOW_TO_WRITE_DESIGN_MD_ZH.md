# 如何写 DESIGN.md

这是一份聚焦于 **DESIGN.md 本身** 的中文指南。

目标只有一个：帮助团队写出与本仓库现有 DESIGN.md 在**框架、维度、写法和信息密度**上保持一致的新文件，而不是额外发明一套新的文档格式。

> 一份好的 DESIGN.md，是把品牌视觉语言整理成可重复、可执行、可直接生成界面的规则文档。

---

## 1. 一份好的 DESIGN.md 要解决什么问题

一份合格的 DESIGN.md，应该让设计师、前端工程师或 AI 直接回答这些问题：

1. 这个产品应该给人什么感觉？
2. 这种感觉由哪些视觉规则构成？
3. 这些规则如何映射到颜色、字体、组件、布局和层级？
4. 这个品牌最独特的视觉特征是什么？
5. 哪些做法不能出现？

如果文档只能帮助理解，不能帮助实现，那它还不够完整。

---

## 2. 采用现有 DESIGN.md 的 9 章固定框架

本仓库里的 DESIGN.md 已经形成了稳定结构。新写的文件应尽量保持同样的章节框架。

| # | 章节 | 作用 |
|---|------|------|
| 1 | Visual Theme & Atmosphere | 品牌气质、视觉人格、设计哲学 |
| 2 | Color Palette & Roles | 颜色系统、语义角色、精确值与使用语境 |
| 3 | Typography Rules | 字体族、层级表、排版原则 |
| 4 | Component Stylings | 组件规格、图片处理方式、品牌特有组件 |
| 5 | Layout Principles | 间距、网格、留白、圆角与页面节奏 |
| 6 | Depth & Elevation | 阴影、边框、ring、表面层级 |
| 7 | Do's and Don'ts / Interaction & Motion | 设计边界、反模式或状态行为 |
| 8 | Responsive Behavior | 断点、触控目标、折叠策略、图片响应规则 |
| 9 | Agent Prompt Guide | 面向 AI 的快速参考与示例 prompt |

其中第 7 章在现有样本里有两种写法：
- 多数文件使用 **Do's and Don'ts**
- 少数偏动态的文件使用 **Interaction & Motion**

两者都可以，但这一章必须承担“边界与行为说明”的职责。

---

## 3. 全文通用写法规则

### 3.1 同时写“意图”和“数值”
每一章都应该同时包含：
- 一小段设计意图说明
- 具体、可执行的参数或规则

不要只写感觉。
也不要只列 token。

### 3.2 用“语义角色”组织信息
优先写：
- **Primary Text** (`#171717`)
- **Brand Accent** (`#0071e3`)
- **Card Shadow** (`rgba(...) ...`)

不要只堆裸值。

### 3.3 使用原生、精确的表示方式
推荐格式如下：

| 类型 | 推荐格式 | 示例 |
|------|----------|------|
| Color | hex / rgba / oklab | `#0071e3`, `rgba(0,0,0,0.8)` |
| Size | px，必要时补 rem | `56px (3.5rem)` |
| Weight | 数值 | `600` |
| Line Height | 无单位比例 | `1.07` |
| Letter Spacing | px | `-0.28px` |
| Radius | px / % | `8px`, `50%`, `9999px` |
| Shadow | 完整 CSS shorthand | `rgba(0,0,0,0.22) 3px 5px 30px 0px` |

### 3.4 文案要短、准、可落地
不要写空泛形容词，除非马上落到规则。

不要只写：
- 简洁
- 高级
- 现代

要写：
- 背景不是纯白，而是偏暖的浅色底
- 品牌色只用于高信号交互
- 标题字距偏紧，正文排版克制

### 3.5 写“可复用规律”，不要写“某一页长什么样”
DESIGN.md 记录的是设计系统，不是页面复盘。

不要写：
- Hero 左文右图

要写：
- Hero 区域应保持单一主视觉对象，文案宽度受控，焦点明确

---

## 4. 每一章怎么写

## 1. Visual Theme & Atmosphere
这一章负责定调。

建议结构：
1. 1–3 段短文
2. 一个 **Key Characteristics** 列表（5–8 条）

建议写清楚：
- 整体氛围
- 视觉人格
- 色彩温度
- 排版语气
- 品牌与同类产品最不一样的地方

好的 bullet 应该具体：
- 偏暖的浅色背景，而不是纯白背景
- 展示级标题使用明显的负字距
- 卡片边界更像 ring-shadow，而不是传统 border
- 产品截图统一使用轻边框和柔和圆角

---

## 2. Color Palette & Roles
颜色按“角色”分组，不按“色相”分组。

建议子节：
- Primary
- Interactive / Accent
- Semantic
- Text
- Surface
- Border
- Shadow

每个颜色都建议包含：
- 语义名
- 精确值
- 使用场景

推荐格式：

```md
- **Primary Text** (`#171717`): 主标题与默认正文文字。
```

这一章不只是列颜色，还要说明每种颜色在系统里承担什么角色。

---

## 3. Typography Rules
这一章定义排版系统。

建议结构：
1. **Font Family**
2. **Hierarchy** 表格
3. **Principles**

Hierarchy 表格建议字段：
- Role
- Font
- Size
- Weight
- Line Height
- Letter Spacing
- Notes

Principles 里重点解释：
- 层级靠什么建立
- Display 和 Body 的差异是什么
- 字距是紧还是松
- 字重如何分配

如果源站使用自定义字体，一定要写 fallback。

---

## 4. Component Stylings
这一章把系统落到组件。

最低覆盖范围：
- Buttons
- Cards & Containers
- Navigation
- Image Treatment
- Distinctive Components

如有需要可补充：
- Inputs & Forms
- Tags / Badges
- Tables / Lists

每个变体建议使用紧凑规格写法：

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

其中 **Distinctive Components** 很关键，用来记录品牌特有模块，而不是通用组件。

---

## 5. Layout Principles
这一章解释页面如何组织。

建议子节：
- Spacing System
- Grid & Container
- Whitespace Philosophy
- Border Radius Scale

建议写清楚：
- 基础间距单位
- 间距数列
- 最大内容宽度
- 网格规则
- 留白节奏
- 圆角层级

这一章的目标不是只列尺寸，而是让页面节奏可被复用。

---

## 6. Depth & Elevation
这一章定义层级和边界处理方式。

建议结构：
1. 一个 `Level | Treatment | Use` 表格
2. 一段 **Shadow Philosophy**
3. 如有必要，补 **Decorative Depth**

建议说明：
- 边框是真 border、ring，还是 shadow-border
- 阴影是极轻、分层，还是几乎不用
- focus 如何表达
- surface 如何区分层级

---

## 7. Do's and Don'ts / Interaction & Motion
这一章负责写边界与状态行为。

如果系统偏静态，建议写：
- **Do** 列表
- **Don't** 列表

如果系统偏动态，建议写：
- Hover States
- Focus States
- Active States
- Transitions

不管采用哪种形式，这一章都必须让系统更不容易被误用。

---

## 8. Responsive Behavior
这一章说明系统如何适配不同断点。

建议结构：
1. Breakpoints 表格
2. Touch Targets
3. Collapsing Strategy
4. Image Behavior

Breakpoints 表格建议字段：
- Name
- Width
- Key Changes

重点说明：
- 哪些内容会变化
- 哪些内容会折叠
- 哪些视觉特征必须保持稳定

---

## 9. Agent Prompt Guide
这一章让 DESIGN.md 可以直接被 AI 使用。

建议结构：
1. **Quick Color Reference**
2. **Example Component Prompts**
3. **Iteration Guide**

示例 prompt 应同时包含自然语言意图和精确值。

例如：

```md
"Create a hero section on a warm off-white background. Use a 56px display heading with weight 600, line-height 1.07, and letter-spacing -0.28px. Use a single blue accent only for the primary CTA."
```

这一章应短、直接、可复制。

---

## 5. 写之前怎么调研

写新的 DESIGN.md 之前，至少看这些页面：
- homepage
- product pages
- pricing page
- docs page
- product UI（如果可见）
- desktop 和 mobile

重点提取：
- 重复出现的颜色
- 重复出现的排版层级
- 间距节奏
- 圆角系统
- 边框与阴影策略
- CTA 层级
- 截图处理方式
- 品牌特有模块

不要只看一个 hero 区就直接下结论。

---

## 6. 检查清单

- [ ] 使用了现有 DESIGN.md 的 9 章框架
- [ ] 第 1 章有明确的 Key Characteristics
- [ ] 颜色按角色组织，且每个值都有用途
- [ ] 第 3 章有完整 hierarchy 表
- [ ] 组件写法紧凑、可直接实现
- [ ] 第 5 章覆盖 spacing、grid、whitespace、radius
- [ ] 第 6 章同时写了参数和层级逻辑
- [ ] 第 7 章明确规定了边界或状态行为
- [ ] 第 8 章包含断点和适配规则
- [ ] 第 9 章包含 quick reference 和 prompt 示例
- [ ] 前端或 AI 可以直接拿这份文档开始工作

---

## 7. 推荐模板

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

## 8. 最后一条规则

尽量贴近本仓库里已经成立的 DESIGN.md 写法。
不要随意新增顶层章节，也不要把无关的组织协作、流程管理、业务背景内容混进来。

重点始终只有一个：**把 DESIGN.md 写对。**
# Motion Tuner — 融合架构设计（草案）

> VisBug 的选区交互 + leva 的声明式 API + agent-skills/tuning-panel 的 AI 协作理念 + 自有动效工作流

## 一、产品定位

**在真实 React 应用中，点击任何组件，实时调参，导出代码。AI 生成，人类精调，闭环协作。**

不是通用 CSS 编辑器（VisBug 已经做了）。
不是通用参数面板（leva 已经做了）。
不是 AI Agent 的 prompt 模板（agent-skills/tuning-panel 已经做了）。
是专门为**动效和视觉参数精调**设计的，面向 Design Engineer 的应用内嵌工具，同时原生支持 AI Agent 协作闭环。

## 二、用户故事

```
作为一个 Design Engineer，
我正在用 AI 生成 UI 组件，动效大致对了但细节不对，
我希望能直接在应用里点击这个组件，
弹出它的所有可调参数（动画时长、缓动曲线、模糊、间距...），
拖滑块实时预览效果，
满意后把参数导出回代码，
整个过程不需要切到编辑器、不需要改代码、不需要等热更新。
```

## 三、三层架构

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 3: 工作流层                       │
│                                                          │
│  快捷键激活 → 选区模式 → 点击选中 → 面板弹出 → 调参 →     │
│  预览状态切换 → 代码导出 → 退出                            │
│                                                          │
│  （你的 Motion Editor 已有的三态状态机 + 预览状态）          │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Layer 2: 面板层                        │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ number 滑块  │  │ color 色盘   │  │ select 下拉    │  │
│  │ xy 二维面板  │  │ boolean 开关 │  │ easing 曲线    │  │
│  │ range 区间   │  │ vector 向量  │  │ spring 弹簧    │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  Schema 驱动 → 自动推断控件类型（学 leva）                  │
│  分组折叠 / 手风琴 / 状态过滤（你已有的）                    │
│  代码导出 / 一键复制（你已有的）                             │
│  主题可定制（dark/light + 用户自定义 token）                 │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: 选区层                        │
│                                                          │
│  两种模式：                                               │
│                                                          │
│  A) 声明式选区（你现在的方式）                              │
│     组件主动用 <MotionOverlay> 包裹自己                    │
│     → 只有"报名"的组件才能被选中                           │
│     → 精准、可控、零误选                                   │
│                                                          │
│  B) 自动发现选区（VisBug 方式，进阶能力）                   │
│     扫描页面 DOM，找到所有注册了 MotionTargetDef 的组件     │
│     → 不需要手动包裹 Overlay                              │
│     → 需要某种注册机制（data 属性 / Context / WeakMap）     │
│                                                          │
│  选区视觉：                                               │
│  hover 高亮（蓝色虚线 + 标签气泡）                         │
│  自动测量视觉边界（处理 transform/动画）                    │
│  嵌套选区支持（外层/内层独立选中）                          │
└─────────────────────────────────────────────────────────┘
```

## 四、从 leva 学到的 — API 设计

### 现在你的 API（手动三处注册）

```tsx
// 1. 组件文件：声明 schema
export const MY_MOTION: MotionTargetDef = { id, label, schema, defaultConfig }

// 2. page.tsx：加 state
const [config, setConfig] = useState(MY_MOTION.defaultConfig)

// 3. page.tsx：包裹 Overlay + 条件渲染 Panel
<MotionOverlay><MyComponent config={config} /></MotionOverlay>
{editing && <MotionPanel schema={...} config={...} onChange={...} />}
```

### leva 的 API（一个 hook）

```tsx
const { blur, scale } = useControls({ blur: 12, scale: 1.0 })
```

### 融合后的理想 API

```tsx
// 方案 A：一个 hook 搞定（最简，学 leva）
function MyCard() {
  const config = useMotionTuner("card-hover", {
    hoverHeight: { value: 0.3, min: 0, max: 1.4, step: 0.05 },
    duration:    { value: 0.3, min: 0.1, max: 1, step: 0.05 },
    blur:        { value: 12, min: 0, max: 60, step: 1 },
    color:       "#00C8D6",                    // 自动推断为颜色
    easing:      { options: ["ease-in", "ease-out", "linear"] },
  })

  return (
    <motion.div
      style={{ filter: `blur(${config.blur}px)` }}
      animate={{ y: -config.hoverHeight * 40 }}
      transition={{ duration: config.duration }}
    >
      ...
    </motion.div>
  )
}

// 就这些。不需要：
// ❌ 手动包裹 Overlay（hook 自动注册到 Context）
// ❌ 在 page.tsx 加 state（hook 内部管理）
// ❌ 条件渲染 Panel（Provider 统一处理）
```

```tsx
// 方案 B：声明式 + hook（保留你的 Schema 显式定义，但简化注册）
// 组件文件
export const CARD_MOTION = defineMotion("card-hover", {
  label: "卡片悬浮",
  schema: [
    { key: "hoverHeight", label: "浮起高度", min: 0, max: 1.4, step: 0.05 },
    ...
  ],
  states: ["free", "hover", "default"],
})

function MyCard() {
  const { config, previewState } = useMotion(CARD_MOTION)
  // Overlay 自动包裹，Panel 自动渲染
  ...
}
```

```tsx
// 应用根部只需要一个 Provider
function App() {
  return (
    <MotionTunerProvider
      enabled={process.env.NODE_ENV === "development"}
      theme="dark"
      shortcut="Cmd+Shift+M"
    >
      <YourApp />
    </MotionTunerProvider>
  )
}
```

## 五、从 VisBug 学到的 — 选区 + 激活方式

### 快捷键激活（而不是固定按钮）

```
Cmd+Shift+M → 进入调参模式
所有注册过 useMotionTuner 的组件显示虚线轮廓
点击选中 → 面板弹出
Escape → 退出
```

VisBug 用的是浏览器扩展图标激活。
你用的是右下角固定按钮。
产品化可以两者都支持 — 快捷键 + 可选的浮动按钮。

### 选区信息增强（学 VisBug 的 hover 检查）

hover 到一个组件时，不只是显示名称标签，还可以显示：
- 当前参数数量（如 "12 params"）
- 是否有修改过的参数（如 "3 changed"）
- 组件的当前状态（如 "hover"）

### 多选支持（VisBug 的 Shift+Click）

选中多个组件 → 面板显示它们的**共有参数**（比如多个卡片都有 duration 参数）→ 批量调参。这是 VisBug 有但你没有的能力。

## 六、独有优势 — 其他工具都没有的

### 1. 预览状态管理

```
调动画参数时，需要看到动画的不同阶段。
比如调 hover 投影，你需要组件锁定在 hover 态。
比如调入场动画，你需要能反复触发入场。

面板顶部的状态切换器：[不锁定] [Hover] [默认] [激活]
```

这个功能 leva / VisBug / Tweakpane / Theatre.js 都没有。
这是因为他们不了解"动效调参"这个具体场景的需求。

### 2. 代码导出 = 持久化桥梁

调完参数后的导出格式分两种，服务不同场景：

**A) 全量导出（给源码用）：**
```typescript
export const config = {
  hoverHeight: 0.35,
  duration: 0.45,
  blur: 16,
  ...
};
```

**B) Diff 导出（给 AI Agent 用，学 agent-skills/tuning-panel）：**
```markdown
## Tuned Parameters for CardHoverAnimation

### Changes from Defaults
- hoverHeight: 0.30 → 0.35（增加悬浮感）
- duration: 0.30 → 0.45（更丝滑的过渡）
- blur: 12 → 16（更柔和的毛玻璃）

### Apply These Values
Update `src/components/Card.tsx` with the values above.
```

Diff 格式的关键设计（学自 agent-skills/tuning-panel）：
- **只导出变化的参数** — 100 个参数中只改了 3 个，就只导出这 3 个
- **显示 default → current** — 一眼看出改了什么、改了多少
- **浮点数用容差比较** — `Math.abs(a - b) > 0.001`，避免浮点误差
- **Markdown 格式** — 直接粘贴到 AI 对话中，AI 可以立即理解并应用
- **可选：附带调参理由** — 如 "增加悬浮感"，帮助 AI 理解意图

### 3. Schema 驱动的 linkedState

```
展开"Hover 投影"参数组 → 组件自动切换到 hover 状态
展开"默认投影"参数组 → 组件自动切换到 default 状态
```

参数分组和预览状态联动，调参时自动看到对应的视觉效果。

## 七、竞品全景图

### 通用参数面板

| 工具 | Stars | 定位 | 核心能力 | 缺什么 |
|------|-------|------|---------|--------|
| **leva** (pmndrs) | 5.9k | React-first GUI 面板 | 单 hook API、12+ 控件类型自动推断、插件系统 | 无选区、无预览状态、无代码导出 |
| **Tweakpane** | 3.5k+ | 零依赖纯 JS 面板 | Graph 监控、Import/Export 预设、插件系统 | 非 React 原生、无选区 |
| **dat.GUI** | 7.6k | 元老级参数 GUI | Three.js 生态标配 | 已停止维护 |

### 动画专用编辑器

| 工具 | Stars | 定位 | 核心能力 | 缺什么 |
|------|-------|------|---------|--------|
| **Theatre.js** | 11k+ | 专业动画序列编辑器 | 时间线、关键帧、曲线编辑 | 太重（整个 Studio IDE）、学习曲线陡峭 |
| **framer-motion-theatre** | ~200 | Theatre.js + framer-motion 桥接 | 声明式 API 包装 | 依赖 Theatre.js、维护不活跃 |

### 页面可视化设计工具

| 工具 | Stars | 定位 | 核心能力 | 缺什么 |
|------|-------|------|---------|--------|
| **VisBug** (Google) | 5.7k | "设计师的 FireBug" | 点击选中、hover 检查、文字编辑、布局微调 | 无参数面板、无持久化、2020 年后停更 |
| **Onlook** | 25k | "设计师的 Cursor" | 可视化编辑 Next.js 应用、DOM↔源码双向映射、AI 辅助、代码插桩自动标记元素 | 是完整 IDE 而非嵌入式工具、绑定 Next.js+Tailwind、不支持动效参数调优 |
| **react-dev-inspector** | — | 点击组件跳转源码 | Babel 注入 data 属性、overlay 高亮 | 只做定位、不能调参 |

### 单一参数可视化

| 工具 | 定位 | 核心能力 | 缺什么 |
|------|------|---------|--------|
| **Motion Spring Visualizer** | 弹簧动画可视化 | 拖滑块看曲线、复制代码 | 只有 spring 三参数、独立网页 |
| **Easing Functions Cheat Sheet** | 缓动函数参考 | 可视化曲线 | 只是参考，不能调参 |

### AI Agent 集成

| 工具 | Stars | 定位 | 核心能力 | 缺什么 |
|------|-------|------|---------|--------|
| **agent-skills/tuning-panel** | 4 | AI 编码 Agent 的调参技能 | 教 AI 生成调参面板、LLM 导出格式、200+ 参数分类表 | 只是 prompt 模板，不是运行时工具 |

### Motion Tuner 的位置

**没有任何一个工具同时做到这五件事：**
1. ✅ 应用内嵌可视化选区（VisBug 有，leva 没有）
2. ✅ Schema 驱动自动面板（leva 有，VisBug 没有）
3. ✅ 预览状态管理（全部都没有）
4. ✅ 代码导出 + AI 友好的 Diff 导出（agent-skills 有概念，但没有运行时工具）
5. ✅ 一个 hook 零配置（leva 有，但只是面板，没有选区和工作流）

## 八、从 agent-skills/tuning-panel 学到的 — AI 协作层

### 8.1 核心理念

agent-skills/tuning-panel 不是一个工具，而是一套"菜谱" — 它教 AI Agent 怎么为组件生成调参面板。它的三个设计决策对 Motion Tuner 非常有价值：

**决策 1："宁多勿少"原则**
> 当用户在调参时，暴露每一个可能影响结果的参数。漏掉一个参数就要切换上下文；多几个参数只多几行滚动。

**决策 2：LLM 导出只导 Diff**
> 不导出全部 100 个参数。只导出改变的 3 个，用 `default → current` 格式。因为导出的目标是给另一个 AI 会话看的 — 节省 token，一眼看出改了什么。

**决策 3：200+ 参数分类参考表**
> 按领域分类所有可调参数 — Animation (timing/easing/spring)、Layout (spacing/sizing/flex)、Visual (color/shadow/blur)、Typography、Transform、Physics。定义了"一个通用调参工具应该覆盖哪些参数类型"。

### 8.2 参数发现策略（学 agent-skills/tuning-panel）

tuning-panel 定义了 5 种方法让 AI 自动发现组件中的可调参数：

1. **搜索 magic numbers** — 代码中所有硬编码的数值
2. **搜索 style 对象** — CSS-in-JS、inline styles、theme values
3. **搜索动画定义** — framer-motion animate/transition、CSS transition
4. **搜索颜色值** — hex/RGB/HSL，任何出现在文件中的颜色
5. **搜索组件 props 默认值** — 有 numeric/color 默认值的 props

**对 Motion Tuner 的意义：** 未来可以做一个配套的 AI Agent Skill，让 AI 分析组件源码后自动生成 `useMotionTuner` 调用，而不需要开发者手写 Schema。

### 8.3 AI → 人类 → AI 闭环

```
┌──────────────────────────────────────────────────┐
│                 AI ↔ Human 闭环                    │
│                                                    │
│  ① AI 生成组件代码                                  │
│     ↓                                              │
│  ② AI 分析代码，自动生成 useMotionTuner Schema      │
│     （用 agent-skills 的参数发现策略）               │
│     ↓                                              │
│  ③ 人类在应用中点击组件，拖滑块精调                   │
│     （Motion Tuner 的选区 + 面板 + 预览状态）        │
│     ↓                                              │
│  ④ 人类点击"导出给 AI"                              │
│     → 生成 Diff 格式：default → tuned              │
│     → 自动复制到剪贴板                              │
│     ↓                                              │
│  ⑤ 人类粘贴到 AI 对话                               │
│     → AI 读取 Diff，直接 apply 到源码               │
│     → 或 AI 学习用户偏好，下次生成更准               │
│                                                    │
│  未来进阶：                                         │
│  ⑤' 一键写回源码（dev server 中间件，跳过粘贴步骤）  │
│  ⑥  AI 从多次调参 Diff 中学习用户的动效偏好          │
│      → 建立个人"动效品味模型"                        │
│      → 下次生成时直接命中用户偏好                     │
└──────────────────────────────────────────────────┘
```

### 8.4 预设系统（学 agent-skills/tuning-panel + Tweakpane）

```tsx
const PRESETS = {
  snappy:  { duration: 0.15, stiffness: 400, damping: 30 },
  smooth:  { duration: 0.40, stiffness: 180, damping: 20 },
  bouncy:  { duration: 0.60, stiffness: 120, damping: 8  },
  elegant: { duration: 0.35, stiffness: 220, damping: 28 },
};

// 面板顶部提供预设选择器
// 选择预设 → 所有参数一键填入 → 在此基础上微调
```

预设的价值：
- 降低新手门槛（不知道参数怎么配？选个预设开始）
- 团队统一动效风格（共享预设文件）
- AI 可以推荐预设（"你的页面风格偏 elegant，建议从 elegant 预设开始调"）

## 九、功能分层路线

### v0.1 — 核心体验（从 wedata 提取）
- [ ] `MotionTunerProvider` — 全局状态管理
- [ ] `useMotionTuner(id, schema)` — 一个 hook 注册 + 返回值
- [ ] 自动 Overlay（hook 调用即注册，不需要手动包裹）
- [ ] 自动 Panel（Provider 统一渲染，不需要条件渲染）
- [ ] 三态状态机：idle → motion-selecting → editing
- [ ] 控件：number 滑块 + XY pad
- [ ] 双模式代码导出：全量（给源码）+ Diff（给 AI）
- [ ] 快捷键激活 + 可选浮动按钮
- [ ] dark/light 主题
- [ ] debug-mode only（生产环境自动隐藏）

### v0.2 — 控件扩展（学 leva）
- [ ] 控件类型自动推断（传 `'#ff0000'` 自动渲染色盘）
- [ ] color picker
- [ ] select 下拉
- [ ] boolean 开关
- [ ] easing 曲线编辑器（独有！）
- [ ] spring 参数编辑器（stiffness/damping/mass 可视化，独有！）

### v0.3 — 工作流增强
- [ ] 预览状态管理 + linkedState
- [ ] 多选批量调参（学 VisBug）
- [ ] hover 信息增强（参数数量、修改标记）
- [ ] 参数搜索/过滤
- [ ] undo/redo 历史
- [ ] 预设系统（snappy/smooth/bouncy/elegant + 自定义预设）

### v0.4 — AI 协作 + 持久化
- [ ] LLM Diff 导出增强（附带调参理由、文件位置提示）
- [ ] 配套 Agent Skill — 让 AI 分析组件代码自动生成 useMotionTuner Schema
- [ ] localStorage 持久化
- [ ] JSON 预设导入/导出（学 Tweakpane）
- [ ] 一键写回源码（dev server 中间件）

### v1.0 — 生态
- [ ] 插件系统（自定义控件类型）
- [ ] 脱离 framer-motion，支持 CSS/GSAP/react-spring
- [ ] Vue/Svelte 适配层
- [ ] 浏览器扩展版本（学 VisBug）
- [ ] AI 动效偏好学习（从多次 Diff 中建模用户品味）

## 十、名字候选

| 名字 | 感觉 |
|------|------|
| **motion-tuner** | 直白，"动效调参器" |
| **tunable** | 简洁，"可调的" |
| **vistune** | vis(visual) + tune，可视化调参 |
| **motionkit** | 动效工具包 |
| **tweakmotion** | tweak + motion |
| **pixelknob** | 像素旋钮，有画面感 |

## 十一、核心差异化总结

```
leva 说："给我参数定义，我给你面板。"
VisBug 说："点击页面上的元素，直接改。"
Theatre.js 说："用时间线编排复杂动画。"
agent-skills 说："让 AI 帮你生成调参面板。"
Onlook 说："在可视化 IDE 里编辑整个应用的 UI，写回代码。"

Motion Tuner 说："在你的应用里点击任何组件，
实时调它的动效参数，调完导出代码给 AI 或源码。
一个 hook，零配置。AI 生成，人类精调，闭环协作。"
```

这个定位目前没有直接竞品。

---

## 十二、Onlook 深度分析 — 值得学习的技术点

**Onlook** (25k stars) 是 "设计师的 Cursor"，一个可视化编辑 Next.js 应用的开源 IDE。跟 Motion Tuner 方向不同（它做整个应用 UI 编辑，我们做动效参数精调），但有三个技术点值得借鉴：

### 12.1 代码插桩（Instrumentation）— DOM ↔ 源码双向映射

Onlook 的核心技术：对代码进行插桩，给每个渲染出来的 DOM 元素自动打上标记（data 属性），记录它对应的源码文件+行号。这样点击任意元素就能定位到代码。

**对 Motion Tuner 的意义：**
- 当前：用 `ref` 手动关联 DOM 元素和参数 schema
- 未来（v0.3+）：可以借鉴插桩思路，`useMotionTuner` 调用时自动给 DOM 元素打 `data-motion-tuner-id` 标记，选区引擎扫描页面找到所有带标记的元素，不需要手动传 ref
- v0.1 不需要这么复杂，ref 方案够用

### 12.2 编辑的双层写入 — 先改 DOM，再改代码

Onlook 修改样式时：先直接操作浏览器 DOM（零延迟，即时视觉反馈），再异步写回源码文件（持久化）。

**对 Motion Tuner 的意义：**
- 当前：拖滑块 → 实时改 DOM（已有）→ 手动复制代码导出
- 未来（v0.4）："一键写回源码"功能可以学这个模式：
  - 拖滑块 → 即时改 DOM（实时预览）
  - 点导出 → dev server 中间件异步写回源码文件
  - 参考 react-dev-inspector 的 `/__open-in-editor?file=...&line=...` 模式

### 12.3 右键定位到代码位置

Onlook 支持右键点击任意元素 → 直接跳转到 IDE 中对应的源码位置。

**对 Motion Tuner 的意义：**
- 面板里可以加一个"在编辑器中打开"按钮
- 点击 → 打开组件源码文件中 MotionTargetDef 定义的位置
- 需要在 register 时记录源码位置（可以用 Error stack trace 或编译时注入）

### 12.4 不需要学的

- 完整 IDE 功能（Figma 导入、部署、协作）— 跟我们场景无关
- CodeSandbox 沙箱 — 我们在用户自己的应用里运行
- 绑定 Next.js + TailwindCSS — 我们的 Core 要框架无关

---

## 附录：参考资源

| 来源 | 位置 | 价值 |
|------|------|------|
| leva 源码 | `node_modules/leva`（测试用，需清理） | Hook API 设计范式、12+ 控件类型、插件架构 |
| VisBug 源码 | [GitHub](https://github.com/GoogleChromeLabs/ProjectVisBug) | 选区交互实现、hover 检查、多选 |
| Onlook 源码 | [GitHub](https://github.com/onlook-dev/onlook) | 代码插桩（DOM↔源码映射）、双层写入（DOM 先改→代码后写）、右键定位源码 |
| agent-skills/tuning-panel | `.agents/skills/tuning-panel/` | AI 协作理念、LLM 导出格式、参数发现策略 |
| 参数分类参考表 | `.agents/skills/tuning-panel/references/parameter-categories.md` | 200+ 可调参数的完整分类（v0.2 控件扩展的参考） |
| React + leva 实现参考 | `.agents/skills/tuning-panel/references/react-leva.md` | leva 全控件类型用法、debug 模式、持久化模式 |
| LLM 导出格式模板 | `.agents/skills/tuning-panel/examples/export-format.md` | Diff 导出的完整格式定义和实现代码 |
| 动画调参面板示例 | `.agents/skills/tuning-panel/examples/react-leva-animation.tsx` | 完整的 leva + framer-motion 调参面板实现 |
| Tweakpane 文档 | [tweakpane.github.io](https://tweakpane.github.io/docs/v3/) | Import/Export 预设、Graph 监控、零依赖架构 |
| Motion Spring Visualizer | [motion-spring-visualizer.com](https://www.motion-spring-visualizer.com/) | spring 参数可视化交互参考 |
| 现有 Motion Editor | `components/ui/motion-panel.tsx` + `motion-target-overlay.tsx` | 选区、面板、预览状态的已验证实现（1700 行） |

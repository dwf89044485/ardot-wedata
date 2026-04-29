# Motion Tuner — 技术架构设计文档

> 纯 JS Core + 框架绑定层 + 配套 AI Skill
> 统一替代 leva / Tweakpane / lil-gui / dat.GUI

**版本:** v0.1 Draft
**日期:** 2026-04-16
**状态:** DESIGN

---

## 1. 设计原则

1. **Core 框架无关** — 面板、选区、控件、导出全部用纯 JS + DOM API 实现，不依赖 React/Vue/Svelte
2. **绑定层极薄** — React hook / Vue composable 只做"值桥接到响应式系统"这一件事
3. **一次注册，自动一切** — 调用 `register()` 或 `useMotionTuner()` 后，选区、面板、导出全自动
4. **Schema 声明式，控件自推断** — 传 `0.3` 自动生成 slider，传 `'#ff0000'` 自动生成 color picker
5. **开发态专属** — 生产环境零开销（tree-shake 或条件加载）
6. **AI 友好** — 导出格式专为 LLM 设计，配套 Skill 实现自动参数发现

---

## 2. 系统总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户代码                                   │
│                                                                   │
│  React:  const {config} = useMotionTuner("card", schema)         │
│  Vue:    const {config} = useMotionTuner("card", schema)         │
│  JS:     tuner.register("card", schema, element)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │     Framework Bindings     │ ← 极薄层，几十行代码
              │                           │
              │  React: hook + ref        │
              │  Vue: composable + ref    │
              │  Vanilla: 直通 Core API   │
              └─────────────┬─────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                                                                   │
│                     motion-tuner-core                             │
│                     （纯 JS，零框架依赖）                           │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Engine   │  │  Panel   │  │ Overlay  │  │  Export Engine   │ │
│  │          │  │          │  │          │  │                  │ │
│  │ 状态机    │  │ 面板 UI  │  │ 选区引擎  │  │ 全量 / Diff     │ │
│  │ Target   │  │ 控件渲染  │  │ 边界测量  │  │ LLM Markdown   │ │
│  │ Registry │  │ 分组折叠  │  │ hover 高亮│  │ 剪贴板复制     │ │
│  │ Config   │  │ 代码区   │  │ 标签气泡  │  │                  │ │
│  │ Store    │  │ 主题适配  │  │ 点击检测  │  │                  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ Schema   │  │ Shortcut │  │  Theme   │                       │
│  │ Resolver │  │ Manager  │  │  System  │                       │
│  │          │  │          │  │          │                       │
│  │ 类型推断  │  │ 快捷键   │  │ dark/    │                       │
│  │ 值→控件  │  │ 绑定解绑 │  │ light/   │                       │
│  │ 映射     │  │          │  │ custom   │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────▼─────────────┐
              │     AI Agent Skill         │ ← 配套 prompt 模板
              │                           │
              │  自动参数发现               │
              │  自动生成 register 代码     │
              │  读取 Diff 导出 → apply    │
              └───────────────────────────┘
```

---

## 3. Core 模块设计

### 3.1 Engine — 核心引擎

引擎是整个系统的中枢，管理状态机和 target 注册表。

```typescript
// ── 创建实例 ────────────────────────────────────────────────────
interface MotionTunerOptions {
  enabled?: boolean;              // 默认 true
  theme?: MotionTunerTheme;       // 主题对象
  locale?: "zh-CN" | "en";       // UI 文案语言
  shortcut?: string;              // 激活快捷键，默认 "Meta+Shift+M"
  triggerPosition?: Position;     // 激活按钮位置
  panelPosition?: Position;       // 面板初始位置
  onExport?: (format: "code" | "diff", data: string) => void;
}

function createMotionTuner(options?: MotionTunerOptions): MotionTunerInstance;
```

```typescript
// ── 实例 API ────────────────────────────────────────────────────
interface MotionTunerInstance {
  // 生命周期
  mount(container?: HTMLElement): void;   // 挂载到 DOM（Portal 面板/选区）
  unmount(): void;                        // 清理
  destroy(): void;                        // 销毁实例

  // Target 注册
  register(id: string, schema: SchemaInput, element: HTMLElement): UnregisterFn;
  unregister(id: string): void;

  // 状态
  getMode(): Mode;                        // idle | motion-selecting | editing
  getActiveTarget(): string | null;
  getConfig(id: string): Record<string, any>;
  setConfig(id: string, config: Record<string, any>): void;

  // 控制
  activate(): void;                       // → motion-selecting
  select(id: string): void;              // → editing
  close(): void;                          // → idle

  // 事件
  on(event: "change", handler: ChangeHandler): UnsubscribeFn;
  on(event: "mode-change", handler: ModeChangeHandler): UnsubscribeFn;
  on(event: "select", handler: SelectHandler): UnsubscribeFn;
  on(event: "export", handler: ExportHandler): UnsubscribeFn;

  // 导出
  exportCode(id: string): string;         // TypeScript config 对象
  exportDiff(id: string): string;         // Markdown diff 格式
}
```

#### 3.1.1 状态机

```
                    activate()              select(id)               close()
         ┌──────── idle ──────────────► motion-selecting ──────────────► editing ─────────┐
         │           ▲                      │                                      │
         │           │       close()        │                                      │
         │           └──────────────────────┘                                      │
         │                                                                         │
         └─────────────────────────────────────────────────────────────────────────┘
                                         close()

  idle:
    - 选区隐藏
    - 面板隐藏
    - 激活按钮显示 "编辑动效"（或自定义文案）

  motion-selecting:
    - 遍历 TargetRegistry，对每个已注册 target 的 element 显示 overlay
    - hover 高亮 + 标签气泡
    - 点击 → 触发 select(id) → 进入 editing

  editing:
    - 选区隐藏
    - 面板显示（渲染选中 target 的 schema 控件）
    - 拖滑块 → onChange → store 更新 → 通知绑定层 → 组件 re-render
```

#### 3.1.2 Target Registry

```typescript
interface RegisteredTarget {
  id: string;
  schema: ResolvedSchema;        // 经过类型推断后的标准化 schema
  defaultConfig: Record<string, any>;
  currentConfig: Record<string, any>;
  element: HTMLElement;           // DOM 元素引用（用于选区测量）
  options: {
    label?: string;
    states?: StateDef[];
    defaultState?: string;
  };
}

// 内部用 Map 存储
// register() 时加入，unregister() 或组件卸载时移除
```

#### 3.1.3 Config Store

```typescript
// 每个 target 独立的 config 存储
// 支持：
// - get/set 单个值
// - reset 单个参数 / 全部重置
// - diff 计算（current vs default）
// - 变更通知（发布/订阅模式）

interface ConfigStore {
  get(id: string): Record<string, any>;
  set(id: string, key: string, value: any): void;
  setBatch(id: string, partial: Record<string, any>): void;
  reset(id: string, key?: string): void;     // key 省略则全部重置
  getDiff(id: string): DiffEntry[];           // 只返回变化的参数
  subscribe(id: string, handler: (config: Record<string, any>) => void): UnsubscribeFn;
}

interface DiffEntry {
  key: string;
  label: string;
  defaultValue: any;
  currentValue: any;
}
```

---

### 3.2 Schema Resolver — 类型推断引擎

将用户传入的简写 schema 标准化为内部统一格式。

```typescript
// ── 用户传入的 schema（灵活格式）──────────────────────────────

type SchemaInput = Record<string, SchemaEntry>;

type SchemaEntry =
  | number                                    // 纯数字 → slider（无约束）
  | string                                    // 字符串 → 看内容推断
  | boolean                                   // 布尔 → switch
  | NumberSchema                              // 带约束的数字
  | ColorSchema                               // 颜色
  | SelectSchema                              // 下拉选择
  | BooleanSchema                             // 显式布尔
  | XYSchema                                  // 二维面板
  | VectorSchema;                             // 向量

interface NumberSchema {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  group?: string;
  linkedState?: string;
}

interface SelectSchema {
  value?: string;
  options: string[] | Record<string, string>;
  label?: string;
  group?: string;
}

// ... 其他类型类似
```

```typescript
// ── 标准化后的内部格式 ─────────────────────────────────────────

interface ResolvedParam {
  key: string;
  type: ParamType;               // "number" | "color" | "boolean" | "select" | "xy" | "vector" | "spring"
  label: string;                 // 显示名（默认 = key）
  group: string;                 // 分组名（默认 = "Parameters"）
  defaultValue: any;
  config: any;                   // 类型特定配置（如 min/max/step/options）
  linkedState?: string;
  dividerBefore?: boolean;
}

type ResolvedSchema = ResolvedParam[];
```

```typescript
// ── 推断规则 ────────────────────────────────────────────────────

function resolveSchema(input: SchemaInput): ResolvedSchema {
  return Object.entries(input).map(([key, entry]) => {
    // 1. 纯数字 → number slider
    if (typeof entry === "number") {
      return { key, type: "number", label: key, group: "Parameters",
               defaultValue: entry, config: { min: undefined, max: undefined, step: undefined } };
    }

    // 2. 字符串 → 检测是否为颜色
    if (typeof entry === "string") {
      if (isColorString(entry)) {
        return { key, type: "color", label: key, group: "Colors",
                 defaultValue: entry, config: {} };
      }
      // 普通字符串暂不支持（v0.1 不需要 string 控件）
    }

    // 3. 布尔 → switch
    if (typeof entry === "boolean") {
      return { key, type: "boolean", label: key, group: "Parameters",
               defaultValue: entry, config: {} };
    }

    // 4. 对象 → 看 options/value/min 等字段判断
    if (typeof entry === "object" && entry !== null) {
      if ("options" in entry) return resolveSelect(key, entry);
      if ("min" in entry || "max" in entry) return resolveNumber(key, entry);
      if ("control" in entry && entry.control === "xy") return resolveXY(key, entry);
      if ("value" in entry) {
        // 递归推断 value 的类型
        return { ...resolveEntry(key, entry.value), ...extractMeta(entry) };
      }
    }

    // fallback: 跳过无法识别的
    console.warn(`[motion-tuner] Cannot resolve schema for key "${key}"`);
    return null;
  }).filter(Boolean);
}

function isColorString(s: string): boolean {
  return /^#([0-9a-f]{3,8})$/i.test(s)
      || /^rgba?\(/.test(s)
      || /^hsla?\(/.test(s);
}
```

---

### 3.3 Panel — 面板 UI

纯 DOM 渲染，不依赖任何框架。

#### 3.3.1 DOM 结构

```html
<!-- 通过 document.createElement 动态创建，挂载到 body 或指定容器 -->
<div class="mt-panel" data-theme="dark">

  <!-- 标题栏（可拖拽） -->
  <div class="mt-panel-header">
    <span class="mt-panel-title">卡片悬浮动效</span>
    <div class="mt-panel-actions">
      <button class="mt-btn-reset" title="全部重置">↺</button>
      <button class="mt-btn-close" title="关闭">✕</button>
    </div>
  </div>

  <!-- 状态选择器（可选） -->
  <div class="mt-state-selector">
    <button class="mt-state-pill active">不锁定</button>
    <button class="mt-state-pill">Hover</button>
    <button class="mt-state-pill">默认</button>
  </div>

  <!-- 参数组（可折叠） -->
  <div class="mt-groups" style="max-height: 60vh; overflow-y: auto;">

    <div class="mt-group">
      <button class="mt-group-header">▶ 扇形布局 <span class="mt-count">3</span></button>
      <div class="mt-group-body">
        <!-- 每个参数 -->
        <div class="mt-param">
          <div class="mt-param-header">
            <label>卡片重叠 <code>overlapX</code></label>
            <div class="mt-param-controls">
              <button class="mt-btn-reset-param">↺</button>
              <button class="mt-btn-step">−</button>
              <span class="mt-value" contenteditable>-20</span>
              <button class="mt-btn-step">+</button>
            </div>
          </div>
          <input type="range" class="mt-slider" min="-30" max="20" step="1" value="-20">
        </div>
        <!-- ... 更多参数 -->
      </div>
    </div>

  </div>

  <!-- 导出区（可折叠） -->
  <div class="mt-export">
    <div class="mt-export-tabs">
      <button class="active">代码</button>
      <button>Diff</button>
    </div>
    <pre class="mt-export-code">...</pre>
    <button class="mt-btn-copy">复制</button>
  </div>

</div>
```

#### 3.3.2 面板渲染器

```typescript
class PanelRenderer {
  private container: HTMLDivElement;
  private schema: ResolvedSchema;
  private config: Record<string, any>;
  private defaultConfig: Record<string, any>;
  private theme: MotionTunerTheme;
  private groups: Map<string, HTMLDivElement>;

  constructor(options: PanelRendererOptions) { ... }

  // 挂载到 DOM
  mount(parent: HTMLElement): void;

  // 更新某个参数的显示值（slider 位置 + 数值文本）
  updateValue(key: string, value: any): void;

  // 更新整个 schema（target 切换时）
  setSchema(schema: ResolvedSchema, config: Record<string, any>, defaultConfig: Record<string, any>): void;

  // 更新主题
  setTheme(theme: MotionTunerTheme): void;

  // 销毁
  destroy(): void;

  // 事件回调
  onChange: (key: string, value: any) => void;
  onSliderCommit: (key: string, value: any) => void;
  onReset: (key?: string) => void;
  onClose: () => void;
  onStateChange: (state: string) => void;
  onExport: (format: "code" | "diff") => void;
}
```

#### 3.3.3 控件注册表

每种参数类型对应一个控件渲染器。v0.1 内置基础控件，后续通过注册扩展。

```typescript
interface ControlRenderer {
  // 渲染控件 DOM
  render(param: ResolvedParam, value: any, theme: MotionTunerTheme): HTMLElement;

  // 更新显示值（不重新创建 DOM）
  update(element: HTMLElement, value: any): void;

  // 销毁
  destroy(element: HTMLElement): void;
}

// 内置控件注册表
const controls: Record<ParamType, ControlRenderer> = {
  number:  new NumberSliderControl(),     // v0.1
  xy:      new XYPadControl(),            // v0.1
  color:   new ColorPickerControl(),      // v0.2
  boolean: new SwitchControl(),           // v0.2
  select:  new SelectControl(),           // v0.2
  spring:  new SpringVisualizerControl(), // v0.2 — 独有！
  easing:  new EasingCurveControl(),      // v0.2 — 独有！
};

// 扩展控件
function registerControl(type: string, renderer: ControlRenderer): void;
```

#### 3.3.4 拖拽实现

```typescript
// 面板拖拽 — 纯 JS pointer events
// 不依赖 framer-motion，使用 transform: translate(x, y) 实现

class DragManager {
  private element: HTMLElement;
  private dragHandle: HTMLElement;
  private position: { x: number; y: number };

  constructor(element: HTMLElement, dragHandle: HTMLElement);

  // pointer events 监听
  private onPointerDown(e: PointerEvent): void;
  private onPointerMove(e: PointerEvent): void;
  private onPointerUp(e: PointerEvent): void;

  // 约束在视口内
  private clampToViewport(x: number, y: number): { x: number; y: number };
}
```

#### 3.3.5 面板动画

```css
/* 进场/退场动画 — 纯 CSS，不依赖 framer-motion */
.mt-panel {
  transition: opacity 200ms ease, transform 200ms ease;
}

.mt-panel[data-state="entering"] {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

.mt-panel[data-state="visible"] {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.mt-panel[data-state="exiting"] {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

/* 分组展开/折叠 — CSS transition + 动态 max-height */
.mt-group-body {
  overflow: hidden;
  transition: max-height 200ms ease, opacity 200ms ease;
}

.mt-group-body[data-collapsed="true"] {
  max-height: 0;
  opacity: 0;
}

.mt-group-body[data-collapsed="false"] {
  max-height: 1000px; /* 足够大，实际高度由内容决定 */
  opacity: 1;
}
```

---

### 3.4 Overlay — 选区引擎

纯 DOM 操作，不依赖 React。

#### 3.4.1 架构

```typescript
class OverlayEngine {
  private targets: Map<string, RegisteredTarget>;
  private overlays: Map<string, OverlayElements>;
  private activeHover: string | null;
  private measureInterval: number | null;

  constructor(private theme: MotionTunerTheme);

  // 进入 motion-selecting 模式 — 为所有已注册 target 创建 overlay
  activate(): void;

  // 退出 motion-selecting 模式 — 移除所有 overlay
  deactivate(): void;

  // 事件
  onSelect: (id: string) => void;
}
```

#### 3.4.2 每个 target 的 overlay 结构

```typescript
interface OverlayElements {
  // 四层结构（复用你现有的设计）
  interaction: HTMLDivElement;   // 透明交互层，捕获 click/hover
  decoration: HTMLDivElement;    // 虚线边框 + 背景色
  label: HTMLDivElement;         // 标签气泡（hover 时显示）
}
```

#### 3.4.3 边界测量

```typescript
// 复用你现有的 measure + union + clipToVisibleArea 算法
// 唯一改动：从 React useEffect + setState 改为纯 JS rAF 循环

class BoundsMeasurer {
  private sampleMs: number = 600;

  // 对一个 element 采样 600ms，返回最终边界
  measure(element: HTMLElement): Promise<Bounds>;

  // 对所有 targets 批量测量
  measureAll(targets: Map<string, { element: HTMLElement }>): Promise<Map<string, Bounds>>;
}

interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// measure 内部实现（从你的 motion-target-overlay.tsx 直接移植）
function measureElement(root: HTMLElement): Bounds {
  const rr = root.getBoundingClientRect();
  let minX = 0, minY = 0, maxX = rr.width, maxY = rr.height;

  root.querySelectorAll("*").forEach((el) => {
    if ((el as HTMLElement).dataset?.motionOverlay !== undefined) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;

    const visible = clipToVisibleArea(r, el, root);
    if (!visible) return;

    const l = visible.left - rr.left;
    const t = visible.top - rr.top;
    const w = visible.right - visible.left;
    const h = visible.bottom - visible.top;
    if (l < minX) minX = l;
    if (t < minY) minY = t;
    if (l + w > maxX) maxX = l + w;
    if (t + h > maxY) maxY = t + h;
  });

  return { top: minY, right: maxX - rr.width, bottom: maxY - rr.height, left: minX };
}
```

---

### 3.5 Export Engine — 导出引擎

```typescript
class ExportEngine {
  // 全量导出 — TypeScript config 对象
  exportCode(id: string, schema: ResolvedSchema, config: Record<string, any>): string {
    const lines = schema.map(p => {
      const v = config[p.key];
      const formatted = typeof v === "number"
        ? (p.config.step < 1 ? v.toFixed(2) : String(v))
        : JSON.stringify(v);
      return `  ${p.key}: ${formatted},`;
    });
    return `export const config = {\n${lines.join("\n")}\n};`;
  }

  // Diff 导出 — 只输出变化的参数（LLM 友好格式）
  exportDiff(
    id: string,
    schema: ResolvedSchema,
    config: Record<string, any>,
    defaultConfig: Record<string, any>,
    options?: { includeRationale?: boolean; filePath?: string }
  ): string {
    const TOLERANCE = 0.001;
    const changes = schema.filter(p => {
      const cur = config[p.key];
      const def = defaultConfig[p.key];
      if (typeof cur === "number" && typeof def === "number") {
        return Math.abs(cur - def) > TOLERANCE;
      }
      return cur !== def;
    });

    if (changes.length === 0) {
      return "## Tuned Parameters\n\n(No changes from defaults)";
    }

    const lines = changes.map(p => {
      const def = defaultConfig[p.key];
      const cur = config[p.key];
      const defStr = typeof def === "number" ? def.toFixed(2) : String(def);
      const curStr = typeof cur === "number" ? cur.toFixed(2) : String(cur);
      return `- **${p.label}** (\`${p.key}\`): ${defStr} → ${curStr}`;
    });

    let md = `## Tuned Parameters\n\n`;
    md += `### Changes from Defaults (${changes.length} of ${schema.length})\n`;
    md += lines.join("\n") + "\n";

    if (options?.filePath) {
      md += `\n### Apply These Values\n`;
      md += `Update \`${options.filePath}\` with the values above.\n`;
    }

    md += `\n### Config Object\n\`\`\`typescript\n`;
    md += `const tunedValues = {\n`;
    md += changes.map(p => {
      const v = config[p.key];
      const formatted = typeof v === "number"
        ? (p.config.step < 1 ? v.toFixed(2) : String(v))
        : JSON.stringify(v);
      return `  ${p.key}: ${formatted},`;
    }).join("\n");
    md += `\n};\n\`\`\`\n`;

    return md;
  }
}
```

---

### 3.6 Shortcut Manager — 快捷键管理

```typescript
class ShortcutManager {
  private bindings: Map<string, () => void> = new Map();

  constructor() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  // 注册快捷键
  // shortcut 格式: "Meta+Shift+M", "Escape", "Ctrl+Z"
  bind(shortcut: string, handler: () => void): void;
  unbind(shortcut: string): void;

  destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const combo = this.buildCombo(e);
    const handler = this.bindings.get(combo);
    if (handler) {
      e.preventDefault();
      handler();
    }
  };

  private buildCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.metaKey) parts.push("Meta");
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (!["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }
    return parts.join("+");
  }
}
```

---

### 3.7 Theme System — 主题系统

```typescript
interface MotionTunerTheme {
  // 面板
  panel: {
    bg: string;
    border: string;
    shadow: string;
    backdrop: string;            // backdrop-filter 值
    radius: number;
    width: number;
    font: string;
  };

  // 选区
  overlay: {
    color: string;               // 主色（生成 border/bg/label 的基色）
    borderStyle: string;         // "dashed" | "solid"
    borderWidth: number;
    padding: number;
    labelBg: string;
    labelColor: string;
    labelFont: string;
  };

  // 控件
  controls: {
    track: string;
    progress: string;
    thumbBg: string;
    thumbBorder: string;
    thumbShadow: string;
  };

  // 文本
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };

  // 按钮
  button: {
    bg: string;
    bgHover: string;
    text: string;
    textHover: string;
  };

  // 触发按钮
  trigger: {
    bg: string;
    border: string;
    shadow: string;
    text: string;
    font: string;
  };

  // 状态选择器
  stateSelector: {
    containerBg: string;
    containerBorder: string;
    itemBg: string;
    itemText: string;
    itemActiveBg: string;
    itemActiveText: string;
  };

  // 导出区
  code: {
    bg: string;
    font: string;
  };
}

// 内置两套主题
const darkTheme: MotionTunerTheme = { ... };   // 从你现有的 motion-panel.tsx colors 对象提取
const lightTheme: MotionTunerTheme = { ... };  // 同上

// 用户可以传自定义主题，会 deep merge 到默认主题上
function mergeTheme(base: MotionTunerTheme, overrides: Partial<MotionTunerTheme>): MotionTunerTheme;
```

---

### 3.8 I18n — 文案系统

```typescript
interface MotionTunerLocale {
  // 激活按钮
  triggerLabel: string;            // "编辑动效" / "Edit Motion"
  selectPrompt: string;            // "请先选择组件" / "Select a component"
  reselectLabel: string;           // "重新选择" / "Reselect"

  // 面板
  resetAll: string;                // "全部重置为默认值" / "Reset all to defaults"
  resetParam: string;              // "重置为默认值" / "Reset to default"
  componentState: string;          // "组件状态" / "Component State"
  code: string;                    // "代码" / "Code"
  diff: string;                    // "Diff" / "Diff"
  copied: string;                  // "已复制" / "Copied"
  copyCode: string;                // "复制代码" / "Copy code"

  // 控件
  decrease: string;                // "减少" / "Decrease"
  increase: string;                // "增加" / "Increase"
  clickToEdit: string;             // "点击编辑" / "Click to edit"

  // 主题切换
  switchToLight: string;           // "切换为亮色" / "Switch to light"
  switchToDark: string;            // "切换为暗色" / "Switch to dark"
}

const zhCN: MotionTunerLocale = { ... };
const enUS: MotionTunerLocale = { ... };
```

---

## 4. 框架绑定层

### 4.1 React 绑定

```typescript
// ── motion-tuner-react ────────────────────────────────────────

import { createMotionTuner, type SchemaInput, type MotionTunerOptions } from "motion-tuner-core";

// Provider — 创建并持有 core 实例
const MotionTunerContext = createContext<MotionTunerInstance | null>(null);

export function MotionTunerProvider({
  children,
  enabled = process.env.NODE_ENV === "development",
  ...options
}: MotionTunerOptions & { children: React.ReactNode }) {
  const instanceRef = useRef<MotionTunerInstance | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const instance = createMotionTuner(options);
    instance.mount();
    instanceRef.current = instance;
    return () => instance.destroy();
  }, [enabled]);

  return (
    <MotionTunerContext.Provider value={instanceRef.current}>
      {children}
    </MotionTunerContext.Provider>
  );
}

// Hook — 唯一的用户 API
export function useMotionTuner<S extends SchemaInput>(
  id: string,
  schema: S,
  options?: { label?: string; states?: StateDef[]; defaultState?: string }
): {
  config: SchemaToValues<S>;
  previewState: string | null;
  ref: React.RefObject<HTMLElement>;
} {
  const instance = useContext(MotionTunerContext);
  const ref = useRef<HTMLElement>(null);
  const [config, setConfig] = useState(() => extractDefaults(schema));
  const [previewState, setPreviewState] = useState<string | null>(null);

  // 注册到 core
  useEffect(() => {
    if (!instance || !ref.current) return;

    const unregister = instance.register(id, schema, ref.current);

    // 监听值变化
    const unsub = instance.on("change", (targetId, newConfig) => {
      if (targetId === id) setConfig(newConfig);
    });

    // 监听状态变化（预览状态）
    const unsubState = instance.on("state-change", (targetId, state) => {
      if (targetId === id) setPreviewState(state);
    });

    return () => {
      unregister();
      unsub();
      unsubState();
    };
  }, [instance, id]);

  return { config, previewState, ref };
}
```

### 4.2 Vue 绑定（v0.2+）

```typescript
// ── motion-tuner-vue ──────────────────────────────────────────

import { ref, onMounted, onUnmounted, inject, provide } from "vue";
import { createMotionTuner, type SchemaInput } from "motion-tuner-core";

// Plugin
export const MotionTunerPlugin = {
  install(app, options) {
    const instance = createMotionTuner(options);
    instance.mount();
    app.provide("motion-tuner", instance);
    app.config.globalProperties.$motionTuner = instance;
  }
};

// Composable
export function useMotionTuner(id: string, schema: SchemaInput, options?) {
  const instance = inject("motion-tuner");
  const elementRef = ref(null);
  const config = ref(extractDefaults(schema));
  const previewState = ref(null);

  onMounted(() => {
    if (!instance || !elementRef.value) return;
    instance.register(id, schema, elementRef.value);
    instance.on("change", (tid, c) => { if (tid === id) config.value = c; });
    instance.on("state-change", (tid, s) => { if (tid === id) previewState.value = s; });
  });

  onUnmounted(() => instance?.unregister(id));

  return { config, previewState, ref: elementRef };
}
```

### 4.3 Vanilla JS（直接用 Core）

```typescript
// ── 无需绑定层 ───────────────────────────────────────────────

import { createMotionTuner } from "motion-tuner-core";

const tuner = createMotionTuner({ theme: "dark", shortcut: "Meta+Shift+M" });
tuner.mount();

// 注册
const element = document.querySelector(".my-card");
tuner.register("card", {
  blur: { value: 12, min: 0, max: 60, step: 1 },
  duration: 0.3,
  color: "#00C8D6",
}, element);

// 监听变化
tuner.on("change", (id, config) => {
  if (id === "card") {
    element.style.filter = `blur(${config.blur}px)`;
    element.style.transitionDuration = `${config.duration}s`;
    element.style.backgroundColor = config.color;
  }
});
```

---

## 5. 配套 AI Agent Skill

```
motion-tuner-skill/
├── SKILL.md                    ← Skill 入口文档
├── references/
│   ├── react.md                ← React useMotionTuner 用法参考
│   ├── vue.md                  ← Vue composable 用法参考
│   ├── vanilla.md              ← Vanilla JS 用法参考
│   ├── parameter-categories.md ← 200+ 参数分类表（复用 agent-skills 的）
│   └── export-format.md        ← Diff 导出格式定义
└── examples/
    ├── react-animation.tsx     ← React 动画调参完整示例
    └── vanilla-threejs.js      ← Three.js 场景调参示例
```

**Skill 的核心指令：**

```markdown
# Motion Tuner Skill

当用户要求调参、微调参数、或创建调参面板时，使用 motion-tuner。

## 平台选择
| 平台 | 安装 | 用法 |
|------|------|------|
| React | `npm i motion-tuner motion-tuner-react` | `useMotionTuner(id, schema)` |
| Vue | `npm i motion-tuner motion-tuner-vue` | `useMotionTuner(id, schema)` |
| 其他 | `npm i motion-tuner` | `createMotionTuner().register(id, schema, el)` |

## 参数发现流程
1. 搜索组件中的 hardcoded numbers
2. 搜索 style 对象和 CSS 属性
3. 搜索动画定义（framer-motion / CSS transition / GSAP）
4. 搜索颜色值
5. 搜索 props 默认值
→ 从 parameter-categories.md 匹配类型
→ 生成 schema 对象
→ 调用 register 或 useMotionTuner
```

---

## 6. 包结构与分发

```
motion-tuner/                          ← monorepo
├── packages/
│   ├── core/                          ← motion-tuner-core (npm)
│   │   ├── src/
│   │   │   ├── engine.ts              ← 核心引擎 + 状态机
│   │   │   ├── store.ts               ← Config Store
│   │   │   ├── schema.ts              ← Schema Resolver（类型推断）
│   │   │   ├── panel/                 ← 面板 UI
│   │   │   │   ├── renderer.ts        ← 面板渲染器
│   │   │   │   ├── controls/          ← 控件
│   │   │   │   │   ├── number.ts      ← slider
│   │   │   │   │   ├── xy.ts          ← XY pad
│   │   │   │   │   ├── color.ts       ← color picker（v0.2）
│   │   │   │   │   ├── select.ts      ← dropdown（v0.2）
│   │   │   │   │   ├── boolean.ts     ← switch（v0.2）
│   │   │   │   │   ├── spring.ts      ← spring visualizer（v0.2）
│   │   │   │   │   └── easing.ts      ← easing curve editor（v0.2）
│   │   │   │   ├── drag.ts            ← 拖拽管理
│   │   │   │   └── styles.ts          ← CSS 生成
│   │   │   ├── overlay/               ← 选区引擎
│   │   │   │   ├── engine.ts          ← overlay 管理
│   │   │   │   └── measure.ts         ← 边界测量算法
│   │   │   ├── export.ts              ← 导出引擎
│   │   │   ├── shortcut.ts            ← 快捷键管理
│   │   │   ├── theme.ts               ← 主题系统 + 内置主题
│   │   │   ├── i18n.ts                ← 文案系统
│   │   │   ├── types.ts               ← 所有公共类型
│   │   │   └── index.ts               ← 统一导出
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── react/                         ← motion-tuner-react (npm)
│   │   ├── src/
│   │   │   ├── provider.tsx
│   │   │   ├── use-motion-tuner.ts
│   │   │   └── index.ts
│   │   └── package.json               ← peerDep: react, motion-tuner-core
│   │
│   └── vue/                           ← motion-tuner-vue (npm, v0.2+)
│       ├── src/
│       │   ├── plugin.ts
│       │   ├── use-motion-tuner.ts
│       │   └── index.ts
│       └── package.json               ← peerDep: vue, motion-tuner-core
│
├── skill/                             ← AI Agent Skill
│   ├── SKILL.md
│   ├── references/
│   └── examples/
│
├── docs/                              ← 文档站
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

**NPM 发布策略：**

| 包名 | 内容 | 依赖 | 大小目标 |
|------|------|------|---------|
| `motion-tuner-core` | 纯 JS 核心引擎 | 零依赖 | < 20KB gzipped |
| `motion-tuner-react` | React 绑定 | peerDep: react, core | < 2KB gzipped |
| `motion-tuner-vue` | Vue 绑定（v0.2+） | peerDep: vue, core | < 2KB gzipped |
| `motion-tuner` | 便利包（core + react） | core + react | — |

---

## 7. 从 wedata 迁移路径

```
Phase 0: 在 wedata 项目中验证 Core API 设计
  - 在 lib/motion-tuner-core/ 实现核心引擎
  - 在 lib/motion-tuner-react/ 实现 useMotionTuner
  - 改造 agent-card 和 chat-input 用新 API
  - 验证：page.tsx 的 206 行 motion 编排代码降到 < 20 行

Phase 1: 抽取到独立 monorepo
  - 初始化 motion-tuner 仓库
  - 搬迁代码，补测试
  - wedata 改为从本地路径安装（pnpm link）

Phase 2: 发布 v0.1
  - 发布到 npm
  - wedata 改为从 npm 安装
  - 写 README + GIF demo
  - 发布配套 AI Skill
```

---

## 8. 与现有代码的映射

| 现有文件 | 新架构对应 | 迁移策略 |
|---------|-----------|---------|
| `motion-panel.tsx` L1-42（类型） | `core/types.ts` | 直接搬迁 |
| `motion-panel.tsx` L44-47（EASE/FONT） | `core/theme.ts` | 参数化为 theme token |
| `motion-panel.tsx` L239-307（色板） | `core/theme.ts` darkTheme/lightTheme | 提取为 theme 对象 |
| `motion-panel.tsx` L405-520（slider 渲染） | `core/panel/controls/number.ts` | 改写为纯 DOM |
| `motion-panel.tsx` L523-730（XY pad 渲染） | `core/panel/controls/xy.ts` | 改写为纯 DOM |
| `motion-panel.tsx` L749-1240（面板壳） | `core/panel/renderer.ts` | 改写为纯 DOM |
| `motion-panel.tsx` L1242-1487（SelectButton） | `core/panel/trigger.ts` | 改写为纯 DOM |
| `motion-target-overlay.tsx` 全部 | `core/overlay/` | 去掉 React，改写为纯 DOM |
| `page.tsx` L87-254（motion 状态/handler） | `core/engine.ts` + `react/use-motion-tuner.ts` | 引擎管理状态，hook 桥接 |
| `page.tsx` L362-405（Panel 渲染） | 自动：Provider 通过 Portal 渲染 | 删除 |
| `page.tsx` L457-472, L613-634（Overlay 包裹） | 自动：ref 注册后 Core 管理 overlay | 删除 |
| `page.tsx` L667-677（SelectButton 渲染） | 自动：Provider 渲染 trigger | 删除 |

**迁移后 page.tsx 只需要：**
```tsx
import { MotionTunerProvider } from "motion-tuner-react";

function App() {
  return (
    <MotionTunerProvider enabled={process.env.NODE_ENV === "development"}>
      <Home />
    </MotionTunerProvider>
  );
}
```

**每个组件只需要：**
```tsx
function AgentFanCards() {
  const { config, previewState, ref } = useMotionTuner("agent-fan", {
    overlapX: { value: -18, min: -30, max: 20, step: 1, label: "卡片重叠", group: "扇形布局" },
    // ... 其他参数
  }, {
    label: "卡片间动效",
    states: [{ value: "free", label: "不锁定" }, { value: "hover", label: "Hover" }, { value: "default", label: "默认" }],
  });

  return <div ref={ref}>...</div>;
}
```

page.tsx 的 motion 编排代码从 206 行降到 0 行。

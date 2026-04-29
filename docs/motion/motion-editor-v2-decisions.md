# Motion Editor v2 — 样式编辑模式

> 经 4 轮 /plan-eng-review 审查 + /simplify 精简（2026-04-19）
> 状态：**精简版，可用于实现**

---

## 0. 目标

现有 Motion Editor 只能调动效参数（滑杆）。v2 加一个**样式编辑模式**：自由选中页面上任意元素，临时改 CSS，导出 diff。

**不做的事：** 动效面板不增加复杂度（不加 color/enum/boolean 控件）。undo、import/restore 都不做。

---

## 1. 状态机

### 5 值枚举（不加新 state 变量）

```typescript
type MotionMode = "idle" | "motion-selecting" | "editing" | "style-selecting" | "style-editing";
```

单枚举，不可能进入非法状态。双 useState 方案（editorType + mode）有 React 批处理时序导致的中间态风险。

### 状态转换

```
         idle ──[选"动效"]──► motion-selecting ◄──[切模式]──► style-selecting
                                │                        │
                         [选中组件]                [选中元素]
                                ▼                        ▼
                            editing                style-editing
```

退出规则：
- **X/关闭按钮** → idle（走 handleEditorClose）
- **Escape** → 回退一步：editing→motion-selecting，style-editing→style-selecting，motion-selecting/style-selecting→idle
- **重选按钮** → 回到对应的 motion-selecting
- editing/style-editing **不能直接跳到对方**，必须先回 idle

### Cleanup 架构

拆成一个清理函数 + 三个调用者：

```typescript
// 只做清理，不改 mode
function cleanupEditorState() {
  const currentMode = motionMode;
  
  if (currentMode === 'editing') {
    // 用组件定义的 defaultState，不硬编码
    setAgentCardPreviewState(AGENT_FAN_MOTION.defaultState ?? "hover");
    setChatInputPreviewState(CHAT_INPUT_MOTION.defaultState ?? "free");
    setAddMenuPreviewState(ADD_MENU_MOTION.defaultState ?? "closed");
    setSidebarPreviewState(SIDEBAR_MOTION.defaultState ?? "agent");
    setCardInnerPreviewOverrideState(null);
    clearCardInnerPreviewTimers();
    setMotionTarget(null);
  }
  
  // Style 模式：只清 React state，不碰 overlay DOM
  // overlay 的生命周期由 useEffect(isStyleMode) 单独管理
  if (currentMode === 'style-editing') {
    if (selectedElementRef.current?.isConnected) {
      selectedElementRef.current.style.cssText = snapshotRef.current;
    }
    originalComputedRef.current = {};
    selectedElementRef.current = null;
  }
}

// X/关闭 → idle
function handleEditorClose() {
  cleanupEditorState();
  setMotionMode("idle");
}

// Escape → 回退一步
function handleEscape() {
  switch (motionMode) {
    case 'editing':     cleanupEditorState(); setMotionMode("motion-selecting"); break;
    case 'style-editing': cleanupEditorState(); setMotionMode("style-selecting"); break;
    case 'motion-selecting':
    case 'style-selecting': setMotionMode("idle"); break;
  }
}

// 重选按钮
function handleReselect() {
  cleanupEditorState();
  setMotionMode(motionMode === 'style-editing' ? 'style-selecting' : 'motion-selecting');
}
```

### 必修 bug

现有 handleMotionPanelClose 和 handleMotionClose 把 agentCardPreviewState 重置为不同值。addMenuPreviewState 和 sidebarPreviewState 在所有 close handler 中都没被 reset。上面的 cleanupEditorState 统一修复。

### Style 模式的 Ref

```typescript
const selectedElementRef = useRef<HTMLElement | null>(null);
const snapshotRef = useRef<string>('');
const originalComputedRef = useRef<Record<string, string>>({});
```

### 页面状态守卫

```typescript
// ⚠️ motionMode 用 ref 读取，不放进依赖数组
// 放进 deps 会导致进入非 idle 模式立即被弹回 idle（状态机瘫痪）
const motionModeRef = useRef(motionMode);
motionModeRef.current = motionMode;

useEffect(() => {
  if (motionModeRef.current !== 'idle') {
    cleanupEditorState();
    setMotionMode('idle');
  }
}, [chatPhase, viewState]);
```

### 按钮 UI

idle 时下拉菜单选模式（✦动效 / 🎨样式），非 idle 时显示当前状态：

| motionMode | 文案 |
|---|---|
| idle | `编辑 ▾`（下拉） |
| motion-selecting | `请先选择组件 \| X` |
| style-selecting | `请先选择元素 \| X` |
| editing | `重新选择 \| ☀🌙 \| X` |
| style-editing | `重新选择 \| X` |

---

## 2. 自由选区

### 方案：document capture listener（无遮罩）

不用全屏遮罩。用 document 级别的 capture-phase 事件监听拦截点击。

**为什么不用遮罩：** 遮罩和 capture listener 拦截误点击的能力相同（都能阻止 React onClick 触发）。但遮罩会挡住滚动、挡住 elementFromPoint、挡住键盘，然后需要手动转发/隔离/乒乓切换来"解决自己制造的问题"。capture listener 不制造这些问题，代码量约 1/3。

```typescript
const isStyleMode = motionMode === 'style-selecting' || motionMode === 'style-editing';

useEffect(() => {
  if (!isStyleMode) return;
  
  // 高亮框：pointer-events:none，不影响任何交互
  const highlight = document.createElement('div');
  highlight.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #1664FF;z-index:99999;transition:all 50ms;';
  document.body.appendChild(highlight);
  
  function onMove(e: MouseEvent) {
    let target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest('[data-editor-ui]')) return;
    // SVG 内部元素上溯到 <svg>
    if (target instanceof SVGElement && !(target instanceof SVGSVGElement)) {
      target = target.closest('svg') || target;
    }
    const rect = target.getBoundingClientRect();
    Object.assign(highlight.style, {
      top: rect.top + 'px', left: rect.left + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
    });
  }
  
  function onClick(e: MouseEvent) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest('[data-editor-ui]')) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(target as HTMLElement); // 选中元素，切到 style-editing
  }
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('click', onClick, { capture: true });
  
  return () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('click', onClick, { capture: true });
    document.body.removeChild(highlight);
  };
}, [isStyleMode]);
```

关键点：
- 没有遮罩 → 页面自然滚动，不需要转发 wheel 事件
- 没有遮罩 → elementFromPoint 直接穿透到真实元素，不需要 pointer-events 乒乓
- 没有遮罩 → 键盘正常工作，只需要 Escape handler
- capture: true + stopPropagation → React 的合成事件系统收不到这个 click
- 依赖 `isStyleMode` 而非 `motionMode`，style-selecting↔style-editing 切换不重建监听
- `data-editor-ui` 标记排除编辑器自身 UI，点击面板上的按钮不触发选元素

### StylePanel z-index

StylePanel 设 z-index 99999（与高亮框同层级即可，面板在高亮框之上因为后渲染）。标记 `data-editor-ui`。

### EditorSelectButton 渲染守卫

page.tsx 当前渲染条件不包含 motionMode，编辑中切换页面状态后按钮消失。改为：
```typescript
{(原条件 || motionMode !== "idle") && <EditorSelectButton ... />}
```

---

## 3. 样式面板

### 属性范围

| 属性类别 | CSS 属性 | 控件 |
|----------|----------|------|
| 颜色 | backgroundColor, color, borderColor | 色板 |
| 尺寸 | width, height | 数字输入 + 拖拽 |
| 间距 | padding (四向), margin (四向), gap | 数字输入 |
| 圆角 | borderRadius | 数字输入 |
| 透明度 | opacity | 滑杆 |
| 投影 | boxShadow | 文本框 + preset（none/sm/md/lg） |

### 初始值读取

统一用 `getComputedStyle(el)`。不用 `element.style`，因为本项目大部分样式通过 Tailwind class 或 design-dna inline style 设置，`element.style.color` 可能为空。

shorthand 注意：padding/margin 读四向独立值（paddingTop 等），borderRadius 同理。

### Snapshot 机制

- 选中元素时存 `snapshotRef.current = el.style.cssText`
- 同时缓存可编辑属性的 computed 原始值到 `originalComputedRef`（导出用）
- 切到另一个元素时还原 `el.style.cssText = snapshotRef.current`
- 恢复前检查 `el.isConnected`（React 可能已卸载该元素）

修改是临时的（inline style 级），React re-render 会丢失。Demo 项目可接受。

**单元素工作流：** 一次只编辑一个元素。要保留修改需先导出再切换。

---

## 4. 导出

### diff-only 格式

只输出改了的属性，不输出全量 computed style。

```
/* 选中: .agent-card 第1张卡片 "数据分析助手" */
border-radius: 12px → 16px
box-shadow: none → 0 2px 8px rgba(0,0,0,0.1)
padding: 16px → 20px
```

### 结构化 JSON

给 AI 消费的版本：

```json
{
  "version": 1,
  "type": "style-diff",
  "timestamp": "2026-04-19T15:30:00Z",
  "target": {
    "selector": "div.agent-card:nth-child(2) > .card-title",
    "textContent": "数据分析助手"
  },
  "changes": [
    {
      "property": "border-radius",
      "from": "12px",
      "to": "16px"
    }
  ]
}
```

`from` 来自 `originalComputedRef`（选中时缓存的 getComputedStyle 值），`to` 来自当前 getComputedStyle 值。只输出 `from !== to` 的属性。

`textContent` 截取前 50 字符做语义锚点（比 nth-child 更稳定）。

### 两种复制

1. **人读版** — 上面那个 `属性: 旧值 → 新值` 格式，直接贴给开发看
2. **JSON 版** — 给 AI 消费，带 selector 和 textContent 定位

面板上两个按钮：「复制」（人读版）、「复制 JSON」。

---

## 5. 实现顺序

```
Step 0: 修复现有 bug
  - 统一所有 close/reselect handler 为 cleanupEditorState + 各路径独立设 mode
  - 覆盖全部 5 个 preview state
  - EditorSelectButton 渲染条件加守卫
  - 加 chatPhase/viewState 变化守卫

Step 1: 状态机扩展
  - MotionMode 加 style-selecting / style-editing
  - EditorSelectButton 改为下拉菜单
  - 全局 Escape handler
  - EditableValue 的 Escape 加 stopPropagation

Step 2: 自由选区
  - document capture listener + 高亮 div
  - click 选中 + SVG 上溯 + UI 排除
  - Escape handler（回退一步）

Step 3: 样式面板
  - 新建 StylePanel 组件
  - getComputedStyle 读取 + element.style 写回
  - snapshot 恢复

Step 4: 导出
  - diff 生成（比对 originalComputedRef vs 当前 computed）
  - 两种复制格式
```

---

## 6. 避坑清单

| # | 坑 | 解法 |
|---|---|------|
| 1 | elementFromPoint 返回 SVG 内部元素 | 上溯到 `<svg>` |
| 2 | 切元素不恢复旧修改 | cssText 快照还原 |
| 3 | 页面状态变化时编辑器不退出 | useEffect 监听 chatPhase/viewState |
| 4 | 选中编辑器自身 UI | data-editor-ui + closest 检查 |
| 5 | chatPhase guard deps 加了 motionMode | 状态机瘫痪，用 motionModeRef |
| 6 | EditableValue Escape 没 stopPropagation | 取消编辑同时退出 editing 模式 |
| 7 | 5 个 close handler 默认值不一致 | cleanupEditorState 统一处理 |

---

## 7. 推迟项

| 项目 | 触发条件 |
|------|----------|
| 动效面板多类型控件（color/enum/boolean） | 有明确需求时 |
| Undo（Ctrl+Z 撤销样式修改） | 用户反馈需要时 |
| 导入恢复（从 JSON 还原修改） | 有明确需求时 |
| 多元素累积编辑 | Phase 0 之后 |
| useMotionTuner hook 重构 | 接入组件 >10 个 |
| 纯 JS Core / npm 包 | 要发包时 |

---

## 8. 参考

| 文档 | 说明 |
|------|------|
| `motion-editor-system.md` | 当前系统文档 |
| `motion-tuner-architecture.md` | 历史草案（部分被本文推翻） |
| `motion-tuner-research.md` | 竞品分析仍有参考价值 |
| `/motion-connect` skill | v2 后需更新：`handleMotionPanelClose` → `handleEditorClose` |

# Motion Editor 系统设计文档

> 通用的「选择模式 → 动效参数面板」交互系统，让页面上任何有动效的组件都能被选中、调参、实时预览。

---

## 1. 快速概览

- 每个动效组件在自己的文件里导出参数 schema（`MotionTargetDef`）
- 通用面板 `MotionPanel` 消费 schema 自动渲染滑杆 UI
- 新增组件 **不需要修改** MotionPanel、EditorSelectButton、MotionTargetOverlay 的代码

---

## 2. 接入新组件指南（最重要）

以「聊天输入框动效」为例，完整步骤如下。

### Step 1: 在组件文件中导出 MotionTargetDef

```typescript
// components/ui/chat-input.tsx

// ⚠️ 类型从 motion-panel.tsx 导入
import type { MotionParamDef, MotionTargetDef } from "@/components/ui/motion-panel";

export const CHAT_INPUT_MOTION: MotionTargetDef = {
  id: "chat-input",
  label: "聊天输入框动效",
  schema: [
    { key: "expandDuration", label: "展开时长", min: 0.1, max: 1.0, step: 0.05, group: "动画" },
    { key: "blurRadius",     label: "模糊半径", min: 0,   max: 30,  step: 1,    group: "毛玻璃" },
    // ...更多参数
  ],
  defaultConfig: { expandDuration: 0.3, blurRadius: 12 },
};

// 组件 Props 中接收 config
interface ChatInputProps {
  config: Record<string, number>;
  isEditorHovered?: boolean;  // 可选：编辑面板 hover 时暂停组件动画
  // ...其他 props
}
```

### Step 2: 在 page.tsx 中注册（3 处改动）

```typescript
// ① import
import { CHAT_INPUT_MOTION } from "@/components/ui/chat-input";

// ② 新增 state（放在现有 motionMode 等 state 旁边）
const [chatInputConfig, setChatInputConfig] = useState(CHAT_INPUT_MOTION.defaultConfig);

// ③-a 用 MotionTargetOverlay 包裹组件
<MotionTargetOverlay
  targetId="chat-input"
  targetLabel={CHAT_INPUT_MOTION.label}
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <ChatInput config={chatInputConfig} isEditorHovered={isEditorHovered} />
</MotionTargetOverlay>

// ③-b 在现有 AnimatePresence 块中追加 MotionPanel 条件渲染
<AnimatePresence>
  {/* ...已有的 agent-cards 面板... */}
  {motionMode === "editing" && motionTarget === "chat-input" && (
    <MotionPanel
      targetLabel={CHAT_INPUT_MOTION.label}
      schema={CHAT_INPUT_MOTION.schema}
      config={chatInputConfig}
      defaultConfig={CHAT_INPUT_MOTION.defaultConfig}
      onChange={(c) => setChatInputConfig(c)}
      onHoverChange={setIsEditorHovered}
      onClose={handleMotionPanelClose}
    />
  )}
</AnimatePresence>
```

### 已有的基础设施（不需要新建/修改）

以下组件和 handler 已经在 page.tsx 中存在，直接复用：

| 已有内容 | 作用 |
|---------|------|
| `motionMode` / `setMotionMode` state | 模式状态 (`"idle"` / `"motion-selecting"` / `"editing"`) |
| `motionTarget` / `setMotionTarget` state | 当前选中的组件 id |
| `isEditorHovered` / `setIsEditorHovered` state | 面板 hover 状态 |
| `handleMotionButtonClick` | 按钮点击切换模式 |
| `handleMotionSelect` | 选中组件回调 |
| `handleMotionPanelClose` | 关闭面板回调 |
| `<EditorSelectButton>` | 右下角模式切换按钮 |

### 完整检查清单

- [ ] 组件文件导出了 `MotionTargetDef`（id / label / schema / defaultConfig）
- [ ] 组件 Props 接收 `config: Record<string, number>` 和可选的 `isEditorHovered`
- [ ] page.tsx 新增了该组件的 config state
- [ ] 组件被 `<MotionTargetOverlay>` 包裹
- [ ] `<MotionPanel>` 在 `<AnimatePresence>` 内添加了对应的条件渲染
- [ ] MotionPanel 传入了 `onHoverChange={setIsEditorHovered}`
- [ ] `npx tsc --noEmit` 零报错
- [ ] `npm run build` 成功

---

## 3. 类型系统

```typescript
/** 单个参数定义 */
interface MotionParamDef {
  key: string;        // 对应 config 对象的 key
  label: string;      // 中文显示名
  min: number;
  max: number;
  step: number;
  group: string;      // 分组名（如"扇形布局"、"Hover 推开"）
}

/** 组件注册信息 */
interface MotionTargetDef {
  id: string;                            // 唯一标识，如 "agent-cards"
  label: string;                         // 显示名，如 "Agent 卡片动效"
  schema: MotionParamDef[];              // 参数列表
  defaultConfig: Record<string, number>; // 默认值
}
```

类型定义位于 `components/ui/motion-panel.tsx` 并 export。其他文件通过 `import type { MotionParamDef, MotionTargetDef } from "@/components/ui/motion-panel"` 引用。

---

## 4. 状态机

```
         点击 🖱               点击组件               点击 ✕
  idle ──────────► motion-selecting ──────────► editing ──────────► idle
   ▲                  │                                      ▲
   │                  │ 点击 ✕                               │
   └──────────────────┘                                      │
                                        点击 ✕ ─────────────┘
```

```typescript
type MotionMode = "idle" | "motion-selecting" | "editing";
```

| 状态 | 按钮图标 | 页面表现 |
|------|---------|---------|
| `idle` | 🖱 MousePointer | 正常浏览，无特殊 UI |
| `motion-selecting` | ✕ X | 所有注册组件显示蓝色虚线轮廓，hover 高亮，可点击选中 |
| `editing` | ✕ X | 虚线消失，参数面板滑入，拖拽滑杆实时调参 |

---

## 5. 组件职责简表

| 文件 | 组件 | 职责 | 接入时需修改？ |
|------|------|------|--------------|
| `components/ui/motion-panel.tsx` | MotionPanel, EditorSelectButton | Schema 驱动的通用参数面板 + 右下角圆形切换按钮 + 共享类型定义 | ❌ |
| `components/ui/motion-target-overlay.tsx` | MotionTargetOverlay | 包裹目标组件，motion-selecting 时显示虚线轮廓，自动测量子组件视觉边界 | ❌ |
| `components/ui/agent-card.tsx` | AgentFanCards | 第一个接入的组件，导出 `AGENT_CARD_MOTION` | ❌（参考实现） |
| `app/page.tsx` | — | 状态中枢，编排所有 Motion 组件 | ✅ 新增 state + overlay + panel |

---

## 6. 参考：page.tsx 中已有的状态和 handler

```typescript
// 状态
const [motionMode, setMotionMode] = useState<MotionMode>("idle");
const [motionTarget, setMotionTarget] = useState<string | null>(null);
const [isEditorHovered, setIsEditorHovered] = useState(false);
const [fanConfig, setFanConfig] = useState<FanCardsConfig>(DEFAULT_FAN_CONFIG);

// 按钮点击：idle → motion-selecting，其他 → idle
const handleMotionButtonClick = useCallback(() => {
  if (motionMode === "idle") {
    setMotionMode("motion-selecting");
  } else {
    setMotionMode("idle");
    setMotionTarget(null);
    setIsEditorHovered(false);
  }
}, [motionMode]);

// 选中组件 → editing
const handleMotionSelect = useCallback((targetId: string) => {
  setMotionTarget(targetId);
  setMotionMode("editing");
}, []);

// 关闭面板 → idle
const handleMotionPanelClose = useCallback(() => {
  setMotionMode("idle");
  setMotionTarget(null);
  setIsEditorHovered(false);
}, []);
```

---

## 附录 A: MotionTargetOverlay 内部实现

> 以下内容仅供维护 overlay 组件时参考，接入新组件无需了解。

### 自动测量算法

动效组件的视觉范围常超出 CSS 盒模型（如旋转、缩放）。使用 `getBoundingClientRect()` 遍历所有后代取并集：

```typescript
function measure(root: HTMLElement): Bounds {
  const rr = root.getBoundingClientRect();
  let minX = 0, minY = 0, maxX = rr.width, maxY = rr.height;
  root.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const l = r.left - rr.left, t = r.top - rr.top;
    if (l < minX) minX = l;
    if (t < minY) minY = t;
    if (l + r.width > maxX) maxX = l + r.width;
    if (t + r.height > maxY) maxY = t + r.height;
  });
  return { top: minY, right: maxX - rr.width, bottom: maxY - rr.height, left: minX };
}
```

动画采样：`requestAnimationFrame` 轮询 600ms，每帧取 union，捕获动画全程最大视觉范围。

### 四层结构

```
<div style="position: relative">
  ① <div ref={contentRef} pointerEvents="none">   ← 子内容（测量锚点）
       {children}
     </div>
  ② <div onClick={handleClick} />                  ← 交互层（透明，捕获点击）
  ③ <div border="dashed" />                        ← 装饰层（虚线边框 + 背景）
  ④ <AnimatePresence>{label pill}</AnimatePresence> ← 标签气泡
</div>
```

### 视觉参数

```
颜色基底：Design DNA secondary blue #1664FF → rgb(22, 100, 255)
idle:   border 1.5px dashed rgba(22,100,255, 0.35), bg rgba(22,100,255, 0.04)
hover:  border 1.5px dashed rgba(22,100,255, 0.6),  bg rgba(22,100,255, 0.08)
标签:   background rgba(22,100,255, 0.85), 白色文字
```

---

## 附录 B: 踩坑记录

| 问题 | 原因 | 解决 |
|------|------|------|
| Overlay 虚线框无限增长 | `ref` 挂在外层容器，`querySelectorAll("*")` 测量到 overlay 自身 | `ref` 只挂子内容 wrapper |
| 动画展开前测量不准 | 单次 rAF 测量时入场动画未展开 | rAF 轮询 600ms 取 union |
| 选择模式下子组件 hover 穿透 | 子组件仍响应鼠标事件 | 子内容 `pointerEvents: none` + 独立交互层 |

---

## 附录 C: 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 测量方案 | DOM 自动测量 | 零配置，transform 友好 |
| Overlay 实现 | wrapper 包裹 | 不需全局事件监听，生命周期跟随组件 |
| 面板驱动 | schema 驱动通用面板 | 新增组件零面板代码 |
| 状态管理 | 页面 state | 单页面，无需跨组件共享 |
| 事件屏蔽 | `pointerEvents: none` + 独立交互层 | 比 `stopPropagation` 更可靠 |

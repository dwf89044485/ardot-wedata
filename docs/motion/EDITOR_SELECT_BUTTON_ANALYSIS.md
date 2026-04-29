# WeData 项目 - "编辑动效"按钮完整分析

## 📍 位置
- **文件**: `/Users/josephdeng/Documents/wedata/components/ui/motion-panel.tsx` (行号: 898-1022)
- **使用地点**: `/Users/josephdeng/Documents/wedata/app/page.tsx` (行号: 705-707)
- **位置**: 页面右下角 (fixed position, bottom: 24px, right: 24px)

---

## 1️⃣ EditorSelectButton 组件完整代码

```typescript
// ── EditorSelectButton (right-bottom toggle) ──────────────────────
interface EditorSelectButtonProps {
  mode: MotionMode;
  onToggle: () => void;       // idle → motion-selecting
  onReselect: () => void;    // editing → motion-selecting
  onClose: () => void;       // any → idle
}

export function EditorSelectButton({ 
  mode, 
  onToggle, 
  onReselect, 
  onClose 
}: EditorSelectButtonProps) {
  const isIdle = mode === "idle";
  const isSelecting = mode === "motion-selecting";
  const isEditing = mode === "editing";

  // idle: 单个带文字按钮 "编辑动效"
  if (isIdle) {
    return (
      <motion.button
        onClick={onToggle}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          height: 40,
          borderRadius: 20,
          border: "none",
          background: "rgba(0,0,0,0.82)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          color: "rgba(255,255,255,0.90)",
          zIndex: 50,
          padding: "0 14px 0 12px",
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
        whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        whileTap={{ scale: 0.95 }}
        title="进入选择模式"
      >
        <MousePointerClick size={15} strokeWidth={2.2} />
        编辑动效
      </motion.button>
    );
  }

  // motion-selecting / editing: 两个按钮 "重新选择" + "关闭"
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        gap: 8,
        zIndex: 50,
      }}
    >
      {/* 重新选择 */}
      <motion.button
        onClick={onReselect}
        style={{
          height: 40,
          borderRadius: 20,
          border: "none",
          background: "rgba(0,0,0,0.82)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          color: "rgba(255,255,255,0.90)",
          padding: "0 14px 0 12px",
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
        whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        whileTap={{ scale: 0.95 }}
        title="重新选择组件"
      >
        <MousePointerClick size={15} strokeWidth={2.2} />
        重新选择
      </motion.button>

      {/* 关闭 */}
      <motion.button
        onClick={onClose}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(0,0,0,0.82)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.90)",
          padding: 0,
        }}
        whileHover={{ scale: 1.1, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
        whileTap={{ scale: 0.95 }}
        title="关闭"
      >
        <X size={16} strokeWidth={2.2} />
      </motion.button>
    </motion.div>
  );
}
```

---

## 2️⃣ 动效/动画实现

### 状态转换状态机

```
         点击 🖱 按钮           点击组件               点击 ✕ 关闭
  idle ──────────► motion-selecting ──────────► editing ──────────► idle
   ▲                  │                                      ▲
   │                  │ 点击 ✕ 关闭                           │
   └──────────────────┘                                      │
                                        点击 ✕ ─────────────┘
```

| 模式 | 按钮样式 | 动作 |
|------|---------|------|
| **idle** | 单个黑色按钮，文字"编辑动效" + MousePointerClick 图标 | 点击进入 motion-selecting 模式 |
| **motion-selecting** | 两个按钮: "重新选择" + 圆形"关闭" | 可点击页面组件选中，或点击关闭返回 idle |
| **editing** | 同 motion-selecting 样式 | 参数面板打开，可调参；点击"重新选择"返回 motion-selecting；点击"关闭"返回 idle |

### 动画规格

#### 按钮进场/出场动画
- **触发**: 模式切换时
- **类型**: 缩放 + 透明度 + 垂直位移
- **参数**:
  - `initial`: `{ opacity: 0, scale: 0.8, y: 10 }`
  - `animate`: `{ opacity: 1, scale: 1, y: 0 }`
  - `exit`: `{ opacity: 0, scale: 0.8, y: 10 }`
  - `duration`: `0.25s`
  - `easing`: `[0.4, 0, 0.2, 1]` (cubic-bezier)

#### Hover 交互动画
- **"编辑动效" 按钮 hover**:
  - `whileHover`: `{ scale: 1.05, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }`
  - `whileTap`: `{ scale: 0.95 }`
  
- **"重新选择" 按钮 hover**:
  - `whileHover`: `{ scale: 1.05, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }`
  - `whileTap`: `{ scale: 0.95 }`

- **"关闭" 按钮 hover**:
  - `whileHover`: `{ scale: 1.1, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }`
  - `whileTap`: `{ scale: 0.95 }`

### 动画库
- **库**: Framer Motion (`from "framer-motion"`)
- **组件**: `motion.button`, `motion.div`
- **Easing 曲线**: `[0.4, 0, 0.2, 1]` (标准 Material Design easing)

---

## 3️⃣ page.tsx 中的使用方式

### 导入
```typescript
import MotionPanel, { EditorSelectButton, type MotionMode } from "@/components/ui/motion-panel";
```

### 状态声明
```typescript
// 核心三态管理
const [motionMode, setMotionMode] = useState<MotionMode>("idle");
const [motionTarget, setMotionTarget] = useState<string | null>(null);
```

### 事件处理器

#### 1. 按钮点击处理
```typescript
const handleMotionButtonClick = useCallback(() => {
  // idle → motion-selecting
  setMotionMode("motion-selecting");
}, []);
```

#### 2. 重新选择处理
```typescript
const handleMotionReselect = useCallback(() => {
  // editing / selecting → motion-selecting (重置 target，保留选择模式)
  setMotionMode("motion-selecting");
  setMotionTarget(null);
  setAgentCardPreviewState("free");
  setChatInputPreviewState((CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState | undefined) ?? "free");
}, []);
```

#### 3. 关闭处理
```typescript
const handleMotionClose = useCallback(() => {
  // any → idle
  setMotionMode("idle");
  setMotionTarget(null);
  setAgentCardPreviewState("free");
  setChatInputPreviewState((CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState | undefined) ?? "free");
}, []);
```

### 条件渲染
```typescript
{/* Motion 选择模式按钮 - 仅 welcome 阶段显示 */}
{chatPhase === "welcome" && (
  <EditorSelectButton 
    mode={motionMode} 
    onToggle={handleMotionButtonClick} 
    onReselect={handleMotionReselect} 
    onClose={handleMotionClose} 
  />
)}
```

---

## 4️⃣ 相关组件关系图

```
page.tsx (状态中枢)
├── EditorSelectButton (右下角按钮组)
│   ├── 模式: idle → 单按钮 "编辑动效"
│   └── 模式: motion-selecting/editing → 两按钮 "重新选择" + "关闭"
│
├── MotionTargetOverlay (目标组件包装)
│   ├── 父: AgentFanCards
│   ├── 父: ClaudeChatInput
│   └── 功能: motion-selecting 时显示蓝色虚线轮廓、hover 标签
│
├── MotionPanel (参数调节面板)
│   ├── 位置: 右上角 (position: absolute, top: 20, right: 20)
│   ├── 内容: 滑杆组 + 代码导出
│   └── 触发: motionMode === "editing" 且 motionTarget 匹配
│
└── 动效配置对象
    ├── AGENT_FAN_MOTION (agent-fan)
    ├── AGENT_CARD_INNER_MOTION (agent-card)
    └── CHAT_INPUT_MOTION (chat-input)
```

---

## 5️⃣ 按钮状态与样式对照表

| 属性 | 值 |
|------|---|
| **固定位置** | `position: "fixed"` |
| **距屏幕右** | `right: 24px` |
| **距屏幕下** | `bottom: 24px` |
| **图层** | `zIndex: 50` |
| **背景色** | `rgba(0,0,0,0.82)` (深灰/黑) |
| **文字色** | `rgba(255,255,255,0.90)` (亮白) |
| **单按钮高** | `40px` |
| **单按钮圆角** | `20px` (胶囊形) |
| **关闭按钮** | `40px × 40px`, `borderRadius: 50%` (圆形) |
| **按钮间距** | `gap: 8px` |
| **阴影（静默）** | `0 2px 12px rgba(0,0,0,0.2)` |
| **阴影（hover）** | `0 4px 20px rgba(0,0,0,0.3)` |
| **字体大小** | `13px` |
| **字体粗度** | `500` |
| **图标大小** | `15px` (MousePointerClick), `16px` (X) |

---

## 6️⃣ 关键设计决策

### 1. **三态模式**
- `idle`: 正常浏览，无 Motion 功能可见
- `motion-selecting`: 进入选择模式，所有支持 Motion 编辑的组件显示可交互边界
- `editing`: 选中某个组件后，参数面板上浮，可调参并实时预览

### 2. **按钮组变换**
- **idle** → 单按钮快速收起，进入 motion-selecting
- **motion-selecting** → 展开为两按钮，支持"重新选择"和"关闭"
- **editing** → 两按钮维持不变，后台面板打开

### 3. **预览状态重置**
- 点击"重新选择" → 清空 `motionTarget`，但保留 `motion-selecting` 模式
- 点击"关闭" → 恢复 `idle`，清除所有预览

### 4. **全局 zIndex 管理**
- EditorSelectButton: `zIndex: 50`
- MotionPanel: `zIndex: 10`
- 确保按钮始终可见且可点击

---

## 7️⃣ 扩展指南

如果需要添加新的动效编辑组件：

### Step 1: 在组件文件中导出 MotionTargetDef
```typescript
// components/ui/my-component.tsx
export const MY_COMPONENT_MOTION: MotionTargetDef = {
  id: "my-component",
  label: "我的组件动效",
  schema: [
    { key: "duration", label: "动画时长", min: 0.1, max: 1, step: 0.05, group: "动画" },
    // ...
  ],
  defaultConfig: { duration: 0.3, /* ... */ },
};
```

### Step 2: 在 page.tsx 中注册
```typescript
import { MY_COMPONENT_MOTION } from "@/components/ui/my-component";

// 新增 state
const [myComponentConfig, setMyComponentConfig] = useState(MY_COMPONENT_MOTION.defaultConfig);

// 包裹组件
<MotionTargetOverlay
  targetId="my-component"
  targetLabel={MY_COMPONENT_MOTION.label}
  isSelecting={motionMode === "motion-selecting"}
  onSelect={handleMotionSelect}
>
  <MyComponent config={myComponentConfig} />
</MotionTargetOverlay>

// 在 AnimatePresence 中添加面板
{motionMode === "editing" && motionTarget === "my-component" && (
  <MotionPanel
    targetLabel={MY_COMPONENT_MOTION.label}
    schema={MY_COMPONENT_MOTION.schema}
    config={myComponentConfig}
    defaultConfig={MY_COMPONENT_MOTION.defaultConfig}
    onChange={(c) => setMyComponentConfig(c)}
    onClose={handleMotionPanelClose}
  />
)}
```

---

## 📦 依赖
- `framer-motion`: 动画库
- `lucide-react`: 图标库 (MousePointerClick, X)

---

## 🎯 核心文件清单

| 文件 | 行号 | 内容 |
|------|------|------|
| `motion-panel.tsx` | 1-896 | MotionPanel 主面板组件 |
| `motion-panel.tsx` | 898-1022 | **EditorSelectButton 完整实现** |
| `page.tsx` | 114 | `motionMode` state 声明 |
| `page.tsx` | 115 | `motionTarget` state 声明 |
| `page.tsx` | 172-175 | `handleMotionButtonClick` 处理器 |
| `page.tsx` | 177-183 | `handleMotionReselect` 处理器 |
| `page.tsx` | 185-191 | `handleMotionClose` 处理器 |
| `page.tsx` | 705-707 | **EditorSelectButton 渲染调用** |
| `motion-target-overlay.tsx` | 全文 | 选择轮廓框架 |

---

**文档更新于**: 2026-04-14
**项目**: WeData Motion Editor System

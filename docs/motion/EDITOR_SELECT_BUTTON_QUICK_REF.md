# EditorSelectButton 快速参考

## 🎯 核心三态

| 状态 | 显示 | 点击行为 |
|------|------|--------|
| **idle** | 单按钮: `🖱 编辑动效` | → motion-selecting |
| **motion-selecting** | 两按钮: `🖱 重新选择` + `✕ 关闭` | 选择组件 → editing |
| **editing** | 同 motion-selecting | 同 motion-selecting |

## 🎨 样式快参

```
固定位置: bottom 24px, right 24px | zIndex: 50
背景: rgba(0,0,0,0.82) | 文字: rgba(255,255,255,0.90)
按钮高: 40px | 圆角: 20px (胶囊) | 关闭: 40px圆形
```

## ⚡ 动画参数

**进场/出场**:
- `duration: 0.25s`
- `easing: [0.4, 0, 0.2, 1]`
- 关键帧: `{ opacity, scale, y: ±10 }`

**Hover**:
- 编辑/重选: `scale 1.05`
- 关闭: `scale 1.1`
- 共同: `shadow 0 4px 20px rgba(0,0,0,0.3)`

## 📍 位置

**文件**: `components/ui/motion-panel.tsx` (行 898-1022)

**使用**: `app/page.tsx` (行 705-707)

```typescript
<EditorSelectButton 
  mode={motionMode} 
  onToggle={handleMotionButtonClick} 
  onReselect={handleMotionReselect} 
  onClose={handleMotionClose} 
/>
```

## 🔌 Props

```typescript
interface EditorSelectButtonProps {
  mode: "idle" | "motion-selecting" | "editing";
  onToggle: () => void;    // idle → motion-selecting
  onReselect: () => void;  // motion-selecting/editing → motion-selecting (清 target)
  onClose: () => void;     // 任何 → idle
}
```

## 🎭 状态机

```
idle ─[click]→ motion-selecting ─[select]→ editing
  ↑                          ↑            ↑
  └──── [close] ←────────────┴────────────┘
```

## 💾 导出

```typescript
export function EditorSelectButton({ 
  mode, 
  onToggle, 
  onReselect, 
  onClose 
}: EditorSelectButtonProps)
```

## 🔗 相关

- **MotionPanel**: 右上角参数面板 (zIndex: 10)
- **MotionTargetOverlay**: 组件蓝线轮廓
- **page.tsx 状态**: `motionMode`, `motionTarget`
- **Handler**: `handleMotionButtonClick`, `handleMotionReselect`, `handleMotionClose`

## 📌 关键代码片段

### Idle 状态 (单按钮)
```tsx
<motion.button
  onClick={onToggle}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <MousePointerClick size={15} /> 编辑动效
</motion.button>
```

### Selecting/Editing 状态 (两按钮)
```tsx
<motion.div gap={8}>
  <motion.button onClick={onReselect}>
    <MousePointerClick size={15} /> 重新选择
  </motion.button>
  <motion.button onClick={onClose}>
    <X size={16} />
  </motion.button>
</motion.div>
```

---
**快速参考卡片** | WeData Motion Editor | 2026-04-14

# 修复：Agent 卡片页面加载时信息区透底

## 问题

页面刷新时，四张 Agent 卡片的下半部分（数据指标区、分割线、展开标签、CTA 按钮所在区域）会短暂透出底层的人物头像图片，然后又遮回去，视觉上像是透明度闪了一下。

## 根因

欢迎区域有一个 fade-in 入场动画（opacity 0→1）。在淡入过程中，卡片内部毛玻璃遮罩层（`rgba(255,255,255,0.75)` + `backdrop-filter: blur`）的实际不透明度被父级 opacity 乘以后变弱，而卡片下半部分的内容（数据、CTA 等）默认是 `opacity: 0`（只在 hover 时显示），只靠毛玻璃挡着。毛玻璃一被削弱，头像就透出来了。

## 修复方案：「帘幕遮罩」法

**核心思路**：不在父级做 opacity 动画，改用与背景同色的遮罩层模拟淡入。

1. 欢迎区 `motion.div` 移除 `opacity` 动画，内容始终 `opacity: 1`
   - 保留 `y: -16 → 0` 的上滑动画
   - `backdrop-filter` 始终以满力工作，毛玻璃不受削弱
2. 在欢迎区末尾添加绝对定位遮罩层（`backgroundColor: #F9FAFC`）
   - `initial={{ opacity: 1 }}` → `animate={{ opacity: 0 }}`
   - 视觉效果与原版 fade-in 完全一致
   - `pointerEvents: "none"` 不影响交互
3. exit 动画（选择技能后欢迎区退出）保持原有 `opacity: 0` 不变

## 涉及文件

- `app/page.tsx` — 修改欢迎区入场动画方式

## 验证

- [x] `npx tsc --noEmit` 零报错
- [x] `npm run build` 构建成功
- [ ] 视觉验证：页面加载淡入过程中卡片不透底
- [ ] 视觉验证：hover 展开效果正常

## 状态：✅ 代码修复完成，待视觉验证

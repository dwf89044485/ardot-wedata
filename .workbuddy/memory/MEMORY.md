# MEMORY.md — 长期记忆

## Motion Editor 产品化方向（2026-04-16 确定）

- 目标：融合 VisBug 选区交互 + leva 声明式 API + 自有动效工作流，做独立开源 npm 包
- 目标用户：Design Engineer
- 核心差异化：应用内嵌选区 + 预览状态管理 + 代码导出（三者组合无直接竞品）
- 理想 API：一个 `useMotionTuner` hook 搞定注册+面板+选区
- 架构文档见 `docs/motion-tuner-architecture.md`
- 策略：渐进式孵化，在 wedata 开发中逐步解耦
- 竞品：leva（5.9k stars 通用面板）、Tweakpane（纯 JS）、VisBug（5.7k Google 选区工具）、Theatre.js（重量级）

### 产品形态（2026-04-16 晚确定）
- **纯 JS Core + 框架绑定层 + 配套 AI Skill**
- Core 层框架无关，统一替代 leva/Tweakpane/lil-gui/dat.GUI
- 预览状态管理是唯一需要框架绑定的功能
- 配套 AI Skill 负责自动参数发现和代码生成

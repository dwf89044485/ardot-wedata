# WeData UI 组件索引（按功能分组）

> 位置：`components/ui-components-index.md`  
> 目的：通过功能分组快速定位组件（含文件路径、组件名、中文名）。

## 目录结构（当前）

```text
components/
├── agentation-provider.tsx
└── ui/
    ├── agent-card.tsx
    ├── agent-plan.tsx
    ├── ai-running-bubble.tsx
    ├── artifact-detail-drawer.tsx
    ├── artifacts-panel.tsx
    ├── button.tsx
    ├── chat-titlebar.tsx
    ├── claude-style-chat-input.tsx
    ├── morphing-square.tsx
    ├── motion-panel.tsx
    ├── motion-target-overlay.tsx
    ├── secondary-nav.tsx
    ├── sidebar.tsx
    ├── studio-file-table.tsx
    ├── studio-tree.tsx
    ├── studio-view.tsx
    ├── thinking-summary.tsx
    ├── user-message-bubble.tsx
    └── wedata-icons.tsx
```

## 1) 基础支撑

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/agentation-provider.tsx` | `AgentationProvider` | Agentation 提供器 |

## 2) 导航与布局

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/sidebar.tsx` | `Sidebar` | 主侧边栏 |
| `components/ui/secondary-nav.tsx` | `SecondaryNav` | 次级导航栏 |
| `components/ui/studio-view.tsx` | `StudioView` | Studio 视图容器 |
| `components/ui/chat-titlebar.tsx` | `ChatTitlebar` | 聊天标题栏 |

## 3) 聊天与对话交互

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/claude-style-chat-input.tsx` | `ClaudeChatInput` | Claude 风格聊天输入框 |
| `components/ui/user-message-bubble.tsx` | `UserMessageBubble` | 用户消息气泡 |
| `components/ui/ai-running-bubble.tsx` | `AiRunningBubble` | AI 运行气泡 |
| `components/ui/thinking-summary.tsx` | `ThinkingSummary` | 思考摘要 |
| `components/ui/agent-plan.tsx` | `Plan` | 执行计划面板 |

## 4) 智能体展示

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/agent-card.tsx` | `AgentCard` / `RigelCard` / `AgentFanCards` | 代理卡片 / Rigel 卡片 / 代理扇形卡片组 |

## 5) 制品与文件浏览

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/artifacts-panel.tsx` | `ArtifactsPanel` | 制品侧边面板 |
| `components/ui/artifact-detail-drawer.tsx` | `ArtifactDetailDrawer` | 制品详情抽屉 |
| `components/ui/studio-tree.tsx` | `StudioTree` | Studio 树形目录 |
| `components/ui/studio-file-table.tsx` | `StudioFileTable` | Studio 文件表格 |

## 6) 动效系统与调参

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/motion-panel.tsx` | `MotionPanel` / `EditorSelectButton` | 动效参数面板 / 动效选择按钮 |
| `components/ui/motion-target-overlay.tsx` | `MotionTargetOverlay` | 动效目标覆盖层 |
| `components/ui/morphing-square.tsx` | `MorphingSquare` | 形变方块 |

## 7) 基础原子组件

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/button.tsx` | `Button` | 按钮 |

## 8) 图标系统

| 文件 | 组件名 | 中文名 |
|---|---|---|
| `components/ui/wedata-icons.tsx` | `Icon*` | 图标组件集合 |

### 图标明细（`wedata-icons.tsx`）

| 组件名 | 中文名 |
|---|---|
| `IconIngestData` | 数据接入图标 |
| `IconCatalog` | 目录图标 |
| `IconStudio` | Studio 图标 |
| `IconPin` | 图钉图标 |
| `IconWorkflow` | 工作流图标 |
| `IconOps` | 运维图标 |
| `IconSQL` | SQL 图标 |
| `IconDashboard` | 仪表盘图标 |
| `IconChatBI` | ChatBI 图标 |
| `IconMLExp` | 机器学习实验图标 |
| `IconFeature` | 特征图标 |
| `IconModelReg` | 模型注册图标 |
| `IconModelSvc` | 模型服务图标 |
| `IconAgents` | 智能体图标 |
| `IconApps` | 应用图标 |
| `IconPlatform` | 平台图标 |
| `IconDataSource` | 数据源图标 |
| `IconCompute` | 计算图标 |
| `IconGovernance` | 治理图标 |
| `IconAiHistory` | AI 历史图标 |
| `IconDataClaw` | DataClaw 图标 |
| `IconSidebarToggle` | 侧边栏切换图标 |
| `IconAiNewChat` | AI 新建会话图标 |
| `IconWorkspace` | 工作区图标 |
| `IconData` | 数据图标 |
| `IconClose` | 关闭图标 |
| `IconArrowRightUp` | 右上箭头图标 |
| `IconChevronLeft` | 左箭头图标 |
| `IconChevronDown` | 下箭头图标 |
| `IconCheck` | 勾选图标 |

---

维护建议：新增/删除组件时，同步更新本文件。

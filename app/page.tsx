"use client";

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Sidebar, { type SidebarMode, SIDEBAR_MOTION } from "@/components/ui/sidebar";
import ClaudeChatInput, { CHAT_INPUT_MOTION, ADD_MENU_MOTION, type ChatInputHandle, type ChatInputPreviewState, type SkillChip, type TableChip } from "@/components/ui/claude-style-chat-input";
import { AgentFanCards, type AgentCardPreviewState, type FanCardsConfig, type CardInnerConfig, DEFAULT_FAN_CONFIG, DEFAULT_CARD_INNER_CONFIG, AGENT_FAN_MOTION, AGENT_CARD_INNER_MOTION, AGENT_CARD_MOTION } from "@/components/ui/agent-card";
import MotionPanel, { EditorSelectButton, type MotionMode, type MotionTheme } from "@/components/ui/motion-panel";
import MotionTargetOverlay from "@/components/ui/motion-target-overlay";
import { IconCatalog, IconWorkflow, IconSQL, IconOps, IconMLExp } from "@/components/ui/wedata-icons";
import StudioView from "@/components/ui/studio-view";
import AiRunningBubble, { AI_RUNNING_BUBBLE_MOTION } from "@/components/ui/ai-running-bubble";
import ChatTitlebar from "@/components/ui/chat-titlebar";
import UserMessageBubble from "@/components/ui/user-message-bubble";
import Plan from "@/components/ui/agent-plan";
import ThinkingSummary from "@/components/ui/thinking-summary";
import ArtifactsPanel from "@/components/ui/artifacts-panel";
import StylePanel, { getReactComponentName } from "@/components/ui/style-panel";
import CommentPopover, { type CommentEntry } from "@/components/ui/comment-popover";
import DemoNavSidebar from "@/components/ui/demo-nav-sidebar";
import {
  DEMO_DEFAULT_FLOW_ID,
  DEMO_FLOWS,
  getDemoFlowById,
  type DemoFlowId,
} from "@/components/ui/demo-nav-model";

// ── Design tokens ──────────────────────────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// ── Chat phase ──────────────────────────────────────────────────
type ChatPhase = "welcome" | "conversation";

// ── 当前召唤的 Agent 信息 ────────────────────────────────────────
interface SummonedAgent {
  name: string;
  title: string;
  avatar: string;
  summonText?: string;
}

const DEMO_DEFAULT_AGENT: SummonedAgent = {
  name: "Rigel",
  title: "数仓工程专家",
  avatar: "/agents/1-char.png",
};

const DEMO_CONVERSATION_MESSAGE = "请帮我开发\"用户复购率\"指标";
const DEMO_CONVERSATION_TITLE = "开发\"用户复购率\"指标";

// ── expanded skill label → icon 映射 ────────────────────────────
const SKILL_ICON_COLOR = "rgba(0,0,0,0.45)";
const SKILL_ICON_MAP: Record<string, React.ReactNode> = {
  // Rigel
  "需求转数据模型": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  "生成调度方案": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  "自动数仓开发": <IconSQL size={14} color={SKILL_ICON_COLOR} />,
  "检测管道异常": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "接入数据源": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  "优化任务性能": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  // Vega
  "自然语言取数": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  "智能趋势分析": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  "多维数据洞察": <IconSQL size={14} color={SKILL_ICON_COLOR} />,
  "生成数据报告": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "异常归因": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "指标拆解": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  // Orion
  "监测数据质量": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  "智能血缘维护": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  "自动管理元数据": <IconSQL size={14} color={SKILL_ICON_COLOR} />,
  "识别口径冲突": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "安全脱敏": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "标签治理": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  // Nova
  "业务指标监控": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  "智能异常预警": <IconOps size={14} color={SKILL_ICON_COLOR} />,
  "自助取数": <IconCatalog size={14} color={SKILL_ICON_COLOR} />,
  "生成运营看板": <IconSQL size={14} color={SKILL_ICON_COLOR} />,
  "目标达成追踪": <IconWorkflow size={14} color={SKILL_ICON_COLOR} />,
  "用户行为分析": <IconMLExp size={14} color={SKILL_ICON_COLOR} />,
};

const C = {
  rightBg: "#F9FAFC",
} as const;

const BUBBLE_TARGET = {
  width: 240,
  height: 72,
  right: 30,
  bottom: 50,
  radius: 100,
} as const;

const SHRINK_DURATION = 0.58;
const SHRINK_EASE: [number, number, number, number] = [0.23, 0.65, 0.25, 1];
const STUDIO_REVEAL_DURATION = 0.3;
const STUDIO_REVEAL_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
const BUBBLE_REVEAL_EASE: [number, number, number, number] = [0.23, 0.64, 0.22, 1];

type ViewportPreset = "tablet" | "desktop" | "fhd";
const VIEWPORT_PRESETS: Record<ViewportPreset, { label: string; width: number; height: number }> = {
  tablet: { label: "Tablet", width: 1024, height: 768 },
  desktop: { label: "Desktop", width: 1440, height: 900 },
  fhd: { label: "FHD", width: 1920, height: 1080 },
};

const ZOOM_OPTIONS = [50, 75, 100, 125, 150] as const;

export default function Home() {
  // ── 模式切换 ──
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("agent");
  const [targetView, setTargetView] = useState("dataclaw");
  const [viewState, setViewState] = useState<"dataclaw" | "shrinking" | "studio">("dataclaw");
  const [shrinkMetrics, setShrinkMetrics] = useState({
    scaleX: 0.18,
    scaleY: 0.1,
    x: -BUBBLE_TARGET.right,
    y: -BUBBLE_TARGET.bottom,
  });

  // ── 聊天相关 ──
  const [activeSkills, setActiveSkills] = useState<SkillChip[]>([]);
  const [activeTables, setActiveTables] = useState<TableChip[]>([]);
  const [summonedAgent, setSummonedAgent] = useState<SummonedAgent | null>(null);
  const [chatPhase, setChatPhase] = useState<ChatPhase>("welcome");
  const [userMessage, setUserMessage] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [revealStep, setRevealStep] = useState(0);

  // ── 演示导航 ──
  const [activeDemoFlowId, setActiveDemoFlowId] = useState<DemoFlowId>(DEMO_DEFAULT_FLOW_ID);

  // ── 预览视口控制 ──
  const [viewportPreset, setViewportPreset] = useState<ViewportPreset>("desktop");
  const [zoomPercent, setZoomPercent] = useState(100);

  // ── Motion Editor ──
  const [fanConfig, setFanConfig] = useState<FanCardsConfig>(DEFAULT_FAN_CONFIG);
  const [cardInnerConfig, setCardInnerConfig] = useState<CardInnerConfig>(DEFAULT_CARD_INNER_CONFIG);
  const [chatInputConfig, setChatInputConfig] = useState<Record<string, number>>(CHAT_INPUT_MOTION.defaultConfig);
  const [addMenuConfig, setAddMenuConfig] = useState<Record<string, number>>(ADD_MENU_MOTION.defaultConfig);
  const [addMenuPreviewState, setAddMenuPreviewState] = useState(ADD_MENU_MOTION.defaultState ?? "closed");
  const [aiBubbleConfig, setAiBubbleConfig] = useState<Record<string, number>>(AI_RUNNING_BUBBLE_MOTION.defaultConfig);
  const [sidebarConfig, setSidebarConfig] = useState<Record<string, number>>(SIDEBAR_MOTION.defaultConfig);
  const [sidebarPreviewState, setSidebarPreviewState] = useState(SIDEBAR_MOTION.defaultState ?? "agent");
  const [agentCardPreviewState, setAgentCardPreviewState] = useState<AgentCardPreviewState>(
    (AGENT_FAN_MOTION.defaultState as AgentCardPreviewState | undefined) ?? "hover"
  );
  const [fanPreviewOverrideState, setFanPreviewOverrideState] = useState<AgentCardPreviewState | null>(null);
  const [cardInnerPreviewOverrideState, setCardInnerPreviewOverrideState] = useState<AgentCardPreviewState | null>(null);
  const [chatInputPreviewState, setChatInputPreviewState] = useState<ChatInputPreviewState>(
    (CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState | undefined) ?? "free"
  );
  const [motionMode, setMotionMode] = useState<MotionMode>("idle");
  const [motionTarget, setMotionTarget] = useState<string | null>(null);
  const [motionTheme, setMotionTheme] = useState<MotionTheme>("dark");
  const [editorExpanded, setEditorExpanded] = useState(false);

  // 面板跟随元素：根据 motionTarget 查询对应的锚点 DOM
  const [motionAnchorEl, setMotionAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!motionTarget || motionMode !== "editing") {
      setMotionAnchorEl(null);
      return;
    }
    // MotionTargetOverlay 渲染后查询
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-motion-target-id="${motionTarget}"]`);
      setMotionAnchorEl(el);
    });
  }, [motionTarget, motionMode]);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const dataClawRef = useRef<HTMLDivElement>(null);
  const viewportHostRef = useRef<HTMLDivElement>(null);
  const [viewportHostSize, setViewportHostSize] = useState({ width: 0, height: 0 });
  const fanPreviewStageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fanPreviewRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardInnerPreviewStageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardInnerPreviewRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // ── 滚轮缩放（ctrl/cmd + wheel，50%–150%） ──
  const handleWheelZoom = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.5;
    setZoomPercent((prev) => Math.round(Math.min(150, Math.max(50, prev + delta))));
  }, []);

  useEffect(() => {
    const host = viewportHostRef.current;
    if (!host) return;

    const update = () => {
      const rect = host.getBoundingClientRect();
      setViewportHostSize({ width: rect.width, height: rect.height });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(host);

    host.addEventListener("wheel", handleWheelZoom, { passive: false });

    return () => {
      observer.disconnect();
      host.removeEventListener("wheel", handleWheelZoom);
    };
  }, [handleWheelZoom]);

  const viewportSize = VIEWPORT_PRESETS[viewportPreset];
  const fitScale = useMemo(() => {
    if (!viewportHostSize.width || !viewportHostSize.height) return 1;
    return Math.min(
      1,
      viewportHostSize.width / viewportSize.width,
      viewportHostSize.height / viewportSize.height
    );
  }, [viewportHostSize.height, viewportHostSize.width, viewportSize.height, viewportSize.width]);

  const renderScale = fitScale * (zoomPercent / 100);

  // ── 改动计数（动效 config diff） ──
  const motionChangeCount = useMemo(() => {
    const pairs: [{ key: string }[], Record<string, number>, Record<string, number>][] = [
      [AGENT_FAN_MOTION.schema, fanConfig as unknown as Record<string, number>, AGENT_FAN_MOTION.defaultConfig],
      [AGENT_CARD_INNER_MOTION.schema, cardInnerConfig as unknown as Record<string, number>, AGENT_CARD_INNER_MOTION.defaultConfig],
      [CHAT_INPUT_MOTION.schema, chatInputConfig, CHAT_INPUT_MOTION.defaultConfig],
      [ADD_MENU_MOTION.schema, addMenuConfig, ADD_MENU_MOTION.defaultConfig],
      [AI_RUNNING_BUBBLE_MOTION.schema, aiBubbleConfig, AI_RUNNING_BUBBLE_MOTION.defaultConfig],
      [SIDEBAR_MOTION.schema, sidebarConfig, SIDEBAR_MOTION.defaultConfig],
    ];
    let count = 0;
    for (const [schema, cfg, def] of pairs) {
      for (const p of schema) {
        if (cfg[p.key] !== def[p.key]) count++;
      }
    }
    return count;
  }, [fanConfig, cardInnerConfig, chatInputConfig, addMenuConfig, aiBubbleConfig, sidebarConfig]);

  const clearFanPreviewTimers = useCallback(() => {
    if (fanPreviewStageTimerRef.current) {
      clearTimeout(fanPreviewStageTimerRef.current);
      fanPreviewStageTimerRef.current = null;
    }
    if (fanPreviewRestoreTimerRef.current) {
      clearTimeout(fanPreviewRestoreTimerRef.current);
      fanPreviewRestoreTimerRef.current = null;
    }
  }, []);

  const clearCardInnerPreviewTimers = useCallback(() => {
    if (cardInnerPreviewStageTimerRef.current) {
      clearTimeout(cardInnerPreviewStageTimerRef.current);
      cardInnerPreviewStageTimerRef.current = null;
    }
    if (cardInnerPreviewRestoreTimerRef.current) {
      clearTimeout(cardInnerPreviewRestoreTimerRef.current);
      cardInnerPreviewRestoreTimerRef.current = null;
    }
  }, []);

  const startShrinkToStudio = useCallback(() => {
    if (viewState === "shrinking") return;

    const rect = dataClawRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      setShrinkMetrics({
        scaleX: BUBBLE_TARGET.width / rect.width,
        scaleY: BUBBLE_TARGET.height / rect.height,
        x: -BUBBLE_TARGET.right,
        y: -BUBBLE_TARGET.bottom,
      });
    }

    if (shouldReduceMotion) {
      setViewState("studio");
      return;
    }

    setViewState("shrinking");
  }, [shouldReduceMotion, viewState]);

  // ── 模式切换联动 ──
  const handleModeChange = useCallback((mode: SidebarMode) => {
    if (mode === "saas") {
      setSidebarMode("saas");
      setTargetView("studio");
      if (viewState === "dataclaw") {
        startShrinkToStudio();
      } else {
        setViewState("studio");
      }
      return;
    }

    setSidebarMode("agent");
    setTargetView("dataclaw");
    setViewState("dataclaw");
  }, [startShrinkToStudio, viewState]);

  const handleSkillClick = useCallback((label: string, agent?: { name: string; title: string; avatar: string; summonText?: string }) => {
    setActiveSkills([{ id: label, label, icon: SKILL_ICON_MAP[label] }]);
    if (agent) {
      setSummonedAgent(agent);
    }
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }, []);

  const handleSummon = useCallback((agent: { name: string; title: string; avatar: string; summonText?: string }) => {
    setSummonedAgent(agent);
    setActiveSkills([]);
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }, []);

  const handleRemoveSkill = useCallback((id: string) => {
    setActiveSkills((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        setSummonedAgent(null);
      }
      return next;
    });
  }, []);

  const handleSelectSkillFromMenu = useCallback((skill: SkillChip) => {
    setActiveSkills((prev) => (prev.some((item) => item.id === skill.id) ? prev : [...prev, skill]));
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }, []);

  const handleSelectTable = useCallback((table: TableChip) => {
    setActiveTables((prev) => (prev.some((item) => item.id === table.id) ? prev : [...prev, table]));
    requestAnimationFrame(() => chatInputRef.current?.focus());
  }, []);

  const handleRemoveTable = useCallback((id: string) => {
    setActiveTables((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleRemoveAgent = useCallback(() => {
    setSummonedAgent(null);
    setActiveSkills([]);
  }, []);

  const handleSendMessage = useCallback(({ message }: { message: string; files: unknown[] }) => {
    if (!message.trim()) return;
    setUserMessage(message.trim());
    if (!summonedAgent) {
      setSummonedAgent({
        name: "Rigel",
        title: "数仓工程专家",
        avatar: "/agents/1-char.png",
      });
    }
    setChatPhase("conversation");
    setConversationTitle(`开发"用户复购率"指标`);
    setActiveSkills([]);
  }, [summonedAgent]);

  // ── Style 模式 ref（Step 2-3 才真正用到，Step 0 先声明） ──
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const elementSnapshotsRef = useRef<Map<HTMLElement, string>>(new Map());
  const elementComputedRef = useRef<Map<HTMLElement, Record<string, string>>>(new Map());
  const originalComputedRef = useRef<Record<string, string>>({});
  const selectionOverlayRef = useRef<HTMLDivElement | null>(null);
  const selLabelRef = useRef<HTMLDivElement | null>(null);
  // 驱动 StylePanel re-render（ref 不触发 re-render）
  const [styleElementVersion, setStyleElementVersion] = useState(0);
  // 样式改动计数（ref 不触发 re-render，需要 state 同步）
  const [styleChangeCount, setStyleChangeCount] = useState(0);

  // ── Comment 批注状态 ──
  const commentsRef = useRef<CommentEntry[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentElement, setCommentElement] = useState<HTMLElement | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const commentIdCounter = useRef(0);

  const EDITABLE_PROPS = [
    'backgroundColor', 'color', 'borderColor', 'borderTopWidth', 'borderStyle',
    'width', 'height',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'gap',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
    'opacity', 'boxShadow', 'display', 'flexDirection', 'justifyContent', 'alignItems',
  ];

  const getStyleModifiedElementCount = useCallback(() => {
    let count = 0;
    elementSnapshotsRef.current.forEach((snapshot, el) => {
      if (!el.isConnected) return;
      if ((el.style.cssText || "") !== (snapshot || "")) count += 1;
    });
    return count;
  }, []);

  const handleStyleMutate = useCallback((el: HTMLElement) => {
    if (!elementSnapshotsRef.current.has(el)) return;
    setStyleChangeCount(getStyleModifiedElementCount());
  }, [getStyleModifiedElementCount]);

  // 选中元素的共享逻辑：onClick 和 onSelectElement 共用
  const selectStyleElement = useCallback((el: HTMLElement) => {
    selectedElementRef.current = el;
    if (!elementSnapshotsRef.current.has(el)) {
      elementSnapshotsRef.current.set(el, el.style.cssText);
      const computed = getComputedStyle(el);
      const cache: Record<string, string> = {};
      EDITABLE_PROPS.forEach(p => { cache[p] = computed.getPropertyValue(p) || (computed as unknown as Record<string, string>)[p] || ''; });
      elementComputedRef.current.set(el, cache);
    }
    originalComputedRef.current = elementComputedRef.current.get(el) || {};

    // 更新选中框 + 标签
    const rect = el.getBoundingClientRect();
    if (selectionOverlayRef.current) {
      Object.assign(selectionOverlayRef.current.style, {
        display: '', top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
      });
    }
    if (selLabelRef.current) {
      const tag = el.tagName.toLowerCase();
      const cn = el.className;
      const cls = cn && typeof cn === 'string'
        ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      const text = el.textContent?.trim().slice(0, 20) || '';
      selLabelRef.current.style.display = '';
      selLabelRef.current.textContent = `${tag}${cls}${text ? ` "${text}"` : ''}`;
      Object.assign(selLabelRef.current.style, {
        top: (rect.bottom) + 'px', left: rect.left + 'px',
      });
    }
    setStyleElementVersion(v => v + 1);
    setStyleChangeCount(getStyleModifiedElementCount());
    setMotionMode('style-editing');
  }, [getStyleModifiedElementCount]);

  // ── Motion Editor 统一清理 + 退出 handlers ──
  // cleanupEditorState: 只做清理，不改 mode
  const cleanupEditorState = useCallback(() => {
    // Motion 模式清理：重置所有 preview state 到组件定义的默认值
    setAgentCardPreviewState((AGENT_FAN_MOTION.defaultState as AgentCardPreviewState | undefined) ?? "hover");
    setChatInputPreviewState((CHAT_INPUT_MOTION.defaultState as ChatInputPreviewState | undefined) ?? "free");
    setAddMenuPreviewState(ADD_MENU_MOTION.defaultState ?? "closed");
    setSidebarPreviewState(SIDEBAR_MOTION.defaultState ?? "agent");
    setFanPreviewOverrideState(null);
    setCardInnerPreviewOverrideState(null);
    clearFanPreviewTimers();
    clearCardInnerPreviewTimers();
    setMotionTarget(null);

    // Style 模式清理：不恢复样式改动，保留 snapshot 以便后续导出/重置
    selectedElementRef.current = null;
    originalComputedRef.current = {};
  }, [clearFanPreviewTimers, clearCardInnerPreviewTimers]);

  // X/关闭按钮（selecting → idle 展开）
  const handleEditorClose = useCallback(() => {
    cleanupEditorState();
    // 清理 comment editing 状态（但不清除已有批注数据）
    setCommentElement(null);
    setEditingCommentId(null);
    setMotionMode("idle");
    setEditorExpanded(true);
  }, [cleanupEditorState]);

  // 全部重置（动效 config + 样式 snapshot 全部归零，不影响当前编辑模式）
  const handleResetAll = useCallback(() => {
    // 动效 config 全部归零
    setFanConfig(DEFAULT_FAN_CONFIG);
    setCardInnerConfig(DEFAULT_CARD_INNER_CONFIG);
    setChatInputConfig(CHAT_INPUT_MOTION.defaultConfig);
    setAddMenuConfig(ADD_MENU_MOTION.defaultConfig);
    setAiBubbleConfig(AI_RUNNING_BUBBLE_MOTION.defaultConfig);
    setSidebarConfig(SIDEBAR_MOTION.defaultConfig);
    // 样式恢复
    elementSnapshotsRef.current.forEach((snapshot, el) => {
      if (el.isConnected) el.style.cssText = snapshot;
    });
    elementSnapshotsRef.current.clear();
    elementComputedRef.current.clear();
    setStyleChangeCount(0);
  }, []);

  const allChangesText = useMemo(() => {
    const allPairs: [string, { key: string; label: string }[], Record<string, number>, Record<string, number>][] = [
      ["Agent Fan Cards", AGENT_FAN_MOTION.schema, fanConfig as unknown as Record<string, number>, AGENT_FAN_MOTION.defaultConfig],
      ["Agent Card Inner", AGENT_CARD_INNER_MOTION.schema, cardInnerConfig as unknown as Record<string, number>, AGENT_CARD_INNER_MOTION.defaultConfig],
      ["Chat Input", CHAT_INPUT_MOTION.schema, chatInputConfig, CHAT_INPUT_MOTION.defaultConfig],
      ["Add Menu", ADD_MENU_MOTION.schema, addMenuConfig, ADD_MENU_MOTION.defaultConfig],
      ["AI Bubble", AI_RUNNING_BUBBLE_MOTION.schema, aiBubbleConfig, AI_RUNNING_BUBBLE_MOTION.defaultConfig],
      ["Sidebar", SIDEBAR_MOTION.schema, sidebarConfig, SIDEBAR_MOTION.defaultConfig],
    ];
    const sections: string[] = [];
    for (const [label, schema, cfg, def] of allPairs) {
      const changed = schema.filter(p => cfg[p.key] !== def[p.key]);
      if (changed.length > 0) {
        const lines = changed.map(p => `  ${p.key}: ${def[p.key]} → ${cfg[p.key]}  // ${p.label}`);
        sections.push(`「${label}」:\n{\n${lines.join(',\n')}\n}`);
      }
    }
    if (styleChangeCount > 0) {
      const styleItems: string[] = [];
      elementSnapshotsRef.current.forEach((snapshot, el) => {
        if (!el.isConnected) return;
        if ((el.style.cssText || "") === (snapshot || "")) return;
        // 元素定位
        const tag = el.tagName.toLowerCase();
        const cn = el.className;
        const cls = cn && typeof cn === 'string'
          ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
        const text = el.textContent?.trim().slice(0, 30) || '';
        const reactName = getReactComponentName(el);
        // 属性 diff
        const originalComputed = elementComputedRef.current.get(el) || {};
        const currentComputed = getComputedStyle(el);
        const propChanges: string[] = [];
        for (const prop of EDITABLE_PROPS) {
          const orig = originalComputed[prop] || '';
          const cur = (currentComputed as unknown as Record<string, string>)[prop] || '';
          if (cur !== orig) {
            const kebab = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
            propChanges.push(`    ${kebab}: ${orig} → ${cur}`);
          }
        }
        const label = reactName ? `${reactName} · ${tag}${cls}` : `${tag}${cls}`;
        const textHint = text ? ` "${text}"` : '';
        styleItems.push(`  ${label}${textHint}:\n${propChanges.join('\n')}`);
      });
      if (styleItems.length > 0) {
        sections.push(`样式编辑（${styleItems.length} 个元素）:\n${styleItems.join('\n')}`);
      }
    }
    if (sections.length === 0) return "";
    return `我在编辑器中调整了以下内容，请根据这些变更找到对应的代码并更新：\n\n${sections.join('\n\n')}`;
  }, [fanConfig, cardInnerConfig, chatInputConfig, addMenuConfig, aiBubbleConfig, sidebarConfig, styleChangeCount]);

  // 复制所有改动（动效参数 + 样式 diff 汇总）
  const handleCopyAllChanges = useCallback(() => {
    if (!allChangesText) return;
    navigator.clipboard.writeText(allChangesText);
  }, [allChangesText]);

  // 重选按钮 → 回到对应的 selecting
  const handleReselect = useCallback(() => {
    cleanupEditorState();
    const mode = motionMode;
    if (mode === 'style-editing') setMotionMode('style-selecting');
    else if (mode === 'comment-editing') setMotionMode('comment-selecting');
    else setMotionMode('motion-selecting');
  }, [cleanupEditorState, motionMode]);

  // idle → selecting（保持原有入口）
  const handleMotionButtonClick = useCallback(() => {
    setMotionMode("motion-selecting");
  }, []);

  const handleMotionSelect = useCallback((targetId: string) => {
    setMotionTarget(targetId);
    setMotionMode("editing");

    if (targetId === "agent-card") {
      clearCardInnerPreviewTimers();
      setCardInnerPreviewOverrideState(null);
      setAgentCardPreviewState("hover");
    }

    if (targetId === "chat-input") {
      setChatInputPreviewState("active");
    }
  }, [clearCardInnerPreviewTimers]);

  // ── 页面状态变化守卫 ──
  // motionMode 用 ref 读取，不放进依赖数组
  // ⚠️ 放进 deps 会导致进入非 idle 模式立即被弹回 idle（状态机瘫痪）
  const motionModeRef = useRef(motionMode);
  motionModeRef.current = motionMode;

  useEffect(() => {
    if (motionModeRef.current !== 'idle') {
      cleanupEditorState();
      setMotionMode('idle');
      setEditorExpanded(false);
    }
  }, [chatPhase, viewState, cleanupEditorState]);

  // ── 全局 Escape handler ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const mode = motionModeRef.current;
      if (mode === 'idle') return;

      e.preventDefault();
      e.stopPropagation();

      switch (mode) {
        case 'editing':
        case 'style-editing':
          cleanupEditorState();
          setMotionMode('idle');
          setEditorExpanded(true);
          break;
        case 'comment-editing':
          // 关闭弹窗，回到 comment-selecting
          setCommentElement(null);
          setEditingCommentId(null);
          setMotionMode('comment-selecting');
          break;
        case 'motion-selecting':
        case 'style-selecting':
          setMotionMode('idle');
          setEditorExpanded(true);
          break;
        case 'comment-selecting':
          setMotionMode('idle');
          setEditorExpanded(true);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cleanupEditorState]);

  // idle → style-selecting
  const handleStyleToggle = useCallback(() => {
    setMotionMode("style-selecting");
  }, []);

  // idle → comment-selecting
  const handleCommentToggle = useCallback(() => {
    setMotionMode("comment-selecting");
  }, []);

  // ── Comment 批注 helpers ──
  const getElementSelector = useCallback((el: HTMLElement): string => {
    const tag = el.tagName.toLowerCase();
    const cn = el.className;
    const cls = cn && typeof cn === 'string'
      ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
    return `${tag}${cls}`;
  }, []);

  const getElementLabel = useCallback((el: HTMLElement): string => {
    const selector = getElementSelector(el);
    const reactName = getReactComponentName(el);
    const text = (el.textContent?.trim() || '').slice(0, 20);
    const parts: string[] = [];
    if (reactName) parts.push(reactName);
    parts.push(selector);
    if (text) parts.push(`"${text}"`);
    return parts.join(' · ');
  }, [getElementSelector]);

  const getAncestorPath = useCallback((el: HTMLElement): string => {
    const parts: string[] = [];
    let cur: HTMLElement | null = el;
    for (let i = 0; i < 4 && cur && cur !== document.body; i++) {
      const tag = cur.tagName.toLowerCase();
      const id = cur.id ? `#${cur.id}` : '';
      const cn = cur.className && typeof cur.className === 'string'
        ? '.' + cur.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      parts.unshift(`${tag}${id}${cn}`);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }, []);

  const findCommentByElement = useCallback((el: HTMLElement): CommentEntry | undefined => {
    return commentsRef.current.find(c => {
      const ref = c.elementRef.deref();
      return ref === el;
    });
  }, []);

  const handleCommentSubmit = useCallback((text: string) => {
    if (!commentElement) return;
    const existing = editingCommentId !== null
      ? commentsRef.current.find(c => c.id === editingCommentId)
      : null;

    if (existing) {
      existing.text = text;
    } else {
      const id = ++commentIdCounter.current;
      commentsRef.current.push({
        id,
        selector: getElementSelector(commentElement),
        textContent: (commentElement.textContent?.trim() || '').slice(0, 50),
        reactComponent: getReactComponentName(commentElement),
        ancestorPath: getAncestorPath(commentElement),
        text,
        elementRef: new WeakRef(commentElement),
      });
    }
    setCommentCount(commentsRef.current.length);
    setCommentElement(null);
    setEditingCommentId(null);
    setMotionMode('comment-selecting');
  }, [commentElement, editingCommentId, getElementSelector, getAncestorPath]);

  const handleCommentDelete = useCallback(() => {
    if (editingCommentId === null) return;
    commentsRef.current = commentsRef.current.filter(c => c.id !== editingCommentId);
    setCommentCount(commentsRef.current.length);
    setCommentElement(null);
    setEditingCommentId(null);
    setMotionMode('comment-selecting');
  }, [editingCommentId]);

  const handleCommentClearAll = useCallback(() => {
    commentsRef.current = [];
    setCommentCount(0);
  }, []);

  const commentExportText = useMemo(() => {
    if (commentCount === 0) return "";
    const items = commentsRef.current.map(c => ({
      target: {
        selector: c.selector,
        textContent: c.textContent || undefined,
        reactComponent: c.reactComponent || undefined,
        path: c.ancestorPath || undefined,
      },
      comment: c.text,
    }));
    const json = JSON.stringify(items, null, 2);
    return `我在页面上标注了以下批注，请根据元素定位找到对应代码并处理：\n\n${json}`;
  }, [commentCount]);

  const handleCopyComments = useCallback(() => {
    if (!commentExportText) return;
    navigator.clipboard.writeText(commentExportText);
  }, [commentExportText]);

  // ── 样式模式：自由选区（capture listener + 高亮） ──
  const isStyleMode = motionMode === 'style-selecting' || motionMode === 'style-editing';

  useEffect(() => {
    if (!isStyleMode) return;

    // 高亮框：pointer-events:none，不影响交互
    const highlight = document.createElement('div');
    highlight.style.cssText = 'position:fixed;pointer-events:none;border:1px dashed rgba(22,100,255,0.6);background:rgba(22,100,255,0.04);border-radius:0;z-index:99999;transition:top 50ms,left 50ms,width 50ms,height 50ms;';
    document.body.appendChild(highlight);

    // 选中框：选中后持久显示，独立于 hover 高亮
    const selection = document.createElement('div');
    selection.style.cssText = 'position:fixed;pointer-events:none;border:1.5px solid rgba(22,100,255,0.6);background:rgba(22,100,255,0.08);border-radius:0;z-index:99998;display:none;';
    document.body.appendChild(selection);
    selectionOverlayRef.current = selection;

    // hover 气泡：跟鼠标走
    const hoverLabel = document.createElement('div');
    hoverLabel.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;font:500 10px/1.4 "PingFang SC",-apple-system,sans-serif;color:#fff;background:rgba(0,0,0,0.75);padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;backdrop-filter:blur(4px);';
    document.body.appendChild(hoverLabel);

    // 选中标签
    const selLabel = document.createElement('div');
    selLabel.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;font:500 10px/1 "PingFang SC",-apple-system,sans-serif;color:#fff;background:rgba(22,100,255,0.85);padding:2px 6px;border-radius:0 0 3px 3px;white-space:nowrap;display:none;';
    document.body.appendChild(selLabel);
    selLabelRef.current = selLabel;

    function elLabel(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const cn = (el as HTMLElement).className;
      const cls = cn && typeof cn === 'string'
        ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      const text = el.textContent?.trim().slice(0, 20) || '';
      return `${tag}${cls}${text ? ` "${text}"` : ''}`;
    }

    let currentHoverTarget: Element | null = null;

    const onMove = (e: MouseEvent) => {
      // hover 高亮：始终跟鼠标走
      let target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || target.closest('[data-editor-ui]')) {
        highlight.style.display = 'none';
        hoverLabel.style.display = 'none';
        return;
      }
      if (target instanceof SVGElement && !(target instanceof SVGSVGElement)) {
        target = target.closest('svg') || target;
      }
      highlight.style.display = '';
      currentHoverTarget = target;
      const rect = target.getBoundingClientRect();
      Object.assign(highlight.style, {
        top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
      });
      hoverLabel.style.display = '';
      hoverLabel.textContent = elLabel(target);
      Object.assign(hoverLabel.style, {
        top: (e.clientY + 16) + 'px', left: (e.clientX + 12) + 'px',
      });

      // 选中框跟随滚动/尺寸变化
      if (selectedElementRef.current?.isConnected) {
        const sr = selectedElementRef.current.getBoundingClientRect();
        Object.assign(selection.style, {
          display: '', top: sr.top + 'px', left: sr.left + 'px',
          width: sr.width + 'px', height: sr.height + 'px',
        });
        Object.assign(selLabel.style, {
          display: '', top: (sr.bottom) + 'px', left: sr.left + 'px',
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const mode = motionModeRef.current;
      if (mode !== 'style-selecting' && mode !== 'style-editing') return;

      // 事件源在编辑器 UI 内（包括程序化 .click() 触发的）→ 不拦截
      if (e.target instanceof Element && e.target.closest('[data-editor-ui]')) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || target.closest('[data-editor-ui]')) return;

      e.preventDefault();
      e.stopPropagation();

      let el = target as HTMLElement;
      if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) {
        el = (el.closest('svg') || el) as HTMLElement;
      }
      selectStyleElement(el);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick, { capture: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick, { capture: true });
      document.body.removeChild(highlight);
      document.body.removeChild(selection);
      document.body.removeChild(hoverLabel);
      document.body.removeChild(selLabel);
      selectionOverlayRef.current = null;
      selLabelRef.current = null;
    };
  }, [isStyleMode]);

  // ── 批注模式：自由选区（capture listener + 高亮） ──
  const isCommentMode = motionMode === 'comment-selecting' || motionMode === 'comment-editing';

  useEffect(() => {
    if (!isCommentMode) return;

    // hover 高亮框
    const highlight = document.createElement('div');
    highlight.style.cssText = 'position:fixed;pointer-events:none;border:1px dashed rgba(245,166,35,0.7);background:rgba(245,166,35,0.04);border-radius:0;z-index:99999;transition:top 50ms,left 50ms,width 50ms,height 50ms;';
    document.body.appendChild(highlight);

    // hover 标签
    const hoverLabel = document.createElement('div');
    hoverLabel.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;font:500 10px/1.4 "PingFang SC",-apple-system,sans-serif;color:#fff;background:rgba(0,0,0,0.75);padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;backdrop-filter:blur(4px);';
    document.body.appendChild(hoverLabel);

    function elLabel(el: Element): string {
      const tag = el.tagName.toLowerCase();
      const cn = (el as HTMLElement).className;
      const cls = cn && typeof cn === 'string'
        ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      const text = el.textContent?.trim().slice(0, 20) || '';
      return `${tag}${cls}${text ? ` "${text}"` : ''}`;
    }

    const onMove = (e: MouseEvent) => {
      if (motionModeRef.current === 'comment-editing') {
        highlight.style.display = 'none';
        hoverLabel.style.display = 'none';
        return;
      }
      let target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || target.closest('[data-editor-ui]')) {
        highlight.style.display = 'none';
        hoverLabel.style.display = 'none';
        return;
      }
      if (target instanceof SVGElement && !(target instanceof SVGSVGElement)) {
        target = target.closest('svg') || target;
      }
      highlight.style.display = '';
      const rect = target.getBoundingClientRect();
      Object.assign(highlight.style, {
        top: rect.top + 'px', left: rect.left + 'px',
        width: rect.width + 'px', height: rect.height + 'px',
      });
      hoverLabel.style.display = '';
      hoverLabel.textContent = elLabel(target);
      Object.assign(hoverLabel.style, {
        top: (e.clientY + 16) + 'px', left: (e.clientX + 12) + 'px',
      });
    };

    const onClick = (e: MouseEvent) => {
      const mode = motionModeRef.current;
      if (mode !== 'comment-selecting') return;

      if (e.target instanceof Element && e.target.closest('[data-editor-ui]')) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target || target.closest('[data-editor-ui]')) return;

      e.preventDefault();
      e.stopPropagation();

      let el = target as HTMLElement;
      if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) {
        el = (el.closest('svg') || el) as HTMLElement;
      }

      // 检查该元素是否已有批注
      const existing = commentsRef.current.find(c => c.elementRef.deref() === el);
      setCommentElement(el);
      setEditingCommentId(existing?.id ?? null);
      setMotionMode('comment-editing');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('click', onClick, { capture: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('click', onClick, { capture: true });
      document.body.removeChild(highlight);
      document.body.removeChild(hoverLabel);
    };
  }, [isCommentMode]);

  // ── 批注指示器：rAF 跟随元素位置 ──
  const commentIndicatorContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (commentCount === 0) {
      // 清理已有的指示器容器
      if (commentIndicatorContainerRef.current) {
        document.body.removeChild(commentIndicatorContainerRef.current);
        commentIndicatorContainerRef.current = null;
      }
      return;
    }

    let container = commentIndicatorContainerRef.current;
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('data-editor-ui', '');
      container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:99997;';
      document.body.appendChild(container);
      commentIndicatorContainerRef.current = container;
    }

    let rafId: number;
    const update = () => {
      if (!commentIndicatorContainerRef.current) return;
      const comments = commentsRef.current;
      // 调整 dot 数量
      while (container!.children.length > comments.length) {
        container!.removeChild(container!.lastChild!);
      }
      while (container!.children.length < comments.length) {
        const dot = document.createElement('div');
        dot.style.cssText = 'position:fixed;width:20px;height:20px;border-radius:50%;background:rgba(245,166,35,0.9);color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:transform 100ms;font-family:"PingFang SC",sans-serif;';
        container!.appendChild(dot);
      }

      comments.forEach((c, i) => {
        const dot = container!.children[i] as HTMLDivElement;
        const el = c.elementRef.deref();
        if (!el || !el.isConnected) {
          dot.style.display = 'none';
          return;
        }
        const rect = el.getBoundingClientRect();
        dot.style.display = 'flex';
        dot.style.top = (rect.top - 8) + 'px';
        dot.style.left = (rect.right - 8) + 'px';
        dot.textContent = String(i + 1);

        // 绑定点击事件（仅绑定一次）
        if (!dot.dataset.bound) {
          dot.dataset.bound = '1';
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const comment = commentsRef.current[i];
            if (!comment) return;
            const refEl = comment.elementRef.deref();
            if (!refEl) return;
            setCommentElement(refEl);
            setEditingCommentId(comment.id);
            setMotionMode('comment-editing');
          });
          dot.addEventListener('mouseenter', () => { dot.style.transform = 'scale(1.2)'; });
          dot.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)'; });
        }
      });

      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [commentCount]);

  // 清理批注指示器容器（组件卸载时）
  useEffect(() => {
    return () => {
      if (commentIndicatorContainerRef.current) {
        document.body.removeChild(commentIndicatorContainerRef.current);
        commentIndicatorContainerRef.current = null;
      }
    };
  }, []);

  const handleCardInnerSliderCommit = useCallback((key: string, value: number) => {
    if (key !== "infoCoverDuration") return;

    clearCardInnerPreviewTimers();
    setCardInnerPreviewOverrideState("default");

    const settleDelay = Math.max(0, Math.round(value * 1000)) + 40;
    cardInnerPreviewStageTimerRef.current = setTimeout(() => {
      setCardInnerPreviewOverrideState("hover");
      cardInnerPreviewStageTimerRef.current = null;

      cardInnerPreviewRestoreTimerRef.current = setTimeout(() => {
        setCardInnerPreviewOverrideState(null);
        cardInnerPreviewRestoreTimerRef.current = null;
      }, settleDelay);
    }, settleDelay);
  }, [clearCardInnerPreviewTimers]);

  const handleAgentCardPreviewStateChange = useCallback((state: string) => {
    clearFanPreviewTimers();
    clearCardInnerPreviewTimers();
    setFanPreviewOverrideState(null);
    setCardInnerPreviewOverrideState(null);
    setAgentCardPreviewState(state as AgentCardPreviewState);
  }, [clearFanPreviewTimers, clearCardInnerPreviewTimers]);

  // Agent Fan 滑杆松开时触发动画预览（使用 override state，不影响组件状态按钮）
  const handleAgentFanSliderCommit = useCallback((key: string, value: number) => {
    clearFanPreviewTimers();

    const fanDuration = key === "fanTransitionDuration" ? value : fanConfig.fanTransitionDuration;
    const hoverDuration = key === "hoverTransitionDuration" ? value : fanConfig.hoverTransitionDuration;
    const settleDelay = Math.max(0, Math.round(Math.max(fanDuration, hoverDuration) * 1000)) + 40;

    // 先回到 default 作为起点，再切到 hover，保证每次都是完整动效
    setFanPreviewOverrideState("default");

    fanPreviewStageTimerRef.current = setTimeout(() => {
      setFanPreviewOverrideState("hover");
      fanPreviewStageTimerRef.current = null;

      fanPreviewRestoreTimerRef.current = setTimeout(() => {
        setFanPreviewOverrideState(null);
        fanPreviewRestoreTimerRef.current = null;
      }, settleDelay);
    }, settleDelay);
  }, [clearFanPreviewTimers, fanConfig.fanTransitionDuration, fanConfig.hoverTransitionDuration]);

  useEffect(() => {
    return () => {
      clearFanPreviewTimers();
      clearCardInnerPreviewTimers();
    };
  }, [clearFanPreviewTimers, clearCardInnerPreviewTimers]);

  const handleNewChat = useCallback(() => {
    setChatPhase("welcome");
    setUserMessage("");
    setConversationTitle("");
    setArtifactsPanelOpen(false);
    setRevealStep(0);
    setSummonedAgent(null);
    setActiveSkills([]);
    setActiveDemoFlowId(DEMO_DEFAULT_FLOW_ID);
  }, []);

  const handleDemoFlowChange = useCallback((flowId: DemoFlowId) => {
    const flow = getDemoFlowById(flowId);
    const { baseline } = flow;

    setActiveDemoFlowId(flowId);

    if (baseline.viewState === "studio") {
      setSidebarMode("saas");
      setTargetView("studio");
      setViewState("studio");
    } else {
      setSidebarMode("agent");
      setTargetView("dataclaw");
      setViewState("dataclaw");
    }

    setChatPhase(baseline.chatPhase);
    setRevealStep(baseline.revealStep);
    setSummonedAgent(baseline.useDefaultAgent ? DEMO_DEFAULT_AGENT : null);
    setArtifactsPanelOpen(false);
    setActiveSkills([]);
    setActiveTables([]);

    if (baseline.chatPhase === "conversation") {
      setUserMessage(DEMO_CONVERSATION_MESSAGE);
      setConversationTitle(DEMO_CONVERSATION_TITLE);
      return;
    }

    setUserMessage("");
    setConversationTitle("");
  }, []);

  const handleMenuClick = useCallback((id: string) => {
    setTargetView(id);

    if (id === "studio") {
      setSidebarMode("saas");
      if (viewState === "dataclaw") {
        startShrinkToStudio();
      } else {
        setViewState("studio");
      }
      return;
    }

    if (id === "dataclaw") {
      setSidebarMode("agent");
      setViewState("dataclaw");
      return;
    }

    setSidebarMode("saas");
    setViewState("studio");
  }, [startShrinkToStudio, viewState]);

  const effectiveAgentCardPreviewState = fanPreviewOverrideState ?? cardInnerPreviewOverrideState ?? agentCardPreviewState;

  const isStudioVisibleState = viewState === "studio" || viewState === "shrinking";
  const isAgentWelcome = sidebarMode === "agent" && chatPhase === "welcome";
  const isEditorModeActive = motionMode !== "idle";
  const shouldShowEditorSelectButton = isStudioVisibleState || isAgentWelcome || isEditorModeActive || editorExpanded;

  return (
    <div style={{
      display: "flex",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      fontFamily: FONT,
    }}>

      <DemoNavSidebar
        flows={DEMO_FLOWS}
        activeFlowId={activeDemoFlowId}
        onFlowChange={handleDemoFlowChange}
      />

      {/* ── 中栏内容区 ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#18181b",
        }}
      >
        <div
          ref={viewportHostRef}
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#202124",
            borderRadius: 12,
          }}
        >
          <DotGrid dark />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: viewportSize.width,
              height: viewportSize.height,
              transform: `translate(-50%, -50%) scale(${renderScale})`,
              transformOrigin: "center center",
            }}
          >
            <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", backgroundColor: C.rightBg }}>
              <MotionTargetOverlay
                targetId="sidebar"
                targetLabel={SIDEBAR_MOTION.label}
                isSelecting={motionMode === "motion-selecting"}
                onSelect={handleMotionSelect}
              >
                <Sidebar
                  sidebarMode={sidebarMode}
                  onModeChange={handleModeChange}
                  activeId={targetView}
                  onMenuClick={handleMenuClick}
                  onNewTask={handleNewChat}
                  config={sidebarConfig}
                  previewState={motionMode === "editing" && motionTarget === "sidebar" ? sidebarPreviewState : undefined}
                />
              </MotionTargetOverlay>

              <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden", position: "relative" }}>
            {/* Studio 背景层：先露出主画布 */}
        <motion.div
          initial={false}
          animate={{ opacity: viewState === "dataclaw" ? 0 : 1 }}
          transition={shouldReduceMotion
            ? { duration: 0 }
            : { duration: STUDIO_REVEAL_DURATION, ease: STUDIO_REVEAL_EASE }
          }
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: viewState === "studio" ? "auto" : "none",
            zIndex: 0,
          }}
        >
          <StudioView />
        </motion.div>

        {/* 气泡层：与 main 分支一致的单段收敛 */}
        <motion.div
          initial={false}
          animate={viewState === "shrinking" || viewState === "studio"
            ? { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" }
            : { opacity: 0, scale: 2.5, x: -140, y: -200, filter: "blur(2px)" }
          }
          transition={shouldReduceMotion
            ? { duration: 0 }
            : viewState === "shrinking"
              ? {
                  duration: SHRINK_DURATION,
                  ease: BUBBLE_REVEAL_EASE,
                  opacity: {
                    duration: SHRINK_DURATION,
                    ease: [0.2, 0.85, 0.25, 1],
                  },
                }
              : { duration: 0.2, ease: EASE }
          }
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transformOrigin: "bottom right",
            willChange: "opacity, transform, filter",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: BUBBLE_TARGET.right,
              bottom: BUBBLE_TARGET.bottom,
              width: BUBBLE_TARGET.width,
              height: BUBBLE_TARGET.height,
            }}
          >
            <MotionTargetOverlay
              targetId="ai-bubble"
              targetLabel={AI_RUNNING_BUBBLE_MOTION.label}
              isSelecting={motionMode === "motion-selecting"}
              onSelect={handleMotionSelect}
            >
              <AiRunningBubble config={aiBubbleConfig} />
            </MotionTargetOverlay>
          </div>
        </motion.div>

        {(viewState === "dataclaw" || viewState === "shrinking") && (
          <motion.div
            ref={dataClawRef}
            initial={false}
            animate={viewState === "shrinking"
              ? {
                  scaleX: shrinkMetrics.scaleX,
                  scaleY: shrinkMetrics.scaleY,
                  x: shrinkMetrics.x,
                  y: shrinkMetrics.y,
                  opacity: 0,
                  borderRadius: BUBBLE_TARGET.radius,
                  filter: "blur(1.2px)",
                }
              : { scaleX: 1, scaleY: 1, x: 0, y: 0, opacity: 1, borderRadius: 0, filter: "blur(0px)" }
            }
            transition={shouldReduceMotion
              ? { duration: 0 }
              : viewState === "shrinking"
                ? {
                    duration: SHRINK_DURATION,
                    ease: SHRINK_EASE,
                  }
                : { duration: 0.24, ease: EASE }
            }
            onAnimationComplete={() => {
              if (viewState === "shrinking") {
                setViewState("studio");
              }
            }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
              transformOrigin: "bottom right",
              willChange: "transform, border-radius, opacity, filter",
              zIndex: 2,
            }}
          >
              {/* ── 聊天主区域（flex-1 column） ── */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
                {chatPhase === "conversation" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    style={{
                      height: 84,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      padding: "0 0 0 20px",
                      position: "relative",
                      backgroundColor: C.rightBg,
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <ChatTitlebar
                        title={conversationTitle}
                        showNewChat
                        onNewChat={handleNewChat}
                        onArtifacts={() => setArtifactsPanelOpen(v => !v)}
                      />
                    </div>
                  </motion.div>
                )}
                {/* ── 中间内容区（可滚动） ── */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: chatPhase === "welcome" ? "center" : "flex-start",
                  scrollbarWidth: "none",
                  transition: "justify-content 0.3s",
                  position: "relative",
                  backgroundColor: C.rightBg,
                }}>
                  {/* 内容宽度容器 880px */}
                  <div style={{
                    width: "100%",
                    maxWidth: 880,
                    boxSizing: "border-box",
                    padding: chatPhase === "welcome" ? "0 24px 24px" : "24px 24px 120px",
                  }}>
                    <AnimatePresence mode="wait">
                      {chatPhase === "welcome" ? (
                        <motion.div
                          key="welcome"
                          initial={{ y: -16 }}
                          animate={{ y: 0 }}
                          exit={{ opacity: 0, y: -16 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          style={{ marginTop: -190, position: "relative" }}
                        >
                          <AnimatePresence>
                            {!summonedAgent && (
                              <motion.div
                                key="welcome-content"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
                                exit={{ opacity: 0, y: -12, transition: { duration: 0.3, ease: EASE } }}
                              >
                                <div style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "40px 0 24px",
                                  transform: "translateY(-60px)",
                                }}>
                                  <span style={{
                                    fontFamily: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                    fontSize: 36,
                                    fontWeight: 600,
                                    lineHeight: "40px",
                                    color: "#000",
                                    whiteSpace: "nowrap",
                                  }}>WeData</span>
                                  <span style={{
                                    fontFamily: FONT,
                                    fontSize: 32,
                                    fontWeight: 600,
                                    lineHeight: "40px",
                                    color: "#000",
                                    whiteSpace: "nowrap",
                                  }}>专家团随时待命</span>
                                </div>
                                <div style={{ marginTop: -20 }}>
                                  <MotionTargetOverlay
                                    targetId="agent-fan"
                                    targetLabel={AGENT_FAN_MOTION.label}
                                    isSelecting={motionMode === "motion-selecting"}
                                    onSelect={handleMotionSelect}
                                  >
                                    <AgentFanCards
                                      config={fanConfig}
                                      cardInnerConfig={cardInnerConfig}
                                      previewState={motionMode === "editing" && (motionTarget === "agent-fan" || motionTarget === "agent-card") && effectiveAgentCardPreviewState !== "free" ? effectiveAgentCardPreviewState : undefined}
                                      onSkillClick={handleSkillClick}
                                      onSummon={handleSummon}
                                      isSelecting={motionMode === "motion-selecting"}
                                      onSelect={handleMotionSelect}
                                    />
                                  </MotionTargetOverlay>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="conversation"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          style={{ display: "flex", flexDirection: "column", gap: 24 }}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: EASE }}
                            onAnimationComplete={() => setRevealStep((s) => Math.max(s, 1))}
                          >
                            <UserMessageBubble content={userMessage} />
                          </motion.div>

                          {revealStep >= 1 && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, ease: EASE, delay: 0.3 }}
                              onAnimationComplete={() => setRevealStep((s) => Math.max(s, 2))}
                            >
                              <ThinkingSummary />
                            </motion.div>
                          )}

                          {revealStep >= 2 && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, ease: EASE, delay: 0.15 }}
                            >
                              <Plan />
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>

                {/* ── 置底输入框 ── */}
                <div style={{
                  position: "absolute",
                  left: 20,
                  right: 20,
                  bottom: 32,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 3,
                }}>
                  <div style={{ width: "100%", maxWidth: 880, position: "relative", pointerEvents: "auto" }}>
                    <AnimatePresence>
                      {chatPhase === "welcome" && summonedAgent && (
                        <motion.div
                          key={summonedAgent.name}
                          initial={{ y: 40, opacity: 0 }}
                          animate={{ y: 0, opacity: 1, transition: { duration: 0.35, ease: EASE } }}
                          exit={{ y: 16, opacity: 0, transition: { duration: 0.2, ease: EASE } }}
                          style={{
                            position: "absolute",
                            bottom: "calc(100% - 20px)",
                            left: 0,
                            right: 0,
                            zIndex: 0,
                            display: "flex",
                            alignItems: "flex-end",
                            paddingBottom: 20,
                            pointerEvents: "none",
                          }}
                        >
                          <img
                            src={summonedAgent.avatar}
                            alt={summonedAgent.name}
                            style={{
                              flexShrink: 0,
                              width: 120,
                              height: 106,
                              objectFit: "cover",
                              objectPosition: "top center",
                              pointerEvents: "none",
                              marginLeft: 20,
                            }}
                          />

                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            paddingBottom: 28,
                            flexWrap: "nowrap",
                            marginLeft: 6,
                          }}>
                            <span style={{
                              fontFamily: FONT,
                              fontSize: 24,
                              fontWeight: 600,
                              lineHeight: "32px",
                              color: "rgba(0,0,0,0.9)",
                              whiteSpace: "nowrap",
                            }}>
                              我是{summonedAgent.title}
                            </span>
                            <span style={{
                              fontFamily: "var(--font-pixelify-sans), 'Pixelify Sans', sans-serif",
                              fontSize: 28,
                              fontWeight: 500,
                              lineHeight: "32px",
                              color: "#2873FF",
                              whiteSpace: "nowrap",
                            }}>
                              {summonedAgent.name}
                            </span>
                            {summonedAgent.summonText && (
                              <span style={{
                                fontFamily: FONT,
                                fontSize: 24,
                                fontWeight: 600,
                                lineHeight: "32px",
                                color: "rgba(0,0,0,0.9)",
                                whiteSpace: "nowrap",
                              }}>
                                ，{summonedAgent.summonText}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ position: "relative" }}>
                      <MotionTargetOverlay
                        targetId="chat-input"
                        targetLabel={CHAT_INPUT_MOTION.label}
                        isSelecting={motionMode === "motion-selecting"}
                        onSelect={handleMotionSelect}
                      >
                        <ClaudeChatInput
                          ref={chatInputRef}
                          placeholder={chatPhase === "conversation" ? "继续对话..." : "选择一位专家或直接分配任务"}
                          skills={activeSkills}
                          onRemoveSkill={handleRemoveSkill}
                          onSelectSkill={handleSelectSkillFromMenu}
                          tables={activeTables}
                          onRemoveTable={handleRemoveTable}
                          onSelectTable={handleSelectTable}
                          agentChip={chatPhase === "welcome" ? (summonedAgent ?? undefined) : undefined}
                          onRemoveAgent={handleRemoveAgent}
                          onSendMessage={handleSendMessage}
                          config={chatInputConfig}
                          previewState={motionMode === "editing" && motionTarget === "chat-input" && chatInputPreviewState !== "free" ? chatInputPreviewState : undefined}
                          addMenuConfig={addMenuConfig}
                          addMenuPreviewState={motionMode === "editing" && motionTarget === "add-menu" ? addMenuPreviewState : undefined}
                          isSelecting={motionMode === "motion-selecting"}
                          onMotionSelect={handleMotionSelect}
                        />
                      </MotionTargetOverlay>
                    </div>
                  </div>
                </div>

                {/* 帘幕遮罩 */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: C.rightBg,
                    pointerEvents: "none",
                    zIndex: 50,
                  }}
                />

              </div>{/* 聊天主区域 end */}

            </motion.div>
          )}
          </div>
          </div>{/* L1154 inner div 结束 */}
          </div>{/* L1143 demo div 结束 */}

          {/* ── 顶部悬浮视口胶囊（高度对齐 Ardot toolbar 44px） ── */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 44,
              padding: "6px 12px",
              borderRadius: 21,
              border: "1px solid #3B3C3F",
              background: "#202124",
              boxShadow: "0 8px 20px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)",
              zIndex: 20,
            }}
          >
            {(Object.keys(VIEWPORT_PRESETS) as ViewportPreset[]).map((preset) => {
              const active = viewportPreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => setViewportPreset(preset)}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    borderRadius: 20,
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#ffffffd9" : "#ffffffa6",
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    border: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {VIEWPORT_PRESETS[preset].label}
                </button>
              );
            })}

            {/* 分隔线 */}
            <div style={{ width: 1, height: 20, background: "#3B3C3F", flexShrink: 0 }} />

            {/* 缩放百分比（内嵌在胶囊里） */}
            <ZoomControlInline
              zoomPercent={zoomPercent}
              setZoomPercent={setZoomPercent}
            />
          </div>

        </div>
      </div>

      <div
        style={{
          width: 240,
          height: "100vh",
          flexShrink: 0,
          backgroundColor: "#1a1a1a",
          overflowY: "auto",
          overflowX: "hidden",
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <AnimatePresence>
          {chatPhase === "welcome" && motionMode === "editing" && motionTarget === "agent-fan" && (
            <MotionPanel
              targetLabel={AGENT_FAN_MOTION.label}
              theme={motionTheme}
              schema={AGENT_FAN_MOTION.schema}
              config={fanConfig as unknown as Record<string, number>}
              defaultConfig={AGENT_FAN_MOTION.defaultConfig}
              onChange={(c) => setFanConfig(c as unknown as FanCardsConfig)}
              stateOptions={AGENT_FAN_MOTION.states}
              selectedState={agentCardPreviewState}
              onStateChange={handleAgentCardPreviewStateChange}
              onSliderCommit={handleAgentFanSliderCommit}
              onClose={handleEditorClose}
              docked
            />
          )}
          {chatPhase === "welcome" && motionMode === "editing" && motionTarget === "agent-card" && (
            <MotionPanel
              targetLabel={AGENT_CARD_INNER_MOTION.label}
              theme={motionTheme}
              schema={AGENT_CARD_INNER_MOTION.schema}
              config={cardInnerConfig as unknown as Record<string, number>}
              defaultConfig={AGENT_CARD_INNER_MOTION.defaultConfig}
              onChange={(c) => setCardInnerConfig(c as unknown as CardInnerConfig)}
              stateOptions={AGENT_CARD_INNER_MOTION.states}
              selectedState={agentCardPreviewState}
              onStateChange={handleAgentCardPreviewStateChange}
              onSliderCommit={(key, value) => handleCardInnerSliderCommit(key, value)}
              onClose={handleEditorClose}
              docked
            />
          )}
          {chatPhase === "welcome" && motionMode === "editing" && motionTarget === "chat-input" && (
            <MotionPanel
              targetLabel={CHAT_INPUT_MOTION.label}
              theme={motionTheme}
              schema={CHAT_INPUT_MOTION.schema}
              config={chatInputConfig}
              defaultConfig={CHAT_INPUT_MOTION.defaultConfig}
              onChange={(c) => setChatInputConfig(c)}
              stateOptions={CHAT_INPUT_MOTION.states}
              selectedState={chatInputPreviewState}
              onStateChange={(state) => setChatInputPreviewState(state as ChatInputPreviewState)}
              onClose={handleEditorClose}
              docked
            />
          )}
          {motionMode === "editing" && motionTarget === "add-menu" && (
            <MotionPanel
              targetLabel={ADD_MENU_MOTION.label}
              theme={motionTheme}
              schema={ADD_MENU_MOTION.schema}
              config={addMenuConfig}
              defaultConfig={ADD_MENU_MOTION.defaultConfig}
              onChange={(c) => setAddMenuConfig(c)}
              stateOptions={ADD_MENU_MOTION.states}
              selectedState={addMenuPreviewState}
              onStateChange={(s) => setAddMenuPreviewState(s)}
              onClose={handleEditorClose}
              docked
            />
          )}
          {motionMode === "editing" && motionTarget === "ai-bubble" && (
            <MotionPanel
              targetLabel={AI_RUNNING_BUBBLE_MOTION.label}
              theme={motionTheme}
              schema={AI_RUNNING_BUBBLE_MOTION.schema}
              config={aiBubbleConfig}
              defaultConfig={AI_RUNNING_BUBBLE_MOTION.defaultConfig}
              onChange={(c) => setAiBubbleConfig(c)}
              onClose={handleEditorClose}
              docked
            />
          )}
          {motionMode === "editing" && motionTarget === "sidebar" && (
            <MotionPanel
              targetLabel={SIDEBAR_MOTION.label}
              theme={motionTheme}
              schema={SIDEBAR_MOTION.schema}
              config={sidebarConfig}
              defaultConfig={SIDEBAR_MOTION.defaultConfig}
              onChange={(c) => setSidebarConfig(c)}
              stateOptions={SIDEBAR_MOTION.states}
              selectedState={sidebarPreviewState}
              onStateChange={(s) => setSidebarPreviewState(s)}
              onClose={handleEditorClose}
              docked
            />
          )}
        </AnimatePresence>

        {motionMode === 'style-editing' && selectedElementRef.current && (
          <StylePanel
            key={styleElementVersion}
            element={selectedElementRef.current}
            originalComputed={originalComputedRef.current}
            theme={motionTheme}
            onClose={handleEditorClose}
            onSelectElement={selectStyleElement}
            onStyleMutate={handleStyleMutate}
            docked
            onReset={() => {
              if (selectedElementRef.current?.isConnected) {
                const snapshot = elementSnapshotsRef.current.get(selectedElementRef.current);
                if (snapshot !== undefined) {
                  selectedElementRef.current.style.cssText = snapshot;
                }
              }
              setStyleChangeCount(getStyleModifiedElementCount());
              setStyleElementVersion(v => v + 1);
            }}
          />
        )}

      </div>

      {/* 批注弹窗 */}
      {motionMode === 'comment-editing' && commentElement && (
        <CommentPopover
          element={commentElement}
          elementLabel={getElementLabel(commentElement)}
          existingComment={editingCommentId !== null ? commentsRef.current.find(c => c.id === editingCommentId) : undefined}
          theme={motionTheme}
          onSubmit={handleCommentSubmit}
          onDelete={editingCommentId !== null ? handleCommentDelete : undefined}
          onClose={() => {
            setCommentElement(null);
            setEditingCommentId(null);
            setMotionMode('comment-selecting');
          }}
        />
      )}

      {/* Editor 选择模式按钮 - Agent welcome 与 Studio(含过渡态)显示，编辑中始终显示 */}
      {shouldShowEditorSelectButton && (
        <EditorSelectButton
          mode={motionMode}
          theme={motionTheme}
          expanded={editorExpanded}
          onExpandedChange={setEditorExpanded}
          onToggle={handleMotionButtonClick}
          onStyleToggle={handleStyleToggle}
          onCommentToggle={handleCommentToggle}
          onReselect={handleReselect}
          onExitEditing={handleEditorClose}
          onThemeToggle={() => setMotionTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          onResetAll={handleResetAll}
          onCopyChanges={handleCopyAllChanges}
          changeCount={motionChangeCount + styleChangeCount}
          changesPreviewText={allChangesText}
          commentCount={commentCount}
          commentPreviewText={commentExportText}
          onCopyComments={handleCopyComments}
          onClearComments={handleCommentClearAll}
        />
      )}

    </div>
  );
}

// DotGrid — 点状背景（暗色变体，复刻自 Ardot 方案三）
function DotGrid({ dark }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 20;
    const MAX_R = 2.2;
    const MIN_R = 1;
    const GLOW_RADIUS = 300;

    let width = 0;
    let height = 0;
    let dots: Array<{ x: number; y: number }> = [];
    let t = 0;

    const buildGrid = () => {
      dots = [];
      const cols = Math.ceil(width / SPACING) + 2;
      const rows = Math.ceil(height / SPACING) + 2;
      const ox = (width - (cols - 1) * SPACING) / 2;
      const oy = (height - (rows - 1) * SPACING) / 2;
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          dots.push({ x: ox + c * SPACING, y: oy + r * SPACING });
        }
      }
    };

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return false;
      width = w;
      height = h;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
      return true;
    };

    const updateMouse = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const resetMouse = () => { mouseRef.current = { x: -999, y: -999 }; };

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!readyRef.current) {
        if (resize()) readyRef.current = true;
        else return;
      }
      t += 0.01;
      ctx.clearRect(0, 0, width, height);
      for (const d of dots) {
        const dx = d.x - mouseRef.current.x;
        const dy = d.y - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);
        let ratio = Math.max(0, 1 - dist / GLOW_RADIUS);
        const idle = 0.05 + 0.03 * Math.sin(t + (d.x + d.y) * 0.05);
        ratio = Math.max(ratio, idle);
        const radius = MIN_R + ratio * (MAX_R - MIN_R);
        const alpha = dark ? (0.1 + ratio * 0.1) : (0.08 + ratio * 0.32);
        const tone = dark ? Math.round(170 + ratio * 20) : Math.round(85 + ratio * 130);
        const blue = dark ? Math.round(185 + ratio * 10) : Math.round(100 + ratio * 150);
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tone}, ${tone}, ${blue}, ${alpha})`;
        ctx.fill();
      }
    };

    animate();

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    window.addEventListener("pointermove", updateMouse, { passive: true });
    window.addEventListener("mouseleave", resetMouse);

    return () => {
      readyRef.current = false;
      ro.disconnect();
      window.removeEventListener("pointermove", updateMouse);
      window.removeEventListener("mouseleave", resetMouse);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [dark]);

  return <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ZoomControl — 右下角缩放百分比下拉（复刻自 Ardot new3）
function ZoomControl({
  zoomPercent,
  setZoomPercent,
}: {
  zoomPercent: number;
  setZoomPercent: Dispatch<SetStateAction<number>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        display: "flex",
        alignItems: "center",
        height: 30,
        borderRadius: 8,
        border: "1px solid #3B3C3F",
        background: "#202124",
        boxShadow: "0 8px 20px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)",
        zIndex: 20,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 28,
          padding: "0 8px",
          borderRadius: 4,
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: "#ffffffd9",
          fontSize: 11,
          fontWeight: 500,
          cursor: "pointer",
          border: "none",
          transition: "all 0.15s",
        }}
      >
        {zoomPercent}%
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ marginLeft: 2 }}>
          <path d="M2 3L4 5L6 3" stroke="#ffffffa6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            borderRadius: 8,
            border: "1px solid #3B3C3F",
            background: "#202124",
            boxShadow: "0 8px 20px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)",
            padding: 4,
            minWidth: 72,
          }}
        >
          {ZOOM_OPTIONS.map((value) => {
            const active = zoomPercent === value;
            return (
              <button
                key={value}
                onClick={() => {
                  setZoomPercent(value);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active ? "#ffffffd9" : "#ffffffa6",
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.1s",
                }}
              >
                {value}%
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ZoomControlInline — 内嵌在顶部胶囊里的缩放按钮（紧凑型）
function ZoomControlInline({
  zoomPercent,
  setZoomPercent,
}: {
  zoomPercent: number;
  setZoomPercent: Dispatch<SetStateAction<number>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          height: 32,
          padding: "0 10px",
          borderRadius: 20,
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: "#ffffffd9",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          border: "none",
          transition: "all 0.15s",
          gap: 4,
        }}
      >
        {Math.round(zoomPercent)}%
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M2 3L4 5L6 3" stroke="#ffffffa6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginBottom: 8,
            borderRadius: 8,
            border: "1px solid #3B3C3F",
            background: "#202124",
            boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
            padding: 4,
            minWidth: 72,
          }}
        >
          {ZOOM_OPTIONS.map((value) => {
            const active = Math.round(zoomPercent) === value;
            return (
              <button
                key={value}
                onClick={() => { setZoomPercent(value); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "5px 12px",
                  borderRadius: 4,
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  color: active ? "#ffffffd9" : "#ffffffa6",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.1s",
                }}
              >
                {value}%
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

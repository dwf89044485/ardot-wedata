"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export type ChatTab = "adjust" | "params";

export interface MotionChatMessage {
  role: "user" | "ai";
  text: string;
  tab: ChatTab;
  /** AI 消息：是否正在"思考"（逐步展示） */
  isThinking?: boolean;
  /** 消息唯一 id，用于定位更新 */
  id: string;
}

type MotionChatMessagesUpdater = MotionChatMessage[] | ((prev: MotionChatMessage[]) => MotionChatMessage[]);

const TAB_CONFIG: Record<ChatTab, { label: string; placeholder: string }> = {
  adjust: {
    label: "调整动效",
    placeholder: "例：入场动画改为弹性缓出，时长延长到 0.8s",
  },
  params: {
    label: "增删参数",
    placeholder: "例：新增一个「旋转角度」参数，范围 0-360°",
  },
};

// 增删参数 tab 的 AI 思考步骤
const PARAM_THINKING_STEPS = [
  "正在分析动效结构...",
  "正在分析动效结构...\n识别到可提取参数：overlapX（卡片间距）",
  "正在分析动效结构...\n识别到可提取参数：overlapX（卡片间距）\n正在生成控件配置...",
  "正在分析动效结构...\n识别到可提取参数：overlapX（卡片间距）\n正在生成控件配置...\n✅ 已新增「卡片间距」参数，范围 -60 ~ 20，已添加到面板。",
];

// 调整动效 tab 的 AI 思考步骤
const ADJUST_THINKING_STEPS = [
  "理解需求：提高悬浮高度...",
  "理解需求：提高悬浮高度...\n定位参数：hoverHeight（当前值 0.35）",
  "理解需求：提高悬浮高度...\n定位参数：hoverHeight（当前值 0.35）\n调整为 1.2，触发预览...",
  "理解需求：提高悬浮高度...\n定位参数：hoverHeight（当前值 0.35）\n调整为 1.2，触发预览...\n✅ 已将悬浮高度调整为 1.2，请查看效果。",
];

// 新建动效的初始 AI 思考步骤
const INITIAL_THINKING_STEPS = [
  "分析元素结构...",
  "分析元素结构...\n识别交互模式：hover 触发",
  "分析元素结构...\n识别交互模式：hover 触发\n生成动效方案：浮起 + 推开 + 投影...",
  "分析元素结构...\n识别交互模式：hover 触发\n生成动效方案：浮起 + 推开 + 投影...\n提取可调参数：悬浮高度、推开距离、时长...",
  "已为你生成卡片悬浮动效 ✨\n\n方案：hover 时卡片向上浮起 + 放大 + 投影加深，相邻卡片向两侧推开让出空间。\n\n当前参数：\n· 悬浮高度 0.35\n· 推开距离 12px\n· 推开时长 0.6s\n· 浮起时长 0.6s\n\n你可以拖动右侧滑杆微调，或继续描述修改需求。",
];

export interface MotionChatInputProps {
  /** 初始 prompt（来自新建动效时的输入） */
  initialPrompt?: string;
  /** 受控消息列表：由父组件持久化，避免模式切换或重挂载丢失 AI 回复 */
  messages?: MotionChatMessage[];
  /** 受控消息更新回调 */
  onMessagesChange?: (messages: MotionChatMessage[]) => void;
  /** 增删参数完成回调：通知父组件新增一个参数到面板 */
  onAddParam?: (param: { key: string; label: string; min: number; max: number; step: number }) => void;
  /** 调整参数回调：通知父组件修改某个参数的值 */
  onAdjustParam?: (key: string, value: number) => void;
  /** 初始思考流程完成回调（新建动效时，AI 分析完毕后触发） */
  onThinkingComplete?: () => void;
}

let msgCounter = 0;
function nextId() { return `msg-${++msgCounter}`; }

export default function MotionChatInput({ initialPrompt, messages: controlledMessages, onMessagesChange, onAddParam, onAdjustParam, onThinkingComplete }: MotionChatInputProps) {
  const [activeTab, setActiveTab] = useState<ChatTab>("adjust");
  const [localMessages, setLocalMessages] = useState<MotionChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMessagesControlled = controlledMessages !== undefined && onMessagesChange !== undefined;
  const messages = controlledMessages ?? localMessages;
  const messagesRef = useRef<MotionChatMessage[]>(messages);
  messagesRef.current = messages;

  const setMessages = useCallback((updater: MotionChatMessagesUpdater) => {
    const next = typeof updater === "function" ? updater(messagesRef.current) : updater;
    messagesRef.current = next;
    if (isMessagesControlled) {
      onMessagesChange?.(next);
      return;
    }
    setLocalMessages(next);
  }, [isMessagesControlled, onMessagesChange]);

  // 跟踪组件是否 mounted，用于 timer 回调中检查
  const isMountedRef = useRef(true);
  // 收集所有活跃 timer，unmount 时统一清理
  const activeTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // 稳定化回调引用
  const onAddParamRef = useRef(onAddParam);
  onAddParamRef.current = onAddParam;
  const onAdjustParamRef = useRef(onAdjustParam);
  onAdjustParamRef.current = onAdjustParam;
  const onThinkingCompleteRef = useRef(onThinkingComplete);
  onThinkingCompleteRef.current = onThinkingComplete;

  // mounted/unmounted 跟踪 + timer 清理
  useEffect(() => {
    const activeTimers = activeTimersRef.current;
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // 清理所有活跃 timer
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.clear();
    };
  }, []);

  // 安全的 setTimeout 包装：自动注册/注销 timer，回调前检查 mounted
  const safeTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      activeTimersRef.current.delete(id);
      if (!isMountedRef.current) return;
      fn();
    }, delay);
    activeTimersRef.current.add(id);
    return id;
  }, []);

  // 有 initialPrompt 时，mount 后自动播放初始思考流程
  useEffect(() => {
    if (!initialPrompt) {
      setIsProcessing(false);
      return;
    }

    const existingMessages = messagesRef.current;
    const hasInitialAiReply = existingMessages.some((m) => m.role === "ai");
    if (hasInitialAiReply) return;

    const userMsgId = nextId();
    const aiMsgId = nextId();
    const steps = INITIAL_THINKING_STEPS;
    let stepIdx = 0;

    // 先显示用户消息；如果 StrictMode 已经留下用户消息，则沿用它，只补跑 AI 流程
    const hasPromptMessage = existingMessages.some((m) => m.role === "user" && m.text === initialPrompt);
    if (!hasPromptMessage) {
      setMessages([{ id: userMsgId, role: "user", text: initialPrompt, tab: "adjust" }]);
    }
    setIsProcessing(true);

    const showNextStep = () => {
      if (!isMountedRef.current) return;
      if (stepIdx === 0) {
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, role: "ai", text: steps[0], tab: "adjust", isThinking: true },
        ]);
      } else {
        const isLast = stepIdx >= steps.length - 1;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, text: steps[Math.min(stepIdx, steps.length - 1)], isThinking: !isLast }
              : m
          )
        );
      }
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });

      stepIdx++;
      if (stepIdx < steps.length) {
        safeTimeout(showNextStep, 900);
      } else {
        setIsProcessing(false);
        onThinkingCompleteRef.current?.();
      }
    };

    safeTimeout(showNextStep, 500);
  }, [initialPrompt, setMessages, safeTimeout]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    if (activeTab === "params") {
      // 演示流程：无论发什么，显示固定文案
      const fixedUserText = "增加卡片间距的参数";
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text: fixedUserText, tab: "params" }]);
      setInput("");
      setIsProcessing(true);

      // 模拟 AI 思考过程：逐步展示
      let stepIdx = 0;
      const aiMsgId = nextId();

      const showNextStep = () => {
        if (!isMountedRef.current) return;
        if (stepIdx === 0) {
          // 首次：添加 AI 消息
          setMessages((prev) => [
            ...prev,
            { id: aiMsgId, role: "ai", text: PARAM_THINKING_STEPS[0], tab: "params", isThinking: true },
          ]);
        } else {
          // 按 id 定位并更新 AI 消息内容
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, text: PARAM_THINKING_STEPS[stepIdx], isThinking: stepIdx < PARAM_THINKING_STEPS.length - 1 }
                : m
            )
          );
        }
        scrollToBottom();

        stepIdx++;
        if (stepIdx < PARAM_THINKING_STEPS.length) {
          safeTimeout(showNextStep, 800);
        } else {
          // 思考完成，通知父组件新增参数
          setIsProcessing(false);
          onAddParamRef.current?.({ key: "overlapX", label: "卡片间距", min: -60, max: 20, step: 1 });
        }
      };

      // 延迟 400ms 开始思考
      safeTimeout(showNextStep, 400);
    } else {
      // 调整动效 tab：演示流程，无论发什么都显示"悬浮再高一点"
      const fixedUserText = "悬浮再高一点";
      setMessages((prev) => [...prev, { id: nextId(), role: "user", text: fixedUserText, tab: "adjust" }]);
      setInput("");
      setIsProcessing(true);

      let stepIdx = 0;
      const aiMsgId = nextId();

      const showNextStep = () => {
        if (!isMountedRef.current) return;
        if (stepIdx === 0) {
          setMessages((prev) => [
            ...prev,
            { id: aiMsgId, role: "ai", text: ADJUST_THINKING_STEPS[0], tab: "adjust", isThinking: true },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, text: ADJUST_THINKING_STEPS[stepIdx], isThinking: stepIdx < ADJUST_THINKING_STEPS.length - 1 }
                : m
            )
          );
        }
        scrollToBottom();

        stepIdx++;
        if (stepIdx < ADJUST_THINKING_STEPS.length) {
          safeTimeout(showNextStep, 800);
        } else {
          // 思考完成，修改参数值
          setIsProcessing(false);
          onAdjustParamRef.current?.("hoverHeight", 1.2);
        }
      };

      safeTimeout(showNextStep, 400);
    }
  }, [activeTab, isProcessing, scrollToBottom, safeTimeout, setMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div
      data-editor-ui
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* 消息列表（在卡片上方）或空态撑高 */}
      {messages.length > 0 ? (
        <div
          ref={scrollRef}
          style={{
            flex: "1 1 0",
            minHeight: 96,
            overflowY: "auto",
            padding: "4px 0 8px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            scrollbarWidth: "none",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.5,
                background: msg.role === "user" ? "rgba(22,100,255,0.12)" : "rgba(255,255,255,0.06)",
                color: msg.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.72)",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.isThinking && (
                <span style={{
                  display: "inline-block",
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(22,100,255,0.7)",
                  marginRight: 6,
                  animation: "pulse 1s infinite",
                }} />
              )}
              {msg.text}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* 输入卡片：Tab + textarea + 发送按钮 一体 */}
      <div
        style={{
          flexShrink: 0,
          minHeight: 0,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Tab 栏 */}
        <div
          style={{
            display: "flex",
            padding: 3,
            margin: 4,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
          }}
        >
          {(["adjust", "params"] as ChatTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  height: 26,
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                  color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: FONT,
                  transition: "background 150ms, color 150ms",
                }}
              >
                {TAB_CONFIG[tab].label}
              </button>
            );
          })}
        </div>

        {/* 输入框 + 发送按钮 */}
        <div style={{ position: "relative", padding: "0 8px 8px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={TAB_CONFIG[activeTab].placeholder}
            rows={2}
            style={{
              width: "100%",
              minHeight: 48,
              maxHeight: 72,
              boxSizing: "border-box",
              background: "transparent",
              border: "none",
              padding: "6px 36px 6px 4px",
              fontSize: 12,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.9)",
              fontFamily: FONT,
              outline: "none",
              resize: "none",
              opacity: isProcessing ? 0.5 : 1,
            }}
            disabled={isProcessing}
          />
          {/* 圆形发送按钮（右下角） */}
          <button
            onClick={() => handleSend(input)}
            disabled={isProcessing}
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: input.trim() && !isProcessing ? "rgba(22,100,255,0.85)" : "rgba(255,255,255,0.08)",
              cursor: input.trim() && !isProcessing ? "pointer" : "default",
              transition: "background 150ms",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 11.5V3M7 3L3.5 6.5M7 3L10.5 6.5"
                stroke={input.trim() && !isProcessing ? "#fff" : "rgba(255,255,255,0.32)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* pulse 动画 keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Loader2, Search } from "lucide-react";
import { squircleObserver } from "corner-smoothing";
import { motion } from "framer-motion";
import type { MotionTargetDef } from "@/components/ui/motion-panel";
import MotionTargetOverlay from "@/components/ui/motion-target-overlay";

// ── 实心纸飞机 SVG（对齐 Figma btn-send）────────────────────
function SendIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.2 1.8C14.5 1.5 14.9 1.8 14.8 2.2L12.2 13.6C12.1 14 11.7 14.1 11.4 13.9L8.2 11.6L6.6 13.3C6.3 13.6 5.8 13.4 5.8 13V10.4L12.4 3.4C12.5 3.3 12.3 3.1 12.2 3.2L4.2 9.2L1.6 7.8C1.2 7.6 1.2 7.1 1.6 6.9L14.2 1.8Z"
        fill={color}
      />
    </svg>
  );
}

// ── Design tokens ──────────────────────────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const SF_FONT = "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const DEFAULT_CORNER_SMOOTHING = 1;

const useCornerSmoothing = ({
  enabled,
  cornerRadius,
  cornerSmoothing,
  preserveSmoothing,
}: {
  enabled: boolean;
  cornerRadius: number;
  cornerSmoothing: number;
  preserveSmoothing: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const node = ref.current;
    if (!node) return;

    const observer = squircleObserver(node, {
      cornerRadius,
      cornerSmoothing,
      preserveSmoothing,
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, cornerRadius, cornerSmoothing, preserveSmoothing]);

  return ref;
};

// ── Types ──────────────────────────────────────────────────────
interface AttachedFile {
  id: string;
  file: File;
  type: string;
  preview: string | null;
  uploadStatus: string;
}

export interface SkillChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TableChip {
  id: string;
  label: string;
  description?: string;
}

export interface AgentChip {
  name: string;
  title: string;
  avatar: string;
}

const DEFAULT_CHAT_INPUT_MOTION_CONFIG = {
  shadowOpacity: 1,
  borderRotateDuration: 4,
  glowBlur: 20,
  glowOpacity: 1,
  glowSpread: -13,
  shadowOffsetX: 0,
  shadowOffsetY: 6,
} as const;

export const CHAT_INPUT_MOTION: MotionTargetDef = {
  id: "chat-input",
  label: "聊天输入框动效",
  schema: [
    { key: "shadowOpacity", label: "投影透明度", min: 0, max: 1, step: 0.05, states: ["default"] },
    { key: "borderRotateDuration", label: "流动速度", min: 0.5, max: 12, step: 0.1, states: ["active"] },
    { key: "glowBlur", label: "弥散", min: 0, max: 100, step: 1, states: ["active"] },
    { key: "glowOpacity", label: "透明度", min: 0, max: 1, step: 0.05, states: ["active"] },
    { key: "glowSpread", label: "收缩", min: -50, max: 30, step: 1, states: ["active"] },
    { key: "shadowOffsetX", label: "偏移", min: -30, max: 30, step: 1, states: ["active"], control: "xy", pairKey: "shadowOffsetY", dividerBefore: true },
  ],
  states: [
    { value: "active", label: "激活" },
    { value: "default", label: "默认" },
  ],
  defaultState: "active",
  defaultConfig: DEFAULT_CHAT_INPUT_MOTION_CONFIG as unknown as Record<string, number>,
};

// ── 加号菜单动效 ──────────────────────────────────────────────
const DEFAULT_ADD_MENU_MOTION_CONFIG = {
  menuInDuration: 0.3,
  menuOutDuration: 0.15,
  contentSlideDuration: 0.6,
} as const;

export const ADD_MENU_MOTION: MotionTargetDef = {
  id: "add-menu",
  label: "加号菜单动效",
  schema: [
    { key: "menuInDuration", label: "弹出速度", min: 0.05, max: 0.8, step: 0.01, group: "菜单弹出" },
    { key: "menuOutDuration", label: "收起速度", min: 0.05, max: 0.5, step: 0.01, group: "菜单弹出" },
    { key: "contentSlideDuration", label: "内容滑动速度", min: 0.1, max: 1.5, step: 0.05, group: "菜单弹出" },
  ],
  states: [
    { value: "closed", label: "菜单关闭" },
    { value: "open", label: "菜单打开" },
  ],
  defaultState: "closed",
  defaultConfig: DEFAULT_ADD_MENU_MOTION_CONFIG as unknown as Record<string, number>,
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ── Model options ─────────────────────────────────────────────
const MODEL_OPTIONS = [
  "Claude-Opus-4.6",
  "Claude-Sonnet-4.6",
  "Claude-Sonnet-4",
  "Claude-Haiku-3.5",
];

const SKILLS_OPTIONS = [
  {
    id: "table-builder",
    description: "自动生成建表 DDL 并执行，支持分区表和宽表",
  },
  {
    id: "data-profiler",
    description: "自动分析表的数据分布、空值率、异常值",
  },
] as const;

const TABLE_OPTIONS = [
  { id: "wedata_hive_visit_detials_index", description: "访问明细表" },
  { id: "wedata_dim_user_profile", description: "用户画像维度表" },
  { id: "wedata_dwd_order_detail", description: "订单明细 DWD 层" },
  { id: "wedata_ads_gmv_stats", description: "GMV 统计 ADS 层" },
  { id: "wedata_dim_product_catalog", description: "商品目录维度表" },
  { id: "wedata_dws_user_retention", description: "用户留存汇总 DWS 层" },
] as const;

// ── Portal 弹出菜单 ─────────────────────────────────────────
// 将菜单渲染到 body，避免被 squircle 的 clip-path 裁剪
const popupMenuBaseStyle: React.CSSProperties = {
  position: "fixed",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 8,
  boxShadow: "0px 8px 12px rgba(0,0,0,0.05), 0px 8px 24px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
  zIndex: 9999,
  minWidth: 180,
  overflow: "hidden",
  transformOrigin: "top left",
  transition: "width 0.6s cubic-bezier(0.22,1,0.36,1), height 0.6s cubic-bezier(0.22,1,0.36,1), min-width 0.6s cubic-bezier(0.22,1,0.36,1)",
  animation: undefined,
};

const addMenuContentSlideTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function PortalMenu({
  anchorRef,
  open,
  menuRef,
  menuStyle,
  children,
  inDuration,
  outDuration,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuStyle?: React.CSSProperties;
  children: React.ReactNode;
  inDuration?: number;
  outDuration?: number;
}) {
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
    }
  }, [open, anchorRef]);

  const handleAnimationEnd = useCallback(() => {
    if (closing) {
      setVisible(false);
      setClosing(false);
      setPos(null);
    }
  }, [closing]);

  if (!visible || !pos) return null;

  const animStyle = closing
    ? { animation: `ci-menu-out ${outDuration ?? 0.15}s ease-in both` }
    : { animation: `ci-menu-in ${inDuration ?? 0.3}s cubic-bezier(0.34,1.56,0.64,1) both` };

  return createPortal(
    <div ref={menuRef} onClick={(e) => e.stopPropagation()} onAnimationEnd={handleAnimationEnd} style={{ ...popupMenuBaseStyle, ...menuStyle, ...animStyle, left: pos.left, bottom: pos.bottom }}>
      {children}
    </div>,
    document.body,
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  height: 32,
  alignItems: "center",
  padding: "3px 8px",
  borderRadius: 8,
  cursor: "pointer",
  transition: "background 0.15s ease",
};

const menuItemTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "22px",
  color: "rgba(0,0,0,0.9)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ── File Preview Card ──────────────────────────────────────────
const FilePreviewCard = ({
  file,
  onRemove,
}: {
  file: AttachedFile;
  onRemove: (id: string) => void;
}) => {
  const isImage = file.type.startsWith("image/") && file.preview;
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #E8EAED",
        backgroundColor: "#F2F4F8",
      }}
      className="group"
    >
      {isImage ? (
        <img
          src={file.preview!}
          alt={file.file.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
          <FileText style={{ width: 16, height: 16, color: "#8B919E" }} />
          <span style={{ fontSize: 11, color: "#4A4F5A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.file.name}
          </span>
          <span style={{ fontSize: 10, color: "#8B919E" }}>{formatFileSize(file.file.size)}</span>
        </div>
      )}
      <button
        onClick={() => onRemove(file.id)}
        style={{
          position: "absolute", top: 4, right: 4,
          width: 18, height: 18, borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer",
          opacity: 0, transition: "opacity 0.15s",
        }}
        className="group-hover:opacity-100"
      >
        <X style={{ width: 10, height: 10, color: "#fff" }} />
      </button>
      {file.uploadStatus === "uploading" && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Loader2 style={{ width: 18, height: 18, color: "#fff", animation: "spin 1s linear infinite" }} />
        </div>
      )}
    </div>
  );
};

export interface ChatInputHandle {
  focus: () => void;
}

export type ChatInputPreviewState = "free" | "default" | "active";

interface ChatInputStyleOverrides {
  paddingTop?: number;
  innerPaddingX?: number;
  innerCornerRadius?: number;
  borderCornerRadiusActive?: number;
  borderCornerRadiusIdle?: number;
  borderPaddingActive?: number;
  borderPaddingIdle?: number;
  cornerSmoothing?: number;
  preserveSmoothing?: boolean;
  activeMinHeight?: number;
  barPadding?: number;
  barHeight?: number;
  barGap?: number;
  barBtnBorderRadius?: number;
  borderRotateDuration?: number;
  borderColorIdle?: string;
  glowBlur?: number;
  glowOpacity?: number;
  glowSpread?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  defaultShadowOpacity?: number;
  textareaFontSize?: number;
  textareaLineHeight?: number;
  textareaCaretColor?: string;
  textareaMaxHeight?: number;
  shimmerDuration?: number;
  innerBg?: string;
  textColor?: string;
  sendBtnBgActive?: string;
  sendBtnBgIdle?: string;
}

// ── Main component ─────────────────────────────────────────────
interface ChatInputProps {
  onSendMessage?: (data: { message: string; files: AttachedFile[] }) => void;
  placeholder?: string;
  skills?: SkillChip[];
  onRemoveSkill?: (id: string) => void;
  onSelectSkill?: (skill: SkillChip) => void;
  tables?: TableChip[];
  onRemoveTable?: (id: string) => void;
  onSelectTable?: (table: TableChip) => void;
  agentChip?: AgentChip;
  onRemoveAgent?: () => void;
  config?: Record<string, number>;
  previewState?: ChatInputPreviewState;
  addMenuConfig?: Record<string, number>;
  addMenuPreviewState?: string;
  isSelecting?: boolean;
  onMotionSelect?: (targetId: string) => void;
}

export const ClaudeChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ClaudeChatInput({
  onSendMessage,
  placeholder = "问我任何问题或分配一个任务",
  skills = [],
  onRemoveSkill,
  onSelectSkill,
  tables = [],
  onRemoveTable,
  onSelectTable,
  agentChip,
  onRemoveAgent,
  config = CHAT_INPUT_MOTION.defaultConfig,
  previewState,
  addMenuConfig = ADD_MENU_MOTION.defaultConfig,
  addMenuPreviewState,
  isSelecting,
  onMotionSelect,
}, ref) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const effectiveShowAddMenu = addMenuPreviewState === "open" ? true : addMenuPreviewState === "closed" ? false : showAddMenu;
  const effectiveSlideTransition = { duration: addMenuConfig.contentSlideDuration ?? 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [skillsKeyword, setSkillsKeyword] = useState("");
  const [isSkillsSearchFocused, setIsSkillsSearchFocused] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [tableKeyword, setTableKeyword] = useState("");
  const [isTableSearchFocused, setIsTableSearchFocused] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("Agent");
  const [selectedModel, setSelectedModel] = useState("Claude-Opus-4.6");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const agentBtnRef = useRef<HTMLDivElement>(null);
  const agentMenuRef = useRef<HTMLDivElement>(null);
  const modelBtnRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const skillsBtnRef = useRef<HTMLDivElement>(null);
  const skillsMenuRef = useRef<HTMLDivElement>(null);

  const normalizedSkillsKeyword = skillsKeyword.trim().toLowerCase();
  const filteredSkills = SKILLS_OPTIONS.filter((item) => {
    if (!normalizedSkillsKeyword) return true;
    return item.id.toLowerCase().includes(normalizedSkillsKeyword)
      || item.description.includes(skillsKeyword.trim());
  });

  const normalizedTableKeyword = tableKeyword.trim().toLowerCase();
  const filteredTables = TABLE_OPTIONS.filter((item) => {
    if (!normalizedTableKeyword) return true;
    return item.id.toLowerCase().includes(normalizedTableKeyword)
      || item.description.includes(tableKeyword.trim());
  });

  const tableListVisibleCount = Math.max(Math.min(TABLE_OPTIONS.length, 6), 1);
  const tableListMaxHeight = tableListVisibleCount * 50 + (tableListVisibleCount - 1) * 2;
  const tableMenuHeight = 16 + 36 + 8 + tableListMaxHeight;

  const addMenuStyle = showTableMenu
    ? { width: 320, minWidth: 320, height: tableMenuHeight, gap: 8 }
    : { width: 180, minWidth: 180, height: 82, gap: 2 };

  const hasContent = message.trim().length > 0 || files.length > 0;

  const runtimeActive = isFocused || !!agentChip;
  const isPreviewMode = previewState !== undefined;
  const isPreviewLocked = isPreviewMode && previewState !== "free";
  const isActive = isPreviewLocked ? previewState === "active" : runtimeActive;

  // ── Tuning-aware derived values ──
  const t: ChatInputStyleOverrides = {};
  const cornerSmoothing = t.cornerSmoothing ?? DEFAULT_CORNER_SMOOTHING;
  const preserveSmoothing = t.preserveSmoothing ?? true;
  const shadowOpacity = t.defaultShadowOpacity ?? (config["shadowOpacity"] ?? 1);
  const borderRotateDuration = t.borderRotateDuration ?? (config["borderRotateDuration"] ?? 4);
  const glowBlur = t.glowBlur ?? (config["glowBlur"] ?? 32);
  const glowOpacity = t.glowOpacity ?? (config["glowOpacity"] ?? 1);
  const glowSpread = t.glowSpread ?? (config["glowSpread"] ?? -30);
  const shadowOffsetX = t.shadowOffsetX ?? (config["shadowOffsetX"] ?? 0);
  const shadowOffsetY = t.shadowOffsetY ?? (config["shadowOffsetY"] ?? 0);
  const activeMinHeight = t.activeMinHeight ?? (config["activeMinHeight"] ?? 88);
  const paddingTop = t.paddingTop ?? 16;
  const innerPaddingX = t.innerPaddingX ?? 24;
  const innerCornerRadius = t.innerCornerRadius ?? 24;
  const borderCornerRadius = isActive ? (t.borderCornerRadiusActive ?? 25.5) : (t.borderCornerRadiusIdle ?? 25);
  const borderPadding = isActive ? (t.borderPaddingActive ?? 1.5) : (t.borderPaddingIdle ?? 1);
  const barPadding = t.barPadding ?? 16;
  const barHeight = t.barHeight ?? 32;
  const barGap = t.barGap ?? 8;
  const barBtnBorderRadius = t.barBtnBorderRadius ?? 20;
  const textareaFontSize = t.textareaFontSize ?? 16;
  const textareaLineHeight = t.textareaLineHeight ?? 24;
  const textareaCaretColor = t.textareaCaretColor ?? "#1664FF";
  const textareaMaxHeight = t.textareaMaxHeight ?? 320;
  const shimmerDuration = t.shimmerDuration ?? 5;
  const innerBg = t.innerBg ?? "#FFFFFF";
  const borderColorIdle = t.borderColorIdle ?? "#DFE2E8";
  const textColor = t.textColor ?? "rgba(0,0,0,0.9)";
  const sendBtnBgActive = t.sendBtnBgActive ?? "#1D2129";
  const sendBtnBgIdle = t.sendBtnBgIdle ?? "#E8EAED";

  const shouldAnimate = isActive;
  const inputContainerShadow = isActive
    ? "none"
    : isInputHovered
      ? `0px 8px 20px -4px rgba(0,0,0,${0.04 * shadowOpacity}), 0px 16px 36px -6px rgba(0,0,0,${0.05 * shadowOpacity})`
      : `0px 8px 16px -8px rgba(0,0,0,${0.06 * shadowOpacity}), 0px 4px 8px -4px rgba(0,0,0,${0.04 * shadowOpacity})`;

  const borderSquircleRef = useCornerSmoothing({
    enabled: true,
    cornerRadius: borderCornerRadius,
    cornerSmoothing,
    preserveSmoothing,
  });
  const innerSquircleRef = useCornerSmoothing({
    enabled: true,
    cornerRadius: innerCornerRadius,
    cornerSmoothing,
    preserveSmoothing,
  });
  // 暴露 focus 方法给父组件
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }), []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 320) + "px";
    }
  }, [message]);

  // 点击外部关闭所有弹出菜单
  useEffect(() => {
    if (!showAddMenu && !showAgentMenu && !showModelMenu && !showSkillsMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (showAddMenu && addMenuRef.current && !addMenuRef.current.contains(t) && addBtnRef.current && !addBtnRef.current.contains(t)) {
        setShowAddMenu(false);
        setShowTableMenu(false);
        setTableKeyword("");
      }
      if (showAgentMenu && agentMenuRef.current && !agentMenuRef.current.contains(t) && agentBtnRef.current && !agentBtnRef.current.contains(t)) {
        setShowAgentMenu(false);
      }
      if (showModelMenu && modelMenuRef.current && !modelMenuRef.current.contains(t) && modelBtnRef.current && !modelBtnRef.current.contains(t)) {
        setShowModelMenu(false);
      }
      if (showSkillsMenu && skillsMenuRef.current && !skillsMenuRef.current.contains(t) && skillsBtnRef.current && !skillsBtnRef.current.contains(t)) {
        setShowSkillsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu, showAgentMenu, showModelMenu, showSkillsMenu]);

  const handleFiles = useCallback((filesList: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(filesList).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: file.type.startsWith("image/") ? "image/unknown" : file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      uploadStatus: "uploading",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((p) => (p.id === f.id ? { ...p, uploadStatus: "complete" } : p))
        );
      }, 800 + Math.random() * 600);
    });
  }, []);

  const handleSend = () => {
    if (!hasContent) return;
    onSendMessage?.({ message, files });
    setMessage("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const keepInputFocusedWhenActive = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFocused) e.preventDefault();
  };

  return (
    <div
      style={{ width: "100%", fontFamily: FONT }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
      }}
    >
      {/* ── 彩色流动边框容器 ── */}
      {/* 原理：外层 padding:1.5px + overflow:hidden，内层白色 bg，中间旋转 conic-gradient 作为边框 */}
      {/* 外层不设 zIndex，不创建 stacking context，让 glow 的负 z-index 能逃逸到父级 */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setIsInputHovered(true)}
        onMouseLeave={() => setIsInputHovered(false)}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: borderCornerRadius,
            boxShadow: inputContainerShadow,
            transition: "box-shadow 0.25s ease",
            pointerEvents: "none",
          }}
        />
        {/* ── 光晕层：与边框同步旋转的 conic-gradient + blur 扩散 ── */}
        {/* 使用与边框完全相同的 conic-gradient 和 border-rotate 动画，投影颜色跟随边框流动 */}
        <div
          className="ci-glow"
          style={{
            position: "absolute",
            inset: -glowSpread,
            borderRadius: innerCornerRadius + glowSpread,
            background: "conic-gradient(from var(--angle, 0deg), rgba(95,125,255,0.8) 0deg, rgba(112,241,215,0.5) 86deg, rgba(255,145,72,0.62) 142deg, rgba(38,164,255,0.8) 248deg, rgba(95,125,255,0.8) 324deg, rgba(95,125,255,0.8) 360deg)",
            filter: `blur(${glowBlur}px)`,
            opacity: isActive ? glowOpacity : 0,
            transition: "opacity 0.4s ease",
            animation: shouldAnimate ? `border-rotate ${borderRotateDuration}s linear infinite` : "none",
            transform: `translate(${shadowOffsetX}px, ${shadowOffsetY}px)`,
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* ── 边框层 ── */}
        <div
          ref={borderSquircleRef}
          style={{
            position: "relative",
            borderRadius: borderCornerRadius,   // 24 + border padding
            padding: `${borderPadding}px`,
            transition: "padding 0.3s ease",
            background: isActive
              ? "conic-gradient(from var(--angle, 0deg), #DDDDFD 0deg, #A8DCF2 88deg, #F2CEB8 154deg, #C7E9E5 236deg, #DDDDFD 306deg, #DDDDFD 360deg)"
              : borderColorIdle,
            animation: shouldAnimate ? `border-rotate ${borderRotateDuration}s linear infinite` : "none",
          }}
        >
        {/* ── 内层白色主容器 ── */}
        <div
          ref={innerSquircleRef}
          style={{
            position: "relative",
            borderRadius: innerCornerRadius,
            backgroundColor: innerBg,
            display: "flex",
            flexDirection: "column",
            paddingTop,
          }}
        >
          {/* 文件预览区 */}
          {files.length > 0 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: `0 ${innerPaddingX}px 12px` }}>
              {files.map((f) => (
                <FilePreviewCard
                  key={f.id}
                  file={f}
                  onRemove={(id) => setFiles((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}

          {(skills.length > 0 || tables.length > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: `0 ${innerPaddingX}px 8px` }}>
              {skills.map((skill) => (
                <div
                  key={`skill-${skill.id}`}
                  className="ci-skill-chip"
                  onMouseDown={(e) => {
                    if (onRemoveSkill) e.preventDefault();
                  }}
                  onClick={(e) => {
                    if (!onRemoveSkill) return;
                    e.stopPropagation();
                    onRemoveSkill(skill.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 8px",
                    height: 24,
                    borderRadius: 12,
                    background: "#DEFAFC",
                    flexShrink: 0,
                    cursor: onRemoveSkill ? "pointer" : "default",
                  }}
                >
                  <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                    <div
                      className="ci-skill-chip-icon"
                      style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(0,0,0,0.7)" }}
                    >
                      {skill.icon ?? (
                        <img
                          src="/icons/ai-edit.svg"
                          alt=""
                          style={{ width: 14, height: 14, display: "block", opacity: 0.78 }}
                        />
                      )}
                    </div>
                    {onRemoveSkill && (
                      <div
                        className="ci-skill-chip-close"
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-hidden="true"
                      >
                        <img src="/icons/skill-close.svg" alt="" style={{ width: 14, height: 14, display: "block" }} />
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: SF_FONT,
                      fontSize: 14,
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: "rgba(0,0,0,0.9)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {skill.label}
                  </span>
                </div>
              ))}

              {tables.map((table) => (
                <div
                  key={`table-${table.id}`}
                  className="ci-table-chip"
                  onMouseDown={(e) => {
                    if (onRemoveTable) e.preventDefault();
                  }}
                  onClick={(e) => {
                    if (!onRemoveTable) return;
                    e.stopPropagation();
                    onRemoveTable(table.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "0 8px",
                    height: 24,
                    borderRadius: 12,
                    background: "#DEFAFC",
                    flexShrink: 0,
                    cursor: onRemoveTable ? "pointer" : "default",
                  }}
                >
                  <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                    <div
                      className="ci-table-chip-icon"
                      style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <img src="/icons/ai-table.svg" alt="" style={{ width: 14, height: 14, display: "block" }} />
                    </div>
                    {onRemoveTable && (
                      <div
                        className="ci-table-chip-close"
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-hidden="true"
                      >
                        <img src="/icons/skill-close.svg" alt="" style={{ width: 14, height: 14, display: "block" }} />
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: SF_FONT,
                      fontSize: 14,
                      fontWeight: 400,
                      lineHeight: "22px",
                      color: "rgba(0,0,0,0.9)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {table.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── 输入区域 ── */}
          <motion.div
            style={{
              position: "relative",
              padding: `0 ${innerPaddingX}px`,
              minHeight: textareaLineHeight,
            }}
          >
            {/* 扫光 placeholder */}
            {!message && (
              <motion.div
                initial={{ backgroundPosition: "200% 0" }}
                animate={{ backgroundPosition: "-200% 0" }}
                transition={{
                  repeat: Infinity,
                  duration: shimmerDuration,
                  ease: "linear",
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: innerPaddingX,
                  right: innerPaddingX,
                  fontSize: textareaFontSize,
                  lineHeight: `${textareaLineHeight}px`,
                  fontWeight: 400,
                  pointerEvents: "none",
                  userSelect: "none",
                  background:
                    "linear-gradient(110deg, #bbb, 35%, #fff, 50%, #bbb, 75%, #bbb)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {placeholder}
              </motion.div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                const pastedFiles: File[] = [];
                for (let i = 0; i < items.length; i++) {
                  if (items[i].kind === "file") {
                    const file = items[i].getAsFile();
                    if (file) pastedFiles.push(file);
                  }
                }
                if (pastedFiles.length > 0) {
                  e.preventDefault();
                  handleFiles(pastedFiles);
                }
              }}
              rows={1}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: textareaFontSize,
                fontWeight: 400,
                lineHeight: `${textareaLineHeight}px`,
                color: textColor,
                fontFamily: FONT,
                overflow: "hidden",
                display: "block",
                minHeight: textareaLineHeight,
                maxHeight: textareaMaxHeight,
                caretColor: textareaCaretColor,
              }}
            />
            <motion.div
              aria-hidden
              initial={false}
              animate={{ height: isActive ? Math.max(activeMinHeight - 24, 0) : 0 }}
              transition={{ type: "tween", duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ pointerEvents: "none" }}
            />
          </motion.div>

          {/* ── 底部操作栏（常驻可见） ── */}
          <div
            onClick={() => textareaRef.current?.focus()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: barPadding,
            }}
          >
            {/* 左侧工具 — h-32 gap-8 rounded-14 */}
            <div style={{ display: "flex", gap: barGap, height: barHeight, alignItems: "center", borderRadius: 14, flexShrink: 0 }}>
              {/* btn-add: 32×32 rounded-16 + 弹出菜单 */}
              <MotionTargetOverlay
                targetId={ADD_MENU_MOTION.id}
                targetLabel={ADD_MENU_MOTION.label}
                isSelecting={isSelecting ?? false}
                onSelect={onMotionSelect ?? (() => {})}
                zIndex={10}
              >
              <div style={{ position: "relative" }}>
                <div
                  ref={addBtnRef}
                  className="ci-hover ci-hover-round"
                  onMouseDown={keepInputFocusedWhenActive}
                  onClick={(e) => { e.stopPropagation(); setShowAddMenu((v) => !v); setShowAgentMenu(false); setShowModelMenu(false); setShowSkillsMenu(false); }}
                  style={{
                    position: "relative",
                    width: barHeight,
                    height: barHeight,
                    borderRadius: barHeight / 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ position: "absolute", inset: "18.75%" }}>
                    <div style={{ position: "absolute", inset: "16.67%" }}>
                      <img src="/icons/add.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
                    </div>
                  </div>
                </div>

                {/* 加号弹出菜单 — Portal 到 body */}
                <PortalMenu anchorRef={addBtnRef} open={effectiveShowAddMenu} menuRef={addMenuRef} menuStyle={addMenuStyle} inDuration={addMenuConfig.menuInDuration} outDuration={addMenuConfig.menuOutDuration}>
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <motion.div
                      initial={false}
                      animate={{ opacity: showTableMenu ? 0 : 1, x: showTableMenu ? -18 : 0 }}
                      transition={effectiveSlideTransition}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: "100%",
                        pointerEvents: showTableMenu ? "none" : "auto",
                      }}
                    >
                      {/* 指定表/知识库 */}
                      <div
                        className="ci-menu-item"
                        onClick={(e) => { e.stopPropagation(); setShowTableMenu(true); }}
                        style={{
                          display: "flex",
                          gap: 12,
                          height: 32,
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                          <img src="/icons/ai-chart.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 400, lineHeight: "22px",
                          color: "rgba(0,0,0,0.9)", whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis",
                          fontFamily: FONT,
                        }}>指定表/知识库</span>
                      </div>
                      {/* 上传文件/图片 */}
                      <div
                        className="ci-menu-item"
                        onClick={(e) => { e.stopPropagation(); setShowAddMenu(false); fileInputRef.current?.click(); }}
                        style={{
                          display: "flex",
                          gap: 12,
                          height: 32,
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0, overflow: "hidden" }}>
                          <img src="/icons/upload-1.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                        </div>
                        <span style={{
                          fontSize: 14, fontWeight: 400, lineHeight: "22px",
                          color: "rgba(0,0,0,0.9)", whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis",
                          fontFamily: FONT,
                        }}>上传文件/图片</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={false}
                      animate={{ opacity: showTableMenu ? 1 : 0, x: showTableMenu ? 0 : 18 }}
                      transition={effectiveSlideTransition}
                      onMouseDown={keepInputFocusedWhenActive}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        width: "100%",
                        pointerEvents: showTableMenu ? "auto" : "none",
                      }}
                    >
                      {/* 返回按钮 + 搜索框 同一行 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div
                          className="ci-hover ci-hover-round"
                          onClick={(e) => { e.stopPropagation(); setShowTableMenu(false); setTableKeyword(""); }}
                          style={{ width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                        >
                          <img src="/icons/chevron-down.svg" alt="" style={{ width: 14, height: 14, display: "block", transform: "rotate(90deg)" }} />
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", flex: 1,
                          padding: "4px 8px", borderRadius: 8,
                          border: `1px solid ${isTableSearchFocused ? "#00B6C3" : "#E9ECF1"}`,
                          boxShadow: isTableSearchFocused ? "0px 0px 0px 2px rgba(230, 246, 247, 1)" : "none",
                        }}>
                          <input
                            type="text"
                            value={tableKeyword}
                            onChange={(e) => setTableKeyword(e.target.value)}
                            onFocus={() => { setIsTableSearchFocused(true); }}
                            onBlur={() => setIsTableSearchFocused(false)}
                            placeholder="搜索数据表"
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontFamily: FONT, fontSize: 14, fontWeight: 400, lineHeight: "22px", color: "rgba(0,0,0,0.9)" }}
                          />
                        </div>
                      </div>
                      {/* 表列表 */}
                      <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", gap: 2, minHeight: tableListMaxHeight, maxHeight: tableListMaxHeight, overflowY: "auto" }}>
                        {filteredTables.map((table) => (
                          <div
                            key={table.id}
                            className="ci-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTable?.({ id: table.id, label: table.id, description: table.description });
                              setShowAddMenu(false);
                              setShowTableMenu(false);
                              setTableKeyword("");
                            }}
                            style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignSelf: "stretch", gap: 0, padding: "4px 8px", borderRadius: 8, cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                                <img src="/icons/ai-table.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 400, lineHeight: "22px", color: "rgba(0,0,0,0.9)", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{table.id}</span>
                            </div>
                            <span title={table.description} style={{ display: "block", width: "100%", fontSize: 12, fontWeight: 400, lineHeight: "20px", color: "rgba(0,0,0,0.5)", fontFamily: FONT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingLeft: 22 }}>{table.description}</span>
                          </div>
                        ))}
                        {filteredTables.length === 0 && (
                          <div style={{ padding: "12px 0", textAlign: "center", fontSize: 13, color: "rgba(0,0,0,0.35)", fontFamily: FONT }}>未找到匹配的数据表</div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </PortalMenu>
              </div>
              </MotionTargetOverlay>
              {/* 分割线: h-16 w-1px */}
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 1, height: 16, backgroundColor: "#DFE2E8", flexShrink: 0 }} />
              </div>

              {/* 工具组合: Agent + Model + Skills */}
              <div style={{ display: "flex", gap: 4, height: "100%", alignItems: "center", flexShrink: 0 }}>
                {/* Agent 按钮 + 菜单 */}
                <div style={{ position: "relative" }}>
                  <div
                    ref={agentBtnRef}
                    className="ci-hover"
                    onMouseDown={keepInputFocusedWhenActive}
                    onClick={(e) => { e.stopPropagation(); setShowAgentMenu((v) => !v); setShowModelMenu(false); setShowAddMenu(false); setShowSkillsMenu(false); }}
                    style={{
                      display: "flex",
                      gap: 4,
                      height: barHeight,
                      alignItems: "center",
                      padding: `0 8px`,
                      borderRadius: barBtnBorderRadius,
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                      <img src="/icons/ai-agent.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 500, lineHeight: "22px",
                      color: textColor, whiteSpace: "nowrap",
                      fontFamily: SF_FONT,
                    }}>{selectedAgent}</span>
                    <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "33.69%", right: "21.19%", bottom: "31.61%", left: "21.19%" }}>
                        <img src="/icons/chevron-down.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
                      </div>
                    </div>
                  </div>
                  <PortalMenu anchorRef={agentBtnRef} open={showAgentMenu} menuRef={agentMenuRef}>
                    <div onMouseDown={keepInputFocusedWhenActive} style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                      {[
                        { id: "Agent", icon: "/icons/ai-agent.svg", label: "Agent" },
                        { id: "Ask", icon: "/icons/ai-ask.svg", label: "Ask" },
                      ].map((item) => (
                        <div
                          key={item.id}
                          className="ci-menu-item"
                          onClick={(e) => { e.stopPropagation(); setSelectedAgent(item.id); setShowAgentMenu(false); }}
                          style={{
                            ...menuItemStyle,
                            backgroundColor: selectedAgent === item.id ? "#F2F4F8" : undefined,
                          }}
                        >
                          <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                            <img src={item.icon} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                          </div>
                          <span style={{ ...menuItemTextStyle, fontFamily: SF_FONT }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </PortalMenu>
                </div>

                {/* 模型按钮 + 菜单 */}
                <div style={{ position: "relative" }}>
                  <div
                    ref={modelBtnRef}
                    className="ci-hover"
                    onMouseDown={keepInputFocusedWhenActive}
                    onClick={(e) => { e.stopPropagation(); setShowModelMenu((v) => !v); setShowAgentMenu(false); setShowAddMenu(false); setShowSkillsMenu(false); }}
                    style={{
                      display: "flex",
                      gap: 4,
                      height: barHeight,
                      alignItems: "center",
                      padding: `0 8px`,
                      borderRadius: barBtnBorderRadius,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                      <img src="/icons/claude-logo.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 500, lineHeight: "22px",
                      color: textColor, whiteSpace: "nowrap",
                      fontFamily: SF_FONT,
                    }}>{selectedModel}</span>
                    <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "33.69%", right: "21.19%", bottom: "31.61%", left: "21.19%" }}>
                        <img src="/icons/chevron-down.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
                      </div>
                    </div>
                  </div>
                  <PortalMenu anchorRef={modelBtnRef} open={showModelMenu} menuRef={modelMenuRef}>
                    <div onMouseDown={keepInputFocusedWhenActive} style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                      {MODEL_OPTIONS.map((model) => (
                        <div
                          key={model}
                          className="ci-menu-item"
                          onClick={(e) => { e.stopPropagation(); setSelectedModel(model); setShowModelMenu(false); }}
                          style={{
                            ...menuItemStyle,
                            backgroundColor: selectedModel === model ? "#F2F4F8" : undefined,
                          }}
                        >
                          <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                            <img src="/icons/claude-logo.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                          </div>
                          <span style={{ ...menuItemTextStyle, fontFamily: SF_FONT }}>{model}</span>
                        </div>
                      ))}
                    </div>
                  </PortalMenu>
                </div>

                {/* Skills 按钮 + 菜单 */}
                <div style={{ position: "relative" }}>
                  <div
                    ref={skillsBtnRef}
                    className="ci-hover"
                    onMouseDown={keepInputFocusedWhenActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSkillsMenu((v) => !v);
                      setShowAddMenu(false);
                      setShowAgentMenu(false);
                      setShowModelMenu(false);
                    }}
                    style={{
                      display: "flex",
                      gap: 4,
                      height: "100%",
                      alignItems: "center",
                      padding: `0 8px`,
                      borderRadius: barBtnBorderRadius,
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                      <img src="/icons/ai-edit.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 500, lineHeight: "22px",
                      color: textColor, whiteSpace: "nowrap",
                      fontFamily: SF_FONT,
                    }}>Skills</span>
                    <div style={{ position: "relative", width: 14, height: 14, flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "33.69%", right: "21.19%", bottom: "31.61%", left: "21.19%" }}>
                        <img src="/icons/chevron-down.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
                      </div>
                    </div>
                  </div>

                  <PortalMenu
                    anchorRef={skillsBtnRef}
                    open={showSkillsMenu}
                    menuRef={skillsMenuRef}
                    menuStyle={{ width: 320, minWidth: 320, gap: 8 }}
                  >
                    <div onMouseDown={keepInputFocusedWhenActive} style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          alignSelf: "stretch",
                          gap: 8,
                          padding: "4px 8px 4px 4px",
                          borderRadius: 8,
                          border: `1px solid ${isSkillsSearchFocused ? "#00B6C3" : "#E9ECF1"}`,
                          boxShadow: isSkillsSearchFocused ? "0px 0px 0px 2px rgba(230, 246, 247, 1)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", alignSelf: "stretch", flexShrink: 0 }}>
                          <Search size={16} color="rgba(0,0,0,0.5)" strokeWidth={2} />
                        </div>
                        <input
                          type="text"
                          value={skillsKeyword}
                          onChange={(e) => setSkillsKeyword(e.target.value)}
                          onFocus={() => {
                            setIsSkillsSearchFocused(true);
                          }}
                          onBlur={() => setIsSkillsSearchFocused(false)}
                          placeholder="搜索 Skills"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontFamily: FONT,
                            fontSize: 14,
                            fontWeight: 400,
                            lineHeight: "22px",
                            color: "rgba(0,0,0,0.9)",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", gap: 2 }}>
                        {filteredSkills.map((skill) => (
                          <div
                            key={skill.id}
                            className="ci-menu-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSkill?.({ id: skill.id, label: skill.id });
                              setShowSkillsMenu(false);
                              setSkillsKeyword("");
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignSelf: "stretch",
                              gap: 0,
                              padding: "4px 8px",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                          >
                            <span style={{
                              fontSize: 14,
                              fontWeight: 400,
                              lineHeight: "22px",
                              color: "rgba(0,0,0,0.9)",
                              fontFamily: FONT,
                            }}>{skill.id}</span>
                            <span
                              title={skill.description}
                              style={{
                                display: "block",
                                width: "100%",
                                fontSize: 12,
                                fontWeight: 400,
                                lineHeight: "20px",
                                color: "rgba(0,0,0,0.5)",
                                fontFamily: FONT,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {skill.description}
                            </span>
                          </div>
                        ))}
                        {filteredSkills.length === 0 && (
                          <div style={{ ...menuItemStyle, fontFamily: FONT, color: "rgba(0,0,0,0.5)", cursor: "default" }}>
                            未找到匹配 Skills
                          </div>
                        )}
                      </div>

                      <div style={{ width: "100%", height: 1, backgroundColor: "#E9ECF1", flexShrink: 0 }} />

                      <div
                        className="ci-menu-item"
                        onClick={(e) => { e.stopPropagation(); setShowSkillsMenu(false); }}
                        style={menuItemStyle}
                      >
                        <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0 }}>
                          <img src="/icons/upload-1.svg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                        </div>
                        <span style={{ ...menuItemTextStyle, fontFamily: FONT }}>导入 Skills</span>
                      </div>
                    </div>
                  </PortalMenu>
                </div>
              </div>
            </div>

            {/* 右侧：发送按钮 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", borderRadius: 12 }}>
              <button
                onClick={handleSend}
                disabled={!hasContent}
                style={{
                  width: barHeight,
                  height: barHeight,
                  borderRadius: barHeight / 2,
                  border: "none",
                  background: hasContent ? sendBtnBgActive : sendBtnBgIdle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: hasContent ? "pointer" : "default",
                  color: "#FFFFFF",
                  transition: "background 0.2s ease",
                  flexShrink: 0,
                  padding: 0,
                }}
                type="button"
                aria-label="发送"
              >
                <SendIcon size={16} color="#FFFFFF" />
              </button>
            </div>
          </div>

          {/* 拖拽遮罩 */}
          {isDragging && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(22, 100, 255, 0.04)",
                border: "2px dashed #1664FF",
                borderRadius: innerCornerRadius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
              }}
            >
              <span style={{ fontSize: 14, color: "#1664FF", fontWeight: 500 }}>
                拖拽文件到此处上传
              </span>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes border-rotate {
          to { --angle: 360deg; }
        }


        .ci-hover { transition: background 0.15s ease; }
        .ci-hover:hover { background: #F2F4F8 !important; }
        .ci-hover-round:hover { background: #F2F4F8 !important; }
        .ci-menu-item { transition: background 0.15s ease; }
        .ci-menu-item:hover { background: #F2F4F8 !important; }
        .ci-skill-chip { transition: background 0.15s ease; }
        .ci-skill-chip:hover { background: #C6F3F7 !important; }
        .ci-skill-chip-icon { transition: opacity 0.2s ease, transform 0.2s ease; }
        .ci-skill-chip-close { opacity: 0; transform: rotate(-180deg); pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
        .ci-skill-chip:hover .ci-skill-chip-icon { opacity: 0; transform: rotate(180deg); pointer-events: none; }
        .ci-skill-chip:hover .ci-skill-chip-close { opacity: 1; transform: rotate(0deg); pointer-events: auto; }
        .ci-table-chip { transition: background 0.15s ease; }
        .ci-table-chip:hover { background: #C6F3F7 !important; }
        .ci-table-chip-icon { transition: opacity 0.2s ease, transform 0.2s ease; }
        .ci-table-chip-close { opacity: 0; transform: rotate(-180deg); pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; }
        .ci-table-chip:hover .ci-table-chip-icon { opacity: 0; transform: rotate(180deg); pointer-events: none; }
        .ci-table-chip:hover .ci-table-chip-close { opacity: 1; transform: rotate(0deg); pointer-events: auto; }

        @keyframes ci-menu-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ci-menu-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(8px) scale(0.96); }
        }
      `}</style>

      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
});

export default ClaudeChatInput;

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  IconIngestData,
  IconCatalog,
  IconStudio,
  IconPin,
  IconWorkflow,
  IconOps,
  IconSQL,
  IconDashboard,
  IconChatBI,
  IconMLExp,
  IconFeature,
  IconModelReg,
  IconModelSvc,
  IconAgents,
  IconApps,
  IconPlatform,
  IconDataSource,
  IconCompute,
  IconGovernance,
  IconWorkspace,
} from "@/components/ui/wedata-icons";
import SidebarAgentContent from "@/components/ui/sidebar-agent-content";
import type { MotionTargetDef } from "@/components/ui/motion-panel";

export const SIDEBAR_MOTION: MotionTargetDef = {
  id: "sidebar",
  label: "侧边栏动效",
  schema: [
    { key: "collapseDuration",  label: "展开收起速度",   min: 0.05, max: 0.8, step: 0.01, group: "展开收起" },
    { key: "contentFadeDuration", label: "内容切换速度", min: 0.05, max: 0.6, step: 0.01, group: "展开收起" },
    { key: "expandedWidth",     label: "展开时的宽度",   min: 180,  max: 400, step: 4,    group: "展开收起" },
    { key: "collapsedWidth",    label: "收起时的宽度",   min: 48,   max: 96,  step: 4,    group: "展开收起" },
  ],
  states: [
    { value: "agent", label: "Agent 模式" },
    { value: "saas", label: "控制台模式" },
  ],
  defaultState: "agent",
  defaultConfig: {
    collapseDuration: 0.22,
    contentFadeDuration: 0.18,
    expandedWidth: 264,
    collapsedWidth: 72,
  },
};

// ── 本地资产路径
const LOGO_OTTER_URL   = "/logo/otter.svg";
const LOGO_TEXT_URL    = "/logo/wedata-text.svg";
const SIDEBAR_ICON_URL = "/logo/sidebar-toggle.svg";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  sidebarBg:    "#F5F6F8",
  activeItemBg: "#E1E5ED",
  hoverItemBg:  "#ECEEF2",
  textPrimary:  "rgba(0,0,0,0.9)",
  textTertiary: "rgba(0,0,0,0.5)",
  iconDefault:  "rgba(0,0,0,0.7)",
  border:       "rgba(0,0,0,0.06)",
  // Pill tab tokens
  tabContainerBg: "#ECEEF2",
  tabActiveBg:    "rgba(255,255,255,0.9)",
  tabActiveShadow: "0 3px 6px -3px rgba(0,0,0,0.08), 0 6px 12px -6px rgba(0,0,0,0.04)",
  tabInactiveText: "rgba(0,0,0,0.7)",
} as const;

// ── Menu data ──────────────────────────────────────────────────
interface MenuItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

const ic = (color = C.iconDefault) => ({ color });

const MENU_GROUPS: MenuGroup[] = [
  {
    items: [
      { id: "ingest",   label: "接入数据",   shortLabel: "接入",    icon: <IconIngestData size={16} {...ic()} /> },
      { id: "catalog",  label: "数据目录",   shortLabel: "目录",    icon: <IconCatalog    size={16} {...ic()} /> },
      { id: "studio",   label: "Studio",    shortLabel: "Studio", icon: <IconStudio     size={16} {...ic()} /> },
    ],
  },
  {
    label: "快捷方式",
    items: [
      { id: "workflow-pin", label: "工作流",   shortLabel: "工作流", icon: <IconPin size={16} {...ic()} /> },
      { id: "mlexp-pin",    label: "模型实验", shortLabel: "实验",   icon: <IconPin size={16} {...ic()} /> },
    ],
  },
  {
    label: "开发/运维",
    items: [
      { id: "workflow", label: "工作流",   shortLabel: "工作流", icon: <IconWorkflow size={16} {...ic()} /> },
      { id: "ops",      label: "运维监控", shortLabel: "运维",   icon: <IconOps      size={16} {...ic()} /> },
    ],
  },
  {
    label: "分析/洞察",
    items: [
      { id: "sql",    label: "SQL 探索", shortLabel: "SQL",    icon: <IconSQL       size={16} {...ic()} /> },
      { id: "dash",   label: "仪表盘",   shortLabel: "仪表盘", icon: <IconDashboard size={16} {...ic()} /> },
      { id: "chatbi", label: "ChatBI",   shortLabel: "ChatBI", icon: <IconChatBI    size={16} {...ic()} /> },
    ],
  },
  {
    label: "ML",
    items: [
      { id: "mlexp",    label: "模型实验", shortLabel: "实验", icon: <IconMLExp    size={16} {...ic()} /> },
      { id: "feature",  label: "特征管理", shortLabel: "特征", icon: <IconFeature  size={16} {...ic()} /> },
      { id: "modelreg", label: "模型管理", shortLabel: "模型", icon: <IconModelReg size={16} {...ic()} /> },
      { id: "modelsvc", label: "模型服务", shortLabel: "服务", icon: <IconModelSvc size={16} {...ic()} /> },
    ],
  },
  {
    label: "AI 应用",
    items: [
      { id: "agents", label: "AI Agents", shortLabel: "Agents", icon: <IconAgents size={16} {...ic()} /> },
      { id: "apps",   label: "Apps",      shortLabel: "Apps",   icon: <IconApps   size={16} {...ic()} /> },
    ],
  },
  {
    label: "管理",
    items: [
      { id: "platform", label: "平台管理", shortLabel: "平台",  icon: <IconPlatform   size={16} {...ic()} /> },
      { id: "datasrc",  label: "数据源",   shortLabel: "数据源", icon: <IconDataSource size={16} {...ic()} /> },
      { id: "compute",  label: "计算资源", shortLabel: "资源",  icon: <IconCompute    size={16} {...ic()} /> },
      { id: "govern",   label: "数据治理", shortLabel: "治理",  icon: <IconGovernance size={16} {...ic()} /> },
    ],
  },
];

// ── Sidebar Props ──────────────────────────────────────────────
export type SidebarMode = "agent" | "saas";

interface SidebarProps {
  sidebarMode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  activeId?: string;
  onMenuClick?: (id: string) => void;
  onNewTask?: () => void;
  config?: Record<string, number>;
  previewState?: string;
}

// ── Animation constants ────────────────────────────────────────
const DEFAULT_COLLAPSE_DURATION = 0.22;
const COLLAPSE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const DEFAULT_CONTENT_FADE_DURATION = 0.18;

const DEFAULT_EXPANDED_WIDTH = 264;
const DEFAULT_COLLAPSED_WIDTH = 72;

// ── Sidebar ────────────────────────────────────────────────────
export default function Sidebar({ sidebarMode, onModeChange, activeId = "dataclaw", onMenuClick, onNewTask, config, previewState }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tabExpanded, setTabExpanded] = useState(false);

  // previewState 覆盖内部状态（"free" 或 undefined 时不干预）
  const effectiveCollapsed = collapsed;
  const effectiveMode = (previewState === "agent" || previewState === "saas")
    ? previewState as SidebarMode
    : sidebarMode;

  const COLLAPSE_DURATION = config?.collapseDuration ?? DEFAULT_COLLAPSE_DURATION;
  const CONTENT_FADE_DURATION = config?.contentFadeDuration ?? DEFAULT_CONTENT_FADE_DURATION;
  const EXPANDED_WIDTH = config?.expandedWidth ?? DEFAULT_EXPANDED_WIDTH;
  const COLLAPSED_WIDTH = config?.collapsedWidth ?? DEFAULT_COLLAPSED_WIDTH;

  const expandedWidth = EXPANDED_WIDTH;
  const currentWidth = effectiveCollapsed ? COLLAPSED_WIDTH : expandedWidth;

  const handleModeChange = (mode: SidebarMode) => {
    setCollapsed(false);
    onModeChange(mode);
  };

  // ── Shared ModeTab ───────────────────────────────────────────
  const ModeTab = ({ large }: { large: boolean }) => (
    <motion.div
      layout
      layoutId="mode-tab"
      transition={{ duration: 0.28, ease: COLLAPSE_EASE }}
      style={{
        display: "flex",
        width: large ? "100%" : "fit-content",
        height: large ? 34 : 26,
        borderRadius: 999,
        backgroundColor: C.tabContainerBg,
        padding: 2,
        gap: large ? 0 : 2,
        boxShadow: "inset 0 2px 2px rgba(0,0,0,0.03)",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {large && (
        <motion.div
          layout
          style={{
            position: "absolute",
            top: 2, left: 2, bottom: 2,
            width: "calc(50% - 2px)",
            borderRadius: 999,
            backgroundColor: C.tabActiveBg,
            boxShadow: C.tabActiveShadow,
            zIndex: 0,
          }}
          animate={{ x: effectiveMode === "agent" ? "0%" : "100%" }}
          transition={{ duration: 0.2, ease: COLLAPSE_EASE }}
        />
      )}
      {(["agent", "saas"] as SidebarMode[]).map((mode) => {
        const isActive = effectiveMode === mode;
        const label = mode === "agent" ? "Agent" : "控制台";
        return (
          <motion.button
            layout
            key={mode}
            onClick={() => handleModeChange(mode)}
            style={{
              flex: large ? 1 : undefined,
              height: large ? 30 : 22,
              padding: large ? "0 12px" : "0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: (!large && isActive) ? C.tabActiveBg : "transparent",
              cursor: "pointer",
              borderRadius: 999,
              position: "relative",
              zIndex: 1,
              flexShrink: 0,
              boxShadow: (!large && isActive) ? C.tabActiveShadow : "none",
            }}
          >
            <motion.span
              layout
              style={{
                fontSize: large ? 12 : 11,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "rgba(0,0,0,0.9)" : C.tabInactiveText,
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {label}
            </motion.span>
          </motion.button>
        );
      })}
    </motion.div>
  );

  const layerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: `opacity ${CONTENT_FADE_DURATION}s ease`,
    pointerEvents: "auto",
  };

  return (
    <LayoutGroup id="sidebar-tab">
    <motion.div
      initial={false}
      animate={{ width: currentWidth }}
      transition={{ duration: COLLAPSE_DURATION, ease: COLLAPSE_EASE }}
      style={{
        height: "100vh",
        backgroundColor: C.sidebarBg,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        userSelect: "none",
        flexShrink: 0,
        minWidth: COLLAPSED_WIDTH,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: 84,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        borderRadius: 14,
      }}>
        {/* 展开状态 logo */}
        <div style={{
          ...layerStyle,
          opacity: effectiveCollapsed ? 0 : 1,
          pointerEvents: effectiveCollapsed ? "none" : "auto",
          display: "flex",
          height: 84,
          alignItems: "center",
        }}>
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: 20,
            paddingRight: 20,
            minWidth: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                onClick={() => setTabExpanded((prev) => !prev)}
                title={tabExpanded ? "收起 Tab" : "展开 Tab"}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundImage: "linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)",
                  flexShrink: 0, overflow: "hidden", position: "relative",
                }}>
                  <div style={{ position: "absolute", width: 43.502, height: 37.633, left: -13.57, top: 3.95 }}>
                    <img alt="" src={LOGO_OTTER_URL} style={{ display: "block", width: "101.52%", height: "100.33%", maxWidth: "none", position: "absolute", top: "-0.33%", left: "-1.52%" }} />
                  </div>
                </div>
                <div style={{ width: 80, height: 14, position: "relative", flexShrink: 0 }}>
                  <img alt="weData" src={LOGO_TEXT_URL} style={{ position: "absolute", display: "block", width: "100%", height: "100%", maxWidth: "none" }} />
                </div>
              </div>

              {!tabExpanded && <ModeTab large={false} />}
            </div>
          </div>
        </div>

        {/* 收起状态 logo */}
        <div style={{
          ...layerStyle,
          opacity: effectiveCollapsed ? 1 : 0,
          pointerEvents: effectiveCollapsed ? "auto" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div
            onClick={() => setCollapsed(false)}
            title="展开菜单"
            style={{
              width: 40, height: 40, borderRadius: 8,
              backgroundImage: "linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)",
              flexShrink: 0, overflow: "hidden", position: "relative", cursor: "pointer",
            }}
          >
            <div style={{ position: "absolute", width: 54.378, height: 47.041, left: -16.97, top: 4.94 }}>
              <img alt="" src={LOGO_OTTER_URL} style={{ display: "block", width: "100%", height: "100%", maxWidth: "none", position: "absolute", top: "-0.33%", left: "-1.52%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mode Tab (large，展开后飞到这里) ── */}
      <AnimatePresence>
        {tabExpanded && !effectiveCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ padding: "0 16px 14px", flexShrink: 0, marginTop: -10 }}
          >
            <ModeTab large={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Menu content ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* === Agent 模式展开态 === */}
        <AnimatePresence mode="wait">
          {effectiveMode === "agent" && !effectiveCollapsed && (
            <motion.div
              key="agent-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: CONTENT_FADE_DURATION, ease: COLLAPSE_EASE }}
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
              }}
            >
              <SidebarAgentContent onNewTask={onNewTask} />
            </motion.div>
          )}

          {/* === SaaS 模式展开态 === */}
          {effectiveMode === "saas" && !effectiveCollapsed && (
            <motion.div
              key="saas-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: CONTENT_FADE_DURATION, ease: COLLAPSE_EASE }}
              style={{
                position: "absolute", inset: 0,
                overflowY: "auto", overflowX: "hidden",
                padding: "0 12px",
                scrollbarWidth: "none" as const,
              }}
            >
              {MENU_GROUPS.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <div style={{ padding: "24px 16px 8px", display: "flex", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 400, lineHeight: "20px", color: C.textTertiary, whiteSpace: "nowrap" }}>
                        {group.label}
                      </span>
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onMenuClick?.(item.id)}
                        style={{
                          width: "100%", height: 36,
                          display: "flex", alignItems: "center", gap: 16,
                          padding: "0 16px", borderRadius: 20,
                          border: "none",
                          background: isActive ? C.activeItemBg : "transparent",
                          cursor: "pointer", textAlign: "left",
                          transition: "background 100ms", flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = C.hoverItemBg; }}
                        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{
                          flex: 1, fontSize: 14, fontWeight: isActive ? 600 : 400,
                          lineHeight: "22px", color: C.textPrimary,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === 收起态菜单（SaaS 模式显示图标菜单，Agent 模式不显示） === */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: effectiveCollapsed && effectiveMode === "saas" ? 1 : 0,
          pointerEvents: effectiveCollapsed && effectiveMode === "saas" ? "auto" : "none",
          transition: `opacity ${CONTENT_FADE_DURATION}s ease`,
          overflowY: "auto", overflowX: "hidden",
          padding: "0 12px",
          scrollbarWidth: "none" as const,
        }}>
          {MENU_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div style={{ padding: "12px 0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 24, height: 1, backgroundColor: C.border }} />
                </div>
              )}
              {group.items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onMenuClick?.(item.id)}
                    title={item.label}
                    style={{
                      width: "100%", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      gap: 2, padding: "10px 4px", borderRadius: 24,
                      border: "none",
                      background: isActive ? C.activeItemBg : "transparent",
                      cursor: "pointer", textAlign: "center",
                      transition: "background 100ms", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = C.hoverItemBg; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{
                      fontSize: 10, fontWeight: isActive ? 600 : 400,
                      lineHeight: "16px", color: C.textPrimary,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 44,
                    }}>
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Account ── */}
      <div style={{
        padding: 12, flexShrink: 0,
        borderTop: `1px solid ${C.border}`,
        overflow: "hidden",
        position: "relative",
        minHeight: 72,
      }}>
        {/* 收起态：头像居中 */}
        <div style={{
          ...layerStyle,
          opacity: effectiveCollapsed ? 1 : 0,
          pointerEvents: effectiveCollapsed ? "auto" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "8px 0",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 30,
            backgroundColor: "#FFFFFF", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`, cursor: "pointer",
          }}>
            <IconWorkspace size={16} color={C.textTertiary} />
          </div>
        </div>

        {/* 展开态：头像 + 信息 */}
        <div style={{
          ...layerStyle,
          opacity: effectiveCollapsed ? 0 : 1,
          pointerEvents: effectiveCollapsed ? "none" : "auto",
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 44px 8px 8px", borderRadius: 32, cursor: "pointer",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 30,
            backgroundColor: "#FFFFFF", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.border}`,
          }}>
            <IconWorkspace size={16} color={C.textTertiary} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, lineHeight: "22px", color: C.textPrimary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              测试工作空间
            </div>
            <div style={{
              fontSize: 12, fontWeight: 400, lineHeight: "20px", color: C.textTertiary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              Joseph@tencent.com
            </div>
          </div>
        </div>

        {/* 展开态：收起按钮（底部右侧） */}
        <div style={{
          ...layerStyle,
          opacity: effectiveCollapsed ? 0 : 1,
          pointerEvents: effectiveCollapsed ? "none" : "auto",
        }}>
          <button
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.hoverItemBg; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            onClick={() => setCollapsed(true)}
            title="收起菜单"
          >
            <div style={{ width: 16, height: 16, overflow: "hidden", position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: "12.5%", left: "6.25%", right: "6.25%", bottom: "12.5%" }}>
                <div style={{ position: "absolute", top: "-5.54%", left: "-4.75%", right: "-4.75%", bottom: "-5.54%" }}>
                  <img alt="" src={SIDEBAR_ICON_URL} style={{ display: "block", width: "100%", height: "100%", maxWidth: "none" }} />
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
    </LayoutGroup>
  );
}

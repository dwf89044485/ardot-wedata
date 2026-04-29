"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// ── Design tokens ──────────────────────────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SF = "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  bg: "#F9FAFC",
  borderColor: "#E6E9EF",
  textPrimary: "rgba(0,0,0,0.9)",
  textSecondary: "rgba(0,0,0,0.7)",
  textTertiary: "rgba(0,0,0,0.5)",
  hoverBg: "#ECEEF2",
  badgeBg: "#F64041",
  badgeText: "rgba(255,255,255,0.9)",
  btnGradient: "linear-gradient(180deg, #FAFBFC 0%, #F2F4F7 100%)",
  btnBorderGradient: "linear-gradient(180deg, #E9EBF0 0%, #DCDFE5 100%)",
  btnShadow: "0px 2px 4px -2px rgba(0,0,0,0.12)",
  btnHoverGradient: "linear-gradient(180deg, #F2F4F7 0%, #E9EBF0 100%)",
  btnHoverBorderGradient: "linear-gradient(180deg, #E9EBF0 0%, #DCDFE5 100%)",
} as const;

// ── Animation constants ───────────────────────────────────────
const COLLAPSE_DURATION = 0.22;
const COLLAPSE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const CONTENT_FADE = 0.18;
const COLLAPSED_WIDTH = 68;
const EXPANDED_WIDTH = 320;

// ── Status icon types ──────────────────────────────────────────
type TaskStatus = "loading" | "pending" | "check" | "failed";

// ── Icon components (inline SVG with Figma path data) ──────────

function IconLoading({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <style>{`@keyframes sec-nav-spin { to { transform: rotate(360deg); } }`}</style>
      <g style={{ transformOrigin: "center", animation: "sec-nav-spin 1.2s linear infinite" }}>
        <path d="M8 1.5C4.41038 1.5 1.5 4.41038 1.5 8C1.5 11.5896 4.41038 14.5 8 14.5V12.875C5.30761 12.875 3.125 10.6924 3.125 8C3.125 5.30761 5.30761 3.125 8 3.125C10.6924 3.125 12.875 5.30761 12.875 8H14.5C14.5 4.41038 11.5896 1.5 8 1.5Z" fill="#00B6C3"/>
      </g>
    </svg>
  );
}

function IconPending({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="5" stroke="#FF7800" strokeWidth="1.2" strokeDasharray="3 2.5" fill="none"/>
    </svg>
  );
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M13.3137 4.943L6.24264 12.014L2 7.771L2.943 6.828L6.243 10.128L12.371 4L13.3137 4.943Z" fill="rgba(0,0,0,0.5)"/>
    </svg>
  );
}

function IconFailed({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" stroke="#E34D59" strokeWidth="1.2" fill="none"/>
      <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#E34D59" strokeWidth="1.2"/>
    </svg>
  );
}

function IconAiNewChat({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <g clipPath="url(#clip-ai-new-chat)">
        <path d="M5 7.5H8M8 7.5H11M8 7.5V4.5M8 7.5V10.5M8 1C12.0041 1 15.25 4.01408 15.25 7.73214C15.25 11.4502 12.0041 14.4643 8 14.4643C7.80723 14.4643 7.61621 14.4573 7.42722 14.4436C6.44468 14.3725 5.9534 14.337 5.69885 14.3823C5.60769 14.3985 5.58792 14.403 5.49882 14.4282C5.25 14.4985 4.9782 14.6554 4.4346 14.9692L4.27661 15.0604C4.07539 15.1766 3.97478 15.2347 3.89246 15.2351C3.78021 15.2358 3.67635 15.1758 3.62077 15.0783C3.58001 15.0067 3.58001 14.8906 3.58001 14.6582C3.58001 14.1771 3.58001 13.9366 3.54677 13.7533C3.48736 13.4256 3.45186 13.3321 3.27898 13.0475C3.18227 12.8883 2.92112 12.5936 2.39883 12.0044C1.36886 10.8424 0.75 9.35476 0.75 7.73214C0.75 4.01408 3.99594 1 8 1Z" stroke="rgba(0,0,0,0.7)" strokeWidth="1.33" fill="none"/>
      </g>
      <defs>
        <clipPath id="clip-ai-new-chat">
          <rect width="16" height="16" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

function IconFolder({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.358 2C4.736 2 4.99 1.998 5.239 2.034C5.789 2.114 6.312 2.331 6.757 2.664C6.958 2.814 7.137 2.996 7.404 3.263L7.475 3.332H7.577C7.524 3.334 7.497 3.334 7.577 3.334H11.333C11.942 3.334 12.467 3.332 12.884 3.389C13.321 3.447 13.741 3.58 14.081 3.92C14.42 4.26 14.553 4.679 14.612 5.115C14.668 5.533 14.667 6.057 14.667 6.667V8C14.667 9.238 14.668 10.235 14.563 11.016C14.455 11.816 14.225 12.49 13.69 13.025C13.155 13.56 12.481 13.789 11.681 13.897C10.9 14.002 9.905 14 8.667 14H7.333C6.094 14 5.099 14.002 4.318 13.897C3.518 13.789 2.844 13.56 2.309 13.025C1.774 12.49 1.544 11.816 1.436 11.016C1.331 10.235 1.333 9.238 1.333 8V4.782C1.333 4.428 1.332 4.123 1.352 3.873C1.373 3.616 1.418 3.36 1.541 3.112C1.735 2.721 2.053 2.402 2.445 2.208C2.692 2.086 2.948 2.04 3.206 2.02C3.456 2 3.761 2 4.115 2H4.358ZM2.667 7.334V8C2.667 9.276 2.668 10.167 2.758 10.838C2.846 11.49 3.006 11.835 3.252 12.081C3.498 12.327 3.844 12.488 4.496 12.575C5.167 12.666 6.057 12.667 7.333 12.667H8.667C9.942 12.667 10.832 12.666 11.503 12.575C12.156 12.488 12.501 12.327 12.747 12.081C12.993 11.835 13.153 11.49 13.241 10.838C13.331 10.167 13.333 9.276 13.333 8V7.334H2.667ZM4.115 3.334C3.739 3.334 3.497 3.334 3.312 3.349C3.135 3.363 3.069 3.387 3.037 3.403C2.906 3.468 2.801 3.574 2.736 3.704C2.72 3.736 2.695 3.802 2.681 3.98C2.666 4.164 2.667 4.407 2.667 4.782V6H13.328C13.323 5.707 13.315 5.48 13.29 5.293C13.251 5.004 13.188 4.913 13.137 4.862C13.087 4.812 12.996 4.749 12.708 4.71C12.399 4.669 11.98 4.667 11.333 4.667H7.577C7.497 4.667 7.391 4.669 7.285 4.653C7.064 4.622 6.855 4.535 6.677 4.401C6.592 4.337 6.518 4.262 6.461 4.205C6.167 3.911 6.065 3.811 5.959 3.731C5.691 3.532 5.378 3.402 5.047 3.355C4.916 3.336 4.774 3.334 4.358 3.334H4.115Z" fill="rgba(0,0,0,0.9)"/>
    </svg>
  );
}

function IconChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10.242 4.57L7.033 7.778L3.825 4.57L3 5.395L7.033 9.428L11.067 5.395L10.242 4.57Z" fill="rgba(0,0,0,0.5)"/>
    </svg>
  );
}

function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4.57 10.242L7.778 7.033L4.57 3.825L5.395 3L9.428 7.033L5.395 11.067L4.57 10.242Z" fill="rgba(0,0,0,0.5)"/>
    </svg>
  );
}

function IconSidebarPanel({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-0.335 -1.335 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5.665 0.665002V12.665M2.165 3.665H4.165M2.165 6.665H4.165M4.665 12.665H10.665C12.5506 12.665 13.4934 12.665 14.0792 12.0792C14.665 11.4934 14.665 10.5506 14.665 8.665V4.665C14.665 2.77938 14.665 1.83657 14.0792 1.25079C13.4934 0.665002 12.5506 0.665002 10.665 0.665002H4.665C2.77938 0.665002 1.83657 0.665002 1.25079 1.25079C0.665002 1.83657 0.665002 2.77938 0.665002 4.665V8.665C0.665002 10.5506 0.665002 11.4934 1.25079 12.0792C1.83657 12.665 2.77938 12.665 4.665 12.665Z" stroke="rgba(0,0,0,0.9)" strokeWidth="1.33"/>
    </svg>
  );
}

// ── Status icon renderer ───────────────────────────────────────
function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "loading": return <IconLoading />;
    case "pending": return <IconPending />;
    case "check":   return <IconCheck />;
    case "failed":  return <IconFailed />;
  }
}

// ── Preview data types ───────────────────────────────────────────

/** 产物条目 */
interface ArtifactItem {
  name: string;
  /** 简短标签（如 "指标表"、"T+1 调度已启用"） */
  tag?: string;
}

/** 进度步骤 */
interface ProgressStep {
  label: string;
  state: "done" | "active" | "todo";
}

interface TaskPreviewData {
  status: TaskStatus;
  title: string;
  /** 用户原始提示词 */
  prompt: string;
  /** 相对时间 */
  time: string;
  /** 状态精细化描述（如 "同步中 · 64%"） */
  statusLabel: string;

  // ── 下方信息区（按任务状态/类型，只填需要的字段） ──

  /** 产物列表 — 已完成任务展示 */
  artifacts?: ArtifactItem[];
  /** 结果摘要（一句话结论） */
  resultSummary?: string;
  /** 进度步骤 — 执行中任务展示 */
  steps?: ProgressStep[];
  /** 等待/失败原因 */
  reason?: string;
  /** 对话轮数 + 偏移补充 */
  turnNote?: string;
}

// ── Mock data: 最近任务 ─────────────────────────────────────────
const RECENT_TASKS: TaskPreviewData[] = [
  // ① 数据接入 — 执行中 (同步)
  {
    status: "loading",
    title: "接入业务库【订单表】全量+增量同步",
    prompt: "将业务库 order_db 的订单主表和订单明细表同步到数仓 ODS 层，需要支持增量和全量两种同步模式",
    time: "2小时前",
    statusLabel: "同步中 · 64%",
    steps: [
      { label: "表结构识别", state: "done" },
      { label: "数据质量检测", state: "done" },
      { label: "全量同步：33.5 / 52.3 万行", state: "active" },
      { label: "增量策略配置", state: "todo" },
    ],
  },
  // ② 指标开发 — 等待确认
  {
    status: "pending",
    title: "零售业务_月度库存健康度指标开发",
    prompt: "零售业务月度库存健康度指标开发",
    time: "4小时前",
    statusLabel: "等待确认",
    reason: "检测到两种库存计算口径（加权平均 vs 移动平均），需要确认使用哪种",
  },
  // ③ 临时取数 — 失败
  {
    status: "failed",
    title: "各产品线上季度退款率 TOP10 商户",
    prompt: "统计各产品线上季度的退款率和退款金额 TOP10 商户",
    time: "20分钟前",
    statusLabel: "失败",
    reason: "表 dwd_refund_detail 无访问权限，需要申请 data_finance 库读权限",
  },
  // ④ 临时取数 — 已完成 (3个产物)
  {
    status: "check",
    title: "华东区上月 GMV 统计（含退款扣减）",
    prompt: "拉一下上个月华东区 GMV 数据",
    time: "昨天",
    statusLabel: "已完成",
    artifacts: [
      { name: "east_china_gmv_202403.sql" },
      { name: "gmv_city_breakdown.csv", tag: "明细" },
      { name: "gmv_refund_analysis.xlsx", tag: "退款分析" },
    ],
    resultSummary: "查询结果：31 行 · 5 个字段",
    turnNote: "共 8 轮对话（追加了退款扣减和分城市维度）",
  },
  // ⑤ 指标开发 — 已完成
  {
    status: "check",
    title: "猫眼_客户留存率指标开发",
    prompt: "开发客户留存率指标，需要计算次日、7日、30日三个粒度的留存，口径按自然日去重",
    time: "3天前",
    statusLabel: "已完成",
    artifacts: [
      { name: "ads_user_retention", tag: "指标表" },
    ],
    resultSummary: "次日留存 43.2% · 7日 12.8% · 30日 5.1%",
  },
  // ⑥ 调度编排 — 已完成但最近执行异常
  {
    status: "check",
    title: "用户画像标签 T+1 调度任务",
    prompt: "配置用户画像标签刷新的调度任务，每天凌晨 3 点跑，依赖 DWD 层用户宽表",
    time: "1周前",
    statusLabel: "已完成",
    artifacts: [
      { name: "workflow_user_profile", tag: "3 个节点" },
    ],
    reason: "上次执行失败 · 今天 03:00\n失败节点：dwd_user_wide（上游延迟）",
  },
];

// ── Mock data: 文件空间 ─────────────────────────────────────────
const FOLDER_TASKS_DEV: TaskPreviewData[] = [
  {
    status: "check",
    title: "业务监控看板搭建",
    prompt: "基于用户复购、订单、活跃数据，搭建业务监控看板：包含趋势图、明细表、核心指标卡片",
    time: "2天前",
    statusLabel: "已完成",
    artifacts: [
      { name: "业务监控看板 v1" },
    ],
    resultSummary: "KPI 卡片 ×4 · 趋势折线图 · TOP10 柱状图 · 明细表",
  },
  {
    status: "loading",
    title: "月度 GMV 指标开发（ADS 层）",
    prompt: "开发月度 GMV 指标，按业务线、渠道、地区三个维度交叉，写入 ADS 层",
    time: "1小时前",
    statusLabel: "执行中 · 步骤 3/5",
    steps: [
      { label: "口径确认", state: "done" },
      { label: "维表关联", state: "done" },
      { label: "ADS 层建表与回刷", state: "active" },
      { label: "数据验证", state: "todo" },
      { label: "调度注册", state: "todo" },
    ],
  },
  {
    status: "check",
    title: "猫眼_客户留存率指标血缘分析",
    prompt: "分析猫眼客户留存率指标的血缘关系，梳理上下游依赖链路",
    time: "3天前",
    statusLabel: "已完成",
    artifacts: [
      { name: "血缘链路图", tag: "4 层 · 12 节点" },
    ],
    resultSummary: "发现 2 个风险：dwd_order_detail 存在跨层直接引用",
  },
  {
    status: "check",
    title: "T+1 调度工作流编排",
    prompt: "把现有的 ODS → DWD → ADS 三层数据加工编排成 T+1 自动调度工作流",
    time: "5天前",
    statusLabel: "已完成",
    artifacts: [
      { name: "workflow_daily_etl", tag: "5 个节点" },
    ],
    resultSummary: "上次执行：成功 · 今天 02:00 · 下次：明天 02:00",
  },
];

const FOLDER_TASKS_TEST: TaskPreviewData[] = [
  {
    status: "check",
    title: "接入业务库【用户表】数据源同步",
    prompt: "接入业务库的用户表数据源，自动识别表结构与数据质量，生成标准数仓模型，配置 T+1 同步任务",
    time: "昨天",
    statusLabel: "已完成",
    artifacts: [
      { name: "ods.ods_user_main", tag: "已建表" },
      { name: "sync_user_daily", tag: "T+1 已启用" },
    ],
    resultSummary: "128.7 万行 · 24 个字段",
  },
  {
    status: "loading",
    title: "管理层周报看板",
    prompt: "做一个管理层周报看板，核心是 GMV、DAU、转化率三个指标的周同比趋势",
    time: "40分钟前",
    statusLabel: "执行中 · 步骤 2/4",
    steps: [
      { label: "数据源准备", state: "done" },
      { label: "图表组件生成", state: "active" },
      { label: "布局排版", state: "todo" },
      { label: "交互调优", state: "todo" },
    ],
  },
  {
    status: "check",
    title: "近30天新增用户渠道分布查询",
    prompt: "查一下近 30 天每天新增用户数，按注册渠道分组",
    time: "前天",
    statusLabel: "已完成",
    artifacts: [
      { name: "new_user_by_channel_30d.sql" },
    ],
    resultSummary: "查询结果：120 行 · 4 个字段",
  },
];

// ── Status color map ────────────────────────────────────────────
function statusColor(status: TaskStatus): string {
  switch (status) {
    case "loading": return "#00B6C3";
    case "pending": return "#FF7800";
    case "check":   return "rgba(0,0,0,0.5)";
    case "failed":  return "#E34D59";
  }
}

// ── Quote mark SVGs (from Figma, scaled to 14×14, light gray) ──
function QuoteOpen() {
  return (
    <svg width="14" height="14" viewBox="0 0 8 7" fill="none" style={{ flexShrink: 0, display: "block" }}>
      <path d="M4.02 4.14C4.02 3.26 4.22 2.47 4.62 1.77C5.04 1.05 5.72 0.46 6.66 0L7.29 1.14C6.59 1.48 6.08 1.89 5.76 2.37C5.44 2.83 5.28 3.42 5.28 4.14H6.87V6.99H4.02V4.14ZM0 4.14C0 3.26 0.2 2.47 0.6 1.77C1.02 1.05 1.7 0.46 2.64 0L3.27 1.14C2.57 1.48 2.06 1.89 1.74 2.37C1.42 2.83 1.26 3.42 1.26 4.14H2.85V6.99H0V4.14Z" fill="black" fillOpacity="0.25"/>
    </svg>
  );
}

function QuoteClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 8 7" fill="none" style={{ flexShrink: 0, display: "block" }}>
      <path d="M4.02 5.86C4.72 5.52 5.23 5.12 5.55 4.66C5.87 4.18 6.03 3.58 6.03 2.86H4.44V0.01H7.29V2.86C7.29 3.74 7.08 4.54 6.66 5.26C6.26 5.96 5.59 6.54 4.65 7L4.02 5.86ZM0 5.86C0.7 5.52 1.21 5.12 1.53 4.66C1.85 4.18 2.01 3.58 2.01 2.86H0.42V0.01H3.27V2.86C3.27 3.74 3.06 4.54 2.64 5.26C2.24 5.96 1.57 6.54 0.63 7L0 5.86Z" fill="black" fillOpacity="0.25"/>
    </svg>
  );
}

// ── Task preview tooltip ────────────────────────────────────────
function TaskPreviewTooltip({ data, anchorRect }: {
  data: TaskPreviewData;
  anchorRect: DOMRect;
}) {
  const TOOLTIP_W = 333;
  const GAP = 8;

  const viewW = typeof window !== "undefined" ? window.innerWidth : 1200;
  let left = anchorRect.right + GAP;
  if (left + TOOLTIP_W > viewW - 16) {
    left = anchorRect.left - TOOLTIP_W - GAP;
  }
  const top = Math.max(8, Math.min(anchorRect.top - 8, (typeof window !== "undefined" ? window.innerHeight : 800) - 280));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        position: "fixed",
        left, top,
        width: TOOLTIP_W,
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0px 8px 24px -4px rgba(0,0,0,0.1), 0px 8px 12px -8px rgba(0,0,0,0.05)",
        padding: 16,
        zIndex: 9999,
        pointerEvents: "auto",
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Row 1: Status chip + time — top of card */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "2px 8px 2px 6px",
          borderRadius: 10,
          background: data.status === "loading" ? "rgba(0,182,195,0.08)"
            : data.status === "pending" ? "rgba(255,120,0,0.08)"
            : data.status === "failed" ? "rgba(227,77,89,0.08)"
            : data.statusLabel.includes("⚠") ? "rgba(255,120,0,0.08)"
            : "rgba(0,0,0,0.04)",
        }}>
          <StatusIcon status={data.statusLabel.includes("⚠") ? "pending" : data.status} />
          <span style={{
            fontSize: 12, fontWeight: 500, lineHeight: "18px",
            color: data.status === "loading" ? "#00B6C3"
              : data.status === "pending" ? "#FF7800"
              : data.status === "failed" ? "#E34D59"
              : data.statusLabel.includes("⚠") ? "#D54941"
              : "rgba(0,0,0,0.6)",
          }}>
            {data.statusLabel}
          </span>
        </div>
        <span style={{ fontSize: 12, lineHeight: "18px", color: "rgba(0,0,0,0.4)" }}>
          {data.time}
        </span>
      </div>

      {/* Prompt quote card */}
      <div style={{
        background: "#F2F4F8",
        borderRadius: 8,
        padding: 10,
      }}>
        <div style={{
          display: "flex",
          alignItems: "stretch",
        }}>
          <div style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            paddingRight: 6,
            paddingTop: 0,
          }}>
            <QuoteOpen />
          </div>
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            minWidth: 0,
          }}>
            <div style={{
              fontSize: 14,
              lineHeight: "19.6px",
              fontWeight: 400,
              color: "rgba(0,0,0,0.9)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              width: "100%",
            }}>
              {data.prompt}
            </div>
          </div>
          <div style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            paddingLeft: 6,
            paddingBottom: 0,
          }}>
            <QuoteClose />
          </div>
        </div>
      </div>

      {/* Turn note — directly below quote card */}
      {data.turnNote && (
        <div style={{
          fontSize: 12, lineHeight: "16px", color: "rgba(0,0,0,0.35)",
          marginTop: -8,
          paddingLeft: 2,
        }}>
          {data.turnNote}
        </div>
      )}

      {/* Dashed divider */}
      {(data.artifacts || data.steps || data.reason || data.resultSummary) && (
        <div style={{ alignSelf: "stretch", height: 0, borderTop: "1px dashed #E0E3E9" }} />
      )}

      {/* Detail section: artifacts / steps / reason / result */}
      {(data.artifacts || data.steps || data.reason || data.resultSummary) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Progress steps — for loading tasks */}
          {data.steps && data.steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {data.steps.map((step, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "3px 0",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: 3, flexShrink: 0,
                    background: step.state === "done" ? "#00B6C3"
                      : step.state === "active" ? "#00B6C3"
                      : "#D9DCE1",
                    boxShadow: step.state === "active" ? "0 0 0 3px rgba(0,182,195,0.2)" : "none",
                  }} />
                  <span style={{
                    fontSize: 13, lineHeight: "18px",
                    color: step.state === "done" ? "rgba(0,0,0,0.4)"
                      : step.state === "active" ? "rgba(0,0,0,0.9)"
                      : "rgba(0,0,0,0.3)",
                    fontWeight: step.state === "active" ? 500 : 400,
                    textDecoration: step.state === "done" ? "line-through" : "none",
                  }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Artifacts — for completed tasks only */}
          {data.status !== "failed" && data.artifacts && data.artifacts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 500, lineHeight: "16px",
                color: "rgba(0,0,0,0.45)",
              }}>
                产物
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {data.artifacts.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 8px",
                  background: "rgba(0,0,0,0.03)",
                  borderRadius: 6,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M3.5 1.75C2.5335 1.75 1.75 2.5335 1.75 3.5V10.5C1.75 11.4665 2.5335 12.25 3.5 12.25H10.5C11.4665 12.25 12.25 11.4665 12.25 10.5V5.25C12.25 4.2835 11.4665 3.5 10.5 3.5H7.875L6.5625 1.75H3.5Z" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none"/>
                  </svg>
                  <span style={{
                    fontSize: 13, lineHeight: "18px", color: "rgba(0,0,0,0.7)",
                    fontFamily: "'SF Mono', 'Menlo', monospace",
                    flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {a.name}
                  </span>
                  {a.tag && (
                    <span style={{
                      fontSize: 11, lineHeight: "16px", color: "rgba(0,0,0,0.45)",
                      padding: "1px 6px",
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: 4,
                      flexShrink: 0, whiteSpace: "nowrap",
                    }}>
                      {a.tag}
                    </span>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}

          {/* Result summary */}
          {data.resultSummary && (
            <div style={{
              fontSize: 13, lineHeight: "18px", color: "rgba(0,0,0,0.55)",
              paddingLeft: 2,
            }}>
              {data.resultSummary}
            </div>
          )}

          {/* Reason — for pending/failed/warning tasks */}
          {data.reason && !data.steps && (
            <div style={{
              fontSize: 13, lineHeight: "20px",
              color: data.status === "failed" ? "#E34D59" : "rgba(0,0,0,0.7)",
              padding: "6px 10px",
              background: data.status === "failed" ? "rgba(227,77,89,0.06)" : "rgba(255,120,0,0.06)",
              borderRadius: 6,
              borderLeft: "none",
              whiteSpace: "pre-line",
            }}>
              {data.reason}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ label, withTopBorder = false }: { label: string; withTopBorder?: boolean }) {
  return (
    <div style={{
      padding: "24px 12px 8px",
      width: "100%",
      borderTop: withTopBorder ? `1px solid ${C.borderColor}` : "none",
    }}>
      <span style={{
        fontFamily: FONT, fontSize: 12, fontWeight: 600,
        lineHeight: "20px", color: C.textSecondary,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Task item ──────────────────────────────────────────────────
function TaskItem({ status, title, indented, preview }: {
  status: TaskStatus;
  title: string;
  indented?: boolean;
  preview?: TaskPreviewData;
}) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipHoveredRef = useRef(false);

  const showPreview = useCallback(() => {
    if (itemRef.current && preview) {
      setAnchorRect(itemRef.current.getBoundingClientRect());
      setShowTooltip(true);
    }
  }, [preview]);

  const hidePreview = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (!tooltipHoveredRef.current) {
        setShowTooltip(false);
      }
    }, 100);
  }, []);

  const handleItemEnter = useCallback(() => {
    setHovered(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(showPreview, 300);
  }, [showPreview]);

  const handleItemLeave = useCallback(() => {
    setHovered(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    hidePreview();
  }, [hidePreview]);

  const handleTooltipEnter = useCallback(() => {
    tooltipHoveredRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    tooltipHoveredRef.current = false;
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={itemRef}
        onMouseEnter={handleItemEnter}
        onMouseLeave={handleItemLeave}
        style={{
          height: 34, display: "flex", alignItems: "center",
          paddingLeft: 12, paddingRight: 12,
          borderRadius: 20, cursor: "pointer",
          backgroundColor: hovered ? C.hoverBg : "transparent",
          transition: "background 100ms", width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 0 0", minWidth: 0 }}>
          <StatusIcon status={status} />
          <span style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 400,
            lineHeight: "22px", color: C.textPrimary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: "1 0 0", minWidth: 0,
          }}>
            {title}
          </span>
        </div>
      </div>
      {showTooltip && anchorRect && preview && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <div onMouseEnter={handleTooltipEnter} onMouseLeave={handleTooltipLeave}>
            <TaskPreviewTooltip data={preview} anchorRect={anchorRect} />
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ── More link ──────────────────────────────────────────────────
function MoreLink({ count }: { count: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 34, display: "flex", alignItems: "center",
        paddingLeft: 12, paddingRight: 12, borderRadius: 20,
        cursor: "pointer", backgroundColor: hovered ? C.hoverBg : "transparent",
        transition: "background 100ms", width: "100%",
      }}
    >
      <span style={{
        fontFamily: FONT, fontSize: 14, fontWeight: 400,
        lineHeight: "20px", color: C.textTertiary,
      }}>
        显示更多({count})
      </span>
    </div>
  );
}

// ── Folder item ────────────────────────────────────────────────
function FolderItem({ name, expanded, onToggle, children }: {
  name: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 34, display: "flex", alignItems: "center",
          paddingLeft: 12, paddingRight: 12, borderRadius: 20,
          cursor: "pointer", backgroundColor: hovered ? C.hoverBg : "transparent",
          transition: "background 100ms", width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 0 0", minWidth: 0 }}>
          <IconFolder />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              fontFamily: FONT, fontSize: 14, fontWeight: 400,
              lineHeight: "22px", color: C.textPrimary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {name}
            </span>
            {expanded ? <IconChevronDown /> : <IconChevronRight />}
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 0 12px" }}>
          {children}
        </div>
      )}
    </>
  );
}

// ── Icon button for collapsed toolbar ──────────────────────────
function ToolbarButton({ onClick, title, children }: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        width: 40, height: 40, borderRadius: 20,
        border: "none", background: hovered ? C.hoverBg : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, transition: "background 100ms", flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────
interface SecondaryNavProps {
  onToggle?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNewTask?: () => void;
  collapseWhen?: boolean;
}

export default function SecondaryNav({ onToggle, onCollapsedChange, onNewTask, collapseWhen }: SecondaryNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [folder1Open, setFolder1Open] = useState(true);
  const [folder2Open, setFolder2Open] = useState(true);
  const [newTaskHovered, setNewTaskHovered] = useState(false);

  useEffect(() => {
    if (collapseWhen && !collapsed) {
      setCollapsed(true);
      onCollapsedChange?.(true);
    }
  }, [collapseWhen, collapsed, onCollapsedChange]);

  const contentFade: React.CSSProperties = {
    transition: `opacity ${CONTENT_FADE}s ease`,
    pointerEvents: "auto",
  };
  const navWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const navWidthPx = `${navWidth}px`;

  return (
    <motion.div
      initial={false}
      animate={{ width: navWidthPx, minWidth: navWidthPx, maxWidth: navWidthPx, flexBasis: navWidthPx }}
      transition={{ duration: COLLAPSE_DURATION, ease: COLLAPSE_EASE }}
      style={{
        height: "100vh",
        backgroundColor: C.bg,
        borderRight: collapsed ? "none" : `1px solid ${C.borderColor}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        flexGrow: 0,
        width: navWidthPx,
        minWidth: navWidthPx,
        maxWidth: navWidthPx,
        flexBasis: navWidthPx,
        boxSizing: "border-box",
        fontFamily: FONT,
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── 标题栏 (84px) ── */}
      <div style={{
        height: 84, flexShrink: 0,
        display: "flex", alignItems: "center",
        overflow: "hidden", position: "relative",
      }}>
        {/* 展开态标题栏 */}
        <div style={{
          ...contentFade,
          position: "absolute", inset: 0,
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? "none" : "auto",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 16px",
        }}>
          <div style={{
            height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px" }}>
              <span style={{
                fontFamily: FONT_SF, fontSize: 18, fontWeight: 600,
                lineHeight: "26px", color: C.textPrimary, whiteSpace: "nowrap",
              }}>
                DataBuddy
              </span>
            </div>
            <ToolbarButton onClick={() => { setCollapsed(true); onCollapsedChange?.(true); }} title="收起面板">
              <IconSidebarPanel />
            </ToolbarButton>
          </div>
        </div>

        {/* 收起态工具栏：仅展开 */}
        <div style={{
          ...contentFade,
          position: "absolute", inset: 0,
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? "auto" : "none",
          display: "flex", alignItems: "center", justifyContent: "flex-start",
          padding: "0 0 0 24px",
        }}>
          <ToolbarButton onClick={() => { setCollapsed(false); onCollapsedChange?.(false); }} title="展开面板">
            <IconSidebarPanel />
          </ToolbarButton>
        </div>
      </div>

      {/* ── 新建任务按钮（展开态） ── */}
      <div style={{
        ...contentFade,
        opacity: collapsed ? 0 : 1,
        pointerEvents: collapsed ? "none" : "auto",
        padding: collapsed ? "0" : "0 12px 8px", flexShrink: 0,
        height: collapsed ? 0 : "auto",
        overflow: "hidden",
      }}>
        <button
          onClick={onNewTask}
          onMouseEnter={() => setNewTaskHovered(true)}
          onMouseLeave={() => setNewTaskHovered(false)}
          style={{
            width: "100%", height: 44, borderRadius: 100,
            border: "1px solid transparent",
            background: `${newTaskHovered ? C.btnHoverGradient : C.btnGradient} padding-box, ${newTaskHovered ? C.btnHoverBorderGradient : C.btnBorderGradient} border-box`,
            boxShadow: C.btnShadow, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, cursor: "pointer",
            padding: "8px 20px", outline: "none",
            transition: "background 100ms",
          }}
        >
          <IconAiNewChat />
          <span style={{
            fontFamily: FONT, fontSize: 14, fontWeight: 500,
            lineHeight: "22px", color: C.textPrimary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            新建任务
          </span>
        </button>
      </div>

      {/* ── 可滚动列表区（展开态） ── */}
      <div style={{
        ...contentFade,
        flex: 1,
        opacity: collapsed ? 0 : 1,
        pointerEvents: collapsed ? "none" : "auto",
        overflowY: "auto", overflowX: "hidden",
        padding: collapsed ? "0" : "0 12px", scrollbarWidth: "none",
      }}>
        <div style={{ paddingBottom: 24 }}>
          <SectionHeader label="最近任务" />
          {RECENT_TASKS.map((t, i) => (
            <TaskItem key={i} status={t.status} title={t.title} preview={t} />
          ))}
          <MoreLink count={10} />
        </div>

        <SectionHeader label="文件空间" withTopBorder />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FolderItem name="junyangliu_dev" expanded={folder1Open} onToggle={() => setFolder1Open(v => !v)}>
            {FOLDER_TASKS_DEV.map((t, i) => (
              <TaskItem key={i} indented status={t.status} title={t.title} preview={t} />
            ))}
          </FolderItem>

          <FolderItem name="junyangliu_test" expanded={folder2Open} onToggle={() => setFolder2Open(v => !v)}>
            {FOLDER_TASKS_TEST.map((t, i) => (
              <TaskItem key={i} indented status={t.status} title={t.title} preview={t} />
            ))}
          </FolderItem>

          <FolderItem name="junyangliu001" expanded={false} onToggle={() => {}} />
          <FolderItem name="junyangliu002" expanded={false} onToggle={() => {}} />
          <FolderItem name="junyangliu003" expanded={false} onToggle={() => {}} />
        </div>
      </div>
    </motion.div>
  );
}

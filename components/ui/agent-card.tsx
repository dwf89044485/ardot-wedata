"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MotionTargetOverlay from "@/components/ui/motion-target-overlay";
import {
  IconCatalog,
  IconWorkflow,
  IconSQL,
  IconOps,
  IconMLExp,
} from "@/components/ui/wedata-icons";

// ── Design tokens ───────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const DUR = { micro: 0.1, normal: 0.2, macro: 0.35 } as const;

const T = {
  primary: "rgba(0,0,0,0.9)",
  secondary: "rgba(0,0,0,0.7)",
  tertiary: "rgba(0,0,0,0.5)",
  disabled: "rgba(0,0,0,0.3)",
  solid: "#000000",
  blue: "#2873FF",
} as const;

const FONT =
  "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_EN =
  "var(--font-pixelify-sans), 'Pixelify Sans', 'PingFang SC', sans-serif";

// ── Motion schema types ──────────────────────────────────────────
export type { MotionParamDef, MotionStateDef, MotionTargetDef } from "@/components/ui/motion-panel";
import type { MotionParamDef, MotionTargetDef } from "@/components/ui/motion-panel";

// ── Types ───────────────────────────────────────────────────────
interface SkillTag {
  label: string;
  icon: React.ReactNode;
}

interface StatItem {
  value: string;
  label: string;
}

// ── 卡片间动效配置（Hover 推开/浮起/投影 + 动画时长） ──
export interface FanCardsConfig {
  // ── 扇形布局 ──
  overlapX: number;           // 卡片重叠（负数=重叠，正数=间距）
  rotateOuter: number;        // 外侧卡旋转角度
  outerCardOffset: number;    // 外侧卡下沉量
  // ── Hover 悬浮 ──
  dist1X: number;            // 近邻推开
  dist2X: number;            // 次邻推开
  hoverHeight: number;       // 悬浮高度 0~1
  scaleFactor: number;       // 放大系数（1 + h * scaleFactor）
  // ── Hover 投影（相对静态投影的增量） ──
  shadowBlurRange: number;   // 投影模糊增量
  shadowYRange: number;     // 投影Y偏移增量
  shadowAlphaRange: number;   // 投影透明度增量
  // ── 静态投影（Rest） ──
  restShadowY: number;       // 静态投影Y
  restShadowBlur: number;    // 静态投影模糊
  restShadowAlpha: number;   // 静态投影透明度
  // ── 动画 ──
  fanTransitionDuration: number;   // 推开动画时长（秒）
  hoverTransitionDuration: number; // 浮起动画时长（秒）
}

// ── 卡片内动效配置（信息区毛玻璃 + 覆盖动画） ──
export interface CardInnerConfig {
  infoFromOpacity: number;    // 渐变起始透明度（顶）
  infoToOpacity: number;      // 渐变结束透明度（底）
  infoBlur: number;           // 高斯模糊 px
  infoSaturate: number;       // 饱和度百分比
  infoCoverDuration: number;  // 覆盖速度（秒）
}

export const DEFAULT_FAN_CONFIG: FanCardsConfig = {
  // 扇形布局
  overlapX: -18,
  rotateOuter: 8,
  outerCardOffset: 22,
  // Hover 悬浮
  dist1X: 12,
  dist2X: 6,
  hoverHeight: 0.35,
  scaleFactor: 0.5,
  // Hover 投影
  shadowBlurRange: 58,
  shadowYRange: 68,
  shadowAlphaRange: 0.24,
  // 静态投影
  restShadowY: 3,
  restShadowBlur: 8,
  restShadowAlpha: 0.03,
  // 动画
  fanTransitionDuration: 0.60,
  hoverTransitionDuration: 0.60,
};

export const DEFAULT_CARD_INNER_CONFIG: CardInnerConfig = {
  infoFromOpacity: 0.90,
  infoToOpacity: 0.80,
  infoBlur: 16,
  infoSaturate: 90,
  infoCoverDuration: 0.35,
};

// ── 卡片间动效 Motion Schema（外层选区） ────────────────────────
export const AGENT_FAN_MOTION: MotionTargetDef = {
  id: "agent-fan",
  label: "卡片间动效",
  schema: [
    { key: "hoverHeight", label: "悬浮高度", min: 0, max: 1.4, step: 0.05 },
    { key: "dist1X", label: "推开距离", min: 0, max: 60, step: 1 },
    { key: "fanTransitionDuration", label: "推开时长", min: 0.1, max: 1.0, step: 0.05 },
    { key: "hoverTransitionDuration", label: "浮起时长", min: 0.1, max: 1.0, step: 0.05 },
  ],
  states: [
    { value: "hover", label: "Hover" },
    { value: "default", label: "默认" },
  ],
  defaultState: "hover",
  defaultConfig: DEFAULT_FAN_CONFIG as unknown as Record<string, number>,
};

// ── 卡片内动效 Motion Schema（内层选区） ────────────────────────
export const AGENT_CARD_INNER_MOTION: MotionTargetDef = {
  id: "agent-card",
  label: "卡片内动效",
  schema: [
    { key: "infoCoverDuration", label: "覆盖速度", min: 0.1, max: 1.0, step: 0.05 },
    { key: "infoBlur", label: "高斯模糊", min: 0, max: 60, step: 1 },
    { key: "infoSaturate", label: "饱和度", min: 0, max: 300, step: 5 },
  ],
  states: [
    { value: "hover", label: "Hover" },
    { value: "default", label: "默认" },
  ],
  defaultState: "hover",
  defaultConfig: DEFAULT_CARD_INNER_CONFIG as unknown as Record<string, number>,
};

// ── 向后兼容：保留旧名以防其他地方引用 ──
export const AGENT_CARD_MOTION = AGENT_FAN_MOTION;

/**
 * 从归一化 hoverHeight (0~1) 派生物理属性：
 * h=0 时与非 hover 状态完全一致（y=0, scale=1, 默认阴影）
 * h=1 时最大悬浮效果
 */
function restShadow(config: FanCardsConfig) {
  return `0 ${config.restShadowY}px ${config.restShadowBlur}px rgba(0,0,0,${config.restShadowAlpha.toFixed(2)})`;
}

function deriveHoverPhysics(h: number, config: FanCardsConfig) {
  const rest = restShadow(config);
  if (h === 0) return { y: 0, scale: 1, shadow: rest };
  const y = 0;
  const scale = 1 + h * config.scaleFactor;
  // 阴影从 rest 状态线性过渡到最大悬浮状态
  const shadowBlur = config.restShadowBlur + h * config.shadowBlurRange;
  const shadowY = config.restShadowY + h * config.shadowYRange;
  const shadowAlpha = config.restShadowAlpha + h * config.shadowAlphaRange;
  const shadow = `0 ${shadowY.toFixed(0)}px ${shadowBlur.toFixed(0)}px rgba(0,0,0,${shadowAlpha.toFixed(2)})`;
  return { y, scale, shadow };
}

interface AgentCardProps {
  /** 英文名 */
  name: string;
  /** 英文名颜色（默认蓝色） */
  nameColor?: string;
  /** 中文头衔 */
  title: string;
  /** 头像图片 URL */
  avatar: string;
  /** 背景图层 URL（在 avatar 下层） */
  avatarBg?: string;
  /** 简介描述（hover 展开时替换标签区） */
  description?: string;
  /** 数据指标（hover 展开时显示） */
  stats?: StatItem[];
  /** 默认状态显示的技能标签（带图标） */
  skills: SkillTag[];
  /** hover 展开后显示的全部技能标签（纯文字） */
  expandedSkills?: string[];
  /** 召唤时的引导文案（"告诉我……" 部分） */
  summonText?: string;
  /** CTA 按钮文字 */
  ctaLabel?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 展开技能标签点击回调 */
  onSkillClick?: (label: string) => void;
  /** CTA「立即召唤」按钮点击回调 */
  onSummon?: () => void;
  /** 受控 hover 状态：外部控制时优先使用 */
  isHovered?: boolean;
  /** 卡片内动效配置（信息区毛玻璃参数） */
  cardInnerConfig?: CardInnerConfig;
}

// ── 尺寸常量 ────────────────────────────────────────────────────
const CARD_HEIGHT = 438;

// ── Component ───────────────────────────────────────────────────
export default function AgentCard({
  name,
  nameColor,
  title,
  avatar,
  avatarBg,
  description,
  stats,
  skills,
  expandedSkills,
  summonText,
  ctaLabel = "立即召唤",
  onClick,
  onSkillClick,
  onSummon,
  isHovered: controlledHover,
  cardInnerConfig,
}: AgentCardProps) {
  const [internalHover, setInternalHover] = useState(false);

  // 受控模式：外部传 isHovered 时使用外部值，否则用内部状态
  const hovered = controlledHover !== undefined ? controlledHover : internalHover;

  // 浏览器切 tab 时可能不触发 mouseleave，hovered 卡在 true
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden) setInternalHover(false);
    };
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, []);

  const transition = { duration: DUR.macro, ease: EASE };

  return (
    <div
      onMouseEnter={() => controlledHover === undefined && setInternalHover(true)}
      onMouseLeave={() => controlledHover === undefined && setInternalHover(false)}
      onClick={onClick}
      style={{
        width: 310,
        height: CARD_HEIGHT,
        borderRadius: 24,
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow: "0px 4px 16px -2px rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        fontFamily: FONT,
        position: "relative",
        isolation: "isolate",
        clipPath: `inset(0 round 24px)`,
      }}
    >
      {/* ── 渐变边框层（180deg: rgba(0,0,0,0.10) → rgba(0,0,0,0.04)，1px inside） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 24,
          padding: 1,
          background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* ── 背景图层（bg 在下） ─────────────────────────────── */}
      {avatarBg && (
        <img
          src={avatarBg}
          alt=""
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      )}
      {/* ── 人物图层（在上） ─────────────────────────────── */}
      <img
        src={avatar}
        alt={name}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* ── 唯一信息区 — 从底部向上覆盖 ─────────────────── */}
      <motion.div
        initial={false}
        animate={{
          y: hovered ? 0 : CARD_HEIGHT - 158,
          paddingTop: hovered ? 24 : 16,
        }}
        transition={{ duration: cardInnerConfig?.infoCoverDuration ?? DEFAULT_CARD_INNER_CONFIG.infoCoverDuration, ease: EASE }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: 24,
          background: `linear-gradient(to bottom, rgba(255,255,255,${cardInnerConfig?.infoFromOpacity ?? DEFAULT_CARD_INNER_CONFIG.infoFromOpacity}), rgba(255,255,255,${cardInnerConfig?.infoToOpacity ?? DEFAULT_CARD_INNER_CONFIG.infoToOpacity}))`,
          backdropFilter: `blur(${cardInnerConfig?.infoBlur ?? DEFAULT_CARD_INNER_CONFIG.infoBlur}px) saturate(${cardInnerConfig?.infoSaturate ?? DEFAULT_CARD_INNER_CONFIG.infoSaturate}%)`,
          WebkitBackdropFilter: `blur(${cardInnerConfig?.infoBlur ?? DEFAULT_CARD_INNER_CONFIG.infoBlur}px) saturate(${cardInnerConfig?.infoSaturate ?? DEFAULT_CARD_INNER_CONFIG.infoSaturate}%)`,
          display: "flex",
          flexDirection: "column",
          gap: hovered ? 24 : 0,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* ── 上半区：基本信息 + Stats ──────────────────── */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 基本信息：名字 + 描述/标签 */}
          <div style={{ display: "flex", flexDirection: "column", gap: hovered ? 4 : 8 }}>
            {/* 名字 */}
            <div>
              {/* 英文名 — hover 时字号变大 */}
              <motion.p
                initial={{ fontSize: 16, lineHeight: "24px" }}
                animate={{
                  fontSize: hovered ? 20 : 16,
                  lineHeight: "24px",
                }}
                transition={transition}
                style={{
                  fontFamily: FONT_EN,
                  fontWeight: 500,
                  color: nameColor ?? T.blue,
                  margin: 0,
                }}
              >
                {name}
              </motion.p>
              {/* 中文头衔 — hover 时字号变大 */}
              <motion.p
                initial={{ fontSize: 18, lineHeight: "26px" }}
                animate={{
                  fontSize: hovered ? 20 : 18,
                  lineHeight: hovered ? "28px" : "26px",
                }}
                transition={transition}
                style={{
                  fontFamily: FONT,
                  fontWeight: 600,
                  color: T.solid,
                  margin: 0,
                }}
              >
                {title}
              </motion.p>
            </div>

            {/* ── 标签/描述 切换区 — 同一位置，交叉淡入 ── */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {/* 默认：4 个技能标签 */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: hovered ? 0 : 1 }}
                transition={transition}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto",
                  justifyContent: "start",
                  gap: 4,
                  ...(hovered
                    ? { position: "absolute", top: 0, left: 0, pointerEvents: "none" as const }
                    : {}),
                }}
              >
                {skills.map((skill, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      height: 28,
                      paddingLeft: 10,
                      paddingRight: 12,
                      borderRadius: 100,
                      background: "rgba(230,233,240,0.6)",
                    }}
                  >
                    <span style={{ flexShrink: 0, display: "flex", width: 14, height: 14 }}>
                      {skill.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: "20px",
                        color: T.secondary,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {skill.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* hover：描述文字 */}
              {description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hovered ? 1 : 0 }}
                  transition={transition}
                  style={{
                    fontSize: 12,
                    lineHeight: "20px",
                    color: T.secondary,
                    margin: 0,
                    textAlign: "justify",
                    height: 80,
                    overflow: "hidden",
                    ...(!hovered
                      ? { position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "none" as const }
                      : {}),
                  }}
                >
                  {description}
                </motion.p>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={transition}
              style={{ display: "flex", gap: 12, flexShrink: 0 }}
            >
              {stats.map((stat, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: FONT_EN,
                      fontSize: 20,
                      lineHeight: "24px",
                      fontWeight: 400,
                      color: T.primary,
                      margin: 0,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: "20px",
                      color: T.secondary,
                      margin: 0,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ④ 分割线 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={transition}
          style={{
            width: "100%",
            height: 1,
            background: "rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        />

        {/* ⑤ "我可以帮你" + 展开标签 — 流式布局 */}
        {expandedSkills && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={transition}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p
              style={{
                fontSize: 12,
                lineHeight: "20px",
                color: T.secondary,
                margin: 0,
                textAlign: "justify",
              }}
            >
              我可以帮你
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {expandedSkills.map((label, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    paddingLeft: 16,
                    paddingRight: 16,
                    borderRadius: 100,
                    background: "rgba(0,0,0,0.04)",
                    cursor: "default",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      lineHeight: "20px",
                      color: T.primary,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ── 图标颜色 ────────────────────────────────────────────────────
const ic = "rgba(0,0,0,0.45)";

// ── 预设数据：Rigel 名片 ────────────────────────────────────────
export const RIGEL_DATA: AgentCardProps = {
  name: "Rigel",
  title: "数据工程专家",
  avatar: "/agents/1-char.png",
  avatarBg: "/agents/1-bg.png",
  summonText: "今天想开发什么数仓？",
  description:
    "擅长数仓建模与全链路工程开发，能精准把业务需求转化为可落地的数据架构方案，从任务调度、日常运维到异常诊断与修复，数据工程的全流程一手包办。",
  stats: [
    { value: "40+", label: "支持建模模式" },
    { value: "80%", label: "减少重复开发" },
    { value: "99.2%", label: "调度成功率" },
  ],
  skills: [
    { label: "需求转数据模型", icon: <IconCatalog size={14} color={ic} /> },
    { label: "生成调度方案", icon: <IconWorkflow size={14} color={ic} /> },
    { label: "自动数仓开发", icon: <IconSQL size={14} color={ic} /> },
    { label: "检测管道异常", icon: <IconOps size={14} color={ic} /> },
  ],
  expandedSkills: [
    "需求一键转模型",
    "自动生成调度方案",
    "自动开发数仓",
    "检测管道异常",
    "接入各类数据源",
    "优化任务性能",
  ],
};

// ── 快捷用法 ────────────────────────────────────────────────────
export function RigelCard({ onClick }: { onClick?: () => void }) {
  return <AgentCard {...RIGEL_DATA} onClick={onClick} />;
}

// ── 预设数据：其他 Agent ────────────────────────────────────────
export const VEGA_DATA: AgentCardProps = {
  name: "Vega",
  nameColor: "#00BBA2",
  title: "数据分析专家",
  avatar: "/agents/2-char.png",
  avatarBg: "/agents/2-bg.png",
  summonText: "今天想分析什么数据？",
  description:
    "擅长多维取数与智能趋势分析，把散乱的数据变成看得懂的洞察结论，自然语言提问、多维穿透、报告生成，样样精通",
  stats: [
    { value: "40+", label: "图表组件类型" },
    { value: "6min", label: "平均出图时长" },
    { value: "3000+", label: "累计搭建看板" },
  ],
  skills: [
    { label: "自然语言取数", icon: <IconCatalog size={14} color={ic} /> },
    { label: "智能趋势分析", icon: <IconWorkflow size={14} color={ic} /> },
    { label: "多维数据洞察", icon: <IconSQL size={14} color={ic} /> },
    { label: "生成数据报告", icon: <IconOps size={14} color={ic} /> },
  ],
  expandedSkills: [
    "异常归因",
    "自然语言取数",
    "指标拆解",
    "智能趋势分析",
    "生成数据报告",
    "多维数据洞察",
  ],
};

export const ORION_DATA: AgentCardProps = {
  name: "Orion",
  nameColor: "#CC6B3A",
  title: "数据治理专家",
  avatar: "/agents/3-char.png",
  avatarBg: "/agents/3-bg.png",
  summonText: "今天想治理哪些数据？",
  description:
    "擅长数据质量监控与元数据管理，把混乱的数据资产梳理成有序可信的治理体系，血缘维护、口径统一、规则执行，一套不落",
  stats: [
    { value: "100+", label: "指标模型" },
    { value: "全行业", label: "场景覆盖" },
    { value: "98.9%", label: "口径一致率" },
  ],
  skills: [
    { label: "监测数据质量", icon: <IconCatalog size={14} color={ic} /> },
    { label: "智能血缘维护", icon: <IconWorkflow size={14} color={ic} /> },
    { label: "自动管理元数据", icon: <IconSQL size={14} color={ic} /> },
    { label: "识别口径冲突", icon: <IconOps size={14} color={ic} /> },
  ],
  expandedSkills: [
    "安全脱敏",
    "自动管理元数据",
    "标签治理",
    "监测数据质量",
    "智能血缘维护",
    "识别口径冲突",
  ],
};

export const NOVA_DATA: AgentCardProps = {
  name: "Nova",
  nameColor: "#934BFF",
  title: "业务运营专家",
  avatar: "/agents/4a.png",
  summonText: "今天想运营什么业务？",
  description:
    "专注业务指标监控与运营看板搭建，智能预警异常波动，帮助业务团队快速自助取数、驱动决策",
  stats: [
    { value: "100+", label: "运营模板" },
    { value: "5min", label: "看板搭建" },
    { value: "99%", label: "预警准确率" },
  ],
  skills: [
    { label: "业务指标监控", icon: <IconWorkflow size={14} color={ic} /> },
    { label: "智能异常预警", icon: <IconOps size={14} color={ic} /> },
    { label: "自助取数", icon: <IconCatalog size={14} color={ic} /> },
    { label: "生成运营看板", icon: <IconSQL size={14} color={ic} /> },
  ],
  expandedSkills: [
    "自助取数",
    "业务指标监控",
    "生成运营看板",
    "智能异常预警",
    "目标达成追踪",
    "用户行为分析",
  ],
};

// ── 三卡扇形排列组件 ───────────────────────────────────────────
const FAN_CARD_DATA = [ORION_DATA, RIGEL_DATA, VEGA_DATA];

export type AgentCardPreviewState = "free" | "default" | "hover";

export function AgentFanCards({
  onSkillClick,
  onSummon,
  config = DEFAULT_FAN_CONFIG,
  cardInnerConfig = DEFAULT_CARD_INNER_CONFIG,
  previewState,
  isSelecting = false,
  onSelect,
  hideCardInnerOverlay = false,
}: {
  onSkillClick?: (label: string, agent: { name: string; title: string; avatar: string; summonText?: string }) => void;
  onSummon?: (agent: { name: string; title: string; avatar: string; summonText?: string }) => void;
  config?: FanCardsConfig;
  cardInnerConfig?: CardInnerConfig;
  previewState?: AgentCardPreviewState;
  /** 是否处于动效选择模式（传给内层 Overlay） */
  isSelecting?: boolean;
  /** 内层选区点击回调 */
  onSelect?: (targetId: string) => void;
  /** 隐藏卡片内动效选框（但保留 isSelecting 的 hover 禁用行为） */
  hideCardInnerOverlay?: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeHoveredIdx =
    previewState === "hover" ? 1 : previewState === "default" ? null : hoveredIdx;

  const getOffset = (i: number) => {
    if (activeHoveredIdx === null) return { x: 0 };
    if (i === activeHoveredIdx) return { x: 0 };
    const dist = Math.abs(i - activeHoveredIdx);
    const dir = i < activeHoveredIdx ? -1 : 1;
    if (dist === 1) return { x: dir * config.dist1X };
    return { x: dir * config.dist2X };
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 480,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 0,
        position: "relative",
      }}>
        {FAN_CARD_DATA.map((data, i) => {
          // 三卡：左倾 / 立正 / 右倾
          const rotates = [-config.rotateOuter, 0, config.rotateOuter];
          const rotate = rotates[i] ?? 0;
          const isHovered = activeHoveredIdx === i;
          const { x } = getOffset(i);
          const hover = deriveHoverPhysics(config.hoverHeight, config);
          const rest = restShadow(config);

          const card = (
            <AgentCard {...data} isHovered={isHovered} cardInnerConfig={cardInnerConfig} onSkillClick={(label) => onSkillClick?.(label, { name: data.name, title: data.title, avatar: data.avatar, summonText: data.summonText })} onSummon={() => onSummon?.({ name: data.name, title: data.title, avatar: data.avatar, summonText: data.summonText })} />
          );

          return (
            <motion.div
              key={data.name}
              animate={{
                x,
                y: isHovered ? hover.y : 0,
                rotate,
                scale: isHovered ? hover.scale : 1,
              }}
              transition={{
                x: { duration: config.fanTransitionDuration, ease: EASE },
                rotate: { duration: config.fanTransitionDuration, ease: EASE },
                y: { duration: config.hoverTransitionDuration, ease: EASE },
                scale: { duration: config.hoverTransitionDuration, ease: EASE },
              }}
              onMouseEnter={() => !previewState && !isSelecting && setHoveredIdx(i)}
              onMouseLeave={() => !previewState && !isSelecting && setHoveredIdx(null)}
              style={{
                flexShrink: 0,
                marginLeft: i === 0 ? 0 : config.overlapX,
                // 左右两张外侧卡下沉，中间卡不下沉
                marginTop: (i === 0 || i === 2) ? config.outerCardOffset : 0,
                transformOrigin: "center bottom",
                zIndex: isHovered ? 20 : i === 1 ? 2 : 1,
                position: "relative",
                boxShadow: isHovered ? hover.shadow : rest,
                borderRadius: 24,
                transition: `box-shadow ${config.hoverTransitionDuration}s cubic-bezier(0.4,0,0.2,1)`,
              }}
            >
              {/* 仅中间卡（i===1）添加内层选区 Overlay */}
              {i === 1 && onSelect && !hideCardInnerOverlay ? (
                <MotionTargetOverlay
                  targetId={AGENT_CARD_INNER_MOTION.id}
                  targetLabel={AGENT_CARD_INNER_MOTION.label}
                  isSelecting={isSelecting}
                  onSelect={onSelect}
                  zIndex={10}
                >
                  {card}
                </MotionTargetOverlay>
              ) : card}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

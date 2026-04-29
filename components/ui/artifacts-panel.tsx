"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconClose, IconArrowRightUp } from "./wedata-icons";
import ArtifactDetailDrawer from "./artifact-detail-drawer";

// ── Design DNA tokens ────────────────────────────────────────────
const FONT =
  "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const TEXT_PRIMARY = "rgba(0,0,0,0.9)";
const TEXT_TERTIARY = "rgba(0,0,0,0.5)";
const BG_PANEL = "#ffffff";
const BG_CARD = "#f7f8fb";
const BORDER_PANEL = "#e9ecf1";
const BORDER_CARD = "#e6e9ef";
const HOVER_BG = "rgba(0,0,0,0.04)";
const PANEL_DEFAULT_RATIO = 0.5;
const CHAT_MIN_WIDTH = 700;
const PANEL_MIN_WIDTH = 500;
const RESIZE_HANDLE_WIDTH = 8;
const HEADER_HEIGHT = 84;
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const ICON_FILL = "#D3D9E5";

// ── File type → SVG icon path data ───────────────────────────────
// Extracted from Figma: file-code-1-filled, data-base-filled, file-markdown-filled, book-filled
const FILE_TYPE_ICONS: Record<string, { viewBox: string; d: string | string[] }> = {
  html: {
    viewBox: "0 0 15.75 19.25",
    d: "M10.8624 0H0V19.25H15.75V4.88756L10.8624 0ZM10.0625 5.6875V1.75L14 5.6875H10.0625ZM5.50642 15.0563L2.7002 12.2501L5.50641 9.44385L6.74385 10.6813L5.17507 12.2501L6.74386 13.8188L5.50642 15.0563ZM9.00628 13.8188L10.5751 12.2501L9.00628 10.6813L10.2437 9.44385L13.0499 12.2501L10.2437 15.0563L9.00628 13.8188Z",
  },
  sql: {
    viewBox: "0 0 17.5 19.25",
    d: [
      "M15.4906 6.63926C13.685 7.24111 11.302 7.58333 8.75 7.58333C6.198 7.58333 3.81497 7.24111 2.00942 6.63926C1.28515 6.39783 0.589921 6.09375 0 5.70943V9.47632C0 11.0871 3.91751 12.393 8.75 12.393C13.5825 12.393 17.5 11.0871 17.5 9.47632V5.70943C16.9101 6.09375 16.2149 6.39783 15.4906 6.63926Z",
      "M17.5 12.2691C16.9101 12.6534 16.2149 12.9575 15.4906 13.1989C13.685 13.8008 11.302 14.143 8.75 14.143C6.198 14.143 3.81497 13.8008 2.00942 13.1989C1.28515 12.9575 0.589921 12.6534 0 12.2691V16.3333C0 17.9441 3.91751 19.2499 8.75 19.2499C13.5825 19.2499 17.5 17.9441 17.5 16.3333L17.5 16.3242L17.5 12.2691Z",
      "M8.75 5.83333C3.91751 5.83333 0 4.5275 0 2.91667L4.08354e-06 2.91382C0.00461908 1.3043 3.92036 0 8.75 0C12.3744 0 15.4841 0.734533 16.8124 1.78137C17.2552 2.13031 17.5 2.51396 17.5 2.91667C17.5 4.5275 13.5825 5.83333 8.75 5.83333Z",
    ],
  },
  md: {
    viewBox: "0 0 15.75 19.25",
    d: "M15.75 4.8877V19.25H0V0H10.8623L15.75 4.8877ZM3.5 8.75V16.625H5.25V10.5H7V16.625H8.75V10.5H10.5V16.625H12.25V10.1249C12.2499 9.36558 11.6344 8.75007 10.8751 8.75H3.5ZM10.0625 5.6875H14L10.0625 1.75V5.6875Z",
  },
  notebook: {
    viewBox: "0 0 15.75 17.5",
    d: "M3.5 0C1.567 0 0 1.567 0 3.5V14C0 15.933 1.567 17.5 3.5 17.5H15.75V0H3.5ZM7 2.625H13.125V4.375H7V2.625ZM1.75 14C1.75 13.0335 2.5335 12.25 3.5 12.25H14V15.75H3.5C2.5335 15.75 1.75 14.9665 1.75 14Z",
  },
};

function getFileExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

// ── Mock data ────────────────────────────────────────────────────
interface Artifact {
  id: string;
  title: string;
  description: string;
}

const MOCK_ARTIFACTS: Artifact[] = [
  { id: "1", title: "2025年6至7月各地区的复购率设计方案.html", description: "数据读取脚本 · 从源表读取原始数据" },
  { id: "2", title: "clean_null_value.sql", description: "数据清洗脚本 · 空值过滤与格式标准化" },
  { id: "3", title: "read_source_data.sql", description: "数据读取脚本 · 从源表读取原始数据" },
  { id: "4", title: "clean_null_value.md", description: "数据清洗脚本 · 空值过滤与格式标准化" },
  { id: "5", title: "read_source_data.md", description: "数据读取脚本 · 从源表读取原始数据" },
  { id: "6", title: "clean_null_value.sql", description: "数据清洗脚本 · 空值过滤与格式标准化" },
  { id: "7", title: "read_source_data.notebook", description: "数据读取脚本 · 从源表读取原始数据" },
  { id: "8", title: "clean_null_value.notebook", description: "数据清洗脚本 · 空值过滤与格式标准化" },
];

// ── Types ────────────────────────────────────────────────────────
interface ArtifactsPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────
export default function ArtifactsPanel({ open, onClose }: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = React.useState<Artifact | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const resizeMetaRef = React.useRef<{ startX: number; startWidth: number } | null>(null);
  const [panelWidth, setPanelWidth] = React.useState<number | string>("50%");
  const [isResizing, setIsResizing] = React.useState(false);

  const syncPanelWidth = React.useCallback(() => {
    const containerWidth = panelRef.current?.parentElement?.clientWidth ?? 0;
    if (containerWidth <= 0) return;

    const maxPanelWidth = Math.max(PANEL_MIN_WIDTH, containerWidth - CHAT_MIN_WIDTH);
    const defaultPanelWidth = containerWidth * PANEL_DEFAULT_RATIO;

    setPanelWidth((prev) => {
      const nextWidth = typeof prev === "number" ? prev : defaultPanelWidth;
      return Math.max(PANEL_MIN_WIDTH, Math.min(nextWidth, maxPanelWidth));
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;

    syncPanelWidth();

    const container = panelRef.current?.parentElement;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      syncPanelWidth();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [open, syncPanelWidth]);

  const handleResizeMove = React.useCallback((event: PointerEvent) => {
    const resizeMeta = resizeMetaRef.current;
    const containerWidth = panelRef.current?.parentElement?.clientWidth ?? 0;
    if (!resizeMeta || containerWidth <= 0) return;

    const maxPanelWidth = Math.max(PANEL_MIN_WIDTH, containerWidth - CHAT_MIN_WIDTH);
    const delta = resizeMeta.startX - event.clientX;
    const nextWidth = Math.max(PANEL_MIN_WIDTH, Math.min(resizeMeta.startWidth + delta, maxPanelWidth));
    setPanelWidth(nextWidth);
  }, []);

  const handleResizeEnd = React.useCallback(() => {
    resizeMetaRef.current = null;
    setIsResizing(false);
    window.removeEventListener("pointermove", handleResizeMove);
    window.removeEventListener("pointerup", handleResizeEnd);
  }, [handleResizeMove]);

  const handleResizeStart = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const currentWidth = panelRef.current?.getBoundingClientRect().width;
    if (!currentWidth) return;

    resizeMetaRef.current = {
      startX: event.clientX,
      startWidth: currentWidth,
    };
    setIsResizing(true);
    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeEnd);
    event.preventDefault();
  }, [handleResizeEnd, handleResizeMove]);

  React.useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleResizeMove);
      window.removeEventListener("pointerup", handleResizeEnd);
    };
  }, [handleResizeEnd, handleResizeMove]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: panelWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={isResizing ? { duration: 0 } : { duration: 0.22, ease: EASE }}
          style={{
            height: "100%",
            flexShrink: 0,
            overflow: "hidden",
            background: BG_PANEL,
            borderLeft: `1px solid ${BORDER_PANEL}`,
            fontFamily: FONT,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            userSelect: isResizing ? "none" : "auto",
          }}
        >
          <div
            onPointerDown={handleResizeStart}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: RESIZE_HANDLE_WIDTH,
              cursor: "col-resize",
              zIndex: 30,
              touchAction: "none",
            }}
          />

          {/* ── 标题栏 84px ── */}
          <div
            style={{
              height: HEADER_HEIGHT,
              flexShrink: 0,
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "0 24px",
            }}
          >
            <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", height: "100%" }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: "26px",
                  color: TEXT_PRIMARY,
                  whiteSpace: "nowrap",
                }}
              >
                产物
              </span>
            </div>
            <CloseButton onClick={onClose} />
          </div>

          {/* ── 产物列表 ── */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0 24px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              scrollbarWidth: "none",
            }}
          >
            {MOCK_ARTIFACTS.map((a) => (
              <ArtifactItem key={a.id} artifact={a} onClick={() => setSelectedArtifact(a)} />
            ))}
          </div>

          {/* ── 产物详情抽屉（覆盖层） ── */}
          <AnimatePresence>
            {selectedArtifact && (
              <ArtifactDetailDrawer
                artifact={selectedArtifact}
                allArtifacts={MOCK_ARTIFACTS}
                onBack={() => setSelectedArtifact(null)}
                onSelectArtifact={(a) => setSelectedArtifact(a)}
              />
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Close button (32×32, padding 12, icon 16×16) ─────────────────
function CloseButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      aria-label="关闭产物面板"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 100,
        border: "none",
        background: hovered ? HOVER_BG : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "background 0.15s ease",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <IconClose size={16} color={TEXT_TERTIARY} />
    </button>
  );
}

// ── File type icon (tilted card with SVG inside, masked by 56×56 container) ──
// Figma structure:
//   类型图标 (56×56, absolute left:15.5 top:7.5)  ← clip container
//     centering wrapper (58.686×78.485, flex center) ← positions the rotated card
//       -rotate-15 wrapper
//         数据表 (42×70, masked to 56×56 rect)
//           white card (42×70, rounded-10.5, border, shadow)
//           icon SVG (21×21, positioned at left:10.5 top:17.5)
function FileTypeIcon({ ext }: { ext: string }) {
  const iconData = FILE_TYPE_ICONS[ext];
  const paths = iconData
    ? Array.isArray(iconData.d) ? iconData.d : [iconData.d]
    : [];

  return (
    <div
      style={{
        position: "absolute",
        left: 15.5,
        top: 7.5,
        width: 56,
        height: 56,
        overflow: "hidden",
      }}
    >
      {/* Centering wrapper — matches Figma's 58.686×78.485 absolute flex container */}
      <div
        style={{
          position: "absolute",
          left: -0.47,
          top: 0.13,
          width: 58.686,
          height: 78.485,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* -15° rotation wrapper */}
        <div style={{ transform: "rotate(-15deg)", flexShrink: 0 }}>
          {/* 数据表: 42×70 card — the bottom overflows and gets clipped by the 56×56 parent */}
          <div style={{ position: "relative", width: 42, height: 70 }}>
            {/* White card background with border & shadow */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 42,
                height: 70,
                borderRadius: 10.5,
                background: BG_PANEL,
                border: "none",
                boxShadow: "0px 3.5px 3.5px -1.75px rgba(0,0,0,0.16)",
              }}
            />
            {/* File type SVG icon — 21×21 at left:10.5 top:17.5 */}
            {iconData && (
              <svg
                viewBox={iconData.viewBox}
                fill="none"
                style={{
                  position: "absolute",
                  left: 10.5,
                  top: 17.5,
                  width: 21,
                  height: 21,
                }}
              >
                {paths.map((d, i) => (
                  <path key={i} d={d} fill={ICON_FILL} />
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Artifact card (64px) ─────────────────────────────────────────
function ArtifactItem({ artifact, onClick }: { artifact: Artifact; onClick?: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  const ext = getFileExt(artifact.title);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 64,
        borderRadius: 16,
        background: hovered ? "#f0f2f5" : BG_CARD,
        border: `0.5px solid ${BORDER_CARD}`,
        display: "flex",
        gap: 8,
        alignItems: "center",
        paddingLeft: 88,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      {/* ── 左侧文件类型图标（倾斜卡片 + SVG） ── */}
      <FileTypeIcon ext={ext} />

      {/* ── 文字区域 ── */}
      <div
        style={{
          flex: "1 0 0",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "22px",
            color: TEXT_PRIMARY,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {artifact.title}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: "20px",
            color: TEXT_TERTIARY,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {artifact.description}
        </span>
      </div>

      {/* ── 右侧箭头 ── */}
      <div style={{ flexShrink: 0, overflow: "hidden", width: 16, height: 16 }}>
        <IconArrowRightUp size={16} color={TEXT_TERTIARY} />
      </div>
    </div>
  );
}

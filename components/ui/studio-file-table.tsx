"use client";

import React, { useState } from "react";
import {
  Search, MoreHorizontal, Plus, Copy, Move, Link, ChevronLeft, ChevronRight,
  Folder, Settings, Filter, Star,
} from "lucide-react";
import {
  IconSQL, IconDashboard, IconChatBI,
} from "@/components/ui/wedata-icons";

// ── Design DNA tokens ──────────────────────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

const C = {
  bg: "#FFFFFF",
  pageBg: "#F2F4F8",
  border: "#E9ECF1",
  divider: "#E8EAED",
  primary: "#1664FF",
  textPrimary: "rgba(0,0,0,0.9)",
  textSecondary: "rgba(0,0,0,0.7)",
  textTertiary: "rgba(0,0,0,0.5)",
  textDisabled: "rgba(0,0,0,0.3)",
  hoverBg: "#EFF1F5",
  createBtnBg: "rgba(0,0,0,0.75)",
} as const;

// ── File type icons ────────────────────────────────────────────
function NotebookIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="12" height="14" rx="2" stroke="#1D808F" strokeWidth="1.2"/>
      <path d="M5 4.5H11M5 7.5H11M5 10.5H9" stroke="#1D808F" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

type FileType = "folder" | "notebook" | "dashboard" | "sql" | "chatbi";

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  creator: string;
  createTime: string;
}

function FileTypeIcon({ type }: { type: FileType }) {
  switch (type) {
    case "folder":
      return <Folder size={16} color="#1D808F" />;
    case "notebook":
      return <NotebookIcon />;
    case "dashboard":
      return <IconDashboard size={16} color="#1D808F" />;
    case "sql":
      return <IconSQL size={16} color="#1D808F" />;
    case "chatbi":
      return <IconChatBI size={16} color="#1D808F" />;
  }
}

function FileTypeLabel({ type }: { type: FileType }) {
  const labels: Record<FileType, string> = {
    folder: "文件夹",
    notebook: "Notebook",
    dashboard: "Dashboard",
    sql: "SQL",
    chatbi: "ChatBI",
  };
  return <span>{labels[type]}</span>;
}

// ── Mock data ──────────────────────────────────────────────────
const MOCK_FILES: FileItem[] = [
  { id: "1",  name: "数据分析工作区",     type: "folder",    creator: "junyangliu", createTime: "2025-03-15 14:30" },
  { id: "2",  name: "用户行为分析",       type: "notebook",  creator: "junyangliu", createTime: "2025-03-14 09:20" },
  { id: "3",  name: "销售数据看板",       type: "dashboard", creator: "junyangliu", createTime: "2025-03-13 16:45" },
  { id: "4",  name: "订单查询",           type: "sql",       creator: "junyangliu", createTime: "2025-03-12 11:00" },
  { id: "5",  name: "客户画像分析",       type: "chatbi",    creator: "junyangliu", createTime: "2025-03-11 08:30" },
  { id: "6",  name: "模型训练数据",       type: "folder",    creator: "junyangliu", createTime: "2025-03-10 17:15" },
  { id: "7",  name: "特征工程实验",       type: "notebook",  creator: "junyangliu", createTime: "2025-03-09 10:00" },
  { id: "8",  name: "实时监控面板",       type: "dashboard", creator: "junyangliu", createTime: "2025-03-08 13:25" },
  { id: "9",  name: "日志聚合查询",       type: "sql",       creator: "junyangliu", createTime: "2025-03-07 15:40" },
  { id: "10", name: "运营周报分析",       type: "chatbi",    creator: "junyangliu", createTime: "2025-03-06 09:55" },
  { id: "11", name: "测试数据集",         type: "folder",    creator: "junyangliu", createTime: "2025-03-05 14:10" },
  { id: "12", name: "AB 实验结果",        type: "notebook",  creator: "junyangliu", createTime: "2025-03-04 11:30" },
  { id: "13", name: "流量分析面板",       type: "dashboard", creator: "junyangliu", createTime: "2025-03-03 16:20" },
  { id: "14", name: "数据质量检查",       type: "sql",       creator: "junyangliu", createTime: "2025-03-02 08:45" },
  { id: "15", name: "智能问答助手",       type: "chatbi",    creator: "junyangliu", createTime: "2025-03-01 12:00" },
  { id: "16", name: "归档文件",           type: "folder",    creator: "junyangliu", createTime: "2025-02-28 17:30" },
  { id: "17", name: "用户留存分析",       type: "notebook",  creator: "junyangliu", createTime: "2025-02-27 10:15" },
  { id: "18", name: "收入预测模型",       type: "notebook",  creator: "junyangliu", createTime: "2025-02-26 14:50" },
];

// ── Column header divider (6px inset top/bottom) ──────────────
function ThDivider() {
  return (
    <div style={{
      position: "absolute",
      right: 0,
      top: 6,
      bottom: 6,
      width: 1,
      backgroundColor: "#D6DBE3",
    }} />
  );
}

// ── Action buttons ─────────────────────────────────────────────
function ActionButtons({ type }: { type: FileType }) {
  const btnStyle: React.CSSProperties = {
    padding: "2px 4px",
    fontSize: 12,
    lineHeight: "20px",
    color: "#000000",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: FONT,
    borderRadius: 4,
    transition: "background 100ms",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  };

  if (type === "folder") {
    return (
      <div style={containerStyle}>
        <button style={btnStyle}><Plus size={14} />创建</button>
        <button style={btnStyle}><Move size={14} />移动</button>
        <button style={btnStyle}><Link size={14} />复制路径</button>
        <button style={btnStyle}><MoreHorizontal size={14} />更多</button>
      </div>
    );
  }
  return (
    <div style={containerStyle}>
      <button style={btnStyle}><Copy size={14} />复制</button>
      <button style={btnStyle}><Move size={14} />移动</button>
      <button style={btnStyle}><Link size={14} />复制路径</button>
      <button style={btnStyle}><MoreHorizontal size={14} />更多</button>
    </div>
  );
}

// ── Pill button shared style (search/more) ─────────────────────
const PILL_GRADIENT: React.CSSProperties = {
  border: "1px solid #E9EBF0",
  backgroundImage: "linear-gradient(to bottom, #FAFBFC, #F2F4F7)",
  boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.12)",
  borderRadius: 100,
  overflow: "hidden",
};

// ── StudioFileTable ────────────────────────────────────────────
export default function StudioFileTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const totalItems = 101;
  const pageSize = 10;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      height: "100%",
      backgroundColor: C.bg,
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT,
    }}>
      {/* ── Title bar — 1:1 还原 Figma node 993-66868 ── */}
      <div style={{
        padding: "20px 24px",
        flexShrink: 0,
        display: "flex",
        alignItems: "flex-start",
        gap: 40,
      }}>
        {/* 左侧：双行标题 */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* 标题行 44px */}
          <div style={{
            display: "flex",
            alignItems: "center",
            height: 44,
            gap: 8,
          }}>
            {/* 文件夹图标 32×32 圆角16 灰色背景 */}
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Folder size={16} color={C.textSecondary} />
            </div>

            {/* 名称 + 复制/收藏小图标 */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize: 18, fontWeight: 600, lineHeight: "26px",
                color: C.textPrimary, whiteSpace: "nowrap",
              }}>
                JosephDeng
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button style={{
                  width: 28, height: 28, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, padding: 2,
                }}>
                  <Copy size={16} color={C.textTertiary} />
                </button>
                <button style={{
                  width: 28, height: 28, border: "none", background: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4, padding: 2,
                }}>
                  <Star size={16} color={C.textTertiary} />
                </button>
              </div>
            </div>
          </div>

          {/* 面包屑 — 分段渲染，末段 secondary 色 medium 字重 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 20,
            fontSize: 12,
          }}>
            <span style={{ lineHeight: "20px", color: C.textTertiary, whiteSpace: "nowrap" }}>Workspace</span>
            <span style={{ lineHeight: "18px", color: C.textTertiary, fontWeight: 600, width: 4, textAlign: "center" }}>/</span>
            <span style={{ lineHeight: "20px", color: C.textTertiary, whiteSpace: "nowrap" }}>Users</span>
            <span style={{ lineHeight: "18px", color: C.textTertiary, fontWeight: 600, width: 4, textAlign: "center" }}>/</span>
            <span style={{ lineHeight: "20px", color: C.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>JosephDeng</span>
          </div>
        </div>

        {/* 右侧操作区 — 搜索 + 更多 + 创建 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {/* 搜索框 — 渐变 pill 160×44 */}
          <div style={{
            ...PILL_GRADIENT,
            width: 160, height: 44,
            display: "flex", alignItems: "center",
            padding: "4px 20px", gap: 4,
          }}>
            <Search size={16} color={C.textTertiary} style={{ flexShrink: 0 }} />
            <input
              placeholder="搜索文件/文件夹"
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                fontSize: 14, color: C.textPrimary, fontFamily: FONT,
                lineHeight: "22px", minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            />
          </div>

          {/* 更多按钮 — 圆形渐变 44×44 */}
          <button style={{
            ...PILL_GRADIENT,
            width: 44, height: 44,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 4,
          }}>
            <MoreHorizontal size={16} color={C.textSecondary} />
          </button>

          {/* 创建按钮 — 深色 pill 44h min-w88 */}
          <button
            style={{
              height: 44, minWidth: 88, borderRadius: 100,
              backgroundColor: C.createBtnBg,
              boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.2)",
              color: "#FFFFFF",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              padding: "12px 20px",
              fontSize: 14, fontWeight: 500, fontFamily: FONT,
              overflow: "hidden",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.88)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.createBtnBg; }}
          >
            <Plus size={16} color="#FFFFFF" />
            创建
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        padding: "0 24px",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}>
          <thead>
            <tr style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#F7F8FB",
              zIndex: 1,
            }}>
              <th style={{ ...thStyle, width: "35%", paddingLeft: 24 }}>名称<ThDivider /></th>
              <th style={{ ...thStyle, width: "12%" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  类型 <Filter size={12} color={C.textDisabled} />
                </span>
                <ThDivider />
              </th>
              <th style={{ ...thStyle, width: "12%" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  创建人 <Filter size={12} color={C.textDisabled} />
                </span>
                <ThDivider />
              </th>
              <th style={{ ...thStyle, width: "15%" }}>创建时间<ThDivider /></th>
              <th style={{ ...thStyle, width: "22%" }}>操作<ThDivider /></th>
              <th style={{ ...thStyle, width: "4%", paddingRight: 24 }}>
                <Settings size={14} color={C.textDisabled} />
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FILES.map((file) => (
              <tr
                key={file.id}
                style={{
                  background: hoveredRow === file.id ? C.hoverBg : "transparent",
                  transition: "background 100ms",
                }}
                onMouseEnter={() => setHoveredRow(file.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td style={{ ...tdStyle, paddingLeft: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FileTypeIcon type={file.type} />
                    <span style={{
                      color: "#1D808F",
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: "20px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}>
                      {file.name}
                    </span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 12, color: "#000000" }}>
                    <FileTypeLabel type={file.type} />
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 12, color: "#000000" }}>{file.creator}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 12, color: "#000000" }}>{file.createTime}</span>
                </td>
                <td style={tdStyle}>
                  <ActionButtons type={file.type} />
                </td>
                <td style={{ ...tdStyle, paddingRight: 24 }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination bar ── */}
      <div style={{
        height: 56,
        flexShrink: 0,
        borderTop: `1px solid ${C.divider}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        {/* Left: total */}
        <span style={{ fontSize: 13, color: C.textTertiary }}>
          共 {totalItems} 项数据
        </span>

        {/* Right: page size + navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Page size selector */}
          <div style={{
            height: 28, borderRadius: 4,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center",
            padding: "0 8px", gap: 4,
            fontSize: 13, color: C.textSecondary,
            cursor: "pointer",
          }}>
            {pageSize} 条/页
            <ChevronRight size={12} color={C.textTertiary} style={{ transform: "rotate(90deg)" }} />
          </div>

          {/* Page navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={pageNavBtnStyle}
            >
              <ChevronLeft size={14} color={currentPage === 1 ? C.textDisabled : C.textSecondary} />
            </button>

            <span style={{ fontSize: 13, color: C.textTertiary, padding: "0 4px" }}>
              跳至
            </span>
            <input
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1 && v <= totalPages) setCurrentPage(v);
              }}
              style={{
                width: 36, height: 28, borderRadius: 4,
                border: `1px solid ${C.border}`,
                textAlign: "center", fontSize: 13,
                color: C.textPrimary, fontFamily: FONT,
                outline: "none",
              }}
            />
            <span style={{ fontSize: 13, color: C.textTertiary }}>
              /{totalPages}页
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={pageNavBtnStyle}
            >
              <ChevronRight size={14} color={currentPage === totalPages ? C.textDisabled : C.textSecondary} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: "20px",
  color: "rgba(0,0,0,0.7)",
  whiteSpace: "nowrap",
  backgroundColor: "#F7F8FB",
  position: "relative",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 12,
  lineHeight: "20px",
  verticalAlign: "middle",
  borderBottom: `1px solid ${C.border}`,
};

const pageNavBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 4,
  border: `1px solid #E9ECF1`,
  background: "transparent",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

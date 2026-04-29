"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Star } from "lucide-react";

// ── Design DNA tokens ──────────────────────────────────────────
const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  bg: "#FFFFFF",
  border: "#E9ECF1",
  selectedBg: "#F2F4F8",
  hoverBg: "#F7F8FA",
  textPrimary: "rgba(0,0,0,0.9)",
  textSecondary: "rgba(0,0,0,0.7)",
  textTertiary: "rgba(0,0,0,0.5)",
} as const;

// ── Tree data ──────────────────────────────────────────────────
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  defaultOpen?: boolean;
}

const TREE_DATA: TreeNode[] = [
  {
    id: "workspace",
    label: "Workspace",
    defaultOpen: true,
    children: [
      {
        id: "users",
        label: "Users",
        defaultOpen: true,
        children: [
          { id: "jokima", label: "jokima" },
          { id: "JosephDeng", label: "JosephDeng" },
          { id: "rainasu", label: "rainasu" },
          { id: "xiaoqingcui", label: "xiaoqingcui" },
          { id: "nasahe", label: "nasahe" },
        ],
      },
    ],
  },
];

// ── TreeItem recursive component ──────────────────────────────
function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(node.defaultOpen ?? false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setIsOpen(!isOpen);
          onSelect(node.id);
        }}
        style={{
          width: "100%",
          height: 32,
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: 8 + depth * 16,
          paddingRight: 8,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: FONT,
        }}
      >
        {/* Expand/collapse chevron */}
        <span style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} color={C.textTertiary} /> : <ChevronRight size={14} color={C.textTertiary} />
          ) : null}
        </span>

        {/* 内容 pill — hover/selected 背景仅在此层，不横向贯通 */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 4px",
            borderRadius: 8,
            background: isSelected ? C.selectedBg : "transparent",
            transition: "background 100ms",
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.background = C.hoverBg;
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.background = "transparent";
          }}
        >
          {/* Folder icon */}
          <span style={{ display: "flex", flexShrink: 0 }}>
            {hasChildren ? (
              isOpen ? <FolderOpen size={16} color={isSelected ? "#000000" : C.textSecondary} /> : <Folder size={16} color={isSelected ? "#000000" : C.textSecondary} />
            ) : (
              <Folder size={16} color={isSelected ? "#000000" : C.textSecondary} />
            )}
          </span>

          {/* Label */}
          <span style={{
            flex: 1,
            fontSize: 12,
            fontWeight: isSelected ? 600 : 400,
            lineHeight: "20px",
            color: isSelected ? "#000000" : C.textSecondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {node.label}
          </span>
        </span>
      </button>

      {/* Children */}
      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── StudioTree ─────────────────────────────────────────────────
export default function StudioTree() {
  const [selectedId, setSelectedId] = useState("JosephDeng");

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      height: "100%",
      backgroundColor: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      fontFamily: FONT,
      userSelect: "none",
      flexShrink: 0,
    }}>
      {/* ── Title bar 84px ── */}
      <div style={{
        height: 84,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 600,
          lineHeight: "28px",
          color: C.textPrimary,
        }}>
          Studio
        </span>
      </div>

      {/* ── Tree content ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        padding: "0 0 8px",
      }}>
        {TREE_DATA.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ))}

        {/* ── Divider ── */}
        <div style={{
          height: 1,
          backgroundColor: C.border,
          margin: "12px 16px",
        }} />

        {/* ── Bottom items ── */}
        <button
          style={{
            width: "100%", height: 32,
            display: "flex", alignItems: "center", gap: 6,
            paddingLeft: 16, paddingRight: 12,
            border: "none", background: "transparent",
            cursor: "pointer", textAlign: "left",
            transition: "background 100ms", fontFamily: FONT,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ width: 16, height: 16, flexShrink: 0 }} />
          <Star size={14} color={C.textSecondary} />
          <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: "20px" }}>收藏夹</span>
        </button>

      </div>
    </div>
  );
}

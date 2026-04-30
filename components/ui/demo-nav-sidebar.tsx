"use client";

import React from "react";
import type { DemoFlow, DemoFlowId } from "@/components/ui/demo-nav-model";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  panelBg: "#1a1a1a",
  sectionTitle: "#ffffffa6",
  textPrimary: "#ffffffd9",
  textSecondary: "#ffffffa6",
  border: "#ffffff14",
  itemBg: "rgba(255,255,255,0.04)",
  itemActiveBg: "rgba(255,255,255,0.10)",
  itemActiveBorder: "rgba(255,255,255,0.22)",
} as const;

const PREVIEW_W = 188;
const PREVIEW_H = 117;

interface DemoNavSidebarProps {
  flows: DemoFlow[];
  activeFlowId: DemoFlowId;
  onFlowChange: (flowId: DemoFlowId) => void;
}

function FlowPreviewImage({ flow, active }: { flow: DemoFlow; active: boolean }) {
  return (
    <div
      style={{
        width: PREVIEW_W,
        height: PREVIEW_H,
        borderRadius: 8,
        overflow: "hidden",
        border: "none",
        backgroundColor: "#000",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <img
        src={flow.previewImage}
        alt={flow.label}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          backgroundColor: "#000",
        }}
      />
    </div>
  );
}

export default function DemoNavSidebar({
  flows,
  activeFlowId,
  onFlowChange,
}: DemoNavSidebarProps) {
  return (
    <aside
      style={{
        width: 240,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.panelBg,
        borderRight: "none",
        flexShrink: 0,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* 返回设计稿按钮 — 参考右侧编辑面板顶部胶囊样式 */}
      <div style={{ padding: "10px 10px 0", flexShrink: 0 }}>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (window.parent !== window) {
              window.parent.postMessage({ type: "ardot:navigate-back" }, "*");
            } else {
              window.history.back();
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: 42,
            borderRadius: 21,
            border: "1px solid #3B3C3F",
            background: "#202124",
            boxShadow: "0 8px 20px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.08)",
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#202124"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8.5 3L4.5 7L8.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          返回设计稿
        </a>
      </div>

      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px 0 14px",
          borderBottom: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: "20px", color: C.textPrimary }}>演示导航</span>
          <span style={{ fontSize: 11, lineHeight: "16px", color: C.textSecondary }}>流程节点切换</span>
        </div>
      </div>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          padding: "10px 10px 12px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.sectionTitle,
            marginBottom: 8,
            letterSpacing: 0.2,
          }}
        >
          流程节点
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flows.map((flow) => {
            const isActive = flow.id === activeFlowId;
            return (
              <button
                key={flow.id}
                onClick={() => onFlowChange(flow.id)}
                style={{
                  width: "100%",
                  border: "none",
                  backgroundColor: isActive ? C.itemActiveBg : C.itemBg,
                  borderRadius: 10,
                  padding: "8px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <FlowPreviewImage flow={flow} active={isActive} />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    lineHeight: "18px",
                    color: C.textPrimary,
                  }}
                >
                  {flow.label}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 11,
                    lineHeight: "16px",
                    color: C.textSecondary,
                  }}
                >
                  {flow.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

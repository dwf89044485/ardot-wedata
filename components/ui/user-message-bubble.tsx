"use client";

import React from "react";

// ── Design DNA tokens ────────────────────────────────────────────
const BUBBLE_BG = "#EDF0F5";              // interactive.user_bubble_bg
const BUBBLE_RADIUS = "16px 2px 16px 16px"; // 右上角 2px → 标识「我发的」
const BUBBLE_PADDING = "12px 16px";
const BUBBLE_MAX_WIDTH = 660;
const LEFT_PADDING = 90;                   // 左侧留白，推向右侧
const TEXT_COLOR = "rgba(0,0,0,0.9)";      // text.primary
const FONT_BODY = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ── Types ────────────────────────────────────────────────────────
interface UserMessageBubbleProps {
  content: string;
}

// ── Component ────────────────────────────────────────────────────
export default function UserMessageBubble({ content }: UserMessageBubbleProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        paddingLeft: LEFT_PADDING,
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: BUBBLE_MAX_WIDTH,
          backgroundColor: BUBBLE_BG,
          borderRadius: BUBBLE_RADIUS,
          padding: BUBBLE_PADDING,
          fontFamily: FONT_BODY,
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "28px",
          color: TEXT_COLOR,
          textAlign: "justify",
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
    </div>
  );
}

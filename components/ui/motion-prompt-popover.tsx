"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnchorPosition } from "@/lib/use-anchor-position";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

interface MotionPromptPopoverProps {
  element: HTMLElement;
  onSubmit: (prompt: string) => void;
  onClose: () => void;
}

export default function MotionPromptPopover({
  element,
  onSubmit,
  onClose,
}: MotionPromptPopoverProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const anchorPos = useAnchorPosition(element, 320);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // 演示：无论输入什么，都发送固定 prompt
    onSubmit("帮我做一个鼠标 hover 在卡片时，卡片会浮起的动效");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return createPortal(
    <div
      data-editor-ui
      style={{
        position: "fixed",
        top: anchorPos?.top ?? 100,
        left: anchorPos?.left ?? 100,
        width: 320,
        zIndex: 100001,
        borderRadius: 12,
        background: "rgba(15,18,24,0.94)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: FONT,
        color: "rgba(255,255,255,0.92)",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* header */}
      <div
        style={{
          padding: "12px 14px 6px",
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        描述你想要的动效
      </div>

      {/* hint */}
      <div
        style={{
          padding: "0 14px 8px",
          fontSize: 11,
          color: "rgba(255,255,255,0.42)",
          lineHeight: 1.4,
        }}
      >
        例如：悬停时放大 1.05 倍并添加阴影
      </div>

      {/* textarea + 发送按钮 */}
      <div style={{ padding: "0 14px 12px", position: "relative" }}>
        <div
          style={{
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            position: "relative",
            transition: "border-color 150ms",
          }}
          onFocus={() => {
            const el = textareaRef.current?.parentElement;
            if (el) el.style.borderColor = "rgba(22,100,255,0.5)";
          }}
          onBlur={() => {
            const el = textareaRef.current?.parentElement;
            if (el) el.style.borderColor = "rgba(255,255,255,0.12)";
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入动效描述..."
            rows={3}
            style={{
              width: "100%",
              minHeight: 72,
              maxHeight: 120,
              boxSizing: "border-box",
              background: "transparent",
              border: "none",
              borderRadius: 10,
              padding: "10px 40px 10px 12px",
              fontSize: 13,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.92)",
              fontFamily: FONT,
              outline: "none",
              resize: "none",
            }}
          />
          {/* 圆形发送按钮（右下角） */}
          <button
            onClick={handleSubmit}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: text.trim() ? "rgba(22,100,255,0.85)" : "rgba(255,255,255,0.08)",
              cursor: text.trim() ? "pointer" : "default",
              transition: "background 150ms",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 11.5V3M7 3L3.5 6.5M7 3L10.5 6.5"
                stroke={text.trim() ? "#fff" : "rgba(255,255,255,0.32)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

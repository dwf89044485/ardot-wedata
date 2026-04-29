"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAnchorPosition } from "@/lib/use-anchor-position";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export interface CommentEntry {
  id: number;
  selector: string;
  textContent: string;
  reactComponent: string | null;
  ancestorPath: string;
  text: string;
  elementRef: WeakRef<HTMLElement>;
}

interface CommentPopoverProps {
  element: HTMLElement;
  elementLabel: string;
  existingComment?: CommentEntry;
  theme?: "light" | "dark";
  onSubmit: (text: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function CommentPopover({
  element,
  elementLabel,
  existingComment,
  theme = "dark",
  onSubmit,
  onDelete,
  onClose,
}: CommentPopoverProps) {
  const [text, setText] = useState(existingComment?.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const anchorPos = useAnchorPosition(element, 280);
  const isDark = theme === "dark";

  useEffect(() => {
    // auto-focus
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const bg = isDark ? "rgba(15,18,24,0.94)" : "rgba(255,255,255,0.96)";
  const border = isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(0,0,0,0.12)";
  const textColor = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.78)";
  const mutedColor = isDark ? "rgba(255,255,255,0.48)" : "rgba(0,0,0,0.42)";
  const fieldBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const fieldBorder = isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)";
  const accentBg = isDark ? "rgba(22,100,255,0.85)" : "rgba(22,100,255,0.9)";

  return createPortal(
    <div
      data-editor-ui
      style={{
        position: "fixed",
        top: anchorPos?.top ?? 100,
        left: anchorPos?.left ?? 100,
        width: 280,
        zIndex: 100001,
        borderRadius: 10,
        background: bg,
        border,
        boxShadow: isDark
          ? "0 12px 32px rgba(0,0,0,0.45)"
          : "0 12px 32px rgba(0,0,0,0.14)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: FONT,
        color: textColor,
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* header: element label */}
      <div
        style={{
          padding: "10px 12px 6px",
          fontSize: 11,
          fontWeight: 500,
          color: mutedColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {elementLabel}
      </div>

      {/* textarea */}
      <div style={{ padding: "0 12px" }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="写下你的批注..."
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: fieldBg,
            border: fieldBorder,
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 13,
            lineHeight: 1.5,
            color: textColor,
            fontFamily: FONT,
            resize: "vertical",
            outline: "none",
            minHeight: 60,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(22,100,255,0.5)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
          }}
        />
      </div>

      {/* footer buttons */}
      <div style={{ padding: "8px 12px 10px", display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {existingComment && onDelete && (
          <button
            onClick={onDelete}
            style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: isDark ? "1px solid rgba(255,80,80,0.3)" : "1px solid rgba(220,38,38,0.2)",
              background: "transparent",
              color: isDark ? "rgba(255,120,120,0.9)" : "rgba(220,38,38,0.8)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
            }}
          >
            删除
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            height: 28, padding: "0 12px", borderRadius: 6,
            border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.1)",
            background: "transparent",
            color: mutedColor,
            fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONT,
          }}
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          style={{
            height: 28, padding: "0 14px", borderRadius: 6, border: "none",
            background: text.trim() ? accentBg : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
            color: text.trim() ? "#fff" : mutedColor,
            fontSize: 12, fontWeight: 500,
            cursor: text.trim() ? "pointer" : "default",
            fontFamily: FONT,
          }}
        >
          {existingComment ? "保存" : "添加"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

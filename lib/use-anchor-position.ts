"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PANEL_W = 300;
const GAP = 12; // 面板与锚点之间的间距
const VIEWPORT_PAD = 12; // 距视口边缘最小间距

export interface AnchorPosition {
  top: number;
  left: number;
}

/**
 * 根据锚点元素位置计算面板的最优定位。
 *
 * 策略：右侧 → 左侧 → 下方 → 上方，选空间最充裕的方向。
 * 切换 anchorElement 时重新计算（拖拽偏移重置）。
 */
export function useAnchorPosition(
  anchorElement: HTMLElement | null | undefined,
  panelWidth = PANEL_W,
): AnchorPosition | null {
  const [pos, setPos] = useState<AnchorPosition | null>(null);
  const prevAnchorRef = useRef<HTMLElement | null>(null);

  const compute = useCallback(() => {
    if (!anchorElement || !anchorElement.isConnected) {
      setPos(null);
      return;
    }

    const rect = anchorElement.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 面板高度估算（动态内容，给一个合理上限）
    const panelH = Math.min(400, vh - VIEWPORT_PAD * 2);

    // 锚点中心 Y，面板尽量垂直居中对齐锚点
    const anchorCenterY = rect.top + rect.height / 2;
    const idealTop = anchorCenterY - panelH / 2;

    // 钳制 top 到视口范围内
    const clampTop = (t: number) => Math.max(VIEWPORT_PAD, Math.min(t, vh - panelH - VIEWPORT_PAD));

    // 各方向可用空间
    const spaceRight = vw - rect.right - GAP;
    const spaceLeft = rect.left - GAP;
    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    let top: number;
    let left: number;

    if (spaceRight >= panelWidth + VIEWPORT_PAD) {
      // 右侧放得下
      left = rect.right + GAP;
      top = clampTop(idealTop);
    } else if (spaceLeft >= panelWidth + VIEWPORT_PAD) {
      // 左侧放得下
      left = rect.left - GAP - panelWidth;
      top = clampTop(idealTop);
    } else if (spaceBelow >= panelH + VIEWPORT_PAD) {
      // 下方
      left = Math.max(VIEWPORT_PAD, Math.min(rect.left, vw - panelWidth - VIEWPORT_PAD));
      top = rect.bottom + GAP;
    } else if (spaceAbove >= panelH + VIEWPORT_PAD) {
      // 上方
      left = Math.max(VIEWPORT_PAD, Math.min(rect.left, vw - panelWidth - VIEWPORT_PAD));
      top = rect.top - GAP - panelH;
    } else {
      // 全都放不下，fallback 到右侧尽量贴边
      left = Math.max(VIEWPORT_PAD, vw - panelWidth - VIEWPORT_PAD);
      top = clampTop(idealTop);
    }

    setPos({ top, left });
  }, [anchorElement, panelWidth]);

  useEffect(() => {
    // 锚点元素变了 → 重新计算
    if (anchorElement !== prevAnchorRef.current) {
      prevAnchorRef.current = anchorElement ?? null;
      compute();
    }
  }, [anchorElement, compute]);

  // 初次挂载 + resize 时重新计算
  useEffect(() => {
    if (!anchorElement) return;

    compute();

    const handleResize = () => compute();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [anchorElement, compute]);

  return pos;
}

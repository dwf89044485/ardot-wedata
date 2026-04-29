"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAnchorPosition } from "@/lib/use-anchor-position";

const FONT = "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'Monaco','Menlo','Ubuntu Mono',monospace";
const INPUT_H = 26;

// ── Types ──────────────────────────────────────────────────────
export type StylePanelTheme = "light" | "dark";

export interface StylePanelProps {
  element: HTMLElement;
  originalComputed: Record<string, string>;
  theme?: StylePanelTheme;
  onClose: () => void;
  onReset?: () => void;
  onSelectElement?: (el: HTMLElement) => void;
  onStyleMutate?: (el: HTMLElement) => void;
  /** 停靠模式：在固定右栏内渲染，而非浮窗 */
  docked?: boolean;
}

interface StyleChange {
  property: string;
  from: string;
  to: string;
}

interface ParsedShadow {
  inset: boolean;
  x: string; y: string; blur: string; spread: string;
  hex: string; alpha: number;
}

// ── Element type detection ──────────────────────────────────
type ElementType = 'text' | 'image' | 'icon' | 'input' | 'button' | 'container';

function detectElementType(el: HTMLElement): ElementType {
  const tag = el.tagName.toLowerCase();

  // 图片
  if (tag === 'img') return 'image';
  if (tag === 'picture' || tag === 'video') return 'image';

  // 输入框
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'input';

  // SVG — 判断是图标还是装饰
  if (tag === 'svg') return 'icon';
  // icon font 常用 <i> / <span> with 单字符或 class 含 icon
  if ((tag === 'i' || tag === 'span') && el.className && typeof el.className === 'string' && /icon/i.test(el.className)) return 'icon';

  // 按钮
  if (tag === 'button' || el.getAttribute('role') === 'button') return 'button';
  if (tag === 'a') return 'button';

  // 文本判定：所有子节点都是文本或 inline 元素（span, strong, em, a, br, b, i, code）
  const inlineTags = new Set(['span', 'strong', 'em', 'a', 'br', 'b', 'i', 'code', 'small', 'sub', 'sup', 'mark', 'abbr']);
  const childNodes = el.childNodes;
  let hasText = false;
  let allInline = true;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent && node.textContent.trim()) hasText = true;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const childTag = (node as HTMLElement).tagName.toLowerCase();
      if (!inlineTags.has(childTag)) { allInline = false; break; }
      else hasText = true;
    }
  }
  if (hasText && allInline) return 'text';

  return 'container';
}

/** 元素类型各 section 可见性 */
function getSectionVisibility(type: ElementType) {
  return {
    dimensions:   type !== 'text' && type !== 'icon',
    layout:       type === 'container',
    typography:   type === 'text' || type === 'button' || type === 'input',
    textEdit:     type === 'text',
    fill:         type !== 'icon',
    iconColor:    type === 'icon',
    radius:       type !== 'text' && type !== 'icon',
    border:       type !== 'text' && type !== 'icon',
    shadow:       type === 'container' || type === 'button',
    padding:      type === 'container' || type === 'button' || type === 'input',
    opacity:      true,
  };
}

// ── Diff props ──────────────────────────────────────────────────
const DIFF_PROPS = [
  'backgroundColor','color','borderColor','borderTopWidth','borderStyle',
  'width','height','paddingTop','paddingRight','paddingBottom','paddingLeft',
  'marginTop','marginRight','marginBottom','marginLeft','gap',
  'borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius',
  'opacity','boxShadow','display','flexDirection','justifyContent','alignItems',
];

function toKebab(s: string): string {
  return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

function computeDiff(el: HTMLElement, originalComputed: Record<string, string>): StyleChange[] {
  const changes: StyleChange[] = [];
  const computed = getComputedStyle(el);
  for (const prop of DIFF_PROPS) {
    const original = originalComputed[prop] || '';
    const current = (computed as unknown as Record<string, string>)[prop] || '';
    if (current !== original) {
      changes.push({ property: toKebab(prop), from: original, to: current });
    }
  }
  return changes;
}

function getElementLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
  const text = el.textContent?.trim().slice(0, 20) || '';
  return `<${tag}${cls}>${text ? ` "${text}"` : ''}`;
}

function formatHumanDiff(el: HTMLElement, changes: StyleChange[]): string {
  return [`/* 选中: ${getElementLabel(el)} */`, ...changes.map(c => `${c.property}: ${c.from} → ${c.to}`)].join('\n');
}

function formatCopyText(el: HTMLElement, changes: StyleChange[]): string {
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).map(c => '.' + c).join('') : '';
  const json = JSON.stringify({
    target: { selector: `${tag}${cls}`, textContent: (el.textContent?.trim() || '').slice(0, 50) || undefined },
    changes: changes.map(c => ({ property: c.property, from: c.from, to: c.to })),
  }, null, 2);
  return `我在页面上调整了以下元素的样式，请根据这些变更找到对应的代码并更新：\n\n${json}`;
}

// ── Color helpers ──────────────────────────────────────────────
function rgbToHex(rgb: string): { hex: string; alpha: number } {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return { hex: '#000000', alpha: 0 };
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return { hex: rgb.startsWith('#') ? rgb.slice(0, 7) : '#000000', alpha: 100 };
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
  const a = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 100) : 100;
  return { hex: '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''), alpha: a };
}

function hexAlphaToRgba(hex: string, alpha: number): string {
  const safe = hex.length === 7 && hex.startsWith('#') ? hex : '#000000';
  const r = parseInt(safe.slice(1, 3), 16);
  const g = parseInt(safe.slice(3, 5), 16);
  const b = parseInt(safe.slice(5, 7), 16);
  if (alpha >= 100) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${(alpha / 100).toFixed(2)})`;
}

// ── Shadow helpers ─────────────────────────────────────────────
function parseShadow(shadow: string): ParsedShadow | null {
  if (!shadow || shadow === 'none') return null;
  const inset = shadow.includes('inset');
  const s = shadow.replace('inset', '').trim();
  const colorMatch = s.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})\s*$/);
  const color = colorMatch ? colorMatch[0].trim() : 'rgba(0,0,0,0.25)';
  const numsStr = s.replace(color, '').trim();
  const nums = numsStr.split(/\s+/).filter(Boolean);
  const { hex, alpha } = rgbToHex(color);
  return { inset, x: nums[0] || '0px', y: nums[1] || '0px', blur: nums[2] || '0px', spread: nums[3] || '0px', hex, alpha };
}

function shadowToString(s: ParsedShadow): string {
  return `${s.inset ? 'inset ' : ''}${s.x} ${s.y} ${s.blur} ${s.spread} ${hexAlphaToRgba(s.hex, s.alpha)}`;
}

// ── parseNumeric ───────────────────────────────────────────────
function parseNumeric(v: string): { num: number; unit: string } | null {
  const m = String(v).match(/^(-?[\d.]+)\s*(px|%|em|rem|vw|vh)?$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return null;
  return { num, unit: m[2] || '' };
}

// ── DragNumber ─────────────────────────────────────────────────
function DragNumber({
  label, value, unit = 'px', min, max, step = 1, onChange, style: extraStyle,
}: {
  label: React.ReactNode;
  value: string | number;
  unit?: string;
  min?: number; max?: number; step?: number;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const numStr = String(value);
  const parsed = parseNumeric(numStr);
  const num = parsed?.num ?? 0;
  const displayUnit = parsed?.unit ?? unit;

  const commit = (raw: string) => {
    setEditing(false);
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      let clamped = n;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(displayUnit ? `${clamped}${displayUnit}` : `${clamped}`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editing) return;
    e.preventDefault();
    const startX = e.clientX;
    const startNum = num;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const s = ev.shiftKey ? 0.1 : step;
      let next = startNum + dx * s;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      const rounded = step < 1 ? Math.round(next / step) * step : Math.round(next);
      onChange(displayUnit ? `${rounded}${displayUnit}` : `${rounded}`);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: INPUT_H,
      background: 'var(--sp-field-bg)', borderRadius: 5,
      overflow: 'hidden', flex: 1, minWidth: 0, ...extraStyle,
    }}>
      <span
        onMouseDown={handleMouseDown}
        onDoubleClick={() => { setDraft(String(num)); setEditing(true); requestAnimationFrame(() => inputRef.current?.select()); }}
        style={{
          padding: '0 5px', fontSize: 10, color: 'var(--sp-text-muted)',
          cursor: 'ew-resize', userSelect: 'none', flexShrink: 0,
          borderRight: '1px solid var(--sp-divider)',
          height: '100%', display: 'flex', alignItems: 'center',
        }}
      >{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit(draft);
            if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); }
            if (e.key === 'ArrowUp') { const n = parseFloat(draft) + (e.shiftKey ? 10 : 1); setDraft(String(n)); }
            if (e.key === 'ArrowDown') { const n = parseFloat(draft) - (e.shiftKey ? 10 : 1); setDraft(String(n)); }
          }}
          style={{
            flex: 1, minWidth: 0, height: '100%', background: 'transparent',
            border: 'none', outline: 'none', color: 'var(--sp-text-primary)',
            fontSize: 11, fontFamily: MONO, padding: '0 4px', textAlign: 'right',
          }}
        />
      ) : (
        <span
          onClick={() => { setDraft(String(num)); setEditing(true); requestAnimationFrame(() => inputRef.current?.select()); }}
          style={{
            flex: 1, fontSize: 11, fontFamily: MONO,
            color: 'var(--sp-text-secondary)', cursor: 'text',
            padding: '0 4px', textAlign: 'right',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >{num}{displayUnit}</span>
      )}
    </div>
  );
}

// ── ColorField ─────────────────────────────────────────────────
function ColorField({ hex, alpha, onHexChange, onAlphaChange }: {
  hex: string; alpha: number;
  onHexChange: (h: string) => void;
  onAlphaChange: (a: number) => void;
}) {
  const [editingHex, setEditingHex] = useState(false);
  const [draftHex, setDraftHex] = useState('');
  const nativeRef = useRef<HTMLInputElement>(null);
  const display = hex.replace('#', '').toUpperCase();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      <div
        onClick={(e) => { e.stopPropagation(); nativeRef.current?.click(); }}
        style={{
          width: INPUT_H, height: INPUT_H, borderRadius: 5, flexShrink: 0,
          background: hexAlphaToRgba(hex, alpha),
          border: '1px solid var(--sp-field-border)', cursor: 'pointer',
        }}
      />
      <input
        ref={nativeRef}
        type="color"
        value={hex.length === 7 && hex.startsWith('#') ? hex : '#000000'}
        onChange={e => onHexChange(e.target.value)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      />
      {editingHex ? (
        <input
          autoFocus
          value={draftHex}
          onChange={e => setDraftHex(e.target.value)}
          onBlur={() => {
            setEditingHex(false);
            const h = draftHex.startsWith('#') ? draftHex : '#' + draftHex;
            if (/^#[0-9a-fA-F]{6}$/.test(h)) onHexChange(h);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { e.stopPropagation(); setEditingHex(false); }
          }}
          style={{
            flex: 1, minWidth: 0, height: INPUT_H, background: 'var(--sp-field-bg)',
            border: '1px solid var(--sp-field-border)', borderRadius: 5,
            color: 'var(--sp-text-primary)', fontSize: 11, fontFamily: MONO,
            outline: 'none', padding: '0 4px',
          }}
        />
      ) : (
        <span
          onClick={() => { setDraftHex(display); setEditingHex(true); }}
          style={{
            flex: 1, fontSize: 11, fontFamily: MONO,
            color: 'var(--sp-text-secondary)', cursor: 'text',
          }}
        >{display}</span>
      )}
      <DragNumber
        label="%"
        value={`${alpha}`}
        unit=""
        min={0} max={100} step={1}
        onChange={v => onAlphaChange(parseInt(v) || 0)}
        style={{ width: 52, flex: 'none' }}
      />
    </div>
  );
}

// ── AlignmentMatrix ────────────────────────────────────────────
const MATRIX: [string, string][] = [
  ['flex-start', 'flex-start'], ['center', 'flex-start'], ['flex-end', 'flex-start'],
  ['flex-start', 'center'],     ['center', 'center'],     ['flex-end', 'center'],
  ['flex-start', 'flex-end'],   ['center', 'flex-end'],   ['flex-end', 'flex-end'],
];

function AlignmentMatrix({ justifyContent, alignItems, onChange }: {
  justifyContent: string; alignItems: string;
  onChange: (j: string, a: string) => void;
}) {
  const cell = 25;
  const gap = 3;
  const pad = 4;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(3, ${cell}px)`, gap,
      padding: pad, background: 'var(--sp-field-bg)', borderRadius: 7, flexShrink: 0,
    }}>
      {MATRIX.map(([j, a], i) => {
        const active = justifyContent === j && alignItems === a;
        return (
          <button key={i} onClick={() => onChange(j, a)} style={{
            width: cell, height: cell, border: 'none', borderRadius: 0,
            background: 'transparent',
            cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: active ? 12 : 3, height: active ? 12 : 3, borderRadius: active ? 2 : '50%', background: active ? '#FFFFFF' : 'var(--sp-text-muted)' }} />
          </button>
        );
      })}
    </div>
  );
}

// ── Layout primitives ──────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--sp-divider-soft)', padding: '10px 12px' }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: 'var(--sp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ children, gap = 6 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap, marginBottom: 6 }}>{children}</div>;
}

// ── Padding SVG icons ──────────────────────────────────────────
const PadT = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor"><rect x={1} y={1} width={8} height={1.5} opacity={0.8}/><rect x={3.5} y={3.5} width={3} height={5} opacity={0.3} rx={0.5}/></svg>;
const PadR = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor"><rect x={7.5} y={1} width={1.5} height={8} opacity={0.8}/><rect x={1} y={3.5} width={5} height={3} opacity={0.3} rx={0.5}/></svg>;
const PadB = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor"><rect x={1} y={7.5} width={8} height={1.5} opacity={0.8}/><rect x={3.5} y={1.5} width={3} height={5} opacity={0.3} rx={0.5}/></svg>;
const PadL = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor"><rect x={1} y={1} width={1.5} height={8} opacity={0.8}/><rect x={4} y={3.5} width={5} height={3} opacity={0.3} rx={0.5}/></svg>;
const LayoutRowIcon = () => <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><rect x={1.5} y={4} width={2} height={4} rx={1} fill="currentColor" opacity="0.9"/><rect x={5} y={4} width={2} height={4} rx={1} fill="currentColor" opacity="0.9"/><rect x={8.5} y={4} width={2} height={4} rx={1} fill="currentColor" opacity="0.9"/></svg>;
const LayoutColIcon = () => <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><rect x={4} y={1.5} width={4} height={2} rx={1} fill="currentColor" opacity="0.9"/><rect x={4} y={5} width={4} height={2} rx={1} fill="currentColor" opacity="0.9"/><rect x={4} y={8.5} width={4} height={2} rx={1} fill="currentColor" opacity="0.9"/></svg>;
const OpacityIcon = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M5 1.2 2.4 4.4a3.3 3.3 0 0 0 5.2 4l.1-.1A3.3 3.3 0 0 0 7.6 4.4L5 1.2Z" fill="currentColor" opacity="0.85"/></svg>;
const RadiusIcon = () => <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M2 2h6v6" stroke="currentColor" strokeWidth="1.3" opacity="0.9"/><path d="M2 5a3 3 0 0 1 3-3" stroke="currentColor" strokeWidth="1.3"/></svg>;

// ── Small selects ──────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  height: INPUT_H, fontSize: 10, background: 'var(--sp-field-bg)',
  border: '1px solid var(--sp-field-border)', borderRadius: 5,
  color: 'var(--sp-text-secondary)', padding: '0 3px',
  cursor: 'pointer', outline: 'none', flexShrink: 0,
};

function ModeSelect({
  value,
  onChange,
  style,
}: {
  value: 'fixed'|'auto'|'fill';
  onChange: (v: 'fixed'|'auto'|'fill') => void;
  style?: React.CSSProperties;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as 'fixed'|'auto'|'fill')}
      style={{ ...selectStyle, ...style }}
    >
      <option value="fixed">Fix</option>
      <option value="auto">Hug</option>
      <option value="fill">Fill</option>
    </select>
  );
}

function BorderPositionSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      <option value="inside">内描边</option>
      <option value="outside">外描边</option>
      <option value="center">居中</option>
    </select>
  );
}

function ShadowTypeSelect({ inset, onChange }: { inset: boolean; onChange: (v: boolean) => void }) {
  return (
    <select value={inset ? 'inset' : 'outer'} onChange={e => onChange(e.target.value === 'inset')} style={selectStyle}>
      <option value="outer">外阴影</option>
      <option value="inset">内阴影</option>
    </select>
  );
}

function DirTabs({ value, onChange }: { value: 'row'|'column'; onChange: (v: 'row'|'column') => void }) {
  const btn = (active: boolean): React.CSSProperties => ({
    flex: 1, minWidth: 0, border: 'none', borderRadius: 40,
    padding: '4px 10px', fontSize: 12, lineHeight: '20px',
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--sp-tabs-active-bg)' : 'var(--sp-tabs-bg)',
    color: active ? 'var(--sp-tabs-active-text)' : 'var(--sp-tabs-text)',
    cursor: 'pointer', fontFamily: FONT,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    whiteSpace: 'nowrap', transition: 'background-color 150ms, color 150ms',
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 4, borderRadius: 40, background: 'var(--sp-tabs-bg)', width: '100%', boxSizing: 'border-box' }}>
      <button
        style={btn(value === 'row')} onClick={() => onChange('row')}
        onMouseEnter={e => { if (value !== 'row') { e.currentTarget.style.background = 'var(--sp-tabs-active-bg)'; e.currentTarget.style.color = 'var(--sp-tabs-active-text)'; } }}
        onMouseLeave={e => { if (value !== 'row') { e.currentTarget.style.background = 'var(--sp-tabs-bg)'; e.currentTarget.style.color = 'var(--sp-tabs-text)'; } }}
      ><LayoutRowIcon />横向</button>
      <button
        style={btn(value === 'column')} onClick={() => onChange('column')}
        onMouseEnter={e => { if (value !== 'column') { e.currentTarget.style.background = 'var(--sp-tabs-active-bg)'; e.currentTarget.style.color = 'var(--sp-tabs-active-text)'; } }}
        onMouseLeave={e => { if (value !== 'column') { e.currentTarget.style.background = 'var(--sp-tabs-bg)'; e.currentTarget.style.color = 'var(--sp-tabs-text)'; } }}
      ><LayoutColIcon />纵向</button>
    </div>
  );
}

// ── EffectSection ──────────────────────────────────────────────
function EffectSection<T extends { id: number }>({
  title, items, onAdd, onRemove, renderCard,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  renderCard: (item: T) => React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--sp-divider-soft)', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: items.length > 0 ? 8 : 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--sp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </p>
        <button
          onClick={onAdd}
          style={{
            width: 18, height: 18, border: '1px solid var(--sp-field-border)', borderRadius: 4,
            background: 'transparent', color: 'var(--sp-text-tertiary)', cursor: 'pointer',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
        >+</button>
      </div>
      {items.map((item, idx) => (
        <div key={item.id} style={{ background: 'var(--sp-field-bg)', borderRadius: 7, padding: '8px 8px 6px', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--sp-text-muted)' }}>{title} {idx + 1}</span>
            <button
              onClick={() => onRemove(item.id)}
              style={{ background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: 12, padding: '0 2px' }}
            >✕</button>
          </div>
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}

// ── LayerTree ──────────────────────────────────────────────────
export function getReactComponentName(el: HTMLElement): string | null {
  // React 在 DOM 节点上挂 __reactFiber$xxx，从 fiber 读组件名
  const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
  if (!fiberKey) return null;
  let fiber = (el as unknown as Record<string, unknown>)[fiberKey] as { return?: { type?: { name?: string; displayName?: string }; return?: unknown }; type?: { name?: string; displayName?: string } } | null;
  // 往上找最近的函数/类组件 fiber（跳过 HostComponent）
  while (fiber) {
    const t = fiber.type;
    if (t && typeof t !== 'string') {
      const name = (t as { displayName?: string }).displayName || (t as { name?: string }).name;
      if (name && name !== 'Fragment' && !name.startsWith('_')) return name;
    }
    fiber = fiber.return as typeof fiber;
  }
  return null;
}

function layerLabel(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const reactName = getReactComponentName(el);
  if (reactName) return reactName;
  if (el.id) return `${tag}#${el.id}`;
  const cn = el.className;
  const cls = cn && typeof cn === 'string'
    ? '.' + cn.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
  return cls ? `${tag}${cls}` : tag;
}

function getAncestorChain(el: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = [el];
  const baseArea = el.offsetWidth * el.offsetHeight || 1;
  let cur = el.parentElement;
  let depth = 0;
  while (cur && cur !== document.body && cur !== document.documentElement && depth < 6) {
    chain.unshift(cur);
    depth++;
    // 到达有 id 的元素就停（这是组件边界）
    if (cur.id) break;
    // 面积超过选中元素 4 倍就停（跨出了局部区域）
    const area = cur.offsetWidth * cur.offsetHeight;
    if (area > baseArea * 4) break;
    cur = cur.parentElement;
  }
  return chain;
}

function LayerTree({ element, onSelect }: { element: HTMLElement; onSelect: (el: HTMLElement) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<HTMLElement>>(() => {
    const set = new Set<HTMLElement>();
    // 只展开从 root 到当前元素的路径
    const chain = getAncestorChain(element);
    chain.forEach(el => set.add(el));
    return set;
  });

  const ancestors = getAncestorChain(element);
  const root = ancestors[0] || element;

  const toggleNode = (el: HTMLElement) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(el)) next.delete(el); else next.add(el);
      return next;
    });
  };

  const renderNode = (el: HTMLElement, depth: number): React.ReactNode => {
    const children = Array.from(el.children).filter(c => c instanceof HTMLElement) as HTMLElement[];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(el);
    const isCurrent = el === element;

    return (
      <div key={depth + '-' + layerLabel(el)} style={{ fontSize: 11, fontFamily: MONO }}>
        <div
          onClick={(e) => { e.stopPropagation(); onSelect(el); }}
          onMouseEnter={(e) => {
            if (!isCurrent) e.currentTarget.style.background = 'var(--sp-field-bg)';
            // 页面上预览高亮
            const rect = el.getBoundingClientRect();
            const preview = document.getElementById('layer-preview-highlight');
            if (preview) {
              Object.assign(preview.style, {
                display: '', top: rect.top + 'px', left: rect.left + 'px',
                width: rect.width + 'px', height: rect.height + 'px',
              });
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrent) e.currentTarget.style.background = 'transparent';
            const preview = document.getElementById('layer-preview-highlight');
            if (preview) preview.style.display = 'none';
          }}
          style={{
            padding: '3px 8px',
            paddingLeft: 8 + depth * 14,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            background: isCurrent ? 'rgba(22,100,255,0.16)' : 'transparent',
            color: isCurrent ? '#1664FF' : 'var(--sp-text-secondary)',
            borderRadius: 4,
            transition: 'background 80ms',
          }}
        >
          {hasChildren ? (
            <span
              onClick={(e) => { e.stopPropagation(); toggleNode(el); }}
              style={{ fontSize: 8, width: 10, textAlign: 'center', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
            >{isExpanded ? '▼' : '▶'}</span>
          ) : (
            <span style={{ width: 10, flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {layerLabel(el)}
          </span>
        </div>
        {hasChildren && isExpanded && children.map((child, i) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ borderTop: '1px solid var(--sp-divider)' }}>
      {/* 预览用高亮框（只在 hover 树节点时显示） */}
      {expanded && typeof document !== 'undefined' && (() => {
        let el = document.getElementById('layer-preview-highlight');
        if (!el) {
          el = document.createElement('div');
          el.id = 'layer-preview-highlight';
          el.style.cssText = 'position:fixed;pointer-events:none;border:1px dashed rgba(22,100,255,0.8);background:rgba(22,100,255,0.06);z-index:99997;display:none;transition:top 50ms,left 50ms,width 50ms,height 50ms;';
          document.body.appendChild(el);
        }
        return null;
      })()}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: '8px 12px', border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 500, color: 'var(--sp-text-muted)', fontFamily: FONT,
          transition: 'background 100ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--sp-field-bg)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ fontSize: 8, transition: 'transform 200ms', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        选择图层
      </button>
      {expanded && (
        <div style={{ padding: '0 6px 8px', maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {renderNode(root, 0)}
        </div>
      )}
    </div>
  );
}

// ── FooterButtons ──────────────────────────────────────────────
function FooterButtons({ element, originalComputed, onReset }: { element: HTMLElement; originalComputed: Record<string, string>; onReset: () => void }) {
  const [feedback, setFeedback] = useState<'copy'|'reset'|null>(null);

  const changes = computeDiff(element, originalComputed);
  const has = changes.length > 0;

  const btn = (active: boolean): React.CSSProperties => ({
    flex: 1, height: 32, border: '1px solid var(--sp-field-border)', borderRadius: 40,
    background: 'transparent', color: active ? 'var(--sp-text-secondary)' : 'var(--sp-text-muted)',
    fontSize: 12, lineHeight: '20px', fontWeight: 500, cursor: active ? 'pointer' : 'default',
    fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 100ms',
  });

  const handleReset = useCallback(() => {
    if (!has) return;
    onReset();
    setFeedback('reset');
    setTimeout(() => setFeedback(null), 1500);
  }, [has, onReset]);

  const handleCopy = useCallback(async () => {
    if (!has) return;
    try {
      await navigator.clipboard.writeText(formatCopyText(element, changes));
      setFeedback('copy');
      setTimeout(() => setFeedback(null), 1500);
    } catch { /* ignore */ }
  }, [element, changes, has]);

  return (
    <div style={{ borderTop: '1px solid var(--sp-divider)', padding: '10px 12px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--sp-text-muted)', marginBottom: 6 }}>
        {has ? `${changes.length} 项修改` : '无修改'}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleReset}
          onMouseEnter={e => { if (has) e.currentTarget.style.background = 'var(--sp-hover-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          style={btn(has)}
        >{feedback === 'reset' ? '✓ 已重置' : '重置'}</button>
        <button
          onClick={handleCopy}
          onMouseEnter={e => { if (has) e.currentTarget.style.background = 'var(--sp-hover-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          style={btn(has)}
        >{feedback === 'copy' ? '✓ 已复制' : '复制'}</button>
      </div>
    </div>
  );
}

// ── Typography section helpers ──────────────────────────────
const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'] as const;
const AlignIcon = ({ align }: { align: string }) => {
  const lines = align === 'left' ? [8, 6, 7] : align === 'right' ? [8, 6, 7] : align === 'center' ? [8, 6, 7] : [8, 8, 8];
  const x = align === 'right' ? (w: number) => 10 - w : align === 'center' ? (w: number) => (10 - w) / 2 : () => 0;
  return (
    <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
      {lines.map((w, i) => <rect key={i} x={x(w)} y={1 + i * 3} width={w} height={1.5} rx={0.5} opacity={0.8} />)}
    </svg>
  );
};

const TEXT_DECORATIONS = [
  { value: 'none', label: '—' },
  { value: 'underline', label: 'U̲' },
  { value: 'line-through', label: 'S' },
];

function TypographySection({
  element, apply,
}: {
  element: HTMLElement;
  apply: (prop: string, val: string) => void;
}) {
  const cs = getComputedStyle(element);
  const [fontSize, setFontSize] = useState(() => cs.fontSize || '14px');
  const [fontWeight, setFontWeight] = useState(() => cs.fontWeight || '400');
  const [lineHeight, setLineHeight] = useState(() => cs.lineHeight || 'normal');
  const [letterSpacing, setLetterSpacing] = useState(() => cs.letterSpacing || '0px');
  const [textColor, setTextColor] = useState(() => rgbToHex(cs.color));
  const [textAlign, setTextAlign] = useState(() => cs.textAlign || 'left');
  const [textDecoration, setTextDecoration] = useState(() => {
    const d = cs.textDecorationLine || cs.textDecoration || 'none';
    if (d.includes('underline')) return 'underline';
    if (d.includes('line-through')) return 'line-through';
    return 'none';
  });

  return (
    <Section title="排版">
      {/* 字号 + 字重 */}
      <Row>
        <DragNumber label="字号" value={fontSize} unit="px" min={1} max={200}
          onChange={v => { setFontSize(v); apply('fontSize', v); }} style={{ flex: 1 }} />
        <select
          value={fontWeight}
          onChange={e => { setFontWeight(e.target.value); apply('fontWeight', e.target.value); }}
          style={{ ...selectStyle, flex: 1 }}
        >
          {FONT_WEIGHTS.map(fw => <option key={fw.value} value={fw.value}>{fw.label}</option>)}
        </select>
      </Row>
      {/* 行高 + 字间距 */}
      <Row>
        <DragNumber label="行高" value={lineHeight === 'normal' ? '0' : lineHeight} unit="px" min={0}
          onChange={v => { setLineHeight(v); apply('lineHeight', v); }} style={{ flex: 1 }} />
        <DragNumber label="字距" value={letterSpacing === 'normal' ? '0px' : letterSpacing} unit="px"
          onChange={v => { setLetterSpacing(v); apply('letterSpacing', v); }} style={{ flex: 1 }} />
      </Row>
      {/* 颜色 */}
      <Row>
        <ColorField
          hex={textColor.hex} alpha={textColor.alpha}
          onHexChange={h => { setTextColor(prev => ({ ...prev, hex: h })); apply('color', hexAlphaToRgba(h, textColor.alpha)); }}
          onAlphaChange={a => { setTextColor(prev => ({ ...prev, alpha: a })); apply('color', hexAlphaToRgba(textColor.hex, a)); }}
        />
      </Row>
      {/* 对齐 + 装饰 */}
      <Row>
        <div style={{ display: 'flex', gap: 2, background: 'var(--sp-field-bg)', borderRadius: 5, padding: 2 }}>
          {TEXT_ALIGNS.map(a => (
            <button key={a} onClick={() => { setTextAlign(a); apply('textAlign', a); }}
              style={{
                width: 24, height: 22, border: 'none', borderRadius: 3,
                background: textAlign === a ? 'var(--sp-hover-bg)' : 'transparent',
                color: textAlign === a ? 'var(--sp-text-primary)' : 'var(--sp-text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            ><AlignIcon align={a} /></button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--sp-field-bg)', borderRadius: 5, padding: 2 }}>
          {TEXT_DECORATIONS.map(d => (
            <button key={d.value} onClick={() => { setTextDecoration(d.value); apply('textDecorationLine', d.value); }}
              style={{
                width: 24, height: 22, border: 'none', borderRadius: 3,
                background: textDecoration === d.value ? 'var(--sp-hover-bg)' : 'transparent',
                color: textDecoration === d.value ? 'var(--sp-text-primary)' : 'var(--sp-text-muted)',
                cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{d.label}</button>
          ))}
        </div>
      </Row>
    </Section>
  );
}

// ── TextEditSection ─────────────────────────────────────────
function TextEditSection({ element, onStyleMutate }: { element: HTMLElement; onStyleMutate?: (el: HTMLElement) => void }) {
  const [text, setText] = useState(() => element.textContent || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setText(v);
    element.textContent = v;
    onStyleMutate?.(element);
  };

  return (
    <Section title="文本内容">
      <textarea
        value={text}
        onChange={handleChange}
        rows={Math.min(5, Math.max(2, text.split('\n').length))}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--sp-field-bg)', border: '1px solid var(--sp-field-border)',
          borderRadius: 6, padding: '6px 8px', resize: 'vertical',
          color: 'var(--sp-text-primary)', fontSize: 11, fontFamily: FONT,
          lineHeight: 1.5, outline: 'none',
        }}
        onFocus={e => { e.target.style.borderColor = '#1664FF'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--sp-field-border)'; }}
      />
    </Section>
  );
}

// ── IconColorSection ────────────────────────────────────────
function IconColorSection({ element, apply }: { element: HTMLElement; apply: (prop: string, val: string) => void }) {
  const tag = element.tagName.toLowerCase();
  // SVG 用 fill/stroke，icon font 用 color
  const isSvg = tag === 'svg';

  const getInitialColor = () => {
    if (isSvg) {
      const fill = element.getAttribute('fill');
      if (fill && fill !== 'none' && fill !== 'currentColor') return rgbToHex(fill);
      const stroke = element.getAttribute('stroke');
      if (stroke && stroke !== 'none' && stroke !== 'currentColor') return rgbToHex(stroke);
      // fallback to computed color (currentColor)
    }
    return rgbToHex(getComputedStyle(element).color);
  };

  const [color, setColor] = useState(getInitialColor);

  const handleChange = (hex: string, alpha: number) => {
    const rgba = hexAlphaToRgba(hex, alpha);
    setColor({ hex, alpha });
    if (isSvg) {
      // 检查 SVG 用的是 fill 还是 stroke
      const hasFill = element.getAttribute('fill') && element.getAttribute('fill') !== 'none';
      const hasStroke = element.getAttribute('stroke') && element.getAttribute('stroke') !== 'none';
      if (hasStroke && !hasFill) {
        element.setAttribute('stroke', rgba);
      } else {
        element.setAttribute('fill', rgba);
      }
    } else {
      apply('color', rgba);
    }
  };

  return (
    <Section title="颜色">
      <Row>
        <ColorField
          hex={color.hex} alpha={color.alpha}
          onHexChange={h => handleChange(h, color.alpha)}
          onAlphaChange={a => handleChange(color.hex, a)}
        />
      </Row>
      <Row>
        <DragNumber label="尺寸" value={isSvg ? (element.getAttribute('width') || '24') : getComputedStyle(element).fontSize}
          unit={isSvg ? '' : 'px'} min={1} max={200}
          onChange={v => {
            if (isSvg) { element.setAttribute('width', v); element.setAttribute('height', v); }
            else { apply('fontSize', v); }
          }}
          style={{ flex: 1 }}
        />
      </Row>
    </Section>
  );
}

// ── StylePanel (main) ──────────────────────────────────────────
export default function StylePanel({ element, originalComputed, theme = "dark", onClose, onReset, onSelectElement, onStyleMutate, docked = false }: StylePanelProps) {
  const anchorPos = useAnchorPosition(docked ? null : element);
  const elType = detectElementType(element);
  const sections = getSectionVisibility(elType);
  const isDark = theme === "dark";
  const themeVars = (isDark
    ? {
        "--sp-panel-bg": "rgba(15,18,24,0.80)",
        "--sp-panel-border": "rgba(255,255,255,0.14)",
        "--sp-panel-shadow": "0 14px 38px rgba(0,0,0,0.42)",
        "--sp-text-primary": "rgba(255,255,255,0.9)",
        "--sp-text-secondary": "rgba(255,255,255,0.72)",
        "--sp-text-tertiary": "rgba(255,255,255,0.48)",
        "--sp-text-muted": "rgba(255,255,255,0.36)",
        "--sp-divider": "rgba(255,255,255,0.08)",
        "--sp-divider-soft": "rgba(255,255,255,0.06)",
        "--sp-field-bg": "rgba(255,255,255,0.06)",
        "--sp-field-border": "rgba(255,255,255,0.16)",
        "--sp-hover-bg": "rgba(255,255,255,0.1)",
        "--sp-menu-bg": "rgba(30,33,40,0.96)",
        "--sp-menu-border": "rgba(255,255,255,0.14)",
        "--sp-tabs-bg": "#4F5156",
        "--sp-tabs-text": "#FFFFFF",
        "--sp-tabs-active-bg": "rgba(255,255,255,0.22)",
        "--sp-tabs-active-text": "#FFFFFF",
      }
    : {
        "--sp-panel-bg": "rgba(255,255,255,0.72)",
        "--sp-panel-border": "rgba(0,0,0,0.08)",
        "--sp-panel-shadow": "0 8px 32px rgba(0,0,0,0.08)",
        "--sp-text-primary": "rgba(0,0,0,0.85)",
        "--sp-text-secondary": "rgba(0,0,0,0.65)",
        "--sp-text-tertiary": "rgba(0,0,0,0.40)",
        "--sp-text-muted": "rgba(0,0,0,0.30)",
        "--sp-divider": "rgba(0,0,0,0.08)",
        "--sp-divider-soft": "rgba(0,0,0,0.05)",
        "--sp-field-bg": "rgba(0,0,0,0.04)",
        "--sp-field-border": "rgba(0,0,0,0.14)",
        "--sp-hover-bg": "rgba(0,0,0,0.06)",
        "--sp-menu-bg": "rgba(255,255,255,0.96)",
        "--sp-menu-border": "rgba(0,0,0,0.10)",
        "--sp-tabs-bg": "#F5F5F5",
        "--sp-tabs-text": "rgba(0,0,0,0.55)",
        "--sp-tabs-active-bg": "rgba(0,0,0,0.08)",
        "--sp-tabs-active-text": "rgba(0,0,0,0.85)",
      }) as React.CSSProperties;

  const apply = useCallback((prop: string, val: string) => {
    element.style.setProperty(toKebab(prop), val);
    onStyleMutate?.(element);
  }, [element, onStyleMutate]);

  function readCS() {
    return getComputedStyle(element);
  }

  // ─ Dimensions
  const [width, setWidthState] = useState(() => readCS().width || '0px');
  const [height, setHeightState] = useState(() => readCS().height || '0px');
  const [widthMode, setWidthMode] = useState<'fixed'|'auto'|'fill'>('fixed');
  const [heightMode, setHeightMode] = useState<'fixed'|'auto'|'fill'>('fixed');

  // ─ Auto layout
  const [isFlexEl, setIsFlexEl] = useState(() => {
    const d = readCS().display; return d === 'flex' || d === 'inline-flex';
  });
  const [flexDir, setFlexDir] = useState<'row'|'column'>(() => readCS().flexDirection === 'column' ? 'column' : 'row');
  const [justifyContent, setJustify] = useState(() => readCS().justifyContent || 'flex-start');
  const [alignItems, setAlign] = useState(() => readCS().alignItems || 'flex-start');
  const [gap, setGapState] = useState(() => readCS().gap || '0px');
  const [pt, setPt] = useState(() => readCS().paddingTop || '0px');
  const [pr, setPr] = useState(() => readCS().paddingRight || '0px');
  const [pb, setPb] = useState(() => readCS().paddingBottom || '0px');
  const [pl, setPl] = useState(() => readCS().paddingLeft || '0px');

  // ─ Appearance
  const [opacity, setOpacityState] = useState(() => Math.round(parseFloat(readCS().opacity ?? '1') * 100));
  const [radius, setRadiusTL] = useState(() => readCS().borderTopLeftRadius || '0px');
  const [radiusTR, setRadiusTR] = useState(() => readCS().borderTopRightRadius || '0px');
  const [radiusBR, setRadiusBR] = useState(() => readCS().borderBottomRightRadius || '0px');
  const [radiusBL, setRadiusBL] = useState(() => readCS().borderBottomLeftRadius || '0px');
  const [radiiExpanded, setRadiiExpanded] = useState(false);

  // ─ Fill cards
  const fillIdRef = useRef(2);
  const [fills, setFills] = useState<Array<{hex:string; alpha:number; id:number}>>(() => {
    const c = readCS().backgroundColor;
    if (!c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)') return [];
    const f = rgbToHex(c);
    return f.alpha > 0 ? [{ ...f, id: 1 }] : [];
  });

  // ─ Border cards
  const borderIdRef = useRef(2);
  const [borders, setBorders] = useState<Array<{hex:string; alpha:number; width:string; position:string; id:number}>>(() => {
    const bw = parseFloat(readCS().borderTopWidth) || 0;
    if (bw <= 0) return [];
    return [{ ...rgbToHex(readCS().borderTopColor), width: `${bw}px`, position: 'inside', id: 1 }];
  });

  // ─ Shadow cards
  const shadowIdRef = useRef(2);
  const [shadows, setShadows] = useState<Array<ParsedShadow & {id:number}>>(() => {
    const s = parseShadow(readCS().boxShadow);
    return s ? [{ ...s, id: 1 }] : [];
  });
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Skip first render for apply effects (useState initializers already read from computed,
  // writing back the same values on mount would overwrite a freshly restored cssText snapshot)
  const mountedRef = useRef(false);

  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: panelOffset.x,
      originY: panelOffset.y,
    };

    const onMove = (ev: MouseEvent) => {
      const dragState = dragRef.current;
      if (!dragState) return;
      setPanelOffset({
        x: dragState.originX + (ev.clientX - dragState.startX),
        y: dragState.originY + (ev.clientY - dragState.startY),
      });
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [panelOffset.x, panelOffset.y]);

  // Apply fills → backgroundColor
  useEffect(() => {
    if (!mountedRef.current) return;
    if (fills.length === 0) {
      element.style.setProperty('background-color', 'transparent');
    } else {
      const f = fills[fills.length - 1];
      element.style.setProperty('background-color', hexAlphaToRgba(f.hex, f.alpha));
    }
    onStyleMutate?.(element);
  }, [fills, element, onStyleMutate]);

  // Apply borders
  useEffect(() => {
    if (!mountedRef.current) return;
    if (borders.length === 0) {
      element.style.setProperty('border', 'none');
    } else {
      const b = borders[0];
      element.style.setProperty('border', `${b.width} solid ${hexAlphaToRgba(b.hex, b.alpha)}`);
    }
    onStyleMutate?.(element);
  }, [borders, element, onStyleMutate]);

  // Apply shadows
  useEffect(() => {
    if (!mountedRef.current) return;
    element.style.setProperty('box-shadow', shadows.length === 0 ? 'none' : shadows.map(shadowToString).join(', '));
    onStyleMutate?.(element);
  }, [shadows, element, onStyleMutate]);

  // Mark mounted on next frame to avoid React StrictMode mount re-run writing styles immediately
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      mountedRef.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Write helpers
  const setWidth = (v: string) => { setWidthState(v); apply('width', v); };
  const setHeight = (v: string) => { setHeightState(v); apply('height', v); };

  const handleWidthMode = (m: 'fixed'|'auto'|'fill') => {
    setWidthMode(m);
    if (m === 'auto') { apply('width', 'auto'); setWidthState('auto'); }
    else if (m === 'fill') { apply('width', '100%'); setWidthState('100%'); }
    else {
      const current = readCS().width || '0px';
      apply('width', current);
      setWidthState(current);
    }
  };
  const handleHeightMode = (m: 'fixed'|'auto'|'fill') => {
    setHeightMode(m);
    if (m === 'auto') { apply('height', 'auto'); setHeightState('auto'); }
    else if (m === 'fill') { apply('height', '100%'); setHeightState('100%'); }
    else {
      const current = readCS().height || '0px';
      apply('height', current);
      setHeightState(current);
    }
  };

  const handleFlexDir = (d: 'row'|'column') => { setFlexDir(d); apply('flexDirection', d); };
  const handleAlignment = (j: string, a: string) => {
    setJustify(j); setAlign(a); apply('justifyContent', j); apply('alignItems', a);
  };
  const handleGap = (v: string) => { setGapState(v); apply('gap', v); };
  const handlePad = (side: 'pt'|'pr'|'pb'|'pl', v: string) => {
    const map = { pt: ['paddingTop', setPt], pr: ['paddingRight', setPr], pb: ['paddingBottom', setPb], pl: ['paddingLeft', setPl] } as const;
    apply(map[side][0] as string, v);
    (map[side][1] as React.Dispatch<React.SetStateAction<string>>)(v);
  };

  const handleOpacity = (v: string) => {
    const n = Math.max(0, Math.min(100, parseInt(v) || 0));
    setOpacityState(n); apply('opacity', `${n / 100}`);
  };
  const handleRadiusTL = (v: string) => {
    setRadiusTL(v);
    if (!radiiExpanded) { apply('borderRadius', v); } else { apply('borderTopLeftRadius', v); }
  };
  const handleRadiusSide = (side: 'tr'|'br'|'bl', v: string) => {
    const map = { tr: ['borderTopRightRadius', setRadiusTR], br: ['borderBottomRightRadius', setRadiusBR], bl: ['borderBottomLeftRadius', setRadiusBL] } as const;
    apply(map[side][0] as string, v);
    (map[side][1] as React.Dispatch<React.SetStateAction<string>>)(v);
  };

  const addFill = () => {
    setFills(prev => [...prev, { hex: '#ffffff', alpha: 100, id: fillIdRef.current++ }]);
    setAddMenuOpen(false);
  };
  const addBorder = () => {
    setBorders(prev => [...prev, { hex: '#000000', alpha: 100, width: '1px', position: 'inside', id: borderIdRef.current++ }]);
    setAddMenuOpen(false);
  };
  const addShadow = () => {
    setShadows(prev => [...prev, { inset: false, x: '0px', y: '2px', blur: '4px', spread: '0px', hex: '#000000', alpha: 25, id: shadowIdRef.current++ }]);
    setAddMenuOpen(false);
  };

  const panelNode = (
    <div
      data-editor-ui
      style={{
        ...themeVars,
        position: docked ? 'relative' : 'fixed',
        ...(!docked
          ? (anchorPos
            ? { top: anchorPos.top, left: anchorPos.left }
            : { top: 20, right: 20 })
          : {}),
        width: docked ? '100%' : 300,
        maxHeight: docked ? 'none' : 'calc(100vh - 40px)', overflowY: 'auto',
        zIndex: docked ? 'auto' : 99999,
        ...(!docked ? {
          backgroundColor: 'var(--sp-panel-bg)',
          border: '1px solid var(--sp-panel-border)',
          borderRadius: 12,
          boxShadow: 'var(--sp-panel-shadow)',
          backdropFilter: 'blur(13px) saturate(90%)',
          WebkitBackdropFilter: 'blur(13px) saturate(90%)',
          overflow: 'hidden',
        } : {}),
        fontFamily: FONT, color: 'var(--sp-text-primary)', fontSize: 12,
        scrollbarWidth: 'thin',
        transform: docked ? 'none' : `translate(${panelOffset.x}px, ${panelOffset.y}px)`,
        willChange: docked ? 'auto' : 'transform',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={(e) => {
          if (docked) return;
          handleHeaderMouseDown(e);
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderBottom: '1px solid var(--sp-divider)',
          userSelect: 'none',
          cursor: docked ? 'default' : 'grab',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sp-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          样式
          <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--sp-text-muted)', background: 'var(--sp-field-bg)', padding: '1px 6px', borderRadius: 4 }}>
            {{ text: '文本', image: '图片', icon: '图标', input: '输入框', button: '按钮', container: '容器' }[elType]}
          </span>
        </div>
      </div>

      {/* ── 文本编辑 ── */}
      {sections.textEdit && (
        <TextEditSection element={element} onStyleMutate={onStyleMutate} />
      )}

      {/* ── 排版（文本/按钮/输入框） ── */}
      {sections.typography && (
        <TypographySection element={element} apply={apply} />
      )}

      {/* ── 图标颜色+尺寸 ── */}
      {sections.iconColor && (
        <IconColorSection element={element} apply={apply} />
      )}

      {/* ── 尺寸 ── */}
      {sections.dimensions && (
        <Section title="尺寸">
          <Row>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              {widthMode === 'fixed' ? (
                <>
                  <DragNumber
                    label="W"
                    value={width}
                    unit="px"
                    onChange={setWidth}
                    style={{ borderRadius: '5px 0 0 5px' }}
                  />
                  <ModeSelect
                    value={widthMode}
                    onChange={handleWidthMode}
                    style={{
                      width: 52,
                      border: 'none',
                      borderLeft: '1px solid var(--sp-divider)',
                      borderRadius: '0 5px 5px 0',
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    height: INPUT_H,
                    background: 'var(--sp-field-bg)',
                    borderRadius: 5,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 8,
                      fontSize: 10,
                      color: 'var(--sp-text-muted)',
                      pointerEvents: 'none',
                    }}
                  >
                    W
                  </span>
                  <ModeSelect
                    value={widthMode}
                    onChange={handleWidthMode}
                    style={{
                      flex: 1,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 5,
                      textAlign: 'center',
                      padding: '0 18px',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              {heightMode === 'fixed' ? (
                <>
                  <DragNumber
                    label="H"
                    value={height}
                    unit="px"
                    onChange={setHeight}
                    style={{ borderRadius: '5px 0 0 5px' }}
                  />
                  <ModeSelect
                    value={heightMode}
                    onChange={handleHeightMode}
                    style={{
                      width: 52,
                      border: 'none',
                      borderLeft: '1px solid var(--sp-divider)',
                      borderRadius: '0 5px 5px 0',
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    height: INPUT_H,
                    background: 'var(--sp-field-bg)',
                    borderRadius: 5,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 8,
                      fontSize: 10,
                      color: 'var(--sp-text-muted)',
                      pointerEvents: 'none',
                    }}
                  >
                    H
                  </span>
                  <ModeSelect
                    value={heightMode}
                    onChange={handleHeightMode}
                    style={{
                      flex: 1,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 5,
                      textAlign: 'center',
                      padding: '0 18px',
                    }}
                  />
                </div>
              )}
            </div>
          </Row>
        </Section>
      )}

      {/* ── 自动布局 (flex containers only) ── */}
      {sections.layout && isFlexEl && (
        <Section title="自动布局">
          <Row><DirTabs value={flexDir} onChange={handleFlexDir} /></Row>
          <Row>
            <AlignmentMatrix justifyContent={justifyContent} alignItems={alignItems} onChange={handleAlignment} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <DragNumber label="间距" value={gap} unit="px" onChange={handleGap} style={{ height: INPUT_H, minHeight: INPUT_H, maxHeight: INPUT_H }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                <DragNumber label={<PadT />} value={pt} unit="px" onChange={v => handlePad('pt', v)} style={{ height: INPUT_H, minHeight: INPUT_H, maxHeight: INPUT_H }} />
                <DragNumber label={<PadR />} value={pr} unit="px" onChange={v => handlePad('pr', v)} style={{ height: INPUT_H, minHeight: INPUT_H, maxHeight: INPUT_H }} />
                <DragNumber label={<PadB />} value={pb} unit="px" onChange={v => handlePad('pb', v)} style={{ height: INPUT_H, minHeight: INPUT_H, maxHeight: INPUT_H }} />
                <DragNumber label={<PadL />} value={pl} unit="px" onChange={v => handlePad('pl', v)} style={{ height: INPUT_H, minHeight: INPUT_H, maxHeight: INPUT_H }} />
              </div>
            </div>
          </Row>
        </Section>
      )}

      {/* ── 外观（透明度 + 圆角 + 填充/描边/阴影扁平卡片） ── */}
      <div style={{ borderBottom: '1px solid var(--sp-divider-soft)', padding: '10px 12px', position: 'relative' }}>
        {/* 标题行：外观 + 添加按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--sp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            外观
          </p>
          {(sections.fill || sections.border || sections.shadow) && (
            <button
              onClick={() => setAddMenuOpen(v => !v)}
              style={{
                width: 18, height: 18, border: '1px solid var(--sp-field-border)', borderRadius: 4,
                background: 'transparent', color: 'var(--sp-text-tertiary)', cursor: 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >+</button>
          )}
          {/* 添加下拉菜单 */}
          {addMenuOpen && (
            <div
              onMouseDown={e => e.stopPropagation()}
              style={{
                position: 'absolute', right: 12, top: 30,
                background: 'var(--sp-menu-bg)', border: '1px solid var(--sp-menu-border)',
                borderRadius: 8, padding: 4, boxShadow: 'var(--sp-panel-shadow)', zIndex: 20,
                minWidth: 100,
              }}
            >
              {[
                sections.fill && { key: 'fill', label: '填充', has: fills.length > 0, onClick: addFill },
                sections.border && { key: 'border', label: '描边', has: borders.length > 0, onClick: addBorder },
                sections.shadow && { key: 'shadow', label: '投影', has: shadows.length > 0, onClick: addShadow },
              ].filter(Boolean).map(item => {
                const { key, label, has, onClick } = item as { key: string; label: string; has: boolean; onClick: () => void };
                return (
                  <button key={key} disabled={has} onClick={onClick}
                    style={{
                      width: '100%', height: 26, border: 'none', borderRadius: 4,
                      background: 'transparent',
                      color: has ? 'var(--sp-text-muted)' : 'var(--sp-text-secondary)',
                      fontSize: 11, textAlign: 'left', padding: '0 8px',
                      cursor: has ? 'not-allowed' : 'pointer', fontFamily: FONT,
                    }}
                  >{label}{has ? ' ✓' : ''}</button>
                );
              })}
            </div>
          )}
        </div>

        {/* 透明度 + 圆角 */}
        <Row>
          {sections.opacity && (
            <DragNumber label={<OpacityIcon />} value={`${opacity}`} unit="" min={0} max={100} onChange={handleOpacity} style={{ flex: 1 }} />
          )}
          {sections.radius && (
            <>
              <DragNumber label={<RadiusIcon />} value={radius} unit="px" min={0} onChange={handleRadiusTL} style={{ flex: 1 }} />
              <button
                onClick={() => setRadiiExpanded(v => !v)}
                title="展开四角独立编辑"
                style={{
                  width: 22, height: 22, border: `1px solid ${radiiExpanded ? '#1664FF' : 'var(--sp-field-border)'}`,
                  borderRadius: 4, background: radiiExpanded ? 'rgba(22,100,255,0.16)' : 'transparent',
                  color: 'var(--sp-text-tertiary)', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >⊞</button>
            </>
          )}
        </Row>
        {sections.radius && radiiExpanded && (
          <Row>
            <DragNumber label="↖" value={radius} unit="px" min={0} onChange={handleRadiusTL} />
            <DragNumber label="↗" value={radiusTR} unit="px" min={0} onChange={v => handleRadiusSide('tr', v)} />
            <DragNumber label="↘" value={radiusBR} unit="px" min={0} onChange={v => handleRadiusSide('br', v)} />
            <DragNumber label="↙" value={radiusBL} unit="px" min={0} onChange={v => handleRadiusSide('bl', v)} />
          </Row>
        )}

        {/* 填充卡片 */}
        {sections.fill && fills.map(f => (
          <div key={`fill-${f.id}`} style={{ background: 'var(--sp-field-bg)', borderRadius: 7, padding: '6px 8px', marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--sp-text-muted)' }}>填充</span>
              <button onClick={() => setFills(prev => prev.filter(x => x.id !== f.id))}
                style={{ background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1 }}>✕</button>
            </div>
            <ColorField
              hex={f.hex} alpha={f.alpha}
              onHexChange={hex => setFills(prev => prev.map(x => x.id === f.id ? { ...x, hex } : x))}
              onAlphaChange={alpha => setFills(prev => prev.map(x => x.id === f.id ? { ...x, alpha } : x))}
            />
          </div>
        ))}

        {/* 描边卡片 */}
        {sections.border && borders.map(b => (
          <div key={`border-${b.id}`} style={{ background: 'var(--sp-field-bg)', borderRadius: 7, padding: '6px 8px', marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--sp-text-muted)' }}>描边</span>
              <button onClick={() => setBorders(prev => prev.filter(x => x.id !== b.id))}
                style={{ background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1 }}>✕</button>
            </div>
            <ColorField
              hex={b.hex} alpha={b.alpha}
              onHexChange={hex => setBorders(prev => prev.map(x => x.id === b.id ? { ...x, hex } : x))}
              onAlphaChange={alpha => setBorders(prev => prev.map(x => x.id === b.id ? { ...x, alpha } : x))}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <DragNumber label="宽" value={b.width} unit="px" min={0}
                onChange={width => setBorders(prev => prev.map(x => x.id === b.id ? { ...x, width } : x))} />
              <BorderPositionSelect
                value={b.position}
                onChange={position => setBorders(prev => prev.map(x => x.id === b.id ? { ...x, position } : x))}
              />
            </div>
          </div>
        ))}

        {/* 投影卡片 */}
        {sections.shadow && shadows.map(s => (
          <div key={`shadow-${s.id}`} style={{ background: 'var(--sp-field-bg)', borderRadius: 7, padding: '6px 8px', marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--sp-text-muted)' }}>投影</span>
              <button onClick={() => setShadows(prev => prev.filter(x => x.id !== s.id))}
                style={{ background: 'none', border: 'none', color: 'var(--sp-text-muted)', cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <ColorField
                hex={s.hex} alpha={s.alpha}
                onHexChange={hex => setShadows(prev => prev.map(x => x.id === s.id ? { ...x, hex } : x))}
                onAlphaChange={alpha => setShadows(prev => prev.map(x => x.id === s.id ? { ...x, alpha } : x))}
              />
              <ShadowTypeSelect inset={s.inset} onChange={inset => setShadows(prev => prev.map(x => x.id === s.id ? { ...x, inset } : x))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <DragNumber label="X" value={s.x} unit="px" onChange={x => setShadows(prev => prev.map(sh => sh.id === s.id ? { ...sh, x } : sh))} />
              <DragNumber label="Y" value={s.y} unit="px" onChange={y => setShadows(prev => prev.map(sh => sh.id === s.id ? { ...sh, y } : sh))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <DragNumber label="模糊" value={s.blur} unit="px" min={0} onChange={blur => setShadows(prev => prev.map(sh => sh.id === s.id ? { ...sh, blur } : sh))} />
              <DragNumber label="扩散" value={s.spread} unit="px" onChange={spread => setShadows(prev => prev.map(sh => sh.id === s.id ? { ...sh, spread } : sh))} />
            </div>
          </div>
        ))}
      </div>

      {/* Export footer */}
      <FooterButtons element={element} originalComputed={originalComputed} onReset={() => {
        onReset?.();
      }} />

      {/* Layer tree */}
      {onSelectElement && (
        <LayerTree element={element} onSelect={onSelectElement} />
      )}
    </div>
  );

  if (docked) return panelNode;
  return createPortal(panelNode, document.body);
}

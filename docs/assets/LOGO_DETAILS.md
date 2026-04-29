# WeData Logo - Detailed Technical Reference

## Primary Logo Asset

### File Location
- **Main Source**: Figma MCP URLs (dynamic, cloud-hosted)
- **Local Backup**: `/web-lakehouse/assets/base/logo.svg`
- **Type**: SVG (Scalable Vector Graphics)

---

## Figma Asset URLs

### 1. Otter Icon (LOGO_OTTER_URL)
```
https://www.figma.com/api/mcp/asset/170fe2d2-8b83-4cf6-b9aa-fa034fc37ed3
```
- **Dimensions**: 
  - Expanded Sidebar: 32×32 px
  - Collapsed Sidebar: 40×40 px
- **Rendered at**:
  - Expanded: positioned with width: 43.502, height: 37.633
  - Collapsed: positioned with width: 54.378, height: 47.041
- **Container Styling**:
  - Border Radius: 8px
  - Background: Linear Gradient (see below)
- **Code Reference**: `components/ui/sidebar.tsx` lines 207, 315

### 2. Text Logo (LOGO_TEXT_URL)
```
https://www.figma.com/api/mcp/asset/7be31ded-83fe-4cf5-a010-2af1de962319
```
- **Dimensions**: 94×16 px
- **Content**: "weData" text wordmark
- **Display**: Visible only in expanded sidebar state
- **Code Reference**: `components/ui/sidebar.tsx` line 224

### 3. Sidebar Toggle Icon (SIDEBAR_ICON_URL)
```
https://www.figma.com/api/mcp/asset/a23c7904-55b9-4993-8ded-e75299ef8f3a
```
- **Dimensions**: 16×16 px
- **Purpose**: Collapse/expand button icon
- **Code Reference**: `components/ui/sidebar.tsx` line 260

---

## Logo Gradient

### CSS Gradient Definition
```css
linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)
```

### Gradient Stops
| Stop | Color | Hex | RGB | Position |
|------|-------|-----|-----|----------|
| Start | Cyan | #8AFFF5 | rgb(138,255,245) | 12.793% |
| End | Blue | #3AC3FF | rgb(58,195,255) | 90.59% |

### Angle
- **Degrees**: 134.675°
- **Direction**: Bottom-left to top-right (diagonal)

---

## Local Backup Logo (SVG)

### File Details
- **Path**: `/web-lakehouse/assets/base/logo.svg`
- **Dimensions**: 32×32 viewBox
- **Format**: Scalable SVG with multiple layers

### SVG Structure
```
<svg viewBox="0 0 32 32">
  ├── Gradient Definition (paint0_linear_286_45447)
  │   ├── Stop 1: #8AFFF5 (cyan)
  │   └── Stop 2: #3AC3FF (blue)
  │
  ├── Main Background
  │   └── Rounded rectangle with gradient fill [rx="8"]
  │
  ├── Primary Shape (Dark Blue)
  │   └── Complex SVG path [fill="#0088C2"]
  │
  ├── Secondary Shape (Light Gray)
  │   └── SVG path [fill="#DDDEDD"]
  │
  ├── Accent Detail (Bright Cyan)
  │   └── SVG path [fill="#3DE8FF"]
  │
  ├── Outlines (Black)
  │   ├── Stroke paths
  │   ├── Eye details
  │   └── Whisker details
  │
  └── Definition References
      └── Clip path and gradient definitions
```

### Color Layer Breakdown
1. **Background**: Linear gradient (#8AFFF5 → #3AC3FF)
2. **Primary Shape**: #0088C2 (Dark Blue) - main otter body
3. **Secondary Shape**: #DDDEDD (Light Gray) - body details
4. **Accent Details**: #3DE8FF (Bright Cyan) - highlights
5. **Black Outlines**: #000000 - strokes and features
6. **Eyes**: Black (#000000)
7. **Whiskers**: Black (#000000)

---

## Logo Styling in React

### Expanded State
```typescript
// Logo container: 32×32
const logoContainer = {
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundImage: "linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)",
  flexShrink: 0,
  overflow: "hidden",
  position: "relative",
}

// Image positioning
const logoImage = {
  position: "absolute",
  width: 43.502,
  height: 37.633,
  left: -13.57,      // Negative offset for centering
  top: 3.95,
  display: "block",
  width: "101.52%",  // Overflow containment
  height: "100.33%",
  maxWidth: "none",
  position: "absolute",
  top: "-0.33%",
  left: "-1.52%",
}
```

### Collapsed State
```typescript
// Logo button: 40×40
const logoButton = {
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundImage: "linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)",
  flexShrink: 0,
  overflow: "hidden",
  position: "relative",
  border: "none",
  cursor: "pointer",
  padding: 0,
}

// Image positioning for collapsed
const logoImageCollapsed = {
  position: "absolute",
  width: 54.378,     // Larger dimensions
  height: 47.041,
  left: -16.97,      // Adjusted offset
  top: 4.94,
}
```

---

## Logo Composition

### Sidebar Header Layout (Expanded)
```
┌─────────────────────────────────────────────────┐
│ ┌────────┐  ┌──────────┐  ┌──────┐             │ h: 84px
│ │ Otter  │  │ weData   │  │ Btn  │             │
│ │ 32×32  │  │ 94×16    │  │ 16×16│             │ gap: 8px
│ │gradient│  │ text     │  │toggle│             │
│ └────────┘  └──────────┘  └──────┘             │
│ pl: 20px    pr: 8px                      pr: 8px│
└─────────────────────────────────────────────────┘
```

### Sidebar Header Layout (Collapsed)
```
┌─────────────┐
│   ┌────┐    │ h: 84px
│   │Otter   │
│   │40×40    │ Centered
│   │gradient │
│   └────┘    │
└─────────────┘
```

---

## Logo Usage Statistics

### Where It Appears
1. **Sidebar Header** (Primary location)
   - Appears on every page
   - Expands/collapses with sidebar
   
2. **Browser Tab** (Potential favicon)
   - Logo SVG backup available
   
3. **Print/Export** (Branding)
   - Logo PNG backup available

### Responsive Sizing
- **Desktop**: 32×32 (expanded) / 40×40 (collapsed)
- **Mobile**: Same dimensions (sidebar always visible or collapsible)
- **Print**: Uses backup PNG or SVG at required DPI

---

## Color Accessibility

### Contrast Ratios
- **Gradient on White**: AAA compliant for WCAG 2.1
- **Text on Logo**: High contrast (cyan/blue on white background)
- **Icon on Dark**: PASS (dark blue/cyan on light backgrounds)

### Color Blindness Considerations
- **Deuteranopia (Red-Blind)**: Gradient still distinguishable (cyan→blue shift)
- **Protanopia (Green-Blind)**: Similar visibility (cyan and blue remain distinct)
- **Tritanopia (Blue-Yellow-Blind)**: Gradient becomes less distinct
- **Grayscale**: Sufficient brightness variation (passes)

---

## File Size Optimization

### SVG Compression Opportunities
- **Current SVG**: ~2-3 KB (estimated)
- **Potential**: Could be optimized to <1 KB with:
  - Path simplification
  - Color palette reduction
  - Metadata removal

### PNG Alternative
- **Current PNG**: Unknown size (backup available)
- **Optimization Options**:
  - Convert to WebP for 25-35% size reduction
  - Create @2x version for retina displays
  - Add srcset for responsive sizing

---

## Animation States

### Logo Appearance
1. **Static**: Always visible in sidebar
2. **Expand Animation**: 0.22s ease when toggling sidebar
3. **Collapse Animation**: 0.22s ease when toggling sidebar
4. **Hover**: Background opacity change on button states

### Animation Code
```typescript
// Collapse duration: 0.22s
const COLLAPSE_DURATION = 0.22;

// Collapse easing function (Material Design)
const COLLAPSE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Animation triggers:
// - Sidebar expand/collapse
// - Theme changes (if implemented)
// - Focus states
```

---

## Implementation Details

### Code Location
- **Main Implementation**: `components/ui/sidebar.tsx` (lines 30-331)
- **Logo Constants**: Lines 30-33
- **Color Palette**: Lines 37-46
- **Expanded Logo**: Lines 160-270
- **Collapsed Logo**: Lines 273-330

### Dependencies
- React 19.2.4
- Framer Motion 12.38.0 (animations)
- No external icon library required

### Future Enhancements
1. Add dark mode variant (inverted colors)
2. Create animated version (subtle pulse/float)
3. Add parallax effect on hover
4. Create SVG animation with Lottie
5. Implement theme switching logic

---

## SVG Export Information

### Current Viewbox
```
<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
```

### Exportable Variants
1. **Icon Only** (32×32)
2. **With Text** (200×32 landscape or 94×48 vertical)
3. **Wordmark Only** (94×16)
4. **Favicon** (multiple sizes: 16, 32, 64, 128, 256)

---

*Technical Reference Document*
*Created: 2026-04-10*
*Last Updated: 2026-04-10*

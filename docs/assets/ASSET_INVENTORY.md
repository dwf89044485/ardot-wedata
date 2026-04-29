# WeData Logo & Icon Assets Inventory

## Summary
Comprehensive inventory of logo, icon, and image assets found in the WeData repository as of 2026-04-10.

---

## 1. Figma Asset URLs (Dynamic References)

Located in: `components/ui/sidebar.tsx` (lines 30-33)

These are Figma MCP asset URLs that load dynamically from Figma cloud:

```typescript
const LOGO_OTTER_URL   = "https://www.figma.com/api/mcp/asset/170fe2d2-8b83-4cf6-b9aa-fa034fc37ed3";
const LOGO_TEXT_URL    = "https://www.figma.com/api/mcp/asset/7be31ded-83fe-4cf5-a010-2af1de962319";
const SIDEBAR_ICON_URL = "https://www.figma.com/api/mcp/asset/a23c7904-55b9-4993-8ded-e75299ef8f3a";
```

### Asset Details:
- **LOGO_OTTER_URL**: Otter mascot icon (32×32 in expanded sidebar, 40×40 in collapsed)
  - Source: Figma node 2029:60827
  - Used in: `components/ui/sidebar.tsx` lines 207, 315
  - Context: Logo area of sidebar (top left)

- **LOGO_TEXT_URL**: "weData" text logo (94×16)
  - Source: Figma node 2029:60827
  - Used in: `components/ui/sidebar.tsx` line 224
  - Context: Displayed next to otter icon in expanded sidebar

- **SIDEBAR_ICON_URL**: Sidebar collapse/expand toggle icon (16×16)
  - Source: Figma node 2029:60827
  - Used in: `components/ui/sidebar.tsx` line 260
  - Context: Toggle button in logo area

### Logo Styling:
- **Gradient**: `linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)`
- Colors: Cyan (#8AFFF5) → Blue (#3AC3FF)
- Border Radius: 8px
- Font: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

---

## 2. Local SVG Assets

### Location: `/public/` directory

#### SVG Files:
| File | Size | Purpose | Status |
|------|------|---------|--------|
| `public/file.svg` | 391 bytes | Generic file icon | Active |
| `public/globe.svg` | 1035 bytes | Globe/world icon | Active |
| `public/window.svg` | 385 bytes | Window/frame icon | Active |
| `public/next.svg` | 1375 bytes | Next.js logo | Demo/unused |
| `public/vercel.svg` | 128 bytes | Vercel logo | Demo/unused |

---

## 3. Icon Assets

### Location: `/public/icons/` directory

**Skill icons** (referenced in `app/page.tsx`):
- `skill-model.png` - ML Model icon
- `skill-query.png` - Query/Search icon
- `skill-star.png` - Star/Featured icon
- `skill-troubleshoot.png` - Troubleshooting icon

---

## 4. Agent Avatar Assets

### Location: `/public/agents/` directory

**Agent character images**:
- `1a.png` - Rigel character (default agent)
- `1b.png`, `2a.png`, `2b.png`, `3a.png`, `3b.png`, `4a.png`, `4b.png`
- `altair.png`, `rigel.png`, `sirius.png`, `vega.png`
- `avatar-char.png`, `math-bg.png`

**Usage in code** (`app/page.tsx`):
```typescript
avatar: "/agents/1a.png" // Used for Rigel (default)
```

---

## 5. Base Logo Assets

### Location: `/web-lakehouse/assets/base/` directory

#### `logo.svg` (32×32)
- **Full path**: `/web-lakehouse/assets/base/logo.svg`
- **Dimensions**: 32×32 viewBox
- **Type**: Complete otter mascot logo with gradient background
- **Colors**:
  - Background: Linear gradient (#8AFFF5 → #3AC3FF)
  - Primary shape: #0088C2 (dark blue)
  - Accent: #3DE8FF (bright cyan)
  - Detail: #DDDEDD (light gray)
  - Outline: Black (#000000)
- **Features**: Rounded corners, complex SVG paths for otter, eyes, whiskers, color layers

#### `logo.png`
- **Full path**: `/web-lakehouse/assets/base/logo.png`
- **Type**: Raster version of SVG logo

#### `upgrade.svg`
- **Full path**: `/web-lakehouse/assets/base/upgrade.svg`
- **Purpose**: Upgrade promotion icon

---

## 6. Other Asset Directories

### Location: `/web-lakehouse/assets/` structure

```
/web-lakehouse/assets/
├── base/                      # Main logos & upgrades
│   ├── logo.png
│   ├── logo.svg
│   └── upgrade.svg
│
├── CodeBubbyAssets/           # Code character animations (14 SVGs)
│   └── 454_116797/
│       └── 1.svg through 14.svg
│
├── dashboard/                 # Dashboard UI icons
│   ├── comp-bg.svg
│   ├── dashboard-empty.svg
│   ├── empty-favorite.svg
│   ├── empty-filter.svg
│   ├── error-visual.svg
│   ├── noDataShare.svg
│   └── upgrade.svg
│
└── test/                      # Test assets
    └── empty-133332.svg
```

---

## 7. Icon System

### Component-Based Icons

Located in: `components/ui/wedata-icons.tsx` (imported in multiple files)

**Icons in Sidebar**:
IconDataClaw, IconIngestData, IconCatalog, IconStudio, IconPin, IconWorkflow, 
IconOps, IconSQL, IconDashboard, IconChatBI, IconMLExp, IconFeature, 
IconModelReg, IconModelSvc, IconAgents, IconApps, IconPlatform, 
IconDataSource, IconCompute, IconGovernance, IconWorkspace, IconSidebarToggle

**Icon Styling**:
- Default color: `rgba(0,0,0,0.7)` (dark gray)
- Active color: `rgba(0,0,0,0.9)` (darker)
- Tertiary color: `rgba(0,0,0,0.5)` (light gray)
- Size: Typically 16px (menu) or 14px (skill labels)

---

## 8. Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | #8AFFF5 | Logo gradient start, accents |
| Blue | #3AC3FF | Logo gradient end |
| Dark Blue | #0088C2 | Logo primary shape |
| Bright Cyan | #3DE8FF | Logo details, accents |

### Neutral Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Light Gray | #DDDEDD | Logo details, backgrounds |
| Black | #000000 | Outlines, text |
| Dark Gray | #F5F6F8 | Sidebar background |
| Medium Gray | #E1E5ED | Active item background |

### Agent Name Colors (from `app/page.tsx`)
| Agent | Color | Hex |
|-------|-------|-----|
| Rigel | Blue | #2873FF |
| Vega | Teal | #00BBA2 |
| Orion | Orange | #CC6B3A |
| Nova | Purple | #934BFF |

---

## 9. Typography & Fonts

### Primary Font Stack
```
'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Font Sizes
- Logo text: 16px (estimated from 94×16 dimensions)
- Menu labels: 14px (expanded), 10px (collapsed)
- Section headers: 12px
- Body text: 14px

---

## 10. File Structure Diagram

```
/Users/josephdeng/Documents/wedata/
├── public/                          # Next.js public assets
│   ├── agents/                      # Agent character PNGs (14 files)
│   ├── icons/                       # Skill icons (4 PNGs)
│   ├── file.svg
│   ├── globe.svg
│   ├── window.svg
│   ├── next.svg
│   └── vercel.svg
│
├── components/ui/
│   ├── sidebar.tsx                  # Logo references + Figma URLs
│   ├── wedata-icons.tsx             # Icon system
│   └── [other UI components]
│
├── app/
│   ├── page.tsx                     # Main app using agent avatars
│   └── [other app files]
│
└── web-lakehouse/
    └── assets/
        ├── base/                    # Base logos
        │   ├── logo.svg             # Main logo (32×32)
        │   ├── logo.png
        │   └── upgrade.svg
        ├── dashboard/               # Dashboard icons
        ├── CodeBubbyAssets/         # Animation assets
        └── test/                    # Test assets
```

---

## 11. Summary Statistics

- **Total Asset Files**: ~70+ files
- **Formats**: SVG, PNG, Figma URLs
- **Local SVG Files**: 28+ SVGs
- **PNG Files**: 18+ PNGs
- **Dynamic Assets**: 3 Figma MCP URLs
- **Icon Components**: 22+ React components

---

*Last Updated: 2026-04-10*

# WeData Repository - Asset & Logo Documentation

Complete documentation of all logo, icon, and image assets in the WeData project.

---

## 📚 Documentation Files

### 1. **ASSET_INVENTORY.md** (Main Inventory)
Comprehensive catalog of all assets including:
- Figma MCP asset URLs with detailed descriptions
- Local SVG and PNG file listings
- Agent avatar inventory
- Color palette reference
- Typography and font stack
- Usage statistics

**Start here for:** Overall asset overview and locations

### 2. **ASSETS_TREE.txt** (Directory Structure)
Complete file tree of all assets with:
- Full directory hierarchy
- File descriptions and sizes
- Asset categorization
- Code location references
- Color reference tables
- Key code references

**Start here for:** Finding specific asset files or understanding directory structure

### 3. **LOGO_DETAILS.md** (Technical Reference)
In-depth technical documentation:
- Figma asset URLs with specifications
- Gradient definitions and color values
- React styling implementation
- Animation details
- Accessibility information
- Optimization recommendations

**Start here for:** Technical implementation details, styling, or logo modifications

---

## 🎨 Quick Asset Reference

### Main Logo
```
Figma MCP URLs:
├─ Otter Icon: https://www.figma.com/api/mcp/asset/170fe2d2-8b83-4cf6-b9aa-fa034fc37ed3
├─ Text Logo: https://www.figma.com/api/mcp/asset/7be31ded-83fe-4cf5-a010-2af1de962319
└─ Toggle Icon: https://www.figma.com/api/mcp/asset/a23c7904-55b9-4993-8ded-e75299ef8f3a

Local Backup:
└─ /web-lakehouse/assets/base/logo.svg (32×32)
```

### Key Colors
```
Logo Gradient:
  Start: #8AFFF5 (Cyan)
  End:   #3AC3FF (Blue)
  Angle: 134.675°

UI Colors:
  Sidebar BG:      #F5F6F8
  Active Item:     #E1E5ED
  Hover Item:      #ECEEF2
  Text Primary:    rgba(0,0,0,0.9)
  Icon Default:    rgba(0,0,0,0.7)
```

### Asset Locations
```
/public/
├── agents/        → Agent avatars (14 PNG files)
├── icons/         → Skill icons (4 PNG files)
└── *.svg          → Utility icons (5 SVG files)

/web-lakehouse/assets/
├── base/          → Main logos (logo.svg, logo.png)
├── dashboard/     → Dashboard icons (7 SVG files)
└── CodeBubbyAssets/ → Animation frames (14 SVG files)
```

---

## 🔍 Finding Specific Assets

### By Usage
| Use Case | File | Location |
|----------|------|----------|
| Sidebar Logo | Figma MCP URLs | `components/ui/sidebar.tsx` lines 30-33 |
| Agent Avatars | PNG files | `/public/agents/` |
| Menu Icons | React Components | `components/ui/wedata-icons.tsx` |
| Dashboard Bg | SVG | `/web-lakehouse/assets/dashboard/` |
| Favicon | SVG/PNG | `/web-lakehouse/assets/base/logo.svg` |

### By File Type
| Type | Count | Locations |
|------|-------|-----------|
| SVG | 28+ | `/public/`, `/web-lakehouse/assets/` |
| PNG | 18+ | `/public/agents/`, `/public/icons/` |
| Figma URLs | 3 | `components/ui/sidebar.tsx` |
| React Icons | 22+ | `components/ui/wedata-icons.tsx` |

---

## 🛠️ Implementation Examples

### Using the Logo in Code
```typescript
// Already implemented in components/ui/sidebar.tsx
const LOGO_OTTER_URL = "https://www.figma.com/api/mcp/asset/170fe2d2-8b83-4cf6-b9aa-fa034fc37ed3";

// Render with gradient background
<img src={LOGO_OTTER_URL} style={{
  backgroundImage: "linear-gradient(134.675deg, rgb(138,255,245) 12.793%, rgb(58,195,255) 90.59%)",
}} />
```

### Using Agent Avatars
```typescript
// From app/page.tsx
import agent1 from "/agents/1a.png";

<img src="/agents/1a.png" alt="Rigel" />
```

### Using Icon System
```typescript
// From components/ui/sidebar.tsx
import { IconDataClaw, IconWorkflow, IconSQL } from "@/components/ui/wedata-icons";

<IconDataClaw size={16} color={C.iconDefault} />
```

---

## 📊 Statistics

- **Total Assets**: 70+ files
- **SVG Files**: 28+
- **PNG Files**: 18+
- **Figma MCP URLs**: 3
- **React Icon Components**: 22+
- **Total Size**: ~5-10 MB (mostly agent avatars)

---

## 🎯 Quick Answers

### Q: Where is the main logo?
**A:** Figma MCP URLs in `components/ui/sidebar.tsx` with local backup at `/web-lakehouse/assets/base/logo.svg`

### Q: What's the logo gradient?
**A:** `linear-gradient(134.675deg, #8AFFF5 12.793%, #3AC3FF 90.59%)`

### Q: Where are agent avatars?
**A:** `/public/agents/` directory (14 PNG files)

### Q: How do I add a new icon?
**A:** Add to `components/ui/wedata-icons.tsx` or place in `/public/icons/`

### Q: What font is used?
**A:** 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI'

### Q: Are there dark mode assets?
**A:** Yes, in `/web-lakehouse/packages/web-ide/src/assets/icons/catalog/dark/` (16 SVG files)

---

## 🔗 Related Documentation

- [ASSET_INVENTORY.md](./ASSET_INVENTORY.md) - Complete asset inventory
- [ASSETS_TREE.txt](./ASSETS_TREE.txt) - Directory structure
- [LOGO_DETAILS.md](./LOGO_DETAILS.md) - Technical logo reference
- `components/ui/sidebar.tsx` - Logo implementation
- `app/page.tsx` - Avatar and icon usage
- `components/ui/wedata-icons.tsx` - Icon components

---

## 📝 Notes

- All Figma assets are cloud-hosted and require internet connectivity
- Local backups are available in `/web-lakehouse/assets/base/`
- PNG files should be optimized for web (consider WebP conversion)
- Icon components are React-based and sized at 16px or 14px
- Color palette is consistent across all UI components

---

## 🚀 Recommended Next Steps

1. **Download Figma assets locally**: Cache the 3 Figma MCP URLs for offline use
2. **Optimize PNG files**: Convert agent avatars to WebP for better performance
3. **Create favicon**: Use `logo.svg` as favicon with multiple sizes
4. **Add dark mode**: Create dark variants of the logo gradient
5. **Document usage**: Add logo usage guidelines to brand guidelines doc

---

**Last Updated**: 2026-04-10  
**Total Documentation Files**: 4  
**Created by**: Automated Asset Inventory System

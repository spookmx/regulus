# eBay Design System (Evo & Skin) Guidelines for Regulus

This document defines the visual standards, component patterns, token architecture, and interaction rules for **Regulus** adapted to eBay's **Evo** brand system and **Skin** CSS framework as specified in [playbook.ebay.com/design-system/components](https://playbook.ebay.com/design-system/components). All UI features, components, and interactions added to Regulus **must** adhere to these guidelines.

---

## 1. Design Philosophy & Brand Foundations

eBay's design ecosystem is built around **Evo** (brand identity & UX principles) and **Skin** (the CSS framework implementing Evo).

- **Brand Voice**: Real, Smart, Spirited, Dependable.
- **Visual Aesthetic**: Clean, structured, accessible, and responsive. Surfaces use clean elevation layers and subtle 1px borders rather than heavy glow or obscure glassmorphism.
- **Typography**: Clean geometric typography (Market Sans or fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Geometry & Radius**:
  - Cards & Panels: `12px` to `16px` (`rounded-xl` / `rounded-2xl`).
  - Input fields & Small Controls: `8px` (`rounded-lg`).
  - Badges, Chips, Pills & Primary Action Buttons: Full capsule radius (`9999px` / `rounded-full`).

---

## 2. Color System & Light/Dark Theme Tokens

Regulus uses eBay Skin CSS Custom Properties for dual-theme compatibility (Light Mode and Dark Mode). **Never hardcode hex colors for surfaces, text, or borders.** Always use semantic design tokens.

### Theme Tokens Mapping

| Semantic Purpose | Light Mode Value | Dark Mode Value | CSS Variable |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#ffffff` | `#0e1217` | `var(--color-background-primary)` |
| **Secondary Background** | `#f7f7f7` | `#181e26` | `var(--color-background-secondary)` |
| **Card / Surface BG** | `#ffffff` | `#1c232d` | `var(--color-background-tertiary)` |
| **Primary Text** | `#111827` | `#f3f4f6` | `var(--color-foreground-primary)` |
| **Secondary / Muted Text**| `#6b7280` | `#9ca3af` | `var(--color-foreground-secondary)` |
| **Subtle Border** | `#e5e7eb` | `#2d3748` | `var(--color-border-subtle)` |
| **Strong Border** | `#d1d5db` | `#4a5568` | `var(--color-border-strong)` |
| **Accent / Action Blue** | `#3665f3` | `#4c7cf6` | `var(--color-accent-blue)` |

### Status Badges Color Matrix

- **Success / Approved**: Light BG `#e6f4ea` / Text `#137333` | Dark BG `#133924` / Text `#81c995`
- **Warning / Pending**: Light BG `#fef7e0` / Text `#b06000` | Dark BG `#3c2e00` / Text `#fdd663`
- **Attention / High Risk**: Light BG `#fce8e6` / Text `#c5221f` | Dark BG `#3c1918` / Text `#f28b82`
- **Info / In Progress**: Light BG `#e8f0fe` / Text `#1a73e8` | Dark BG `#1a355d` / Text `#8ab4f8`

---

## 3. Playbook Component Specifications (playbook.ebay.com/design-system/components)

### 3.1 Accordion & Expansion
- Clean collapsible panels for grouping regulatory artifacts or decision details.
- Header contains title, status pill, and a smooth rotating chevron icon.
- Border: `1px solid var(--color-border-subtle)`.

### 3.2 Action Bar
- Sticky bottom or top container for batch operations (e.g. "Approve Selected LRDs", "Sign All Decisions").
- Elevated surface (`shadow-lg`) with primary action buttons aligned right.

### 3.3 Alert Notices (Inline, Section, Page)
- **Page Notice**: Full-width top banner for system-wide notices or engine alerts.
- **Section Notice**: Embedded box for section-level compliance alerts.
- **Inline Notice**: Compact row alert next to actionable items.
- Variants:
  - *Success* (Green icon & subtle background)
  - *Notice / Info* (Blue icon & background)
  - *Warning* (Amber icon & background)
  - *Error / Attention* (Red icon & background)

### 3.4 Avatar & Signal
- Circular avatar with initials or role icon.
- Integrated status signal badge (green dot for active, amber for pending review).

### 3.5 Badges, Chips & Pills (Filter & Input Chips)
- Shape: Full capsule radius (`rounded-full px-3 py-1 text-xs font-semibold`).
- Filter Chips: Interactive toggleable pills for filtering artifact types (BRD, PRD, LRD, ADR).
- Input Chips: Removable tag pills inside search inputs.

### 3.6 Buttons (CTA, Primary, Secondary, Icon, Link, Segmented)
- **CTA Button**: Bold solid accent blue (`bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold shadow-md`).
- **Primary Button**: Solid action blue (`bg-blue-600 text-white rounded-full px-5 py-2.5 font-medium hover:bg-blue-700`).
- **Secondary Button**: Outlined button (`border border-ebay-border text-ebay-fg-primary hover:bg-ebay-bg-secondary rounded-full px-5 py-2.5`).
- **Icon Button**: Circular or 8px rounded touch target (`hover:bg-ebay-bg-secondary p-2 rounded-lg text-ebay-fg-secondary`).
- **Segmented / Toggle Button Group**: Horizontal pill group for switching view modes (e.g., *Matrix View* vs *Graph View*).

### 3.7 Cards & Media Containers
- Radius: `12px` to `16px`.
- Background: `bg-ebay-bg-card`.
- Border: `1px solid var(--color-border-subtle)`.
- Interactive state: Hover shadow (`shadow-md`) and subtle border color transition (`border-blue-500/40`).

### 3.8 Dialogs & Side Sheets (Alert, Confirmation, Focus Sheet, Context Sheet)
- **Standard Dialog**: Centered modal overlay for sign-off confirmations and RBAC actions.
- **Context Sheet**: Slide-over drawer from the right side for inspecting detailed regulatory documents without leaving the dashboard context.

### 3.9 Divider & Section Header
- 1px thin separator (`var(--color-border-subtle)`).
- Section headers with clear typography scale and optional subtext or accessory action button.

### 3.10 Form Inputs & Controls (Text Field, Search, Dropdown, Checkbox, Radio, Switch, Textarea)
- Input surface: `bg-ebay-bg-primary border border-ebay-border rounded-lg px-3 py-2 text-sm text-ebay-fg-primary`.
- Focus state: High contrast outline ring (`focus:ring-2 focus:ring-blue-500 focus:border-transparent`).
- Switch: Rounded toggle pill for boolean controls.

### 3.11 Loading & Skeleton Loaders
- Pulse placeholder blocks (`animate-pulse bg-ebay-bg-secondary rounded-lg`) that mimic content layouts during multi-agent AI execution.

### 3.12 Navigation & Top Navigation Bar
- Persistent top bar:
  - Left: Regulus product brand mark.
  - Center: Horizontal navigation links with active underline/background indicators.
  - Right: Global Search input, Theme Switcher button (Sun/Moon), and User RBAC selector.
- Breadcrumbs & Progress Steppers for multi-step regulatory workflows.

### 3.13 Data Tables & Metrics
- **Metrics Cards**: Large bold metric stat number (`text-3xl font-extrabold text-ebay-fg-primary`), trend badges (+X%), and descriptive labels.
- **Tables**: Clean header text (`text-xs font-semibold uppercase text-ebay-fg-secondary tracking-wider`), hoverable rows (`hover:bg-ebay-bg-secondary/60`), and embedded status badges.

---

## 4. Guidelines for Future UI Additions & Interactions

When asked to add new features, pages, or components to Regulus in the future, follow these strict rules:

1. **Bipolar Testing**: Every new layout or component **must** work seamlessly in both Light Mode and Dark Mode. Test text contrast in both modes.
2. **Token Compliance**: Use Tailwind CSS utilities mapped to eBay variables (`bg-ebay-bg-primary`, `text-ebay-fg-primary`, `border-ebay-border`, `bg-ebay-bg-secondary`) instead of hardcoded tailwind colors (like `bg-slate-950` or `text-cyan-400`).
3. **Pill Badges for Metadata**: Use rounded pill tags (`rounded-full px-2.5 py-0.5 text-xs font-medium`) for tags, statuses, roles, and categories.
4. **Accessible Micro-interactions**: Hover effects should be subtle and smooth (`transition-all duration-150 ease-in-out`). Focus rings must use high contrast focus outlines (`focus:ring-2 focus:ring-blue-500`).
5. **Responsive Grid**: Use the standard 12-column dynamic grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) for dashboard cards and metric panels.

# Design System

This document outlines the design system for the RAG Document Intelligence application, including color tokens, typography, spacing, components, and usage guidelines.

---

## 🎨 Color System

### CSS Custom Properties

All colors are defined using CSS custom properties (CSS variables) for consistent theming and dark mode support.

```css
--foreground       /* Primary text color */
--background       /* Page background */
--surface          /* Card/surface background */
--border           /* Border color */
--muted            /* Secondary/muted text */
--accent           /* Primary brand color (blue) */
--accent-hover     /* Accent hover state */
--error            /* Error state color (red) */
--error-bg         /* Error background (light red) */
--error-border     /* Error border (medium red) */
--success          /* Success state color (green) */
--success-bg       /* Success background (light green) */
--success-border   /* Success border (medium green) */
```

### Usage

```tsx
// ✅ DO: Use CSS variables
<div className="text-[var(--foreground)] bg-[var(--surface)]">

// ❌ DON'T: Hardcode colors
<div className="text-gray-900 bg-white">
```

---

## 📐 Spacing & Layout

### Border Radius

Standardized border radius values are available via the `BORDER_RADIUS` constant:

```typescript
import { BORDER_RADIUS } from "@/config/constants";

BORDER_RADIUS.sm    // rounded-lg (0.5rem / 8px)
BORDER_RADIUS.md    // rounded-xl (0.75rem / 12px)
BORDER_RADIUS.lg    // rounded-2xl (1rem / 16px)
BORDER_RADIUS.full  // rounded-full (9999px)
```

### Usage Examples

- **Buttons/Inputs:** `rounded-lg` (sm)
- **Cards:** `rounded-xl` (md)
- **Modals:** `rounded-2xl` (lg)
- **Avatars/Icons:** `rounded-full`

---

## 🔤 Typography

### Font Families

```css
--font-family-heading   /* Used for h1, h2, h3, etc. */
--font-family-body      /* Default body text (system fonts) */
```

### Font Sizes

- **xs:** `text-xs` (0.75rem / 12px)
- **sm:** `text-sm` (0.875rem / 14px)
- **base:** `text-base` (1rem / 16px)
- **lg:** `text-lg` (1.125rem / 18px)
- **xl:** `text-xl` (1.25rem / 20px)
- **2xl:** `text-2xl` (1.5rem / 24px)
- **4xl:** `text-4xl` (2.25rem / 36px)

### Usage Guidelines

- **Page titles:** `text-2xl font-bold`
- **Section headings:** `text-lg font-bold`
- **Card titles:** `text-sm font-semibold`
- **Body text:** `text-sm`
- **Helper text:** `text-xs text-[var(--muted)]`

---

## 🎭 Transitions

Standardized transition classes are available via the `TRANSITIONS` constant:

```typescript
import { TRANSITIONS } from "@/config/constants";

TRANSITIONS.colors   // transition-colors duration-150
TRANSITIONS.shadow   // transition-shadow duration-150
TRANSITIONS.opacity  // transition-opacity duration-150
TRANSITIONS.all      // transition-all duration-150
```

### Usage

```tsx
// ✅ DO: Use the constant
import { TRANSITIONS } from "@/config/constants";
<button className={`... ${TRANSITIONS.colors}`}>

// ❌ DON'T: Hardcode transitions
<button className="... transition-colors duration-150">
```

---

## 🧩 Component Library

### Button

Standardized button component with multiple variants and sizes.

**Import:**
```tsx
import { Button } from "@/components/ui/Button";
```

**Variants:**
- `primary` - Main call-to-action (blue background)
- `secondary` - Secondary actions (bordered)
- `danger` - Destructive actions (red background)
- `ghost` - Subtle actions (transparent background)

**Sizes:**
- `sm` - Small buttons (px-3 py-1.5 text-xs)
- `md` - Default buttons (px-4 py-2 text-sm)
- `lg` - Large buttons (px-5 py-2.5 text-base)

**Props:**
- `variant?: ButtonVariant` - Visual style
- `size?: ButtonSize` - Button size
- `loading?: boolean` - Shows loading state
- `fullWidth?: boolean` - Expands to 100% width
- All standard button HTML attributes

**Examples:**
```tsx
<Button variant="primary">Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" loading>Deleting...</Button>
<Button fullWidth>Submit</Button>
```

---

### Icon

Centralized SVG icon library with 13 icons.

**Import:**
```tsx
import { Icon } from "@/components/ui/Icon";
```

**Available Icons:**
- `document` - Document/file icon
- `chat` - Chat bubble icon
- `search` - Magnifying glass icon
- `upload` - Upload cloud icon
- `delete` - Trash can icon
- `check` - Checkmark icon
- `close` - X/close icon
- `info` - Information icon
- `chevron-right` - Right arrow icon
- `send` - Send/paper plane icon
- `swap` - Swap/exchange icon
- `database` - Database icon
- `lightning` - Lightning bolt icon

**Props:**
- `name: IconName` - Icon to display (required)
- `className?: string` - Custom classes (default: "w-5 h-5")
- `aria-hidden?: boolean` - Accessibility (default: true)

**Examples:**
```tsx
<Icon name="document" />
<Icon name="search" className="w-4 h-4" />
<Icon name="check" className="w-6 h-6 text-green-500" />
```

---

### Card

Container component for grouping related content.

**Import:**
```tsx
import { Card } from "@/components/ui/Card";
```

**Props:**
- `children: ReactNode` - Card content (required)
- `className?: string` - Additional classes

**Examples:**
```tsx
<Card>
  <p>Card content here</p>
</Card>

<Card className="p-6">
  <h2>Title</h2>
  <p>Content</p>
</Card>
```

---

### LinkButton

Link styled as a button (Next.js Link component).

**Import:**
```tsx
import { LinkButton } from "@/components/ui/LinkButton";
```

**Variants:**
- `primary` - Blue button style
- `secondary` - Bordered button style

**Props:**
- `href: string` - Link destination (required)
- `variant?: LinkButtonVariant` - Visual style
- `children: ReactNode` - Button content
- `className?: string` - Additional classes

**Examples:**
```tsx
<LinkButton href="/documents">Upload Documents</LinkButton>
<LinkButton href="/chat" variant="secondary">Start Chatting</LinkButton>
```

---

### IconCircle

Decorative icon container with customizable size and shape.

**Import:**
```tsx
import { IconCircle } from "@/components/ui/IconCircle";
```

**Sizes:**
- `sm` - w-8 h-8
- `md` - w-10 h-10 (default)
- `lg` - w-12 h-12

**Shapes:**
- `circle` - rounded-full (default)
- `square` - rounded-lg

**Examples:**
```tsx
<IconCircle>
  <Icon name="document" />
</IconCircle>

<IconCircle size="lg" shape="square">
  <Icon name="chat" className="w-6 h-6" />
</IconCircle>
```

---

### SkeletonPulse

Loading placeholder with pulse animation.

**Import:**
```tsx
import { SkeletonPulse } from "@/components/ui/SkeletonPulse";
```

**Props:**
- `className?: string` - Size and shape classes (default: "h-4 w-full")

**Examples:**
```tsx
<SkeletonPulse />
<SkeletonPulse className="h-8 w-64" />
<SkeletonPulse className="h-12 w-12 rounded-full" />
```

---

### ErrorAlert

Error message banner.

**Import:**
```tsx
import { ErrorAlert } from "@/components/ui/ErrorAlert";
```

**Props:**
- `error: string | null` - Error message (shows nothing if null)

**Example:**
```tsx
<ErrorAlert error={error} />
```

---

## 🛠️ Utilities

### cn() - ClassName Utility

Combines multiple class names and filters out falsy values.

**Import:**
```tsx
import { cn } from "@/lib/utils";
```

**Usage:**
```tsx
// Conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />

// Multiple classes
<div className={cn(
  "px-4 py-2",
  "rounded-lg",
  "bg-blue-500"
)} />
```

---

### formatDate()

Formats ISO date strings to human-readable format.

**Import:**
```tsx
import { formatDate } from "@/lib/utils";
```

**Usage:**
```tsx
formatDate("2026-01-15T10:00:00Z") // "Jan 15, 2026"
```

---

## 📦 Constants

### Client Constants

**Import:**
```tsx
import { STORAGE_KEYS, POLLING, TRANSITIONS, BORDER_RADIUS } from "@/config/constants";
```

**STORAGE_KEYS:**
- `ADMIN_TOKEN` - Admin auth token key
- `SESSION_ID` - RAG session ID key
- `CHAT_MESSAGES` - Chat history key

**POLLING:**
- `INTERVAL_MS` - 1500ms
- `MAX_ATTEMPTS` - 120
- `TERMINAL_STATUSES` - ["ready", "error"]

---

## ✅ Best Practices

### DO ✅

- Use CSS custom properties for colors
- Use the `cn()` utility for combining classes
- Use constants from `@/config/constants`
- Use the Icon component instead of inline SVGs
- Use the Button component for consistent styling
- Apply transitions using `TRANSITIONS` constant

### DON'T ❌

- Hardcode colors (use CSS variables)
- Inline className concatenation logic
- Hardcode magic numbers or strings
- Duplicate SVG code
- Create custom button styles
- Use arbitrary transition durations

---

## 🎯 Migration Guide

If you're updating existing code to use the design system:

1. **Replace inline className logic:**
   ```tsx
   // Before
   className={`base ${className ? ` ${className}` : ""}`}
   
   // After
   import { cn } from "@/lib/utils";
   className={cn("base", className)}
   ```

2. **Replace magic strings with constants:**
   ```tsx
   // Before
   const ADMIN_KEY = "rag_admin_token";
   
   // After
   import { STORAGE_KEYS } from "@/config/constants";
   const token = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
   ```

3. **Replace inline SVGs with Icon component:**
   ```tsx
   // Before
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
     <path d="..." />
   </svg>
   
   // After
   import { Icon } from "@/components/ui/Icon";
   <Icon name="document" />
   ```

---

**Last Updated:** 2026-04-16  
**Version:** 1.0.0

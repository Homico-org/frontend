# Design System Migration Plan

## Source: Homico Design System (from Claude Design)

Migration from current ad-hoc styling to the official Homico Design System.
**Every change must match the design system 100%.**

---

## Phase 1: Foundation (CSS Variables + Fonts)
**Impact: Entire app rebrands instantly**

### 1.1 — Install fonts
- Google Fonts: `Fraunces` (display), `Inter` (body), `Noto Sans Georgian`, `Noto Serif Georgian`, `JetBrains Mono`
- Update `next.config` or `layout.tsx` with font links

### 1.2 — Replace CSS variables in `globals.css`
Map old `--color-*` vars to new `--hm-*` tokens:

```
OLD                          → NEW
--color-bg-page              → --hm-bg-page: #FAFAF7
--color-bg-elevated          → --hm-bg-elevated: #FFFFFF
--color-bg-tertiary          → --hm-bg-tertiary: #F2F0EB
--color-text-primary         → --hm-fg-primary: #14120E
--color-text-secondary       → --hm-fg-secondary: #5E594C
--color-text-muted           → --hm-fg-muted: #A69F8E
--color-border               → --hm-border: #E3DFD6
--color-border-subtle        → --hm-border-subtle: #EEEAE0
ACCENT_COLOR (#C4735B)       → --hm-brand-500: #EF4E24
```

### 1.3 — Dark mode tokens
```
--hm-bg-page: #14120E
--hm-bg-elevated: #1D1B15
--hm-bg-tertiary: #26231B
--hm-fg-primary: #F2F0EB
--hm-fg-secondary: #C9C3B5
--hm-fg-muted: #8A8472
--hm-border: #302B22
--hm-border-subtle: #25211A
```

### 1.4 — Brand color palette
```
--hm-brand-50:  #FEEDE6
--hm-brand-100: #FBD3C5
--hm-brand-200: #F7B49B
--hm-brand-300: #F28764
--hm-brand-400: #F06B43
--hm-brand-500: #EF4E24  ← PRIMARY
--hm-brand-600: #D13C14
--hm-brand-700: #A92B08
--hm-brand-800: #7D1E04
--hm-brand-900: #501301
```

### 1.5 — Neutral palette
```
--hm-n-0:   #FFFFFF
--hm-n-50:  #FAFAF7
--hm-n-100: #F2F0EB
--hm-n-200: #E3DFD6
--hm-n-300: #C9C3B5
--hm-n-400: #A69F8E
--hm-n-500: #8A8472
--hm-n-600: #5E594C
--hm-n-700: #3D3930
--hm-n-800: #262218
--hm-n-900: #14120E
```

### 1.6 — Semantic colors
```
--hm-success-500: #3E8F5A   --hm-success-100: #DCEFE2   --hm-success-50: #EFF8F2
--hm-warning-500: #C88A1D   --hm-warning-100: #F6E7C2   --hm-warning-50: #FCF3DF
--hm-error-500:   #C24545   --hm-error-100:   #F5D6D6   --hm-error-50:  #FBEAEA
--hm-info-500:    #3C6BB0   --hm-info-100:    #D8E3F5   --hm-info-50:   #EBF1FA
```

### 1.7 — Shadows, radius, spacing, motion
```
Shadows:
--hm-shadow-xs: 0 1px 2px rgba(20,18,14,0.04)
--hm-shadow-sm: 0 1px 2px rgba(20,18,14,0.06), 0 1px 3px rgba(20,18,14,0.04)
--hm-shadow-md: 0 4px 8px -2px rgba(20,18,14,0.08), 0 2px 4px rgba(20,18,14,0.04)
--hm-shadow-lg: 0 16px 32px -12px rgba(20,18,14,0.16), 0 4px 8px rgba(20,18,14,0.04)
--hm-shadow-xl: 0 32px 64px -16px rgba(20,18,14,0.22)

Radius:
--hm-r-xs: 4px    --hm-r-sm: 6px    --hm-r-md: 10px
--hm-r-lg: 16px   --hm-r-xl: 24px   --hm-r-full: 9999px

Spacing (4px base):
--hm-s-1: 4px   --hm-s-2: 8px   --hm-s-3: 12px  --hm-s-4: 16px
--hm-s-5: 20px  --hm-s-6: 24px  --hm-s-8: 32px   --hm-s-10: 40px
--hm-s-12: 48px --hm-s-16: 64px --hm-s-20: 80px  --hm-s-24: 96px

Motion:
--hm-dur-fast: 120ms    --hm-dur-base: 180ms
--hm-dur-slow: 300ms    --hm-dur-slower: 500ms
--hm-ease-standard:  cubic-bezier(0.2, 0.7, 0.1, 1)
--hm-ease-emphasized: cubic-bezier(0.3, 0.85, 0.25, 1)
--hm-ease-in:  cubic-bezier(0.4, 0, 1, 1)
--hm-ease-out: cubic-bezier(0, 0, 0.2, 1)
```

---

## Phase 2: Component Rewrite (one at a time)

### 2.1 — Button (`ui/button.tsx`)
- Shape: **pill** (`border-radius: 9999px`) — NOT rounded rectangle
- Sizes: sm=32px, md=40px, lg=48px, xl=54px
- Variants: primary (brand-500 bg), secondary (n-900 bg), outline (border), ghost (transparent), destructive (error-500)
- Font-weight: 500
- Focus: `0 0 0 3px brand-100`
- Press: `scale(0.98)` 80ms ease-in
- Hover: background transition 180ms ease-standard

### 2.2 — Input (`ui/input.tsx`)
- Height: 48px desktop
- Border: 1px `--hm-border`, radius `--hm-r-md` (10px)
- Focus: brand-colored 3px outer glow + 1px border
- Error state: error-500 border
- Disabled: 50% opacity
- Font: 15px

### 2.3 — Card
- Background: `--hm-bg-elevated`
- Border: 1px `--hm-border`
- Radius: 16px
- Shadow: `--hm-shadow-xs` at rest
- Interactive hover: translateY(-2px) + `--hm-shadow-md`

### 2.4 — Badge/Pills
- Variants: neutral (n-100 bg), brand (brand-50 bg/brand-700 text), success/warning/error/info
- Radius: 9999px
- Font: 12px, weight 600
- Padding: 4px 12px

### 2.5 — Modal
- Sizes: sm=400px, md=560px, lg=720px
- Backdrop: rgba(21,17,12,0.55)
- Radius: 16px
- Padding: 32px
- Enter: opacity + translateY(12px) + scale(0.98), 300ms, ease-emphasized
- Exit: opacity 180ms ease-in

### 2.6 — Toggle/Switch
- Width: 44px, height: 24px
- On: brand-500 background
- Off: n-200 background
- Thumb: 20px white circle
- Transition: 180ms ease-standard

### 2.7 — Toast/Alert
- Success/info/warning/error variants
- Border-left: 3px solid semantic color
- Auto-dismiss: 4000ms
- Slide in: translateY(-8px) + opacity, 300ms

### 2.8 — Tabs
- Underline: 2px bottom border brand-500 on active
- Pills: brand-50 bg / brand-700 text on active

### 2.9 — Avatar
- Gradient background: warm brand-tinted
- Online dot: 30% of avatar size, green, bottom-right
- Group: overlap by 35%

### 2.10 — Progress
- Linear bar: 6px height, brand-500 fill, n-100 track, rounded
- Circular: stroke-based SVG
- Steps: numbered circles with check icons

### 2.11 — Skeleton
- Shimmer: 1400ms, linear, infinite
- Color: n-100 base with n-200 shimmer

### 2.12 — Empty State
- Illustration: single-stroke line art on tinted ellipse (brand-50 bg circle)
- Text: serif heading + secondary body + primary CTA

---

## Phase 3: Layout Components

### 3.1 — Header
- Desktop: logo (Fraunces 22px) + ghost nav buttons + bell + sign in/up
- Height: ~64px
- Background: elevated, border-bottom

### 3.2 — Sidebar
- Width: 260px
- Active item: brand-50 bg, brand-700 text
- Icons: 16px, gap 10px

### 3.3 — Bottom Nav (mobile)
- 5 items: Home, Search, Post, Chat, Me
- Active: brand-500 color
- Rounded pill shape
- Shadow: md

---

## Phase 4: Page-level Updates

### 4.1 — Replace all `#C4735B` with `var(--hm-brand-500)` (#EF4E24)
### 4.2 — Replace all `ACCENT_COLOR` constant
### 4.3 — Update font-family references to use `--hm-font-display/body/mono`
### 4.4 — Replace inline `style={{ color: 'var(--color-text-*)' }}` with new `--hm-fg-*` vars
### 4.5 — Update all `rounded-xl/2xl` to use design system radius tokens

---

## Phase 5: Typography

### 5.1 — Font scale implementation
```
text-xs:  12px / 16px / 400
text-sm:  14px / 20px / 400
text-base: 16px / 24px / 400
text-lg:  18px / 28px / 500
text-xl:  20px / 28px / 500
text-2xl: 24px / 32px / 500
text-3xl: 32px / 40px / 500
text-4xl: 40px / 48px / 500
text-5xl: 56px / 60px / 500
```

### 5.2 — Georgian text rule
- On buttons, nav, labels: drop one step (text-base → text-sm) when `lang="ka"`
- Body stays same size, but `line-height: 1.6` for Georgian script legibility

---

## Execution Order

1. **Phase 1** first — immediate visual rebrand across entire app
2. **Phase 2.1** (Button) — most used component
3. **Phase 2.2** (Input) — second most used
4. **Phase 2.3-2.12** — remaining components one by one
5. **Phase 3** — layout components
6. **Phase 4** — sweep for remaining hardcoded values
7. **Phase 5** — typography fine-tuning

**Each phase is independently deployable.**

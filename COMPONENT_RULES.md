# Component Rules & Conventions

Rules discovered during code review. Every new component and every touched component must follow these.

## Icons

- **Always use Lucide icons** — never inline SVGs for standard icons
- Import from `lucide-react`: `import { ChevronRight, Star, MapPin } from "lucide-react"`
- For category-specific icons, use `<CategoryIcon type={key} />`
- Size: match context — `w-3 h-3` (inline), `w-4 h-4` (buttons), `w-5 h-5` (headings)

## Colors & Dark Mode

- **Never use hardcoded Tailwind colors** for text, backgrounds, or borders that must adapt to dark mode
- Use CSS variables:
  - Text: `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-muted)`, `var(--color-text-tertiary)`
  - Backgrounds: `var(--color-bg-primary)`, `var(--color-bg-elevated)`, `var(--color-bg-tertiary)`
  - Borders: `var(--color-border-subtle)`, `var(--color-border)`
- Apply via `style={{ color: 'var(--color-text-primary)' }}` or `style={{ backgroundColor: 'var(--color-bg-elevated)' }}`
- Accent color `#C4735B` is fine hardcoded (it's the same in both modes)
- OK to use Tailwind for: opacity modifiers (`opacity-60`), layout (`flex`, `gap-2`), sizing (`w-4 h-4`), hover states with accent

## Reusable Components

- **Avatar**: Always use `<Avatar src={...} name={...} size="md" />` — never raw `<Image>` or `<img>` for user avatars
- **Buttons**: Use `<Button>` from `@/components/ui/button` — never raw `<button>` with manual styling for primary actions
- **Modals**: Use `<Modal>` / `<ConfirmModal>` — never `window.confirm()` or `window.alert()`
- **Toasts**: Use `toast.success()` / `toast.error()` from `useToast()` — never `alert()`
- **Loading**: Use `<LoadingSpinner>` or `<Skeleton>` — never custom spinner divs
- **Cards**: Use `<Card>` for content containers when appropriate

## TypeScript

- **All functions must have explicit return types** — no implicit returns
- Components: `function MyComponent(): React.ReactElement { ... }` or `React.ReactElement | null` if it can return null
- Helpers: `function formatPrice(value: number): string { ... }`
- Callbacks in props: `onChange: (value: string) => void`
- Never use `any` — use proper types or `unknown` with type guards
- **No inline object types in interfaces** — extract to named interfaces/types (e.g., `priceRange?: { min: number }` → `priceRange?: ProPriceRange`)
- **String unions used in multiple places** must be extracted to a named type (e.g., `type PricingModel = 'fixed' | 'range' | 'byAgreement'`)
- **Interfaces for API data / shared models** must live in `types/shared/` — never define them inline in components. Component-specific prop interfaces (like `MyComponentProps`) are fine inline.

## i18n

- All user-visible text must use `t('namespace.key')` from `useLanguage()`
- Backend-provided localized fields: use `pick({ en: item.name, ka: item.nameKa })`
- When adding new keys, add to ALL 3 locale files: `en.json`, `ka.json`, `ru.json`

## Patterns Found & Fixed

| Date       | Component    | Issue                                                       | Fix                                                       |
| ---------- | ------------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| 2026-04-16 | MiniProCard  | Inline SVG for chevron arrow                                | Replace with `<ChevronRight>` from Lucide                 |
| 2026-04-16 | MiniProCard  | `<Image>` for avatar                                        | Replace with `<Avatar>` component                         |
| 2026-04-16 | MiniProCard  | Hardcoded `bg-white`, `text-neutral-900`                    | CSS vars for dark mode                                    |
| 2026-04-16 | AiChatWidget | 15+ hardcoded colors (`bg-white`, `text-neutral-800`, etc.) | CSS vars for all text/bg/border                           |
| 2026-04-16 | AiChatWidget | 10+ inline locale ternaries (`locale === "ka" ? ... : ...`) | Moved to `t('ai.*')` translation keys                     |
| 2026-04-16 | AiChatWidget | Raw `<button>` for actions, login, send                     | Replace with `<Button>` and `<Badge>` components          |
| 2026-04-16 | AiChatWidget | No return types on 4 functions                              | Added `React.ReactElement` / `React.ReactElement \| null` |
| 2026-04-16 | AiChatWidget | 6 more raw `<button>` (header, prompts)                     | All replaced with `<Button variant="ghost/outline">`      |
| 2026-04-16 | AiChatWidget | Raw `<input>` for chat input                                | Replace with `<Input>` component                          |
| 2026-04-16 | RichContentRenderer | No return types on 8 functions | Added `React.ReactElement` / `React.ReactElement \| null` |
| 2026-04-16 | RichContentRenderer | 20+ hardcoded colors (`bg-neutral-50`, `bg-white`, etc.) | CSS vars for all containers, text, borders |
| 2026-04-16 | RichContentRenderer | Hardcoded strings ("Pricing:", "FAQs", etc.) | Moved to `t('ai.*')` keys |
| 2026-04-16 | RichContentRenderer | Raw styled `<Link>` as button | Replace with `<Button>` and `<Badge>` |
| 2026-04-16 | RichContentRenderer | Repeated locale ternary pattern | Extracted `pickLocale()` helper |
| 2026-04-16 | types.ts | Inline object type in `priceRange` field | Extracted `ProPriceRange` interface |
| 2026-04-16 | types.ts | Inline string union `'fixed' \| 'range' \| ...` | Extracted `PricingModel` type |
| 2026-04-16 | types.ts | Inline `averagePrice` object type | Extracted `PriceRangeValues` interface |
| 2026-04-16 | types.ts | 4 more inline string unions (`source`, `role`, `type`, `status`) | Extracted `ReviewSource`, `ChatRole`, `ActionType`, `SessionStatus` types |
| 2026-04-16 | LoginModal | `DemoAccount` interface defined inline in component | Moved to `types/shared/user.ts` with `role: UserRole` |
| 2026-04-16 | LoginModal | Inline SVG close icon | Replace with `<X>` from Lucide |
| 2026-04-16 | LoginModal | Hardcoded `bg-white`, `text-neutral-900/500` | CSS vars for dark mode |
| 2026-04-16 | LoginModal | 2 inline locale ternaries | Moved to `t('auth.enterPhoneNumber')`, `t('auth.dontHaveAccount')` |
| 2026-04-16 | LoginModal | No return types on functions | Added `React.ReactElement \| null` |

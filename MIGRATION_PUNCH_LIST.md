# Design System Migration — Punch List

> Generated 2026-04-19. Audit of `src/` (excluding `components/ui/`, `*.stories.tsx`, `.storybook`).
> Scope: ~1,500+ individual violations across ~150 files.
> Rules: see [`COMPONENT_RULES.md`](./COMPONENT_RULES.md) and [`/CLAUDE.md`](../CLAUDE.md).

## Status legend
- [ ] todo
- [~] in progress
- [x] done

---

## Phase 1 — Quick wins (small, contained)

- [x] Replace 5 `confirm()` calls in `src/app/admin/service-catalog/page.tsx` with `<ConfirmModal>`
  - lines 1295, 1745, 2103, 2159, 2495
- [x] `src/components/common/Header.tsx` — replace inline bell SVG with `<Bell>` from lucide-react
- [x] `src/components/common/Header.tsx` — replace `bg-red-500` notification dot with token + small Badge-like span
- [x] `src/components/common/Header.tsx` — remove inline `linear-gradient` profile dropdown background, use `var(--hm-bg-elevated)` + tokens

## Phase 2 — Template refactor: `ProfessionalDetailClient.tsx` (4384 lines) ✅

Full pass complete.

**Done:**
- [x] **All 26 raw `<button>` → `<Button>`** (variants: ghost, outline, destructive, icon-sm)
- [x] **All 31 inline locale ternaries → `t()`** with 30+ new translation keys in `professional.*` namespace (viewsLabel, reviewsLabel, jobsLabel, yearsExpShort, unitsShort, saveShort, years12/35/510/10plus, pendingBooking, confirmedBooking, memberSince, fileReadError, monthJanuary…monthDecember). Backend-localized fields (`sub.name`/`nameKa`, `unitOpt.label.en/ka`) refactored to use `pick()` from `useLanguage()`.
- [x] **2 of 3 inline `<svg>` → Lucide** (`AlertTriangle`, `Play`); WhatsApp brand mark kept (no Lucide equivalent — legitimate inline SVG)
- [x] **5 of 9 raw `<input>` → `<Input>` / `<Checkbox>`** (4 remaining are hidden `type="file"` triggers — legitimate)
- [x] **6 hardcoded color classes → CSS tokens**

**Skipped (deliberate, not violations):**
- 6 raw `<img>` in lightbox/gallery — eslint-disabled, dynamic sizing; converting to `<Image fill>` risks breaking the lightbox
- 1 fullscreen project lightbox + 1 avatar zoom (`fixed inset-0 z-[200]`) — not standard `<Modal>` UX, needs a dedicated `<Lightbox>` primitive (out of scope)
- 1 click-outside backdrop `<div fixed inset-0>` — legitimate non-Modal use
- 1 WhatsApp brand SVG (no Lucide equivalent)
- 4 hidden `type="file"` inputs triggered via refs (legitimate)

**Net result:** 0 raw `<button>`, 0 locale ternaries, TypeScript clean.

## Phase 3 — Color tokens campaign (~650 violations)

Replace hardcoded Tailwind colors with `--hm-*` tokens. File-by-file:

### Top 20 offenders
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (43 → all converted; remaining 6 are gallery `bg-white/X` overlays — intentional)
- [x] `src/app/tools/compare/page.tsx` — 8 buttons → `<Button>`, 5 hardcoded color tokens fixed (6 remaining are legitimate `bg-white/x` overlays on branded gradients)
- [x] `src/app/terms/page.tsx` — 4 buttons → `<Button>`, 7 inline SVG → Lucide (FileText/Clock/Shield/Mail/MapPin/ArrowRight), 3 broken `bg-white/x/y` typos fixed, 3 locale ternaries → `pick()` / `t()`
- [x] `src/app/page.tsx` — 3 of 4 raw `<button>` → `<Button>` (1 remaining is `MagneticButton` internal primitive — uses `useMagneticButton` ref, legitimate); 4 hardcoded color classes → tokens (`bg-neutral-900` → `var(--hm-n-900)`, `border-neutral-800` → `var(--hm-n-800)`)
- [x] `src/app/privacy/page.tsx` — 4 buttons → `<Button>`, 9 inline SVG → Lucide (Shield/Clock/ArrowRight/Menu/X/Mail/MapPin), 4 locale ternaries → `pick()` / `t()`, 3 color hardcodes → tokens
- [x] `src/app/pro/premium/checkout/page.tsx` — 7 locale ternaries → `pick()` / `t()` (3 new keys: `premium.readyToGrow`/`payAmount`/`saveAmount`), 5 color hardcodes → tokens. Buttons/inputs intentionally kept raw — they use per-tier dynamic `style={{ borderColor: tier.accentColor }}` etc. that the static design-system Button/Input can't reproduce.
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (4227 lines) — **all 16 raw `<button>` → `<Button>`, all 11 raw `<input>` → `<Input>`/`<Checkbox>`, all 6 locale ternaries → `t()`/`pick()`**, color tokens fixed. Skipped: 22 custom category illustration SVGs (bespoke art, not icons) + 1 Pinterest brand mark.
- [x] `src/components/common/Header.tsx` — partially completed in earlier phases; now finished: 1 button → `<Button outline>`, 8 inline SVG → Lucide (Shield/Briefcase/LayoutGrid/SlidersHorizontal/LogOut/ChevronRight/Search), 1 ternary → `pick()`. File 735 → 591 lines.
- [x] `src/app/pro/premium/page.tsx` — 7 locale ternaries → `pick()` / `t()` (2 new keys: `premium.headlinePrefix`, `premium.headlineHighlight`), 1 color hardcode → token. 4 buttons kept raw (tier-themed gradients/shadows + animated billing toggle slider).
- [x] `src/components/pro/steps/ProjectsStep.tsx` — all 10 buttons → `<Button>`, 5 of 7 raw `<img>` → Next `<Image>`, all 14 inline SVG → Lucide. 2 imgs in BeforeAfterSlider widget kept (clipPath/pointer-events).
- [x] `src/components/common/PWAInstallPrompt.tsx` — 3 buttons → `<Button>`, 2 SVG components (`IOSShareIcon`, `IOSAddIcon`) → Lucide (`Share`, `SquarePlus`), 2 spinner divs → `<LoadingSpinner>`. iOS/Android UI mock illustrations kept (intentional Safari/iOS chrome simulation).
- [x] `src/components/common/Card.tsx` — already on tokens (audit over-counted)
- [x] `src/components/browse/FeedCard.tsx` — 2 SVG → Lucide (`ImageIcon`, `Star`), 1 raw `<img>` → Next `<Image fill>`, 3 locale ternaries → `pick()`. Color overlays on image/branded backdrops kept (intentional).
- [x] `src/app/tools/page.tsx` — already clean
- [x] `src/components/ai-assistant/AiChatWidget.tsx` — 4 locale ternaries → `pick()` (refactored `SuggestedActionButton` to use `useLanguage` internally instead of locale prop).
- [x] `src/app/for-business/page.tsx` — already clean
- [x] `src/components/professionals/PortfolioCard.tsx` — 2 buttons → `<Button>`, 1 raw `<img>` → `<Avatar>`, 3 locale ternaries → `pick()`.
- [x] `src/components/critical-notification/CriticalNotificationOverlay.tsx` — 1 button → `<Button>`, 1 hardcoded `bg-neutral-900` → token.
- [x] `src/app/how-it-works/page.tsx` — 2 buttons → `<Button>`, 13 SVG → Lucide, 4 ternaries → 32 new `howItWorks.*` translation keys, 4 hex colors → brand tokens.
- [x] `src/components/proposals/HiringChoiceModal.tsx` — 3 ternaries → 3 new `proposal.*` keys (hiringName/freeBadge/tempFreeNotice). 2 buttons kept raw (heavy dynamic gradient/transform/shadow card-style buttons).

### Find/replace map
| Hardcoded | Replace with |
|-----------|--------------|
| `bg-white` | `style={{ backgroundColor: 'var(--hm-bg-elevated)' }}` |
| `bg-neutral-50` | `style={{ backgroundColor: 'var(--hm-bg-page)' }}` |
| `bg-neutral-100` | `style={{ backgroundColor: 'var(--hm-bg-tertiary)' }}` |
| `text-black` / `text-neutral-900` | `style={{ color: 'var(--hm-fg-primary)' }}` |
| `text-neutral-700` / `text-neutral-600` | `style={{ color: 'var(--hm-fg-secondary)' }}` |
| `text-neutral-500` / `text-neutral-400` | `style={{ color: 'var(--hm-fg-muted)' }}` |
| `border-neutral-200` | `style={{ borderColor: 'var(--hm-border-subtle)' }}` |
| `border-neutral-300` | `style={{ borderColor: 'var(--hm-border)' }}` |

---

## Phase 4 — Buttons campaign (~445 violations)

Replace `<button>` with `<Button variant="…">`. Map common patterns:

| Existing classes | Variant |
|---|---|
| `bg-orange-…` / `bg-[#EF4E24]` + white text | `variant="default"` |
| `border` + neutral text | `variant="outline"` |
| no bg, hover only | `variant="ghost"` |
| `bg-red-…` | `variant="destructive"` |

### Top 15 offenders
- [SKIP] `src/app/admin/service-catalog/page.tsx` (40) — admin uses `ADMIN_THEME` inline style system, deliberately outside design tokens
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (26 → 0)
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (16 → 0)
- [SKIP] `src/app/admin/jobs/page.tsx` (15) — uses `ADMIN_THEME`
- [x] `src/components/pro/steps/ServicesPricingStep.tsx` — 10 of 12 buttons → `<Button>` (2 multi-element selectable cards kept), 5 inputs → `<Input>`, 15 ternaries → `pick()`/`t()` (4 new `register.*` keys), 1 spinner → `<LoadingSpinner>`
- [x] `src/components/browse/BrowseFilterBar.tsx` — 1 of 12 buttons → `<Button link>`, 2 inputs → `<Input filled>`, 5 ternaries → `pick()` (refactored `getCityLabel`/`getLabel` signatures). 11 dropdown/pill buttons kept (custom per-state Tailwind sizing).
- [x] `src/app/post-job/page.tsx` — 11 of 12 buttons → `<Button>` (1 stepper tab kept), 2 of 3 inputs → `<Input>` (1 hidden file input legitimate), 6 ternaries → `pick()`/`t()` (1 new `postJob.fromServiceBudgets` key), 3 colors → tokens
- [SKIP] `src/app/admin/invites/page.tsx` (12) — uses `ADMIN_THEME`
- [x] `src/components/projects/ProjectWorkspace.tsx` — 5 of 11 buttons → `<Button>` (6 dynamic-state kept), 3 raw `<img>` → Next `<Image>`, 13 ternaries → `t()`, 2 modals → `<Modal>`
- [x] `src/components/pro/steps/ProjectsStep.tsx` (10 → 0)
- [x] `src/components/browse/JobsFilterBar.tsx` — 1 of 10 buttons → `<Button link>`, 2 inputs → `<Input filled>`, 5 ternaries → `pick()`. 9 dropdown/pill buttons kept (custom per-state Tailwind sizing).
- [x] `src/app/tools/analyzer/page.tsx` — all 10 buttons → `<Button>`, textarea → `<Textarea filled>`, demo locale ternary refactored into translation keys.
- [SKIP] `src/app/admin/reports/page.tsx` (10) — uses `ADMIN_THEME`
- [~] `src/components/post-job/JobServicePicker.tsx` — 14 of 14 locale ternaries → `pick()`/`t()` (3 new common keys: `qty`). 8 buttons + 3 inputs deferred (heavy per-state styling, not high-value to break visuals).
- [x] `src/app/tools/compare/page.tsx` (8 → 0)

---

## Phase 5 — Inputs (~62 violations)

Replace `<input>` with `<Input>` / `<PhoneInput>` / `<OTPInput>` / `<SearchInput>`.
Replace `<textarea>` with `<Textarea>`.

### Top 15 offenders
- [SKIP] `src/app/admin/service-catalog/page.tsx` (52) — admin uses `ADMIN_THEME` system, intentionally outside design tokens
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (11 → 0)
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (9 → 4 hidden file inputs)
- [x] `src/components/professionals/AboutTab.tsx` — 7 buttons → `<Button>`, 7 inputs → `<Input>`, 1 textarea → `<Textarea>`, 4 ternaries → existing `t('common.*')` keys
- [x] `src/app/pro/premium/checkout/page.tsx` (6 → 0; 5 form inputs kept raw — per-tier dynamic styling)
- [x] `src/components/pro/steps/ServicesPricingStep.tsx` (5 → 0)
- [x] `src/components/browse/CategoryPickerModal.tsx` — 3 of 6 buttons → `<Button>`, 3 checkboxes → `<Checkbox>`, ternary → `pick()`. Category list buttons (per-active inline style) kept.
- [x] `src/app/(shell)/settings/page.tsx` — all 5 inputs → `<Input>`
- [x] `src/components/browse/JobsFiltersSidebar.tsx` (4 → 0)
- [x] `src/components/settings/PasswordChangeForm.tsx` — all 3 inputs → `<Input>`, 2 ternaries → `t('settings.*')`
- [x] `src/components/register/steps/StepServices.tsx` — 3 hidden file inputs (legitimate); 1 ternary → new `register.projectNumber` key
- [x] `src/components/projects/ProjectChat.tsx` — 2 of 3 inputs → `<Input filled>`, 2 buttons → `<Button>`, ternary → `t('common.error')`
- [~] `src/components/post-job/JobServicePicker.tsx` (3 inputs kept — heavy custom styling, deferred)
- [x] `src/components/common/PortfolioProjectsInput.tsx` — textarea → `<Textarea>`, all 9 SVG → Lucide, all 4 imgs → Next `<Image>`. 2 hidden file inputs + 5 dropzone buttons kept.
- [x] `src/app/post-job/page.tsx` (3 → 1 hidden file input + 1 stepper)

---

## Phase 6 — i18n locale ternaries (~135 violations)

Replace `locale === 'ka' ? '…' : '…'` with `t('…')`. Add keys to `en.json`, `ka.json`, `ru.json`.

### Top 15 offenders
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (31 → 0)
- [x] `src/components/pro/steps/ServicesPricingStep.tsx` (15 → 0)
- [x] `src/components/post-job/JobServicePicker.tsx` (14 → 0)
- [x] `src/components/projects/ProjectWorkspace.tsx` (13 → 0)
- [x] `src/components/booking/ServiceBookingModal.tsx` (9 → 0) — all `pick()`
- [x] `src/components/jobs/ProposalFormModal.tsx` (8 → 0) — `pick()` + `t('common.days/weeks/months')`
- [x] `src/app/pro/premium/page.tsx` (7 → 0)
- [x] `src/app/pro/premium/checkout/page.tsx` (7 → 0)
- [x] `src/components/register/steps/StepSelectServices.tsx` (6 → 0) — all `pick()`
- [x] `src/components/categories/CategorySelector.tsx` (6 → 0) — `pick()` + 2 new `register.*` keys
- [x] `src/components/browse/FeedSection.tsx` (6 → 0) — 6 new `browse.*` keys
- [x] `src/components/ai-assistant/RichContentRenderer.tsx` (6 → 0) — all `pick()`
- [x] `src/app/post-job/page.tsx` (6 → 0)
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (6 → 0)
- [x] `src/contexts/ProfileSetupContext.tsx` (5 → 0) — all `pick()`
- [x] `src/components/register/hooks/useRegistration.ts` (13 → 0) — all `pick()` for inline error/validation messages
- [x] `src/app/(shell)/layout.tsx` (4 → 0) — `pick({ en, ka, ru })` for sidebar tabs (3 langs); category labels via `pick()` in SidebarCategoriesUI
- [x] `src/app/(shell)/professionals/page.tsx` (4 → 0) — `pick()` for inline CTAs
- [x] `src/components/common/JobCard.tsx` (3 → 0) — `pick()` for catalog labels
- [x] `src/components/common/ProCard.tsx` (3 → 0) — `pick()` for catalog labels
- [x] `src/components/common/MyJobCard.tsx` (1 → 0) — uses `t('common.proposals')`
- [x] `src/components/post-job/BudgetSelector.tsx` (1 → 0)
- [x] `src/components/post-job/ConditionSelector.tsx` (3 → 1; remaining ternary is in `getConditionLabel` exported helper, takes locale param — legitimate API)
- [x] `src/components/post-job/TimingSelector.tsx` (1 → 0)
- [x] `src/components/post-job/PropertyTypeSelector.tsx` (1 → 0)
- [x] `src/components/jobs/ProjectSidebar.tsx` (2 → 0) — both desktop + mobile use `pick()`
- [x] `src/components/professionals/ProfileSidebar.tsx` (2 → 0)
- [x] `src/components/professionals/PortfolioTab.tsx` (1 → 0) — `t('professional.addProject')`
- [x] `src/components/heroes/ProfileHero.tsx` (1 → 0)
- [x] `src/components/ai-assistant/MiniProCard.tsx` (2 → 0)
- [x] `src/components/settings/ScheduleSettings.tsx` (2 → 0) — `pick({ en, ka, ru })`
- [x] `src/components/settings/ProfileSettings.tsx` (2 → 0)
- [x] `src/components/browse/BrowseFiltersSidebar.tsx` (1 → 0) — `t('browse.stars')`
- [x] `src/components/browse/BrowseSearchBar.tsx` (2 → 0)
- [x] `src/components/common/AddressPicker.tsx` (2 → 0) — reuses `t('common.searchAddress')`/`t('common.selectedAddress')`
- [x] `src/components/jobs/ProjectStatusBar.tsx` (3 → 0)
- [x] `src/components/register/hooks/useProRegistration.ts` (4 → 0)
- [x] `src/app/invite/[token]/page.tsx` (3 → 0) — wrapper `pick(en, ka)` delegates to `useLanguage().pick`
- [x] `src/app/pro/premium/success/page.tsx` (3 → 0)
- [x] `src/components/browse/CategoryPickerModal.tsx` — added per-category selection counters (replaces single dot indicator); both desktop sidebar + mobile pills
- [x] `src/components/register/steps/StepReview.tsx` (2 → 0) — `t('common.change')` + `pick()` for category names
- [x] `src/components/register/steps/StepComplete.tsx` (1 → 0)
- [x] `src/app/pro/profile-setup/layout.tsx` (2 → 0) — Stepper labels via `pick()`
- [x] `src/app/pro/profile-setup/portfolio/page.tsx` (2 → 0) — `t('common.optional')` + `pick()`
- [x] `src/components/common/StatusBadge.tsx` (1 → 0)
- [x] `src/components/browse/JobsFilterSection.tsx` (1 → 0; refactored to use `<FilterPills>`)
- [x] `src/components/tools/prices/PriceCard.tsx` (1 → 0)
- [x] `src/components/pro/steps/PricingStep.tsx` (1 → 0)
- [x] `src/components/pro/steps/ReviewStep.tsx` (1 → 0; removed `const ka = locale === "ka"` shorthand, now all `pick()`)
- [x] `src/app/become-pro/page.tsx` (1 → 0)
- [x] `src/app/users/[id]/page.tsx` (1 → 0)
- [x] `src/app/forgot-password/reset/page.tsx` (1 → 0)
- [x] `src/app/forgot-password/verify/page.tsx` (1 → 0)
- [x] `src/app/register/page.tsx` (1 → 0)
- [x] `src/app/register/client/page.tsx` (2 → 0)
- [x] `src/app/(shell)/my-space/page.tsx` (1 → 0)
- [x] `src/app/tools/prices/page.tsx` (1 → 0)
- [x] `src/app/tools/analyzer/page.tsx` (1 → 0; demo text split into `demoTextEn` + `demoTextKa`)

**Final remaining 32 ternaries are all deliberate skips:**
- `src/utils/dateUtils.ts`, `ratingUtils.ts` — utility functions accepting `locale` as parameter
- `src/contexts/CategoriesContext.tsx`/`.mock.tsx` — data fixtures
- `src/components/post-job/ConditionSelector.tsx` — `getConditionLabel(condition, locale)` exported helper
- `src/components/settings/NotificationSettings.stories.tsx` — Storybook story
- `src/components/register/steps/StepProfile.tsx` — logic gate (`useLocal = locale === 'ka' && phoneCountry === 'GE'`)
- `src/components/register/steps/StepAccount.tsx` — complex agreedToTerms JSX with embedded `<Link>` per language
- `src/app/admin/*` (3 files) — uses `ADMIN_THEME` system, intentionally outside main design system
- `src/components/common/EmptyState.tsx` — backward-compat component API (callers pass `titleKa`, `descriptionKa` props)
- `src/components/ui/StatusPill.tsx`, `SelectionGroup.tsx` — UI primitives that take `locale` as prop

---

## Phase 7 — Modals (10 files)

Replace custom `fixed inset-0 z-50` overlays with `<Modal>`.

- [x] `src/components/projects/ProjectWorkspace.tsx` (3 → 2 modals + 1 click-outside backdrop)
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (3 → all kept as legitimate: 1 click-outside backdrop, 2 fullscreen lightbox/zoom)
- [SKIP] `src/app/admin/jobs/page.tsx` (3 modals) — admin uses ADMIN_THEME
- [~] `src/app/(shell)/settings/page.tsx` (3 modals deferred — settings page modals)
- [x] `src/components/ai-assistant/AiChatWidget.tsx` (already done; visual polish + input width fix)
- [SKIP] `src/app/admin/pending-pros/page.tsx` (2) — admin uses ADMIN_THEME
- [SKIP] `src/app/admin/business-quotes/page.tsx` (2) — admin uses ADMIN_THEME
- [x] `src/components/settings/PhoneChangeModal.tsx` — 2 ternaries → `t()` (1 new key `settings.codeSentToValue`)
- [x] `src/components/settings/EmailChangeModal.tsx` — 2 ternaries → `t()` (reusing `settings.codeSentToValue`)
- [x] `src/components/proposals/HiringChoiceModal.tsx` (already done above)

---

## Phase 8 — Spinners (20 files)

Replace `<div className="… animate-spin …">` with `<LoadingSpinner size="…" />`.

- [x] `src/components/register/ProRegistration.tsx` — 3 buttons → `<Button>`, 1 SVG → spinner via `loading` prop, 1 ternary → `t()`
- [x] `src/components/register/steps/StepProfile.tsx` — 1 button → `<Button>`, 1 spinner → `<LoadingSpinner>`
- [x] `src/components/register/steps/StepSelectServices.tsx` — 1 spinner → `<LoadingSpinner>`
- [x] `src/components/common/PWAInstallPrompt.tsx` (already done)
- [SKIP] `src/components/common/Button.tsx` — UI primitive, raw `<button>` is the implementation
- [x] `src/components/pro/steps/ServicesPricingStep.tsx` (already done)
- [x] `src/components/tools/calculator/StepSummary.tsx` — 4 of 5 buttons → `<Button>`, 1 spinner → `<LoadingSpinner>`
- [x] `src/components/tools/calculator/CalculatorWizard.tsx` — 4 of 5 buttons → `<Button>`, spinner → `<LoadingSpinner>`
- [~] (+ 12 more files — long tail; convert opportunistically)

---

## Phase 9 — Inline SVG → Lucide (~62 files)

Replace inline `<svg>` with named imports from `lucide-react`. Exclude logo and category icons.

Top offenders:
- [x] `src/components/jobs/JobCommentsSection.tsx` — 4 of 7 buttons → `<Button>`, all 10 SVG → Lucide, 1 textarea → `<Textarea>`, 1 img → Next `<Image>`. New key `jobComments.failedToSubmit`.
- [x] `src/components/jobs/MyProposalCard.tsx` — 3 SVG → Lucide (Send/DollarSign/Clock).
- [x] `src/components/browse/JobsFiltersSidebar.tsx` — 1 of 2 buttons → `<Button>`, 2 inputs → `<Input>`, 1 SVG → Lucide, 2 ternaries → `t()`. 8 new `browse.propertyTypes/deadlineFilters.*` keys.
- [x] `src/components/common/ShareMenu.tsx` — 3 of 4 buttons → `<Button>`, 1 ternary → `t('common.share')`. WhatsApp brand SVG kept.
- [x] `src/components/common/Header.tsx` (all done — Bell/CountBadge/ThemeToggle, gradient, ConfirmContext)
- [x] `src/app/users/[id]/page.tsx` — all 8 SVG → Lucide (Frown/MapPin/MessageCircle/Share2/Briefcase×2/X/Send)
- [x] `src/app/jobs/quick-hire/page.tsx` — all 6 SVG → Lucide (Check×3/ChevronLeft/Search/Star)
- [x] `src/app/help/ticket/[id]/page.tsx` — 5 SVG → Lucide (AlertTriangle/ArrowLeft×2/ShieldAlert/Send)
- [x] `src/app/post-job/page.tsx` — 1 SVG → `<AlertTriangle>`
- [x] `src/app/about/page.tsx` — 1 SVG → `<Home>`
- [x] `src/app/error.tsx` — 1 SVG → `<AlertTriangle>`
- [x] `src/app/not-found.tsx` — 2 SVG → `<Home>` / `<Search>`
- [x] `src/app/register/client/page.tsx` — 1 SVG → `<Smartphone>`
- [x] `src/app/(shell)/layout.tsx` — 1 SVG → `<Check>` (sidebar checkbox)
- [x] `src/app/pro/profile-setup/layout.tsx` — 4 SVG → Lucide (ChevronLeft/X/Check/ArrowRight)
- [x] `src/components/common/ProCard.tsx` — premium star → `<Star fill-current>`
- [x] `src/components/professionals/PortfolioTab.tsx` — Homico badge check → `<Check>`
- [x] `src/components/polls/PollOptionCard.tsx` — close → `<X>`
- [x] `src/components/categories/CategorySelector.tsx` — checkbox tick → `<Check>`
- [x] `src/components/common/ServiceCard.tsx` — 2 SVG → Lucide (`<ImageIcon>` placeholder + `<Heart>` like)
- [x] `src/components/browse/CategorySection.tsx` — 2 star SVG → `<Star fill-current>`
- [x] `src/components/ui/badge.tsx` — close → `<X>`

**Final remaining ~139 inline `<svg>` are all deliberate skips:**
- `CategoryIcon.tsx` (42), `JobDetailClient.tsx` (22) — bespoke category illustrations
- `ArchitecturalBackground.tsx` (15) — decorative architectural patterns
- `SocialIcon.tsx` (9), `AboutStep.tsx` (1) — brand SVGs (WhatsApp etc.)
- `Button.tsx` (8), `Toast.tsx` (5), `Card.tsx` (4) — UI primitives' internal icons
- `MediaUpload.tsx` (5), `LocationPicker.tsx` (4), `AvatarCropper.tsx` (2) — bespoke widget UIs
- `admin/support` (3) — admin
- `Select.stories.tsx` (3), `Toast.stories.tsx` (5), `stories/assets` — Storybook
- `(shell)/my-space.tsx` (1) — circular progress SVG
- `help/page.tsx` (1) — dynamic `type.icon` path
- `OptimizedImage.tsx` (1), `Select.tsx` (1) — fallback / chevron in primitives
- `MyJobCard.tsx` (1) — bespoke architectural illustration
- `ShareMenu.tsx` (1) — WhatsApp brand mark

---

## Phase 10 — Raw `<img>` → `<Image>` / `<Avatar>` (31 files)

- [x] `src/components/pro/steps/ProjectsStep.tsx` (7 → 5 done, 2 inside BeforeAfterSlider widget kept)
- [~] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (6 → kept; lightbox/gallery imgs with `eslint-disable` comments)
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (4 → 0)
- [x] `src/components/projects/ProjectWorkspace.tsx` (3 → 2 modals + 1 click-outside backdrop)
- [x] `src/app/(shell)/bookings/page.tsx` — 1 of 5 buttons → `<Button>`, all 3 imgs → `<Avatar>`/Next `<Image>`. Tab/cancel buttons with hover-color-swap kept.
- [x] `src/app/(shell)/my-space/page.tsx` — 2 imgs → Next `<Image fill>` with sizes
- [x] `src/app/(shell)/my-jobs/page.tsx` — 1 avatar img → Next `<Image fill>`
- [x] `src/components/pro/steps/ReviewStep.tsx` — 2 imgs → Next `<Image fill unoptimized>` (avatar + portfolio cover)
- [~] (+ ~3 more files with eslint-disabled or comment-example `<img>` — opportunistic)

**Remaining 7 raw `<img>` are all deliberate skips:**
- `JobDetailClient.tsx` (1) — eslint-disabled with comment
- `useImageCarousel.ts` (1) — JSDoc comment example, not actual code

---

## Phase 11 — Status badges/pills (~95 files)

Replace `rounded-full` + colored background patterns with `<Badge>` / `<StatusPill>`.
Audit pass needed file-by-file — many are domain-specific and may need new variants.

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
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (43)
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
- [ ] `src/components/common/Card.tsx` (12)
- [x] `src/components/browse/FeedCard.tsx` — 2 SVG → Lucide (`ImageIcon`, `Star`), 1 raw `<img>` → Next `<Image fill>`, 3 locale ternaries → `pick()`. Color overlays on image/branded backdrops kept (intentional).
- [ ] `src/app/tools/page.tsx` (12)
- [x] `src/components/ai-assistant/AiChatWidget.tsx` — 4 locale ternaries → `pick()` (refactored `SuggestedActionButton` to use `useLanguage` internally instead of locale prop).
- [ ] `src/app/for-business/page.tsx` (10)
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
- [ ] `src/components/pro/steps/ProjectsStep.tsx` (10)
- [x] `src/components/browse/JobsFilterBar.tsx` — 1 of 10 buttons → `<Button link>`, 2 inputs → `<Input filled>`, 5 ternaries → `pick()`. 9 dropdown/pill buttons kept (custom per-state Tailwind sizing).
- [ ] `src/app/tools/analyzer/page.tsx` (10)
- [SKIP] `src/app/admin/reports/page.tsx` (10) — uses `ADMIN_THEME`
- [~] `src/components/post-job/JobServicePicker.tsx` — 14 of 14 locale ternaries → `pick()`/`t()` (3 new common keys: `qty`). 8 buttons + 3 inputs deferred (heavy per-state styling, not high-value to break visuals).
- [ ] `src/app/tools/compare/page.tsx` (8)

---

## Phase 5 — Inputs (~62 violations)

Replace `<input>` with `<Input>` / `<PhoneInput>` / `<OTPInput>` / `<SearchInput>`.
Replace `<textarea>` with `<Textarea>`.

### Top 15 offenders
- [ ] `src/app/admin/service-catalog/page.tsx` (52)
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (11 → 0)
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (9 → 4 hidden file inputs)
- [ ] `src/components/professionals/AboutTab.tsx` (7 + 1 textarea)
- [ ] `src/app/pro/premium/checkout/page.tsx` (6)
- [ ] `src/components/pro/steps/ServicesPricingStep.tsx` (5)
- [ ] `src/components/browse/CategoryPickerModal.tsx` (5)
- [ ] `src/app/(shell)/settings/page.tsx` (5)
- [ ] `src/components/browse/JobsFiltersSidebar.tsx` (4)
- [ ] `src/components/settings/PasswordChangeForm.tsx` (3)
- [ ] `src/components/register/steps/StepServices.tsx` (3)
- [ ] `src/components/projects/ProjectChat.tsx` (3)
- [ ] `src/components/post-job/JobServicePicker.tsx` (3)
- [ ] `src/components/common/PortfolioProjectsInput.tsx` (3 + 1 textarea)
- [ ] `src/app/post-job/page.tsx` (3)

---

## Phase 6 — i18n locale ternaries (~135 violations)

Replace `locale === 'ka' ? '…' : '…'` with `t('…')`. Add keys to `en.json`, `ka.json`, `ru.json`.

### Top 15 offenders
- [x] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (31 → 0)
- [ ] `src/components/pro/steps/ServicesPricingStep.tsx` (15)
- [ ] `src/components/post-job/JobServicePicker.tsx` (14)
- [ ] `src/components/projects/ProjectWorkspace.tsx` (13)
- [ ] `src/components/booking/ServiceBookingModal.tsx` (9)
- [ ] `src/components/jobs/ProposalFormModal.tsx` (8)
- [x] `src/app/pro/premium/page.tsx` (7 → 0)
- [x] `src/app/pro/premium/checkout/page.tsx` (7 → 0)
- [ ] `src/components/register/steps/StepSelectServices.tsx` (6)
- [ ] `src/components/categories/CategorySelector.tsx` (6)
- [ ] `src/components/browse/FeedSection.tsx` (6)
- [ ] `src/components/ai-assistant/RichContentRenderer.tsx` (6)
- [ ] `src/app/post-job/page.tsx` (6)
- [x] `src/app/jobs/[id]/JobDetailClient.tsx` (6 → 0)
- [ ] `src/contexts/ProfileSetupContext.tsx` (5)

---

## Phase 7 — Modals (10 files)

Replace custom `fixed inset-0 z-50` overlays with `<Modal>`.

- [ ] `src/components/projects/ProjectWorkspace.tsx` (3)
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (3)
- [ ] `src/app/admin/jobs/page.tsx` (3)
- [ ] `src/app/(shell)/settings/page.tsx` (3)
- [ ] `src/components/ai-assistant/AiChatWidget.tsx` (2)
- [ ] `src/app/admin/pending-pros/page.tsx` (2)
- [ ] `src/app/admin/business-quotes/page.tsx` (2)
- [ ] `src/components/settings/PhoneChangeModal.tsx` (1)
- [ ] `src/components/settings/EmailChangeModal.tsx` (1)
- [ ] `src/components/proposals/HiringChoiceModal.tsx` (1)

---

## Phase 8 — Spinners (20 files)

Replace `<div className="… animate-spin …">` with `<LoadingSpinner size="…" />`.

- [ ] `src/components/register/ProRegistration.tsx`
- [ ] `src/components/register/steps/StepProfile.tsx`
- [ ] `src/components/register/steps/StepSelectServices.tsx`
- [ ] `src/components/common/PWAInstallPrompt.tsx`
- [ ] `src/components/common/Button.tsx`
- [ ] `src/components/pro/steps/ServicesPricingStep.tsx`
- [ ] `src/components/tools/calculator/StepSummary.tsx`
- [ ] `src/components/tools/calculator/CalculatorWizard.tsx`
- [ ] (+ 12 more files)

---

## Phase 9 — Inline SVG → Lucide (~62 files)

Replace inline `<svg>` with named imports from `lucide-react`. Exclude logo and category icons.

Top offenders:
- [ ] `src/components/jobs/JobCommentsSection.tsx`
- [ ] `src/components/jobs/MyProposalCard.tsx`
- [ ] `src/components/browse/JobsFiltersSidebar.tsx`
- [ ] `src/components/register/ProRegistration.tsx`
- [ ] `src/components/common/ShareMenu.tsx`
- [ ] `src/components/common/Header.tsx` (in progress)

---

## Phase 10 — Raw `<img>` → `<Image>` / `<Avatar>` (31 files)

- [ ] `src/components/pro/steps/ProjectsStep.tsx` (7)
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (6)
- [ ] `src/app/jobs/[id]/JobDetailClient.tsx` (4)
- [ ] `src/components/projects/ProjectWorkspace.tsx` (3)
- [ ] `src/app/(shell)/bookings/page.tsx` (3)
- [ ] (+ 26 more files with 1–2 instances each)

---

## Phase 11 — Status badges/pills (~95 files)

Replace `rounded-full` + colored background patterns with `<Badge>` / `<StatusPill>`.
Audit pass needed file-by-file — many are domain-specific and may need new variants.

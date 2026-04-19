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
- [ ] `src/components/common/Header.tsx` (17)
- [ ] `src/app/pro/premium/page.tsx` (16)
- [ ] `src/components/pro/steps/ProjectsStep.tsx` (13)
- [ ] `src/components/common/PWAInstallPrompt.tsx` (13)
- [ ] `src/components/common/Card.tsx` (12)
- [ ] `src/components/browse/FeedCard.tsx` (12)
- [ ] `src/app/tools/page.tsx` (12)
- [ ] `src/components/ai-assistant/AiChatWidget.tsx` (10)
- [ ] `src/app/for-business/page.tsx` (10)
- [ ] `src/components/professionals/PortfolioCard.tsx` (9)
- [ ] `src/components/critical-notification/CriticalNotificationOverlay.tsx` (9)
- [ ] `src/app/how-it-works/page.tsx` (9)
- [ ] `src/components/proposals/HiringChoiceModal.tsx` (8)

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
- [ ] `src/app/admin/service-catalog/page.tsx` (40)
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (26)
- [ ] `src/app/jobs/[id]/JobDetailClient.tsx` (16)
- [ ] `src/app/admin/jobs/page.tsx` (15)
- [ ] `src/components/pro/steps/ServicesPricingStep.tsx` (12)
- [ ] `src/components/browse/BrowseFilterBar.tsx` (12)
- [ ] `src/app/post-job/page.tsx` (12)
- [ ] `src/app/admin/invites/page.tsx` (12)
- [ ] `src/components/projects/ProjectWorkspace.tsx` (11)
- [ ] `src/components/pro/steps/ProjectsStep.tsx` (10)
- [ ] `src/components/browse/JobsFilterBar.tsx` (10)
- [ ] `src/app/tools/analyzer/page.tsx` (10)
- [ ] `src/app/admin/reports/page.tsx` (10)
- [ ] `src/components/post-job/JobServicePicker.tsx` (8)
- [ ] `src/app/tools/compare/page.tsx` (8)

---

## Phase 5 — Inputs (~62 violations)

Replace `<input>` with `<Input>` / `<PhoneInput>` / `<OTPInput>` / `<SearchInput>`.
Replace `<textarea>` with `<Textarea>`.

### Top 15 offenders
- [ ] `src/app/admin/service-catalog/page.tsx` (52)
- [ ] `src/app/jobs/[id]/JobDetailClient.tsx` (11)
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (9)
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
- [ ] `src/app/professionals/[id]/ProfessionalDetailClient.tsx` (31)
- [ ] `src/components/pro/steps/ServicesPricingStep.tsx` (15)
- [ ] `src/components/post-job/JobServicePicker.tsx` (14)
- [ ] `src/components/projects/ProjectWorkspace.tsx` (13)
- [ ] `src/components/booking/ServiceBookingModal.tsx` (9)
- [ ] `src/components/jobs/ProposalFormModal.tsx` (8)
- [ ] `src/app/pro/premium/page.tsx` (7)
- [ ] `src/app/pro/premium/checkout/page.tsx` (7)
- [ ] `src/components/register/steps/StepSelectServices.tsx` (6)
- [ ] `src/components/categories/CategorySelector.tsx` (6)
- [ ] `src/components/browse/FeedSection.tsx` (6)
- [ ] `src/components/ai-assistant/RichContentRenderer.tsx` (6)
- [ ] `src/app/post-job/page.tsx` (6)
- [ ] `src/app/jobs/[id]/JobDetailClient.tsx` (6)
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

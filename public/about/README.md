# /about page photos

Drop two images here to populate the About page founder + team sections.
Until they exist, the page shows a tasteful brand-tinted icon placeholder.

| File | Used for | Recommended |
|------|----------|-------------|
| `founder.jpg` | Founder portrait (editorial letter) | Portrait orientation, ~1200x1500 (4:5), face centered |
| `team.jpg` | Team photo band | Landscape, ~1600x900 (16:9) |

Notes:
- Filenames must match exactly (`founder.jpg`, `team.jpg`). If you use `.png`/`.webp`,
  update the `src` in `src/app/about/page.tsx`.
- After adding `founder.jpg`, also set the real founder name in:
  - `src/locales/{en,ka,ru}.json` -> `about.founder.name`
  - `src/app/about/layout.tsx` -> `FOUNDER_NAME` (for SEO structured data)
- Next.js optimizes/crops these automatically via `next/image`.

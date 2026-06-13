# UI / UX Guidelines

ClassMate's look is **light, playful and neutral** — friendly, calm and clear, never
heavy or "techy." No dark theme by default.

## Research-backed principles

Grounded in 2025–2026 mobile UI/UX trends and the most-loved student planners
(MyStudyLife, Power Planner):

- **Clarity-first minimalism** — clean layouts, purposeful whitespace, one clear
  primary action per screen. Minimal ≠ feature-poor; it means focused.
- **Color-coded organization** — every course gets a color; that color follows it
  across the calendar, notes, quizzes and homework. This is the single biggest
  usability win in top planner apps.
- **Soft, tactile surfaces** — rounded cards with gentle shadows (a restrained nod
  to neomorphism) so the UI feels approachable and touchable.
- **Microinteractions** — small, fast feedback animations on taps, toggles,
  completing homework, etc. They delight without slowing anyone down.
- **Mobile-first, thumb-friendly** — bottom navigation, large tap targets (≥44px),
  reachable primary actions. It's a PWA people install on their phone.
- **Low cognitive load** — the home screen answers "what's next?" instantly.

## Design tokens

> Defined as CSS variables in `frontend/src/app/globals.css` and mapped into Tailwind.

### Color
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAF8F5` | app background (warm off-white) |
| `--surface` | `#FFFFFF` | cards, sheets |
| `--surface-muted` | `#F3F1EC` | subtle fills |
| `--primary` | `#5B5BD6` | primary actions, active nav (friendly indigo) |
| `--primary-soft` | `#ECEBFB` | primary tints / selected backgrounds |
| `--accent` | `#FF8A5B` | playful highlight (warm coral) — e.g. "next class" |
| `--success` | `#22C55E` | submitted homework, confirmations |
| `--warning` | `#F59E0B` | due-soon |
| `--danger` | `#EF4444` | overdue, destructive |
| `--text` | `#1F2430` | primary text (soft black) |
| `--text-muted` | `#6B7280` | secondary text |
| `--border` | `#ECE9E3` | hairline borders |

**Course palette** (assigned round-robin to courses): soft pastels —
`#A7C7FF`, `#FFD3A5`, `#B5EAD7`, `#FFB5C2`, `#D7BDFF`, `#FDE68A`, `#9DECF9`, `#C3F584`.

### Shape & elevation
- Radius: cards `20px`, buttons/inputs `14px`, chips/pills `999px`.
- Shadow: `0 4px 20px rgba(31,36,48,0.06)` — soft, low.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32.

### Typography
- Font: **Plus Jakarta Sans** (rounded, friendly, modern) for everything; system
  fallback. Loaded via `next/font`.
- Scale: Display 28/700, H1 22/700, H2 18/600, Body 15/500, Caption 13/500.

## Layout patterns
- **Bottom nav** (mobile): Home · Courses · Add (+) · Homework · Settings.
- **Home**: a horizontal week strip (today highlighted), a prominent **"Next class"**
  card (coral accent), then a scrollable agenda of the day/week.
- **Cards everywhere**: classes, quizzes, homework and notes are soft cards with the
  course color as a left rail or chip.
- **Empty states**: friendly illustration + a single clear CTA.
- **Sheets/modals**: bottom sheets on mobile for add/edit forms.

## Accessibility
- Contrast ≥ 4.5:1 for text. Don't rely on color alone — pair course color with the
  course code/label. Respect `prefers-reduced-motion`. Visible focus rings.

## Sources
- [Key Mobile App UI/UX Design Trends 2026 — Elinext](https://www.elinext.com/services/ui-ux-design/trends/key-mobile-app-ui-ux-design-trends/)
- [Mobile App UI/UX Design Trends — Mindinventory](https://www.mindinventory.com/blog/mobile-app-ui-ux-design-trends/)
- [16 Key Mobile App UI/UX Design Trends 2026 — Spdload](https://spdload.com/blog/mobile-app-ui-ux-design-trends/)
- [9 Best Student Planner Apps 2025 — FixThePhoto](https://fixthephoto.com/best-student-planner-app.html)
- [10 Best Student Planner Apps 2026 — Planwiz](https://blog.planwiz.app/top-daily-planner-apps-for-students/)

# NetShield design system

Source of truth: `apps/web/src/styles/` (tokens, base, components, layout) and `apps/web/src/components/ui.tsx`. Do not add one-off page styles; extend a token or component.

## Principles
1. **Answer first, detail on request.** Lead with the human symptom and one action; technical facts live behind `TechDetails` ("Show technical details").
2. **Every issue uses `AlertCard`:** What happened → Why it matters → What you can do → How we'll check it worked, plus evidence and an optional technical section.
3. **Never colour alone.** Status is a `Pill` (icon + words). Demo data always carries a `Demo · synthetic data` pill/banner.
4. **Honest states.** Loading (`Loading`), error (`ErrorState`), empty (`EmptyState`), offline/unconfigured/needs-setup copy exists for every page; unsupported controls are disabled and say what they need.

## Tokens (`tokens.css`)
Dark default, light via `data-theme="light"` or OS preference, user choice persisted (`ns-theme`). Surfaces `--bg/--bg-elev/--surface/--surface-2`; text `--text/--text-muted/--text-faint`; brand `--accent*` (cyan/teal); semantics `--ok/--warn/--danger/--info/--neutral` each with a `-soft` tint; radii, spacing scale (4–112px), shadows, focus ring, hero gradient. System fonts only (no third-party requests).

## Components
`Button`, `LinkButton`, `Pill`, `Banner`, `EmptyState`, `Loading`, `ErrorState`, `Disclosure` (FAQ), `TechDetails`, `Help` (click/focus tooltip), `Dialog` (native `<dialog>`: focus trap, Esc), `Field` (label + hint + error wiring), `Stepper`, `LineChart` (SVG with text alternative), `Logo`; layouts `PublicLayout`, `AppLayout` (sidebar on desktop, bottom nav + "More" sheet on phones).

## Terminology rules
| Instead of | Say |
|---|---|
| DNS resolution failure | Websites are having trouble loading |
| High latency / jitter | Your internet is responding slowly / unevenly |
| Unrecognized MAC address | A device we don't recognize appeared on your network |
| Vulnerability / threat | Something worth checking |
| Secure / protected | *(never claimed)* — say "confirmed" only when NetShield verified it |
Tone: calm, friendly, no fear-based language, no exaggerated counts.

## Accessibility standards (target WCAG 2.2 AA)
Semantic landmarks and one `h1` per page with ordered headings; skip link; visible focus ring; all controls ≥24px (primary actions 44–46px); labels on every input with associated hints/errors (`role="alert"`); `aria-expanded` disclosure buttons; live regions for async results; reduced-motion support; scrollable tables are focusable regions; chart text alternatives; no hover-only information.

## How quality is checked
- `npm test`: component/flow tests incl. axe (structure, labels, roles) on public and demo pages.
- `node qa/audit.mjs <outDir> [baseUrl] [pageFilter]`: real Chrome/Edge via `playwright-core` — full-page screenshots at phone (390), tablet (820), desktop (1440) in dark and light, axe WCAG 2.0–2.2 A/AA + best-practice **including colour contrast**, horizontal-overflow and target-size checks. Needs `npm run build && npx vite preview --port 4173`.

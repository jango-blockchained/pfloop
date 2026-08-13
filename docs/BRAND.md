# Pfloop — Corporate Identity

Brand system for the Pfand-Abhol-PWA (formerly GrabMe).

## Name

| | |
|---|---|
| **Brand** | Pfloop |
| **Pronunciation** | /pfloːp/ (like German “Pfand” + playful “plop”) |
| **Etymology** | **Pf**and + **Loop** — deposit bottles stay in the circular economy |
| **Legal / product** | Pfloop (Diensteanbieter-Name in Impressum, AGB, Datenschutz) |

### Do / don’t

- **Do:** Pfloop (one word, capital P)
- **Don’t:** PFLOOP, pfLoop, P-Floop, GrabMe, Grab Me

## Positioning

Pfloop connects people who have deposit bottles (Pfand) with people who pick them up. Payment is the deposit value itself. The brand feels **local, circular, light, and trustworthy** — not corporate logistics.

### Taglines

| Use | DE | EN (internal) |
|-----|----|----------------|
| Primary | Pfand im Loop | Deposit in the loop |
| Product / PWA | Pfand abholen | Pick up deposits |
| Meta description | Pfand-Angebote in der Nähe finden und selbst einstellen | Find nearby deposit offers and list your own |
| Footer | kostenloser Pfand-Dienst | free deposit service |

## Voice & tone

| Trait | Practice |
|-------|----------|
| Clear | Short German sentences, everyday words (Abholer, Inserent, Pfand) |
| Friendly | “Hi!”, soft CTAs, no hype |
| Direct | Legal pages stay factual; product UI avoids jargon |
| Local | DE-first; system UI strings in German |

### Sample lines

- Install: „Pfloop aufs Handy legen?“
- Email subject: „Dein Login-Link für Pfloop“
- Cookie: „…damit Pfloop funktioniert.“

## Logo system

### Mark (app icon / favicon / header)

- Rounded tile (`rx ≈ 22%` of size)
- **Continuous loop** (circular stroke with arrow tip) = circular economy
- **Bottle** silhouette in the center with **amber cap** = Pfand
- Readable down to ~16px; favicon simplifies stroke weight

Files:

| File | Role |
|------|------|
| `public/logo-mark.svg` | Primary mark |
| `public/logo.svg` | Horizontal lockup: mark + wordmark |
| `public/favicon.svg` | 32px-optimized mark |
| `public/pwa-192.png`, `pwa-512.png` | PWA / install |
| `public/apple-touch-icon.png` | iOS home screen |
| `public/favicon-32.png`, `logo-mark-64.png` | Raster fallbacks |

### Wordmark

- Text: **Pfloop**
- Weight: semibold / ~750
- Tracking: slightly tight (`-0.02em`)
- Color on light: ink `#0f1221`; on dark: white
- Font stack: Segoe UI, system-ui, -apple-system, sans-serif (no custom webfont yet)

### Clear space

Keep empty margin ≥ **¼ of mark height** around the mark. Do not place on busy photos without a soft scrim.

### Don’t

- Recolor the amber cap to brand violet (cap = Pfand accent)
- Stretch or rotate the loop mark
- Add drop shadows on the mark in UI chrome (tile already has depth via gradient)

## Color

### Brand

| Token | Hex | Role |
|-------|-----|------|
| `--brand` | `#5B4FE9` | Primary actions, links, focus |
| `--brand-hover` | `#6D63F0` | Hover / active lift |
| `--brand-deep` | `#4538C7` | Pressed, emphasis text on soft |
| `--brand-soft` | `#EEEDFE` | Soft chips, selected rows |
| `--brand-soft-border` | `#C7C3F9` | Borders on soft surfaces |
| `--brand-bright` | `#818CF8` | Gradient highlight |
| Cap accent | `#F59E0B` | Logo bottle cap only (not UI chrome) |
| Dark chrome | `#0F1221` | Top bar / splash / status bar |

### Semantic (unchanged roles)

| Token | Hex |
|-------|-----|
| Danger | `#b91c1c` |
| Warn | `#b45309` |
| OK | `#047857` |
| Info | `#0e7490` |

### Surfaces

| Token | Hex |
|-------|-----|
| `--bg-app` | `#f4f5f7` |
| `--surface` | `#ffffff` |
| `--text` | `#0f1221` |
| `--muted` | `#64748b` |
| `--border` | `#e2e8f0` |

### CSS source of truth

All app chrome colors live in `src/react-app/index.css` `:root`. Hardcoded hex is only allowed for:

- SVG logo fills
- Map path colors (must match `--brand` / `--brand-bright`)
- Native splash / status bar / theme-color meta

### Contrast

- Primary buttons: white text on `--brand` (WCAG AA for UI)
- Soft chips: `--brand-deep` text on `--brand-soft`
- Focus ring: `rgba(91, 79, 233, 0.35)` + solid brand outline

## Typography

| Role | Spec |
|------|------|
| UI | system-ui stack, 16px base, line-height 1.5 |
| Brand name | weight 700–750, tight tracking |
| Legal body | same stack; headings h2 weight 600 |

No custom brand font in v1 (keeps PWA lean).

## Shape & motion

| Token | Value |
|-------|-------|
| Radius scale | `0.4rem` → `1.1rem`, pills `999px` |
| Mark tile radius | ~22% of edge |
| Transition | `200ms` ease out; fast `140ms` |
| Primary CTA | brand gradient + soft brand shadow |

## Product UI patterns

- **Header:** mark 32×32 + wordmark “Pfloop”
- **Primary button:** brand gradient, white label
- **Map markers / routes:** brand + bright indigo
- **Success / eco cues:** keep green semantic (`--ok`), not brand violet

## Copy checklist (user-facing)

Replace every product name occurrence of GrabMe with **Pfloop** in:

- Layout brand + footer
- Install prompt, cookie banner
- Impressum, Datenschutz, AGB, Cookies
- Magic-link email (from display name, subject, body)
- PWA name / short_name / HTML title & description
- Native display names (Android `app_name`, iOS display name)

## Technical identifiers

Prefer **pfloop** for new user-facing keys. Infra that would break live deploy may keep legacy names until a planned migration:

| Identifier | Target | Notes |
|------------|--------|-------|
| Display name | Pfloop | Always |
| npm package | `pfloop` | `package.json` |
| Session cookie | `pfloop_session` | Logs existing sessions out |
| Consent keys | `pfloop-cookie-consent`, etc. | Resets consent once |
| Health `service` | `pfloop` | |
| EMAIL_FROM | `Pfloop <…>` | |
| Capacitor `appName` | Pfloop | |
| App ID / schemes | keep or migrate carefully | Store listings & deep links |
| CF Worker / D1 name | keep `grabme` until cutover | Avoid orphaning production DB/URL |
| Production host | `grabme.cryptolinx.workers.dev` until cutover | Document in Impressum if still live |

## Asset export sizes

| Asset | Size |
|-------|------|
| Favicon PNG | 32×32 |
| Mark PNG | 64×64 |
| Apple touch | 180×180 |
| PWA | 192×192, 512×512 |
| Android adaptive | use mark on brand tile |
| iOS AppIcon | 1024 source from mark |

Regenerate rasters from SVGs after any mark change:

```bash
# example
rsvg-convert -w 512 -h 512 public/logo-mark.svg -o public/pwa-512.png
```

# GrabMe

PWA zum **Inserieren und Abholen von Flaschenpfand** (deutsches Pfandsystem).

- Inserenten stellen Angebote (Flaschen, Dosen, Kästen) mit Adresse und Pfandwert ein
- Abholer sehen Angebote auf einer Karte, nehmen an und holen innerhalb von **6 Stunden** ab
- „Bezahlung“ ist der **Pfandwert** selbst
- **Mindest-Pfandwert: 3 €** (einmalig und wöchentlich)
- **Wöchentliche Angebote:** bis 2 pro Nutzer, Bewerben → Inserent wählt Abholer
- Service zunächst **kostenlos**
- Hosting & DB: **Cloudflare Workers + D1**

## Stack

| Teil | Technik |
|------|---------|
| Frontend | React + Vite + Leaflet (OSM), PWA |
| API | Hono auf Cloudflare Workers |
| DB | Cloudflare D1 (SQLite) |
| Jobs | Cron alle 5 Min. → abgelaufene Reservierungen freigeben |

## Domain-Regeln

- Pfand in **Cent** gespeichert, Minimum **300** (€3)
- Einmalig: Annahme → Status `reserved`, Deadline = jetzt + **6h**
- Wöchentlich: Bewerbung → Inserent wählt → Status `assigned` (verborgen bis Freigabe)
- Volle Adresse nur für Inserent und aktiven / gewählten Abholer
- Nach Timeout (einmalig): Reservierung `released`, Angebot wieder `open`
- Einmalig-Abschluss in 2 Schritten: **Abholer** meldet „Abgeholt“ → **Inserent** bestätigt.
  Solange nicht erledigt, kann der Abholer kein neues einmaliges Angebot annehmen.

## Lokal starten

Voraussetzungen: Node 20+, npm, Cloudflare-Account (für Remote-Deploy).

```bash
npm install

# D1-Migrationen lokal anwenden
npm run db:migrate:local

# Dev-Server (Vite + Worker-Runtime)
npm run dev
```

Öffne die URL von Vite (meist `http://localhost:5173`).

### Login (Magic-Link)

1. Unter **Login** E-Mail eingeben → „Login-Link senden“
2. **Ohne** `RESEND_API_KEY`: der Link erscheint in der UI (Dev-Modus) und in den Worker-Logs
3. **Mit** Resend: `wrangler secret put RESEND_API_KEY` und optional `EMAIL_FROM` / `APP_URL` in `wrangler.jsonc`

```bash
# Optional: E-Mail-Versand
cp .dev.vars.example .dev.vars
# RESEND_API_KEY=re_... eintragen
```

### API-Check

```bash
curl http://localhost:5173/api/health
```

## Live

- **App:** https://grabme.cryptolinx.workers.dev  
- **D1:** `grabme` (`6ecf6cda-1c19-4e40-9de6-ca838565f852`)  
- **Cron:** alle 5 Min. (Reservierungen freigeben)

Lokal: `.dev.vars` setzt `APP_URL=http://localhost:5173` (nicht committen).

## Deploy (Cloudflare)

```bash
npm run db:migrate:remote   # bei Schema-Änderungen
npm run deploy
npm run cf-typegen          # nach Binding-Änderungen
```

Optional E-Mail: `npx wrangler secret put RESEND_API_KEY`

## Projektstruktur

```
migrations/           # D1 SQL
src/worker/           # Hono API + Cron
src/react-app/        # PWA UI (Karte, Angebote, Login)
wrangler.jsonc        # Worker, D1, Cron, Assets
```

## PWA

- Installierbar (Chrome/Edge: Install-Banner; iOS: Teilen → Zum Home-Bildschirm)
- Service Worker cached App-Shell + OSM-Kacheln; `/api/*` immer Network-Only
- Offline-Banner wenn keine Verbindung

## Adressen (Profil)

- Unter **Konto** (`/profil`) bis zu 8 Adressen speichern (Label, volle Adresse, Stadtteil, Kartenpunkt)
- Eine Adresse als **Standard** → wird im Angebot-Formular vorausgefüllt
- Im Formular wählbar per Dropdown; optional „Diese Adresse im Konto speichern“

## Android & iOS (Capacitor)

Native App-Shells (`dev.cryptolinx.grabme`) laden standardmäßig die Live-App,
damit Login-Cookies und API same-origin bleiben.

```bash
# Android (Linux/Mac + Android SDK)
npm run android:sync
npm run android:open    # Android Studio
npm run android:apk     # → exports/GrabMe-debug.apk

# iOS (macOS + Xcode required to build/run)
npm run ios:sync
npm run ios:open        # Xcode

# Both platforms
npm run cap:sync
```

| Platform | Docs |
|----------|------|
| Android | [docs/ANDROID.md](docs/ANDROID.md) |
| iOS | [docs/IOS.md](docs/IOS.md) |

## Roadmap

| Phase | Inhalt |
|-------|--------|
| **0** | Scaffold, Schema, API, Karten-Shell |
| **1** | Magic-Link-Auth, HttpOnly-Sessions |
| **2** | Annehmen-UI, Countdown, Complete/Cancel |
| **3** | PWA-Polish, Mobile Sheet, Geolocation |
| **4** | Capacitor Android + iOS shells |
| Später | Push, Fotos (R2), Bewertungen |

## Lizenz

Private / TBD.

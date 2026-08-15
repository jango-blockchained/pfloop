<!--
  SPDX-FileCopyrightText: 2026 CryptoLinx <info@cryptolinx.de>
  SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
-->
# Pfloop — iOS (Capacitor)

Native iOS shell around the Pfloop PWA. Same approach as Android: the WKWebView
loads the **live** app at `https://pfloop.cryptolinx.workers.dev` so magic-link
sessions and `/api` stay same-origin.

| | |
|---|---|
| **Bundle ID** | `dev.cryptolinx.grabme` |
| **Display name** | Pfloop |
| **Min iOS** | 15.0 |
| **Project** | `ios/App/App.xcodeproj` |

> **Build machine:** Compiling and signing an `.ipa` requires **macOS + Xcode**.
> This repo can be developed on Linux; open `ios/` on a Mac to build/run.

## Prerequisites (Mac)

- Node 20+
- Xcode 16+ (App Store) + Command Line Tools
- Apple ID (free for device debug; paid **Apple Developer Program** for TestFlight / App Store)
- CocoaPods is **not** required (Capacitor 8 uses Swift Package Manager)

```bash
xcode-select --install   # if needed
```

## Quick start

```bash
# From repo root (any OS for sync; open on Mac)
npm install
npm run ios:sync         # vite build + cap sync ios
npm run ios:open         # opens Xcode (macOS only)
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities**
2. Choose your **Team** (Apple ID) — Xcode manages the provisioning profile
3. Confirm Bundle Identifier `dev.cryptolinx.grabme` (change if taken)
4. Pick a simulator or connected iPhone
5. **Product → Run** (⌘R)

### Device notes

- First run on a physical iPhone: trust the developer certificate under  
  **Settings → General → VPN & Device Management**
- Location permission prompt appears when the map uses geolocation

## Release / TestFlight / App Store

1. Set version: target **General → Version / Build** (or `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in Xcode)
2. **Product → Archive**
3. **Distribute App** → App Store Connect / Ad Hoc / Enterprise
4. For TestFlight: upload via Organizer or `xcodebuild` + Transporter

CLI sketch (Mac, with signing configured):

```bash
cd ios/App
xcodebuild -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ../../exports/Pfloop.xcarchive archive

xcodebuild -exportArchive \
  -archivePath ../../exports/Pfloop.xcarchive \
  -exportPath ../../exports \
  -exportOptionsPlist ExportOptions.plist
```

(`ExportOptions.plist` is project-specific; create via Xcode Organizer once.)

## npm scripts

| Script | What it does |
|--------|----------------|
| `npm run ios:sync` | Build web assets + `cap sync ios` |
| `npm run ios:open` | Open Xcode project (`cap open ios`) |
| `npm run ios:copy` | Copy web assets only |
| `npm run cap:sync` | Sync **both** android + ios |

## Config

`capacitor.config.ts` (shared with Android):

- `webDir`: `dist/client`
- `server.url`: live origin (default production)
- `ios.scheme`: `Pfloop`

Local web while developing (Simulator):

```bash
# Terminal 1: Vite
npm run dev

# Terminal 2: point shell at host
CAP_SERVER_URL=http://localhost:5173 npm run ios:sync
npm run ios:open
```

Physical device on LAN:

```bash
CAP_SERVER_URL=http://192.168.x.x:5173 npm run ios:sync
```

## Permissions

`Info.plist`:

- `NSLocationWhenInUseUsageDescription` — map / locate (German copy)
- Custom URL scheme: `grabme://`
- `ITSAppUsesNonExemptEncryption` = false (standard HTTPS-only export compliance)

## Universal Links (magic link → app)

1. Entitlements already include:
   `applinks:pfloop.cryptolinx.workers.dev`
2. In Apple Developer → Identifiers → your App ID → enable **Associated Domains**
3. Replace `TEAMID` in `public/.well-known/apple-app-site-association` with your
   10-character Team ID (Membership details in developer.apple.com)
4. Deploy: `npm run deploy` so  
   `https://pfloop.cryptolinx.workers.dev/.well-known/apple-app-site-association` is live
5. Reinstall the app; verify with:
   ```bash
   # Mac
   swcutil verify -d pfloop.cryptolinx.workers.dev -j AASA.json
   ```

Fallback scheme: `grabme://auth/verify?...` (always works without AASA).

## Icons & splash

Assets live under `ios/App/App/Assets.xcassets/`. Replace **AppIcon** and
**Splash** via Xcode or `@capacitor/assets`. Brand background: `#0f1221`, primary `#5B4FE9`.

## Architecture

```
┌──────────────────────────┐
│  iOS WKWebView shell     │  Capacitor (status bar, splash, deep links)
│  server.url → live PWA   │
└────────────┬─────────────┘
             │ same origin
             ▼
┌──────────────────────────┐
│ grabme.cryptolinx…       │  React SPA + Hono API + D1
└──────────────────────────┘
```

Deploy web/API with `npm run deploy`. Rebuild the iOS shell only when native
config, icons, or plugins change (`npm run ios:sync` on a Mac, then Archive).

# GrabMe — Android (Capacitor)

Native Android shell around the GrabMe PWA. By default the WebView loads the
**live** app at `https://grabme.cryptolinx.workers.dev` so magic-link sessions
(HttpOnly cookies) and `/api` stay same-origin.

iOS counterpart: **[IOS.md](./IOS.md)**.

| | |
|---|---|
| **Package** | `dev.cryptolinx.grabme` |
| **App name** | GrabMe |
| **Min SDK** | 24 (Android 7) |
| **Target SDK** | 36 |

## Prerequisites

- Node 20+
- **JDK 21** (Capacitor 8 / AGP require source 21; system Java 26 is too new for Gradle)
- [Android Studio](https://developer.android.com/studio) (recommended) **or**
  Android SDK + `ANDROID_HOME`
- Device or emulator

```bash
export JAVA_HOME="$HOME/.jdks/temurin-21"   # example path
export ANDROID_HOME="$HOME/Android/Sdk"
```

## Quick start

```bash
# From repo root
npm install
npm run android:sync   # build web assets + cap sync
npm run android:open   # open android/ in Android Studio
```

In Android Studio:

1. Wait for Gradle sync
2. Pick a device / emulator
3. **Run ▶** (debug APK)

### Release APK / AAB (Play Store)

1. **Build → Generate Signed Bundle / APK**
2. Create or use a release keystore (keep it offline; never commit it)
3. Prefer **Android App Bundle (.aab)** for Play Console

CLI (with SDK + JDK 21 installed):

```bash
# One-shot debug APK → exports/GrabMe-debug.apk
npm run android:apk

# Or manually:
cd android
./gradlew assembleDebug          # → app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease          # needs signingConfig for release
```

Install on a phone (USB debugging):

```bash
adb install -r exports/GrabMe-debug.apk
```

## npm scripts

| Script | What it does |
|--------|----------------|
| `npm run android:sync` | `vite build` + `cap sync android` |
| `npm run android:open` | Open project in Android Studio |
| `npm run android:copy` | Copy web assets only |
| `npm run android:update` | Update native Capacitor deps |

## Config

`capacitor.config.ts`:

- `webDir`: `dist/client` (Cloudflare/Vite client output)
- `server.url`: live origin (default production)
- Override for local Worker / emulator:

```bash
# Emulator → host machine Vite
CAP_SERVER_URL=http://10.0.2.2:5173 npm run android:sync

# Physical device on same LAN (use your PC IP)
CAP_SERVER_URL=http://192.168.1.10:5173 npm run android:sync

# Bundled assets only (no remote URL — auth cookies will not hit production API)
CAP_SERVER_URL= npm run android:sync
```

## Permissions

Declared in `AndroidManifest.xml`:

- `INTERNET`, `ACCESS_NETWORK_STATE`
- `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (map / locate)

## Magic links & deep links

Intent filters open:

- `https://grabme.cryptolinx.workers.dev/*` (App Links, `autoVerify`)
- `grabme://auth/...` (custom scheme fallback)

### Verified App Links (optional but recommended)

1. Build a signed APK and get the cert SHA-256:

```bash
keytool -list -v -keystore path/to/your.keystore -alias your-alias
# or for debug:
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

2. Put the fingerprint into `public/.well-known/assetlinks.json`
3. Deploy the Worker (`npm run deploy`) so  
   `https://grabme.cryptolinx.workers.dev/.well-known/assetlinks.json` is live
4. Reinstall the app and verify:  
   `adb shell pm get-app-links dev.cryptolinx.grabme`

## Icons & splash

Default Capacitor icons ship under `android/app/src/main/res/mipmap-*`.
Replace with branded assets (e.g. Android Studio **Image Asset** studio, or
`@capacitor/assets`). Brand colors live in `res/values/colors.xml` (teal
`#0f766e`, dark `#0f172a`).

## Architecture note

```
┌─────────────────────────┐
│  Android WebView shell  │  Capacitor plugins (status bar, splash, deep links)
│  server.url → live PWA  │
└───────────┬─────────────┘
            │ same origin
            ▼
┌─────────────────────────┐
│ grabme.cryptolinx…      │  React SPA + Hono API + D1
└─────────────────────────┘
```

Deploy web/API as usual (`npm run deploy`). Rebuild the Android shell only when
native config, icons, or plugins change (`npm run android:sync`).

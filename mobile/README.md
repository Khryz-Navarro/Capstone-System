# DocuLink Mobile (Capacitor)

Native Android/iOS shell that loads the DocuLink web app in a WebView (remote URL mode).

## Prerequisites

- Node.js 20+
- Android Studio (Android builds)
- Xcode on macOS (iOS builds)
- Laravel app running and reachable from the device/emulator

## Setup

```bash
cd mobile
npm install
npx cap add android
npx cap add ios   # macOS only
```

Copy `.env.example` to `.env` and set `CAP_SERVER_URL`:

| Environment | URL |
|-------------|-----|
| Local (browser) | `http://127.0.0.1:8000/login` |
| Android emulator | `http://10.0.2.2:8000/login` |
| Physical device (LAN) | `http://<your-ip>:8000/login` |
| Production | `https://your-domain.com/login` |

## Development

1. Start Laravel: `composer run dev` (from repo root)
2. Sync native projects: `npm run cap:sync`
3. Open Android Studio: `npm run cap:open:android`

After changing `capacitor.config.ts` or adding plugins, run `npm run cap:sync` again.

## App icons and splash

Place source assets in `mobile/assets/`:

- `icon-only.png` — 1024×1024 app icon
- `splash.png` — 2732×2732 splash screen (optional)

Then run:

```bash
npm run cap:assets
npm run cap:sync
```

## Production build

1. Deploy Laravel to HTTPS
2. Set `CAP_SERVER_URL=https://your-domain.com/login`
3. `npm run mobile:sync` (from repo root)
4. Open Android Studio: `npm run mobile:android`
5. Build signed release APK/AAB via **Build > Generate Signed Bundle / APK**

### Release signing (Android)

Create a keystore once:

```bash
keytool -genkey -v -keystore doculink-release.keystore -alias doculink -keyalg RSA -keysize 2048 -validity 10000
```

In Android Studio, configure signing under **Build > Generate Signed Bundle / APK** or add to `mobile/android/app/build.gradle` via a `keystore.properties` file (do not commit secrets).

### App icons

Source icon: `mobile/assets/icon-only.png`. Regenerate platform icons:

```bash
npm run mobile:assets
npm run mobile:sync
```

If `sharp` fails on Windows, run `npm rebuild sharp` in the repo root first.

## Store checklist

- Privacy policy URL
- App description (resident document requests for barangay)
- Screenshots from resident flows: login, dashboard, request, residency upload

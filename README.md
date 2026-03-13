# Album United 26

Album United 26 is a React Native + Expo app to manage your World Cup 2026 sticker album.

## Features

- Full sticker list for the album structure.
- Mark each sticker as owned.
- Mark owned stickers as repeated.
- Dashboard with:
	- Total stickers
	- Owned stickers
	- Missing stickers
	- Completion percentage
- Repeated stickers screen for quick trade planning.
- English-first UI with Spanish support toggle.

## Tech Stack

- Expo Router
- React Native
- TypeScript
- react-native-google-mobile-ads (kept from the previous app stack)

## Run

```bash
npm install
npx expo start
```

## Build

```bash
npx expo prebuild
npm run build:ios
npm run build:android
```

## iOS release without Metro

For a local release build (does not depend on Metro at runtime):

```bash
npm run ios:release:device
```

For cloud builds with EAS (recommended for distribution):

```bash
npm run build:ios:preview
npm run build:ios:production
```

## AdMob (important)

- The project uses AdMob test app IDs in development, so iOS does not crash when ads initialize.
- Before publishing, replace those IDs in `app.json` (the `react-native-google-mobile-ads` plugin) with your real AdMob app IDs.

# iOS app build target (Capacitor) — design

**Date:** 2026-07-19

**Status:** Approved

## Goal

Ship SO Shreds as a native iOS app on the maintainer's own iPhone, sharing the entire web codebase so all current and future web features flow into the iOS app with a single rebuild. No fork, no rewrite.

## Decisions

- **Mechanism:** Capacitor 7 with bundled web assets (not a live-URL shell, not a PWA). App Store-eligible later if wanted; works from the bundled `dist/`.

- **Distribution (initial):** personal device install via Xcode with a personal signing team. No TestFlight or App Store work in scope.

- **Branching:** developed on branch `ios-app` in an isolated worktree (another agent is concurrently adding features on the main checkout). After merge to main, `ios/` becomes a permanent second build target.

## Components

1. **Capacitor dependencies** (dev): `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`. Config in `capacitor.config.ts`: appId `io.github.titaniumbones.soshreds`, appName "SO Shreds", webDir `dist`.

2. **Base-path split** in `vite.config.ts`: `base: process.env.CAP_BUILD ? './' : '/so-shreds/'`. GitHub Pages build and CI remain byte-for-byte unchanged; only the iOS build uses relative asset paths (the native shell serves from its own root).

3. **npm scripts:** `ios:build` = `tsc -b && CAP_BUILD=1 vite build && cap sync ios`; `ios:open` = `cap open ios`.

4. **Generated `ios/` Xcode project,** committed to the repo (build artifacts like `Pods/` stay gitignored per Capacitor's generated ignores). All data APIs (ECCC GeoMet, Open-Meteo, GRCA KiWIS) are HTTPS, so no App Transport Security exceptions.

5. **Mobile polish (minimal):** `viewport-fit=cover` in the viewport meta tag plus `env(safe-area-inset-*)` padding so the header clears the notch/Dynamic Island. App icon and splash screen generated from the existing `public/favicon.svg` via `@capacitor/assets`.

## Verification

- `npm run build` (web target) still passes, output unchanged.

- `npm run ios:build` succeeds end-to-end.

- The app compiles for and boots in the iOS Simulator, rendering live gauge data.

- Device install is a manual step for the maintainer: open in Xcode, select personal team, Run.

## Non-goals

Push notifications, home-screen widgets, offline caching, App Store metadata/review prep. All addable later on this foundation.

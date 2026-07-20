# Southern Ontario Shreds

Live whitewater river levels for Ontario paddlers — the Elora Gorge, the Irvine, the Credit, the Madawaska, the Petawawa, the Ottawa, and friends. One page that answers "is it running?" before you drive.

**Live site:** https://titaniumbones.github.io/so-shreds/

This is a ground-up rewrite of the old [river-levels](https://github.com/titaniumbones/river-levels) / [react-river-experiments](https://github.com/titaniumbones/react-river-experiments) projects on a modern stack.

## How it works

- **Stack:** Vite + React 19 + TypeScript. No backend, no proxy — a fully static site.

- **Data:** every gauge is a federal Water Survey of Canada station, read live in the browser from the [ECCC GeoMet OGC API](https://api.weather.gc.ca/) (`hydrometric-realtime` collection), which serves ~30 days of provisional readings with CORS enabled. The old site depended on a self-hosted CORS proxy and per-conservation-authority scrapers (GRCA/CVC KiWIS); those are gone.

- **Runnability bands:** each river carries a set of flow ranges (`low / shoulder / good / high`, in m³/s) drawn as a colored strip with a needle at the current reading, and as washes behind the discharge chart. Thresholds come from the old site's data plus paddler folklore — they are advisory, not safety information.

- **Flow prediction (experimental):** river pages show a dashed 7-day forecast — a small per-basin rainfall-runoff model (snow + soil store + two linear reservoirs) calibrated offline against decades of daily flows and ERA5 weather, then re-run in the browser against the live Open-Meteo forecast and anchored to the latest gauge reading. On natural-flow rivers it clearly beats "tomorrow = today" at 3–7 day leads; on dam-controlled rivers it can't know what the operator will do, so Shand and Gull don't get forecasts. Full methodology and validation numbers in [`model/README.md`](model/README.md).

- **Run journal:** every river page has a journal. *My runs* are private — stored in your browser (localStorage), with the level auto-captured from the live gauge; any entry can be shared as a self-contained link (the entry travels inside the URL, no server). *Community reports* are GitHub Discussions — one thread per river — posted with your GitHub account; the deploy workflow snapshots comments into `reports.json` and re-runs on every new comment, so reports appear on the site within minutes. The site itself never touches credentials.

- **Virtual gauges:** when a physical gauge dies at the source (the Irvine's only station has been down since 2026-07-11), the calibrated model runs unanchored on observed weather and the site shows a clearly-labeled `~modelled` estimate instead of a blank.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

Deploys automatically to GitHub Pages via Actions on every push to `main`.

## iOS app

The same codebase builds as a native iOS app via [Capacitor](https://capacitorjs.com/): the `ios/` directory is a committed Xcode project (Swift Package Manager, no CocoaPods) that ships the Vite build inside a native shell. Every web feature flows into the app on the next rebuild — there is no separate mobile codebase.

```sh
npm run ios:build   # web build with relative base + cap sync into ios/
npm run ios:open    # open the Xcode project
```

The GitHub Pages build is untouched: `vite.config.ts` only switches to relative asset paths when `CAP_BUILD` is set. To install on a phone, open the project in Xcode, pick your signing team under App → Signing & Capabilities, and Run on the connected device (a free Apple ID re-signs weekly; a paid developer account lasts a year).

App icon and splash screens are generated from `public/favicon.svg` — if it changes, re-run:

```sh
node scripts/make-app-assets.mjs && npx capacitor-assets generate --ios
```

## Adding a river

Add an entry to `src/data/rivers.ts` (station number, bands, put-in/take-out coordinates) and optionally a markdown description at `public/descriptions/<slug>.md`. Find station numbers at [wateroffice.ec.gc.ca](https://wateroffice.ec.gc.ca/) or by querying `https://api.weather.gc.ca/collections/hydrometric-stations/items?PROV_TERR_STATE_LOC=ON`.

## Data attribution

Hydrometric data: Environment and Climate Change Canada / Water Survey of Canada, via GeoMet-OGC-API. Contains information licensed under the [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada). Readings are provisional and subject to revision.

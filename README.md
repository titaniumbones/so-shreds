# Southern Ontario Shreds

Live whitewater river levels for Ontario paddlers — the Elora Gorge, the Irvine, the Credit, the Madawaska, the Petawawa, the Ottawa, and friends. One page that answers "is it running?" before you drive.

**Live site:** https://titaniumbones.github.io/so-shreds/

This is a ground-up rewrite of the old [river-levels](https://github.com/titaniumbones/river-levels) / [react-river-experiments](https://github.com/titaniumbones/react-river-experiments) projects on a modern stack.

## How it works

- **Stack:** Vite + React 19 + TypeScript. No backend, no proxy — a fully static site.

- **Data:** every gauge is a federal Water Survey of Canada station, read live in the browser from the [ECCC GeoMet OGC API](https://api.weather.gc.ca/) (`hydrometric-realtime` collection), which serves ~30 days of provisional readings with CORS enabled. The old site depended on a self-hosted CORS proxy and per-conservation-authority scrapers (GRCA/CVC KiWIS); those are gone.

- **Runnability bands:** each river carries a set of flow ranges (`low / shoulder / good / high`, in m³/s) drawn as a colored strip with a needle at the current reading, and as washes behind the discharge chart. Thresholds come from the old site's data plus paddler folklore — they are advisory, not safety information.

- **Flow prediction (experimental):** river pages show a dashed 7-day forecast — a small per-basin rainfall-runoff model (snow + soil store + two linear reservoirs) calibrated offline against decades of daily flows and ERA5 weather, then re-run in the browser against the live Open-Meteo forecast and anchored to the latest gauge reading. On natural-flow rivers it clearly beats "tomorrow = today" at 3–7 day leads; on dam-controlled rivers it can't know what the operator will do, so Shand and Gull don't get forecasts. Full methodology and validation numbers in [`model/README.md`](model/README.md).

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

Deploys automatically to GitHub Pages via Actions on every push to `main`.

## Adding a river

Add an entry to `src/data/rivers.ts` (station number, bands, put-in/take-out coordinates) and optionally a markdown description at `public/descriptions/<slug>.md`. Find station numbers at [wateroffice.ec.gc.ca](https://wateroffice.ec.gc.ca/) or by querying `https://api.weather.gc.ca/collections/hydrometric-stations/items?PROV_TERR_STATE_LOC=ON`.

## Data attribution

Hydrometric data: Environment and Climate Change Canada / Water Survey of Canada, via GeoMet-OGC-API. Contains information licensed under the [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada). Readings are provisional and subject to revision.

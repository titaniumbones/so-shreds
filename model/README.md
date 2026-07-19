# Flow prediction model

This directory holds the offline half of the site's experimental 7-day flow prediction: a parsimonious daily rainfall-runoff model calibrated per gauge, whose fitted parameters are exported into the site bundle and re-run in the browser against live weather forecasts.

## How it works

1. `fetch_training_data.py` — joins daily mean discharge (ECCC GeoMet `hydrometric-daily-mean`, 1990–2026) with daily basin weather (Open-Meteo ERA5 archive at an eyeballed catchment centroid: precipitation, mean temp, snowfall, FAO ET0). One CSV per station in `data/`.

2. `hydro.py` — the model. Snow accumulates below a fitted temperature threshold and melts by degree-day; a soil store turns rain+melt into runoff with a wetness-power law; runoff splits between a quick and a slow linear reservoir. Eight parameters, all fitted.

3. `calibrate.py` — differential evolution against NSE on √flow (balances peaks and baseflow), training on 1992–2015 and validating on 2016+. Results land in `params.json`.

4. `hindcast.py` — validates **the product, not the model**: for every holdout day, anchor the simulation to that day's observation (exactly what the browser does), predict 1–7 days ahead, and compare against both observations and a persistence baseline ("tomorrow = today").

5. `export_params.py` — writes `src/data/modelParams.ts` with the stations worth shipping.

## Findings (July 2026)

Validation sqrt-NSE (2016+ holdout): Moira 0.85, Petawawa 0.76, Spencer 0.75, Madawaska 0.71, Streetsville 0.66, Irvine 0.57, Ottawa 0.57, Shand 0.54, Cataract 0.49, Gull 0.36.

The hindcast is the more honest test, and it splits the rivers cleanly:

- **Natural-flow rivers: the model earns its keep.** At a 7-day lead it beats persistence decisively — Streetsville 20% vs 32% median error, Moira 19% vs 29%, Irvine 45% vs 60%, Spencer 31% vs 40% — and band accuracy (predicting the right runnability category) improves by 5–12 points. The gain grows with lead time, which is exactly the regime paddlers care about ("will it still be running Saturday?").

- **Dam-controlled rivers: rainfall models cannot predict operators.** On the Grand below Shand, persistence is near-perfect at short leads (0.9% error at +1 day) because the release is a policy decision, not weather; the model only adds noise. Shand and Gull are therefore excluded from shipped forecasts. The Madawaska (Bark Lake regulation) roughly ties persistence and ships with a caveat.

Weather-forecast error is *not* included in these numbers (the hindcast uses reanalysis weather), so real-world skill at long leads is somewhat worse — treat the dashed line as "rising or falling, roughly how much", not as a number.

## Reproducing

```sh
python3 fetch_training_data.py   # ~10 min, hits GeoMet + Open-Meteo
python3 calibrate.py             # ~30 min for all stations
python3 hindcast.py              # validation report
python3 export_params.py         # regenerates src/data/modelParams.ts
```

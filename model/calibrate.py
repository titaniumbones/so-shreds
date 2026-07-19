#!/usr/bin/env python3
"""Calibrate the bucket model per station and emit fitted params as JSON.

Split: warmup 2 yrs -> train to 2015-12-31 -> validate 2016+.
Objective: NSE on sqrt(Q). Writes model/params.json and a fit report.
"""

import csv
import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import differential_evolution

from hydro import BOUNDS, PARAM_NAMES, nse, simulate, sqrt_nse

HERE = Path(__file__).parent
DATA = HERE / "data"

AREAS = {  # DRAINAGE_AREA_GROSS km² from hydrometric-stations (API values)
    "02GA016": 786.0,
    "02GA005": 196.1,
    "02HB029": 774.6,
    "02HB001": 209.2,
    "02HB007": 158.5,
    "02HL001": 2596.0,
    "02HF002": 1283.0,
    "02KD004": 5804.0,
    "02KB001": 4127.0,
    "02KF005": 91260.0,
}


def load(station: str):
    rows = list(csv.DictReader((DATA / f"{station}.csv").open()))
    dates = np.array([r["date"] for r in rows])
    def col(k):
        return np.array([float(r[k]) if r[k] not in ("", "None") else np.nan for r in rows])
    return dates, col("discharge"), col("precip"), col("tmean"), col("snowfall"), col("et0")


def _loss(params, p, t, sf, pet, area, warm, split, obs_train):
    sim = simulate(params, p, t, sf, pet, area)
    return -sqrt_nse(sim[warm:split], obs_train)


def calibrate(station: str, seed=42):
    dates, q, p, t, sf, pet = load(station)
    # weather columns must be gap-free for the state loop; fill tiny gaps
    for arr in (p, t, sf, pet):
        m = np.isnan(arr)
        if m.any():
            arr[m] = 0.0 if arr is not t else np.nanmean(t)
    area = AREAS[station]
    warm = 730
    split = int(np.searchsorted(dates, "2016-01-01"))
    obs_train = q[warm:split]
    obs_val = q[split:]

    res = differential_evolution(
        _loss, BOUNDS, args=(p, t, sf, pet, area, warm, split, obs_train),
        seed=seed, maxiter=60, popsize=14, tol=1e-4,
        polish=True, workers=-1, updating="deferred",
    )
    params = res.x
    sim = simulate(params, p, t, sf, pet, area)
    report = {
        "train_sqrt_nse": round(sqrt_nse(sim[warm:split], obs_train), 3),
        "train_nse": round(nse(sim[warm:split], obs_train), 3),
        "val_sqrt_nse": round(sqrt_nse(sim[split:], obs_val), 3),
        "val_nse": round(nse(sim[split:], obs_val), 3),
        "n_train": int(np.isfinite(obs_train).sum()),
        "n_val": int(np.isfinite(obs_val).sum()),
    }
    return dict(zip(PARAM_NAMES, [round(v, 5) for v in params])), report


def main():
    stations = sys.argv[1:] or sorted(AREAS)
    out_path = HERE / "params.json"
    out = json.loads(out_path.read_text()) if out_path.exists() else {}
    for st in stations:
        if not (DATA / f"{st}.csv").exists():
            print(f"{st}: no data file, skipping")
            continue
        print(f"{st}: calibrating…", flush=True)
        params, report = calibrate(st)
        out[st] = {"area_km2": AREAS[st], "params": params, "fit": report}
        print(f"{st}: {report}")
        out_path.write_text(json.dumps(out, indent=1))
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()

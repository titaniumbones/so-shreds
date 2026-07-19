#!/usr/bin/env python3
"""Hindcast validation of the anchored forecast — the thing the site ships.

For each day D in the holdout (2016+): run the model through D, scale it so
sim(D) == obs(D) (the browser's anchoring step), then score the anchored
prediction at D+1 … D+7 against observations. Uses actual weather, so this
measures model + anchoring error, excluding weather-forecast error.

Reports, per lead time: median absolute percent error, and how often the
predicted runnability band (from src/data/rivers.ts thresholds) is correct.
Baseline for comparison: persistence (tomorrow = today).
"""

import csv
import json
import sys
from pathlib import Path

import numpy as np

from calibrate import AREAS, load
from hydro import simulate

HERE = Path(__file__).parent

params_all = json.loads((HERE / "params.json").read_text())

# runnability bands copied from src/data/rivers.ts (min, max, quality)
BANDS = {
    "02GA016": [(0, 4.6, "low"), (4.6, 8, "sh"), (8, 50, "good"), (50, 100, "sh"), (100, 1e9, "high")],
    "02GA005": [(0, 6.5, "low"), (6.5, 8, "sh"), (8, 50, "good"), (50, 80, "sh"), (80, 1e9, "high")],
    "02HB029": [(0, 4.6, "low"), (4.6, 8, "sh"), (8, 60, "good"), (60, 120, "sh"), (120, 1e9, "high")],
    "02HB001": [(0, 2, "low"), (2, 3.5, "sh"), (3.5, 14, "good"), (14, 20, "sh"), (20, 1e9, "high")],
    "02HB007": [(0, 7, "low"), (7, 9, "sh"), (9, 15, "good"), (15, 1e9, "high")],
    "02HB018": [(0, 4, "low"), (4, 7, "sh"), (7, 30, "good"), (30, 45, "sh"), (45, 1e9, "high")],
    "02HL001": [(0, 38, "low"), (38, 75, "sh"), (75, 155, "good"), (155, 210, "sh"), (210, 1e9, "high")],
    "02HF002": [(0, 8, "low"), (8, 15, "sh"), (15, 45, "good"), (45, 60, "sh"), (60, 1e9, "high")],
    "02KD004": [(0, 15, "low"), (15, 30, "sh"), (30, 100, "good"), (100, 225, "sh"), (225, 1e9, "high")],
    "02KB001": [(0, 30, "low"), (30, 50, "sh"), (50, 220, "good"), (220, 320, "sh"), (320, 1e9, "high")],
    "02KF005": [(0, 2200, "good"), (2200, 4500, "sh"), (4500, 1e9, "high")],
}


def band_of(bands, v):
    for lo, hi, q in bands:
        if lo <= v < hi:
            return q
    return "high"


def hindcast(station: str, leads=(1, 2, 3, 5, 7)):
    rec = params_all[station]
    p_ = [rec["params"][k] for k in
          ["smax", "beta", "ddf", "tmelt", "alpha", "kq", "ks", "kr"]]
    dates, q, pr, t, sf, pet = load(station)
    for arr in (pr, t, sf, pet):
        m = np.isnan(arr)
        if m.any():
            arr[m] = 0.0 if arr is not t else np.nanmean(t)
    area = AREAS[station]
    sim = simulate(p_, pr, t, sf, pet, area)
    start = int(np.searchsorted(dates, "2016-01-01"))
    bands = BANDS[station]

    err = {h: [] for h in leads}
    perr = {h: [] for h in leads}  # persistence baseline
    bandok = {h: [] for h in leads}
    bandok_p = {h: [] for h in leads}
    for i in range(start, len(dates) - max(leads)):
        if not np.isfinite(q[i]) or sim[i] <= 0.05 or q[i] <= 0.05:
            continue
        ratio = np.clip(q[i] / sim[i], 0.25, 4)
        for h in leads:
            o = q[i + h]
            if not np.isfinite(o) or o <= 0.05:
                continue
            pred = sim[i + h] * ratio
            err[h].append(abs(pred - o) / o)
            perr[h].append(abs(q[i] - o) / o)
            bandok[h].append(band_of(bands, pred) == band_of(bands, o))
            bandok_p[h].append(band_of(bands, q[i]) == band_of(bands, o))

    out = {}
    for h in leads:
        out[f"+{h}d"] = {
            "medAPE": round(float(np.median(err[h])) * 100, 1),
            "medAPE_persist": round(float(np.median(perr[h])) * 100, 1),
            "band_acc": round(float(np.mean(bandok[h])) * 100, 1),
            "band_acc_persist": round(float(np.mean(bandok_p[h])) * 100, 1),
            "n": len(err[h]),
        }
    return out


def main():
    stations = sys.argv[1:] or sorted(params_all)
    report = {}
    for st in stations:
        report[st] = hindcast(st)
        print(f"\n{st}:")
        for lead, r in report[st].items():
            print(f"  {lead}: medAPE {r['medAPE']:5.1f}% (persist {r['medAPE_persist']:5.1f}%)"
                  f"  band-acc {r['band_acc']:5.1f}% (persist {r['band_acc_persist']:5.1f}%)  n={r['n']}")
    (HERE / "hindcast_report.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()

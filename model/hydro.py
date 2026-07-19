"""A parsimonious daily rainfall-runoff model (HYMOD-flavoured bucket model).

State: snowpack (mm SWE), soil store (mm), quick + slow linear reservoirs (mm).
Inputs per day: precip (mm), mean temp (C), snowfall (mm), PET (mm).
Output: discharge (m³/s) given basin area (km²).

Parameters (8):
  smax   soil store capacity, mm            [20, 800]
  beta   runoff-fraction exponent           [0.3, 8]
  ddf    degree-day melt factor, mm/C/day   [1, 8]
  tmelt  melt threshold temp, C             [-3, 4]
  alpha  quick-flow split of runoff         [0.05, 0.95]
  kq     quick reservoir rate, 1/day        [0.1, 0.95]
  ks     slow reservoir rate, 1/day         [0.001, 0.2]
  kr     soil drainage rate to slow, 1/day  [0.0, 0.05]
"""

from __future__ import annotations

import numpy as np

BOUNDS = [
    (20, 800),
    (0.3, 8),
    (1, 8),
    (-3, 4),
    (0.05, 0.95),
    (0.1, 0.95),
    (0.001, 0.2),
    (0.0, 0.05),
]

PARAM_NAMES = ["smax", "beta", "ddf", "tmelt", "alpha", "kq", "ks", "kr"]

MM_TO_CMS = 1e6 / 86400 / 1000  # mm/day over km² -> m³/s


def simulate(params, precip, tmean, snowfall, pet, area_km2,
             init=None) -> np.ndarray:
    smax, beta, ddf, tmelt, alpha, kq, ks, kr = params
    n = len(precip)
    q = np.empty(n)
    snow, soil, rq, rs = init if init is not None else (0.0, smax * 0.5, 0.0, 5.0)
    for i in range(n):
        p = precip[i] or 0.0
        sf = min(snowfall[i] or 0.0, p)
        rain = p - sf
        snow += sf
        melt = min(snow, max(0.0, ddf * (tmean[i] - tmelt)))
        snow -= melt
        w = rain + melt
        frac = min(soil / smax, 1.0) ** beta
        runoff = w * frac
        soil += w - runoff
        # evapotranspiration scaled by soil wetness
        soil -= min(soil, (pet[i] or 0.0) * min(soil / smax, 1.0))
        drain = kr * soil
        soil -= drain
        if soil > smax:  # saturation excess
            runoff += soil - smax
            soil = smax
        rq += alpha * runoff
        rs += (1 - alpha) * runoff + drain
        qq = kq * rq
        qs = ks * rs
        rq -= qq
        rs -= qs
        q[i] = (qq + qs) * area_km2 * MM_TO_CMS
    return q


def final_state(params, precip, tmean, snowfall, pet):
    """Run the model and return final (snow, soil, rq, rs) for warm starts."""
    smax, beta, ddf, tmelt, alpha, kq, ks, kr = params
    snow, soil, rq, rs = 0.0, smax * 0.5, 0.0, 5.0
    for i in range(len(precip)):
        p = precip[i] or 0.0
        sf = min(snowfall[i] or 0.0, p)
        rain = p - sf
        snow += sf
        melt = min(snow, max(0.0, ddf * (tmean[i] - tmelt)))
        snow -= melt
        w = rain + melt
        frac = min(soil / smax, 1.0) ** beta
        runoff = w * frac
        soil += w - runoff
        soil -= min(soil, (pet[i] or 0.0) * min(soil / smax, 1.0))
        drain = kr * soil
        soil -= drain
        if soil > smax:
            soil = smax
        rq += alpha * runoff
        rs += (1 - alpha) * runoff + drain
        rq -= kq * rq
        rs -= ks * rs
    return snow, soil, rq, rs


def nse(sim: np.ndarray, obs: np.ndarray) -> float:
    m = np.isfinite(obs) & np.isfinite(sim)
    o, s = obs[m], sim[m]
    return 1 - np.sum((s - o) ** 2) / np.sum((o - o.mean()) ** 2)


def sqrt_nse(sim: np.ndarray, obs: np.ndarray) -> float:
    """NSE on sqrt flows — balances peak and low-flow fit."""
    m = np.isfinite(obs) & np.isfinite(sim)
    o, s = np.sqrt(np.clip(obs[m], 0, None)), np.sqrt(np.clip(sim[m], 0, None))
    return 1 - np.sum((s - o) ** 2) / np.sum((o - o.mean()) ** 2)

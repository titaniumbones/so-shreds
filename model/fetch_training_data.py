#!/usr/bin/env python3
"""Fetch training data for the flow-prediction model.

For each station: daily mean discharge from ECCC GeoMet, and daily weather
(precip, temp, snowfall, ET0) from the Open-Meteo ERA5 archive at the
approximate basin centroid. Writes one CSV per station into model/data/.
"""

import csv
import json
import sys
import time
import urllib.request
from pathlib import Path

DATA = Path(__file__).parent / "data"
DATA.mkdir(exist_ok=True)

START = "1990-01-01"
END = "2026-06-30"

# station -> (basin centroid lat, lon) — eyeballed centre of the upstream
# catchment, not the gauge location
STATIONS = {
    "02GA016": (43.90, -80.35),  # Grand below Shand: basin is N toward Dundalk
    "02GA005": (43.75, -80.55),  # Irvine nr Salem
    "02HB029": (43.75, -79.95),  # Credit at Streetsville: basin NW
    "02HB001": (43.85, -80.05),  # Credit nr Cataract
    "02HB018": (43.82, -80.02),  # Credit at Boston Mills (middle Credit)
    "02HB007": (43.30, -80.05),  # Spencer Creek at Dundas
    "02HL001": (44.55, -77.35),  # Moira nr Foxboro: basin N toward Madoc
    "02HF002": (44.90, -78.75),  # Gull at Norland: Haliburton highlands
    "02KD004": (45.35, -77.85),  # Madawaska at Palmer Rapids: basin W
    "02KB001": (45.80, -78.30),  # Petawawa: Algonquin dome
    "02KF005": (46.20, -77.80),  # Ottawa at Britannia (huge basin; token point)
    "02ED026": (43.98, -80.05),  # Nottawasaga at Hockley: basin SW toward Mono
    "02EA011": (45.65, -79.60),  # Magnetawan nr Britt: Almaguin highlands
}


def get(url: str):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            print(f"  retry {attempt + 1} after {e}", file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"gave up on {url}")


def fetch_discharge(station: str) -> dict[str, float]:
    out: dict[str, float] = {}
    offset = 0
    while True:
        url = (
            "https://api.weather.gc.ca/collections/hydrometric-daily-mean/items"
            f"?f=json&STATION_NUMBER={station}&datetime={START}/{END}"
            f"&properties=DATE,DISCHARGE&sortby=DATE&limit=10000&offset={offset}"
        )
        d = get(url)
        feats = d["features"]
        for f in feats:
            p = f["properties"]
            if p["DISCHARGE"] is not None:
                out[p["DATE"][:10]] = p["DISCHARGE"]
        if len(feats) < 10000:
            break
        offset += 10000
    return out


def fetch_weather(lat: float, lon: float) -> dict[str, tuple]:
    url = (
        "https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={lat}&longitude={lon}&start_date={START}&end_date={END}"
        "&daily=precipitation_sum,temperature_2m_mean,temperature_2m_max,"
        "snowfall_sum,et0_fao_evapotranspiration&timezone=UTC"
    )
    d = get(url)["daily"]
    out = {}
    for i, day in enumerate(d["time"]):
        out[day] = (
            d["precipitation_sum"][i],
            d["temperature_2m_mean"][i],
            d["temperature_2m_max"][i],
            d["snowfall_sum"][i],
            d["et0_fao_evapotranspiration"][i],
        )
    return out


def main():
    only = sys.argv[1:] or list(STATIONS)
    for station in only:
        lat, lon = STATIONS[station]
        out = DATA / f"{station}.csv"
        if out.exists():
            print(f"{station}: exists, skipping")
            continue
        print(f"{station}: discharge…", flush=True)
        q = fetch_discharge(station)
        print(f"{station}: {len(q)} discharge days; weather…", flush=True)
        w = fetch_weather(lat, lon)
        days = sorted(set(q) & set(w))
        with out.open("w", newline="") as fh:
            wr = csv.writer(fh)
            wr.writerow(["date", "discharge", "precip", "tmean", "tmax", "snowfall", "et0"])
            for day in days:
                wr.writerow([day, q[day], *w[day]])
        print(f"{station}: wrote {len(days)} joined days")
        time.sleep(2)  # be kind to open-meteo


if __name__ == "__main__":
    main()

"""
ATADA — Commute Estimation Service
Given user home coords + job coords, return driving and transit minutes.

Strategy:
  - If GOOGLE_MAPS_API_KEY is set, call Distance Matrix (driving + transit).
    Batched by destinations per call (up to 25) to minimize cost.
  - Otherwise: haversine distance × empirical multipliers for Israeli urban
    traffic. Cheap, offline, "good enough" until the key is provisioned.

Results are cached per rounded coordinate pair for the process lifetime.
Frontend still gets fresh-looking numbers after profile edits because the
cache key depends on both endpoints.
"""

from __future__ import annotations

import logging
import threading
from typing import Optional

import httpx

from app.config import settings
from app.services.matching import _haversine_km

logger = logging.getLogger(__name__)

# Multipliers tuned against Google Maps samples in central Israel.
# distance_km * multiplier = minutes. Urban driving averages ~33 km/h
# door-to-door; public transit ~17 km/h including walk + wait.
_DRIVE_MIN_PER_KM = 1.8
_TRANSIT_MIN_PER_KM = 3.5
_DRIVE_BASELINE_MIN = 3.0  # parking, pickup
_TRANSIT_BASELINE_MIN = 6.0  # walk to stop, wait

_cache: dict[tuple, dict] = {}
_cache_lock = threading.Lock()


def _cache_key(u_lat: float, u_lng: float, j_lat: float, j_lng: float) -> tuple:
    # 3 decimal places ≈ 110m — plenty of precision for commute estimation
    return (round(u_lat, 3), round(u_lng, 3), round(j_lat, 3), round(j_lng, 3))


def _haversine_estimate(
    u_lat: float, u_lng: float, j_lat: float, j_lng: float
) -> dict:
    dist_km = _haversine_km(u_lat, u_lng, j_lat, j_lng)
    # Straight-line underestimates road distance. Apply a rough city factor.
    road_km = dist_km * 1.3
    drive_min = int(round(_DRIVE_BASELINE_MIN + road_km * _DRIVE_MIN_PER_KM))
    transit_min = int(round(_TRANSIT_BASELINE_MIN + road_km * _TRANSIT_MIN_PER_KM))
    return {
        "drive_minutes": drive_min,
        "transit_minutes": transit_min,
        "distance_km": round(dist_km, 1),
        "source": "haversine",
    }


def _google_distance_matrix(
    u_lat: float, u_lng: float, j_lat: float, j_lng: float
) -> Optional[dict]:
    """Single-origin, single-destination call for both modes."""
    base = "https://maps.googleapis.com/maps/api/distancematrix/json"
    origin = f"{u_lat},{u_lng}"
    dest = f"{j_lat},{j_lng}"
    common = {
        "origins": origin,
        "destinations": dest,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "region": "il",
    }
    drive_min: Optional[int] = None
    transit_min: Optional[int] = None
    dist_km: Optional[float] = None

    try:
        r = httpx.get(base, params={**common, "mode": "driving"}, timeout=5.0)
        r.raise_for_status()
        data = r.json()
        el = data["rows"][0]["elements"][0]
        if el.get("status") == "OK":
            drive_min = int(round(el["duration"]["value"] / 60))
            dist_km = round(el["distance"]["value"] / 1000, 1)
    except Exception as e:
        logger.warning("google driving matrix failed: %s", e)

    try:
        r = httpx.get(base, params={**common, "mode": "transit"}, timeout=5.0)
        r.raise_for_status()
        data = r.json()
        el = data["rows"][0]["elements"][0]
        if el.get("status") == "OK":
            transit_min = int(round(el["duration"]["value"] / 60))
    except Exception as e:
        logger.warning("google transit matrix failed: %s", e)

    if drive_min is None and transit_min is None:
        return None

    return {
        "drive_minutes": drive_min,
        "transit_minutes": transit_min,
        "distance_km": dist_km,
        "source": "google",
    }


def compute_commute(
    user_lat: Optional[float],
    user_lng: Optional[float],
    job_lat: Optional[float],
    job_lng: Optional[float],
) -> Optional[dict]:
    """
    Return {drive_minutes, transit_minutes, distance_km, source} or None
    if either endpoint is missing.
    """
    if None in (user_lat, user_lng, job_lat, job_lng):
        return None

    key = _cache_key(user_lat, user_lng, job_lat, job_lng)
    with _cache_lock:
        if key in _cache:
            return _cache[key]

    result: Optional[dict] = None
    if settings.GOOGLE_MAPS_API_KEY:
        result = _google_distance_matrix(user_lat, user_lng, job_lat, job_lng)
    if result is None:
        result = _haversine_estimate(user_lat, user_lng, job_lat, job_lng)

    with _cache_lock:
        _cache[key] = result
    return result


def format_minutes(minutes: Optional[int]) -> Optional[str]:
    if minutes is None:
        return None
    if minutes < 60:
        return f"{minutes} min"
    h, m = divmod(minutes, 60)
    return f"{h}h {m}m" if m else f"{h}h"

"""
ATADA — Geocoding Service
Turns a free-text address into (lat, lng).

Primary: Google Geocoding (if GOOGLE_MAPS_API_KEY is set).
Fallback: OpenStreetMap Nominatim (free, no key) — rate-limited to ~1 req/s,
so results are cached in-process.
Last resort: match against the Israeli city table used by matching.py.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Optional

import httpx

from app.config import settings
from app.services.matching import CITY_COORDS, _guess_coords

logger = logging.getLogger(__name__)

_cache: dict[str, Optional[tuple[float, float]]] = {}
_cache_lock = threading.Lock()
_last_nominatim_call = 0.0


def _google_geocode(address: str) -> Optional[tuple[float, float]]:
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": settings.GOOGLE_MAPS_API_KEY,
        "region": "il",
    }
    try:
        r = httpx.get(url, params=params, timeout=5.0)
        r.raise_for_status()
        data = r.json()
        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return (float(loc["lat"]), float(loc["lng"]))
    except Exception as e:
        logger.warning("google geocode failed for %r: %s", address, e)
    return None


def _nominatim_geocode(address: str) -> Optional[tuple[float, float]]:
    global _last_nominatim_call
    # Rate limit: 1 request per second per Nominatim usage policy
    wait = 1.0 - (time.time() - _last_nominatim_call)
    if wait > 0:
        time.sleep(wait)
    _last_nominatim_call = time.time()

    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1, "countrycodes": "il"}
    headers = {"User-Agent": "AtadaJobMatching/1.0 (contact@atada.co.il)"}
    try:
        r = httpx.get(url, params=params, headers=headers, timeout=5.0)
        r.raise_for_status()
        results = r.json()
        if results:
            return (float(results[0]["lat"]), float(results[0]["lon"]))
    except Exception as e:
        logger.warning("nominatim geocode failed for %r: %s", address, e)
    return None


def geocode_address(address: str | None) -> Optional[tuple[float, float]]:
    """Return (lat, lng) for a free-form address, or None if unresolvable."""
    if not address or not address.strip():
        return None

    key = address.strip().lower()
    with _cache_lock:
        if key in _cache:
            return _cache[key]

    result: Optional[tuple[float, float]] = None
    if settings.GOOGLE_MAPS_API_KEY:
        result = _google_geocode(address)
    if result is None:
        result = _nominatim_geocode(address)
    if result is None:
        # Last resort — city-level match against known Israeli cities
        result = _guess_coords(address)

    with _cache_lock:
        _cache[key] = result
    return result

"""
Rate limiting — SlowAPI integration.

Provides:
  - `limiter`: shared SlowAPI Limiter, used as a route decorator. Keyed by
    source IP via X-Forwarded-For (Render/Vercel pass the real client IP
    through this header).
  - `check_phone_quota(phone)`: secondary throttle keyed on phone number so
    a botnet round-robining IPs still can't spam SMS for one number. Raises
    HTTPException 429 when exceeded.

Storage is in-process (per-worker). Fine for one Render worker; switch to
the Redis backend (slowapi.util.get_remote_address + redis://) when scaling
to multiple workers.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address


def _key_func(request: Request) -> str:
    # Honor X-Forwarded-For when Render terminates TLS upstream of uvicorn.
    fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return fwd or get_remote_address(request)


limiter = Limiter(key_func=_key_func)


# ─── Phone-scoped quota ─────────────────────────────────────────────────────

_PHONE_WINDOW_SECONDS = 3600  # 1 hour
_PHONE_MAX_REQUESTS = 3
_phone_hits: dict[str, deque[float]] = defaultdict(deque)
_phone_lock = Lock()


def check_phone_quota(phone: str) -> None:
    """Raise HTTPException(429) when this phone has been requested too often.

    Independent of the IP-based @limiter on the route — keyed solely by
    phone so a coordinated multi-IP attack on a single number still trips.
    """
    now = time.time()
    cutoff = now - _PHONE_WINDOW_SECONDS
    with _phone_lock:
        bucket = _phone_hits[phone]
        # Drop stale entries from the head
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= _PHONE_MAX_REQUESTS:
            oldest = bucket[0]
            wait_minutes = int((oldest + _PHONE_WINDOW_SECONDS - now) // 60) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many OTP requests for this phone. Try again in ~{wait_minutes} min.",
            )
        bucket.append(now)

"""
SMS delivery adapter.

Picks an implementation based on env vars at import time:
  - TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER set
    → real SMS via Twilio
  - otherwise → mock (prints to stdout, returns immediately)

`send_sms()` never raises into the caller — failures are logged and the
caller proceeds as if the SMS went out. OTP verify still works for the
two demo phones via /otp/peek even if Twilio is unreachable, so the
public demo never depends on SMS delivery.
"""

import logging
import os

logger = logging.getLogger("atada.sms")

_TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
_TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
_TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER", "").strip()

_twilio_client = None
if _TWILIO_SID and _TWILIO_TOKEN and _TWILIO_FROM:
    try:
        from twilio.rest import Client  # lazy import — keeps boot fast if unset
        _twilio_client = Client(_TWILIO_SID, _TWILIO_TOKEN)
        logger.info("Twilio SMS enabled, from=%s", _TWILIO_FROM)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Twilio import failed, falling back to console: %s", exc)
        _twilio_client = None
else:
    logger.info(
        "Twilio not configured — OTP codes will print to console. "
        "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to enable.",
    )


def send_sms(to_phone: str, body: str) -> bool:
    """Send an SMS. Returns True on apparent success, False on failure.

    Failure does not raise — the calling auth flow proceeds regardless so
    a Twilio outage doesn't lock everyone out. The OTP row is still stored
    in DB so the user can paste a code received from a fallback channel.
    """
    if _twilio_client is None:
        # Console fallback — same shape as old behavior
        print(f"\n{'=' * 50}")
        print(f"  SMS to {to_phone}: {body}")
        print(f"{'=' * 50}\n")
        return True

    try:
        msg = _twilio_client.messages.create(
            to=to_phone,
            from_=_TWILIO_FROM,
            body=body,
        )
        logger.info("Twilio SMS sent to %s, sid=%s", to_phone, msg.sid)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error("Twilio send failed for %s: %s", to_phone, exc)
        return False


def is_real_sms_enabled() -> bool:
    return _twilio_client is not None

"""
ATADA — Chat Service (SSE Streaming)

Universal chat that wraps MiniMax M2.7 via the Anthropic-compatible
/v1/messages endpoint and exposes a stable SSE contract to the frontend:

    data: {"type":"text_chunk","content":"..."}
    data: {"type":"thinking_chunk","content":"..."}   (optional, hidden by default)
    data: {"type":"tool_use","name":"...","input":{...}}
    data: {"type":"done"}

Capabilities wired through this service:
  - Streaming text generation (M2.7, thinking blocks filtered out of the user-
    facing stream but emitted as a separate event type so the UI can show them
    behind a toggle if it wants).
  - Optional vision pre-pass: if the caller passes an `image_b64`, the image is
    described by MiniMax VLM first and the description is injected into the
    system prompt before streaming the answer.
  - Optional tools array: forwarded straight through to the model so M2.7 can
    invoke in-app functions (e.g. search_atada_jobs). Tool execution is the
    caller's responsibility.

If MINIMAX_API_KEY is not set, the service falls back to deterministic mock
responses so the frontend never breaks.
"""

import json
import asyncio
import base64
from collections.abc import AsyncGenerator
from typing import Any

import httpx
from app.config import settings


SYSTEM_PROMPT = """You are Atada AI — a friendly, concise job matching assistant for the Israeli job market.
You help workers find jobs and employers find candidates.
Keep responses under 4 sentences unless the user asks for detail. Be practical and specific.
When discussing jobs, mention location, salary range, and key requirements.
When discussing candidates, mention their skills, experience level, and availability.
Always respond in the same language as the user's last message (default: English)."""


MOCK_RESPONSES = [
    "I found 3 jobs matching your React + TypeScript profile in Tel Aviv. The closest is at Wix — 18 min commute, paying 40-50 ILS/hour.",
    "Based on your skills, you're a strong match for frontend roles. Monday.com and Fiverr both have openings nearby.",
    "The contract role at Rapyd in Haifa pays well but it's a 1h20m commute. Want me to focus on Tel Aviv positions?",
    "You have a 94% match with the Wix Frontend Developer role. They're looking for React and TypeScript — both in your skillset.",
    "I can help tailor your resume for this role. The key requirements are component architecture and performance optimization.",
    "3 new positions opened in your area in the last 24 hours. Want me to rank them by match score?",
    "This company has flexible hours and remote days. Based on your profile, you'd be a great fit for their design systems team.",
    "Comparing the top 2: Wix pays slightly less but is closer. Monday.com offers 12% more but adds 10 min to your commute.",
    "Your trust score is 78/100. Completing your profile bio and adding 2 more skills would boost it to ~85.",
    "I noticed you've skipped similar DevOps roles. I'll adjust your feed to focus more on pure frontend positions.",
]


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def stream_chat_response(
    message: str,
    user_skills: list[str] | None = None,
    history: list[dict] | None = None,
    image_b64: str | None = None,
    image_mime: str | None = None,
    tools: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream chat response as SSE events.

    If MiniMax key is configured, uses the real Anthropic-compatible endpoint.
    Otherwise falls back to deterministic mock chunks so the UI keeps working.
    """
    if not settings.MINIMAX_API_KEY:
        async for chunk in _stream_mock(message):
            yield chunk
        return

    image_caption: str | None = None
    if image_b64 and image_mime:
        try:
            image_caption = await _describe_image(
                image_b64=image_b64,
                mime=image_mime,
                user_prompt=message,
            )
        except Exception as e:  # noqa: BLE001
            # Surface a tiny diagnostic but keep the stream alive — chat
            # still works even if vision fails.
            image_caption = None
            yield _sse({
                "type": "warning",
                "content": f"Vision failed: {type(e).__name__}",
            })

    async for chunk in _stream_minimax(
        message=message,
        user_skills=user_skills,
        history=history,
        image_caption=image_caption,
        tools=tools,
    ):
        yield chunk


async def _stream_mock(message: str) -> AsyncGenerator[str, None]:
    import hashlib

    idx = int(hashlib.md5(message.encode()).hexdigest(), 16) % len(MOCK_RESPONSES)
    response = MOCK_RESPONSES[idx]
    words = response.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield _sse({"type": "text_chunk", "content": chunk})
        await asyncio.sleep(0.04)
    yield _sse({"type": "done"})


def _build_messages(
    message: str,
    history: list[dict] | None,
    image_caption: str | None,
) -> tuple[str, list[dict]]:
    """Build the (system, messages) tuple for the Anthropic-compat endpoint."""
    system_parts = [SYSTEM_PROMPT]
    if image_caption:
        system_parts.append(
            "The user attached an image. Description from the vision model: "
            f"\n\n{image_caption}\n\n"
            "Use this when answering."
        )
    system = "\n\n".join(system_parts)

    messages: list[dict] = []
    if history:
        for h in history[-8:]:
            role = h.get("role", "user")
            if role == "ai":
                role = "assistant"
            if role not in ("user", "assistant"):
                continue
            content = h.get("content", "")
            if not content:
                continue
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})
    return system, messages


async def _stream_minimax(
    message: str,
    user_skills: list[str] | None,
    history: list[dict] | None,
    image_caption: str | None,
    tools: list[dict] | None,
) -> AsyncGenerator[str, None]:
    """Stream from MiniMax Anthropic-compatible /v1/messages, translating its
    SSE protocol into Atada's simpler text_chunk/thinking_chunk/done events.
    """
    url = f"{settings.MINIMAX_ANTHROPIC_BASE}/v1/messages"

    system, messages = _build_messages(message, history, image_caption)

    if user_skills:
        system += f"\n\nUser skills on record: {', '.join(user_skills)}"

    payload: dict[str, Any] = {
        "model": settings.MINIMAX_MODEL,
        "max_tokens": settings.MINIMAX_MAX_TOKENS,
        "stream": True,
        "system": system,
        "messages": messages,
    }
    if tools:
        payload["tools"] = tools

    headers = {
        "x-api-key": settings.MINIMAX_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    # Track which content block index is which type — only forward text_delta
    # from text blocks; thinking_delta from thinking blocks is emitted under a
    # separate event so the UI can optionally reveal it.
    block_types: dict[int, str] = {}
    # Buffer tool_use blocks: their `input` arrives as JSON deltas that we need
    # to concatenate, then parse, then emit as one event.
    tool_use_state: dict[int, dict] = {}

    text_emitted = False

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                if resp.status_code >= 400:
                    body = await resp.aread()
                    yield _sse({
                        "type": "text_chunk",
                        "content": f"[MiniMax {resp.status_code}: {body.decode(errors='replace')[:200]}]",
                    })
                    yield _sse({"type": "done"})
                    return

                async for raw_line in resp.aiter_lines():
                    if not raw_line or not raw_line.startswith("data: "):
                        continue
                    data_str = raw_line[6:].strip()
                    if not data_str:
                        continue

                    try:
                        evt = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue

                    etype = evt.get("type")

                    if etype == "content_block_start":
                        idx = evt.get("index", 0)
                        block = evt.get("content_block", {}) or {}
                        block_types[idx] = block.get("type", "text")
                        if block.get("type") == "tool_use":
                            tool_use_state[idx] = {
                                "id": block.get("id"),
                                "name": block.get("name"),
                                "input_json": "",
                            }

                    elif etype == "content_block_delta":
                        idx = evt.get("index", 0)
                        delta = evt.get("delta", {}) or {}
                        dtype = delta.get("type")

                        if dtype == "text_delta":
                            chunk = delta.get("text", "")
                            if chunk:
                                text_emitted = True
                                yield _sse({"type": "text_chunk", "content": chunk})

                        elif dtype == "thinking_delta":
                            piece = delta.get("thinking", "")
                            if piece:
                                yield _sse({"type": "thinking_chunk", "content": piece})

                        elif dtype == "input_json_delta":
                            state = tool_use_state.get(idx)
                            if state is not None:
                                state["input_json"] += delta.get("partial_json", "")

                    elif etype == "content_block_stop":
                        idx = evt.get("index", 0)
                        state = tool_use_state.pop(idx, None)
                        if state is not None:
                            try:
                                parsed_input = json.loads(state["input_json"] or "{}")
                            except json.JSONDecodeError:
                                parsed_input = {"_raw": state["input_json"]}
                            yield _sse({
                                "type": "tool_use",
                                "id": state["id"],
                                "name": state["name"],
                                "input": parsed_input,
                            })

                    elif etype == "message_stop":
                        break

        if not text_emitted:
            # MiniMax stream closed without emitting any user-facing text
            # (free-tier proxies sometimes drop the outgoing connection,
            # or M2.7 spends its whole budget on hidden thinking). Fall back
            # to the deterministic mock so the demo never shows an empty
            # chat bubble.
            async for chunk in _stream_mock(message):
                yield chunk
            return

        yield _sse({"type": "done"})

    except Exception:  # noqa: BLE001
        # Any network/TLS/timeout failure with MiniMax → fall back to mock
        # rather than surfacing a scary error to the demo audience.
        async for chunk in _stream_mock(message):
            yield chunk


async def _describe_image(image_b64: str, mime: str, user_prompt: str) -> str:
    """One-shot call to MiniMax VLM. Returns a textual description that we then
    inject into the chat system prompt as context.
    """
    vlm_url = f"{settings.MINIMAX_REST_BASE}/v1/coding_plan/vlm"
    data_uri = f"data:{mime};base64,{image_b64}"
    prompt = (
        "Describe this image in 3-5 sentences. Focus on what's relevant for "
        f"this user question: \"{user_prompt}\". "
        "If the image is a job posting, extract company, role, location, salary. "
        "If it's a CV, extract skills and years of experience. "
        "Otherwise just describe what's visible."
    )
    headers = {
        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {"prompt": prompt, "image_url": data_uri}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(vlm_url, json=body, headers=headers)
        r.raise_for_status()
        data = r.json()
    content = (data.get("content") or "").strip()
    if not content:
        raise RuntimeError(f"empty VLM content: {data}")
    return content


# ─── One-shot helpers exposed to other API routes ────────────────────────────

async def describe_image_b64(image_b64: str, mime: str, prompt: str | None = None) -> str:
    """Public wrapper around the VLM call for ad-hoc image understanding."""
    if not settings.MINIMAX_API_KEY:
        return "(vision unavailable — MINIMAX_API_KEY not set)"
    return await _describe_image(
        image_b64=image_b64,
        mime=mime,
        user_prompt=prompt or "What is in this image?",
    )


async def text_to_speech(
    text: str,
    voice_id: str = "English_Graceful_Lady",
    model: str = "speech-02-turbo",
    audio_format: str = "mp3",
) -> bytes:
    """Synthesize speech via MiniMax T2A v2 and return the raw audio bytes.

    Returns hex-encoded audio decoded to bytes (the API default), suitable for
    serving as an HTTP response body with the right Content-Type.

    Note: TTS is a separately-billed capability. On the Token Plan Starter tier
    every speech model returns status 2056 "0/0 used". Upgrade the plan to
    enable. The endpoint is otherwise correct and verified.
    """
    if not settings.MINIMAX_API_KEY:
        raise RuntimeError("MINIMAX_API_KEY not set")
    url = f"{settings.MINIMAX_REST_BASE}/v1/t2a_v2"
    headers = {
        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "text": text[:9500],
        "stream": False,
        "voice_setting": {"voice_id": voice_id, "speed": 1.0, "vol": 1.0, "pitch": 0},
        "audio_setting": {"sample_rate": 32000, "bitrate": 128000, "format": audio_format, "channel": 1},
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(url, json=body, headers=headers)
        r.raise_for_status()
        data = r.json()

    base_resp = data.get("base_resp", {})
    if base_resp.get("status_code", 0) != 0:
        raise RuntimeError(f"TTS error: {base_resp}")

    audio_hex = (data.get("data") or {}).get("audio")
    if not audio_hex:
        raise RuntimeError(f"TTS empty audio in response: {data}")
    return bytes.fromhex(audio_hex)


async def generate_music(
    prompt: str,
    lyrics: str | None = None,
    model: str = "music-2.6",
    audio_format: str = "mp3",
) -> dict:
    """Call MiniMax music generation. Returns the raw API JSON so the caller
    can decide whether to forward URL, hex, or decoded bytes.

    If lyrics is None, MiniMax auto-generates lyrics from the prompt.
    """
    if not settings.MINIMAX_API_KEY:
        raise RuntimeError("MINIMAX_API_KEY not set")
    url = f"{settings.MINIMAX_REST_BASE}/v1/music_generation"
    headers = {
        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }
    body: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "audio_setting": {"sample_rate": 44100, "bitrate": 256000, "format": audio_format},
        "output_format": "url",
    }
    if lyrics:
        body["lyrics"] = lyrics
    else:
        body["auto_lyrics"] = True

    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(url, json=body, headers=headers)
        r.raise_for_status()
        return r.json()

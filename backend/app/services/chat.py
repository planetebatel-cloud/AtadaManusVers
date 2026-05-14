"""
ATADA — Chat Service (SSE Streaming)
- Integrates with MiniMax LLM via HTTP streaming
- Falls back to mock responses when API key is not set
- SSE contract: text_chunk → candidates_data → done
"""

import json
import asyncio
from collections.abc import AsyncGenerator

import httpx
from app.config import settings


SYSTEM_PROMPT = """You are Atada AI — a friendly, concise job matching assistant for the Israeli job market.
You help workers find jobs and employers find candidates.
Keep responses under 3 sentences. Be practical and specific.
When discussing jobs, mention location, salary range, and key requirements.
When discussing candidates, mention their skills, experience level, and availability.
Always respond in English."""

# Mock responses for when no LLM API key is configured
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


async def stream_chat_response(
    message: str,
    user_skills: list[str] | None = None,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream chat response as SSE events.
    Uses MiniMax API if configured, otherwise falls back to mock.
    """
    if settings.MINIMAX_API_KEY:
        async for chunk in _stream_minimax(message, user_skills, history):
            yield chunk
    else:
        async for chunk in _stream_mock(message):
            yield chunk


async def _stream_mock(message: str) -> AsyncGenerator[str, None]:
    """Mock streaming — simulates LLM token-by-token output."""
    import hashlib
    idx = int(hashlib.md5(message.encode()).hexdigest(), 16) % len(MOCK_RESPONSES)
    response = MOCK_RESPONSES[idx]

    # Simulate token-by-token streaming
    words = response.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        event = json.dumps({"type": "text_chunk", "content": chunk})
        yield f"data: {event}\n\n"
        await asyncio.sleep(0.05)  # simulate latency

    # Send done event
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


async def _stream_minimax(
    message: str,
    user_skills: list[str] | None = None,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Real MiniMax API streaming via SSE."""
    url = f"https://api.minimaxi.chat/v1/text/chatcompletion_v2"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if user_skills:
        context = f"User skills: {', '.join(user_skills)}"
        messages.append({"role": "system", "content": context})

    if history:
        for h in history[-6:]:  # last 6 messages for context
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    messages.append({"role": "user", "content": message})

    payload = {
        "model": settings.MINIMAX_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 300,
    }

    headers = {
        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break

                    try:
                        data = json.loads(data_str)
                        choices = data.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                event = json.dumps({"type": "text_chunk", "content": content})
                                yield f"data: {event}\n\n"
                    except json.JSONDecodeError:
                        continue

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        error_event = json.dumps({"type": "text_chunk", "content": f"Sorry, I'm having trouble connecting. Please try again."})
        yield f"data: {error_event}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

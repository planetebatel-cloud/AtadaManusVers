"""
ATADA — Job Screenshot Parser Service
Sends screenshot to MiniMax VLM, gets structured job data back.
"""

import json
import base64
import re

import httpx
from app.config import settings

VLM_URL = "https://api.minimax.io/v1/coding_plan/vlm"

PARSE_PROMPT = """You are a job posting parser for the Israeli job market.
Analyze this screenshot of a job posting and extract structured data.

Return ONLY a valid JSON object with these fields:
{
  "title": "job title (required)",
  "company": "company name (required)",
  "location": "city/area in Israel (required)",
  "salary_min": null or integer (monthly ILS),
  "salary_max": null or integer (monthly ILS),
  "salary_currency": "ILS",
  "salary_period": "month" or "hour",
  "job_type": "full-time" or "part-time" or "contract" or "freelance",
  "tags": ["skill1", "skill2", ...],
  "description": "full job description text from the image"
}

Rules:
- If salary is given as a range like "15,000-20,000", set salary_min=15000, salary_max=20000
- If salary is per hour, set salary_period to "hour"
- If salary is not mentioned, set salary_min and salary_max to null
- tags should be skills, technologies, or requirements mentioned (max 10)
- description should capture the full text of the posting
- If text is in Hebrew, translate field values to English but keep description bilingual
- Return ONLY the JSON, no markdown, no explanation"""


async def parse_job_screenshot(image_bytes: bytes, mime_type: str) -> dict:
    """
    Send a job screenshot to MiniMax VLM and return parsed job data.
    Returns dict matching JobCreate fields.
    """
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    image_url = f"data:{mime_type};base64,{b64}"

    headers = {
        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "prompt": PARSE_PROMPT,
        "image_url": image_url,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(VLM_URL, json=payload, headers=headers)
        resp.raise_for_status()

    data = resp.json()
    content = data.get("content", "")

    return _extract_json(content)


def _extract_json(text: str) -> dict:
    """Extract JSON object from LLM response text."""
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    # Try finding first { ... }
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError(f"Could not extract JSON from VLM response: {text[:200]}")

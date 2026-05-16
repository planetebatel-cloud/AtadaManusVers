"""
ATADA — AI Sundries API
One-shot endpoints over the MiniMax suite that complement the chat stream:
- POST /api/ai/vision  → describe an image (data:image base64)
- POST /api/ai/tts     → text-to-speech, returns audio/mpeg bytes
- POST /api/ai/music   → music generation with auto-lyrics, returns JSON
                         (URL of the generated track, expires in 24h)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.domain.schemas import TTSRequest, MusicRequest, VisionRequest
from app.services.chat import describe_image_b64, text_to_speech, generate_music

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/vision")
async def vision(body: VisionRequest):
    try:
        content = await describe_image_b64(
            image_b64=body.image_b64,
            mime=body.image_mime,
            prompt=body.prompt,
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Vision failed: {e}")
    return {"content": content}


@router.post("/tts")
async def tts(body: TTSRequest):
    try:
        audio = await text_to_speech(
            text=body.text,
            voice_id=body.voice_id,
            model=body.model,
            audio_format=body.format,
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"TTS failed: {e}")

    media = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "pcm": "audio/pcm",
    }.get(body.format, "application/octet-stream")
    return Response(content=audio, media_type=media)


@router.post("/music")
async def music(body: MusicRequest):
    try:
        result = await generate_music(
            prompt=body.prompt,
            lyrics=body.lyrics,
            model=body.model,
            audio_format=body.format,
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Music gen failed: {e}")
    return result

"""
ATADA — Chat API Route (SSE Streaming)
POST /api/chat/stream   → stream AI response via Server-Sent Events
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import User
from app.domain.schemas import ChatMessage
from app.api.deps import get_optional_user
from app.services.chat import stream_chat_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    body: ChatMessage,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    user_skills = user.skills if user else None
    history = [h.model_dump() for h in body.history] if body.history else None

    async def event_generator():
        async for chunk in stream_chat_response(
            message=body.message,
            user_skills=user_skills,
            history=history,
            image_b64=body.image_b64,
            image_mime=body.image_mime,
            tools=body.tools,
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

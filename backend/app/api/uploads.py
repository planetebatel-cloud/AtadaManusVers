"""
ATADA — Uploads API
POST /api/uploads/avatar  → save the user's avatar image, return its public URL
                            (also auto-patches user.avatar_url for convenience)
"""

from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.domain.models import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 4 * 1024 * 1024  # 4 MB

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

EXT_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Use JPEG, PNG or WebP.")

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(400, f"File too large (max {MAX_SIZE // (1024*1024)} MB).")

    ext = EXT_BY_MIME[file.content_type]
    # New filename per upload so the URL changes — beats any browser image cache.
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        f.write(data)

    public_url = f"/uploads/avatars/{filename}"
    user.avatar_url = public_url
    db.add(user)
    db.commit()

    return {"url": public_url}

"""
ATADA — Matching Service
- Computes match score between user skills and job tags
- Trust Score calculation for candidates
- Newbie mixing rule: always include 1 newcomer in top-3
"""

import math
from sqlalchemy.orm import Session
from app.domain.models import Job, User, Match, Candidate


# ─── Israeli cities with approximate coordinates ────────────────────────────

CITY_COORDS: dict[str, tuple[float, float]] = {
    "tel aviv": (32.0853, 34.7818),
    "jerusalem": (31.7683, 35.2137),
    "haifa": (32.7940, 34.9896),
    "beer sheva": (31.2518, 34.7913),
    "netanya": (32.3215, 34.8532),
    "herzliya": (32.1629, 34.8443),
    "ramat gan": (32.0680, 34.8248),
    "petah tikva": (32.0868, 34.8876),
    "rishon lezion": (31.9730, 34.7925),
    "ashdod": (31.8014, 34.6434),
    "rehovot": (31.8928, 34.8077),
    "holon": (32.0116, 34.7748),
    "bnei brak": (32.0834, 34.8339),
    "raanana": (32.1839, 34.8710),
    "kfar saba": (32.1751, 34.9071),
    "modiin": (31.8969, 35.0104),
}


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _guess_coords(location: str) -> tuple[float, float] | None:
    loc = location.lower().strip()
    for city, coords in CITY_COORDS.items():
        if city in loc:
            return coords
    return None


def compute_match_score(user: User, job: Job) -> dict:
    """
    Compute match score (0-100) with explainable factors.
    Factors: skill_overlap (50%), location (30%), salary_fit (20%)
    """
    factors = {}

    # Skill overlap (50% weight)
    user_skills = {s.lower() for s in (user.skills or [])}
    job_tags = {t.lower() for t in (job.tags or [])}
    if job_tags:
        overlap = len(user_skills & job_tags) / len(job_tags)
    else:
        overlap = 0.5  # neutral if no tags
    factors["skills"] = round(overlap * 50)

    # Location proximity (30% weight)
    user_coords = (user.lat, user.lng) if user.lat and user.lng else _guess_coords(user.location or "")
    job_coords = (job.lat, job.lng) if job.lat and job.lng else _guess_coords(job.location or "")

    if user_coords and job_coords:
        dist_km = _haversine_km(*user_coords, *job_coords)
        # 0 km → 30 pts, 10 km → 25 pts, 50 km → 10 pts, 100+ km → 0 pts
        location_score = max(0, 30 - (dist_km / 100 * 30))
        factors["location"] = round(location_score)
        factors["distance_km"] = round(dist_km, 1)
    else:
        factors["location"] = 15  # neutral
        factors["distance_km"] = None

    # Salary fit (20% weight) — if user has title suggesting seniority
    factors["salary"] = 15  # neutral default

    total = sum(v for k, v in factors.items() if k not in ("distance_km",))
    factors["total"] = min(total, 100)

    return factors


def compute_matches_for_user(user: User, db: Session, limit: int = 50) -> list[Match]:
    """Pre-compute matches for a user against all active jobs."""
    jobs = db.query(Job).filter(Job.is_active == True).limit(200).all()
    matches = []

    for job in jobs:
        # Skip if already matched
        existing = db.query(Match).filter(
            Match.user_id == user.id,
            Match.job_id == job.id,
        ).first()
        if existing:
            matches.append(existing)
            continue

        factors = compute_match_score(user, job)
        match = Match(
            user_id=user.id,
            job_id=job.id,
            score=factors["total"],
            factors=factors,
        )
        db.add(match)
        matches.append(match)

    db.commit()

    # Sort by score descending
    matches.sort(key=lambda m: m.score, reverse=True)
    return matches[:limit]


# ─── Trust Score ────────────────────────────────────────────────────────────

def compute_trust_score(candidate: Candidate, db: Session) -> float:
    """
    Trust Score (0-100) based on:
    - Profile completeness (30%)
    - Skills count (20%)
    - Experience (20%)
    - Activity (engagement) (30%)
    """
    score = 0.0

    # Profile completeness
    fields = [candidate.name, candidate.title, candidate.location, candidate.about]
    filled = sum(1 for f in fields if f)
    score += (filled / len(fields)) * 30

    # Skills
    skill_count = len(candidate.skills or [])
    score += min(skill_count / 5, 1.0) * 20

    # Experience
    exp = min(candidate.experience_years / 10, 1.0)
    score += exp * 20

    # Activity — placeholder (would track logins, responses, etc.)
    score += 15  # neutral

    candidate.trust_score = round(min(score, 100), 1)
    db.commit()
    return candidate.trust_score


def apply_newbie_mixing(candidates: list, count: int = 3) -> list:
    """
    Newbie mixing rule: in top-N results, always include at least 1 newcomer.
    """
    if len(candidates) <= count:
        return candidates

    top = candidates[:count]
    has_newbie = any(getattr(c, "is_newbie", False) for c in top)

    if not has_newbie:
        # Find first newbie in remaining candidates
        for i, c in enumerate(candidates[count:], start=count):
            if getattr(c, "is_newbie", False):
                # Swap last in top with this newbie
                top[-1] = c
                break

    return top + [c for c in candidates[count:] if c not in top]

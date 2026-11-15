from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import SerendipityProfile
from ..schemas import SerendipityCreate, SerendipityResponse
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/serendipity", tags=["Serendipity Lounge"])

SAMPLE_PROFILES = [
    {
        "nickname": "Maya",
        "table_number": "Table 4",
        "topic": "Building a Google Cloud Run & Gemini Hackathon App",
        "looking_for": "Co-working buddy",
        "icebreaker": "Building with Cloud Run? Come compare architectures or take a coffee break!"
    },
    {
        "nickname": "Daniel",
        "table_number": "Table 6",
        "topic": "Reading Sci-Fi & Indie Game Development",
        "looking_for": "Casual chat",
        "icebreaker": "Ask me about Three-Body Problem or game design over an espresso."
    }
]

def seed_profiles_if_empty(db: Session):
    if db.query(SerendipityProfile).count() == 0:
        for p in SAMPLE_PROFILES:
            profile = SerendipityProfile(
                nickname=p["nickname"],
                table_number=p["table_number"],
                topic=p["topic"],
                looking_for=p["looking_for"],
                icebreaker=p["icebreaker"],
                is_active=True
            )
            db.add(profile)
        db.commit()

@router.get("/members", response_model=List[SerendipityResponse])
def get_lounge_members(db: Session = Depends(get_db)):
    seed_profiles_if_empty(db)
    return db.query(SerendipityProfile).filter(SerendipityProfile.is_active == True).order_by(SerendipityProfile.created_at.desc()).all()

@router.post("/join", response_model=SerendipityResponse)
async def join_lounge(profile_in: SerendipityCreate, db: Session = Depends(get_db)):
    icebreaker = await GeminiService.generate_icebreaker(profile_in.topic, profile_in.looking_for)
    profile = SerendipityProfile(
        nickname=profile_in.nickname,
        table_number=profile_in.table_number,
        topic=profile_in.topic,
        looking_for=profile_in.looking_for,
        icebreaker=icebreaker,
        is_active=True
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

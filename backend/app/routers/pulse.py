from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import datetime
from ..database import get_db
from ..models import RoomFeedback
from ..schemas import RoomFeedbackCreate, RoomFeedbackResponse, PulseSummaryResponse
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/pulse", tags=["Room Pulse"])

SAMPLE_FEEDBACKS = [
    {
        "table_number": "Table 4",
        "vibe_rating": 5,
        "ambient_noise": "Just Right",
        "temperature": "Comfortable",
        "comment": "Amazing study atmosphere and the playlist is top tier!"
    },
    {
        "table_number": "Table 2",
        "vibe_rating": 4,
        "ambient_noise": "Just Right",
        "temperature": "Too Cold",
        "comment": "The AC vent is directly overhead, a bit freezing."
    },
    {
        "table_number": "Table 7",
        "vibe_rating": 5,
        "ambient_noise": "Too Quiet",
        "temperature": "Comfortable",
        "comment": "Oat flat white was dialed in perfectly."
    }
]

def seed_feedback_if_empty(db: Session):
    if db.query(RoomFeedback).count() == 0:
        for f in SAMPLE_FEEDBACKS:
            feedback = RoomFeedback(
                table_number=f["table_number"],
                vibe_rating=f["vibe_rating"],
                ambient_noise=f["ambient_noise"],
                temperature=f["temperature"],
                comment=f["comment"],
                sentiment_label="Positive" if f["vibe_rating"] >= 4 else "Neutral",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
            )
            db.add(feedback)
        db.commit()

@router.post("/feedback", response_model=RoomFeedbackResponse)
def submit_feedback(feedback_in: RoomFeedbackCreate, db: Session = Depends(get_db)):
    sentiment = "Positive" if feedback_in.vibe_rating >= 4 else ("Neutral" if feedback_in.vibe_rating == 3 else "Negative")
    feedback = RoomFeedback(
        table_number=feedback_in.table_number,
        vibe_rating=feedback_in.vibe_rating,
        ambient_noise=feedback_in.ambient_noise,
        temperature=feedback_in.temperature,
        comment=feedback_in.comment,
        sentiment_label=sentiment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/summary", response_model=PulseSummaryResponse)
async def get_pulse_summary(db: Session = Depends(get_db)):
    seed_feedback_if_empty(db)
    feedbacks = db.query(RoomFeedback).order_by(RoomFeedback.created_at.desc()).limit(15).all()
    feedbacks_data = [
        {
            "table_number": f.table_number,
            "vibe_rating": f.vibe_rating,
            "ambient_noise": f.ambient_noise,
            "temperature": f.temperature,
            "comment": f.comment
        }
        for f in feedbacks
    ]
    summary = await GeminiService.analyze_room_pulse(feedbacks_data)
    return summary

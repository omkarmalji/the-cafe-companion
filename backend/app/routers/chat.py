from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MenuItem
from ..schemas import ChatRequest, ChatResponse, PhotoOrderRequest, PhotoOrderResponse
from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/chat", tags=["AI Concierge"])

@router.post("", response_model=ChatResponse)
async def chat_order(request: ChatRequest, db: Session = Depends(get_db)):
    menu_items = db.query(MenuItem).filter(MenuItem.is_available == True).all()
    menu_data = [
        {
            "name": item.name,
            "category": item.category,
            "price": item.price,
            "description": item.description,
            "dietary_tags": item.dietary_tags,
            "caffeine_level": item.caffeine_level,
            "vibe_tags": item.vibe_tags
        }
        for item in menu_items
    ]

    history_dicts = [{"role": m.role, "content": m.content} for m in request.conversation_history]
    
    result = await GeminiService.process_chat_order(
        user_message=request.message,
        conversation_history=history_dicts,
        menu_items=menu_data,
        vibe_mode=request.vibe_mode or "Focus",
        allergies=request.allergies
    )
    return result

@router.post("/photo", response_model=PhotoOrderResponse)
async def photo_order(request: PhotoOrderRequest, db: Session = Depends(get_db)):
    menu_items = db.query(MenuItem).filter(MenuItem.is_available == True).all()
    menu_data = [
        {
            "name": item.name,
            "category": item.category,
            "price": item.price,
            "description": item.description
        }
        for item in menu_items
    ]

    result = await GeminiService.process_photo_order(
        image_base64=request.image_base64,
        user_prompt=request.user_prompt,
        menu_items=menu_data
    )
    return result

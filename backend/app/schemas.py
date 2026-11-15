from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# --- Menu Schemas ---
class MenuItemBase(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = None
    dietary_tags: Optional[str] = ""
    caffeine_level: Optional[str] = "Medium"
    vibe_tags: Optional[str] = "Focus,Social"
    image_url: Optional[str] = None
    is_available: bool = True

class MenuItemResponse(MenuItemBase):
    id: int
    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    item_name: str
    price: float
    quantity: int = 1
    milk_choice: str = "Whole"
    sweetness: str = "Normal"
    notes: Optional[str] = None

class OrderItemResponse(OrderItemCreate):
    id: int
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_name: str = "Guest"
    table_number: str = "Table 1"
    vibe_mode: str = "Focus"
    special_instructions: Optional[str] = None
    allergies: Optional[str] = None
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: str  # pending, preparing, ready, completed

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    table_number: str
    vibe_mode: str
    special_instructions: Optional[str] = None
    allergies: Optional[str] = None
    status: str
    batch_tag: Optional[str] = None
    estimated_wait_minutes: int
    created_at: datetime.datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

# --- Room Pulse / Feedback Schemas ---
class RoomFeedbackCreate(BaseModel):
    table_number: str = "Table 1"
    vibe_rating: int = Field(5, ge=1, le=5)
    ambient_noise: str = "Just Right"  # Too Loud, Just Right, Too Quiet
    temperature: str = "Comfortable"  # Too Cold, Comfortable, Warm
    comment: Optional[str] = None

class RoomFeedbackResponse(RoomFeedbackCreate):
    id: int
    sentiment_label: str
    ai_summary: Optional[str]
    created_at: datetime.datetime
    class Config:
        from_attributes = True

class PulseSummaryResponse(BaseModel):
    total_feedback_count: int
    average_vibe_score: float
    room_mood: str  # e.g. "Vibrant & Focused", "Slightly Chilly", "Cozy"
    temperature_status: str
    noise_status: str
    ai_barista_tips: List[str]
    recent_comments: List[str]

# --- Serendipity / Co-Working Schemas ---
class SerendipityCreate(BaseModel):
    nickname: str
    table_number: str
    topic: str
    looking_for: str = "Co-working buddy"

class SerendipityResponse(SerendipityCreate):
    id: int
    icebreaker: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# --- Chat & Multimodal Schemas ---
class ChatMessage(BaseModel):
    role: str  # user or model
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    vibe_mode: Optional[str] = "Focus"
    allergies: Optional[str] = None

class CartAction(BaseModel):
    action: str = "add"  # add, clear, suggest
    item_name: str
    price: float
    quantity: int = 1
    milk_choice: str = "Whole"
    sweetness: str = "Normal"
    notes: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_items: List[CartAction] = []
    vibe_analysis: Optional[str] = None

class PhotoOrderRequest(BaseModel):
    image_base64: str  # base64 encoded image string
    user_prompt: Optional[str] = None

class PhotoOrderResponse(BaseModel):
    identified_item: str
    description: str
    confidence: str
    matched_menu_item: Optional[str] = None
    suggested_customizations: List[str] = []
    recommended_cart_item: Optional[CartAction] = None

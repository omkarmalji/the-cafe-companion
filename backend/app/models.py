import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # Coffee, Tea, Pastry, Cold Brew, Specialty
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    dietary_tags = Column(String(200), default="")  # e.g. "vegan,gluten-free,nut-free"
    caffeine_level = Column(String(50), default="Medium")  # None, Low, Medium, High
    vibe_tags = Column(String(200), default="Focus,Social")  # Focus, Social, Relax, Refresh
    image_url = Column(String(300), nullable=True)
    is_available = Column(Boolean, default=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, index=True)
    customer_name = Column(String(100), default="Guest")
    table_number = Column(String(20), default="Counter")
    vibe_mode = Column(String(50), default="Focus")  # Focus, Social, Relax, Quick
    special_instructions = Column(Text, nullable=True)
    allergies = Column(String(200), nullable=True)
    status = Column(String(30), default="pending")  # pending, preparing, ready, completed
    batch_tag = Column(String(100), nullable=True)  # e.g. "Oat Milk Steaming Batch", "Pastry Heat"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    estimated_wait_minutes = Column(Integer, default=5)
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    item_name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=1)
    milk_choice = Column(String(50), default="Whole")  # Oat, Almond, Whole, Skim, None
    sweetness = Column(String(50), default="Normal")  # None, Half, Normal, Extra
    notes = Column(String(200), nullable=True)

    order = relationship("Order", back_populates="items")

class RoomFeedback(Base):
    __tablename__ = "room_feedback"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), default="Unknown")
    vibe_rating = Column(Integer, default=5)  # 1-5
    ambient_noise = Column(String(30), default="Just Right")  # Too Loud, Just Right, Too Quiet
    temperature = Column(String(30), default="Comfortable")  # Too Cold, Comfortable, Warm
    comment = Column(Text, nullable=True)
    sentiment_label = Column(String(30), default="Positive")  # Positive, Neutral, Negative
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SerendipityProfile(Base):
    __tablename__ = "serendipity_profiles"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), nullable=False)
    table_number = Column(String(20), nullable=False)
    topic = Column(String(150), nullable=False)  # e.g. "Building with Cloud Run & Gemini"
    looking_for = Column(String(100), default="Co-working buddy")  # Co-working buddy, Casual chat, Coffee advice
    icebreaker = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

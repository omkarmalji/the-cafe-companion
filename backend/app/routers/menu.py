from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import MenuItem
from ..schemas import MenuItemResponse

router = APIRouter(prefix="/api/menu", tags=["Menu"])

SAMPLE_MENU = [
    {
        "name": "Iced Oat Flat White",
        "category": "Coffee",
        "price": 5.50,
        "description": "Double ristretto poured over chilled creamy oat milk with silky microfoam.",
        "dietary_tags": "vegan,dairy-free",
        "caffeine_level": "High",
        "vibe_tags": "Focus,Refresh",
        "image_url": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop"
    },
    {
        "name": "Single Origin Pour-Over (Ethiopian Yirgacheffe)",
        "category": "Coffee",
        "price": 6.00,
        "description": "Floral jasmine aroma with bright bergamot notes and lemon zest finish.",
        "dietary_tags": "vegan,gluten-free",
        "caffeine_level": "High",
        "vibe_tags": "Focus,Deep Work",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop"
    },
    {
        "name": "Ceremonial Matcha Latte",
        "category": "Tea",
        "price": 6.50,
        "description": "Stone-ground Uji matcha whisked with your choice of steamed milk and light honey.",
        "dietary_tags": "vegetarian,gluten-free",
        "caffeine_level": "Medium",
        "vibe_tags": "Focus,Relax",
        "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop"
    },
    {
        "name": "Vanilla Nitro Cold Brew",
        "category": "Cold Brew",
        "price": 5.75,
        "description": "Nitrogen-infused 20-hour steep cold brew served velvety smooth on tap with Madagascar vanilla.",
        "dietary_tags": "vegan,gluten-free",
        "caffeine_level": "Very High",
        "vibe_tags": "Focus,Speed",
        "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop"
    },
    {
        "name": "Honey Lavender Chamomile Tea",
        "category": "Tea",
        "price": 4.75,
        "description": "Caffeine-free soothing French lavender blossom infusion with raw local clover honey.",
        "dietary_tags": "vegan,caffeine-free",
        "caffeine_level": "None",
        "vibe_tags": "Relax,Unwind",
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop"
    },
    {
        "name": "Artisan Almond Croissant",
        "category": "Pastry",
        "price": 4.50,
        "description": "Twice-baked flaky French butter pastry filled with rich almond frangipane cream.",
        "dietary_tags": "vegetarian,contains-nuts",
        "caffeine_level": "None",
        "vibe_tags": "Social,Relax",
        "image_url": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop"
    },
    {
        "name": "Sourdough Avocado & Truffle Toast",
        "category": "Food",
        "price": 9.50,
        "description": "Toasted house sourdough, smashed Hass avocado, microgreens, smoked chili flakes and white truffle oil.",
        "dietary_tags": "vegan,dairy-free",
        "caffeine_level": "None",
        "vibe_tags": "Focus,Social",
        "image_url": "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500&auto=format&fit=crop"
    }
]

def seed_menu_if_empty(db: Session):
    count = db.query(MenuItem).count()
    if count == 0:
        for item_data in SAMPLE_MENU:
            item = MenuItem(**item_data)
            db.add(item)
        db.commit()

@router.get("", response_model=List[MenuItemResponse])
def get_menu(db: Session = Depends(get_db)):
    seed_menu_if_empty(db)
    return db.query(MenuItem).filter(MenuItem.is_available == True).all()

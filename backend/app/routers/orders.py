from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from ..database import get_db
from ..models import Order, OrderItem
from ..schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from ..pricing import upgrade_legacy_demo_prices

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def compute_batch_tag(items):
    oat_count = sum(1 for item in items if "oat" in str(item.milk_choice).lower())
    matcha_count = sum(1 for item in items if "matcha" in str(item.item_name).lower())
    pastry_count = sum(1 for item in items if any(k in str(item.item_name).lower() for k in ["croissant", "toast", "cookie"]))
    
    tags = []
    if oat_count >= 1:
        tags.append("⚡ Batch Oat Milk Steaming")
    if matcha_count >= 1:
        tags.append("🍵 Whisk Station")
    if pastry_count >= 1:
        tags.append("🥐 Warmer Tray")
    
    return " | ".join(tags) if tags else "☕ Standard Prep"

def seed_sample_orders_if_empty(db: Session):
    if db.query(Order).count() == 0:
        sample1 = Order(
            order_number="#101",
            customer_name="Alex (Table 3)",
            table_number="Table 3",
            vibe_mode="Focus",
            special_instructions="Extra hot please",
            allergies="Lactose intolerant",
            status="preparing",
            batch_tag="⚡ Batch Oat Milk Steaming",
            estimated_wait_minutes=3,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=3)
        )
        db.add(sample1)
        db.flush()

        item1 = OrderItem(
            order_id=sample1.id,
            item_name="Iced Oat Flat White",
            price=250.00,
            quantity=1,
            milk_choice="Oat",
            sweetness="Half",
            notes="Dairy-free"
        )
        db.add(item1)

        sample2 = Order(
            order_number="#102",
            customer_name="Priya (Counter)",
            table_number="Counter",
            vibe_mode="Quick",
            status="pending",
            batch_tag="⚡ Batch Oat Milk Steaming | 🥐 Warmer Tray",
            estimated_wait_minutes=6,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
        )
        db.add(sample2)
        db.flush()

        item2 = OrderItem(
            order_id=sample2.id,
            item_name="Ceremonial Matcha Latte",
            price=295.00,
            quantity=1,
            milk_choice="Oat",
            sweetness="Normal"
        )
        item3 = OrderItem(
            order_id=sample2.id,
            item_name="Artisan Almond Croissant",
            price=225.00,
            quantity=1,
            notes="Warmed"
        )
        db.add_all([item2, item3])
        db.commit()

@router.get("", response_model=List[OrderResponse])
def get_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    seed_sample_orders_if_empty(db)
    upgrade_legacy_demo_prices(db)
    query = db.query(Order).order_by(Order.created_at.desc())
    if status:
        query = query.filter(Order.status == status)
    return query.all()

@router.post("", response_model=OrderResponse)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # Calculate sequential order number
    today_count = db.query(Order).count() + 103
    order_number = f"#{today_count}"

    # Calculate smart wait time based on pending orders
    pending_count = db.query(Order).filter(Order.status.in_(["pending", "preparing"])).count()
    estimated_wait = max(3, (pending_count + 1) * 3)

    batch_tag = compute_batch_tag(order_in.items)

    order = Order(
        order_number=order_number,
        customer_name=order_in.customer_name,
        table_number=order_in.table_number,
        vibe_mode=order_in.vibe_mode,
        special_instructions=order_in.special_instructions,
        allergies=order_in.allergies,
        status="pending",
        batch_tag=batch_tag,
        estimated_wait_minutes=estimated_wait
    )
    db.add(order)
    db.flush()

    for item_data in order_in.items:
        item = OrderItem(
            order_id=order.id,
            item_name=item_data.item_name,
            price=item_data.price,
            quantity=item_data.quantity,
            milk_choice=item_data.milk_choice,
            sweetness=item_data.sweetness,
            notes=item_data.notes
        )
        db.add(item)

    db.commit()
    db.refresh(order)
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, status_update: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order

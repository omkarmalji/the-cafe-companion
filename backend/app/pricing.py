"""Rupee pricing for the demo menu, including upgrades of legacy demo data."""

from sqlalchemy.orm import Session
from .models import MenuItem, OrderItem

# Deliberate local menu prices, not foreign-exchange conversions.
# Only exact legacy demo prices are upgraded; customized prices stay untouched.
LEGACY_MENU_PRICES = {
    "Iced Oat Flat White": (5.50, 250.00),
    "Single Origin Pour-Over (Ethiopian Yirgacheffe)": (6.00, 275.00),
    "Ceremonial Matcha Latte": (6.50, 295.00),
    "Vanilla Nitro Cold Brew": (5.75, 265.00),
    "Honey Lavender Chamomile Tea": (4.75, 195.00),
    "Artisan Almond Croissant": (4.50, 225.00),
    "Sourdough Avocado & Truffle Toast": (9.50, 345.00),
}


def upgrade_legacy_demo_prices(db: Session) -> None:
    changed = 0
    for name, (old_price, rupee_price) in LEGACY_MENU_PRICES.items():
        changed += db.query(MenuItem).filter(
            MenuItem.name == name, MenuItem.price == old_price
        ).update({MenuItem.price: rupee_price}, synchronize_session="fetch")
        changed += db.query(OrderItem).filter(
            OrderItem.item_name == name, OrderItem.price == old_price
        ).update({OrderItem.price: rupee_price}, synchronize_session="fetch")
    if changed:
        db.commit()

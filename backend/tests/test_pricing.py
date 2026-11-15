import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import MenuItem, OrderItem
from app.pricing import upgrade_legacy_demo_prices


class RupeePriceUpgradeTests(unittest.TestCase):
    def test_updates_legacy_menu_and_ticket_prices_without_changing_custom_prices(self):
        engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(engine)
        with sessionmaker(bind=engine)() as db:
            old_menu = MenuItem(name="Iced Oat Flat White", category="Coffee", price=5.50)
            custom_menu = MenuItem(name="Ceremonial Matcha Latte", category="Tea", price=310)
            old_ticket = OrderItem(item_name="Iced Oat Flat White", price=5.50)
            custom_ticket = OrderItem(item_name="Iced Oat Flat White", price=260)
            db.add_all([old_menu, custom_menu, old_ticket, custom_ticket])
            db.commit()
            upgrade_legacy_demo_prices(db)
            self.assertEqual(old_menu.price, 250)
            self.assertEqual(old_ticket.price, 250)
            self.assertEqual(custom_menu.price, 310)
            self.assertEqual(custom_ticket.price, 260)
            upgrade_legacy_demo_prices(db)
            self.assertEqual(old_menu.price, 250)
            self.assertEqual(old_ticket.price, 250)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()

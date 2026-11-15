import { useState } from "react";
import { Coffee, ArrowUpRight, ShoppingBag } from "lucide-react";
import { CustomerView } from "./components/CustomerView/CustomerView";
import { BaristaView } from "./components/BaristaView/BaristaView";
import type { Order, OrderItem } from "./types";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState<"customer" | "barista">(
    "customer",
  );
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [tableNumber, setTableNumber] = useState("Table 4");
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="The Café Companion home">
            <span className="brand-mark">
              <Coffee size={23} strokeWidth={1.6} />
            </span>
            <span>
              The Café
              <span className="brand-second">
                Companion<span className="brand-period">.</span>
              </span>
            </span>
          </a>
          <span className="header-note">Your table at Third Wave Coffee</span>
          <nav className="persona-switch" aria-label="Choose your experience">
            <button
              className={activeTab === "customer" ? "is-active" : ""}
              aria-pressed={activeTab === "customer"}
              onClick={() => setActiveTab("customer")}
            >
              Customer
              {count > 0 && (
                <span className="nav-count">
                  <ShoppingBag size={12} /> {count}
                </span>
              )}
            </button>
            <button
              className={activeTab === "barista" ? "is-active" : ""}
              aria-pressed={activeTab === "barista"}
              onClick={() => setActiveTab("barista")}
            >
              Barista &amp; Pulse
              <ArrowUpRight size={14} />
            </button>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {activeTab === "customer" ? (
          <CustomerView
            cart={cart}
            setCart={setCart}
            activeOrder={activeOrder}
            setActiveOrder={setActiveOrder}
            tableNumber={tableNumber}
            setTableNumber={setTableNumber}
          />
        ) : (
          <BaristaView />
        )}
      </main>
      <footer className="site-footer page-width">
        <span>
          The Café Companion<span className="brand-period">.</span>
        </span>
        <span>Made for moments between the busy ones.</span>
        <span>Google Cloud Builder Pop-Up</span>
      </footer>
    </div>
  );
}
export default App;

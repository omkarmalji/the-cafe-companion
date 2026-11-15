import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Laptop,
  Leaf,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Smile,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { api } from "../../api";
import { formatPrice as money } from "../../format";
import type { MenuItem, Order, OrderItem } from "../../types";
import { Reveal } from "../Motion";
import { Modal } from "../Modal";
import { Concierge, Lounge, RoomFeedback } from "./GuestFeatures";

interface Props {
  cart: OrderItem[];
  setCart: Dispatch<SetStateAction<OrderItem[]>>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
}
const vibes = [
  { label: "Deep Work", description: "Find your focus", icon: Laptop },
  {
    label: "Quick Catch-up",
    description: "A little good company",
    icon: MessageCircle,
  },
  { label: "Unwind & Read", description: "Take the slow lane", icon: BookOpen },
  { label: "Post-Workout", description: "Refuel & refresh", icon: Zap },
];
const photoMap: Record<string, string> = {
  "Iced Oat Flat White": "iced-oat",
  "Single Origin Pour-Over (Ethiopian Yirgacheffe)": "pour-over",
  "Ceremonial Matcha Latte": "matcha",
  "Vanilla Nitro Cold Brew": "cold-brew",
  "Honey Lavender Chamomile Tea": "herbal-tea",
  "Artisan Almond Croissant": "croissant",
  "Sourdough Avocado & Truffle Toast": "toast",
};
const imageFor = (item: MenuItem) =>
  photoMap[item.name] ? `/images/${photoMap[item.name]}.jpg` : item.image_url;
const defaultMilk = (item: MenuItem) =>
  /latte|flat white/i.test(item.name) ? "Oat" : "None";
const sameItem = (a: OrderItem, b: OrderItem) =>
  a.item_name === b.item_name &&
  a.milk_choice === b.milk_choice &&
  a.sweetness === b.sweetness &&
  (a.notes || "") === (b.notes || "");

function TableSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="table-select">
      <MapPin size={15} />
      <span className="sr-only">Your Table</span>
      <select
        aria-label="Your Table"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {Array.from({ length: 10 }, (_, index) => (
          <option key={index} value={`Table ${index + 1}`}>
            Table {index + 1}
          </option>
        ))}
        <option value="Counter">Counter</option>
      </select>
    </label>
  );
}

function CustomizeItem({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  onAdd: (item: OrderItem) => void;
  onClose: () => void;
}) {
  const [milk, setMilk] = useState(defaultMilk(item));
  const [sweetness, setSweetness] = useState("Normal");
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Make it yours" onClose={onClose}>
      <div className="customize-product">
        {imageFor(item) && <img src={imageFor(item)} alt={item.name} />}
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <strong>{money(item.price)}</strong>
        </div>
      </div>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({
            item_name: item.name,
            price: item.price,
            quantity: 1,
            milk_choice: milk,
            sweetness,
            notes,
          });
          onClose();
        }}
      >
        <label className="field-label">
          Milk choice
          <select
            value={milk}
            onChange={(event) => setMilk(event.target.value)}
          >
            {["None", "Oat", "Whole", "Almond", "Soy", "Skim"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Sweetness
          <select
            value={sweetness}
            onChange={(event) => setSweetness(event.target.value)}
          >
            {["Normal", "Unsweetened", "Less Sweet", "Extra Sweet"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <label className="field-label">
          Notes <span>Optional</span>
          <textarea
            value={notes}
            maxLength={500}
            rows={2}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anything we should know?"
          />
        </label>
        <p className="helper-text">
          Dietary information:{" "}
          {item.dietary_tags.split(",").join(", ") || "Ask your barista"}.
        </p>
        <button
          className="primary-button full-width"
          disabled={!item.is_available}
        >
          Add to Order · {money(item.price)}
          <Plus size={18} />
        </button>
      </form>
    </Modal>
  );
}

export function CustomerView({
  cart,
  setCart,
  activeOrder,
  setActiveOrder,
  tableNumber,
  setTableNumber,
}: Props) {
  const [vibe, setVibe] = useState("Deep Work");
  const [panel, setPanel] = useState<"menu" | "concierge" | "lounge">("menu");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuState, setMenuState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [allergies, setAllergies] = useState("");
  const [customItem, setCustomItem] = useState<MenuItem | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [trackingError, setTrackingError] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileCart, setMobileCart] = useState(false);
  const menuAnchor = useRef<HTMLDivElement>(null);
  const activeOrderId = activeOrder?.id;
  const activeOrderStatus = activeOrder?.status;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  async function loadMenu() {
    try {
      setMenu(await api.getMenu());
      setMenuState("ready");
    } catch {
      setMenuState("error");
    }
  }
  useEffect(() => {
    let cancelled = false;
    api
      .getMenu()
      .then((items) => {
        if (!cancelled) {
          setMenu(items);
          setMenuState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setMenuState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (activeOrderId === undefined || activeOrderStatus === "completed")
      return;
    let disposed = false;
    let fetching = false;
    async function refresh() {
      if (fetching) return;
      fetching = true;
      try {
        const orders = await api.getOrders();
        const updated = orders.find((order) => order.id === activeOrderId);
        if (!disposed) {
          if (updated) setActiveOrder(updated);
          setTrackingError(false);
        }
      } catch {
        if (!disposed) setTrackingError(true);
      } finally {
        fetching = false;
      }
    }
    const interval = setInterval(() => void refresh(), 8000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [activeOrderId, activeOrderStatus, setActiveOrder]);

  function addToCart(item: OrderItem) {
    setCart((previous) =>
      previous.some((existing) => sameItem(existing, item))
        ? previous.map((existing) =>
            sameItem(existing, item)
              ? { ...existing, quantity: existing.quantity + item.quantity }
              : existing,
          )
        : [...previous, item],
    );
    setToast(`${item.item_name} added to your order`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }
  function quantity(index: number, delta: number) {
    setCart((previous) =>
      previous
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }
  async function placeOrder() {
    if (placingOrder || cart.length === 0) return;
    setPlacingOrder(true);
    setOrderError("");
    try {
      const order = await api.createOrder({
        customer_name: `Patron (${tableNumber})`,
        table_number: tableNumber,
        vibe_mode: vibe,
        allergies,
        items: cart,
      });
      setActiveOrder(order);
      setCart([]);
      setCheckout(false);
      setMobileCart(false);
    } catch {
      setOrderError(
        "Your order was not placed. Please try again. Your items are still here.",
      );
    } finally {
      setPlacingOrder(false);
    }
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filtered = menu.filter(
    (item) =>
      (category === "All" || category === item.category) &&
      `${item.name} ${item.description} ${item.dietary_tags}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const categories = ["All", "Coffee", "Tea", "Cold Brew", "Pastry", "Food"];
  function browse() {
    setPanel("menu");
    menuAnchor.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  const cartContent = (
    <>
      <div className="cart-heading">
        <div>
          <ShoppingBag size={19} strokeWidth={1.7} />
          <h2>Your order</h2>
        </div>
        <span className="item-count">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="cart-table">
        <span>Make yourself comfortable.</span>
        <TableSelect value={tableNumber} onChange={setTableNumber} />
      </div>
      {cart.length === 0 ? (
        <div className="cart-empty">
          <span className="empty-bag">
            <ShoppingBag size={34} strokeWidth={1.1} />
          </span>
          <h3>Your next favorite awaits.</h3>
          <p>
            A little pick-me-up? Add something
            <br />
            from the menu to get started.
          </p>
          <button
            className="text-button"
            onClick={() => {
              setMobileCart(false);
              browse();
            }}
          >
            Find something good
            <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="cart-items">
          {cart.map((item, index) => (
            <article
              className="cart-item"
              key={`${item.item_name}-${item.milk_choice}-${item.sweetness}-${item.notes}`}
            >
              <div className="cart-item-top">
                <h3>{item.item_name}</h3>
                <button
                  className="icon-button small"
                  aria-label={`Remove ${item.item_name}`}
                  onClick={() =>
                    setCart((previous) =>
                      previous.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p>
                {item.milk_choice !== "None"
                  ? `${item.milk_choice} milk · `
                  : ""}
                {item.sweetness} sweetness
              </p>
              {item.notes && <p>{item.notes}</p>}
              <div className="cart-item-bottom">
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${item.item_name} quantity`}
                    onClick={() => quantity(index, -1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    aria-label={`Increase ${item.item_name} quantity`}
                    onClick={() => quantity(index, 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="cart-bottom">
        <div className="cart-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <button
          className="primary-button full-width"
          disabled={cart.length === 0}
          onClick={() => {
            setOrderError("");
            setCheckout(true);
            setMobileCart(false);
          }}
        >
          Review &amp; Order
          <ArrowRight size={17} />
        </button>
        <p className="cart-footnote">
          <ShieldCheck size={13} /> Review everything before placing your order.
        </p>
      </div>
    </>
  );

  return (
    <div className="page-width customer-page">
      <div className="welcome-row">
        <span>
          <Coffee size={15} /> A good day starts here.
        </span>
        <TableSelect value={tableNumber} onChange={setTableNumber} />
      </div>
      <Reveal className="cafe-hero">
        <div className="hero-copy">
          <span className="eyebrow" data-enter>
            YOUR DAILY PAUSE
          </span>
          <h1 data-enter>
            A little pause.
            <br />A good coffee<span>.</span>
          </h1>
          <p data-enter>
            Settle in. Find your favorite.
            <br />
            We’ll take care of the rest.
          </p>
          <div className="hero-actions" data-enter>
            <button className="primary-button" onClick={browse}>
              Explore the menu
              <ArrowDown size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => {
                setPanel("concierge");
                menuAnchor.current?.scrollIntoView({ behavior: "auto" });
              }}
            >
              Help me choose
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className="hero-photo">
          <img
            data-photo
            src="/images/cafe-moment.jpg"
            alt="Fresh coffee, a quiet table, and a moment to slow down"
            width="1200"
            height="800"
            fetchPriority="high"
          />
        </div>
      </Reveal>
      <section className="vibe-section" aria-labelledby="vibe-title">
        <div className="vibe-heading">
          <h2 id="vibe-title">What’s your kind of day?</h2>
          <p>A little context for your companion.</p>
        </div>
        <div className="vibe-options">
          {vibes.map(({ label, description, icon: Icon }) => (
            <button
              key={label}
              className={`vibe-option ${vibe === label ? "selected" : ""}`}
              onClick={() => setVibe(label)}
              aria-pressed={vibe === label}
            >
              <Icon size={20} strokeWidth={1.6} />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <span className="vibe-check">
                {vibe === label && <Check size={12} />}
              </span>
            </button>
          ))}
        </div>
      </section>
      {activeOrder && (
        <section
          className={`order-tracker ${activeOrder.status === "ready" ? "order-ready" : ""}`}
          aria-label="Your order status"
          aria-live="polite"
        >
          <div className="tracker-info">
            <span className="tracker-icon">
              {activeOrder.status === "ready" ||
              activeOrder.status === "completed" ? (
                <Check size={22} />
              ) : (
                <Coffee size={22} />
              )}
            </span>
            <div>
              <strong>
                {activeOrder.status === "ready"
                  ? "Your order is ready. Enjoy!"
                  : activeOrder.status === "completed"
                    ? "Thanks for sharing a moment with us."
                    : "Something good is on its way."}
              </strong>
              <p>
                {activeOrder.order_number} · {activeOrder.table_number}
                {!["ready", "completed"].includes(activeOrder.status) &&
                  ` · About ${activeOrder.estimated_wait_minutes} min`}
              </p>
              {trackingError && (
                <span className="helper-text">
                  Live updates interrupted. Reconnecting…
                </span>
              )}
            </div>
          </div>
          <ol className="order-steps">
            {["Received", "Preparing", "Ready"].map((label, index) => (
              <li
                key={label}
                className={
                  index <=
                  (activeOrder.status === "pending"
                    ? 0
                    : activeOrder.status === "preparing"
                      ? 1
                      : 2)
                    ? "done"
                    : ""
                }
              >
                <span>
                  {index <=
                  (activeOrder.status === "pending"
                    ? 0
                    : activeOrder.status === "preparing"
                      ? 1
                      : 2) ? (
                    <Check size={12} />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </li>
            ))}
          </ol>
          {activeOrder.status === "completed" && (
            <button
              className="text-button"
              onClick={() => setActiveOrder(null)}
            >
              Dismiss
            </button>
          )}
        </section>
      )}
      <div ref={menuAnchor} className="ordering-layout" id="cafe-menu">
        <div className="ordering-main">
          <nav className="content-tabs" aria-label="Café experiences">
            {(
              [
                { id: "menu", label: "Café Menu", icon: Coffee },
                { id: "concierge", label: "Concierge", icon: MessageCircle },
                { id: "lounge", label: "Lounge", icon: Users },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-pressed={panel === id}
                className={panel === id ? "active" : ""}
                onClick={() => setPanel(id)}
              >
                <Icon size={17} strokeWidth={1.7} />
                {label}
                {panel === id && <span className="active-tab-line" />}
              </button>
            ))}
          </nav>
          <section hidden={panel !== "menu"} aria-label="Café Menu">
            <div className="menu-heading">
              <div>
                <h2>Made with a little extra care.</h2>
                <p>Single-origin coffee, slow mornings &amp; fresh bakes.</p>
              </div>
              <label className="menu-search">
                <Search size={16} />
                <span className="sr-only">Search menu</span>
                <input
                  type="search"
                  placeholder="Find your favorite"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="category-row" aria-label="Menu categories">
              {categories.map((value) => (
                <button
                  key={value}
                  aria-pressed={category === value}
                  className={category === value ? "active" : ""}
                  onClick={() => setCategory(value)}
                >
                  {value === "All" ? "All favorites" : value}
                </button>
              ))}
              <span>
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
              </span>
            </div>
            {menuState === "loading" ? (
              <div
                className="menu-grid"
                aria-busy="true"
                aria-label="Loading menu"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="menu-skeleton" key={index}>
                    <div />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : menuState === "error" ? (
              <div className="empty-state panel">
                <Coffee size={32} strokeWidth={1.4} />
                <h3>The menu’s taking a moment.</h3>
                <p>
                  We couldn’t reach the café. Your order is still saved here.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setMenuState("loading");
                    void loadMenu();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Search size={30} />
                <h3>No matches this time.</h3>
                <p>Try a different name or browse all favorites.</p>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Show all favorites
                </button>
              </div>
            ) : (
              <Reveal
                className="menu-grid"
                motionKey={`${panel}-${category}-${query}-${menu.length}`}
              >
                {filtered.map((item) => (
                  <article className="menu-card" key={item.id} data-reveal>
                    <button
                      className="menu-image-button"
                      aria-label={`Customize ${item.name}`}
                      onClick={() => setCustomItem(item)}
                    >
                      {imageFor(item) ? (
                        <img
                          loading="lazy"
                          src={imageFor(item)}
                          alt={item.name}
                          width="640"
                          height="480"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Coffee size={40} strokeWidth={1} />
                      )}
                      <span className="image-customize">
                        <SlidersHorizontal size={15} /> Make it yours
                      </span>
                    </button>
                    <div className="menu-card-body">
                      <span className="menu-item-category">
                        {item.category}
                      </span>
                      <button
                        className="item-title"
                        onClick={() => setCustomItem(item)}
                      >
                        {item.name}
                      </button>
                      <p className="item-description">{item.description}</p>
                      <div className="dietary-info">
                        {item.dietary_tags.includes("contains-nuts") && (
                          <span className="allergen-tag">Contains nuts</span>
                        )}
                        {item.dietary_tags.includes("vegan") && (
                          <span>
                            <Leaf size={12} /> Plant based
                          </span>
                        )}
                        {item.dietary_tags.includes("gluten-free") && (
                          <span>Gluten free</span>
                        )}
                        <span>
                          {item.caffeine_level === "None"
                            ? "Caffeine free"
                            : `${item.caffeine_level} caffeine`}
                        </span>
                      </div>
                      <div className="menu-card-bottom">
                        <strong>{money(item.price)}</strong>
                        <button
                          className="add-button"
                          disabled={!item.is_available}
                          aria-label={`Add ${item.name} to order`}
                          onClick={() =>
                            addToCart({
                              item_name: item.name,
                              price: item.price,
                              quantity: 1,
                              milk_choice: defaultMilk(item),
                              sweetness: "Normal",
                            })
                          }
                        >
                          <Plus size={16} />
                          <span>{item.is_available ? "Add" : "Sold out"}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </Reveal>
            )}
          </section>
          <div hidden={panel !== "concierge"}>
            <Concierge
              vibe={vibe}
              allergies={allergies}
              onAllergiesChange={setAllergies}
              addToCart={addToCart}
            />
          </div>
          <div hidden={panel !== "lounge"}>
            <Lounge table={tableNumber} />
          </div>
          <div className="menu-endnote">
            <Coffee size={17} strokeWidth={1.5} />
            <span>Thoughtfully made. Happily served.</span>
            <button className="text-button" onClick={() => setFeedback(true)}>
              How’s your stay?
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
        <aside className="order-sidebar" aria-label="Your order summary">
          <section className="cart-panel panel">{cartContent}</section>
          <button className="comfort-card" onClick={() => setFeedback(true)}>
            <span className="comfort-icon">
              <Smile size={23} strokeWidth={1.5} />
            </span>
            <span>
              <strong>Room Vibe &amp; Comfort</strong>
              <small>
                Too chilly? Music too loud?
                <br />
                Make yourself heard.
              </small>
            </span>
            <ArrowUpRight size={17} />
          </button>
          <div className="sidebar-note">
            <span className="note-line" />
            <p>
              A good cup is a small thing.
              <br />A good moment is everything.
            </p>
          </div>
        </aside>
      </div>
      <button
        className="mobile-cart-button"
        onClick={() => setMobileCart(true)}
      >
        <span>
          <ShoppingBag size={18} /> Your order{count > 0 && ` (${count})`}
        </span>
        <span>
          {money(total)}
          <ChevronRight size={17} />
        </span>
      </button>
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <Check size={17} />
            <span>{toast}</span>
          </>
        )}
      </div>
      {customItem && (
        <CustomizeItem
          item={customItem}
          onAdd={addToCart}
          onClose={() => setCustomItem(null)}
        />
      )}
      {mobileCart && (
        <Modal title="Your café moment" onClose={() => setMobileCart(false)}>
          <div className="mobile-cart-content">{cartContent}</div>
        </Modal>
      )}
      {feedback && (
        <Modal title="Room Vibe & Comfort" onClose={() => setFeedback(false)}>
          <RoomFeedback table={tableNumber} />
        </Modal>
      )}
      {checkout && (
        <Modal
          title="A final little check."
          onClose={() => {
            if (!placingOrder) setCheckout(false);
          }}
        >
          <p className="muted checkout-intro">
            Everything look good? We’ll send it straight to the baristas.
          </p>
          <div className="checkout-items">
            {cart.map((item, index) => (
              <div key={index}>
                <span>
                  <strong>
                    {item.quantity} × {item.item_name}
                  </strong>
                  <small>
                    {item.milk_choice !== "None"
                      ? `${item.milk_choice} milk · `
                      : ""}
                    {item.sweetness}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </small>
                </span>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              void placeOrder();
            }}
          >
            <div className="checkout-table">
              <span>Your Table</span>
              <TableSelect value={tableNumber} onChange={setTableNumber} />
            </div>
            <label className="field-label">
              Allergies &amp; dietary restrictions <span>Optional</span>
              <input
                value={allergies}
                maxLength={500}
                onChange={(event) => setAllergies(event.target.value)}
                placeholder="For example, a nut allergy"
                disabled={placingOrder}
              />
            </label>
            <div className="checkout-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            {orderError && (
              <p className="notice error" role="alert">
                {orderError}
              </p>
            )}
            <button
              disabled={placingOrder || cart.length === 0}
              className="primary-button full-width"
            >
              {placingOrder ? (
                <>
                  <LoaderCircle size={17} className="spin" /> Sending to your
                  barista…
                </>
              ) : (
                <>
                  Place Order · {money(total)}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            <p className="helper-text center">
              <Clock3 size={13} /> Your wait estimate appears after ordering.
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}

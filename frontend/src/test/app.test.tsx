import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import App from "../App";
import { api } from "../api";
import { CustomerView } from "../components/CustomerView/CustomerView";
import { formatPrice } from "../format";
import type { MenuItem, Order, OrderItem } from "../types";

vi.mock("../api", () => ({
  api: {
    getMenu: vi.fn(),
    getLoungeMembers: vi.fn(),
    getOrders: vi.fn(),
    getPulseSummary: vi.fn(),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    sendChat: vi.fn(),
    sendPhotoOrder: vi.fn(),
    submitFeedback: vi.fn(),
    joinLounge: vi.fn(),
  },
}));
// Test business interactions without an animation clock or a live browser.
vi.mock("../components/Motion", () => ({
  Reveal: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

const coffee: MenuItem = {
  id: 1,
  name: "Iced Oat Flat White",
  category: "Coffee",
  price: 250,
  description: "Double ristretto with silky oat milk.",
  dietary_tags: "vegan,dairy-free",
  caffeine_level: "High",
  vibe_tags: "Focus",
  is_available: true,
};
const tea: MenuItem = {
  ...coffee,
  id: 2,
  name: "Ceremonial Matcha Latte",
  category: "Tea",
  price: 295,
  dietary_tags: "vegetarian",
};
const item: OrderItem = {
  item_name: coffee.name,
  price: 250,
  quantity: 1,
  milk_choice: "Oat",
  sweetness: "Normal",
};
const order: Order = {
  id: 10,
  order_number: "#110",
  customer_name: "Patron (Table 4)",
  table_number: "Table 4",
  vibe_mode: "Deep Work",
  status: "pending",
  estimated_wait_minutes: 6,
  created_at: new Date().toISOString(),
  items: [item],
};
const summary = {
  total_feedback_count: 0,
  average_vibe_score: 0,
  room_mood: "",
  temperature_status: "",
  noise_status: "",
  ai_barista_tips: [],
  recent_comments: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getMenu).mockResolvedValue([coffee, tea]);
  vi.mocked(api.getLoungeMembers).mockResolvedValue([]);
  vi.mocked(api.getOrders).mockResolvedValue([order]);
  vi.mocked(api.getPulseSummary).mockResolvedValue(summary);
});

function cart() {
  return within(
    screen.getByRole("complementary", { name: "Your order summary" }),
  );
}
async function start() {
  render(<App />);
  await screen.findByRole("button", { name: coffee.name });
  return userEvent.setup();
}

describe("Guest ordering", () => {
  it("keeps Café Companion as the app, Third Wave as the café, and INR pricing", async () => {
    await start();
    expect(
      screen.getByRole("link", { name: "The Café Companion home" }),
    ).toBeTruthy();
    expect(screen.getByText("Your table at Third Wave Coffee")).toBeTruthy();
    expect(formatPrice(123456)).toBe("₹1,23,456");
    expect(screen.queryByText("$250.00")).toBeNull();
    expect(screen.getByText("₹295")).toBeTruthy();
  });

  it("filters categories and recovers from an empty search", async () => {
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Tea" }));
    expect(screen.queryByRole("button", { name: coffee.name })).toBeNull();
    expect(screen.getByRole("button", { name: tea.name })).toBeTruthy();
    await user.type(
      screen.getByRole("searchbox", { name: "Search menu" }),
      "no-such-drink",
    );
    expect(screen.getByText("No matches this time.")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Show all favorites" }),
    );
    expect(screen.getByRole("button", { name: coffee.name })).toBeTruthy();
  });

  it("increments matching items and removes the final quantity", async () => {
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: `Add ${coffee.name} to order` }),
    );
    await user.click(
      screen.getByRole("button", { name: `Add ${coffee.name} to order` }),
    );
    expect(cart().getAllByRole("article")).toHaveLength(1);
    expect(cart().getByText("2 items")).toBeTruthy();
    expect(cart().getAllByText("₹500")).toHaveLength(2);
    await user.click(
      cart().getByRole("button", { name: `Decrease ${coffee.name} quantity` }),
    );
    await user.click(
      cart().getByRole("button", { name: `Decrease ${coffee.name} quantity` }),
    );
    expect(cart().getByText("Your next favorite awaits.")).toBeTruthy();
  });

  it("keeps distinct customizations separate and closes a native dialog on cancel", async () => {
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: `Add ${coffee.name} to order` }),
    );
    await user.click(
      screen.getByRole("button", { name: `Customize ${coffee.name}` }),
    );
    const modal = within(screen.getByRole("dialog"));
    await user.selectOptions(modal.getByLabelText("Milk choice"), "Almond");
    await user.selectOptions(modal.getByLabelText("Sweetness"), "Less Sweet");
    await user.type(modal.getByLabelText(/^Notes/), "Extra ice");
    await user.click(
      modal.getByRole("button", { name: "Add to Order · ₹250" }),
    );
    expect(cart().getAllByRole("article")).toHaveLength(2);
    expect(cart().getByText("Almond milk · Less Sweet sweetness")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: `Customize ${coffee.name}` }),
    );
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("places a rupee order with table and allergies after explicit review", async () => {
    vi.mocked(api.createOrder).mockResolvedValue({
      ...order,
      table_number: "Table 7",
    });
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: `Add ${coffee.name} to order` }),
    );
    await user.click(cart().getByRole("button", { name: "Review & Order" }));
    expect(api.createOrder).not.toHaveBeenCalled();
    const modal = within(screen.getByRole("dialog"));
    await user.selectOptions(
      modal.getByRole("combobox", { name: "Your Table" }),
      "Table 7",
    );
    await user.type(
      modal.getByLabelText(/Allergies & dietary restrictions/),
      "Peanuts",
    );
    await user.click(modal.getByRole("button", { name: "Place Order · ₹250" }));
    await waitFor(() =>
      expect(api.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          table_number: "Table 7",
          allergies: "Peanuts",
          items: [item],
        }),
      ),
    );
    await screen.findByText("Something good is on its way.");
    expect(cart().getByText("0 items")).toBeTruthy();
  });

  it("preserves the cart when order submission fails", async () => {
    vi.mocked(api.createOrder).mockRejectedValue(new Error("Offline"));
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: `Add ${coffee.name} to order` }),
    );
    await user.click(cart().getByRole("button", { name: "Review & Order" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Place Order · ₹250",
      }),
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Your order was not placed. Please try again. Your items are still here.",
    );
    expect(cart().getByText("1 item")).toBeTruthy();
  });

  it("adds concierge suggestions only after explicit selection and shares dietary context", async () => {
    vi.mocked(api.sendChat).mockResolvedValue({
      reply: "Try the oat flat white.",
      suggested_items: [item],
    });
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Concierge" }));
    await user.click(screen.getByText("Dietary preferences"));
    await user.type(
      screen.getByLabelText("Allergies & dietary restrictions"),
      "Dairy-free",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Message the concierge" }),
      "A coffee, please",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByText("Try the oat flat white.");
    expect(cart().getByText("0 items")).toBeTruthy();
    expect(api.sendChat).toHaveBeenCalledWith(
      "A coffee, please",
      expect.any(Array),
      "Deep Work",
      "Dairy-free",
    );
    await user.click(
      screen.getByRole("button", { name: `${coffee.name}Add · ₹250` }),
    );
    expect(cart().getByText("1 item")).toBeTruthy();
  });

  it("sends room feedback and confirms successful delivery", async () => {
    vi.mocked(api.submitFeedback).mockResolvedValue({
      table_number: "Table 4",
      vibe_rating: 5,
      temperature: "Too Cold",
      ambient_noise: "Just Right",
    });
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: /Room Vibe & Comfort/ }),
    );
    const modal = within(screen.getByRole("dialog"));
    await user.click(modal.getByRole("button", { name: "Too Cold" }));
    await user.click(modal.getByRole("button", { name: "Send Live Feedback" }));
    await screen.findByText("A better room, together.");
    expect(api.submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: "Too Cold",
        table_number: "Table 4",
      }),
    );
  });

  it("polls the active order for live status changes", async () => {
    vi.useFakeTimers();
    vi.mocked(api.getOrders).mockResolvedValue([{ ...order, status: "ready" }]);
    const setActiveOrder = vi.fn();
    render(
      <CustomerView
        cart={[]}
        setCart={vi.fn()}
        activeOrder={order}
        setActiveOrder={setActiveOrder}
        tableNumber="Table 4"
        setTableNumber={vi.fn()}
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });
    expect(setActiveOrder).toHaveBeenCalledWith(
      expect.objectContaining({ id: order.id, status: "ready" }),
    );
  });
});

describe("Barista workspace", () => {
  it("keeps tickets available when room intelligence fails, then advances an order", async () => {
    vi.mocked(api.getPulseSummary).mockRejectedValue(new Error("Room offline"));
    vi.mocked(api.updateOrderStatus).mockResolvedValue({
      ...order,
      status: "preparing",
    });
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Barista & Pulse" }));
    await screen.findByText(order.order_number);
    expect(
      screen.getByText("Room updates unavailable. Try refreshing."),
    ).toBeTruthy();
    expect(screen.getByText("₹250")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start Brewing" }));
    expect(api.updateOrderStatus).toHaveBeenCalledWith(order.id, "preparing");
    expect(
      await screen.findByRole("button", { name: "Mark as Ready for Pickup" }),
    ).toBeTruthy();
  });
});

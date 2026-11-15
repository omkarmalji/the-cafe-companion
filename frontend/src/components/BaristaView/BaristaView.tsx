import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  Flame,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Volume2,
} from "lucide-react";
import { api } from "../../api";
import { formatPrice } from "../../format";
import type { Order, PulseSummary } from "../../types";
import { Reveal } from "../Motion";

type Filter = "all" | "pending" | "preparing" | "ready";
const statusLabels = {
  pending: "Received",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
};
const nextStatus: Record<string, Order["status"]> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};
const actionLabels: Record<string, string> = {
  pending: "Start Brewing",
  preparing: "Mark as Ready for Pickup",
  ready: "Completed & Picked Up",
};
function elapsed(createdAt: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
  );
  return Number.isFinite(minutes) ? `${minutes} min ago` : "Just received";
}

export function BaristaView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [pulseError, setPulseError] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [statusBusy, setStatusBusy] = useState<Set<number>>(new Set());
  const [hasLoaded, setHasLoaded] = useState(false);
  const mounted = useRef(false);
  const fetching = useRef(false);
  const fetchData = useCallback(() => {
    if (fetching.current) return;
    fetching.current = true;
    return Promise.allSettled([api.getOrders(), api.getPulseSummary()]).then(
      ([orderResult, pulseResult]) => {
        if (mounted.current) {
          if (orderResult.status === "fulfilled") {
            setOrders(orderResult.value);
            setOrderError("");
            setHasLoaded(true);
          } else
            setOrderError(
              "Order updates are unavailable. Showing the last received tickets.",
            );
          if (pulseResult.status === "fulfilled") {
            setPulse(pulseResult.value);
            setPulseError(false);
          } else setPulseError(true);
          setLoading(false);
          setRefreshing(false);
        }
        fetching.current = false;
      },
    );
  }, []);
  useEffect(() => {
    mounted.current = true;
    void fetchData();
    const interval = setInterval(() => void fetchData(), 8000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  async function advance(order: Order) {
    if (statusBusy.has(order.id) || !nextStatus[order.status]) return;
    setStatusBusy((previous) => new Set(previous).add(order.id));
    setUpdateError("");
    try {
      const updated = await api.updateOrderStatus(
        order.id,
        nextStatus[order.status],
      );
      if (mounted.current)
        setOrders((previous) =>
          previous.map((item) => (item.id === order.id ? updated : item)),
        );
    } catch {
      if (mounted.current)
        setUpdateError(
          `Could not update ${order.order_number}. Its status has not changed. Please try again.`,
        );
    } finally {
      if (mounted.current)
        setStatusBusy((previous) => {
          const next = new Set(previous);
          next.delete(order.id);
          return next;
        });
    }
  }
  const active = orders.filter((order) => order.status !== "completed");
  const filtered =
    filter === "all"
      ? active
      : active.filter((order) => order.status === filter);
  const pendingCount = active.filter(
    (order) => order.status === "pending",
  ).length;
  const preparingCount = active.filter(
    (order) => order.status === "preparing",
  ).length;
  const readyCount = active.filter((order) => order.status === "ready").length;
  const averageWait = active.length
    ? Math.round(
        active.reduce((sum, order) => sum + order.estimated_wait_minutes, 0) /
          active.length,
      )
    : null;
  const feedbackCount = pulse?.total_feedback_count ?? 0;

  return (
    <div className="page-width barista-page">
      <Reveal>
        <div className="workspace-heading" data-enter>
          <div>
            <h1>
              A good shift starts here<span className="brand-period">.</span>
            </h1>
            <p>Your tickets, your team, and a feel for the room.</p>
          </div>
          <div className="refresh-control">
            <span className="live-label">
              <span
                className="live-dot"
                style={orderError ? { background: "#a96d44" } : undefined}
              />
              {orderError
                ? "Updates interrupted"
                : loading
                  ? "Connecting…"
                  : "Refreshes every 8 seconds"}
            </span>
            <button
              className="secondary-button"
              onClick={() => {
                setRefreshing(true);
                void fetchData();
              }}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        <section className="metrics-row" aria-label="Café overview" data-enter>
          <div className="metric">
            <span>
              <Coffee size={15} /> Active tickets
            </span>
            <strong>
              {loading
                ? "…"
                : hasLoaded
                  ? active.length.toString().padStart(2, "0")
                  : "N/A"}
            </strong>
            <p>
              {hasLoaded
                ? `${pendingCount} received · ${preparingCount} in progress`
                : "Waiting for the queue"}
            </p>
          </div>
          <div className="metric">
            <span>
              <Clock3 size={15} /> Estimated wait
            </span>
            <strong>
              {averageWait ?? "N/A"}{" "}
              <small>{averageWait !== null ? "min" : ""}</small>
            </strong>
            <p>
              {averageWait === null
                ? "No active wait estimates"
                : "Average across active tickets"}
            </p>
          </div>
          <div className="metric">
            <span>
              <Activity size={15} /> Room vibe
            </span>
            <strong>
              {feedbackCount ? pulse?.average_vibe_score.toFixed(1) : "N/A"}{" "}
              <small>{feedbackCount ? "/ 5" : ""}</small>
            </strong>
            <p>
              {feedbackCount
                ? `From ${feedbackCount} guest check-ins`
                : "Awaiting guest check-ins"}
            </p>
          </div>
          <div className="metric">
            <span>
              <CheckCircle2 size={15} /> Ready for pickup
            </span>
            <strong>
              {loading
                ? "…"
                : hasLoaded
                  ? readyCount.toString().padStart(2, "0")
                  : "N/A"}
            </strong>
            <p>
              {readyCount
                ? "A good moment, ready to go"
                : "You’re all caught up"}
            </p>
          </div>
        </section>
      </Reveal>
      {orderError && (
        <div className="notice error barista-error" role="alert">
          <span>{orderError}</span>
          <button
            className="text-button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              void fetchData();
            }}
          >
            Try again
            <RefreshCw size={13} />
          </button>
        </div>
      )}
      {updateError && (
        <p className="notice error" role="alert" style={{ marginBottom: 20 }}>
          {updateError}
        </p>
      )}
      <div className="staff-layout">
        <section aria-labelledby="queue-heading">
          <div className="queue-heading">
            <div>
              <h2 id="queue-heading">Live Order Queue</h2>
              <p>A little care in every ticket. Oldest orders come first.</p>
            </div>
            <Coffee size={22} strokeWidth={1.4} />
          </div>
          <div className="queue-filters" aria-label="Filter order status">
            {(
              [
                { key: "all", label: "All active", count: active.length },
                { key: "pending", label: "Received", count: pendingCount },
                { key: "preparing", label: "Preparing", count: preparingCount },
                { key: "ready", label: "Ready", count: readyCount },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                className={filter === item.key ? "active" : ""}
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                <span>{item.count}</span>
              </button>
            ))}
          </div>
          {loading ? (
            <div className="empty-state panel" aria-busy="true">
              <LoaderCircle className="spin" size={27} />
              <p>Getting the latest tickets…</p>
            </div>
          ) : !hasLoaded ? (
            <div className="empty-state panel">
              <Coffee size={36} strokeWidth={1.3} />
              <h3>Waiting for a connection.</h3>
              <p>The order queue will appear when the café reconnects.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setRefreshing(true);
                  void fetchData();
                }}
                disabled={refreshing}
              >
                Retry connection
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state panel">
              <CheckCircle2 size={38} strokeWidth={1.2} />
              <h3>
                {filter === "all"
                  ? "A moment to catch your breath."
                  : "Nothing here right now."}
              </h3>
              <p>
                {filter === "all"
                  ? "No active tickets. New orders will appear here automatically."
                  : `No ${statusLabels[filter].toLowerCase()} tickets. Check another stage or enjoy the pause.`}
              </p>
              {filter !== "all" && (
                <button
                  className="secondary-button"
                  onClick={() => setFilter("all")}
                >
                  Show all active tickets
                </button>
              )}
            </div>
          ) : (
            <Reveal
              className="ticket-grid"
              motionKey={`${filter}-${filtered.map((order) => order.id).join(",")}`}
            >
              {[...filtered]
                .sort(
                  (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
                )
                .map((order) => (
                  <article
                    key={order.id}
                    className={`ticket ${order.status} ${order.allergies ? "has-allergy" : ""}`}
                    data-reveal
                  >
                    <div className="ticket-header">
                      <div>
                        <h3>{order.order_number}</h3>
                        <p>{elapsed(order.created_at)}</p>
                      </div>
                      <span className="ticket-status">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="ticket-table">
                      <strong>{order.table_number}</strong>
                      <span>{order.vibe_mode}</span>
                    </div>
                    {order.batch_tag && (
                      <div className="batch-note">
                        <Flame size={14} />
                        <span>{order.batch_tag}</span>
                      </div>
                    )}
                    {order.allergies && (
                      <div className="allergy-alert" role="note">
                        <ShieldAlert size={19} />
                        <div>
                          <strong>ALLERGY SHIELD ACTIVE</strong>
                          {order.allergies}
                        </div>
                      </div>
                    )}
                    {order.special_instructions && (
                      <p className="notice">{order.special_instructions}</p>
                    )}
                    <ul className="ticket-items">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          <div>
                            <span className="ticket-quantity">
                              {item.quantity}×
                            </span>
                            <div>
                              <h4>{item.item_name}</h4>
                              <p>
                                Milk: <strong>{item.milk_choice}</strong> ·
                                Sweetness: <strong>{item.sweetness}</strong>
                              </p>
                              {item.notes && <p>Note: {item.notes}</p>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="ticket-total">
                      <span>Ticket total</span>
                      <strong>
                        {formatPrice(
                          order.items.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0,
                          ),
                        )}
                      </strong>
                    </div>
                    <button
                      className={`${order.status === "ready" ? "secondary-button" : "primary-button"} full-width`}
                      disabled={statusBusy.has(order.id)}
                      onClick={() => void advance(order)}
                    >
                      {statusBusy.has(order.id) ? (
                        <>
                          <LoaderCircle size={15} className="spin" /> Updating…
                        </>
                      ) : (
                        <>
                          {actionLabels[order.status]}
                          {order.status === "ready" ? (
                            <Check size={16} />
                          ) : (
                            <ArrowRight size={16} />
                          )}
                        </>
                      )}
                    </button>
                  </article>
                ))}
            </Reveal>
          )}
        </section>
        <aside className="pulse-sidebar panel">
          <div className="pulse-title">
            <Activity size={19} strokeWidth={1.7} />
            <h2>Understand the Room</h2>
          </div>
          {pulseError && (
            <p className="notice error" style={{ marginTop: 15 }}>
              Room updates unavailable.{" "}
              {pulse ? "Showing the last check-in." : "Try refreshing."}
            </p>
          )}
          <div className="pulse-mood">
            <span>THE ROOM RIGHT NOW</span>
            <h3>{feedbackCount ? pulse?.room_mood : "A fresh start."}</h3>
          </div>
          <div className="pulse-environment">
            <div>
              <Thermometer size={16} />
              <span>
                {feedbackCount
                  ? pulse?.temperature_status
                  : "No temperature feedback yet"}
              </span>
            </div>
            <div>
              <Volume2 size={16} />
              <span>
                {feedbackCount ? pulse?.noise_status : "No sound feedback yet"}
              </span>
            </div>
          </div>
          <section className="pulse-notes">
            <h3>Barista Co-Pilot</h3>
            {pulse?.ai_barista_tips.length ? (
              pulse.ai_barista_tips.map((tip, index) => (
                <div className="pulse-tip" key={index}>
                  <ArrowRight size={13} />
                  <span>{tip}</span>
                </div>
              ))
            ) : (
              <p>
                Guest check-ins turn into useful suggestions here. Keep doing
                what you do best.
              </p>
            )}
          </section>
          <section className="pulse-notes">
            <h3>Recent Patron Notes</h3>
            {pulse?.recent_comments.length ? (
              pulse.recent_comments.map((comment, index) => (
                <blockquote key={index}>“{comment}”</blockquote>
              ))
            ) : (
              <p>No notes yet. A good time to check in with your tables.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

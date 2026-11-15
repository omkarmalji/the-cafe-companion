import React, { useState, useEffect } from 'react';
import { 
  Coffee, Clock, CheckCircle, RefreshCw, Sparkles, 
  Thermometer, Volume2, Flame, Activity, ShieldAlert
} from 'lucide-react';
import { api } from '../../api';
import type { Order, PulseSummary } from '../../types';

export const BaristaView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pulse, setPulse] = useState<PulseSummary | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // auto-refresh every 8s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [orderList, pulseData] = await Promise.all([
        api.getOrders(),
        api.getPulseSummary(),
      ]);
      setOrders(orderList);
      setPulse(pulseData);
    } catch (err) {
      console.error('Error fetching barista data:', err);
    }
  };

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'completed');
  const filteredOrders =
    filterStatus === 'all'
      ? activeOrders
      : activeOrders.filter((o) => o.status === filterStatus);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Barista Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{activeOrders.length}</div>
            <div className="text-xs text-slate-500 font-medium">Active Tickets</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">~4 min</div>
            <div className="text-xs text-slate-500 font-medium">Avg Prep Speed</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{pulse?.average_vibe_score || 4.9} / 5</div>
            <div className="text-xs text-slate-500 font-medium">Room Vibe Score</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Room Mood</div>
            <div className="text-sm font-bold text-slate-800 mt-1">{pulse?.room_mood || 'Cozy & Focused'}</div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. "Understand the Room" Live Sentiment Radar (Gemini-Powered) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">"Understand the Room" Live Pulse Radar</h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30 uppercase">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400">Continuous AI sentiment telemetry from café patrons</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <span>{pulse?.temperature_status || 'Comfortable (72°F)'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{pulse?.noise_status || 'Optimal Hum'}</span>
            </div>
          </div>
        </div>

        {/* AI Actionable Tips for Baristas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Actionable Barista Co-Pilot Recommendations
            </h4>
            <div className="space-y-2">
              {pulse?.ai_barista_tips.map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs flex items-center gap-2.5 text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Comments Feed */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Recent Patron Notes</h4>
            <div className="space-y-1.5 text-xs text-slate-300 max-h-28 overflow-y-auto pr-1">
              {pulse?.recent_comments.length ? (
                pulse.recent_comments.map((comm, idx) => (
                  <div key={idx} className="bg-black/20 p-2 rounded-lg border border-white/5 italic">
                    "{comm}"
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No notes in the last 15 minutes.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Order Queue with AI Prep-Grouping & Allergy Shields */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Live Order Queue</h3>
            <p className="text-xs text-slate-500">Grouped by prep-efficiency with automated allergy warnings</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600'
              }`}
            >
              All ({activeOrders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('preparing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterStatus === 'preparing' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'
              }`}
            >
              Brewing ({preparingCount})
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterStatus === 'ready' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
              }`}
            >
              Ready ({readyCount})
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 stroke-[1.5]" />
            <h4 className="font-bold text-slate-800">Queue is Clear!</h4>
            <p className="text-xs text-slate-500">All drinks and bakery items have been fulfilled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
                  order.allergies
                    ? 'border-rose-400 ring-2 ring-rose-100'
                    : order.status === 'preparing'
                    ? 'border-blue-400'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-slate-900">{order.order_number}</span>
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-md">
                          {order.table_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{order.customer_name} • {order.vibe_mode}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* AI Prep-Grouping Badge */}
                  {order.batch_tag && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      <span>{order.batch_tag}</span>
                    </div>
                  )}

                  {/* Allergy Alert Shield */}
                  {order.allergies && (
                    <div className="bg-rose-50 border border-rose-300 rounded-xl p-2.5 text-xs text-rose-900 font-bold flex items-start gap-2 animate-bounce">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div>ALLERGY SHIELD ACTIVE:</div>
                        <div className="font-normal text-rose-800">{order.allergies}</div>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{item.quantity}x {item.item_name}</span>
                          <span className="text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Milk: <strong className="text-slate-700">{item.milk_choice}</strong> • Sweetness: <strong className="text-slate-700">{item.sweetness}</strong>
                        </div>
                        {item.notes && <div className="text-[11px] text-amber-700 italic mt-0.5">Note: {item.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Coffee className="w-4 h-4" /> Start Brewing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark as Ready for Pickup
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                    >
                      ✓ Completed & Picked Up
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

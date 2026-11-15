import { useState } from 'react';
import { Coffee, Sparkles, User, Cloud } from 'lucide-react';
import { CustomerView } from './components/CustomerView/CustomerView';
import { BaristaView } from './components/BaristaView/BaristaView';
import type { Order, OrderItem } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'barista'>('customer');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [tableNumber, setTableNumber] = useState<string>('Table 4');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-slate-900 tracking-tight text-lg">The Café Companion</h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                  <Cloud className="w-3 h-3 text-blue-600" /> Google Cloud Pop-Up
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Dual-Pulse AI Experience • Gemini 2.5 & Cloud Run</p>
            </div>
          </div>

          {/* Persona Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Customer</span>
              {cart.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('barista')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'barista'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Barista & Pulse</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'customer' ? (
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

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        The Café Companion • Built for Google Cloud Builder Pop-Up • Powered by Gemini APIs, Cloud Run & Cloud SQL
      </footer>
    </div>
  );
}

export default App;

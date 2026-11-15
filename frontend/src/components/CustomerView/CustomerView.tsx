import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Camera, Send, ShoppingBag, Plus, Minus, Clock, 
  Users, Thermometer, Coffee, HeartHandshake, X, ChevronRight
} from 'lucide-react';
import { api } from '../../api';
import type { MenuItem, Order, OrderItem, ChatMessage, SerendipityProfile } from '../../types';

interface CustomerViewProps {
  cart: OrderItem[];
  setCart: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  cart,
  setCart,
  activeOrder,
  setActiveOrder,
  tableNumber,
  setTableNumber,
}) => {
  const [vibeMode, setVibeMode] = useState<string>('Deep Work 💻');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Welcome to The Café Companion! I can recommend pairings based on your vibe, adjust drinks for allergies, or order directly from a photo. What are you in the mood for today?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [photoResult, setPhotoResult] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [allergiesInput, setAllergiesInput] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackVibe, setFeedbackVibe] = useState<number>(5);
  const [feedbackTemp, setFeedbackTemp] = useState<string>('Comfortable');
  const [feedbackNoise, setFeedbackNoise] = useState<string>('Just Right');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [loungeProfiles, setLoungeProfiles] = useState<SerendipityProfile[]>([]);
  const [showLoungeJoin, setShowLoungeJoin] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [lookingFor] = useState<string>('Co-working buddy');
  const [joinedLounge, setJoinedLounge] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMenu();
    loadLounge();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const loadMenu = async () => {
    try {
      const items = await api.getMenu();
      setMenu(items);
    } catch (err) {
      console.error('Error loading menu:', err);
    }
  };

  const loadLounge = async () => {
    try {
      const members = await api.getLoungeMembers();
      setLoungeProfiles(members);
    } catch (err) {
      console.error('Error loading lounge:', err);
    }
  };

  const vibes = [
    { label: 'Deep Work 💻', desc: 'High caffeine, clean energy' },
    { label: 'Quick Catch-up ☕', desc: 'Balanced crowd favorites' },
    { label: 'Unwind & Read 📖', desc: 'Herbal, low caffeine, comforting' },
    { label: 'Post-Workout ⚡', desc: 'Hydration & protein pairings' },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsAiTyping(true);

    try {
      const response = await api.sendChat(textToSend, newHistory, vibeMode, allergiesInput);
      setChatMessages((prev) => [...prev, { role: 'model', content: response.reply }]);

      // If AI recommended items, auto-offer to add to cart
      if (response.suggested_items && response.suggested_items.length > 0) {
        response.suggested_items.forEach((item: any) => {
          addToCart({
            item_name: item.item_name,
            price: item.price,
            quantity: item.quantity || 1,
            milk_choice: item.milk_choice || 'Whole',
            sweetness: item.sweetness || 'Normal',
            notes: item.notes,
          });
        });
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', content: "Sorry, I had trouble connecting to Gemini. I'm still here to help you order manually!" },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setIsAnalyzingPhoto(true);
      setPhotoResult(null);

      try {
        const result = await api.sendPhotoOrder(base64);
        setPhotoResult(result);
        if (result.recommended_cart_item) {
          addToCart(result.recommended_cart_item);
        }
      } catch (err) {
        console.error('Photo analysis error:', err);
      } finally {
        setIsAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addToCart = (item: OrderItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item_name === item.item_name && i.milk_choice === item.milk_choice);
      if (existing) {
        return prev.map((i) =>
          i.item_name === item.item_name && i.milk_choice === item.milk_choice
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, idx) => (idx === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      const newOrder = await api.createOrder({
        customer_name: `Patron (${tableNumber})`,
        table_number: tableNumber,
        vibe_mode: vibeMode,
        allergies: allergiesInput,
        items: cart,
      });
      setActiveOrder(newOrder);
      setCart([]);
      setShowCheckoutModal(false);
    } catch (err) {
      alert('Failed to place order. Please try again.');
    }
  };

  const handleSendFeedback = async () => {
    try {
      await api.submitFeedback({
        table_number: tableNumber,
        vibe_rating: feedbackVibe,
        temperature: feedbackTemp,
        ambient_noise: feedbackNoise,
        comment: feedbackComment,
      });
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 4000);
      setFeedbackComment('');
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleJoinLounge = async () => {
    if (!nickname.trim() || !topic.trim()) return;
    try {
      const newMember = await api.joinLounge({
        nickname,
        table_number: tableNumber,
        topic,
        looking_for: lookingFor,
      });
      setLoungeProfiles((prev) => [newMember, ...prev]);
      setJoinedLounge(true);
      setShowLoungeJoin(false);
    } catch (err) {
      console.error('Lounge join error:', err);
    }
  };

  const categories = ['All', 'Coffee', 'Tea', 'Cold Brew', 'Pastry', 'Food'];
  const filteredMenu =
    selectedCategory === 'All' ? menu : menu.filter((item) => item.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* 1. Vibe Selection Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-200/60 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-600" /> Current Session Vibe
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1">What brings you to the café today?</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Your Table:</span>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={`Table ${num}`}>Table {num}</option>
              ))}
              <option value="Counter">Counter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {vibes.map((v) => (
            <button
              key={v.label}
              onClick={() => setVibeMode(v.label)}
              className={`p-3 rounded-xl text-left border transition-all ${
                vibeMode === v.label
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-white hover:bg-amber-50 text-slate-700 border-amber-100'
              }`}
            >
              <div className="font-semibold text-sm">{v.label}</div>
              <div className={`text-xs mt-1 ${vibeMode === v.label ? 'text-amber-100' : 'text-slate-500'}`}>
                {v.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Live Order Tracker (if active order exists) */}
      {activeOrder && activeOrder.status !== 'completed' && (
        <div className="bg-white border-2 border-amber-500 rounded-2xl p-5 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                {activeOrder.order_number}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Your Order is in Progress!</h3>
                <p className="text-xs text-slate-500">Table: {activeOrder.table_number} • Vibe: {activeOrder.vibe_mode}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5" />
                {activeOrder.status === 'pending' ? 'Queued' : activeOrder.status === 'preparing' ? 'Brewing' : 'Ready for Pickup!'}
              </span>
              <p className="text-xs text-slate-400 mt-1">Est. wait: ~{activeOrder.estimated_wait_minutes} mins</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <span className="text-xs font-medium text-slate-700 mt-1">Order Received</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeOrder.status === 'preparing' || activeOrder.status === 'ready'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="text-xs font-medium text-slate-700 mt-1">Barista Brewing</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeOrder.status === 'ready' ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="text-xs font-medium text-slate-700 mt-1">Ready for Pickup</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Grid: AI Conversational Concierge & Photo Order */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: AI Chat & Multimodal Photo Recognition */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[520px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Gemini AI Concierge</h3>
                  <p className="text-xs text-slate-500">Conversational ordering & dietary customization</p>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors"
              >
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Snap to Order</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-3 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    Gemini is curating your order...
                  </div>
                </div>
              )}

              {/* Multimodal Photo Detection Result Card */}
              {photoPreview && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={photoPreview}
                      alt="Uploaded drink"
                      className="w-16 h-16 rounded-xl object-cover border border-amber-300 shadow-sm"
                    />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-600" /> Multimodal Photo Detection
                      </div>
                      {isAnalyzingPhoto ? (
                        <p className="text-amber-700 animate-pulse mt-1">Analyzing visual layers, microfoam & drink type...</p>
                      ) : photoResult ? (
                        <div className="mt-1 space-y-1">
                          <p className="font-semibold text-slate-800">Identified: {photoResult.identified_item}</p>
                          <p className="text-slate-600">{photoResult.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                              Matched: {photoResult.matched_menu_item}
                            </span>
                            <span className="text-slate-500">Auto-added to cart!</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-400 whitespace-nowrap">Try asking:</span>
              <button
                onClick={() => handleSendMessage('I need something oat-milk based and high caffeine for coding')}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full"
              >
                ⚡ High caffeine + oat milk
              </button>
              <button
                onClick={() => handleSendMessage('Suggest a caffeine-free tea and a sweet pastry')}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full"
              >
                🥐 Herbal tea & pastry pair
              </button>
              <button
                onClick={() => handleSendMessage('What is your most popular iced drink?')}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-full"
              >
                🧊 Top iced specialty
              </button>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Gemini to curate an order or describe what you feel like..."
                className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Smart Cart & Ordering Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800">Your Smart Cart</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <Coffee className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm">Your cart is empty.</p>
                <p className="text-xs">Ask the AI Concierge or tap any item below to add!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-sm">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-800">{item.item_name}</div>
                      <div className="text-xs text-slate-500">
                        {item.milk_choice} Milk • {item.sweetness} Sweet
                      </div>
                      <div className="text-xs font-bold text-amber-700 mt-0.5">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                  <span>Total</span>
                  <span className="text-lg text-amber-700 font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Review & Order for {tableNumber}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* "Understand the Room" Micro-Feedback Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <span>Room Vibe & Comfort</span>
            </div>
            <p className="text-xs text-slate-500">Help the café staff adjust the AC or music in real-time!</p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => setFeedbackTemp(feedbackTemp === 'Too Cold' ? 'Comfortable' : 'Too Cold')}
                className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                  feedbackTemp === 'Too Cold' ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ❄️ Too Cold
              </button>
              <button
                onClick={() => setFeedbackNoise(feedbackNoise === 'Too Loud' ? 'Just Right' : 'Too Loud')}
                className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                  feedbackNoise === 'Too Loud' ? 'bg-orange-50 border-orange-400 text-orange-700 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                🔊 Too Loud
              </button>
              <button
                onClick={() => setFeedbackVibe(5)}
                className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                  feedbackVibe === 5 ? 'bg-amber-50 border-amber-400 text-amber-700 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                ✨ Great Vibe
              </button>
            </div>

            <input
              type="text"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Optional note for the baristas..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />

            <button
              onClick={handleSendFeedback}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {feedbackSent ? '✓ Sent to Baristas!' : 'Send Live Feedback'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Interactive Menu Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Café Menu</h3>
            <p className="text-xs text-slate-500">Artisan single-origin beans, craft beverages, and fresh bakery</p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                    <span className="font-bold text-amber-700">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.dietary_tags &&
                      item.dietary_tags.split(',').map((tag) => (
                        <span key={tag} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                          {tag.trim()}
                        </span>
                      ))}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      ☕ {item.caffeine_level}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-0">
                <button
                  onClick={() =>
                    addToCart({
                      item_name: item.name,
                      price: item.price,
                      quantity: 1,
                      milk_choice: 'Oat',
                      sweetness: 'Normal',
                    })
                  }
                  className="w-full py-2 bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Serendipity Lounge ("Connect People") */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>The Serendipity Lounge</span>
                <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30 uppercase tracking-wider font-semibold">
                  Connect People
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80">Co-working, shared interests, and Gemini-generated icebreakers</p>
            </div>
          </div>
          {!joinedLounge ? (
            <button
              onClick={() => setShowLoungeJoin(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <HeartHandshake className="w-4 h-4" /> Share What You're Working On
            </button>
          ) : (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-400/30 font-semibold">
              ✓ You are active in the lounge
            </span>
          )}
        </div>

        {/* Join Modal / Form */}
        {showLoungeJoin && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-3 animate-fade-in text-xs">
            <div className="font-bold text-sm text-indigo-200">Join Café Community Today</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Your Name / Handle"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-black/30 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400"
              />
              <input
                type="text"
                placeholder="What are you working on or reading?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-black/30 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400 sm:col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLoungeJoin(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinLounge}
                className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow"
              >
                Join Lounge
              </button>
            </div>
          </div>
        )}

        {/* Members Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {loungeProfiles.map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300">{p.nickname} ({p.table_number})</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-indigo-100">{p.looking_for}</span>
              </div>
              <p className="text-xs text-white font-medium">{p.topic}</p>
              {p.icebreaker && (
                <div className="text-[11px] text-amber-200/90 italic bg-black/20 p-2 rounded-lg border border-amber-300/10">
                  💡 Gemini Icebreaker: "{p.icebreaker}"
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-slate-800">Confirm Café Order</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600">Delivering to:</span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">{tableNumber}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Allergies & Dietary Restrictions</label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g. Peanut allergy, Lactose intolerant, Vegan only"
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400">Our barista team gets an instant safety alert on their screen.</p>
              </div>

              <div className="border-t pt-3 space-y-1.5 text-xs">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{item.quantity}x {item.item_name} ({item.milk_choice})</span>
                    <span className="font-semibold text-slate-800">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-amber-700 text-base">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Place Order Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

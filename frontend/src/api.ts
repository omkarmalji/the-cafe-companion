import type { MenuItem, Order, RoomFeedback, PulseSummary, SerendipityProfile, ChatMessage } from './types';

const API_BASE = '/api';

export const api = {
  // Menu
  getMenu: async (): Promise<MenuItem[]> => {
    const res = await fetch(`${API_BASE}/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return res.json();
  },

  // Orders
  getOrders: async (status?: string): Promise<Order[]> => {
    const url = status ? `${API_BASE}/orders?status=${status}` : `${API_BASE}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<Order> => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update order status');
    return res.json();
  },

  // Room Pulse ("Understand the Room")
  submitFeedback: async (feedback: RoomFeedback): Promise<RoomFeedback> => {
    const res = await fetch(`${API_BASE}/pulse/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  getPulseSummary: async (): Promise<PulseSummary> => {
    const res = await fetch(`${API_BASE}/pulse/summary`);
    if (!res.ok) throw new Error('Failed to fetch pulse summary');
    return res.json();
  },

  // Serendipity Lounge ("Connect People")
  getLoungeMembers: async (): Promise<SerendipityProfile[]> => {
    const res = await fetch(`${API_BASE}/serendipity/members`);
    if (!res.ok) throw new Error('Failed to fetch lounge members');
    return res.json();
  },

  joinLounge: async (profile: { nickname: string; table_number: string; topic: string; looking_for: string }): Promise<SerendipityProfile> => {
    const res = await fetch(`${API_BASE}/serendipity/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to join lounge');
    return res.json();
  },

  // Chat & Photo AI
  sendChat: async (message: string, history: ChatMessage[], vibeMode: string, allergies?: string) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_history: history,
        vibe_mode: vibeMode,
        allergies,
      }),
    });
    if (!res.ok) throw new Error('Failed to process chat');
    return res.json();
  },

  sendPhotoOrder: async (imageBase64: string, userPrompt?: string) => {
    const res = await fetch(`${API_BASE}/chat/photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        user_prompt: userPrompt,
      }),
    });
    if (!res.ok) throw new Error('Failed to process photo order');
    return res.json();
  },
};

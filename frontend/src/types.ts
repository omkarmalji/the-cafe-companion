export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  dietary_tags: string;
  caffeine_level: string;
  vibe_tags: string;
  image_url?: string;
  is_available: boolean;
}

export interface OrderItem {
  id?: number;
  item_name: string;
  price: number;
  quantity: number;
  milk_choice: string;
  sweetness: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  table_number: string;
  vibe_mode: string;
  special_instructions?: string;
  allergies?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  batch_tag?: string;
  estimated_wait_minutes: number;
  created_at: string;
  items: OrderItem[];
}

export interface RoomFeedback {
  id?: number;
  table_number: string;
  vibe_rating: number;
  ambient_noise: string;
  temperature: string;
  comment?: string;
  sentiment_label?: string;
  created_at?: string;
}

export interface PulseSummary {
  total_feedback_count: number;
  average_vibe_score: number;
  room_mood: string;
  temperature_status: string;
  noise_status: string;
  ai_barista_tips: string[];
  recent_comments: string[];
}

export interface SerendipityProfile {
  id: number;
  nickname: string;
  table_number: string;
  topic: string;
  looking_for: string;
  icebreaker?: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

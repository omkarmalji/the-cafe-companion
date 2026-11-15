import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Check,
  Coffee,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  Thermometer,
  Users,
  Volume2,
} from "lucide-react";
import { api } from "../../api";
import { formatPrice } from "../../format";
import type { ChatMessage, OrderItem, SerendipityProfile } from "../../types";

interface PhotoResult {
  identified_item: string;
  description: string;
  recommended_cart_item?: OrderItem;
}
const errorText = "Could not connect. Please try again.";

export function Concierge({
  vibe,
  allergies,
  onAllergiesChange,
  addToCart,
}: {
  vibe: string;
  allergies: string;
  onAllergiesChange: (value: string) => void;
  addToCart: (item: OrderItem) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content:
        "Something strong for a deadline, or something slow for a good book? Tell me what sounds good. I can help with pairings and dietary preferences, too.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<OrderItem[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [messages, busy]);

  async function send(customText?: string) {
    const text = (customText || input).trim();
    if (!text || busy) return;
    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(history);
    setInput("");
    setBusy(true);
    setError("");
    setSuggestions([]);
    try {
      const response = await api.sendChat(text, history, vibe, allergies);
      setMessages((previous) => [
        ...previous,
        { role: "model", content: response.reply },
      ]);
      setSuggestions(response.suggested_items || []);
    } catch {
      setError(
        "Concierge is unavailable. Your message was saved above. You can still order from the menu.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    setPhotoBusy(true);
    setPhotoResult(null);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPhoto(base64);
      setPhotoResult(await api.sendPhotoOrder(base64));
    } catch {
      setError(
        "Could not identify that photo. Try another photo or describe your drink.",
      );
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <section className="concierge-panel panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">A little help choosing</span>
          <h2>Gemini AI Concierge</h2>
          <p>Your taste, your pace. Let’s find your next favorite.</p>
        </div>
        <span className="feature-icon">
          <MessageCircle size={23} strokeWidth={1.5} />
        </span>
      </div>
      <details className="dietary-preferences">
        <summary>
          <ShieldCheck size={15} /> Dietary preferences{" "}
          <span>{allergies ? "Added" : "Optional"}</span>
        </summary>
        <label className="field-label">
          Allergies &amp; dietary restrictions
          <input
            value={allergies}
            maxLength={500}
            onChange={(event) => onAllergiesChange(event.target.value)}
            placeholder="For example, a nut allergy or dairy-free"
          />
        </label>
      </details>
      <div
        className="chat-thread"
        ref={thread}
        role="log"
        aria-label="Concierge conversation"
        aria-live="polite"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role === "user" ? "from-user" : "from-concierge"}`}
          >
            {message.role === "model" && (
              <span className="chat-avatar">
                <Coffee size={16} />
              </span>
            )}
            <div>
              <span className="chat-author">
                {message.role === "user" ? "You" : "Your companion"}
              </span>
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        {busy && (
          <div className="inline-loading">
            <LoaderCircle className="spin" size={16} /> Finding something you’ll
            love…
          </div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="suggestions">
          <p>Suggested for you</p>
          {suggestions.map((item, index) => (
            <button
              key={index}
              className="suggestion-button"
              onClick={() => {
                addToCart({
                  ...item,
                  quantity: item.quantity || 1,
                  milk_choice: item.milk_choice || "Whole",
                  sweetness: item.sweetness || "Normal",
                });
                setSuggestions((previous) =>
                  previous.filter((_, i) => i !== index),
                );
              }}
            >
              <span>{item.item_name}</span>
              <span>Add · {formatPrice(Number(item.price))}</span>
            </button>
          ))}
        </div>
      )}
      {photo && (
        <div className="photo-result">
          <img src={photo} alt="Your uploaded drink" />
          <div>
            {photoBusy ? (
              <p className="inline-loading">
                <LoaderCircle className="spin" size={15} /> Looking at your
                photo…
              </p>
            ) : photoResult ? (
              <>
                <strong>{photoResult.identified_item}</strong>
                <p>{photoResult.description}</p>
                {photoResult.recommended_cart_item && (
                  <button
                    className="text-button"
                    onClick={() => {
                      addToCart(photoResult.recommended_cart_item!);
                      setPhoto(null);
                      setPhotoResult(null);
                    }}
                  >
                    Add suggested drink <ArrowUpRight size={14} />
                  </button>
                )}
              </>
            ) : (
              <p>Try another photo using the camera button.</p>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="prompt-suggestions">
        {[
          "Something to help me focus",
          "A coffee & pastry pairing",
          "Something caffeine-free",
        ].map((prompt) => (
          <button
            disabled={busy}
            key={prompt}
            onClick={() => void send(prompt)}
          >
            {prompt}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <button
          type="button"
          className="icon-button"
          title="Snap to Order"
          aria-label="Snap to Order: upload a drink photo"
          disabled={photoBusy}
          onClick={() => fileInput.current?.click()}
        >
          <Camera size={20} />
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <input
          aria-label="Message the concierge"
          placeholder="What are you in the mood for?"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={4000}
        />
        <button
          className="send-button"
          aria-label="Send message"
          disabled={busy || !input.trim()}
        >
          <Send size={17} />
        </button>
      </form>
      <p className="helper-text">
        Suggestions stay out of your order until you add them. Tell staff about
        severe allergies.
      </p>
    </section>
  );
}

export function RoomFeedback({ table }: { table: string }) {
  const [rating, setRating] = useState(5);
  const [temperature, setTemperature] = useState("Comfortable");
  const [noise, setNoise] = useState("Just Right");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">(
    "idle",
  );
  async function submit() {
    setState("busy");
    try {
      await api.submitFeedback({
        table_number: table,
        vibe_rating: rating,
        temperature,
        ambient_noise: noise,
        comment,
      });
      setState("sent");
    } catch {
      setState("error");
    }
  }
  if (state === "sent")
    return (
      <div className="success-state" role="status">
        <span className="success-icon">
          <Check size={28} />
        </span>
        <h3>A better room, together.</h3>
        <p>Your feedback is with the baristas. Thanks for checking in.</p>
        <button className="secondary-button" onClick={() => setState("idle")}>
          Send another update
        </button>
      </div>
    );
  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="muted">
        A quick check-in helps the team make your stay better.
      </p>
      <label className="field-label" htmlFor="vibe-rating">
        How’s the vibe? <span>{rating} / 5</span>
      </label>
      <input
        id="vibe-rating"
        className="vibe-range"
        type="range"
        min="1"
        max="5"
        value={rating}
        onChange={(event) => setRating(Number(event.target.value))}
      />
      <div className="range-labels">
        <span>Could be better</span>
        <span>Just right</span>
      </div>
      <fieldset>
        <legend>
          <Thermometer size={16} /> Temperature
        </legend>
        <div className="choice-row">
          {["Too Cold", "Comfortable", "Too Hot"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={temperature === value}
              className={`choice-button ${temperature === value ? "selected" : ""}`}
              onClick={() => setTemperature(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>
          <Volume2 size={16} /> Sound level
        </legend>
        <div className="choice-row">
          {["Too Quiet", "Just Right", "Too Loud"].map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={noise === value}
              className={`choice-button ${noise === value ? "selected" : ""}`}
              onClick={() => setNoise(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field-label">
        A note for the baristas <span>Optional</span>
        <textarea
          rows={3}
          value={comment}
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Anything we can make more comfortable?"
        />
      </label>
      {state === "error" && (
        <p className="notice error" role="alert">
          {errorText}
        </p>
      )}
      <button className="primary-button full-width" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Send Live Feedback"}
        <ArrowUpRight size={17} />
      </button>
    </form>
  );
}

export function Lounge({ table }: { table: string }) {
  const [members, setMembers] = useState<SerendipityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joined, setJoined] = useState(false);
  const [nickname, setNickname] = useState("");
  const [topic, setTopic] = useState("");
  const [lookingFor, setLookingFor] = useState("Co-working buddy");
  async function load() {
    try {
      setMembers(await api.getLoungeMembers());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    api
      .getLoungeMembers()
      .then((profiles) => {
        if (!cancelled) setMembers(profiles);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function join() {
    setJoining(true);
    setJoinError("");
    try {
      const member = await api.joinLounge({
        nickname: nickname.trim(),
        table_number: table,
        topic: topic.trim(),
        looking_for: lookingFor,
      });
      setMembers((previous) => [member, ...previous]);
      setJoined(true);
      setShowJoin(false);
    } catch {
      setJoinError(errorText);
    } finally {
      setJoining(false);
    }
  }
  return (
    <section className="lounge-panel panel">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            Good company is closer than you think
          </span>
          <h2>The Serendipity Lounge</h2>
          <p>Find a shared interest. Start a conversation.</p>
        </div>
        <span className="feature-icon">
          <Users size={23} strokeWidth={1.5} />
        </span>
      </div>
      <div className="lounge-intro">
        <div>
          <h3>A table. An idea. A hello.</h3>
          <p>
            Share what you’re working on and meet someone on a similar
            wavelength.
          </p>
        </div>
        {joined ? (
          <span className="joined-status">
            <Check size={16} /> You’re in the lounge
          </span>
        ) : (
          <button
            className="primary-button"
            onClick={() => setShowJoin(!showJoin)}
            aria-expanded={showJoin}
          >
            {showJoin ? "Maybe later" : "Share What You’re Working On"}
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
      {showJoin && (
        <form
          className="join-form form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            void join();
          }}
        >
          <label className="field-label">
            Your Name / Handle
            <input
              required
              value={nickname}
              maxLength={60}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="What should we call you?"
            />
          </label>
          <label className="field-label">
            What are you working on or reading?
            <input
              required
              value={topic}
              maxLength={200}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="A project, a book, a big idea…"
            />
          </label>
          <label className="field-label">
            Looking for
            <select
              value={lookingFor}
              onChange={(event) => setLookingFor(event.target.value)}
            >
              <option>Co-working buddy</option>
              <option>A friendly conversation</option>
              <option>Ideas & feedback</option>
            </select>
          </label>
          <p className="helper-text">
            Your name, topic and table will be visible to other guests.
          </p>
          {joinError && (
            <p role="alert" className="notice error">
              {joinError}
            </p>
          )}
          <button
            disabled={joining || !nickname.trim() || !topic.trim()}
            className="primary-button"
          >
            {joining ? "Joining…" : "Join the lounge"}
            <ArrowUpRight size={16} />
          </button>
        </form>
      )}
      {loading ? (
        <div className="empty-state">
          <LoaderCircle className="spin" size={24} />
          <p>Finding your café community…</p>
        </div>
      ) : loadError ? (
        <div className="empty-state">
          <p>Could not load the lounge.</p>
          <button
            className="secondary-button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Try again
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <Users size={35} strokeWidth={1.25} />
          <h3>Be the first to say hello.</h3>
          <p>No one’s shared a topic yet. Yours could start something good.</p>
        </div>
      ) : (
        <div className="member-list">
          {members.map((member) => (
            <article className="member" key={member.id}>
              <span className="member-avatar">
                {member.nickname.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="member-name">
                  <h3>{member.nickname}</h3>
                  <span>{member.table_number}</span>
                </div>
                <p>{member.topic}</p>
                <span className="helper-text">{member.looking_for}</span>
                {member.icebreaker && (
                  <div className="icebreaker">
                    <MessageCircle size={15} />
                    <span>{member.icebreaker}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

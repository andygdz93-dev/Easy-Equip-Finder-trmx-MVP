import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { env } from "../env";

// ── Types ──────────────────────────────────────────────────────────────────────
type MessageRole = "user" | "assistant";

interface ChatMessage {
  role:      MessageRole;
  content:   string;
  listings?: InlineListing[];
}

interface InlineListing {
  id:         string;
  title:      string;
  price:      number;
  hours:      number;
  state:      string;
  score:      number;
  rationale?: string;
  isBest:     boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt$ = (v: number) => `$${v.toLocaleString()}`;
const fmtHrs = (v: number) => `${v.toLocaleString()} hrs`;

// ── Listing Card ──────────────────────────────────────────────────────────────
const ListingCard = ({ listing }: { listing: InlineListing }) => {
  const scoreColor =
    listing.score >= 80 ? "text-emerald-400" :
    listing.score >= 65 ? "text-amber-400"   :
    listing.score >= 50 ? "text-orange-400"  : "text-rose-400";

  return (
    <div className="relative rounded-xl border border-slate-700 bg-slate-800/70 p-4 hover:border-amber-500/50 transition-colors">
      {listing.isBest && (
        <span className="absolute -top-2 left-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900">
          Best Option
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-slate-100">{listing.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{listing.state}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`text-lg font-bold ${scoreColor}`}>{listing.score}</span>
          <p className="text-[10px] text-slate-500">/ 100</p>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-slate-300">
        <span className="font-medium text-slate-100">{fmt$(listing.price)}</span>
        <span>{fmtHrs(listing.hours)}</span>
      </div>

      {listing.rationale && (
        <p className="mt-2 text-xs text-slate-400 italic leading-relaxed">
          "{listing.rationale}"
        </p>
      )}

      <Link
        to={`/demo/listings/${listing.id}`}
        className="mt-3 inline-block rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
      >
        View full breakdown →
      </Link>
    </div>
  );
};

// ── Typing Indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ── Render bold markdown inline ───────────────────────────────────────────────
const RichText = ({ text }: { text: string }) => (
  <p className="whitespace-pre-wrap">
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    )}
  </p>
);

// ── API call ─────────────────────────────────────────────────────────────────
interface BrokerApiResponse {
  data?: { content: string };
  error?: { code: string; message: string };
}

async function sendToBroker(
  messages: Array<{ role: MessageRole; content: string }>
): Promise<string> {
  const res = await fetch(`${env.apiBaseUrl}/api/broker/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ messages }),
  });

  const json: BrokerApiResponse = await res.json();

  if (!res.ok || json.error) {
    const code = json.error?.code ?? "BROKER_ERROR";
    if (code === "BROKER_DISABLED") {
      return (
        "The AI broker requires an Anthropic API key on the server.\n\n" +
        "Set `ANTHROPIC_API_KEY` in `apps/api/.env` and restart the API — " +
        "the rest of the app works fine without it."
      );
    }
    throw new Error(json.error?.message ?? "Broker request failed.");
  }

  return json.data?.content ?? "Sorry, I couldn't process that.";
}

// ── Parse LISTINGS_JSON out of broker response ────────────────────────────────
function extractListings(
  raw: string,
  inventory: InlineListing[]
): { text: string; listings: InlineListing[] } {
  const match = raw.match(/LISTINGS_JSON:(\[.*?\])/s);
  if (!match) return { text: raw.trim(), listings: [] };

  let listings: InlineListing[] = [];
  try {
    const ids: { id: string }[] = JSON.parse(match[1]);
    listings = ids
      .map((item) => inventory.find((l) => l.id === item.id))
      .filter(Boolean) as InlineListing[];
  } catch {
    // malformed JSON from model — ignore
  }

  return {
    text:     raw.replace(/LISTINGS_JSON:\[.*?\]/s, "").trim(),
    listings,
  };
}

// ── Quick-start prompts ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  "I need an excavator under $180k",
  "What's my 2019 CAT 320 worth?",
  "Best dozer for road construction?",
  "Show me low-hour skid steers",
];

// ── Component ─────────────────────────────────────────────────────────────────
export const BrokerChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role:    "assistant",
      content: "I'm your EasyFinder AI broker — 20+ years of heavy equipment deal-making, no brand loyalty, one goal: the right machine at the right price.\n\nAre you **buying**, **selling**, or trying to **match equipment to a job**?",
    },
  ]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<InlineListing[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load inventory once so we can match listing IDs from the broker response
  useEffect(() => {
    fetch(`${env.apiBaseUrl}/api/listings`)
      .then((r) => r.json())
      .then((json) => {
        const items = json?.data?.listings ?? [];
        setInventory(
          items.map((l: any) => ({
            id:        l.id,
            title:     l.title,
            price:     l.price,
            hours:     l.hours,
            state:     l.state,
            score:     l.score?.total ?? l.totalScore ?? 0,
            rationale: l.score?.rationale?.[0] ?? l.rationale?.[0],
            isBest:    (l.flags ?? []).includes("Best Option"),
          }))
        );
      })
      .catch(() => {/* non-fatal — broker still works, just no card rendering */});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isLoading) return;

    setInput("");

    const userMsg: ChatMessage = { role: "user", content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsLoading(true);

    try {
      const apiMessages = history.map(({ role, content }) => ({ role, content }));
      const raw = await sendToBroker(apiMessages);
      const { text: cleanText, listings } = extractListings(raw, inventory);

      setMessages((prev) => [
        ...prev,
        {
          role:     "assistant",
          content:  cleanText,
          listings: listings.length > 0 ? listings : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error — try again in a moment." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-950">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
            <span className="text-sm">🤝</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">EasyFinder AI Broker</h2>
            <p className="text-xs text-emerald-400">
              {inventory.length > 0
                ? `● Live — ${inventory.length} scored listings`
                : "● Ready"}
            </p>
          </div>
          <Link
            to="/demo"
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Browse all listings →
          </Link>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-500 text-slate-900 font-medium"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              <RichText text={msg.content} />

              {msg.listings && msg.listings.length > 0 && (
                <div className="mt-4 space-y-3">
                  {msg.listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-800 px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick-start prompts (only on first message) ── */}
      {messages.length === 1 && (
        <div className="shrink-0 px-4 pb-2">
          <p className="text-xs text-slate-500 mb-2">Quick start:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-slate-800 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Tell me what you need..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
};

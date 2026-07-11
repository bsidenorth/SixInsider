import React, { useState, useRef, useEffect } from "react";
import {
  Newspaper,
  MessageSquare,
  Users,
  UserRound,
  Send,
  ExternalLink,
  Bell,
  Crown,
  Flame,
  Gamepad2,
  Globe,
  Check,
  Radio,
} from "lucide-react";

// ---------------------------------------------------------------------
// Design tokens (see design plan): deep slate/indigo base, emerald for
// confirmed, amber for rumor, rose for leak. Mono face for the "intel
// terminal" register, Inter for readable body copy.
// ---------------------------------------------------------------------
const T = {
  bg: "#0A0E1A",
  surface: "#12172A",
  surfaceAlt: "#1A2036",
  border: "#242C46",
  borderSoft: "#1D2338",
  indigo: "#6366F1",
  indigoDeep: "#4338CA",
  emerald: "#10B981",
  amber: "#F5A524",
  rose: "#FB4570",
  text: "#E7E9F0",
  textSoft: "#94A0C2",
  textMute: "#5B6483",
};

const COPY = {
  en: {
    tagline: "Intel before the trailer drops.",
    tabs: { feed: "News", chat: "AI Insider", crews: "Crews", profile: "Profile" },
    feedTitle: "Latest Intel",
    feedSub: "Cross-referenced across Twitter, Reddit & official sources.",
    trending: "Trending",
    statuses: { rumor: "Rumor", confirmed: "Confirmed", leak: "Leak" },
    source: "Source",
    chatTitle: "AI Insider",
    chatSub: "Ask anything. Answers are grounded in today's feed.",
    chatPlaceholder: "Ask about mechanics, dates, leaks...",
    suggestions: ["Any release date leaks?", "What's confirmed so far?", "Summarize today's intel"],
    crewsTitle: "Crews",
    crewsSub: "Find your platform's community.",
    all: "All",
    members: "members",
    join: "Join",
    profileTitle: "Profile & Plans",
    free: "Free Plan",
    premium: "Premium",
    premiumDesc: "Real-time push alerts, zero ads, priority AI answers.",
    upgrade: "Upgrade to Premium",
    upgraded: "You're Premium",
    price: "$9.90",
    perMonth: "/ month",
    notifications: "Notifications",
    notifPreorders: "Pre-order alerts",
    notifTrailers: "Trailer drops",
    notifLeaks: "Code leaks",
    live: "LIVE",
  },
  pt: {
    tagline: "Informação antes do trailer sair.",
    tabs: { feed: "Notícias", chat: "IA Insider", crews: "Crews", profile: "Perfil" },
    feedTitle: "Últimas Informações",
    feedSub: "Cruzado entre Twitter, Reddit e fontes oficiais.",
    trending: "Em alta",
    statuses: { rumor: "Rumor", confirmed: "Confirmado", leak: "Vazamento" },
    source: "Fonte",
    chatTitle: "IA Insider",
    chatSub: "Pergunte qualquer coisa. Respostas baseadas no feed de hoje.",
    chatPlaceholder: "Pergunte sobre mecânicas, datas, vazamentos...",
    suggestions: ["Tem vazamento de data?", "O que já foi confirmado?", "Resuma as notícias de hoje"],
    crewsTitle: "Crews",
    crewsSub: "Encontre a comunidade da sua plataforma.",
    all: "Todas",
    members: "membros",
    join: "Entrar",
    profileTitle: "Perfil & Planos",
    free: "Plano Grátis",
    premium: "Premium",
    premiumDesc: "Alertas em tempo real, zero anúncios, IA prioritária.",
    upgrade: "Assinar Premium",
    upgraded: "Você é Premium",
    price: "R$ 9,90",
    perMonth: "/ mês",
    notifications: "Notificações",
    notifPreorders: "Alertas de pré-venda",
    notifTrailers: "Trailers novos",
    notifLeaks: "Vazamentos de código",
    live: "AO VIVO",
  },
};

const NEWS = [
  {
    id: 1,
    status: "confirmed",
    title: "Rockstar confirms new gameplay footage arriving this quarter",
    source: "Rockstar Newswire",
    platform: "official",
    trending: true,
    time: "2h",
  },
  {
    id: 2,
    status: "leak",
    title: "Datamined audio files suggest a third playable city district",
    source: "r/GTA6",
    platform: "reddit",
    trending: true,
    time: "5h",
  },
  {
    id: 3,
    status: "rumor",
    title: "Insider claims pre-order bonuses to be revealed alongside trailer 3",
    source: "@insiderGTA",
    platform: "twitter",
    trending: false,
    time: "9h",
  },
  {
    id: 4,
    status: "confirmed",
    title: "Official soundtrack collaboration teased on Rockstar's socials",
    source: "Rockstar Games",
    platform: "official",
    trending: false,
    time: "1d",
  },
  {
    id: 5,
    status: "rumor",
    title: "Voice actor's since-deleted post hints at expanded map size",
    source: "r/GTA6",
    platform: "reddit",
    trending: false,
    time: "1d",
  },
];

const CREWS = [
  { id: 1, name: "Vice Runners PS5", platform: "ps5", members: 4820, desc: "Daily leak discussion & theorycrafting." },
  { id: 2, name: "Leonida Crew Xbox", platform: "xbox", members: 2310, desc: "Xbox-focused, weekly watch parties." },
  { id: 3, name: "PC Insiders", platform: "pc", members: 6110, desc: "Mod speculation & technical breakdowns." },
  { id: 4, name: "Night City Radio", platform: "ps5", members: 1290, desc: "Podcast crew covering every drop." },
];

const STATUS_COLOR = { rumor: T.amber, confirmed: T.emerald, leak: T.rose };

function statusDot(status) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full mr-1.5"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    />
  );
}

function Badge({ status, label }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
      style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}40`, fontFamily: "'JetBrains Mono', monospace" }}
    >
      {statusDot(status)}
      {label}
    </span>
  );
}

function TickerBar({ t }) {
  const items = NEWS.filter((n) => n.trending).map((n) => n.title);
  const loop = [...items, ...items];
  return (
    <div
      className="w-full overflow-hidden border-b flex items-center"
      style={{ backgroundColor: T.surface, borderColor: T.borderSoft, height: 34 }}
    >
      <div
        className="flex items-center gap-1.5 px-3 shrink-0 z-10"
        style={{ backgroundColor: T.surface, borderRight: `1px solid ${T.borderSoft}`, height: "100%" }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: T.rose }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: T.rose }} />
        </span>
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: T.rose, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {t.live}
        </span>
      </div>
      <div className="ticker-track flex items-center whitespace-nowrap">
        {loop.map((title, i) => (
          <span
            key={i}
            className="mx-6 text-[11px]"
            style={{ color: T.textSoft, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {title}
          </span>
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item, t }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ backgroundColor: T.surface, border: `1px solid ${T.borderSoft}` }}
    >
      <div className="flex items-center justify-between">
        <Badge status={item.status} label={t.statuses[item.status]} />
        {item.trending && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: T.indigo, fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Flame size={11} /> {t.trending}
          </span>
        )}
      </div>
      <p className="text-[15px] leading-snug font-medium" style={{ color: T.text }}>
        {item.title}
      </p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs flex items-center gap-1" style={{ color: T.textMute }}>
          <ExternalLink size={12} /> {item.source}
        </span>
        <span className="text-xs" style={{ color: T.textMute, fontFamily: "'JetBrains Mono', monospace" }}>
          {item.time}
        </span>
      </div>
    </div>
  );
}

function FeedTab({ t }) {
  return (
    <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
      <div className="mb-1">
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {t.feedTitle}
        </h2>
        <p className="text-xs" style={{ color: T.textMute }}>
          {t.feedSub}
        </p>
      </div>
      {NEWS.map((n) => (
        <NewsCard key={n.id} item={n} t={t} />
      ))}
    </div>
  );
}

function ChatTab({ t }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: t.chatSub },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const reply = (q) => {
    const lower = q.toLowerCase();
    if (lower.includes("date") || lower.includes("data")) {
      return "No official release date is confirmed yet. Current chatter points to a Q4 window, flagged as Rumor status.";
    }
    if (lower.includes("confirm")) {
      return "Confirmed so far: new gameplay footage this quarter, and a teased soundtrack collaboration — both from official Rockstar channels.";
    }
    return "Based on today's feed: 2 trending items cross-referenced across Twitter and Reddit, both about map details and audio datamines. Nothing official yet on those.";
  };

  const send = (text) => {
    const q = text ?? input;
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: reply(q) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {t.chatTitle}
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-3 pb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div
                className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold mr-2 shrink-0"
                style={{ backgroundColor: T.indigoDeep, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}
              >
                SI
              </div>
            )}
            <div
              className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={
                m.role === "user"
                  ? { backgroundColor: T.indigo, color: "#fff", borderBottomRightRadius: 4 }
                  : { backgroundColor: T.surface, color: T.text, border: `1px solid ${T.borderSoft}`, borderBottomLeftRadius: 4 }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-1 ml-8">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full animate-bounce"
                style={{ backgroundColor: T.textMute, animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {t.suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: T.surfaceAlt, color: T.textSoft, border: `1px solid ${T.borderSoft}` }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="px-4 pb-24 pt-1 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t.chatPlaceholder}
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
          style={{ backgroundColor: T.surface, color: T.text, border: `1px solid ${T.borderSoft}` }}
        />
        <button
          onClick={() => send()}
          className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: T.indigo }}
        >
          <Send size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function CrewsTab({ t }) {
  const [filter, setFilter] = useState("all");
  const platforms = [
    { id: "all", label: t.all },
    { id: "ps5", label: "PS5" },
    { id: "xbox", label: "Xbox" },
    { id: "pc", label: "PC" },
  ];
  const filtered = filter === "all" ? CREWS : CREWS.filter((c) => c.platform === filter);

  return (
    <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
      <div className="mb-1">
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {t.crewsTitle}
        </h2>
        <p className="text-xs" style={{ color: T.textMute }}>
          {t.crewsSub}
        </p>
      </div>
      <div className="flex gap-2 mb-1">
        {platforms.map((p) => (
          <button
            key={p.id}
            onClick={() => setFilter(p.id)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={
              filter === p.id
                ? { backgroundColor: T.indigo, color: "#fff" }
                : { backgroundColor: T.surface, color: T.textSoft, border: `1px solid ${T.borderSoft}` }
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      {filtered.map((c) => (
        <div
          key={c.id}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: T.surface, border: `1px solid ${T.borderSoft}` }}
        >
          <div
            className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: T.surfaceAlt }}
          >
            <Gamepad2 size={20} color={T.indigo} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: T.text }}>
              {c.name}
            </p>
            <p className="text-xs truncate" style={{ color: T.textMute }}>
              {c.desc}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.textSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              {c.members.toLocaleString()} {t.members}
            </p>
          </div>
          <button
            className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
            style={{ backgroundColor: T.surfaceAlt, color: T.indigo, border: `1px solid ${T.indigo}50` }}
          >
            {t.join}
          </button>
        </div>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className="w-10 h-6 rounded-full relative transition-colors"
      style={{ backgroundColor: checked ? T.indigo : T.surfaceAlt, border: `1px solid ${T.borderSoft}` }}
    >
      <span
        className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all"
        style={{ left: checked ? 20 : 3, height: 18, width: 18 }}
      />
    </button>
  );
}

function ProfileTab({ t, lang, setLang }) {
  const [premium, setPremium] = useState(false);
  const [notifs, setNotifs] = useState({ preorders: true, trailers: true, leaks: true });

  return (
    <div className="px-4 pt-4 pb-24 flex flex-col gap-4">
      <h2 className="text-lg font-bold" style={{ color: T.text }}>
        {t.profileTitle}
      </h2>

      <div className="flex items-center gap-3">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.borderSoft}` }}
        >
          <UserRound size={26} color={T.textSoft} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: T.text }}>
            player_one
          </p>
          <p className="text-xs" style={{ color: T.textMute }}>
            player@sixinsider.gg
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${T.indigoDeep} 0%, ${T.surface} 100%)`,
          border: `1px solid ${T.indigo}50`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown size={16} color={T.amber} />
          <span className="text-sm font-bold" style={{ color: T.text }}>
            {premium ? t.upgraded : t.premium}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: T.textSoft }}>
          {t.premiumDesc}
        </p>
        <div className="flex items-center justify-between">
          <span style={{ color: T.text, fontFamily: "'JetBrains Mono', monospace" }} className="text-lg font-bold">
            {t.price}
            <span className="text-xs font-normal" style={{ color: T.textMute }}>
              {t.perMonth}
            </span>
          </span>
          <button
            onClick={() => setPremium((p) => !p)}
            className="text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5"
            style={{ backgroundColor: premium ? T.emerald : T.indigo, color: "#fff" }}
          >
            {premium && <Check size={13} />}
            {premium ? t.upgraded : t.upgrade}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Bell size={13} color={T.textSoft} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.textSoft }}>
            {t.notifications}
          </span>
        </div>
        <div className="rounded-xl divide-y" style={{ backgroundColor: T.surface, border: `1px solid ${T.borderSoft}`, borderColor: T.borderSoft }}>
          {[
            { key: "preorders", label: t.notifPreorders },
            { key: "trailers", label: t.notifTrailers },
            { key: "leaks", label: t.notifLeaks },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between px-4 py-3" style={{ borderColor: T.borderSoft }}>
              <span className="text-sm" style={{ color: T.text }}>
                {row.label}
              </span>
              <Toggle
                checked={notifs[row.key]}
                onChange={() => setNotifs((n) => ({ ...n, [row.key]: !n[row.key] }))}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setLang(lang === "en" ? "pt" : "en")}
        className="flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-full"
        style={{ backgroundColor: T.surface, color: T.textSoft, border: `1px solid ${T.borderSoft}` }}
      >
        <Globe size={14} />
        {lang === "en" ? "Switch to Português" : "Switch to English"}
      </button>
    </div>
  );
}

export default function SixInsiderApp() {
  const [lang, setLang] = useState("en");
  const [tab, setTab] = useState("feed");
  const t = COPY[lang];

  const NAV = [
    { id: "feed", label: t.tabs.feed, icon: Newspaper },
    { id: "chat", label: t.tabs.chat, icon: MessageSquare },
    { id: "crews", label: t.tabs.crews, icon: Users },
    { id: "profile", label: t.tabs.profile, icon: UserRound },
  ];

  return (
    <div
      className="w-full mx-auto flex flex-col"
      style={{
        maxWidth: 430,
        height: "100vh",
        maxHeight: 850,
        backgroundColor: T.bg,
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700;800&display=swap');
        .ticker-track { animation: ticker-scroll 28s linear infinite; }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track { animation: none; }
        }
        ::-webkit-scrollbar { width: 0px; height: 0px; }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0"
        style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded flex items-center justify-center"
            style={{ backgroundColor: T.indigo }}
          >
            <Radio size={14} color="#fff" />
          </div>
          <div>
            <p
              className="text-sm font-extrabold tracking-tight leading-none"
              style={{ color: T.text, fontFamily: "'JetBrains Mono', monospace" }}
            >
              SIX<span style={{ color: T.indigo }}>//</span>INSIDER
            </p>
            <p className="text-[10px] leading-none mt-1" style={{ color: T.textMute }}>
              {t.tagline}
            </p>
          </div>
        </div>
      </div>

      <TickerBar t={t} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "feed" && <FeedTab t={t} />}
        {tab === "chat" && <ChatTab t={t} />}
        {tab === "crews" && <CrewsTab t={t} />}
        {tab === "profile" && <ProfileTab t={t} lang={lang} setLang={setLang} />}
      </div>

      {/* Bottom nav */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-around py-2 px-2"
        style={{ backgroundColor: T.surface, borderTop: `1px solid ${T.borderSoft}` }}
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg"
            >
              <Icon size={19} color={active ? T.indigo : T.textMute} strokeWidth={active ? 2.4 : 2} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? T.indigo : T.textMute }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

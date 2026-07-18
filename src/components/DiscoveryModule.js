"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Guided Learning Panel ────────────────────────────────────────────────────

const CARD_COLORS = { concept: "#6366f1", list: "#10b981", debate: "#ec4899", question: "#f59e0b", feedback: "#3b82f6" };
const CARD_BG = { concept: "rgba(99,102,241,.10)", list: "rgba(16,185,129,.10)", debate: "rgba(236,72,153,.10)", question: "rgba(245,158,11,.10)", feedback: "rgba(59,130,246,.10)" };
const CARD_LABELS = { concept: "Spark", list: "Pattern", debate: "Tension", question: "Doorway", feedback: "Field Note" };

function formatProblemSpark(problem) {
  if (!problem) return "";
  const lines = [
    problem.title ? `Spark: ${problem.title}` : null,
    problem.whoFeelsIt ? `Who feels it: ${problem.whoFeelsIt}` : null,
    problem.description ? `What hurts: ${problem.description}` : null,
    problem.currentWorkaround ? `Current workaround: ${problem.currentWorkaround}` : null,
    problem.whyNow ? `Why now: ${problem.whyNow}` : null,
    problem.startupAngle ? `Founder angle: ${problem.startupAngle}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function LearningCard({ card }) {
  const accent = CARD_COLORS[card.type] || "#6366f1";
  const bg = CARD_BG[card.type] || "rgba(99,102,241,.10)";

  return (
    <div style={{ background: bg, border: `1.5px solid ${accent}22`, borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: card.title ? 5 : 0 }}>
        <span style={{ fontWeight: 800, fontSize: 10, color: accent, textTransform: "uppercase", letterSpacing: ".08em" }}>{CARD_LABELS[card.type] || "Spark"}</span>
        {card.title && <span style={{ fontWeight: 700, fontSize: 13, color: "var(--edai-text)" }}>{card.title}</span>}
      </div>

      {card.type === "debate" && card.sides ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["a", "b"].map((side) => (
            <div key={side} style={{ background: "var(--edai-surface)", borderRadius: 7, padding: "8px 10px" }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#ec4899", marginBottom: 3, textTransform: "uppercase" }}>{card.sides[side]?.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>{card.sides[side]?.text}</div>
            </div>
          ))}
        </div>
      ) : card.type === "list" && card.items ? (
        <div>
          {card.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, background: accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{item.num || i + 1}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: "var(--edai-text)" }}>{item.title}</div>
                {item.desc && <div style={{ fontSize: 12, color: "var(--edai-muted)", lineHeight: 1.4 }}>{item.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.72)", lineHeight: 1.55, fontStyle: card.type === "question" ? "italic" : "normal" }}>{card.body}</div>
      )}
    </div>
  );
}

function GuidedLearningPanel({ video, onProblemCaptured }) {
  const [sequence, setSequence] = useState(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [phaseBanner, setPhaseBanner] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => { callTutor([], "orientation"); }, [video.youtubeId]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [cards, loading]);

  async function callTutor(msgs, phase) {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/videos/${video.youtubeId}/learn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, phase }),
      });
      const data = await res.json();
      if (data.sequence && !sequence) setSequence(data.sequence);

      const newCards = data.cards || [];
      setCards((prev) => [...prev, ...newCards]);

      const shouldAdvance = newCards.some((c) => c.advance);
      if (shouldAdvance) {
        const seq = data.sequence || sequence;
        if (seq && phaseIdx + 1 < seq.length) {
          const nextPhase = seq[phaseIdx + 1];
          const label = nextPhase === "synthesis" ? "Final Reflection" : `Problem ${phaseIdx + 1}`;
          setPhaseBanner(label);
          setTimeout(() => {
            setPhaseBanner(null);
            setPhaseIdx((i) => i + 1);
            callTutor(msgs, nextPhase);
          }, 1800);
        } else {
          setComplete(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function send(text) {
    const txt = (text || input).trim();
    if (!txt || loading) return;
    setInput("");

    const userMsg = { role: "user", content: txt };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCards((prev) => [...prev, { _user: true, body: txt }]);

    const seq = sequence;
    const phase = seq ? seq[phaseIdx] : "orientation";
    await callTutor(newMessages, phase);
  }

  const lastCards = cards.slice(-1);
  const quickReplies = lastCards[0]?._user ? [] : (lastCards[0]?.replies || []);

  if (complete) {
    return (
      <div style={{ flex: 1, overflow: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--edai-text)", marginBottom: 8 }}>You found a live wire.</div>
        <div style={{ color: "var(--edai-muted)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>Save the spark that made you lean in.</div>
        <button
          onClick={() => onProblemCaptured && onProblemCaptured()}
          style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}
        >
          💡 Save a Spark
        </button>
      </div>
    );
  }

  return (
    <>
      {phaseBanner && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(99,102,241,.9)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 0 }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>→</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{phaseBanner}</div>
          </div>
        </div>
      )}

      {sequence && (
        <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--edai-border)", display: "flex", gap: 4 }}>
          {sequence.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= phaseIdx ? "#6366f1" : "rgba(255,255,255,.1)", transition: "background .3s" }} />
          ))}
        </div>
      )}

      <div ref={feedRef} style={{ flex: 1, overflow: "auto", padding: "14px 18px" }}>
        {cards.map((card, i) =>
          card._user ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <div style={{ background: "#6366f1", color: "#fff", borderRadius: "12px 12px 2px 12px", padding: "8px 12px", fontSize: 13, maxWidth: "80%" }}>{card.body}</div>
            </div>
          ) : (
            <LearningCard key={i} card={card} />
          )
        )}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "10px 0" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: `ffBounce .9s ${i * 0.15}s infinite` }} />)}
          </div>
        )}
      </div>

      {quickReplies.length > 0 && !loading && (
        <div style={{ padding: "0 18px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {quickReplies.map((r, i) => (
            <button key={i} onClick={() => send(r)} style={{ background: "rgba(99,102,241,.12)", color: "#A5B4FC", border: "1px solid rgba(99,102,241,.3)", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ff-body)" }}>{r}</button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 18px", borderTop: "1px solid var(--edai-border)", display: "flex", gap: 8, background: "var(--edai-surface)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="What have you noticed?"
          style={{ flex: 1, border: "1px solid var(--edai-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "var(--ff-body)", outline: "none", background: "var(--edai-surface-2)", color: "var(--edai-text)" }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: (!input.trim() || loading) ? 0.5 : 1 }}
        >→</button>
      </div>
    </>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6"];
  const bg = colors[(name || "?").charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── Domain Browser ───────────────────────────────────────────────────────────

function IdeaEntry({ onHaveIdea, onExploreWorlds, onNoIdeaYet, portfolioCount }) {
  const paths = [
    {
      icon: "⚡",
      title: "I have an idea",
      body: "Turn it into a sharp first bet.",
      action: onHaveIdea,
      cta: "Shape the idea",
    },
    {
      icon: "🌍",
      title: "I have a world",
      body: "Explore videos, signals, and real pain.",
      action: onExploreWorlds,
      cta: "Choose a world",
    },
    {
      icon: "✨",
      title: "No idea yet",
      body: "Start with taste, friction, and a field note.",
      action: onNoIdeaYet,
      cta: "Find a spark",
    },
  ];

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "44px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🔎</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 30, fontWeight: 800, color: "var(--edai-text)", margin: "0 0 10px" }}>
          Start with what you notice.
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.55 }}>
          Great startup ideas often begin as a tiny frustration you can finally see clearly.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
        {paths.map((path) => (
          <button
            key={path.title}
            onClick={path.action}
            style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 16, padding: "22px 20px", textAlign: "left", cursor: "pointer", fontFamily: "var(--ff-body)", minHeight: 190, transition: "all .15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,.14)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--edai-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 18 }}>{path.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--edai-text)", marginBottom: 8 }}>{path.title}</div>
            <div style={{ color: "var(--edai-muted)", fontSize: 13.5, lineHeight: 1.5, marginBottom: 20 }}>{path.body}</div>
            <div style={{ color: "#A5B4FC", fontWeight: 800, fontSize: 13 }}>{path.cta} →</div>
          </button>
        ))}
      </div>

      {portfolioCount > 0 && (
        <div style={{ textAlign: "center", marginTop: 24, color: "var(--edai-muted)", fontSize: 13 }}>
          You already have {portfolioCount} saved spark{portfolioCount === 1 ? "" : "s"} waiting.
        </div>
      )}
    </div>
  );
}

function IdeaFinder({ onSaveSpark, saving, onExploreWorlds }) {
  const [world, setWorld] = useState("");
  const [friction, setFriction] = useState("");
  const [audience, setAudience] = useState("");
  const [workaround, setWorkaround] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const spark = [
    audience ? `Who feels it: ${audience}` : null,
    friction ? `What hurts: ${friction}` : null,
    workaround ? `Current workaround: ${workaround}` : null,
    cost ? `Why it matters: ${cost}` : null,
  ].filter(Boolean).join("\n");
  const canSave = audience.trim() && friction.trim() && workaround.trim() && cost.trim();

  const fields = [
    { label: "World", value: world, setter: setWorld, placeholder: "Where do you have taste? Healthcare, campus life, restaurants…" },
    { label: "Friction", value: friction, setter: setFriction, placeholder: "What feels slow, expensive, confusing, manual, or risky?" },
    { label: "Who", value: audience, setter: setAudience, placeholder: "Who gets visibly frustrated by this?" },
    { label: "Workaround", value: workaround, setter: setWorkaround, placeholder: "What ugly workaround do they use today?" },
    { label: "Cost", value: cost, setter: setCost, placeholder: "What does it cost them in time, money, stress, or missed revenue?" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 26 }}>
        <button onClick={onExploreWorlds} style={{ background: "none", border: "none", cursor: "pointer", color: "#A5B4FC", fontSize: 14, padding: 0, fontFamily: "var(--ff-body)", marginBottom: 18 }}>← Explore worlds instead</button>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 28, fontWeight: 800, color: "var(--edai-text)", margin: "0 0 8px" }}>Find your first spark.</h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, margin: 0, lineHeight: 1.55 }}>No pressure to sound like a founder. Just notice the broken thing and who is already working around it.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(260px, .8fr)", gap: 18 }}>
        <div>
          {fields.map((field) => (
            <label key={field.label} style={{ display: "block", marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,.62)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{field.label}</div>
              <input
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--edai-border)", borderRadius: 10, padding: "11px 12px", fontSize: 14, fontFamily: "var(--ff-body)", outline: "none", background: "var(--edai-surface-2)", color: "var(--edai-text)" }}
              />
            </label>
          ))}
          <label style={{ display: "block", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,.62)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Founder fit</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why might this be yours? You lived it, know the people, can reach buyers, or care deeply."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--edai-border)", borderRadius: 10, padding: "11px 12px", fontSize: 14, fontFamily: "var(--ff-body)", outline: "none", background: "var(--edai-surface-2)", color: "var(--edai-text)", resize: "vertical" }}
            />
          </label>
        </div>

        <div style={{ background: "linear-gradient(180deg, rgba(99,102,241,.16), rgba(16,185,129,.10))", border: "1px solid rgba(165,180,252,.25)", borderRadius: 16, padding: 18, alignSelf: "start" }}>
          <div style={{ color: "#A5B4FC", fontWeight: 900, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>Problem Spark</div>
          <div style={{ whiteSpace: "pre-wrap", color: "var(--edai-text)", fontSize: 14, lineHeight: 1.6, minHeight: 140 }}>
            {spark || "Your spark will appear here as you name the pain."}
          </div>
          {world && <div style={{ marginTop: 14, color: "var(--edai-muted)", fontSize: 12 }}>World: {world}</div>}
          <button
            disabled={!canSave || saving}
            onClick={() => onSaveSpark(spark, notes || (world ? `World: ${world}` : ""))}
            style={{ width: "100%", marginTop: 18, background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: (!canSave || saving) ? .55 : 1 }}
          >
            {saving ? "Saving…" : "Save this Spark"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DomainBrowser({ onSelect }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discovery/domains")
      .then((r) => r.json())
      .then((d) => { setDomains(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,.4)" }}>Loading domains…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 28, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px" }}>
          Choose a world.
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
          We’ll look for the tiny frustrations that become big companies.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            style={{
              background: "var(--edai-surface)",
              border: "1px solid var(--edai-border)",
              borderRadius: 12,
              padding: "20px 18px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all .15s",
              fontFamily: "var(--ff-body)",
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--edai-border)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ fontSize: 30, marginBottom: 10, width: 52, height: 52, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)" }}>{d.icon}</div>
            <div style={{ fontWeight: 700, color: "var(--edai-text)", fontSize: 15, marginBottom: 4 }}>{d.name}</div>
            <div style={{ color: "var(--edai-muted)", fontSize: 13, lineHeight: 1.4 }}>{d.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Video Feed ───────────────────────────────────────────────────────────────

function VideoFeed({ domain, onSelectVideo, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function loadVideos(refresh = false) {
    const url = `/api/discovery/domains/${domain.slug}/videos${refresh ? "?refresh=true" : ""}`;
    if (refresh) setRefreshing(true); else setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { loadVideos(); }, [domain.slug]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 15, padding: 0, fontFamily: "var(--ff-body)" }}>
          ← All worlds
        </button>
        <span style={{ color: "rgba(255,255,255,.2)" }}>|</span>
        <span style={{ fontSize: 22 }}>{domain.icon}</span>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 22, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>{domain.name}</h2>
        <button
          onClick={() => loadVideos(true)}
          disabled={refreshing}
              title="Search YouTube for more field studies"
          style={{ marginLeft: "auto", background: "none", border: "1px solid var(--edai-border)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "var(--edai-muted)", cursor: "pointer", fontFamily: "var(--ff-body)", opacity: refreshing ? 0.5 : 1 }}
        >
          {refreshing ? "Searching…" : "↻ Refresh field studies"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,.4)" }}>Loading field studies…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {(data?.videos || []).map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectVideo(v, domain)}
              style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {v.thumbnailUrl ? (
                <div style={{ position: "relative", paddingTop: "56.25%", background: "var(--edai-surface-2)" }}>
                  <img src={v.thumbnailUrl} alt={v.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 44, height: 44, background: "rgba(0,0,0,.65)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: 140, background: "var(--edai-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>▶</div>
              )}
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontWeight: 600, color: "var(--edai-text)", fontSize: 14, lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12 }}>{v.channelTitle}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ video, domain, onBack, onProblemCaptured }) {
  const [sidebarMode, setSidebarMode] = useState("scout"); // "scout" | "learn"
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(true);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureNotes, setCaptureNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [prefilledProblem, setPrefilledProblem] = useState("");

  useEffect(() => {
    setAnalyzing(true);
    setAnalysis(null);
    fetch(`/api/discovery/videos/${video.youtubeId}/analyze`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setAnalysis(d); setAnalyzing(false); })
      .catch(() => setAnalyzing(false));
  }, [video.youtubeId]);

  function openCapture(prefill = "") {
    setPrefilledProblem(prefill);
    setCaptureText(prefill);
    setCaptureNotes("");
    setCaptureOpen(true);
  }

  async function saveCapture() {
    if (!captureText.trim() || captureText.trim().length < 10) return;
    setSaving(true);
    try {
      const res = await fetch("/api/discovery/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: captureText.trim(),
          notes: captureNotes.trim() || undefined,
          videoId: video.id,
          domainId: domain.id,
        }),
      });
      if (res.ok) {
        const p = await res.json();
        onProblemCaptured(p);
        setCaptureOpen(false);
        setCaptureText("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", overflow: "hidden" }}>
      {/* Left: player */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--edai-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, padding: 0, fontFamily: "var(--ff-body)" }}>
            ← {domain.name}
          </button>
        </div>
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ position: "relative", paddingTop: "56.25%", background: "#000", borderRadius: "0 0 8px 8px" }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            />
          </div>
          <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 18, fontWeight: 700, color: "var(--edai-text)", margin: "14px 0 4px" }}>{video.title}</h3>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, margin: 0 }}>{video.channelTitle}</p>
        </div>
      </div>

      {/* Right: AI sidebar */}
      <div style={{ width: 360, borderLeft: "1px solid var(--edai-border)", display: "flex", flexDirection: "column", background: "var(--edai-surface)", flexShrink: 0, position: "relative" }}>
        {/* Mode toggle header */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--edai-border)", background: "var(--edai-surface)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setSidebarMode("scout")}
              style={{ flex: 1, background: sidebarMode === "scout" ? "#6366f1" : "var(--edai-surface-2)", color: sidebarMode === "scout" ? "#fff" : "rgba(255,255,255,.65)", border: "none", borderRadius: 7, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--ff-body)" }}
            >🤖 Signal Scout</button>
            <button
              onClick={() => setSidebarMode("learn")}
              style={{ flex: 1, background: sidebarMode === "learn" ? "#6366f1" : "var(--edai-surface-2)", color: sidebarMode === "learn" ? "#fff" : "rgba(255,255,255,.65)", border: "none", borderRadius: 7, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--ff-body)" }}
            >📚 Field Guide</button>
          </div>
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 6, textAlign: "center" }}>
            {sidebarMode === "scout" ? "Spot human pain worth saving" : "A sharper walk through this world"}
          </div>
        </div>

        {sidebarMode === "learn" ? (
          <GuidedLearningPanel video={video} onProblemCaptured={() => openCapture("")} />
        ) : (
          <>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
              {analyzing ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(255,255,255,.4)" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
                  <div style={{ fontSize: 14 }}>Looking for live wires…</div>
                </div>
              ) : !analysis || analysis.error ? (
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 14, textAlign: "center", paddingTop: 24 }}>
                  Could not scan this study. Watch for friction and save a spark below.
                </div>
              ) : (
                <>
                  {analysis.domainContext && (
                    <div style={{ background: "var(--ff-blue-soft)", border: "1px solid var(--ff-blue-border)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "#9CC4F0", lineHeight: 1.5 }}>
                      {analysis.domainContext}
                    </div>
                  )}
                  {(analysis.problems || []).length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.72)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Problem Sparks</div>
                      {analysis.problems.map((p, i) => (
                        <div key={i} style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 10, padding: "12px 13px", marginBottom: 10 }}>
                          <div style={{ color: "#A5B4FC", fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Spark {i + 1}</div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--edai-text)", marginBottom: 5 }}>{p.title}</div>
                          {p.humanMoment && <div style={{ fontSize: 12.5, color: "#F0C674", lineHeight: 1.45, marginBottom: 7 }}>“{p.humanMoment}”</div>}
                          <div style={{ fontSize: 12, color: "var(--edai-muted)", lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>
                          {(p.whoFeelsIt || p.currentWorkaround || p.whyNow) && (
                            <div style={{ display: "grid", gap: 4, marginBottom: 10 }}>
                              {p.whoFeelsIt && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.58)" }}><strong style={{ color: "rgba(255,255,255,.76)" }}>Who:</strong> {p.whoFeelsIt}</div>}
                              {p.currentWorkaround && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.58)" }}><strong style={{ color: "rgba(255,255,255,.76)" }}>Workaround:</strong> {p.currentWorkaround}</div>}
                              {p.whyNow && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.58)" }}><strong style={{ color: "rgba(255,255,255,.76)" }}>Why now:</strong> {p.whyNow}</div>}
                            </div>
                          )}
                          <button
                            onClick={() => openCapture(formatProblemSpark(p))}
                            style={{ background: "rgba(99,102,241,.14)", color: "#A5B4FC", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ff-body)" }}
                          >💡 Save this Spark</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(analysis.questions || []).length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.72)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Field Questions</div>
                      {analysis.questions.map((q, i) => (
                        <div key={i} style={{ background: "rgba(245,184,75,.10)", border: "1px solid rgba(245,184,75,.3)", borderRadius: 8, padding: "10px 12px", marginBottom: 8, fontSize: 13, color: "#F0C674", lineHeight: 1.5 }}>
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--edai-border)", background: "var(--edai-surface)" }}>
              <button
                onClick={() => openCapture("")}
                style={{ width: "100%", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}
              >💡 I see a Spark</button>
            </div>
          </>
        )}
      </div>

      {/* Capture modal */}
      {captureOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,7,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCaptureOpen(false)}>
          <div style={{ background: "var(--edai-surface)", borderRadius: 16, padding: 28, width: 480, maxWidth: "92vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 18, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 6px" }}>Save a Problem Spark</h3>
            <p style={{ color: "var(--edai-muted)", fontSize: 13, margin: "0 0 18px" }}>Name the pain, the person who feels it, and the workaround already in motion.</p>
            <textarea
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder="Who feels it: Small clinic owners&#10;What hurts: 2+ hours daily on insurance calls&#10;Current workaround: spreadsheets, phone trees, sticky notes"
              rows={4}
              style={{ width: "100%", border: "1px solid var(--edai-border)", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "var(--ff-body)", resize: "vertical", boxSizing: "border-box", outline: "none", background: "var(--edai-surface-2)", color: "var(--edai-text)" }}
            />
            <textarea
              value={captureNotes}
              onChange={(e) => setCaptureNotes(e.target.value)}
              placeholder="Founder fit (optional): Have you seen this? Who can you reach?"
              rows={2}
              style={{ width: "100%", border: "1px solid var(--edai-border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "var(--ff-body)", resize: "vertical", boxSizing: "border-box", outline: "none", marginTop: 10, color: "var(--edai-muted)", background: "var(--edai-surface-2)" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={() => setCaptureOpen(false)} style={{ background: "var(--edai-surface-2)", color: "rgba(255,255,255,.72)", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Cancel</button>
              <button onClick={saveCapture} disabled={saving || captureText.trim().length < 10} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: saving ? .6 : 1 }}>
                {saving ? "Saving…" : "Save Spark"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Problem Portfolio ────────────────────────────────────────────────────────

function ProblemPortfolio({ problems, onGraduate, graduating, onBack }) {
  const ungraduated = problems.filter((p) => !p.graduated);
  const graduated = problems.filter((p) => p.graduated);

  if (problems.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
        <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 22, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 10px" }}>No sparks saved yet</h3>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, margin: "0 0 24px" }}>Explore worlds or use the idea finder. Save the friction that makes you lean in.</p>
        <button onClick={onBack} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Find a Spark →</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 22, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>Your Sparks</h2>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, fontFamily: "var(--ff-body)" }}>← Back to Discovery</button>
      </div>

      {ungraduated.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.72)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Saved Sparks ({ungraduated.length})</div>
          {ungraduated.map((p) => (
            <div key={p.id} style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ fontSize: 15, color: "var(--edai-text)", fontWeight: 600, lineHeight: 1.5, marginBottom: p.notes ? 8 : 12 }}>{p.problemText}</div>
              {p.notes && <div style={{ fontSize: 13, color: "var(--edai-muted)", fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>{p.notes}</div>}
              {p.video && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 12 }}>
                  📹 From: {p.video.title}
                </div>
              )}
              <button
                onClick={() => onGraduate(p.id)}
                disabled={graduating === p.id}
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: graduating === p.id ? .6 : 1 }}
              >
                {graduating === p.id ? "Starting…" : "🚀 Turn into First Bet"}
              </button>
            </div>
          ))}
        </div>
      )}

      {graduated.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.72)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Graduated ✓</div>
          {graduated.map((p) => (
            <div key={p.id} style={{ background: "var(--ff-accent-soft)", border: "1px solid var(--ff-accent-border)", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: "rgba(210,255,235,.9)", fontWeight: 600, lineHeight: 1.5 }}>{p.problemText}</div>
              <div style={{ fontSize: 12, color: "var(--ff-accent)", marginTop: 6 }}>✓ Project created — ready for Task 1.1</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Discovery Module (top-level) ─────────────────────────────────────────────

export default function DiscoveryModule({ onGraduate }) {
  const [view, setView] = useState("entry"); // entry | finder | domains | videos | player | portfolio
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [problems, setProblems] = useState([]);
  const [graduating, setGraduating] = useState(null);
  const [savingSpark, setSavingSpark] = useState(false);

  // Load existing problems on mount
  useEffect(() => {
    fetch("/api/discovery/problems")
      .then((r) => r.json())
      .then((d) => setProblems(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function handleSelectDomain(domain) {
    setSelectedDomain(domain);
    setView("videos");
  }

  function handleSelectVideo(video, domain) {
    setSelectedVideo(video);
    setSelectedDomain(domain);
    setView("player");
  }

  function handleProblemCaptured(problem) {
    setProblems((prev) => [problem, ...prev]);
  }

  async function handleSaveSpark(problemText, notes) {
    if (!problemText?.trim()) return;
    setSavingSpark(true);
    try {
      const res = await fetch("/api/discovery/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: problemText.trim(),
          notes: notes?.trim() || undefined,
        }),
      });
      if (res.ok) {
        const problem = await res.json();
        handleProblemCaptured(problem);
        setView("portfolio");
      }
    } finally {
      setSavingSpark(false);
    }
  }

  async function handleGraduate(problemId) {
    setGraduating(problemId);
    try {
      const res = await fetch("/api/discovery/graduate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) => p.id === problemId ? { ...p, graduated: true, projectId: data.project.id } : p)
        );
        onGraduate?.(data.project);
      }
    } finally {
      setGraduating(null);
    }
  }

  const portfolioCount = problems.filter((p) => !p.graduated).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--edai-bg)" }}>
      {/* Header */}
      <div style={{ background: "var(--edai-surface)", borderBottom: "1px solid var(--edai-border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <span style={{ fontFamily: "var(--ff-heading)", fontSize: 18, fontWeight: 700, color: "var(--edai-text)" }}>🔍 Idea Discovery</span>
          <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13, marginLeft: 12 }}>Find the friction worth chasing</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("entry")}
            style={{ background: ["entry", "finder", "domains", "videos", "player"].includes(view) ? "#6366f1" : "var(--edai-surface-2)", color: ["entry", "finder", "domains", "videos", "player"].includes(view) ? "#fff" : "rgba(255,255,255,.65)", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)" }}
          >
            Discover
          </button>
          <button
            onClick={() => setView("portfolio")}
            style={{ background: view === "portfolio" ? "#6366f1" : "var(--edai-surface-2)", color: view === "portfolio" ? "#fff" : "rgba(255,255,255,.65)", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", position: "relative" }}
          >
            My Sparks
            {portfolioCount > 0 && (
              <span style={{ marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{portfolioCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {view === "entry" && (
          <IdeaEntry
            portfolioCount={portfolioCount}
            onHaveIdea={() => setView("finder")}
            onExploreWorlds={() => setView("domains")}
            onNoIdeaYet={() => setView("finder")}
          />
        )}
        {view === "finder" && (
          <IdeaFinder
            saving={savingSpark}
            onSaveSpark={handleSaveSpark}
            onExploreWorlds={() => setView("domains")}
          />
        )}
        {view === "domains" && (
          <DomainBrowser onSelect={handleSelectDomain} />
        )}
        {view === "videos" && selectedDomain && (
          <VideoFeed
            domain={selectedDomain}
            onSelectVideo={handleSelectVideo}
            onBack={() => setView("domains")}
          />
        )}
        {view === "player" && selectedVideo && selectedDomain && (
          <VideoPlayer
            video={selectedVideo}
            domain={selectedDomain}
            onBack={() => setView("videos")}
            onProblemCaptured={handleProblemCaptured}
          />
        )}
        {view === "portfolio" && (
          <ProblemPortfolio
            problems={problems}
            onGraduate={handleGraduate}
            graduating={graduating}
            onBack={() => setView("entry")}
          />
        )}
      </div>
    </div>
  );
}

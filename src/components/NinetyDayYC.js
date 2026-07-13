"use client";
import { useState, useEffect, useRef } from "react";

const YC = "#FF6600";
const YC_GRAD = "linear-gradient(135deg,#FF6600,#FF8534)";
const STAGES = [
  { value: "idea", label: "Just an idea" },
  { value: "building", label: "Building the MVP" },
  { value: "launched", label: "Launched, no revenue" },
  { value: "revenue", label: "Have some revenue" },
];
const MOODS = ["🔥 On fire", "😎 Good", "😐 Grinding", "😰 Struggling", "😵 Stuck"];

function fmtMoney(n) {
  if (n == null) return "—";
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

const DURATION_PRESETS = [30, 60, 90];

function Onboarding({ onCreate, creating, onBack, error }) {
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState("idea");
  const [startingRevenue, setStartingRevenue] = useState("");
  const [duration, setDuration] = useState(90);
  const [customDuration, setCustomDuration] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const effectiveDuration = useCustom
    ? Math.min(180, Math.max(14, parseInt(customDuration, 10) || 0)) || null
    : duration;

  if (creating) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>📋</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 24, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px" }}>
          Michael Seibel is drafting your {effectiveDuration || 90}-day plan…
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, lineHeight: 1.6 }}>
          He&apos;s mapping every day from launch to $1M. In a moment you&apos;ll review the draft together — push back, reshape it, and lock it in when it feels right.
        </p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: YC, animation: `ffBounce .9s ${i * 0.15}s infinite` }} />)}
        </div>
      </div>
    );
  }

  const canSubmit = startupName.trim() && oneLiner.trim().length > 5 && effectiveDuration;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
      {onBack && (
        <button onClick={onBack} style={{ marginBottom: 20, background: "none", border: "none", color: "rgba(255,255,255,.35)", fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
          ← Back to projects
        </button>
      )}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-block", background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 13, padding: "5px 13px", borderRadius: 99, marginBottom: 16, letterSpacing: ".06em" }}>
          Y COMBINATOR · SPRINT
        </div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 30, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px", lineHeight: 1.2 }}>
          You just got into YC.<br />Pick your sprint. Get to $1M.
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
          Michael Seibel drafts a day-by-day plan, then you shape it with him until it&apos;s yours. Report in daily — the plan adapts to what&apos;s working and what&apos;s not.
        </p>
      </div>

      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 16, padding: 28 }}>
        <label style={labelStyle}>What&apos;s your startup called?</label>
        <input value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="e.g. Acme AI" style={inputStyle} maxLength={80} />

        <label style={labelStyle}>What are you building? (one line)</label>
        <textarea value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="e.g. AI that automates insurance claims for small clinics" rows={2} style={{ ...inputStyle, resize: "vertical" }} maxLength={300} />

        <label style={labelStyle}>Where are you today?</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          {STAGES.map((s) => (
            <button key={s.value} onClick={() => setStage(s.value)} style={{ padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${stage === s.value ? YC : "var(--edai-border)"}`, background: stage === s.value ? "rgba(255,102,0,.12)" : "var(--edai-surface-2)", color: stage === s.value ? "#FF8534" : "rgba(255,255,255,.6)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", textAlign: "left" }}>
              {s.label}
            </button>
          ))}
        </div>

        <label style={labelStyle}>How long is your sprint?</label>
        <div style={{ display: "flex", gap: 8, marginBottom: useCustom ? 10 : 18, flexWrap: "wrap" }}>
          {DURATION_PRESETS.map((d) => {
            const active = !useCustom && duration === d;
            return (
              <button key={d} onClick={() => { setDuration(d); setUseCustom(false); }} style={{ flex: 1, minWidth: 72, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${active ? YC : "var(--edai-border)"}`, background: active ? "rgba(255,102,0,.12)" : "var(--edai-surface-2)", color: active ? "#FF8534" : "rgba(255,255,255,.6)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>
                {d} days
                {d === 90 && <div style={{ fontSize: 9.5, fontWeight: 600, opacity: .7, marginTop: 2 }}>YC classic</div>}
              </button>
            );
          })}
          <button onClick={() => setUseCustom(true)} style={{ flex: 1, minWidth: 72, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${useCustom ? YC : "var(--edai-border)"}`, background: useCustom ? "rgba(255,102,0,.12)" : "var(--edai-surface-2)", color: useCustom ? "#FF8534" : "rgba(255,255,255,.6)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>
            Custom
          </button>
        </div>
        {useCustom && (
          <div style={{ marginBottom: 18 }}>
            <input value={customDuration} onChange={(e) => setCustomDuration(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Number of days (14–180)" inputMode="numeric" autoFocus style={{ ...inputStyle, marginBottom: 4 }} />
            <div style={{ fontSize: 11.5, color: "var(--edai-muted)" }}>Anywhere from 14 to 180 days. Shorter sprints mean a more aggressive plan.</div>
          </div>
        )}

        <label style={labelStyle}>Current monthly revenue (USD)</label>
        <input value={startingRevenue} onChange={(e) => setStartingRevenue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" style={inputStyle} />

        {error && (
          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(224,90,71,.12)", border: "1px solid rgba(224,90,71,.3)", fontSize: 13, color: "#FF8888", fontFamily: "var(--ff-body)" }}>
            {error}
          </div>
        )}
        <button
          onClick={() => canSubmit && onCreate({ startupName, oneLiner, stage, startingRevenue, durationDays: effectiveDuration })}
          disabled={!canSubmit}
          className="ff-btn-accent"
          style={{ width: "100%", background: YC_GRAD, color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "var(--ff-body)", opacity: canSubmit ? 1 : 0.45, marginTop: 8 }}
        >
          Draft my {effectiveDuration || "…"}-day plan →
        </button>
        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--edai-muted)", marginTop: 10 }}>
          You&apos;ll review and tweak the plan with Michael before Day 1 starts.
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 6 };
const inputStyle = { width: "100%", border: "1px solid var(--edai-border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, fontFamily: "var(--ff-body)", boxSizing: "border-box", outline: "none", marginBottom: 18, background: "var(--edai-surface-2)", color: "var(--edai-text)" };

// ─── Plan Review (before Day 1) ────────────────────────────────────────────────

function PlanReview({ program, onUpdate, onStarted }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [openPhase, setOpenPhase] = useState(0);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  const phases = program.phases || [];
  const planDays = program.planDays || [];
  const chat = Array.isArray(program.planChat) ? program.planChat : [];
  const duration = program.durationDays || 90;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length, sending]);

  async function send() {
    const text = message.trim();
    if (!text || sending) return;
    setMessage("");
    setSending(true);
    setError(null);
    // Optimistic user bubble
    onUpdate({ ...program, planChat: [...chat, { role: "user", content: text }] });
    try {
      const res = await fetch(`/api/yc/program/${program.id}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.program);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Michael didn't get that — try again.");
        onUpdate({ ...program, planChat: chat });
      }
    } catch {
      setError("Connection issue — try again.");
      onUpdate({ ...program, planChat: chat });
    } finally {
      setSending(false);
    }
  }

  async function start() {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/yc/program/${program.id}/start`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onStarted(data.program);
        return;
      }
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Failed to start — try again.");
    } catch {
      setError("Connection issue — try again.");
    }
    setStarting(false);
  }

  if (starting) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>🏁</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 24, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px" }}>
          Locking in your plan…
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, lineHeight: 1.6 }}>
          Michael is writing your first week in detail. Day 1 starts in a moment.
        </p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: YC, animation: `ffBounce .9s ${i * 0.15}s infinite` }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid var(--edai-border)", background: "var(--edai-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 5 }}>DRAFT PLAN</span>
            <span style={{ fontFamily: "var(--ff-heading)", fontSize: 17, fontWeight: 700, color: "var(--edai-text)" }}>{program.startupName} · {duration} days</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--edai-muted)" }}>Review the plan with Michael. Push back, add context, reshape it — then lock it in.</div>
        </div>
        <button onClick={start} className="ff-btn-accent" style={{ background: YC_GRAD, color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", whiteSpace: "nowrap" }}>
          Lock it in — start Day 1 →
        </button>
      </div>

      {/* Body: plan left, chat right */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Plan pane */}
        <div style={{ flex: "1.3 1 0", overflow: "auto", padding: "20px 24px", borderRight: "1px solid var(--edai-border)", minWidth: 0 }}>
          {phases.map((ph, pi) => {
            const isOpen = openPhase === pi;
            const phDays = planDays.filter((d) => d.day >= ph.dayStart && d.day <= ph.dayEnd);
            return (
              <div key={pi} style={{ marginBottom: 10, borderRadius: 12, border: "1px solid var(--edai-border)", background: "var(--edai-surface)", overflow: "hidden" }}>
                <button onClick={() => setOpenPhase(isOpen ? -1 : pi)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--ff-body)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: YC_GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{pi + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--edai-text)" }}>{ph.name}</div>
                    <div style={{ fontSize: 12, color: "var(--edai-muted)", marginTop: 1 }}>Days {ph.dayStart}–{ph.dayEnd} · {ph.goal}</div>
                  </div>
                  <span style={{ color: "rgba(255,255,255,.35)", fontSize: 12, flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▶</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 14px" }}>
                    <div style={{ fontSize: 11.5, color: "#FF8534", fontWeight: 600, marginBottom: 10, paddingLeft: 40 }}>Milestone: {ph.milestone}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 40 }}>
                      {phDays.map((d) => (
                        <div key={d.day} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.5, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                          <span style={{ color: "rgba(255,255,255,.35)", fontWeight: 700, flexShrink: 0, width: 48 }}>Day {d.day}</span>
                          <span style={{ color: "rgba(255,255,255,.75)", fontWeight: 600, flexShrink: 0 }}>{d.theme}</span>
                          <span style={{ color: "var(--edai-muted)" }}>{d.objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat pane */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", minWidth: 280, maxWidth: 460 }}>
          <div style={{ flex: 1, overflow: "auto", padding: "18px 18px 8px" }}>
            <div style={{ background: "rgba(255,102,0,.1)", borderLeft: `3px solid ${YC}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#FF8534", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Michael Seibel</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,210,180,.92)", lineHeight: 1.55 }}>
                Here&apos;s my draft of your {duration} days. Tell me what&apos;s off — wrong assumptions, constraints I don&apos;t know about, things you&apos;ve already done. I&apos;ll rework it. When it feels right, lock it in and we start.
              </div>
            </div>
            {chat.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{ maxWidth: "88%", padding: "10px 13px", borderRadius: 12, borderTopLeftRadius: m.role === "user" ? 12 : 4, borderTopRightRadius: m.role === "user" ? 4 : 12, background: m.role === "user" ? "rgba(255,102,0,.13)" : "var(--edai-surface)", border: `1px solid ${m.role === "user" ? "rgba(255,102,0,.28)" : "var(--edai-border)"}`, fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,.85)", whiteSpace: "pre-wrap", fontFamily: "var(--ff-body)" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: "flex", gap: 5, padding: "8px 4px" }}>
                {[0, 1, 2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: YC, animation: `ffBounce 1.2s ${i * 0.15}s infinite` }} />)}
              </div>
            )}
            {error && <div style={{ fontSize: 12.5, color: "#FF8888", padding: "6px 2px" }}>{error}</div>}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "10px 14px 16px", borderTop: "1px solid var(--edai-border)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--edai-border)", background: "var(--edai-surface)" }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={sending ? "Michael is reworking the plan…" : "e.g. I can only work evenings — compress weekdays…"}
                rows={2}
                disabled={sending}
                style={{ flex: 1, background: "transparent", border: "none", color: "var(--edai-text)", fontSize: 13.5, lineHeight: 1.55, resize: "none", outline: "none", fontFamily: "var(--ff-body)" }}
              />
              <button onClick={send} disabled={!message.trim() || sending} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: message.trim() && !sending ? YC_GRAD : "rgba(255,255,255,.06)", color: message.trim() && !sending ? "#fff" : "rgba(255,255,255,.25)", cursor: message.trim() && !sending ? "pointer" : "not-allowed", fontSize: 16, flexShrink: 0 }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Check-in Modal ─────────────────────────────────────────────────────────────

function CheckinModal({ day, onClose, onSubmit, submitting }) {
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [revenue, setRevenue] = useState("");
  const [users, setUsers] = useState("");
  const [mood, setMood] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,7,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 18, padding: 28, width: 520, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 5 }}>DAY {day.dayNumber}</span>
          <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 19, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>Daily check-in</h3>
        </div>
        <p style={{ color: "var(--edai-muted)", fontSize: 13, margin: "0 0 18px" }}>Report honestly. Tomorrow&apos;s plan adapts to what you write here.</p>

        <label style={labelStyle}>What did you get done today?</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Talked to 5 users, shipped the signup flow, closed first $50/mo customer…" rows={3} style={{ ...inputStyle, resize: "vertical" }} maxLength={2000} />

        <label style={labelStyle}>What&apos;s blocking you or worrying you?</label>
        <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="Users say they want it but won't pay yet. Not sure how to reach more of them." rows={2} style={{ ...inputStyle, resize: "vertical" }} maxLength={2000} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Monthly revenue ($)</label>
            <input value={revenue} onChange={(e) => setRevenue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Users / customers</label>
            <input value={users} onChange={(e) => setUsers(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>How are you feeling?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
          {MOODS.map((m) => (
            <button key={m} onClick={() => setMood(m)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${mood === m ? YC : "var(--edai-border)"}`, background: mood === m ? "rgba(255,102,0,.12)" : "var(--edai-surface-2)", color: mood === m ? "#FF8534" : "var(--edai-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ff-body)" }}>{m}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="ff-ghost" style={{ background: "var(--edai-surface-2)", color: "rgba(255,255,255,.7)", border: "1px solid var(--edai-border)", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Cancel</button>
          <button
            onClick={() => onSubmit({ summary, blockers, revenue, users, mood })}
            disabled={submitting || !summary.trim()}
            className="ff-btn-accent"
            style={{ background: YC_GRAD, color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: (submitting || !summary.trim()) ? 0.45 : 1 }}
          >
            {submitting ? "Submitting…" : "Report & unlock tomorrow →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Today Panel ────────────────────────────────────────────────────────────────

function TodayPanel({ program, day, onToggleTask, onOpenCheckin, onAdjustDay }) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const phase = (program.phases || []).find((p) => day.dayNumber >= p.dayStart && day.dayNumber <= p.dayEnd);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustText, setAdjustText] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustReply, setAdjustReply] = useState(null);

  async function submitAdjust() {
    const text = adjustText.trim();
    if (!text || adjusting) return;
    setAdjusting(true);
    setAdjustReply(null);
    const reply = await onAdjustDay(text);
    setAdjusting(false);
    if (reply != null) {
      setAdjustReply(reply);
      setAdjustText("");
      setShowAdjust(false);
    } else {
      setAdjustReply("Couldn't update the plan — try again.");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 24px 40px" }}>
      {phase && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FF8534", textTransform: "uppercase", letterSpacing: ".05em" }}>{phase.name}</span>
          <span style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>· Days {phase.dayStart}–{phase.dayEnd}</span>
        </div>
      )}

      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <span style={{ background: "rgba(255,255,255,.08)", color: "var(--edai-text)", fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 6 }}>DAY {day.dayNumber}</span>
          <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 22, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>{day.theme}</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>{day.objective}</p>

        {day.partnerNote && (
          <div style={{ background: "rgba(255,102,0,.1)", borderLeft: `3px solid ${YC}`, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FF8534", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Michael Seibel says</div>
            <div style={{ fontSize: 14, color: "rgba(255,210,180,.92)", lineHeight: 1.55, fontStyle: "italic" }}>{day.partnerNote}</div>
          </div>
        )}

        {tasks.length > 0 ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Today&apos;s tasks</div>
            {tasks.map((t, i) => (
              <div key={i} onClick={() => onToggleTask(day.dayNumber, i, !t.done)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < tasks.length - 1 ? "1px solid var(--edai-border)" : "none", cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${t.done ? YC : "rgba(255,255,255,.25)"}`, background: t.done ? YC : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {t.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: t.done ? "rgba(255,255,255,.35)" : "var(--edai-text)", textDecoration: t.done ? "line-through" : "none", lineHeight: 1.5 }}>{t.text}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "rgba(255,255,255,.35)", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
            Detailed tasks for this day are still generating. Check back in a moment, or report your progress to move forward.
          </div>
        )}

        {day.rationale && (
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--edai-muted)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Why this matters now:</span> {day.rationale}
          </div>
        )}

        {/* Adjust today's plan */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--edai-border)" }}>
          {adjustReply && (
            <div style={{ background: "rgba(255,102,0,.1)", borderLeft: `3px solid ${YC}`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#FF8534", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Michael reworked today</div>
              <div style={{ fontSize: 13, color: "rgba(255,210,180,.92)", lineHeight: 1.5 }}>{adjustReply}</div>
            </div>
          )}
          {!showAdjust ? (
            <button onClick={() => { setShowAdjust(true); setAdjustReply(null); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.45)", fontSize: 12.5, cursor: "pointer", fontFamily: "var(--ff-body)", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>✏️</span> Life happened? Tweak today&apos;s plan
            </button>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--edai-border)", background: "var(--edai-surface-2)" }}>
                <textarea
                  value={adjustText}
                  onChange={(e) => setAdjustText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAdjust(); } }}
                  placeholder={adjusting ? "Michael is reworking today…" : "e.g. I only have 2 hours today / a customer asked for a demo — reshuffle…"}
                  rows={2}
                  disabled={adjusting}
                  autoFocus
                  style={{ flex: 1, background: "transparent", border: "none", color: "var(--edai-text)", fontSize: 13, lineHeight: 1.5, resize: "none", outline: "none", fontFamily: "var(--ff-body)" }}
                />
                <button onClick={submitAdjust} disabled={!adjustText.trim() || adjusting} style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: adjustText.trim() && !adjusting ? YC_GRAD : "rgba(255,255,255,.06)", color: adjustText.trim() && !adjusting ? "#fff" : "rgba(255,255,255,.25)", fontSize: 12, fontWeight: 700, cursor: adjustText.trim() && !adjusting ? "pointer" : "not-allowed", fontFamily: "var(--ff-body)", flexShrink: 0 }}>
                  {adjusting ? "…" : "Rework"}
                </button>
              </div>
              <button onClick={() => { setShowAdjust(false); setAdjustText(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.28)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--ff-body)", padding: "6px 2px 0" }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onOpenCheckin}
        className="ff-btn-accent"
        style={{ width: "100%", background: YC_GRAD, color: "#fff", border: "none", borderRadius: 12, padding: "15px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "var(--ff-body)" }}
      >
        Report Day {day.dayNumber} & unlock Day {day.dayNumber + 1} →
      </button>

      {day.report?.feedback && (
        <div style={{ marginTop: 20, background: "var(--ff-accent-soft)", border: "1px solid var(--ff-accent-border)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ff-accent)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>Michael&apos;s feedback on your last check-in</div>
          <div style={{ fontSize: 14, color: "rgba(210,255,235,.85)", lineHeight: 1.55 }}>{day.report.feedback}</div>
        </div>
      )}
    </div>
  );
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────────

function Roadmap({ program, onPickDay }) {
  const phases = program.phases || [];
  const daysByPhase = phases.map((p) => ({
    phase: p,
    days: program.days.filter((d) => d.dayNumber >= p.dayStart && d.dayNumber <= p.dayEnd),
  }));

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "8px 24px 40px" }}>
      {daysByPhase.map(({ phase, days }, pi) => (
        <div key={pi} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: YC_GRAD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{pi + 1}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--edai-text)" }}>{phase.name}</div>
              <div style={{ fontSize: 12, color: "var(--edai-muted)" }}>Days {phase.dayStart}–{phase.dayEnd} · {phase.milestone}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, paddingLeft: 38 }}>
            {days.map((d) => {
              const isCurrent = d.dayNumber === program.currentDay;
              const isDone = d.status === "done";
              return (
                <button key={d.id} onClick={() => onPickDay(d)} className="ff-row-hover" style={{ textAlign: "left", background: isCurrent ? "rgba(255,102,0,.12)" : "var(--edai-surface)", border: `1px solid ${isCurrent ? YC : isDone ? "var(--ff-accent-border)" : "var(--edai-border)"}`, borderRadius: 9, padding: "8px 10px", cursor: "pointer", fontFamily: "var(--ff-body)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? "#FF8534" : isDone ? "var(--ff-accent)" : "rgba(255,255,255,.4)" }}>DAY {d.dayNumber}</span>
                    {isDone && <span style={{ fontSize: 11, color: "var(--ff-accent)" }}>✓</span>}
                    {isCurrent && <span style={{ fontSize: 10, background: YC, color: "#fff", padding: "0 5px", borderRadius: 4, fontWeight: 700 }}>NOW</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{d.theme}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Past Day Detail ───────────────────────────────────────────────────────────

function DayDetailModal({ day, onClose }) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,7,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 18, padding: 26, width: 520, maxWidth: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
          <span style={{ background: "rgba(255,255,255,.08)", color: "var(--edai-text)", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 5 }}>DAY {day.dayNumber}</span>
          <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 18, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>{day.theme}</h3>
        </div>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>{day.objective}</p>

        {tasks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 13, color: t.done ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.7)" }}>
                <span style={{ color: t.done ? "var(--ff-accent)" : "rgba(255,255,255,.4)" }}>{t.done ? "✓" : "○"}</span>
                <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {day.report ? (
          <div style={{ background: "var(--edai-surface-2)", border: "1px solid var(--edai-border)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--edai-muted)", textTransform: "uppercase", marginBottom: 8 }}>Your check-in</div>
            {day.report.summary && <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "0 0 8px", lineHeight: 1.5 }}><b>Did:</b> {day.report.summary}</p>}
            {day.report.blockers && <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "0 0 8px", lineHeight: 1.5 }}><b>Blockers:</b> {day.report.blockers}</p>}
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--edai-muted)", marginBottom: day.report.feedback ? 12 : 0 }}>
              <span>Revenue: {fmtMoney(day.report.revenue)}/mo</span>
              <span>Users: {day.report.users ?? "—"}</span>
              {day.report.mood && <span>{day.report.mood}</span>}
            </div>
            {day.report.feedback && (
              <div style={{ background: "var(--ff-accent-soft)", border: "1px solid var(--ff-accent-border)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ff-accent)", marginBottom: 4 }}>MICHAEL&apos;S FEEDBACK</div>
                <div style={{ fontSize: 13, color: "rgba(210,255,235,.85)", lineHeight: 1.5 }}>{day.report.feedback}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "rgba(255,255,255,.4)", fontSize: 13, fontStyle: "italic" }}>Not reported yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Top-level ───────────────────────────────────────────────────────────────────

const MAX_PROJECTS = 5;

export default function NinetyDayYC() {
  const [programs, setPrograms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState("today");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pickedDay, setPickedDay] = useState(null);
  const [createError, setCreateError] = useState(null);

  const program = programs.find((p) => p.id === activeId) || null;
  const atLimit = programs.length >= MAX_PROJECTS;

  useEffect(() => {
    fetch("/api/yc/program")
      .then((r) => r.json())
      .then((d) => {
        const progs = d.programs || [];
        setPrograms(progs);
        if (progs.length > 0) setActiveId(progs[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(form) {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/yc/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const p = await res.json();
        setPrograms((prev) => [p, ...prev]);
        setActiveId(p.id);
        setShowNew(false);
        setView("today");
      } else {
        const err = await res.json();
        setCreateError(err.error || "Failed to create project.");
      }
    } finally {
      setCreating(false);
    }
  }

  function updateProgram(updater) {
    setPrograms((prev) => prev.map((p) => (p.id === activeId ? updater(p) : p)));
  }

  async function handleToggleTask(dayNumber, taskIndex, done) {
    updateProgram((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.dayNumber !== dayNumber) return d;
        const tasks = [...(d.tasks || [])];
        tasks[taskIndex] = { ...tasks[taskIndex], done };
        return { ...d, tasks };
      }),
    }));
    await fetch(`/api/yc/program/${activeId}/day/${dayNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIndex, done }),
    }).catch(() => {});
  }

  async function handleAdjustDay(request) {
    try {
      const res = await fetch(`/api/yc/program/${activeId}/day/${program.currentDay}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      updateProgram((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.dayNumber === data.day.dayNumber ? { ...d, ...data.day } : d)),
      }));
      return data.reply || "Done — today's plan is updated.";
    } catch {
      return null;
    }
  }

  async function handleCheckin(report) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/yc/program/${activeId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (res.ok) {
        const data = await res.json();
        setPrograms((prev) => prev.map((p) => (p.id === activeId ? data.program : p)));
        setCheckinOpen(false);
        setView("today");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "var(--edai-muted)" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: YC, animation: `ffBounce 1.2s ${i * 0.15}s infinite` }} />)}
        </div>
        Loading your programs…
      </div>
    );
  }

  // No programs or user clicked "+ New" — show onboarding
  if (programs.length === 0 || showNew) {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <Onboarding
          onCreate={handleCreate}
          creating={creating}
          error={createError}
          onBack={programs.length > 0 ? () => { setShowNew(false); setCreateError(null); } : null}
        />
      </div>
    );
  }

  const currentDay = program?.days.find((d) => d.dayNumber === program.currentDay);
  const latestRevenue = program ? ([...program.days].reverse().find((d) => d.report?.revenue != null)?.report?.revenue ?? program.startingRevenue) : 0;
  const arr = latestRevenue * 12;
  const progress = program ? Math.min(100, (arr / (program.targetRevenue || 1000000)) * 100) : 0;
  const isComplete = program?.status === "completed";
  const isPlanning = program?.status === "planning";
  const duration = program?.durationDays || 90;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: "var(--edai-surface)", borderBottom: "1px solid var(--edai-border)", padding: "12px 24px 0", flexShrink: 0 }}>

        {/* Project switcher row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "rgba(255,255,255,.25)", textTransform: "uppercase", fontFamily: "var(--ff-body)", flexShrink: 0, marginRight: 4 }}>Projects</span>
          {programs.map((p) => {
            const isActive = p.id === activeId;
            const pArr = ([...p.days].reverse().find((d) => d.report?.revenue != null)?.report?.revenue ?? p.startingRevenue) * 12;
            return (
              <button
                key={p.id}
                onClick={() => { setActiveId(p.id); setView("today"); }}
                style={{
                  flexShrink: 0,
                  padding: "5px 12px",
                  borderRadius: 99,
                  border: `1.5px solid ${isActive ? YC : "var(--edai-border)"}`,
                  background: isActive ? "rgba(255,102,0,.12)" : "transparent",
                  color: isActive ? "#FF8534" : "rgba(255,255,255,.5)",
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "var(--ff-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all .15s",
                  whiteSpace: "nowrap",
                }}
              >
                {p.startupName}
                <span style={{ fontSize: 10, opacity: .65 }}>
                  {p.status === "planning" ? "Planning" : `Day ${p.currentDay}/${p.durationDays || 90}`}
                </span>
                {p.status === "completed" && <span style={{ fontSize: 9, background: "var(--ff-accent)", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>✓</span>}
              </button>
            );
          })}

          {/* New project button */}
          <button
            onClick={() => !atLimit && setShowNew(true)}
            title={atLimit ? `Max ${MAX_PROJECTS} projects reached` : "Start a new sprint"}
            style={{
              flexShrink: 0,
              padding: "5px 11px",
              borderRadius: 99,
              border: "1.5px dashed rgba(255,255,255,.18)",
              background: "transparent",
              color: atLimit ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: atLimit ? "not-allowed" : "pointer",
              fontFamily: "var(--ff-body)",
              whiteSpace: "nowrap",
              transition: "all .15s",
            }}
          >
            + New {atLimit && <span style={{ fontSize: 10, opacity: .6 }}>({programs.length}/{MAX_PROJECTS})</span>}
          </button>
        </div>

        {/* Active program name + tabs (hidden while reviewing the draft plan) */}
        {program && !isPlanning && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 12, padding: "3px 9px", borderRadius: 5 }}>YC · {duration} DAYS</span>
                <span style={{ fontFamily: "var(--ff-heading)", fontSize: 17, fontWeight: 700, color: "var(--edai-text)" }}>{program.startupName}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setView("today")} style={tabStyle(view === "today")}>Today</button>
                <button onClick={() => setView("roadmap")} style={tabStyle(view === "roadmap")}>Roadmap</button>
                <button onClick={() => setView("about")} style={tabStyle(view === "about")}>About</button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--edai-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Day {program.currentDay}/{duration}</div>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${(program.currentDay / duration) * 100}%`, height: "100%", background: YC_GRAD, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--edai-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                {fmtMoney(arr)} ARR / $1M <span style={{ color: "#FF8534" }}>({progress.toFixed(0)}%)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Body */}
      {program && isPlanning ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <PlanReview
            program={program}
            onUpdate={(p) => setPrograms((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
            onStarted={(p) => {
              setPrograms((prev) => prev.map((x) => (x.id === p.id ? p : x)));
              setView("today");
            }}
          />
        </div>
      ) : program && (
        <div style={{ flex: 1, overflow: "auto", paddingTop: 20 }}>
          {isComplete ? (
            <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏁</div>
              <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 26, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 10px" }}>{duration} days done.</h2>
              <p style={{ color: "var(--edai-muted)", fontSize: 15, marginBottom: 8 }}>You finished the sprint at {fmtMoney(arr)} ARR run-rate.</p>
              <button onClick={() => setView("roadmap")} className="ff-btn-accent" style={{ marginTop: 16, background: YC_GRAD, color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Review your {duration} days →</button>
            </div>
          ) : view === "about" ? (
            <AboutPanel program={program} />
          ) : view === "today" && currentDay ? (
            <TodayPanel program={program} day={currentDay} onToggleTask={handleToggleTask} onOpenCheckin={() => setCheckinOpen(true)} onAdjustDay={handleAdjustDay} />
          ) : (
            <Roadmap program={program} onPickDay={setPickedDay} />
          )}
        </div>
      )}

      {checkinOpen && currentDay && (
        <CheckinModal day={currentDay} onClose={() => setCheckinOpen(false)} onSubmit={handleCheckin} submitting={submitting} />
      )}
      {pickedDay && <DayDetailModal day={pickedDay} onClose={() => setPickedDay(null)} />}
    </div>
  );
}

function tabStyle(active) {
  return { background: active ? YC_GRAD : "var(--edai-surface-2)", color: active ? "#fff" : "rgba(255,255,255,.65)", border: active ? "none" : "1px solid var(--edai-border)", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)" };
}

// ─── About Panel ─────────────────────────────────────────────────────────────────

function AboutPanel({ program }) {
  const stageLabel = STAGES.find((s) => s.value === program.stage)?.label || program.stage;
  const phases = program.phases || [];
  const doneCount = program.days.filter((d) => d.status === "done").length;
  const latestRevenue = [...program.days].reverse().find((d) => d.report?.revenue != null)?.report?.revenue ?? program.startingRevenue;
  const arr = latestRevenue * 12;
  const progress = Math.min(100, (arr / (program.targetRevenue || 1_000_000)) * 100);
  const duration = program.durationDays || 90;
  const dayProgress = Math.round((program.currentDay / duration) * 100);

  const statCard = (label, value, sub) => (
    <div style={{ flex: 1, minWidth: 130, padding: "14px 16px", borderRadius: 12, background: "var(--edai-surface-2)", border: "1px solid var(--edai-border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "var(--edai-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--ff-body)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--edai-text)", fontFamily: "var(--ff-display)", letterSpacing: "-.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--edai-muted)", marginTop: 3, fontFamily: "var(--ff-body)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 24px 48px" }}>
      {/* Project identity */}
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "var(--edai-surface)", border: "1px solid var(--edai-border)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: YC_GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🚀</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "#FF8534", textTransform: "uppercase", marginBottom: 5, fontFamily: "var(--ff-body)" }}>YC · {duration}-Day Sprint</div>
            <h2 style={{ fontSize: 26, fontFamily: "var(--ff-display)", fontWeight: 700, color: "var(--edai-text)", margin: "0 0 8px", letterSpacing: "-.02em", lineHeight: 1.15 }}>{program.startupName}</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.65)", fontFamily: "var(--ff-body)", lineHeight: 1.65, margin: 0 }}>{program.oneLiner}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, padding: "4px 11px", borderRadius: 99, background: "rgba(255,102,0,.1)", border: "1px solid rgba(255,102,0,.25)", color: "#FF8534", fontFamily: "var(--ff-body)", fontWeight: 600 }}>{stageLabel}</span>
          <span style={{ fontSize: 12, padding: "4px 11px", borderRadius: 99, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "var(--edai-muted)", fontFamily: "var(--ff-body)" }}>Started at {fmtMoney(program.startingRevenue)}/mo MRR</span>
          <span style={{ fontSize: 12, padding: "4px 11px", borderRadius: 99, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "var(--edai-muted)", fontFamily: "var(--ff-body)" }}>Target: $1M ARR</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {statCard("Current day", `${program.currentDay}/${duration}`, `${dayProgress}% of sprint`)}
        {statCard("Days done", doneCount, `${duration - program.currentDay} remaining`)}
        {statCard("Current ARR", fmtMoney(arr), `${progress.toFixed(0)}% of $1M target`)}
        {statCard("MRR now", fmtMoney(latestRevenue), "latest check-in")}
      </div>

      {/* ARR progress */}
      <div style={{ padding: "18px 20px", borderRadius: 12, background: "var(--edai-surface)", border: "1px solid var(--edai-border)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--edai-muted)", fontFamily: "var(--ff-body)", textTransform: "uppercase", letterSpacing: ".1em" }}>Revenue to $1M ARR</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FF8534", fontFamily: "var(--ff-body)" }}>{progress.toFixed(1)}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: YC_GRAD, borderRadius: 99, transition: "width .6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "var(--ff-body)" }}>{fmtMoney(arr)} today</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "var(--ff-body)" }}>$1,000,000 goal</span>
        </div>
      </div>

      {/* Phases */}
      {phases.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 12, fontFamily: "var(--ff-body)" }}>Program Phases</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {phases.map((ph, i) => {
              const phDone = program.currentDay > ph.dayEnd;
              const phCurrent = program.currentDay >= ph.dayStart && program.currentDay <= ph.dayEnd;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: phCurrent ? "rgba(255,102,0,.07)" : "var(--edai-surface)", border: `1px solid ${phCurrent ? "rgba(255,102,0,.25)" : "var(--edai-border)"}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: phDone ? "var(--ff-accent-soft)" : phCurrent ? YC_GRAD : "rgba(255,255,255,.05)", border: phDone ? "1px solid var(--ff-accent-border)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: phDone ? "var(--ff-accent)" : phCurrent ? "#fff" : "rgba(255,255,255,.3)", flexShrink: 0 }}>
                    {phDone ? "✓" : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: phCurrent ? "var(--edai-text)" : phDone ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.6)", fontFamily: "var(--ff-body)" }}>{ph.name}</div>
                    <div style={{ fontSize: 11, color: "var(--edai-muted)", fontFamily: "var(--ff-body)", marginTop: 2 }}>Days {ph.dayStart}–{ph.dayEnd} · {ph.milestone}</div>
                  </div>
                  {phCurrent && <span style={{ fontSize: 10, background: YC, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>NOW</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

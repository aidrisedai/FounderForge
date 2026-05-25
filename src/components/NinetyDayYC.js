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

function Onboarding({ onCreate, creating }) {
  const [startupName, setStartupName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [stage, setStage] = useState("idea");
  const [startingRevenue, setStartingRevenue] = useState("");

  if (creating) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>📋</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 24, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px" }}>
          Michael Seibel is building your 90-day plan…
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, lineHeight: 1.6 }}>
          Mapping every day from launch to $1M. This takes a moment — he&apos;s thinking through your phases, milestones, and first week in detail.
        </p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: YC, animation: `ffBounce .9s ${i * 0.15}s infinite` }} />)}
        </div>
      </div>
    );
  }

  const canSubmit = startupName.trim() && oneLiner.trim().length > 5;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-block", background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 13, padding: "5px 13px", borderRadius: 99, marginBottom: 16, letterSpacing: ".06em" }}>
          Y COMBINATOR · 90 DAYS
        </div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 30, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px", lineHeight: 1.2 }}>
          You just got into YC.<br />You have 90 days to $1M.
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
          Michael Seibel will build you a day-by-day plan and coach you through it. Report in daily — your plan adapts to what&apos;s working and what&apos;s not. You&apos;ll never wonder what to do next.
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

        <label style={labelStyle}>Current monthly revenue (USD)</label>
        <input value={startingRevenue} onChange={(e) => setStartingRevenue(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" inputMode="numeric" style={inputStyle} />

        <button
          onClick={() => canSubmit && onCreate({ startupName, oneLiner, stage, startingRevenue })}
          disabled={!canSubmit}
          className="ff-btn-accent"
          style={{ width: "100%", background: YC_GRAD, color: "#fff", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "var(--ff-body)", opacity: canSubmit ? 1 : 0.45, marginTop: 8 }}
        >
          Start my 90 days →
        </button>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 6 };
const inputStyle = { width: "100%", border: "1px solid var(--edai-border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, fontFamily: "var(--ff-body)", boxSizing: "border-box", outline: "none", marginBottom: 18, background: "var(--edai-surface-2)", color: "var(--edai-text)" };

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

function TodayPanel({ program, day, onToggleTask, onOpenCheckin }) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const phase = (program.phases || []).find((p) => day.dayNumber >= p.dayStart && day.dayNumber <= p.dayEnd);

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

export default function NinetyDayYC() {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState("today"); // "today" | "roadmap"
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pickedDay, setPickedDay] = useState(null);

  useEffect(() => {
    fetch("/api/yc/program")
      .then((r) => r.json())
      .then((d) => { setProgram(d && d.id ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(form) {
    setCreating(true);
    try {
      const res = await fetch("/api/yc/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const p = await res.json();
        setProgram(p);
        setView("today");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleTask(dayNumber, taskIndex, done) {
    // optimistic
    setProgram((prev) => {
      const days = prev.days.map((d) => {
        if (d.dayNumber !== dayNumber) return d;
        const tasks = [...(d.tasks || [])];
        tasks[taskIndex] = { ...tasks[taskIndex], done };
        return { ...d, tasks };
      });
      return { ...prev, days };
    });
    await fetch(`/api/yc/program/${program.id}/day/${dayNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIndex, done }),
    }).catch(() => {});
  }

  async function handleCheckin(report) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/yc/program/${program.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (res.ok) {
        const data = await res.json();
        setProgram(data.program);
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
        Loading your program…
      </div>
    );
  }

  if (!program) {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <Onboarding onCreate={handleCreate} creating={creating} />
      </div>
    );
  }

  const currentDay = program.days.find((d) => d.dayNumber === program.currentDay);
  const latestRevenue = [...program.days].reverse().find((d) => d.report?.revenue != null)?.report?.revenue ?? program.startingRevenue;
  const arr = latestRevenue * 12;
  const progress = Math.min(100, (arr / (program.targetRevenue || 1000000)) * 100);
  const isComplete = program.status === "completed";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: "var(--edai-surface)", borderBottom: "1px solid var(--edai-border)", padding: "14px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: YC_GRAD, color: "#fff", fontWeight: 700, fontSize: 12, padding: "3px 9px", borderRadius: 5 }}>YC · 90 DAYS</span>
            <span style={{ fontFamily: "var(--ff-heading)", fontSize: 17, fontWeight: 700, color: "var(--edai-text)" }}>{program.startupName}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setView("today")} style={tabStyle(view === "today")}>Today</button>
            <button onClick={() => setView("roadmap")} style={tabStyle(view === "roadmap")}>90-Day Roadmap</button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 12, color: "var(--edai-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Day {program.currentDay}/90</div>
          <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
            <div style={{ width: `${(program.currentDay / 90) * 100}%`, height: "100%", background: YC_GRAD, borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--edai-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
            {fmtMoney(arr)} ARR / $1M <span style={{ color: "#FF8534" }}>({progress.toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", paddingTop: 20 }}>
        {isComplete ? (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏁</div>
            <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 26, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 10px" }}>90 days done.</h2>
            <p style={{ color: "var(--edai-muted)", fontSize: 15, marginBottom: 8 }}>You finished the sprint at {fmtMoney(arr)} ARR run-rate.</p>
            <button onClick={() => setView("roadmap")} className="ff-btn-accent" style={{ marginTop: 16, background: YC_GRAD, color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Review your 90 days →</button>
          </div>
        ) : view === "today" && currentDay ? (
          <TodayPanel program={program} day={currentDay} onToggleTask={handleToggleTask} onOpenCheckin={() => setCheckinOpen(true)} />
        ) : (
          <Roadmap program={program} onPickDay={setPickedDay} />
        )}
      </div>

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
